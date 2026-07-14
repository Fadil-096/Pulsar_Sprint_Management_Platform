import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, X, Calendar, CheckSquare, Flag, Trash2, Folder, Pencil, Search, Check } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import PageLoader from '../../components/PageLoader';

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Task search/filter state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Project editing state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [savingProject, setSavingProject] = useState(false);
  
  // Task creation state
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');

  const priorities = [
    { value: 'critical', label: 'Critical', color: 'bg-red-500', textColor: 'text-red-500', desc: 'The highest priority. Used for urgent issues that block progress, cause system failures, or represent major defects that must be resolved immediately.' },
    { value: 'high', label: 'High', color: 'bg-orange-500', textColor: 'text-orange-500', desc: 'Important tasks or features that have significant value or impact, but are not immediately blocking the entire system.' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-500', textColor: 'text-blue-500', desc: 'The default priority level. Represents standard, day-to-day work, features, and improvements that follow the normal development cycle.' },
    { value: 'low', label: 'Low', color: 'bg-gray-500', textColor: 'text-green-500', desc: 'Minor issues, nice-to-have features, or tasks that can be addressed when time permits without impacting the core project goals.' }
  ];

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/projects/${projectId}`, { headers: { Authorization: `Bearer ${token}` } });
      setProject(res.data);
      setTasks(res.data.tasks || []);
    } catch (err) {
      console.error('Failed to fetch project', err);
      navigate('/manager/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTaskTitle = async (taskId) => {
    if (!editingTaskTitle.trim()) {
      setEditingTaskId(null);
      return;
    }
    try {
      setSubmitting(true);
      await axios.patch(`/api/projects/tasks/${taskId}/title`, { title: editingTaskTitle }, { headers: { Authorization: `Bearer ${token}` } });
      setTasks(prev => prev.map(t => t.task_id === taskId ? { ...t, title: editingTaskTitle.trim() } : t));
      setEditingTaskId(null);
    } catch (err) {
      console.error('Failed to update task', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      setSubmitting(true);
      const res = await axios.post(`/api/projects/${projectId}/tasks`, 
        { title: newTaskTitle, priority: newTaskPriority },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks([res.data, ...tasks]);
      setNewTaskTitle('');
      setShowTaskForm(false);
      setNewTaskPriority('medium');
    } catch (err) {
      console.error('Error creating task', err);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = () => {
    setEditTitle(project.title);
    setEditStartDate(project.start_date || '');
    setEditEndDate(project.end_date || '');
    setEditDescription(project.description || '');
    setShowEditModal(true);
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    setSavingProject(true);
    try {
      const res = await axios.put(`/api/projects/${projectId}`, {
        title: editTitle,
        start_date: editStartDate,
        end_date: editEndDate,
        description: editDescription
      }, { headers: { Authorization: `Bearer ${token}` } });
      setProject({ ...project, ...res.data });
      setShowEditModal(false);
    } catch (err) {
      console.error('Failed to update project', err);
    } finally {
      setSavingProject(false);
    }
  };

  const toggleTaskCompletion = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    // Optimistic UI update
    setTasks(tasks.map(t => t.task_id === taskId ? { ...t, is_completed: newStatus } : t));
    
    try {
      await axios.patch(`/api/projects/tasks/${taskId}/status`, 
        { is_completed: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Optional: re-fetch or rely on optimistic update
    } catch (err) {
      console.error('Error updating task', err);
      // Revert on error
      setTasks(tasks.map(t => t.task_id === taskId ? { ...t, is_completed: currentStatus } : t));
    }
  };

  const [editingPriorityForTaskId, setEditingPriorityForTaskId] = useState(null);

  const updateTaskPriority = async (taskId, newPriority) => {
    // Optimistic UI update
    setTasks(tasks.map(t => t.task_id === taskId ? { ...t, priority: newPriority } : t));
    setEditingPriorityForTaskId(null);
    
    try {
      await axios.patch(`/api/projects/tasks/${taskId}/priority`, 
        { priority: newPriority },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Error updating task priority', err);
      // Revert on error could be implemented here
    }
  };

  const [taskToDelete, setTaskToDelete] = useState(null);

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    const taskId = taskToDelete.task_id;
    setTaskToDelete(null);
    try {
      await axios.delete(`/api/projects/tasks/${taskId}`, { headers: { Authorization: `Bearer ${token}` } });
      setTasks(tasks.filter(t => t.task_id !== taskId));
    } catch (err) {
      console.error('Error deleting task', err);
    }
  };

  const formatDate = (d) => {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) return <PageLoader />;
  if (!project) return null;

  const filteredTasks = tasks.filter(t => {
    if (!searchQuery.trim()) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return t.title.toLowerCase().includes(lowerQuery) || t.priority.toLowerCase().includes(lowerQuery);
  });

  const incompleteTasks = filteredTasks.filter(t => t.is_completed === 0);
  const completedTasks = filteredTasks.filter(t => t.is_completed === 1);
  const selectedPriorityObj = priorities.find(p => p.value === newTaskPriority);

  const projectStatus = tasks.length === 0 ? 'Not Started' : tasks.every(t => t.is_completed === 1) ? 'Completed' : 'In Progress';
  const getStatusColors = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400';
      case 'In Progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400';
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button 
        onClick={() => navigate('/manager/projects')}
        className="flex items-center gap-[6px] text-[13px] font-medium rounded-2xl px-[14px] py-[7px] transition-all mb-8 bg-[#f1f5f9] border border-[#cbd5e1] text-[#1e293b] hover:bg-[#e2e8f0] hover:border-[#94a3b8] hover:text-[#0f172a] dark:bg-transparent dark:border-white/15 dark:text-[#94a3b8] dark:hover:bg-white/5 dark:hover:text-[#f1f5f9]"
      >
        <ArrowLeft size={14} />
        Back to Projects
      </button>

      <div className="bg-bg-secondary border-l-[4px] border-l-accent-blue rounded-2xl border border-line shadow-sm px-8 py-7 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Folder size={16} className="text-[#2563eb] dark:text-[#3b82f6]" />
            <h1 className="text-[22px] font-bold text-[#0f172a] dark:text-white capitalize tracking-tight leading-none">{project.title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-[12px] py-[4px] rounded-full text-[12px] font-semibold bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe] dark:bg-blue-500/10 dark:text-[#60a5fa] dark:border-blue-500/20">
              {tasks.length} {tasks.length === 1 ? 'Task' : 'Tasks'}
            </div>
            <button 
              onClick={openEditModal}
              className="px-3 py-1 text-sm font-medium text-[#64748b] hover:text-[#2563eb] hover:bg-[#eff6ff] dark:text-[#94a3b8] dark:hover:text-[#60a5fa] dark:hover:bg-blue-500/10 rounded-2xl transition-colors"
              title="Edit Project"
            >
              Edit
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-[10px]">
          {project.created_at && (
            <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#64748b] dark:text-[#94a3b8]">
              <Calendar size={12} className="text-[#94a3b8] dark:text-[#64748b]" />
              <span><strong className="text-text-primary">Created &rarr;</strong> {formatDate(project.created_at)}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#64748b] dark:text-[#94a3b8]">
            <Calendar size={12} className="text-[#94a3b8] dark:text-[#64748b]" />
            <span><strong className="text-text-primary">Project Deadline &rarr;</strong> {formatDate(project.end_date)}</span>
          </div>
        </div>

        <div className="h-[1px] w-full bg-[#f1f5f9] dark:bg-white/5 my-4"></div>

        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#94a3b8] dark:text-[#64748b] font-semibold mb-1.5">Description</div>
          <p className="text-[13px] text-[#475569] dark:text-[#94a3b8] leading-relaxed">
            {project.description || "No description provided."}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-text-primary">Tasks</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-bg-secondary border border-accent-blue rounded-full text-text-primary focus:outline-none focus:border-accent-blue focus:shadow-[0_0_10px_rgba(37,99,235,0.4)] hover:shadow-sm min-w-[200px] transition-all"
            />
          </div>
          {!showTaskForm && (
            <button 
              onClick={() => setShowTaskForm(true)}
              className="flex items-center bg-accent-blue hover:bg-blue-600 text-white rounded-full px-4 py-2 text-sm font-medium transition-all"
            >
              <Plus size={16} className="mr-2" /> Add Task
            </button>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center text-[11px] font-semibold text-text-secondary uppercase tracking-wider border-b border-white/5 pb-2 mb-3">
        <div className="pl-3">TASK</div>
        <div className="pr-12">PRIORITY FLAG</div>
      </div>

      <div className="space-y-3">
        {showTaskForm && (
          <div className="bg-bg-secondary border border-transparent rounded-2xl p-3 flex items-center gap-3">
            <input 
              type="text" 
              placeholder="Task title..."
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              className="flex-1 bg-bg-primary border border-line rounded-xl px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent-blue focus:shadow-[0_0_10px_rgba(37,99,235,0.4)] transition-all"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleCreateTask(); }}
            />
            
            <div className="relative">
              <button 
                type="button"
                onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                className="flex items-center justify-center w-8 h-8 rounded-xl border border-line bg-bg-primary hover:border-accent-blue hover:text-accent-blue transition-colors"
                title={`Priority: ${selectedPriorityObj.label}`}
              >
                <Flag size={16} className={selectedPriorityObj.textColor} />
              </button>

              {showPriorityDropdown && (
                <div className="absolute right-0 mt-1 w-36 bg-bg-secondary border border-line rounded-2xl shadow-xl z-10 py-1">
                  {priorities.map(p => (
                    <button 
                      key={p.value}
                      onClick={() => { setNewTaskPriority(p.value); setShowPriorityDropdown(false); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-bg-primary transition-colors flex gap-3 items-center"
                    >
                      <Flag size={16} className={`shrink-0 ${p.textColor}`} />
                      <span className="font-bold text-sm text-text-primary">{p.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button 
              onClick={handleCreateTask}
              disabled={!newTaskTitle.trim() || submitting}
              className="bg-accent-blue hover:bg-blue-600 text-white px-3 py-1.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              Add
            </button>
            <button 
              onClick={() => { setShowTaskForm(false); setNewTaskTitle(''); setShowPriorityDropdown(false); }}
              className="text-text-secondary hover:text-white text-sm"
            >
              Cancel
            </button>
          </div>
        )}

        {incompleteTasks.map(task => (
          <div key={task.task_id} className="group flex items-center justify-between p-3 rounded-2xl bg-bg-secondary hover:bg-bg-card transition-colors">
            <div className="flex items-center overflow-hidden flex-1 mr-4">
              {editingTaskId === task.task_id ? (
                <div className="flex-1 flex items-center gap-2 w-full">
                  <input 
                    type="text" 
                    value={editingTaskTitle}
                    onChange={e => setEditingTaskTitle(e.target.value)}
                    className="flex-1 bg-bg-primary border border-accent-blue rounded-xl px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:shadow-[0_0_10px_rgba(37,99,235,0.4)] transition-all min-w-0"
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleUpdateTaskTitle(task.task_id);
                      if (e.key === 'Escape') setEditingTaskId(null);
                    }}
                  />
                  <button 
                    onClick={() => handleUpdateTaskTitle(task.task_id)}
                    className="bg-accent-blue hover:bg-blue-600 text-white p-1.5 rounded-xl transition-colors shrink-0"
                    title="Save"
                  >
                    <Check size={16} />
                  </button>
                  <button 
                    onClick={() => setEditingTaskId(null)}
                    className="bg-bg-primary hover:bg-red-500/10 text-text-muted hover:text-red-500 p-1.5 rounded-xl transition-colors shrink-0"
                    title="Cancel"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <span className="text-sm font-medium text-text-primary truncate">{task.title}</span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button 
                  onClick={() => setEditingPriorityForTaskId(editingPriorityForTaskId === task.task_id ? null : task.task_id)}
                  className="flex items-center gap-1.5 hover:bg-bg-primary px-2 py-1 rounded-xl transition-colors cursor-pointer" 
                  title={`Priority: ${task.priority}`}
                >
                  <Flag size={14} className={priorities.find(p => p.value === task.priority)?.textColor || 'text-gray-500'} />
                  <span className={`text-xs font-bold ${priorities.find(p => p.value === task.priority)?.textColor || 'text-gray-500'}`}>
                    {priorities.find(p => p.value === task.priority)?.label || task.priority}
                  </span>
                </button>
                {editingPriorityForTaskId === task.task_id && (
                  <div className="absolute right-0 mt-1 w-32 bg-bg-secondary border border-line rounded-2xl shadow-xl z-20 py-1">
                    {priorities.map(p => (
                      <button 
                        key={p.value}
                        onClick={() => updateTaskPriority(task.task_id, p.value)}
                        className="w-full text-left px-4 py-2 hover:bg-bg-primary transition-colors flex gap-3 items-center"
                      >
                        <Flag size={14} className={`shrink-0 ${p.textColor}`} />
                        <span className="font-bold text-xs text-text-primary">{p.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {editingTaskId !== task.task_id && (
                <button 
                  onClick={() => {
                    setEditingTaskId(task.task_id);
                    setEditingTaskTitle(task.title);
                  }}
                  className="text-text-muted hover:text-accent-blue hover:bg-accent-blue/10 transition-all p-1.5 rounded-xl ml-2"
                  title="Edit task"
                >
                  <Pencil size={16} />
                </button>
              )}
              <button 
                onClick={() => setTaskToDelete(task)}
                className="text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all p-1.5 rounded-xl"
                title="Delete task"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {completedTasks.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center mb-3">
              <div className="h-px bg-white/5 flex-1"></div>
              <span className="px-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Completed</span>
              <div className="h-px bg-white/5 flex-1"></div>
            </div>
            
            <div className="space-y-2 opacity-60">
              {completedTasks.map(task => (
                <div key={task.task_id} className="group flex items-center justify-between p-3 rounded-2xl bg-bg-primary">
                  <div className="flex items-center overflow-hidden">
                    <span className="text-sm font-medium text-text-secondary truncate line-through">{task.title}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <button 
                        onClick={() => setEditingPriorityForTaskId(editingPriorityForTaskId === task.task_id ? null : task.task_id)}
                        className="flex items-center gap-1.5 hover:bg-bg-primary px-2 py-1 rounded-xl transition-colors cursor-pointer opacity-70 hover:opacity-100" 
                        title={`Priority: ${task.priority}`}
                      >
                        <Flag size={14} className={priorities.find(p => p.value === task.priority)?.textColor || 'text-gray-500'} />
                        <span className={`text-xs font-bold ${priorities.find(p => p.value === task.priority)?.textColor || 'text-gray-500'}`}>
                          {priorities.find(p => p.value === task.priority)?.label || task.priority}
                        </span>
                      </button>
                      {editingPriorityForTaskId === task.task_id && (
                        <div className="absolute right-0 mt-1 w-32 bg-bg-secondary border border-line rounded-2xl shadow-xl z-20 py-1">
                          {priorities.map(p => (
                            <button 
                              key={p.value}
                              onClick={() => updateTaskPriority(task.task_id, p.value)}
                              className="w-full text-left px-4 py-2 hover:bg-bg-primary transition-colors flex gap-3 items-center"
                            >
                              <Flag size={14} className={`shrink-0 ${p.textColor}`} />
                              <span className="font-bold text-xs text-text-primary">{p.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  <button 
                    onClick={() => setTaskToDelete(task)}
                    className="text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all p-1.5 rounded-xl"
                    title="Delete task"
                  >
                    <Trash2 size={16} />
                  </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {tasks.length === 0 && !showTaskForm && (
          <div className="py-12 text-center text-text-secondary rounded-2xl">
            No tasks found. Click "Add Task" to create one.
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!taskToDelete}
        onCancel={() => setTaskToDelete(null)}
        onConfirm={confirmDeleteTask}
        title="Delete Task?"
        bodyText="This will permanently delete this task from the project. This action cannot be undone."
        confirmText="Delete Task"
        iconType="danger"
        previewContent={
          taskToDelete ? (
            <>
              <Flag size={14} className={priorities.find(p => p.value === taskToDelete.priority)?.textColor || 'text-gray-500'} />
              <span className="text-sm font-medium text-text-primary truncate">{taskToDelete.title}</span>
            </>
          ) : null
        }
      />
      {showEditModal && (
        <div className="fixed inset-0 bg-black/45 dark:bg-black/70 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#ffffff] dark:bg-[#0f1c2e] rounded-xl-[10px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] dark:shadow-none w-full max-w-[560px] flex flex-col overflow-hidden animate-[scale-in_0.2s_ease-out_forwards] scale-[0.97] opacity-0" style={{ animation: 'modalEnter 0.2s ease-out forwards' }}>
            <style>{`
              @keyframes modalEnter {
                from { opacity: 0; transform: scale(0.97); }
                to { opacity: 1; transform: scale(1); }
              }
            `}</style>
            
            <div className="px-6 py-6 border-b border-[#e2e8f0] dark:border-[rgba(255,255,255,0.08)] flex items-start gap-3 shrink-0">
              <Folder size={20} className="text-[#2563eb] dark:text-[#3b82f6] mt-0.5" />
              <div>
                <h2 className="text-[18px] font-bold text-[#0f172a] dark:text-[#f1f5f9] leading-tight mb-1">Edit Project</h2>
                <p className="text-[12px] text-[#64748b] leading-tight">Update the details for this project repository.</p>
              </div>
            </div>
            
            <div className="px-6 pt-5 pb-6 overflow-y-auto">
              <form id="edit-project-form" onSubmit={handleSaveProject} className="space-y-[20px]">
                <div>
                  <label className="block text-[11px] font-semibold text-[#64748b] uppercase mb-1.5 tracking-wider">Title <span className="text-[#f87171]">*</span></label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="e.g. Support Chat Bot Redesign"
                    className="w-full h-[40px] bg-[#f8fafc] dark:bg-[#1e2d42] border border-[#cbd5e1] dark:border-[#2d4060] rounded-xl-[6px] px-3 text-[14px] text-[#0f172a] dark:text-[#e2e8f0] focus:outline-none focus:border-[#3b82f6] focus:ring-[3px] focus:ring-blue-500/15 transition-all placeholder:text-[#94a3b8] dark:placeholder:text-[#4a6080]"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#64748b] uppercase mb-1.5 tracking-wider">Start Date <span className="text-[#f87171]">*</span></label>
                    <input
                      type="date"
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                      className="w-full h-[40px] bg-[#f8fafc] dark:bg-[#1e2d42] border border-[#cbd5e1] dark:border-[#2d4060] rounded-xl-[6px] px-3 text-[14px] text-[#0f172a] dark:text-[#e2e8f0] focus:outline-none focus:border-[#3b82f6] focus:ring-[3px] focus:ring-blue-500/15 transition-all [color-scheme:light] dark:[color-scheme:dark]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#64748b] uppercase mb-1.5 tracking-wider">End Date <span className="text-[#f87171]">*</span></label>
                    <input
                      type="date"
                      value={editEndDate}
                      onChange={(e) => setEditEndDate(e.target.value)}
                      className="w-full h-[40px] bg-[#f8fafc] dark:bg-[#1e2d42] border border-[#cbd5e1] dark:border-[#2d4060] rounded-xl-[6px] px-3 text-[14px] text-[#0f172a] dark:text-[#e2e8f0] focus:outline-none focus:border-[#3b82f6] focus:ring-[3px] focus:ring-blue-500/15 transition-all [color-scheme:light] dark:[color-scheme:dark]"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#64748b] uppercase mb-1.5 tracking-wider">Basic Description</label>
                  <div className="relative">
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value.slice(0, 300))}
                      placeholder="Briefly describe the purpose or scope of this project..."
                      className="w-full min-h-[100px] resize-y bg-[#f8fafc] dark:bg-[#1e2d42] border border-[#cbd5e1] dark:border-[#2d4060] rounded-xl-[6px] px-3 py-2.5 text-[14px] text-[#0f172a] dark:text-[#e2e8f0] focus:outline-none focus:border-[#3b82f6] focus:ring-[3px] focus:ring-blue-500/15 transition-all placeholder:text-[#94a3b8] dark:placeholder:text-[#4a6080] pb-8"
                    />
                    <div className="absolute bottom-3 right-3 text-[11px] font-medium text-[#94a3b8] dark:text-[#4a6080]">
                      {editDescription.length}/300
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-[#e2e8f0] dark:border-[rgba(255,255,255,0.08)] flex justify-end gap-3 shrink-0">
              <button 
                type="button" 
                onClick={() => setShowEditModal(false)}
                className="px-[20px] py-[8px] text-[14px] text-[#475569] dark:text-[#64748b] bg-transparent border border-[#e2e8f0] dark:border-[rgba(255,255,255,0.1)] rounded-xl-[6px] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#1e293b] dark:hover:text-[#f1f5f9] transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="edit-project-form"
                disabled={savingProject}
                className="px-[20px] py-[8px] text-[14px] font-medium text-white bg-[#2563eb] rounded-xl-[6px] hover:bg-[#1d4ed8] shadow-[0_1px_2px_rgba(37,99,235,0.3)] hover:shadow-[0_4px_12px_rgba(37,99,235,0.25)] transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed min-w-[90px]"
              >
                {savingProject ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
