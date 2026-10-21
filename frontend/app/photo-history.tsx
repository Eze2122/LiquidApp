import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { addTicketPhoto, deleteTicketPhoto, getTicketPhotos, localDateString, updateTicketPhotoDate, type TicketPhoto } from "@/src/liquidapp/ticketPhotoHistory";

function shiftDate(value: string, amount: number) {
  const d = new Date(value + "T12:00:00");
  d.setDate(d.getDate() + amount);
  return localDateString(d);
}

export default function TicketPhotoHistoryScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(localDateString());
  const [items, setItems] = useState<TicketPhoto[]>([]);
  const [editDates, setEditDates] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [fuel, setFuel] = useState<"gnc" | "nafta">("gnc");
  const load = useCallback(async () => {
    const all = await getTicketPhotos();
    setItems(all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }, []);
  useEffect(() => { void load(); }, [load]);
  const dayItems = items.filter(item => item.date === selectedDate);

  const chooseImage = async (camera: boolean) => {
    try {
      let uri: string | undefined;
      if (camera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert("Permiso necesario", "Permití el acceso a la cámara para fotografiar el ticket.");
          return;
        }
        const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8 });
        if (!result.canceled) uri = result.assets[0]?.uri;
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8, allowsMultipleSelection: true, selectionLimit: 10 });
        if (!result.canceled) {
          for (const asset of result.assets) await addTicketPhoto(asset.uri, selectedDate, fuel, note);
          setNote("");
          await load();
          Alert.alert("Fotos guardadas", `Se guardaron ${result.assets.length} foto(s) en ${selectedDate}.`);
          return;
        }
      }
      if (uri) {
        await addTicketPhoto(uri, selectedDate, fuel, note);
        setNote("");
        await load();
        Alert.alert("Foto guardada", `La foto quedó almacenada en el historial del ${selectedDate}.`);
      }
    } catch (e) {
      Alert.alert("No se pudo guardar", e instanceof Error ? e.message : "Revisá el espacio disponible e intentá de nuevo.");
    }
  };

  const saveDate = async (id: string) => {
    const date = editDates[id] ?? items.find(x => x.id === id)?.date ?? selectedDate;
    try {
      await updateTicketPhotoDate(id, date);
      setEditDates(current => { const next = { ...current }; delete next[id]; return next; });
      await load();
      Alert.alert("Fecha actualizada", "La foto quedó asignada a la nueva fecha.");
    } catch (e) {
      Alert.alert("Fecha inválida", e instanceof Error ? e.message : "Usá el formato AAAA-MM-DD.");
    }
  };

  const remove = (item: TicketPhoto) => Alert.alert("Borrar foto", "Esta foto se eliminará del historial del teléfono.", [
    { text: "Cancelar", style: "cancel" },
    { text: "Borrar", style: "destructive", onPress: async () => { await deleteTicketPhoto(item.id); await load(); } }
  ]);

  return <ScrollView style={s.root} contentContainerStyle={s.container}>
    <Text style={s.title}>Historial de fotos de tickets</Text>
    <Text style={s.subtitle}>Las fotos se guardan dentro de LiquidApp y se organizan por la fecha que elijas. Podés cargar fotos atrasadas, cambiarles la fecha o borrarlas.</Text>
    <View style={s.card}>
      <Text style={s.label}>Ver fotos de esta fecha (AAAA-MM-DD)</Text>
      <View style={s.dateRow}>
        <TouchableOpacity style={s.dayButton} onPress={() => setSelectedDate(d => shiftDate(d, -1))}><Text style={s.dayText}>‹</Text></TouchableOpacity>
        <TextInput style={[s.input, { flex: 1 }]} value={selectedDate} onChangeText={setSelectedDate} placeholder="2026-10-21" autoCapitalize="none" />
        <TouchableOpacity style={s.dayButton} onPress={() => setSelectedDate(d => shiftDate(d, 1))}><Text style={s.dayText}>›</Text></TouchableOpacity>
      </View>
      <TouchableOpacity style={s.todayButton} onPress={() => setSelectedDate(localDateString())}><Text style={s.todayText}>IR A HOY</Text></TouchableOpacity>
      <Text style={s.label}>Combustible de las nuevas fotos</Text>
      <View style={s.dateRow}>
        {(["gnc", "nafta"] as const).map(value => <TouchableOpacity key={value} style={[s.fuelButton, fuel === value && s.fuelSelected]} onPress={() => setFuel(value)}><Text style={[s.fuelText, fuel === value && s.fuelTextSelected]}>{value === "gnc" ? "GNC" : "NAFTA"}</Text></TouchableOpacity>)}
      </View>
      <Text style={s.label}>Nota opcional</Text>
      <TextInput style={s.input} value={note} onChangeText={setNote} placeholder="Estación, número de ticket..." />
      <View style={s.dateRow}>
        <TouchableOpacity style={[s.action, { flex: 1 }]} onPress={() => void chooseImage(true)}><Text style={s.actionText}>SACAR FOTO</Text></TouchableOpacity>
        <TouchableOpacity style={[s.action, { flex: 1 }]} onPress={() => void chooseImage(false)}><Text style={s.actionText}>ELEGIR FOTOS</Text></TouchableOpacity>
      </View>
    </View>
    <Text style={s.section}>Fotos del {selectedDate} ({dayItems.length})</Text>
    {dayItems.length === 0 ? <Text style={s.empty}>No hay fotos asignadas a esta fecha. Podés agregar fotos aunque el ticket sea de un día anterior.</Text> : dayItems.map(item => <View style={s.photoCard} key={item.id}>
      <Image source={{ uri: item.uri }} style={s.photo} resizeMode="contain" />
      <Text style={s.photoMeta}>{item.fuel ? item.fuel.toUpperCase() : "TICKET"}{item.note ? " · " + item.note : ""}</Text>
      <Text style={s.label}>Cambiar fecha (AAAA-MM-DD)</Text>
      <TextInput style={s.input} value={editDates[item.id] ?? item.date} onChangeText={value => setEditDates(current => ({ ...current, [item.id]: value }))} autoCapitalize="none" />
      <View style={s.dateRow}>
        <TouchableOpacity style={[s.action, { flex: 1 }]} onPress={() => void saveDate(item.id)}><Text style={s.actionText}>GUARDAR FECHA</Text></TouchableOpacity>
        <TouchableOpacity style={s.deleteButton} onPress={() => remove(item)}><Text style={s.deleteText}>BORRAR</Text></TouchableOpacity>
      </View>
    </View>)}
    <TouchableOpacity style={s.back} onPress={() => router.back()}><Text style={s.backText}>VOLVER A LIQUIDAPP</Text></TouchableOpacity>
  </ScrollView>;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f2f4f7" }, container: { padding: 18, paddingBottom: 36, maxWidth: 600, width: "100%", alignSelf: "center" },
  title: { fontSize: 25, fontWeight: "bold", color: "#222" }, subtitle: { color: "#555", lineHeight: 20, marginTop: 8, marginBottom: 16 },
  card: { backgroundColor: "#fff", padding: 15, borderRadius: 14 }, label: { fontWeight: "bold", color: "#222", marginTop: 10, marginBottom: 6, fontSize: 13 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 9, padding: 12, color: "#222", backgroundColor: "#fff" }, dateRow: { flexDirection: "row", gap: 8, alignItems: "center", marginTop: 6 },
  dayButton: { width: 44, height: 44, borderRadius: 9, backgroundColor: "#e7e9ef", alignItems: "center", justifyContent: "center" }, dayText: { fontSize: 27, color: "#222" },
  todayButton: { alignSelf: "flex-start", padding: 8, marginTop: 7 }, todayText: { fontWeight: "bold", color: "#315b9b", fontSize: 12 },
  fuelButton: { flex: 1, padding: 11, borderRadius: 9, backgroundColor: "#e7e9ef", alignItems: "center" }, fuelSelected: { backgroundColor: "#20242c" }, fuelText: { fontWeight: "bold", color: "#222" }, fuelTextSelected: { color: "#fff" },
  action: { backgroundColor: "#20242c", borderRadius: 9, padding: 13, alignItems: "center", marginTop: 12 }, actionText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  section: { fontSize: 18, fontWeight: "bold", color: "#222", marginTop: 22, marginBottom: 10 }, empty: { color: "#666", lineHeight: 20, padding: 12, backgroundColor: "#fff", borderRadius: 10 },
  photoCard: { backgroundColor: "#fff", borderRadius: 12, padding: 13, marginBottom: 12 }, photo: { width: "100%", height: 230, backgroundColor: "#f5f5f5", borderRadius: 8 }, photoMeta: { color: "#555", marginTop: 8 },
  deleteButton: { backgroundColor: "#fee4e2", borderRadius: 9, padding: 13, alignItems: "center", marginTop: 12 }, deleteText: { color: "#b42318", fontWeight: "bold", fontSize: 12 },
  back: { backgroundColor: "#ddd", borderRadius: 10, padding: 15, alignItems: "center", marginTop: 20 }, backText: { color: "#222", fontWeight: "bold" }
});
