import { useMutation } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import { api } from "@convex/_generated/api";
import { colors, spacing, typography } from "@/constants/theme";
import { classifyEmergency } from "@/data/firstAid";
import { useUserLocation } from "@/hooks/useUserLocation";

export default function Classify() {
  const params = useLocalSearchParams<{ type: string; description?: string }>();
  const createIncident = useMutation(api.incidents.createIncident);
  const { location } = useUserLocation();
  const [statusText, setStatusText] = useState("Analyzing symptoms…");
  const [spin] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [spin]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const { emergencyType, severity } = classifyEmergency(
        params.type ?? "general",
        params.description ?? "",
      );

      await wait(700);
      if (cancelled) return;
      setStatusText("Cross-checking with first-aid database…");

      await wait(700);
      if (cancelled) return;
      setStatusText(`Classified as ${emergencyType} · ${severity} severity`);

      const incidentId = await createIncident({
        lat: location.lat,
        lng: location.lng,
        type: emergencyType,
        severity,
      });

      await wait(500);
      if (cancelled) return;
      router.replace({
        pathname: "/(citizen)/report/first-aid",
        params: { incidentId, type: emergencyType },
      });
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.spinner, { transform: [{ rotate }] }]} />
      <Text style={styles.title}>AI Classifying…</Text>
      <Text style={styles.subtitle}>{statusText}</Text>
      <Text style={styles.mockNote}>(Mocked — a real model would run here)</Text>
    </View>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  spinner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 6,
    borderColor: colors.brightTeal,
    borderTopColor: "transparent",
    marginBottom: spacing.xl,
  },
  title: { ...typography.h1, color: colors.white, marginBottom: spacing.sm },
  subtitle: { color: colors.light, textAlign: "center" },
  mockNote: { color: colors.gray, marginTop: spacing.lg, fontSize: 12 },
});
