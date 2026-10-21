import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { addTicket, deleteTicket, getTickets, type FuelTicket } from "@/src/liquidapp/tickets";

const money = (n:number) => new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format(n);
export default function TicketsScreen() {
 const router=useRouter(); const params=useLocalSearchParams<{fuel?:string}>();
 const fuel: "gnc"|"nafta" = params.fuel === "nafta" ? "nafta" : "gnc";
 const [amount,setAmount]=useState(""); const [note,setNote]=useState(""); const [photoUri,setPhotoUri]=useState<string|undefined>(); const [items,setItems]=useState<FuelTicket[]>([]); const [batchId]=useState(()=>String(Date.now()));
 const load=async()=>setItems(await getTickets());
 useEffect(()=>{void load();},[]);
 const filtered=useMemo(()=>items.filter(x=>x.fuel===fuel),[items,fuel]);
 const sessionTickets=filtered.filter(x=>x.batchId===batchId); const total=sessionTickets.reduce((s,x)=>s+x.amount,0);
 const save=async()=>{const n=Number(amount.replace(",", ".")); if(!Number.isFinite(n)||n<=0){Alert.alert("Importe inválido","Ingresá un importe mayor a cero.");return;} await addTicket({id:String(Date.now()),batchId,fuel,amount:n,date:new Date().toISOString(),note:note.trim()||undefined,photoUri});setAmount("");setNote("");setPhotoUri(undefined);await load();};
 const takePhoto=async()=>{const p=await ImagePicker.requestCameraPermissionsAsync();if(!p.granted){Alert.alert("Permiso necesario","Permití el acceso a la cámara para fotografiar el ticket.");return;}const result=await ImagePicker.launchCameraAsync({mediaTypes:["images"],quality:0.7});if(!result.canceled)setPhotoUri(result.assets[0]?.uri);};
 const pickPhoto=async()=>{const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:["images"],quality:0.7});if(!result.canceled)setPhotoUri(result.assets[0]?.uri);};
 const remove=async(id:string)=>{await deleteTicket(id);await load();};
 return <ScrollView style={s.root} contentContainerStyle={s.container}>
  <Text style={s.title}>Tickets de {fuel==="gnc"?"GNC":"nafta"}</Text>
  <Text style={s.subtitle}>Cargá cada ticket por separado. El total se suma automáticamente.</Text>
  <View style={s.card}><Text style={s.label}>Importe del ticket (ARS)</Text><TextInput style={s.input} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} placeholder="Ej. 8500" placeholderTextColor="#888"/>
  <Text style={s.label}>Foto del ticket (opcional)</Text><View style={s.photoButtons}><TouchableOpacity style={s.photoButton} onPress={()=>void takePhoto()}><Text style={s.photoButtonText}>SACAR FOTO</Text></TouchableOpacity><TouchableOpacity style={s.photoButton} onPress={()=>void pickPhoto()}><Text style={s.photoButtonText}>ELEGIR DE GALERÍA</Text></TouchableOpacity></View>{photoUri?<Image source={{uri:photoUri}} style={s.photoPreview} resizeMode="contain"/>:null}
  <Text style={s.label}>Nota (opcional)</Text><TextInput style={s.input} value={note} onChangeText={setNote} placeholder="Estación, número de ticket..." placeholderTextColor="#888"/>
  <TouchableOpacity style={s.primary} onPress={()=>void save()}><Text style={s.primaryText}>SUMAR TICKET</Text></TouchableOpacity>
  <Text style={s.count}>{sessionTickets.length} ticket(s) sumados</Text><Text style={s.total}>{money(total)}</Text>
  <Text style={s.hint}>Al volver a la liquidación, usá este total para completar el combustible.</Text></View>
  <Text style={s.section}>Tickets cargados</Text>
  {filtered.length===0?<Text style={s.empty}>Todavía no cargaste tickets de este combustible.</Text>:filtered.map(x=><View style={s.item} key={x.id}><View style={{flex:1}}><Text style={s.itemAmount}>{money(x.amount)}</Text>{x.photoUri?<Image source={{uri:x.photoUri}} style={s.thumb} resizeMode="cover"/>:null}<Text style={s.date}>{new Date(x.date).toLocaleString("es-AR")}{x.note?" · "+x.note:""}</Text></View><TouchableOpacity onPress={()=>void remove(x.id)}><Text style={s.delete}>Eliminar</Text></TouchableOpacity></View>)}
  <TouchableOpacity style={s.secondary} onPress={()=>router.back()}><Text style={s.secondaryText}>VOLVER A LIQUIDAPP</Text></TouchableOpacity>
 </ScrollView>;
}
const s=StyleSheet.create({root:{flex:1,backgroundColor:"#f2f4f7"},container:{padding:20,paddingBottom:40,maxWidth:560,width:"100%",alignSelf:"center"},title:{fontSize:26,fontWeight:"bold",color:"#222"},subtitle:{fontSize:14,color:"#555",marginTop:6,marginBottom:16},card:{backgroundColor:"#fff",padding:18,borderRadius:16},label:{fontSize:14,fontWeight:"bold",color:"#222",marginTop:8,marginBottom:6},input:{borderWidth:1,borderColor:"#ccc",borderRadius:10,padding:13,color:"#222",fontSize:17,backgroundColor:"#fff"},primary:{backgroundColor:"#111",padding:15,borderRadius:10,alignItems:"center",marginTop:14},primaryText:{color:"#fff",fontWeight:"bold"},count:{textAlign:"center",color:"#555",marginTop:14},total:{fontSize:30,fontWeight:"bold",color:"#111",textAlign:"center",marginTop:4},hint:{fontSize:12,color:"#666",marginTop:10,textAlign:"center"},photoButtons:{flexDirection:"row",gap:8},photoButton:{flex:1,padding:11,borderRadius:8,backgroundColor:"#e8eaf0",alignItems:"center"},photoButtonText:{fontSize:11,fontWeight:"bold",color:"#222"},photoPreview:{width:"100%",height:180,marginTop:10,borderRadius:8},thumb:{width:54,height:54,borderRadius:6,marginTop:5},section:{fontSize:17,fontWeight:"bold",color:"#222",marginTop:22,marginBottom:8},empty:{color:"#666",padding:12},item:{backgroundColor:"#fff",borderRadius:10,padding:13,marginBottom:8,flexDirection:"row",alignItems:"center",gap:10},itemAmount:{fontSize:17,fontWeight:"bold",color:"#222"},date:{fontSize:12,color:"#666",marginTop:3,flexShrink:1},delete:{color:"#b42318",fontWeight:"bold"},secondary:{padding:15,backgroundColor:"#ddd",borderRadius:10,alignItems:"center",marginTop:18},secondaryText:{fontWeight:"bold",color:"#222"}});
