"use client";

import { useMemo, useRef, useState } from "react";
import Map, { Marker, MapRef } from "react-map-gl";
import useSupercluster from "use-supercluster";
import type { BBox } from "geojson";
import { mockReviews } from "@/lib/mockReviews";
import { Review } from "@/lib/types";
import styles from "./FoodMap.module.css";

const SEVILLE = { longitude: -5.9925, latitude: 37.3905, zoom: 14 };
const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

type PointProps = { cluster: false; review: Review };
type ClusterProps = { cluster: true; point_count: number };

export default function FoodMap() {
  const mapRef = useRef<MapRef>(null);
  const [bounds, setBounds] = useState<BBox>();
  const [zoom, setZoom] = useState(SEVILLE.zoom);
  const [selected, setSelected] = useState<Review | null>(null);

  const points = useMemo(
    () =>
      mockReviews.map((r) => ({
        type: "Feature" as const,
        properties: { cluster: false as const, review: r },
        geometry: {
          type: "Point" as const,
          coordinates: [r.lng, r.lat],
        },
      })),
    []
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

          const review = (props as PointProps).review;
          const active = selected?.id === review.id;
          return (
            <Marker key={review.id} longitude={lng} latitude={lat}>
              <button
                className={`${styles.pin} ${active ? styles.pinActive : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(review);
                  flyTo(lng, lat, Math.max(zoom, 15));
                }}
              >
                <span className={styles.pinEmoji}>{review.emoji}</span>
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
        <div className={styles.card} onClick={(e) => e.stopPropagation()}>
          <div className={styles.cardEmoji}>{selected.emoji}</div>
          <div className={styles.cardBody}>
            <div className={styles.cardPlace}>{selected.place}</div>
            <div className={styles.cardMeta}>
              {"★".repeat(selected.rating)}
              <span className={styles.cardAuthor}>@{selected.author}</span>
            </div>
            <div className={styles.cardComment}>{selected.comment}</div>
          </div>
        </div>
      )}

      <div className={styles.placesPill}>{mockReviews.length} places</div>
    </div>
  );
}
