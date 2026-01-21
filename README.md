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
