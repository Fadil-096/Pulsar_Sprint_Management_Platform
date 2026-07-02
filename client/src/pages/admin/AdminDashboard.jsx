import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Users, KanbanSquare, CheckCircle, Activity, Building, ShieldCheck } from 'lucide-react';

export default function AdminDashboard() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axios.get('/api/admin/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch admin stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [token]);

  if (loading) {
    return (
      <div className="flex-1 p-8 text-text-primary h-full overflow-y-auto bg-bg-primary">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white/5 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white/5 rounded"></div>)}
          </div>
        </div>
      </div>
    );
  }

  const cards = [
    { label: 'Total Employees', value: stats?.totalEmployees || 0, icon: <Users size={24} className="text-blue-500" /> },
    { label: 'Total Managers', value: stats?.totalManagers || 0, icon: <ShieldCheck size={24} className="text-purple-500" /> },
    { label: 'Active Sprints', value: stats?.activeSprints || 0, icon: <Activity size={24} className="text-green-500" /> },
    { label: 'Completed Sprints', value: stats?.completedSprints || 0, icon: <CheckCircle size={24} className="text-emerald-500" /> },
  ];

  return (
    <div className="flex-1 p-8 text-text-primary h-full overflow-y-auto bg-bg-primary">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Administrator Dashboard</h1>
        <p className="text-text-secondary">System overview and key metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-bg-card border-[1px] border-line rounded-lg p-6 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[12px] font-bold text-text-secondary uppercase tracking-wider mb-2">{card.label}</div>
              <div className="text-[28px] font-bold text-text-primary leading-none">{card.value}</div>
            </div>
            <div className="p-3 bg-bg-secondary rounded-full border border-line">
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg-card border-[1px] border-line rounded-lg p-6">
          <h3 className="text-[14px] font-bold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
            <Building size={16} /> Departments
          </h3>
          <div className="space-y-4">
            {stats?.departmentDist?.length > 0 ? stats.departmentDist.map((dep, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-[14px]">{dep.name || 'Unassigned'}</span>
                <span className="text-[14px] font-medium bg-bg-secondary px-2 py-1 rounded">{dep.value}</span>
              </div>
            )) : <div className="text-sm text-text-secondary">No department data.</div>}
          </div>
        </div>

        <div className="bg-bg-card border-[1px] border-line rounded-lg p-6">
          <h3 className="text-[14px] font-bold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
            <KanbanSquare size={16} /> Sprints Status
          </h3>
          <div className="space-y-4">
            {stats?.sprintStatusDist?.length > 0 ? stats.sprintStatusDist.map((stat, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-[14px] capitalize">{stat.name}</span>
                <span className="text-[14px] font-medium bg-bg-secondary px-2 py-1 rounded">{stat.value}</span>
              </div>
            )) : <div className="text-sm text-text-secondary">No sprints data.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
