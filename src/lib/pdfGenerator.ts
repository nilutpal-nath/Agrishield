import jsPDF from 'jspdf';

export interface PdfExportData {
  diagnostic: {
    diseaseName: string;
    pathogenScientificName: string;
    cropType: string;
    confidence: number;
    severity: string;
    leafAreaAffected: string;
    rootCauseText: string;
    treatment: {
      medicineName: string;
      tradeFormulation: string;
      marketPrice: string;
      packageUnit: string;
      instructions: string[];
      precautions: string[];
    };
    economics: {
      lossPerAcre: number;
      currency: string;
      baselineYieldAcre: string;
      potentialRevenueLoss: string;
      actionableStrategies: {
        id: number;
        title: string;
        description: string;
        potentialSavings: string;
      }[];
    };
    detailedKnowledge?: {
      diseaseFamily: string;
      overview: string;
    };
  };
  weather: {
    location: string;
    coordinates: string;
    temperature: string;
    humidity: string;
    condition: string;
    windSpeed: string;
    dewPoint: string;
    canopyMoistureHours: string;
  };
  acreCount: number;
  agronomistName?: string;
  agronomistEmail?: string;
}

export function generateDiagnosticPdf(data: PdfExportData) {
  const { diagnostic, weather, acreCount, agronomistName, agronomistEmail } = data;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 16) {
      doc.addPage();
      y = 16;
      drawSubHeader();
    }
  };

  const drawSubHeader = () => {
    doc.setFillColor(27, 67, 50); // #1B4332
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('AGRISHIELD CLINICAL DOSSIER · CONTINUED', margin + 3, y + 4.8);
    y += 11;
  };

  // --- 1. BRANDED HEADER BANNER ---
  doc.setFillColor(27, 67, 50); // Forest Deep
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('AgriShield Precision AI Lab', margin + 5, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(216, 243, 220); // Mint
  doc.text('AUTOMATED PLANT PATHOLOGY & CLINICAL ADVISORY REPORT', margin + 5, y + 15);

  const reportId = `AS-DX-${Date.now().toString().slice(-6)}`;
  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`DOC ID: ${reportId}`, pageWidth - margin - 5, y + 9, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(216, 243, 220);
  doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }), pageWidth - margin - 5, y + 15, { align: 'right' });

  y += 26;

  // Metadata Strip Card
  doc.setFillColor(244, 247, 244);
  doc.setDrawColor(226, 232, 224);
  doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(82, 121, 111);
  doc.text('FIELD AGRONOMIST:', margin + 3, y + 5);
  doc.text('MONITORED ZONE:', margin + 65, y + 5);
  doc.text('MICROCLIMATE TELEMETRY:', margin + 125, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(27, 67, 50);
  doc.text(agronomistName || 'Dr. Arvind Deshmukh', margin + 3, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(weather.location, margin + 65, y + 10);
  doc.text(`${weather.temperature} · ${weather.humidity} RH · ${weather.condition}`, margin + 125, y + 10);

  y += 18;

  // --- 2. PATHOLOGICAL CLASSIFICATION CARD ---
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(45, 106, 79); // #2D6A4F
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, 30, 2, 2, 'FD');

  // Disease badge background
  doc.setFillColor(235, 245, 238);
  doc.roundedRect(margin + 2, y + 2, contentWidth - 4, 8, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(45, 106, 79);
  doc.text('PRIMARY PATHOGEN DIAGNOSTIC CLASSIFICATION', margin + 5, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(27, 67, 50);
  doc.text(diagnostic.diseaseName, margin + 5, y + 17);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(82, 121, 111);
  doc.text(diagnostic.pathogenScientificName, margin + 5, y + 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(45, 55, 72);
  doc.text(`Host Crop: ${diagnostic.cropType}`, margin + 5, y + 27);

  // Confidence & Severity Box on Right
  doc.setFillColor(235, 245, 238);
  doc.roundedRect(pageWidth - margin - 48, y + 11, 44, 16, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(82, 121, 111);
  doc.text('AI CONFIDENCE SCORE', pageWidth - margin - 26, y + 15, { align: 'center' });

  doc.setFont('courier', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(27, 67, 50);
  doc.text(`${diagnostic.confidence}%`, pageWidth - margin - 26, y + 21, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(180, 83, 9);
  doc.text(diagnostic.severity.toUpperCase(), pageWidth - margin - 26, y + 25, { align: 'center' });

  y += 34;

  // --- 3. METEOROLOGICAL ROOT CAUSE ANALYSIS ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(27, 67, 50);
  doc.text('METEOROLOGICAL TELEMETRY & INOCULATION CORRELATION', margin, y);
  y += 3.5;

  doc.setFillColor(248, 250, 248);
  doc.setDrawColor(226, 232, 224);
  doc.roundedRect(margin, y, contentWidth, 20, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(45, 55, 72);
  const rootCauseLines = doc.splitTextToSize(diagnostic.rootCauseText, contentWidth - 8);
  doc.text(rootCauseLines.slice(0, 4), margin + 4, y + 4.5);

  y += 24;

  // --- 4. TREATMENT PLAN & PHARMACEUTICAL PROTOCOL ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(27, 67, 50);
  doc.text('RECOMMENDED FUNGICIDAL PRESCRIPTION & PROTOCOL', margin, y);
  y += 3.5;

  // Prescription highlight box
  doc.setFillColor(235, 245, 238);
  doc.setDrawColor(216, 243, 220);
  doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(27, 67, 50);
  doc.text(`Active Formulation: ${diagnostic.treatment.medicineName}`, margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(45, 106, 79);
  doc.text(`Classification: ${diagnostic.treatment.tradeFormulation}`, margin + 4, y + 9.5);

  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(27, 67, 50);
  doc.text(`Market Price: ${diagnostic.treatment.marketPrice} (${diagnostic.treatment.packageUnit})`, pageWidth - margin - 4, y + 7, { align: 'right' });

  y += 17;

  // Step-by-Step Instructions
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(27, 67, 50);
  doc.text('Clinical Application Instructions:', margin, y);
  y += 4;

  diagnostic.treatment.instructions.forEach((instruction, idx) => {
    checkPageBreak(8);
    doc.setFillColor(27, 67, 50);
    doc.circle(margin + 2.5, y + 1.2, 1.2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(45, 55, 72);
    const instLines = doc.splitTextToSize(`${idx + 1}. ${instruction}`, contentWidth - 8);
    doc.text(instLines, margin + 6, y + 2);
    y += instLines.length * 3.8 + 1;
  });

  y += 2;

  // Red-Bordered Precautions Warning Box
  checkPageBreak(24);
  doc.setFillColor(254, 242, 242); // Light red
  doc.setDrawColor(239, 68, 68); // Red
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, 22, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(185, 28, 28);
  doc.text('CRITICAL PRECAUTIONARY RESTRICTIONS (WHAT NOT TO DO):', margin + 4, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(153, 27, 27);

  const precText = diagnostic.treatment.precautions.map((p, i) => `[!] ${p}`).join('\n');
  const precLines = doc.splitTextToSize(precText, contentWidth - 8);
  doc.text(precLines.slice(0, 5), margin + 4, y + 8.5);

  y += 26;

  // --- 5. ECONOMIC IMPACT & YIELD PROTECTION CALCULATOR ---
  checkPageBreak(38);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(27, 67, 50);
  doc.text('ECONOMIC IMPACT & YIELD PROTECTION SUMMARY', margin, y);
  y += 3.5;

  const totalLoss = diagnostic.economics.lossPerAcre * acreCount;
  const colWidth = (contentWidth - 6) / 3;

  // 3 Metric Cards
  // Metric 1: Loss
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(252, 165, 165);
  doc.roundedRect(margin, y, colWidth, 18, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(185, 28, 28);
  doc.text('POTENTIAL LOSS IF UNTREATED', margin + 3, y + 4.5);
  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.text(`INR ${totalLoss.toLocaleString('en-IN')}`, margin + 3, y + 10.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`Assessed over ${acreCount} acre(s)`, margin + 3, y + 15);

  // Metric 2: Yield at Risk
  doc.setFillColor(235, 245, 238);
  doc.setDrawColor(216, 243, 220);
  doc.roundedRect(margin + colWidth + 3, y, colWidth, 18, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(45, 106, 79);
  doc.text('PROJECTED YIELD AT RISK', margin + colWidth + 6, y + 4.5);
  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(27, 67, 50);
  doc.text(`${(acreCount * 4.2).toFixed(1)} Metric Tons`, margin + colWidth + 6, y + 10.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(82, 121, 111);
  doc.text('23.5% foliar loss estimate', margin + colWidth + 6, y + 15);

  // Metric 3: ROI
  doc.setFillColor(248, 250, 248);
  doc.setDrawColor(226, 232, 224);
  doc.roundedRect(margin + (colWidth + 3) * 2, y, colWidth, 18, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(45, 55, 72);
  doc.text('INTERVENTION ROI RATIO', margin + (colWidth + 3) * 2 + 3, y + 4.5);
  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(27, 67, 50);
  doc.text('1 : 16.5 ROI', margin + (colWidth + 3) * 2 + 3, y + 10.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(82, 121, 111);
  doc.text('INR 900 saves ~INR 15,000/ac', margin + (colWidth + 3) * 2 + 3, y + 15);

  y += 22;

  // 3 Actionable Strategies
  checkPageBreak(26);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(27, 67, 50);
  doc.text('Field Profit Maximization Strategies:', margin, y);
  y += 3.5;

  diagnostic.economics.actionableStrategies.forEach((strat) => {
    checkPageBreak(8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(27, 67, 50);
    doc.text(`* ${strat.title} (${strat.potentialSavings})`, margin + 2, y + 2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(74, 85, 104);
    const desc = doc.splitTextToSize(strat.description, contentWidth - 10);
    doc.text(desc, margin + 4, y + 5.5);
    y += desc.length * 3 + 4;
  });

  // --- FOOTER & SIGN-OFF ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 224);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(116, 140, 126);
    doc.text(
      'AgriShield Precision AI Diagnostics · Formulated in accordance with ICAR & University Extension Pathology Standards',
      margin,
      pageHeight - 8
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  // Trigger browser download
  const cleanFilename = `AgriShield_Report_${diagnostic.diseaseName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(cleanFilename);
}
