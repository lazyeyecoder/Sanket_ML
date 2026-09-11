import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { api } from "@convex/_generated/api";
import OSMMap from "@components/OSMMap";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { useUserLocation } from "@/hooks/useUserLocation";

export default function ResponderHome() {
  const currentUser = useQuery(api.users.currentUser);
  const { location } = useUserLocation();
  const incidents = useQuery(api.incidents.listOpenIncidents);
  const acceptIncident = useMutation(api.incidents.acceptIncident);
  const setMyLocation = useMutation(api.responders.setMyLocation);

  const isVerified = currentUser?.verified === true;

  useEffect(() => {
    if (isVerified) {
      setMyLocation({ lat: location.lat, lng: location.lng }).catch(() => {});
    }
  }, [isVerified, location.lat, location.lng, setMyLocation]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={typography.caption}>Medical Officer</Text>
      <Text style={typography.h1}>{currentUser?.email ?? "Responder"}</Text>

      {!isVerified && (
        <Card style={styles.banner}>
          <Text style={styles.bannerTitle}>Verification required</Text>
          <Text style={styles.bannerBody}>
            You must verify your license before you can accept incidents.
          </Text>
          <Button
            title="Verify Now"
            onPress={() => router.push("/(responder)/verification")}
            style={styles.bannerButton}
          />
        </Card>
      )}

      <Card style={styles.mapCard}>
        <View style={styles.mapWrap}>
          <OSMMap
            center={[location.lat, location.lng]}
            markers={[
              { id: "me", lat: location.lat, lng: location.lng, color: "#1D7874", label: "You" },
              ...(incidents ?? []).map((incident) => ({
                id: incident._id,
                lat: incident.lat,
                lng: incident.lng,
                color: "#E63946",
                label: `${incident.type} · ${incident.severity}`,
              })),
            ]}
          />
        </View>
      </Card>

      <Text style={[typography.h2, styles.sectionTitle]}>Open Incidents</Text>
      {(incidents ?? []).length === 0 && (
        <Text style={typography.caption}>No open incidents right now.</Text>
      )}
      {(incidents ?? []).map((incident) => (
        <Card key={incident._id} style={styles.incidentCard}>
          <View style={styles.incidentRow}>
            <View style={{ flex: 1 }}>
              <Text style={typography.h3}>{incident.type}</Text>
              <Text style={styles.severity}>{incident.severity} severity</Text>
            </View>
            <Button
              title="Accept"
              variant="secondary"
              disabled={!isVerified}
              onPress={() => acceptIncident({ incidentId: incident._id })}
              style={styles.acceptButton}
            />
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  banner: { backgroundColor: "#FDEDEE", marginTop: spacing.md, marginBottom: spacing.md },
  bannerTitle: { ...typography.h3, color: colors.red },
  bannerBody: { ...typography.body, marginTop: spacing.xs },
  bannerButton: { marginTop: spacing.md },
  mapCard: { padding: 0, overflow: "hidden", marginTop: spacing.md },
  mapWrap: { height: 200, borderRadius: radius.lg, overflow: "hidden" },
  sectionTitle: { marginTop: spacing.xl, marginBottom: spacing.md },
  incidentCard: { marginBottom: spacing.md },
  incidentRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  severity: { ...typography.caption, marginTop: spacing.xs, textTransform: "capitalize" },
  acceptButton: { paddingHorizontal: spacing.md, minHeight: 44 },
});
