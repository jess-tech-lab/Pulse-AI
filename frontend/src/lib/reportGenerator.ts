import jsPDF from 'jspdf';
import type { SynthesisReportV2 } from '@/types';

// Color palette for PDF
const COLORS = {
  primary: [79, 70, 229] as [number, number, number],
  primaryLight: [237, 233, 254] as [number, number, number],
  text: [30, 30, 30] as [number, number, number],
  textMuted: [100, 100, 100] as [number, number, number],
  textLight: [150, 150, 150] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  // Severity colors - clean & high contrast
  riskBg: [255, 232, 232] as [number, number, number],
  riskText: [211, 47, 47] as [number, number, number],
  risingBg: [255, 235, 238] as [number, number, number],
  risingText: [194, 5, 47] as [number, number, number],
  mediumBg: [255, 243, 224] as [number, number, number],
  mediumText: [230, 81, 0] as [number, number, number],
  lowBg: [241, 248, 233] as [number, number, number],
  lowText: [85, 139, 47] as [number, number, number],
  successBg: [232, 245, 233] as [number, number, number],
  successText: [46, 125, 50] as [number, number, number],
  neutralBg: [245, 245, 245] as [number, number, number],
};

interface ReportData {
  companyName: string;
  synthesis: SynthesisReportV2;
  generatedAt: string;
  timeWindow?: string;
}

export type ExportMode = 'full' | 'onepager';

// ============================================================================
// FULL STRATEGIC REPORT (5 Pages)
// ============================================================================

export async function generateFullReport(data: ReportData): Promise<Blob> {
  const { companyName, synthesis, generatedAt, timeWindow = '48 hours' } = data;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Helper functions
  const setColor = (color: [number, number, number]) => {
    doc.setTextColor(color[0], color[1], color[2]);
  };

  const setFillColor = (color: [number, number, number]) => {
    doc.setFillColor(color[0], color[1], color[2]);
  };

  const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number, fill: boolean = true) => {
    doc.roundedRect(x, y, w, h, r, r, fill ? 'F' : 'S');
  };

  // Generate primary insight
  const topStrength = synthesis.brandStrengths.topLoves[0]?.feature || 'core features';
  const topIssue = synthesis.focusAreas[0]?.title || 'performance';
  const secondIssue = synthesis.focusAreas[1]?.title || 'reliability';
  const primaryInsight = `Users love your ${topStrength}. ${topIssue} and ${secondIssue.toLowerCase()} are the gates to growth.`;

  // ==================== PAGE 1: HERO COVER ====================

  // Header background
  setFillColor(COLORS.primary);
  doc.rect(0, 0, pageWidth, 55, 'F');

  // Title
  setColor(COLORS.white);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(`${companyName}:`, margin, 30);
  doc.setFontSize(22);
  doc.text('Growth Opportunities Report', margin, 42);

  // Metadata line
  setColor(COLORS.textLight);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${generatedAt}  •  Data from last ${timeWindow}`, margin, pageHeight - 15);

  // Primary Insight - Large bold one-liner
  let y = 75;
  setColor(COLORS.text);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  const insightLines = doc.splitTextToSize(primaryInsight, contentWidth);
  doc.text(insightLines, margin, y);
  y += insightLines.length * 10 + 20;

  // Metrics Grid (4-up)
  const metrics = [
    { label: 'Total Analyzed', value: synthesis.metadata.totalAnalyzed.toString() },
    { label: 'Positive Sentiment', value: `${synthesis.sentiment.positive}%` },
    { label: 'Focus Areas', value: synthesis.focusAreas.length.toString() },
    { label: 'High-Signal', value: synthesis.metadata.highSignalCount.toString() },
  ];

  const gridWidth = (contentWidth - 15) / 4;
  y += 10;

  metrics.forEach((metric, i) => {
    const x = margin + i * (gridWidth + 5);

    // Card background
    setFillColor(COLORS.primaryLight);
    drawRoundedRect(x, y, gridWidth, 45, 4);

    // Value
    setColor(COLORS.primary);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(metric.value, x + gridWidth / 2, y + 22, { align: 'center' });

    // Label
    setColor(COLORS.textMuted);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(metric.label, x + gridWidth / 2, y + 35, { align: 'center' });
  });

  // Sentiment breakdown bar
  y += 65;
  setColor(COLORS.text);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Sentiment Distribution', margin, y);
  y += 10;

  const barWidth = contentWidth;
  const barHeight = 12;
  const positiveWidth = (synthesis.sentiment.positive / 100) * barWidth;
  const neutralWidth = (synthesis.sentiment.neutral / 100) * barWidth;

  // Positive (green)
  setFillColor(COLORS.successBg);
  drawRoundedRect(margin, y, positiveWidth, barHeight, 2);
  // Neutral (gray)
  setFillColor(COLORS.neutralBg);
  doc.rect(margin + positiveWidth, y, neutralWidth, barHeight, 'F');
  // Negative (red) - remainder
  setFillColor(COLORS.riskBg);
  doc.roundedRect(margin + positiveWidth + neutralWidth, y, barWidth - positiveWidth - neutralWidth, barHeight, 2, 2, 'F');

  // Legend
  y += 20;
  doc.setFontSize(9);
  setFillColor(COLORS.successBg);
  doc.circle(margin + 3, y, 3, 'F');
  setColor(COLORS.textMuted);
  doc.text(`Positive ${synthesis.sentiment.positive}%`, margin + 10, y + 3);

  setFillColor(COLORS.neutralBg);
  doc.circle(margin + 70, y, 3, 'F');
  doc.text(`Neutral ${synthesis.sentiment.neutral}%`, margin + 77, y + 3);

  setFillColor(COLORS.riskBg);
  doc.circle(margin + 135, y, 3, 'F');
  doc.text(`Negative ${synthesis.sentiment.negative}%`, margin + 142, y + 3);

  // ==================== PAGE 2: SUMMARY & DELIGHTS ====================
  doc.addPage();
  y = margin;

  // Section header
  setColor(COLORS.primary);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Key Insights', margin, y + 5);
  y += 20;

  // 3 Insight bullets
  const insights = [
    {
      label: 'Churn Risk',
      text: `${synthesis.focusAreas[0]?.title || 'Performance issues'} affecting ${synthesis.focusAreas[0]?.frequency || 0} users - ${synthesis.focusAreas[0]?.stakes.message || 'Monitor closely'}`.slice(0, 120)
    },
    {
      label: 'Adoption',
      text: synthesis.focusAreas.find(a => a.category === 'usability_friction')?.stakes.message || 'Onboarding friction may be limiting growth'
    },
    {
      label: 'Growth',
      text: `Brand strength at ${synthesis.brandStrengths.overallScore}/10 - ${synthesis.brandStrengths.brandPersonality.join(', ')} positioning resonating well`
    },
  ];

  insights.forEach((insight) => {
    // Label badge
    setFillColor(COLORS.primaryLight);
    drawRoundedRect(margin, y - 4, 70, 8, 2);
    setColor(COLORS.primary);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(insight.label.toUpperCase(), margin + 3, y + 1);

    // Text
    setColor(COLORS.text);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const textLines = doc.splitTextToSize(insight.text, contentWidth - 75);
    doc.text(textLines, margin + 75, y + 1);
    y += Math.max(textLines.length * 5, 12) + 8;
  });

  // What Users Love section
  y += 15;
  setColor(COLORS.primary);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('What Users Love', margin, y);
  y += 15;

  // Star-rated cards
  synthesis.brandStrengths.topLoves.forEach((love) => {
    // Card background
    setFillColor(COLORS.successBg);
    drawRoundedRect(margin, y - 3, contentWidth, 35, 4);

    // Feature name
    setColor(COLORS.successText);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(love.feature, margin + 5, y + 5);

    // Stars
    const stars = Math.round(love.shareability / 2);
    let starX = margin + 5;
    for (let s = 0; s < 5; s++) {
      doc.setFontSize(10);
      doc.text(s < stars ? '★' : '☆', starX, y + 15);
      starX += 8;
    }
    doc.setFontSize(9);
    setColor(COLORS.textMuted);
    doc.text(`${love.shareability}/10`, starX + 5, y + 15);

    // Quote (truncated)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    const quoteText = `"${love.quote.slice(0, 80)}${love.quote.length > 80 ? '...' : ''}"`;
    doc.text(quoteText, margin + 5, y + 26);

    y += 42;
  });

  // Methodology footer
  y = pageHeight - 25;
  setFillColor(COLORS.neutralBg);
  drawRoundedRect(margin, y - 5, contentWidth, 18, 2);
  setColor(COLORS.textLight);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Methodology: ${synthesis.metadata.totalAnalyzed} items analyzed from ${synthesis.metadata.dataSources.join(', ')}. ${synthesis.metadata.highSignalCount} high-signal items identified.`,
    margin + 5, y + 4
  );

  // ==================== PAGE 3: VISUAL FOCUS AREAS ====================
  doc.addPage();
  y = margin;

  setColor(COLORS.primary);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Focus Areas', margin, y + 5);
  y += 20;

  // Focus area cards (max 4 per page)
  synthesis.focusAreas.slice(0, 4).forEach((area) => {
    const cardHeight = 55;

    // Card background
    setFillColor(COLORS.white);
    doc.setDrawColor(230, 230, 230);
    doc.roundedRect(margin, y, contentWidth, cardHeight, 4, 4, 'FD');

    // Status tag
    const trendColors = {
      up: { bg: COLORS.risingBg, text: COLORS.risingText, label: 'RISING' },
      down: { bg: COLORS.successBg, text: COLORS.successText, label: 'DECLINING' },
      new: { bg: COLORS.primaryLight, text: COLORS.primary, label: 'NEW' },
      stable: { bg: COLORS.neutralBg, text: COLORS.textMuted, label: 'STABLE' },
    };
    const trendStyle = trendColors[area.trend as keyof typeof trendColors] || trendColors.stable;

    setFillColor(trendStyle.bg);
    drawRoundedRect(margin + 5, y + 5, 45, 8, 2);
    setColor(trendStyle.text);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(trendStyle.label, margin + 8, y + 10);

    // Impact score
    setColor(COLORS.text);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(area.impactScore.toFixed(1), margin + contentWidth - 30, y + 18);
    doc.setFontSize(8);
    setColor(COLORS.textMuted);
    doc.text('impact', margin + contentWidth - 30, y + 25);

    // Title
    setColor(COLORS.text);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(area.title, margin + 55, y + 12);

    // Mention count
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    setColor(COLORS.textMuted);
    doc.text(`${area.frequency} mentions`, margin + 55, y + 20);

    // Severity bar
    const severityWidth = (area.impactScore / 10) * 80;
    const severityColor = area.impactScore >= 7 ? COLORS.riskBg :
                          area.impactScore >= 5 ? COLORS.mediumBg : COLORS.lowBg;
    setFillColor(COLORS.neutralBg);
    drawRoundedRect(margin + 55, y + 25, 80, 5, 1);
    setFillColor(severityColor);
    drawRoundedRect(margin + 55, y + 25, severityWidth, 5, 1);

    // Risk if ignored
    if (area.stakes.type === 'risk') {
      setFillColor(COLORS.riskBg);
      drawRoundedRect(margin + 5, y + 35, contentWidth - 10, 15, 2);
      setColor(COLORS.riskText);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const riskText = area.stakes.message.slice(0, 100) + (area.stakes.message.length > 100 ? '...' : '');
      doc.text(riskText, margin + 8, y + 44);
    }

    y += cardHeight + 8;
  });

  // ==================== PAGE 4 & 5: ROADMAP & DEEP DIVE ====================
  doc.addPage();
  y = margin;

  setColor(COLORS.primary);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Recommended Roadmap', margin, y + 5);
  y += 20;

  // Quarterly OKRs
  synthesis.suggestedOKRs.forEach((okr) => {
    // Quarter header
    setFillColor(COLORS.primaryLight);
    drawRoundedRect(margin, y - 3, 35, 10, 2);
    setColor(COLORS.primary);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(okr.timeframe, margin + 5, y + 4);

    // Theme
    setColor(COLORS.textMuted);
    doc.setFontSize(9);
    doc.text(okr.theme, margin + 45, y + 4);

    y += 15;

    // Objective
    setColor(COLORS.text);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const objLines = doc.splitTextToSize(okr.objective, contentWidth - 10);
    doc.text(objLines, margin + 5, y);
    y += objLines.length * 5 + 5;

    // Key Results
    okr.keyResults.forEach((kr) => {
      setColor(COLORS.successText);
      doc.setFontSize(9);
      doc.text('✓', margin + 5, y);
      setColor(COLORS.text);
      doc.setFont('helvetica', 'normal');
      const krLines = doc.splitTextToSize(kr, contentWidth - 20);
      doc.text(krLines, margin + 15, y);
      y += krLines.length * 4 + 3;
    });

    y += 10;
  });

  // PAGE 5: Segment Breakdown
  doc.addPage();
  y = margin;

  setColor(COLORS.primary);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Segment Analysis', margin, y + 5);
  y += 25;

  // Segment table
  const segments = ['Power Users', 'New Users', 'Mobile Users'];
  const segmentData = segments.map(seg => {
    const relevantAreas = synthesis.focusAreas.filter(a =>
      a.affectedSegments.some(s => s.toLowerCase().includes(seg.toLowerCase().split(' ')[0]))
    );
    return {
      segment: seg,
      topIssue: relevantAreas[0]?.title || 'No specific issues',
      count: relevantAreas.length,
    };
  });

  // Table header
  setFillColor(COLORS.primaryLight);
  drawRoundedRect(margin, y, contentWidth, 12, 2);
  setColor(COLORS.primary);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Segment', margin + 5, y + 8);
  doc.text('Primary Concern', margin + 60, y + 8);
  doc.text('Issues', margin + contentWidth - 25, y + 8);
  y += 15;

  // Table rows
  segmentData.forEach((row, i) => {
    if (i % 2 === 0) {
      setFillColor(COLORS.neutralBg);
      doc.rect(margin, y - 3, contentWidth, 12, 'F');
    }

    setColor(COLORS.text);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(row.segment, margin + 5, y + 5);
    doc.text(row.topIssue.slice(0, 40), margin + 60, y + 5);
    doc.text(row.count.toString(), margin + contentWidth - 20, y + 5);
    y += 12;
  });

  // Expectation Gaps
  y += 20;
  setColor(COLORS.primary);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Expectation Gaps', margin, y);
  y += 12;

  synthesis.expectationGaps.slice(0, 3).forEach((gap) => {
    const severityColors = {
      High: { bg: COLORS.riskBg, text: COLORS.riskText },
      Medium: { bg: COLORS.mediumBg, text: COLORS.mediumText },
      Low: { bg: COLORS.lowBg, text: COLORS.lowText },
    };
    const colors = severityColors[gap.gapSeverity as keyof typeof severityColors] || severityColors.Low;

    // Severity badge
    setFillColor(colors.bg);
    drawRoundedRect(margin, y - 2, 35, 8, 2);
    setColor(colors.text);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(gap.gapSeverity.toUpperCase(), margin + 3, y + 3);

    // Expectation vs Reality
    setColor(COLORS.text);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Expected: ${gap.expectation.slice(0, 50)}`, margin + 40, y + 3);
    y += 10;
    doc.text(`Reality: ${gap.reality.slice(0, 50)}`, margin + 40, y + 3);
    y += 15;
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    setColor(COLORS.textLight);
    doc.text(
      `Page ${i} of ${totalPages}  •  ${companyName} Growth Report  •  Pulse AI`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  return doc.output('blob');
}

// ============================================================================
// EXECUTIVE ONE-PAGER (TL;DR)
// ============================================================================

export async function generateOnePager(data: ReportData): Promise<Blob> {
  const { companyName, synthesis, generatedAt } = data;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Helper functions
  const setColor = (color: [number, number, number]) => {
    doc.setTextColor(color[0], color[1], color[2]);
  };

  const setFillColor = (color: [number, number, number]) => {
    doc.setFillColor(color[0], color[1], color[2]);
  };

  const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number) => {
    doc.roundedRect(x, y, w, h, r, r, 'F');
  };

  // Header
  setFillColor(COLORS.primary);
  doc.rect(0, 0, pageWidth, 35, 'F');

  setColor(COLORS.white);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`${companyName}: Executive Summary`, margin, 22);

  // Hero Metrics Row (Top)
  let y = 45;
  const metricWidth = (contentWidth - 10) / 4;
  const heroMetrics = [
    { label: 'Analyzed', value: synthesis.metadata.totalAnalyzed.toString() },
    { label: 'Sentiment', value: `${synthesis.sentiment.positive}%` },
    { label: 'Focus Areas', value: synthesis.focusAreas.length.toString() },
    { label: 'Brand Score', value: `${synthesis.brandStrengths.overallScore}/10` },
  ];

  heroMetrics.forEach((metric, i) => {
    const x = margin + i * (metricWidth + 3.3);
    setFillColor(COLORS.primaryLight);
    drawRoundedRect(x, y, metricWidth, 28, 3);

    setColor(COLORS.primary);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(metric.value, x + metricWidth / 2, y + 14, { align: 'center' });

    setColor(COLORS.textMuted);
    doc.setFontSize(8);
    doc.text(metric.label, x + metricWidth / 2, y + 22, { align: 'center' });
  });

  // 3 Situation Bullets
  y += 40;
  setColor(COLORS.primary);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('THE SITUATION', margin, y);
  y += 8;

  const situations = [
    `Users love ${synthesis.brandStrengths.topLoves[0]?.feature || 'the product'} - ${synthesis.brandStrengths.overallScore}/10 brand strength`,
    `Top concern: ${synthesis.focusAreas[0]?.title || 'Performance'} (${synthesis.focusAreas[0]?.frequency || 0} mentions, ${synthesis.focusAreas[0]?.trend === 'up' ? 'rising' : 'stable'})`,
    `${synthesis.sentiment.negative}% negative sentiment concentrated in ${synthesis.focusAreas.filter(a => a.stakes.type === 'risk').length} risk areas`,
  ];

  situations.forEach((sit) => {
    setColor(COLORS.text);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('•', margin, y + 3);
    const sitLines = doc.splitTextToSize(sit, contentWidth - 10);
    doc.text(sitLines, margin + 5, y + 3);
    y += sitLines.length * 4 + 4;
  });

  // 3 Priority Focus Area Cards
  y += 8;
  setColor(COLORS.primary);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PRIORITY FOCUS AREAS', margin, y);
  y += 8;

  const cardWidth = (contentWidth - 6) / 3;
  synthesis.focusAreas.slice(0, 3).forEach((area, i) => {
    const x = margin + i * (cardWidth + 3);

    // Card background
    const bgColor = area.stakes.type === 'risk' ? COLORS.riskBg : COLORS.neutralBg;
    setFillColor(bgColor);
    drawRoundedRect(x, y, cardWidth, 50, 3);

    // Status tag
    const trendLabel = area.trend === 'up' ? 'RISING' : area.trend === 'new' ? 'NEW' : 'STABLE';
    const trendColor = area.trend === 'up' ? COLORS.risingText : COLORS.textMuted;
    setColor(trendColor);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(trendLabel, x + 3, y + 8);

    // Impact score
    setColor(COLORS.text);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(area.impactScore.toFixed(1), x + cardWidth - 15, y + 10);

    // Title
    doc.setFontSize(9);
    const titleLines = doc.splitTextToSize(area.title, cardWidth - 8);
    doc.text(titleLines.slice(0, 2), x + 3, y + 20);

    // Mentions
    setColor(COLORS.textMuted);
    doc.setFontSize(7);
    doc.text(`${area.frequency} mentions`, x + 3, y + 45);
  });

  y += 60;

  // 3 Recommended Q1 Actions
  setColor(COLORS.primary);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('RECOMMENDED ACTIONS', margin, y);
  y += 8;

  const q1OKR = synthesis.suggestedOKRs.find(o => o.timeframe === 'Q1') || synthesis.suggestedOKRs[0];
  const actions = q1OKR?.keyResults.slice(0, 3) || [
    'Address top focus area with dedicated sprint',
    'Improve sentiment through quick wins',
    'Monitor brand score weekly',
  ];

  actions.forEach((action, i) => {
    setFillColor(COLORS.successBg);
    drawRoundedRect(margin, y, contentWidth, 14, 2);

    setColor(COLORS.successText);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`${i + 1}`, margin + 5, y + 9);

    setColor(COLORS.text);
    doc.setFont('helvetica', 'normal');
    const actionLines = doc.splitTextToSize(action, contentWidth - 20);
    doc.text(actionLines[0], margin + 15, y + 9);

    y += 17;
  });

  // Timestamp footer
  y = pageHeight - 15;
  setFillColor(COLORS.neutralBg);
  drawRoundedRect(margin, y - 3, contentWidth, 12, 2);
  setColor(COLORS.textLight);
  doc.setFontSize(8);
  doc.text(
    `Generated: ${generatedAt}  •  Data: ${synthesis.metadata.dataSources.join(', ')}  •  ${synthesis.metadata.totalAnalyzed} items analyzed`,
    pageWidth / 2,
    y + 4,
    { align: 'center' }
  );

  return doc.output('blob');
}

// ============================================================================
// LEGACY EXPORTS (for compatibility)
// ============================================================================

export async function generatePDFReport(data: ReportData): Promise<Blob> {
  return generateFullReport(data);
}

export function generateMarkdownReport(data: ReportData): string {
  const { companyName, synthesis, generatedAt } = data;

  let md = `# ${companyName}: Growth Opportunities Report\n\n`;
  md += `*Generated: ${generatedAt}*\n\n`;
  md += `---\n\n`;

  // Executive Summary
  md += `## Executive Summary\n\n`;
  const topStrength = synthesis.brandStrengths.topLoves[0]?.feature || 'core features';
  const topIssue = synthesis.focusAreas[0]?.title || 'performance';
  md += `Users love ${companyName}'s ${topStrength}. The main opportunity: improve ${topIssue} to unlock higher retention.\n\n`;

  // Key Metrics
  md += `### Key Metrics\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Total Analyzed | ${synthesis.metadata.totalAnalyzed} |\n`;
  md += `| Positive Sentiment | ${synthesis.sentiment.positive}% |\n`;
  md += `| Focus Areas | ${synthesis.focusAreas.length} |\n`;
  md += `| Brand Score | ${synthesis.brandStrengths.overallScore}/10 |\n\n`;

  // Focus Areas
  md += `## Focus Areas\n\n`;
  synthesis.focusAreas.forEach((area, i) => {
    const trendLabel = area.trend === 'new' ? '[NEW]' :
      area.trend === 'up' ? `[RISING]` :
      area.trend === 'down' ? `[DECLINING]` : '[STABLE]';

    md += `### ${i + 1}. ${area.title} ${trendLabel}\n\n`;
    md += `- **Impact Score:** ${area.impactScore.toFixed(1)}/10\n`;
    md += `- **Frequency:** ${area.frequency} mentions\n`;
    md += `- **Stakes:** ${area.stakes.message}\n\n`;
  });

  // What Users Love
  md += `## What Users Love\n\n`;
  synthesis.brandStrengths.topLoves.forEach((love) => {
    md += `### ${love.feature} (${'★'.repeat(Math.round(love.shareability / 2))} ${love.shareability}/10)\n\n`;
    md += `> "${love.quote}"\n\n`;
  });

  // Recommended Actions
  md += `## Recommended Actions\n\n`;
  synthesis.suggestedOKRs.forEach((okr) => {
    md += `### ${okr.timeframe}: ${okr.theme}\n\n`;
    md += `**Objective:** ${okr.objective}\n\n`;
    okr.keyResults.forEach((kr) => {
      md += `- ${kr}\n`;
    });
    md += `\n`;
  });

  md += `---\n\n`;
  md += `*Report generated by Pulse AI*\n`;

  return md;
}

export function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
