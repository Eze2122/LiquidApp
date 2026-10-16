import { StyleSheet, View } from "react-native";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";

import { bannerUnitId } from "../ads/config";
import { isPremium } from "../premium/state";

export function BottomBanner() {
  if (isPremium() || !bannerUnitId) return null;
  return (
    <View style={styles.host} testID="bottom-banner">
      <BannerAd
        unitId={bannerUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={() => {
          // Non-blocking: banner failure is silent.
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
});
