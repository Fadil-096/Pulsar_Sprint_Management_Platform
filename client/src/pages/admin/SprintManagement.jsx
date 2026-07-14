import React from 'react';
import { KanbanSquare, Plus } from 'lucide-react';

export default function SprintManagement() {
  return (
    <div className="flex-1 p-8 text-text-primary h-full flex flex-col bg-bg-primary">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-2 flex items-center gap-2">
            <KanbanSquare className="text-accent-blue" />
            Sprint Management
          </h1>
          <p className="text-text-secondary">Global overview and management of all sprints.</p>
        </div>
        <button className="bg-accent-blue hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors">
          <Plus size={18} /> Create Sprint
        </button>
      </div>

      <div className="bg-bg-card border-[1px] border-line rounded-2xl flex-1 flex flex-col items-center justify-center text-text-secondary shadow-sm">
        <KanbanSquare size={48} className="mb-4 opacity-50 text-accent-blue" />
        <p className="text-lg font-medium">Sprint Management Module</p>
        <p className="text-sm mt-2 opacity-80">This feature is currently under development in Phase 2.</p>
      </div>
    </div>
  );
}
