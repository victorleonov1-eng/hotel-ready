import PDFDocument from 'pdfkit';
import type { UserProfile, Scenario } from '../src/content/types.js';

const CRIMSON = '#960404';
const TEAL = '#039594';

export async function generateReportPDF(profiles: UserProfile[], scenarios: Scenario[]) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('error', reject);
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    // Header with left and right layout
    const headerY = doc.y;
    const pageWidth = doc.page.width;

    // Left side - HOTEL Ready (40pt from left)
    doc.fontSize(22).font('Helvetica-Bold').fillColor(CRIMSON).text('HOTEL Ready', 40, headerY, {
      width: pageWidth / 2 - 60,
    });

    // Right side - Hotel Name (positioned on right)
    doc.fontSize(14).font('Helvetica-Bold').fillColor(CRIMSON).text('Hotel Name', pageWidth / 2, headerY, {
      width: pageWidth / 2 - 60,
      align: 'right',
    });

    // Move down after header
    doc.y = headerY + 35;
    doc.moveDown(0.5);

    // Subtitle and date
    doc.fontSize(12).font('Helvetica').fillColor('#333').text('Team Performance Report', {
      align: 'center',
    });
    doc.fontSize(10).fillColor('#999').text(`Generated: ${new Date().toLocaleDateString()}`, {
      align: 'center',
    });
    doc.moveDown(0.5);

    // Horizontal line
    doc.moveTo(40, doc.y).lineTo(pageWidth - 40, doc.y).stroke('#ccc');
    doc.moveDown(1);

    // Team Summary
    doc.fontSize(16).font('Helvetica-Bold').fillColor(CRIMSON).text('Team Summary');
    doc.fontSize(11).font('Helvetica').fillColor('#333');

    const totalAttempts = profiles.reduce((sum: number, p) => sum + p.attempts.length, 0);
    const avgScore = totalAttempts > 0
      ? Math.round(
          profiles.reduce((sum: number, p) => sum + p.attempts.reduce((s: number, a) => s + a.score, 0), 0) / totalAttempts
        )
      : 0;

    const summaryData = [
      { label: 'Total Staff', value: profiles.length },
      { label: 'Total Attempts', value: totalAttempts },
      { label: 'Average Score', value: avgScore },
      { label: 'Departments', value: [...new Set(profiles.map((p) => p.department))].length },
    ];

    // Summary boxes - 2x2 grid layout
    const boxWidth = (doc.page.width - 120) / 2; // 40 left margin + 40 gap + 40 right margin
    const boxHeight = 65;
    const gapX = 40; // gap between left and right boxes
    const gapY = 15; // gap between top and bottom rows
    const startX = 40;
    const startY = doc.y;

    summaryData.forEach((item, idx) => {
      // Calculate row and column
      const row = Math.floor(idx / 2); // 0 or 1
      const col = idx % 2; // 0 or 1

      // Calculate position
      const x = startX + col * (boxWidth + gapX);
      const y = startY + row * (boxHeight + gapY);

      // Draw box border
      doc.rect(x, y, boxWidth, boxHeight).stroke('#ccc');

      // Draw label
      doc.fontSize(11).font('Helvetica').fillColor('#666').text(
        item.label,
        x + 10,
        y + 8,
        { width: boxWidth - 20, height: 15 }
      );

      // Draw value
      doc.fontSize(18).font('Helvetica-Bold').fillColor(TEAL).text(
        String(item.value),
        x + 10,
        y + 28,
        { width: boxWidth - 20, height: 25 }
      );
    });

    // Move cursor below the 2x2 grid
    doc.y = startY + 2 * (boxHeight + gapY) + 20;
    doc.moveDown();

    // Top Performers
    doc.fontSize(16).font('Helvetica-Bold').fillColor(CRIMSON).text('Top Performers');
    doc.fontSize(11).font('Helvetica').fillColor('#333');

    const topPerformers = profiles
      .filter((p) => p.attempts.length > 0)
      .map((p) => ({
        name: `${p.firstName} ${p.lastName}`,
        avg: Math.round(p.attempts.reduce((sum: number, a) => sum + a.score, 0) / p.attempts.length),
        attempts: p.attempts.length,
        best: Math.max(...p.attempts.map((a) => a.score)),
      }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 5);

    if (topPerformers.length === 0) {
      doc.fontSize(11).fillColor('#666').text('No attempts yet');
    } else {
      doc.fontSize(10).fillColor('#333');
      topPerformers.forEach((staff: typeof topPerformers[0], idx) => {
        const rank = idx + 1;
        doc.text(
          `${rank}. ${staff.name} - Avg: ${staff.avg}, Best: ${staff.best}, Attempts: ${staff.attempts}`
        );
      });
    }

    doc.moveDown();

    // Needs Improvement
    doc.fontSize(16).font('Helvetica-Bold').fillColor(CRIMSON).text('Needs Improvement');
    doc.fontSize(11).font('Helvetica').fillColor('#333');

    const needsImprovement = profiles
      .filter((p) => p.attempts.length > 0)
      .map((p) => ({
        name: `${p.firstName} ${p.lastName}`,
        avg: Math.round(p.attempts.reduce((sum: number, a) => sum + a.score, 0) / p.attempts.length),
        attempts: p.attempts.length,
      }))
      .filter((p) => p.avg < 65)
      .sort((a, b) => a.avg - b.avg);

    if (needsImprovement.length === 0) {
      doc.fontSize(11).fillColor('#333').text('All staff performing well (avg >= 65)');
    } else {
      doc.fontSize(10).fillColor('#333');
      needsImprovement.forEach((staff: typeof needsImprovement[0]) => {
        doc.text(`- ${staff.name} - Avg: ${staff.avg} (${staff.attempts} attempts)`);
      });
    }

    doc.moveDown();

    // Scenario Difficulty Analysis
    if (doc.y > doc.page.height - 100) {
      doc.addPage();
    }

    doc.fontSize(16).font('Helvetica-Bold').fillColor(CRIMSON).text('Scenario Difficulty Analysis');
    doc.fontSize(11).font('Helvetica').fillColor('#333');

    const scenarioStats = scenarios
      .map((s) => {
        const scores = profiles.flatMap((p) => p.attempts.filter((a) => a.scenarioId === s.id).map((a) => a.score));
        return {
          title: s.title,
          avg: scores.length ? Math.round(scores.reduce((a: number, b) => a + b, 0) / scores.length) : null,
          attempts: scores.length,
          best: scores.length ? Math.max(...scores) : null,
        };
      })
      .filter((s) => s.attempts > 0)
      .sort((a, b) => (a.avg ?? 0) - (b.avg ?? 0));

    if (scenarioStats.length === 0) {
      doc.fontSize(11).fillColor('#333').text('No scenario attempts yet');
    } else {
      doc.fontSize(10).fillColor('#333');
      scenarioStats.slice(0, 10).forEach((scenario: typeof scenarioStats[0]) => {
        doc.text(`${scenario.title}`, 40);
        doc.fontSize(9).fillColor('#666').text(`Avg: ${scenario.avg ?? 'N/A'} (${scenario.attempts} attempts)`, 40);
        doc.moveDown(0.5);
      });
    }

    doc.moveDown();

    // Staff Details (on new page if needed)
    if (profiles.length > 0) {
      if (doc.y > doc.page.height - 150) {
        doc.addPage();
      }

      doc.fontSize(16).font('Helvetica-Bold').fillColor(CRIMSON).text('Staff Performance Details');
      doc.fontSize(11).font('Helvetica').fillColor('#333');
      doc.moveDown();

      profiles.forEach((staff: UserProfile, idx) => {
        if (doc.y > doc.page.height - 80) {
          doc.addPage();
        }

        const avgScore =
          staff.attempts.length > 0
            ? Math.round(staff.attempts.reduce((sum: number, a) => sum + a.score, 0) / staff.attempts.length)
            : 0;

        doc.fontSize(12).font('Helvetica-Bold').fillColor(CRIMSON).text(
          `${idx + 1}. ${staff.firstName} ${staff.lastName}`
        );
        doc.fontSize(10).font('Helvetica').fillColor('#333');
        doc.text(`Position: ${staff.position} | Department: ${staff.department}`);
        doc.text(
          `Attempts: ${staff.attempts.length} | Average: ${avgScore} | Best: ${staff.attempts.length > 0 ? Math.max(...staff.attempts.map((a) => a.score)) : 'N/A'}`
        );
        doc.moveDown();
      });
    }

    doc.end();
  });
}
