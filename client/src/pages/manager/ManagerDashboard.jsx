import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronDown, CheckCircle2, Activity, BarChart2, Info, HeartPulse } from 'lucide-react';
import SprintTimer from '../../components/SprintTimer';
import { calculateSprintHealth } from '../../utils/sprintHealth';

export default function ManagerDashboard() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sprints, setSprints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  // Fetch Sprints List
  useEffect(() => {
    axios.get('/api/sprints', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (res.data.length > 0) {
          const sortOrder = { 'active': 1, 'planner': 2, 'created': 3, 'completed': 4 };
          const sortedSprints = res.data.sort((a, b) => {
            return (sortOrder[a.status] || 99) - (sortOrder[b.status] || 99);
          });
          setSprints(sortedSprints);
          
          const urlSprintId = searchParams.get('sprint_id');
          if (!urlSprintId) {
            setSearchParams({ sprint_id: sortedSprints[0].sprintId }, { replace: true });
          }
        } else {
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [token]);

  // Fetch Stats when selected sprint changes
  const selectedSprintId = searchParams.get('sprint_id');
  
  useEffect(() => {
    if (!selectedSprintId) return;
    setLoading(true);
    axios.get(`/api/sprints/${selectedSprintId}/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setStats(res.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedSprintId, token]);

  const selectedSprintDetails = sprints.find(s => s.sprintId === selectedSprintId);

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'planner': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading && !stats) return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[1,2,3,4,5,6].map(i => <div key={i} className="h-24 bg-gray-200 rounded-md"></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        <div className="h-[260px] bg-gray-200 rounded-md"></div>
        <div className="h-[260px] bg-gray-200 rounded-md"></div>
      </div>
    </div>
  );
  if (!stats || !selectedSprintDetails) return <div>No sprint data available.</div>;

  const isCreated = selectedSprintDetails.status === 'created';
  const isPlanner = selectedSprintDetails.status === 'planner';
  const isCompleted = selectedSprintDetails.status === 'completed';

  const STATUS_COLORS = {
    todo: '#9ca3af', // gray-400
    inprogress: '#3b82f6', // blue-500
    blocked: '#ef4444', // red-500
    done: '#22c55e' // green-500
  };

  const taskStatusData = stats ? [
    { name: 'To Do', value: stats.taskStatusBreakdown.todo, key: 'todo' },
    { name: 'In Progress', value: stats.taskStatusBreakdown.inprogress, key: 'inprogress' },
    { name: 'Blocked', value: stats.taskStatusBreakdown.blocked, key: 'blocked' },
    { name: 'Done', value: stats.taskStatusBreakdown.done, key: 'done' }
  ].filter(d => d.value > 0) : [];

  const getHeatmapColor = (hours) => {
    if (!hours || hours === 0) return 'bg-gray-100 text-gray-400';
    if (hours <= 10) return 'bg-blue-200 text-blue-800';
    if (hours <= 25) return 'bg-blue-400 text-white';
    return 'bg-blue-700 text-white';
  };

  const sprintHealth = calculateSprintHealth(selectedSprintDetails, stats);

  return (
    <div>
      <div className="page-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
        <div>
          <h1 className="text-xl font-medium mb-1">Dashboard</h1>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2" ref={dropdownRef}>
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
              >
                <span className="text-[#020024]">{selectedSprintDetails.sprintName} ({selectedSprintDetails.sprintId})</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${getStatusBadgeColor(selectedSprintDetails.status)}`}>
                  {selectedSprintDetails.status}
                </span>
                <ChevronDown size={16} className="text-gray-400" />
              </button>
              
              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                  <div className="max-h-60 overflow-y-auto">
                    {sprints.map(sprint => (
                      <button
                        key={sprint.sprintId}
                        onClick={() => {
                          setSearchParams({ sprint_id: sprint.sprintId });
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between transition-colors ${sprint.sprintId === selectedSprintId ? 'bg-blue-50/50' : ''}`}
                      >
                        <div>
                          <div className="font-medium text-[#020024]">{sprint.sprintName}</div>
                          <div className="text-xs text-gray-500">{sprint.sprintId}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${getStatusBadgeColor(sprint.status)}`}>
                            {sprint.status}
                          </span>
                          {sprint.sprintId === selectedSprintId && <CheckCircle2 size={16} className="text-[#005AFF]" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <SprintTimer sprint={selectedSprintDetails} compact={true} />
          </div>
        </div>
        
        {isCompleted && (
          <button onClick={() => navigate('/manager/sprints?tab=completed')} className="bg-white border border-gray-200 text-[#005AFF] font-medium text-sm px-4 py-2 rounded-md hover:bg-gray-50 transition-colors shadow-sm">
            View Full Sprint Report
          </button>
        )}
      </div>

      {isCreated && (
        <div className="bg-blue-50 border border-blue-100 text-blue-800 px-4 py-3 rounded-md text-sm mb-4">
          <strong>Notice:</strong> This sprint hasn't started yet. Dashboard data will populate once it moves to Planner or Active Mode.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 mb-4">
        {/* Sprint Health Card */}
        <div className="bg-bg-secondary rounded-md p-3.5 relative group">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[11px] text-text-secondary uppercase tracking-wider flex items-center gap-1">
              Sprint Health
              <Info size={12} className="text-gray-400 cursor-help" />
            </div>
          </div>
          {sprintHealth ? (
            <>
              <div className={`flex items-center gap-1.5 mt-1 ${sprintHealth.color.replace('bg-', 'text-').split(' ')[1]}`}>
                <HeartPulse size={18} className={sprintHealth.iconColor} />
                <span className="text-xl font-bold">{sprintHealth.title}</span>
              </div>
              <div className="text-[10px] text-gray-500 leading-tight mt-1.5">{sprintHealth.message}</div>
            </>
          ) : (
            <div className="text-2xl font-medium text-gray-400 mt-1">—</div>
          )}
          {/* Tooltip */}
          <div className="absolute top-0 left-0 w-full h-full bg-black/90 text-white text-[10px] p-2 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 flex flex-col justify-center text-center">
            Calculated dynamically based on: velocity, elapsed time, burndown variance, and remaining effort.
          </div>
        </div>

        <div className="bg-bg-secondary rounded-md p-3.5">
          <div className="text-[11px] text-text-secondary uppercase tracking-wider mb-1">Sprint Velocity</div>
          {isCreated || isPlanner ? (
            <div className="text-2xl font-medium text-gray-400">—</div>
          ) : (
            <div className="text-2xl font-medium">{stats.velocity}%</div>
          )}
          <div className="text-[11px] text-text-tertiary mt-1">Completion rate</div>
        </div>
        
        <div className="bg-bg-secondary rounded-md p-3.5">
          <div className="text-[11px] text-text-secondary uppercase tracking-wider mb-1">Tasks Completed</div>
          {isCreated ? (
            <div className="text-2xl font-medium text-gray-400">—</div>
          ) : (
            <div className="text-2xl font-medium">{stats.doneTasks} / {stats.totalTasks}</div>
          )}
          <div className="text-[11px] text-text-tertiary mt-1">{selectedSprintDetails.status} sprint</div>
        </div>

        <div className="bg-bg-secondary rounded-md p-3.5">
          <div className="text-[11px] text-text-secondary uppercase tracking-wider mb-1">Effort Variance</div>
          {isCreated || isPlanner ? (
            <div className="text-2xl font-medium text-gray-400">—</div>
          ) : (
            <div className={`text-2xl font-medium ${stats.effortVariance > 10 ? 'text-red-600' : stats.effortVariance < -10 ? 'text-green-600' : ''}`}>
              {stats.effortVariance > 0 ? '+' : ''}{stats.effortVariance}%
            </div>
          )}
          <div className="text-[11px] text-text-tertiary mt-1">Spent vs estimated</div>
        </div>

        <div className="bg-bg-secondary rounded-md p-3.5">
          <div className="text-[11px] text-text-secondary uppercase tracking-wider mb-1">Team Size</div>
          {isCreated ? (
            <div className="text-2xl font-medium text-gray-400">—</div>
          ) : (
            <div className="text-2xl font-medium">{stats.teamWorkload?.length || 0}</div>
          )}
          <div className="text-[11px] text-text-tertiary mt-1">Active members</div>
        </div>

        <div className="bg-bg-secondary rounded-md p-3.5">
          <div className="text-[11px] text-text-secondary uppercase tracking-wider mb-1">Total Est. Hours</div>
          {isCreated ? (
            <div className="text-2xl font-medium text-gray-400">—</div>
          ) : (
            <div className="text-2xl font-medium">{stats.totalEstimatedHours}h</div>
          )}
          <div className="text-[11px] text-text-tertiary mt-1">{stats.sprintId}</div>
        </div>

        <div className="bg-bg-secondary rounded-md p-3.5">
          <div className="text-[11px] text-text-secondary uppercase tracking-wider mb-1">Hours Logged</div>
          {isCreated || isPlanner ? (
            <div className="text-2xl font-medium text-gray-400">—</div>
          ) : (
            <div className="text-2xl font-medium">{stats.totalSpentHours}h</div>
          )}
          <div className="text-[11px] text-text-tertiary mt-1">{stats.sprintId}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-3.5">
        <div className="card mb-0">
          <div className="card-title mb-1">Sprint Burndown</div>
          <p className="text-[10px] text-gray-500 mb-4 truncate" title="Tracks progress over time. The X-axis represents sprint days, and the Y-axis shows remaining tasks.">
            Tracks progress over time. The <strong>X-axis</strong> represents sprint days, and the <strong>Y-axis</strong> shows remaining tasks.
          </p>
          <div className="h-[210px] text-xs flex items-center justify-center">
            {isCreated || isPlanner ? (
              <div className="text-gray-400 font-medium text-sm flex flex-col items-center gap-2">
                <Activity size={32} className="opacity-50 text-blue-500" />
                <span>Burndown chart will be available once the sprint becomes Active</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.burndown}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="ideal" name="Ideal Tasks" stroke="#888780" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="actual" name="Actual Tasks" stroke="var(--blue-600)" strokeWidth={3} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        
        <div className="card mb-0">
          <div className="card-title mb-1">Effort: Estimated vs Spent per Employee</div>
          <p className="text-[10px] text-gray-500 mb-4 truncate" title="Compare estimated vs actual hours spent per employee on this sprint.">
            Compare estimated vs actual hours spent per employee on this sprint.
          </p>
          <div className="h-[210px] text-xs flex items-center justify-center">
            {isCreated ? (
              <div className="text-gray-400 font-medium text-sm flex flex-col items-center gap-2">
                <BarChart2 size={32} className="opacity-50 text-purple-500" />
                <span>Effort chart will be available once team is assigned</span>
              </div>
            ) : (
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
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 mb-3.5">
        <div className="card mb-0 lg:col-span-2">
          <div className="card-title mb-1">Employee Hours Heatmap</div>
          <p className="text-[10px] text-gray-500 mb-4 truncate" title={`Hours logged per employee across the sprint ${stats?.heatmapColumns?.length > 7 ? 'weeks' : 'days'}.`}>
            Hours logged per employee across the sprint {stats?.heatmapColumns?.length > 7 ? 'weeks' : 'days'}.
          </p>
          <div className="min-h-[210px] text-xs">
            {isCreated || isPlanner ? (
              <div className="h-[210px] flex flex-col items-center justify-center text-gray-400 font-medium text-sm gap-2">
                <Activity size={32} className="opacity-50 text-blue-500" />
                <span>Heatmap will populate once the sprint becomes Active</span>
              </div>
            ) : (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="py-2 px-3 font-medium text-gray-500 border-b border-gray-200">Employee</th>
                        {stats.heatmapColumns?.map((col, idx) => (
                          <th key={idx} className="py-2 px-3 font-medium text-gray-500 border-b border-gray-200 text-center">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stats.weeklyHeatmap?.map((emp, idx) => (
                        <tr key={idx} className="border-b border-gray-100 last:border-0">
                          <td className="py-3 px-3 font-medium text-[#020024]">{emp.name}</td>
                          {stats.heatmapColumns?.map((col, cIdx) => {
                            const hours = emp.data[col] || 0;
                            return (
                              <td key={cIdx} className="py-2 px-1">
                                <div 
                                  className={`h-10 rounded-sm flex items-center justify-center font-bold transition-colors ${getHeatmapColor(hours)}`}
                                  title={`${emp.name} - ${col}: ${hours}h logged (Total Est: ${emp.totalEstimated}h)`}
                                >
                                  {hours > 0 ? `${hours}h` : '-'}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center gap-2 mt-4 text-[10px] text-gray-500 font-medium justify-end">
                  <span>Low Effort</span>
                  <div className="w-4 h-4 rounded-sm bg-blue-200"></div>
                  <div className="w-4 h-4 rounded-sm bg-blue-400"></div>
                  <div className="w-4 h-4 rounded-sm bg-blue-700"></div>
                  <span>High Effort</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card mb-0 lg:col-span-1">
          <div className="card-title mb-1">Task Status Overview</div>
          <p className="text-[10px] text-gray-500 mb-4 truncate" title="Current distribution of all main tasks in the sprint.">
            Current distribution of all main tasks in the sprint.
          </p>
          <div className="h-[210px] text-xs flex items-center justify-center relative">
            {isCreated ? (
              <div className="text-gray-400 font-medium text-sm flex flex-col items-center gap-2">
                <PieChart size={32} className="opacity-50 text-purple-500" />
                <span>Available once Active</span>
              </div>
            ) : taskStatusData.length === 0 ? (
              <div className="text-gray-400 font-medium text-sm">No tasks assigned yet.</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskStatusData}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {taskStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.key]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [`${value} Tasks (${Math.round((value / stats.totalTasks) * 100)}%)`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mt-[-5px]">
                  <div className="text-2xl font-bold text-[#020024] leading-none">{stats.totalTasks}</div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-1">Tasks</div>
                </div>

                <div className="absolute bottom-0 w-full flex justify-center gap-3 flex-wrap">
                  {taskStatusData.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[10px] font-bold text-gray-600">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[entry.key] }}></div>
                      {entry.name}: {entry.value}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
