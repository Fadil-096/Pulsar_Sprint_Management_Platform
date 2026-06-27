import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Clock, AlertCircle, CheckCircle2, PlayCircle, Plus, MessageSquare, X, FileText, Play, Square, ChevronDown, Activity, BarChart2, Calendar, Bell } from 'lucide-react';
import SprintTimer from '../../components/SprintTimer';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export default function EmployeeDashboard() {
  const { user, token } = useAuth();
  const [sprints, setSprints] = useState([]);
  const [selectedSprintId, setSelectedSprintId] = useState('');
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true); // force hmr
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [showSubtaskModal, setShowSubtaskModal] = useState(false);
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [requirementsData, setRequirementsData] = useState({ notes: [], attachments: [], sprintName: '' });
  const [selectedTaskId, setSelectedTaskId] = useState('');

  const [subtaskForm, setSubtaskForm] = useState({ title: '', description: '', estimatedHours: '' });
  const [queryText, setQueryText] = useState('');



  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  useEffect(() => {
    if (!user?.id || !token) return;
    axios.get(`/api/employee/${user.id}/sprints`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (res.data.length > 0) {
          const sortOrder = { 'active': 1, 'planner': 2, 'created': 3, 'completed': 4 };
          const sortedSprints = res.data.sort((a, b) => (sortOrder[a.status] || 99) - (sortOrder[b.status] || 99));
          setSprints(sortedSprints);
          setSelectedSprintId(sortedSprints[0].sprintId);
        } else {
          setLoading(false);
        }
      })
      .catch(err => console.error(err));
  }, [user, token]);



  const fetchTasks = async (sprintIdToFetch) => {
    if (!user?.id || !sprintIdToFetch) return;
    try {
      const res = await axios.get('/api/tasks', { 
        params: { assignedTo: user.id, sprintId: sprintIdToFetch },
        headers: { Authorization: `Bearer ${token}` } 
      });
      const tasksData = res.data;
      
      const tasksWithSubtasks = await Promise.all(tasksData.map(async (t) => {
        try {
          const subtasksRes = await axios.get(`/api/subtasks/task/${t.taskId}`, { headers: { Authorization: `Bearer ${token}` } });
          return { ...t, subtasksList: subtasksRes.data };
        } catch (err) {
          return { ...t, subtasksList: [] };
        }
      }));
      setTasks(tasksWithSubtasks);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async (sprintIdToFetch) => {
    if (!user?.id || !sprintIdToFetch) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/employee/${user.id}/sprint-stats/${sprintIdToFetch}`, { headers: { Authorization: `Bearer ${token}` } });
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSprintId) {
      fetchStats(selectedSprintId);
      fetchTasks(selectedSprintId);

    }
  }, [selectedSprintId, user, token]);



  const handleSubtaskStatusUpdate = async (subtaskId, newStatus) => {
    try {
      await axios.patch(`/api/subtasks/${subtaskId}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      fetchTasks(selectedSprintId);
      fetchStats(selectedSprintId);
    } catch (err) {
      alert('Failed to update subtask status');
    }
  };

  const handleMainTaskStatusUpdate = async (taskId, newStatus) => {
    try {
      await axios.patch(`/api/tasks/${taskId}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      fetchTasks(selectedSprintId);
      fetchStats(selectedSprintId);
      if (newStatus === 'blocked') {
        openQueryModal(taskId);
      }
    } catch (err) {
      alert('Failed to update task status');
    }
  };

  const handleCreateSubtask = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/subtasks', { 
        taskId: selectedTaskId, 
        title: subtaskForm.title,
        description: subtaskForm.description,
        estimatedHours: subtaskForm.estimatedHours
      }, { headers: { Authorization: `Bearer ${token}` } });
      setShowSubtaskModal(false);
      setSubtaskForm({ title: '', description: '', estimatedHours: '' });
      fetchTasks(selectedSprintId);
      fetchStats(selectedSprintId);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create subtask');
    }
  };

  const handleRaiseQuery = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/queries', { 
        taskId: selectedTaskId, 
        queryText: queryText
      }, { headers: { Authorization: `Bearer ${token}` } });
      setShowQueryModal(false);
      setQueryText('');
      alert('Query raised successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to raise query');
    }
  };

  const openSubtaskModal = (taskId) => {
    setSelectedTaskId(taskId);
    setShowSubtaskModal(true);
  };

  const openQueryModal = (taskId) => {
    setSelectedTaskId(taskId);
    setShowQueryModal(true);
  };

  const openRequirementsModal = async (sprintId, sprintName) => {
    try {
      const res = await axios.get(`/api/sprints/${sprintId}/requirements`, { headers: { Authorization: `Bearer ${token}` } });
      setRequirementsData({
        notes: res.data.notes || [],
        attachments: res.data.attachments || [],
        sprintName
      });
      setShowRequirementsModal(true);
    } catch (err) {
      alert('Failed to load sprint requirements');
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

  if (!stats) {
    return <div className="text-text-secondary">No sprint data available.</div>;
  }

  const selectedSprintDetails = sprints.find(s => s.sprintId === selectedSprintId);
  const isCreated = stats.sprint.status === 'created';
  const isPlanner = stats.sprint.status === 'planner';
  
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active': return 'bg-badge-active-bg text-badge-active-text border border-badge-active-text/30';
      case 'completed': return 'bg-badge-completed-bg text-badge-completed-text border border-badge-completed-text/30';
      case 'planner': return 'bg-badge-planner-bg text-badge-planner-text border border-badge-planner-text/30';
      case 'created': return 'bg-badge-created-bg text-badge-created-text border border-badge-created-text/30';
      default: return 'bg-bg-secondary text-text-secondary border border-line';
    }
  };

  const STATUS_COLORS = {
    todo: '#9ca3af', // gray-400
    inprogress: '#3b82f6', // blue-500
    blocked: '#ef4444', // red-500
    done: '#22c55e' // green-500
  };

  const taskStatusData = [
    { name: 'To Do', value: stats.taskStatusBreakdown.todo, key: 'todo' },
    { name: 'In Progress', value: stats.taskStatusBreakdown.inprogress, key: 'inprogress' },
    { name: 'Blocked', value: stats.taskStatusBreakdown.blocked, key: 'blocked' },
    { name: 'Done', value: stats.taskStatusBreakdown.done, key: 'done' }
  ].filter(d => d.value > 0);

  const last30Days = [];
  const today = new Date();
  for(let i=29; i>=0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      last30Days.push(d.toISOString().slice(0,10));
  }
  
  const attMap = {};
  stats.attendance.forEach(a => attMap[a.date] = a.status);
  
  let p=0, a=0, h=0, l=0;
  stats.attendance.forEach(att => {
      if(att.status==='Present') p++;
      else if(att.status==='Absent') a++;
      else if(att.status==='Half-Day') h++;
      else if(att.status==='On Leave') l++;
  });

  return (
    <div className="pb-10">
      <div className="page-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl font-medium mb-1">My Dashboard</h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2" ref={dropdownRef}>
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-bg-card border border-line rounded-md text-sm font-medium hover:bg-dropdown-hover-bg hover:border-dropdown-hover-border focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-colors shadow-sm"
              >
                {selectedSprintDetails ? (
                  <>
                    <span className="text-text-primary">{selectedSprintDetails.sprintName}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${getStatusBadgeColor(selectedSprintDetails.status)}`}>
                      {selectedSprintDetails.status}
                    </span>
                  </>
                ) : <span>Select Sprint</span>}
                <ChevronDown size={16} className="text-text-muted" />
              </button>
              
              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-80 bg-bg-card border border-line rounded-md shadow-xl z-50 py-1">
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {sprints.map(sprint => (
                      <button
                        key={sprint.sprintId}
                        onClick={() => {
                          setSelectedSprintId(sprint.sprintId);
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
          </div>
        </div>
        <p className="text-text-secondary text-sm">Welcome back, {user?.name?.split(' ')[0] || ''}. Here's your personal sprint overview.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-bg-card border border-line rounded-lg p-3.5 shadow-sm">
          <div className="text-[11px] text-text-secondary font-bold uppercase tracking-wider mb-1">My Tasks</div>
          <div className="text-2xl font-bold text-text-primary">{stats.tasksDone} <span className="text-text-muted text-lg">/ {stats.totalTasks}</span></div>
          <div className="text-[11px] text-text-muted mt-1">Tasks Completed</div>
        </div>
        <div className="bg-bg-card border border-line rounded-lg p-3.5 shadow-sm">
          <div className="text-[11px] text-text-secondary font-bold uppercase tracking-wider mb-1">Subtasks Done</div>
          <div className="text-2xl font-bold text-text-primary">{stats.subtasksDone} <span className="text-text-muted text-lg">/ {stats.totalSubtasks}</span></div>
          <div className="text-[11px] text-text-muted mt-1">My Subtasks</div>
        </div>

        <div className="bg-bg-card border border-line rounded-lg p-3.5 shadow-sm">
          <div className="text-[11px] text-text-secondary font-bold uppercase tracking-wider mb-1">Estimated Hours</div>
          <div className="text-2xl font-bold text-text-primary">{stats.totalEstHours}h</div>
          <div className="text-[11px] text-text-muted mt-1">Total Estimation</div>
        </div>

        <div className="bg-bg-card border border-line rounded-lg p-3.5 shadow-sm flex flex-col justify-center items-center text-center">
            {stats.sprint.status === 'active' ? (
                <SprintTimer sprint={stats.sprint} compact={true} />
            ) : (
                <>
                   <div className="text-[11px] text-text-secondary font-bold uppercase tracking-wider mb-1">Sprint Status</div>
                   <div className={`text-sm font-bold uppercase ${getStatusBadgeColor(stats.sprint.status)} px-2 py-1 rounded`}>
                       {stats.sprint.status}
                   </div>
                </>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3.5 mb-3.5">
        <div className="bg-bg-card border border-line rounded-lg p-4 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-bold text-text-primary mb-1">My Task Status</h2>
          <p className="text-[10px] text-text-secondary mb-4">Distribution of my assigned tasks.</p>
          <div className="h-[220px] relative">
            {taskStatusData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-text-muted">No tasks assigned.</div>
            ) : (
                <>
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                        data={taskStatusData}
                        cx="50%" cy="45%" innerRadius={55} outerRadius={75}
                        paddingAngle={2} dataKey="value" stroke="none"
                        >
                        {taskStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.key]} />
                        ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value} Tasks`, name]} />
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

        <div className="bg-bg-card border border-line rounded-lg p-4 shadow-sm lg:col-span-3">
          <h2 className="text-sm font-bold text-text-primary mb-1">Subtask Completion by Task</h2>
          <p className="text-[10px] text-text-secondary mb-4">Breakdown of subtask progress per parent task.</p>
          <div className="h-[220px]">
            {stats.subtaskCompletion.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-text-muted">No tasks to display.</div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.subtaskCompletion} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                    <XAxis type="number" hide  tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}/>
                    <YAxis dataKey="taskTitle" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#4b5563' }} width={120} tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val} />
                    <Tooltip cursor={{fill: '#f3f4f6'}} formatter={(value, name) => [value, name]} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="done" name="Done" stackId="a" fill={STATUS_COLORS.done} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="inprogress" name="In Progress" stackId="a" fill={STATUS_COLORS.inprogress} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="todo" name="To Do" stackId="a" fill={STATUS_COLORS.todo} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="blocked" name="Blocked" stackId="a" fill={STATUS_COLORS.blocked} radius={[0, 2, 2, 0]} />
                </BarChart>
                </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>



      <div className="grid grid-cols-1 gap-3.5 mb-3.5">
        <div className="bg-bg-card border border-line rounded-lg p-4 shadow-sm">
          <h2 className="text-sm font-bold text-text-primary mb-1">My Burndown (Remaining Subtasks)</h2>
          <p className="text-[10px] text-text-secondary mb-4">Actual remaining subtasks vs Ideal trajectory.</p>
          <div className="h-[220px]">
             {isCreated ? (
                <div className="flex items-center justify-center h-full text-sm text-text-muted">Available once Active</div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.burndown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#4b5563' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#4b5563' }} />
                    <Tooltip cursor={{ stroke: '#f3f4f6', strokeWidth: 2 }}  contentStyle={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} itemStyle={{ color: 'var(--color-text-secondary)' }}/>
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                    <Line type="monotone" dataKey="ideal" name="Ideal Remaining" stroke="#9ca3af" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="actual" name="Actual Remaining" stroke="#005AFF" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
                </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-8">
        <div className="bg-bg-card border border-line rounded-lg p-4 shadow-sm flex flex-col">
          <h2 className="text-sm font-bold text-text-primary mb-1">My Attendance (Last 30 Days)</h2>
          <div className="flex gap-4 text-[10px] font-bold tracking-wider uppercase mb-4">
              <span className="text-green-600">Present: {p}</span>
              <span className="text-red-500">Absent: {a}</span>
              <span className="text-amber-500">Half-Day: {h}</span>
              <span className="text-text-secondary">Leave: {l}</span>
          </div>
          <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-wrap gap-1 max-w-[300px]">
                  {last30Days.map((date, i) => {
                      const st = attMap[date];
                      let bg = 'bg-bg-secondary';
                      if(st === 'Present') bg = 'bg-green-500';
                      else if(st === 'Absent') bg = 'bg-red-500';
                      else if(st === 'Half-Day') bg = 'bg-amber-400';
                      else if(st === 'On Leave') bg = 'bg-gray-400';
                      return (
                          <div key={i} className={`w-4 h-4 rounded-sm ${bg}`} title={`${date}: ${st || 'No Record'}`}></div>
                      );
                  })}
              </div>
          </div>
        </div>

        <div className="bg-bg-card border border-line rounded-lg p-4 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-sm font-bold text-text-primary">Upcoming Deadlines</h2>
            <div className="text-[10px] text-text-secondary bg-bg-secondary px-2 py-0.5 rounded font-bold uppercase">{selectedSprintDetails?.sprintName}</div>
          </div>
          <p className="text-[10px] text-text-secondary mb-4">Tasks and subtasks sorted by urgency.</p>
          <div className="flex-1 overflow-y-auto space-y-2">
              {stats.deadlines.length === 0 ? (
                  <div className="text-sm text-text-muted text-center py-4">All caught up! No pending items.</div>
              ) : (
                  stats.deadlines.map((d, i) => (
                      <div key={i} className="flex justify-between items-center border border-line-light p-2 rounded bg-gray-50/50">
                          <div className="flex items-center gap-2 overflow-hidden">
                              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                  d.priority === 'critical' ? 'bg-red-100 text-red-700' :
                                  d.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                  d.priority === 'medium' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                              }`}>{d.type}</span>
                              <span className="text-sm text-text-primary font-medium truncate">{d.title}</span>
                          </div>
                          <span className="text-[10px] text-text-secondary uppercase font-bold ml-2 shrink-0">{d.status}</span>
                      </div>
                  ))
              )}
          </div>
        </div>
      </div>

          </div>
  );
}
