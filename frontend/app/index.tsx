import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
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

import { calcularLiquidacion, FuelMode, formatMoney } from "@/src/liquidapp/logic";
import { HistoryItem, saveHistoryItem } from "@/src/liquidapp/storage";

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

  const porcentajeDuenoNum = Number(porcentajeDuenoStr);
  const porcentajeChoferDisplay =
    porcentajeDuenoStr === "" || isNaN(porcentajeDuenoNum) || porcentajeDuenoNum < 0 || porcentajeDuenoNum > 100
      ? "--"
      : String(100 - porcentajeDuenoNum);

  const porcCombustibleDuenoNum = Number(porcCombustibleDuenoStr);
  const porcCombustibleChoferDisplay =
    porcCombustibleDuenoStr === "" || isNaN(porcCombustibleDuenoNum) || porcCombustibleDuenoNum < 0 || porcCombustibleDuenoNum > 100
      ? "--"
      : String(100 - porcCombustibleDuenoNum);

  const tipoLabel = useMemo(
    () => (tipoLiquidacion === "semanal" ? "LIQUIDACIÓN SEMANAL" : "LIQUIDACIÓN POR TURNO"),
    [tipoLiquidacion]
  );

  const calcular = async () => {
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
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>LiquidApp</Text>
        <Text style={styles.subtitle}>Liquidación de turnos</Text>

        {/* Tipo de liquidación */}
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
            style={styles.primaryBtn}
            onPress={calcular}
            testID="btn-calcular"
          >
            <Text style={styles.primaryBtnText}>CALCULAR</Text>
          </TouchableOpacity>

          {error ? (
            <View style={styles.error} testID="error-box">
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </View>

        {result ? (
          <View style={styles.card} testID="result-card">
            <Text style={styles.resultTitle} testID="result-title">
              {result.diferencia > 0
                ? `${result.nombreChofer} debe darle a ${result.nombreDueno}`
                : result.diferencia < 0
                ? `${result.nombreDueno} debe darle a ${result.nombreChofer}`
                : "No se deben dinero"}
            </Text>
            <Text style={styles.amount} testID="result-amount">
              {formatMoney(Math.abs(result.diferencia))}
            </Text>

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
                label="Excedente de efectivo para la plataforma"
                value={formatMoney(result.excedentePlataforma)}
                highlight
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

            <Text style={styles.sectionHeader}>Resultado</Text>
            <Row label="Neto del dueño" value={formatMoney(result.netoDueno)} />
            <Row label="Ganancia real del chofer" value={formatMoney(result.gananciaRealChofer)} />
            <Row
              label={
                result.diferencia > 0
                  ? `${result.nombreChofer} entrega a ${result.nombreDueno}`
                  : result.diferencia < 0
                  ? `${result.nombreDueno} entrega a ${result.nombreChofer}`
                  : "No se deben dinero"
              }
              value={formatMoney(Math.abs(result.diferencia))}
              highlight
            />

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
  flex: { flex: 1, backgroundColor: "#f2f4f7" },
  scroll: {
    paddingHorizontal: 20,
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
  },
  title: {
    textAlign: "center",
    fontSize: 28,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 4,
  },
  subtitle: {
    textAlign: "center",
    color: "#666",
    fontSize: 14,
    marginBottom: 20,
  },
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
  resultTitle: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 6,
  },
  amount: {
    textAlign: "center",
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#111",
  },
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
