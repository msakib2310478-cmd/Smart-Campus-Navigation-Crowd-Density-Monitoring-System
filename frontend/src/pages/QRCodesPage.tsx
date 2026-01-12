import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Navbar } from '../components/Navbar';

interface ZoneQRData {
  name: string;
  icon: string;
  capacity: number;
}

const campusZones: ZoneQRData[] = [
  { name: 'Library', icon: '📚', capacity: 200 },
  { name: 'Cafeteria', icon: '🍽️', capacity: 150 },
  { name: 'Computer Lab', icon: '💻', capacity: 80 },
  { name: 'Study Hall', icon: '📖', capacity: 120 },
  { name: 'Gym', icon: '🏋️', capacity: 100 },
  { name: 'Common Room', icon: '🛋️', capacity: 60 },
  { name: 'Labs', icon: '🔬', capacity: 50 },
  { name: 'Study Room', icon: '✏️', capacity: 40 },
  { name: 'Game Zone', icon: '🎮', capacity: 30 },
];

export const QRCodesPage: React.FC = () => {
  const qrRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const generateQRValue = (zoneName: string, action: 'ENTER' | 'EXIT') => {
    return JSON.stringify({
      zone: zoneName,
      action: action,
      type: 'CAMPUS_NAV_QR',
      version: '1.0',
    });
  };

  const downloadQRCode = (zoneName: string, action: 'ENTER' | 'EXIT') => {
    const key = `${zoneName}-${action}`;
    const container = qrRefs.current[key];
    if (!container) return;

    const svg = container.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.download = `${zoneName}-${action}-QR.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const downloadAllQRCodes = () => {
    campusZones.forEach((zone) => {
      setTimeout(() => downloadQRCode(zone.name, 'ENTER'), 100);
      setTimeout(() => downloadQRCode(zone.name, 'EXIT'), 200);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50">
      <Navbar />
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-teal-900">Zone QR Codes</h1>
              <p className="text-gray-600 mt-2">
                Print and display these QR codes at zone entrances and exits
              </p>
            </div>
            <button
              onClick={downloadAllQRCodes}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
            >
              <span>📥</span> Download All QR Codes
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Instructions</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">For Administrators:</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Download and print the QR codes below</li>
                  <li>Place ENTER QR codes at zone entrances</li>
                  <li>Place EXIT QR codes at zone exits</li>
                  <li>Ensure QR codes are visible and accessible</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">For Users:</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Open the QR Scanner from dashboard</li>
                  <li>Scan ENTER QR when entering a zone</li>
                  <li>Scan EXIT QR when leaving a zone</li>
                  <li>Your location updates automatically</li>
                </ul>
              </div>
            </div>
          </div>

          {/* QR Codes Grid */}
          <div className="space-y-8">
            {campusZones.map((zone) => (
              <div key={zone.name} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">{zone.icon}</span>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{zone.name}</h2>
                    <p className="text-gray-600">Capacity: {zone.capacity} people</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* ENTER QR Code */}
                  <div className="text-center">
                    <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 inline-block">
                      <div
                        ref={(el) => (qrRefs.current[`${zone.name}-ENTER`] = el)}
                      >
                        <QRCodeSVG
                          value={generateQRValue(zone.name, 'ENTER')}
                          size={200}
                          level="H"
                          includeMargin={true}
                          bgColor="#f0fdf4"
                          fgColor="#166534"
                        />
                      </div>
                      <div className="mt-4">
                        <span className="bg-green-500 text-white px-4 py-2 rounded-full font-bold text-lg">
                          ➡️ ENTER
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-gray-600">Scan when entering {zone.name}</p>
                    <button
                      onClick={() => downloadQRCode(zone.name, 'ENTER')}
                      className="mt-2 text-green-600 hover:text-green-700 font-semibold"
                    >
                      📥 Download ENTER QR
                    </button>
                  </div>

                  {/* EXIT QR Code */}
                  <div className="text-center">
                    <div className="bg-red-50 border-2 border-red-500 rounded-lg p-6 inline-block">
                      <div
                        ref={(el) => (qrRefs.current[`${zone.name}-EXIT`] = el)}
                      >
                        <QRCodeSVG
                          value={generateQRValue(zone.name, 'EXIT')}
                          size={200}
                          level="H"
                          includeMargin={true}
                          bgColor="#fef2f2"
                          fgColor="#991b1b"
                        />
                      </div>
                      <div className="mt-4">
                        <span className="bg-red-500 text-white px-4 py-2 rounded-full font-bold text-lg">
                          ⬅️ EXIT
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-gray-600">Scan when leaving {zone.name}</p>
                    <button
                      onClick={() => downloadQRCode(zone.name, 'EXIT')}
                      className="mt-2 text-red-600 hover:text-red-700 font-semibold"
                    >
                      📥 Download EXIT QR
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodesPage;
