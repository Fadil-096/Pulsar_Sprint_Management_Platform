import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Clock, AlertCircle, CheckCircle2, PlayCircle, Plus, MessageSquare, X, FileText, Play, Square, ChevronDown, Activity, BarChart2, Calendar, Bell, Flag, Search, Edit2 } from 'lucide-react';
import SprintTimer from '../../components/SprintTimer';

export default function EmployeeTasks() {
  const { user, token } = useAuth();
  const [sprints, setSprints] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sprintFilterStatus, setSprintFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [showSubtaskModal, setShowSubtaskModal] = useState(false);
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [requirementsData, setRequirementsData] = useState({ notes: [], attachments: [], sprintName: '' });
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [editingSubtaskId, setEditingSubtaskId] = useState(null);

  const [subtaskForm, setSubtaskForm] = useState({ title: '', description: '', estimatedHours: '' });
  const [queryText, setQueryText] = useState('');


  useEffect(() => {
    if (!user?.id || !token) return;
    axios.get(`/api/employee/${user.id}/sprints`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (res.data.length > 0) {
          const sortOrder = { 'active': 1, 'planner': 2, 'created': 3, 'completed': 4 };
          const sortedSprints = res.data.sort((a, b) => (sortOrder[a.status] || 99) - (sortOrder[b.status] || 99));
          setSprints(sortedSprints);
        } else {
          setLoading(false);
        }
      })
      .catch(err => console.error(err));
  }, [user, token]);



  const fetchTasks = async () => {
    if (!user?.id) return;
    try {
      const res = await axios.get('/api/tasks', { 
        params: { assignedTo: user.id, includeSubtasks: true },
        headers: { Authorization: `Bearer ${token}` } 
      });
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id && token) {
      fetchTasks();
    }
  }, [user, token]);



  const handleSubtaskStatusUpdate = async (subtaskId, newStatus) => {
    try {
      await axios.patch(`/api/subtasks/${subtaskId}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      fetchTasks();
    } catch (err) {
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
      alert('Failed to update task status');
    }
  };

  const handleCreateSubtask = async (e) => {
    e.preventDefault();
    try {
      if (editingSubtaskId) {
        await axios.put(`/api/subtasks/${editingSubtaskId}`, {
          title: subtaskForm.title,
          description: subtaskForm.description,
          estimatedHours: subtaskForm.estimatedHours
        }, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post('/api/subtasks', { 
          taskId: selectedTaskId, 
          title: subtaskForm.title,
          description: subtaskForm.description,
          estimatedHours: subtaskForm.estimatedHours
        }, { headers: { Authorization: `Bearer ${token}` } });
      }
      setShowSubtaskModal(false);
      setEditingSubtaskId(null);
      setSubtaskForm({ title: '', description: '', estimatedHours: '' });
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.error || `Failed to ${editingSubtaskId ? 'update' : 'create'} subtask`);
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
    setEditingSubtaskId(null);
    setSubtaskForm({ title: '', description: '', estimatedHours: '' });
    setShowSubtaskModal(true);
  };

  const openEditSubtaskModal = (taskId, subtask) => {
    setSelectedTaskId(taskId);
    setEditingSubtaskId(subtask.subtaskId);
    setSubtaskForm({ 
      title: subtask.title || '', 
      description: subtask.description || '', 
      estimatedHours: subtask.estimatedHours || '' 
    });
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

  if (loading) return (
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

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'planner': return 'bg-purple-100 text-purple-700';
      case 'review': return 'bg-amber-100 text-amber-700';
      default: return 'bg-bg-secondary text-text-secondary';
    }
  };

  const filteredSprints = sprints.filter(s => sprintFilterStatus === 'all' || s.status === sprintFilterStatus);

  return (
    <div className="pb-10">
      <div className="page-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl font-medium mb-1">My Tasks</h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2 mb-4">
            
            {/* Status Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar mr-2">
              {['all', 'planner', 'active', 'review', 'completed'].map(status => (
                <button
                  key={status}
                  onClick={() => setSprintFilterStatus(status)}
                  className={`px-3 py-1.5 text-[11px] font-bold rounded-full whitespace-nowrap transition-colors ${
                    sprintFilterStatus === status 
                      ? 'bg-accent-blue text-white shadow-sm' 
                      : 'bg-bg-card border border-line text-text-secondary hover:bg-table-row-alt hover:text-text-primary'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
            
            <div className="relative mt-2 sm:mt-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-bg-card border border-accent-blue rounded-full text-[12px] text-text-primary focus:border-accent-blue focus:shadow-[0_0_10px_rgba(37,99,235,0.4)] hover:shadow-sm outline-none w-full sm:w-[200px] transition-all"
              />
            </div>
          </div>
        </div>
        <p className="text-text-secondary text-sm">Welcome back, {user?.name?.split(' ')[0] || ''}. Here's your current workload.</p>
      </div>

      <div className="space-y-10">
        {filteredSprints.length === 0 ? (
          <div className="text-text-secondary bg-bg-card p-6 rounded-2xl text-center border border-line">
            No sprints found for the selected status.
          </div>
        ) : (
          filteredSprints.map(sprint => {
            let sprintTasks = tasks.filter(t => t.sprintId === sprint.sprintId);
            
            if (searchQuery) {
              const query = searchQuery.toLowerCase();
              sprintTasks = sprintTasks.filter(t => 
                t.title?.toLowerCase().includes(query) || 
                t.taskId?.toLowerCase().includes(query)
              );
            }

            if (sprintTasks.length === 0 && (searchQuery || (sprint.status !== 'planner' && sprint.status !== 'active'))) return null;

            return (
              <div key={sprint.sprintId} className="bg-bg-card/30 p-1 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-lg font-bold text-text-primary">Sprint Tasks ({sprint.sprintName})</h2>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${getStatusBadgeColor(sprint.status)}`}>
                    {sprint.status}
                  </span>
                  {sprint.status === 'active' && sprint.sprintEnd && (
                    <span className="text-xs font-semibold flex items-center gap-1 text-text-secondary ml-auto bg-bg-secondary px-2 py-1 rounded-xl">
                      <Clock size={12} />
                      {(() => {
                        const daysLeft = Math.ceil((new Date(sprint.sprintEnd) - new Date()) / (1000 * 60 * 60 * 24));
                        return daysLeft < 0 ? 'Overdue' : daysLeft === 0 ? 'Due Today' : `${daysLeft} days left`;
                      })()}
                    </span>
                  )}
                </div>
                
                {sprint.status === 'planner' && (
                  <div className="mb-4">
                    <h3 className="text-md font-bold text-purple-400 mb-2">Planner Mode</h3>
                    <p className="text-sm text-text-secondary mb-4">Create your subtasks and ask any questions before the sprint begins.</p>
                    {sprintTasks.length > 0 ? (
                        <div className="space-y-3">
                        {sprintTasks.map(task => (
                            <div key={task.id} className="p-4 border border-line rounded-2xl hover:border-purple-500/50 transition-colors bg-bg-card shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-purple-400 font-bold text-[13px]">{task.taskId}</span>
                                </div>
                                <h3 className="text-[15px] font-bold text-text-primary">{task.title}</h3>
                                </div>
                                <div className="flex gap-2">
                                <button onClick={() => openRequirementsModal(task.sprintId, sprint.sprintName)} className="text-xs font-bold text-blue-400 px-3 py-1.5 rounded-xl hover:bg-blue-500/10 flex items-center gap-1 transition-colors">
                                    <FileText size={14}/> Requirements
                                </button>
                                <button onClick={() => openSubtaskModal(task.taskId)} className="text-xs font-bold text-purple-400 px-3 py-1.5 rounded-xl hover:bg-purple-500/10 flex items-center gap-1 transition-colors">
                                    <Plus size={14}/> Add Subtask
                                </button>
                                <button onClick={() => openQueryModal(task.taskId)} className="text-xs font-bold text-amber-400 px-3 py-1.5 rounded-xl hover:bg-amber-500/10 flex items-center gap-1 transition-colors">
                                    <MessageSquare size={14}/> Raise Query
                                </button>
                                </div>
                            </div>
                            <p className="text-sm text-text-secondary mb-2">{task.description}</p>
                            
                            {task.subtasksList && task.subtasksList.length > 0 && (
                                <div className="space-y-2 border-t border-line pt-3">
                                <h4 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">Subtasks</h4>
                                {task.subtasksList.map(sub => (
                                    <div key={sub.id} className="flex items-center justify-between p-2.5 bg-bg-secondary border border-line rounded-xl text-sm">
                                    <div className="flex-1 font-medium text-text-primary">{sub.title}</div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-bold uppercase text-text-muted">{sub.status}</span>
                                    </div>
                                    </div>
                                ))}
                                </div>
                            )}
                            </div>
                        ))}
                        </div>
                    ) : (
                        <div className="text-text-muted italic text-sm">No tasks assigned in this planner sprint.</div>
                    )}
                  </div>
                )}

                {(sprint.status === 'active' || sprint.status === 'completed' || sprint.status === 'review') && sprintTasks.length > 0 && (
                    <div className="space-y-3">
                    {sprintTasks.map(task => (
                        <div key={task.id} className="p-4 border-[1px] border-line rounded-2xl hover:border-[#005AFF] transition-colors bg-bg-card shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-accent-blue font-bold text-[13px]">{task.taskId}</span>
                                {task.priority && (
                                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-xl flex items-center gap-1 ${
                                        task.priority === 'critical' ? 'bg-red-100 text-red-700' :
                                        task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                        task.priority === 'medium' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                    }`}>
                                        <Flag size={10} className={
                                            task.priority === 'critical' ? 'fill-red-700' :
                                            task.priority === 'high' ? 'fill-orange-700' :
                                            task.priority === 'medium' ? 'fill-blue-700' : 'fill-green-700'
                                        } />
                                        {task.priority}
                                    </span>
                                )}
                            </div>
                            <h3 className="text-[15px] font-bold text-text-primary">{task.title}</h3>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                            {sprint.status === 'active' && (
                                <select 
                                    className={`text-[11px] font-bold uppercase rounded-xl px-2 py-1 outline-none border cursor-pointer ${
                                    task.status === 'done' ? 'bg-green-100 text-green-700 border-green-200' : 
                                    task.status === 'inprogress' ? 'bg-blue-100 text-blue-700 border-blue-200' : 
                                    task.status === 'blocked' ? 'bg-red-100 text-red-700 border-red-200' : 
                                    task.status === 'failed' ? 'bg-red-100 text-red-900 border-red-300' : 
                                    'bg-bg-secondary text-text-secondary border-line'
                                    }`}
                                    value={task.status}
                                    onChange={(e) => {
                                        const newStatus = e.target.value;
                                        if (newStatus === 'done' && task.subtasksList && task.subtasksList.length > 0) {
                                            const allDone = task.subtasksList.every(sub => sub.status === 'done');
                                            if (!allDone) {
                                                alert('All subtasks must be marked as Done before completing the main task.');
                                                return;
                                            }
                                        }
                                        handleMainTaskStatusUpdate(task.taskId, newStatus);
                                    }}
                                >
                                    {['todo', 'inprogress', 'blocked', 'done'].map(s => (
                                        <option key={s} value={s}>
                                            {s === 'todo' ? 'To Do' : s === 'inprogress' ? 'In Progress' : s === 'blocked' ? 'Blocked' : 'Done'}
                                        </option>
                                    ))}
                                </select>
                            )}
                            <button onClick={() => openRequirementsModal(task.sprintId, sprint.sprintName)} className="text-xs font-bold text-semantic-link hover:underline flex items-center gap-1">
                                <FileText size={12}/> View Requirements
                            </button>
                            </div>
                        </div>
                        <p className="text-sm text-text-secondary mb-4">{task.description}</p>
                        
                        {sprint.status === 'active' && (
                            <div className="mb-4">
                                <button onClick={() => openSubtaskModal(task.taskId)} className="text-xs font-bold text-purple-400 px-3 py-1.5 rounded-xl hover:bg-purple-500/10 flex items-center gap-1 transition-colors">
                                <Plus size={14}/> Add Subtask
                                </button>
                            </div>
                        )}

                        {task.subtasksList && task.subtasksList.length > 0 && (
                            <div className="mb-4 space-y-2 border-t border-line-light pt-3">
                            <h4 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">Subtasks</h4>
                            {task.subtasksList.map(sub => {
                                return (
                                <div key={sub.id} className="flex items-center justify-between p-2.5 border rounded-xl text-sm transition-colors bg-bg-secondary border-line">
                                    <div className="flex-1 flex flex-col justify-center">
                                        <div className="font-medium text-text-primary">{sub.title}</div>
                                        {sub.description && (
                                            <div className="text-[11px] text-text-muted mt-1 max-w-[80%] line-clamp-2" title={sub.description}>
                                                {sub.description}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                    {sprint.status === 'active' && (
                                        <>
                                        <button onClick={() => openEditSubtaskModal(task.taskId, sub)} className="text-[11px] font-bold text-text-secondary hover:text-blue-500 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-blue-500/10" title="Edit Subtask">
                                            <Edit2 size={12} /> Edit
                                        </button>
                                        <select 
                                            className={`text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer transition-colors ${
                                            sub.status === 'done' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 
                                            sub.status === 'inprogress' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 
                                            sub.status === 'blocked' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 
                                            'bg-bg-secondary text-text-secondary border border-white/5'
                                            }`}
                                            value={sub.status}
                                            onChange={(e) => handleSubtaskStatusUpdate(sub.subtaskId, e.target.value)}
                                        >
                                            {['todo', 'inprogress', 'blocked', 'done'].map(s => (
                                                <option key={s} value={s} className="bg-bg-card text-text-primary font-medium">
                                                    {s === 'todo' ? 'To Do' : s === 'inprogress' ? 'In Progress' : s === 'blocked' ? 'Blocked' : 'Done'}
                                                </option>
                                            ))}
                                        </select>
                                        </>
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
            );
          })
        )}
      </div>

      {showSubtaskModal && (
        <div className="fixed inset-0 bg-[#020024]/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-bg-card rounded-[24px] shadow-2xl w-full max-w-md p-8 border border-white/5">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-extrabold tracking-tight text-text-primary">{editingSubtaskId ? 'Edit Subtask' : 'Create Subtask'}</h2>
              <button onClick={() => setShowSubtaskModal(false)} className="p-2 rounded-full hover:bg-bg-secondary text-text-muted hover:text-text-primary transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateSubtask} className="space-y-5">
              <div>
                <label className="block text-[12px] font-bold text-text-secondary uppercase tracking-wider mb-2">Subtask Title *</label>
                <input type="text" className="w-full px-4 py-3 bg-bg-secondary/50 border border-white/10 rounded-xl text-sm text-text-primary focus:bg-bg-secondary focus:border-accent-blue/50 focus:ring-2 focus:ring-accent-blue/20 outline-none transition-all placeholder:text-text-muted/60" required value={subtaskForm.title} onChange={e => setSubtaskForm({...subtaskForm, title: e.target.value})} placeholder="e.g. Design the database schema" />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-text-secondary uppercase tracking-wider mb-2">Description</label>
                <textarea className="w-full px-4 py-3 bg-bg-secondary/50 border border-white/10 rounded-xl text-sm text-text-primary focus:bg-bg-secondary focus:border-accent-blue/50 focus:ring-2 focus:ring-accent-blue/20 outline-none transition-all resize-none placeholder:text-text-muted/60" rows="3" value={subtaskForm.description} onChange={e => setSubtaskForm({...subtaskForm, description: e.target.value})} placeholder="Add any details or links..."></textarea>
              </div>

              <div className="pt-3">
                <button type="submit" className="w-full py-3 bg-accent-blue text-white font-bold rounded-xl hover:bg-blue-600 shadow-lg shadow-accent-blue/20 transition-all active:scale-[0.98]">
                  {editingSubtaskId ? 'Update Subtask' : 'Save Subtask'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQueryModal && (
        <div className="fixed inset-0 bg-[#020024]/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-bg-card rounded-[24px] shadow-2xl w-full max-w-md p-8 border border-white/5">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-extrabold tracking-tight text-text-primary">Raise Query</h2>
              <button onClick={() => setShowQueryModal(false)} className="p-2 rounded-full hover:bg-bg-secondary text-text-muted hover:text-text-primary transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleRaiseQuery} className="space-y-5">
              <div>
                <label className="block text-[12px] font-bold text-text-secondary uppercase tracking-wider mb-2">Your Question / Blocker *</label>
                <textarea className="w-full px-4 py-3 bg-bg-secondary/50 border border-white/10 rounded-xl text-sm text-text-primary focus:bg-bg-secondary focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all resize-none placeholder:text-text-muted/60" rows="4" required placeholder="What is blocking your task? Need clarification?" value={queryText} onChange={e => setQueryText(e.target.value)}></textarea>
              </div>
              <div className="pt-3">
                <button type="submit" className="w-full py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]">
                  Submit Query
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRequirementsModal && (
        <div className="fixed inset-0 bg-[#020024]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
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
                      <div key={note.id} className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl">
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
                      <div key={att.id} className="flex items-center gap-3 bg-bg-secondary border border-line p-3 rounded-2xl">
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
