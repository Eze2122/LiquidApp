// TypeScript fallback for platform-specific AdMob implementations.
// Metro selects interstitial.native.ts on native and interstitial.web.ts on web.
export function preloadInterstitial(): void {}
export async function showBeforeCalculate(): Promise<boolean> {
  return false;
}
