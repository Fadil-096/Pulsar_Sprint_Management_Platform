import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useLoader } from '../../context/LoaderContext';
import { Clock, AlertCircle, CheckCircle2, PlayCircle, Plus, MessageSquare, X, FileText, Play, Square, ChevronDown, Activity, BarChart2, Calendar, Bell } from 'lucide-react';
import SprintTimer from '../../components/SprintTimer';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export default function EmployeeDashboard() {
  const { user, token } = useAuth();
  const { stopLoader } = useLoader();
  const [sprints, setSprints] = useState([]);
  const [selectedSprintId, setSelectedSprintId] = useState('');
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true); // force hmr
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sprintFilterStatus, setSprintFilterStatus] = useState('all');
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
          stopLoader();
        }
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
        stopLoader();
      });
  }, [user, token, stopLoader]);



  const fetchTasks = async (sprintIdToFetch) => {
    if (!user?.id || !sprintIdToFetch) return;
    try {
      const res = await axios.get('/api/tasks', { 
        params: { assignedTo: user.id, sprintId: sprintIdToFetch, includeSubtasks: true },
        headers: { Authorization: `Bearer ${token}` } 
      });
      setTasks(res.data);
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
      stopLoader();
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

  // Empty state dashboard — shown when no sprints are assigned
  if (!stats) {
    return <EmptyStateDashboard user={user} token={token} />;
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
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2 mb-4" ref={dropdownRef}>
            
            {/* Status Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar mr-2">
              {['all', 'active', 'created', 'planner', 'review', 'completed'].map(status => (
                <button
                  key={status}
                  onClick={() => {
                    setSprintFilterStatus(status);
                    const matched = sprints.filter(s => status === 'all' || s.status === status);
                    if (matched.length > 0 && !matched.some(s => s.sprintId === selectedSprintId)) {
                      setSelectedSprintId(matched[0].sprintId);
                    }
                    setDropdownOpen(true);
                  }}
                  className={`px-3 py-1.5 text-[11px] font-bold rounded-full whitespace-nowrap transition-colors ${
                    sprintFilterStatus === status 
                      ? 'bg-accent-blue text-white shadow-sm' 
                      : 'bg-bg-card border border-line text-text-secondary hover:bg-table-row-alt hover:text-text-primary'
                  }`}
                >
                  {status === 'created' ? 'Backlogs' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-bg-card border border-line rounded-2xl text-sm font-medium hover:bg-table-row-alt transition-colors shadow-sm"
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
                <div className="absolute top-full left-0 mt-1 w-80 bg-bg-card border border-line rounded-2xl shadow-xl z-50 py-1">
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {sprints.filter(s => sprintFilterStatus === 'all' || s.status === sprintFilterStatus).map(sprint => (
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
        <div className="bg-bg-card border border-line rounded-2xl p-3.5 shadow-sm">
          <div className="text-[11px] text-text-secondary font-bold uppercase tracking-wider mb-1">My Tasks</div>
          <div className="text-2xl font-bold text-text-primary">{stats.tasksDone} <span className="text-text-muted text-lg">/ {stats.totalTasks}</span></div>
          <div className="text-[11px] text-text-muted mt-1">Tasks Completed</div>
        </div>
        <div className="bg-bg-card border border-line rounded-2xl p-3.5 shadow-sm">
          <div className="text-[11px] text-text-secondary font-bold uppercase tracking-wider mb-1">Subtasks Done</div>
          <div className="text-2xl font-bold text-text-primary">{stats.subtasksDone} <span className="text-text-muted text-lg">/ {stats.totalSubtasks}</span></div>
          <div className="text-[11px] text-text-muted mt-1">My Subtasks</div>
        </div>



        <div className="bg-bg-card border border-line rounded-2xl p-3.5 shadow-sm flex flex-col justify-center items-center text-center">
            {stats.sprint.status === 'active' ? (
                <SprintTimer sprint={stats.sprint} compact={true} />
            ) : (
                <>
                   <div className="text-[11px] text-text-secondary font-bold uppercase tracking-wider mb-1">Sprint Status</div>
                   <div className={`text-sm font-bold uppercase ${getStatusBadgeColor(stats.sprint.status)} px-2 py-1 rounded-xl`}>
                       {stats.sprint.status}
                   </div>
                </>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3.5 mb-3.5">
        <div className="bg-bg-card border border-line rounded-2xl p-4 shadow-sm lg:col-span-2">
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
                        <Tooltip formatter={(value, name) => [`${value} Tasks`, name]} contentStyle={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-line)', color: 'var(--color-text-primary)' }} itemStyle={{ color: 'var(--color-text-secondary)' }} />
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

        <div className="bg-bg-card border border-line rounded-2xl p-4 shadow-sm lg:col-span-3">
          <h2 className="text-sm font-bold text-text-primary mb-1">Subtask Completion by Task</h2>
          <p className="text-[10px] text-text-secondary mb-4">Breakdown of subtask progress per parent task.</p>
          <div className="h-[220px]">
            {stats.subtaskCompletion.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-text-muted">No tasks to display.</div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.subtaskCompletion} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }} maxBarSize={40}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                    <XAxis type="number" hide  tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}/>
                    <YAxis dataKey="taskTitle" type="category" hide />
                    <Tooltip cursor={{fill: 'var(--color-bg-secondary)'}} formatter={(value, name) => [value, name]} contentStyle={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-line)', color: 'var(--color-text-primary)' }} itemStyle={{ color: 'var(--color-text-secondary)' }} />
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
        <div className="bg-bg-card border border-line rounded-2xl p-4 shadow-sm">
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
        <div className="bg-bg-card border border-line rounded-2xl p-4 shadow-sm flex flex-col">
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
                      let bg = 'bg-line';
                      if(st === 'Present') bg = 'bg-green-500';
                      else if(st === 'Absent') bg = 'bg-red-500';
                      else if(st === 'Half-Day') bg = 'bg-amber-400';
                      else if(st === 'On Leave') bg = 'bg-gray-400';
                      return (
                          <div key={i} className={`w-4 h-4 rounded-2xl ${bg}`} title={`${date}: ${st || 'No Record'}`}></div>
                      );
                  })}
              </div>
          </div>
        </div>

        <div className="bg-bg-card border border-line rounded-2xl p-4 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-sm font-bold text-text-primary">Upcoming Deadlines</h2>
            <div className="text-[10px] text-text-secondary bg-bg-secondary px-2 py-0.5 rounded-xl font-bold uppercase">{selectedSprintDetails?.sprintName}</div>
          </div>
          <p className="text-[10px] text-text-secondary mb-4">Tasks and subtasks sorted by urgency.</p>
          <div className="flex-1 overflow-y-auto space-y-2">
              {stats.deadlines.length === 0 ? (
                  <div className="text-sm text-text-muted text-center py-4">All caught up! No pending items.</div>
              ) : (
                  stats.deadlines.map((d, i) => {
                      const endDate = new Date(stats.sprint.end_date);
                      const today = new Date();
                      const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
                      const dateStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      
                      return (
                      <div key={i} className="flex justify-between items-center border border-line-light p-3 rounded-2xl bg-bg-secondary/30 hover:bg-bg-secondary/50 transition-colors">
                          <div className="flex items-center gap-3 overflow-hidden">
                              <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-2xl shrink-0 ${
                                  d.priority === 'critical' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                  d.priority === 'high' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                                  d.priority === 'medium' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'
                              }`}>{d.type}</span>
                              <div className="flex flex-col overflow-hidden">
                                  <span className="text-sm text-text-primary font-medium truncate" title={d.title}>{d.title}</span>
                                  <span className="text-[11px] text-text-secondary flex items-center gap-1 mt-0.5">
                                      <Calendar size={12} className="text-text-muted" /> Due {dateStr}
                                  </span>
                              </div>
                          </div>
                          <div className="flex flex-col items-end shrink-0 ml-3">
                              <span className="text-[10px] text-text-secondary uppercase font-bold mb-1">{d.status}</span>
                              <span className={`text-[11px] font-semibold flex items-center gap-1 ${
                                  daysLeft < 0 ? 'text-red-500' :
                                  daysLeft <= 2 ? 'text-orange-500' : 'text-text-secondary'
                              }`}>
                                  <Clock size={12} />
                                  {daysLeft < 0 ? 'Overdue' : daysLeft === 0 ? 'Due Today' : `${daysLeft}d left`}
                              </span>
                          </div>
                      </div>
                  )})
              )}
          </div>
        </div>
      </div>

          </div>
  );
}

function EmptyStateDashboard({ user, token }) {
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [attRes, leaveRes] = await Promise.all([
          axios.get('/api/attendance/logs', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
          axios.get(`/api/leaves/employee/${user?.id}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
        ]);
        setAttendance(attRes.data || []);
        setLeaves(leaveRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id && token) fetchData();
  }, [user, token]);

  // Attendance stats
  const last30Days = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    last30Days.push(d.toISOString().slice(0, 10));
  }
  const attMap = {};
  attendance.forEach(a => attMap[a.date] = a.status || (a.check_in_time ? 'Present' : 'Absent'));
  let present = 0, absent = 0, halfDay = 0, onLeave = 0;
  last30Days.forEach(date => {
    const st = attMap[date];
    if (st === 'Present') present++;
    else if (st === 'Absent') absent++;
    else if (st === 'Half-Day') halfDay++;
    else if (st === 'On Leave') onLeave++;
  });

  // Leave stats
  const approvedLeaves = leaves.filter(l => l.status === 'approved');
  const pendingLeaves = leaves.filter(l => l.status === 'pending');
  const rejectedLeaves = leaves.filter(l => l.status === 'rejected');

  const leaveTypeMap = {};
  approvedLeaves.forEach(l => {
    const type = l.leave_type || l.leaveType || 'Other';
    leaveTypeMap[type] = (leaveTypeMap[type] || 0) + (l.total_days || l.totalDays || 1);
  });
  const leaveChartData = Object.entries(leaveTypeMap).map(([name, value]) => ({ name, value }));
  const LEAVE_COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#ec4899'];

  const attendancePieData = [
    { name: 'Present', value: present, color: '#22c55e' },
    { name: 'Absent', value: absent, color: '#ef4444' },
    { name: 'Half-Day', value: halfDay, color: '#f59e0b' },
    { name: 'On Leave', value: onLeave, color: '#9ca3af' },
  ].filter(d => d.value > 0);

  const attendanceRate = last30Days.length > 0 ? Math.round(((present + halfDay * 0.5) / Math.max(last30Days.filter(d => {
    const day = new Date(d).getDay();
    return day !== 0 && day !== 6;
  }).length, 1)) * 100) : 0;

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-bg-secondary rounded-xl w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-bg-secondary rounded-2xl"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          <div className="h-[280px] bg-bg-secondary rounded-2xl"></div>
          <div className="h-[280px] bg-bg-secondary rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <div className="mb-6">
        <h1 className="text-xl font-medium mb-1">My Dashboard</h1>
        <p className="text-text-secondary text-sm">Welcome back, {user?.name?.split(' ')[0] || ''}. Here's your overview.</p>
      </div>

      {/* Info Banner */}
      <div className="bg-accent-blue/10 border border-accent-blue/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-accent-blue/20 rounded-full flex items-center justify-center shrink-0">
          <Bell size={20} className="text-accent-blue" />
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary">No sprints assigned yet</p>
          <p className="text-xs text-text-secondary mt-0.5">You haven't been assigned to any sprints. Your attendance and leave data are shown below.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-bg-card border border-line rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 size={16} className="text-green-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-text-primary">{present}</div>
          <div className="text-[11px] text-text-muted uppercase tracking-wider font-bold mt-1">Days Present</div>
        </div>
        <div className="bg-bg-card border border-line rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Activity size={16} className="text-blue-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-text-primary">{Math.min(attendanceRate, 100)}%</div>
          <div className="text-[11px] text-text-muted uppercase tracking-wider font-bold mt-1">Attendance Rate</div>
        </div>
        <div className="bg-bg-card border border-line rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Calendar size={16} className="text-amber-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-text-primary">{approvedLeaves.length}</div>
          <div className="text-[11px] text-text-muted uppercase tracking-wider font-bold mt-1">Leaves Taken</div>
        </div>
        <div className="bg-bg-card border border-line rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Clock size={16} className="text-purple-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-text-primary">{pendingLeaves.length}</div>
          <div className="text-[11px] text-text-muted uppercase tracking-wider font-bold mt-1">Pending Leaves</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-6">
        {/* Attendance Pie Chart */}
        <div className="bg-bg-card border border-line rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-bold text-text-primary mb-1">Attendance Overview</h2>
          <p className="text-[10px] text-text-secondary mb-4">Last 30 days attendance breakdown.</p>
          <div className="h-[220px] relative">
            {attendancePieData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-text-muted">No attendance data.</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendancePieData}
                      cx="50%" cy="45%" innerRadius={55} outerRadius={75}
                      paddingAngle={2} dataKey="value" stroke="none"
                    >
                      {attendancePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} Days`, name]} contentStyle={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-line)', color: 'var(--color-text-primary)' }} itemStyle={{ color: 'var(--color-text-secondary)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mt-[-5px]">
                  <div className="text-2xl font-bold text-text-primary leading-none">{present + absent + halfDay + onLeave}</div>
                  <div className="text-[10px] text-text-secondary uppercase font-bold tracking-wider mt-1">Days</div>
                </div>
                <div className="absolute bottom-0 w-full flex justify-center gap-3 flex-wrap">
                  {attendancePieData.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[10px] font-bold text-text-secondary">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                      {entry.name}: {entry.value}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Leave Summary */}
        <div className="bg-bg-card border border-line rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-bold text-text-primary mb-1">Leave Summary</h2>
          <p className="text-[10px] text-text-secondary mb-4">Breakdown of approved leave types.</p>
          <div className="h-[220px] relative">
            {leaveChartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-text-muted">No leaves taken yet.</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leaveChartData}
                      cx="50%" cy="45%" innerRadius={55} outerRadius={75}
                      paddingAngle={2} dataKey="value" stroke="none"
                    >
                      {leaveChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={LEAVE_COLORS[index % LEAVE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} Days`, name]} contentStyle={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-line)', color: 'var(--color-text-primary)' }} itemStyle={{ color: 'var(--color-text-secondary)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mt-[-5px]">
                  <div className="text-2xl font-bold text-text-primary leading-none">{leaveChartData.reduce((s, d) => s + d.value, 0)}</div>
                  <div className="text-[10px] text-text-secondary uppercase font-bold tracking-wider mt-1">Days</div>
                </div>
                <div className="absolute bottom-0 w-full flex justify-center gap-3 flex-wrap">
                  {leaveChartData.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[10px] font-bold text-text-secondary">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: LEAVE_COLORS[idx % LEAVE_COLORS.length] }}></div>
                      {entry.name}: {entry.value}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Attendance Heatmap */}
      <div className="bg-bg-card border border-line rounded-2xl p-4 shadow-sm mb-6">
        <h2 className="text-sm font-bold text-text-primary mb-1">Attendance Heatmap (Last 30 Days)</h2>
        <div className="flex gap-4 text-[10px] font-bold tracking-wider uppercase mb-4">
          <span className="text-green-500 flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-green-500 inline-block"></span> Present: {present}</span>
          <span className="text-red-500 flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-500 inline-block"></span> Absent: {absent}</span>
          <span className="text-amber-500 flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block"></span> Half-Day: {halfDay}</span>
          <span className="text-text-secondary flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-gray-400 inline-block"></span> Leave: {onLeave}</span>
        </div>
        <div className="flex items-center justify-center">
          <div className="flex flex-wrap gap-1.5 max-w-[400px]">
            {last30Days.map((date, i) => {
              const st = attMap[date];
              let bg = 'bg-line';
              if (st === 'Present') bg = 'bg-green-500';
              else if (st === 'Absent') bg = 'bg-red-500';
              else if (st === 'Half-Day') bg = 'bg-amber-400';
              else if (st === 'On Leave') bg = 'bg-gray-400';
              const dayLabel = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              return (
                <div key={i} className={`w-5 h-5 rounded ${bg} cursor-default transition-transform hover:scale-125`} title={`${dayLabel}: ${st || 'No Record'}`}></div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Leaves Table */}
      {leaves.length > 0 && (
        <div className="bg-bg-card border border-line rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-bold text-text-primary mb-1">Recent Leave Requests</h2>
          <p className="text-[10px] text-text-secondary mb-4">Your last leave applications and their status.</p>
          <div className="space-y-2">
            {leaves.slice(0, 5).map((leave, i) => {
              const statusColor = leave.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                leave.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                'bg-amber-500/10 text-amber-500 border-amber-500/20';
              return (
                <div key={i} className="flex justify-between items-center border border-line p-3 rounded-2xl bg-bg-secondary/30 hover:bg-bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-2xl shrink-0 border ${statusColor}`}>
                      {leave.leave_type || leave.leaveType || 'Leave'}
                    </span>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm text-text-primary font-medium truncate">
                        {new Date(leave.start_date || leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → {new Date(leave.end_date || leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="text-[11px] text-text-secondary mt-0.5">{leave.total_days || leave.totalDays || 1} day(s)</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${statusColor}`}>
                    {leave.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
