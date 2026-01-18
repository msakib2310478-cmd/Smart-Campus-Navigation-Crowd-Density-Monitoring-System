import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { locationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { LocationUpdateResponse } from '../types';

interface QRData {
  zone: string;
  action: 'ENTER' | 'EXIT';
  type: string;
  version: string;
}

export const QRScannerPage: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastScanned, setLastScanned] = useState<QRData | null>(null);
  const [processing, setProcessing] = useState(false);
  const [currentZone, setCurrentZone] = useState<string | null>(null);
  const [autoExitInfo, setAutoExitInfo] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch user's current zone on mount
  useEffect(() => {
    const fetchCurrentZone = async () => {
      if (user) {
        try {
          const userId = user.studentId ?? String(user.userId);
          const response = await locationAPI.getUserCurrentZone(userId);
          setCurrentZone(response.data.currentZone);
        } catch (err) {
          console.error('Failed to fetch current zone:', err);
        }
      }
    };
    fetchCurrentZone();
  }, [user]);

  const stopScanning = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        // Ignore stop errors
      }
      try {
        scannerRef.current.clear();
      } catch (err) {
        // Ignore clear errors
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Start scanner when scanning becomes true
  useEffect(() => {
    if (!scanning) return;
    if (scannerRef.current) return; // Already initialized

    const initScanner = async () => {
      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 200));

      const qrReaderElement = document.getElementById('qr-reader');
      if (!qrReaderElement) {
        setError('Scanner element not found. Please try again.');
        setScanning(false);
        return;
      }

      try {
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          async (decodedText) => {
            if (processingRef.current) return;
            processingRef.current = true;
            await handleScanSuccess(decodedText);
          },
          () => {
            // Ignore scan failures - they happen continuously when no QR is visible
          }
        );
      } catch (err: any) {
        console.error('Scanner error:', err);
        setError('Failed to start camera: ' + (err.message || 'Unknown error'));
        setScanning(false);
      }
    };

    initScanner();
  }, [scanning]);

  const handleScanSuccess = async (decodedText: string) => {
    try {
      const data: QRData = JSON.parse(decodedText);

      if (data.type !== 'CAMPUS_NAV_QR') {
        setError('Invalid QR code. Please scan a valid Campus Navigation QR code.');
        processingRef.current = false;
        return;
      }

      setProcessing(true);
      setLastScanned(data);
      setError('');
      setAutoExitInfo(null);

      // Stop scanning
      await stopScanning();

      // Update location
      if (!user) {
        setError('Please log in first');
        setProcessing(false);
        processingRef.current = false;
        return;
      }

      try {
        const response = await locationAPI.updateLocation({
          userId: user.studentId ?? String(user.userId),
          zoneName: data.zone,
          action: data.action,
        });

        const result: LocationUpdateResponse = response.data;
        
        // Update current zone state
        setCurrentZone(result.currentZone);
        
        // Build success message
        if (result.autoExited && result.previousZone) {
          setAutoExitInfo(`Automatically exited from ${result.previousZone}`);
          setSuccess(
            `Successfully entered ${data.zone}! You were automatically checked out from ${result.previousZone}.`
          );
        } else {
          setSuccess(
            `Successfully ${data.action === 'ENTER' ? 'entered' : 'exited'} ${data.zone}! ` +
            'Crowd count has been updated.'
          );
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to update location');
      }

      setProcessing(false);
      processingRef.current = false;
    } catch (err) {
      setError('Invalid QR code format. Please scan a valid Campus Navigation QR code.');
      processingRef.current = false;
    }
  };

  const requestCameraPermission = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionGranted(true);
      return true;
    } catch (err) {
      setPermissionGranted(false);
      setError('Camera permission denied. Please allow camera access to scan QR codes.');
      return false;
    }
  };

  const startScanning = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    setError('');
    setSuccess('');
    setLastScanned(null);
    processingRef.current = false;
    setScanning(true);
  };

  const scanAgain = () => {
    setLastScanned(null);
    setSuccess('');
    setError('');
    setAutoExitInfo(null);
    startScanning();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50">
      <Navbar />
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-teal-900 mb-2">QR Scanner</h1>
          <p className="text-gray-600 mb-8">
            Scan zone QR codes to update your location
          </p>

          {/* Current Zone Status */}
          <div className={`px-6 py-4 rounded-lg mb-6 ${
            currentZone 
              ? 'bg-teal-100 border border-teal-400 text-teal-800' 
              : 'bg-gray-100 border border-gray-300 text-gray-600'
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{currentZone ? '📍' : '🚶'}</span>
              <div>
                <h3 className="font-bold">Current Location</h3>
                <p>
                  {currentZone 
                    ? `You are currently in: ${currentZone}` 
                    : 'You are not checked into any zone'}
                </p>
                {currentZone && (
                  <p className="text-sm mt-1 text-teal-600">
                    💡 Scanning an ENTER QR for a different zone will automatically check you out from here.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Permission Status */}
          {permissionGranted === false && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚫</span>
                <div>
                  <h3 className="font-bold">Camera Access Denied</h3>
                  <p className="text-sm">
                    Please enable camera permissions in your browser settings to use the QR scanner.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Auto-Exit Info */}
          {autoExitInfo && (
            <div className="bg-amber-100 border border-amber-400 text-amber-800 px-6 py-4 rounded-lg mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔄</span>
                <div>
                  <h3 className="font-bold">Auto Checkout</h3>
                  <p>{autoExitInfo}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-800 px-6 py-4 rounded-lg mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <h3 className="font-bold">Success!</h3>
                  <p>{success}</p>
                </div>
              </div>
            </div>
          )}

          {/* Scanner Container */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            {!scanning && !lastScanned && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📷</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Ready to Scan
                </h2>
                <p className="text-gray-600 mb-6">
                  Point your camera at a zone QR code to update your location
                </p>
                <button
                  onClick={startScanning}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition flex items-center gap-3 mx-auto"
                >
                  <span>📸</span> Start Scanning
                </button>
              </div>
            )}

            {scanning && (
              <div>
                <div id="qr-reader" style={{ width: '100%', minHeight: '300px' }}></div>
                <div className="text-center mt-4">
                  <p className="text-gray-600 mb-4">
                    Position the QR code within the frame
                  </p>
                  <button
                    onClick={stopScanning}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {lastScanned && !scanning && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">
                  {lastScanned.action === 'ENTER' ? '➡️' : '⬅️'}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {lastScanned.action === 'ENTER' ? 'Entered' : 'Exited'} {lastScanned.zone}
                </h2>
                <p className="text-gray-600 mb-6">
                  Your location has been updated
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={scanAgain}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                  >
                    Scan Another
                  </button>
                  <button
                    onClick={() => navigate('/map')}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-semibold transition"
                  >
                    View Map
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📋 How to Use</h3>
            <div className="space-y-3 text-gray-600">
              <div className="flex items-start gap-3">
                <span className="bg-teal-100 text-teal-700 rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm">1</span>
                <p>Click "Start Scanning" and allow camera access when prompted</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-teal-100 text-teal-700 rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm">2</span>
                <p>Point your camera at the QR code at a zone entrance or exit</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-teal-100 text-teal-700 rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm">3</span>
                <p>Hold steady until the QR code is recognized</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-teal-100 text-teal-700 rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm">4</span>
                <p>Your location will be automatically updated in the system</p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-6 flex gap-4 justify-center">
            <button
              onClick={() => navigate('/qr-codes')}
              className="text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-2"
            >
              <span>📱</span> View QR Codes
            </button>
            <button
              onClick={() => navigate('/map')}
              className="text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-2"
            >
              <span>🗺️</span> Live Map
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScannerPage;
