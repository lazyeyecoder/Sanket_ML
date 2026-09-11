export const colors = {
  navy: "#0B2545",
  teal: "#1D7874",
  brightTeal: "#2EC4B6",
  red: "#E63946",
  light: "#EAF2F1",
  white: "#FFFFFF",
  black: "#111111",
  gray: "#6B7A8F",
  border: "#D7E4E2",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
  full: 999,
} as const;

export const typography = {
  h1: { fontSize: 30, fontWeight: "800" as const, color: colors.navy },
  h2: { fontSize: 22, fontWeight: "700" as const, color: colors.navy },
  h3: { fontSize: 18, fontWeight: "700" as const, color: colors.navy },
  body: { fontSize: 15, fontWeight: "400" as const, color: colors.navy },
  caption: { fontSize: 13, fontWeight: "500" as const, color: colors.gray },
};
