import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { TextField } from "@/components/ui/TextField";
import { colors, radius, spacing } from "@/constants/theme";
import { emergencyTypes, EmergencyType } from "@/data/firstAid";

export default function ReportEmergency() {
  const [type, setType] = useState<EmergencyType | null>(null);
  const [description, setDescription] = useState("");

  // Burn/injury/bleeding photos get real YOLO analysis; other types keep
  // the existing (mocked) classify flow, which this change doesn't touch.
  const hasVisualModel = type === "burn" || type === "injury" || type === "bleeding";

  const onContinue = () => {
    if (!type) return;
    router.push({
      pathname: hasVisualModel ? "/(citizen)/report/capture" : "/(citizen)/report/classify",
      params: { type, description },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader
        title="Report an Emergency"
        subtitle="Choose what's happening — we'll guide you instantly."
        showBack
      />

      <View style={styles.grid}>
        {emergencyTypes.map((option) => (
          <Pressable
            key={option.id}
            onPress={() => setType(option.id)}
            style={[styles.typeCard, type === option.id && styles.typeCardActive]}
          >
            <Text style={styles.typeEmoji}>{option.emoji}</Text>
            <Text style={[styles.typeLabel, type === option.id && styles.typeLabelActive]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextField
        label="Describe what happened (optional)"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        placeholder="e.g. Person fell off a bike, minor bleeding on the arm"
        style={styles.textarea}
      />

      <Button
        title="Continue"
        variant="danger"
        onPress={onContinue}
        disabled={!type}
        style={styles.continueButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light },
  content: { paddingBottom: spacing.xxl },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  typeCard: {
    width: "47%",
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: "center",
  },
  typeCardActive: { borderColor: colors.red, backgroundColor: "#FDEDEE" },
  typeEmoji: { fontSize: 28, marginBottom: spacing.xs },
  typeLabel: { fontWeight: "700", color: colors.navy, textAlign: "center" },
  typeLabelActive: { color: colors.red },
  textarea: { marginHorizontal: spacing.lg, marginTop: spacing.lg, minHeight: 90, textAlignVertical: "top" },
  continueButton: { marginHorizontal: spacing.lg, marginTop: spacing.md },
});
