import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { colors, spacing, typography } from "@/constants/theme";

export function ScreenHeader({
  title,
  subtitle,
  showBack = false,
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
}) {
  return (
    <View style={styles.container}>
      {showBack && (
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
      )}
      <Text style={typography.h1}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  subtitle: { ...typography.body, color: colors.gray, marginTop: spacing.xs },
  back: { marginBottom: spacing.sm },
  backText: { ...typography.body, color: colors.teal, fontWeight: "700" },
});
