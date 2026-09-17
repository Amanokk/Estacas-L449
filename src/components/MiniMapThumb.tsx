import { googleStaticMapUrl } from "@/lib/googleMaps";
import type { LatLng } from "@/lib/geo";
import type { CSSProperties } from "react";

export function MiniMapThumb({
  center,
  className,
  style,
  size = 160,
}: {
  center: LatLng;
  className?: string;
  style?: CSSProperties;
  size?: number;
}) {
  return (
    <img
      src={googleStaticMapUrl(center.lat, center.lng, size)}
      alt="Mapa da localização"
      width={size}
      height={size}
      className={className}
      style={style}
      decoding="async"
    />
  );
}
