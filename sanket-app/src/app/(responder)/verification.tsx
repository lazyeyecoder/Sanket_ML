import { useMutation, useQuery } from "convex/react";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { colors, radius, spacing, typography } from "@/constants/theme";

export default function Verification() {
  const currentUser = useQuery(api.users.currentUser);
  const submitVerification = useMutation(api.users.submitVerification);
  const approveVerification = useMutation(api.users.approveVerification);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const approveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const status = currentUser?.verificationStatus ?? "none";

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.6,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const submit = async () => {
    await submitVerification({});
    // Mocked review: in production this is a manual back-office approval step.
    approveTimer.current = setTimeout(() => {
      approveVerification({}).catch(() => {});
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (approveTimer.current) clearTimeout(approveTimer.current);
    };
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="License Verification" subtitle="Required to accept incidents" />

      <Card>
        <Text style={typography.h3}>Status</Text>
        <View style={[styles.statusPill, statusStyles[status]]}>
          <Text style={styles.statusText}>{status.toUpperCase()}</Text>
        </View>

        {status !== "approved" && (
          <>
            <Text style={[typography.body, styles.instructions]}>
              Upload a photo of your medical license or ID to get verified.
            </Text>

            {imageUri && <Image source={{ uri: imageUri }} style={styles.preview} />}

            <Button title="Choose Photo" variant="outline" onPress={pickImage} style={styles.pickButton} />
            <Button
              title={status === "pending" ? "Pending review…" : "Submit for Review"}
              onPress={submit}
              disabled={!imageUri || status === "pending"}
              style={styles.submitButton}
            />
            {status === "pending" && (
              <Text style={styles.mockNote}>
                (Mocked — automatically approves in a few seconds to demo the flow)
              </Text>
            )}
          </>
        )}

        {status === "approved" && (
          <Text style={[typography.body, styles.approvedText]}>
            ✅ You&apos;re verified and can accept incidents.
          </Text>
        )}
      </Card>
    </ScrollView>
  );
}

const statusStyles = StyleSheet.create({
  none: { backgroundColor: colors.border },
  pending: { backgroundColor: "#FCEFC7" },
  approved: { backgroundColor: "#D8F3E8" },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  statusPill: {
    alignSelf: "flex-start",
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  statusText: { fontWeight: "800", fontSize: 12, color: colors.navy },
  instructions: { marginBottom: spacing.md },
  preview: { width: "100%", height: 180, borderRadius: radius.md, marginBottom: spacing.md },
  pickButton: { marginBottom: spacing.sm },
  submitButton: { marginTop: spacing.xs },
  mockNote: { ...typography.caption, marginTop: spacing.sm },
  approvedText: { marginTop: spacing.sm },
});
