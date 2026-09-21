import { router, useLocalSearchParams } from "expo-router";
import * as Speech from "expo-speech";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { EmergencyType, firstAidSteps } from "@/data/firstAid";
import { useLanguage } from "@/hooks/useLanguage";
import { Language, t } from "@/i18n";
import { Guidance } from "@/lib/ml-client";
import { pickSpeechLocale, SpeechChoice } from "@/lib/speech";

// A step shape both the static (mocked, non-ML emergency types) and the
// real grounded-guidance (burn/wound) paths can render identically.
type DisplayStep = { text: string; source?: string };

export default function FirstAidSteps() {
  const params = useLocalSearchParams<{ incidentId?: string; type: EmergencyType; guidance?: string; from?: string }>();
  const type = (params.type ?? "general") as EmergencyType;
  const profileLanguage = useLanguage();

  const guidance: Guidance | null = params.guidance ? JSON.parse(params.guidance) : null;
  // The steps are in whatever language the guidance was requested in; use
  // that for speech. UI labels follow the current profile language.
  const guidanceLanguage = ((guidance?.language as Language | undefined) ?? profileLanguage) as Language;

  const steps: DisplayStep[] = guidance
    ? guidance.steps.map((s) => ({ text: s.instruction, source: s.source }))
    : (firstAidSteps[type] ?? firstAidSteps.general).map((text) => ({ text }));

  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [speech, setSpeech] = useState<SpeechChoice | null>(null);

  // Static (non-ML) steps are English; everything else follows the guidance language.
  const speechLanguage: Language = guidance ? guidanceLanguage : "en";

  useEffect(() => {
    let cancelled = false;
    pickSpeechLocale(speechLanguage).then((choice) => {
      if (!cancelled) setSpeech(choice);
    });
    return () => {
      cancelled = true;
      Speech.stop();
    };
  }, [speechLanguage]);

  const playStep = (index: number) => {
    Speech.stop();
    if (playingIndex === index) {
      setPlayingIndex(null);
      return;
    }
    setPlayingIndex(index);
    const done = () => setPlayingIndex((current) => (current === index ? null : current));
    Speech.speak(steps[index].text, {
      language: speech?.locale,
      onDone: done,
      onStopped: done,
      onError: done,
    });
  };

  // Clear the whole report flow (so the next report starts fresh), then go
  // to Home — or back to Profile if this was opened from "My reports".
  const finish = () => {
    Speech.stop();
    router.dismissAll();
    router.navigate(params.from === "profile" ? "/(citizen)/profile" : "/(citizen)");
  };

  const bannerLabel = !guidance
    ? t(profileLanguage, "bannerStatic")
    : guidance.grounded
      ? t(profileLanguage, "bannerSourced")
      : t(profileLanguage, "bannerCaution");

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.banner}>
        <Text style={styles.bannerLabel}>{bannerLabel}</Text>
        <Text style={styles.bannerTitle}>{(guidance?.title ?? type).replace(/_/g, " ").toUpperCase()}</Text>
        {guidance?.summary ? <Text style={styles.bannerSummary}>{guidance.summary}</Text> : null}
      </View>

      {guidance && guidance.red_flags.length > 0 && (
        <Card style={styles.redFlagCard}>
          <Text style={styles.redFlagTitle}>{t(profileLanguage, "redFlags")}</Text>
          {guidance.red_flags.map((flag, i) => (
            <Text key={i} style={styles.redFlagText}>
              • {flag}
            </Text>
          ))}
        </Card>
      )}

      {speech?.fellBack && <Text style={styles.voiceNote}>{t(profileLanguage, "voiceFallbackNote")}</Text>}

      {steps.length === 0 && (
        <Card style={styles.stepCard}>
          <Text style={styles.stepText}>{t(profileLanguage, "noGuidance")}</Text>
        </Card>
      )}

      {steps.map((step, index) => (
        <Card key={index} style={styles.stepCard}>
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step.text}</Text>
          </View>
          {step.source && (
            <Text style={styles.stepSource}>
              {t(profileLanguage, "source")}: {step.source}
            </Text>
          )}
          <Button
            title={t(profileLanguage, playingIndex === index ? "playing" : "play")}
            variant="outline"
            onPress={() => playStep(index)}
            style={styles.playButton}
          />
        </Card>
      ))}

      <Button
        title={t(profileLanguage, "viewOnMap")}
        onPress={() =>
          router.push({
            pathname: "/(citizen)/report/map",
            params: { incidentId: params.incidentId ?? "" },
          })
        }
        style={styles.mapButton}
      />
      <Button
        title={t(profileLanguage, "done")}
        variant="outline"
        onPress={finish}
        style={styles.doneButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  banner: {
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  bannerLabel: { color: colors.brightTeal, fontWeight: "700", fontSize: 12, letterSpacing: 1 },
  bannerTitle: { color: colors.white, fontSize: 22, fontWeight: "800", marginTop: spacing.xs },
  bannerSummary: { color: colors.light, marginTop: spacing.sm, fontSize: 13, lineHeight: 18 },
  redFlagCard: { backgroundColor: "#FDEDEE", marginBottom: spacing.md },
  redFlagTitle: { fontWeight: "800", color: colors.red, marginBottom: spacing.xs },
  redFlagText: { color: colors.red, fontSize: 14, marginTop: 2 },
  voiceNote: { ...typography.caption, marginBottom: spacing.md },
  stepCard: { marginBottom: spacing.md },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: { color: colors.white, fontWeight: "800" },
  stepText: { ...typography.body, flex: 1 },
  stepSource: { ...typography.caption, marginTop: spacing.xs, marginLeft: 28 + spacing.md },
  playButton: { marginTop: spacing.sm, alignSelf: "flex-start", paddingVertical: spacing.sm, minHeight: 40 },
  mapButton: { marginTop: spacing.md },
  doneButton: { marginTop: spacing.sm },
});
