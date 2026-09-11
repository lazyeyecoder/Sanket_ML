import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { languages, t } from "@/i18n";

export function ProfileScreen() {
  const currentUser = useQuery(api.users.currentUser);
  const setLanguage = useMutation(api.users.setLanguage);
  const { signOut } = useAuthActions();

  const language = currentUser?.language ?? "en";

  const onSignOut = async () => {
    await signOut();
    router.replace("/(auth)/sign-in");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title={t(language, "profile")} />

      <Card style={styles.card}>
        <Text style={typography.h3}>{currentUser?.email ?? "—"}</Text>
        <Text style={styles.roleText}>
          {t(language, "role")}: {currentUser?.role === "medical_officer" ? "Medical Officer" : "Citizen"}
        </Text>
      </Card>

      <Text style={[typography.h3, styles.sectionTitle]}>{t(language, "language")}</Text>
      <Card style={styles.card}>
        {languages.map((lang) => (
          <Pressable
            key={lang.id}
            onPress={() => setLanguage({ language: lang.id })}
            style={[styles.langRow, language === lang.id && styles.langRowActive]}
          >
            <Text style={typography.body}>{lang.label}</Text>
            <Text style={styles.native}>{lang.native}</Text>
          </Pressable>
        ))}
      </Card>

      <Button
        title={t(language, "signOut")}
        variant="outline"
        onPress={onSignOut}
        style={styles.signOutButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light },
  content: { paddingBottom: spacing.xxl },
  card: { marginHorizontal: spacing.lg, marginBottom: spacing.md },
  roleText: { ...typography.caption, marginTop: spacing.xs, textTransform: "capitalize" },
  sectionTitle: { marginHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.sm },
  langRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
  },
  langRowActive: { backgroundColor: colors.light },
  native: { color: colors.teal, fontWeight: "700" },
  signOutButton: { marginHorizontal: spacing.lg, marginTop: spacing.lg },
});
