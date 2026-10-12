import { Platform } from "react-native";

const PRODUCTION_IDS = {
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
Platform.OS === "ios"
? PRODUCTION_IDS.banner.ios
: PRODUCTION_IDS.banner.android;

export const interstitialUnitId =
Platform.OS === "ios"
? PRODUCTION_IDS.interstitial.ios
: PRODUCTION_IDS.interstitial.android;

export const INTERSTITIAL_COOLDOWN_MS = 30_000;
