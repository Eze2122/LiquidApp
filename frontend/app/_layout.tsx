import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
Image,
LogBox,
StatusBar,
StyleSheet,
View,
useWindowDimensions,
} from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { hydratePremium } from "@/src/premium/state";
import { queryClient } from "@/src/query-client";

LogBox.ignoreAllLogs(true);

export default function RootLayout() {
const [showSplash, setShowSplash] = useState(true);
const { width, height } = useWindowDimensions();

useEffect(() => {
hydratePremium();

const timer = setTimeout(() => {
  setShowSplash(false);
}, 2000);

return () => clearTimeout(timer);

}, []);

if (showSplash) {
return (
<View style={styles.splash}>
<StatusBar hidden />
<Image
source={require("../assets/images/splash-image.png")}
style={{ width, height }}
resizeMode="cover"
/>
</View>
);
}

return (
<ErrorBoundary>
<QueryClientProvider client={queryClient}>
<SafeAreaProvider>
<KeyboardProvider>
<StatusBar barStyle="dark-content" backgroundColor="#f2f4f7" />
<Stack
screenOptions={{
headerShown: false,
contentStyle: { backgroundColor: "#f2f4f7" },
}}
/>
</KeyboardProvider>
</SafeAreaProvider>
</QueryClientProvider>
</ErrorBoundary>
);
}

const styles = StyleSheet.create({
splash: {
flex: 1,
backgroundColor: "#f2f4f7",
},
});
