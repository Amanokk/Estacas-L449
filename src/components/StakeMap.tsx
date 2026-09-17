import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { LatLng } from "@/lib/geo";
import { haversine } from "@/lib/geo";
import { STREETS } from "@/data/streets";
import { stakesInRect } from "@/lib/stakeIndex";
import { PROJECT_CENTER, type Match } from "@/lib/findStake";
import { GOOGLE_HYBRID_TILES } from "@/lib/googleMaps";

const LABEL_MIN_ZOOM = 18;
const STAKE_MIN_ZOOM = 16;
const MAX_VISIBLE_STAKES = 90;

type Props = {
  position: LatLng | null;
  accuracy: number | null;
  match: Match | null;
  follow: boolean;
  onUserDrag: () => void;
  recenterNonce: number;
};

export function StakeMap({ position, accuracy, match, follow, onUserDrag, recenterNonce }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const LRef = useRef<typeof import("leaflet") | null>(null);
  const streetsLayerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const highlightRef = useRef<import("leaflet").Polyline | null>(null);
  const balloonRef = useRef<import("leaflet").Marker | null>(null);
  const userRef = useRef<import("leaflet").CircleMarker | null>(null);
  const accRef = useRef<import("leaflet").Circle | null>(null);
  const stakeLayerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const lastCenterRef = useRef<LatLng | null>(null);
  const followRef = useRef(follow);
  followRef.current = follow;

  useEffect(() => {
    if (!hostRef.current || mapRef.current) return;
    let cancelled = false;

    void import("leaflet").then((mod) => {
      if (cancelled || !hostRef.current || mapRef.current) return;
      const L = mod.default;
      LRef.current = L;

      const map = L.map(hostRef.current, {
        center: [PROJECT_CENTER.lat, PROJECT_CENTER.lng],
        zoom: 18,
        zoomControl: false,
        attributionControl: false,
      });
      L.control.zoom({ position: "topleft" }).addTo(map);

      L.tileLayer(GOOGLE_HYBRID_TILES, {
        subdomains: ["0", "1", "2", "3"],
        maxZoom: 21,
        maxNativeZoom: 21,
        attribution: "Google",
      }).addTo(map);

      const streets = L.layerGroup().addTo(map);
      for (const s of STREETS) {
        L.polyline(
          s.path.map((p) => [p.lat, p.lng] as [number, number]),
          { color: "#38bdf8", weight: 3, opacity: 0.85, interactive: false },
        ).addTo(streets);
      }
      streetsLayerRef.current = streets;
      stakeLayerRef.current = L.layerGroup().addTo(map);

      map.on("dragstart", () => onUserDrag());

      const renderStakes = () => {
        const layer = stakeLayerRef.current;
        if (!layer) return;
        layer.clearLayers();
        const bounds = map.getBounds();
        const zoom = map.getZoom();
        if (zoom < STAKE_MIN_ZOOM) return;
        const showLabel = zoom >= LABEL_MIN_ZOOM;
        const visible = stakesInRect(
          {
            south: bounds.getSouth(),
            west: bounds.getWest(),
            north: bounds.getNorth(),
            east: bounds.getEast(),
          },
          MAX_VISIBLE_STAKES,
        );
        for (const st of visible) {
          const m = L.circleMarker([st.pos.lat, st.pos.lng], {
            radius: showLabel ? 7 : 4,
            color: "#0f172a",
            weight: 1.5,
            fillColor: "#f8fafc",
            fillOpacity: 0.95,
            interactive: false,
          });
          if (showLabel) {
            m.bindTooltip(`E-${st.number}`, {
              permanent: true,
              direction: "top",
              offset: [0, -8],
              className: "stake-label",
            });
          }
          m.addTo(layer);
        }
      };

      map.on("moveend", renderStakes);
      map.on("zoomend", renderStakes);
      renderStakes();
      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L || !position) return;
    if (!userRef.current) {
      userRef.current = L.circleMarker([position.lat, position.lng], {
        radius: 8,
        color: "#0f172a",
        weight: 2,
        fillColor: "#22d3ee",
        fillOpacity: 1,
        interactive: false,
      }).addTo(map);
      map.setView([position.lat, position.lng], map.getZoom());
      lastCenterRef.current = position;
    } else {
      userRef.current.setLatLng([position.lat, position.lng]);
      const last = lastCenterRef.current;
      if (followRef.current && (!last || haversine(last, position) > 8)) {
        map.panTo([position.lat, position.lng]);
        lastCenterRef.current = position;
      }
    }
    if (accuracy) {
      if (!accRef.current) {
        accRef.current = L.circle([position.lat, position.lng], {
          radius: accuracy,
          color: "#22d3ee",
          weight: 1,
          opacity: 0.4,
          fillColor: "#22d3ee",
          fillOpacity: 0.12,
          interactive: false,
        }).addTo(map);
      } else {
        accRef.current.setLatLng([position.lat, position.lng]);
        accRef.current.setRadius(accuracy);
      }
    }
  }, [position, accuracy]);

  useEffect(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;
    if (!match) {
      highlightRef.current?.remove();
      highlightRef.current = null;
      balloonRef.current?.remove();
      balloonRef.current = null;
      return;
    }
    const path = match.street.path.map((p) => [p.lat, p.lng] as [number, number]);
    if (!highlightRef.current) {
      highlightRef.current = L.polyline(path, {
        color: "#f5c518",
        weight: 5,
        opacity: 1,
        interactive: false,
      }).addTo(map);
    } else {
      highlightRef.current.setLatLngs(path);
    }

    const text = `E-${match.estaca}`;
    const icon = L.divIcon({
      className: "stake-balloon",
      html: `<div class="stake-balloon-inner">${text}</div>`,
      iconSize: [88, 44],
      iconAnchor: [44, 44],
    });
    if (!balloonRef.current) {
      balloonRef.current = L.marker([match.snapped.lat, match.snapped.lng], {
        icon,
        interactive: false,
        zIndexOffset: 900,
      }).addTo(map);
    } else {
      balloonRef.current.setLatLng([match.snapped.lat, match.snapped.lng]);
      balloonRef.current.setIcon(icon);
    }
  }, [match]);

  useEffect(() => {
    if (!recenterNonce) return;
    const map = mapRef.current;
    if (!map || !position) return;
    map.panTo([position.lat, position.lng]);
    lastCenterRef.current = position;
  }, [recenterNonce, position]);

  return <div ref={hostRef} className="absolute inset-0 z-0 bg-bg" />;
}
