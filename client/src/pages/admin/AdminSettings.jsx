import React from 'react';
import { Settings, Save } from 'lucide-react';

export default function AdminSettings() {
  return (
    <div className="flex-1 p-8 text-text-primary h-full overflow-y-auto bg-bg-primary">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-2 flex items-center gap-2">
            <Settings className="text-accent-blue" />
            System Settings
          </h1>
          <p className="text-text-secondary">Configure global platform behavior.</p>
        </div>
        <button className="bg-accent-blue hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors">
          <Save size={18} /> Save Changes
        </button>
      </div>

      <div className="max-w-3xl space-y-6">
        <div className="bg-bg-card border-[1px] border-line rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4">Notification Defaults</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4 text-accent-blue rounded-xl border-line" defaultChecked />
              <span className="text-[14px]">Email notifications for new tasks</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4 text-accent-blue rounded-xl border-line" defaultChecked />
              <span className="text-[14px]">Daily summary emails for managers</span>
            </label>
          </div>
        </div>


      </div>
    </div>
  );
}
