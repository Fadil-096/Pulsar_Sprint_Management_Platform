import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Info } from 'lucide-react';
import PageLoader from '../../components/PageLoader';
import { useNavigate } from 'react-router-dom';

export default function AdminTeam() {
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSprints();
  }, []);

  const fetchSprints = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/admin/team/sprints', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSprints(res.data);
    } catch (err) {
      console.error('Failed to fetch admin team sprints', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSprints = sprints.filter(sprint => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    if (sprint.sprintName?.toLowerCase().includes(q)) return true;
    if (sprint.manager?.name?.toLowerCase().includes(q)) return true;
    if (sprint.members?.some(m => m.name.toLowerCase().includes(q))) return true;
    return false;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return { border: 'border-blue-500', badge: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
      case 'created': return { border: 'border-purple-500', badge: 'bg-purple-500/10 text-purple-500 border-purple-500/20' };
      case 'review': return { border: 'border-amber-500', badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
      case 'completed': return { border: 'border-green-500', badge: 'bg-green-500/10 text-green-500 border-green-500/20' };
      default: return { border: 'border-gray-500', badge: 'bg-gray-500/10 text-gray-500 border-gray-500/20' };
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'ACTIVE';
      case 'created': return 'PLANNER';
      case 'review': return 'REVIEW';
      case 'completed': return 'COMPLETED';
      default: return status.toUpperCase();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Group sprints by mode
  const activeSprints = filteredSprints.filter(s => s.status === 'active');
  const plannerSprints = filteredSprints.filter(s => s.status === 'created');
  const reviewSprints = filteredSprints.filter(s => s.status === 'review');
  const completedSprints = filteredSprints.filter(s => s.status === 'completed');

  if (loading) return <PageLoader />;

  const renderSprintSection = (title, sprintList) => {
    if (sprintList.length === 0) return null;

    return (
      <div className="mb-10">
        <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-4">
          {title}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {sprintList.map(sprint => {
            const colors = getStatusColor(sprint.status);
            const displayMembers = sprint.members.slice(0, 6);
            const extraMembers = sprint.members.length > 6 ? sprint.members.length - 6 : 0;

            return (
              <div key={sprint.sprintId} className={`bg-bg-card border border-line rounded-xl overflow-hidden flex flex-col hover:shadow-lg transition-shadow border-l-4 ${colors.border}`}>
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-xs font-semibold text-text-muted mb-1">{sprint.sprintId}</div>
                      <h4 className="text-base font-bold text-text-primary line-clamp-1" title={sprint.sprintName}>
                        {sprint.sprintName}
                      </h4>
                    </div>
                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${colors.badge}`}>
                      {getStatusLabel(sprint.status)}
                    </span>
                  </div>
                  
                  <div className="text-xs text-text-secondary mb-5">
                    {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                  </div>

                  {/* Manager Row */}
                  <div className="mb-5 pb-5 border-b border-line border-dashed">
                    <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Sprint Manager</div>
                    {sprint.manager ? (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-bg-secondary border border-line flex items-center justify-center text-xs font-bold text-text-primary shrink-0">
                          {sprint.manager.initials}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-text-primary">{sprint.manager.name}</div>
                          <div className="text-xs text-text-muted">{sprint.manager.role === 'manager' ? 'Sprint Manager' : sprint.manager.role}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-text-muted italic">Unassigned</div>
                    )}
                  </div>

                  {/* Team Members */}
                  <div>
                    <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3">Team Members</div>
                    {sprint.members.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {displayMembers.map(member => (
                          <div 
                            key={member.id}
                            title={`${member.name} - ${member.role}`}
                            onClick={() => navigate(`/admin/users?search=${encodeURIComponent(member.name)}`)}
                            className="group flex items-center gap-2 bg-bg-secondary hover:bg-bg-primary border border-line rounded-full pr-3 pl-1 py-1 cursor-pointer transition-colors"
                          >
                            <div className="w-6 h-6 rounded-full bg-accent-blue/10 text-accent-blue flex items-center justify-center text-[10px] font-bold shrink-0">
                              {member.avatar_initials}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[11px] font-medium text-text-primary leading-tight truncate max-w-[80px]">
                                {member.name.split(' ')[0]}
                              </span>
                            </div>
                          </div>
                        ))}
                        {extraMembers > 0 && (
                          <div 
                            title={sprint.members.slice(6).map(m => m.name).join(', ')}
                            className="flex items-center justify-center h-8 px-3 rounded-full bg-bg-secondary border border-line text-xs font-medium text-text-secondary cursor-help"
                          >
                            +{extraMembers} more
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-text-muted italic">No members assigned</div>
                    )}
                  </div>
                </div>

                <div className="px-5 py-3 bg-bg-secondary/50 border-t border-line flex justify-between items-center shrink-0">
                  <div className="text-xs text-text-secondary font-medium">
                    {sprint.members.length} {sprint.members.length === 1 ? 'Member' : 'Members'}
                  </div>
                  <div className="text-xs text-text-secondary font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-text-muted"></span>
                    {sprint.taskCount} {sprint.taskCount === 1 ? 'Task' : 'Tasks'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Team</h1>
          <p className="text-sm text-text-secondary">Sprint-wise overview of managers and assigned team members.</p>
        </div>
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search sprints, managers, or members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bg-card border border-line rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all"
          />
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
        </div>
      </div>

      {filteredSprints.length === 0 ? (
        <div className="bg-bg-card rounded-xl border border-line p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-bg-secondary flex items-center justify-center mb-4">
            <Info size={24} className="text-text-muted" />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-2">No sprints found</h3>
          <p className="text-sm text-text-secondary max-w-md">
            {searchQuery ? `No results match your search "${searchQuery}".` : "There are no sprints available to display."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {renderSprintSection('ACTIVE SPRINTS', activeSprints)}
          {renderSprintSection('PLANNER', plannerSprints)}
          {renderSprintSection('REVIEW', reviewSprints)}
          {renderSprintSection('COMPLETED', completedSprints)}
        </div>
      )}
    </div>
  );
}
