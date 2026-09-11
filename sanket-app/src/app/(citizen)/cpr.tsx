import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { Animated, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { colors, radius, spacing, typography } from "@/constants/theme";

const BPM = 110;
const BEAT_MS = Math.round(60000 / BPM);

const STEPS = [
  "Call for emergency help before starting.",
  "Lay the person on their back on a firm surface.",
  "Kneel beside their chest, place the heel of one hand on the center of the chest.",
  "Place your other hand on top and interlock fingers.",
  "Push hard and fast — at least 2 inches deep, 100–120 compressions/min.",
  "Let the chest fully recoil between compressions. Do not stop until help arrives.",
];

export default function CPRGuide() {
  const [running, setRunning] = useState(false);
  const [beatCount, setBeatCount] = useState(0);
  const [scale] = useState(() => new Animated.Value(1));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pulse = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.35, duration: 120, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: BEAT_MS - 120, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setBeatCount((c) => c + 1);
  };

  const start = () => {
    setRunning(true);
    setBeatCount(0);
    pulse();
    intervalRef.current = setInterval(pulse, BEAT_MS);
  };

  const stop = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    scale.setValue(1);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="CPR Guide" subtitle="Hands-only CPR at 110 beats per minute" />

      <Card style={styles.metronomeCard}>
        <Animated.View style={[styles.pulseDot, { transform: [{ scale }] }]} />
        <Text style={styles.bpmText}>{BPM} BPM</Text>
        <Text style={typography.caption}>{running ? `Beat ${beatCount}` : "Ready"}</Text>
        <Button
          title={running ? "Stop" : "Start"}
          variant={running ? "outline" : "danger"}
          onPress={running ? stop : start}
          style={styles.startButton}
        />
      </Card>

      <Text style={[typography.h2, styles.sectionTitle]}>Steps</Text>
      {STEPS.map((step, index) => (
        <View key={index} style={styles.stepRow}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>{index + 1}</Text>
          </View>
          <Text style={[typography.body, styles.stepText]}>{step}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light },
  content: { paddingBottom: spacing.xxl },
  metronomeCard: { margin: spacing.lg, alignItems: "center", paddingVertical: spacing.xl },
  pulseDot: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.red,
    marginBottom: spacing.md,
  },
  bpmText: { fontSize: 28, fontWeight: "800", color: colors.navy },
  startButton: { marginTop: spacing.lg, minWidth: 160 },
  sectionTitle: { marginHorizontal: spacing.lg, marginBottom: spacing.md },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: { color: colors.white, fontWeight: "800" },
  stepText: { flex: 1 },
});
