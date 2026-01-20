# Smart Campus Navigation & Crowd Density Monitoring System

A smart campus system that tracks real-time crowd density across locations like libraries, cafeterias, and labs. Student apps send live locations to a server, which updates crowd levels and shows them on a color-coded map, recommends less busy spots, and saves data for analysis.

## Features

- **Real-time Crowd Monitoring**: Track crowd density across all campus zones with live WebSocket updates
- **Interactive Live Map**: Color-coded zone cards showing occupancy levels (Low/Medium/High)
- **Smart Route Planning**: Calculate routes between campus locations with crowd awareness
- **Recommendations**: Get suggestions for less busy locations
- **Issue Reporting**: Report problems or issues at specific zones
- **Admin Dashboard**: Simulation controls for testing crowd scenarios in real-time

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

#### Using GitHub Codespaces

1. Click the **"Code"** button on GitHub
2. Select **"Codespaces"** tab
3. Click **"Create codespace on main"**
4. Wait for the container to build (first time takes ~3-5 minutes)
5. Everything is ready! Use the helper scripts below.

#### Using VS Code Dev Containers

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
