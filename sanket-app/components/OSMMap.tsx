import { useEffect, useRef } from "react";
import { WebView } from "react-native-webview";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  color?: string;
  label?: string;
};

type Props = {
  center: [number, number];
  markers?: MapMarker[];
  radiusMeters?: number;
  zoom?: number;
  style?: object;
};

const DEFAULT_CENTER: [number, number] = [19.2183, 72.9781];

const html = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#map{height:100%;margin:0}</style>
</head><body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  const map = L.map('map').setView([${DEFAULT_CENTER[0]}, ${DEFAULT_CENTER[1]}], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '© OpenStreetMap'
  }).addTo(map);

  let markerLayer = L.layerGroup().addTo(map);
  let circleLayer = null;

  function applyState(state) {
    if (state.center) {
      map.setView(state.center, state.zoom || map.getZoom());
    }
    markerLayer.clearLayers();
    (state.markers || []).forEach(function (m) {
      const marker = L.circleMarker([m.lat, m.lng], {
        radius: 9,
        color: m.color || '#0B2545',
        fillColor: m.color || '#0B2545',
        fillOpacity: 0.9,
        weight: 2,
      }).addTo(markerLayer);
      if (m.label) marker.bindPopup(m.label);
    });
    if (circleLayer) {
      map.removeLayer(circleLayer);
      circleLayer = null;
    }
    if (state.radiusMeters && state.center) {
      circleLayer = L.circle(state.center, {
        radius: state.radiusMeters,
        color: '#E63946',
        fillColor: '#E63946',
        fillOpacity: 0.08,
      }).addTo(map);
    }
  }

  document.addEventListener('message', function (e) { handleMessage(e.data); });
  window.addEventListener('message', function (e) { handleMessage(e.data); });
  function handleMessage(raw) {
    try {
      applyState(JSON.parse(raw));
    } catch (err) {}
  }
</script></body></html>`;

export default function OSMMap({ center, markers = [], radiusMeters, zoom = 14, style }: Props) {
  const webviewRef = useRef<WebView>(null);

  const state = JSON.stringify({ center, markers, radiusMeters, zoom });

  useEffect(() => {
    webviewRef.current?.postMessage(state);
  }, [state]);

  return (
    <WebView
      ref={webviewRef}
      originWhitelist={["*"]}
      source={{ html }}
      style={[{ flex: 1 }, style]}
      onLoadEnd={() => webviewRef.current?.postMessage(state)}
    />
  );
}
