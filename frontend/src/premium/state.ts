import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Purchases, { type CustomerInfo, type PurchasesPackage } from "react-native-purchases";
import { Platform } from "react-native";

const PREMIUM_KEY = "liquidapp_is_premium";
const PREMIUM_ENTITLEMENT = "liquidapp_pro";
let cached = false;
let configured = false;
const listeners = new Set<(value: boolean) => void>();

function publish(value: boolean) {
  cached = value;
  listeners.forEach((listener) => listener(value));
}

function hasPremium(info: CustomerInfo) {
  return Boolean(info.entitlements.active[PREMIUM_ENTITLEMENT]);
}

export function isPremium(): boolean {
  return cached;
}

export async function hydratePremium(): Promise<void> {
  const apiKey = Platform.OS === "android"
    ? process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY
    : process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;

  // Never trust the locally stored flag as proof of a paid subscription.
  // If RevenueCat is not configured, keep Premium disabled rather than
  // accidentally granting an expired or manually altered entitlement.
  if (!apiKey) {
    publish(false);
    try { await AsyncStorage.setItem(PREMIUM_KEY, "false"); } catch {}
    return;
  }

  try {
    if (!configured) {
      Purchases.configure({ apiKey });
      configured = true;
      Purchases.addCustomerInfoUpdateListener((info) => {
        const active = hasPremium(info);
        publish(active);
        void AsyncStorage.setItem(PREMIUM_KEY, active ? "true" : "false").catch(() => {});
      });
    }
    const info = await Purchases.getCustomerInfo();
    const active = hasPremium(info);
    publish(active);
    await AsyncStorage.setItem(PREMIUM_KEY, active ? "true" : "false");
  } catch {
    // A billing/network outage must never block the app from opening.
    // Do not grant Premium from cached local state on an unverified response.
    publish(false);
  }
}

export async function getPremiumPackages(): Promise<PurchasesPackage[]> {
  if (!configured) throw new Error("Falta configurar la clave pública de RevenueCat.");
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages ?? [];
}

export async function buyPremiumPackage(pkg: PurchasesPackage): Promise<boolean> {
  if (!configured) throw new Error("Falta configurar la clave pública de RevenueCat.");
  const result = await Purchases.purchasePackage(pkg);
  const active = hasPremium(result.customerInfo);
  publish(active);
  await AsyncStorage.setItem(PREMIUM_KEY, active ? "true" : "false");
  return active;
}

export async function restorePremium(): Promise<boolean> {
  if (!configured) throw new Error("Falta configurar la clave pública de RevenueCat.");
  const info = await Purchases.restorePurchases();
  const active = hasPremium(info);
  publish(active);
  await AsyncStorage.setItem(PREMIUM_KEY, active ? "true" : "false");
  return active;
}

export function usePremium(): boolean {
  const [value, setValue] = useState<boolean>(cached);
  useEffect(() => {
    const listener = (next: boolean) => setValue(next);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);
  return value;
}
