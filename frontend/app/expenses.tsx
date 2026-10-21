import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import {
  addExpense,
  deleteExpense,
  EXPENSE_CATEGORIES_BY_PERSON,
  getExpenses,
  isExpensesEnabled,
  setExpensesEnabled,
  type ExpenseItem,
  type ExpensePerson,
} from "@/src/liquidapp/expenses";

const money = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

export default function ExpensesScreen() {
  const router = useRouter();
  const [enabled, setEnabled] = useState(true);
  const [items, setItems] = useState<ExpenseItem[]>([]);
  const [person, setPerson] = useState<ExpensePerson>("chofer");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES_BY_PERSON.chofer[0]);
  const [custom, setCustom] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [period, setPeriod] = useState<"semana" | "mes">("mes");

  const load = async () => {
    setItems(await getExpenses());
    setEnabled(await isExpensesEnabled());
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const now = new Date();
    return items.filter(item => {
      const date = new Date(item.date);
      if (period === "mes") {
        return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
      }
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return date >= start && date <= now;
    });
  }, [items, period]);

  const personItems = useMemo(() => filtered.filter(item => item.person === person), [filtered, person]);
  const total = personItems.reduce((sum, item) => sum + item.amount, 0);
  const grouped = useMemo(() => {
    const groups: Record<string, ExpenseItem[]> = {};
    personItems.forEach(item => {
      (groups[item.category] ??= []).push(item);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b, "es"));
  }, [personItems]);

  const choosePerson = (nextPerson: ExpensePerson) => {
    setPerson(nextPerson);
    setCategory(EXPENSE_CATEGORIES_BY_PERSON[nextPerson][0]);
    setCustom("");
  };

  const save = async () => {
    const parsedAmount = Number(amount.trim().replace(",", "."));
    const selectedCategory = category === "Otros" ? (custom.trim() || "Otros") : category;
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return;

    await addExpense({
      id: String(Date.now()),
      person,
      category: selectedCategory,
      amount: parsedAmount,
      date: new Date().toISOString(),
      note: note.trim() || undefined,
    });
    setAmount("");
    setNote("");
    setCustom("");
    await load();
  };

  const toggle = async (value: boolean) => {
    setEnabled(value);
    await setExpensesEnabled(value);
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.container}>
      <Text style={s.title}>Control de gastos</Text>
      <Text style={s.sub}>Registro independiente: no modifica la liquidación ni el reparto.</Text>

      <View style={s.card}>
        <View style={s.row}>
          <Text style={s.label}>Activar control de gastos</Text>
          <Switch value={enabled} onValueChange={toggle} />
        </View>
      </View>

      {enabled ? (
        <>
          <View style={s.card}>
            <Text style={s.label}>¿De quién es el gasto?</Text>
            <View style={s.row}>
              <TouchableOpacity style={[s.choice, person === "chofer" && s.active]} onPress={() => choosePerson("chofer")}>
                <Text style={[s.choiceText, person === "chofer" && s.activeText]}>Chofer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.choice, person === "dueno" && s.active]} onPress={() => choosePerson("dueno")}>
                <Text style={[s.choiceText, person === "dueno" && s.active && s.activeText]}>Dueño</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.label}>Categoría</Text>
            <View style={s.categories}>
              {EXPENSE_CATEGORIES_BY_PERSON[person].map(itemCategory => (
                <TouchableOpacity
                  key={itemCategory}
                  style={[s.chip, category === itemCategory && s.chipActive]}
                  onPress={() => setCategory(itemCategory)}
                >
                  <Text style={[s.chipText, category === itemCategory && s.chipTextActive]}>{itemCategory}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {category === "Otros" ? (
              <TextInput
                style={s.input}
                value={custom}
                onChangeText={setCustom}
                placeholder="Nombre del gasto"
                placeholderTextColor="#888"
              />
            ) : null}

            <Text style={s.label}>Importe (ARS)</Text>
            <TextInput
              style={s.input}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              placeholder="Ej. 15000"
              placeholderTextColor="#888"
            />

            <Text style={s.label}>Detalle (opcional)</Text>
            <TextInput
              style={s.input}
              value={note}
              onChangeText={setNote}
              placeholder="Descripción del gasto"
              placeholderTextColor="#888"
            />

            <TouchableOpacity style={s.primary} onPress={() => void save()}>
              <Text style={s.primaryText}>GUARDAR GASTO</Text>
            </TouchableOpacity>
          </View>

          <View style={s.card}>
            <Text style={s.label}>Resumen</Text>
            <View style={s.row}>
              <TouchableOpacity style={[s.choice, period === "semana" && s.active]} onPress={() => setPeriod("semana")}>
                <Text style={[s.choiceText, period === "semana" && s.activeText]}>Últimos 7 días</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.choice, period === "mes" && s.active]} onPress={() => setPeriod("mes")}>
                <Text style={[s.choiceText, period === "mes" && s.activeText]}>Este mes</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.total}>{money(total)}</Text>
            <Text style={s.sub}>
              Total del {person === "chofer" ? "chofer" : "dueño"} · {period === "mes" ? "mes actual" : "últimos 7 días"}
            </Text>
          </View>

          <Text style={s.section}>Historial por categoría</Text>
          {grouped.length === 0 ? (
            <Text style={s.sub}>No hay gastos en este período para esta persona.</Text>
          ) : (
            grouped.map(([groupCategory, expenses]) => {
              const categoryTotal = expenses.reduce((sum, item) => sum + item.amount, 0);
              return (
                <View style={s.group} key={groupCategory}>
                  <View style={s.groupHeader}>
                    <Text style={s.groupTitle}>{groupCategory}</Text>
                    <Text style={s.groupTotal}>{money(categoryTotal)}</Text>
                  </View>
                  {expenses.map(item => (
                    <View style={s.item} key={item.id}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.itemTitle}>{money(item.amount)}</Text>
                        <Text style={s.sub}>
                          {new Date(item.date).toLocaleDateString("es-AR")}{item.note ? " · " + item.note : ""}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => void deleteExpense(item.id).then(load)}>
                        <Text style={s.delete}>Eliminar</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              );
            })
          )}
        </>
      ) : (
        <Text style={s.sub}>La función está desactivada. Los registros guardados se conservan.</Text>
      )}

      <TouchableOpacity style={s.secondary} onPress={() => router.back()}>
        <Text style={s.secondaryText}>VOLVER A LIQUIDAPP</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f2f4f7" },
  container: { padding: 20, paddingBottom: 40, maxWidth: 560, width: "100%", alignSelf: "center" },
  title: { fontSize: 26, fontWeight: "bold", color: "#222" },
  sub: { fontSize: 13, color: "#666", marginTop: 5, marginBottom: 12 },
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 14, marginTop: 12 },
  label: { fontSize: 14, fontWeight: "bold", color: "#222", marginVertical: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "space-between" },
  choice: { flex: 1, padding: 12, borderRadius: 9, backgroundColor: "#eee", alignItems: "center" },
  active: { backgroundColor: "#111" },
  choiceText: { color: "#222", fontWeight: "600" },
  activeText: { color: "#fff" },
  categories: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: { paddingVertical: 8, paddingHorizontal: 10, borderWidth: 1, borderColor: "#ccc", borderRadius: 20 },
  chipActive: { backgroundColor: "#111", borderColor: "#111" },
  chipText: { color: "#333", fontSize: 12 },
  chipTextActive: { color: "#fff" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 12, fontSize: 16, color: "#222", backgroundColor: "#fff", marginBottom: 6 },
  primary: { backgroundColor: "#111", padding: 15, borderRadius: 10, alignItems: "center", marginTop: 12 },
  primaryText: { color: "#fff", fontWeight: "bold" },
  total: { fontSize: 28, fontWeight: "bold", color: "#111", textAlign: "center", marginTop: 12 },
  section: { fontSize: 17, fontWeight: "bold", color: "#222", marginTop: 20, marginBottom: 8 },
  group: { marginBottom: 10 },
  groupHeader: { backgroundColor: "#e4e7ec", padding: 13, borderTopLeftRadius: 10, borderTopRightRadius: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  groupTitle: { fontWeight: "bold", color: "#222", fontSize: 15 },
  groupTotal: { fontWeight: "bold", color: "#222" },
  item: { backgroundColor: "#fff", padding: 13, borderBottomWidth: 1, borderBottomColor: "#eee", flexDirection: "row", alignItems: "center", gap: 8 },
  itemTitle: { fontWeight: "bold", color: "#222" },
  delete: { color: "#b42318", fontWeight: "bold" },
  secondary: { padding: 15, backgroundColor: "#ddd", borderRadius: 10, alignItems: "center", marginTop: 18 },
  secondaryText: { fontWeight: "bold", color: "#222" },
});
