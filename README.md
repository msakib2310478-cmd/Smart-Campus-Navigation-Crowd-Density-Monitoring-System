# Smart Campus Navigation & Crowd Density Monitoring System

A smart campus system that tracks real-time crowd density across locations like libraries, cafeterias, and labs. Student apps send live locations to a server, which updates crowd levels and shows them on a color-coded map, recommends less busy spots, and saves data for analysis.

## Features

- **Real-time Crowd Monitoring**: Track crowd density across all campus zones
- **Interactive Live Map**: Color-coded zone cards showing occupancy levels (Low/Medium/High)
- **Smart Recommendations**: Get suggestions for the least crowded locations
- **QR Code Check-in**: Scan zone QR codes to quickly update location
- **User Authentication**: Secure JWT-based login/signup with password validation
- **Profile Management**: View and manage user profile and settings
- **Crowd Statistics**: Analyze patterns and zone occupancy data
- **Audit Logging**: Track user actions for security and analysis

---

## Campus Zones

The system monitors the following zones:

| Zone        | Capacity | Description              |
| ----------- | -------- | ------------------------ |
| Library     | 100      | Study areas and reading  |
| Cafeteria   | 60       | Dining and social spaces |
| Study Room  | 40       | Group study spaces       |
| Game Zone   | 30       | Recreation area          |
| Gym         | 25       | Fitness center           |
| Labs        | 50       | Computing facilities     |
| Common Room | 35       | Relaxation areas         |

---

## Architecture

### Backend (Spring Boot)

- **Framework**: Spring Boot 3.2.0 with Java 17
- **Database**: H2 in-memory database with JPA
- **Security**: JWT authentication with BCrypt password hashing
- **REST API**: RESTful endpoints for auth, location, and recommendations

### Frontend (React + Vite)

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5 for fast development
- **Styling**: Tailwind CSS for responsive design
- **Routing**: React Router v6 with protected routes
- **QR Support**: QR code generation and scanning

---

## Getting Started

### Quick Start with Dev Container (Recommended)

This project includes a fully configured dev container that automatically sets up all dependencies.

#### Running in GitHub Codespaces

1. Navigate to the repository on GitHub
2. Click the green **"Code"** button
3. Select the **"Codespaces"** tab
4. Click **"Create codespace on main"**

Wait for the environment to build (~3-5 minutes), then run:

```bash
./start-all.sh
```

Or start them separately:

```bash
# Terminal 1: Start backend (Spring Boot on port 8080)
./start-backend.sh

# Terminal 2: Start frontend (Vite on port 5173)
./start-frontend.sh
```

#### Using VS Code Dev Containers (Local)

1. Install [Docker](https://www.docker.com/) and [VS Code Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
2. Open the project in VS Code
3. Click **"Reopen in Container"** when prompted
4. Run `./start-all.sh`

---

### Manual Setup (Without Dev Container)

#### Prerequisites

- **Java 17** or higher
- **Maven 3.6+**
- **Node.js 18+** and npm

#### Running the Backend

```bash
cd backend
mvn clean package
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`

#### Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on `http://localhost:5173`

---

## API Endpoints

### Authentication

| Method | Endpoint           | Description           |
| ------ | ------------------ | --------------------- |
| POST   | `/api/auth/signup` | Register new user     |
| POST   | `/api/auth/login`  | Login and get JWT     |
| GET    | `/api/auth/me`     | Get current user info |

### Location & Crowd

| Method | Endpoint               | Description                |
| ------ | ---------------------- | -------------------------- |
| POST   | `/api/location/update` | Update user location       |
| GET    | `/api/location/crowd`  | Get all zones crowd status |
| GET    | `/api/location/quiet`  | Get quietest zone          |

### Recommendations

| Method | Endpoint                | Description                   |
| ------ | ----------------------- | ----------------------------- |
| GET    | `/api/recommend/best`   | Get best (least crowded) zone |
| GET    | `/api/recommend/ranked` | Get zones ranked by occupancy |

---

## Frontend Routes

| Route         | Page               | Access    | Description                       |
| ------------- | ------------------ | --------- | --------------------------------- |
| `/`           | HomePage           | Public    | Landing page                      |
| `/signup`     | SignupPage         | Public    | User registration                 |
| `/login`      | LoginPage          | Public    | User login                        |
| `/dashboard`  | DashboardPage      | Protected | Main dashboard with quick actions |
| `/map`        | LiveMapPage        | Protected | Live crowd density map            |
| `/statistics` | StatisticsPage     | Protected | Crowd analytics and patterns      |
| `/recommend`  | RecommendationPage | Protected | Smart zone recommendations        |
| `/profile`    | ProfilePage        | Protected | User profile management           |
| `/qr-codes`   | QRCodesPage        | Protected | View/download zone QR codes       |
| `/scanner`    | QRScannerPage      | Protected | Scan QR codes for check-in        |

---

## Project Structure

```
.
├── backend/
│   ├── pom.xml
│   ├── crowd_data.ser              # Serialized crowd backup
│   └── src/main/java/com/uiu/campus/
│       ├── CampusNavigationApplication.java
│       ├── config/
│       │   ├── CrowdBackupScheduler.java
│       │   └── WebConfig.java
│       ├── controller/
│       │   ├── AuthController.java
│       │   ├── LocationController.java
│       │   └── RecommendationController.java
│       ├── dto/
│       │   ├── AuthRequest.java
│       │   ├── AuthResponse.java
│       │   └── ZoneDto.java
│       ├── model/
│       │   ├── AuditLog.java
│       │   ├── LocationUpdate.java
│       │   ├── LoginAttempt.java
│       │   ├── User.java
│       │   └── Zone.java
│       ├── repository/
│       │   ├── AuditLogRepository.java
│       │   ├── LoginAttemptRepository.java
│       │   └── UserRepository.java
│       ├── security/
│       │   └── JwtTokenProvider.java
│       ├── service/
│       │   ├── AuditLogService.java
│       │   ├── AuthService.java
│       │   ├── CrowdService.java
│       │   └── LoginAttemptService.java
│       └── util/
│           ├── CrowdBackupUtil.java
│           └── PasswordValidator.java
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── index.css
│       ├── components/
│       │   ├── Navbar.tsx
│       │   ├── PrivateRoute.tsx
│       │   └── ZoneCard.tsx
│       ├── context/
│       │   └── AuthContext.tsx
│       ├── pages/
│       │   ├── DashboardPage.tsx
│       │   ├── HomePage.tsx
│       │   ├── LiveMapPage.tsx
│       │   ├── LoginPage.tsx
│       │   ├── ProfilePage.tsx
│       │   ├── QRCodesPage.tsx
│       │   ├── QRScannerPage.tsx
│       │   ├── RecommendationPage.tsx
│       │   ├── SignupPage.tsx
│       │   └── StatisticsPage.tsx
│       ├── services/
│       │   └── api.ts
│       └── types/
│           └── index.ts
│
├── start-all.sh          # Start both servers
├── start-backend.sh      # Start backend only
└── start-frontend.sh     # Start frontend only
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
                                      │ HTTP REST
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SERVER LAYER                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                  Spring Boot Backend (Java 17)                       │    │
│  │                                                                      │    │
│  │  ┌────────────────┐    ┌────────────────┐    ┌──────────────────┐   │    │
│  │  │   Controllers  │    │    Services    │    │   Repositories   │   │    │
│  │  │ AuthController │───▶│  AuthService   │───▶│  UserRepository  │   │    │
│  │  │LocationController│─▶│  CrowdService  │    │AuditLogRepository│   │    │
│  │  │RecommendController│▶│ AuditLogService│    │LoginAttemptRepo  │   │    │
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
│  │   H2 Database (JPA)     │    │      In-Memory Storage              │     │
│  │   - users table         │    │   - ConcurrentHashMap (zones)       │     │
│  │   - audit_logs table    │    │   - User-to-zone tracking           │     │
│  │   - login_attempts      │    │   - Serialized backup (crowd_data)  │     │
│  └─────────────────────────┘    └─────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Request Flow

1. **User Action**: User interacts with the React frontend (e.g., scans QR code, views map)
2. **API Call**: Frontend makes HTTP request via Axios to backend REST endpoints
3. **Controller Layer**: Spring Boot controller receives request, validates input
4. **Service Layer**: Business logic is executed (authentication, crowd calculations)
5. **Data Layer**: Data is persisted/retrieved from database or in-memory storage
6. **Response**: JSON response is sent back through the layers to the frontend
7. **UI Update**: React state updates and component re-renders with new data

---

## CRUD Operations

### Location Management

| Operation  | HTTP Method | Endpoint                      | Description          |
| ---------- | ----------- | ----------------------------- | -------------------- |
| **Create** | POST        | `/api/location/update`        | User enters a zone   |
| **Read**   | GET         | `/api/location/crowd`         | Get all zones data   |
| **Read**   | GET         | `/api/recommend/best`         | Get least crowded    |
| **Update** | POST        | `/api/location/update`        | Update user location |
| **Delete** | POST        | `/api/location/update` (EXIT) | User leaves zone     |

---

## Object-Oriented Principles

### 1. Encapsulation

```java
// Zone.java - Private state with controlled access
public class Zone implements Serializable {
    private String name;
    private int capacity;
    private Set<String> activeUsers;  // Hidden internal state

    public void addUser(String userId) {
        activeUsers.add(userId);
        updateCrowdLevel();  // Internal state management
    }
}
```

### 2. Abstraction

```java
// Service layer abstracts business logic
@Service
public class CrowdService {
    public Zone getQuietestZone() {
        return zones.values().stream()
            .min(Comparator.comparing(Zone::getOccupancyPercentage))
            .orElse(null);
    }
}
```

### 3. Separation of Concerns

```
┌─────────────────────────────────────┐
│  PRESENTATION (Controllers)         │  Handle HTTP requests
├─────────────────────────────────────┤
│  BUSINESS LOGIC (Services)          │  Core application logic
├─────────────────────────────────────┤
│  DATA ACCESS (Repositories)         │  Database interactions
├─────────────────────────────────────┤
│  DOMAIN (Models)                    │  Business entities
└─────────────────────────────────────┘
```

### 4. Dependency Injection

```java
@RestController
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;         // Injected by Spring
    private final AuditLogService auditLogService; // Injected by Spring
}
```

---

## Configuration

### Backend (application.properties)

```properties
server.port=8080
spring.datasource.url=jdbc:h2:mem:campusdb
jwt.secret=your-secret-key
jwt.expiration=86400000
```

### Frontend (vite.config.ts)

The frontend proxies API requests to the backend on port 8080.

---

## Building for Production

### Backend

```bash
cd backend
mvn clean package -DskipTests
java -jar target/campus-navigation-backend-1.0.0.jar
```

### Frontend

```bash
cd frontend
npm run build
# Output in frontend/dist/
```

---

## License

This project is for educational purposes.
