import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useLoader } from '../../context/LoaderContext';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronDown, CheckCircle2, Activity, BarChart2, Info, HeartPulse } from 'lucide-react';
import SprintTimer from '../../components/SprintTimer';
import { calculateSprintHealth } from '../../utils/sprintHealth';

export default function AdminDashboard() {
  const { token } = useAuth();
  const { stopLoader } = useLoader();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sprints, setSprints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sprintFilterStatus, setSprintFilterStatus] = useState('all');
  const [searchSprintQuery, setSearchSprintQuery] = useState('');
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
        } else {
          setLoading(false);
          stopLoader();
        }
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
        stopLoader();
      });
  }, [token, stopLoader]);

  // Fetch Stats when selected sprint changes
  const selectedSprintId = searchParams.get('sprint_id');
  
  // Auto-select sprint if missing from URL
  useEffect(() => {
    if (sprints.length > 0 && !selectedSprintId) {
      setSearchParams({ sprint_id: sprints[0].sprintId }, { replace: true });
    }
  }, [sprints, selectedSprintId, setSearchParams]);
  
  useEffect(() => {
    if (!selectedSprintId) return;
    setLoading(true);
    axios.get(`/api/sprints/${selectedSprintId}/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setStats(res.data);
      })
      .catch(err => console.error(err))
      .finally(() => {
        setLoading(false);
        stopLoader();
      });
  }, [selectedSprintId, token, stopLoader]);

  const selectedSprintDetails = sprints.find(s => s.sprintId === selectedSprintId);

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active': return 'bg-badge-active-bg text-badge-active-text border border-badge-active-text/30';
      case 'completed': return 'bg-badge-completed-bg text-badge-completed-text border border-badge-completed-text/30';
      case 'planner': return 'bg-badge-planner-bg text-badge-planner-text border border-badge-planner-text/30';
      case 'created': return 'bg-badge-created-bg text-badge-created-text border border-badge-created-text/30';
      default: return 'bg-bg-secondary text-text-secondary border border-line';
    }
  };

  if (loading && !stats) return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded-xl w-1/4 mb-4"></div>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[1,2,3,4,5,6].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl"></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        <div className="h-[260px] bg-gray-200 rounded-2xl"></div>
        <div className="h-[260px] bg-gray-200 rounded-2xl"></div>
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

  const subtaskStatusData = stats?.subtaskStats ? [
    { name: 'To Do', value: stats.subtaskStats.todo, key: 'todo' },
    { name: 'In Progress', value: stats.subtaskStats.inprogress, key: 'inprogress' },
    { name: 'Blocked', value: stats.subtaskStats.blocked, key: 'blocked' },
    { name: 'Done', value: stats.subtaskStats.done, key: 'done' }
  ].filter(d => d.value > 0) : [];

  const taskPriorityData = stats && stats.taskPriorityBreakdown ? [
    { name: 'Critical', value: stats.taskPriorityBreakdown.critical || 0, key: 'critical' },
    { name: 'High', value: stats.taskPriorityBreakdown.high || 0, key: 'high' },
    { name: 'Medium', value: stats.taskPriorityBreakdown.medium || 0, key: 'medium' },
    { name: 'Low', value: stats.taskPriorityBreakdown.low || 0, key: 'low' }
  ].filter(d => d.value > 0) : [];

  const priorityCompletionData = stats?.taskPriorityCompletion ? [
    { name: 'High', Completed: stats.taskPriorityCompletion.high.done, Incompleted: stats.taskPriorityCompletion.high.incompleted, Total: stats.taskPriorityCompletion.high.total },
    { name: 'Medium', Completed: stats.taskPriorityCompletion.medium.done, Incompleted: stats.taskPriorityCompletion.medium.incompleted, Total: stats.taskPriorityCompletion.medium.total },
    { name: 'Low', Completed: stats.taskPriorityCompletion.low.done, Incompleted: stats.taskPriorityCompletion.low.incompleted, Total: stats.taskPriorityCompletion.low.total }
  ].filter(d => d.Total > 0) : [];

  const PRIORITY_COLORS = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#3b82f6',
    low: '#22c55e'
  };



  const sprintHealth = calculateSprintHealth(selectedSprintDetails, stats);

  return (
    <div>
      <div className="page-header flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-5">
        <div>
          <h1 className="text-xl font-medium mb-1">Dashboard</h1>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2" ref={dropdownRef}>
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-bg-card border border-line rounded-2xl text-sm font-medium hover:bg-dropdown-hover-bg hover:border-dropdown-hover-border focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-colors shadow-sm"
              >
                <span className="text-text-primary">{selectedSprintDetails.sprintName} ({selectedSprintDetails.sprintId})</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${getStatusBadgeColor(selectedSprintDetails.status)}`}>
                  {selectedSprintDetails.status}
                </span>
                <ChevronDown size={16} className="text-text-muted" />
              </button>
              
              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-80 bg-bg-card border border-line rounded-2xl shadow-xl z-50 py-2">
                  <div className="flex flex-wrap items-center gap-2 px-3 pb-3 mb-2 border-b border-line">
                    {['all', 'planner', 'active', 'review', 'completed'].map(status => (
                      <button
                        key={status}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSprintFilterStatus(status);
                          const matched = sprints.filter(s => status === 'all' || s.status === status);
                          if (matched.length > 0 && !matched.some(s => s.sprintId === selectedSprintId)) {
                            setSearchParams({ sprint_id: matched[0].sprintId });
                          }
                        }}
                        className={`px-3 py-1.5 text-[11px] font-bold rounded-full whitespace-nowrap transition-colors ${
                          sprintFilterStatus === status 
                            ? 'bg-accent-blue text-white shadow-sm' 
                            : 'bg-bg-secondary border border-line text-text-secondary hover:bg-table-row-alt hover:text-text-primary'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className="px-4 pb-2 text-sm font-bold text-text-primary mt-2">
                    All Sprints
                  </div>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {sprints.filter(s => sprintFilterStatus === 'all' || s.status === sprintFilterStatus).map(sprint => (
                      <button
                        key={sprint.sprintId}
                        onClick={() => {
                          setSearchParams({ sprint_id: sprint.sprintId });
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors ${sprint.sprintId === selectedSprintId ? 'bg-dropdown-active-bg' : 'hover:bg-dropdown-hover-bg'}`}
                      >
                        <div>
                          <div className={`font-medium ${sprint.sprintId === selectedSprintId ? 'text-dropdown-active-text' : 'text-text-primary'}`}>{sprint.sprintName}</div>
                          <div className={`text-xs ${sprint.sprintId === selectedSprintId ? 'text-dropdown-active-text opacity-80' : 'text-text-secondary'}`}>{sprint.sprintId}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${getStatusBadgeColor(sprint.status)}`}>
                            {sprint.status}
                          </span>
                          {sprint.sprintId === selectedSprintId && <CheckCircle2 size={16} className="text-accent-blue" />}
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
        
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <input 
              type="text" 
              placeholder="Search all sprints..." 
              value={searchSprintQuery}
              onChange={(e) => setSearchSprintQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 w-full sm:w-64 bg-bg-secondary border border-line rounded-2xl text-sm text-text-primary focus:outline-none focus:border-accent-blue placeholder-text-muted transition-colors shadow-sm"
            />
            {searchSprintQuery && (
              <div className="absolute top-full right-0 sm:left-0 mt-1 w-[280px] sm:w-80 bg-bg-card border border-line rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar py-2">
                {sprints.filter(s => 
                   s.sprintName.toLowerCase().includes(searchSprintQuery.toLowerCase()) || 
                   s.sprintId.toLowerCase().includes(searchSprintQuery.toLowerCase())
                ).map(sprint => (
                  <button
                    key={sprint.sprintId}
                    onClick={() => {
                      setSearchParams({ sprint_id: sprint.sprintId });
                      setSearchSprintQuery('');
                    }}
                    className="w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors hover:bg-dropdown-hover-bg"
                  >
                    <div>
                      <div className="font-medium text-text-primary">{sprint.sprintName}</div>
                      <div className="text-xs text-text-secondary">{sprint.sprintId}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${getStatusBadgeColor(sprint.status)}`}>
                      {sprint.status}
                    </span>
                  </button>
                ))}
                {sprints.filter(s => 
                   s.sprintName.toLowerCase().includes(searchSprintQuery.toLowerCase()) || 
                   s.sprintId.toLowerCase().includes(searchSprintQuery.toLowerCase())
                ).length === 0 && (
                  <div className="px-4 py-3 text-sm text-text-secondary text-center">No sprints found matching "{searchSprintQuery}"</div>
                )}
              </div>
            )}
          </div>
          
          {isCompleted && (
            <button onClick={() => navigate('/admin/reports?sprint_id=' + selectedSprintId)} className="bg-bg-card border border-line text-accent-blue font-medium text-sm px-4 py-2 rounded-2xl hover:bg-bg-secondary transition-colors shadow-sm whitespace-nowrap">
              View Full Sprint Report
            </button>
          )}
        </div>
      </div>



      {isCreated && (
        <div className="bg-badge-planner-bg border border-transparent text-badge-planner-text px-4 py-3 rounded-2xl text-sm mb-4">
          <strong>Notice:</strong> This sprint hasn't started yet. Dashboard data will populate once it moves to Planner or Active Mode.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
        {/* Sprint Health Card */}
        <div className="bg-bg-card border border-line rounded-2xl p-4 relative group hover:border-accent-blue hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[11px] text-text-secondary uppercase tracking-wider flex items-center gap-1">
              Sprint Health
              <Info size={12} className="text-text-muted cursor-help" />
            </div>
          </div>
          {sprintHealth ? (
            <>
              <div className={`flex items-center gap-1.5 mt-1 ${sprintHealth.color.replace('bg-', 'text-').split(' ')[1]}`}>
                <HeartPulse size={18} className={sprintHealth.iconColor} />
                <span className="text-xl font-bold">{sprintHealth.title}</span>
              </div>
              <div className="text-[10px] text-text-secondary leading-tight mt-1.5">{sprintHealth.message}</div>
            </>
          ) : (
            <div className="text-2xl font-medium text-text-muted mt-1">—</div>
          )}
          {/* Tooltip */}
          <div className="absolute top-0 left-0 w-full h-full bg-black/90 text-white text-[10px] p-2 rounded-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 flex flex-col justify-center text-center">
            Calculated dynamically based on: velocity, elapsed time, burndown variance, and remaining effort.
          </div>
        </div>

        <div className="bg-bg-card border border-line rounded-2xl p-4 relative group hover:border-accent-blue hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="text-[11px] text-text-secondary uppercase tracking-wider mb-1">Sprint Velocity</div>
          {isCreated || isPlanner ? (
            <div className="text-2xl font-medium text-text-muted">—</div>
          ) : (
            <div className="text-2xl font-medium">{stats.velocity}%</div>
          )}
          <div className="text-[11px] text-text-tertiary mt-1">Completion rate</div>
        </div>
        
        <div className="bg-bg-card border border-line rounded-2xl p-4 relative group hover:border-accent-blue hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="text-[11px] text-text-secondary uppercase tracking-wider mb-1">Tasks Completed</div>
          {isCreated ? (
            <div className="text-2xl font-medium text-text-muted">—</div>
          ) : (
            <div className="text-2xl font-medium">{stats.doneTasks} / {stats.totalTasks}</div>
          )}
          <div className="text-[11px] text-text-tertiary mt-1">{selectedSprintDetails.status} sprint</div>
        </div>


        <div className="bg-bg-card border border-line rounded-2xl p-4 relative group hover:border-accent-blue hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="text-[11px] text-text-secondary uppercase tracking-wider mb-1">Team Size</div>
          {isCreated ? (
            <div className="text-2xl font-medium text-text-muted">—</div>
          ) : (
            <div className="text-2xl font-medium">{stats.teamWorkload?.length || 0}</div>
          )}
          <div className="text-[11px] text-text-tertiary mt-1">Active members</div>
        </div>



      </div>

      <div className="grid grid-cols-1 gap-3.5 mb-3.5">
        <div className="card mb-0">
          <div className="card-title mb-1">Task Burndown</div>
          <p className="text-[10px] text-text-secondary mb-4 truncate" title="Tracks progress over time. The X-axis represents sprint days, and the Y-axis shows remaining tasks.">
            Tracks progress over time. The <strong>X-axis</strong> represents sprint days, and the <strong>Y-axis</strong> shows remaining tasks.
          </p>
          <div className="h-[210px] text-xs flex items-center justify-center">
            {isCreated || isPlanner ? (
              <div className="text-text-muted font-medium text-sm flex flex-col items-center gap-2">
                <Activity size={32} className="opacity-50 text-blue-500" />
                <span>Burndown chart will be available once the sprint becomes Active</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <LineChart data={stats.burndown}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-light)" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tickMargin={10} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}/>
                  <YAxis axisLine={false} tickLine={false} tickMargin={20} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}/>
                  <Tooltip  contentStyle={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} itemStyle={{ color: 'var(--color-text-secondary)' }}/>
                  <Legend />
                  <Line type="linear" dataKey="ideal" name="Ideal Tasks" stroke="#888780" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="actual" name="Actual Tasks" stroke="var(--color-accent-blue)" strokeWidth={3} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card mb-0">
          <div className="card-title mb-1">Subtask Burndown</div>
          <p className="text-[10px] text-text-secondary mb-4 truncate" title="Tracks progress over time. The X-axis represents sprint days, and the Y-axis shows remaining subtasks.">
            Tracks progress over time. The <strong>X-axis</strong> represents sprint days, and the <strong>Y-axis</strong> shows remaining subtasks.
          </p>
          <div className="h-[210px] text-xs flex items-center justify-center">
            {isCreated || isPlanner ? (
              <div className="text-text-muted font-medium text-sm flex flex-col items-center gap-2">
                <Activity size={32} className="opacity-50 text-purple-500" />
                <span>Burndown chart will be available once the sprint becomes Active</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <LineChart data={stats.subtaskBurndown || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-light)" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tickMargin={10} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}/>
                  <YAxis axisLine={false} tickLine={false} tickMargin={20} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}/>
                  <Tooltip  contentStyle={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} itemStyle={{ color: 'var(--color-text-secondary)' }}/>
                  <Legend />
                  <Line type="linear" dataKey="ideal" name="Ideal Subtasks" stroke="#888780" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="actual" name="Actual Subtasks" stroke="#a855f7" strokeWidth={3} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-3.5">
        <div className="card mb-0 flex flex-col">
          <div className="card-title mb-1">Task Status Overview</div>
          <p className="text-[10px] text-text-secondary mb-4 truncate" title="Current distribution of all main tasks in the sprint.">
            Current distribution of all main tasks in the sprint.
          </p>
          <div className="h-[210px] text-xs flex items-center justify-center relative">
            {isCreated ? (
              <div className="text-text-muted font-medium text-sm flex flex-col items-center gap-2">
                <PieChart size={32} className="opacity-50 text-purple-500" />
                <span>Available once Active</span>
              </div>
            ) : taskStatusData.length === 0 ? (
              <div className="text-text-muted font-medium text-sm">No tasks assigned yet.</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
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
                      contentStyle={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} itemStyle={{ color: 'var(--color-text-secondary)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mt-[-5px]">
                  <div className="text-2xl font-bold text-text-primary leading-none">{stats.totalTasks}</div>
                  <div className="text-[10px] text-text-secondary uppercase font-bold tracking-wider mt-1">Tasks</div>
                </div>

                <div className="absolute bottom-0 w-full flex justify-center gap-3 flex-wrap">
                  {taskStatusData.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[10px] font-bold text-text-secondary">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[entry.key] }}></div>
                      {entry.name}: {entry.value}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Subtask Status Overview Chart */}
        <div className="card mb-0 flex flex-col">
          <div className="card-title mb-1">Subtask Completion</div>
          <p className="text-[10px] text-text-secondary mb-4 truncate" title="Current distribution of all subtasks in the sprint.">
            Current distribution of all subtasks in the sprint.
          </p>
          <div className="h-[210px] text-xs flex items-center justify-center relative">
            {isCreated ? (
              <div className="text-text-muted font-medium text-sm flex flex-col items-center gap-2">
                <PieChart size={32} className="opacity-50 text-purple-500" />
                <span>Available once Active</span>
              </div>
            ) : subtaskStatusData.length === 0 ? (
              <div className="text-text-muted font-medium text-sm">No subtasks created yet.</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={subtaskStatusData}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {subtaskStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.key]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [`${value} Subtasks (${Math.round((value / stats.subtaskStats.total) * 100)}%)`, name]}
                      contentStyle={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} itemStyle={{ color: 'var(--color-text-secondary)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mt-[-5px]">
                  <div className="text-2xl font-bold text-text-primary leading-none">{stats.subtaskStats.total}</div>
                  <div className="text-[10px] text-text-secondary uppercase font-bold tracking-wider mt-1">Subtasks</div>
                </div>

                <div className="absolute bottom-0 w-full flex justify-center gap-3 flex-wrap">
                  {subtaskStatusData.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[10px] font-bold text-text-secondary">
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
