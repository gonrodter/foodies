"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import Map, { Marker, MapRef } from "react-map-gl";
import useSupercluster from "use-supercluster";
import type { BBox } from "geojson";
import { getPlacesWithStats, useStore } from "@/lib/store";
import { PlaceWithStats, CATEGORY_EMOJI } from "@/lib/types";
import styles from "./FoodMap.module.css";

const SEVILLE = { longitude: -5.9925, latitude: 37.3905, zoom: 14 };
const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

type PointProps = { cluster: false; place: PlaceWithStats };
type ClusterProps = { cluster: true; point_count: number };

export default function FoodMap() {
  const mapRef = useRef<MapRef>(null);
  const [bounds, setBounds] = useState<BBox>();
  const [zoom, setZoom] = useState(SEVILLE.zoom);
  const [selected, setSelected] = useState<PlaceWithStats | null>(null);

  useStore();
  const places = getPlacesWithStats();

  const points = useMemo(
    () =>
      places.map((p) => ({
        type: "Feature" as const,
        properties: { cluster: false as const, place: p },
        geometry: { type: "Point" as const, coordinates: [p.lng, p.lat] },
      })),
    [places]
  );

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom,
    options: { radius: 60, maxZoom: 18 },
  });

  const flyTo = (lng: number, lat: number, z: number) =>
    mapRef.current?.flyTo({ center: [lng, lat], zoom: z, duration: 600 });

  if (!TOKEN) {
    return (
      <div className={styles.tokenWarning}>
        <p>
          Add <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> to <code>.env.local</code> to
          load the map.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <Map
        ref={mapRef}
        initialViewState={{ ...SEVILLE, pitch: 55, bearing: -18 }}
        mapStyle="mapbox://styles/mapbox/standard"
        mapboxAccessToken={TOKEN}
        maxPitch={70}
        onLoad={(e) => {
          const b = e.target.getBounds();
          if (b) setBounds(b.toArray().flat() as BBox);
        }}
        onMoveEnd={(e) => {
          const b = e.target.getBounds();
          if (b) setBounds(b.toArray().flat() as BBox);
          setZoom(e.viewState.zoom);
        }}
        onClick={() => setSelected(null)}
        style={{ width: "100%", height: "100%" }}
      >
        {clusters.map((c) => {
          const [lng, lat] = c.geometry.coordinates;
          const props = c.properties as PointProps | ClusterProps;

          if ("cluster" in props && props.cluster) {
            const count = (props as ClusterProps).point_count;
            const size = 42 + Math.min(count, 8) * 4;
            return (
              <Marker key={`cluster-${c.id}`} longitude={lng} latitude={lat}>
                <button
                  className={styles.cluster}
                  style={{ width: size, height: size }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const z = Math.min(
                      supercluster!.getClusterExpansionZoom(c.id as number),
                      18
                    );
                    flyTo(lng, lat, z);
                  }}
                >
                  {count}
                  <span className={styles.clusterPlus}>+</span>
                </button>
              </Marker>
            );
          }

          const place = (props as PointProps).place;
          const active = selected?.id === place.id;
          return (
            <Marker key={place.id} longitude={lng} latitude={lat}>
              <button
                className={`${styles.pin} ${active ? styles.pinActive : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(place);
                  flyTo(lng, lat, Math.max(zoom, 15));
                }}
              >
                <span className={styles.pinEmoji}>
                  {CATEGORY_EMOJI[place.category]}
                </span>
                <span className={styles.pinCheck}>✓</span>
              </button>
            </Marker>
          );
        })}
      </Map>

      <div className={styles.cityLabel}>
        <span className={styles.cityTop}>Seville,</span>
        <span className={styles.cityBottom}>ESP</span>
      </div>

      {selected && (
        <Link
          href={`/place/${selected.id}`}
          className={styles.card}
          onClick={(e) => e.stopPropagation()}
        >
          {selected.photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className={styles.cardEmoji}
              src={selected.photos[0]}
              alt={selected.name}
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div className={styles.cardEmoji}>
              {CATEGORY_EMOJI[selected.category]}
            </div>
          )}
          <div className={styles.cardBody}>
            <div className={styles.cardPlace}>{selected.name}</div>
            <div className={styles.cardMeta}>
              {"★".repeat(Math.round(selected.avgRating))}
              <span className={styles.cardAuthor}>
                {selected.reviewCount} review
                {selected.reviewCount === 1 ? "" : "s"}
                {selected.avgPrice != null ? ` · ~€${selected.avgPrice}` : ""}
              </span>
            </div>
            <div className={styles.cardComment}>
              {selected.address ?? selected.city} · Tap to open →
            </div>
          </div>
        </Link>
      )}

      <div className={styles.placesPill}>{places.length} places</div>
    </div>
  );
}
