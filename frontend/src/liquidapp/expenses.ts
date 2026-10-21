import AsyncStorage from "@react-native-async-storage/async-storage";

export type ExpensePerson = "chofer" | "dueno";
export type ExpenseItem = {
  id: string;
  person: ExpensePerson;
  category: string;
  amount: number;
  date: string;
  note?: string;
};

const KEY = "liquidapp_expenses_v1";
const ENABLED = "liquidapp_expenses_enabled_v1";

export const EXPENSE_CATEGORIES_BY_PERSON: Record<ExpensePerson, string[]> = {
  chofer: ["Comida", "Combustible", "Estacionamiento", "Peajes", "Lavado", "Gastos varios", "Otros"],
  dueno: ["Cuota del vehículo", "Seguro", "Patente e impuestos", "RTO", "Mantenimiento", "Limpieza", "Cubiertas", "Taller", "Gastos varios", "Otros"],
};

// Compatibilidad con código antiguo que importe la lista general.
export const EXPENSE_CATEGORIES = EXPENSE_CATEGORIES_BY_PERSON.chofer;

export async function getExpenses(): Promise<ExpenseItem[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const value = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export async function addExpense(item: ExpenseItem): Promise<void> {
  const all = await getExpenses();
  all.unshift(item);
  await AsyncStorage.setItem(KEY, JSON.stringify(all));
}

export async function deleteExpense(id: string): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify((await getExpenses()).filter(item => item.id !== id)));
}

export async function isExpensesEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(ENABLED)) !== "false";
}

export async function setExpensesEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(ENABLED, String(enabled));
}
