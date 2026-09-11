import { useQuery } from "convex/react";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import OSMMap from "@components/OSMMap";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { colors, spacing, typography } from "@/constants/theme";

export default function IncidentMap() {
  const params = useLocalSearchParams<{ incidentId: string }>();
  const incident = useQuery(api.incidents.getIncident, {
    incidentId: params.incidentId as Id<"incidents">,
  });
  const responders = useQuery(
    api.responders.listNearbyResponders,
    incident ? { lat: incident.lat, lng: incident.lng, radiusMeters: 5000 } : "skip",
  );

  if (!incident) {
    return (
      <View style={styles.center}>
        <Text style={typography.body}>Loading incident…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Incident Location" subtitle="500 m response radius" showBack />
      <View style={styles.mapWrap}>
        <OSMMap
          center={[incident.lat, incident.lng]}
          radiusMeters={500}
          markers={[
            {
              id: "incident",
              lat: incident.lat,
              lng: incident.lng,
              color: "#E63946",
              label: `${incident.type} · ${incident.severity}`,
            },
            ...(responders ?? []).map((r) => ({
              id: r._id,
              lat: r.lat,
              lng: r.lng,
              color: "#1D7874",
              label: "Nearby responder",
            })),
          ]}
        />
      </View>
      <Text style={styles.caption}>
        {(responders ?? []).length} verified responder(s) within 5 km
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  mapWrap: { flex: 1, marginHorizontal: spacing.lg, borderRadius: 16, overflow: "hidden" },
  caption: { ...typography.caption, textAlign: "center", padding: spacing.md },
});
