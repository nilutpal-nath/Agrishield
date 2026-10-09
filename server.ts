import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Database Schema & Types
export interface BackendScanRecord {
  id: string;
  userId: string;
  date: string;
  scanSequence: number;
  disease: string;
  pathogen: string;
  crop: string;
  location: string;
  status: 'Follow-up Required' | 'Active Treatment' | 'Resolved' | 'Monitoring';
  confidence: number;
  imageCount: number;
  lossMitigated: string;
  notes: string;
  daysAgo: number;
  createdAt: string;
  updatedAt?: string;
  recoveryImages?: string[];
}

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'records.json');

// Initial seed: 10 past diagnoses showing progressive confidence improvement over time
const SEED_RECORDS: BackendScanRecord[] = [
  {
    id: 'REC-2026-802',
    userId: 'default',
    date: 'Sep 10, 2026',
    scanSequence: 1,
    disease: 'Fusarium Wilt',
    pathogen: 'Fusarium oxysporum',
    crop: 'Tomato (Heirloom)',
    location: 'Pune - Saswad Sector, Maharashtra',
    status: 'Resolved',
    confidence: 78,
    imageCount: 10,
    lossMitigated: '₹11,000 / Acre',
    notes: 'Initial scan baseline. Trichoderma soil drench completed.',
    daysAgo: 29,
    createdAt: new Date(Date.now() - 29 * 86400000).toISOString(),
  },
  {
    id: 'REC-2026-811',
    userId: 'default',
    date: 'Sep 14, 2026',
    scanSequence: 2,
    disease: 'Septoria Leaf Spot',
    pathogen: 'Septoria lycopersici',
    crop: 'Tomato (Cherry)',
    location: 'Pune - Shirur Cluster, Maharashtra',
    status: 'Resolved',
    confidence: 81,
    imageCount: 11,
    lossMitigated: '₹13,200 / Acre',
    notes: 'Chlorothalonil foliar application halted pycnidia spread.',
    daysAgo: 25,
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'REC-2026-819',
    userId: 'default',
    date: 'Sep 18, 2026',
    scanSequence: 3,
    disease: 'Leaf Curl Virus',
    pathogen: 'Begomovirus / Whitefly vector',
    crop: 'Tomato (US-440)',
    location: 'Baramati - Agro-Cluster 2, Maharashtra',
    status: 'Resolved',
    confidence: 84,
    imageCount: 10,
    lossMitigated: '₹16,000 / Acre',
    notes: 'Yellow sticky traps and neem azadirachtin successfully contained whitefly vectors.',
    daysAgo: 21,
    createdAt: new Date(Date.now() - 21 * 86400000).toISOString(),
  },
  {
    id: 'REC-2026-833',
    userId: 'default',
    date: 'Sep 21, 2026',
    scanSequence: 4,
    disease: 'Bacterial Wilt',
    pathogen: 'Ralstonia solanacearum',
    crop: 'Brinjal (Pusa Purple)',
    location: 'Pune - Junnar Valley, Maharashtra',
    status: 'Resolved',
    confidence: 85,
    imageCount: 12,
    lossMitigated: '₹14,000 / Acre',
    notes: 'Copper hydroxide application and soil pH buffered to 6.8.',
    daysAgo: 18,
    createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
  },
  {
    id: 'REC-2026-842',
    userId: 'default',
    date: 'Sep 25, 2026',
    scanSequence: 5,
    disease: 'Late Blight',
    pathogen: 'Phytophthora infestans',
    crop: 'Potato (Kufri Pukhraj)',
    location: 'Pune - Khed Taluka, Maharashtra',
    status: 'Resolved',
    confidence: 87,
    imageCount: 15,
    lossMitigated: '₹22,500 / Acre',
    notes: 'Full foliar recovery documented on day 10. Secondary tuber inspection confirmed clear of dry rot.',
    daysAgo: 14,
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: 'REC-2026-857',
    userId: 'default',
    date: 'Sep 28, 2026',
    scanSequence: 6,
    disease: 'Anthracnose',
    pathogen: 'Colletotrichum coccodes',
    crop: 'Chili (G4 Hot)',
    location: 'Solapur - Pandharpur Sector, Maharashtra',
    status: 'Resolved',
    confidence: 89,
    imageCount: 13,
    lossMitigated: '₹15,800 / Acre',
    notes: 'Azoxystrobin spray prevented fruit rot circular lesions.',
    daysAgo: 11,
    createdAt: new Date(Date.now() - 11 * 86400000).toISOString(),
  },
  {
    id: 'REC-2026-864',
    userId: 'default',
    date: 'Oct 01, 2026',
    scanSequence: 7,
    disease: 'Bacterial Leaf Spot',
    pathogen: 'Xanthomonas campestris',
    crop: 'Chili (Teja Hot)',
    location: 'Satara - Koregaon Block, Maharashtra',
    status: 'Active Treatment',
    confidence: 90,
    imageCount: 11,
    lossMitigated: '₹12,000 / Acre',
    notes: 'Streptocycline bactericide cycle in progress. Soil moisture maintained at 55% field capacity.',
    daysAgo: 8,
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'REC-2026-872',
    userId: 'default',
    date: 'Oct 03, 2026',
    scanSequence: 8,
    disease: 'Yellow Mosaic Virus',
    pathogen: 'Mungbean Yellow Mosaic Virus',
    crop: 'Soybean (JS-335)',
    location: 'Ahmednagar - Rahuri Belt, Maharashtra',
    status: 'Active Treatment',
    confidence: 91,
    imageCount: 14,
    lossMitigated: '₹17,400 / Acre',
    notes: 'Vector suppression and foliar micro-nutrient boost applied.',
    daysAgo: 6,
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 'REC-2026-881',
    userId: 'default',
    date: 'Oct 05, 2026',
    scanSequence: 9,
    disease: 'Early Blight',
    pathogen: 'Alternaria solani',
    crop: 'Tomato (Abhinav Hybrid)',
    location: 'Pune - Haveli Sector 4, Maharashtra',
    status: 'Follow-up Required', // 4 days ago: triggers follow-up alert!
    confidence: 92,
    imageCount: 12,
    lossMitigated: '₹14,500 / Acre',
    notes: 'Primary treatment with Mancozeb initiated on Oct 05. Requires visual foliar audit for secondary lesion arrest.',
    daysAgo: 4,
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'REC-2026-879',
    userId: 'default',
    date: 'Oct 06, 2026',
    scanSequence: 10,
    disease: 'Powdery Mildew',
    pathogen: 'Erysiphe cichoracearum',
    crop: 'Capsicum (Indra Bell)',
    location: 'Nashik - Dindori Valley, Maharashtra',
    status: 'Follow-up Required', // 3 days ago: triggers follow-up alert!
    confidence: 94,
    imageCount: 14,
    lossMitigated: '₹18,200 / Acre',
    notes: 'Sulphur-based micronized dust applied. Check vegetative growth tips for white fungal talc residue clearance.',
    daysAgo: 3,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

// Backend Database Controller
class DatabaseStore {
  private records: BackendScanRecord[] = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.records = JSON.parse(raw);
      } else {
        this.records = [...SEED_RECORDS];
        this.persist();
      }
    } catch (err) {
      console.error('Failed to initialize database file store, using in-memory store:', err);
      this.records = [...SEED_RECORDS];
    }
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.records, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database file:', err);
    }
  }

  public getAllRecords(userId?: string): BackendScanRecord[] {
    if (!userId || userId === 'all' || userId === 'default') {
      return [...this.records];
    }
    // Return records matching user or default unassigned demo records
    return this.records.filter((r) => r.userId === userId || r.userId === 'default');
  }

  public getRecordById(id: string): BackendScanRecord | undefined {
    return this.records.find((r) => r.id === id);
  }

  public createRecord(record: Partial<BackendScanRecord>): BackendScanRecord {
    const nextSeq = this.records.length > 0 ? Math.max(...this.records.map((r) => r.scanSequence || 0)) + 1 : 1;
    const newRecord: BackendScanRecord = {
      id: record.id || `REC-${Date.now().toString().slice(-4)}`,
      userId: record.userId || 'default',
      date: record.date || new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      scanSequence: nextSeq,
      disease: record.disease || 'Undiagnosed Pathogen',
      pathogen: record.pathogen || 'Suspected Fungus',
      crop: record.crop || 'Field Crop',
      location: record.location || 'Pune, Maharashtra',
      status: record.status || 'Active Treatment',
      confidence: record.confidence || 89,
      imageCount: record.imageCount || 12,
      lossMitigated: record.lossMitigated || '₹15,000 / Acre',
      notes: record.notes || 'AI Diagnosis recorded.',
      daysAgo: 0,
      createdAt: new Date().toISOString(),
      recoveryImages: record.recoveryImages || [],
    };

    // Prepend or append based on ordering
    this.records.push(newRecord);
    this.persist();
    return newRecord;
  }

  public updateRecord(id: string, updates: Partial<BackendScanRecord>): BackendScanRecord | null {
    const index = this.records.findIndex((r) => r.id === id);
    if (index === -1) return null;

    this.records[index] = {
      ...this.records[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.records[index];
  }

  public deleteRecord(id: string): boolean {
    const initialLen = this.records.length;
    this.records = this.records.filter((r) => r.id !== id);
    if (this.records.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  public getTrendsData() {
    // Return the past 10 diagnoses sorted chronologically by sequence / createdAt
    const sorted = [...this.records].sort((a, b) => (a.scanSequence || 0) - (b.scanSequence || 0));
    const past10 = sorted.slice(-10);

    const averageConfidence = past10.length > 0
      ? Math.round(past10.reduce((acc, r) => acc + r.confidence, 0) / past10.length * 10) / 10
      : 0;

    const baseline = past10[0]?.confidence || 0;
    const latest = past10[past10.length - 1]?.confidence || 0;
    const delta = latest - baseline;

    return {
      records: past10,
      stats: {
        totalScans: this.records.length,
        averageConfidence,
        baselineConfidence: baseline,
        currentConfidence: latest,
        confidenceImprovementPercent: delta,
        highestConfidence: Math.max(...past10.map((r) => r.confidence)),
        resolvedCases: this.records.filter((r) => r.status === 'Resolved').length,
        followUpDue: this.records.filter((r) => r.status === 'Follow-up Required' || (r.daysAgo >= 3 && r.daysAgo <= 5 && r.status !== 'Resolved')).length,
      },
    };
  }
}

const db = new DatabaseStore();

async function startServer() {
  const app = express();
  app.use(express.json());

  // Backend Database REST APIs
  const apiRouter = express.Router();

  // 1. GET /api/records - Retrieve all diagnostic records
  apiRouter.get('/records', (req, res) => {
    const userId = req.query.userId as string | undefined;
    const records = db.getAllRecords(userId);
    res.json({
      success: true,
      count: records.length,
      records,
    });
  });

  // 2. POST /api/records - Save a new diagnostic scan record
  apiRouter.post('/records', (req, res) => {
    try {
      const record = db.createRecord(req.body);
      res.status(201).json({
        success: true,
        message: 'Scan record stored successfully in database',
        record,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. GET /api/records/:id - Retrieve specific record
  apiRouter.get('/records/:id', (req, res) => {
    const record = db.getRecordById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }
    res.json({ success: true, record });
  });

  // 4. PATCH /api/records/:id - Update record fields
  apiRouter.patch('/records/:id', (req, res) => {
    const updated = db.updateRecord(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }
    res.json({ success: true, record: updated });
  });

  // 5. POST /api/records/:id/recovery - Upload recovery photos & mark resolved
  apiRouter.post('/records/:id/recovery', (req, res) => {
    const { notes, recoveryImages } = req.body;
    const updated = db.updateRecord(req.params.id, {
      status: 'Resolved',
      notes: notes || 'Recovery verification validated by agronomist.',
      recoveryImages: recoveryImages || ['recovery_1.jpg', 'recovery_2.jpg'],
    });

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }
    res.json({
      success: true,
      message: 'Follow-up recovery verified and status updated to Resolved',
      record: updated,
    });
  });

  // 6. DELETE /api/records/:id - Remove record
  apiRouter.delete('/records/:id', (req, res) => {
    const deleted = db.deleteRecord(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }
    res.json({ success: true, message: 'Record deleted from database' });
  });

  // 7. GET /api/diagnostics/trends - Recharts line graph data for past 10 diagnoses
  apiRouter.get('/diagnostics/trends', (req, res) => {
    const trends = db.getTrendsData();
    res.json({
      success: true,
      ...trends,
    });
  });

  // 8. Health check & database status
  apiRouter.get('/health', (req, res) => {
    res.json({
      status: 'online',
      service: 'AgriShield Backend Engine',
      database: 'Connected (Persistent JSON Data Store)',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api', apiRouter);

  // Frontend Serving: Vite dev middleware or static dist
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AgriShield] Backend database server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[AgriShield] Failed to start backend server:', err);
});
