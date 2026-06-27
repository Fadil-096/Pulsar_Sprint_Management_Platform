const fs = require('fs');
let code = fs.readFileSync('client/src/pages/manager/Sprints.jsx', 'utf8');

// 1. Add state for confirmReview
code = code.replace(
  "const [confirmDeleteId, setConfirmDeleteId] = useState(null);",
  "const [confirmDeleteId, setConfirmDeleteId] = useState(null);\n  const [confirmReviewSprintId, setConfirmReviewSprintId] = useState(null);"
);

// 2. Add authUser from useAuth if not present
// wait, useAuth provides token, does it provide user?
// Let's check `useAuth()` in context. Sprints.jsx uses `const { token } = useAuth();`
// We need `user` to check role.
code = code.replace(
  "const { token } = useAuth();",
  "const { token, user } = useAuth();"
);

// 3. Update tabs map
code = code.replace(
  "{['created', 'planner', 'active', 'completed'].map(mode => (",
  "{['created', 'planner', 'active', 'review', 'completed'].map(mode => ("
);
code = code.replace(
  "{mode}",
  "{mode === 'review' ? 'READY FOR REVIEW' : mode}"
);

// 4. In Active card, update 'Complete Sprint' button logic to 'Move to Review' and inline confirmation
// Also add 'Returned for revision' badge.
const badgeTarget = "sprint.status === 'planner' ? 'bg-purple-100 text-purple-700' :";
code = code.replace(
  badgeTarget,
  `sprint.status === 'review' ? 'bg-yellow-100 text-yellow-700' :\n                    ${badgeTarget}`
);

const badgeHtmlTarget = "</span>\n                </div>\n                <div className=\"flex items-center gap-3\">";
code = code.replace(
  badgeHtmlTarget,
  `}
                  </span>
                  {sprint.status === 'active' && sprint.reviewData && sprint.reviewData.returnReason && (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-red-100 text-red-700 flex items-center gap-1" title={sprint.reviewData.returnReason}>
                      <AlertCircle size={12} /> Returned for revision
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">`
);

const completeButtonTarget = `{sprint.status === 'active' && (
                    <button onClick={() => handleStatusChange(sprint.sprintId, 'completed')} className="bg-green-600 text-white px-3 py-1 rounded text-[12px] font-bold hover:bg-green-700 transition-colors">
                      Complete Sprint
                    </button>
                  )}`;

const reviewButtonReplacement = `{sprint.status === 'active' && (
                    confirmReviewSprintId === sprint.sprintId ? (
                      <div className="flex items-center gap-2 bg-yellow-50 p-1.5 rounded-md border border-yellow-200">
                        <span className="text-xs text-yellow-800 font-medium">Mark as ready for review?</span>
                        <button onClick={() => {
                          axios.post(\`/api/sprints/\${sprint.sprintId}/review/init\`, {}, { headers: { Authorization: \`Bearer \${token}\` } })
                            .then(() => { fetchSprints(); setConfirmReviewSprintId(null); })
                            .catch(err => console.error(err));
                        }} className="bg-yellow-600 text-white px-2 py-0.5 rounded text-[11px] font-bold hover:bg-yellow-700">Confirm</button>
                        <button onClick={() => setConfirmReviewSprintId(null)} className="text-text-muted hover:text-gray-700">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmReviewSprintId(sprint.sprintId)} className="bg-yellow-500 text-white px-3 py-1 rounded text-[12px] font-bold hover:bg-yellow-600 transition-colors">
                        Move to Ready for Review
                      </button>
                    )
                  )}`;

code = code.replace(completeButtonTarget, reviewButtonReplacement);

fs.writeFileSync('client/src/pages/manager/Sprints.jsx', code, 'utf8');
console.log('Successfully patched active card and tabs in Sprints.jsx');
