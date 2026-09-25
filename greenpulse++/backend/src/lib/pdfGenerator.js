const PDFDocument = require('pdfkit');
const { REPORT_CONFIGS } = require('../modules/reports/report.config');

/**
 * Generate a clean, professional compliance PDF in memory using PDFKit.
 *
 * @param {Object} reportDoc - The populated or plain Report object containing dataSnapshot, executiveSummary, period, etc.
 * @returns {Promise<Buffer>} - Resolves with the binary PDF buffer.
 */
function generateCompliancePdf(reportDoc) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `GreenPulse AI Compliance Report - ${reportDoc.reportType} (${reportDoc.period})`,
          Author: 'GreenPulse AI Statutory Engine',
          Subject: reportDoc.executiveSummary?.framework || 'ESG Compliance',
        },
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const snapshot = reportDoc.dataSnapshot || {};
      const company = snapshot.company || {};
      const carbon = snapshot.carbon || {};
      const esg = snapshot.esg || {};
      const greenScore = snapshot.greenScore || {};
      const execSummary = reportDoc.executiveSummary || {};
      const config = REPORT_CONFIGS[reportDoc.reportType] || {
        name: reportDoc.reportType,
        framework: execSummary.framework || 'General Compliance',
        applicablePrinciples: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      };

      const primaryGreen = '#0F5132';
      const darkNavy = '#1A202C';
      const slateGray = '#4A5568';
      const lightBg = '#F7FAFC';
      const borderGray = '#E2E8F0';
      const accentGreen = '#2E7D32';
      const amberWarning = '#B7791F';

      // --- HEADER BAR ---
      doc.rect(40, 40, 515, 60).fill(primaryGreen);
      doc.fillColor('#FFFFFF')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('GREENPULSE AI COMPLIANCE ENGINE', 55, 52);

      doc.fontSize(10)
        .font('Helvetica')
        .text('Automated Environmental, Social & Governance Statutory Reporting', 55, 72);

      doc.moveDown(2);

      // --- REPORT IDENTITY & METADATA ---
      const startY = 115;
      doc.rect(40, startY, 515, 75).fill(lightBg).stroke(borderGray);

      doc.fillColor(darkNavy)
        .fontSize(13)
        .font('Helvetica-Bold')
        .text(config.name.toUpperCase(), 55, startY + 10);

      doc.fillColor(slateGray)
        .fontSize(9)
        .font('Helvetica')
        .text(`Framework: ${config.framework}`, 55, startY + 28)
        .text(`Target Company: ${company.name || 'Enterprise Client'} (ID: ${reportDoc.companyId})`, 55, startY + 41)
        .text(`Reporting Period: ${reportDoc.period}`, 55, startY + 54);

      doc.text(`Report Status: ${reportDoc.status.toUpperCase()}`, 340, startY + 28)
        .text(`Gaps Identified: ${reportDoc.disclosureGapCount}`, 340, startY + 41)
        .text(`Generated: ${new Date().toISOString().slice(0, 10)}`, 340, startY + 54);

      // --- SECTION 1: EXECUTIVE SUMMARY ---
      let currentY = 205;
      doc.fillColor(primaryGreen)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('1. EXECUTIVE SUMMARY & STATUTORY DISCLOSURE SCOPE', 40, currentY);

      currentY += 16;
      doc.rect(40, currentY, 515, 80).fill('#FFFFFF').stroke(borderGray);

      doc.fillColor(darkNavy).fontSize(8.5).font('Helvetica-Bold')
        .text('Statutory Framework:', 50, currentY + 8)
        .font('Helvetica')
        .text(execSummary.framework || 'SEBI BRSR / GRI Statutory Framework', 160, currentY + 8);

      doc.font('Helvetica-Bold')
        .text('Telemetry & Scope:', 50, currentY + 22)
        .font('Helvetica')
        .text(execSummary.telemetryAndScope || `Scope 2 purchased electricity for ${reportDoc.period}`, 160, currentY + 22);

      doc.font('Helvetica-Bold')
        .text('Assurance Level:', 50, currentY + 36)
        .font('Helvetica-Bold')
        .fillColor(slateGray)
        .text(execSummary.auditLevel || 'Internal system-generated; not externally assured', 160, currentY + 36);

      doc.fillColor(darkNavy).font('Helvetica-Bold')
        .text('Key Finding:', 50, currentY + 50)
        .font('Helvetica')
        .text(execSummary.keyFinding || 'Automated compliance compilation complete.', 160, currentY + 50, { width: 380 });

      // --- SECTION 2: GREENHOUSE GAS (GHG) EMISSIONS INVENTORY ---
      currentY += 95;
      doc.fillColor(primaryGreen)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('2. GREENHOUSE GAS (GHG) EMISSIONS INVENTORY (SCOPE 1 & SCOPE 2)', 40, currentY);

      currentY += 16;
      // Box for Scope 2
      doc.rect(40, currentY, 250, 85).fill(lightBg).stroke(borderGray);
      doc.fillColor(darkNavy)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('SCOPE 2 (PURCHASED ELECTRICITY)', 50, currentY + 10);

      const scope2Kg = carbon.scope2?.totalKgCO2e != null ? Number(carbon.scope2.totalKgCO2e).toFixed(2) : '0.00';
      const scope2Tons = carbon.scope2?.totalTonsCO2e != null ? Number(carbon.scope2.totalTonsCO2e).toFixed(3) : '0.000';

      doc.fillColor(accentGreen)
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(`${scope2Kg} kg CO2e`, 50, currentY + 26);

      doc.fillColor(slateGray)
        .fontSize(8)
        .font('Helvetica')
        .text(`Equivalent: ${scope2Tons} metric tons CO2e`, 50, currentY + 44)
        .text(`CEA Factor: ${carbon.scope2?.factorApplied || 0.82} kg CO2/kWh`, 50, currentY + 56)
        .text(`Telemetry: ${carbon.scope2?.recordCount || 0} smart-meter readings`, 50, currentY + 68);

      // Box for Scope 1
      doc.rect(305, currentY, 250, 85).fill(lightBg).stroke(borderGray);
      doc.fillColor(darkNavy)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('SCOPE 1 (DIRECT FUEL EMISSIONS)', 315, currentY + 10);

      doc.fillColor(amberWarning)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('STATUS: UNAVAILABLE (null)', 315, currentY + 28);

      doc.fillColor(slateGray)
        .fontSize(7.5)
        .font('Helvetica')
        .text(`Reason: ${carbon.scope1?.reason || 'No direct-fuel activity data ingested yet'}`, 315, currentY + 44, { width: 230 })
        .text('Statutory note: Phase 3 direct telemetry pending fuel ingestion integration.', 315, currentY + 62, { width: 230 });

      // --- SECTION 3: ESG PRINCIPLE COMPLIANCE MATRIX ---
      currentY += 100;
      doc.fillColor(primaryGreen)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(`3. STATUTORY PRINCIPLES MATRIX (${config.name})`, 40, currentY);

      currentY += 16;
      // Table Header
      doc.rect(40, currentY, 515, 18).fill('#EDF2F7');
      doc.fillColor(darkNavy).fontSize(8).font('Helvetica-Bold')
        .text('PRINCIPLE', 45, currentY + 5)
        .text('DESCRIPTION / STATUTORY COVERAGE', 110, currentY + 5)
        .text('COVERAGE', 380, currentY + 5)
        .text('DISCLOSURE STATUS', 450, currentY + 5);

      currentY += 18;
      const applicableList = config.applicablePrinciples;
      const principleDataList = esg.principles || [];

      applicableList.forEach((pNum, index) => {
        const found = principleDataList.find((p) => p.principleNumber === pNum);
        const status = found ? found.status : 'missing';
        const coverage = found && found.coveragePercentage != null ? `${found.coveragePercentage}%` : '0%';
        const pName = found ? found.principleName : `Principle ${pNum}`;

        const rowBg = index % 2 === 0 ? '#FFFFFF' : '#F7FAFC';
        doc.rect(40, currentY, 515, 16).fill(rowBg).stroke(borderGray);

        doc.fillColor(darkNavy).fontSize(7.5).font('Helvetica-Bold')
          .text(`P${pNum}`, 45, currentY + 4);

        doc.font('Helvetica')
          .text(pName.slice(0, 52), 110, currentY + 4);

        doc.text(coverage, 385, currentY + 4);

        const statusColor = status === 'verified' ? accentGreen : status === 'partial' ? amberWarning : '#E53E3E';
        doc.fillColor(statusColor).font('Helvetica-Bold')
          .text(status.toUpperCase(), 450, currentY + 4);

        currentY += 16;
      });

      // Green Score Snapshot
      currentY += 10;
      doc.rect(40, currentY, 515, 45).fill(lightBg).stroke(borderGray);
      doc.fillColor(darkNavy).fontSize(8.5).font('Helvetica-Bold')
        .text('OVERALL GREEN SCORE COMPLIANCE BENCHMARK', 50, currentY + 8);

      const scoreVal = greenScore.score != null ? greenScore.score : (greenScore.greenScore != null ? greenScore.greenScore : 'N/A');
      const rating = greenScore.rating || 'UNRATED';

      doc.fillColor(accentGreen).fontSize(14).font('Helvetica-Bold')
        .text(`${scoreVal} / 100 (${rating})`, 50, currentY + 22);

      doc.fillColor(slateGray).fontSize(8).font('Helvetica')
        .text(`Total Statutory Gaps Identified: ${reportDoc.disclosureGapCount}`, 300, currentY + 12)
        .text(`Applicable Principles Analyzed: ${applicableList.length}`, 300, currentY + 26);

      // --- SECTION 4: AUDIT ASSURANCE & REGULATORY DISCLAIMER ---
      currentY += 55;
      doc.fillColor(slateGray)
        .fontSize(7)
        .font('Helvetica-Bold')
        .text('STATUTORY AUDIT & SYSTEM NOTICE:', 40, currentY)
        .font('Helvetica')
        .text(
          'This report is an internal automated compliance artifact generated by GreenPulse AI. ' +
          'It has not been externally audited or assured by a third-party certifying body. ' +
          'Scope 1 emissions are explicitly marked as unavailable due to absence of direct fuel ingestion. ' +
          'Intended strictly for internal corporate governance, ESG benchmark tracking, and statutory preparation.',
          40,
          currentY + 10,
          { width: 515, align: 'justify' }
        );

      // Finalize document
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateCompliancePdf,
};
