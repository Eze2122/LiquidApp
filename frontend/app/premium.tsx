import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { PurchasesPackage } from "react-native-purchases";

import { buyPremiumPackage, getPremiumPackages, restorePremium, usePremium } from "@/src/premium/state";

export default function PremiumScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const premium = usePremium();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getPremiumPackages()
      .then(setPackages)
      .catch(() => setPackages([]))
      .finally(() => setLoading(false));
  }, []);

  async function subscribe(pkg: PurchasesPackage) {
    setBusy(true);
    try {
      const active = await buyPremiumPackage(pkg);
      if (active) Alert.alert("LiquidApp Premium", "Tu suscripción Premium está activa.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo completar la compra.";
      if (!message.toLowerCase().includes("cancel")) Alert.alert("No se pudo comprar", message);
    } finally {
      setBusy(false);
    }
  }

  async function restore() {
    setBusy(true);
    try {
      const active = await restorePremium();
      Alert.alert("Restaurar compras", active ? "Tu acceso Premium fue restaurado." : "No encontramos una suscripción Premium activa.");
    } catch (error) {
      Alert.alert("No se pudo restaurar", error instanceof Error ? error.message : "Intentá nuevamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={[styles.flex, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="btn-back">
          <Text style={styles.back}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>LiquidApp Premium</Text>
        <View style={{ width: 64 }} />
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.card}>
          <Text style={styles.price} testID="premium-price">USD 2 / mes</Text>
          <Text style={styles.pitch}>Sin anuncios. La misma calculadora que ya usás, sin interrupciones.</Text>
          <View style={styles.featureList}>
            <Feature text="Elimina los banners de la pantalla principal" />
            <Feature text="Elimina los anuncios intersticiales al calcular" />
            <Feature text="Mismo acceso a todas las modalidades de liquidación" />
            <Feature text="Historial local offline sin cambios" />
          </View>

          {premium ? (
            <View style={styles.statusActive} testID="premium-status-active">
              <Text style={styles.statusActiveText}>Premium activo ✓</Text>
            </View>
          ) : loading ? (
            <ActivityIndicator size="large" color="#111" />
          ) : packages.length > 0 ? (
            packages.map((pkg) => (
              <TouchableOpacity
                key={pkg.identifier}
                style={[styles.subscribeBtn, busy && styles.subscribeBtnDisabled]}
                disabled={busy}
                onPress={() => subscribe(pkg)}
                testID="btn-subscribe"
              >
                <Text style={styles.subscribeBtnText}>{busy ? "PROCESANDO…" : "SUSCRIBIRME — " + pkg.product.priceString + (pkg.packageType === "MONTHLY" ? " / mes" : "")}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.notice} testID="premium-notice">
              La compra se habilitará cuando estén configurados el producto mensual en Google Play y la oferta de RevenueCat.
            </Text>
          )}

          <TouchableOpacity style={styles.restoreBtn} onPress={restore} disabled={busy}>
            <Text style={styles.restoreText}>Restaurar compras</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.legal}>
          El precio y la renovación se muestran en Google Play antes de confirmar. Podés cancelar desde la configuración de suscripciones de Google Play.
        </Text>
      </ScrollView>
    </View>
  );
}

function Feature({ text }: { text: string }) {
  return <View style={styles.feature}><Text style={styles.featureCheck}>✓</Text><Text style={styles.featureText}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#f2f4f7" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 8 },
  back: { color: "#111", fontWeight: "bold", fontSize: 16 },
  title: { fontSize: 20, fontWeight: "bold", color: "#222" },
  scroll: { paddingHorizontal: 16, paddingTop: 10 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 2, alignItems: "center" },
  price: { fontSize: 34, fontWeight: "bold", color: "#111", marginBottom: 4 },
  pitch: { textAlign: "center", color: "#555", marginBottom: 20, fontSize: 15 },
  featureList: { alignSelf: "stretch", marginBottom: 20 },
  feature: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 6, gap: 10 },
  featureCheck: { color: "#15803D", fontWeight: "bold", fontSize: 16 },
  featureText: { color: "#222", flex: 1, fontSize: 14 },
  subscribeBtn: { alignSelf: "stretch", padding: 16, borderRadius: 12, backgroundColor: "#111", alignItems: "center", marginTop: 8 },
  subscribeBtnDisabled: { backgroundColor: "#9ca3af" },
  subscribeBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  notice: { marginTop: 12, color: "#6b7280", textAlign: "center", fontSize: 12, fontStyle: "italic" },
  statusActive: { alignSelf: "stretch", padding: 16, borderRadius: 12, backgroundColor: "#15803D", alignItems: "center" },
  statusActiveText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  restoreBtn: { padding: 12, marginTop: 8 },
  restoreText: { color: "#4b5563", textDecorationLine: "underline", fontSize: 13 },
  legal: { marginTop: 16, color: "#9ca3af", textAlign: "center", fontSize: 11 },
});
