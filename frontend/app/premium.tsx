import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePremium } from "@/src/premium/state";

export default function PremiumScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const premium = usePremium();

  return (
    <View style={[styles.flex, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="btn-back">
          <Text style={styles.back}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>LiquidApp Premium</Text>
        <View style={{ width: 64 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
      >
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
          ) : (
            <>
              <TouchableOpacity
                style={[styles.subscribeBtn, styles.subscribeBtnDisabled]}
                disabled
                testID="btn-subscribe-disabled"
              >
                <Text style={styles.subscribeBtnText}>DISPONIBLE PRÓXIMAMENTE</Text>
              </TouchableOpacity>

              <Text style={styles.notice} testID="premium-notice">
                La suscripción se habilitará cuando esté publicada en Google Play.
                Mientras tanto podés usar LiquidApp gratis con anuncios.
              </Text>
            </>
          )}
        </View>

        <Text style={styles.legal}>
          El precio final puede variar según el país y los impuestos aplicables de la tienda.
          La suscripción se renueva mensualmente hasta que se cancele desde la tienda.
        </Text>
      </ScrollView>
    </View>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <View style={styles.feature}>
      <Text style={styles.featureCheck}>✓</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#f2f4f7" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  back: { color: "#111", fontWeight: "bold", fontSize: 16 },
  title: { fontSize: 20, fontWeight: "bold", color: "#222" },
  scroll: { paddingHorizontal: 16, paddingTop: 10 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
    alignItems: "center",
  },
  price: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 4,
  },
  pitch: {
    textAlign: "center",
    color: "#555",
    marginBottom: 20,
    fontSize: 15,
  },
  featureList: { alignSelf: "stretch", marginBottom: 20 },
  feature: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 6,
    gap: 10,
  },
  featureCheck: { color: "#15803D", fontWeight: "bold", fontSize: 16 },
  featureText: { color: "#222", flex: 1, fontSize: 14 },
  subscribeBtn: {
    alignSelf: "stretch",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#111",
    alignItems: "center",
  },
  subscribeBtnDisabled: {
    backgroundColor: "#9ca3af",
  },
  subscribeBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  notice: {
    marginTop: 12,
    color: "#6b7280",
    textAlign: "center",
    fontSize: 12,
    fontStyle: "italic",
  },
  statusActive: {
    alignSelf: "stretch",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#15803D",
    alignItems: "center",
  },
  statusActiveText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  legal: {
    marginTop: 16,
    color: "#9ca3af",
    textAlign: "center",
    fontSize: 11,
  },
});
