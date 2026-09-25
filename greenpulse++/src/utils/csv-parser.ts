/**
 * @license
 * GreenPulse AI — CSV Parsing & Validation Pipeline
 */

export interface ParsedCsvResult {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
  isValid: boolean;
  validationErrors: string[];
}

export function parseAndValidateCsvContent(csvString: string): ParsedCsvResult {
  const lines = csvString.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) {
    return {
      headers: [],
      rows: [],
      totalRows: 0,
      isValid: false,
      validationErrors: ['File appears to be empty.'],
    };
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const rows: Record<string, string>[] = [];
  const validationErrors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
    if (values.length !== headers.length) {
      validationErrors.push(`Row ${i}: Column count mismatch (expected ${headers.length}, found ${values.length})`);
      continue;
    }

    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx];
    });
    rows.push(rowObj);
  }

  return {
    headers,
    rows,
    totalRows: rows.length,
    isValid: validationErrors.length === 0,
    validationErrors,
  };
}
