import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export default function EmployeeProgress() {
  const { user, token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSprintId, setSelectedSprintId] = useState('ALL');

  useEffect(() => {
    if (user?.id) {
      axios.get(`/api/reports/employee/${user.id}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setData(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [user, token]);

  if (loading) return <div className="p-8 text-center text-text-secondary">Loading progress data...</div>;
  if (!data) return <div className="p-8 text-center text-text-secondary">No progress data available.</div>;

  // ── FILTER DATA BY SELECTED SPRINT ──
  const { sprints, tasks, subtasks, timers } = data;
  
  const filteredTasks = selectedSprintId === 'ALL' 
    ? tasks 
    : tasks.filter(t => t.sprint_id === selectedSprintId);

  // ── EFFORT SUMMARY ──
  const totalTasks = filteredTasks.length;
  const totalEst = filteredTasks.reduce((acc, t) => acc + t.estimated_hours, 0);
  
  let totalAct = 0;
  if (selectedSprintId === 'ALL') {
    totalAct = timers.reduce((acc, t) => acc + t.duration / 3600, 0);
  } else {
    // get timers just for subtasks of tasks in this sprint
    const filteredTaskIds = filteredTasks.map(t => t.task_id);
    const sprintSubtasks = subtasks.filter(s => filteredTaskIds.includes(s.task_id));
    const subtaskIds = sprintSubtasks.map(s => s.subtask_id);
    const sprintTimers = timers.filter(t => subtaskIds.includes(t.subtask_id));
    totalAct = sprintTimers.reduce((acc, t) => acc + t.duration / 3600, 0);
  }
  
  const actHours = Math.round(totalAct);
  
  let effColor = 'text-red-600';
    
  // ── TASK COMPLETION DONUT CHART ──
  const statusCounts = {
    'done': 0,
    'inprogress': 0,
    'todo': 0,
    'blocked': 0
  };
  filteredTasks.forEach(t => {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
  });

  const pieData = [
    { name: 'Done', value: statusCounts.done, color: '#22c55e' },        // bright green
    { name: 'In Progress', value: statusCounts.inprogress, color: '#3b82f6' }, // bright blue
    { name: 'To Do', value: statusCounts.todo, color: '#94a3b8' },        // solid gray
    { name: 'Blocked', value: statusCounts.blocked, color: '#ef4444' }    // bright red
  ].filter(d => d.value > 0);



  // ── SPRINT-WISE PERFORMANCE TABLE ──
  // Calculate per sprint metrics
  const sprintMetrics = sprints.map(s => {
    const sTasks = tasks.filter(t => t.sprint_id === s.sprint_id);
    const sEst = sTasks.reduce((acc, t) => acc + t.estimated_hours, 0);
    
    const sTaskIds = sTasks.map(t => t.task_id);
    const sSubtasks = subtasks.filter(sub => sTaskIds.includes(sub.task_id));
    const sSubtaskIds = sSubtasks.map(sub => sub.subtask_id);
    const sTimers = timers.filter(tmr => sSubtaskIds.includes(tmr.subtask_id));
    const sAct = Math.round(sTimers.reduce((acc, tmr) => acc + tmr.duration / 3600, 0));
    
    const sEff = sAct > 0 ? Math.round((sEst / sAct) * 100) : (sEst > 0 ? 100 : 0);
    
    return {
      ...s,
      assigned: sTasks.length,
      done: sTasks.filter(t => t.status === 'done').length,
      est: sEst,
      act: sAct,
      eff: sEff
    };
  });

  // ── EFFICIENCY TREND / TASK PERFORMANCE ──
  let trendData = [];
  let trendTitle = "Efficiency Trend Across Sprints";
  let trendDesc = "Target is 100% (Est = Act). Higher is better.";

  if (selectedSprintId === 'ALL') {
    trendData = [...sprintMetrics].sort((a,b) => a.id - b.id).map(s => ({
      name: s.sprint_id,
      efficiency: s.eff
    }));
  } else {
    trendTitle = "Task Efficiency in Sprint";
    trendDesc = "Efficiency score per task in the selected sprint.";
    trendData = filteredTasks.map(t => {
      const tSubs = subtasks.filter(s => s.task_id === t.task_id);
      const subtaskIds = tSubs.map(s => s.subtask_id);
      const tTimers = timers.filter(tmr => subtaskIds.includes(tmr.subtask_id));
      const tAct = tTimers.reduce((acc, tmr) => acc + tmr.duration / 3600, 0);
      const tEff = tAct > 0 ? Math.round((t.estimated_hours / tAct) * 100) : (t.estimated_hours > 0 ? 100 : 0);
      return {
        name: t.task_id,
        efficiency: tEff
      };
    });
  }

  return (
    <div>
      <div className="page-header mb-6">
        <h1 className="text-xl font-medium mb-1">My Progress</h1>
        <p className="text-text-secondary text-sm">Your performance and workload analytics.</p>
        
        {/* Sprint Selector */}
        <div className="mt-4 flex items-center gap-2">
          <label className="text-[11px] text-text-secondary font-bold uppercase tracking-wider">SELECT SPRINT:</label>
          <select 
            value={selectedSprintId} 
            onChange={(e) => setSelectedSprintId(e.target.value)}
            className="p-1 border border-line rounded text-sm bg-bg-card focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue w-auto max-w-full"
          >
            <option value="ALL">All Sprints (Aggregate)</option>
            {sprints.map(s => (
              <option key={s.sprint_id} value={s.sprint_id}>
                {s.sprint_id} — {s.sprint_name} [{s.status.toUpperCase()}]
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Task Completion Donut Chart */}
        <div className="card">
          <div className="card-title">Task Completion Status</div>
          <p className="text-[12px] text-text-secondary mb-4">Breakdown of task statuses.</p>
          <div className="h-[200px] text-xs">
            {pieData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-text-muted">
                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                <p>No tasks assigned yet.</p>
                <p className="text-[10px]">Tasks will appear here once assigned.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip  contentStyle={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} itemStyle={{ color: 'var(--color-text-secondary)' }}/>
                  <Legend verticalAlign="bottom" height={36}/>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    dataKey="value"
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#e2e8f0" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Effort Summary removed */}
      </div>

      {/* New Sections below */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Efficiency Trend Chart removed */}

        {/* Subtask Completion Summary */}
        <div className="card">
          <div className="card-title">Subtask Progress</div>
          <p className="text-[12px] text-text-secondary mb-4">Subtask completion for assigned tasks.</p>
          <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
            {filteredTasks.length === 0 && <div className="text-xs text-text-muted text-center py-4">No tasks found.</div>}
            {filteredTasks.map(t => {
              const tSubs = subtasks.filter(s => s.task_id === t.task_id);
              const doneSubs = tSubs.filter(s => s.status === 'done').length;
              const totalSubs = tSubs.length;
              const pct = totalSubs > 0 ? (doneSubs / totalSubs) * 100 : 0;
              
              const tSubIds = tSubs.map(s => s.subtask_id);
              const tTimers = timers.filter(tmr => tSubIds.includes(tmr.subtask_id));
              const tActHours = Math.round(tTimers.reduce((acc, tmr) => acc + tmr.duration / 3600, 0));

              return (
                <div key={t.task_id} className="border-b-[0.5px] border-line-light pb-3 last:border-0 last:pb-0">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium truncate max-w-[200px]" title={t.task_title}>{t.task_id} - {t.task_title}</span>
                    <span className="text-text-secondary">{doneSubs}/{totalSubs} Done</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                    <div className="bg-accent-blue h-1.5 rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-text-secondary">
                    <span>Est: {t.estimated_hours}h</span>
                    <span>Act: {tActHours}h</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sprint-wise Performance Table */}
      <div className="card">
        <div className="card-title mb-4">My Performance Across Sprints</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-bg-secondary text-text-secondary text-[11px] uppercase tracking-wider">
                <th className="p-3 border-b border-line-light font-medium">Sprint ID</th>
                <th className="p-3 border-b border-line-light font-medium">Sprint Name</th>
                <th className="p-3 border-b border-line-light font-medium">Tasks</th>
                <th className="p-3 border-b border-line-light font-medium">Est Hrs</th>
                <th className="p-3 border-b border-line-light font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {sprintMetrics.map((sm, i) => (
                <tr key={sm.sprint_id} className="hover:bg-bg-secondary border-b border-line-light last:border-0">
                  <td className="p-3 font-medium text-accent-blue">{sm.sprint_id}</td>
                  <td className="p-3 truncate max-w-[150px]" title={sm.sprint_name}>{sm.sprint_name}</td>
                  <td className="p-3">{sm.done} / {sm.assigned}</td>
                  <td className="p-3">{sm.est}h</td>


                  <td className="p-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${sm.status === 'active' ? 'bg-blue-100 text-blue-700' : sm.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-bg-secondary text-text-secondary'}`}>
                      {sm.status}
                    </span>
                  </td>
                </tr>
              ))}
              {sprintMetrics.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-4 text-center text-text-secondary text-xs">No sprints assigned.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
