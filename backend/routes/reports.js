const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const pool = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

function formatDate(d) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function drawTableRow(doc, cols, y, widths, isHeader = false) {
  const padding = 6;
  const rowHeight = 20;
  if (isHeader) {
    doc.fillColor('#1e2d4a').rect(50, y, widths.reduce((a, b) => a + b, 0), rowHeight).fill();
    doc.fillColor('#00d4ff');
  } else {
    doc.fillColor('#f8f9fa').rect(50, y, widths.reduce((a, b) => a + b, 0), rowHeight).fill();
    doc.fillColor('#2c3e50');
  }
  let x = 50;
  cols.forEach((col, i) => {
    doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
       .fontSize(8)
       .text(String(col || ''), x + padding, y + padding, { width: widths[i] - padding * 2, lineBreak: false });
    x += widths[i];
  });
  doc.strokeColor('#dee2e6').moveTo(50, y + rowHeight).lineTo(50 + widths.reduce((a, b) => a + b, 0), y + rowHeight).stroke();
  return y + rowHeight;
}

// POST /api/reports/crimes - Generate crimes PDF report
router.post('/crimes', async (req, res) => {
  const { status, crime_type_id, start_date, end_date } = req.body;

  try {
    const conditions = [];
    const params = [];
    let idx = 1;
    if (status) { conditions.push(`c.status = $${idx}`); params.push(status); idx++; }
    if (crime_type_id) { conditions.push(`c.crime_type_id = $${idx}`); params.push(crime_type_id); idx++; }
    if (start_date) { conditions.push(`c.crime_date >= $${idx}`); params.push(start_date); idx++; }
    if (end_date) { conditions.push(`c.crime_date <= $${idx}`); params.push(end_date); idx++; }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT c.id, c.location, c.crime_date, c.status, c.description, ct.name AS crime_type_name
       FROM crimes c LEFT JOIN crime_types ct ON c.crime_type_id = ct.id
       ${where}
       ORDER BY c.crime_date DESC LIMIT 500`,
      params
    );

    const statsResult = await pool.query(`
      SELECT COUNT(*) AS total,
             COUNT(*) FILTER (WHERE status = 'open') AS open,
             COUNT(*) FILTER (WHERE status = 'investigating') AS investigating,
             COUNT(*) FILTER (WHERE status = 'closed') AS closed
      FROM crimes
    `);
    const stats = statsResult.rows[0];

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio_crimes_${Date.now()}.pdf"`);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(res);

    // Header
    doc.fillColor('#0a0f1e')
       .rect(0, 0, doc.page.width, 80).fill();
    doc.fillColor('#00d4ff')
       .font('Helvetica-Bold').fontSize(20)
       .text('🔍 Crime Intelligence Platform', 50, 20);
    doc.fillColor('#8899bb').fontSize(11)
       .text('Relatório de Crimes', 50, 48);
    doc.fillColor('#8899bb').fontSize(9)
       .text(`Gerado em: ${new Date().toLocaleString('pt-PT')}`, 50, 62);

    doc.moveDown(3);

    // Summary stats
    doc.fillColor('#2c3e50').font('Helvetica-Bold').fontSize(13).text('Resumo Estatístico', 50, 100);
    doc.moveDown(0.5);

    const statsY = 120;
    const statBoxWidth = 115;
    const statLabels = ['Total', 'Abertos', 'Em Investigação', 'Encerrados'];
    const statValues = [stats.total, stats.open, stats.investigating, stats.closed];
    const statColors = ['#3498db', '#ef4444', '#f59e0b', '#22c55e'];

    statLabels.forEach((label, i) => {
      const x = 50 + i * (statBoxWidth + 5);
      doc.fillColor(statColors[i]).rect(x, statsY, statBoxWidth, 50).fill();
      doc.fillColor('white').font('Helvetica-Bold').fontSize(22)
         .text(statValues[i], x, statsY + 8, { width: statBoxWidth, align: 'center' });
      doc.fillColor('white').font('Helvetica').fontSize(9)
         .text(label, x, statsY + 32, { width: statBoxWidth, align: 'center' });
    });

    doc.moveDown(5);

    // Table
    doc.fillColor('#2c3e50').font('Helvetica-Bold').fontSize(13).text('Lista de Crimes', 50, 190);
    doc.moveDown(0.3);

    const colWidths = [30, 140, 70, 80, 70, 105];
    let y = 210;
    y = drawTableRow(doc, ['ID', 'Local', 'Data', 'Tipo', 'Estado', 'Descrição'], y, colWidths, true);

    result.rows.forEach((crime, i) => {
      if (y > doc.page.height - 60) {
        doc.addPage();
        y = 50;
        y = drawTableRow(doc, ['ID', 'Local', 'Data', 'Tipo', 'Estado', 'Descrição'], y, colWidths, true);
      }
      const statusLabel = { open: 'Aberto', investigating: 'Investigação', closed: 'Encerrado' }[crime.status] || crime.status;
      if (i % 2 === 0) {
        doc.fillColor('#f8f9fa').rect(50, y, colWidths.reduce((a, b) => a + b, 0), 20).fill();
      } else {
        doc.fillColor('white').rect(50, y, colWidths.reduce((a, b) => a + b, 0), 20).fill();
      }
      let x = 50;
      const rowData = [crime.id, crime.location, formatDate(crime.crime_date), crime.crime_type_name || '—', statusLabel, crime.description];
      rowData.forEach((col, ci) => {
        doc.fillColor('#2c3e50').font('Helvetica').fontSize(8)
           .text(String(col || ''), x + 6, y + 6, { width: colWidths[ci] - 12, lineBreak: false });
        x += colWidths[ci];
      });
      doc.strokeColor('#dee2e6')
         .moveTo(50, y + 20)
         .lineTo(50 + colWidths.reduce((a, b) => a + b, 0), y + 20).stroke();
      y += 20;
    });

    // Footer
    doc.fillColor('#8899bb').fontSize(8)
       .text(`Total de registos: ${result.rows.length}`, 50, doc.page.height - 40);

    doc.end();
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error generating PDF report.' });
    }
  }
});

// POST /api/reports/people - Generate people PDF report
router.post('/people', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.first_name, p.last_name, p.date_of_birth, p.id_number, p.nationality,
              COUNT(DISTINCT cs.crime_id) AS suspect_count,
              COUNT(DISTINCT cv.crime_id) AS victim_count
       FROM people p
       LEFT JOIN crime_suspects cs ON cs.person_id = p.id
       LEFT JOIN crime_victims cv ON cv.person_id = p.id
       GROUP BY p.id, p.first_name, p.last_name, p.date_of_birth, p.id_number, p.nationality
       ORDER BY p.last_name, p.first_name
       LIMIT 500`
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio_pessoas_${Date.now()}.pdf"`);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(res);

    doc.fillColor('#0a0f1e').rect(0, 0, doc.page.width, 80).fill();
    doc.fillColor('#00d4ff').font('Helvetica-Bold').fontSize(20)
       .text('🔍 Crime Intelligence Platform', 50, 20);
    doc.fillColor('#8899bb').fontSize(11).text('Relatório de Pessoas', 50, 48);
    doc.fillColor('#8899bb').fontSize(9)
       .text(`Gerado em: ${new Date().toLocaleString('pt-PT')}`, 50, 62);

    doc.moveDown(3);
    doc.fillColor('#2c3e50').font('Helvetica-Bold').fontSize(13).text('Lista de Pessoas', 50, 100);

    const colWidths = [30, 120, 80, 70, 70, 60, 60];
    let y = 120;
    y = drawTableRow(doc, ['ID', 'Nome', 'BI/NIF', 'Nascimento', 'Nacionalidade', 'Suspeito', 'Vítima'], y, colWidths, true);

    result.rows.forEach((person, i) => {
      if (y > doc.page.height - 60) {
        doc.addPage();
        y = 50;
        y = drawTableRow(doc, ['ID', 'Nome', 'BI/NIF', 'Nascimento', 'Nacionalidade', 'Suspeito', 'Vítima'], y, colWidths, true);
      }
      if (i % 2 === 0) {
        doc.fillColor('#f8f9fa').rect(50, y, colWidths.reduce((a, b) => a + b, 0), 20).fill();
      } else {
        doc.fillColor('white').rect(50, y, colWidths.reduce((a, b) => a + b, 0), 20).fill();
      }
      let x = 50;
      const rowData = [
        person.id,
        `${person.first_name} ${person.last_name}`,
        person.id_number || '—',
        formatDate(person.date_of_birth),
        person.nationality || '—',
        person.suspect_count,
        person.victim_count,
      ];
      rowData.forEach((col, ci) => {
        doc.fillColor('#2c3e50').font('Helvetica').fontSize(8)
           .text(String(col || ''), x + 6, y + 6, { width: colWidths[ci] - 12, lineBreak: false });
        x += colWidths[ci];
      });
      doc.strokeColor('#dee2e6')
         .moveTo(50, y + 20)
         .lineTo(50 + colWidths.reduce((a, b) => a + b, 0), y + 20).stroke();
      y += 20;
    });

    doc.fillColor('#8899bb').fontSize(8)
       .text(`Total de registos: ${result.rows.length}`, 50, doc.page.height - 40);
    doc.end();
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error generating PDF report.' });
    }
  }
});

module.exports = router;
