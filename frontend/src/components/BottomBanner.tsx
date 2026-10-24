// TypeScript fallback for platform-specific banner implementations.
// Metro selects BottomBanner.native.tsx or BottomBanner.web.tsx at runtime.
export function BottomBanner() {
  return null;
}
