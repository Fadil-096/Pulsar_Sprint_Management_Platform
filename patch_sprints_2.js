const fs = require('fs');
let code = fs.readFileSync('client/src/pages/manager/Sprints.jsx', 'utf8');

// 1. Add import
if (!code.includes('ReviewSprintCard')) {
  code = code.replace(
    "import { Calendar, Users,",
    "import ReviewSprintCard from '../../components/ReviewSprintCard';\nimport { Calendar, Users,"
  );
}

// 2. Add WIP Panel
const wipPanel = `
      {activeTab === 'review' && (
        <div className="bg-white rounded-lg border border-line p-5 flex justify-around items-center mb-6 shadow-sm">
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">Awaiting Review</span>
            <span className="text-2xl font-bold text-text-primary">{filteredSprints.length}</span>
          </div>
          <div className="w-px h-10 bg-line"></div>
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">Avg. Time in Review</span>
            <span className="text-2xl font-bold text-text-primary">
              {filteredSprints.length > 0 ? (
                (() => {
                  const withTime = filteredSprints.filter(s => s.reviewData?.movedToReviewAt);
                  if (withTime.length === 0) return '-';
                  const total = withTime.reduce((acc, s) => acc + (new Date() - new Date(s.reviewData.movedToReviewAt)), 0);
                  const avgHours = Math.round(total / withTime.length / (1000 * 60 * 60));
                  return avgHours + 'h';
                })()
              ) : '-'}
            </span>
          </div>
          <div className="w-px h-10 bg-line"></div>
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">Reviewed Today</span>
            <span className="text-2xl font-bold text-text-primary">
              {sprints.filter(s => s.status === 'completed' && s.reviewData?.notesUpdatedAt && new Date(s.reviewData.notesUpdatedAt).toDateString() === new Date().toDateString()).length}
            </span>
          </div>
        </div>
      )}

      <div className="space-y-4">`;

code = code.replace('<div className="space-y-4">', wipPanel);

// 3. Render ReviewSprintCard for review tab
const cardTarget = "const completionPct = sprint.taskCount > 0 ? Math.round((sprint.doneCount / sprint.taskCount) * 100) : 0;";
const cardReplacement = `const completionPct = sprint.taskCount > 0 ? Math.round((sprint.doneCount / sprint.taskCount) * 100) : 0;
          
          if (activeTab === 'review') {
            return (
              <ReviewSprintCard 
                key={sprint.sprintId} 
                sprint={sprint} 
                user={user} 
                token={token} 
                fetchSprints={fetchSprints} 
                formatDate={formatDate} 
              />
            );
          }
`;

code = code.replace(cardTarget, cardReplacement);

// 4. Empty state for review tab
const noSprintsTarget = "No sprints found in {activeTab} mode.";
const noSprintsReplacement = `{activeTab === 'review' ? 'No sprints are currently awaiting review. Sprints moved from Active will appear here for QA and stakeholder sign-off.' : \`No sprints found in \${activeTab} mode.\`}`;
code = code.replace(noSprintsTarget, noSprintsReplacement);

fs.writeFileSync('client/src/pages/manager/Sprints.jsx', code, 'utf8');
console.log('Successfully applied patch 2');
