const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

/**
 * GreenPulse AI — Professional Ready-to-Fill Data Template Generator
 *
 * Generates an Excel workbook with exactly 3 sheets:
 * 1. Data Entry: Canonical columns, frozen header, no sample records, data validations
 * 2. Instructions: Clear guidance, key rules, and example table labeled EXAMPLE ONLY
 * 3. Waste Categories: Authoritative 8-item industrial waste taxonomy
 */
async function generateTemplateWorkbook() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GreenPulse AI';
  workbook.lastModifiedBy = 'GreenPulse AI Ingestion Engine';
  workbook.created = new Date();
  workbook.modified = new Date();

  // =========================================================================
  // SHEET 1: Data Entry
  // =========================================================================
  const wsEntry = workbook.addWorksheet('Data Entry', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'A2' }],
    properties: { tabColor: { argb: 'FF2ED9A3' } },
  });

  wsEntry.columns = [
    { header: 'Department Name', key: 'department', width: 24 },
    { header: 'Period', key: 'period', width: 14 },
    { header: 'Electricity Used (kWh)', key: 'kwhUsed', width: 24 },
    { header: 'Fuel Type', key: 'fuelType', width: 16 },
    { header: 'Fuel Consumption', key: 'fuelQuantity', width: 18 },
    { header: 'Fuel Unit', key: 'fuelUnit', width: 14 },
    { header: 'Waste Item', key: 'wasteItem', width: 20 },
    { header: 'Waste Produced (kg)', key: 'quantityKg', width: 22 },
    { header: 'Waste Category', key: 'wasteCategory', width: 18 },
  ];

  // Header row formatting
  const headerRow = wsEntry.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF171C27' }, // GreenPulse Dark Slate
    };
    cell.font = {
      name: 'Segoe UI',
      size: 10,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF3FB6E8' } },
      bottom: { style: 'medium', color: { argb: 'FF2ED9A3' } },
      left: { style: 'thin', color: { argb: 'FF242B38' } },
      right: { style: 'thin', color: { argb: 'FF242B38' } },
    };
  });

  // Apply dropdown data validations and formatting for entry rows (2 through 200)
  for (let r = 2; r <= 200; r++) {
    const row = wsEntry.getRow(r);
    row.height = 20;

    // Period formatting (Text / YYYY-MM)
    const cellPeriod = row.getCell('period');
    cellPeriod.numFmt = '@';
    cellPeriod.alignment = { vertical: 'middle', horizontal: 'center' };

    // Electricity Used (kWh)
    const cellKwh = row.getCell('kwhUsed');
    cellKwh.numFmt = '#,##0.00';
    cellKwh.alignment = { vertical: 'middle', horizontal: 'right' };

    // Fuel Type dropdown
    const cellFuelType = row.getCell('fuelType');
    cellFuelType.dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Diesel, Petrol, LPG, Natural Gas"'],
      showErrorMessage: true,
      errorTitle: 'Invalid Fuel Type',
      error: 'Please choose Diesel, Petrol, LPG, or Natural Gas.',
    };
    cellFuelType.alignment = { vertical: 'middle', horizontal: 'left' };

    // Fuel Consumption
    const cellFuelQty = row.getCell('fuelQuantity');
    cellFuelQty.numFmt = '#,##0.00';
    cellFuelQty.alignment = { vertical: 'middle', horizontal: 'right' };

    // Fuel Unit dropdown
    const cellFuelUnit = row.getCell('fuelUnit');
    cellFuelUnit.dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"litre, kg, m³"'],
      showErrorMessage: true,
      errorTitle: 'Invalid Fuel Unit',
      error: 'Please select litre, kg, or m³.',
    };
    cellFuelUnit.alignment = { vertical: 'middle', horizontal: 'center' };

    // Waste Item dropdown
    const cellWasteItem = row.getCell('wasteItem');
    cellWasteItem.dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Plastic, Paper, Aluminium, Steel, Rubber, Used Oil, Chemical Bottles, Food Waste"'],
      showErrorMessage: true,
      errorTitle: 'Invalid Waste Item',
      error: 'Please choose an authorized waste material from the list.',
    };
    cellWasteItem.alignment = { vertical: 'middle', horizontal: 'left' };

    // Waste Produced (kg)
    const cellWasteQty = row.getCell('quantityKg');
    cellWasteQty.numFmt = '#,##0.00';
    cellWasteQty.alignment = { vertical: 'middle', horizontal: 'right' };

    // Waste Category dropdown
    const cellWasteCat = row.getCell('wasteCategory');
    cellWasteCat.dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Recyclable, Hazardous, Organic"'],
      showErrorMessage: true,
      errorTitle: 'Invalid Category',
      error: 'Please choose Recyclable, Hazardous, or Organic.',
    };
    cellWasteCat.alignment = { vertical: 'middle', horizontal: 'left' };
  }

  // =========================================================================
  // SHEET 2: Instructions
  // =========================================================================
  const wsInst = workbook.addWorksheet('Instructions', {
    properties: { tabColor: { argb: 'FF3FB6E8' } },
  });

  wsInst.columns = [
    { width: 28 }, // Col A
    { width: 75 }, // Col B
  ];

  // Title
  wsInst.mergeCells('A1:B1');
  const instTitle = wsInst.getCell('A1');
  instTitle.value = 'GreenPulse AI — Ready-to-Fill Data Template Instructions';
  instTitle.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FF0F172A' } };
  wsInst.getRow(1).height = 28;

  // Subtitle
  wsInst.mergeCells('A2:B2');
  const instSub = wsInst.getCell('A2');
  instSub.value = 'Fill the "Data Entry" sheet with your operational activity logs. Blank activity fields are allowed.';
  instSub.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF475569' } };
  wsInst.getRow(2).height = 20;

  // Section Header: Column Descriptions
  wsInst.getCell('A4').value = 'Field / Column';
  wsInst.getCell('A4').font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF1E293B' } };
  wsInst.getCell('B4').value = 'Description & Expected Format';
  wsInst.getCell('B4').font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF1E293B' } };
  wsInst.getRow(4).height = 24;

  const columnGuide = [
    ['Department Name', 'Enter the department name, for example Paint Shop.'],
    ['Period', 'Enter the reporting month as YYYY-MM, for example 2026-09.'],
    ['Electricity Used (kWh)', 'Enter electricity used in kilowatt-hours.'],
    ['Fuel Type', 'Enter the fuel used, such as Diesel, Petrol, LPG, or Natural Gas.'],
    ['Fuel Consumption', 'Enter how much fuel was used.'],
    ['Fuel Unit', 'Enter the unit used for the fuel, such as litre, kg, or m³.'],
    ['Waste Item', 'Enter the waste material, such as Plastic, Paper, Used Oil, or Food Waste.'],
    ['Waste Produced (kg)', 'Enter the amount of waste in kilograms.'],
    ['Waste Category', 'Select the category that matches the waste item.'],
  ];

  let curRow = 5;
  columnGuide.forEach(([colName, desc]) => {
    const row = wsInst.getRow(curRow);
    row.height = 20;
    row.getCell(1).value = colName;
    row.getCell(1).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF334155' } };
    row.getCell(2).value = desc;
    row.getCell(2).font = { name: 'Segoe UI', size: 10, color: { argb: 'FF1E293B' } };
    curRow++;
  });

  // Section Header: Important Rules
  curRow += 1;
  wsInst.getCell(`A${curRow}`).value = 'Key Ingestion Rules';
  wsInst.getCell(`A${curRow}`).font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF1E293B' } };
  curRow++;

  const rules = [
    '• GreenPulse checks and calculates the waste category automatically from the Waste Item.',
    '• New department names are allowed. GreenPulse can create the department automatically for your company.',
    '• Do not enter calculated carbon emissions. GreenPulse calculates them from your activity data.',
  ];

  rules.forEach((rule) => {
    wsInst.mergeCells(`A${curRow}:B${curRow}`);
    const rCell = wsInst.getCell(`A${curRow}`);
    rCell.value = rule;
    rCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0284C7' } };
    wsInst.getRow(curRow).height = 20;
    curRow++;
  });

  // Section Header: Example Table
  curRow += 1;
  wsInst.mergeCells(`A${curRow}:I${curRow}`);
  const exNotice = wsInst.getCell(`A${curRow}`);
  exNotice.value = 'EXAMPLE ONLY — DO NOT UPLOAD AS COMPANY DATA';
  exNotice.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFDC2626' } };
  exNotice.alignment = { horizontal: 'center' };
  wsInst.getRow(curRow).height = 26;
  curRow++;

  // Example Table Header
  const exHeaders = [
    'Department',
    'Period',
    'Electricity',
    'Fuel',
    'Fuel Consumption',
    'Unit',
    'Waste Item',
    'Waste Kg',
    'Category',
  ];
  const exHeaderRow = wsInst.getRow(curRow);
  exHeaderRow.height = 22;
  exHeaders.forEach((h, idx) => {
    const c = exHeaderRow.getCell(idx + 1);
    c.value = h;
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    c.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF334155' } };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
  });
  curRow++;

  // Example Table Rows
  const exampleRows = [
    ['Paint Shop', '2026-09', 12000, 'Diesel', 500, 'litre', 'Used Oil', 25, 'Hazardous'],
    ['Assembly', '2026-09', 18000, 'Diesel', 300, 'litre', 'Plastic', 80, 'Recyclable'],
    ['Packaging', '2026-09', 9000, '', '', '', 'Food Waste', 60, 'Organic'],
  ];

  exampleRows.forEach((rData) => {
    const row = wsInst.getRow(curRow);
    row.height = 20;
    rData.forEach((val, idx) => {
      const c = row.getCell(idx + 1);
      c.value = val;
      c.font = { name: 'Segoe UI', size: 9, color: { argb: 'FF475569' } };
      c.alignment = {
        horizontal: typeof val === 'number' ? 'right' : 'center',
        vertical: 'middle',
      };
    });
    curRow++;
  });

  // =========================================================================
  // SHEET 3: Waste Categories (Exact GreenPulse Taxonomy)
  // =========================================================================
  const wsTaxonomy = workbook.addWorksheet('Waste Categories', {
    properties: { tabColor: { argb: 'FF8B7FFF' } },
  });

  wsTaxonomy.columns = [
    { header: 'Waste Item', key: 'wasteItem', width: 24 },
    { header: 'Category', key: 'category', width: 20 },
  ];

  const taxHeaderRow = wsTaxonomy.getRow(1);
  taxHeaderRow.height = 26;
  taxHeaderRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF171C27' },
    };
    cell.font = {
      name: 'Segoe UI',
      size: 10,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  const taxonomyData = [
    ['Plastic', 'Recyclable'],
    ['Paper', 'Recyclable'],
    ['Aluminium', 'Recyclable'],
    ['Steel', 'Recyclable'],
    ['Rubber', 'Recyclable'],
    ['Used Oil', 'Hazardous'],
    ['Chemical Bottles', 'Hazardous'],
    ['Food Waste', 'Organic'],
  ];

  taxonomyData.forEach(([item, cat], idx) => {
    const row = wsTaxonomy.getRow(idx + 2);
    row.height = 20;
    row.getCell(1).value = item;
    row.getCell(1).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF1E293B' } };
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

    row.getCell(2).value = cat;
    row.getCell(2).font = { name: 'Segoe UI', size: 10, color: { argb: 'FF0284C7' } };
    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };
  });

  return workbook;
}

/**
 * Generate and write template file to disk
 */
async function writeTemplateToFile(outputPath) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const workbook = await generateTemplateWorkbook();
  await workbook.xlsx.writeFile(outputPath);
  return outputPath;
}

/**
 * Generate workbook as buffer
 */
async function getTemplateBuffer() {
  const workbook = await generateTemplateWorkbook();
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

module.exports = {
  generateTemplateWorkbook,
  writeTemplateToFile,
  getTemplateBuffer,
};
