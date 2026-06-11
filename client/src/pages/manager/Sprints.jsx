import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Users, CheckCircle, Clock, Edit2, Trash2, Plus, X, AlertCircle } from 'lucide-react';

export default function Sprints() {
  const { token } = useAuth();
  const [sprints, setSprints] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('created');

  const [showModal, setShowModal] = useState(false);
  const [editSprintId, setEditSprintId] = useState(null);
  const [formError, setFormError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState(null);

  const [formData, setFormData] = useState({
    sprintName: '',
    startDate: '',
    endDate: '',
    priority: 'medium',
    sprintGoal: '',
    description: '',
    members: []
  });

  useEffect(() => {
    fetchSprints();
    fetchEmployees();
  }, [token]);

  const fetchSprints = () => {
    axios.get('/api/sprints', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setSprints(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const fetchEmployees = () => {
    axios.get('/api/users/employees', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setEmployees(res.data))
      .catch(err => console.error(err));
  };

  const openModal = (sprint = null) => {
    if (sprint) {
      setEditSprintId(sprint.sprintId);
      // Fetch full sprint details to get members
      axios.get(`/api/sprints/${sprint.sprintId}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          const data = res.data;
          const mappedMembers = data.tasks.map(t => {
            const memberInfo = data.members.find(m => m.userId === t.assignedTo) || {};
            return {
              userId: t.assignedTo,
              role: memberInfo.role || '',
              taskTitle: t.title,
              featureId: t.feature_id || '',
              estimatedHours: t.estimatedHours || 0
            };
          });

          // Also include members who have no tasks
          data.members.forEach(m => {
            if (!mappedMembers.find(mm => mm.userId === m.userId)) {
              mappedMembers.push({
                userId: m.userId,
                role: m.role || '',
                taskTitle: '',
                featureId: '',
                estimatedHours: m.estimatedHours || 0
              });
            }
          });

          setFormData({
            sprintName: data.sprintName || '',
            startDate: data.startDate || '',
            endDate: data.endDate || '',
            priority: data.priority || 'medium',
            sprintGoal: data.sprintGoal || '',
            description: data.description || '',
            members: mappedMembers
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
      setFormData({
        sprintName: '',
        startDate: '',
        endDate: '',
        priority: 'medium',
        sprintGoal: '',
        description: '',
        members: []
      });
      setFormError('');
      setShowModal(true);
    }
  };

  const handleCreateOrEditSprint = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
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

    try {
      if (editSprintId) {
        await axios.put(`/api/sprints/${editSprintId}`, formData, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post('/api/sprints', formData, { headers: { Authorization: `Bearer ${token}` } });
      }
      setShowModal(false);
      fetchSprints();
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.error || 'Failed to save sprint');
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
      members: [...formData.members, { userId: parseInt(userId), role: '', taskTitle: '', featureId: '', estimatedHours: '' }]
    });
  };

  const updateMember = (index, field, value) => {
    const updated = [...formData.members];
    updated[index][field] = value;
    setFormData({ ...formData, members: updated });
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

  const filteredSprints = sprints.filter(s => s.status === activeTab);

  if (loading) return <div>Loading sprints...</div>;

  return (
    <div className="pb-10">
      <div className="page-header flex justify-between items-start mb-6">
        <div>
          <h1 className="text-xl font-medium mb-1">Sprints</h1>
          <p className="text-text-secondary text-sm">Manage sprint lifecycle and team workloads.</p>
        </div>
        <button 
          className="bg-[#005AFF] hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm flex items-center gap-2"
          onClick={() => openModal()}
        >
          <Plus size={16} /> New Sprint
        </button>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        {['created', 'planner', 'active', 'completed'].map(mode => (
          <button
            key={mode}
            onClick={() => setActiveTab(mode)}
            className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === mode ? 'text-[#005AFF] border-b-2 border-[#005AFF]' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {mode}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredSprints.map((sprint) => {
          const completionPct = sprint.taskCount > 0 ? Math.round((sprint.doneCount / sprint.taskCount) * 100) : 0;
          
          return (
            <div key={sprint.id} className="bg-white border-[1px] border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-[#020024]">{sprint.sprintId} <span className="text-gray-500 font-medium ml-1">{sprint.sprintName}</span></span>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    sprint.status === 'active' ? 'bg-blue-100 text-blue-700' :
                    sprint.status === 'completed' ? 'bg-green-100 text-green-700' :
                    sprint.status === 'planner' ? 'bg-purple-100 text-purple-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {sprint.status}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {(sprint.status === 'created' || sprint.status === 'planner') && (
                    <button onClick={() => openModal(sprint)} className="text-gray-400 hover:text-[#005AFF] transition-colors p-1" title="Edit Sprint">
                      <Edit2 size={16} />
                    </button>
                  )}
                  {confirmDeleteId === sprint.sprintId ? (
                    <button onClick={() => handleDeleteSprint(sprint.sprintId)} className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold hover:bg-red-600 transition-colors">
                      Confirm Delete
                    </button>
                  ) : (
                    <button onClick={() => handleDeleteSprint(sprint.sprintId)} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="Delete Sprint">
                      <Trash2 size={16} />
                    </button>
                  )}
                  {sprint.status === 'created' && (
                    <button onClick={() => handleStatusChange(sprint.sprintId, 'planner')} className="bg-purple-50 text-purple-700 px-3 py-1 rounded text-[12px] font-bold hover:bg-purple-100 transition-colors">
                      Move to Planner
                    </button>
                  )}
                  {sprint.status === 'planner' && (
                    <button onClick={() => handleStatusChange(sprint.sprintId, 'active')} className="bg-[#005AFF] text-white px-3 py-1 rounded text-[12px] font-bold hover:bg-blue-700 transition-colors">
                      Start Sprint
                    </button>
                  )}
                  {sprint.status === 'active' && (
                    <button onClick={() => handleStatusChange(sprint.sprintId, 'completed')} className="bg-green-600 text-white px-3 py-1 rounded text-[12px] font-bold hover:bg-green-700 transition-colors">
                      Complete Sprint
                    </button>
                  )}
                  {sprint.status === 'completed' && (
                    <button onClick={() => openReport(sprint.sprintId)} className="bg-gray-800 text-white px-3 py-1 rounded text-[12px] font-bold hover:bg-gray-900 transition-colors">
                      View Report
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-gray-500 mb-5 font-medium">
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-gray-400" />
                  {formatDate(sprint.startDate)} → {formatDate(sprint.endDate)}
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-gray-400" />
                  {sprint.taskCount} tasks
                </div>
                <div className="flex items-center gap-1.5">
                  <Users size={14} className="text-gray-400" />
                  {sprint.memberCount} members
                </div>
              </div>

              {(sprint.status === 'active' || sprint.status === 'completed') && (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#005AFF] rounded-full transition-all duration-500" style={{ width: `${completionPct}%` }} />
                    </div>
                    <span className="text-[12px] font-bold text-gray-600 min-w-[32px] text-right">{completionPct}%</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-[12px] font-semibold text-gray-500"><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>Done: <span className="text-gray-900 ml-0.5">{sprint.doneCount}</span></span>
                    <span className="text-[12px] font-semibold text-gray-500"><span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span>In Progress: <span className="text-gray-900 ml-0.5">{sprint.taskCount - sprint.doneCount}</span></span>
                  </div>
                </>
              )}
            </div>
          );
        })}
        {filteredSprints.length === 0 && (
          <div className="text-center py-10 text-gray-500 border border-dashed border-gray-300 rounded-lg bg-gray-50">
            No sprints found in {activeTab} mode.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-[#020024]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[800px] max-h-[90vh] flex flex-col overflow-hidden animate-[slideUp_0.3s_ease-out]">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-[#020024] uppercase tracking-tight">
                {editSprintId ? `Edit Sprint: ${editSprintId}` : 'Create New Sprint'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm font-medium flex items-center gap-2">
                  <AlertCircle size={16} />
                  {formError}
                </div>
              )}
              <div className="space-y-6">
                
                {/* Basic Details */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-4">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Basic Details</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Sprint Name *</label>
                      <input type="text" className="w-full px-3 py-2 border-[1.5px] border-gray-300 rounded-md text-sm focus:border-[#005AFF] focus:ring-2 focus:ring-blue-600/10 outline-none" value={formData.sprintName} onChange={e => setFormData({...formData, sprintName: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Sprint Goal</label>
                      <input type="text" className="w-full px-3 py-2 border-[1.5px] border-gray-300 rounded-md text-sm focus:border-[#005AFF] focus:ring-2 focus:ring-blue-600/10 outline-none" value={formData.sprintGoal} onChange={e => setFormData({...formData, sprintGoal: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Start Date *</label>
                      <input type="date" className="w-full px-3 py-2 border-[1.5px] border-gray-300 rounded-md text-sm focus:border-[#005AFF] focus:ring-2 focus:ring-blue-600/10 outline-none" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">End Date *</label>
                      <input type="date" className="w-full px-3 py-2 border-[1.5px] border-gray-300 rounded-md text-sm focus:border-[#005AFF] focus:ring-2 focus:ring-blue-600/10 outline-none" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Description</label>
                      <textarea className="w-full px-3 py-2 border-[1.5px] border-gray-300 rounded-md text-sm focus:border-[#005AFF] focus:ring-2 focus:ring-blue-600/10 outline-none" rows="2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                    </div>
                  </div>
                </div>

                {/* Team Members */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Team Member Assignment</h3>
                    <div className="flex items-center gap-2">
                      <select className="px-3 py-1.5 border-[1.5px] border-gray-300 rounded-md text-xs focus:border-[#005AFF] outline-none" onChange={(e) => { addMember(e.target.value); e.target.value = ''; }}>
                        <option value="">+ Assign Member</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {formData.members.map((member, idx) => {
                      const empDetails = employees.find(e => e.id === member.userId);
                      return (
                        <div key={idx} className="bg-white p-3 border border-gray-200 rounded-md relative shadow-sm">
                          <button type="button" onClick={() => removeMember(idx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X size={14}/></button>
                          
                          <div className="font-bold text-sm text-[#020024] mb-3">{empDetails?.name || 'Unknown'}</div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Feature ID</label>
                              <input type="text" placeholder="e.g. FEAT-101" className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:border-[#005AFF] outline-none" value={member.featureId} onChange={e => updateMember(idx, 'featureId', e.target.value)} />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Role</label>
                              <select className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:border-[#005AFF] outline-none" value={member.role} onChange={e => updateMember(idx, 'role', e.target.value)}>
                                <option value="">Select Role...</option>
                                <option value="Developer">Developer</option>
                                <option value="Tester">Tester</option>
                                <option value="Designer">Designer</option>
                                <option value="DevOps">DevOps</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Assigned Task</label>
                              <input type="text" placeholder="Task summary" className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:border-[#005AFF] outline-none" value={member.taskTitle} onChange={e => updateMember(idx, 'taskTitle', e.target.value)} />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Est. Hours</label>
                              <input type="number" placeholder="0" className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:border-[#005AFF] outline-none" value={member.estimatedHours} onChange={e => updateMember(idx, 'estimatedHours', e.target.value)} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {formData.members.length === 0 && (
                      <div className="text-center py-4 text-xs text-gray-400 bg-white border border-dashed border-gray-200 rounded-md">
                        No members assigned yet.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
              <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors">
                Cancel
              </button>
              <button type="button" onClick={handleCreateOrEditSprint} className="px-6 py-2.5 text-sm font-bold bg-[#005AFF] text-white rounded-md hover:bg-blue-700 shadow-sm transition-colors uppercase tracking-wider">
                {editSprintId ? 'Save Changes' : 'Create Sprint'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && reportData && (
        <div className="fixed inset-0 bg-[#020024]/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[900px] max-h-[90vh] flex flex-col overflow-hidden animate-[slideUp_0.3s_ease-out]">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-[#020024] uppercase tracking-tight">Sprint Report: {reportData.sprint.sprint_id}</h2>
                <div className="text-sm text-gray-500 font-medium mt-1">{reportData.sprint.sprint_name}</div>
              </div>
              <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Dates</div>
                  <div className="text-sm font-bold text-[#020024]">{formatDate(reportData.sprint.start_date)} - {formatDate(reportData.sprint.end_date)}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Goal</div>
                  <div className="text-sm font-bold text-[#020024]">{reportData.sprint.sprint_goal || 'None'}</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="text-[10px] text-green-700 font-bold uppercase tracking-wider mb-1">Total Effort Logged</div>
                  <div className="text-lg font-bold text-green-700">{reportData.members.reduce((sum, m) => sum + m.spentHours, 0)}h</div>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="text-[10px] text-amber-700 font-bold uppercase tracking-wider mb-1">Unresolved Queries</div>
                  <div className="text-lg font-bold text-amber-700">{reportData.unresolvedQueries.length}</div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#020024] uppercase tracking-wider mb-3">Team Performance</h3>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-wider border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 font-bold">Member</th>
                        <th className="px-4 py-3 font-bold">Role</th>
                        <th className="px-4 py-3 font-bold">Tasks Assigned</th>
                        <th className="px-4 py-3 font-bold">Subtasks Completed</th>
                        <th className="px-4 py-3 font-bold">Hours (Est vs Actual)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reportData.members.map((m, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-medium text-[#020024]">{m.name}</td>
                          <td className="px-4 py-3 text-gray-500">{m.role || '-'}</td>
                          <td className="px-4 py-3 text-gray-500">{m.tasks.length}</td>
                          <td className="px-4 py-3 text-gray-500">
                            {m.subtaskDoneCount} / {m.subtaskCount}
                            <div className="w-full bg-gray-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                              <div className="bg-[#005AFF] h-full" style={{ width: `${m.subtaskCount ? (m.subtaskDoneCount / m.subtaskCount) * 100 : 0}%` }}></div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-500 font-medium">
                            <span className={m.spentHours > m.estimatedHours ? "text-red-500" : "text-green-600"}>{m.spentHours}h</span> 
                            <span className="text-gray-300 mx-1">/</span> 
                            {m.estimatedHours}h
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {reportData.unresolvedQueries.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <AlertCircle size={16} /> Unresolved Queries
                  </h3>
                  <div className="space-y-2">
                    {reportData.unresolvedQueries.map(q => (
                      <div key={q.id} className="p-3 bg-amber-50 border border-amber-100 rounded-md text-sm">
                        <span className="font-bold text-[#020024]">{q.raiserName}:</span> <span className="text-amber-800">{q.query_text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
