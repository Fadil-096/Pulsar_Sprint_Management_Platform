import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export default function Reports() {
  const { token } = useAuth();
  const [velocityData, setVelocityData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app we'd fetch from /api/reports/velocity, but let's simulate the data
    // based on the sprints for a quick prototype.
    axios.get('/api/sprints', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        const sorted = res.data.sort((a,b) => a.id - b.id);
        const vData = sorted.map(s => ({
          name: s.sprintId,
          completed: s.doneCount,
          total: s.taskCount
        }));
        setVelocityData(vData);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div>Loading reports...</div>;

  return (
    <div>
      <div className="page-header mb-6">
        <h1 className="text-xl font-medium mb-1">Reports & Analytics</h1>
        <p className="text-text-secondary text-sm">Review team performance metrics across sprints.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-title">Sprint Velocity Trend</div>
          <p className="text-[12px] text-text-secondary mb-4">Total vs Completed tasks over recent sprints</p>
          <div className="h-[250px] text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={velocityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'var(--bg-secondary)'}} />
                <Legend />
                <Line type="monotone" dataKey="total" name="Total Tasks" stroke="var(--blue-200)" strokeWidth={2} />
                <Line type="monotone" dataKey="completed" name="Completed Tasks" stroke="var(--blue-600)" strokeWidth={2} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Generate PDF Report</div>
          <p className="text-[12px] text-text-secondary mb-4">Download a detailed performance summary.</p>
          
          <div className="space-y-4">
            <div className="p-4 border-[0.5px] border-border-medium rounded-md hover:border-blue-400 transition-colors cursor-pointer bg-bg-secondary flex justify-between items-center">
              <div>
                <h3 className="font-medium text-[14px]">End of Sprint Report</h3>
                <p className="text-[12px] text-text-secondary">Summary of tasks, burndown, and bottlenecks.</p>
              </div>
              <button className="btn btn-sm btn-primary">Download</button>
            </div>
            
            <div className="p-4 border-[0.5px] border-border-medium rounded-md hover:border-blue-400 transition-colors cursor-pointer bg-bg-secondary flex justify-between items-center">
              <div>
                <h3 className="font-medium text-[14px]">Team Performance</h3>
                <p className="text-[12px] text-text-secondary">Individual workload and efficiency metrics.</p>
              </div>
              <button className="btn btn-sm btn-primary">Download</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
