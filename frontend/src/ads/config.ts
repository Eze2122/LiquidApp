// Ad unit IDs. Reemplazar por los IDs reales en producción.
// IDs de prueba oficiales de Google (safe para desarrollo, nunca generan clicks reales).
import { Platform } from "react-native";

const TEST_IDS = {
  banner: {
    android: "ca-app-pub-3940256099942544/6300978111",
    ios: "ca-app-pub-3940256099942544/2934735716",
  },
  interstitial: {
    android: "ca-app-pub-3940256099942544/1033173712",
    ios: "ca-app-pub-3940256099942544/4411468910",
  },
};

export const bannerUnitId =
  Platform.OS === "ios" ? TEST_IDS.banner.ios : TEST_IDS.banner.android;

export const interstitialUnitId =
  Platform.OS === "ios"
    ? TEST_IDS.interstitial.ios
    : TEST_IDS.interstitial.android;

// Si el intersticial se mostró hace menos de este tiempo, se omite.
export const INTERSTITIAL_COOLDOWN_MS = 30_000;
