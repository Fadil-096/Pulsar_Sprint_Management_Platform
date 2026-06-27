const fs = require('fs');

let serverCode = fs.readFileSync('server.js', 'utf8');

const reviewRoutes = `
// ══════════════════════════════════════════════════════════════════════════
// SPRINT REVIEW ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════

// POST /api/sprints/:sprintId/review/init (Any member can move to review)
app.post('/api/sprints/:sprintId/review/init', authMiddleware, (req, res) => {
  try {
    const sprint = db.prepare('SELECT * FROM sprints WHERE sprint_id = ?').get(req.params.sprintId);
    if (!sprint || sprint.status !== 'active') {
      return res.status(400).json({ error: 'Sprint must be active to move to review' });
    }

    db.transaction(() => {
      // Update sprint status
      db.prepare('UPDATE sprints SET status = ? WHERE sprint_id = ?').run('review', req.params.sprintId);
      
      // Initialize or reset review record
      db.prepare(\`
        INSERT INTO sprint_reviews (sprint_id, dod_met, qa_passed, stakeholder_signoff, return_reason, moved_to_review_at)
        VALUES (?, 0, 0, 0, '', datetime('now'))
        ON CONFLICT(sprint_id) DO UPDATE SET
          dod_met = 0,
          qa_passed = 0,
          stakeholder_signoff = 0,
          return_reason = '',
          moved_to_review_at = datetime('now')
      \`).run(req.params.sprintId);
    })();

    res.json({ message: 'Sprint moved to review successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/sprints/:sprintId/review/checklist (Manager only)
app.put('/api/sprints/:sprintId/review/checklist', authMiddleware, managerOnly, (req, res) => {
  try {
    const { dodMet, qaPassed, stakeholderSignoff } = req.body;
    db.prepare(\`
      UPDATE sprint_reviews 
      SET dod_met = ?, qa_passed = ?, stakeholder_signoff = ? 
      WHERE sprint_id = ?
    \`).run(dodMet ? 1 : 0, qaPassed ? 1 : 0, stakeholderSignoff ? 1 : 0, req.params.sprintId);
    res.json({ message: 'Checklist updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/sprints/:sprintId/review/notes (Manager only)
app.put('/api/sprints/:sprintId/review/notes', authMiddleware, managerOnly, (req, res) => {
  try {
    const { notes } = req.body;
    db.prepare(\`
      UPDATE sprint_reviews 
      SET reviewer_notes = ?, notes_updated_at = datetime('now') 
      WHERE sprint_id = ?
    \`).run(notes, req.params.sprintId);
    res.json({ message: 'Notes saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sprints/:sprintId/review/return (Manager only)
app.post('/api/sprints/:sprintId/review/return', authMiddleware, managerOnly, (req, res) => {
  try {
    const { returnReason } = req.body;
    if (!returnReason) return res.status(400).json({ error: 'Return reason is required' });

    db.transaction(() => {
      db.prepare('UPDATE sprints SET status = ? WHERE sprint_id = ?').run('active', req.params.sprintId);
      db.prepare('UPDATE sprint_reviews SET return_reason = ? WHERE sprint_id = ?').run(returnReason, req.params.sprintId);
    })();
    res.json({ message: 'Sprint returned to active' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sprints/:sprintId/review/complete (Manager only)
app.post('/api/sprints/:sprintId/review/complete', authMiddleware, managerOnly, (req, res) => {
  try {
    const review = db.prepare('SELECT * FROM sprint_reviews WHERE sprint_id = ?').get(req.params.sprintId);
    if (!review || !review.dod_met || !review.qa_passed || !review.stakeholder_signoff) {
      return res.status(400).json({ error: 'All checklist items must be completed before marking as completed' });
    }

    db.prepare('UPDATE sprints SET status = ? WHERE sprint_id = ?').run('completed', req.params.sprintId);
    res.json({ message: 'Sprint marked as completed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

`;

const splitTarget = "// DELETE /api/sprints/:sprintId";
const insertionIndex = serverCode.lastIndexOf(splitTarget);

if (insertionIndex !== -1) {
  serverCode = serverCode.slice(0, insertionIndex) + reviewRoutes + serverCode.slice(insertionIndex);
  fs.writeFileSync('server.js', serverCode, 'utf8');
  console.log('Successfully injected review routes');
} else {
  console.log('Failed to find injection target');
}
