import { useConvexAuth } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { api } from "@convex/_generated/api";
import { colors } from "@/constants/theme";

export default function Index() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const currentUser = useQuery(api.users.currentUser, isAuthenticated ? {} : "skip");

  if (isLoading || (isAuthenticated && currentUser === undefined)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.teal} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (!currentUser?.role) {
    return <Redirect href="/(auth)/role-picker" />;
  }

  if (currentUser.role === "medical_officer") {
    return <Redirect href="/(responder)" />;
  }

  return <Redirect href="/(citizen)" />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.light },
});
