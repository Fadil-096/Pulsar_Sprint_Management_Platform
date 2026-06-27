import React, { useState, useEffect, Fragment } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  ChevronRight, Loader2, Clock, AlertTriangle, Copy, 
  Calendar, CheckCircle, Users, AlertCircle, ArrowLeft, 
  Flag, X, CheckSquare, Save, CornerUpLeft, Edit2, FileText, Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Helper functions for UI
const getStatusBadge = (status) => {
  switch(status.toLowerCase()) {
    case 'todo': return <span className="inline-flex items-center justify-center px-2 py-0.5 bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 rounded text-[10px] font-bold uppercase tracking-wider border border-gray-200 dark:border-gray-700">To Do</span>;
    case 'inprogress': return <span className="inline-flex items-center justify-center px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-[10px] font-bold uppercase tracking-wider border border-blue-200 dark:border-blue-800/50">In Progress</span>;
    case 'blocked': return <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded text-[10px] font-bold uppercase tracking-wider border border-red-200 dark:border-red-800/50"><AlertTriangle size={10} /> Blocked</span>;
    case 'done': return <span className="inline-flex items-center justify-center px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-[10px] font-bold uppercase tracking-wider border border-green-200 dark:border-green-800/50">Done</span>;
    default: return <span className="inline-flex items-center justify-center px-2 py-0.5 bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 rounded text-[10px] font-bold uppercase tracking-wider border border-gray-200 dark:border-gray-700">{status}</span>;
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
  const isManager = user?.role === 'manager';
  
  const fromTab = location.state?.fromTab || 'created';

  const [sprint, setSprint] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [requirements, setRequirements] = useState({ notes: [], attachments: [] });
  const [loading, setLoading] = useState(true);

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
  const [completing, setCompleting] = useState(false);
  const [confirmReview, setConfirmReview] = useState(false);

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
  const renderTopActions = () => {
    const editButton = (sprint.status === 'created' || sprint.status === 'planner') && (
      <button onClick={() => navigate('/manager/sprints', { state: { fromTab, editSprintId: sprint.sprintId } })} className="bg-bg-secondary text-text-secondary px-4 py-1.5 rounded text-[12px] font-bold hover:bg-line transition-colors shadow-sm" title="Edit Sprint">
        Edit
      </button>
    );
    
    const deleteButton = (
      <button onClick={async () => {
        if (window.confirm("Are you sure you want to delete this sprint?")) {
          try {
            await axios.delete(`/api/sprints/${sprintId}`, { headers: { Authorization: `Bearer ${token}` } });
            navigate('/manager/sprints', { state: { fromTab } });
          } catch (err) {
            console.error(err);
          }
        }
      }} className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 px-4 py-1.5 rounded text-[12px] font-bold hover:bg-red-500/20 transition-colors shadow-sm" title="Delete Sprint">
        Delete
      </button>
    );

    if (sprint.status === 'created') {
      return (
        <div className="flex items-center gap-2">
          {editButton}
          {deleteButton}
          <button onClick={() => handleStatusChange('planner')} className="bg-purple-600 text-white px-4 py-1.5 rounded text-[12px] font-bold hover:bg-purple-700 shadow-sm ml-2">
            Move to Planner
          </button>
        </div>
      );
    }
    if (sprint.status === 'planner') {
      return (
        <div className="flex items-center gap-2">
          {editButton}
          {deleteButton}
          <button onClick={() => handleStatusChange('active')} className="bg-accent-blue text-white px-4 py-1.5 rounded text-[12px] font-bold hover:bg-blue-600 shadow-sm ml-2">
            Start Sprint
          </button>
        </div>
      );
    }
    if (sprint.status === 'active') {
      return (
        <div className="flex items-center gap-2">
          {deleteButton}
          {confirmReview ? (
            <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-500/10 p-1 rounded border border-yellow-200 dark:border-yellow-500/20 ml-2">
              <span className="text-xs text-yellow-800 dark:text-yellow-400 font-medium px-1">Ready for review?</span>
              <button onClick={handleReadyForReview} className="bg-yellow-600 text-white px-2 py-1 rounded-[3px] text-[11px] font-bold hover:bg-yellow-700">Confirm</button>
              <button onClick={() => setConfirmReview(false)} className="text-text-muted hover:text-gray-700 px-1"><X size={14} /></button>
            </div>
          ) : (
            <button onClick={() => setConfirmReview(true)} className="flex items-center gap-1.5 bg-yellow-500 text-white px-4 py-1.5 rounded text-[12px] font-bold hover:bg-yellow-600 shadow-sm ml-2">
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
          <button onClick={() => navigate('/manager/sprints', { state: { fromTab: 'completed', viewReportSprintId: sprint.sprintId } })} className="flex items-center gap-1.5 bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 px-4 py-1.5 rounded text-[12px] font-bold hover:bg-blue-500/20 transition-colors shadow-sm ml-2">
            <FileText size={14} /> View Report
          </button>
          <div className="bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 ml-2">
            <CheckCircle size={14} /> Completed on {formatDate(sprint.end_date)}
          </div>
        </div>
      );
    }
    
    // Default fallback (e.g. for review)
    return (
      <div className="flex items-center gap-2">
        {deleteButton}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-primary overflow-hidden">
      {/* Frozen Top Navigation Bar */}
      <div className="flex items-center justify-between px-8 py-4 bg-bg-primary border-b border-line shrink-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/manager/sprints', { state: { fromTab } })}
            className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors text-sm font-bold bg-bg-secondary hover:bg-line px-3 py-1.5 rounded"
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
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight mb-4">{sprint.sprintName}</h1>
          
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-text-secondary font-medium mb-6">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-text-muted" />
              <span>{formatDate(sprint.startDate)} <span className="text-text-muted/50 mx-1">→</span> {formatDate(sprint.endDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-text-muted" />
              <span>{taskCount} tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={16} className="text-text-muted" />
              <span>{members.length} members</span>
            </div>
            {sprint.goal && (
              <div className="flex items-center gap-2 bg-bg-secondary px-3 py-1 rounded text-text-primary italic">
                Goal: {sprint.goal}
              </div>
            )}
          </div>

          {(sprint.status === 'active' || sprint.status === 'completed' || sprint.status === 'review') && (
            <div className="bg-bg-card border border-line rounded-xl p-5 mb-8">
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

        {/* Content Body (2-Column Layout) */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column - Task Table */}
          <div className="flex-1 min-w-0">
            <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-4">Task Table</h2>
            <div className="bg-bg-card border border-line rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px] whitespace-nowrap">
                  <thead className="bg-bg-secondary text-text-muted text-[11px] uppercase tracking-wider border-b-2 border-line">
                    <tr>
                      <th className="w-10 px-3 py-3 text-center"></th>
                      <th className="px-4 py-3 font-bold">Task ID</th>
                      <th className="px-4 py-3 font-bold">Assignee</th>
                      <th className="px-4 py-3 font-bold">Priority</th>
                      <th className="px-4 py-3 font-bold">Title</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                      <th className="px-4 py-3 font-bold text-right">Est. Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-light">
                    {tasks.length === 0 ? (
                      <tr><td colSpan="7" className="p-8 text-center text-text-secondary italic text-sm">No tasks in this sprint.</td></tr>
                    ) : tasks.map(task => {
                      const isExpanded = expandedTasks.has(task.taskId);
                      const subtasks = subtasksCache[task.taskId] || [];
                      const isLoadingSubs = loadingSubtasks.has(task.taskId);
                      return (
                        <Fragment key={task.id}>
                          <tr className={`group h-12 hover:bg-bg-secondary/40 transition-colors ${isExpanded ? 'bg-blue-50/10 dark:bg-blue-900/5' : ''}`}>
                            <td className="py-2 px-3 text-center">
                              <button onClick={() => toggleTaskExpanded(task.taskId)} className="p-1 hover:bg-bg-secondary rounded text-text-secondary transition-colors">
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
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold border border-blue-200 dark:border-blue-500/20">{task.assigneeInitials}</div>
                                <span className="font-medium text-text-primary">{task.assigneeName?.split(' ')[0] || 'Unassigned'}</span>
                              </div>
                            </td>
                            <td className="py-2 px-4">{getPriorityDot(task.priority)}</td>
                            <td className="py-2 px-4 font-medium text-text-primary truncate max-w-xs">{task.title}</td>
                            <td className="py-2 px-4">{getStatusBadge(task.status)}</td>
                            <td className="py-2 px-4">
                              <div className="flex items-center justify-end gap-1.5 text-text-secondary font-mono text-xs"><Clock size={12} className="text-text-muted" />{task.estimatedHours || 0}h</div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan="7" className="p-0 border-b border-line">
                                <div className="bg-bg-secondary/40 dark:bg-bg-secondary/20 px-12 py-3 border-l-4 border-accent-blue shadow-inner">
                                  {isLoadingSubs ? (
                                    <div className="flex items-center gap-2 text-sm text-text-secondary py-2"><Loader2 size={16} className="animate-spin" /> Loading subtasks...</div>
                                  ) : subtasks.length === 0 ? (
                                    <div className="text-sm text-text-secondary italic py-2">No subtasks.</div>
                                  ) : (
                                    <table className="w-full text-left text-[12px]">
                                      <thead><tr className="text-[10px] uppercase tracking-wider text-text-muted border-b border-line/50"><th className="pb-2 font-bold">Subtask Title</th><th className="pb-2 font-bold">Status</th><th className="pb-2 font-bold text-right pr-4">Est. Hours</th></tr></thead>
                                      <tbody>
                                        {subtasks.map(sub => (
                                          <tr key={sub.id} className="border-b border-line-light/50 last:border-0 hover:bg-bg-secondary transition-colors"><td className="py-2.5 text-text-secondary font-medium">{sub.title}</td><td className="py-2.5">{getStatusBadge(sub.status)}</td><td className="py-2.5 text-right pr-4 text-text-secondary font-mono text-xs flex items-center justify-end gap-1.5"><Clock size={12} className="text-text-muted"/>{sub.estimatedHours || 0}h</td></tr>
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
                  <div className="text-sm text-text-secondary italic bg-bg-card border border-line rounded-xl p-4 shadow-sm">No notes or attachments.</div>
                )}
                {requirements.notes.map(note => (
                  <div key={note.id} className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700/30 p-4 rounded-xl shadow-sm">
                    <h4 className="text-sm font-bold text-yellow-800 dark:text-yellow-400 mb-1">{note.title}</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-500/80 whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))}
                {requirements.attachments.map(att => (
                  <a key={att.id} href={att.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-bg-card border border-line p-3 rounded-xl shadow-sm hover:bg-bg-secondary transition-colors group">
                    <div className="w-10 h-10 rounded bg-blue-50 dark:bg-blue-900/20 text-accent-blue flex items-center justify-center flex-shrink-0">
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
                <div className="bg-bg-card border border-line rounded-xl p-5 shadow-sm space-y-5">
                  <div className="space-y-3">
                    <label className={`flex items-center gap-3 ${!isManager ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}>
                      <input type="checkbox" checked={dodMet} onChange={(e) => handleChecklistChange('dod', e.target.checked)} disabled={!isManager || savingChecklist} className="w-4 h-4 text-accent-blue rounded border-gray-300 focus:ring-accent-blue" />
                      <span className="text-sm font-medium text-text-primary">DoD criteria met</span>
                    </label>
                    <label className={`flex items-center gap-3 ${!isManager ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}>
                      <input type="checkbox" checked={qaPassed} onChange={(e) => handleChecklistChange('qa', e.target.checked)} disabled={!isManager || savingChecklist} className="w-4 h-4 text-accent-blue rounded border-gray-300 focus:ring-accent-blue" />
                      <span className="text-sm font-medium text-text-primary">QA / testing passed</span>
                    </label>
                    <label className={`flex items-center gap-3 ${!isManager ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}>
                      <input type="checkbox" checked={stakeholderSignoff} onChange={(e) => handleChecklistChange('stake', e.target.checked)} disabled={!isManager || savingChecklist} className="w-4 h-4 text-accent-blue rounded border-gray-300 focus:ring-accent-blue" />
                      <span className="text-sm font-medium text-text-primary">Stakeholder sign-off</span>
                    </label>
                  </div>
                  
                  <div className="pt-4 border-t border-line">
                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Reviewer Notes</label>
                    {isManager ? (
                      <div className="flex flex-col gap-2">
                        <textarea value={reviewerNotes} onChange={(e) => setReviewerNotes(e.target.value)} placeholder="Add feedback..." className="w-full min-h-[80px] p-2.5 text-sm border border-line bg-input-bg text-text-primary rounded focus:ring-1 focus:ring-accent-blue focus:border-accent-blue outline-none resize-y" />
                        <button onClick={handleSaveNotes} disabled={savingNotes || reviewerNotes === sprint.reviewer_notes} className="self-end flex items-center gap-1 bg-bg-secondary hover:bg-dropdown-hover-bg text-text-primary px-3 py-1.5 rounded text-xs font-bold transition-colors disabled:opacity-50"><Save size={14} /> Save Notes</button>
                      </div>
                    ) : (
                      <div className="bg-bg-secondary p-3 rounded text-sm text-text-primary italic">{reviewerNotes || 'No notes provided yet.'}</div>
                    )}
                  </div>
                  
                  <div className="pt-4 flex flex-col gap-3 border-t border-line">
                    {showReturnInput ? (
                      <div className="flex flex-col gap-2">
                        <input type="text" value={returnReason} onChange={(e) => setReturnReason(e.target.value)} placeholder="Reason for return..." className="w-full text-sm p-2 border border-line bg-input-bg text-text-primary rounded focus:ring-1 focus:ring-red-500 outline-none" autoFocus />
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setShowReturnInput(false)} className="text-text-muted hover:text-text-primary text-xs font-bold px-2 py-1.5">Cancel</button>
                          <button onClick={handleReturn} disabled={!returnReason.trim()} className="bg-red-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-red-700 disabled:opacity-50">Confirm Return</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setShowReturnInput(true)} disabled={!isManager} className="w-full flex items-center justify-center gap-1.5 border border-line text-text-secondary hover:text-text-primary hover:bg-dropdown-hover-bg px-4 py-2 rounded text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <CornerUpLeft size={16} /> Send Back to Active
                      </button>
                    )}
                    
                    {!showReturnInput && (
                      <button onClick={handleComplete} disabled={!isManager || !allChecked || completing} className="w-full flex items-center justify-center gap-1.5 bg-accent-blue text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
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
              <div className="bg-bg-card border border-line rounded-xl p-4 shadow-sm space-y-3">
                {members.length === 0 ? (
                  <div className="text-sm text-text-secondary italic">No team members assigned.</div>
                ) : (
                  members.map(member => {
                    const memberTasks = tasks.filter(t => t.assigned_to === member.user_id);
                    const memberHours = memberTasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);
                    return (
                      <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-bg-secondary/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 flex items-center justify-center text-[12px] font-bold border border-blue-200 dark:border-blue-500/20">
                            {member.initials}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-text-primary leading-tight">{member.name}</div>
                            <div className="text-[11px] text-text-secondary capitalize">{member.role}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[11px] font-bold text-text-primary">{memberTasks.length} tasks</div>
                          <div className="text-[11px] text-text-muted flex items-center justify-end gap-1"><Clock size={10} />{memberHours}h</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
