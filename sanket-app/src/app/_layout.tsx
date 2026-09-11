import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { convex } from "@/lib/convex-client";
import { secureStorage } from "@/lib/secure-store-adapter";

export default function RootLayout() {
  return (
    <ConvexAuthProvider client={convex} storage={secureStorage}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </ConvexAuthProvider>
  );
}
