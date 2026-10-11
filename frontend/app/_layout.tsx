import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { LogBox, StatusBar } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { hydratePremium } from "@/src/premium/state";
import { queryClient } from "@/src/query-client";

LogBox.ignoreAllLogs(true);

export default function RootLayout() {
  useEffect(() => {
    hydratePremium();
  }, []);

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
