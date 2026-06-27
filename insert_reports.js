const fs = require('fs');

const excelLogic = `
// ══════════════════════════════════════════════════════════════════════════
// REPORTS & ANALYTICS (EXCEL EXPORTS)
// ══════════════════════════════════════════════════════════════════════════

function setupExcelSheet(workbook, sheetName, columns) {
  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = columns;
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF001F3F' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  return sheet;
}

function applyStatusColor(cell, status) {
  const s = (status || '').toString().toLowerCase();
  if (s === 'done' || s === 'completed') {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
  } else if (s === 'inprogress' || s === 'active') {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDDEBF7' } };
  } else if (s === 'blocked') {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
  } else if (s === 'todo' || s === 'created' || s === 'planner') {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
  }
}

function applyEfficiencyColor(cell, score) {
  if (score >= 110) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
  } else if (score >= 90) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } };
  } else if (score >= 70) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD966' } };
  } else {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
  }
}

app.get('/api/reports/:sprintId/end-of-sprint', authenticateToken, async (req, res) => {
  const { sprintId } = req.params;
  try {
    const sprint = db.prepare('SELECT * FROM sprints WHERE sprint_id = ?').get(sprintId);
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

    const tasks = db.prepare('SELECT t.*, e.name as assignee FROM tasks t LEFT JOIN employees e ON t.assigned_to = e.id WHERE t.sprint_id = ?').all(sprintId);
    const taskIds = tasks.map(t => t.task_id);
    
    let subtasks = [];
    let queries = [];
    if (taskIds.length > 0) {
      const placeholders = taskIds.map(() => '?').join(',');
      subtasks = db.prepare(\`SELECT s.*, e.name as employee_name FROM subtasks s LEFT JOIN employees e ON s.created_by = e.id WHERE s.task_id IN (\${placeholders})\`).all(...taskIds);
      queries = db.prepare(\`SELECT q.*, e1.name as raised_by_name, e2.name as replied_by_name FROM queries q LEFT JOIN employees e1 ON q.raised_by = e1.id LEFT JOIN employees e2 ON q.replied_by = e2.id WHERE q.task_id IN (\${placeholders})\`).all(...taskIds);
    }

    const members = db.prepare('SELECT COUNT(*) as count FROM sprint_members WHERE sprint_id = ?').get(sprintId);
    const requirements = db.prepare('SELECT * FROM sprint_notes WHERE sprint_id = ?').all(sprintId);
    const attachments = db.prepare('SELECT * FROM sprint_attachments WHERE sprint_id = ?').all(sprintId);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Nokia Sprint Platform';

    // Sheet 1: Sprint Overview
    const s1 = setupExcelSheet(workbook, 'Sprint Overview', [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 50 }
    ]);

    const totalTasks = tasks.length;
    const tasksDone = tasks.filter(t => t.status === 'done').length;
    const completionRate = totalTasks > 0 ? ((tasksDone / totalTasks) * 100).toFixed(1) + '%' : '0%';
    const totalEst = tasks.reduce((sum, t) => sum + t.estimated_hours, 0);
    const totalAct = tasks.reduce((sum, t) => sum + t.spent_hours, 0);
    const variance = totalEst - totalAct;
    const variancePct = totalEst > 0 ? (((totalAct - totalEst) / totalEst) * 100).toFixed(1) + '%' : '0%';
    const diffTime = Math.abs(new Date(sprint.end_date) - new Date(sprint.start_date));
    const totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const velocity = (tasksDone / totalDays).toFixed(2);

    let health = 'Healthy';
    if (sprint.status === 'active') {
      const now = new Date();
      const elapsedDays = Math.floor((now - new Date(sprint.start_date)) / (1000 * 60 * 60 * 24)) + 1;
      const expectedDone = totalTasks * (elapsedDays / totalDays);
      if (tasksDone < expectedDone * 0.7) health = 'Delayed';
      else if (tasksDone < expectedDone * 0.9) health = 'At Risk';
    } else if (sprint.status === 'completed' && tasksDone < totalTasks) {
      health = 'At Risk';
    }

    s1.addRows([
      { metric: 'Sprint ID', value: sprint.sprint_id },
      { metric: 'Sprint Name', value: sprint.sprint_name },
      { metric: 'Sprint Goal', value: sprint.sprint_goal },
      { metric: 'Sprint Description', value: sprint.description },
      { metric: 'Start Date', value: sprint.start_date },
      { metric: 'End Date', value: sprint.end_date },
      { metric: 'Total Duration (days)', value: totalDays },
      { metric: 'Sprint Mode/Status', value: sprint.status },
      { metric: 'Team Size', value: members.count },
      { metric: 'Sprint Health', value: health },
      { metric: 'Total Main Tasks', value: totalTasks },
      { metric: 'Tasks Completed (Done)', value: tasksDone },
      { metric: 'Tasks In Progress', value: tasks.filter(t => t.status === 'inprogress').length },
      { metric: 'Tasks Blocked', value: tasks.filter(t => t.status === 'blocked').length },
      { metric: 'Tasks To Do', value: tasks.filter(t => t.status === 'todo').length },
      { metric: 'Completion Rate', value: completionRate },
      { metric: 'Total Estimated Hours', value: totalEst },
      { metric: 'Total Actual Hours', value: totalAct },
      { metric: 'Effort Variance', value: variance },
      { metric: 'Effort Variance %', value: variancePct },
      { metric: 'Sprint Velocity', value: velocity }
    ]);
    
    // Color status in overview
    applyStatusColor(s1.getCell('H9'), sprint.status);

    // Sheet 2: Task Summary
    const s2 = setupExcelSheet(workbook, 'Task Summary', [
      { header: 'Task ID', key: 'id', width: 15 },
      { header: 'Task Title', key: 'title', width: 40 },
      { header: 'Assigned Employee', key: 'assignee', width: 25 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Estimated Hours', key: 'est', width: 15 },
      { header: 'Actual Hours', key: 'act', width: 15 },
      { header: 'Effort Variance', key: 'var', width: 15 },
      { header: 'Total Subtasks', key: 'subTotal', width: 15 },
      { header: 'Subtasks Done', key: 'subDone', width: 15 },
      { header: 'Subtask Comp %', key: 'subPct', width: 15 }
    ]);

    tasks.forEach(t => {
      const tSubs = subtasks.filter(s => s.task_id === t.task_id);
      const sDone = tSubs.filter(s => s.status === 'done').length;
      const sPct = tSubs.length > 0 ? Math.round((sDone / tSubs.length) * 100) + '%' : 'N/A';
      const row = s2.addRow({
        id: t.task_id,
        title: t.task_title,
        assignee: t.assignee,
        status: t.status,
        est: t.estimated_hours,
        act: t.spent_hours,
        var: t.estimated_hours - t.spent_hours,
        subTotal: tSubs.length,
        subDone: sDone,
        subPct: sPct
      });
      applyStatusColor(row.getCell('status'), t.status);
    });

    // Sheet 3: Subtask Breakdown
    const s3 = setupExcelSheet(workbook, 'Subtask Breakdown', [
      { header: 'Parent Task ID', key: 'pid', width: 15 },
      { header: 'Parent Task Title', key: 'ptitle', width: 30 },
      { header: 'Subtask Title', key: 'stitle', width: 40 },
      { header: 'Employee', key: 'emp', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Estimated', key: 'est', width: 12 },
      { header: 'Actual', key: 'act', width: 12 },
      { header: 'Variance', key: 'var', width: 12 }
    ]);

    subtasks.forEach(s => {
      const parent = tasks.find(t => t.task_id === s.task_id);
      const row = s3.addRow({
        pid: s.task_id,
        ptitle: parent ? parent.task_title : '',
        stitle: s.subtask_title,
        emp: s.employee_name || (parent ? parent.assignee : ''),
        status: s.status,
        est: s.estimated_hours,
        act: s.spent_hours,
        var: s.estimated_hours - s.spent_hours
      });
      applyStatusColor(row.getCell('status'), s.status);
    });

    // Sheet 4: Burndown Data
    const s4 = setupExcelSheet(workbook, 'Burndown Data', [
      { header: 'Day Number', key: 'dayNum', width: 15 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Tasks Remaining (Actual)', key: 'actual', width: 25 },
      { header: 'Tasks Remaining (Ideal)', key: 'ideal', width: 25 },
      { header: 'Variance', key: 'var', width: 15 }
    ]);

    // Simplified burndown calculation
    for(let i=0; i<totalDays; i++) {
        const d = new Date(sprint.start_date);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().slice(0,10);
        const ideal = Math.max(0, totalTasks - (totalTasks/totalDays)*i).toFixed(1);
        s4.addRow({
            dayNum: \`D\${i+1}\`,
            date: dateStr,
            actual: i === 0 ? totalTasks : (i === totalDays-1 ? totalTasks - tasksDone : '-'),
            ideal: ideal,
            var: '-'
        });
    }

    // Sheet 5: Queries & Blockers
    const s5 = setupExcelSheet(workbook, 'Queries & Blockers', [
      { header: 'Query ID', key: 'qid', width: 15 },
      { header: 'Raised By', key: 'raised', width: 20 },
      { header: 'Related Task', key: 'task', width: 25 },
      { header: 'Query Description', key: 'desc', width: 50 },
      { header: 'Date Raised', key: 'dateR', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Date Resolved', key: 'dateRes', width: 20 }
    ]);

    queries.forEach(q => {
      s5.addRow({
        qid: q.query_id,
        raised: q.raised_by_name,
        task: q.task_id,
        desc: q.query_text,
        dateR: q.created_at,
        status: q.status,
        dateRes: q.resolved_at || ''
      });
    });

    // Sheet 6: Notes & Requirements
    const s6 = setupExcelSheet(workbook, 'Sprint Notes & Requirements', [
      { header: 'Title/Name', key: 'title', width: 30 },
      { header: 'Content/Link', key: 'content', width: 60 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Date Added', key: 'date', width: 20 }
    ]);

    requirements.forEach(r => s6.addRow({ title: r.title, content: r.content, type: 'Text Note', date: r.created_at }));
    attachments.forEach(a => s6.addRow({ title: a.file_name, content: a.file_url, type: 'Document/Link', date: a.created_at }));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', \`attachment; filename=\${sprint.sprint_id}_End_of_Sprint_Report.xlsx\`);
    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate End of Sprint Report' });
  }
});


app.get('/api/reports/:sprintId/team-performance', authenticateToken, async (req, res) => {
  const { sprintId } = req.params;
  try {
    const sprint = db.prepare('SELECT * FROM sprints WHERE sprint_id = ?').get(sprintId);
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

    const members = db.prepare('SELECT sm.*, e.name as emp_name FROM sprint_members sm JOIN employees e ON sm.user_id = e.id WHERE sm.sprint_id = ?').all(sprintId);
    const tasks = db.prepare('SELECT * FROM tasks WHERE sprint_id = ?').all(sprintId);
    
    let subtasks = [];
    if (tasks.length > 0) {
      const taskIds = tasks.map(t => t.task_id);
      const placeholders = taskIds.map(() => '?').join(',');
      subtasks = db.prepare(\`SELECT * FROM subtasks WHERE task_id IN (\${placeholders})\`).all(...taskIds);
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Nokia Sprint Platform';

    // Sheet 1: Team Performance Summary
    const s1 = setupExcelSheet(workbook, 'Team Performance Summary', [
      { header: 'Employee Name', key: 'name', width: 25 },
      { header: 'Role', key: 'role', width: 15 },
      { header: 'Total Tasks', key: 'tTotal', width: 12 },
      { header: 'Tasks Done', key: 'tDone', width: 12 },
      { header: 'Task Comp %', key: 'tPct', width: 12 },
      { header: 'Total Subtasks', key: 'sTotal', width: 15 },
      { header: 'Subtasks Done', key: 'sDone', width: 15 },
      { header: 'Total Est Hours', key: 'est', width: 15 },
      { header: 'Total Act Hours', key: 'act', width: 15 },
      { header: 'Effort Variance', key: 'var', width: 15 },
      { header: 'Efficiency Score', key: 'eff', width: 15 },
      { header: 'Efficiency Rating', key: 'rating', width: 20 }
    ]);

    members.forEach(m => {
      const mTasks = tasks.filter(t => t.assigned_to === m.user_id);
      const tDone = mTasks.filter(t => t.status === 'done').length;
      const tPct = mTasks.length > 0 ? Math.round((tDone / mTasks.length) * 100) : 0;
      
      const mSubtasks = subtasks.filter(s => mTasks.some(t => t.task_id === s.task_id));
      const sDone = mSubtasks.filter(s => s.status === 'done').length;

      const mEst = mTasks.reduce((acc, t) => acc + t.estimated_hours, 0);
      const mAct = mTasks.reduce((acc, t) => acc + t.spent_hours, 0);
      
      const effScore = mAct > 0 ? Math.round((mEst / mAct) * 100) : (mEst > 0 ? 100 : 0);
      let rating = 'Needs Improvement';
      if (effScore >= 110) rating = 'Excellent';
      else if (effScore >= 90) rating = 'Good';
      else if (effScore >= 70) rating = 'Average';

      const row = s1.addRow({
        name: m.emp_name,
        role: m.role || 'Member',
        tTotal: mTasks.length,
        tDone: tDone,
        tPct: tPct + '%',
        sTotal: mSubtasks.length,
        sDone: sDone,
        est: mEst,
        act: mAct,
        var: mEst - mAct,
        eff: effScore + '%',
        rating: rating
      });
      applyEfficiencyColor(row.getCell('eff'), effScore);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', \`attachment; filename=\${sprint.sprint_id}_Team_Performance_Report.xlsx\`);
    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate Team Performance Report' });
  }
});
`;

let serverCode = fs.readFileSync('server.js', 'utf8');

// 1. Add import
if (!serverCode.includes('const ExcelJS = require(')) {
  serverCode = serverCode.replace("const express = require('express');", "const express = require('express');\nconst ExcelJS = require('exceljs');");
}

// 2. Add endpoints
if (!serverCode.includes('/api/reports/:sprintId/end-of-sprint')) {
  const attachPoint = '// ══════════════════════════════════════════════════════════════════════════\n// SPA FALLBACK';
  serverCode = serverCode.replace(attachPoint, excelLogic + '\n' + attachPoint);
}

fs.writeFileSync('server.js', serverCode);
console.log("Updated server.js");
