import * as Location from "expo-location";
import { useEffect, useState } from "react";

export type LatLng = { lat: number; lng: number };

// Fallback center used until permission is granted / location resolves.
export const DEFAULT_LOCATION: LatLng = { lat: 19.2183, lng: 72.9781 };

export function useUserLocation() {
  const [location, setLocation] = useState<LatLng>(DEFAULT_LOCATION);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          if (!cancelled) setLoading(false);
          return;
        }
        const position = await Location.getCurrentPositionAsync({});
        if (!cancelled) {
          setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
          setPermissionGranted(true);
        }
      } catch {
        // Keep the default fallback location.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { location, permissionGranted, loading };
}
