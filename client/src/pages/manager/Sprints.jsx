import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Users, CheckCircle, Clock, Edit2, Trash2, Plus, X, AlertCircle, FileText, Paperclip, ChevronDown, ChevronRight, Search, Flag, Video } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import { useNavigate, useLocation } from 'react-router-dom';

const calculateWorkingDays = (start, end) => {
  if (!start || !end) return 0;
  const d1 = new Date(start);
  const d2 = new Date(end);
  if (isNaN(d1) || isNaN(d2) || d1 > d2) return 0;
  
  let days = 0;
  let current = new Date(d1);
  while (current <= d2) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) days++;
    current.setDate(current.getDate() + 1);
  }
  return days;
};

export default function Sprints() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sprints, setSprints] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(location.state?.fromTab || 'created');
  const [searchQuery, setSearchQuery] = useState('');
  const [sprintMeetingToEnd, setSprintMeetingToEnd] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editSprintId, setEditSprintId] = useState(null);
  const [editSprintStatus, setEditSprintStatus] = useState(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmReviewSprintId, setConfirmReviewSprintId] = useState(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [expandedMembers, setExpandedMembers] = useState(new Set());
  const [expandedSprintId, setExpandedSprintId] = useState(null);
  const [backlogItems, setBacklogItems] = useState([]);
  
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState(null);

  const [openPriorityDropdown, setOpenPriorityDropdown] = useState(null);
  const [isAddingReference, setIsAddingReference] = useState(false);
  const [editingReferenceIdx, setEditingReferenceIdx] = useState(null);
  const [tempRefNote, setTempRefNote] = useState('');
  const [tempRefFile, setTempRefFile] = useState(null);
  const [referenceError, setReferenceError] = useState('');
  const fileInputRef = useRef(null);

  const priorityOptions = [
    { value: 'critical', label: 'Critical', color: 'bg-red-500', flagColor: 'text-red-500 fill-red-500/20' },
    { value: 'high', label: 'High', color: 'bg-orange-500', flagColor: 'text-orange-500 fill-orange-500/20' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-500', flagColor: 'text-blue-500 fill-blue-500/20' },
    { value: 'low', label: 'Low', color: 'bg-green-500', flagColor: 'text-green-500 fill-green-500/20' }
  ];

  const [formData, setFormData] = useState({
    sprintName: '',
    startDate: '',
    endDate: '',
    priority: 'medium',
    sprintGoal: '',
    description: '',
    owner_id: '',
    members: [],
    notes: [],
    attachments: []
  });

  useEffect(() => {
    fetchSprints();
    fetchEmployees();
    fetchBacklog();
  }, [token]);

  const fetchBacklog = async () => {
    try {
      const res = await axios.get('/api/backlog', { headers: { Authorization: `Bearer ${token}` } });
      setBacklogItems(res.data);
    } catch (err) {
      console.error('Failed to fetch backlog', err);
    }
  };

  // Check if we navigated back from a detail page wanting to edit
  useEffect(() => {
    if (location.state?.editSprintId && sprints.length > 0) {
      const s = sprints.find(sp => sp.sprintId === location.state.editSprintId);
      if (s) {
        openModal(s);
        // Clear the state so it doesn't trigger again on reload/back
        navigate('.', { replace: true, state: { ...location.state, editSprintId: undefined } });
      }
    }
  }, [location.state?.editSprintId, sprints, navigate]);

  // Check if we navigated back from a detail page wanting to view a report
  useEffect(() => {
    if (location.state?.viewReportSprintId && sprints.length > 0) {
      openReport(location.state.viewReportSprintId);
      // Clear the state so it doesn't trigger again on reload/back
      navigate('.', { replace: true, state: { ...location.state, viewReportSprintId: undefined } });
    }
  }, [location.state?.viewReportSprintId, sprints, navigate]);

  const fetchSprints = () => {
    axios.get('/api/sprints', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setSprints(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const fetchEmployees = () => {
    axios.get('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setEmployees(res.data))
      .catch(err => console.error(err));
    if (user?.role === 'administrator') {
      axios.get('/api/users/managers', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setManagers(res.data))
        .catch(err => console.error(err));
    }
  };

  const openModal = (sprint = null) => {
    if (employees.length === 0) fetchEmployees();
    if (sprint) {
      setEditSprintId(sprint.sprintId);
      setEditSprintStatus(sprint.status);
      // Fetch full sprint details to get members
      axios.get(`/api/sprints/${sprint.sprintId}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          const data = res.data;
          const mappedMembers = data.members.map(m => {
            const memberTasks = data.tasks.filter(t => t.assignedTo === m.userId);
            
            // Assume featureId is the same for all tasks of a member (as per current schema constraints in UI)
            const featureId = memberTasks.length > 0 ? (memberTasks[0].featureId || memberTasks[0].feature_id || '') : '';
            
            return {
              userId: m.userId,
              role: m.role || '',
              featureId: featureId,
              tasks: memberTasks.length > 0 ? memberTasks.map(t => ({
                title: t.title || '',
                description: t.description || '',
                estimatedHours: t.estimatedHours || 0,
                priority: t.priority || 'medium',
                subtasksList: t.subtasksList || []
              })) : [{ title: '', description: '', estimatedHours: '', priority: 'medium', subtasksList: [] }]
            };
          });

          setFormData({
            sprintName: data.sprintName || '',
            startDate: data.startDate || '',
            endDate: data.endDate || '',
            priority: data.priority || 'medium',
            sprintGoal: data.sprintGoal || '',
            description: data.description || '',
            owner_id: data.ownerId || '',
            members: mappedMembers,
            notes: data.notes || [],
            attachments: data.attachments || []
          });
          setFormError('');
          setShowModal(true);
        })
        .catch(err => {
          console.error(err);
          setFormError('Failed to load sprint details');
        });
    } else {
      setEditSprintId(null);
      setEditSprintStatus(null);
      setFormData({
        sprintName: '',
        startDate: '',
        endDate: '',
        priority: 'medium',
        sprintGoal: '',
        description: '',
        owner_id: '',
        members: [],
        notes: [],
        attachments: []
      });
      setFormError('');
      setShowModal(true);
    }
  };

  const handleCreateOrEditSprint = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (submitting) return;
    setFormError('');

    if (!formData.sprintName?.trim()) {
      return setFormError("Please enter a Sprint Name.");
    }
    if (!formData.startDate) {
      return setFormError("Please select a Start Date.");
    }
    if (!formData.endDate) {
      return setFormError("Please select an End Date.");
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      return setFormError("End Date cannot be before Start Date.");
    }

    setSubmitting(true);
    
    // Map UI-only priorities to database-safe values before sending
    const payload = JSON.parse(JSON.stringify(formData));
    if (payload.priority === 'lowest') payload.priority = 'low';
    if (payload.members) {
      payload.members.forEach(m => {
        if (m.tasks) {
          m.tasks.forEach(t => {
            if (t.priority === 'lowest') t.priority = 'low';
          });
        }
      });
    }

    try {
      if (editSprintId) {
        await axios.put(`/api/sprints/${editSprintId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post('/api/sprints', payload, { headers: { Authorization: `Bearer ${token}` } });
      }
      setShowModal(false);
      fetchSprints();
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.error || 'Failed to save sprint');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (sprintId, newStatus) => {
    try {
      await axios.patch(`/api/sprints/${sprintId}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      fetchSprints();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to change status');
    }
  };

  const handleStartMeeting = async (e, sprintId) => {
    e.stopPropagation();
    try {
      await axios.post(`/api/sprints/${sprintId}/meeting`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchSprints();
    } catch (err) {
      console.error(err);
      alert('Failed to start meeting');
    }
  };

  const handleEndMeeting = (e, sprintId) => {
    e.stopPropagation();
    setSprintMeetingToEnd(sprintId);
  };

  const confirmEndMeeting = async () => {
    if (!sprintMeetingToEnd) return;
    const sprintId = sprintMeetingToEnd;
    setSprintMeetingToEnd(null);
    try {
      await axios.delete(`/api/sprints/${sprintId}/meeting`, { headers: { Authorization: `Bearer ${token}` } });
      fetchSprints();
    } catch (err) {
      console.error(err);
      alert('Failed to end meeting');
    }
  };

  const handleDeleteSprint = async (sprintId) => {
    if (confirmDeleteId !== sprintId) {
      setConfirmDeleteId(sprintId);
      setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }
    
    try {
      await axios.delete(`/api/sprints/${sprintId}`, { headers: { Authorization: `Bearer ${token}` } });
      setConfirmDeleteId(null);
      fetchSprints();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete sprint');
    }
  };

  const openReport = async (sprintId) => {
    try {
      const res = await axios.get(`/api/sprints/${sprintId}/report`, { headers: { Authorization: `Bearer ${token}` } });
      setReportData(res.data);
      setShowReportModal(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to load report');
    }
  };

  const addMember = (userId) => {
    if (!userId) return;
    if (formData.members.find(m => m.userId === parseInt(userId))) return;
    setFormData({
      ...formData,
      members: [...formData.members, { 
        userId: parseInt(userId), 
        role: '', 
        featureId: '',
        tasks: [{ title: '', description: '', estimatedHours: '', priority: 'medium' }]
      }]
    });
  };

  const updateMember = (index, field, value) => {
    const updated = [...formData.members];
    updated[index][field] = value;
    setFormData({ ...formData, members: updated });
  };

  const updateMemberTask = (memberIndex, taskIndex, field, value) => {
    const updated = [...formData.members];
    updated[memberIndex].tasks[taskIndex][field] = value;
    setFormData({ ...formData, members: updated });
  };

  const addMemberTaskFromBacklog = (memberIdx, backlogId) => {
    const item = backlogItems.find(b => b.backlog_id === backlogId);
    if (!item) return;

    const newMembers = [...formData.members];
    if (!newMembers[memberIdx].tasks) newMembers[memberIdx].tasks = [];
    newMembers[memberIdx].tasks.push({
      backlog_item_id: item.backlog_id,
      title: item.title,
      description: item.description || '',
      estimatedHours: item.estimated_effort || '',
      priority: item.priority || 'medium',
      status: 'todo'
    });
    setFormData({ ...formData, members: newMembers });
  };

  const removeMemberTask = (memberIndex, taskIndex) => {
    const updated = [...formData.members];
    updated[memberIndex].tasks.splice(taskIndex, 1);
    setFormData({ ...formData, members: updated });
  };

  const handleRefFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setTempRefFile({
      fileName: file.name,
      fileSize: file.size,
      isLocal: true,
      fileObj: file
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const saveReference = () => {
    if (!tempRefNote.trim()) {
      setReferenceError('Note text is required.');
      return;
    }
    const newRef = { title: tempRefNote.substring(0, 30), content: tempRefNote, attachment: tempRefFile };
    const updatedNotes = [...formData.notes];
    if (editingReferenceIdx !== null) {
      updatedNotes[editingReferenceIdx] = newRef;
    } else {
      updatedNotes.push(newRef);
    }
    setFormData({ ...formData, notes: updatedNotes });
    setIsAddingReference(false);
    setEditingReferenceIdx(null);
    setTempRefNote('');
    setTempRefFile(null);
    setReferenceError('');
  };

  const removeReference = (idx) => {
    const updated = [...formData.notes];
    updated.splice(idx, 1);
    setFormData({ ...formData, notes: updated });
  };

  const openReferenceEditor = (idx) => {
    const ref = formData.notes[idx];
    setTempRefNote(ref.content || '');
    setTempRefFile(ref.attachment || null);
    setEditingReferenceIdx(idx);
    setIsAddingReference(true);
    setReferenceError('');
  };

  const removeAttachment = (index) => {
    const updated = [...formData.attachments];
    updated.splice(index, 1);
    setFormData({ ...formData, attachments: updated });
  };

  const removeMember = (index) => {
    const updated = [...formData.members];
    updated.splice(index, 1);
    setFormData({ ...formData, members: updated });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const filteredSprints = React.useMemo(() => {
    return sprints.filter(s => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = q 
        ? (s.sprintName?.toLowerCase() || '').includes(q) || 
          (s.sprintId?.toLowerCase() || '').includes(q)
        : true;
        
      const matchesTab = s.status === activeTab;
      
      return matchesTab && matchesSearch;
    });
  }, [sprints, activeTab, searchQuery]);

  if (loading) return <div>Loading sprints...</div>;

  return (
    <div className="pb-10 relative">
      <div className="sticky top-[-32px] z-10 bg-bg-primary pt-8 pb-2 -mt-8">
        <div className="page-header flex justify-between items-start mb-6">
          <div>
            <h1 className="text-xl font-medium mb-1">Sprints</h1>
            <p className="text-text-secondary text-sm">Manage sprint lifecycle and team workloads.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search sprints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-9 pr-4 py-2 text-sm border border-line bg-input-bg text-text-primary rounded-md focus:ring-1 focus:ring-accent-blue outline-none transition-all shadow-sm"
              />
            </div>
            <button 
              className="bg-accent-blue hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm flex items-center gap-2"
              onClick={() => openModal()}
            >
              <Plus size={16} /> New Sprint
            </button>
          </div>
        </div>

        <div className="flex border-b border-line mb-6">
          {['created', 'planner', 'active', 'review', 'completed'].map(mode => (
            <button
              key={mode === 'review' ? 'READY FOR REVIEW' : mode}
              onClick={() => {
                setActiveTab(mode);
                setSearchQuery(''); // clear search when switching tabs
              }}
              className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === mode ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-text-secondary hover:text-text-primary'}`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>



      <div className="space-y-4">
        {filteredSprints.map((sprint) => {
          const completionPct = sprint.taskCount > 0 ? Math.round((sprint.doneCount / sprint.taskCount) * 100) : 0;
          
          return (
            <div key={sprint.sprintId} className="flex flex-col mb-6">
              <div 
                onClick={() => navigate(`/manager/sprints/${sprint.sprintId}`, { state: { fromTab: activeTab } })}
                className="bg-bg-card border border-line rounded-xl p-0 hover:shadow-xl hover:border-gray-500/30 transition-all duration-300 relative overflow-hidden group cursor-pointer"
              >
                <div className={`absolute left-0 top-0 bottom-0 w-2 ${
                sprint.status === 'active' ? 'bg-blue-600' :
                sprint.status === 'completed' ? 'bg-green-500' :
                sprint.status === 'review' ? 'bg-yellow-500' :
                sprint.status === 'planner' ? 'bg-purple-500' :
                'bg-gray-400'
              }`} />
              
              <div className="flex justify-between items-center p-6">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-mono font-medium text-text-muted">{sprint.sprintId}</span>
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${
                      sprint.status === 'active' ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' :
                      sprint.status === 'completed' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' :
                      sprint.status === 'review' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20' :
                      sprint.status === 'planner' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' :
                      'bg-bg-secondary text-text-secondary border-line'
                    }`}>
                      {sprint.status === 'active' && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>}
                      <span className="text-[10px] font-bold uppercase tracking-wider">{sprint.status}</span>
                    </div>
                    {sprint.status === 'active' && sprint.reviewData && sprint.reviewData.returnReason && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center gap-1" title={sprint.reviewData.returnReason}>
                        <AlertCircle size={10} /> Revision Needed
                      </span>
                    )}
                  </div>
                  <h3 className="text-[22px] font-extrabold text-text-primary tracking-tight mt-1 mb-1">{sprint.sprintName}</h3>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-text-secondary font-medium mt-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-text-muted" />
                      <span>{formatDate(sprint.startDate)} <span className="text-text-muted/50 mx-0.5">→</span> {formatDate(sprint.endDate)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle size={14} className="text-text-muted" />
                      <span>{sprint.taskCount} tasks</span>
                    </div>
                    {sprint.status !== 'created' && (
                      <div className="flex items-center gap-1.5">
                        <Users size={14} className="text-text-muted" />
                        <span>{sprint.memberCount} members</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2 mb-1">
                    {sprint.meetingLink ? (
                      <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 rounded p-1 pr-2 shadow-sm">
                        <button onClick={(e) => { e.stopPropagation(); window.open(sprint.meetingLink, '_blank'); }} className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-[11px] font-bold px-2 py-1 rounded hover:bg-green-500/10 transition-colors" title="Join Meeting">
                          <Video size={14} /> Join
                        </button>
                        <button onClick={(e) => handleEndMeeting(e, sprint.sprintId)} className="text-red-500 text-[11px] font-bold px-2 py-1 rounded hover:bg-red-500/10 transition-colors" title="End Meeting">
                          End
                        </button>
                      </div>
                    ) : (
                      ['planner', 'active', 'review'].includes(sprint.status) && (
                        <button onClick={(e) => handleStartMeeting(e, sprint.sprintId)} className="flex items-center gap-1.5 bg-bg-secondary text-text-secondary border border-line px-2 py-1 rounded text-[11px] font-bold hover:bg-line hover:text-text-primary transition-colors mr-2 shadow-sm" title="Start Meeting">
                          <Video size={14} /> Start Meet
                        </button>
                      )
                    )}
                    {(sprint.status === 'created' || sprint.status === 'planner') && (
                      <button onClick={(e) => { e.stopPropagation(); openModal(sprint); }} className="p-1.5 text-text-muted hover:text-accent-blue hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded transition-colors" title="Edit Sprint">
                        <Edit2 size={16} />
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(sprint.sprintId); }} className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors" title="Delete Sprint">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {!['created', 'planner'].includes(sprint.status) && (
                    <>
                      <span className="text-2xl font-extrabold text-text-primary tracking-tight">{completionPct}%</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Completed</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {sprint.taskCount > 0 && !['created', 'planner'].includes(sprint.status) && (
                <div className="px-6 pb-6">
                  <div className="w-full flex h-2 rounded-full overflow-hidden bg-bg-secondary shadow-inner gap-[1px]">
                    <div className="h-full bg-green-500 transition-all duration-700" style={{ width: `${(sprint.doneCount / sprint.taskCount) * 100}%` }}></div>
                    <div className="h-full bg-blue-500 transition-all duration-700" style={{ width: `${((sprint.inProgressCount || 0) / sprint.taskCount) * 100}%` }}></div>
                    <div className="h-full bg-red-500 transition-all duration-700" style={{ width: `${((sprint.blockedCount || 0) / sprint.taskCount) * 100}%` }}></div>
                    <div className="h-full bg-gray-400 transition-all duration-700" style={{ width: `${((sprint.todoCount || 0) / sprint.taskCount) * 100}%` }}></div>
                  </div>
                </div>
              )}
            </div>
            </div>
          );
        })}
        {filteredSprints.length === 0 && (
          <div className="text-center py-10 text-text-secondary">
            {searchQuery.trim() 
              ? `No sprints found matching "${searchQuery}" in ${activeTab} mode.` 
              : (activeTab === 'review' ? 'No sprints are currently awaiting review. Sprints moved from Active will appear here for QA and stakeholder sign-off.' : `No sprints found in ${activeTab} mode.`)}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.65)] backdrop-blur-[2px] flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div 
            className="bg-bg-card rounded-xl flex flex-col overflow-hidden shadow-2xl shadow-black/50"
            style={{ width: 'max(860px, 75vw)', maxWidth: '960px', minHeight: '80vh' }}
          >
            {/* Header */}
            <div className="px-8 py-5 border-b border-line flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-[20px] font-bold text-text-primary leading-tight">
                    {editSprintId ? `Edit Sprint: ${editSprintId}` : 'Create New Sprint'}
                  </h2>
                  <p className="text-[14px] text-text-muted mt-0.5">Define details, assign members, and attach requirements</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-text-primary transition-colors p-1.5 rounded hover:bg-black/5">
                <X size={20} />
              </button>
            </div>
            
            {/* Body */}
            <div 
              className="px-8 py-6 overflow-y-auto flex-1 custom-scrollbar"
              style={{ maxHeight: 'calc(80vh - 120px)' }}
            >
              {formError && (
                <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded text-[12px] font-medium flex items-center gap-2">
                  <AlertCircle size={14} />
                  {formError}
                </div>
              )}
              <div className="space-y-7">
                
                {/* Basic Details */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-[4px] h-5 bg-gradient-to-b from-accent-blue to-blue-600 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                    <h3 className="text-[13px] font-extrabold text-text-primary uppercase tracking-wider">Basic Details</h3>
                    <span className="text-[12px] text-text-muted ml-auto">* Required</span>
                  </div>
                  
                    <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Sprint Name <span className="text-accent-blue">*</span></label>
                      <input type="text" placeholder="e.g. Q3 Mobile Overhaul" className="w-full h-10 px-3 border border-line bg-bg-primary rounded-md text-[14px] text-text-primary placeholder-text-muted/70 focus:border-accent-blue focus:ring-4 focus:ring-accent-blue/15 shadow-inner outline-none transition-all disabled:bg-bg-secondary disabled:text-text-muted" disabled={editSprintStatus === 'active'} value={formData.sprintName} onChange={e => setFormData({...formData, sprintName: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Start Date <span className="text-accent-blue">*</span></label>
                      <div className="relative">
                        <input type="date" className="w-full h-10 pl-3 pr-8 border border-line bg-bg-primary rounded-md text-[14px] text-text-primary focus:border-accent-blue focus:ring-4 focus:ring-accent-blue/15 shadow-inner outline-none transition-all disabled:bg-bg-secondary disabled:text-text-muted appearance-none relative z-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer" disabled={editSprintStatus === 'active'} value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                        <Calendar size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted pointer-events-none z-0" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">End Date <span className="text-accent-blue">*</span></label>
                      <div className="relative">
                        <input type="date" className="w-full h-10 pl-3 pr-8 border border-line bg-bg-primary rounded-md text-[14px] text-text-primary focus:border-accent-blue focus:ring-4 focus:ring-accent-blue/15 shadow-inner outline-none transition-all disabled:bg-bg-secondary disabled:text-text-muted appearance-none relative z-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer" disabled={editSprintStatus === 'active'} value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                        <Calendar size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted pointer-events-none z-0" />
                      </div>
                    </div>
                    
                    {(formData.startDate && formData.endDate) && (
                      <div className="col-span-2 -mt-1">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent-blue/10 text-accent-blue text-[12px] font-bold rounded-md">
                           <Clock size={12} /> {calculateWorkingDays(formData.startDate, formData.endDate)} working days
                        </div>
                      </div>
                    )}

                    <div className="col-span-2 relative">
                      <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Description</label>
                      <textarea placeholder="High-level details about this sprint..." className="w-full min-h-[80px] px-3 py-2.5 border border-line bg-bg-primary rounded-md text-[14px] text-text-primary placeholder-text-muted/70 focus:border-accent-blue focus:ring-4 focus:ring-accent-blue/15 shadow-inner outline-none transition-all resize-y disabled:bg-bg-secondary disabled:text-text-muted" disabled={editSprintStatus === 'active'} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                      <div className="absolute bottom-1.5 right-2 text-[10px] text-text-muted pointer-events-none">
                        {(formData.description || '').length} / 500
                      </div>
                    </div>
                  </div>
                </div>



              </div>
            </div>
            
            {/* Footer */}
            <div className="px-8 py-5 border-t border-line flex justify-end gap-2.5 shrink-0 bg-bg-card">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-1.5 text-[13px] font-semibold text-text-secondary hover:text-text-primary transition-colors">
                {editSprintStatus === 'active' ? 'Close' : 'Cancel'}
              </button>
              {editSprintStatus !== 'active' && (
                <button type="button" onClick={handleCreateOrEditSprint} disabled={submitting} className="h-10 px-6 text-[14px] font-bold bg-gradient-to-r from-accent-blue to-blue-600 text-white rounded-md hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-accent-blue/30 transition-all disabled:opacity-70 flex items-center justify-center gap-2">
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      {editSprintId ? 'Save Changes' : <>Create Sprint</>}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}


      

      {/* Report Modal */}
      {showReportModal && reportData && (
        <div className="fixed inset-0 bg-[#020024]/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-bg-card rounded-xl shadow-2xl w-full max-w-[900px] max-h-[90vh] flex flex-col overflow-hidden animate-[slideUp_0.3s_ease-out]">
            <div className="px-6 py-5 border-b border-line flex justify-between items-center bg-bg-card">
              <div>
                <h2 className="text-xl font-bold text-text-primary uppercase tracking-tight">Sprint Report: {reportData.sprint.sprint_id}</h2>
                <div className="text-sm text-text-secondary font-medium mt-1">{reportData.sprint.sprint_name}</div>
              </div>
              <button onClick={() => setShowReportModal(false)} className="text-text-muted hover:text-text-primary transition-colors bg-bg-secondary p-1.5 rounded-full">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-bg-secondary/50 rounded-xl border border-line hover:border-line-light transition-colors">
                  <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider mb-1">Dates</div>
                  <div className="text-[13px] font-bold text-text-primary">{formatDate(reportData.sprint.start_date)} <span className="text-text-muted font-normal mx-0.5">→</span> {formatDate(reportData.sprint.end_date)}</div>
                </div>
                <div className="p-4 bg-bg-secondary/50 rounded-xl border border-line hover:border-line-light transition-colors">
                  <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider mb-1">Goal</div>
                  <div className="text-[13px] font-bold text-text-primary line-clamp-2" title={reportData.sprint.sprint_goal}>{reportData.sprint.sprint_goal || 'None'}</div>
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/20">
                  <div className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider mb-1">Unresolved Queries</div>
                  <div className="text-xl font-extrabold text-amber-700 dark:text-amber-400">{reportData.unresolvedQueries.length}</div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3">Team Performance</h3>
                <div className="overflow-x-auto border border-line rounded-lg">
                  <table className="w-full text-left text-[13px] whitespace-nowrap">
                    <thead className="bg-bg-secondary text-text-secondary text-[11px] uppercase tracking-wider border-b border-line">
                      <tr>
                        <th className="px-5 py-3 font-bold">Member</th>
                        <th className="px-5 py-3 font-bold">Role</th>
                        <th className="px-5 py-3 font-bold">Tasks Assigned</th>
                        <th className="px-5 py-3 font-bold w-1/4">Subtasks Completed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {reportData.members.map((m, idx) => (
                        <tr key={idx} className="hover:bg-bg-secondary/30 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-text-primary">{m.name}</td>
                          <td className="px-5 py-3.5 text-text-secondary">{m.role || '-'}</td>
                          <td className="px-5 py-3.5 text-text-secondary font-medium">{m.tasks.length}</td>
                          <td className="px-5 py-3.5 text-text-secondary font-medium">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px]">{m.subtaskDoneCount} / {m.subtaskCount}</span>
                              <span className="text-[11px] font-bold text-text-primary">{m.subtaskCount ? Math.round((m.subtaskDoneCount / m.subtaskCount) * 100) : 0}%</span>
                            </div>
                            <div className="w-full bg-bg-secondary shadow-inner h-1.5 rounded-full overflow-hidden">
                              <div className="bg-accent-blue h-full transition-all duration-500 rounded-full" style={{ width: `${m.subtaskCount ? (m.subtaskDoneCount / m.subtaskCount) * 100 : 0}%` }}></div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {reportData.unresolvedQueries.length > 0 && (
                <div>
                  <h3 className="text-[13px] font-bold text-amber-700 dark:text-amber-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <AlertCircle size={16} /> Unresolved Queries
                  </h3>
                  <div className="space-y-2.5">
                    {reportData.unresolvedQueries.map(q => (
                      <div key={q.id} className="p-3.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-[13px] leading-relaxed shadow-sm">
                        <span className="font-extrabold text-amber-900 dark:text-amber-300">{q.raiserName}:</span> <span className="text-amber-800 dark:text-amber-100/90 ml-1">{q.query_text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!sprintMeetingToEnd}
        onCancel={() => setSprintMeetingToEnd(null)}
        onConfirm={confirmEndMeeting}
        title="End Meeting?"
        bodyText="Are you sure you want to end the meeting for everyone? This action cannot be undone."
        confirmText="End Meeting"
        iconType="danger"
      />
    </div>
  );
}
