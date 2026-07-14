import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Settings as SettingsIcon, Bell, Mail, Smartphone } from 'lucide-react';

export default function Settings() {
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
        <div className="w-10 h-10 bg-accent-blue rounded-2xl flex items-center justify-center text-white">
          <SettingsIcon size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Manager Settings</h1>
          <p className="text-text-secondary text-sm mt-1">Configure your preferences and notifications.</p>
        </div>
      </div>

      <div className="bg-bg-card rounded-2xl shadow-sm border border-line-light overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-line-light bg-bg-secondary flex items-center gap-3">
          <Bell className="text-text-muted" size={20} />
          <h2 className="text-lg font-bold text-text-primary">Notification Preferences</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Notification Types */}
            <div>
              <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">Notification Types</h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-3 rounded-2xl border border-line-light hover:bg-gray-50 cursor-pointer transition-colors">
                  <div>
                    <p className="font-bold text-sm text-text-primary">Employee Queries</p>
                    <p className="text-xs text-text-secondary mt-0.5">When someone raises a query in a sprint</p>
                  </div>
                  <input type="checkbox" checked={settings.notify_queries === 1} onChange={() => toggleSetting('notify_queries')} className="w-4 h-4 text-accent-blue rounded-xl border-line focus:ring-[#005AFF]" />
                </label>
                
                <label className="flex items-center justify-between p-3 rounded-2xl border border-line-light hover:bg-gray-50 cursor-pointer transition-colors">
                  <div>
                    <p className="font-bold text-sm text-text-primary">Leave Requests</p>
                    <p className="text-xs text-text-secondary mt-0.5">When someone applies for time off</p>
                  </div>
                  <input type="checkbox" checked={settings.notify_leaves === 1} onChange={() => toggleSetting('notify_leaves')} className="w-4 h-4 text-accent-blue rounded-xl border-line focus:ring-[#005AFF]" />
                </label>
                
                <label className="flex items-center justify-between p-3 rounded-2xl border border-line-light hover:bg-gray-50 cursor-pointer transition-colors">
                  <div>
                    <p className="font-bold text-sm text-text-primary">Sprint Updates</p>
                    <p className="text-xs text-text-secondary mt-0.5">Status changes, completions, deadlines</p>
                  </div>
                  <input type="checkbox" checked={settings.notify_sprints === 1} onChange={() => toggleSetting('notify_sprints')} className="w-4 h-4 text-accent-blue rounded-xl border-line focus:ring-[#005AFF]" />
                </label>
                
                <label className="flex items-center justify-between p-3 rounded-2xl border border-line-light hover:bg-gray-50 cursor-pointer transition-colors">
                  <div>
                    <p className="font-bold text-sm text-text-primary">System Alerts</p>
                    <p className="text-xs text-text-secondary mt-0.5">Platform announcements and updates</p>
                  </div>
                  <input type="checkbox" checked={settings.notify_system === 1} onChange={() => toggleSetting('notify_system')} className="w-4 h-4 text-accent-blue rounded-xl border-line focus:ring-[#005AFF]" />
                </label>
              </div>
            </div>

            {/* Delivery Methods */}
            <div>
              <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">Delivery Methods</h3>
              <div className="space-y-4">
                <label className="flex items-center gap-3 p-4 rounded-2xl border border-line-light hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${settings.delivery_inapp === 1 ? 'bg-blue-100 text-accent-blue' : 'bg-bg-secondary text-text-muted'}`}>
                    <Smartphone size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-text-primary">In-App Notifications</p>
                    <p className="text-xs text-text-secondary mt-0.5">Bell icon badge inside the platform</p>
                  </div>
                  <input type="checkbox" checked={settings.delivery_inapp === 1} onChange={() => toggleSetting('delivery_inapp')} className="w-4 h-4 text-accent-blue rounded-xl border-line focus:ring-[#005AFF]" />
                </label>
                
                <label className="flex items-center gap-3 p-4 rounded-2xl border border-line-light hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${settings.delivery_email === 1 ? 'bg-blue-100 text-accent-blue' : 'bg-bg-secondary text-text-muted'}`}>
                    <Mail size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-text-primary">Email Notifications</p>
                    <p className="text-xs text-text-secondary mt-0.5">Receive digests directly in your inbox</p>
                  </div>
                  <input type="checkbox" checked={settings.delivery_email === 1} onChange={() => toggleSetting('delivery_email')} className="w-4 h-4 text-accent-blue rounded-xl border-line focus:ring-[#005AFF]" />
                </label>
              </div>
            </div>
            
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-line-light bg-bg-secondary flex justify-end">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-accent-blue text-white font-bold text-sm rounded-2xl hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}
