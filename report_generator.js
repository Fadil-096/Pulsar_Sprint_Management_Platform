const ExcelJS = require('exceljs');

module.exports = function(app, db, authMiddleware) {
  
  // Helper to fetch QuickChart image as buffer
  async function fetchChartImage(chartConfig) {
    try {
      // We use native fetch if available (Node 18+), else we could use axios.
      // Since Node 22 is used here, native fetch is available.
      const url = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&w=600&h=300&bkg=white&f=png`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch chart');
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (err) {
      console.error('QuickChart Error:', err);
      return null;
    }
  }

  // Helper to setup cover page
  function setupCoverPage(workbook, title, sprint, membersCount, tasksCount) {
    const sheet = workbook.addWorksheet('Cover Page', {
      pageSetup: { orientation: 'landscape', fitToPage: true },
      headerFooter: { evenFooter: '&L&"Calibri,Regular"&11 ' + sprint.sprint_name + ' &R&P', oddFooter: '&L&"Calibri,Regular"&11 ' + sprint.sprint_name + ' &R&P' }
    });

    // Setup columns
    sheet.columns = [
      { width: 5 }, { width: 30 }, { width: 40 }, { width: 5 }
    ];

    // Background and styling for Cover Header
    sheet.mergeCells('B2:C5');
    const headerCell = sheet.getCell('B2');
    headerCell.value = `${title}\n${sprint.sprint_name} (${sprint.sprint_id})`;
    headerCell.font = { name: 'Aptos', size: 24, bold: true, color: { argb: 'FFFFFFFF' } };
    headerCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF001135' } };

    // Metadata Fields
    const metaData = [
      ['Sprint Dates', `${sprint.start_date} to ${sprint.end_date}`],
      ['Sprint Mode', sprint.status.toUpperCase()],
      ['Team Size', `${membersCount} members`],
      ['Total Tasks', `${tasksCount} tasks`]
    ];

    let rowIdx = 7;
    metaData.forEach(([label, value]) => {
      sheet.getCell(`B${rowIdx}`).value = label;
      sheet.getCell(`B${rowIdx}`).font = { name: 'Aptos', size: 12, bold: true, color: { argb: 'FF001135' } };
      sheet.getCell(`C${rowIdx}`).value = value;
      sheet.getCell(`C${rowIdx}`).font = { name: 'Aptos', size: 12 };
      rowIdx += 2;
    });

    // Timestamp
    sheet.getCell(`B${rowIdx + 2}`).value = `Generated on: ${new Date().toLocaleString()}`;
    sheet.getCell(`B${rowIdx + 2}`).font = { name: 'Aptos', size: 10, italic: true, color: { argb: 'FF888888' } };
    
    return sheet;
  }

  // Helper to style standard table header
  function styleTableHeader(sheet, rowNum, colCount) {
    const row = sheet.getRow(rowNum);
    for (let i = 1; i <= colCount; i++) {
      const cell = row.getCell(i);
      cell.font = { name: 'Aptos', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF001135' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    }
    sheet.autoFilter = {
      from: { row: rowNum, column: 1 },
      to: { row: rowNum, column: colCount }
    };
    sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: rowNum }];
  }

  // Helper to apply alternating row fills
  function applyAlternatingRows(sheet, startRow, endRow, colCount) {
    for (let r = startRow; r <= endRow; r++) {
      const row = sheet.getRow(r);
      for (let c = 1; c <= colCount; c++) {
        const cell = row.getCell(c);
        cell.font = { name: 'Aptos', size: 11 };
        if (r % 2 === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F7FA' } };
        } else {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
        }
      }
    }
  }

  app.get('/api/reports/:sprintId/end-of-sprint', authMiddleware, async (req, res) => {
    const { sprintId } = req.params;
    try {
      const sprint = db.prepare('SELECT * FROM sprints WHERE sprint_id = ?').get(sprintId);
      if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

      const tasks = db.prepare('SELECT t.*, e.name as assignee FROM tasks t LEFT JOIN employees e ON t.assigned_to = e.id WHERE t.sprint_id = ?').all(sprintId);
      const membersCount = db.prepare('SELECT COUNT(*) as count FROM sprint_members WHERE sprint_id = ?').get(sprintId).count;

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Nokia Sprint Platform';

      // Sheet 1: Cover Page
      setupCoverPage(workbook, 'End of Sprint Report', sprint, membersCount, tasks.length);

      // Sheet 2: Sprint Summary
      const s2 = workbook.addWorksheet('Sprint Summary', { pageSetup: { orientation: 'landscape', fitToPage: true } });
      s2.columns = [
        { header: 'Metric', key: 'metric', width: 40 },
        { header: 'Value', key: 'value', width: 40 }
      ];
      
      const tasksDone = tasks.filter(t => t.status === 'done').length;
      const totalEst = tasks.reduce((sum, t) => sum + t.estimated_hours, 0);
      const completionRate = tasks.length > 0 ? (tasksDone / tasks.length) : 0;
      
      // Calculate sprint health based on dates
      let health = 'On Track';
      const now = new Date();
      const diffTime = Math.abs(new Date(sprint.end_date) - new Date(sprint.start_date));
      const totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      const elapsedDays = Math.max(1, Math.floor((now - new Date(sprint.start_date)) / (1000 * 60 * 60 * 24)) + 1);
      const expectedDone = tasks.length * (Math.min(elapsedDays, totalDays) / totalDays);
      
      if (sprint.status === 'active') {
        if (tasksDone < expectedDone * 0.7) health = 'Critical';
        else if (tasksDone < expectedDone * 0.9) health = 'At Risk';
      } else if (sprint.status === 'completed' && tasksDone < tasks.length) {
        health = 'At Risk';
      }

      s2.addRows([
        { metric: 'Sprint ID', value: sprint.sprint_id },
        { metric: 'Sprint Name', value: sprint.sprint_name },
        { metric: 'Total Main Tasks', value: tasks.length },
        { metric: 'Tasks Completed', value: tasksDone },
        { metric: 'Completion Rate', value: completionRate },
        { metric: 'Sprint Health', value: health },
        { metric: 'Total Estimated Hours', value: totalEst },
        { metric: 'Sprint Velocity (Tasks/Day)', value: (tasksDone / totalDays) }
      ]);

      styleTableHeader(s2, 1, 2);
      applyAlternatingRows(s2, 2, 9, 2);

      // Format specific cells
      s2.getColumn(2).eachCell((cell, rowNum) => {
        if (rowNum === 1) return; // skip header
        const metricCell = s2.getCell(`A${rowNum}`);
        metricCell.font = { name: 'Aptos', size: 11, bold: true };
        
        if (metricCell.value === 'Completion Rate') cell.numFmt = '0.00%';
        if (metricCell.value === 'Total Estimated Hours') cell.numFmt = '0.00"h"';
        if (metricCell.value === 'Sprint Health') {
           if (cell.value === 'On Track') cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
           if (cell.value === 'At Risk') cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } };
           if (cell.value === 'Critical') cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
        }
      });
      // Thick top border above velocity
      s2.getCell('A9').border = { top: { style: 'thick', color: { argb: 'FF001135' } } };
      s2.getCell('B9').border = { top: { style: 'thick', color: { argb: 'FF001135' } } };

      // Sheet 3: Task Breakdown
      const s3 = workbook.addWorksheet('Task Breakdown', { pageSetup: { orientation: 'landscape', fitToPage: true } });
      s3.columns = [
        { header: 'Task ID', key: 'id', width: 15 },
        { header: 'Task Name', key: 'title', width: 45 },
        { header: 'Assigned To', key: 'assignee', width: 25 },
        { header: 'Priority', key: 'priority', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Estimated Hours', key: 'est', width: 18 },
        { header: 'Actual Hours', key: 'act', width: 15 },
        { header: 'Variance', key: 'var', width: 15 },
        { header: 'Completion', key: 'comp', width: 15 }
      ];

      tasks.forEach(t => {
        const row = s3.addRow({
          id: t.task_id,
          title: t.task_title,
          assignee: t.assignee || 'Unassigned',
          priority: t.priority.toUpperCase(),
          status: t.status.toUpperCase(),
          est: t.estimated_hours,
          act: 'N/A',
          var: 'N/A',
          comp: t.status === 'done' ? 'Yes' : 'No'
        });
        
        // Priority colors
        const pCell = row.getCell('priority');
        if (t.priority === 'p0' || t.priority === 'critical') pCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
        else if (t.priority === 'p1' || t.priority === 'high') pCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD966' } };
        else if (t.priority === 'p2' || t.priority === 'medium') pCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
        else if (t.priority === 'p3' || t.priority === 'low') pCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
        else pCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
        
        row.getCell('est').numFmt = '0.00"h"';
      });

      styleTableHeader(s3, 1, 9);
      if (tasks.length > 0) applyAlternatingRows(s3, 2, tasks.length + 1, 9);

      // Sheet 4: Burndown Data
      const s4 = workbook.addWorksheet('Burndown Data', { pageSetup: { orientation: 'landscape', fitToPage: true } });
      s4.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Total Tasks Remaining', key: 'actual', width: 25 },
        { header: 'Ideal Remaining', key: 'ideal', width: 20 }
      ];

      const dates = [];
      const actualData = [];
      const idealData = [];

      for(let i=0; i<totalDays; i++) {
        const d = new Date(sprint.start_date);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().slice(0,10);
        const ideal = Math.max(0, tasks.length - (tasks.length/totalDays)*i);
        
        dates.push(dateStr);
        idealData.push(ideal);
        
        // Simplified mock actual for demonstration
        const actualRemaining = i === 0 ? tasks.length : (i === totalDays-1 ? tasks.length - tasksDone : tasks.length - (tasksDone/totalDays)*i);
        actualData.push(actualRemaining);

        s4.addRow({
          date: dateStr,
          actual: Math.round(actualRemaining),
          ideal: Math.round(ideal)
        });
      }

      styleTableHeader(s4, 1, 3);
      applyAlternatingRows(s4, 2, totalDays + 1, 3);

      // Embed Burndown Chart
      const chartConfig = {
        type: 'line',
        data: {
          labels: dates,
          datasets: [
            { label: 'Actual Remaining', data: actualData, borderColor: '#001135', backgroundColor: 'transparent', fill: false, tension: 0.1 },
            { label: 'Ideal Remaining', data: idealData, borderColor: '#0066cc', borderDash: [5, 5], backgroundColor: 'transparent', fill: false, tension: 0.1 }
          ]
        },
        options: {
          title: { display: true, text: 'Sprint Burndown Chart', fontColor: '#001135', fontSize: 16 },
          scales: {
            xAxes: [{ scaleLabel: { display: true, labelString: 'Date' } }],
            yAxes: [{ scaleLabel: { display: true, labelString: 'Tasks Remaining' }, ticks: { beginAtZero: true } }]
          }
        }
      };

      const chartBuffer = await fetchChartImage(chartConfig);
      if (chartBuffer) {
        const imageId = workbook.addImage({ buffer: chartBuffer, extension: 'png' });
        s4.addImage(imageId, {
          tl: { col: 4, row: 1 },
          ext: { width: 600, height: 300 }
        });
      }

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${sprint.sprint_id}_End_of_Sprint_Report.xlsx`);
      await workbook.xlsx.write(res);
      res.end();

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to generate End of Sprint Report' });
    }
  });


  app.get('/api/reports/:sprintId/team-performance', authMiddleware, async (req, res) => {
    const { sprintId } = req.params;
    try {
      const sprint = db.prepare('SELECT * FROM sprints WHERE sprint_id = ?').get(sprintId);
      if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

      const members = db.prepare('SELECT sm.*, e.name as emp_name, e.role FROM sprint_members sm JOIN employees e ON sm.user_id = e.id WHERE sm.sprint_id = ?').all(sprintId);
      const tasks = db.prepare('SELECT * FROM tasks WHERE sprint_id = ?').all(sprintId);

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Nokia Sprint Platform';

      // Sheet 1: Cover Page
      setupCoverPage(workbook, 'Team Performance Report', sprint, members.length, tasks.length);

      // Prepare Data
      const empStats = members.map(m => {
        const mTasks = tasks.filter(t => t.assigned_to === m.user_id);
        const done = mTasks.filter(t => t.status === 'done').length;
        const est = mTasks.reduce((sum, t) => sum + t.estimated_hours, 0);
        const compPct = mTasks.length > 0 ? (done / mTasks.length) : 0;
        return { name: m.emp_name, role: m.role || 'Employee', total: mTasks.length, done, compPct, est };
      });

      // Sheet 2: Individual Performance Table
      const s2 = workbook.addWorksheet('Individual Performance', { pageSetup: { orientation: 'landscape', fitToPage: true } });
      s2.columns = [
        { header: 'Employee Name', key: 'name', width: 25 },
        { header: 'Role', key: 'role', width: 20 },
        { header: 'Total Tasks', key: 'total', width: 15 },
        { header: 'Tasks Done', key: 'done', width: 15 },
        { header: 'Task Completion %', key: 'pct', width: 20 },
        { header: 'Total Subtasks', key: 'sub', width: 15 },
        { header: 'Subtasks Done', key: 'subdone', width: 15 },
        { header: 'Total Estimated Hours', key: 'est', width: 25 },
        { header: 'Total Actual Hours', key: 'act', width: 25 },
        { header: 'Effort Variance', key: 'var', width: 18 },
        { header: 'Efficiency Score', key: 'eff', width: 18 },
        { header: 'Efficiency Rating', key: 'rat', width: 18 }
      ];

      empStats.forEach(e => {
        const row = s2.addRow({
          name: e.name,
          role: e.role.toUpperCase(),
          total: e.total,
          done: e.done,
          pct: e.compPct,
          sub: 'N/A',
          subdone: 'N/A',
          est: e.est,
          act: 'N/A',
          var: 'N/A',
          eff: 'N/A',
          rat: 'N/A'
        });
        row.getCell('pct').numFmt = '0.00%';
        row.getCell('est').numFmt = '0.00"h"';
      });

      styleTableHeader(s2, 1, 12);
      if (empStats.length > 0) applyAlternatingRows(s2, 2, empStats.length + 1, 12);

      // Sheet 3: Performance Summary
      const s3 = workbook.addWorksheet('Performance Summary', { pageSetup: { orientation: 'landscape', fitToPage: true } });
      s3.columns = [
        { header: 'Metric', key: 'metric', width: 30 },
        { header: 'Value', key: 'value', width: 30 }
      ];

      const teamTasks = empStats.reduce((sum, e) => sum + e.total, 0);
      const teamDone = empStats.reduce((sum, e) => sum + e.done, 0);
      const teamEst = empStats.reduce((sum, e) => sum + e.est, 0);
      
      s3.addRows([
        { metric: 'Total Team Tasks', value: teamTasks },
        { metric: 'Total Completed', value: teamDone },
        { metric: 'Overall Completion Rate', value: teamTasks > 0 ? (teamDone / teamTasks) : 0 },
        { metric: 'Total Estimated Hours', value: teamEst },
        { metric: 'Total Actual Hours', value: 'N/A' },
        { metric: 'Team Effort Variance', value: 'N/A' },
        { metric: 'Average Efficiency Score', value: 'N/A' }
      ]);

      styleTableHeader(s3, 1, 2);
      applyAlternatingRows(s3, 2, 8, 2);
      
      s3.getCell('B4').numFmt = '0.00%';
      s3.getCell('B5').numFmt = '0.00"h"';
      
      s3.getColumn(1).font = { name: 'Aptos', size: 11, bold: true };

      // Embed Bar Chart for Task Completion Rates (Replacing Efficiency)
      const chartLabels = empStats.map(e => e.name);
      const chartData = empStats.map(e => Math.round(e.compPct * 100));

      const effChartConfig = {
        type: 'horizontalBar',
        data: {
          labels: chartLabels,
          datasets: [{ label: 'Completion Rate %', data: chartData, backgroundColor: '#001135' }]
        },
        options: {
          title: { display: true, text: 'Team Task Completion by Member', fontColor: '#001135', fontSize: 16 },
          scales: { xAxes: [{ ticks: { min: 0, max: 100 } }] },
          annotation: { annotations: [{ type: 'line', mode: 'vertical', scaleID: 'x-axis-0', value: 100, borderColor: 'green', borderWidth: 2 }] }
        }
      };

      const effChartBuffer = await fetchChartImage(effChartConfig);
      if (effChartBuffer) {
        const imageId = workbook.addImage({ buffer: effChartBuffer, extension: 'png' });
        s3.addImage(imageId, { tl: { col: 3, row: 1 }, ext: { width: 500, height: 300 } });
      }

      // Sheet 4: Hours Allocation
      const s4 = workbook.addWorksheet('Hours Allocation', { pageSetup: { orientation: 'landscape', fitToPage: true } });
      s4.columns = [
        { header: 'Employee Name', key: 'name', width: 25 },
        { header: 'Estimated Hours', key: 'est', width: 20 },
        { header: 'Actual Hours', key: 'act', width: 20 },
        { header: 'Variance', key: 'var', width: 20 }
      ];

      empStats.forEach(e => {
        const row = s4.addRow({ name: e.name, est: e.est, act: 'N/A', var: 'N/A' });
        row.getCell('est').numFmt = '0.00"h"';
      });

      styleTableHeader(s4, 1, 4);
      if (empStats.length > 0) applyAlternatingRows(s4, 2, empStats.length + 1, 4);

      // Embed Grouped Bar Chart for Hours
      const estData = empStats.map(e => e.est);
      const actData = empStats.map(e => 0); // Mock 0 for missing actual hours
      
      const hrsChartConfig = {
        type: 'bar',
        data: {
          labels: chartLabels,
          datasets: [
            { label: 'Estimated Hours', data: estData, backgroundColor: '#001135' },
            { label: 'Actual Hours', data: actData, backgroundColor: '#0066cc' }
          ]
        },
        options: {
          title: { display: true, text: 'Estimated vs Actual Hours Allocation', fontColor: '#001135', fontSize: 16 }
        }
      };

      const hrsChartBuffer = await fetchChartImage(hrsChartConfig);
      if (hrsChartBuffer) {
        const imageId = workbook.addImage({ buffer: hrsChartBuffer, extension: 'png' });
        s4.addImage(imageId, { tl: { col: 5, row: 1 }, ext: { width: 600, height: 350 } });
      }

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${sprint.sprint_id}_Team_Performance_Report.xlsx`);
      await workbook.xlsx.write(res);
      res.end();

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to generate Team Performance Report' });
    }
  });

};
