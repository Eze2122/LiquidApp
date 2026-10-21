import { useFocusEffect, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { preloadInterstitial, showBeforeCalculate } from "@/src/ads/interstitial";
import { BottomBanner } from "@/src/components/BottomBanner";
import { calcularLiquidacion, FuelMode, formatMoney } from "@/src/liquidapp/logic";
import { HistoryItem, saveHistoryItem } from "@/src/liquidapp/storage";
import { usePremium } from "@/src/premium/state";
import { ticketTotal } from "@/src/liquidapp/tickets";

type TipoLiquidacion = "turno" | "semanal";

const FUEL_OPTIONS: { value: FuelMode; label: string }[] = [
  { value: "chofer", label: "Chofer 100%" },
  { value: "dueno", label: "Dueño 100%" },
  { value: "porcentaje", label: "Según porcentaje de la recaudación" },
  { value: "personalizado", label: "Personalizado" },
];

export default function CalculatorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const premium = usePremium();

  const [tipoLiquidacion, setTipoLiquidacion] = useState<TipoLiquidacion>("turno");
  const [porcentajeDuenoStr, setPorcentajeDuenoStr] = useState("50");
  const [nombreChofer, setNombreChofer] = useState("");
  const [nombreDueno, setNombreDueno] = useState("");
  const [totalStr, setTotalStr] = useState("");
  const [cashStr, setCashStr] = useState("");
  const [gncStr, setGncStr] = useState("");
  const [gasolinaStr, setGasolinaStr] = useState("");
  const [fuelMode, setFuelMode] = useState<FuelMode>("chofer");
  const [porcCombustibleDuenoStr, setPorcCombustibleDuenoStr] = useState("50");

  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<HistoryItem | null>(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    preloadInterstitial();
  }, []);

  useFocusEffect(
    useMemo(() => () => {
      let active = true;
      void Promise.all([ticketTotal("gnc"), ticketTotal("nafta")]).then(([gnc, nafta]) => {
        if (active && gnc > 0) setGncStr(String(gnc));
        if (active && nafta > 0) setGasolinaStr(String(nafta));
      });
      return () => { active = false; };
    }, [])
  );

  const porcentajeDuenoNum = Number(porcentajeDuenoStr);
  const porcentajeChoferDisplay =
    porcentajeDuenoStr === "" ||
    isNaN(porcentajeDuenoNum) ||
    porcentajeDuenoNum < 0 ||
    porcentajeDuenoNum > 100
      ? "--"
      : String(100 - porcentajeDuenoNum);

  const porcCombustibleDuenoNum = Number(porcCombustibleDuenoStr);
  const porcCombustibleChoferDisplay =
    porcCombustibleDuenoStr === "" ||
    isNaN(porcCombustibleDuenoNum) ||
    porcCombustibleDuenoNum < 0 ||
    porcCombustibleDuenoNum > 100
      ? "--"
      : String(100 - porcCombustibleDuenoNum);

  const tipoLabel = useMemo(
    () => (tipoLiquidacion === "semanal" ? "LIQUIDACIÓN SEMANAL" : "LIQUIDACIÓN POR TURNO"),
    [tipoLiquidacion]
  );

  const calcular = async () => {
    if (calculating) return;
    setError(null);
    setResult(null);

    const total = Number(totalStr);
    const cash = Number(cashStr);
    const gnc = Number(gncStr) || 0;
    const gasolina = Number(gasolinaStr) || 0;

    if (!total || total <= 0) {
      setError("Ingresa la recaudación total.");
      return;
    }
    if (isNaN(cash) || cash < 0) {
      setError("El efectivo no puede ser negativo.");
      return;
    }
    if (gnc < 0 || gasolina < 0) {
      setError("El combustible no puede ser negativo.");
      return;
    }
    if (isNaN(porcentajeDuenoNum) || porcentajeDuenoNum < 0 || porcentajeDuenoNum > 100) {
      setError("El porcentaje del dueño debe estar entre 0 y 100.");
      return;
    }
    if (fuelMode === "personalizado") {
      if (
        porcCombustibleDuenoStr === "" ||
        isNaN(porcCombustibleDuenoNum) ||
        porcCombustibleDuenoNum < 0 ||
        porcCombustibleDuenoNum > 100
      ) {
        setError("El % de combustible a cargo del dueño debe estar entre 0 y 100.");
        return;
      }
    }

    setCalculating(true);

    // Try to show interstitial ad before the result. Never block the calculation.
    try {
      await showBeforeCalculate();
    } catch {
      // Silent: ads must never break the flow.
    }

    const nombreChoferFinal = nombreChofer.trim() || "El chofer";
    const nombreDuenoFinal = nombreDueno.trim() || "el dueño";

    const liq = calcularLiquidacion({
      total,
      cash,
      gnc,
      gasolina,
      porcentajeDueno: porcentajeDuenoNum,
      fuelMode,
      porcCombustibleDueno: porcCombustibleDuenoNum,
    });

    const item: HistoryItem = {
      id: String(Date.now()),
      fecha: new Date().toLocaleString("es-AR"),
      tipoLiquidacion,
      nombreChofer: nombreChoferFinal,
      nombreDueno: nombreDuenoFinal,
      ...liq,
    };

    await saveHistoryItem(item);
    setResult(item);
    setCalculating(false);
  };

  const reiniciar = () => {
    setNombreChofer("");
    setNombreDueno("");
    setTotalStr("");
    setCashStr("");
    setGncStr("");
    setGasolinaStr("");
    setError(null);
    setResult(null);
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 12, paddingBottom: 24 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topBar}>
            <View style={{ width: 70 }} />
            <View style={styles.titleBlock}>
              <Text style={styles.title}>LiquidApp</Text>
              <Text style={styles.subtitle}>Liquidación de turnos</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/premium")}
              style={styles.premiumPill}
              testID="btn-premium"
            >
              <Text style={styles.premiumPillText}>
                {premium ? "Premium ✓" : "Premium"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.utilityBtn} onPress={() => router.push("/expenses")}><Text style={styles.utilityBtnText}>CONTROL DE GASTOS</Text></TouchableOpacity>
          <Text style={styles.labelTop}>Tipo de liquidación</Text>
          <View style={styles.segment} testID="segment-tipo">
            {(["turno", "semanal"] as TipoLiquidacion[]).map((t) => {
              const active = tipoLiquidacion === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => setTipoLiquidacion(t)}
                  style={[styles.segmentItem, active && styles.segmentItemActive]}
                  testID={`segment-tipo-${t}`}
                >
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                    {t === "turno" ? "Liquidación por turno" : "Liquidación semanal"}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.labelTop}>Porcentaje del dueño</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={porcentajeDuenoStr}
            onChangeText={setPorcentajeDuenoStr}
            placeholder="Ej: 55"
            placeholderTextColor="#999"
            testID="input-porcentaje-dueno"
          />
          <Text style={styles.porcChofer} testID="label-porcentaje-chofer">
            Porcentaje del chofer: {porcentajeChoferDisplay}%
          </Text>

          <View style={styles.card}>
            <Text style={styles.label}>Nombre del chofer</Text>
            <TextInput
              style={styles.input}
              value={nombreChofer}
              onChangeText={setNombreChofer}
              placeholder="Ej: Diego"
              placeholderTextColor="#999"
              testID="input-nombre-chofer"
            />

            <Text style={styles.label}>Nombre del dueño</Text>
            <TextInput
              style={styles.input}
              value={nombreDueno}
              onChangeText={setNombreDueno}
              placeholder="Ej: Carlos"
              placeholderTextColor="#999"
              testID="input-nombre-dueno"
            />

            <Text style={styles.label}>Recaudación total</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={totalStr}
              onChangeText={setTotalStr}
              placeholder="150000"
              placeholderTextColor="#999"
              testID="input-total"
            />

            <Text style={styles.label}>Efectivo recibido</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={cashStr}
              onChangeText={setCashStr}
              placeholder="120000"
              placeholderTextColor="#999"
              testID="input-cash"
            />

            <Text style={styles.label}>GNC</Text>
            <TouchableOpacity style={styles.ticketBtn} onPress={() => router.push({ pathname: "/tickets", params: { fuel: "gnc" } })}><Text style={styles.ticketBtnText}>SUMAR TICKETS DE GNC</Text></TouchableOpacity>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={gncStr}
              onChangeText={setGncStr}
              placeholder="10000"
              placeholderTextColor="#999"
              testID="input-gnc"
            />

            <Text style={styles.label}>Nafta</Text>
            <TouchableOpacity style={styles.ticketBtn} onPress={() => router.push({ pathname: "/tickets", params: { fuel: "nafta" } })}><Text style={styles.ticketBtnText}>SUMAR TICKETS DE NAFTA</Text></TouchableOpacity>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={gasolinaStr}
              onChangeText={setGasolinaStr}
              placeholder="0"
              placeholderTextColor="#999"
              testID="input-gasolina"
            />

            <Text style={styles.label}>¿Quién paga el combustible?</Text>
            <View style={styles.fuelOptions} testID="fuel-options">
              {FUEL_OPTIONS.map((opt) => {
                const active = fuelMode === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setFuelMode(opt.value)}
                    style={[styles.fuelOption, active && styles.fuelOptionActive]}
                    testID={`fuel-option-${opt.value}`}
                  >
                    <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
                      {active ? <View style={styles.radioInner} /> : null}
                    </View>
                    <Text style={[styles.fuelOptionText, active && styles.fuelOptionTextActive]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {fuelMode === "personalizado" ? (
              <View>
                <Text style={styles.label}>% de combustible a cargo del dueño</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={porcCombustibleDuenoStr}
                  onChangeText={setPorcCombustibleDuenoStr}
                  placeholder="Ej: 20"
                  placeholderTextColor="#999"
                  testID="input-porc-combustible-dueno"
                />
                <Text style={styles.porcChoferCombustible} testID="label-porc-combustible-chofer">
                  % combustible chofer: {porcCombustibleChoferDisplay}%
                </Text>
              </View>
            ) : null}

            <Text style={styles.note}>
              El porcentaje de recaudación y el porcentaje de combustible son independientes.
            </Text>

            <TouchableOpacity
              style={[styles.primaryBtn, calculating && styles.primaryBtnDisabled]}
              onPress={calcular}
              disabled={calculating}
              testID="btn-calcular"
            >
              <Text style={styles.primaryBtnText}>
                {calculating ? "CALCULANDO…" : "CALCULAR"}
              </Text>
            </TouchableOpacity>

            {error ? (
              <View style={styles.error} testID="error-box">
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </View>

          {result ? (
            <View style={styles.card} testID="result-card">
              {/* Settlement spotlight */}
              <View style={styles.spotlight}>
                <Text style={styles.spotlightKicker}>LIQUIDACIÓN FINAL</Text>
                <Text style={styles.spotlightTitle} testID="result-title">
                  {result.diferencia > 0
                    ? `${result.nombreChofer} debe darle a ${result.nombreDueno}`
                    : result.diferencia < 0
                    ? `${result.nombreDueno} debe darle a ${result.nombreChofer}`
                    : "No se deben dinero"}
                </Text>
                <Text style={styles.spotlightAmount} testID="result-amount">
                  {formatMoney(Math.abs(result.diferencia))}
                </Text>

                {result.tarjeta > 0 ? (
                  <View style={styles.spotlightLine} testID="line-tarjeta-ya-recibida">
                    <Text style={styles.spotlightLineLabel}>
                      Dinero ya recibido por el dueño (tarjeta)
                    </Text>
                    <Text style={styles.spotlightLineValue}>
                      {formatMoney(result.tarjeta)}
                    </Text>
                  </View>
                ) : null}

                {result.excedentePlataforma > 0 ? (
                  <View style={styles.spotlightLineWarn} testID="line-excedente">
                    <Text style={styles.spotlightLineLabelWarn}>
                      Excedente en efectivo
                    </Text>
                    <Text style={styles.spotlightLineValueWarn}>
                      {formatMoney(result.excedentePlataforma)}
                    </Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.sectionHeader}>{tipoLabel}</Text>
              <Row label="Fecha" value={result.fecha} />
              <Row label="Chofer" value={result.nombreChofer} />
              <Row label="Dueño" value={result.nombreDueno} />

              <Text style={styles.sectionHeader}>Recaudación</Text>
              <Row label="Recaudación total" value={formatMoney(result.total)} />
              <Row label="Efectivo recibido" value={formatMoney(result.cash)} />
              <Row label="Tarjeta en cuenta del dueño" value={formatMoney(result.tarjeta)} />
              {result.excedentePlataforma > 0 ? (
                <Row
                  label="Excedente en efectivo"
                  value={formatMoney(result.excedentePlataforma)}
                />
              ) : null}

              <Text style={styles.sectionHeader}>Porcentajes</Text>
              <Row label="Porcentaje dueño" value={`${result.porcentajeDueno}%`} />
              <Row label="Porcentaje chofer" value={`${result.porcentajeChofer}%`} />
              <Row label="Parte bruta dueño" value={formatMoney(result.parteDueno)} />
              <Row label="Parte bruta chofer" value={formatMoney(result.parteChofer)} />

              <Text style={styles.sectionHeader}>Combustible</Text>
              <Row label="GNC" value={formatMoney(result.gnc)} />
              <Row label="Nafta" value={formatMoney(result.gasolina)} />
              <Row label="Combustible total" value={formatMoney(result.combustible)} />
              <Row label="Modalidad" value={fuelModeLabel(result.fuelMode)} />
              <Row label="% combustible dueño" value={`${result.porcCombustibleDueno}%`} />
              <Row label="% combustible chofer" value={`${result.porcCombustibleChofer}%`} />
              <Row label="Combustible a cargo del dueño" value={formatMoney(result.combustibleDueno)} />
              <Row label="Combustible a cargo del chofer" value={formatMoney(result.combustibleChofer)} />

              <Text style={styles.sectionHeader}>Netos</Text>
              <Row label="Neto del dueño" value={formatMoney(result.netoDueno)} />
              <Row label="Ganancia real del chofer" value={formatMoney(result.gananciaRealChofer)} />

              <TouchableOpacity style={styles.secondaryBtn} onPress={reiniciar} testID="btn-nuevo">
                <Text style={styles.secondaryBtnText}>NUEVO TURNO</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => router.push("/history")}
                testID="btn-historial"
              >
                <Text style={styles.secondaryBtnText}>HISTORIAL</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.secondaryBtn, styles.secondaryBtnOuter]}
              onPress={() => router.push("/history")}
              testID="btn-historial-main"
            >
              <Text style={styles.secondaryBtnText}>HISTORIAL</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <View style={{ paddingBottom: insets.bottom }}>
        <BottomBanner />
      </View>
    </View>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.detail}>
      <Text style={[styles.detailLabel, highlight && styles.detailLabelStrong]}>{label}</Text>
      <Text style={[styles.detailValue, highlight && styles.detailValueStrong]}>{value}</Text>
    </View>
  );
}

function fuelModeLabel(mode: FuelMode) {
  switch (mode) {
    case "chofer":
      return "Chofer 100%";
    case "dueno":
      return "Dueño 100%";
    case "porcentaje":
      return "Según porcentaje de la recaudación";
    case "personalizado":
      return "Personalizado";
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f2f4f7" },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  titleBlock: { alignItems: "center", flex: 1 },
  title: {
    textAlign: "center",
    fontSize: 28,
    fontWeight: "bold",
    color: "#222",
  },
  subtitle: {
    textAlign: "center",
    color: "#666",
    fontSize: 13,
  },
  premiumPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#111",
    minWidth: 70,
    alignItems: "center",
  },
  premiumPillText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  utilityBtn: { backgroundColor: "#d9fbe8", borderWidth: 1, borderColor: "#82d8a5", padding: 12, borderRadius: 10, alignItems: "center", marginBottom: 8 },
  utilityBtnText: { color: "#14532d", fontWeight: "bold", fontSize: 14 },
  ticketBtn: { backgroundColor: "#e8eaf0", padding: 10, borderRadius: 8, alignItems: "center", marginBottom: 8 },
  ticketBtnText: { color: "#222", fontSize: 12, fontWeight: "bold" },
  labelTop: {
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 7,
    color: "#222",
    fontSize: 15,
  },
  label: {
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 7,
    color: "#222",
    fontSize: 15,
  },
  input: {
    width: "100%",
    padding: 14,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    fontSize: 18,
    backgroundColor: "#fff",
    color: "#222",
  },
  segment: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    overflow: "hidden",
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentItemActive: { backgroundColor: "#111" },
  segmentText: { color: "#222", fontWeight: "600", fontSize: 14 },
  segmentTextActive: { color: "#fff" },
  porcChofer: {
    marginTop: 10,
    marginBottom: 10,
    fontWeight: "bold",
    color: "#222",
  },
  porcChoferCombustible: {
    marginTop: 8,
    fontWeight: "bold",
    color: "#222",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  fuelOptions: { marginTop: 4 },
  fuelOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginTop: 8,
    backgroundColor: "#fff",
  },
  fuelOptionActive: {
    borderColor: "#111",
    backgroundColor: "#f6f7f9",
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#999",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  radioOuterActive: { borderColor: "#111" },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#111",
  },
  fuelOptionText: { color: "#222", fontSize: 15 },
  fuelOptionTextActive: { fontWeight: "bold" },
  note: {
    marginTop: 12,
    color: "#555",
    fontSize: 13,
    fontStyle: "italic",
  },
  primaryBtn: {
    width: "100%",
    padding: 16,
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: "#111",
    alignItems: "center",
  },
  primaryBtnDisabled: { backgroundColor: "#555" },
  primaryBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  secondaryBtn: {
    width: "100%",
    padding: 16,
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: "#ddd",
    alignItems: "center",
  },
  secondaryBtnOuter: { marginBottom: 20 },
  secondaryBtnText: { color: "#222", fontSize: 18, fontWeight: "bold" },
  error: {
    marginTop: 15,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#fee4e2",
  },
  errorText: { color: "#b42318", fontWeight: "bold" },
  spotlight: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  spotlightKicker: {
    color: "#9ca3af",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
    textAlign: "center",
    marginBottom: 4,
  },
  spotlightTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  spotlightAmount: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 10,
  },
  spotlightLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1f2937",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    gap: 10,
  },
  spotlightLineLabel: { color: "#9ca3af", flexShrink: 1, fontSize: 12 },
  spotlightLineValue: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  spotlightLineWarn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#78350f",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    gap: 10,
  },
  spotlightLineLabelWarn: { color: "#fde68a", flexShrink: 1, fontSize: 12 },
  spotlightLineValueWarn: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 4,
  },
  detail: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    gap: 12,
  },
  detailLabel: { color: "#444", flexShrink: 1, fontSize: 14 },
  detailValue: { color: "#222", fontWeight: "bold", textAlign: "right", fontSize: 14 },
  detailLabelStrong: { color: "#111" },
  detailValueStrong: { color: "#b42318" },
});
