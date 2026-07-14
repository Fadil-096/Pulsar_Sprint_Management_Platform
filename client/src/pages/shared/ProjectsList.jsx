import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Calendar, ChevronRight, Trash2, Pencil, Folder, FolderPlus } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
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
  const [projectToDelete, setProjectToDelete] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

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

  const handleDeleteProject = (e, projectId) => {
    e.stopPropagation();
    setProjectToDelete(projectId);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    const projectId = projectToDelete;
    setProjectToDelete(null);

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
          className="bg-accent-blue hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-medium flex items-center transition-colors"
        >
          <Plus size={16} className="mr-2" />
          Add Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(p => {
          const status = getStatus(p);

          return (
            <div 
              key={p.project_id} 
              onClick={() => navigate(`/manager/projects/${p.project_id}`)}
              className="bg-bg-secondary rounded-2xl border-l-4 border-l-accent-blue p-5 hover:border-accent-blue cursor-pointer transition-all group flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-text-primary text-lg truncate pr-4">{p.title}</h3>
              </div>
              
              <div className="flex flex-col gap-1.5 mb-4">
                <div className="flex items-center text-xs font-medium text-text-secondary">
                  <Calendar size={14} className="mr-1.5" />
                  Created: {formatDate(p.created_at)}
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
              
              <div className="mt-auto pt-4 flex justify-between items-center border-t-[1px] border-line">
                <div className={`flex items-center text-xs font-medium ${getDeadlineColor(p.end_date)}`}>
                  <Calendar size={14} className="mr-1.5" />
                  End Date: {formatDate(p.end_date)}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => handleEditProject(e, p)}
                    className="px-2.5 py-1 text-xs font-medium text-text-secondary hover:bg-bg-primary hover:text-text-primary rounded-xl transition-colors"
                    title="Edit Project"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={(e) => handleDeleteProject(e, p.project_id)}
                    className="px-2.5 py-1 text-xs font-medium text-red-500/80 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-colors"
                    title="Delete Project"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {projects.length === 0 && (
          <div className="col-span-full py-16 text-center border border-dashed border-line rounded-2xl text-text-secondary">
            No projects found. Create a new project to get started.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/45 dark:bg-black/70 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-bg-card border border-line rounded-2xl shadow-xl w-full max-w-[560px] flex flex-col overflow-hidden animate-[scale-in_0.2s_ease-out_forwards] scale-[0.97] opacity-0" style={{ animation: 'modalEnter 0.2s ease-out forwards' }}>
            <style>{`
              @keyframes modalEnter {
                from { opacity: 0; transform: scale(0.97); }
                to { opacity: 1; transform: scale(1); }
              }
            `}</style>
            
            <div className="px-6 py-6 border-b border-line flex items-start gap-3 shrink-0">
              <Folder size={20} className="text-accent-blue mt-0.5" />
              <div>
                <h2 className="text-lg font-bold text-text-primary leading-tight mb-1">{editingProject ? 'Edit Project' : 'Create New Project'}</h2>
                <p className="text-xs text-text-secondary leading-tight">{editingProject ? 'Update the details for this project repository.' : 'Set up a new project repository for your team\'s backlog tasks.'}</p>
              </div>
            </div>
            
            <div className="px-6 pt-5 pb-6 overflow-y-auto">
              <form id="project-form" onSubmit={handleSaveProject} className="space-y-[20px]">
                <div>
                  <label className="block text-[11px] font-bold text-text-muted uppercase mb-1.5 tracking-widest">Title <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Support Chat Bot Redesign"
                    className="w-full h-[40px] bg-bg-secondary border border-line rounded-xl px-3 text-sm text-text-primary focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all placeholder:text-text-muted"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-text-muted uppercase mb-1.5 tracking-widest">Start Date <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full h-[40px] bg-bg-secondary border border-line rounded-xl px-3 text-sm text-text-primary focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all [color-scheme:dark]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-text-muted uppercase mb-1.5 tracking-widest">End Date <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full h-[40px] bg-bg-secondary border border-line rounded-xl px-3 text-sm text-text-primary focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all [color-scheme:dark]"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text-muted uppercase mb-1.5 tracking-widest">Basic Description</label>
                  <div className="relative">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value.slice(0, 300))}
                      placeholder="Briefly describe the purpose or scope of this project..."
                      className="w-full min-h-[100px] resize-y bg-bg-secondary border border-line rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all placeholder:text-text-muted pb-8"
                    />
                    <div className="absolute bottom-3 right-3 text-[11px] font-medium text-text-muted">
                      {description.length}/300
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-line flex justify-end gap-3 shrink-0">
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="px-5 py-2 text-sm text-text-secondary bg-transparent border border-line rounded-xl hover:bg-bg-secondary hover:text-text-primary transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                form="project-form"
                disabled={!title || !startDate || !endDate || submitting}
                className="flex items-center gap-2 bg-accent-blue text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                <FolderPlus size={14} />
                {submitting ? (editingProject ? 'Saving...' : 'Creating...') : (editingProject ? 'Save Changes' : 'Create Project')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!projectToDelete}
        onCancel={() => setProjectToDelete(null)}
        onConfirm={confirmDeleteProject}
        title="Delete Project?"
        bodyText="This will permanently delete this project and all of its tasks. This action cannot be undone."
        confirmText="Delete Project"
        iconType="danger"
      />
    </div>
  );
}
