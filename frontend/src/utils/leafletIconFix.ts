/**
 * Leaflet Icon Fix for React/Webpack/Vite
 *
 * Leaflet's default marker icons break in bundlers because the URLs
 * are incorrectly resolved. This fix manually configures the icon paths.
 */
import L from "leaflet";

// Fix the default icon issue by using CDN URLs for the marker icons
// This avoids bundler issues with importing PNG files
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default L;
