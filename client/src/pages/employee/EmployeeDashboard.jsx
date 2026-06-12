import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Clock, AlertCircle, CheckCircle2, PlayCircle, Plus, MessageSquare, X, FileText, Play, Square } from 'lucide-react';
import SprintTimer from '../../components/SprintTimer';

export default function EmployeeDashboard() {
  const { user, token } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showSubtaskModal, setShowSubtaskModal] = useState(false);
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [requirementsData, setRequirementsData] = useState({ notes: [], attachments: [], sprintName: '' });
  const [selectedTaskId, setSelectedTaskId] = useState('');

  const [subtaskForm, setSubtaskForm] = useState({ title: '', description: '', estimatedHours: '' });
  const [queryText, setQueryText] = useState('');

  const [activeTimer, setActiveTimer] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const fetchActiveTimer = async () => {
    try {
      const res = await axios.get('/api/timers/active', { headers: { Authorization: `Bearer ${token}` } });
      setActiveTimer(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTasks = async () => {
    if (user?.id) {
      try {
        const res = await axios.get(`/api/tasks/employee/${user.id}`, { headers: { Authorization: `Bearer ${token}` } });
        const tasksData = res.data.filter(t => t.sprintStatus === 'planner' || t.sprintStatus === 'active');
        
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
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (token && user?.id) {
      fetchTasks();
      fetchActiveTimer();
    }
  }, [user, token]);

  useEffect(() => {
    let interval;
    if (activeTimer) {
      interval = setInterval(() => {
        const start = new Date(activeTimer.start_time).getTime();
        setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  const handleStartTimer = async (subtaskId) => {
    if (activeTimer && activeTimer.subtask_id !== subtaskId) {
      alert('You have an active timer on another subtask. Stop it before starting a new one.');
      return;
    }
    try {
      const res = await axios.post('/api/timers/start', { subtaskId }, { headers: { Authorization: `Bearer ${token}` } });
      setActiveTimer(res.data);
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to start timer');
    }
  };

  const handleStopTimer = async () => {
    try {
      await axios.post('/api/timers/stop', {}, { headers: { Authorization: `Bearer ${token}` } });
      setActiveTimer(null);
      setElapsedSeconds(0);
      fetchTasks();
    } catch (err) {
      alert('Failed to stop timer');
    }
  };

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubtaskStatusUpdate = async (subtaskId, newStatus) => {
    try {
      await axios.patch(`/api/subtasks/${subtaskId}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      fetchTasks();
    } catch (err) {
      console.error(err);
      alert('Failed to update subtask status');
    }
  };

  const handleMainTaskStatusUpdate = async (taskId, newStatus) => {
    try {
      await axios.patch(`/api/tasks/${taskId}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      fetchTasks();
      if (newStatus === 'blocked') {
        openQueryModal(taskId);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update task status');
    }
  };

  const handleSubtaskActualHours = async (subtaskId, subtask, spentHours) => {
    try {
      await axios.put(`/api/subtasks/${subtaskId}`, { 
        ...subtask,
        spentHours: Number(spentHours)
      }, { headers: { Authorization: `Bearer ${token}` } });
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update subtask hours');
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
      fetchTasks();
      alert('Subtask created successfully!');
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

  const activeTasks = tasks.filter(t => t.sprintStatus === 'active');
  const plannerTasks = tasks.filter(t => t.sprintStatus === 'planner');

  if (loading) return <div>Loading your dashboard...</div>;

  return (
    <div className="pb-10">
      <div className="page-header mb-6">
        <h1 className="text-xl font-medium mb-1">My Dashboard</h1>
        <p className="text-text-secondary text-sm">Welcome back, {user?.name?.split(' ')[0] || ''}. Here's your current workload.</p>
      </div>

      {plannerTasks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-[#020024] mb-3">Planner Mode Tasks</h2>
          <p className="text-sm text-gray-500 mb-4">These sprints are currently in Planner mode. Create your subtasks and ask any questions before the sprint begins.</p>
          <div className="space-y-3">
            {plannerTasks.map(task => (
              <div key={task.id} className="p-4 border-[1px] border-purple-200 rounded-lg hover:border-purple-300 transition-colors bg-purple-50/30">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-purple-700 font-bold text-[13px]">{task.taskId}</span>
                      <span className="text-[11px] text-purple-600 bg-purple-100 px-2 py-0.5 rounded font-bold">{task.sprintName}</span>
                    </div>
                    <h3 className="text-[15px] font-bold text-[#020024]">{task.title}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openRequirementsModal(task.sprintId, task.sprintName)} className="text-xs font-bold bg-white border border-blue-200 text-blue-700 px-3 py-1.5 rounded hover:bg-blue-50 flex items-center gap-1 transition-colors">
                      <FileText size={14}/> Requirements
                    </button>
                    <button onClick={() => openSubtaskModal(task.taskId)} className="text-xs font-bold bg-white border border-purple-200 text-purple-700 px-3 py-1.5 rounded hover:bg-purple-50 flex items-center gap-1 transition-colors">
                      <Plus size={14}/> Add Subtask
                    </button>
                    <button onClick={() => openQueryModal(task.taskId)} className="text-xs font-bold bg-white border border-amber-200 text-amber-600 px-3 py-1.5 rounded hover:bg-amber-50 flex items-center gap-1 transition-colors">
                      <MessageSquare size={14}/> Raise Query
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                <div className="text-[12px] font-medium text-gray-500 mb-4">
                  Total Subtasks: <span className="text-[#020024]">{task.subtaskCount}</span>
                </div>

                {task.subtasksList && task.subtasksList.length > 0 && (
                  <div className="space-y-2 border-t border-purple-100 pt-3">
                    <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Subtasks</h4>
                    {task.subtasksList.map(sub => (
                      <div key={sub.id} className="flex items-center justify-between p-2.5 bg-white border border-purple-100 rounded text-sm">
                        <div className="flex-1 font-medium text-gray-800">{sub.title}</div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 font-medium">{sub.estimatedHours}h est.</span>
                          <span className="text-[10px] font-bold uppercase text-gray-400">{sub.status}</span>
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

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-[#020024]">Active Sprint Tasks</h2>
          {activeTasks.length > 0 && (
            <SprintTimer 
              sprint={{ status: activeTasks[0].sprintStatus, start_date: activeTasks[0].sprintStart, end_date: activeTasks[0].sprintEnd }} 
              compact={true} 
            />
          )}
        </div>
        <div className="space-y-3">
          {activeTasks.map(task => (
            <div key={task.id} className="p-4 border-[1px] border-gray-200 rounded-lg hover:border-[#005AFF] transition-colors bg-white shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[#005AFF] font-bold text-[13px]">{task.taskId}</span>
                    <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-bold uppercase">{task.sprintName}</span>
                  </div>
                  <h3 className="text-[15px] font-bold text-[#020024]">{task.title}</h3>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <select 
                    className={`text-[11px] font-bold uppercase rounded px-2 py-1 outline-none border cursor-pointer ${
                      task.status === 'done' ? 'bg-green-100 text-green-700 border-green-200' : 
                      task.status === 'inprogress' ? 'bg-blue-100 text-blue-700 border-blue-200' : 
                      task.status === 'blocked' ? 'bg-red-100 text-red-700 border-red-200' : 
                      'bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                    value={task.status}
                    onChange={(e) => handleMainTaskStatusUpdate(task.taskId, e.target.value)}
                  >
                    <option value="todo">To Do</option>
                    <option value="inprogress">In Progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="done">Done</option>
                  </select>
                  <button onClick={() => openRequirementsModal(task.sprintId, task.sprintName)} className="text-xs font-bold text-[#005AFF] hover:underline flex items-center gap-1">
                    <FileText size={12}/> View Requirements
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">{task.description}</p>
              
              <div className="mb-4">
                <button onClick={() => openSubtaskModal(task.taskId)} className="text-xs font-bold bg-white border border-purple-200 text-purple-700 px-3 py-1.5 rounded hover:bg-purple-50 flex items-center gap-1 transition-colors">
                  <Plus size={14}/> Add Subtask
                </button>
              </div>

              {task.subtasksList && task.subtasksList.length > 0 && (
                <div className="mb-4 space-y-2 border-t border-gray-100 pt-3">
                  <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Subtasks</h4>
                  {task.subtasksList.map(sub => {
                    const isTimerRunning = activeTimer && activeTimer.subtask_id === sub.subtaskId;
                    return (
                      <div key={sub.id} className={`flex items-center justify-between p-2.5 border rounded text-sm transition-colors ${isTimerRunning ? 'bg-blue-50 border-blue-200 shadow-inner' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex-1">
                          <div className={`font-medium ${isTimerRunning ? 'text-blue-800' : 'text-gray-800'}`}>{sub.title}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            Time logged: <span className="font-bold text-gray-700">{sub.spentHours || 0}h</span>
                            {isTimerRunning && (
                              <span className="ml-2 font-mono text-blue-600 font-bold bg-blue-100 px-1.5 py-0.5 rounded">
                                + {formatTime(elapsedSeconds)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {isTimerRunning ? (
                            <button onClick={handleStopTimer} className="flex items-center gap-1 text-[10px] font-bold bg-red-100 text-red-700 hover:bg-red-200 px-2 py-1.5 rounded">
                              <Square size={12} fill="currentColor" /> Stop
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleStartTimer(sub.subtaskId)} 
                              className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1.5 rounded ${sub.status === 'done' ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                              disabled={sub.status === 'done'}
                            >
                              <Play size={12} fill="currentColor" /> Start
                            </button>
                          )}
                          <select 
                            className={`text-xs font-bold bg-white border rounded px-2 py-1 outline-none ${
                              sub.status === 'done' ? 'border-green-300 text-green-700' : 
                              sub.status === 'inprogress' ? 'border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700'
                            }`}
                            value={sub.status}
                            onChange={(e) => handleSubtaskStatusUpdate(sub.subtaskId, e.target.value)}
                          >
                            <option value="todo">To Do</option>
                            <option value="inprogress">In Progress</option>
                            <option value="done">Done</option>
                          </select>
                          {sub.status === 'done' && (
                            <div className="flex items-center gap-1">
                              <input 
                                type="number" 
                                placeholder="Actual" 
                                className="w-16 px-1.5 py-1 text-xs border border-gray-300 rounded outline-none"
                                defaultValue={sub.spentHours || ''}
                                onBlur={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (!isNaN(val)) {
                                    // Fallback to manual update if timer wasn't used or needs correction
                                    axios.put(`/api/subtasks/${sub.subtaskId}`, {
                                      title: sub.title,
                                      description: sub.description,
                                      priority: sub.priority,
                                      estimatedHours: sub.estimatedHours,
                                      spentHours: val
                                    }, { headers: { Authorization: `Bearer ${token}` } }).then(fetchTasks);
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
              
              <div className="grid grid-cols-3 gap-6 items-center">
                <div className="col-span-2">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Progress ({task.subtaskDoneCount}/{task.subtaskCount} subtasks)</div>
                    <div className="text-[11px] font-bold text-[#005AFF]">{task.completionPct}%</div>
                  </div>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#005AFF] rounded-full transition-all duration-500" style={{ width: `${task.completionPct}%` }} />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Effort</div>
                  <div className="text-sm text-[#020024] font-medium">
                    {task.spentHours}h <span className="text-gray-400 font-normal">/ {task.estimatedHours}h</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {activeTasks.length === 0 && (
            <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg bg-gray-50">
              You have no tasks in the active sprint.
            </div>
          )}
        </div>
      </div>

      {/* Subtask Modal */}
      {showSubtaskModal && (
        <div className="fixed inset-0 bg-[#020024]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-[#020024]">Create Subtask</h2>
              <button onClick={() => setShowSubtaskModal(false)} className="text-gray-400 hover:text-gray-700"><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateSubtask} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Subtask Title *</label>
                <input type="text" className="w-full px-3 py-2 border-[1.5px] border-gray-300 rounded-md text-sm focus:border-[#005AFF] outline-none" required value={subtaskForm.title} onChange={e => setSubtaskForm({...subtaskForm, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Description</label>
                <textarea className="w-full px-3 py-2 border-[1.5px] border-gray-300 rounded-md text-sm focus:border-[#005AFF] outline-none" rows="2" value={subtaskForm.description} onChange={e => setSubtaskForm({...subtaskForm, description: e.target.value})}></textarea>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Estimated Hours</label>
                <input type="number" className="w-full px-3 py-2 border-[1.5px] border-gray-300 rounded-md text-sm focus:border-[#005AFF] outline-none" value={subtaskForm.estimatedHours} onChange={e => setSubtaskForm({...subtaskForm, estimatedHours: e.target.value})} />
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full py-2.5 bg-[#005AFF] text-white font-bold rounded-md hover:bg-blue-700 transition-colors">Save Subtask</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Query Modal */}
      {showQueryModal && (
        <div className="fixed inset-0 bg-[#020024]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-[#020024]">Raise Query</h2>
              <button onClick={() => setShowQueryModal(false)} className="text-gray-400 hover:text-gray-700"><X size={20}/></button>
            </div>
            <form onSubmit={handleRaiseQuery} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Your Question / Blocker *</label>
                <textarea className="w-full px-3 py-2 border-[1.5px] border-gray-300 rounded-md text-sm focus:border-amber-500 outline-none" rows="4" required placeholder="What is blocking your task?" value={queryText} onChange={e => setQueryText(e.target.value)}></textarea>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full py-2.5 bg-amber-500 text-white font-bold rounded-md hover:bg-amber-600 transition-colors">Submit Query</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Requirements Modal */}
      {showRequirementsModal && (
        <div className="fixed inset-0 bg-[#020024]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-lg font-bold text-[#020024]">Sprint Requirements</h2>
                <div className="text-sm text-gray-500 font-medium mt-1">{requirementsData.sprintName}</div>
              </div>
              <button onClick={() => setShowRequirementsModal(false)} className="text-gray-400 hover:text-gray-700"><X size={20}/></button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Notes & Descriptions</h3>
                <div className="space-y-3">
                  {requirementsData.notes.length === 0 ? (
                    <div className="text-sm text-gray-400 italic">No notes provided for this sprint.</div>
                  ) : (
                    requirementsData.notes.map(note => (
                      <div key={note.id} className="bg-blue-50/50 border border-blue-100 p-4 rounded-lg">
                        <h4 className="font-bold text-[#020024] mb-2">{note.title}</h4>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">External Documents</h3>
                <div className="space-y-3">
                  {requirementsData.attachments.length === 0 ? (
                    <div className="text-sm text-gray-400 italic">No external documents provided.</div>
                  ) : (
                    requirementsData.attachments.map(att => (
                      <div key={att.id} className="flex items-center gap-3 bg-gray-50 border border-gray-200 p-3 rounded-lg">
                        <FileText size={16} className="text-gray-400" />
                        <a href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[#005AFF] hover:underline flex-1 truncate">
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
