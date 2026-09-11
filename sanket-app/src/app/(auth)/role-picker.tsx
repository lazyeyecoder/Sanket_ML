import { useMutation } from "convex/react";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { api } from "@convex/_generated/api";
import { Card } from "@/components/ui/Card";
import { colors, spacing, typography } from "@/constants/theme";

export default function RolePicker() {
  const setRole = useMutation(api.users.setRole);
  const [saving, setSaving] = useState<"citizen" | "medical_officer" | null>(null);

  const choose = async (role: "citizen" | "medical_officer") => {
    setSaving(role);
    try {
      await setRole({ role });
      router.replace("/");
    } finally {
      setSaving(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={typography.h1}>Who are you?</Text>
      <Text style={styles.subtitle}>
        This helps SANKET tailor the experience for you.
      </Text>

      <Card onPress={() => choose("citizen")} style={styles.card}>
        <Text style={styles.emoji}>🙋</Text>
        <Text style={typography.h3}>Citizen</Text>
        <Text style={styles.desc}>
          Report emergencies, get instant AI-guided first aid, and find nearby
          help.
        </Text>
        {saving === "citizen" ? <Text style={styles.saving}>Saving…</Text> : null}
      </Card>

      <Card onPress={() => choose("medical_officer")} style={styles.card}>
        <Text style={styles.emoji}>🚑</Text>
        <Text style={typography.h3}>Medical Officer</Text>
        <Text style={styles.desc}>
          Respond to nearby incidents. Requires license verification.
        </Text>
        {saving === "medical_officer" ? <Text style={styles.saving}>Saving…</Text> : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light, padding: spacing.xl, justifyContent: "center" },
  subtitle: { ...typography.body, color: colors.gray, marginTop: spacing.xs, marginBottom: spacing.xl },
  card: { marginBottom: spacing.md },
  emoji: { fontSize: 36, marginBottom: spacing.sm },
  desc: { ...typography.body, color: colors.gray, marginTop: spacing.xs },
  saving: { ...typography.caption, color: colors.teal, marginTop: spacing.sm },
});
