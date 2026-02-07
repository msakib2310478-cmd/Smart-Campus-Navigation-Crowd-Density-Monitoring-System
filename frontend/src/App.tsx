import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { PrivateRoute } from "./components/PrivateRoute";
import { AdminRoute } from "./components/AdminRoute";
import { HomePage } from "./pages/HomePage";
import { SignupPage } from "./pages/SignupPage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LiveMapPage } from "./pages/LiveMapPage";
import { StatisticsPage } from "./pages/StatisticsPage";
import { RecommendationPage } from "./pages/RecommendationPage";
import { ProfilePage } from "./pages/ProfilePage";
import { QRCodesPage } from "./pages/QRCodesPage";
import { QRScannerPage } from "./pages/QRScannerPage";
import { AdminZonePage } from "./pages/AdminZonePage";
import { AdminZoneMap } from "./pages/AdminZoneMap";
import "./index.css";

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Private Routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/map" element={<LiveMapPage />} />
              <Route path="/statistics" element={<StatisticsPage />} />
              <Route path="/recommend" element={<RecommendationPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/qr-codes" element={<QRCodesPage />} />
              <Route path="/scanner" element={<QRScannerPage />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin/zones" element={<AdminZonePage />} />
              <Route path="/admin/map" element={<AdminZoneMap />} />
            </Route>
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
