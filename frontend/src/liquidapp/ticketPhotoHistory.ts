import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";

export type TicketPhoto = {
  id: string;
  uri: string;
  date: string; // Local calendar date: YYYY-MM-DD
  fuel?: "gnc" | "nafta";
  note?: string;
  createdAt: string;
};

const KEY = "liquidapp_ticket_photo_history_v1";
const DIR = (FileSystem.documentDirectory ?? "") + "ticket-photos/";

export function localDateString(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function persistTicketPhoto(sourceUri: string): Promise<string> {
  if (!FileSystem.documentDirectory) throw new Error("El almacenamiento local no está disponible.");
  await FileSystem.makeDirectoryAsync(DIR, { intermediates: true }).catch(() => undefined);
  const rawExt = sourceUri.split("?")[0].split(".").pop()?.toLowerCase() ?? "jpg";
  const ext = /^[a-z0-9]{2,5}$/.test(rawExt) ? rawExt : "jpg";
  const destination = `${DIR}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  await FileSystem.copyAsync({ from: sourceUri, to: destination });
  return destination;
}

export async function getTicketPhotos(): Promise<TicketPhoto[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveAll(items: TicketPhoto[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
}

export async function addTicketPhoto(sourceUri: string, date: string, fuel?: "gnc" | "nafta", note?: string): Promise<TicketPhoto> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date + "T12:00:00"))) {
    throw new Error("Elegí una fecha válida con formato AAAA-MM-DD.");
  }
  const uri = await persistTicketPhoto(sourceUri);
  const item: TicketPhoto = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, uri, date, fuel, note: note?.trim() || undefined, createdAt: new Date().toISOString() };
  const all = await getTicketPhotos();
  await saveAll([item, ...all]);
  return item;
}

export async function updateTicketPhotoDate(id: string, date: string): Promise<void> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date + "T12:00:00"))) {
    throw new Error("Elegí una fecha válida con formato AAAA-MM-DD.");
  }
  await saveAll((await getTicketPhotos()).map(item => item.id === id ? { ...item, date } : item));
}

export async function deleteTicketPhoto(id: string): Promise<void> {
  const all = await getTicketPhotos();
  const target = all.find(item => item.id === id);
  await saveAll(all.filter(item => item.id !== id));
  if (target?.uri && target.uri.startsWith(DIR)) {
    await FileSystem.deleteAsync(target.uri, { idempotent: true }).catch(() => undefined);
  }
}
