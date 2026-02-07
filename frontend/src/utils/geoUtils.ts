import { PolygonPoint } from "../types";

/**
 * geoUtils.ts — Pure geometric utilities for zone detection.
 *
 * All functions are stateless, framework-agnostic, and use no external
 * geometry libraries. They operate on simple `{ latitude, longitude }`
 * objects, consistent with the project's PolygonPoint interface.
 */

// ---------------------------------------------------------------------------
// Point-in-Polygon  (Ray-Casting Algorithm)
// ---------------------------------------------------------------------------

/**
 * Determine whether a point lies inside a polygon using the **ray-casting**
 * (even–odd rule) algorithm.
 *
 * ### How it works
 * A ray is cast from the test point horizontally to the right (+longitude
 * direction) toward infinity. For every edge of the polygon, the algorithm
 * checks whether the ray crosses that edge. If the total number of crossings
 * is **odd**, the point is inside; if **even**, it is outside.
 *
 * ### Edge cases handled
 * - Works correctly for concave, convex, and complex (self-intersecting)
 *   polygons.
 * - Points exactly on an edge may be classified as inside or outside
 *   depending on floating-point rounding — this is acceptable for
 *   geofencing where GPS accuracy (±5-10 m) far exceeds edge precision.
 *
 * ### Complexity
 * O(n) where n = number of polygon vertices.
 *
 * @param point   - The point to test `{ latitude, longitude }`.
 * @param polygon - An ordered array of vertices forming a closed polygon.
 *                  The closing edge (last → first vertex) is implied and
 *                  does **not** need to be duplicated.
 *                  Must contain **≥ 3** vertices; fewer returns `false`.
 * @returns `true` if the point is inside the polygon, `false` otherwise.
 *
 * @example
 * ```ts
 * const polygon: PolygonPoint[] = [
 *   { latitude: 23.810, longitude: 90.412 },
 *   { latitude: 23.811, longitude: 90.412 },
 *   { latitude: 23.811, longitude: 90.413 },
 *   { latitude: 23.810, longitude: 90.413 },
 * ];
 * isPointInPolygon({ latitude: 23.8105, longitude: 90.4125 }, polygon); // true
 * isPointInPolygon({ latitude: 23.815,  longitude: 90.420  }, polygon); // false
 * ```
 */
export function isPointInPolygon(
  point: PolygonPoint,
  polygon: PolygonPoint[],
): boolean {
  if (polygon.length < 3) return false;

  const { latitude: py, longitude: px } = point;
  let inside = false;

  // Walk every edge (vi → vj) of the polygon.
  // j always trails i by one index; when i = 0, j = last vertex (closing edge).
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const yi = polygon[i].latitude;
    const xi = polygon[i].longitude;
    const yj = polygon[j].latitude;
    const xj = polygon[j].longitude;

    // Does the horizontal ray from (py, px) → (py, +∞) cross edge (i, j)?
    // Condition 1: the edge must straddle the ray's latitude (one vertex
    //              above, one below — strictly on one side to avoid
    //              double-counting shared vertices).
    // Condition 2: the crossing longitude must be to the right of px.
    const intersects =
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;

    if (intersects) {
      inside = !inside; // toggle inside/outside on each crossing
    }
  }

  return inside;
}

// ---------------------------------------------------------------------------
// Unified zone-containment check
// ---------------------------------------------------------------------------

/**
 * Determine whether a point is inside a zone, supporting **both** polygon
 * zones and legacy circular (radius-based) zones.
 *
 * - If the zone has a `polygon` with ≥ 3 vertices, the polygon test is used.
 * - Otherwise the function falls back to a Haversine distance check against
 *   the zone's `center` + `radius`.
 *
 * @param point   - The user's current position.
 * @param zone    - The zone to test, containing either polygon data or
 *                  center + radius.
 * @returns `true` if the point is inside the zone.
 *
 * @example
 * ```ts
 * // Polygon zone
 * isInsideZone(
 *   { latitude: 23.8105, longitude: 90.4125 },
 *   { polygon: [...], center: { latitude: 0, longitude: 0 }, radiusMeters: 0 },
 * ); // true/false based on polygon
 *
 * // Circle zone (legacy)
 * isInsideZone(
 *   { latitude: 23.810, longitude: 90.412 },
 *   { center: { latitude: 23.810, longitude: 90.412 }, radiusMeters: 50 },
 * ); // true if within 50 m
 * ```
 */
export function isInsideZone(
  point: PolygonPoint,
  zone: {
    polygon?: PolygonPoint[];
    center: PolygonPoint;
    radiusMeters: number;
  },
): boolean {
  // Prefer polygon if available
  if (zone.polygon && zone.polygon.length >= 3) {
    return isPointInPolygon(point, zone.polygon);
  }

  // Fallback: circle check via Haversine distance
  const dist = haversineDistance(point, zone.center);
  return dist <= zone.radiusMeters;
}

// ---------------------------------------------------------------------------
// Haversine distance
// ---------------------------------------------------------------------------

const EARTH_RADIUS_METERS = 6_371_000;

/**
 * Calculate the great-circle distance in **meters** between two geographic
 * points using the Haversine formula.
 *
 * @param a - First point `{ latitude, longitude }` in degrees.
 * @param b - Second point `{ latitude, longitude }` in degrees.
 * @returns Distance in meters.
 */
export function haversineDistance(a: PolygonPoint, b: PolygonPoint): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const sinHalfLat = Math.sin(dLat / 2);
  const sinHalfLon = Math.sin(dLon / 2);
  const h =
    sinHalfLat * sinHalfLat +
    Math.cos(toRad(a.latitude)) *
      Math.cos(toRad(b.latitude)) *
      sinHalfLon *
      sinHalfLon;
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Convert degrees to radians. */
function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// ---------------------------------------------------------------------------
// Zone validation warnings
// ---------------------------------------------------------------------------

/**
 * A single validation warning. These are advisory — they do **not** prevent
 * saving. The `type` field lets the UI style different categories.
 */
export interface ZoneWarning {
  type: "few-points" | "duplicate-name" | "overlap";
  message: string;
}

/**
 * Validate a zone before saving and return an array of **warnings**.
 *
 * Checks performed:
 * 1. **Fewer than 3 polygon points** — the polygon cannot form a closed
 *    shape (always a warning, even though the save button is separately
 *    disabled for this case).
 * 2. **Duplicate zone name on the same floor** — another zone with an
 *    identical (case-insensitive) name already exists on the same floor.
 *    When editing, the zone's own id is excluded from the comparison.
 * 3. **Polygon overlap** — the new polygon shares area with an existing
 *    zone on the same floor. Detected by sampling the new polygon's
 *    vertices against existing polygons and vice-versa.
 *
 * @param zone      - The zone being created / edited.
 * @param existing  - All currently saved zones.
 * @param editingId - The id of the zone being edited (so it can be excluded
 *                    from duplicate / overlap checks). Pass `null` for new
 *                    zones.
 * @returns An array of warnings (may be empty).
 *
 * @example
 * ```ts
 * const warnings = validateZone(
 *   { name: "Library", floor: 2, polygon: [...] },
 *   existingZones,
 *   null, // new zone
 * );
 * warnings.forEach(w => console.warn(w.message));
 * ```
 */
export function validateZone(
  zone: { name: string; floor: number; polygon: PolygonPoint[] },
  existing: FloorZone[],
  editingId: number | null,
): ZoneWarning[] {
  const warnings: ZoneWarning[] = [];

  // 1. Too few polygon points
  if (zone.polygon.length > 0 && zone.polygon.length < 3) {
    warnings.push({
      type: "few-points",
      message: `Polygon has only ${zone.polygon.length} point(s) — at least 3 are required to form a shape.`,
    });
  }

  // Only compare against zones that are NOT the one being edited
  const otherZones =
    editingId !== null
      ? existing.filter((z) => (z as any).id !== editingId)
      : existing;

  // 2. Duplicate name on same floor (case-insensitive)
  const nameLower = zone.name.trim().toLowerCase();
  const duplicate = otherZones.find(
    (z) =>
      z.name.trim().toLowerCase() === nameLower &&
      z.floor !== undefined &&
      z.floor === zone.floor,
  );
  if (duplicate) {
    warnings.push({
      type: "duplicate-name",
      message: `A zone named "${duplicate.name}" already exists on ${
        zone.floor === -1
          ? "B1 (Basement)"
          : zone.floor === 0
            ? "Ground Floor"
            : `Floor ${zone.floor}`
      }.`,
    });
  }

  // 3. Polygon overlap with zones on the same floor
  if (zone.polygon.length >= 3) {
    const sameFloorZones = otherZones.filter(
      (z) => z.floor !== undefined && z.floor === zone.floor,
    );

    for (const other of sameFloorZones) {
      if (!other.polygon || other.polygon.length < 3) continue;

      if (polygonsOverlap(zone.polygon, other.polygon)) {
        warnings.push({
          type: "overlap",
          message: `Polygon overlaps with existing zone "${other.name}".`,
        });
        // Report at most one overlap warning per save to keep the UI clean
        break;
      }
    }
  }

  return warnings;
}

/**
 * Quick overlap test between two polygons.
 *
 * Uses vertex-in-polygon sampling: if **any** vertex of polygon A lies
 * inside polygon B, or vice-versa, the polygons overlap. This does not
 * catch the rare case where two polygons interleave without any vertex
 * being inside the other, but it is sufficient for campus zone shapes
 * and keeps the implementation dependency-free.
 *
 * @param a - First polygon vertices.
 * @param b - Second polygon vertices.
 * @returns `true` if the polygons likely overlap.
 */
export function polygonsOverlap(a: PolygonPoint[], b: PolygonPoint[]): boolean {
  // Check if any vertex of A is inside B
  for (const vertex of a) {
    if (isPointInPolygon(vertex, b)) return true;
  }
  // Check if any vertex of B is inside A
  for (const vertex of b) {
    if (isPointInPolygon(vertex, a)) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Floor-aware zone detection
// ---------------------------------------------------------------------------

/**
 * A zone descriptor used by the floor-aware detection helpers.
 * Intentionally minimal so callers can pass `ZoneWithCoordinates`,
 * `AdminZone`, or any object that satisfies this shape.
 */
export interface FloorZone {
  name: string;
  floor?: number;
  polygon?: PolygonPoint[];
  latitude: number;
  longitude: number;
  radius: number;
}

/**
 * Filter an array of zones to only those on a specific floor.
 *
 * Zones whose `floor` is `undefined` or `null` are treated as "floorless"
 * and are **excluded** unless `includeFloorless` is set to `true`.
 *
 * @param zones - All available zones.
 * @param floor - The floor number to match (e.g. 0 = ground, -1 = basement).
 * @param includeFloorless - When `true`, zones with no floor value are
 *                           included in the result. Default: `false`.
 * @returns Zones that belong to the requested floor.
 *
 * @example
 * ```ts
 * const ground = filterZonesByFloor(allZones, 0);
 * const withLegacy = filterZonesByFloor(allZones, 2, true);
 * ```
 */
export function filterZonesByFloor<T extends FloorZone>(
  zones: T[],
  floor: number,
  includeFloorless = false,
): T[] {
  return zones.filter((z) => {
    if (z.floor === undefined || z.floor === null) {
      return includeFloorless;
    }
    return z.floor === floor;
  });
}

/**
 * Detect which zone (if any) the user is currently inside, considering
 * **only** zones on the specified floor.
 *
 * 1. Filters zones to the given floor.
 * 2. Tests the point against each remaining zone (polygon or circle).
 * 3. If multiple zones overlap, the first match wins (array order).
 *
 * @param point - The user's current position.
 * @param zones - All available zones (any floor).
 * @param floor - The floor to restrict detection to.
 * @param includeFloorless - Include zones with no floor value. Default `false`.
 * @returns The matching zone, or `null` if the point is outside all zones
 *          on that floor.
 *
 * @example
 * ```ts
 * const zone = detectZoneOnFloor(
 *   { latitude: 23.8105, longitude: 90.4125 },
 *   allZones,
 *   2, // check floor 2 only
 * );
 * if (zone) console.log(`Inside ${zone.name}`);
 * ```
 */
export function detectZoneOnFloor<T extends FloorZone>(
  point: PolygonPoint,
  zones: T[],
  floor: number,
  includeFloorless = false,
): T | null {
  const floorZones = filterZonesByFloor(zones, floor, includeFloorless);

  for (const zone of floorZones) {
    const inside = isInsideZone(point, {
      polygon: zone.polygon,
      center: { latitude: zone.latitude, longitude: zone.longitude },
      radiusMeters: zone.radius,
    });
    if (inside) return zone;
  }

  return null;
}
