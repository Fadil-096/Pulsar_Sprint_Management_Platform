import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export default function ManagerDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We fetch stats for the latest sprint. First we need to get the list of sprints.
    axios.get('/api/sprints', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (res.data.length > 0) {
          const activeSprintId = res.data[0].sprintId;
          return axios.get(`/api/sprints/${activeSprintId}/stats`, { headers: { Authorization: `Bearer ${token}` } });
        }
        return Promise.reject('No sprints found');
      })
      .then(res => {
        setStats(res.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div>Loading dashboard...</div>;
  if (!stats) return <div>No sprint data available.</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="text-xl font-medium mb-1">Dashboard</h1>
        <p className="text-text-secondary text-sm">Active sprint: <strong className="text-text-primary">{stats.sprintId}</strong></p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        <div className="bg-bg-secondary rounded-md p-3.5">
          <div className="text-[11px] text-text-secondary uppercase tracking-wider mb-1">Sprint Velocity</div>
          <div className="text-2xl font-medium">{stats.velocity}%</div>
          <div className="text-[11px] text-text-tertiary mt-1">Completion rate</div>
        </div>
        <div className="bg-bg-secondary rounded-md p-3.5">
          <div className="text-[11px] text-text-secondary uppercase tracking-wider mb-1">Tasks Completed</div>
          <div className="text-2xl font-medium">{stats.doneTasks} / {stats.totalTasks}</div>
          <div className="text-[11px] text-text-tertiary mt-1">Active sprint</div>
        </div>
        <div className="bg-bg-secondary rounded-md p-3.5">
          <div className="text-[11px] text-text-secondary uppercase tracking-wider mb-1">Effort Variance</div>
          <div className={`text-2xl font-medium ${stats.effortVariance > 10 ? 'text-red-600' : stats.effortVariance < -10 ? 'text-green-600' : ''}`}>
            {stats.effortVariance > 0 ? '+' : ''}{stats.effortVariance}%
          </div>
          <div className="text-[11px] text-text-tertiary mt-1">Spent vs estimated</div>
        </div>
        <div className="bg-bg-secondary rounded-md p-3.5">
          <div className="text-[11px] text-text-secondary uppercase tracking-wider mb-1">Team Size</div>
          <div className="text-2xl font-medium">{stats.teamWorkload?.length || 0}</div>
          <div className="text-[11px] text-text-tertiary mt-1">Active members</div>
        </div>
        <div className="bg-bg-secondary rounded-md p-3.5">
          <div className="text-[11px] text-text-secondary uppercase tracking-wider mb-1">Total Est. Hours</div>
          <div className="text-2xl font-medium">{stats.totalEstimatedHours}h</div>
          <div className="text-[11px] text-text-tertiary mt-1">{stats.sprintId}</div>
        </div>
        <div className="bg-bg-secondary rounded-md p-3.5">
          <div className="text-[11px] text-text-secondary uppercase tracking-wider mb-1">Hours Logged</div>
          <div className="text-2xl font-medium">{stats.totalSpentHours}h</div>
          <div className="text-[11px] text-text-tertiary mt-1">{stats.sprintId}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-3.5">
        <div className="card mb-0">
          <div className="card-title">Sprint Burndown</div>
          <div className="h-[210px] text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.burndown}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'var(--bg-secondary)'}} />
                <Legend />
                <Bar dataKey="ideal" name="Ideal Tasks" fill="#888780" opacity={0.5} radius={[2, 2, 0, 0]} />
                <Bar dataKey="actual" name="Actual Tasks" fill="var(--blue-600)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="card mb-0">
          <div className="card-title">Effort: Estimated vs Spent per Employee</div>
          <div className="h-[210px] text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.teamWorkload}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                <XAxis dataKey="name" tickFormatter={(name) => name.split(' ')[0]} axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'var(--bg-secondary)'}} />
                <Legend />
                <Bar dataKey="estimatedHours" name="Estimated" fill="var(--blue-200)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="spentHours" name="Spent" fill="var(--blue-600)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
