import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './layouts/Layout';
import Landing from './pages/Landing';
import LiveMap from './pages/LiveMap';
import Zones from './pages/Zones';
import ZoneDetails from './pages/ZoneDetails';
import RoutePlanner from './pages/RoutePlanner';
import Recommendations from './pages/Recommendations';
import Reports from './pages/Reports';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="live" element={<LiveMap />} />
          <Route path="zones" element={<Zones />} />
          <Route path="zones/:zoneId" element={<ZoneDetails />} />
          <Route path="route" element={<RoutePlanner />} />
          <Route path="recommendations" element={<Recommendations />} />
          <Route path="reports" element={<Reports />} />
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
