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

### Prerequisites

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
  port: 8080  # Change backend port

spring:
  web:
    cors:
      allowed-origins: "http://localhost:5173,http://localhost:3000"  # Add allowed origins
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

- Java Extension Pack
- Spring Boot Extension Pack
- ESLint
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)

## Project Structure

```
.
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
└── frontend/
    ├── src/
    │   ├── api/             # API client modules
    │   ├── components/      # Reusable components
    │   ├── layouts/         # Layout components
    │   ├── pages/           # Page components
    │   ├── realtime/        # WebSocket client
    │   ├── types/           # TypeScript types
    │   ├── App.tsx
    │   └── main.tsx
    ├── .env
    ├── package.json
    └── tailwind.config.js
```

## License

This project is for educational purposes.
