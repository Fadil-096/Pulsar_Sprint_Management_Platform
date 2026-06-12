import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Settings as SettingsIcon, Bell, Mail, Smartphone } from 'lucide-react';

export default function EmployeeSettings() {
  const { token } = useAuth();
  const [settings, setSettings] = useState({
    notify_queries: 1,
    notify_leaves: 1,
    notify_sprints: 1,
    notify_system: 1,
    delivery_inapp: 1,
    delivery_email: 0
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('/api/settings/notifications', { headers: { Authorization: `Bearer ${token}` } });
        setSettings(res.data);
      } catch (err) {
        console.error('Failed to load settings', err);
      }
    };
    if (token) fetchSettings();
  }, [token]);

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: prev[key] === 1 ? 0 : 1 }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put('/api/settings/notifications', settings, { headers: { Authorization: `Bearer ${token}` } });
      alert('Settings saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[#005AFF] rounded-lg flex items-center justify-center text-white">
          <SettingsIcon size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#020024]">My Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Configure your preferences and notifications.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
          <Bell className="text-gray-400" size={20} />
          <h2 className="text-lg font-bold text-[#020024]">Notification Preferences</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Notification Types */}
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Notification Types</h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div>
                    <p className="font-bold text-sm text-gray-800">My Queries</p>
                    <p className="text-xs text-gray-500 mt-0.5">When someone replies to your queries</p>
                  </div>
                  <input type="checkbox" checked={settings.notify_queries === 1} onChange={() => toggleSetting('notify_queries')} className="w-4 h-4 text-[#005AFF] rounded border-gray-300 focus:ring-[#005AFF]" />
                </label>
                
                <label className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div>
                    <p className="font-bold text-sm text-gray-800">Leave Request Updates</p>
                    <p className="text-xs text-gray-500 mt-0.5">Approvals and rejections for your leaves</p>
                  </div>
                  <input type="checkbox" checked={settings.notify_leaves === 1} onChange={() => toggleSetting('notify_leaves')} className="w-4 h-4 text-[#005AFF] rounded border-gray-300 focus:ring-[#005AFF]" />
                </label>
                
                <label className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div>
                    <p className="font-bold text-sm text-gray-800">Sprint & Task Updates</p>
                    <p className="text-xs text-gray-500 mt-0.5">Task assignments, status changes, deadlines</p>
                  </div>
                  <input type="checkbox" checked={settings.notify_sprints === 1} onChange={() => toggleSetting('notify_sprints')} className="w-4 h-4 text-[#005AFF] rounded border-gray-300 focus:ring-[#005AFF]" />
                </label>
                
                <label className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div>
                    <p className="font-bold text-sm text-gray-800">System Alerts</p>
                    <p className="text-xs text-gray-500 mt-0.5">Platform announcements and updates</p>
                  </div>
                  <input type="checkbox" checked={settings.notify_system === 1} onChange={() => toggleSetting('notify_system')} className="w-4 h-4 text-[#005AFF] rounded border-gray-300 focus:ring-[#005AFF]" />
                </label>
              </div>
            </div>

            {/* Delivery Methods */}
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Delivery Methods</h3>
              <div className="space-y-4">
                <label className="flex items-center gap-3 p-4 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${settings.delivery_inapp === 1 ? 'bg-blue-100 text-[#005AFF]' : 'bg-gray-100 text-gray-400'}`}>
                    <Smartphone size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-gray-800">In-App Notifications</p>
                    <p className="text-xs text-gray-500 mt-0.5">Bell icon badge inside the platform</p>
                  </div>
                  <input type="checkbox" checked={settings.delivery_inapp === 1} onChange={() => toggleSetting('delivery_inapp')} className="w-4 h-4 text-[#005AFF] rounded border-gray-300 focus:ring-[#005AFF]" />
                </label>
                
                <label className="flex items-center gap-3 p-4 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${settings.delivery_email === 1 ? 'bg-blue-100 text-[#005AFF]' : 'bg-gray-100 text-gray-400'}`}>
                    <Mail size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-gray-800">Email Notifications</p>
                    <p className="text-xs text-gray-500 mt-0.5">Receive digests directly in your inbox</p>
                  </div>
                  <input type="checkbox" checked={settings.delivery_email === 1} onChange={() => toggleSetting('delivery_email')} className="w-4 h-4 text-[#005AFF] rounded border-gray-300 focus:ring-[#005AFF]" />
                </label>
              </div>
            </div>
            
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-[#005AFF] text-white font-bold text-sm rounded-lg hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}
