import React, { useState, useEffect, Fragment } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  ChevronRight, Loader2, Clock, AlertTriangle, Copy, 
  Calendar, CheckCircle, Users, User, AlertCircle, ArrowLeft, 
  Flag, X, CheckSquare, Save, CornerUpLeft, Edit2, FileText, Trash2, GripVertical, Undo2, UserCog, Video, Settings, ChevronDown, Play, Plus, Search, CalendarPlus
} from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import { useAuth } from '../../context/AuthContext';

// Helper functions for UI
const getStatusBadge = (status) => {
  switch(status.toLowerCase()) {
    case 'todo': return <span className="inline-flex items-center justify-center px-2 py-0.5 bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-gray-200 dark:border-gray-700">To Do</span>;
    case 'inprogress': return <span className="inline-flex items-center justify-center px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-blue-200 dark:border-blue-800/50">In Progress</span>;
    case 'blocked': return <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-red-200 dark:border-red-800/50"><AlertTriangle size={10} /> Blocked</span>;
    case 'done': return <span className="inline-flex items-center justify-center px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-green-200 dark:border-green-800/50">Done</span>;
    default: return <span className="inline-flex items-center justify-center px-2 py-0.5 bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-gray-200 dark:border-gray-700">{status}</span>;
  }
};

const getPriorityDot = (priority) => {
  const p = (priority || '').toLowerCase();
  switch (p) {
    case 'critical': return <div className="flex items-center gap-1.5" title="Critical"><Flag size={12} className="text-red-500 fill-red-500/20 shrink-0" /><span className="text-xs text-text-secondary">Critical</span></div>;
    case 'high': return <div className="flex items-center gap-1.5" title="High"><Flag size={12} className="text-orange-500 fill-orange-500/20 shrink-0" /><span className="text-xs text-text-secondary">High</span></div>;
    case 'medium': return <div className="flex items-center gap-1.5" title="Medium"><Flag size={12} className="text-blue-500 fill-blue-500/20 shrink-0" /><span className="text-xs text-text-secondary">Medium</span></div>;
    case 'low': return <div className="flex items-center gap-1.5" title="Low"><Flag size={12} className="text-green-500 fill-green-500/20 shrink-0" /><span className="text-xs text-text-secondary">Low</span></div>;
    default: return <div className="flex items-center gap-1.5" title="Medium"><Flag size={12} className="text-blue-500 fill-blue-500/20 shrink-0" /><span className="text-xs text-text-secondary">Medium</span></div>;
  }
};

export default function SprintDetail() {
  const { sprintId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();
  const isManager = user?.role === 'manager' || user?.role === 'administrator';
  const isEmployee = user?.role === 'employee';
  
  const fromTab = location.state?.fromTab || 'created';

  const [sprint, setSprint] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [requirements, setRequirements] = useState({ notes: [], attachments: [] });
  const [loading, setLoading] = useState(true);

  // Sync State
  const [saveStatus, setSaveStatus] = useState(null); // null, 'saving', 'saved', 'failed_retrying', 'failed'
  const [lastFailedSave, setLastFailedSave] = useState(null);

  // Task Table State
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [subtasksCache, setSubtasksCache] = useState({});
  const [loadingSubtasks, setLoadingSubtasks] = useState(new Set());

  // Review State
  const [dodMet, setDodMet] = useState(false);
  const [qaPassed, setQaPassed] = useState(false);
  const [stakeholderSignoff, setStakeholderSignoff] = useState(false);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [savingChecklist, setSavingChecklist] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [showReturnInput, setShowReturnInput] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [confirmReview, setConfirmReview] = useState(false);

  // DnD Created Mode State
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const projectDropdownRef = React.useRef(null);
  const [backlogTasks, setBacklogTasks] = useState([]);
  const [draggedTask, setDraggedTask] = useState(null);
  const [isDraggingOverSprint, setIsDraggingOverSprint] = useState(false);
  const [isHoveringBacklog, setIsHoveringBacklog] = useState(false);
  const [highlightedTasks, setHighlightedTasks] = useState(new Set());

  // DnD Planner Mode State
  const [poolMembers, setPoolMembers] = useState([]);
  const [plannerSearchQuery, setPlannerSearchQuery] = useState('');
  const [plannerRoleFilter, setPlannerRoleFilter] = useState('All');
  const [draggedMember, setDraggedMember] = useState(null);
  const [draggedChip, setDraggedChip] = useState(null);
  const [hoveredTaskId, setHoveredTaskId] = useState(null);
  const [isHoveringManagerBox, setIsHoveringManagerBox] = useState(false);
  const [isHoveringRightPanel, setIsHoveringRightPanel] = useState(false);
  const [undoStack, setUndoStack] = useState([]);

  // Progress Status Config State
  const ALL_STATUSES = [
    { key: 'todo', label: 'To Do', color: 'bg-gray-500', dotColor: 'bg-gray-400', borderColor: 'border-gray-400', desc: 'Task has not been started yet' },
    { key: 'inprogress', label: 'In Progress', color: 'bg-blue-500', dotColor: 'bg-blue-500', borderColor: 'border-blue-500', desc: 'Task is actively being worked on' },
    { key: 'done', label: 'Done', color: 'bg-green-500', dotColor: 'bg-green-500', borderColor: 'border-green-500', desc: 'Task has been completed successfully' },
    { key: 'blocked', label: 'Blocked', color: 'bg-red-500', dotColor: 'bg-red-500', borderColor: 'border-red-500', desc: 'Task cannot proceed due to a dependency or blocker' }
  ];
  const [statusConfigOpen, setStatusConfigOpen] = useState(false);
  const [statusConfigDraft, setStatusConfigDraft] = useState([]);
  const statusConfigRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(e.target)) {
        setProjectDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchData();
  }, [sprintId, token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sprintRes, reqRes] = await Promise.all([
        axios.get(`/api/sprints/${sprintId}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`/api/sprints/${sprintId}/requirements`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setSprint(sprintRes.data);
      setTasks(sprintRes.data.tasks || []);
      setMembers(sprintRes.data.members || []);
      setRequirements(reqRes.data);

      if (sprintRes.data) {
        setDodMet(sprintRes.data.dod_met === 1);
        setQaPassed(sprintRes.data.qa_passed === 1);
        setStakeholderSignoff(sprintRes.data.stakeholder_signoff === 1);
        setReviewerNotes(sprintRes.data.reviewer_notes || '');
      }
    } catch (err) {
      console.error('Failed to fetch sprint details', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch projects when sprint is 'created'
  useEffect(() => {
    if (sprint?.status === 'created') {
      axios.get('/api/projects', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setProjects(res.data))
        .catch(err => console.error('Failed to fetch projects', err));
    }
  }, [sprint?.status, token]);

  // Fetch backlog tasks when a project is selected
  useEffect(() => {
    if (selectedProjectId) {
      axios.get(`/api/projects/${selectedProjectId}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          const sprintTaskIds = new Set(tasks.map(t => t.taskId));
          const availableTasks = (res.data.tasks || []).filter(t => !sprintTaskIds.has(t.task_id));
          setBacklogTasks(availableTasks);
        })
        .catch(err => console.error('Failed to fetch backlog tasks', err));
    } else {
      setBacklogTasks([]);
    }
  }, [selectedProjectId, tasks, token]);

  // Fetch pool members when sprint is 'planner'
  useEffect(() => {
    if (sprint?.status === 'planner') {
      Promise.all([
        axios.get('/api/users/employees', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/users/managers', { headers: { Authorization: `Bearer ${token}` } })
      ])
        .then(([empRes, mgrRes]) => {
          // Normalize the data (avatar_initials is returned as initials or avatar_initials depending on endpoint)
          const normalize = (user, role) => ({
            id: user.id,
            name: user.name,
            role: role,
            initials: user.avatar_initials || user.initials || '??',
            designation: user.role || role
          });
          const emps = (empRes.data || []).map(e => normalize(e, 'employee'));
          const mgrs = (mgrRes.data || []).map(m => normalize(m, 'manager'));
          setPoolMembers([...mgrs, ...emps]);
        })
        .catch(err => console.error('Failed to fetch pool members', err));
    }
  }, [sprint?.status, token]);

  const toggleTaskExpanded = async (taskId) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
      setExpandedTasks(newExpanded);
      return;
    }
    newExpanded.add(taskId);
    setExpandedTasks(newExpanded);
    if (!subtasksCache[taskId]) {
      setLoadingSubtasks(prev => new Set(prev).add(taskId));
      try {
        const res = await axios.get(`/api/subtasks/task/${taskId}`, { headers: { Authorization: `Bearer ${token}` } });
        setSubtasksCache(prev => ({ ...prev, [taskId]: res.data }));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSubtasks(prev => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
      }
    }
  };

  // Planner Mode Handlers
  const handlePlannerDragStart = (e, member) => {
    if (user?.role !== 'administrator' && user?.role !== 'manager') return;
    setDraggedMember(member);
    e.dataTransfer.setData('text/plain', member.id);
    
    const avatar = e.currentTarget.querySelector('.rounded-full');
    if (avatar) {
      e.dataTransfer.setDragImage(avatar, 16, 16);
    }
  };

  const handlePlannerDragOver = (e, taskId) => {
    e.preventDefault();
    if (user?.role !== 'administrator' && user?.role !== 'manager') return;
    setHoveredTaskId(taskId);
  };

  const handlePlannerDragLeave = (e) => {
    e.preventDefault();
    setHoveredTaskId(null);
  };

  const handleChipDragStart = (e, member, taskId) => {
    if (user?.role !== 'administrator' && user?.role !== 'manager') return;
    setDraggedChip({ member, sourceTaskId: taskId });
    // Ghost image is handled natively, but we can set effectAllowed
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', member.id);
  };

  const handleRightPanelDragOver = (e) => {
    e.preventDefault();
    if (draggedChip) {
      setIsHoveringRightPanel(true);
    }
  };

  const handleRightPanelDragLeave = (e) => {
    e.preventDefault();
    setIsHoveringRightPanel(false);
  };

  const handleRightPanelDrop = (e) => {
    e.preventDefault();
    setIsHoveringRightPanel(false);
    if (draggedChip) {
      if (draggedChip.type === 'sprint_manager') {
        handleRemoveSprintManager();
      } else {
        handleRemoveAssignee(draggedChip.sourceTaskId, draggedChip.member.id);
      }
      setDraggedChip(null);
    }
  };

  const handlePlannerDrop = async (e, taskId) => {
    e.preventDefault();
    setHoveredTaskId(null);
    
    if (user?.role !== 'administrator' && user?.role !== 'manager') return;

    if (draggedChip) {
      // Reassigning from another task
      if (draggedChip.sourceTaskId === taskId) {
        setDraggedChip(null);
        return; // Dropped on same row
      }

      // Check manager limit across sprint if it's a manager (technically already on a task, so reassigning is safe unless we count differently, but actually since we REMOVE from source and ADD to target, it's fine)
      const targetTaskIndex = tasks.findIndex(t => t.taskId === taskId);
      const sourceTaskIndex = tasks.findIndex(t => t.taskId === draggedChip.sourceTaskId);
      if (targetTaskIndex === -1 || sourceTaskIndex === -1) {
        setDraggedChip(null);
        return;
      }

      const targetTask = tasks[targetTaskIndex];
      const sourceTask = tasks[sourceTaskIndex];
      const currentTargetAssignees = targetTask.assignees || [];
      const currentSourceAssignees = sourceTask.assignees || [];

      if (currentTargetAssignees.find(a => a.id === draggedChip.member.id)) {
        setDraggedChip(null);
        return; // Already assigned to target task
      }

      const newTargetAssignees = [...currentTargetAssignees, draggedChip.member];
      const newSourceAssignees = currentSourceAssignees.filter(a => a.id !== draggedChip.member.id);

      setUndoStack(prev => [...prev, { 
        taskId: taskId, previousAssignees: currentTargetAssignees, 
        sourceTaskId: draggedChip.sourceTaskId, sourcePreviousAssignees: currentSourceAssignees 
      }]);

      const updatedTasks = [...tasks];
      updatedTasks[targetTaskIndex] = { ...targetTask, assignees: newTargetAssignees };
      updatedTasks[sourceTaskIndex] = { ...sourceTask, assignees: newSourceAssignees };
      setTasks(updatedTasks);

      try {
        setSaveStatus('saving');
        await Promise.all([
          axios.put(`/api/sprints/${sprintId}/tasks/${taskId}/assignees`, { assignees: newTargetAssignees.map(a => a.id) }, { headers: { Authorization: `Bearer ${token}` } }),
          axios.put(`/api/sprints/${sprintId}/tasks/${draggedChip.sourceTaskId}/assignees`, { assignees: newSourceAssignees.map(a => a.id) }, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(null), 2500);
      } catch (err) {
        console.error(err);
        setSaveStatus('failed');
        setTimeout(() => setSaveStatus(null), 3000);
        alert("Failed to save reassignment: " + (err.response?.data?.error || err.message));
        // Simple rollback on failure
        setTasks(tasks);
      }
      setDraggedChip(null);
      return;
    }

    if (!draggedMember) return;
    if (user?.role !== 'administrator' && user?.role !== 'manager') return;

    // Check manager limit across sprint
    if (draggedMember.role === 'manager') {
      const existingManagerInSprint = tasks.some(t => 
        t.assignees && t.assignees.some(a => a.role === 'manager')
      );
      if (existingManagerInSprint) {
        alert("Only one manager can be assigned per sprint. Remove the existing manager first.");
        return;
      }
    }

    const targetTaskIndex = tasks.findIndex(t => t.taskId === taskId);
    if (targetTaskIndex === -1) return;
    
    const targetTask = tasks[targetTaskIndex];
    const currentAssignees = targetTask.assignees || [];
    
    if (currentAssignees.find(a => a.id === draggedMember.id)) {
      setDraggedMember(null);
      return; // already assigned to this task
    }

    const newAssignees = [...currentAssignees, draggedMember];
    
    setUndoStack(prev => [...prev, { taskId, previousAssignees: currentAssignees }]);
    
    const updatedTasks = [...tasks];
    updatedTasks[targetTaskIndex] = { ...targetTask, assignees: newAssignees };
    setTasks(updatedTasks);
    
    try {
      setSaveStatus('saving');
      await axios.put(`/api/sprints/${sprintId}/tasks/${taskId}/assignees`, {
        assignees: newAssignees.map(a => a.id)
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2500);
    } catch(err) {
      console.error(err);
      setSaveStatus('failed');
      setTimeout(() => setSaveStatus(null), 3000);
      alert("Failed to save assignment: " + (err.response?.data?.error || err.message));
    }
    
    setDraggedMember(null);
  };

  const handleManagerDrop = async (e) => {
    e.preventDefault();
    setIsHoveringManagerBox(false);
    if (!draggedMember) return;
    if (user?.role !== 'administrator' && user?.role !== 'manager') return;
    if (draggedMember.role !== 'manager') {
      alert("Only managers can be assigned as the Sprint Manager.");
      setDraggedMember(null);
      return;
    }

    try {
      setSaveStatus('saving');
      await axios.put(`/api/sprints/${sprintId}`, {
        owner_id: draggedMember.id
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setSprint(prev => ({ ...prev, ownerId: draggedMember.id, ownerName: draggedMember.name }));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2500);
    } catch(err) {
      console.error(err);
      setSaveStatus('failed');
      setTimeout(() => setSaveStatus(null), 3000);
      alert("Failed to update Sprint Manager: " + (err.response?.data?.error || err.message));
    }
    setDraggedMember(null);
  };

  const handleManagerChipDragStart = (e) => {
    if (user?.role !== 'administrator' && user?.role !== 'manager') return;
    setDraggedChip({ type: 'sprint_manager', member: { id: sprint.ownerId, name: sprint.ownerName } });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', sprint.ownerId);
  };

  const handleRemoveSprintManager = async () => {
    try {
      setSaveStatus('saving');
      await axios.put(`/api/sprints/${sprintId}`, {
        owner_id: null
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSprint(prev => ({ ...prev, ownerId: null, ownerName: null }));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2500);
    } catch(err) {
      console.error(err);
      setSaveStatus('failed');
      setTimeout(() => setSaveStatus(null), 3000);
      alert("Failed to remove Sprint Manager");
    }
  };

  const handleRemoveAssignee = async (taskId, memberId) => {
    if (user?.role !== 'administrator' && user?.role !== 'manager') return;
    const targetTaskIndex = tasks.findIndex(t => t.taskId === taskId);
    if (targetTaskIndex === -1) return;
    
    const targetTask = tasks[targetTaskIndex];
    const newAssignees = (targetTask.assignees || []).filter(a => a.id !== memberId);
    
    setUndoStack(prev => [...prev, { taskId, previousAssignees: (targetTask.assignees || []) }]);
    
    const updatedTasks = [...tasks];
    updatedTasks[targetTaskIndex] = { ...targetTask, assignees: newAssignees };
    setTasks(updatedTasks);
    
    try {
      setSaveStatus('saving');
      await axios.put(`/api/sprints/${sprintId}/tasks/${taskId}/assignees`, {
        assignees: newAssignees.map(a => a.id)
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2500);
    } catch(err) {
      console.error(err);
      setSaveStatus('failed');
      setTimeout(() => setSaveStatus(null), 3000);
      alert("Failed to remove assignment: " + (err.response?.data?.error || err.message));
    }
  };

  const handleUndoAssignment = async () => {
    if (undoStack.length === 0) return;
    const lastAction = undoStack[undoStack.length - 1];
    const { taskId, previousAssignees } = lastAction;
    
    const targetTaskIndex = tasks.findIndex(t => t.taskId === taskId);
    if (targetTaskIndex === -1) {
      setUndoStack(prev => prev.slice(0, -1));
      return;
    }
    
    const targetTask = tasks[targetTaskIndex];
    const updatedTasks = [...tasks];
    updatedTasks[targetTaskIndex] = { ...targetTask, assignees: previousAssignees };
    setTasks(updatedTasks);
    setUndoStack(prev => prev.slice(0, -1));
    
    try {
      setSaveStatus('saving');
      await axios.put(`/api/sprints/${sprintId}/tasks/${taskId}/assignees`, {
        assignees: previousAssignees.map(a => a.id)
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2500);
    } catch(err) {
      console.error(err);
      setSaveStatus('failed');
      setTimeout(() => setSaveStatus(null), 3000);
      alert("Failed to undo assignment: " + (err.response?.data?.error || err.message));
    }
  };

  const handleScheduleMeeting = () => {
    const title = encodeURIComponent(`Sprint Meeting: ${sprint.sprintName}`);
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}`, '_blank');
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await axios.patch(`/api/sprints/${sprintId}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      if (newStatus === 'planner') navigate('/manager/sprints', { state: { fromTab: 'planner' } });
      else if (newStatus === 'active') navigate('/manager/sprints', { state: { fromTab: 'active' } });
      else fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReadyForReview = async () => {
    try {
      await axios.post(`/api/sprints/${sprintId}/review/init`, {}, { headers: { Authorization: `Bearer ${token}` } });
      navigate('/manager/sprints', { state: { fromTab: 'review' } });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to initiate review");
    }
  };

  const handleChecklistChange = (field, value) => {
    if (!isManager) return;
    let newDod = dodMet, newQa = qaPassed, newStake = stakeholderSignoff;
    if (field === 'dod') { newDod = value; setDodMet(value); }
    if (field === 'qa') { newQa = value; setQaPassed(value); }
    if (field === 'stake') { newStake = value; setStakeholderSignoff(value); }
    
    setSavingChecklist(true);
    axios.put(`/api/sprints/${sprintId}/review/checklist`, { dodMet: newDod, qaPassed: newQa, stakeholderSignoff: newStake }, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => fetchData())
      .finally(() => setSavingChecklist(false));
  };

  const handleSaveNotes = () => {
    if (!isManager) return;
    setSavingNotes(true);
    axios.put(`/api/sprints/${sprintId}/review/notes`, { notes: reviewerNotes }, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => fetchData())
      .finally(() => setSavingNotes(false));
  };

  const handleReturn = () => {
    if (!returnReason.trim()) return;
    axios.post(`/api/sprints/${sprintId}/review/return`, { returnReason }, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => navigate('/manager/sprints', { state: { fromTab: 'active' } }))
      .catch(err => console.error(err));
  };

  const handleComplete = () => {
    setCompleting(true);
    axios.post(`/api/sprints/${sprintId}/review/complete`, {}, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => navigate('/manager/sprints', { state: { fromTab: 'completed' } }))
      .catch(err => console.error(err))
      .finally(() => setCompleting(false));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };



  if (loading) {
    return (
      <div className="flex-1 flex flex-col h-full bg-bg-primary overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-accent-blue" />
        </div>
      </div>
    );
  }

  if (!sprint) {
    return (
      <div className="flex-1 flex flex-col h-full bg-bg-primary overflow-hidden">
        <div className="p-8 text-center text-text-secondary">Sprint not found.</div>
      </div>
    );
  }

  // Calculate task counts
  const taskCount = tasks.length;
  const doneCount = tasks.filter(t => t.status === 'done').length;
  const inProgressCount = tasks.filter(t => t.status === 'inProgress').length;
  const blockedCount = tasks.filter(t => t.status === 'blocked').length;
  const todoCount = tasks.filter(t => t.status === 'todo').length;
  const completionPct = taskCount > 0 ? Math.round((doneCount / taskCount) * 100) : 0;
  const allChecked = dodMet && qaPassed && stakeholderSignoff;

  const performAutoSave = async (tasksToAdd, tasksToRemove, attempt = 1, previousTasksState = null, previousBacklogState = null) => {
    const addedIds = new Set(tasksToAdd.map(t => t.task_id || t.taskId));
    const removedIds = new Set(tasksToRemove.map(t => t.task_id || t.taskId));

    let currentTasks = tasks;
    let currentBacklog = backlogTasks;

    if (attempt === 1) {
      currentTasks = [...tasks];
      currentBacklog = [...backlogTasks];

      setTasks(prev => {
        const remaining = prev.filter(t => !removedIds.has(t.task_id) && !removedIds.has(t.taskId));
        const newSprintTasks = tasksToAdd.map(t => ({
          id: t.id, taskId: t.task_id || t.taskId, title: t.title, description: t.description,
          priority: t.priority, status: t.status, assignedTo: null, subtasksList: [], project_id: t.project_id
        }));
        return [...remaining, ...newSprintTasks];
      });

      setBacklogTasks(prev => {
        const remaining = prev.filter(t => !addedIds.has(t.task_id));
        const returningToBacklog = tasksToRemove
          .filter(t => String(t.project_id) === String(selectedProjectId))
          .map(t => ({ ...t, task_id: t.task_id || t.taskId }));
        return [...remaining, ...returningToBacklog];
      });
    }

    setSaveStatus(attempt === 1 ? 'saving' : 'failed_retrying');
    try {
      await axios.post(`/api/sprints/${sprintId}/tasks/sync`, {
        tasksToAdd,
        tasksToRemove
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setSaveStatus('saved');
      setLastFailedSave(null);
      
      if (tasksToAdd.length > 0) {
        setHighlightedTasks(prev => new Set([...prev, ...addedIds]));
        setTimeout(() => {
          setHighlightedTasks(prev => {
            const updated = new Set(prev);
            addedIds.forEach(id => updated.delete(id));
            return updated;
          });
        }, 2000);
      }

      setTimeout(() => {
        setSaveStatus(prev => prev === 'saved' ? null : prev);
      }, 2000);
    } catch (err) {
      console.error(err);
      if (attempt === 1) {
        await performAutoSave(tasksToAdd, tasksToRemove, 2, currentTasks, currentBacklog);
      } else {
        setSaveStatus('failed');
        setLastFailedSave({ tasksToAdd, tasksToRemove });
        if (previousTasksState) setTasks(previousTasksState);
        if (previousBacklogState) setBacklogTasks(previousBacklogState);
        alert("Failed to save changes to the database. The tasks have been reverted to their original state.");
      }
    }
  };

  const handleBackClick = () => {
    navigate('/manager/sprints', { state: { fromTab } });
  };

  const renderTopActions = () => {
    const meetingButton = (() => {
      if (sprint.status !== 'planner' && sprint.status !== 'active' && sprint.status !== 'review') return null;
      
      const isManager = user?.role === 'administrator' || user?.role === 'manager';
      if (isManager) {
        return (
          <>
            <button onClick={handleScheduleMeeting} className="flex items-center gap-1.5 bg-bg-secondary text-text-primary border border-line px-4 py-1.5 rounded-xl text-[12px] font-bold hover:bg-line shadow-sm transition-colors">
              <CalendarPlus size={14} /> Schedule Meeting
            </button>
            <div className="w-px h-6 bg-line mx-3"></div>
          </>
        );
      }
      return null;
    })();

    const editButton = (sprint.status === 'created' || sprint.status === 'planner') && (
      <button onClick={() => navigate('/manager/sprints', { state: { fromTab, editSprintId: sprint.sprintId } })} className="bg-bg-secondary text-text-secondary px-4 py-1.5 rounded-xl text-[12px] font-bold hover:bg-line transition-colors shadow-sm" title="Edit Sprint">
        Edit
      </button>
    );
    
    const deleteButton = (
      <button onClick={() => {
        setConfirmModalData({
          title: "Delete Sprint?",
          bodyText: "This will permanently delete this sprint. This action cannot be undone.",
          confirmText: "Delete Sprint",
          iconType: "danger",
          onConfirm: async () => {
            try {
              await axios.delete(`/api/sprints/${sprintId}`, { headers: { Authorization: `Bearer ${token}` } });
              navigate('/manager/sprints', { state: { fromTab } });
            } catch (err) {
              console.error(err);
            }
          }
        });
      }} className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 px-4 py-1.5 rounded-xl text-[12px] font-bold hover:bg-red-500/20 transition-colors shadow-sm" title="Delete Sprint">
        Delete
      </button>
    );

    const saveIndicator = (
      <>
        {saveStatus === 'saving' && (
          <div className="flex items-center gap-1.5 text-text-muted text-[11px] mr-2">
            <Loader2 size={12} className="animate-spin" /> Saving...
          </div>
        )}
        {saveStatus === 'saved' && (
          <div className="flex items-center gap-1 text-green-500 text-[11px] mr-2">
            All changes saved ✓
          </div>
        )}
        {saveStatus === 'failed_retrying' && (
          <div className="flex items-center gap-1.5 text-amber-500 text-[11px] mr-2">
            <Loader2 size={12} className="animate-spin" /> Save failed — retrying...
          </div>
        )}
        {saveStatus === 'failed' && (
          <div className="flex items-center gap-2 text-red-500 text-[11px] mr-2">
            Save failed
            <button 
              onClick={() => lastFailedSave && performAutoSave(lastFailedSave.tasksToAdd, lastFailedSave.tasksToRemove, 1)}
              className="underline hover:text-red-400"
            >
              Retry
            </button>
          </div>
        )}
      </>
    );

    if (sprint.status === 'created') {
      return (
        <div className="flex items-center gap-2">
          {saveIndicator}
          {editButton}
          {deleteButton}
          <button onClick={() => {
            setConfirmModalData({
              title: "Move to Planner?",
              bodyText: "Are you sure you want to move this sprint to the Planner? The team will be notified.",
              confirmText: "Move to Planner",
              iconType: "primary",
              onConfirm: () => handleStatusChange('planner')
            });
          }} className="bg-purple-600 text-white px-4 py-1.5 rounded-xl text-[12px] font-bold hover:bg-purple-700 transition-colors shadow-sm ml-2">
            Move to Planner
          </button>
        </div>
      );
    }
    if (sprint.status === 'planner') {
      return (
        <div className="flex items-center gap-2">
          {saveIndicator}
          {meetingButton}
          {editButton}
          {deleteButton}
          <button onClick={() => {
            if (!sprint.ownerId) {
              setConfirmModalData({
                title: "Manager Required",
                bodyText: "Please assign a Sprint Manager before starting the sprint.",
                confirmText: "Okay",
                iconType: "warning",
                onConfirm: () => setConfirmModalData(null)
              });
              return;
            }
            setConfirmModalData({
              title: "Start Sprint?",
              bodyText: "Are you sure you want to start this sprint? The sprint will officially become active.",
              confirmText: "Start Sprint",
              iconType: "primary",
              onConfirm: () => handleStatusChange('active')
            });
          }} className="bg-accent-blue text-white px-4 py-1.5 rounded-xl text-[12px] font-bold hover:bg-blue-600 shadow-sm ml-2">
            Start Sprint
          </button>
        </div>
      );
    }
    if (sprint.status === 'active') {
      return (
        <div className="flex items-center gap-2">
          {meetingButton}
          {user?.role === 'administrator' && (
            <button onClick={() => { 
              setConfirmModalData({
                title: "Force Close Sprint?",
                bodyText: "Are you sure you want to force close this sprint? This action cannot be undone.",
                confirmText: "Force Close",
                iconType: "danger",
                onConfirm: () => handleStatusChange('completed')
              });
            }} className="bg-red-600 text-white px-4 py-1.5 rounded-xl text-[12px] font-bold hover:bg-red-700 shadow-sm ml-2">
              Force Close
            </button>
          )}
          {deleteButton}
          {confirmReview ? (
            <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-500/10 p-1 rounded-xl border border-yellow-200 dark:border-yellow-500/20 ml-2">
              <span className="text-xs text-yellow-800 dark:text-yellow-400 font-medium px-1">Ready for review?</span>
              <button onClick={handleReadyForReview} className="bg-yellow-600 text-white px-2 py-1 rounded-xl-[3px] text-[11px] font-bold hover:bg-yellow-700">Confirm</button>
              <button onClick={() => setConfirmReview(false)} className="text-text-muted hover:text-gray-700 px-1"><X size={14} /></button>
            </div>
          ) : (
            <button onClick={() => setConfirmReview(true)} className="flex items-center gap-1.5 bg-yellow-500 text-white px-4 py-1.5 rounded-xl text-[12px] font-bold hover:bg-yellow-600 shadow-sm ml-2">
              <Flag size={14} /> Ready for Review
            </button>
          )}
        </div>
      );
    }
    if (sprint.status === 'completed') {
      return (
        <div className="flex items-center gap-2">
          {deleteButton}
          <button onClick={() => navigate('/manager/sprints', { state: { fromTab: 'completed', viewReportSprintId: sprint.sprintId } })} className="flex items-center gap-1.5 bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 px-4 py-1.5 rounded-xl text-[12px] font-bold hover:bg-blue-500/20 transition-colors shadow-sm ml-2">
            <FileText size={14} /> View Report
          </button>
          <div className="bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ml-2">
            <CheckCircle size={14} /> Completed on {formatDate(sprint.end_date)}
          </div>
        </div>
      );
    }
    
    // Default fallback (e.g. for review)
    return (
      <div className="flex items-center gap-2">
        {meetingButton}
        {deleteButton}
      </div>
    );
  };

  const handleDragStart = (e, task) => {
    setDraggedTask({ ...task, source: 'backlog' });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.task_id);
  };

  const handleSprintTaskDragStart = (e, task) => {
    setDraggedTask({ ...task, source: 'sprint' });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.taskId || task.task_id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (draggedTask?.source === 'backlog') {
      e.dataTransfer.dropEffect = 'move';
      if (!isDraggingOverSprint) setIsDraggingOverSprint(true);
    }
  };

  const handleDragLeave = () => {
    setIsDraggingOverSprint(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDraggingOverSprint(false);
    if (!draggedTask || draggedTask.source !== 'backlog') return;

    const taskToAdd = draggedTask;
    setDraggedTask(null);
    await performAutoSave([taskToAdd], []);
  };

  const handleBacklogDragOver = (e) => {
    e.preventDefault();
    if (draggedTask?.source === 'sprint') {
      e.dataTransfer.dropEffect = 'move';
      if (!isHoveringBacklog) setIsHoveringBacklog(true);
    }
  };

  const handleBacklogDragLeave = () => {
    setIsHoveringBacklog(false);
  };

  const handleBacklogDrop = async (e) => {
    e.preventDefault();
    setIsHoveringBacklog(false);
    if (!draggedTask || draggedTask.source !== 'sprint') return;

    if (!draggedTask.project_id && !selectedProjectId) {
      alert("This task does not have a recorded original project. Please select a target project in the Backlog Tasks panel first.");
      setDraggedTask(null);
      return;
    }

    const taskToRemove = { ...draggedTask, project_id: draggedTask.project_id || selectedProjectId };
    setDraggedTask(null);
    await performAutoSave([], [taskToRemove]);
  };

  const handleRemoveSprintTask = async (taskIdToRemove) => {
    const taskToRemove = tasks.find(t => t.taskId === taskIdToRemove || t.task_id === taskIdToRemove);
    if (taskToRemove) {
      if (!taskToRemove.project_id && !selectedProjectId) {
        alert("This task does not have a recorded original project. Please select a target project in the Backlog Tasks panel first before removing.");
        return;
      }
      const taskWithProject = { ...taskToRemove, project_id: taskToRemove.project_id || selectedProjectId };
      await performAutoSave([], [taskWithProject]);
    }
  };

  const handleClearAllTasks = async () => {
    if (tasks.length === 0) return;
    
    if (tasks.some(t => !t.project_id) && !selectedProjectId) {
      setConfirmModalData({
        title: "Target Project Required",
        bodyText: "Some tasks do not have a recorded original project. Please select a target project in the Backlog Tasks panel first before clearing all tasks.",
        confirmText: "Understood",
        iconType: "warning",
        onConfirm: () => setConfirmModalData(null)
      });
      return;
    }
    
    setConfirmModalData({
      title: "Clear All Tasks",
      bodyText: "Are you sure you want to remove all tasks from this sprint? They will be returned to the backlog.",
      confirmText: "Clear All",
      iconType: "danger",
      onConfirm: async () => {
        const tasksToRemove = tasks.map(t => ({
          ...t, 
          project_id: t.project_id || selectedProjectId
        }));
        await performAutoSave([], tasksToRemove);
        setConfirmModalData(null);
      }
    });
  };

  const activeEmployeeIds = new Set();
  const activeManagerIds = new Set();
  if (sprint?.ownerId) activeManagerIds.add(sprint.ownerId);
  tasks.forEach(t => {
    (t.assignees || []).forEach(a => {
      if (a.role === 'employee') activeEmployeeIds.add(a.id);
      else activeManagerIds.add(a.id);
    });
  });
  
  const displayEmployeeCount = activeEmployeeIds.size > 0 ? activeEmployeeIds.size : members.filter(m => m.role === 'employee').length;
  const displayManagerCount = activeManagerIds.size > 0 ? activeManagerIds.size : members.filter(m => m.role !== 'employee').length;


  return (
    <div className="flex-1 flex flex-col h-full bg-bg-primary overflow-hidden">
      {/* Frozen Top Navigation Bar */}
      <div className="flex items-center justify-between px-8 py-4 bg-bg-primary border-b border-line shrink-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleBackClick}
            className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors text-sm font-bold bg-bg-secondary hover:bg-line px-3 py-1.5 rounded-xl"
          >
            <ArrowLeft size={16} /> Back to Sprints
          </button>
          <div className="text-sm font-medium text-text-muted flex items-center gap-2">
            <span>Sprints</span>
            <span>/</span>
            <span className="capitalize">{fromTab}</span>
            <span>/</span>
            <span className="text-text-primary">{sprint.sprintName}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {renderTopActions()}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-mono font-medium text-text-muted">{sprint.sprintId}</span>
            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border ${
              sprint.status === 'active' ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' :
              sprint.status === 'completed' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' :
              sprint.status === 'review' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20' :
              sprint.status === 'planner' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' :
              'bg-bg-secondary text-text-secondary border-line'
            }`}>
              {sprint.status === 'active' && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>}
              <span className="text-xs font-bold uppercase tracking-wider">{sprint.status}</span>
            </div>
            {sprint.status === 'active' && sprint.return_reason && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-red-500/10 text-red-600 border border-red-500/20 flex items-center gap-1" title={sprint.return_reason}>
                <AlertCircle size={12} /> Revision Needed
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">{sprint.sprintName}</h1>
            {sprint.status !== 'created' && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-bold uppercase tracking-wider">
                  <Users size={12} />
                  <span>{displayEmployeeCount} Employees</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[11px] font-bold uppercase tracking-wider">
                  <UserCog size={12} />
                  <span>{displayManagerCount} Managers</span>
                </div>
              </div>
            )}
          </div>
          
          {sprint.description && (
            <p className="text-sm text-text-secondary leading-relaxed mb-6 max-w-4xl">
              {sprint.description}
            </p>
          )}
          
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-text-secondary font-medium mb-6">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-text-muted" />
              <span>{formatDate(sprint.startDate)} <span className="text-text-muted/50 mx-1">→</span> {formatDate(sprint.endDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-text-muted" />
              <span>{taskCount} tasks</span>
            </div>
            {sprint.goal && (
              <div className="flex items-center gap-2 bg-bg-secondary px-3 py-1 rounded-xl text-text-primary italic">
                Goal: {sprint.goal}
              </div>
            )}
          </div>

          {(sprint.status === 'active' || sprint.status === 'completed' || sprint.status === 'review') && (
            <div className="bg-bg-card border border-line rounded-2xl p-5 mb-8">
              <div className="flex items-center justify-between mb-3">
                <div className="flex flex-wrap gap-4">
                  <span className="text-xs font-bold text-text-secondary flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div>{doneCount} Done</span>
                  <span className="text-xs font-bold text-text-secondary flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div>{inProgressCount} In Progress</span>
                  <span className="text-xs font-bold text-text-secondary flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div>{blockedCount} Blocked</span>
                  <span className="text-xs font-bold text-text-secondary flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gray-400"></div>{todoCount} To Do</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 flex h-3 rounded-full overflow-hidden bg-bg-secondary shadow-inner gap-[1px]">
                  {taskCount > 0 ? (
                    <>
                      <div className="h-full bg-green-500 transition-all duration-700" style={{ width: `${(doneCount / taskCount) * 100}%` }}></div>
                      <div className="h-full bg-blue-500 transition-all duration-700" style={{ width: `${(inProgressCount / taskCount) * 100}%` }}></div>
                      <div className="h-full bg-red-500 transition-all duration-700" style={{ width: `${(blockedCount / taskCount) * 100}%` }}></div>
                      <div className="h-full bg-gray-400 transition-all duration-700" style={{ width: `${(todoCount / taskCount) * 100}%` }}></div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700"></div>
                  )}
                </div>
                <span className="text-2xl font-extrabold text-text-primary tracking-tight w-16 text-right">{completionPct}%</span>
              </div>
            </div>
          )}

          <div className="h-px bg-line/80 w-full mb-8"></div>
        </div>

        {/* Progress Status Configuration — Planner only, Admin/Manager only */}
        {sprint.status === 'planner' && (user?.role === 'administrator' || user?.role === 'manager') && (
          <div className="mb-8 relative" ref={statusConfigRef}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-widest">Progress Status Configuration</h2>
            </div>

            {/* Summary pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {ALL_STATUSES.map(cfg => (
                <span key={cfg.key} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-white/90 ${cfg.color}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60"></span>
                  {cfg.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Content Body */}
        {sprint.status === 'created' ? (
          <div className="flex gap-6 h-[calc(100vh-250px)] min-h-[500px]">
            {/* Left Column - Sprint Tasks Drop Zone */}
            <div 
              className={`flex-1 flex flex-col border rounded-2xl p-4 transition-colors duration-200 ${isDraggingOverSprint ? 'border-accent-blue bg-accent-blue/5 border-dashed' : 'border-line border-dashed bg-bg-card'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center justify-between">
                <span>Sprint Tasks</span>
                <div className="flex items-center gap-2">
                  {tasks.length > 0 && (
                    <button 
                      onClick={handleClearAllTasks}
                      className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-2 py-0.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors border border-red-500/20"
                    >
                      Clear All
                    </button>
                  )}
                  <span className="bg-bg-secondary px-2 py-0.5 rounded-xl text-text-primary normal-case font-medium">Total Tasks: {tasks.length}</span>
                </div>
              </h2>
              
              {tasks.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
                  <div className="w-16 h-16 mb-4 rounded-full bg-bg-secondary flex items-center justify-center">
                    <Flag size={24} className="text-text-secondary" />
                  </div>
                  <p className="text-sm font-medium">Drag tasks from the backlog to add them to this sprint.</p>
                </div>
              ) : (
                <div className="overflow-hidden bg-bg-secondary/20 rounded-2xl border border-line">
                  <table className="w-full text-left text-[12px] whitespace-nowrap">
                    <thead className="bg-bg-secondary text-text-muted text-[11px] uppercase tracking-wider border-b-2 border-line">
                      <tr>
                        <th className="w-full px-4 py-3 font-bold">Task</th>
                        <th className="w-32 px-4 py-3 font-bold">Priority Flag</th>
                        <th className="w-12 px-4 py-3 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {tasks.map(task => (
                          <tr 
                          key={task.taskId} 
                          draggable
                          onDragStart={(e) => handleSprintTaskDragStart(e, task)}
                          className={`h-12 transition-colors cursor-grab active:cursor-grabbing group select-none ${highlightedTasks.has(task.taskId) || highlightedTasks.has(task.task_id) ? 'bg-green-500/20 border-green-500/50 border' : draggedTask?.source === 'sprint' && (draggedTask.taskId || draggedTask.task_id) === task.taskId ? 'opacity-50 border-dashed border border-line bg-bg-secondary' : 'hover:bg-bg-secondary/40'}`}
                        >
                          <td className="py-2 px-4 font-medium text-text-primary flex items-center gap-2">
                            <div className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                              <GripVertical size={14} />
                            </div>
                            {task.title}
                          </td>
                          <td className="py-2 px-4">{getPriorityDot(task.priority)}</td>
                          <td className="py-2 px-4">
                            <div className="flex items-center justify-center gap-3">
                              <button onClick={() => handleRemoveSprintTask(task.taskId)} className="text-text-muted hover:text-red-500 transition-colors" title="Remove from Sprint">
                                <X size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Right Column - Backlog Source */}
            <div 
              className={`flex-1 flex flex-col border rounded-2xl p-4 transition-colors duration-200 ${isHoveringBacklog ? 'border-accent-blue bg-accent-blue/5 shadow-[0_0_15px_rgba(59,130,246,0.15)] border-solid' : 'border-line bg-bg-card border-solid'}`}
              onDragOver={handleBacklogDragOver}
              onDragLeave={handleBacklogDragLeave}
              onDrop={handleBacklogDrop}
            >
              <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center justify-between">
                <span>Backlog Tasks</span>
                {selectedProjectId && (
                  <span className="bg-bg-secondary px-2 py-0.5 rounded-xl text-text-primary normal-case font-medium">Total Tasks: {backlogTasks.length}</span>
                )}
              </h2>
              
              <div className="mb-4 relative" ref={projectDropdownRef}>
                <div 
                  onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
                  className="w-full pl-4 pr-4 py-2.5 text-sm bg-input-bg border border-line rounded-2xl text-text-primary focus:outline-none focus:border-accent-blue cursor-pointer flex items-center justify-between"
                >
                  <span className={!selectedProjectId ? "text-text-muted" : ""}>
                    {selectedProjectId ? projects.find(p => p.project_id === selectedProjectId)?.title : 'Select a project...'}
                  </span>
                  <ChevronDown size={16} className={`text-text-muted transition-transform ${projectDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
                
                {projectDropdownOpen && (
                  <div className="absolute z-10 w-full mt-2 bg-bg-card border border-line rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                      {projects.map(p => (
                        <div 
                          key={p.project_id}
                          onClick={() => {
                            setSelectedProjectId(p.project_id);
                            setProjectDropdownOpen(false);
                          }}
                          className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-bg-secondary transition-colors ${selectedProjectId === p.project_id ? 'bg-accent-blue/10 text-accent-blue font-medium' : 'text-text-primary'}`}
                        >
                          {p.title}
                        </div>
                      ))}
                      {projects.length === 0 && (
                        <div className="px-4 py-3 text-sm text-text-muted italic text-center">No projects available</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {!selectedProjectId ? (
                  <div className="h-full flex items-center justify-center text-sm text-text-muted italic">
                    Select a project above to view its backlog tasks.
                  </div>
                ) : backlogTasks.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-text-muted italic">
                    All tasks from this project have been added to the sprint.
                  </div>
                ) : (
                  backlogTasks.map(task => (
                    <div 
                      key={task.task_id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      className="flex items-center gap-3 p-3 rounded-2xl border border-line bg-bg-secondary/30 hover:bg-bg-secondary/80 hover:border-line-light transition-all cursor-grab active:cursor-grabbing group select-none"
                    >
                      <div className="text-text-muted group-hover:text-text-secondary cursor-grab active:cursor-grabbing">
                        <GripVertical size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{task.title}</div>
                        <div className="mt-1">{getPriorityDot(task.priority)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : sprint.status === 'planner' ? (
          <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-250px)] min-h-[500px]">
            {/* Left Column - Sprint Tasks */}
            <div className={`flex flex-col border rounded-2xl p-4 transition-colors duration-200 border-line bg-bg-card ${user?.role === 'administrator' || user?.role === 'manager' ? 'lg:w-[65%]' : 'w-full'}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                  <span>Sprint Tasks</span>
                  <span className="bg-bg-secondary px-2 py-0.5 rounded-xl text-text-primary normal-case font-medium">{tasks.length}</span>
                </h2>
                <div className="flex items-center gap-4">
                  {/* Sprint Manager Drag and Drop Box */}
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setIsHoveringManagerBox(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsHoveringManagerBox(false); }}
                    onDrop={handleManagerDrop}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border-2 border-dashed transition-colors ${
                      isHoveringManagerBox 
                        ? 'border-accent-blue bg-accent-blue/10' 
                        : 'border-line hover:border-line-light bg-bg-secondary/50'
                    }`}
                  >
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Manager:</span>
                    {sprint.ownerName ? (
                      <div 
                        draggable={user?.role === 'administrator' || user?.role === 'manager'}
                        onDragStart={handleManagerChipDragStart}
                        className={`group/mgrchip relative flex items-center gap-1.5 bg-amber-500/20 px-2 py-0.5 rounded-xl text-amber-500 text-xs font-medium transition-shadow select-none ${(user?.role === 'administrator' || user?.role === 'manager') ? 'cursor-grab active:cursor-grabbing hover:shadow-sm' : ''} ${draggedChip?.type === 'sprint_manager' ? 'opacity-50 dashed border border-amber-500' : 'border border-transparent'}`}
                      >
                        {(user?.role === 'administrator' || user?.role === 'manager') && (
                          <div className="hidden group-hover/mgrchip:flex text-amber-500/50 -ml-1 pr-0.5">
                            <GripVertical size={10} />
                          </div>
                        )}
                        <User size={12} /> {sprint.ownerName}
                        {(user?.role === 'administrator' || user?.role === 'manager') && (
                          <button onClick={(e) => { e.stopPropagation(); handleRemoveSprintManager(); }} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/mgrchip:opacity-100 transition-opacity shadow-md hover:bg-red-600">
                            <X size={10} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-text-muted italic">Drop Manager Here</span>
                    )}
                  </div>

                  {(user?.role === 'administrator' || user?.role === 'manager') && undoStack.length > 0 && (
                    <button 
                      onClick={handleUndoAssignment}
                      className="flex items-center gap-1.5 px-3 py-1 bg-bg-secondary hover:bg-bg-secondary/80 text-text-primary rounded-2xl text-xs font-medium transition-colors border border-line"
                    >
                      <Undo2 size={14} /> Undo
                    </button>
                  )}
                  {(user?.role !== 'administrator' && user?.role !== 'manager') && (
                    <span className="text-xs text-text-muted italic">Assignments are managed by your sprint manager.</span>
                  )}
                </div>
              </div>
              
              <div className="bg-bg-secondary/20 rounded-2xl border border-line flex-1 overflow-hidden flex flex-col">
                <div className="overflow-y-auto flex-1 custom-scrollbar">
                  <table className="w-full text-left text-[12px]">
                    <thead className="bg-bg-secondary text-text-muted text-[11px] uppercase tracking-wider border-b-2 border-line sticky top-0 z-10">
                      <tr>
                        <th className="w-1/3 px-4 py-3 font-bold">Task</th>
                        <th className="w-32 px-4 py-3 font-bold">Priority Flag</th>
                        <th className="w-full px-4 py-3 font-bold">Assigned To</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {tasks.map(task => {
                        const isHovered = hoveredTaskId === task.taskId;
                        const assignees = task.assignees || [];
                        return (
                          <tr 
                            key={task.taskId} 
                            className={`transition-colors select-none ${isHovered ? 'bg-accent-blue/10 border-accent-blue shadow-[inset_0_0_0_2px_rgba(59,130,246,0.5)]' : 'hover:bg-bg-secondary/40'}`}
                            onDragOver={(e) => handlePlannerDragOver(e, task.taskId)}
                            onDragLeave={handlePlannerDragLeave}
                            onDrop={(e) => handlePlannerDrop(e, task.taskId)}
                          >
                            <td className="py-3 px-4 font-medium text-text-primary truncate max-w-xs">{task.title}</td>
                            <td className="py-3 px-4">{getPriorityDot(task.priority)}</td>
                            <td className={`py-3 px-4 transition-opacity ${draggedChip?.sourceTaskId === task.taskId ? 'opacity-50 border-dashed border-2 border-line rounded-xl' : ''}`}>
                              {assignees.length === 0 ? (
                                <span className="text-text-muted italic">— Unassigned —</span>
                              ) : (
                                <div className="flex flex-wrap items-center gap-2">
                                  {assignees.map(a => {
                                    const isMgr = a.role === 'manager';
                                    const canDrag = (user?.role === 'administrator' || user?.role === 'manager');
                                    return (
                                      <div 
                                        key={a.id} 
                                        draggable={canDrag}
                                        onDragStart={(e) => handleChipDragStart(e, a, task.taskId)}
                                        className={`group/chip relative flex items-center gap-1.5 px-2 py-1 rounded-full border transition-shadow select-none ${canDrag ? 'cursor-grab active:cursor-grabbing hover:shadow-sm' : ''} ${isMgr ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'}`}
                                      >
                                        {canDrag && (
                                          <div className="hidden group-hover/chip:flex text-text-muted/50 -ml-1 pr-0.5">
                                            <GripVertical size={10} />
                                          </div>
                                        )}
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${isMgr ? 'bg-amber-500/20' : 'bg-blue-500/20'}`}>
                                          {a.initials}
                                        </div>
                                        <span className="text-xs font-medium pr-1">{a.name.split(' ')[0]}</span>
                                        {canDrag && (
                                          <button onClick={(e) => { e.stopPropagation(); handleRemoveAssignee(task.taskId, a.id); }} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/chip:opacity-100 transition-opacity shadow-md hover:bg-red-600">
                                            <X size={10} />
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column - Team Member Pool */}
            {(user?.role === 'administrator' || user?.role === 'manager') && (
              <div 
                className={`lg:w-[35%] flex flex-col bg-bg-card border rounded-2xl p-4 transition-colors duration-200 ${isHoveringRightPanel ? 'border-accent-blue bg-accent-blue/5 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'border-line'}`}
                onDragOver={handleRightPanelDragOver}
                onDragLeave={handleRightPanelDragLeave}
                onDrop={handleRightPanelDrop}
              >
                <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-4">Team Members</h2>
                
                <div className="mb-3">
                  <input 
                    type="text" 
                    placeholder="Search by name or role..." 
                    value={plannerSearchQuery}
                    onChange={(e) => setPlannerSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-input-bg border border-line rounded-xl text-text-primary focus:outline-none focus:border-accent-blue"
                  />
                </div>
                
                <div className="flex items-center gap-2 mb-4 p-1 bg-bg-secondary/50 rounded-2xl">
                  {['All', 'Employees', 'Managers'].map(role => (
                    <button 
                      key={role}
                      onClick={() => setPlannerRoleFilter(role)}
                      className={`flex-1 py-1 text-xs font-medium rounded-2xl transition-colors ${plannerRoleFilter === role ? 'bg-bg-card text-text-primary shadow-sm border border-line' : 'text-text-muted hover:text-text-secondary'}`}
                    >
                      {role}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {poolMembers
                    .filter(m => {
                      if (plannerRoleFilter === 'Employees' && m.role !== 'employee') return false;
                      if (plannerRoleFilter === 'Managers' && m.role !== 'manager') return false;
                      if (plannerSearchQuery) {
                        const q = plannerSearchQuery.toLowerCase();
                        return m.name.toLowerCase().includes(q) || (m.designation && m.designation.toLowerCase().includes(q));
                      }
                      return true;
                    })
                    .map(m => {
                      const isMgr = m.role === 'manager';
                      const isAssignedToTask = tasks.some(t => t.assignees?.find(a => a.id === m.id));
                      const isSprintManager = sprint.ownerId === m.id;
                      const disableManagerVisuals = isMgr && tasks.some(t => t.assignees?.some(a => a.role === 'manager'));
                      const canDrag = (user?.role === 'administrator' || user?.role === 'manager');
                      
                      return (
                        <div 
                          key={m.id}
                          draggable={canDrag}
                          onDragStart={(e) => handlePlannerDragStart(e, m)}
                          className={`flex items-center gap-3 p-3 rounded-2xl border border-line bg-bg-secondary/30 transition-all select-none ${disableManagerVisuals ? 'opacity-60' : 'hover:bg-bg-secondary/80 hover:border-line-light hover:-translate-y-0.5 hover:shadow-md'} ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''}`}
                          title={disableManagerVisuals ? "A manager is already assigned to a task. Only one manager allowed per sprint task." : ""}
                        >
                          {canDrag && (
                            <div className="text-text-muted cursor-grab active:cursor-grabbing">
                              <GripVertical size={16} />
                            </div>
                          )}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${isMgr ? 'bg-amber-600' : 'bg-blue-600'}`}>
                            {m.initials}
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col">
                            <span className="text-sm font-medium text-white truncate">{m.name}</span>
                            <span className="text-[10px] text-text-muted truncate capitalize">{m.designation}</span>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-xl ${isMgr ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-400'}`}>
                              {isMgr ? 'MGR' : 'EMP'}
                            </span>
                            {isSprintManager ? (
                               <span className="flex items-center gap-1 text-[9px] text-amber-500 font-medium"><CheckCircle size={10} /> Sprint Lead</span>
                            ) : disableManagerVisuals ? (
                              <span className="text-[9px] text-text-muted italic">Assigned as Manager</span>
                            ) : isAssignedToTask ? (
                              <span className="flex items-center gap-1 text-[9px] text-green-500 font-medium"><CheckCircle size={10} /> Assigned</span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column - Task Table */}
          <div className="flex-1 min-w-0">
            <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-4">Task Table</h2>
            <div className="bg-bg-card border border-line rounded-2xl overflow-visible shadow-sm">
              <div className="overflow-visible">
                <table className="w-full text-left text-[12px] whitespace-nowrap">
                  <thead className="bg-bg-secondary text-text-muted text-[11px] uppercase tracking-wider border-b-2 border-line">
                    <tr>
                      <th className="w-10 px-3 py-3 text-center shrink-0"></th>
                      <th className="w-24 px-4 py-3 font-bold shrink-0">Task ID</th>
                      <th className="w-32 px-4 py-3 font-bold shrink-0">Assignee</th>
                      <th className="w-28 px-4 py-3 font-bold shrink-0">Priority</th>
                      <th className="w-full px-4 py-3 font-bold">Title</th>
                      <th className="w-28 px-4 py-3 font-bold shrink-0">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {tasks.length === 0 ? (
                      <tr><td colSpan="6" className="p-8 text-center text-text-secondary italic text-sm">No tasks in this sprint.</td></tr>
                    ) : tasks.map(task => {
                      const isExpanded = expandedTasks.has(task.taskId);
                      const subtasks = subtasksCache[task.taskId] || [];
                      const isLoadingSubs = loadingSubtasks.has(task.taskId);
                      return (
                        <Fragment key={task.id}>
                          <tr className={`group h-12 hover:bg-bg-secondary/40 transition-colors ${isExpanded ? 'bg-blue-50/10 dark:bg-blue-900/5' : ''}`}>
                            <td className="py-2 px-3 text-center">
                              <button onClick={() => toggleTaskExpanded(task.taskId)} className="p-1 hover:bg-bg-secondary rounded-xl text-text-secondary transition-colors">
                                <ChevronRight size={16} className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                              </button>
                            </td>
                            <td className="py-2 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11.5px] font-semibold text-accent-blue cursor-pointer hover:underline" onClick={() => navigate(`/manager/tasks/${task.taskId}`)}>{task.taskId}</span>
                                <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(task.taskId); }} className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-text-primary transition-opacity" title="Copy Task ID"><Copy size={12} /></button>
                              </div>
                            </td>
                            <td className="py-2 px-4">
                              <div className="flex items-center -space-x-2 pl-2">
                                {(task.assignees && task.assignees.length > 0) ? task.assignees.map((a, index) => {
                                  const isMgr = a.role === 'manager';
                                  return (
                                    <div 
                                      key={a.id} 
                                      className="avatar-container cursor-default"
                                      style={{ zIndex: task.assignees.length - index }}
                                    >
                                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-bg-card shadow-sm transition-transform duration-200 ${isMgr ? 'bg-amber-500' : 'bg-blue-600'}`}>
                                        {a.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}
                                      </div>
                                      
                                      <div className="avatar-tooltip px-3 py-1.5 bg-gray-800 dark:bg-gray-700 text-white text-[11px] font-medium rounded-2xl flex items-center gap-1 shadow-xl whitespace-nowrap">
                                        <span>{a.name}</span>
                                        {isMgr && <span className="text-amber-400 text-[10px]">(Manager)</span>}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-gray-800 dark:border-t-gray-700"></div>
                                      </div>
                                    </div>
                                  );
                                }) : <span className="text-sm font-medium text-text-muted italic -ml-2">Unassigned</span>}
                              </div>
                            </td>
                            <td className="py-2 px-4">{getPriorityDot(task.priority)}</td>
                            <td className="py-2 px-4 font-medium text-text-primary truncate max-w-xs">{task.title}</td>
                            <td className="py-2 px-4">{getStatusBadge(task.status)}</td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan="6" className="p-0 border-b border-line">
                                <div className="bg-bg-secondary/40 dark:bg-bg-secondary/20 px-12 py-3 border-l-4 border-accent-blue shadow-inner">
                                  {isLoadingSubs ? (
                                    <div className="flex items-center gap-2 text-sm text-text-secondary py-2"><Loader2 size={16} className="animate-spin" /> Loading subtasks...</div>
                                  ) : subtasks.length === 0 ? (
                                    <div className="text-sm text-text-secondary italic py-2">No subtasks.</div>
                                  ) : (
                                    <table className="w-full text-left text-[12px]">
                                      <thead><tr className="text-[10px] uppercase tracking-wider text-text-muted border-b border-line"><th className="pb-2 font-bold w-full">Subtask Title</th><th className="pb-2 font-bold w-28">Status</th></tr></thead>
                                      <tbody>
                                        {subtasks.map(sub => (
                                          <tr key={sub.id} className="border-b border-line last:border-0 hover:bg-bg-secondary transition-colors"><td className="py-2.5 text-text-secondary font-medium">{sub.title}</td><td className="py-2.5">{getStatusBadge(sub.status)}</td></tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Requirements & References (Moved to left column to balance layout) */}
            <div className="mt-8">
              <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-4">Requirements & References</h2>
              <div className="space-y-3">
                {requirements.notes.length === 0 && requirements.attachments.length === 0 && (
                  <div className="text-sm text-text-secondary italic bg-bg-card border border-line rounded-2xl p-4 shadow-sm">No notes or attachments.</div>
                )}
                {requirements.notes.map(note => (
                  <div key={note.id} className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700/30 p-4 rounded-2xl shadow-sm">
                    <h4 className="text-sm font-bold text-yellow-800 dark:text-yellow-400 mb-1">{note.title}</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-500/80 whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))}
                {requirements.attachments.map(att => (
                  <a key={att.id} href={att.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-bg-card border border-line p-3 rounded-2xl shadow-sm hover:bg-bg-secondary transition-colors group">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-accent-blue flex items-center justify-center flex-shrink-0">
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-text-primary truncate group-hover:text-accent-blue transition-colors">{att.fileName}</div>
                      <div className="text-[11px] text-text-muted">Attachment</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>


          {/* Right Column - Sidebar */}
          <div className="w-full lg:w-80 flex flex-col gap-8 shrink-0">
            
            {/* Mode-specific content: Review mode */}
            {sprint.status === 'review' && (
              <div>
                <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-4">Manager Review</h2>
                <div className="bg-bg-card border border-line rounded-2xl p-5 shadow-sm space-y-5">
                  <div className="space-y-3">
                    <label className={`flex items-center gap-3 ${!isManager ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}>
                      <input type="checkbox" checked={dodMet} onChange={(e) => handleChecklistChange('dod', e.target.checked)} disabled={!isManager || savingChecklist} className="w-4 h-4 text-accent-blue rounded-xl border-gray-300 focus:ring-accent-blue" />
                      <span className="text-sm font-medium text-text-primary">DoD criteria met</span>
                    </label>
                    <label className={`flex items-center gap-3 ${!isManager ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}>
                      <input type="checkbox" checked={qaPassed} onChange={(e) => handleChecklistChange('qa', e.target.checked)} disabled={!isManager || savingChecklist} className="w-4 h-4 text-accent-blue rounded-xl border-gray-300 focus:ring-accent-blue" />
                      <span className="text-sm font-medium text-text-primary">QA / testing passed</span>
                    </label>
                    <label className={`flex items-center gap-3 ${!isManager ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}>
                      <input type="checkbox" checked={stakeholderSignoff} onChange={(e) => handleChecklistChange('stake', e.target.checked)} disabled={!isManager || savingChecklist} className="w-4 h-4 text-accent-blue rounded-xl border-gray-300 focus:ring-accent-blue" />
                      <span className="text-sm font-medium text-text-primary">Stakeholder sign-off</span>
                    </label>
                  </div>
                  
                  <div className="pt-4 border-t border-line">
                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Reviewer Notes</label>
                    {isManager ? (
                      <div className="flex flex-col gap-2">
                        <textarea value={reviewerNotes} onChange={(e) => setReviewerNotes(e.target.value)} placeholder="Add feedback..." className="w-full min-h-[80px] p-2.5 text-sm border border-line bg-input-bg text-text-primary rounded-xl focus:ring-1 focus:ring-accent-blue focus:border-accent-blue outline-none resize-y" />
                        <button onClick={handleSaveNotes} disabled={savingNotes || reviewerNotes === sprint.reviewer_notes} className="self-end flex items-center gap-1 bg-bg-secondary hover:bg-dropdown-hover-bg text-text-primary px-3 py-1.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"><Save size={14} /> Save Notes</button>
                      </div>
                    ) : (
                      <div className="bg-bg-secondary p-3 rounded-xl text-sm text-text-primary italic">{reviewerNotes || 'No notes provided yet.'}</div>
                    )}
                  </div>
                  
                  <div className="pt-4 flex flex-col gap-3 border-t border-line">
                    {showReturnInput ? (
                      <div className="flex flex-col gap-2">
                        <input type="text" value={returnReason} onChange={(e) => setReturnReason(e.target.value)} placeholder="Reason for return..." className="w-full text-sm p-2 border border-line bg-input-bg text-text-primary rounded-xl focus:ring-1 focus:ring-red-500 outline-none" autoFocus />
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setShowReturnInput(false)} className="text-text-muted hover:text-text-primary text-xs font-bold px-2 py-1.5">Cancel</button>
                          <button onClick={handleReturn} disabled={!returnReason.trim()} className="bg-red-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-red-700 disabled:opacity-50">Confirm Return</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setShowReturnInput(true)} disabled={!isManager} className="w-full flex items-center justify-center gap-1.5 border border-line text-text-secondary hover:text-text-primary hover:bg-dropdown-hover-bg px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <CornerUpLeft size={16} /> Send Back to Active
                      </button>
                    )}
                    
                    {!showReturnInput && (
                      <button onClick={handleComplete} disabled={!isManager || !allChecked || completing} className="w-full flex items-center justify-center gap-1.5 bg-accent-blue text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <CheckCircle size={16} /> Mark as Completed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Team Members Panel */}
            <div>
              <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-4">Team Members ({members.length})</h2>
              <div className="bg-bg-card border border-line rounded-2xl p-4 shadow-sm space-y-3">
                {members.length === 0 ? (
                  <div className="text-sm text-text-secondary italic">No team members assigned.</div>
                ) : (
                  members.map(member => {
                    const memberTasks = tasks.filter(t => t.assignees && t.assignees.some(a => a.id === member.userId));
                    const memberSubtasksCount = memberTasks.reduce((acc, t) => acc + (t.subtasksList?.length || 0), 0);
                    return (
                      <div key={member.id} className="flex items-center justify-between p-2 rounded-2xl hover:bg-bg-secondary/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 flex items-center justify-center text-[12px] font-bold border border-blue-200 dark:border-blue-500/20">
                            {member.initials}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-text-primary leading-tight">{member.name}</div>
                            <div className="text-[11px] text-text-secondary capitalize">{member.role}</div>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-0.5">
                          <div className="text-[11px] font-bold text-text-primary">{memberTasks.length} Main Tasks</div>
                          <div className="text-[11px] font-medium text-text-muted">{memberSubtasksCount} Subtasks</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>
        )}
      </div>
      <ConfirmModal
        isOpen={!!confirmModalData}
        onCancel={() => setConfirmModalData(null)}
        onConfirm={() => {
          if (confirmModalData?.onConfirm) confirmModalData.onConfirm();
          setConfirmModalData(null);
        }}
        title={confirmModalData?.title}
        bodyText={confirmModalData?.bodyText}
        confirmText={confirmModalData?.confirmText}
        iconType={confirmModalData?.iconType}
      />
    </div>
  );
}
