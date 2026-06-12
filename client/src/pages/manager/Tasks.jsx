import React, { useState, useEffect, useRef, useMemo, Fragment } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { ChevronDown, ChevronRight, Search, Filter, CheckCircle2, AlertCircle, Clock, PlayCircle, Loader2 } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function Tasks() {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [sprints, setSprints] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedSprintId, setSelectedSprintId] = useState('all');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [subtasksCache, setSubtasksCache] = useState({});
  const [loadingSubtasks, setLoadingSubtasks] = useState(new Set());
  
  // For "All Sprints" view to keep sprints expanded/collapsed
  const [expandedSprints, setExpandedSprints] = useState(new Set()); 
  
  const [filters, setFilters] = useState({ employee: 'all', status: 'all', search: '' });

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Fetch all sprints on mount
  useEffect(() => {
    if (token) {
      axios.get('/api/sprints', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          const fetchedSprints = res.data;
          setSprints(fetchedSprints);
          
          let initialSprintId = searchParams.get('sprint_id');
          if (!initialSprintId && fetchedSprints.length > 0) {
            const active = fetchedSprints.find(s => s.status === 'active');
            initialSprintId = active ? active.sprintId : fetchedSprints[0].sprintId;
          }
          
          if (initialSprintId) {
            setSelectedSprintId(initialSprintId);
          }
        })
        .catch(err => console.error('Failed to fetch sprints:', err));
    }
  }, [token]);

  // 2. Fetch tasks when selectedSprintId changes
  useEffect(() => {
    if (!token || !selectedSprintId) return;
    
    setLoading(true);
    const url = selectedSprintId === 'all' 
      ? '/api/tasks' 
      : `/api/tasks?sprintId=${selectedSprintId}`;

    axios.get(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setTasks(res.data);
        if (selectedSprintId === 'all') {
          // Auto-expand all sprints initially
          const sprintIds = new Set(res.data.map(t => t.sprintId));
          setExpandedSprints(sprintIds);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [token, selectedSprintId]);

  // 3. Lazy Load Subtasks
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
        console.error('Failed to fetch subtasks', err);
      } finally {
        setLoadingSubtasks(prev => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
      }
    }
  };

  const toggleSprintExpanded = (sprintId) => {
    const newExpanded = new Set(expandedSprints);
    if (newExpanded.has(sprintId)) newExpanded.delete(sprintId);
    else newExpanded.add(sprintId);
    setExpandedSprints(newExpanded);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'done': return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-max"><CheckCircle2 size={10}/>Done</span>;
      case 'inprogress': return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-max"><PlayCircle size={10}/>In Progress</span>;
      case 'blocked': return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-max"><AlertCircle size={10}/>Blocked</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-max"><Clock size={10}/>To Do</span>;
    }
  };

  const getSprintBadgeColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'planner': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // 4. Filtering Logic (applies only to Main Tasks per requirements)
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchEmp = filters.employee === 'all' || t.assigneeName === filters.employee;
      const matchStatus = filters.status === 'all' || t.status === filters.status;
      const term = filters.search.toLowerCase();
      const matchSearch = term === '' || 
        t.taskId.toLowerCase().includes(term) || 
        t.title.toLowerCase().includes(term) || 
        (t.assigneeName && t.assigneeName.toLowerCase().includes(term));
      return matchEmp && matchStatus && matchSearch;
    });
  }, [tasks, filters]);

  // Derived values for dropdowns
  const uniqueEmployees = [...new Set(tasks.map(t => t.assigneeName).filter(Boolean))];
  const selectedSprintDetails = sprints.find(s => s.sprintId === selectedSprintId);

  // Sprint Summary Calculations (only for a selected sprint)
  const sprintSummary = useMemo(() => {
    if (selectedSprintId === 'all') return null;
    let totalEst = 0;
    let totalSpent = 0;
    let subtasksCount = 0;
    const statusCounts = { todo: 0, inprogress: 0, blocked: 0, done: 0 };
    
    tasks.forEach(t => {
      totalEst += (t.estimatedHours || 0);
      totalSpent += (t.spentHours || 0);
      subtasksCount += (t.subtaskCount || 0);
      if (statusCounts[t.status] !== undefined) statusCounts[t.status]++;
    });
    return { totalEst, totalSpent, subtasksCount, statusCounts };
  }, [tasks, selectedSprintId]);

  const renderTaskRow = (task) => {
    const isExpanded = expandedTasks.has(task.taskId);
    const subtasks = subtasksCache[task.taskId] || [];
    const isLoadingSubs = loadingSubtasks.has(task.taskId);
    
    return (
      <Fragment key={task.id}>
        <tr className={`border-b-[0.5px] border-border-light hover:bg-bg-secondary transition-colors text-[13px] ${isExpanded ? 'bg-blue-50/30' : ''}`}>
          <td className="py-2.5 px-3 w-10 text-center">
            <button 
              onClick={() => toggleTaskExpanded(task.taskId)}
              className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors"
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          </td>
          <td className="py-2.5 px-4 font-bold text-[#005AFF] cursor-pointer hover:underline" onClick={() => navigate(`/manager/tasks/${task.taskId}`)}>
            {task.taskId}
          </td>
          <td className="py-2.5 px-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[10px] font-bold border border-blue-200">
                {task.assigneeInitials}
              </div>
              <span className="font-medium">{task.assigneeName?.split(' ')[0] || 'Unassigned'}</span>
            </div>
          </td>
          <td className="py-2.5 px-4 font-medium text-gray-800 truncate max-w-xs">{task.title}</td>
          <td className="py-2.5 px-4">{getStatusBadge(task.status)}</td>
          <td className="py-2.5 px-4 text-gray-600 font-mono text-xs">{task.estimatedHours || 0}h</td>
          <td className="py-2.5 px-4 text-gray-600 font-mono text-xs">{task.spentHours || 0}h</td>
          <td className="py-2.5 px-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-gray-500">{task.subtaskDoneCount}/{task.subtaskCount}</span>
              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#005AFF]" 
                  style={{ width: `${task.subtaskCount > 0 ? (task.subtaskDoneCount / task.subtaskCount) * 100 : 0}%` }}
                />
              </div>
            </div>
          </td>
        </tr>
        
        {isExpanded && (
          <tr>
            <td colSpan="8" className="p-0 border-b border-gray-200">
              <div className="bg-gray-50/80 px-12 py-3 border-l-4 border-[#005AFF]">
                {isLoadingSubs ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                    <Loader2 size={16} className="animate-spin" /> Loading subtasks...
                  </div>
                ) : subtasks.length === 0 ? (
                  <div className="text-sm text-gray-500 italic py-2">No subtasks created yet.</div>
                ) : (
                  <div className="space-y-2">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-[10px] uppercase text-gray-400 border-b border-gray-200">
                          <th className="pb-1 font-bold">Subtask Title</th>
                          <th className="pb-1 font-bold">Status</th>
                          <th className="pb-1 font-bold text-right pr-4">Est. Hours</th>
                          <th className="pb-1 font-bold text-right">Actual Hours</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subtasks.map(sub => (
                          <tr key={sub.id} className="border-b border-gray-100 last:border-0 hover:bg-white transition-colors">
                            <td className="py-2 text-gray-700 font-medium">{sub.title}</td>
                            <td className="py-2">{getStatusBadge(sub.status)}</td>
                            <td className="py-2 text-right pr-4 font-mono text-xs text-gray-500">{sub.estimatedHours || 0}h</td>
                            <td className="py-2 text-right font-mono text-xs font-bold text-[#020024]">{sub.spentHours || 0}h</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </td>
          </tr>
        )}
      </Fragment>
    );
  };

  if (loading && tasks.length === 0) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div>
      {/* 1. Header & Selectors */}
      <div className="page-header flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl font-medium mb-1 flex items-center gap-3">
            All Tasks
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 shadow-sm transition-colors"
              >
                {selectedSprintId === 'all' ? (
                  <span className="text-[#020024]">All Sprints</span>
                ) : selectedSprintDetails ? (
                  <>
                    <span className="text-[#020024]">{selectedSprintDetails.sprintName} ({selectedSprintDetails.sprintId})</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase font-bold border ${getSprintBadgeColor(selectedSprintDetails.status)}`}>
                      {selectedSprintDetails.status}
                    </span>
                  </>
                ) : 'Select Sprint'}
                <ChevronDown size={16} className="text-gray-400" />
              </button>
              
              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                  <div className="max-h-60 overflow-y-auto">
                    <button
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 ${selectedSprintId === 'all' ? 'bg-blue-50/50' : ''}`}
                      onClick={() => {
                        setSearchParams({});
                        setSelectedSprintId('all');
                        setDropdownOpen(false);
                      }}
                    >
                      <span className="font-semibold text-gray-800">All Sprints</span>
                      {selectedSprintId === 'all' && <CheckCircle2 size={16} className="text-[#005AFF]" />}
                    </button>
                    {sprints.map(sprint => (
                      <button
                        key={sprint.sprintId}
                        onClick={() => {
                          setSearchParams({ sprint_id: sprint.sprintId });
                          setSelectedSprintId(sprint.sprintId);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between transition-colors border-b border-gray-100 last:border-0 ${sprint.sprintId === selectedSprintId ? 'bg-blue-50/50' : ''}`}
                      >
                        <div>
                          <div className="font-medium text-[#020024]">{sprint.sprintName}</div>
                          <div className="text-xs text-gray-500">{sprint.sprintId}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold border ${getSprintBadgeColor(sprint.status)}`}>
                            {sprint.status}
                          </span>
                          {sprint.sprintId === selectedSprintId && <CheckCircle2 size={16} className="text-[#005AFF]" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </h1>
        </div>

        {/* 6. Advanced Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 w-48"
              value={filters.search}
              onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
            />
          </div>
          
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-md px-2 py-1">
            <Filter size={14} className="text-gray-400" />
            <select 
              className="text-sm bg-transparent outline-none font-medium text-gray-700"
              value={filters.employee}
              onChange={e => setFilters(p => ({ ...p, employee: e.target.value }))}
            >
              <option value="all">All Employees</option>
              {uniqueEmployees.map(emp => <option key={emp} value={emp}>{emp}</option>)}
            </select>
          </div>

          <select 
            className="text-sm bg-white border border-gray-300 rounded-md px-2 py-1.5 outline-none font-medium text-gray-700"
            value={filters.status}
            onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="inprogress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>

      {/* 4. Sprint Summary Header */}
      {selectedSprintId !== 'all' && sprintSummary && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6 flex flex-wrap gap-6 items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total Scope</div>
              <div className="text-sm font-semibold text-[#020024]">{filteredTasks.length} Main Tasks <span className="text-gray-300 mx-1">|</span> {sprintSummary.subtasksCount} Subtasks</div>
            </div>
            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
            <div>
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Status Breakdown</div>
              <div className="flex items-center gap-2">
                <span className="bg-gray-100 text-gray-700 px-2 rounded text-[11px] font-bold">To Do: {sprintSummary.statusCounts.todo}</span>
                <span className="bg-blue-100 text-blue-700 px-2 rounded text-[11px] font-bold">In Progress: {sprintSummary.statusCounts.inprogress}</span>
                <span className="bg-red-100 text-red-700 px-2 rounded text-[11px] font-bold">Blocked: {sprintSummary.statusCounts.blocked}</span>
                <span className="bg-green-100 text-green-700 px-2 rounded text-[11px] font-bold">Done: {sprintSummary.statusCounts.done}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
             <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total Effort</div>
             <div className="text-sm font-semibold text-[#020024]">{sprintSummary.totalSpent}h <span className="text-gray-400 font-normal">spent / {sprintSummary.totalEst}h est.</span></div>
          </div>
        </div>
      )}

      {/* 5. Main Table Area */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-[11px] text-gray-500 uppercase tracking-wider">
              <th className="py-3 px-3 w-10"></th>
              <th className="py-3 px-4 font-bold">Task ID</th>
              <th className="py-3 px-4 font-bold">Employee</th>
              <th className="py-3 px-4 font-bold">Title</th>
              <th className="py-3 px-4 font-bold">Status</th>
              <th className="py-3 px-4 font-bold">Est</th>
              <th className="py-3 px-4 font-bold">Spent</th>
              <th className="py-3 px-4 font-bold">Subtasks</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length === 0 ? (
              <tr><td colSpan="8" className="py-12 text-center text-gray-500 italic">No tasks found matching your criteria.</td></tr>
            ) : selectedSprintId !== 'all' ? (
              filteredTasks.map(renderTaskRow)
            ) : (
              // All Sprints Grouped View
              Object.entries(
                filteredTasks.reduce((acc, t) => {
                  if (!acc[t.sprintId]) acc[t.sprintId] = [];
                  acc[t.sprintId].push(t);
                  return acc;
                }, {})
              ).sort(([a], [b]) => String(b).localeCompare(String(a))).map(([sprintId, sprintTasks]) => {
                const sprintDetail = sprints.find(s => s.sprintId === sprintId);
                const isGroupExpanded = expandedSprints.has(sprintId);
                
                return (
                  <Fragment key={sprintId}>
                    {/* Sprint Section Header */}
                    <tr className="bg-gray-100/80 border-b border-gray-200 cursor-pointer hover:bg-gray-200/50 transition-colors" onClick={() => toggleSprintExpanded(sprintId)}>
                      <td colSpan="8" className="py-3 px-4">
                        <div className="flex items-center gap-3">
                           {isGroupExpanded ? <ChevronDown size={18} className="text-gray-500" /> : <ChevronRight size={18} className="text-gray-500" />}
                           <span className="font-bold text-[#020024]">{sprintId}</span>
                           <span className="text-sm font-medium text-gray-700">{sprintDetail?.sprintName || 'Unknown Sprint'}</span>
                           {sprintDetail && (
                             <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase font-bold border ml-2 ${getSprintBadgeColor(sprintDetail.status)}`}>
                               {sprintDetail.status}
                             </span>
                           )}
                           <span className="ml-auto text-xs font-bold text-gray-500">{sprintTasks.length} tasks</span>
                        </div>
                      </td>
                    </tr>
                    {/* Tasks for this sprint */}
                    {isGroupExpanded && sprintTasks.map(renderTaskRow)}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
