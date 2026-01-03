import { useState, useEffect, type FormEvent } from 'react';
import type { Report, Zone } from '../types';
import { reportApi } from '../api/reports';
import { zoneApi } from '../api/zones';

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    zoneId: '',
    issue: '',
    description: '',
    reportedBy: '',
  });

  useEffect(() => {
    loadReports();
    loadZones();
  }, []);

  const loadReports = async () => {
    try {
      const data = await reportApi.getAllReports();
      setReports(data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    }
  };

  const loadZones = async () => {
    try {
      const data = await zoneApi.getAllZones();
      setZones(data);
    } catch (err) {
      console.error('Failed to load zones:', err);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await reportApi.createReport({
        ...formData,
        zoneName: zones.find(z => z.id === formData.zoneId)?.name,
      });
      setFormData({ zoneId: '', issue: '', description: '', reportedBy: '' });
      setShowForm(false);
      loadReports();
    } catch (err) {
      console.error('Failed to create report:', err);
    }
  };

  return (
    <div className="px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Issue Reports</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {showForm ? 'Cancel' : 'New Report'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Report</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zone
                </label>
                <select
                  value={formData.zoneId}
                  onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select a zone</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Type
                </label>
                <input
                  type="text"
                  value={formData.issue}
                  onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Overcrowding, Cleanliness"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={formData.reportedBy}
                onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Submit Report
            </button>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {reports.length === 0 ? (
          <p className="p-4 text-gray-500">No reports yet</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {reports.map((report) => (
              <li key={report.id} className="px-4 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-blue-600">{report.zoneName}</p>
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800">
                        {report.status}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">{report.issue}</p>
                    <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                    <p className="text-xs text-gray-500">
                      Reported by {report.reportedBy}
                      {report.timestamp && ` on ${new Date(report.timestamp).toLocaleString()}`}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
