import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { Search, Plus, Filter, MoreVertical, Edit2, Trash2, ArrowUpDown } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import PageLoader from '../../components/PageLoader';

export default function Backlog() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [featureId, setFeatureId] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');
  const [storyPoints, setStoryPoints] = useState('');
  const [businessValue, setBusinessValue] = useState('');
  const [status, setStatus] = useState('new');

  const fetchBacklog = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/backlog', {
        params: { status: filterStatus, priority: filterPriority }
      });
      setItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBacklog();
  }, [filterStatus, filterPriority]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title, description, featureId, category, priority,
        storyPoints: storyPoints ? parseInt(storyPoints) : 0,
        businessValue: businessValue ? parseInt(businessValue) : 0,
        status: editingItem ? status : 'new'
      };

      if (editingItem) {
        await axios.put(`/api/backlog/${editingItem.backlog_id}`, payload);
      } else {
        await axios.post('/api/backlog', payload);
      }
      
      closeModal();
      fetchBacklog();
    } catch (err) {
      console.error('Error saving backlog item', err);
    }
  };

  const handleDelete = (id) => {
    setItemToDelete(id);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const id = itemToDelete;
    setItemToDelete(null);
    try {
      await axios.delete(`/api/backlog/${id}`);
      fetchBacklog();
    } catch (err) {
      console.error('Error deleting backlog item', err);
    }
  };

  const openModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      setTitle(item.title);
      setDescription(item.description || '');
      setFeatureId(item.feature_id || '');
      setCategory(item.category || '');
      setPriority(item.priority || 'medium');
      setStoryPoints(item.story_points || '');
      setBusinessValue(item.business_value || '');
      setStatus(item.status || 'new');
    } else {
      setTitle('');
      setDescription('');
      setFeatureId('');
      setCategory('');
      setPriority('medium');
      setStoryPoints('');
      setBusinessValue('');
      setStatus('new');
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    (item.feature_id && item.feature_id.toLowerCase().includes(search.toLowerCase()))
  );

  const getPriorityColor = (p) => {
    switch (p) {
      case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/30';
      case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/30';
      case 'medium': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      case 'low': return 'bg-gray-500/10 text-gray-500 border-gray-500/30';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getStatusColor = (s) => {
    switch (s) {
      case 'new': return 'bg-gray-500/10 text-gray-500 border-gray-500/30';
      case 'ready': return 'bg-green-500/10 text-green-500 border-green-500/30';
      case 'refinement': return 'bg-purple-500/10 text-purple-500 border-purple-500/30';
      case 'planned': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      case 'approved': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30';
      case 'deferred': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/30';
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-primary overflow-hidden">
      {/* Header */}
      <div className="bg-bg-card border-b border-line px-6 py-5 flex-shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-text-primary uppercase tracking-tight">Product Backlog</h1>
            <p className="text-sm text-text-secondary mt-1 font-medium">Manage and prioritize unassigned work items</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => openModal()}
              className="flex items-center gap-2 px-4 py-2 bg-accent-blue text-white rounded-xl font-bold uppercase text-xs hover:bg-blue-600 transition-colors shadow-sm"
            >
              <Plus size={16} /> Create Item
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="mt-6 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
            <input 
              type="text" 
              placeholder="Search backlog..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-bg-secondary border border-line rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/50"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 custom-scrollbar">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-text-secondary" />
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-bg-secondary border border-line rounded-xl px-3 py-1.5 text-xs font-bold text-text-primary uppercase"
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="ready">Ready</option>
                <option value="refinement">Refinement</option>
                <option value="approved">Approved</option>
                <option value="planned">Planned (In Sprint)</option>
                <option value="deferred">Deferred</option>
              </select>
            </div>
            <select 
              value={filterPriority} 
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-bg-secondary border border-line rounded-xl px-3 py-1.5 text-xs font-bold text-text-primary uppercase"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Backlog List */}
      <div className="flex-1 overflow-y-auto p-6 bg-bg-primary">
        <div className="bg-bg-card border border-line rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-secondary border-b border-line">
                <th className="py-3 px-4 text-xs font-bold uppercase text-text-secondary tracking-wider">Item ID</th>
                <th className="py-3 px-4 text-xs font-bold uppercase text-text-secondary tracking-wider">Title</th>
                <th className="py-3 px-4 text-xs font-bold uppercase text-text-secondary tracking-wider">Category</th>
                <th className="py-3 px-4 text-xs font-bold uppercase text-text-secondary tracking-wider">Priority</th>
                <th className="py-3 px-4 text-xs font-bold uppercase text-text-secondary tracking-wider text-center">Pts</th>
                <th className="py-3 px-4 text-xs font-bold uppercase text-text-secondary tracking-wider">Status</th>
                <th className="py-3 px-4 text-xs font-bold uppercase text-text-secondary tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-text-secondary text-sm">
                    No backlog items found. Create one to get started.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-line hover:bg-bg-secondary/50 transition-colors group">
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-accent-blue">{item.backlog_id}</span>
                        {item.feature_id && <span className="text-[10px] text-text-secondary">{item.feature_id}</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm font-bold text-text-primary">{item.title}</div>
                      {item.description && <div className="text-xs text-text-secondary truncate max-w-[300px] mt-0.5">{item.description}</div>}
                    </td>
                    <td className="py-3 px-4">
                      {item.category ? (
                        <span className="text-xs font-medium bg-bg-secondary px-2 py-1 rounded-xl text-text-primary border border-line">
                          {item.category}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-xl border ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-bg-secondary text-xs font-bold text-text-primary border border-line">
                        {item.story_points || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-xl border ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(item)} className="p-1 text-text-secondary hover:text-accent-blue transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(item.backlog_id)} className="p-1 text-text-secondary hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-bg-card w-full max-w-3xl rounded-2xl border border-line shadow-2xl flex flex-col my-8">
            <div className="px-6 py-4 border-b border-line flex justify-between items-center bg-bg-secondary/50 rounded-t-lg">
              <h2 className="text-lg font-black text-text-primary uppercase tracking-wide">
                {editingItem ? 'Edit Backlog Item' : 'Create Backlog Item'}
              </h2>
              <button onClick={closeModal} className="text-text-secondary hover:text-text-primary text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Title *</label>
                    <input 
                      type="text" 
                      required
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-bg-secondary border border-line rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                      placeholder="e.g., Implement two-factor authentication"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Description</label>
                    <textarea 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-bg-secondary border border-line rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue resize-none"
                      placeholder="Short description of the work item..."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Feature ID (Optional)</label>
                    <input 
                      type="text" 
                      value={featureId} 
                      onChange={(e) => setFeatureId(e.target.value)}
                      className="w-full px-3 py-2 bg-bg-secondary border border-line rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                      placeholder="e.g., FEAT-123"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Priority</label>
                    <select 
                      value={priority} 
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-3 py-2 bg-bg-secondary border border-line rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                    >
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Story Points</label>
                    <input 
                      type="number" 
                      min="0"
                      value={storyPoints} 
                      onChange={(e) => setStoryPoints(e.target.value)}
                      className="w-full px-3 py-2 bg-bg-secondary border border-line rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                      placeholder="e.g., 5"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Category</label>
                    <input 
                      type="text" 
                      value={category} 
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-bg-secondary border border-line rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                      placeholder="e.g., Frontend, Backend, Design"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Business Value</label>
                    <input 
                      type="number" 
                      min="0"
                      value={businessValue} 
                      onChange={(e) => setBusinessValue(e.target.value)}
                      className="w-full px-3 py-2 bg-bg-secondary border border-line rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                      placeholder="e.g., 100"
                    />
                  </div>
                  {editingItem && (
                    <div>
                      <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Status</label>
                      <select 
                        value={status} 
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-bg-secondary border border-line rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                      >
                        <option value="new">New</option>
                        <option value="ready">Ready</option>
                        <option value="refinement">Refinement</option>
                        <option value="approved">Approved</option>
                        <option value="planned">Planned (In Sprint)</option>
                        <option value="deferred">Deferred</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-line">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-bold uppercase text-text-secondary hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-accent-blue text-white rounded-xl text-sm font-bold uppercase hover:bg-blue-600 transition-colors shadow-sm"
                >
                  {editingItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!itemToDelete}
        onCancel={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Backlog Item?"
        bodyText="This will permanently delete this backlog item. This action cannot be undone."
        confirmText="Delete Item"
        iconType="danger"
      />
    </div>
  );
}
