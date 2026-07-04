import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, X, Calendar, CheckSquare, Flag, Trash2 } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import PageLoader from '../../components/PageLoader';

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Task creation state
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const incompleteTasks = tasks.filter(t => t.is_completed === 0);
  const completedTasks = tasks.filter(t => t.is_completed === 1);
  const selectedPriorityObj = priorities.find(p => p.value === newTaskPriority);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button 
        onClick={() => navigate('/manager/projects')}
        className="flex items-center text-sm font-medium text-text-secondary bg-transparent border border-white/10 rounded-lg px-3 py-2 hover:bg-white/5 hover:text-white transition-all mb-4"
      >
        <ArrowLeft size={16} className="mr-2" />
        Back to Projects
      </button>

      <div className="mb-2 text-sm text-text-secondary">
        Projects <span className="mx-2">→</span> <span className="text-white">{project.title}</span>
      </div>

      <div className="bg-bg-secondary p-5 rounded-lg border-l-4 border-l-accent-blue mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-text-primary capitalize tracking-tight leading-none">{project.title}</h1>
          <span className="px-3 py-1 rounded-full bg-accent-blue/10 text-accent-blue text-sm font-semibold whitespace-nowrap">
            {tasks.length} {tasks.length === 1 ? 'Task' : 'Tasks'}
          </span>
        </div>
        
        <div className="flex items-center text-[13px] text-text-secondary">
          <Calendar size={14} className="mr-2" />
          <span>{formatDate(project.start_date)} &rarr; {formatDate(project.end_date)}</span>
        </div>

        {project.description && (
          <div className="mt-4 pt-4">
            <h3 className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-1.5">Description</h3>
            <p className="text-[13px] text-text-secondary leading-relaxed">
              {project.description}
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-text-primary">Tasks</h2>
        {!showTaskForm && (
          <div className="flex items-center">
            <button 
              onClick={() => setShowTaskForm(true)}
              className="flex items-center bg-accent-blue hover:bg-blue-600 text-white rounded-full px-4 py-2 text-sm font-medium transition-all"
            >
              <Plus size={16} className="mr-2" /> Add Task
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-[11px] font-semibold text-text-secondary uppercase tracking-wider border-b border-white/5 pb-2 mb-3">
        <div className="pl-3">TASK</div>
        <div className="pr-12">PRIORITY FLAG</div>
      </div>

      <div className="space-y-3">
        {showTaskForm && (
          <div className="bg-bg-secondary border border-border-color rounded-lg p-3 flex items-center gap-3">
            <input 
              type="text" 
              placeholder="Task title..."
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              className="flex-1 bg-bg-primary border border-border-color rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-accent-blue"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleCreateTask(); }}
            />
            
            <div className="relative">
              <button 
                type="button"
                onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                className="flex items-center justify-center w-8 h-8 rounded border border-border-color bg-bg-primary hover:border-accent-blue transition-colors"
                title={`Priority: ${selectedPriorityObj.label}`}
              >
                <Flag size={16} className={selectedPriorityObj.textColor} />
              </button>

              {showPriorityDropdown && (
                <div className="absolute right-0 mt-1 w-36 bg-bg-secondary border border-border-color rounded-lg shadow-xl z-10 py-1">
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
              className="bg-accent-blue hover:bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50"
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
          <div key={task.task_id} className="group flex items-center justify-between p-3 rounded-lg bg-bg-secondary hover:bg-bg-card transition-colors">
            <div className="flex items-center overflow-hidden">
              <span className="text-sm font-medium text-text-primary truncate">{task.title}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button 
                  onClick={() => setEditingPriorityForTaskId(editingPriorityForTaskId === task.task_id ? null : task.task_id)}
                  className="flex items-center gap-1.5 hover:bg-bg-primary px-2 py-1 rounded transition-colors cursor-pointer" 
                  title={`Priority: ${task.priority}`}
                >
                  <Flag size={14} className={priorities.find(p => p.value === task.priority)?.textColor || 'text-gray-500'} />
                  <span className={`text-xs font-bold ${priorities.find(p => p.value === task.priority)?.textColor || 'text-gray-500'}`}>
                    {priorities.find(p => p.value === task.priority)?.label || task.priority}
                  </span>
                </button>
                {editingPriorityForTaskId === task.task_id && (
                  <div className="absolute right-0 mt-1 w-32 bg-bg-secondary border border-border-color rounded-lg shadow-xl z-20 py-1">
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
              className="text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all p-1.5 rounded"
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
                <div key={task.task_id} className="group flex items-center justify-between p-3 rounded-lg bg-bg-primary">
                  <div className="flex items-center overflow-hidden">
                    <span className="text-sm font-medium text-text-secondary truncate line-through">{task.title}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <button 
                        onClick={() => setEditingPriorityForTaskId(editingPriorityForTaskId === task.task_id ? null : task.task_id)}
                        className="flex items-center gap-1.5 hover:bg-bg-primary px-2 py-1 rounded transition-colors cursor-pointer opacity-70 hover:opacity-100" 
                        title={`Priority: ${task.priority}`}
                      >
                        <Flag size={14} className={priorities.find(p => p.value === task.priority)?.textColor || 'text-gray-500'} />
                        <span className={`text-xs font-bold ${priorities.find(p => p.value === task.priority)?.textColor || 'text-gray-500'}`}>
                          {priorities.find(p => p.value === task.priority)?.label || task.priority}
                        </span>
                      </button>
                      {editingPriorityForTaskId === task.task_id && (
                        <div className="absolute right-0 mt-1 w-32 bg-bg-secondary border border-border-color rounded-lg shadow-xl z-20 py-1">
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
                    className="text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all p-1.5 rounded"
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
          <div className="py-12 text-center text-text-secondary rounded-lg">
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
    </div>
  );
}
