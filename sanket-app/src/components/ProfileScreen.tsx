import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { colors, radius, spacing, typography } from "@/constants/theme";
import {
  className,
  dateLocales,
  emergencyTypeName,
  Language,
  languages,
  StringKey,
  t,
} from "@/i18n";

const URGENCY_TAG: Record<string, { bg: string; key: StringKey }> = {
  high: { bg: colors.red, key: "tagHigh" },
  medium: { bg: colors.navy, key: "tagMedium" },
  low: { bg: colors.teal, key: "tagLow" },
  unable_to_determine: { bg: colors.gray, key: "tagUnknown" },
};

const STATUS_KEY: Record<Doc<"incidents">["status"], StringKey> = {
  open: "statusOpen",
  accepted: "statusAccepted",
  resolved: "statusResolved",
};

function ReportRow({ incident, language }: { incident: Doc<"incidents">; language: Language }) {
  // Tag = what the model saw (e.g. "Second-Degree Burn"); reports without a
  // photo detection fall back to the emergency type the user picked.
  const tag = incident.detectedClass
    ? className(language, incident.detectedClass)
    : emergencyTypeName(language, incident.type);
  const urgency = incident.urgency ? URGENCY_TAG[incident.urgency] : undefined;

  const open = () =>
    router.push({
      pathname: "/(citizen)/report/first-aid",
      params: {
        type: incident.type,
        incidentId: incident._id,
        from: "profile",
        ...(incident.guidance ? { guidance: incident.guidance } : {}),
      },
    });

  return (
    <Card onPress={open} style={styles.reportCard}>
      <View style={styles.tagRow}>
        <View style={[styles.tag, { backgroundColor: colors.teal }]}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>
        {urgency && (
          <View style={[styles.tag, { backgroundColor: urgency.bg }]}>
            <Text style={styles.tagText}>{t(language, urgency.key)}</Text>
          </View>
        )}
      </View>
      <Text style={styles.reportMeta}>
        {new Date(incident.createdAt).toLocaleString(dateLocales[language])} ·{" "}
        {t(language, STATUS_KEY[incident.status])}
      </Text>
      <Text style={styles.reportHint}>{t(language, "tapToView")} ›</Text>
    </Card>
  );
}

export function ProfileScreen() {
  const currentUser = useQuery(api.users.currentUser);
  const myIncidents = useQuery(api.incidents.listMyIncidents);
  const setLanguage = useMutation(api.users.setLanguage);
  const { signOut } = useAuthActions();

  const language = (currentUser?.language ?? "en") as Language;
  const isCitizen = currentUser?.role !== "medical_officer";

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

      {isCitizen && (
        <>
          <Text style={[typography.h3, styles.sectionTitle]}>{t(language, "myReports")}</Text>
          {myIncidents && myIncidents.length === 0 && (
            <Card style={styles.card}>
              <Text style={typography.caption}>{t(language, "noReportsYet")}</Text>
            </Card>
          )}
          {myIncidents?.map((incident) => (
            <ReportRow key={incident._id} incident={incident} language={language} />
          ))}
        </>
      )}

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
  reportCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  tag: { borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  tagText: { color: colors.white, fontWeight: "700", fontSize: 13 },
  reportMeta: { ...typography.caption, marginTop: spacing.sm },
  reportHint: { ...typography.caption, color: colors.teal, fontWeight: "700", marginTop: spacing.xs },
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
