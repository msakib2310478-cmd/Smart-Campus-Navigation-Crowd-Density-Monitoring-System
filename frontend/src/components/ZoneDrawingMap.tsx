import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import { AdminZone, PolygonPoint } from "../types";
import { CAMPUS_CENTER, DEFAULT_ZOOM } from "../config/zoneCoordinates";

// Fix leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export interface ZoneDrawingMapHandle {
  clearDrawnItems: () => void;
}

interface ZoneDrawingMapProps {
  zones: AdminZone[];
  onPolygonDrawn: (polygon: PolygonPoint[]) => void;
  onZoneClick: (zone: AdminZone) => void;
}

export const ZoneDrawingMap = forwardRef<
  ZoneDrawingMapHandle,
  ZoneDrawingMapProps
>(({ zones, onPolygonDrawn, onZoneClick }, ref) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const zoneLayerRef = useRef<L.LayerGroup | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);

  // Expose clearDrawnItems to parent via ref
  useImperativeHandle(ref, () => ({
    clearDrawnItems: () => {
      if (drawnItemsRef.current) {
        drawnItemsRef.current.clearLayers();
      }
    },
  }));

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map
    const map = L.map(mapContainerRef.current, {
      center: CAMPUS_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
    });

    // Add tile layer (OpenStreetMap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Create layer groups
    const zoneLayer = L.layerGroup().addTo(map);
    const drawnItems = new L.FeatureGroup().addTo(map);

    // Initialize draw controls — polygon only
    const drawControl = new L.Control.Draw({
      position: "topright",
      draw: {
        polygon: {
          allowIntersection: false,
          drawError: {
            color: "#e1e100",
            message:
              "<strong>Error:</strong> Polygon edges must not intersect.",
          },
          shapeOptions: {
            color: "#3b82f6",
            fillColor: "#3b82f6",
            fillOpacity: 0.3,
            weight: 2,
          },
        },
        polyline: false,
        rectangle: false,
        marker: false,
        circlemarker: false,
        circle: false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });
    map.addControl(drawControl);

    // Extract polygon coordinates from a Leaflet polygon layer
    const extractPolygonPoints = (layer: L.Polygon): PolygonPoint[] => {
      const latLngs = (layer.getLatLngs() as L.LatLng[][])[0];
      return latLngs.map((ll) => ({
        latitude: ll.lat,
        longitude: ll.lng,
      }));
    };

    // Handle polygon creation
    map.on(L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layer as L.Polygon;

      if (event.layerType === "polygon") {
        drawnItems.addLayer(layer);

        const polygon = extractPolygonPoints(layer);
        console.log("[ZoneDrawingMap] Polygon drawn:", polygon);
        console.log(`[ZoneDrawingMap] Vertices: ${polygon.length}`);

        onPolygonDrawn(polygon);
      }
    });

    // Handle polygon edits
    map.on(L.Draw.Event.EDITED, (event: any) => {
      const layers = event.layers as L.LayerGroup;
      layers.eachLayer((layer) => {
        if (layer instanceof L.Polygon) {
          const polygon = extractPolygonPoints(layer);
          console.log("[ZoneDrawingMap] Polygon edited:", polygon);
          console.log(`[ZoneDrawingMap] Vertices: ${polygon.length}`);

          onPolygonDrawn(polygon);
        }
      });
    });

    mapRef.current = map;
    zoneLayerRef.current = zoneLayer;
    drawnItemsRef.current = drawnItems;

    // Cleanup
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [onPolygonDrawn]);

  // Update zones on map
  useEffect(() => {
    if (!zoneLayerRef.current) return;

    // Clear existing zones
    zoneLayerRef.current.clearLayers();

    // Render saved zones as polygons (fallback to circle if no polygon data)
    zones.forEach((zone) => {
      const color =
        zone.crowdLevel === "LOW"
          ? "#22c55e"
          : zone.crowdLevel === "MEDIUM"
            ? "#eab308"
            : "#ef4444";

      let shape: L.Polygon | L.Circle;
      let labelLatLng: L.LatLngExpression;

      if (zone.polygon && zone.polygon.length >= 3) {
        // Render as polygon
        const latLngs: L.LatLngExpression[] = zone.polygon.map((p) => [
          p.latitude,
          p.longitude,
        ]);
        shape = L.polygon(latLngs, {
          color,
          fillColor: color,
          fillOpacity: 0.3,
          weight: 2,
        });
        // Use polygon centroid for label
        labelLatLng = shape.getBounds().getCenter();
      } else {
        // Fallback: render as circle
        shape = L.circle([zone.latitude, zone.longitude], {
          radius: zone.radius,
          color,
          fillColor: color,
          fillOpacity: 0.3,
          weight: 2,
        });
        labelLatLng = [zone.latitude, zone.longitude];
      }

      // Add popup with zone info
      shape.bindPopup(`
        <div class="text-center">
          <strong>${zone.name}</strong><br/>
          <span class="text-sm">Capacity: ${zone.capacity}</span><br/>
          <span class="text-sm">Current: ${zone.currentCount}</span>
        </div>
      `);

      // Add click handler
      shape.on("click", () => {
        onZoneClick(zone);
      });

      shape.addTo(zoneLayerRef.current!);

      // Add label at center
      const label = L.marker(labelLatLng, {
        icon: L.divIcon({
          className: "zone-label",
          html: `<div style="
            background: rgba(255,255,255,0.9);
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            white-space: nowrap;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            border: 1px solid ${color};
          ">${zone.name}</div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        }),
      });
      label.addTo(zoneLayerRef.current!);
    });
  }, [zones, onZoneClick]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full"
      style={{ minHeight: "400px" }}
    />
  );
});
