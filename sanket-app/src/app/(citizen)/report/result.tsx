import { router, useLocalSearchParams } from "expo-router";
import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { EmergencyType } from "@/data/firstAid";
import { useLanguage } from "@/hooks/useLanguage";
import { useUserLocation } from "@/hooks/useUserLocation";
import { className, StringKey, t } from "@/i18n";
import {
  Answers,
  Detection,
  FollowUpQuestion,
  ModelType,
  TriageResult,
  getGuidance,
  getTriage,
} from "@/lib/ml-client";

const URGENCY_STYLE: Record<TriageResult["urgency"], { bg: string; labelKey: StringKey }> = {
  high: { bg: colors.red, labelKey: "urgencyHigh" },
  medium: { bg: colors.navy, labelKey: "urgencyMedium" },
  low: { bg: colors.teal, labelKey: "urgencyLow" },
  unable_to_determine: { bg: colors.gray, labelKey: "urgencyUnknown" },
};

export default function Result() {
  const params = useLocalSearchParams<{
    type: string;
    description?: string;
    modelType: string;
    imageUri: string;
    imageWidth: string;
    imageHeight: string;
    detections: string;
    detectedBy?: string;
  }>();

  const type = (params.type ?? "injury") as EmergencyType;
  const modelType = params.modelType as ModelType;
  const imageWidth = Number(params.imageWidth) || 1;
  const imageHeight = Number(params.imageHeight) || 1;
  const detections: Detection[] = JSON.parse(params.detections || "[]");
  const top: Detection | null =
    detections.length > 0
      ? detections.reduce((best, d) => (d.confidence > best.confidence ? d : best))
      : null;

  const language = useLanguage();
  const { location } = useUserLocation();
  const createIncident = useMutation(api.incidents.createIncident);
  const { width: screenWidth } = useWindowDimensions();

  const [answers, setAnswers] = useState<Answers>({});
  const [triage, setTriage] = useState<TriageResult | null>(null);
  const [kitAvailable, setKitAvailable] = useState<boolean | null>(null);
  const [requestingGuidance, setRequestingGuidance] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await getTriage(modelType, top?.class_name ?? null, top?.confidence ?? null, answers, language);
      if (cancelled) return;
      if (result.ok) {
        setTriage(result.data);
      } else {
        console.warn("[SANKET] triage unavailable:", result.error);
        setError(t(language, "errGuidanceOffline"));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(answers), language]);

  const answerYesNo = (key: FollowUpQuestion["key"], value: boolean) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const getInstructions = async () => {
    setRequestingGuidance(true);
    setError(null);

    const result = await getGuidance(
      modelType,
      top?.class_name ?? null,
      top?.confidence ?? null,
      answers,
      kitAvailable,
      language,
    );

    if (!result.ok) {
      console.warn("[SANKET] guidance unavailable:", result.error);
      setRequestingGuidance(false);
      setError(t(language, "errGuidanceOffline"));
      return;
    }

    // Best-effort: also file this through the existing incident/dispatch
    // system, same as the rest of the report flow — but this must never
    // block showing first-aid guidance (which has to work even offline).
    // The saved report keeps what the model saw + the guidance shown, so it
    // can be re-opened later from Profile > My reports. We wait briefly for
    // the id (so "View on Map" works) but never longer than 3 s — offline the
    // mutation just stays queued and syncs when the connection returns.
    let incidentId: string | undefined;
    try {
      incidentId = await Promise.race([
        createIncident({
          lat: location.lat,
          lng: location.lng,
          type,
          severity: result.data.triage.urgency === "unable_to_determine" ? "low" : result.data.triage.urgency,
          detectedClass: top?.class_name,
          confidence: top?.confidence,
          urgency: result.data.triage.urgency,
          detectedBy: params.detectedBy,
          language,
          guidance: JSON.stringify(result.data.guidance),
        }),
        new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 3000)),
      ]);
    } catch (e) {
      console.warn("[SANKET] couldn't save report:", e);
    }

    setRequestingGuidance(false);
    router.replace({
      pathname: "/(citizen)/report/first-aid",
      params: {
        type,
        guidance: JSON.stringify(result.data.guidance),
        ...(incidentId ? { incidentId } : {}),
      },
    });
  };

  const retake = () => router.back();

  const urgencyStyle = URGENCY_STYLE[triage?.urgency ?? "unable_to_determine"];
  const displayHeight = 260;
  const displayWidth = screenWidth - spacing.lg * 2;
  const box = top ? scaleBox(top.bbox, imageWidth, imageHeight, displayWidth, displayHeight) : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} nestedScrollEnabled>
      <ScreenHeader title={t(language, "visualResult")} showBack={false} />

      <View style={styles.content}>
        <Card style={styles.imageCard}>
          <View style={{ width: displayWidth, height: displayHeight }}>
            <Image
              source={{ uri: params.imageUri }}
              style={{ width: displayWidth, height: displayHeight, borderRadius: radius.lg }}
              resizeMode="contain"
            />
            {box && (
              <View
                style={[
                  styles.bbox,
                  { left: box.left, top: box.top, width: box.width, height: box.height },
                ]}
              />
            )}
          </View>
        </Card>

        {top ? (
          <Card style={styles.detectionCard}>
            <Text style={typography.caption}>{t(language, "detected")}</Text>
            <Text style={styles.className}>{className(language, top.class_name)}</Text>
            <Text style={styles.confidence}>
              {t(language, "modelConfidence")}: {Math.round(top.confidence * 100)}%
            </Text>
            <Text style={styles.confidenceNote}>{t(language, "confidenceNote")}</Text>
            {params.detectedBy ? (
              <Text style={styles.detectedBy}>
                {t(language, params.detectedBy === "on-device" ? "detectedOnDevice" : "detectedOnServer")}
              </Text>
            ) : null}
          </Card>
        ) : (
          <Card style={styles.detectionCard}>
            <Text style={styles.className}>{t(language, "noDetectionTitle")}</Text>
            <Text style={styles.confidenceNote}>{t(language, "noDetectionBody")}</Text>
          </Card>
        )}

        <View style={[styles.urgencyBanner, { backgroundColor: urgencyStyle.bg }]}>
          <Text style={styles.urgencyLabel}>{t(language, urgencyStyle.labelKey)}</Text>
          <Text style={styles.urgencyDisclaimer}>
            {triage?.disclaimer ?? t(language, "disclaimerDefault")}
          </Text>
        </View>

        {triage && triage.pending_questions.length > 0 && (
          <Card style={styles.questionsCard}>
            <Text style={typography.h3}>{t(language, "quickQuestions")}</Text>
            {triage.pending_questions
              .filter((q) => q.type === "yes_no")
              .map((q) => (
                <View key={q.key} style={styles.questionRow}>
                  <Text style={styles.questionText}>{q.text}</Text>
                  <View style={styles.questionButtons}>
                    <Button title={t(language, "yes")} variant="outline" onPress={() => answerYesNo(q.key, true)} style={styles.yesNoButton} />
                    <Button title={t(language, "no")} variant="outline" onPress={() => answerYesNo(q.key, false)} style={styles.yesNoButton} />
                  </View>
                </View>
              ))}
          </Card>
        )}

        <Card style={styles.kitCard}>
          <Text style={typography.h3}>{t(language, "haveKit")}</Text>
          <View style={styles.questionButtons}>
            <Button
              title={t(language, "yes")}
              variant={kitAvailable === true ? "secondary" : "outline"}
              onPress={() => setKitAvailable(true)}
              style={styles.yesNoButton}
            />
            <Button
              title={t(language, "noKit")}
              variant={kitAvailable === false ? "secondary" : "outline"}
              onPress={() => setKitAvailable(false)}
              style={styles.yesNoButton}
            />
          </View>
        </Card>

        {error && (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        )}

        <Button
          title={t(language, requestingGuidance ? "gettingInstructions" : "getInstructions")}
          onPress={getInstructions}
          loading={requestingGuidance}
          style={styles.actionButton}
        />
        <Button
          title={t(language, "retake")}
          variant="outline"
          onPress={retake}
          disabled={requestingGuidance}
        />
      </View>
    </ScrollView>
  );
}

function scaleBox(
  bbox: Detection["bbox"],
  imgW: number,
  imgH: number,
  containerW: number,
  containerH: number,
) {
  const imageAspect = imgW / imgH;
  const containerAspect = containerW / containerH;

  let renderedW: number;
  let renderedH: number;
  let offsetX: number;
  let offsetY: number;

  if (imageAspect > containerAspect) {
    renderedW = containerW;
    renderedH = containerW / imageAspect;
    offsetX = 0;
    offsetY = (containerH - renderedH) / 2;
  } else {
    renderedH = containerH;
    renderedW = containerH * imageAspect;
    offsetY = 0;
    offsetX = (containerW - renderedW) / 2;
  }

  const scale = renderedW / imgW;

  return {
    left: offsetX + bbox.x1 * scale,
    top: offsetY + bbox.y1 * scale,
    width: (bbox.x2 - bbox.x1) * scale,
    height: (bbox.y2 - bbox.y1) * scale,
  };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light },
  scrollContent: { flexGrow: 1, paddingBottom: spacing.xxl },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  imageCard: { padding: 0, overflow: "hidden", marginBottom: spacing.md, alignItems: "center" },
  bbox: {
    position: "absolute",
    borderWidth: 3,
    borderColor: colors.brightTeal,
    borderRadius: radius.sm,
  },
  detectionCard: { marginBottom: spacing.md },
  className: { ...typography.h2, marginTop: spacing.xs },
  confidence: { ...typography.body, marginTop: spacing.xs, fontWeight: "700" },
  confidenceNote: { ...typography.caption, marginTop: spacing.xs },
  detectedBy: { ...typography.caption, marginTop: spacing.sm, color: colors.teal, fontWeight: "700" },
  urgencyBanner: { borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  urgencyLabel: { color: colors.white, fontWeight: "800", fontSize: 13, letterSpacing: 1 },
  urgencyDisclaimer: { color: colors.white, marginTop: spacing.xs, fontSize: 13, lineHeight: 18 },
  questionsCard: { marginBottom: spacing.md },
  questionRow: { marginTop: spacing.md },
  questionText: { ...typography.body },
  questionButtons: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  yesNoButton: { flex: 1, minHeight: 44, paddingVertical: spacing.sm },
  kitCard: { marginBottom: spacing.md },
  errorCard: { backgroundColor: "#FDEDEE", marginBottom: spacing.md },
  errorText: { ...typography.body, color: colors.red },
  actionButton: { marginBottom: spacing.md },
});
