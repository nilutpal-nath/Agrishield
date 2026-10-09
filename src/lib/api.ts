import { DbScanRecord } from './firebase';

export interface DiagnosticTrendsResponse {
  records: Array<{
    id: string;
    date: string;
    scanSequence: number;
    disease: string;
    crop: string;
    location: string;
    confidence: number;
    status: string;
  }>;
  stats: {
    totalScans: number;
    averageConfidence: number;
    baselineConfidence: number;
    currentConfidence: number;
    confidenceImprovementPercent: number;
    highestConfidence: number;
    resolvedCases: number;
    followUpDue: number;
  };
}

export async function fetchBackendRecords(userId?: string): Promise<DbScanRecord[]> {
  try {
    const url = userId ? `/api/records?userId=${encodeURIComponent(userId)}` : '/api/records';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.records || [];
  } catch (err) {
    console.warn('[AgriShield API] Using local fallback for fetchBackendRecords:', err);
    return [];
  }
}

export async function saveRecordToBackend(record: DbScanRecord): Promise<DbScanRecord | null> {
  try {
    const res = await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.record;
  } catch (err) {
    console.warn('[AgriShield API] Backend save failed, record saved locally:', err);
    return null;
  }
}

export async function submitRecoveryToBackend(
  recordId: string,
  notes: string,
  recoveryImages?: string[]
): Promise<boolean> {
  try {
    const res = await fetch(`/api/records/${encodeURIComponent(recordId)}/recovery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes, recoveryImages }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[AgriShield API] Backend recovery submission fallback:', err);
    return false;
  }
}

export async function fetchDiagnosticTrends(): Promise<DiagnosticTrendsResponse | null> {
  try {
    const res = await fetch('/api/diagnostics/trends');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[AgriShield API] Trends fallback to calculated data:', err);
    return null;
  }
}
