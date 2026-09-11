import { useAuthActions } from "@convex-dev/auth/react";
import { Link, router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { colors, spacing, typography } from "@/constants/theme";

export default function SignUp() {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await signIn("password", { email: email.trim(), password, flow: "signUp" });
      router.replace("/(auth)/role-picker");
    } catch {
      setError("Could not create account. Try a different email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>SANKET</Text>
        <Text style={styles.tagline}>AI-powered first aid & emergency response</Text>

        <View style={styles.form}>
          <Text style={typography.h2}>Create your account</Text>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="At least 8 characters"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title="Sign Up" onPress={onSubmit} loading={loading} />
          <View style={styles.footerRow}>
            <Text style={typography.body}>Already have an account? </Text>
            <Link href="/(auth)/sign-in" style={styles.link}>
              Sign in
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.navy },
  container: { flexGrow: 1, justifyContent: "center", padding: spacing.xl },
  logo: {
    fontSize: 36,
    fontWeight: "900",
    color: colors.white,
    textAlign: "center",
    letterSpacing: 2,
  },
  tagline: {
    color: colors.brightTeal,
    textAlign: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  form: {
    backgroundColor: colors.light,
    borderRadius: 24,
    padding: spacing.lg,
  },
  error: { color: colors.red, marginBottom: spacing.sm },
  footerRow: { flexDirection: "row", justifyContent: "center", marginTop: spacing.lg },
  link: { color: colors.teal, fontWeight: "700" },
});
