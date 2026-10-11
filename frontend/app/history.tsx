import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { formatMoney } from "@/src/liquidapp/logic";
import {
  HistoryItem,
  clearHistory,
  deleteHistoryItem,
  getHistory,
} from "@/src/liquidapp/storage";

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const list = await getHistory();
    setItems(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const onCopy = async (item: HistoryItem, index: number) => {
    const txt = buildTextDump(item, items.length - index);
    await Clipboard.setStringAsync(txt);
    setToast("Copiado ✓");
    setTimeout(() => setToast(null), 1500);
  };

  const onDelete = async (id: string) => {
    await deleteHistoryItem(id);
    load();
  };

  const onClearAll = async () => {
    await clearHistory();
    setConfirmClear(false);
    load();
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="btn-back">
          <Text style={styles.back}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Historial</Text>
        <View style={{ width: 64 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 24 },
        ]}
      >
        {loading ? (
          <Text style={styles.empty}>Cargando…</Text>
        ) : items.length === 0 ? (
          <Text style={styles.empty} testID="empty-history">
            Todavía no hay liquidaciones guardadas.
          </Text>
        ) : (
          items.map((item, index) => (
            <View key={item.id} style={styles.card} testID={`history-item-${index}`}>
              <Text style={styles.cardIndex}>
                LIQUIDACIÓN {items.length - index}
              </Text>
              <Text style={styles.cardType}>
                {item.tipoLiquidacion === "semanal"
                  ? "LIQUIDACIÓN SEMANAL"
                  : "LIQUIDACIÓN POR TURNO"}
              </Text>
              <Text style={styles.cardDate}>{item.fecha}</Text>

              <Section title="General">
                <Row label="Chofer" value={item.nombreChofer} />
                <Row label="Dueño" value={item.nombreDueno} />
              </Section>

              <Section title="Recaudación">
                <Row label="Recaudación total" value={formatMoney(item.total)} />
                <Row label="Efectivo" value={formatMoney(item.cash)} />
                <Row
                  label="Tarjeta en cuenta del dueño"
                  value={formatMoney(item.tarjeta ?? 0)}
                />
                {(item.excedentePlataforma ?? 0) > 0 ? (
                  <Row
                    label="Excedente en efectivo"
                    value={formatMoney(item.excedentePlataforma)}
                    highlight
                  />
                ) : null}
              </Section>

              <Section title="Porcentajes">
                <Row
                  label="Porcentaje dueño"
                  value={`${item.porcentajeDueno ?? 50}%`}
                />
                <Row
                  label="Porcentaje chofer"
                  value={`${item.porcentajeChofer ?? 50}%`}
                />
                <Row
                  label="Parte bruta dueño"
                  value={formatMoney(item.parteDueno ?? 0)}
                />
                <Row
                  label="Parte bruta chofer"
                  value={formatMoney(item.parteChofer ?? 0)}
                />
              </Section>

              <Section title="Combustible">
                <Row label="GNC" value={formatMoney(item.gnc)} />
                <Row label="Nafta" value={formatMoney(item.gasolina)} />
                <Row
                  label="Combustible total"
                  value={formatMoney(item.combustible)}
                />
                {item.fuelMode ? (
                  <>
                    <Row label="Modalidad" value={labelFuelMode(item.fuelMode)} />
                    <Row
                      label="% combustible dueño"
                      value={`${item.porcCombustibleDueno ?? 0}%`}
                    />
                    <Row
                      label="% combustible chofer"
                      value={`${item.porcCombustibleChofer ?? 0}%`}
                    />
                    <Row
                      label="Combustible dueño"
                      value={formatMoney(item.combustibleDueno ?? 0)}
                    />
                    <Row
                      label="Combustible chofer"
                      value={formatMoney(item.combustibleChofer ?? 0)}
                    />
                  </>
                ) : null}
              </Section>

              <Section title="Resultado">
                {item.netoDueno !== undefined ? (
                  <>
                    <Row
                      label="Neto del dueño"
                      value={formatMoney(item.netoDueno)}
                    />
                    <Row
                      label="Ganancia real del chofer"
                      value={formatMoney(item.gananciaRealChofer ?? 0)}
                    />
                  </>
                ) : null}
                {(item.tarjeta ?? 0) > 0 ? (
                  <Row
                    label="Dinero ya recibido por el dueño (tarjeta)"
                    value={formatMoney(item.tarjeta)}
                    highlight
                  />
                ) : null}
                <Row
                  label={
                    item.diferencia > 0
                      ? `Saldo pendiente — ${item.nombreChofer} entrega a ${item.nombreDueno}`
                      : item.diferencia < 0
                      ? `Saldo pendiente — ${item.nombreDueno} entrega a ${item.nombreChofer}`
                      : "No se deben dinero"
                  }
                  value={formatMoney(Math.abs(item.diferencia ?? 0))}
                  highlight
                />
              </Section>

              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={[styles.btn, styles.btnDark]}
                  onPress={() => onCopy(item, index)}
                  testID={`btn-copy-${index}`}
                >
                  <Text style={styles.btnDarkText}>COPIAR</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.btnDelete]}
                  onPress={() => onDelete(item.id)}
                  testID={`btn-delete-${index}`}
                >
                  <Text style={styles.btnDeleteText}>ELIMINAR</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {items.length > 0 ? (
          <TouchableOpacity
            style={styles.clearAll}
            onPress={() => setConfirmClear(true)}
            testID="btn-clear-all"
          >
            <Text style={styles.clearAllText}>BORRAR HISTORIAL</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => router.back()}
          testID="btn-close-history"
        >
          <Text style={styles.closeBtnText}>CERRAR</Text>
        </TouchableOpacity>
      </ScrollView>

      {toast ? (
        <View
          style={[styles.toast, { bottom: insets.bottom + 24 }]}
          testID="toast"
          pointerEvents="none"
        >
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}

      <Modal
        visible={confirmClear}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmClear(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>¿Borrar todo el historial?</Text>
            <Text style={styles.modalText}>
              Esta acción no se puede deshacer.
            </Text>
            <View style={styles.modalBtnRow}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setConfirmClear(false)}
                testID="btn-cancel-clear"
              >
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={onClearAll}
                testID="btn-confirm-clear"
              >
                <Text style={styles.modalBtnConfirmText}>Borrar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, highlight && styles.rowLabelHighlight]}>
        {label}
      </Text>
      <Text style={[styles.rowValue, highlight && styles.rowValueHighlight]}>
        {value}
      </Text>
    </View>
  );
}

function labelFuelMode(mode: string): string {
  switch (mode) {
    case "chofer":
      return "Chofer 100%";
    case "dueno":
      return "Dueño 100%";
    case "porcentaje":
      return "Según porcentaje de la recaudación";
    case "personalizado":
      return "Personalizado";
    default:
      return mode;
  }
}

function buildTextDump(item: HistoryItem, numero: number): string {
  const tipo =
    item.tipoLiquidacion === "semanal"
      ? "LIQUIDACIÓN SEMANAL"
      : "LIQUIDACIÓN POR TURNO";
  const lines: string[] = [];
  lines.push(`LIQUIDACIÓN ${numero}`);
  lines.push(tipo);
  lines.push(item.fecha);
  lines.push("");
  lines.push(`Chofer: ${item.nombreChofer}`);
  lines.push(`Dueño: ${item.nombreDueno}`);
  lines.push(`Porcentaje dueño: ${item.porcentajeDueno ?? 50}%`);
  lines.push(`Porcentaje chofer: ${item.porcentajeChofer ?? 50}%`);
  lines.push("");
  lines.push(`Recaudación: ${formatMoney(item.total)}`);
  lines.push(`Efectivo: ${formatMoney(item.cash)}`);
  lines.push(`Tarjeta en cuenta del dueño: ${formatMoney(item.tarjeta ?? 0)}`);
  if ((item.excedentePlataforma ?? 0) > 0) {
    lines.push(
      `Excedente de plataforma: ${formatMoney(item.excedentePlataforma)}`
    );
  }
  lines.push(`GNC: ${formatMoney(item.gnc)}`);
  lines.push(`Nafta: ${formatMoney(item.gasolina)}`);
  lines.push(`Combustible total: ${formatMoney(item.combustible)}`);
  if (item.fuelMode) {
    lines.push(`Modalidad combustible: ${labelFuelMode(item.fuelMode)}`);
    lines.push(`% combustible dueño: ${item.porcCombustibleDueno ?? 0}%`);
    lines.push(`% combustible chofer: ${item.porcCombustibleChofer ?? 0}%`);
    lines.push(`Combustible dueño: ${formatMoney(item.combustibleDueno ?? 0)}`);
    lines.push(`Combustible chofer: ${formatMoney(item.combustibleChofer ?? 0)}`);
  }
  lines.push("");
  lines.push(`Parte bruta dueño: ${formatMoney(item.parteDueno ?? 0)}`);
  lines.push(`Parte bruta chofer: ${formatMoney(item.parteChofer ?? 0)}`);
  if (item.netoDueno !== undefined) {
    lines.push(`Neto del dueño: ${formatMoney(item.netoDueno)}`);
    lines.push(
      `Ganancia real del chofer: ${formatMoney(item.gananciaRealChofer ?? 0)}`
    );
  }
  lines.push("");
  if (item.diferencia > 0) {
    lines.push(
      `${item.nombreChofer} debe darle a ${item.nombreDueno}: ${formatMoney(item.diferencia)}`
    );
  } else if (item.diferencia < 0) {
    lines.push(
      `${item.nombreDueno} debe darle a ${item.nombreChofer}: ${formatMoney(
        Math.abs(item.diferencia)
      )}`
    );
  } else {
    lines.push("No se deben dinero");
  }
  return lines.join("\n");
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
  empty: {
    textAlign: "center",
    color: "#666",
    marginTop: 40,
    fontSize: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardIndex: { fontWeight: "bold", color: "#222", fontSize: 16 },
  cardType: { color: "#555", fontWeight: "bold", marginTop: 2 },
  cardDate: { color: "#666", marginTop: 2, fontSize: 13 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    gap: 10,
  },
  rowLabel: { color: "#444", flexShrink: 1, fontSize: 13 },
  rowValue: { color: "#222", fontWeight: "bold", textAlign: "right", fontSize: 13 },
  rowLabelHighlight: { color: "#111" },
  rowValueHighlight: { color: "#b42318" },
  btnRow: { flexDirection: "row", marginTop: 12, gap: 10 },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnDark: { backgroundColor: "#222" },
  btnDarkText: { color: "#fff", fontWeight: "bold" },
  btnDelete: { backgroundColor: "#fee4e2" },
  btnDeleteText: { color: "#b42318", fontWeight: "bold" },
  clearAll: {
    marginTop: 10,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#b00020",
    alignItems: "center",
  },
  clearAllText: { color: "#fff", fontWeight: "bold" },
  closeBtn: {
    marginTop: 10,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#ddd",
    alignItems: "center",
  },
  closeBtnText: { color: "#222", fontWeight: "bold" },
  toast: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: "#1F2937",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  toastText: { color: "#fff", fontWeight: "bold" },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#222" },
  modalText: { color: "#444", marginTop: 8 },
  modalBtnRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  modalBtnCancel: { backgroundColor: "#ddd" },
  modalBtnCancelText: { color: "#222", fontWeight: "bold" },
  modalBtnConfirm: { backgroundColor: "#b00020" },
  modalBtnConfirmText: { color: "#fff", fontWeight: "bold" },
});
