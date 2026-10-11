// Native implementation of the interstitial ad lifecycle.
// Loaded only on iOS/Android. The web counterpart is a no-op.
import {
  AdEventType,
  InterstitialAd,
} from "react-native-google-mobile-ads";

import { INTERSTITIAL_COOLDOWN_MS, interstitialUnitId } from "./config";
import { isPremium } from "../premium/state";

let ad: InterstitialAd | null = null;
let loaded = false;
let loading = false;
let lastShownAt = 0;

function createAndLoad() {
  if (isPremium() || loading || loaded || !interstitialUnitId) return;
  loading = true;
  const next = InterstitialAd.createForAdRequest(interstitialUnitId);
  ad = next;

  next.addAdEventListener(AdEventType.LOADED, () => {
    loading = false;
    loaded = true;
  });
  next.addAdEventListener(AdEventType.ERROR, () => {
    loading = false;
    loaded = false;
    ad = null;
  });
  next.addAdEventListener(AdEventType.OPENED, () => {
    lastShownAt = Date.now();
  });
  next.addAdEventListener(AdEventType.CLOSED, () => {
    loaded = false;
    ad = null;
    createAndLoad();
  });

  try {
    next.load();
  } catch {
    loading = false;
    loaded = false;
    ad = null;
  }
}

export function preloadInterstitial() {
  if (!isPremium()) createAndLoad();
}

// Returns true if the ad was shown (caller can rely on CLOSED to continue),
// false otherwise (caller continues immediately — never block the user).
export async function showBeforeCalculate(): Promise<boolean> {
  if (
    isPremium() ||
    !ad ||
    !loaded ||
    Date.now() - lastShownAt < INTERSTITIAL_COOLDOWN_MS
  ) {
    createAndLoad();
    return false;
  }

  const current = ad;
  ad = null;
  loaded = false;
  try {
    await current.show();
    return true;
  } catch {
    createAndLoad();
    return false;
  }
}
