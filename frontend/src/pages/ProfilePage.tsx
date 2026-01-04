import { useAuth } from '../context/AuthContext';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-teal-900 mb-8">My Profile</h1>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Profile Header */}
          <div className="text-center mb-8 pb-8 border-b">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-4xl mb-4">
              👤
            </div>
            <h2 className="text-3xl font-bold text-gray-900">{user.fullName}</h2>
            <p className="text-gray-600 mt-2">Campus Navigation Member</p>
          </div>

          {/* Profile Information */}
          <div className="space-y-6">
            <InfoField label="Full Name" value={user.fullName} />
            <InfoField label="Email" value={user.email || 'Not provided'} />
            <InfoField label="Student ID" value={user.studentId || 'Not provided'} />
            <InfoField label="User ID" value={String(user.userId)} />
          </div>

          {/* Account Statistics */}
          <div className="mt-12 pt-8 border-t">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Account Statistics</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <StatCard label="Active Since" value="Today" />
              <StatCard label="Locations Visited" value="0" />
              <StatCard label="Updates Made" value="0" />
              <StatCard label="Account Status" value="Active" />
            </div>
          </div>

          {/* Account Settings */}
          <div className="mt-12 pt-8 border-t">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Settings</h3>
            <div className="space-y-4">
              <SettingOption label="Email Notifications" enabled={true} />
              <SettingOption label="Location Sharing" enabled={true} />
              <SettingOption label="Crowd Alerts" enabled={true} />
            </div>
          </div>

          {/* Help & Support */}
          <div className="mt-12 pt-8 border-t">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Help & Support</h3>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded transition">
                📚 How to Use Campus Navigation
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded transition">
                ❓ Frequently Asked Questions
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded transition">
                📧 Contact Support
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded transition">
                📋 Privacy Policy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface InfoFieldProps {
  label: string;
  value: string;
}

const InfoField: React.FC<InfoFieldProps> = ({ label, value }) => (
  <div className="flex justify-between items-center py-3 border-b">
    <label className="font-semibold text-gray-700">{label}</label>
    <span className="text-gray-900">{value}</span>
  </div>
);

interface StatCardProps {
  label: string;
  value: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value }) => (
  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-4 border border-teal-200">
    <p className="text-sm text-gray-600 mb-1">{label}</p>
    <p className="text-2xl font-bold text-teal-600">{value}</p>
  </div>
);

interface SettingOptionProps {
  label: string;
  enabled: boolean;
}

const SettingOption: React.FC<SettingOptionProps> = ({ label, enabled }) => (
  <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded border border-gray-200">
    <label className="text-gray-700">{label}</label>
    <input type="checkbox" defaultChecked={enabled} className="w-5 h-5 text-teal-600 rounded" />
  </div>
);
