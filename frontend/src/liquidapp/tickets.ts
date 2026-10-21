import AsyncStorage from "@react-native-async-storage/async-storage";

export type FuelTicket = { id: string; batchId: string; fuel: "gnc" | "nafta"; amount: number; date: string; note?: string; photoUri?: string };
const KEY = "liquidapp_tickets_v1";
export async function getTickets(): Promise<FuelTicket[]> {
  try { const raw = await AsyncStorage.getItem(KEY); const v = raw ? JSON.parse(raw) : []; return Array.isArray(v) ? v : []; } catch { return []; }
}
export async function addTicket(ticket: FuelTicket): Promise<void> { const all = await getTickets(); all.unshift(ticket); await AsyncStorage.setItem(KEY, JSON.stringify(all)); }
export async function deleteTicket(id: string): Promise<void> { await AsyncStorage.setItem(KEY, JSON.stringify((await getTickets()).filter(t => t.id !== id))); }
export async function ticketTotal(fuel: "gnc" | "nafta"): Promise<number> { const all = await getTickets(); const latest = all.find(t => t.fuel === fuel); if (!latest) return 0; return all.filter(t => t.fuel === fuel && t.batchId === latest.batchId).reduce((sum, t) => sum + t.amount, 0); }
