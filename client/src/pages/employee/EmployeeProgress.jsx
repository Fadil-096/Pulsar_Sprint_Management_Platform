import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function EmployeeProgress() {
  const { user, token } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      axios.get(`/api/reports/employee/${user.id}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setReport(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [user, token]);

  if (loading) return <div>Loading progress...</div>;
  if (!report) return <div>No progress data available.</div>;

  const chartData = [
    { name: 'Completed', tasks: report.doneCount, fill: 'var(--blue-600)' },
    { name: 'In Progress', tasks: report.taskCount - report.doneCount, fill: 'var(--blue-200)' }
  ];

  return (
    <div>
      <div className="page-header mb-6">
        <h1 className="text-xl font-medium mb-1">My Progress</h1>
        <p className="text-text-secondary text-sm">Your performance and workload analytics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-title">Task Completion Status</div>
          <p className="text-[12px] text-text-secondary mb-4">Your assigned tasks in active sprints.</p>
          <div className="h-[200px] text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'var(--bg-secondary)'}} />
                <Bar dataKey="tasks" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Effort Summary</div>
          <div className="space-y-4 mt-4">
            <div className="flex justify-between items-center py-2 border-b-[0.5px] border-border-light">
              <span className="text-[13px] text-text-secondary">Total Tasks Assigned</span>
              <span className="font-medium">{report.taskCount}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b-[0.5px] border-border-light">
              <span className="text-[13px] text-text-secondary">Total Estimated Hours</span>
              <span className="font-medium">{report.totalEstimatedHours}h</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b-[0.5px] border-border-light">
              <span className="text-[13px] text-text-secondary">Total Logged Hours</span>
              <span className="font-medium text-blue-600">{report.totalSpentHours}h</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b-[0.5px] border-border-light">
              <span className="text-[13px] text-text-secondary">Efficiency (Spent vs Est)</span>
              <span className={`font-medium ${report.totalSpentHours > report.totalEstimatedHours ? 'text-red-600' : 'text-green-600'}`}>
                {report.totalEstimatedHours > 0 
                  ? Math.round((report.totalSpentHours / report.totalEstimatedHours) * 100) 
                  : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
