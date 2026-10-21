import AsyncStorage from "@react-native-async-storage/async-storage";
export type ExpensePerson = "chofer" | "dueno";
export type ExpenseItem = { id: string; person: ExpensePerson; category: string; amount: number; date: string; note?: string };
const KEY = "liquidapp_expenses_v1", ENABLED = "liquidapp_expenses_enabled_v1";
export const EXPENSE_CATEGORIES = ["Cuotas del vehículo","Seguro","RTO","Mantenimiento","Limpieza","Cubiertas","Taller","Gastos en turno","Estacionamiento","Otros"];
export async function getExpenses(): Promise<ExpenseItem[]> { try { const raw=await AsyncStorage.getItem(KEY); const v=raw?JSON.parse(raw):[]; return Array.isArray(v)?v:[]; } catch { return []; } }
export async function addExpense(item: ExpenseItem): Promise<void> { const all=await getExpenses(); all.unshift(item); await AsyncStorage.setItem(KEY,JSON.stringify(all)); }
export async function deleteExpense(id: string): Promise<void> { await AsyncStorage.setItem(KEY,JSON.stringify((await getExpenses()).filter(x=>x.id!==id))); }
export async function isExpensesEnabled(): Promise<boolean> { return (await AsyncStorage.getItem(ENABLED)) !== "false"; }
export async function setExpensesEnabled(enabled: boolean): Promise<void> { await AsyncStorage.setItem(ENABLED, String(enabled)); }
