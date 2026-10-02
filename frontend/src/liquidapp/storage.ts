import AsyncStorage from "@react-native-async-storage/async-storage";

import type { CalcResult } from "./logic";

export const HISTORY_KEY = "liquidapp_historial";

export interface HistoryItem extends CalcResult {
  id: string;
  fecha: string;
  tipoLiquidacion: "turno" | "semanal";
  nombreChofer: string;
  nombreDueno: string;
}

export async function getHistory(): Promise<HistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as HistoryItem[];
  } catch {
    return [];
  }
}

export async function saveHistoryItem(item: HistoryItem): Promise<void> {
  const list = await getHistory();
  list.unshift(item);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(list));
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}

export async function deleteHistoryItem(id: string): Promise<void> {
  const list = await getHistory();
  const filtered = list.filter((x) => x.id !== id);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
}
