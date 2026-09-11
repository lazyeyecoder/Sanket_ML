import { useQuery } from "convex/react";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { api } from "@convex/_generated/api";
import OSMMap from "@components/OSMMap";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { useUserLocation } from "@/hooks/useUserLocation";

export default function CitizenHome() {
  const currentUser = useQuery(api.users.currentUser);
  const { location } = useUserLocation();
  const nearbyIncidents = useQuery(api.incidents.listNearbyIncidents, {
    lat: location.lat,
    lng: location.lng,
    radiusMeters: 5000,
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={typography.caption}>Welcome{currentUser?.email ? "," : ""}</Text>
      <Text style={typography.h1}>{currentUser?.email ?? "Citizen"}</Text>

      <Button
        title="🚨  Report Emergency"
        variant="danger"
        onPress={() => router.push("/(citizen)/report")}
        style={styles.reportButton}
      />

      <View style={styles.quickRow}>
        <Card style={styles.quickCard} onPress={() => router.push("/(citizen)/report")}>
          <Text style={styles.quickEmoji}>🩹</Text>
          <Text style={typography.h3}>Injury Guidance</Text>
          <Text style={styles.quickDesc}>Step-by-step first aid</Text>
        </Card>
        <Card style={styles.quickCard} onPress={() => router.push("/(citizen)/cpr")}>
          <Text style={styles.quickEmoji}>❤️</Text>
          <Text style={typography.h3}>CPR Guide</Text>
          <Text style={styles.quickDesc}>Hands-only, 110 BPM</Text>
        </Card>
      </View>

      <Text style={[typography.h2, styles.sectionTitle]}>Nearby</Text>
      <Card style={styles.mapCard}>
        <View style={styles.mapWrap}>
          <OSMMap
            center={[location.lat, location.lng]}
            markers={[
              { id: "me", lat: location.lat, lng: location.lng, color: "#1D7874", label: "You" },
              ...(nearbyIncidents ?? []).map((incident) => ({
                id: incident._id,
                lat: incident.lat,
                lng: incident.lng,
                color: "#E63946",
                label: `${incident.type} (${incident.severity})`,
              })),
            ]}
          />
        </View>
      </Card>
      <Text style={styles.mapCaption}>
        {(nearbyIncidents ?? []).length} active incident(s) nearby
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  reportButton: { marginTop: spacing.lg, marginBottom: spacing.lg, minHeight: 64 },
  quickRow: { flexDirection: "row", gap: spacing.md },
  quickCard: { flex: 1 },
  quickEmoji: { fontSize: 28, marginBottom: spacing.xs },
  quickDesc: { ...typography.caption, marginTop: spacing.xs },
  sectionTitle: { marginTop: spacing.xl, marginBottom: spacing.md },
  mapCard: { padding: 0, overflow: "hidden" },
  mapWrap: { height: 220, borderRadius: radius.lg, overflow: "hidden" },
  mapCaption: { ...typography.caption, marginTop: spacing.sm, textAlign: "center" },
});
