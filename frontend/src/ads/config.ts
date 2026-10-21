// AdMob production IDs for Android. Keep iOS on Google's test IDs until iOS is configured.
import { Platform } from "react-native";

const AD_UNIT_IDS = {
  banner: {
    android: "ca-app-pub-7902708143841298/3121247035",
    ios: "ca-app-pub-3940256099942544/2934735716",
  },
  interstitial: {
    android: "ca-app-pub-7902708143841298/9285830554",
    ios: "ca-app-pub-3940256099942544/4411468910",
  },
};

export const bannerUnitId =
  Platform.OS === "ios" ? AD_UNIT_IDS.banner.ios : AD_UNIT_IDS.banner.android;

export const interstitialUnitId =
  Platform.OS === "ios"
    ? AD_UNIT_IDS.interstitial.ios
    : AD_UNIT_IDS.interstitial.android;

// Si el intersticial se mostró hace menos de este tiempo, se omite.
export const INTERSTITIAL_COOLDOWN_MS = 30_000;
