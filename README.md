# Smart Campus Navigation & Crowd Density Monitoring System

A smart campus system that tracks real-time crowd density across locations like libraries, cafeterias, and labs. Student apps send live locations to a server, which updates crowd levels and shows them on a color-coded map, recommends less busy spots, and saves data for analysis.

## Features

- **Real-time Crowd Monitoring**: Track crowd density across all campus zones with live WebSocket updates
- **Interactive Live Map**: Color-coded zone cards showing occupancy levels (Low/Medium/High)
- **Smart Route Planning**: Calculate routes between campus locations with crowd awareness
- **Recommendations**: Get suggestions for less busy locations
- **Issue Reporting**: Report problems or issues at specific zones
- **Admin Dashboard**: Simulation controls for testing crowd scenarios in real-time
- **Automatic Location Detection**: GPS-based geofencing automatically detects zone entry/exit
- **OpenStreetMap Integration**: Interactive maps using Leaflet.js with no API costs

---

## Automatic Location Detection

### Overview

This system implements **automatic location-based zone detection** using the browser's Geolocation API combined with custom geofencing logic. Unlike traditional systems that require users to manually check in/out of locations, this approach automatically detects when a user enters or exits a campus zone based on their GPS coordinates.

### Why OpenStreetMap + Leaflet.js?

The system uses **OpenStreetMap (OSM)** with **Leaflet.js** for map visualization. This technology choice was made based on the following considerations:

| Factor                 | OpenStreetMap + Leaflet                | Google Maps API                               |
| ---------------------- | -------------------------------------- | --------------------------------------------- |
| **Cost**               | Free and open-source                   | Requires billing account, charges per request |
| **Privacy**            | No data sent to third parties          | User location data processed by Google        |
| **Customization**      | Full control over styling and behavior | Limited by Google's terms of service          |
| **Offline Capability** | Can cache tiles for offline use        | Requires constant internet connection         |
| **Academic Use**       | No licensing restrictions              | Commercial terms may apply                    |

OpenStreetMap provides accurate campus-level mapping data while ensuring that all location processing occurs client-side, preserving user privacy.

### How Geofencing Works

The geofencing system operates through the following process:

#### 1. Continuous Location Tracking

```
Browser Geolocation API (navigator.geolocation.watchPosition)
    ↓
Real-time latitude/longitude updates
    ↓
useGeolocation Hook (React)
```

The system uses `watchPosition()` for continuous tracking rather than `getCurrentPosition()` to ensure real-time detection of zone transitions.

#### 2. Distance Calculation (Haversine Formula)

To determine if a user is inside a zone, the system calculates the great-circle distance between the user's position and each zone's center using the **Haversine formula**:

```
a = sin²(Δφ/2) + cos(φ₁) · cos(φ₂) · sin²(Δλ/2)
c = 2 · atan2(√a, √(1−a))
d = R · c
```

Where:

- `φ` = latitude in radians
- `λ` = longitude in radians
- `R` = Earth's radius (6,371 km)
- `d` = distance between two points

If `d ≤ zone.radius`, the user is considered inside the zone.

#### 3. Zone Transition Detection

```
┌─────────────────────────────────────────────────────┐
│                  Location Update                     │
└─────────────────────┬───────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  Calculate distance to all zones (Haversine)        │
└─────────────────────┬───────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  Determine active zone (closest if overlapping)     │
└─────────────────────┬───────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  Compare with previous active zone                  │
│  ├── Different zone? → Trigger EXIT + ENTER events  │
│  └── Same zone? → No action (prevent duplicates)    │
└─────────────────────┬───────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  Update backend via REST API                        │
│  POST /api/location/update                          │
└─────────────────────────────────────────────────────┘
```

#### 4. Hysteresis Buffer

To prevent rapid enter/exit events when a user is near a zone boundary (GPS jitter), the system implements a **hysteresis buffer** of 5 meters:

- **Entering**: User must be within `zone.radius` meters
- **Exiting**: User must be beyond `zone.radius + 5` meters

This prevents false triggers caused by GPS accuracy fluctuations.

### Privacy Considerations

This system was designed with privacy as a primary concern:

| Aspect                        | Implementation                                                                                     |
| ----------------------------- | -------------------------------------------------------------------------------------------------- |
| **Client-side Processing**    | All geofencing calculations occur in the browser; raw GPS coordinates are never sent to the server |
| **Minimal Data Transmission** | Only zone name and action (ENTER/EXIT) are transmitted to the backend                              |
| **No Location History**       | The server does not store historical location data or movement patterns                            |
| **User Control**              | Location tracking only activates with explicit user consent via browser permission                 |
| **No Third-party APIs**       | No location data is sent to external services (Google, etc.)                                       |
| **Opt-out Capability**        | Users can disable tracking at any time; manual check-in remains available                          |

#### Data Flow

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  User's Device   │     │   Frontend App   │     │  Backend Server  │
│  (GPS Sensor)    │     │  (React + TS)    │     │  (Spring Boot)   │
└────────┬─────────┘     └────────┬─────────┘     └────────┬─────────┘
         │                        │                        │
         │  GPS Coordinates       │                        │
         │───────────────────────>│                        │
         │                        │                        │
         │                        │  Geofencing Logic      │
         │                        │  (Haversine calc)      │
         │                        │                        │
         │                        │  Zone: "Library"       │
         │                        │  Action: "ENTER"       │
         │                        │───────────────────────>│
         │                        │                        │
         │                        │                        │  Update crowd count
         │                        │                        │
```

**Note**: Raw latitude/longitude coordinates remain on the client device. The server only receives the zone name and action type.

---

## Zone Definition Using Map Drawing

### Overview

The Smart Campus Navigation System provides administrators with an intuitive graphical interface for defining campus zones directly on an interactive map. This approach eliminates the need for manual coordinate entry and enables precise spatial configuration of geofenced areas.

### How Administrators Draw Zones

The zone creation process is designed for ease of use while maintaining technical precision:

1. **Access the Admin Zone Map**: Administrators navigate to the dedicated zone management interface (`/admin/map`), accessible only to users with administrative privileges.

2. **Utilize Drawing Tools**: The interface presents a circle drawing tool (○) in the map's control panel. Administrators click and drag on the map to create a circular zone, with real-time radius feedback displayed during drawing.

3. **Configure Zone Properties**: Upon drawing a circle, a configuration panel appears where administrators specify:
   - **Zone Name**: A unique identifier (e.g., "Main Library", "Science Lab A")
   - **Capacity**: The maximum expected occupancy for crowd density calculations

4. **Review Safety Warnings**: The system performs automated validation checks:
   - **Radius Range**: Warns if the radius falls outside the recommended 10–200 meter range
   - **Duplicate Names**: Alerts if a zone with the same name already exists
   - **Overlapping Zones**: Detects and warns about spatial overlap with existing zones

5. **Save to Backend**: Upon confirmation, zone data is persisted to the server via REST API, making it immediately available for geofencing operations.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Admin Zone Creation Flow                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Draw circle on map (click + drag)                           │
│     └── Visual feedback: radius in meters                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Enter zone details (name, capacity)                         │
│     └── Real-time validation warnings displayed                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Save zone → POST /api/zones                                 │
│     └── Response: zone ID, confirmation                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Zone active for geofencing                                  │
│     └── Users entering zone trigger automatic detection         │
└─────────────────────────────────────────────────────────────────┘
```

### Why Circular Geofencing Is Used

The system employs circular geofences rather than polygonal boundaries for several technical and practical reasons:

| Factor                       | Circular Geofences                                | Polygonal Geofences                           |
| ---------------------------- | ------------------------------------------------- | --------------------------------------------- |
| **Computational Efficiency** | O(1) distance calculation using Haversine formula | O(n) ray-casting or winding number algorithm  |
| **Definition Simplicity**    | Three parameters: latitude, longitude, radius     | Multiple coordinate pairs required            |
| **GPS Accuracy Tolerance**   | Naturally accommodates GPS drift (±5–15m)         | Sharp corners create false boundary triggers  |
| **Storage Requirements**     | Minimal (3 numeric values per zone)               | Proportional to polygon complexity            |
| **User Experience**          | Intuitive single-gesture drawing                  | Requires multiple clicks for polygon vertices |

#### Mathematical Basis

Zone containment is determined using the **Haversine formula** for great-circle distance:

```
d = 2R · arcsin(√(sin²((φ₂-φ₁)/2) + cos(φ₁)·cos(φ₂)·sin²((λ₂-λ₁)/2)))
```

A user is considered inside a zone when `d ≤ zone.radius`, where:

- `d` = distance from user to zone center
- `R` = Earth's radius (6,371 km)
- `φ`, `λ` = latitude and longitude in radians

This calculation executes in constant time regardless of the number of zones, enabling efficient real-time geofencing on mobile devices.

### How Zone Data Is Stored

Zone data follows a structured persistence model designed for reliability and extensibility:

#### Data Model (ZoneEntity)

| Field         | Type          | Description                                  |
| ------------- | ------------- | -------------------------------------------- |
| `id`          | Long          | Auto-generated unique identifier             |
| `name`        | String        | Human-readable zone name (unique constraint) |
| `latitude`    | Double        | WGS84 latitude of zone center (-90 to 90)    |
| `longitude`   | Double        | WGS84 longitude of zone center (-180 to 180) |
| `radius`      | Double        | Zone radius in meters (must be positive)     |
| `capacity`    | Integer       | Maximum expected occupancy                   |
| `description` | String        | Optional descriptive text                    |
| `createdAt`   | LocalDateTime | Timestamp of zone creation                   |
| `updatedAt`   | LocalDateTime | Timestamp of last modification               |
| `createdBy`   | String        | Username of creating administrator           |

#### Storage Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Admin UI      │     │  REST API       │     │  Database       │
│  (React/TS)     │────▶│  (Spring Boot)  │────▶│  (JPA/H2)       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │
                              ▼
                        ┌─────────────────┐
                        │  CrowdService   │
                        │  (In-Memory)    │
                        └─────────────────┘
```

Zone data is persisted to the database via JPA (Java Persistence API) and simultaneously synchronized with the in-memory CrowdService for real-time crowd tracking operations. This dual-storage approach ensures both durability and low-latency access.

#### API Endpoints

| Method   | Endpoint          | Description                       |
| -------- | ----------------- | --------------------------------- |
| `GET`    | `/api/zones`      | Retrieve all zones                |
| `GET`    | `/api/zones/{id}` | Retrieve specific zone            |
| `POST`   | `/api/zones`      | Create new zone (Admin only)      |
| `PUT`    | `/api/zones/{id}` | Update existing zone (Admin only) |
| `DELETE` | `/api/zones/{id}` | Delete zone (Admin only)          |

### Privacy Considerations

The zone definition system incorporates privacy-preserving design principles:

| Principle                         | Implementation                                                                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Minimal Data Collection**       | Zones store only geometric parameters necessary for geofencing; no user-specific data is associated with zone definitions        |
| **Administrative Access Control** | Zone creation, modification, and deletion are restricted to authenticated administrators with explicit ADMIN role                |
| **Separation of Concerns**        | Zone geometry (stored) is distinct from user presence data (ephemeral); zones do not retain records of which users entered       |
| **Audit Transparency**            | `createdBy` field provides accountability for zone definitions without tracking end-user behavior                                |
| **No Location Inference**         | Zone boundaries are public campus areas (libraries, labs); their existence does not reveal sensitive information                 |
| **Client-Side Geofencing**        | User position is compared against zones locally in the browser; the server receives only zone entry/exit events, not coordinates |

#### Data Retention

- **Zone definitions**: Persisted indefinitely until administratively deleted
- **User presence**: Ephemeral; used only for real-time crowd counts with no historical logging
- **Crowd statistics**: Aggregated anonymously; individual user movements are not recorded

This architecture ensures that the system can provide real-time crowd density information while maintaining compliance with data minimization principles commonly required in educational institution privacy policies.

---

## Polygon-Based Zone Definition

### Motivation: Why Polygons Replace Circles

The initial release of the system employed circular geofences defined by a centre point and a radius. While computationally efficient, circles impose a significant limitation: real-world campus buildings are rarely circular. A rectangular library, an L-shaped corridor, or an irregularly shaped courtyard cannot be faithfully represented by a single circle without either (a) enclosing substantial area that does not belong to the zone, or (b) leaving portions of the actual zone undetected. This mismatch leads to false entry/exit events at boundaries, particularly in dense campus environments where adjacent zones may be only a few metres apart.

Polygon-based zone definitions address this limitation by allowing administrators to trace the actual perimeter of a space. Each zone is stored as an ordered array of `{ latitude, longitude }` vertices, and containment is evaluated using the **ray-casting algorithm** (even–odd rule), which runs in O(n) time where n is the number of vertices. Although this is computationally more expensive than the O(1) Haversine check used for circles, the vertex counts encountered in practice (typically 4–12 per zone) result in negligible overhead on modern devices.

| Criterion                    | Circular Geofences                         | Polygon Geofences                 |
| ---------------------------- | ------------------------------------------ | --------------------------------- |
| **Boundary accuracy**        | Approximation only                         | Matches actual building footprint |
| **Adjacent-zone separation** | Overlapping circles produce false triggers | Clean, non-overlapping boundaries |
| **Irregular shapes**         | Cannot represent L-, U-, or T-shaped areas | Arbitrary shapes supported        |
| **Containment check**        | O(1) Haversine distance                    | O(n) ray-casting (n ≈ 4–12)       |
| **Storage per zone**         | 3 values (lat, lng, radius)                | 2n values (lat/lng per vertex)    |
| **Drawing UX**               | Single click-and-drag                      | Multiple vertex clicks            |

The system retains backward compatibility: legacy zones that store only a centre and radius continue to function via the Haversine fallback path. New zones are created exclusively as polygons.

### How Administrators Define Zones

Zone creation is restricted to authenticated users holding the `ADMIN` role. The workflow proceeds as follows:

1. **Navigate to Zone Management** — The administrator opens `/admin/map`, which renders an interactive OpenStreetMap view with Leaflet.js drawing controls.

2. **Draw a Polygon** — A polygon tool (▱) is presented in the toolbar. All other drawing primitives (circles, rectangles, markers, polylines) are disabled to enforce consistent zone geometry. The administrator clicks to place vertices; completing the shape (clicking the first vertex or double-clicking) closes the polygon.

3. **Configure Zone Properties** — A modal form appears with the following fields:
   - **Zone Name** (required) — a human-readable identifier (e.g., "Main Library Reading Hall").
   - **Floor** (required) — an integer selected from a dropdown ranging from B1 (Basement, value −1) through Floor 10.
   - **Capacity** (required) — maximum expected occupancy, used for crowd-level calculations.
   - **Description** (optional) — free-text annotation.

4. **Review Validation Warnings** — Before saving, the system performs three advisory checks that produce non-blocking warnings:
   - **Insufficient vertices** — the polygon has fewer than 3 points.
   - **Duplicate name on the same floor** — another zone with an identical name (case-insensitive) already exists on the selected floor.
   - **Polygon overlap** — the new polygon shares area with an existing zone on the same floor, detected by testing each vertex of the new polygon against existing polygons and vice-versa.

   These checks are advisory: the administrator may acknowledge the warning and proceed with saving if the situation is intentional (e.g., a zone that legitimately spans multiple existing zones).

5. **Persist to Backend** — On submission, a `POST /api/zones` request transmits the zone name, floor number, capacity, description, computed centroid (latitude/longitude), and the full polygon vertex array. The backend serialises the polygon as a JSON string in a CLOB column (`polygonJson`) on the `ZoneEntity` table, alongside the centroid and a radius of 0.

```
Admin draws polygon on map
        │
        ▼
Vertices extracted as [{ latitude, longitude }, ...]
        │
        ▼
Modal form: name, floor, capacity, description
        │
        ▼
Validation warnings (duplicate name, overlap)
        │
        ▼
POST /api/zones  ──►  ZoneEntity persisted (polygonJson as CLOB)
        │
        ▼
Zone rendered on all maps (admin + user-facing)
```

### Multi-Floor Zone Handling

Campus buildings are inherently three-dimensional: a library may occupy the ground floor while a laboratory sits directly above it on the second floor. The system models this by assigning each zone an integer `floor` attribute. This design enables the following behaviours:

- **Floor-scoped detection** — The `filterZonesByFloor()` utility selects only zones matching a given floor number before performing containment checks. A user on Floor 2, for example, is tested only against Floor-2 zones, preventing false positives from a geographically overlapping Ground-Floor zone.

- **Floor-scoped validation** — Duplicate-name and overlap warnings are evaluated per-floor. Two zones may share the same name or occupy the same map footprint provided they are on different floors (e.g., "Study Room" on Floor 1 and Floor 3).

- **Unified map rendering** — On the user-facing live map, all zones are displayed simultaneously regardless of floor. Each zone's popup includes the floor number so that users can distinguish vertically stacked zones.

The floor value follows a simple convention:

| Value | Label              |
| ----- | ------------------ |
| −1    | B1 (Basement)      |
| 0     | Ground Floor       |
| 1–10  | Floor 1 – Floor 10 |

#### Floor-Aware Detection Flow

```
User position (lat, lng) + selected floor
        │
        ▼
filterZonesByFloor(allZones, floor)
        │
        ▼
For each zone on that floor:
    zone has polygon?  ──yes──►  isPointInPolygon(point, polygon)
                       ──no───►  haversineDistance(point, center) ≤ radius
        │
        ▼
First matching zone returned (or null)
```

### Limitations of GPS Indoors

While GPS-based geofencing provides a practical and cost-effective solution for a campus navigation prototype, several inherent limitations must be acknowledged, particularly in indoor environments:

1. **Signal attenuation** — GPS signals (L1 band, 1575.42 MHz) are significantly attenuated by building materials such as reinforced concrete and steel framing. Indoor positioning accuracy typically degrades from ±3–5 m outdoors to ±10–30 m indoors, and in some structures the signal may be lost entirely.

2. **Multipath interference** — In indoor settings, GPS signals reflect off walls, floors, and furniture before reaching the receiver, introducing positional errors that can shift the reported location by tens of metres. This is especially problematic in narrow corridors and rooms with metallic surfaces.

3. **Floor ambiguity** — GPS provides latitude and longitude but not altitude with sufficient precision to distinguish between building floors. The system therefore requires the user (or a future sensor integration) to supply the current floor explicitly. Without this information, the floor-aware filtering cannot function.

4. **Cold-start latency** — When a user first enters a building, the GPS receiver may require 20–45 seconds to acquire satellites and compute an initial fix. During this period, zone detection is unavailable.

5. **Battery consumption** — Continuous `watchPosition()` tracking with high accuracy enabled can consume significant battery on mobile devices. The system mitigates this by using the browser's default power-management behaviour and limiting update frequency.

#### Practical Implications for This Project

Given these constraints, the polygon-based geofencing system is best suited for:

- **Outdoor and semi-outdoor zones** (courtyards, outdoor seating, sports fields) where GPS accuracy is sufficient.
- **Buildings with large, distinct footprints** (libraries, auditoriums) where even degraded GPS can distinguish between non-adjacent structures.
- **Prototype and demonstration purposes**, where the focus is on the software architecture and algorithmic correctness rather than centimetre-level indoor positioning.

For production deployment in indoor environments, the system architecture is designed to accommodate future integration with complementary positioning technologies such as Wi-Fi fingerprinting, Bluetooth Low Energy (BLE) beacons, or Ultra-Wideband (UWB) anchors. The `isPointInPolygon()` and `isInsideZone()` functions are agnostic to the source of the coordinates — they operate on any `{ latitude, longitude }` input regardless of whether it originates from GPS, Wi-Fi positioning, or a fused sensor pipeline.

---

## Architecture

### Backend (Spring Boot)

- **Framework**: Spring Boot 3.2.0 with Java 17
- **WebSocket**: STOMP over SockJS for real-time crowd updates
- **Storage**: In-memory storage (MVP - no database required)
- **REST API**: Full CRUD endpoints for zones, routes, and reports

### Frontend (React + Vite)

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development
- **Styling**: Tailwind CSS for responsive design
- **Routing**: React Router v6 with multiple pages
- **WebSocket**: SockJS + STOMP client for real-time updates

## Getting Started

### Quick Start with Dev Container (Recommended)

This project includes a fully configured dev container that automatically sets up all dependencies.

#### Running in GitHub Codespaces

GitHub Codespaces provides a complete cloud-based development environment. This is the recommended approach for academic evaluation and testing.

**Step 1: Create a Codespace**

1. Navigate to the repository on GitHub
2. Click the green **"Code"** button
3. Select the **"Codespaces"** tab
4. Click **"Create codespace on main"**

**Step 2: Wait for Environment Setup**

The first build takes approximately 3-5 minutes. The dev container will:

- Install Java 17 and Maven
- Install Node.js 20 and npm
- Install all project dependencies
- Configure VS Code extensions

**Step 3: Start the Application**

Once the environment is ready, open the integrated terminal and run:

```bash
# Start both backend and frontend
./start-all.sh
```

Or start them separately:

```bash
# Terminal 1: Start backend (Spring Boot on port 8080)
./start-backend.sh

# Terminal 2: Start frontend (Vite on port 5173)
./start-frontend.sh
```

**Step 4: Access the Application**

When the servers start, Codespaces will show a notification with port forwarding options:

- **Frontend**: Click "Open in Browser" for port 5173
- **Backend API**: Port 8080 (accessible via the frontend proxy)

**Step 5: Test Location Features**

To test the automatic location detection:

1. Open the Live Map page
2. Click "Start Tracking" to enable location services
3. Grant location permission when prompted
4. Your position will appear on the map (simulated in Codespaces)

> **Note**: In Codespaces, the browser may use approximate location. For accurate GPS testing, deploy to a mobile device or use browser developer tools to simulate coordinates.

#### Using VS Code Dev Containers (Local)

1. Install [Docker](https://www.docker.com/) and [VS Code Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
2. Open the project in VS Code
3. Click **"Reopen in Container"** when prompted (or use Command Palette: `Dev Containers: Reopen in Container`)
4. Wait for the container to build and dependencies to install

#### Helper Scripts (Available after container setup)

```bash
# Start both backend and frontend servers
./start-all.sh

# Start only the backend (Spring Boot on port 8080)
./start-backend.sh

# Start only the frontend (Vite on port 3000)
./start-frontend.sh
```

#### What's Pre-installed in Dev Container

- ☕ **Java 17** with Maven
- 📦 **Node.js 20** with npm
- 🔧 **VS Code Extensions**: Java Pack, Spring Boot, ESLint, Prettier, Tailwind CSS IntelliSense, and more
- 🚀 **Auto-setup**: All Maven and npm dependencies are installed automatically

---

### Manual Setup (Without Dev Container)

#### Prerequisites

- **Java 17** or higher
- **Maven 3.6+**
- **Node.js 18+** and npm

### Running the Backend

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Build the project:

   ```bash
   mvn clean package
   ```

3. Run the application:

   ```bash
   mvn spring-boot:run
   ```

   Or run the JAR directly:

   ```bash
   java -jar target/campus-navigation-1.0.0-SNAPSHOT.jar
   ```

4. The backend will start on `http://localhost:8080`

#### Backend API Endpoints

- `GET /api/health` - Health check
- `GET /api/zones` - Get all zones
- `GET /api/zones/{id}` - Get zone by ID
- `GET /api/zones/recommendations` - Get recommended zones (lowest crowd)
- `POST /api/routes` - Calculate route between zones
- `GET /api/reports` - Get all reports
- `POST /api/reports` - Create new report
- `POST /api/simulate/crowd` - Update crowd simulation (admin)
- WebSocket endpoint: `/ws` (STOMP over SockJS)

### Running the Frontend

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. The frontend will start on `http://localhost:5173`

5. Open your browser and navigate to `http://localhost:5173`

#### Frontend Routes

- `/` - Landing page
- `/live` - Live campus map with real-time updates
- `/zones` - List of all zones
- `/zones/:zoneId` - Zone details
- `/route` - Route planner
- `/recommendations` - Recommended locations
- `/reports` - Issue reporting
- `/admin` - Admin dashboard with simulation controls

### Building for Production

#### Backend

```bash
cd backend
mvn clean package -DskipTests
```

The JAR file will be in `target/campus-navigation-1.0.0-SNAPSHOT.jar`

#### Frontend

```bash
cd frontend
npm run build
```

The production build will be in `frontend/dist/`

## Testing the System

1. Start both the backend and frontend servers
2. Open the Admin Dashboard (`/admin`) in one browser tab
3. Open the Live Map (`/live`) in another tab
4. Use the Admin Dashboard to adjust crowd counts for different zones
5. Click "Apply Simulation" to broadcast updates
6. Watch the Live Map update in real-time via WebSocket

## Configuration

### Backend Configuration

Edit `backend/src/main/resources/application.yml`:

```yaml
server:
  port: 8080 # Change backend port

spring:
  web:
    cors:
      allowed-origins: "http://localhost:5173,http://localhost:3000" # Add allowed origins
```

### Frontend Configuration

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:8080/api  # Backend API URL
VITE_WS_URL=http://localhost:8080/ws    # WebSocket URL
```

## Zone Data

Initial zone data is loaded from `backend/src/main/resources/data/zones-capacity.json`. You can modify this file to add or change campus zones.

## Development

### VS Code Recommended Extensions

These extensions are **automatically installed** in the Dev Container. For manual setup, install:

- Java Extension Pack
- Spring Boot Extension Pack
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- GitLens
- Error Lens

## Project Structure

```
.
├── .devcontainer/           # Dev Container configuration
│   ├── devcontainer.json    # Main config (Java 17, Node.js 20, extensions)
│   ├── Dockerfile           # Custom base image
│   ├── docker-compose.yml   # Docker orchestration
│   └── post-create.sh       # Auto-setup script
│
├── backend/
│   ├── src/main/java/com/university/campus/
│   │   ├── CampusApplication.java
│   │   ├── config/          # WebSocket and CORS config
│   │   ├── controller/      # REST controllers
│   │   ├── dto/             # Data Transfer Objects
│   │   ├── model/           # Domain models
│   │   └── service/         # Business logic
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── data/zones-capacity.json
│   └── pom.xml
│
├── frontend/
│   ├── src/
│   │   ├── api/             # API client modules
│   │   ├── components/      # Reusable components
│   │   ├── layouts/         # Layout components
│   │   ├── pages/           # Page components
│   │   ├── realtime/        # WebSocket client
│   │   ├── types/           # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env
│   ├── package.json
│   └── tailwind.config.js
│
├── start-all.sh             # Start both servers
├── start-backend.sh         # Start backend only
└── start-frontend.sh        # Start frontend only
```

---

## High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     React Frontend (Vite + TypeScript)               │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │    │
│  │  │  Pages   │  │Components│  │ Context  │  │     Services (API)   │ │    │
│  │  │ HomePage │  │  Navbar  │  │AuthContext│ │  Axios HTTP Client  │ │    │
│  │  │Dashboard │  │ ZoneCard │  │          │  │  locationAPI        │ │    │
│  │  │ LiveMap  │  │PrivRoute │  │          │  │  authAPI            │ │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTP REST / WebSocket
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SERVER LAYER                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                  Spring Boot Backend (Java 17)                       │    │
│  │                                                                      │    │
│  │  ┌────────────────┐    ┌────────────────┐    ┌──────────────────┐   │    │
│  │  │   Controllers  │    │    Services    │    │   Repositories   │   │    │
│  │  │ AuthController │───▶│  AuthService   │───▶│  UserRepository  │   │    │
│  │  │LocationController│──▶│  CrowdService  │    │AuditLogRepository│   │    │
│  │  │RecommendController│──▶│ AuditLogService│    │LoginAttemptRepo  │   │    │
│  │  └────────────────┘    └────────────────┘    └──────────────────┘   │    │
│  │           │                    │                       │            │    │
│  │           ▼                    ▼                       ▼            │    │
│  │  ┌────────────────┐    ┌────────────────┐    ┌──────────────────┐   │    │
│  │  │     DTOs       │    │     Models     │    │    Security      │   │    │
│  │  │  AuthRequest   │    │     User       │    │ JwtTokenProvider │   │    │
│  │  │  AuthResponse  │    │     Zone       │    │ PasswordValidator│   │    │
│  │  │   ZoneDto      │    │   AuditLog     │    │                  │   │    │
│  │  └────────────────┘    └────────────────┘    └──────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                      │
│  ┌─────────────────────────┐    ┌─────────────────────────────────────┐     │
│  │   MySQL Database        │    │      In-Memory Storage              │     │
│  │   - users table         │    │   - ConcurrentHashMap (zones)       │     │
│  │   - audit_logs table    │    │   - User session tracking           │     │
│  │   - login_attempts      │    │   - Serialized backup (crowd_data)  │     │
│  └─────────────────────────┘    └─────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Interaction Between Frontend, Backend, and Codespaces

### Development Environment with GitHub Codespaces

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          GitHub Codespaces                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Ubuntu Dev Container                              │    │
│  │                                                                      │    │
│  │   ┌─────────────────┐         ┌─────────────────┐                   │    │
│  │   │   Frontend      │         │    Backend      │                   │    │
│  │   │   Port 5173     │◄───────▶│    Port 8080    │                   │    │
│  │   │   (Vite Dev)    │   API   │  (Spring Boot)  │                   │    │
│  │   └────────┬────────┘         └────────┬────────┘                   │    │
│  │            │                           │                            │    │
│  │            ▼                           ▼                            │    │
│  │   ┌─────────────────────────────────────────────────────────┐       │    │
│  │   │              Shared File System & Environment            │       │    │
│  │   │        - /workspaces/Smart-Campus-Navigation-...         │       │    │
│  │   │        - Environment variables (.env files)              │       │    │
│  │   └─────────────────────────────────────────────────────────┘       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│                              Port Forwarding                                 │
│                                      ▼                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                        ┌─────────────────────────┐
                        │    Developer Browser    │
                        │  https://*.github.dev   │
                        └─────────────────────────┘
```

### Request Flow

1. **User Action**: User interacts with the React frontend (e.g., scans QR code, views live map)
2. **API Call**: Frontend makes HTTP request via Axios to backend REST endpoints
3. **Controller Layer**: Spring Boot controller receives request, validates input
4. **Service Layer**: Business logic is executed (authentication, crowd calculations)
5. **Data Layer**: Data is persisted/retrieved from database or in-memory storage
6. **Response**: JSON response is sent back through the layers to the frontend
7. **UI Update**: React state updates and component re-renders with new data

### Communication Protocols

| Protocol          | Use Case                        | Endpoints                                            |
| ----------------- | ------------------------------- | ---------------------------------------------------- |
| HTTP REST         | CRUD operations, Authentication | `/api/auth/*`, `/api/location/*`, `/api/recommend/*` |
| WebSocket (STOMP) | Real-time crowd updates         | `/ws`                                                |
| JWT Token         | Stateless authentication        | Authorization header                                 |

---

## CRUD Workflow Explanation

### User Management (Create, Read, Update, Delete)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER CRUD WORKFLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

CREATE (Signup)
───────────────
Frontend                          Backend                           Database
    │                                │                                  │
    │  POST /api/auth/signup         │                                  │
    │  {email, studentId, password}  │                                  │
    │───────────────────────────────▶│                                  │
    │                                │  Validate password strength      │
    │                                │  Hash password (BCrypt)          │
    │                                │  INSERT INTO users               │
    │                                │─────────────────────────────────▶│
    │                                │                                  │
    │  {token, userId, email}        │◀─────────────────────────────────│
    │◀───────────────────────────────│                                  │


READ (Get Current User)
───────────────────────
Frontend                          Backend                           Database
    │                                │                                  │
    │  GET /api/auth/me              │                                  │
    │  Authorization: Bearer <token> │                                  │
    │───────────────────────────────▶│                                  │
    │                                │  Validate JWT token              │
    │                                │  SELECT * FROM users WHERE id    │
    │                                │─────────────────────────────────▶│
    │                                │                                  │
    │  {id, email, fullName}         │◀─────────────────────────────────│
    │◀───────────────────────────────│                                  │


UPDATE (Location Update)
────────────────────────
Frontend                          Backend                        In-Memory Store
    │                                │                                  │
    │  POST /api/location/update     │                                  │
    │  {userId, zoneName, action}    │                                  │
    │───────────────────────────────▶│                                  │
    │                                │  Validate zone exists            │
    │                                │  Update zone.activeUsers         │
    │                                │  Recalculate crowd level         │
    │                                │─────────────────────────────────▶│
    │                                │                                  │
    │  {message, currentZone}        │◀─────────────────────────────────│
    │◀───────────────────────────────│                                  │


DELETE (User Exit Zone)
───────────────────────
Frontend                          Backend                        In-Memory Store
    │                                │                                  │
    │  POST /api/location/update     │                                  │
    │  {userId, zoneName, "EXIT"}    │                                  │
    │───────────────────────────────▶│                                  │
    │                                │  Remove user from zone           │
    │                                │  zone.removeUser(userId)         │
    │                                │─────────────────────────────────▶│
    │                                │                                  │
    │  {message, previousZone}       │◀─────────────────────────────────│
    │◀───────────────────────────────│                                  │
```

### Zone Data Lifecycle

| Operation  | HTTP Method | Endpoint                      | Description                   |
| ---------- | ----------- | ----------------------------- | ----------------------------- |
| **Create** | POST        | `/api/location/update`        | User enters a zone            |
| **Read**   | GET         | `/api/location/crowd`         | Get all zones with crowd data |
| **Read**   | GET         | `/api/recommend/best`         | Get least crowded zone        |
| **Update** | POST        | `/api/location/update`        | Update user location          |
| **Delete** | POST        | `/api/location/update` (EXIT) | User leaves a zone            |

---

## Object-Oriented Principles Used

### 1. Encapsulation

**Definition**: Bundling data and methods that operate on that data within a single unit (class), hiding internal state.

**Implementation in Project**:

```java
// Zone.java - Encapsulates zone data and behavior
public class Zone implements Serializable {
    private String name;
    private int capacity;
    private Set<String> activeUsers;  // Hidden internal state
    private String crowdLevel;

    // Controlled access through methods
    public void addUser(String userId) {
        activeUsers.add(userId);
        updateCrowdLevel();  // Internal state management
    }

    public int getCurrentCount() {
        return activeUsers.size();  // Derived property
    }
}
```

**Benefits**:

- Internal `activeUsers` set is not directly exposed
- Crowd level is automatically updated when users are added/removed
- External code cannot corrupt the internal state

---

### 2. Abstraction

**Definition**: Hiding complex implementation details and showing only essential features.

**Implementation in Project**:

```java
// Service Layer abstracts business logic
@Service
public class CrowdService {
    public Zone getQuietestZone() {
        // Complex logic hidden from controller
        return zones.values().stream()
            .min(Comparator.comparing(Zone::getOccupancyPercentage))
            .orElse(null);
    }
}

// Controller only knows "get quietest zone"
@GetMapping("/quiet")
public ResponseEntity<?> getQuietestZone() {
    Zone quietestZone = crowdService.getQuietestZone();
    return ResponseEntity.ok(convertToDto(quietestZone));
}
```

**DTOs Abstract Internal Models**:

```java
// ZoneDto - Exposes only what frontend needs
public record ZoneDto(
    String name,
    int capacity,
    int currentCount,
    double occupancyPercentage,
    String crowdLevel
) {}
// activeUsers Set is never exposed to frontend
```

---

### 3. Inheritance

**Definition**: Creating new classes based on existing classes to promote code reuse.

**Implementation in Project**:

```java
// All models implement Serializable for persistence
public class Zone implements Serializable { ... }
public class User implements Serializable { ... }
public class AuditLog implements Serializable { ... }

// Spring's inheritance hierarchy
@RestController  // Inherits from @Controller
public class AuthController { ... }

// Repository interface inheritance
public interface UserRepository extends JpaRepository<User, Long> {
    // Inherits all CRUD methods from JpaRepository
    Optional<User> findByEmail(String email);
}
```

---

### 4. Polymorphism

**Definition**: Objects of different types can be accessed through the same interface.

**Implementation in Project**:

```java
// Enum polymorphism for audit actions
public enum AuditAction {
    LOGIN, LOGOUT, SIGNUP, LOGIN_FAILED, TOKEN_REFRESH, PASSWORD_CHANGE
}

// Same method handles different actions
auditLogService.logAction(userId, AuditAction.LOGIN, ...);
auditLogService.logAction(userId, AuditAction.LOGOUT, ...);

// ResponseEntity polymorphism - returns different types
@GetMapping("/crowd")
public ResponseEntity<?> getCrowdStatus() {
    return ResponseEntity.ok(zoneDtos);        // Success response
}
return ResponseEntity.badRequest().body(...);  // Error response
```

**Frontend Interface Polymorphism (TypeScript)**:

```typescript
// Zone interface works for all zone types
interface Zone {
  name: string;
  capacity: number;
  currentCount: number;
  crowdLevel: "LOW" | "MEDIUM" | "HIGH";
}
// Library, Cafeteria, Gym all implement this interface
```

---

### 5. Separation of Concerns

**Definition**: Different sections of the application handle different responsibilities.

**Implementation in Project**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                      LAYERED ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────┤
│  PRESENTATION LAYER (Controllers)                                   │
│  - Handle HTTP requests/responses                                   │
│  - Input validation                                                 │
│  - AuthController, LocationController, RecommendationController     │
├─────────────────────────────────────────────────────────────────────┤
│  BUSINESS LOGIC LAYER (Services)                                    │
│  - Core application logic                                           │
│  - AuthService, CrowdService, AuditLogService                       │
├─────────────────────────────────────────────────────────────────────┤
│  DATA ACCESS LAYER (Repositories)                                   │
│  - Database interactions                                            │
│  - UserRepository, AuditLogRepository                               │
├─────────────────────────────────────────────────────────────────────┤
│  DOMAIN LAYER (Models)                                              │
│  - Business entities                                                │
│  - User, Zone, AuditLog, LoginAttempt                               │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 6. Dependency Injection

**Definition**: Objects receive their dependencies from external sources rather than creating them.

**Implementation in Project**:

```java
@RestController
@RequiredArgsConstructor  // Lombok generates constructor injection
public class AuthController {
    private final AuthService authService;  // Injected by Spring
    private final AuditLogService auditLogService;  // Injected by Spring

    // No manual instantiation needed
    // Spring manages object lifecycle
}

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;  // Injected
    private final JwtTokenProvider jwtTokenProvider;  // Injected
    private final LoginAttemptService loginAttemptService;  // Injected
}
```

**Benefits**:

- Loose coupling between components
- Easy unit testing with mock objects
- Flexible configuration management

---

### Summary Table

| Principle                  | Where Applied              | Example                                               |
| -------------------------- | -------------------------- | ----------------------------------------------------- |
| **Encapsulation**          | Model classes              | `Zone.activeUsers` is private, accessed via methods   |
| **Abstraction**            | Service layer, DTOs        | `CrowdService.getQuietestZone()` hides complexity     |
| **Inheritance**            | Repositories, Serializable | `UserRepository extends JpaRepository`                |
| **Polymorphism**           | Enums, ResponseEntity      | `AuditAction` enum handles multiple action types      |
| **Separation of Concerns** | Layered architecture       | Controller → Service → Repository                     |
| **Dependency Injection**   | Spring annotations         | `@RequiredArgsConstructor`, `@Service`, `@Repository` |

---

## License

This project is for educational purposes.
