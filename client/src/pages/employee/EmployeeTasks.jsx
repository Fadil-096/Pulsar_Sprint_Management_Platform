import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Clock, AlertCircle, CheckCircle2, PlayCircle, Plus, MessageSquare, X, FileText, Play, Square, ChevronDown, Activity, BarChart2, Calendar, Bell } from 'lucide-react';
import SprintTimer from '../../components/SprintTimer';

export default function EmployeeTasks() {
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
      case 'active': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'planner': return 'bg-purple-100 text-purple-700';
      default: return 'bg-bg-secondary text-text-secondary';
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
          <h1 className="text-xl font-medium mb-1">My Tasks</h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2" ref={dropdownRef}>
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-bg-card border border-line rounded-md text-sm font-medium hover:bg-table-row-alt transition-colors shadow-sm"
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
                  <div className="max-h-60 overflow-y-auto">
                    {sprints.map(sprint => (
                      <button
                        key={sprint.sprintId}
                        onClick={() => {
                          setSelectedSprintId(sprint.sprintId);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-table-row-alt flex items-center justify-between transition-colors ${sprint.sprintId === selectedSprintId ? 'bg-blue-50/50' : ''}`}
                      >
                        <div>
                          <div className="font-medium text-text-primary">{sprint.sprintName}</div>
                          <div className="text-xs text-text-secondary">{sprint.sprintId}</div>
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
        <p className="text-text-secondary text-sm">Welcome back, {user?.name?.split(' ')[0] || ''}. Here's your current workload.</p>
      </div>

      <div>
        <h2 className="text-lg font-bold text-text-primary mb-4">Sprint Tasks ({selectedSprintDetails?.sprintName})</h2>
        
        {tasks.filter(t => stats.sprint.status === 'planner').length > 0 && (
          <div className="mb-8">
            <h3 className="text-md font-bold text-purple-800 mb-2">Planner Mode</h3>
            <p className="text-sm text-text-secondary mb-4">Create your subtasks and ask any questions before the sprint begins.</p>
            <div className="space-y-3">
              {tasks.filter(t => stats.sprint.status === 'planner').map(task => (
                <div key={task.id} className="p-4 border-[1px] border-purple-200 rounded-lg hover:border-purple-300 transition-colors bg-purple-50/30">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-purple-700 font-bold text-[13px]">{task.taskId}</span>
                      </div>
                      <h3 className="text-[15px] font-bold text-text-primary">{task.title}</h3>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openRequirementsModal(task.sprintId, stats.sprint.sprintName)} className="text-xs font-bold bg-bg-card border border-blue-200 text-blue-700 px-3 py-1.5 rounded hover:bg-blue-50 flex items-center gap-1 transition-colors">
                        <FileText size={14}/> Requirements
                      </button>
                      <button onClick={() => openSubtaskModal(task.taskId)} className="text-xs font-bold bg-bg-card border border-purple-200 text-purple-700 px-3 py-1.5 rounded hover:bg-purple-50 flex items-center gap-1 transition-colors">
                        <Plus size={14}/> Add Subtask
                      </button>
                      <button onClick={() => openQueryModal(task.taskId)} className="text-xs font-bold bg-bg-card border border-amber-200 text-amber-600 px-3 py-1.5 rounded hover:bg-amber-50 flex items-center gap-1 transition-colors">
                        <MessageSquare size={14}/> Raise Query
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary mb-2">{task.description}</p>
                  
                  {task.subtasksList && task.subtasksList.length > 0 && (
                    <div className="space-y-2 border-t border-purple-100 pt-3">
                      <h4 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">Subtasks</h4>
                      {task.subtasksList.map(sub => (
                        <div key={sub.id} className="flex items-center justify-between p-2.5 bg-bg-card border border-purple-100 rounded text-sm">
                          <div className="flex-1 font-medium text-text-primary">{sub.title}</div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-text-secondary font-medium">{sub.estimatedHours}h est.</span>
                            <span className="text-[10px] font-bold uppercase text-text-muted">{sub.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tasks.filter(t => stats.sprint.status === 'active' || stats.sprint.status === 'completed').length > 0 && (
            <div className="space-y-3">
            {tasks.filter(t => stats.sprint.status === 'active' || stats.sprint.status === 'completed').map(task => (
                <div key={task.id} className="p-4 border-[1px] border-line rounded-lg hover:border-[#005AFF] transition-colors bg-bg-card shadow-sm">
                <div className="flex justify-between items-start mb-2">
                    <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-accent-blue font-bold text-[13px]">{task.taskId}</span>
                    </div>
                    <h3 className="text-[15px] font-bold text-text-primary">{task.title}</h3>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                    {stats.sprint.status === 'active' && (
                        <select 
                            className={`text-[11px] font-bold uppercase rounded px-2 py-1 outline-none border cursor-pointer ${
                            task.status === 'done' ? 'bg-green-100 text-green-700 border-green-200' : 
                            task.status === 'inprogress' ? 'bg-blue-100 text-blue-700 border-blue-200' : 
                            task.status === 'blocked' ? 'bg-red-100 text-red-700 border-red-200' : 
                            'bg-bg-secondary text-text-secondary border-line'
                            }`}
                            value={task.status}
                            onChange={(e) => handleMainTaskStatusUpdate(task.taskId, e.target.value)}
                        >
                            <option value="todo">To Do</option>
                            <option value="inprogress">In Progress</option>
                            <option value="blocked">Blocked</option>
                            <option value="done">Done</option>
                        </select>
                    )}
                    <button onClick={() => openRequirementsModal(task.sprintId, stats.sprint.sprintName)} className="text-xs font-bold text-semantic-link hover:underline flex items-center gap-1">
                        <FileText size={12}/> View Requirements
                    </button>
                    </div>
                </div>
                <p className="text-sm text-text-secondary mb-4">{task.description}</p>
                
                {stats.sprint.status === 'active' && (
                    <div className="mb-4">
                        <button onClick={() => openSubtaskModal(task.taskId)} className="text-xs font-bold bg-bg-card border border-purple-200 text-purple-700 px-3 py-1.5 rounded hover:bg-purple-50 flex items-center gap-1 transition-colors">
                        <Plus size={14}/> Add Subtask
                        </button>
                    </div>
                )}

                {task.subtasksList && task.subtasksList.length > 0 && (
                    <div className="mb-4 space-y-2 border-t border-line-light pt-3">
                    <h4 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">Subtasks</h4>
                    {task.subtasksList.map(sub => {
                        return (
                        <div key={sub.id} className="flex items-center justify-between p-2.5 border rounded text-sm transition-colors bg-bg-secondary border-line">
                            <div className="flex-1">
                            <div className="font-medium text-text-primary">{sub.title}</div>
                            <div className="text-[10px] text-text-secondary mt-0.5">
                                Time logged: <span className="font-bold text-text-secondary">{sub.spentHours || 0}h</span>
                            </div>
                            </div>
                            <div className="flex items-center gap-3">
                            {stats.sprint.status === 'active' && (
                                <>
                                <select 
                                    className={`text-xs font-bold bg-bg-card border rounded px-2 py-1 outline-none ${
                                    sub.status === 'done' ? 'border-green-300 text-green-700' : 
                                    sub.status === 'inprogress' ? 'border-blue-300 text-blue-700' : 'border-line text-text-secondary'
                                    }`}
                                    value={sub.status}
                                    onChange={(e) => handleSubtaskStatusUpdate(sub.subtaskId, e.target.value)}
                                >
                                    <option value="todo">To Do</option>
                                    <option value="inprogress">In Progress</option>
                                    <option value="done">Done</option>
                                </select>
                                </>
                            )}
                            {sub.status === 'done' && stats.sprint.status === 'active' && (
                                <div className="flex items-center gap-1">
                                <input 
                                    type="number" 
                                    placeholder="Actual" 
                                    className="w-16 px-1.5 py-1 text-xs border border-line rounded outline-none"
                                    defaultValue={sub.spentHours || ''}
                                    onBlur={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val)) {
                                        axios.put(`/api/subtasks/${sub.subtaskId}`, {
                                        title: sub.title,
                                        description: sub.description,
                                        priority: sub.priority,
                                        estimatedHours: sub.estimatedHours,
                                        spentHours: val
                                        }, { headers: { Authorization: `Bearer ${token}` } })
                                        .then(() => {
                                            fetchTasks(selectedSprintId);
                                            fetchStats(selectedSprintId);
                                        });
                                    }
                                    }}
                                />
                                </div>
                            )}
                            </div>
                        </div>
                        );
                    })}
                    </div>
                )}
                </div>
            ))}
            </div>
        )}
      </div>

      {showSubtaskModal && (
        <div className="fixed inset-0 bg-[#020024]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-bg-card rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-text-primary">Create Subtask</h2>
              <button onClick={() => setShowSubtaskModal(false)} className="text-text-muted hover:text-gray-700"><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateSubtask} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">Subtask Title *</label>
                <input type="text" className="w-full px-3 py-2 border-[1.5px] border-line rounded-md text-sm focus:border-[#005AFF] outline-none" required value={subtaskForm.title} onChange={e => setSubtaskForm({...subtaskForm, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">Description</label>
                <textarea className="w-full px-3 py-2 border-[1.5px] border-line rounded-md text-sm focus:border-[#005AFF] outline-none" rows="2" value={subtaskForm.description} onChange={e => setSubtaskForm({...subtaskForm, description: e.target.value})}></textarea>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">Estimated Hours</label>
                <input type="number" className="w-full px-3 py-2 border-[1.5px] border-line rounded-md text-sm focus:border-[#005AFF] outline-none" value={subtaskForm.estimatedHours} onChange={e => setSubtaskForm({...subtaskForm, estimatedHours: e.target.value})} />
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full py-2.5 bg-accent-blue text-white font-bold rounded-md hover:bg-blue-700 transition-colors">Save Subtask</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQueryModal && (
        <div className="fixed inset-0 bg-[#020024]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-bg-card rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-text-primary">Raise Query</h2>
              <button onClick={() => setShowQueryModal(false)} className="text-text-muted hover:text-gray-700"><X size={20}/></button>
            </div>
            <form onSubmit={handleRaiseQuery} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">Your Question / Blocker *</label>
                <textarea className="w-full px-3 py-2 border-[1.5px] border-line rounded-md text-sm focus:border-amber-500 outline-none" rows="4" required placeholder="What is blocking your task?" value={queryText} onChange={e => setQueryText(e.target.value)}></textarea>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full py-2.5 bg-amber-500 text-white font-bold rounded-md hover:bg-amber-600 transition-colors">Submit Query</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRequirementsModal && (
        <div className="fixed inset-0 bg-[#020024]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-bg-card rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-line-light flex justify-between items-center bg-bg-secondary/50">
              <div>
                <h2 className="text-lg font-bold text-text-primary">Sprint Requirements</h2>
                <div className="text-sm text-text-secondary font-medium mt-1">{requirementsData.sprintName}</div>
              </div>
              <button onClick={() => setShowRequirementsModal(false)} className="text-text-muted hover:text-gray-700"><X size={20}/></button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <div>
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Notes & Descriptions</h3>
                <div className="space-y-3">
                  {requirementsData.notes.length === 0 ? (
                    <div className="text-sm text-text-muted italic">No notes provided for this sprint.</div>
                  ) : (
                    requirementsData.notes.map(note => (
                      <div key={note.id} className="bg-blue-50/50 border border-blue-100 p-4 rounded-lg">
                        <h4 className="font-bold text-text-primary mb-2">{note.title}</h4>
                        <p className="text-sm text-text-secondary whitespace-pre-wrap">{note.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">External Documents</h3>
                <div className="space-y-3">
                  {requirementsData.attachments.length === 0 ? (
                    <div className="text-sm text-text-muted italic">No external documents provided.</div>
                  ) : (
                    requirementsData.attachments.map(att => (
                      <div key={att.id} className="flex items-center gap-3 bg-bg-secondary border border-line p-3 rounded-lg">
                        <FileText size={16} className="text-text-muted" />
                        <a href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-semantic-link hover:underline flex-1 truncate">
                          {att.fileName}
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
