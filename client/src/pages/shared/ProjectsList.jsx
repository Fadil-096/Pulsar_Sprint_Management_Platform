import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Calendar, ChevronRight, Trash2, Pencil } from 'lucide-react';
import PageLoader from '../../components/PageLoader';

export default function ProjectsList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/projects', { headers: { Authorization: `Bearer ${token}` } });
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to fetch projects', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    if (!title || !startDate || !endDate) return;

    try {
      setSubmitting(true);
      if (editingProject) {
        await axios.put(`/api/projects/${editingProject.project_id}`, { title, start_date: startDate, end_date: endDate, description }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('/api/projects', { title, start_date: startDate, end_date: endDate, description }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowModal(false);
      setEditingProject(null);
      setTitle('');
      setStartDate('');
      setEndDate('');
      setDescription('');
      fetchProjects();
    } catch (err) {
      console.error('Error saving project', err);
      alert(err.response?.data?.error || err.message || 'Error saving project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditProject = (e, project) => {
    e.stopPropagation();
    setEditingProject(project);
    setTitle(project.title);
    setStartDate(project.start_date || '');
    setEndDate(project.end_date || '');
    setDescription(project.description || '');
    setShowModal(true);
  };

  const handleDeleteProject = async (e, projectId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this project? This will also delete all its tasks.')) return;

    try {
      setLoading(true);
      await axios.delete(`/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProjects();
    } catch (err) {
      console.error('Error deleting project', err);
      alert(err.response?.data?.error || err.message || 'Error deleting project');
      setLoading(false);
    }
  };

  const getStatus = (p) => {
    if (p.total_tasks === 0) return { label: 'Not Started', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' };
    if (p.completed_tasks === p.total_tasks) return { label: 'Completed', color: 'bg-green-500/10 text-green-500 border-green-500/20' };
    return { label: 'In Progress', color: 'bg-accent-blue/10 text-accent-blue border-accent-blue/20' };
  };

  const getDeadlineColor = (d) => {
    const today = new Date();
    const deadlineDate = new Date(d);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'text-red-500';
    if (diffDays <= 7) return 'text-amber-500';
    return 'text-text-secondary';
  };

  const formatDate = (d) => {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) return <PageLoader />;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Projects</h1>
          <p className="text-sm text-text-secondary mt-1">Manage high-level project repositories and tasks</p>
        </div>
        <button 
          onClick={() => {
            setEditingProject(null);
            setTitle('');
            setStartDate('');
            setEndDate('');
            setDescription('');
            setShowModal(true);
          }}
          className="bg-accent-blue hover:bg-blue-600 text-white px-4 py-2 rounded font-medium flex items-center transition-colors"
        >
          <Plus size={16} className="mr-2" />
          Add Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(p => {
          const status = getStatus(p);
          const progressPercent = p.total_tasks === 0 ? 0 : Math.round((p.completed_tasks / p.total_tasks) * 100);

          return (
            <div 
              key={p.project_id} 
              onClick={() => navigate(`/manager/projects/${p.project_id}`)}
              className="bg-bg-secondary rounded-lg border-l-4 border-l-accent-blue p-5 hover:border-accent-blue cursor-pointer transition-all group flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-text-primary text-lg truncate pr-4">{p.title}</h3>
              </div>
              
              <div className="flex flex-col gap-1.5 mb-4">
                <div className="flex items-center text-xs font-medium text-text-secondary">
                  <Calendar size={14} className="mr-1.5" />
                  Created: {formatDate(p.created_at)}
                </div>
                <div className={`flex items-center text-xs font-medium ${getDeadlineColor(p.end_date)}`}>
                  <Calendar size={14} className="mr-1.5" />
                  End Date: {formatDate(p.end_date)}
                </div>
              </div>
              
              <div className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">Description</div>
              <p className="text-sm text-text-secondary mb-4 min-h-[40px]">
                {p.description ? (
                  p.description.length > 110 ? (
                    <>
                      {p.description.substring(0, 110)}...
                      <span className="text-accent-blue hover:underline ml-1 font-medium">Read more</span>
                    </>
                  ) : (
                    p.description
                  )
                ) : (
                  'No description provided.'
                )}
              </p>
              
              <div className="mt-auto pt-3 flex justify-between items-center border-t border-line/20">
                <span className={`text-xs px-2 py-1 rounded border font-medium whitespace-nowrap ${status.color}`}>
                  {status.label}
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => handleEditProject(e, p)}
                    className="p-1.5 text-text-secondary hover:bg-white/5 hover:text-white rounded transition-colors"
                    title="Edit Project"
                  >
                    <Pencil size={16} />
                  </button>
                  <button 
                    onClick={(e) => handleDeleteProject(e, p.project_id)}
                    className="p-1.5 text-red-500/70 hover:bg-red-500/10 hover:text-red-500 rounded transition-colors"
                    title="Delete Project"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              

            </div>
          );
        })}
        {projects.length === 0 && (
          <div className="col-span-full py-16 text-center border border-dashed border-line rounded-lg text-text-secondary">
            No projects found. Create a new project to get started.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-[#020024]/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-bg-card border border-line/50 rounded-xl flex flex-col overflow-hidden shadow-2xl shadow-black/50 w-full max-w-[600px] max-h-[90vh] animate-[slideUp_0.3s_ease-out]">
            <div className="px-6 py-5 border-b border-line flex justify-between items-center bg-bg-card shrink-0">
              <h2 className="text-xl font-bold text-text-primary uppercase tracking-tight">{editingProject ? 'Edit Project' : 'Create New Project'}</h2>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form onSubmit={handleSaveProject} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1 tracking-wider">Title <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Support Chat Bot Redesign"
                    className="w-full bg-bg-secondary border border-line rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase mb-1 tracking-wider">Start Date <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-bg-secondary border border-line rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase mb-1 tracking-wider">End Date <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-bg-secondary border border-line rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1 tracking-wider">Basic Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, 300))}
                    placeholder="Briefly describe the purpose or scope of this project..."
                    className="w-full bg-bg-secondary border border-line rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all resize-none h-28"
                  />
                  <div className="text-right text-xs text-text-secondary mt-1">
                    {description.length}/300
                  </div>
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-line bg-bg-card flex justify-end gap-3 shrink-0">
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 text-sm font-medium text-text-secondary hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSaveProject}
                disabled={!title || !startDate || !endDate || submitting}
                className="bg-accent-blue hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-accent-blue/20"
              >
                {submitting ? (editingProject ? 'Saving...' : 'Creating...') : (editingProject ? 'Save Changes' : 'Create Project')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
