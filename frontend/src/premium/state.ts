// Premium state. For now Premium is always false (placeholder) until the
// billing integration (RevenueCat on Google Play / iOS) is wired up.
//
// This file is the single source of truth. When billing is wired, hook it
// here and the rest of the app (ads, banners, premium screen) will react
// automatically.
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PREMIUM_KEY = "liquidapp_is_premium";

let cached = false;
const listeners = new Set<(v: boolean) => void>();

export function isPremium(): boolean {
  return cached;
}

export async function hydratePremium(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(PREMIUM_KEY);
    cached = raw === "true";
    listeners.forEach((l) => l(cached));
  } catch {
    // ignore
  }
}

// Reserved for future billing integration.
export async function _setPremium(value: boolean): Promise<void> {
  cached = value;
  try {
    await AsyncStorage.setItem(PREMIUM_KEY, value ? "true" : "false");
  } catch {
    // ignore
  }
  listeners.forEach((l) => l(value));
}

export function usePremium(): boolean {
  const [v, setV] = useState<boolean>(cached);
  useEffect(() => {
    const l = (nv: boolean) => setV(nv);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return v;
}
