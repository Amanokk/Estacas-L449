import { useEffect, useRef, useState } from "react";
import { haversine, type LatLng } from "@/lib/geo";

export type GeoState = {
  position: LatLng | null;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  error: string | null;
};

const MAX_ACCURACY_FIRST = 180;
const MAX_ACCURACY_KEEP = 90;
const MAX_SPEED = 35;

export function useGeolocation(enabled = true): GeoState {
  const [state, setState] = useState<GeoState>({
    position: null,
    accuracy: null,
    heading: null,
    speed: null,
    error: null,
  });

  const lastRef = useRef<{ pos: LatLng; acc: number; t: number } | null>(null);
  const lastEmitRef = useRef<{ pos: LatLng; t: number } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState((s) => ({ ...s, error: "Geolocalização não suportada neste navegador." }));
      return;
    }

    const apply = (pos: GeolocationPosition) => {
      const raw: LatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      const acc = Math.max(pos.coords.accuracy ?? 30, 1);
      const t = pos.timestamp || Date.now();
      const prev = lastRef.current;

      if (!prev && acc > MAX_ACCURACY_FIRST) return;
      if (prev && acc > MAX_ACCURACY_KEEP && acc > prev.acc * 1.8) return;

      let next = raw;
      let nextAcc = acc;

      if (prev) {
        const dt = Math.max((t - prev.t) / 1000, 0.001);
        const dist = haversine(prev.pos, raw);
        if (dist / dt > MAX_SPEED && acc >= prev.acc) return;

        if (acc <= 12) {
          next = raw;
          nextAcc = acc;
        } else {
          const predVar = prev.acc * prev.acc + dt * 12;
          const k = predVar / (predVar + acc * acc);
          const mix = acc < prev.acc ? Math.max(k, 0.55) : k;
          next = {
            lat: prev.pos.lat + mix * (raw.lat - prev.pos.lat),
            lng: prev.pos.lng + mix * (raw.lng - prev.pos.lng),
          };
          nextAcc = Math.sqrt((1 - mix) * predVar + mix * acc * acc);
        }
      }

      lastRef.current = { pos: next, acc: nextAcc, t };

      const emitted = lastEmitRef.current;
      const moved = emitted ? haversine(emitted.pos, next) : Infinity;
      if (emitted && t - emitted.t < 350 && moved < 0.6) return;
      lastEmitRef.current = { pos: next, t };

      setState({
        position: next,
        accuracy: Math.round(Math.min(nextAcc, acc) * 10) / 10,
        heading: pos.coords.heading,
        speed: pos.coords.speed,
        error: null,
      });
    };

    const onError = (err: GeolocationPositionError) => {
      setState((s) => ({ ...s, error: err.message || "Não foi possível obter o GPS." }));
    };

    const opts: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 800,
      timeout: 12000,
    };

    navigator.geolocation.getCurrentPosition(apply, onError, opts);
    const id = navigator.geolocation.watchPosition(apply, onError, opts);

    const kick = window.setInterval(() => {
      navigator.geolocation.getCurrentPosition(apply, () => undefined, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 8000,
      });
    }, 8000);

    return () => {
      navigator.geolocation.clearWatch(id);
      window.clearInterval(kick);
    };
  }, [enabled]);

  return state;
}
