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

    // Header
    doc.fontSize(24).font('Helvetica-Bold').fillColor(CRIMSON).text('HOTEL Ready', { align: 'center' });
    doc.fontSize(14).font('Helvetica').fillColor('#666').text('Team Performance Report', { align: 'center' });
    doc.fontSize(10).fillColor('#999').text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown();

    // Team Summary
    doc.fontSize(14).font('Helvetica-Bold').fillColor(CRIMSON).text('📊 Team Summary');
    doc.fontSize(10).font('Helvetica').fillColor('#333');

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

    doc.fillColor('#666');
    const boxWidth = (doc.page.width - 80) / 2;
    let x = 40;
    let y = doc.y;

    summaryData.forEach((item, idx) => {
      if (idx === 2) {
        x = 40;
        y += 60;
      } else if (idx === 1) {
        x = 40 + boxWidth + 20;
      }

      doc.rect(x, y, boxWidth, 50).stroke('#ddd');
      doc.fontSize(11).font('Helvetica-Bold').text(item.label, x + 10, y + 10, { width: boxWidth - 20 });
      doc.fontSize(16).font('Helvetica-Bold').fillColor(TEAL).text(String(item.value), x + 10, y + 25, { width: boxWidth - 20 });
      doc.fillColor('#666');
    });

    doc.moveDown(6);

    // Top Performers
    doc.fontSize(14).font('Helvetica-Bold').fillColor(CRIMSON).text('🏆 Top Performers');
    doc.fontSize(10).font('Helvetica').fillColor('#333');

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
      doc.fontSize(10).fillColor('#999').text('No attempts yet');
    } else {
      doc.fontSize(9).fillColor('#666');
      topPerformers.forEach((staff: typeof topPerformers[0], idx) => {
        const rank = idx + 1;
        doc.text(
          `${rank}. ${staff.name} — Avg: ${staff.avg}, Best: ${staff.best}, Attempts: ${staff.attempts}`
        );
      });
    }

    doc.moveDown();

    // Needs Improvement
    doc.fontSize(14).font('Helvetica-Bold').fillColor(CRIMSON).text('⚠️ Needs Improvement');
    doc.fontSize(10).font('Helvetica').fillColor('#333');

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
      doc.fontSize(10).fillColor('#999').text('All staff performing well (avg ≥ 65)');
    } else {
      doc.fontSize(9).fillColor('#666');
      needsImprovement.forEach((staff: typeof needsImprovement[0]) => {
        doc.text(`• ${staff.name} — Avg: ${staff.avg} (${staff.attempts} attempts)`);
      });
    }

    doc.moveDown();

    // Scenario Difficulty Analysis
    if (doc.y > doc.page.height - 100) {
      doc.addPage();
    }

    doc.fontSize(14).font('Helvetica-Bold').fillColor(CRIMSON).text('📋 Scenario Difficulty Analysis');
    doc.fontSize(10).font('Helvetica').fillColor('#333');

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
      doc.fontSize(10).fillColor('#999').text('No scenario attempts yet');
    } else {
      doc.fontSize(8).fillColor('#666');
      scenarioStats.slice(0, 10).forEach((scenario: typeof scenarioStats[0]) => {
        const barWidth = 200;
        const fillWidth = (scenario.avg ?? 0) * 2;
        doc.text(`${scenario.title}`);
        doc.rect(40, doc.y, barWidth, 12).stroke('#ddd');
        if (fillWidth > 0) {
          doc.rect(40, doc.y, fillWidth, 12).fill(TEAL);
        }
        doc.fillColor('#666').text(`${scenario.avg ?? 'N/A'} avg (${scenario.attempts} attempts)`, barWidth + 60, doc.y - 12);
        doc.moveDown(2);
      });
    }

    // Staff Details (on new page if needed)
    if (profiles.length > 0) {
      if (doc.y > doc.page.height - 150) {
        doc.addPage();
      }

      doc.fontSize(14).font('Helvetica-Bold').fillColor(CRIMSON).text('👥 Staff Performance Details');
      doc.fontSize(10).font('Helvetica').fillColor('#333');
      doc.moveDown(0.5);

      profiles.forEach((staff: UserProfile, idx) => {
        if (doc.y > doc.page.height - 80) {
          doc.addPage();
        }

        const avgScore =
          staff.attempts.length > 0
            ? Math.round(staff.attempts.reduce((sum: number, a) => sum + a.score, 0) / staff.attempts.length)
            : 0;

        doc.fontSize(11).font('Helvetica-Bold').fillColor(CRIMSON).text(
          `${idx + 1}. ${staff.firstName} ${staff.lastName}`
        );
        doc.fontSize(9).font('Helvetica').fillColor('#666');
        doc.text(`Position: ${staff.position} | Department: ${staff.department}`);
        doc.text(
          `Attempts: ${staff.attempts.length} | Average: ${avgScore} | Best: ${staff.attempts.length > 0 ? Math.max(...staff.attempts.map((a) => a.score)) : 'N/A'}`
        );
        doc.moveDown(0.3);
      });
    }

    doc.end();
  });
}
