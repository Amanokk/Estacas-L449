import { STREETS, type Street } from "@/data/streets";
import { projectOnPolyline, pointAtChainage, type LatLng } from "@/lib/geo";
import { stakeAtChainage } from "@/lib/stakes";
import { getGeometries } from "@/lib/stakePoints";
import { getStreetBoxes } from "@/lib/stakeIndex";

export const PROJECT_CENTER: LatLng = { lat: -22.7524, lng: -42.8935 };

const DEG = 1 / 111320;

export type Match = {
  street: Street;
  chainage: number;
  distance: number;
  estaca: number;
  offset: number;
  snapped: LatLng;
};

export function findNearestStake(pos: LatLng, maxDist = 60): Match | null {
  const geoms = getGeometries();
  const pad = maxDist * DEG * 1.5;
  let best: Match | null = null;
  for (const box of getStreetBoxes()) {
    if (
      pos.lat < box.south - pad ||
      pos.lat > box.north + pad ||
      pos.lng < box.west - pad ||
      pos.lng > box.east + pad
    )
      continue;
    const { street, length } = geoms[box.index];
    const r = projectOnPolyline(pos, street.path);
    if (!r || r.distance > maxDist) continue;
    if (best !== null && r.distance >= best.distance) continue;
    const { number, offset } = stakeAtChainage(street, r.chainage, length);
    const snapped = pointAtChainage(street.path, r.chainage) ?? pos;
    best = { street, chainage: r.chainage, distance: r.distance, estaca: number, offset, snapped };
  }
  return best;
}

export function quantize(p: LatLng): string {
  return `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`;
}

export function streetByName(name: string): Street | undefined {
  return STREETS.find((s) => s.name === name);
}
