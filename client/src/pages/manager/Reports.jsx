import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Search } from 'lucide-react';

export default function Reports() {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const querySprintId = searchParams.get('sprint_id');
  const [sprints, setSprints] = useState([]);

  const [loading, setLoading] = useState(true);
  const [selectedSprintId, setSelectedSprintId] = useState('');
  const [sprintFilterStatus, setSprintFilterStatus] = useState('all');
  
  const [loadingEos, setLoadingEos] = useState(false);
  const [loadingTp, setLoadingTp] = useState(false);

  useEffect(() => {
    axios.get('/api/sprints', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        // Sort sprints: Completed first (most recent), then Active, Planner, Created
        const sorted = res.data.sort((a, b) => {
          const statusOrder = { 'completed': 1, 'active': 2, 'planner': 3, 'created': 4 };
          const s1 = statusOrder[a.status] || 99;
          const s2 = statusOrder[b.status] || 99;
          if (s1 !== s2) return s1 - s2;
          return b.id - a.id; // descending ID
        });
        
        setSprints(sorted);

        // Default selection: query param, or most recent completed, else active, else first
        if (sorted.length > 0) {
            let defaultSprint = null;
            if (querySprintId) {
                defaultSprint = sorted.find(s => s.sprintId === querySprintId);
            }
            if (!defaultSprint) {
                defaultSprint = sorted.find(s => s.status === 'completed') || sorted.find(s => s.status === 'active') || sorted[0];
            }
            setSelectedSprintId(defaultSprint.sprintId);
        }


      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [token]);

  const selectedSprint = sprints.find(s => s.sprintId === selectedSprintId);

  const chrono = [...sprints].sort((a,b) => a.id - b.id);
  
  const targetSprints = chrono;

  const velocityData = targetSprints.map(s => ({
    name: s.sprintId,
    completed: s.doneCount || 0,
    total: s.taskCount || 0
  }));

  const handleDownload = async (type) => {
    if (!selectedSprintId) return;
    
    const setBtnLoading = type === 'eos' ? setLoadingEos : setLoadingTp;
    setBtnLoading(true);

    try {
      const endpoint = type === 'eos' ? 'end-of-sprint' : 'team-performance';
      const response = await axios.get(`/api/reports/${selectedSprintId}/${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const sprintNameSafe = selectedSprint?.sprintName.replace(/[^a-z0-9]/gi, '_');
      const suffix = type === 'eos' ? 'End_of_Sprint_Report' : 'Team_Performance_Report';
      link.setAttribute('download', `${selectedSprintId}_${sprintNameSafe}_${suffix}.xlsx`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed', err);
      alert('Failed to generate report.');
    } finally {
      setBtnLoading(false);
    }
  };

  const CustomActiveDot = (props) => {
    const { cx, cy, payload } = props;
    if (payload.name === selectedSprintId) {
      return (
        <circle cx={cx} cy={cy} r={8} fill="var(--color-accent-blue)" stroke="#fff" strokeWidth={2} />
      );
    }
    return <circle cx={cx} cy={cy} r={4} fill="var(--color-accent-blue)" />;
  };

  if (loading) return <div className="p-8 text-center text-text-secondary">Loading reports...</div>;

  return (
    <div>
      <div className="page-header mb-6">
        <h1 className="text-xl font-medium mb-1">Reports & Analytics</h1>
        <p className="text-text-secondary text-sm">Review team performance metrics across sprints.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sprint Velocity Chart */}
        <div className="card flex flex-col">
          <div className="card-title">Sprint Velocity Trend</div>
          <p className="text-[12px] text-text-secondary mb-4">Total vs Completed tasks across all sprints</p>
          <div className="flex-1 min-h-[250px] text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={velocityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-light)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false}  tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}/>
                <YAxis axisLine={false} tickLine={false}  tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}/>
                <Tooltip cursor={{fill: 'var(--color-bg-secondary)'}}  contentStyle={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} itemStyle={{ color: 'var(--color-text-secondary)' }}/>
                <Legend />
                <Line type="monotone" dataKey="total" name="Total Tasks" stroke="var(--color-accent-blue-light)" strokeWidth={2} />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  name="Completed Tasks" 
                  stroke="var(--color-accent-blue)" 
                  strokeWidth={2} 
                  activeDot={<CustomActiveDot />} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-[11px] text-text-secondary text-center">
            The currently selected sprint ({selectedSprintId}) is highlighted.
          </div>
        </div>

        {/* Generate Reports Card */}
        <div className="card flex flex-col">
          <div className="card-title">Generate Sprint Reports</div>
          <p className="text-[12px] text-text-secondary mb-4">Download detailed performance summaries in Excel format.</p>
          
          {/* Sprint Selector */}
          <div className="mb-6 bg-bg-secondary p-4 rounded-2xl border border-line-light">
            <label className="block text-[11px] text-text-secondary font-bold uppercase tracking-wider mb-3">SELECT SPRINT</label>
            
            <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 hide-scrollbar">
              {['all', 'active', 'created', 'planner', 'review', 'completed'].map(status => (
                <button
                  key={status}
                  onClick={() => setSprintFilterStatus(status)}
                  className={`px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap transition-colors ${
                    sprintFilterStatus === status 
                      ? 'bg-accent-blue text-white shadow-sm' 
                      : 'bg-bg-card border border-line text-text-secondary hover:bg-dropdown-hover-bg hover:text-text-primary'
                  }`}
                >
                  {status === 'created' ? 'Backlogs' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            <select 
              value={selectedSprintId} 
              onChange={(e) => setSelectedSprintId(e.target.value)}
              className="w-full p-2 border border-line rounded-xl text-sm bg-bg-card text-text-primary focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue"
            >
              <option value="" disabled>Select a sprint</option>
              {sprints.filter(s => sprintFilterStatus === 'all' || s.status === sprintFilterStatus).map(s => (
                <option key={s.sprintId} value={s.sprintId}>
                  {s.sprintId} — {s.sprintName} [{s.status.toUpperCase()}]
                </option>
              ))}
            </select>
            
            {selectedSprint && (
              <div className="mt-3 text-[12px] text-text-secondary grid grid-cols-2 gap-2">
                <div><span className="font-medium text-text-primary">Dates:</span> {selectedSprint.startDate} → {selectedSprint.endDate}</div>
                <div><span className="font-medium text-text-primary">Mode:</span> <span className="capitalize">{selectedSprint.status}</span></div>
                <div><span className="font-medium text-text-primary">Team Size:</span> {selectedSprint.memberCount || 0}</div>
                <div><span className="font-medium text-text-primary">Total Tasks:</span> {selectedSprint.taskCount || 0}</div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Download Button 1 */}
            <div className="p-4 border-[0.5px] border-line rounded-2xl hover:border-blue-400 transition-colors bg-bg-card flex justify-between items-center shadow-sm">
              <div>
                <h3 className="font-medium text-[14px]">End of Sprint Report</h3>
                <p className="text-[12px] text-text-secondary">Summary of tasks, burndown, and bottlenecks (.xlsx)</p>
              </div>
              <button 
                onClick={() => handleDownload('eos')}
                disabled={loadingEos || !selectedSprintId}
                className="btn btn-sm btn-primary flex items-center gap-2 min-w-[110px] justify-center"
              >
                {loadingEos ? 'Generating...' : 'Download'}
              </button>
            </div>

          </div>
          
        </div>
      </div>
    </div>
  );
}
