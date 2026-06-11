import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Clock, AlertCircle, CheckCircle2, PlayCircle, Plus, MessageSquare, X } from 'lucide-react';

export default function EmployeeDashboard() {
  const { user, token } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showSubtaskModal, setShowSubtaskModal] = useState(false);
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState('');

  const [subtaskForm, setSubtaskForm] = useState({ title: '', description: '', estimatedHours: '' });
  const [queryText, setQueryText] = useState('');

  useEffect(() => {
    fetchTasks();
  }, [user, token]);

  const fetchTasks = () => {
    if (user?.id) {
      axios.get(`/api/tasks/employee/${user.id}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          // Include both planner and active mode tasks
          setTasks(res.data.filter(t => t.sprintStatus === 'planner' || t.sprintStatus === 'active'));
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'done': return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[11px] font-bold uppercase"><CheckCircle2 size={12} className="inline mr-1"/>Done</span>;
      case 'inprogress': return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[11px] font-bold uppercase"><PlayCircle size={12} className="inline mr-1"/>In Progress</span>;
      case 'blocked': return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[11px] font-bold uppercase"><AlertCircle size={12} className="inline mr-1"/>Blocked</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[11px] font-bold uppercase"><Clock size={12} className="inline mr-1"/>To Do</span>;
    }
  };

  const activeTasks = tasks.filter(t => t.sprintStatus === 'active');
  const plannerTasks = tasks.filter(t => t.sprintStatus === 'planner');

  if (loading) return <div>Loading your dashboard...</div>;

  return (
    <div className="pb-10">
      <div className="page-header mb-6">
        <h1 className="text-xl font-medium mb-1">My Dashboard</h1>
        <p className="text-text-secondary text-sm">Welcome back, {user?.name.split(' ')[0]}. Here's your current workload.</p>
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
                    <button onClick={() => openSubtaskModal(task.taskId)} className="text-xs font-bold bg-white border border-purple-200 text-purple-700 px-3 py-1.5 rounded hover:bg-purple-50 flex items-center gap-1 transition-colors">
                      <Plus size={14}/> Add Subtask
                    </button>
                    <button onClick={() => openQueryModal(task.taskId)} className="text-xs font-bold bg-white border border-amber-200 text-amber-600 px-3 py-1.5 rounded hover:bg-amber-50 flex items-center gap-1 transition-colors">
                      <MessageSquare size={14}/> Raise Query
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                <div className="text-[12px] font-medium text-gray-500">
                  Total Subtasks: <span className="text-[#020024]">{task.subtaskCount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-[#020024] mb-3">Active Sprint Tasks</h2>
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
                  {getStatusBadge(task.status)}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">{task.description}</p>
              
              <div className="grid grid-cols-3 gap-6 items-center">
                <div className="col-span-2">
                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Progress ({task.subtaskDoneCount}/{task.subtaskCount} subtasks)</div>
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
    </div>
  );
}
