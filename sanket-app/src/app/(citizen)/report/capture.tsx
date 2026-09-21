import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { EmergencyType } from "@/data/firstAid";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/i18n";
import { analyzeImage, Detection, ModelType } from "@/lib/ml-client";
import { detectOnDevice, ON_DEVICE_SUPPORTED } from "@/lib/ondevice";

// injury/bleeding both go to the wound model; burn goes to the burn model.
// (report/index.tsx only routes here for these three types — see there.)
function modelForType(type: EmergencyType): ModelType {
  return type === "burn" ? "burn" : "wound";
}

export default function Capture() {
  const params = useLocalSearchParams<{ type: string; description?: string }>();
  const type = (params.type ?? "injury") as EmergencyType;
  const modelType = modelForType(type);
  const language = useLanguage();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const capture = async (fromCamera: boolean) => {
    setError(null);
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError(t(language, fromCamera ? "errCameraPermission" : "errLibraryPermission"));
      return;
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ["images"],
      quality: 0.7,
      base64: true,
    };

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset.base64) {
      setError(t(language, "errReadImage"));
      return;
    }

    setImageUri(asset.uri);
    setAnalyzing(true);

    // Detection runs on the phone first (no network needed). The server is
    // only a fallback if on-device isn't available (web) or fails.
    let detections: Detection[] | null = null;
    let width = asset.width;
    let height = asset.height;
    let detectedBy: "on-device" | "server" = "server";

    if (ON_DEVICE_SUPPORTED) {
      try {
        const local = await detectOnDevice(asset.uri, modelType);
        detections = local.detections;
        width = local.width;
        height = local.height;
        detectedBy = "on-device";
      } catch (e) {
        console.warn("[SANKET] on-device detection failed, falling back to server:", e);
      }
    }

    if (!detections) {
      const analysis = await analyzeImage(asset.base64, modelType);
      if (!analysis.ok) {
        setAnalyzing(false);
        setError(analysis.error);
        return;
      }
      detections = analysis.data.detections;
    }

    setAnalyzing(false);

    router.push({
      pathname: "/(citizen)/report/result",
      params: {
        type,
        description: params.description ?? "",
        modelType,
        imageUri: asset.uri,
        imageWidth: String(width),
        imageHeight: String(height),
        detections: JSON.stringify(detections),
        detectedBy,
      },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader
        title={t(language, type === "burn" ? "photographBurn" : "photographWound")}
        subtitle={t(language, "captureSubtitle")}
        showBack
      />

      <Card style={styles.previewCard}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>{t(language, "noPhotoYet")}</Text>
          </View>
        )}
      </Card>

      {analyzing && (
        <View style={styles.analyzingRow}>
          <ActivityIndicator color={colors.teal} />
          <Text style={styles.analyzingText}>{t(language, "analyzing")}</Text>
        </View>
      )}

      {error && (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      )}

      <Button
        title={t(language, "takePhoto")}
        onPress={() => capture(true)}
        disabled={analyzing}
        style={styles.button}
      />
      <Button
        title={t(language, "chooseGallery")}
        variant="outline"
        onPress={() => capture(false)}
        disabled={analyzing}
        style={styles.button}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  previewCard: { padding: 0, overflow: "hidden", marginBottom: spacing.lg },
  preview: { width: "100%", height: 260 },
  placeholder: {
    width: "100%",
    height: 260,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.border,
    borderRadius: radius.lg,
  },
  placeholderText: { ...typography.body, color: colors.gray },
  analyzingRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  analyzingText: { ...typography.body, color: colors.navy },
  errorCard: { backgroundColor: "#FDEDEE", marginBottom: spacing.md },
  errorText: { ...typography.body, color: colors.red },
  button: { marginBottom: spacing.md },
});
