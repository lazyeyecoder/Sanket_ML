import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";

import { colors, radius, spacing } from "@/constants/theme";

type Variant = "primary" | "secondary" | "outline" | "danger";

export function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "outline" ? colors.teal : colors.white} />
      ) : (
        <Text style={[styles.text, textVariantStyles[variant]]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  text: { fontSize: 16, fontWeight: "700" },
});

const variantStyles: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: colors.red },
  secondary: { backgroundColor: colors.teal },
  outline: { backgroundColor: "transparent", borderWidth: 2, borderColor: colors.teal },
  danger: { backgroundColor: colors.red },
};

const textVariantStyles: Record<Variant, { color: string }> = {
  primary: { color: colors.white },
  secondary: { color: colors.white },
  outline: { color: colors.teal },
  danger: { color: colors.white },
};
