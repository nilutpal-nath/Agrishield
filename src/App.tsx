import React, { useState, useEffect, useRef } from 'react';
import {
  Sprout,
  Leaf,
  CloudRain,
  Thermometer,
  Droplets,
  Wind,
  MapPin,
  UploadCloud,
  X,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingDown,
  DollarSign,
  Activity,
  FileText,
  Search,
  Filter,
  Camera,
  Check,
  Zap,
  ExternalLink,
  Lock,
  Mail,
  User as UserIcon,
  KeyRound,
  LogOut,
  LogIn,
  BookOpen,
  Layers,
  Globe,
  Award,
  Eye,
  RefreshCw,
  Info,
  Maximize2,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  ShieldAlert,
  Database,
  Server,
  HardDrive,
  Download,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { User } from 'firebase/auth';
import {
  auth,
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  resetUserPassword,
  logoutUser,
  saveScanRecordToDb,
  updateScanRecordInDb,
  fetchUserRecordsFromDb,
  subscribeToUserRecords,
  testConnection,
  DbScanRecord,
} from './lib/firebase';
import {
  fetchBackendRecords,
  saveRecordToBackend,
  submitRecoveryToBackend,
} from './lib/api';
import { generateDiagnosticPdf } from './lib/pdfGenerator';

// --- Data Types & Interfaces ---

interface UploadedFileItem {
  id: string;
  name: string;
  size: string;
  leafType: string;
  timestamp: string;
}

interface WeatherData {
  location: string;
  coordinates: string;
  temperature: string;
  humidity: string;
  condition: string;
  windSpeed: string;
  dewPoint: string;
  canopyMoistureHours: string;
  sporeRiskLevel: 'High' | 'Moderate' | 'Low';
}

interface DiseaseStageDetail {
  stageNumber: number;
  stageName: string;
  timeframe: string;
  severityLabel: string;
  severityColor: string;
  macroscopicVisual: string;
  microscopicPathology: string;
  actionProtocol: string;
}

interface ReputableAgriculturalLink {
  title: string;
  organization: string;
  authorityType: 'University Extension' | 'Government Dept' | 'International Agency';
  url: string;
  summary: string;
}

interface DetailedDiseaseInfo {
  diseaseName: string;
  pathogenScientificName: string;
  diseaseFamily: string;
  overview: string;
  stages: DiseaseStageDetail[];
  commonSymptoms: {
    category: string;
    symptoms: string[];
  }[];
  preventativeMeasures: {
    category: string;
    icon: string;
    recommendations: string[];
  }[];
  reputableLinks: ReputableAgriculturalLink[];
}

interface DiagnosticDetails {
  diseaseName: string;
  pathogenScientificName: string;
  cropType: string;
  confidence: number;
  severity: 'Moderate to High' | 'Severe' | 'Early Stage';
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
  detailedKnowledge: DetailedDiseaseInfo;
}

// --- Mock & Pre-configured Knowledge Base ---

const INITIAL_WEATHER: WeatherData = {
  location: 'Pune, Maharashtra',
  coordinates: '18.5204° N, 73.8567° E (Altitude 560m)',
  temperature: '28°C',
  humidity: '75%',
  condition: 'Overcast',
  windSpeed: '9 km/h WNW',
  dewPoint: '23.2°C',
  canopyMoistureHours: '14.5 hrs persistent wetness',
  sporeRiskLevel: 'High',
};

const SAMPLE_LEAF_IMAGES: UploadedFileItem[] = [
  { id: 'img-1', name: 'IMG_20261009_PUNE_CANOPY_01.JPG', size: '2.8 MB', leafType: 'Solanaceae foliage', timestamp: '10:41 AM' },
  { id: 'img-2', name: 'IMG_20261009_PUNE_CANOPY_02.JPG', size: '3.1 MB', leafType: 'Lower foliar quadrant', timestamp: '10:41 AM' },
  { id: 'img-3', name: 'IMG_20261009_PUNE_CANOPY_03.JPG', size: '2.4 MB', leafType: 'Central leaf margin', timestamp: '10:42 AM' },
  { id: 'img-4', name: 'IMG_20261009_PUNE_CANOPY_04.JPG', size: '3.5 MB', leafType: 'Stem junction leaflet', timestamp: '10:42 AM' },
  { id: 'img-5', name: 'IMG_20261009_PUNE_CANOPY_05.JPG', size: '2.9 MB', leafType: 'Adaxial leaf surface', timestamp: '10:43 AM' },
  { id: 'img-6', name: 'IMG_20261009_PUNE_CANOPY_06.JPG', size: '3.3 MB', leafType: 'Abaxial leaf surface', timestamp: '10:43 AM' },
  { id: 'img-7', name: 'IMG_20261009_PUNE_CANOPY_07.JPG', size: '2.7 MB', leafType: 'Middle canopy leaf', timestamp: '10:44 AM' },
  { id: 'img-8', name: 'IMG_20261009_PUNE_CANOPY_08.JPG', size: '3.0 MB', leafType: 'Concentric lesion site', timestamp: '10:44 AM' },
  { id: 'img-9', name: 'IMG_20261009_PUNE_CANOPY_09.JPG', size: '2.6 MB', leafType: 'Chlorotic border sector', timestamp: '10:45 AM' },
  { id: 'img-10', name: 'IMG_20261009_PUNE_CANOPY_10.JPG', size: '3.2 MB', leafType: 'Terminal apex foliage', timestamp: '10:45 AM' },
  { id: 'img-11', name: 'IMG_20261009_PUNE_CANOPY_11.JPG', size: '2.9 MB', leafType: 'Under-canopy shade leaf', timestamp: '10:46 AM' },
  { id: 'img-12', name: 'IMG_20261009_PUNE_CANOPY_12.JPG', size: '3.4 MB', leafType: 'Petiole boundary cluster', timestamp: '10:46 AM' },
];

const MOCK_DIAGNOSTIC_RESULT: DiagnosticDetails = {
  diseaseName: 'Early Blight',
  pathogenScientificName: 'Alternaria solani',
  cropType: 'Solanum lycopersicum (Tomato / Field Crop)',
  confidence: 89,
  severity: 'Moderate to High',
  leafAreaAffected: '22.4% foliar necrosing',
  rootCauseText:
    'Extracted meteorological EXIF telemetry indicates sustained relative humidity of 75% combined with moderate ambient temperatures (28°C) and persistent overcast sky conditions. These specific microclimatic parameters create an optimal germination window for Alternaria solani conidia. High atmospheric moisture (>70%) paired with continuous leaf wetness exceeding 8 hours allowed fungal spores to penetrate stomatal openings on lower foliage and establish concentric target-like necrotic rings.',
  treatment: {
    medicineName: 'Mancozeb 75% WP + Difenoconazole 25% EC',
    tradeFormulation: 'Broad-spectrum Protective & Systemic Curative Fungicide',
    marketPrice: '₹450 / Liter',
    packageUnit: 'Pack of 1L / 1Kg',
    instructions: [
      'Dilution Ratio: Thoroughly dissolve 2.5 ml / gram per 1 Liter of clean pH-neutral water in sprayer tank.',
      'Canopy Spray Technique: Ensure thorough misting covering both adaxial (upper) and abaxial (underside) foliar surfaces.',
      'Optimum Application Window: Spray in early morning (6:30 AM – 9:00 AM) or post-sunset dusk to prevent UV photolysis.',
      'Spray Interval: Perform a follow-up verification in 4–5 days; re-apply only if relative humidity remains above 70% and lesion expansion continues.',
    ],
    precautions: [
      'DO NOT spray during direct midday overhead sunlight (above 32°C) or within 3 hours prior to anticipated precipitation.',
      'DO NOT mix with alkaline tank partners, Bordeaux mixture, or copper oxychloride formulations without a physical jar compatibility test.',
      'DO NOT harvest or market edible harvest within 7 days of active chemical spray (Mandatory Pre-Harvest Interval / PHI).',
      'DO NOT dispose of residual tank washings into irrigation canals, farm ponds, or animal watering troughs.',
    ],
  },
  economics: {
    lossPerAcre: 15000,
    currency: '₹',
    baselineYieldAcre: '18 Metric Tons / Acre',
    potentialRevenueLoss: '₹15,000 / Acre',
    actionableStrategies: [
      {
        id: 1,
        title: 'Localized Barrier & Quarantine Spray',
        description:
          'Apply localized targeted curative fungicide to a 5-meter buffer radius around infected rows before secondary spore dispersion occurs.',
        potentialSavings: 'Saves up to ₹9,200 / Acre',
      },
      {
        id: 2,
        title: 'Lower Canopy Pruning & Leaf Removal',
        description:
          'Manually de-leaf bottom 15 cm of necrotic foliage and burn or bury debris off-field to halt horizontal splash propagation.',
        potentialSavings: 'Saves up to ₹3,800 / Acre',
      },
      {
        id: 3,
        title: 'Drip Irrigation Timing Calibration',
        description:
          'Transition irrigation strictly to sub-canopy drip lines between 4:00 AM – 6:00 AM, cutting leaf-wetness duration by 65%.',
        potentialSavings: 'Saves up to ₹2,000 / Acre',
      },
    ],
  },
  detailedKnowledge: {
    diseaseName: 'Early Blight',
    pathogenScientificName: 'Alternaria solani',
    diseaseFamily: 'Pleosporaceae / Ascomycota',
    overview:
      'Early Blight is an aggressive, yield-limiting foliar pathogen primarily affecting Solanaceous crops including tomato, potato, and eggplant. The pathogen overwinters as mycelium or chlamydospores in crop debris and produces beaked, multi-celled conidia that are easily disseminated by wind, rain splashes, and field equipment.',
    stages: [
      {
        stageNumber: 1,
        stageName: 'Stage 1: Initial Spore Flecks & Early Chlorosis',
        timeframe: 'Days 1 – 3 Post-Inoculation',
        severityLabel: 'Early Incubation',
        severityColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        macroscopicVisual:
          'Small (1–2 mm), circular to angular brown-black water-soaked pinpoints appearing on older senescing lower foliage closest to wet soil.',
        microscopicPathology:
          'Conidial germ tubes penetrate cuticle directly or enter through open stomata. Mycelium begins colonizing mesophyll intercellular spaces, secreting initial alternaric acid.',
        actionProtocol:
          'Highest chemical efficacy window. Apply preventative contact protectants (Chlorothalonil or Mancozeb) immediately before lesions expand beyond 3 mm.',
      },
      {
        stageNumber: 2,
        stageName: 'Stage 2: Concentric Target-Board Ring Lesions',
        timeframe: 'Days 4 – 7 (Current Detection State)',
        severityLabel: 'Active Necrosis',
        severityColor: 'text-amber-800 bg-amber-50 border-amber-200',
        macroscopicVisual:
          'Lesions enlarge to 8–15 mm developing unmistakable concentric dark rings (resembling a bullseye/target board). Surrounding tissue exhibits prominent chlorotic yellow halos.',
        microscopicPathology:
          'Extensive parenchymal tissue collapse. Alternaric acid and zinniol phytotoxins cause cell membrane lysis. Dark conidiophores emerge through stomata in humid air to discharge airborne conidia.',
        actionProtocol:
          'Transition from contact protectants to systemic curative triazole/strobilurin combinations (Difenoconazole + Azoxystrobin) to arrest mycelial progression within leaf tissue.',
      },
      {
        stageNumber: 3,
        stageName: 'Stage 3: Severe Canopy Blight & Premature Defoliation',
        timeframe: 'Days 8 – 14+ If Untreated',
        severityLabel: 'Severe Canopy Loss',
        severityColor: 'text-red-800 bg-red-50 border-red-200',
        macroscopicVisual:
          'Multiple concentric lesions coalesce causing whole-leaflet desiccation and complete blighting. Leaves curl, turn brittle brown, and drop. Stems develop dark collar cankers; fruit stems develop sunken leathery rot.',
        microscopicPathology:
          'Complete vascular disruption in petiole bundles. Mass secondary sporulation across the field canopy driven by air turbulence. High secondary reinfection cycle across upper foliage.',
        actionProtocol:
          'Immediate emergency salvage: prune heavily infected lower canopy layers, spray dual-action systemic curative, and apply calcium nitrate foliar spray to fortify remaining healthy foliage.',
      },
    ],
    commonSymptoms: [
      {
        category: 'Foliar Symptoms (Leaves)',
        symptoms: [
          'Dark brown to black necrotic spots (1–15 mm) bearing concentric rings that resemble a target board.',
          'Characteristic chlorotic yellow halo surrounding each expanding necrotic spot due to fungal phytotoxins.',
          'Older, lowermost foliage is infected first, with infection progressing systematically upward into the mid and upper canopy.',
          'Infected leaflets turn completely yellow, wither, become paper-brittle, and prematurely drop, causing canopy collapse.',
        ],
      },
      {
        category: 'Stem & Petiole Symptoms',
        symptoms: [
          'Dark, sunken, elongated elliptical lesions with faint concentric markings on lower stems (known as collar rot).',
          'Stem girdling at the soil line on young transplants, causing lodging and plant death.',
          'Petiole breakage where lesions weaken structural vascular tissue.',
        ],
      },
      {
        category: 'Fruit & Harvest Symptoms',
        symptoms: [
          'Sunken, dark brown to black leathery lesions at the calyx (stem-end) attachment point.',
          'Concentric rings often visible within fruit lesions, extending deep into the fruit flesh.',
          'Loss of canopy foliage leads directly to severe fruit sunscald, cracking, and unmarketable grade.',
        ],
      },
    ],
    preventativeMeasures: [
      {
        category: 'Agronomic & Cultural Practices',
        icon: 'Sprout',
        recommendations: [
          'Enforce strict 3 to 4-year crop rotation with non-solanaceous crops (e.g., legumes, corn, cereals, or brassicas).',
          'Select certified disease-free, high-vigor hybrid seeds and pathogen-indexed nursery seedlings.',
          'Increase inter-plant spacing (minimum 45–60 cm between plants) and orient planting rows parallel to prevailing winds for rapid canopy drying.',
          'Prune the lower 15–20 cm of foliage as plants mature to eliminate soil contact and improve under-canopy ventilation.',
        ],
      },
      {
        category: 'Irrigation & Moisture Governance',
        icon: 'Droplets',
        recommendations: [
          'Utilize sub-canopy drip irrigation exclusively; eliminate overhead sprinkler or spray irrigation during morning/evening.',
          'Schedule irrigation runs for pre-dawn (4:00 AM – 6:00 AM) so that any incidental moisture evaporates rapidly upon sunrise.',
          'Apply clean organic straw or black plastic polyethylene mulch to physically suppress fungal conidia rain-splash from soil.',
        ],
      },
      {
        category: 'Biological & Preventative Bio-Control',
        icon: 'ShieldCheck',
        recommendations: [
          'Apply prophylactic soil drench with Trichoderma harzianum or Bacillus subtilis prior to transplanting.',
          'Spray prophylactic bio-fungicide formulation (Pseudomonas fluorescens 0.5%) during early vegetative stages.',
          'Avoid excessive high-nitrogen fertilization which promotes overly lush, succulent, highly susceptible vegetative growth.',
        ],
      },
    ],
    reputableLinks: [
      {
        title: 'Integrated Pest Management: Early Blight in Tomato',
        organization: 'University of California Agriculture & Natural Resources (UC ANR)',
        authorityType: 'University Extension',
        url: 'https://ipm.ucanr.edu/agriculture/tomato/early-blight/',
        summary:
          'Comprehensive university research guidelines detailing Alternaria solani life cycles, economic thresholds, chemical efficacy tables, and certified resistant cultivars.',
      },
      {
        title: 'Vegetable MD Online: Early Blight of Tomato and Potato',
        organization: 'Cornell University Cooperative Extension',
        authorityType: 'University Extension',
        url: 'https://vegetablemdonline.ppath.cornell.edu/factsheets/Potato_EarlyBlt.htm',
        summary:
          'Clinical diagnostic fact sheet including disease development models, degree-day forecast thresholds, and weather-based spray scheduling algorithms.',
      },
      {
        title: 'Solanaceous Crop Advisory & Diagnostic Guidelines',
        organization: 'ICAR - National Research Centre for Integrated Pest Management (Govt of India)',
        authorityType: 'Government Dept',
        url: 'https://icar.org.in',
        summary:
          'Official guidelines for Maharashtra agro-climatic zones, central insecticide board approved fungicides, and package of practices for smallholder farmers.',
      },
      {
        title: 'Global Plant Protection Database - Alternaria Solani Portal',
        organization: 'Food and Agriculture Organization (FAO) of the United Nations',
        authorityType: 'International Agency',
        url: 'https://www.fao.org/pest-and-pesticide-management/en/',
        summary:
          'International plant health surveillance, maximum residue limit (MRL) standards, and integrated ecological pest management frameworks.',
      },
      {
        title: 'KVK Maharashtra Crop Pest Surveillance Bulletin',
        organization: 'Government of Maharashtra Department of Agriculture',
        authorityType: 'Government Dept',
        url: 'https://krishi.maharashtra.gov.in',
        summary:
          'Real-time weekly agro-meteorological advisories, spore-count forecasts for Pune/Nashik districts, and subsidized fungicide distribution depots.',
      },
    ],
  },
};

const DEFAULT_INITIAL_RECORDS: DbScanRecord[] = [
  {
    id: 'REC-2026-802',
    userId: 'default',
    date: 'Sep 10, 2026',
    daysAgo: 29,
    disease: 'Fusarium Wilt',
    pathogen: 'Fusarium oxysporum',
    crop: 'Tomato (Heirloom)',
    location: 'Pune - Saswad Sector, Maharashtra',
    status: 'Resolved',
    confidence: 78,
    imageCount: 10,
    lossMitigated: '₹11,000 / Acre',
    notes: 'Initial scan baseline. Trichoderma soil drench completed.',
    createdAt: new Date(Date.now() - 29 * 86400000).toISOString(),
  },
  {
    id: 'REC-2026-811',
    userId: 'default',
    date: 'Sep 14, 2026',
    daysAgo: 25,
    disease: 'Septoria Leaf Spot',
    pathogen: 'Septoria lycopersici',
    crop: 'Tomato (Cherry)',
    location: 'Pune - Shirur Cluster, Maharashtra',
    status: 'Resolved',
    confidence: 81,
    imageCount: 11,
    lossMitigated: '₹13,200 / Acre',
    notes: 'Chlorothalonil foliar application halted pycnidia spread.',
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'REC-2026-819',
    userId: 'default',
    date: 'Sep 18, 2026',
    daysAgo: 21,
    disease: 'Leaf Curl Virus',
    pathogen: 'Begomovirus / Whitefly vector',
    crop: 'Tomato (US-440)',
    location: 'Baramati - Agro-Cluster 2, Maharashtra',
    status: 'Resolved',
    confidence: 84,
    imageCount: 10,
    lossMitigated: '₹16,000 / Acre',
    notes: 'Yellow sticky traps and neem azadirachtin successfully contained whitefly vectors.',
    createdAt: new Date(Date.now() - 21 * 86400000).toISOString(),
  },
  {
    id: 'REC-2026-833',
    userId: 'default',
    date: 'Sep 21, 2026',
    daysAgo: 18,
    disease: 'Bacterial Wilt',
    pathogen: 'Ralstonia solanacearum',
    crop: 'Brinjal (Pusa Purple)',
    location: 'Pune - Junnar Valley, Maharashtra',
    status: 'Resolved',
    confidence: 85,
    imageCount: 12,
    lossMitigated: '₹14,000 / Acre',
    notes: 'Copper hydroxide application and soil pH buffered to 6.8.',
    createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
  },
  {
    id: 'REC-2026-842',
    userId: 'default',
    date: 'Sep 25, 2026',
    daysAgo: 14,
    disease: 'Late Blight',
    pathogen: 'Phytophthora infestans',
    crop: 'Potato (Kufri Pukhraj)',
    location: 'Pune - Khed Taluka, Maharashtra',
    status: 'Resolved',
    confidence: 87,
    imageCount: 15,
    lossMitigated: '₹22,500 / Acre',
    notes: 'Full foliar recovery documented on day 10. Secondary tuber inspection confirmed clear of dry rot.',
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: 'REC-2026-857',
    userId: 'default',
    date: 'Sep 28, 2026',
    daysAgo: 11,
    disease: 'Anthracnose',
    pathogen: 'Colletotrichum coccodes',
    crop: 'Chili (G4 Hot)',
    location: 'Solapur - Pandharpur Sector, Maharashtra',
    status: 'Resolved',
    confidence: 89,
    imageCount: 13,
    lossMitigated: '₹15,800 / Acre',
    notes: 'Azoxystrobin spray prevented fruit rot circular lesions.',
    createdAt: new Date(Date.now() - 11 * 86400000).toISOString(),
  },
  {
    id: 'REC-2026-864',
    userId: 'default',
    date: 'Oct 01, 2026',
    daysAgo: 8,
    disease: 'Bacterial Leaf Spot',
    pathogen: 'Xanthomonas campestris',
    crop: 'Chili (Teja Hot)',
    location: 'Satara - Koregaon Block, Maharashtra',
    status: 'Active Treatment',
    confidence: 90,
    imageCount: 11,
    lossMitigated: '₹12,000 / Acre',
    notes: 'Streptocycline bactericide cycle in progress. Soil moisture maintained at 55% field capacity.',
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'REC-2026-872',
    userId: 'default',
    date: 'Oct 03, 2026',
    daysAgo: 6,
    disease: 'Yellow Mosaic Virus',
    pathogen: 'Mungbean Yellow Mosaic Virus',
    crop: 'Soybean (JS-335)',
    location: 'Ahmednagar - Rahuri Belt, Maharashtra',
    status: 'Active Treatment',
    confidence: 91,
    imageCount: 14,
    lossMitigated: '₹17,400 / Acre',
    notes: 'Vector suppression and foliar micro-nutrient boost applied.',
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 'REC-2026-881',
    userId: 'default',
    date: 'Oct 05, 2026',
    daysAgo: 4, // 3 to 5 days ago: triggers follow-up alert!
    disease: 'Early Blight',
    pathogen: 'Alternaria solani',
    crop: 'Tomato (Abhinav Hybrid)',
    location: 'Pune - Haveli Sector 4, Maharashtra',
    status: 'Follow-up Required',
    confidence: 92,
    imageCount: 12,
    lossMitigated: '₹14,500 / Acre',
    notes: 'Primary treatment with Mancozeb initiated on Oct 05. Requires visual foliar audit for secondary lesion arrest.',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'REC-2026-879',
    userId: 'default',
    date: 'Oct 06, 2026',
    daysAgo: 3, // 3 to 5 days ago: triggers follow-up alert!
    disease: 'Powdery Mildew',
    pathogen: 'Erysiphe cichoracearum',
    crop: 'Capsicum (Indra Bell)',
    location: 'Nashik - Dindori Valley, Maharashtra',
    status: 'Follow-up Required',
    confidence: 94,
    imageCount: 14,
    lossMitigated: '₹18,200 / Acre',
    notes: 'Sulphur-based micronized dust applied. Check vegetative growth tips for white fungal talc residue clearance.',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

// --- Modular UI Subcomponents ---

// 1. Auth Modal Component
function AuthModal({
  isOpen,
  onClose,
  initialMode = 'login',
  currentUser,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup' | 'reset';
  currentUser: User | null;
}) {
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'reset'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('Senior Field Agronomist');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setAuthMode(initialMode);
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      await loginWithEmail(email, password);
      onClose();
    } catch (err: any) {
      if (err?.code === 'auth/operation-not-allowed') {
        setErrorMsg('Email/Password provider is not yet enabled in the Firebase console. Please use Google Login or Quick Agronomist Access below.');
      } else if (err?.code === 'auth/invalid-credential' || err?.code === 'auth/user-not-found' || err?.code === 'auth/wrong-password') {
        setErrorMsg('Invalid email or password. Please verify your credentials or create a new account.');
      } else {
        setErrorMsg(err?.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      await registerWithEmail(email, password, displayName || 'Field Agronomist', role);
      onClose();
    } catch (err: any) {
      if (err?.code === 'auth/operation-not-allowed') {
        setErrorMsg('Email/Password signup is not yet enabled in the Firebase console. Please use Google Login or Quick Agronomist Access below.');
      } else if (err?.code === 'auth/email-already-in-use') {
        setErrorMsg('An account with this email address already exists. Please log in.');
      } else if (err?.code === 'auth/weak-password') {
        setErrorMsg('Password should be at least 6 characters long.');
      } else {
        setErrorMsg(err?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await resetUserPassword(email);
      setSuccessMsg(`Password reset instructions sent to ${email}. Check your inbox.`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not send reset email. Ensure the email address is registered.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Google authentication was cancelled or encountered an error.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Create or login with a dedicated agronomist account
      await loginWithEmail('agronomist.pune@kvk-demo.org', 'Krishi2026#Secure').catch(async () => {
        await registerWithEmail('agronomist.pune@kvk-demo.org', 'Krishi2026#Secure', 'Dr. Arvind Deshmukh', 'Chief Agronomist · KVK Pune');
      });
      onClose();
    } catch (err: any) {
      setErrorMsg('Demo sign-in initialized. If email provider is disabled in Firebase, use Google Sign-in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-[#E2E8E0] max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F0F4F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EBF5EE] text-[#2D6A4F] flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-[#1B4332]">
                {authMode === 'login' && 'Agronomist Authentication'}
                {authMode === 'signup' && 'Create Agronomist Account'}
                {authMode === 'reset' && 'Reset Account Password'}
              </h3>
              <p className="text-[11px] text-[#52796F]">
                Secure Firebase authentication & record sync
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#52796F] hover:text-[#1B4332] hover:bg-[#F4F7F4]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Auth Mode Tabs */}
        <div className="flex bg-[#F4F7F4] p-1 rounded-lg mb-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setAuthMode('login'); setErrorMsg(null); }}
            className={`flex-1 py-1.5 rounded-md transition-all ${
              authMode === 'login' ? 'bg-white text-[#1B4332] shadow-xs font-bold' : 'text-[#52796F]'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('signup'); setErrorMsg(null); }}
            className={`flex-1 py-1.5 rounded-md transition-all ${
              authMode === 'signup' ? 'bg-white text-[#1B4332] shadow-xs font-bold' : 'text-[#52796F]'
            }`}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('reset'); setErrorMsg(null); }}
            className={`flex-1 py-1.5 rounded-md transition-all ${
              authMode === 'reset' ? 'bg-white text-[#1B4332] shadow-xs font-bold' : 'text-[#52796F]'
            }`}
          >
            Reset
          </button>
        </div>

        {/* Error / Success Notifications */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{errorMsg}</p>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{successMsg}</p>
          </div>
        )}

        {/* Forms */}
        {authMode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#1B4332] mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#748C7E] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="agronomist@kvk-maharashtra.gov.in"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#CBD5E0] focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none text-[#1B4332]"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-[#1B4332]">Password</label>
                <button
                  type="button"
                  onClick={() => setAuthMode('reset')}
                  className="text-[11px] text-[#2D6A4F] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#748C7E] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#CBD5E0] focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none text-[#1B4332]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2 mt-2"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Authenticating...' : 'Sign In to AgriShield'}
            </button>
          </form>
        )}

        {authMode === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#1B4332] mb-1">
                Full Name & Title
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#748C7E] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Dr. Rajesh Patel"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#CBD5E0] focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none text-[#1B4332]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1B4332] mb-1">
                Institutional Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#748C7E] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rajesh.patel@mpkv-agri.edu"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#CBD5E0] focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none text-[#1B4332]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1B4332] mb-1">
                Create Secure Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#748C7E] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#CBD5E0] focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none text-[#1B4332]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1B4332] mb-1">
                Agricultural Designation / Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#CBD5E0] bg-white text-[#1B4332] focus:ring-2 focus:ring-[#2D6A4F]"
              >
                <option value="Senior Field Agronomist">Senior Field Agronomist</option>
                <option value="KVK Extension Specialist">KVK Extension Specialist</option>
                <option value="Plant Pathologist">Plant Pathologist</option>
                <option value="Commercial Farm Manager">Commercial Farm Manager</option>
                <option value="Independent Crop Consultant">Independent Crop Consultant</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2 mt-2"
            >
              <Check className="w-4 h-4" />
              {loading ? 'Creating Account...' : 'Register Agronomist Account'}
            </button>
          </form>
        )}

        {authMode === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-3.5">
            <p className="text-xs text-[#52796F] leading-relaxed">
              Enter your registered email address. Firebase will dispatch an official password reset link.
            </p>
            <div>
              <label className="block text-xs font-semibold text-[#1B4332] mb-1">
                Registered Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#748C7E] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your-email@institution.org"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#CBD5E0] focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none text-[#1B4332]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              {loading ? 'Sending...' : 'Send Password Reset Email'}
            </button>
          </form>
        )}

        {/* Social and Demo Quick Actions */}
        <div className="mt-4 pt-4 border-t border-[#F0F4F0] space-y-2">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-2 px-3 rounded-lg border border-[#E2E8E0] hover:bg-[#F8FAF8] text-xs font-semibold text-[#2D3748] flex items-center justify-center gap-2 transition-colors"
          >
            <Globe className="w-4 h-4 text-[#4285F4]" />
            <span>Sign in with Google</span>
          </button>

          <button
            type="button"
            onClick={handleDemoSignIn}
            disabled={loading}
            className="w-full py-1.5 px-3 rounded-lg bg-[#EBF5EE] hover:bg-[#D8F3DC] text-[11px] font-bold text-[#1B4332] border border-[#D8F3DC] flex items-center justify-center gap-1.5 transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-[#2D6A4F]" />
            <span>Instant Demo Agronomist Access</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// 2. Top Header Component
function Header({
  activeTab,
  onTabChange,
  recordsNeedingFollowupCount,
  currentUser,
  onOpenAuth,
  onLogout,
}: {
  activeTab: 'new-scan' | 'health-records';
  onTabChange: (tab: 'new-scan' | 'health-records') => void;
  recordsNeedingFollowupCount: number;
  currentUser: User | null;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onLogout: () => void;
}) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'AD';
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FFFFFF] border-b border-[#E2E8E0] px-4 sm:px-6 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#2D6A4F] text-white flex items-center justify-center shadow-xs">
            <Sprout className="w-5 h-5 text-[#D8F3DC]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg sm:text-xl text-[#1B4332] tracking-tight">
                AgriShield
              </span>
              <span className="text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-sm bg-[#EBF5EE] text-[#2D6A4F] border border-[#D8F3DC]">
                Precision AI Lab
              </span>
            </div>
            <p className="text-xs text-[#52796F] hidden sm:block">
              Automated Plant Pathology & Microclimate Correlation Platform
            </p>
          </div>
        </div>

        {/* Center Nav for medium+ screens */}
        <nav className="hidden md:flex items-center gap-1 bg-[#F4F7F4] p-1 rounded-lg border border-[#E2E8E0]">
          <button
            type="button"
            onClick={() => onTabChange('new-scan')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'new-scan'
                ? 'bg-white text-[#1B4332] shadow-xs font-bold'
                : 'text-[#52796F] hover:text-[#1B4332]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            New Scan
          </button>
          <button
            type="button"
            onClick={() => onTabChange('health-records')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-2 relative ${
              activeTab === 'health-records'
                ? 'bg-white text-[#1B4332] shadow-xs font-bold'
                : 'text-[#52796F] hover:text-[#1B4332]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Health Records
            {recordsNeedingFollowupCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white"></span>
            )}
          </button>
        </nav>

        {/* User Profile / Auth Action Zone */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-semibold text-[#1B4332]">
                  {currentUser.displayName || 'Field Agronomist'}
                </span>
                <span className="text-[11px] text-[#52796F] truncate max-w-[180px]">
                  {currentUser.email}
                </span>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="relative flex items-center focus:outline-none ring-2 ring-[#2D6A4F]/20 rounded-full"
                  aria-label="User profile menu"
                >
                  <div className="w-9 h-9 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-display font-bold text-xs shadow-xs border-2 border-white">
                    {getInitials(currentUser.displayName, currentUser.email)}
                  </div>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-[#E2E8E0] p-3 text-xs z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="pb-2 mb-2 border-b border-[#F0F4F0]">
                      <p className="font-semibold text-[#1B4332]">
                        {currentUser.displayName || 'Field Agronomist'}
                      </p>
                      <p className="text-[#52796F] text-[11px] truncate">{currentUser.email}</p>
                      <p className="text-[#748C7E] text-[10px] mt-0.5">
                        Firebase Authenticated · UID: {currentUser.uid.slice(0, 8)}...
                      </p>
                    </div>

                    <div className="space-y-1 text-[#2D6A4F]">
                      <div className="flex items-center justify-between py-1 px-2 rounded hover:bg-[#F4F7F4]">
                        <span>Cloud Database</span>
                        <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          Firestore Synced
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1 px-2 rounded hover:bg-[#F4F7F4]">
                        <span>Monitored Zone</span>
                        <span className="font-mono text-[10px] text-[#52796F]">Pune District</span>
                      </div>
                    </div>

                    <div className="pt-2 mt-2 border-t border-[#F0F4F0] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileMenu(false);
                          onLogout();
                        }}
                        className="text-[11px] text-red-600 hover:text-red-800 font-semibold flex items-center gap-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowProfileMenu(false)}
                        className="text-[11px] text-[#52796F] hover:text-[#1B4332] font-medium"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="px-3 py-1.5 text-xs font-semibold text-[#1B4332] hover:bg-[#F4F7F4] rounded-lg transition-colors"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('signup')}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
              >
                <UserIcon className="w-3.5 h-3.5" />
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// 3. Weather Context Card Component
function WeatherContextCard({ weather }: { weather: WeatherData }) {
  return (
    <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8E0] p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#F0F4F0]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#EBF5EE] text-[#2D6A4F] flex items-center justify-center">
              <MapPin className="w-4 h-4 text-[#2D6A4F]" />
            </div>
            <div>
              <h2 className="text-xs uppercase font-bold tracking-wider text-[#52796F]">
                Local Weather Context
              </h2>
              <p className="text-[11px] text-[#748C7E]">Extracted EXIF GPS Telemetry</p>
            </div>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#F4F7F4] text-[#1B4332] border border-[#E2E8E0]">
            Live Sync
          </span>
        </div>

        {/* Primary Geo and Conditions */}
        <div className="space-y-3">
          <div>
            <div className="flex items-baseline justify-between">
              <h3 className="font-display text-lg font-bold text-[#1B4332]">{weather.location}</h3>
              <span className="font-display text-2xl font-bold text-[#1B4332] tracking-tight">
                {weather.temperature}
              </span>
            </div>
            <p className="text-xs font-mono text-[#52796F] mt-0.5">{weather.coordinates}</p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <div className="p-2.5 rounded-lg bg-[#F8FAF8] border border-[#E2E8E0]/70">
              <div className="flex items-center gap-1.5 text-xs text-[#52796F] mb-1">
                <Droplets className="w-3.5 h-3.5 text-[#2D6A4F]" />
                <span>Relative Humidity</span>
              </div>
              <p className="text-base font-bold text-[#1B4332] font-mono">{weather.humidity}</p>
              <p className="text-[10px] text-amber-700 font-medium">Critical Fungal Spore Index</p>
            </div>

            <div className="p-2.5 rounded-lg bg-[#F8FAF8] border border-[#E2E8E0]/70">
              <div className="flex items-center gap-1.5 text-xs text-[#52796F] mb-1">
                <CloudRain className="w-3.5 h-3.5 text-[#2D6A4F]" />
                <span>Sky Condition</span>
              </div>
              <p className="text-base font-bold text-[#1B4332]">{weather.condition}</p>
              <p className="text-[10px] text-[#52796F]">Dense canopy cloud cover</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#F0F4F0] space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#52796F] flex items-center gap-1">
            <Wind className="w-3.5 h-3.5" /> Canopy Wind Speed
          </span>
          <span className="font-mono font-medium text-[#1B4332]">{weather.windSpeed}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#52796F] flex items-center gap-1">
            <Thermometer className="w-3.5 h-3.5" /> Dew Point
          </span>
          <span className="font-mono font-medium text-[#1B4332]">{weather.dewPoint}</span>
        </div>

        <div className="p-2.5 rounded-lg bg-[#FEF3C7]/60 border border-[#FDE68A] text-xs text-[#92400E] flex items-start gap-2 mt-2">
          <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong>Microclimate Alert:</strong> 75% humidity + overcast skies provide optimal incubation for foliar fungal pathogens.
          </p>
        </div>
      </div>
    </div>
  );
}

// 4. Simulated AI Processing State Component
function ProcessingScreen({ onComplete }: { onComplete: () => void }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  const processingSteps = [
    'Enhancing low-quality images with AI...',
    'Analyzing plant pathogens...',
    'Correlating weather data...',
  ];

  useEffect(() => {
    const startTime = Date.now();
    const duration = 6000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgressPercent(progress);

      if (elapsed < 2000) {
        setCurrentStepIndex(0);
      } else if (elapsed < 4000) {
        setCurrentStepIndex(1);
      } else {
        setCurrentStepIndex(2);
      }

      if (elapsed >= duration) {
        clearInterval(interval);
        onComplete();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="min-h-[500px] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#E2E8E0] p-8 shadow-sm">
        <div className="relative w-28 h-28 mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#52B788]/40 animate-spin" style={{ animationDuration: '10s' }}></div>
          <div className="absolute inset-2 rounded-full border-2 border-[#2D6A4F]/20 animate-pulse"></div>
          <div className="w-20 h-20 rounded-2xl bg-[#EBF5EE] border border-[#D8F3DC] flex items-center justify-center shadow-xs">
            <Leaf className="w-10 h-10 text-[#2D6A4F] animate-bounce" style={{ animationDuration: '2s' }} />
          </div>
          <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[#2D6A4F] to-transparent animate-pulse"></div>
        </div>

        <div className="mb-6">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#52796F] font-semibold">
            Neural Pathology Engine · In Progress
          </span>
          <h3 className="font-display text-xl font-bold text-[#1B4332] mt-1.5 min-h-[3.5rem] flex items-center justify-center">
            {processingSteps[currentStepIndex]}
          </h3>
          <p className="text-xs text-[#52796F] mt-1">
            Analyzing batch leaves and cross-referencing local Pune GPS meteorological factors
          </p>
        </div>

        <div className="w-full bg-[#EBF5EE] rounded-full h-2.5 overflow-hidden mb-3 border border-[#D8F3DC]">
          <div
            className="bg-[#2D6A4F] h-full rounded-full transition-all duration-150 ease-out"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <div className="flex justify-between items-center text-xs text-[#52796F] font-mono">
          <span>Processing 12 / 12 field images</span>
          <span className="font-bold text-[#1B4332]">{progressPercent}%</span>
        </div>

        <div className="mt-6 pt-5 border-t border-[#F0F4F0] space-y-2 text-left">
          {processingSteps.map((step, idx) => {
            const isCompleted = currentStepIndex > idx;
            const isCurrent = currentStepIndex === idx;
            return (
              <div
                key={step}
                className={`flex items-center gap-2.5 text-xs py-1 transition-all ${
                  isCurrent
                    ? 'text-[#1B4332] font-semibold'
                    : isCompleted
                    ? 'text-[#52796F]'
                    : 'text-[#A0AEC0]'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-[#2D6A4F] shrink-0" />
                ) : isCurrent ? (
                  <div className="w-4 h-4 rounded-full border-2 border-[#2D6A4F] border-t-transparent animate-spin shrink-0"></div>
                ) : (
                  <div className="w-4 h-4 rounded-full border border-[#CBD5E0] shrink-0"></div>
                )}
                <span className="truncate">{step}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// 5. Enhanced Diagnostic Results View Component (with Symptoms, Preventative Measures, Extensions, Stages Gallery)
function DiagnosticResultsView({
  diagnostic,
  weather,
  onSaveToRecords,
  currentUser,
}: {
  diagnostic: DiagnosticDetails;
  weather: WeatherData;
  onSaveToRecords: () => void;
  currentUser: User | null;
}) {
  const [acreCount, setAcreCount] = useState<number>(1);
  const [activeStrategies, setActiveStrategies] = useState<number[]>([1, 2, 3]);
  const [selectedStageIndex, setSelectedStageIndex] = useState<number>(1); // Default to stage 2 (current detected stage)
  const [activeDetailTab, setActiveDetailTab] = useState<'treatment' | 'stages' | 'symptoms' | 'prevention' | 'links'>('treatment');
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const toggleStrategy = (id: number) => {
    setActiveStrategies((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDownloadPdf = () => {
    setPdfGenerating(true);
    try {
      generateDiagnosticPdf({
        diagnostic,
        weather,
        acreCount,
        agronomistName: currentUser?.displayName || 'Dr. Arvind Deshmukh',
        agronomistEmail: currentUser?.email || 'arvind.deshmukh@kvk-pune.res.in',
      });
    } catch (err) {
      console.error('Failed to generate diagnostic PDF report:', err);
    } finally {
      setTimeout(() => setPdfGenerating(false), 600);
    }
  };

  const calculatedTotalLoss = diagnostic.economics.lossPerAcre * acreCount;
  const currentStage = diagnostic.detailedKnowledge.stages[selectedStageIndex];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E2E8E0] shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#52796F]">
            <span>Field Pathology Analysis</span>
            <span aria-hidden="true">·</span>
            <span>Batch Diagnostic Session</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 font-semibold">Validated</span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[#1B4332] mt-0.5">
            Pathological Diagnostic Report
          </h2>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={pdfGenerating}
            className="px-4 py-2 text-xs font-bold text-[#1B4332] bg-[#EBF5EE] hover:bg-[#D8F3DC] border border-[#D8F3DC] rounded-lg transition-all shadow-xs flex items-center gap-2 whitespace-nowrap active:scale-95"
            title="Download branded clinical PDF report"
          >
            <Download className={`w-4 h-4 text-[#2D6A4F] ${pdfGenerating ? 'animate-bounce' : ''}`} />
            <span>{pdfGenerating ? 'Generating PDF...' : 'Download Diagnostic PDF'}</span>
          </button>

          <button
            type="button"
            onClick={onSaveToRecords}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-lg transition-colors shadow-xs flex items-center gap-2 whitespace-nowrap"
          >
            <Check className="w-4 h-4" />
            Save to Records
          </button>
        </div>
      </div>

      {/* Primary Split: Disease Classification & Root Cause Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Disease Classification Card */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#E2E8E0] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#52796F] font-semibold">
                  Detected Plant Pathogen
                </span>
                <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[#1B4332] mt-1">
                  {diagnostic.diseaseName}
                </h3>
                <p className="text-sm italic text-[#52796F] font-serif">
                  {diagnostic.pathogenScientificName}
                </p>
                <p className="text-xs text-[#748C7E] mt-1">
                  Target Host: <span className="font-medium text-[#1B4332]">{diagnostic.cropType}</span>
                </p>
              </div>

              {/* Confidence Meter Badge */}
              <div className="text-right bg-[#EBF5EE] p-3 rounded-xl border border-[#D8F3DC] shrink-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#52796F] block">
                  AI Confidence
                </span>
                <span className="font-display text-3xl font-extrabold text-[#1B4332] font-mono">
                  {diagnostic.confidence}%
                </span>
                <span className="text-[11px] font-semibold text-[#2D6A4F] block mt-0.5">
                  High Precision Match
                </span>
              </div>
            </div>

            {/* Confidence Progress Bar */}
            <div className="mt-5">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-[#52796F] font-medium">Model Confidence Distribution</span>
                <span className="font-mono text-xs font-bold text-[#1B4332]">{diagnostic.confidence} / 100</span>
              </div>
              <div className="w-full bg-[#EBF5EE] rounded-full h-3 overflow-hidden border border-[#D8F3DC]">
                <div
                  className="bg-[#2D6A4F] h-full rounded-full transition-all duration-700"
                  style={{ width: `${diagnostic.confidence}%` }}
                ></div>
              </div>
            </div>

            {/* Visual Leaf Lesion Macro Simulation */}
            <div className="mt-6 p-4 rounded-xl bg-[#F8FAF8] border border-[#E2E8E0]">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-semibold text-[#1B4332] flex items-center gap-1.5">
                  <Leaf className="w-4 h-4 text-[#2D6A4F]" />
                  Foliar Symptom Signature
                </span>
                <span className="font-mono text-[11px] text-[#52796F]">{diagnostic.leafAreaAffected}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-[#E2E8E0]">
                  <p className="text-[11px] text-[#52796F]">Lesion Pattern</p>
                  <p className="font-semibold text-[#1B4332] mt-0.5">Concentric 'Target-Board' Rings</p>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-[#E2E8E0]">
                  <p className="text-[11px] text-[#52796F]">Halo Classification</p>
                  <p className="font-semibold text-[#1B4332] mt-0.5">Chlorotic Yellow Margin</p>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-[#E2E8E0]">
                  <p className="text-[11px] text-[#52796F]">Severity Vector</p>
                  <p className="font-semibold text-[#B45309] mt-0.5">{diagnostic.severity}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Root Cause Analysis Card */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-[#E2E8E0] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-[#F0F4F0]">
              <div className="w-8 h-8 rounded-lg bg-[#FEF3C7] text-[#B45309] flex items-center justify-center">
                <CloudRain className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-[#1B4332]">
                  Root Cause Analysis
                </h3>
                <p className="text-[11px] text-[#52796F]">Meteorological Correlation</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#2D3748] leading-relaxed">
              {diagnostic.rootCauseText}
            </p>

            <div className="mt-4 p-3.5 rounded-xl bg-[#F4F7F4] border border-[#E2E8E0] space-y-2">
              <span className="text-[11px] font-semibold text-[#1B4332] block">
                Correlated Local Factors ({weather.location}):
              </span>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#52796F]">Relative Humidity</span>
                <span className="font-mono font-bold text-[#1B4332]">{weather.humidity} (Threshold &gt;70%)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#52796F]">Temperature</span>
                <span className="font-mono font-bold text-[#1B4332]">{weather.temperature} (Optimum Fungal Band)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#52796F]">Canopy Wetness</span>
                <span className="font-mono font-bold text-[#1B4332]">{weather.canopyMoistureHours}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#F0F4F0] text-xs text-[#52796F] flex items-center gap-2">
            <Info className="w-4 h-4 text-[#2D6A4F] shrink-0" />
            <span>Spore proliferation probability is graded <strong>Critical</strong> until cloud cover thins.</span>
          </div>
        </div>
      </div>

      {/* --- ENHANCED DETAILED CLINICAL KNOWLEDGE SECTION --- */}
      <div className="bg-white rounded-xl border border-[#E2E8E0] shadow-xs overflow-hidden">
        {/* Navigation Tabs for In-depth Knowledge */}
        <div className="border-b border-[#E2E8E0] bg-[#F8FAF8] px-6 pt-4">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-3">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#52796F] font-semibold">
                Comprehensive Disease Dossier
              </span>
              <h3 className="font-display text-lg font-bold text-[#1B4332]">
                Detailed Pathological Profile: {diagnostic.diseaseName}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-[#E2E8E0] overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveDetailTab('treatment')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeDetailTab === 'treatment'
                    ? 'bg-[#1B4332] text-white shadow-xs'
                    : 'text-[#52796F] hover:text-[#1B4332]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Treatment Plan
              </button>
              <button
                type="button"
                onClick={() => setActiveDetailTab('stages')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeDetailTab === 'stages'
                    ? 'bg-[#1B4332] text-white shadow-xs'
                    : 'text-[#52796F] hover:text-[#1B4332]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Stages Progression
              </button>
              <button
                type="button"
                onClick={() => setActiveDetailTab('symptoms')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeDetailTab === 'symptoms'
                    ? 'bg-[#1B4332] text-white shadow-xs'
                    : 'text-[#52796F] hover:text-[#1B4332]'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Common Symptoms
              </button>
              <button
                type="button"
                onClick={() => setActiveDetailTab('prevention')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeDetailTab === 'prevention'
                    ? 'bg-[#1B4332] text-white shadow-xs'
                    : 'text-[#52796F] hover:text-[#1B4332]'
                }`}
              >
                <Sprout className="w-3.5 h-3.5" />
                Preventative Measures
              </button>
              <button
                type="button"
                onClick={() => setActiveDetailTab('links')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeDetailTab === 'links'
                    ? 'bg-[#1B4332] text-white shadow-xs'
                    : 'text-[#52796F] hover:text-[#1B4332]'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                Authoritative Extensions
              </button>
            </div>
          </div>
        </div>

        {/* Tab 1: Treatment Plan & Prescriptions */}
        {activeDetailTab === 'treatment' && (
          <div className="p-6 space-y-6 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F0F4F0] gap-2">
              <div>
                <h4 className="font-display text-base font-bold text-[#1B4332]">
                  Recommended Prescription & Chemical Formulation
                </h4>
                <p className="text-xs text-[#52796F]">
                  Central Insecticide Board & Agricultural University Certified Schedule
                </p>
              </div>

              {/* Price Tag */}
              <div className="flex items-center gap-3 bg-[#F8FAF8] px-4 py-2 rounded-lg border border-[#E2E8E0]">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[#52796F] block">
                    Current Market Price
                  </span>
                  <span className="font-display font-extrabold text-base text-[#1B4332] font-mono">
                    {diagnostic.treatment.marketPrice}
                  </span>
                </div>
                <span className="text-[11px] text-[#52796F]">({diagnostic.treatment.packageUnit})</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#EBF5EE]/50 border border-[#D8F3DC]">
              <span className="text-xs text-[#52796F]">Fungicide Active Ingredient & Formulation:</span>
              <p className="font-display text-base font-bold text-[#1B4332] mt-0.5">
                {diagnostic.treatment.medicineName}
              </p>
              <p className="text-xs text-[#2D6A4F] font-medium mt-0.5">
                {diagnostic.treatment.tradeFormulation}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Instructions */}
              <div className="lg:col-span-7 space-y-3">
                <h5 className="text-xs uppercase font-bold tracking-wider text-[#1B4332]">
                  Step-by-Step Usage Instructions
                </h5>
                <div className="space-y-2.5">
                  {diagnostic.treatment.instructions.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg bg-[#F8FAF8] border border-[#E2E8E0] text-xs"
                    >
                      <span className="w-5 h-5 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-mono font-bold text-[11px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-[#2D3748] leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Red-Bordered Precautions Warning Box */}
              <div className="lg:col-span-5">
                <div className="h-full rounded-xl border-2 border-red-500 bg-red-50/80 p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 pb-3 mb-3 border-b border-red-200">
                      <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-display text-sm font-extrabold text-red-900 uppercase tracking-wide">
                          Precautions: What NOT to Do
                        </h5>
                        <p className="text-[11px] text-red-700">Safety & Phytotoxicity Warnings</p>
                      </div>
                    </div>

                    <ul className="space-y-2.5 text-xs text-red-900">
                      {diagnostic.treatment.precautions.map((precaution, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-red-600 font-bold font-mono text-sm leading-none shrink-0 mt-0.5">
                            ✕
                          </span>
                          <p className="leading-relaxed font-medium">{precaution}</p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 pt-3 border-t border-red-200 text-[11px] text-red-800 italic">
                    Strict adherence prevents chemical resistance and foliage burns.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: High-Resolution Images of Disease at Various Stages */}
        {activeDetailTab === 'stages' && (
          <div className="p-6 space-y-6 animate-in fade-in duration-150">
            <div>
              <h4 className="font-display text-base font-bold text-[#1B4332]">
                High-Resolution Progression Stages: Pathogen Evolution
              </h4>
              <p className="text-xs text-[#52796F]">
                Morphological changes from initial spore landing through terminal canopy defoliation
              </p>
            </div>

            {/* Stage Selector Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {diagnostic.detailedKnowledge.stages.map((stage, idx) => (
                <button
                  key={stage.stageNumber}
                  type="button"
                  onClick={() => setSelectedStageIndex(idx)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    selectedStageIndex === idx
                      ? 'bg-white border-[#2D6A4F] shadow-md ring-2 ring-[#2D6A4F]/20'
                      : 'bg-[#F8FAF8] border-[#E2E8E0] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[11px] font-bold text-[#52796F]">
                      Stage 0{stage.stageNumber}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${stage.severityColor}`}>
                      {stage.severityLabel}
                    </span>
                  </div>
                  <h5 className="font-display text-xs font-bold text-[#1B4332] truncate">
                    {stage.stageName.split(':')[1] || stage.stageName}
                  </h5>
                  <p className="text-[11px] text-[#748C7E] mt-0.5">{stage.timeframe}</p>
                </button>
              ))}
            </div>

            {/* Selected Stage Deep-Dive Visual Showcase */}
            <div className="p-5 rounded-xl border border-[#E2E8E0] bg-[#FDFEFC]">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Visual Stage Simulation / Graphic Representation */}
                <div className="lg:col-span-5">
                  <div className="aspect-4/3 rounded-xl border border-[#CBD5E0] bg-gradient-to-br from-[#1E3A2F] via-[#2D6A4F] to-[#142A22] p-6 text-white flex flex-col justify-between shadow-inner relative overflow-hidden">
                    {/* Simulated Stage Visual Leaf Render */}
                    <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                    
                    {/* Stage concentric rings simulation overlay */}
                    {selectedStageIndex === 0 && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border border-amber-300/40 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-amber-400/30 animate-pulse flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-amber-200"></div>
                        </div>
                      </div>
                    )}
                    {selectedStageIndex === 1 && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full border-2 border-amber-400/50 flex items-center justify-center">
                        <div className="w-32 h-32 rounded-full border-2 border-amber-500/60 flex items-center justify-center">
                          <div className="w-20 h-20 rounded-full border-2 border-amber-600/70 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-amber-700/80 animate-ping"></div>
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedStageIndex === 2 && (
                      <div className="absolute inset-0 bg-red-950/40 flex items-center justify-center p-4">
                        <div className="w-full h-full border-2 border-dashed border-red-400/40 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="w-16 h-16 text-red-400/80 animate-pulse" />
                        </div>
                      </div>
                    )}

                    <div className="relative z-10 flex justify-between items-start">
                      <span className="font-mono text-xs px-2.5 py-1 rounded bg-black/40 backdrop-blur-xs font-bold text-[#D8F3DC]">
                        Foliar Specimen #{selectedStageIndex + 1}
                      </span>
                      <span className="font-mono text-xs text-white/80">Macro 40x</span>
                    </div>

                    <div className="relative z-10">
                      <p className="text-xs font-mono uppercase tracking-wider text-[#A7D7C5]">
                        Symptom Progression
                      </p>
                      <h5 className="font-display text-lg font-bold text-white mt-0.5">
                        {currentStage.stageName}
                      </h5>
                      <p className="text-xs text-white/80 mt-1 font-mono">
                        Observation Window: {currentStage.timeframe}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stage Descriptions & Clinical Protocols */}
                <div className="lg:col-span-7 space-y-4 text-xs">
                  <div>
                    <h5 className="font-bold text-[#1B4332] text-sm flex items-center gap-2">
                      <Eye className="w-4 h-4 text-[#2D6A4F]" />
                      Macroscopic Foliar Presentation
                    </h5>
                    <p className="text-[#2D3748] mt-1 leading-relaxed bg-[#F8FAF8] p-3 rounded-lg border border-[#E2E8E0]">
                      {currentStage.macroscopicVisual}
                    </p>
                  </div>

                  <div>
                    <h5 className="font-bold text-[#1B4332] text-sm flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#2D6A4F]" />
                      Microscopic Cellular Pathology
                    </h5>
                    <p className="text-[#2D3748] mt-1 leading-relaxed bg-[#F8FAF8] p-3 rounded-lg border border-[#E2E8E0]">
                      {currentStage.microscopicPathology}
                    </p>
                  </div>

                  <div>
                    <h5 className="font-bold text-[#1B4332] text-sm flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#2D6A4F]" />
                      Agronomist Clinical Protocol
                    </h5>
                    <p className="text-[#1B4332] font-medium mt-1 leading-relaxed bg-[#EBF5EE] p-3 rounded-lg border border-[#D8F3DC]">
                      {currentStage.actionProtocol}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Detailed Common Symptoms */}
        {activeDetailTab === 'symptoms' && (
          <div className="p-6 space-y-6 animate-in fade-in duration-150">
            <div>
              <h4 className="font-display text-base font-bold text-[#1B4332]">
                Organ-by-Organ Symptom Diagnostic Checklist
              </h4>
              <p className="text-xs text-[#52796F]">
                Distinctive indicators for differential diagnosis against Late Blight and Septoria Leaf Spot
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {diagnostic.detailedKnowledge.commonSymptoms.map((section, idx) => (
                <div
                  key={idx}
                  className="bg-[#F8FAF8] rounded-xl border border-[#E2E8E0] p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 pb-2 mb-3 border-b border-[#E2E8E0]">
                      <div className="w-6 h-6 rounded-md bg-[#EBF5EE] text-[#2D6A4F] flex items-center justify-center font-mono font-bold text-xs">
                        0{idx + 1}
                      </div>
                      <h5 className="font-display text-xs font-bold text-[#1B4332]">
                        {section.category}
                      </h5>
                    </div>

                    <ul className="space-y-2.5 text-xs text-[#2D3748]">
                      {section.symptoms.map((symptom, sIdx) => (
                        <li key={sIdx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] shrink-0 mt-1.5"></span>
                          <span className="leading-relaxed">{symptom}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-[#FEF3C7]/50 border border-[#FDE68A] text-xs text-[#92400E] flex items-start gap-3">
              <Info className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Differential Diagnosis Distinction:</strong>
                <p className="leading-relaxed mt-0.5 text-[11px]">
                  Unlike Late Blight (which causes rapid water-soaked greying and white fungal fluff under humid mornings), Early Blight lesions remain dry, brittle, concentric, and dark brown, confined by leaf veins.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Preventative Measures */}
        {activeDetailTab === 'prevention' && (
          <div className="p-6 space-y-6 animate-in fade-in duration-150">
            <div>
              <h4 className="font-display text-base font-bold text-[#1B4332]">
                Preventative Measures & Integrated Pest Management (IPM)
              </h4>
              <p className="text-xs text-[#52796F]">
                Sustainable cultural, water governance, and biological prophylactic strategies
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {diagnostic.detailedKnowledge.preventativeMeasures.map((cat, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-[#E2E8E0] p-4 shadow-xs"
                >
                  <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-[#F0F4F0]">
                    <div className="w-7 h-7 rounded-lg bg-[#EBF5EE] text-[#2D6A4F] flex items-center justify-center">
                      {idx === 0 && <Sprout className="w-4 h-4" />}
                      {idx === 1 && <Droplets className="w-4 h-4" />}
                      {idx === 2 && <ShieldCheck className="w-4 h-4" />}
                    </div>
                    <h5 className="font-display text-xs font-bold text-[#1B4332]">
                      {cat.category}
                    </h5>
                  </div>

                  <ul className="space-y-2.5 text-xs text-[#2D3748]">
                    {cat.recommendations.map((rec, rIdx) => (
                      <li key={rIdx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-[#2D6A4F] shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-[#EBF5EE] border border-[#D8F3DC] text-xs text-[#1B4332] flex items-center justify-between">
              <div>
                <span className="font-bold block">Resistant Cultivar Recommendation:</span>
                <span className="text-[#52796F] text-[11px]">
                  Cultivars with Solanum habrochaites introgressions (e.g. Mountain Magic, Defiant PhR) exhibit superior horizontal polygenic resistance.
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-[#2D6A4F] bg-white px-2.5 py-1 rounded-md border border-[#D8F3DC]">
                Polygenic Defense
              </span>
            </div>
          </div>
        )}

        {/* Tab 5: Authoritative University Extensions & Government Portals */}
        {activeDetailTab === 'links' && (
          <div className="p-6 space-y-6 animate-in fade-in duration-150">
            <div>
              <h4 className="font-display text-base font-bold text-[#1B4332]">
                Reputable Agricultural Websites & Extension Portals
              </h4>
              <p className="text-xs text-[#52796F]">
                Verified scientific research, degree-day forecast bulletins, and government subsidy portals
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {diagnostic.detailedKnowledge.reputableLinks.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-[#E2E8E0] bg-[#F8FAF8] hover:bg-white hover:border-[#2D6A4F] transition-all flex flex-col justify-between group shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#2D6A4F] bg-[#EBF5EE] px-2 py-0.5 rounded border border-[#D8F3DC]">
                        {item.authorityType}
                      </span>
                      <ExternalLink className="w-4 h-4 text-[#748C7E] group-hover:text-[#2D6A4F] transition-colors" />
                    </div>

                    <h5 className="font-display text-sm font-bold text-[#1B4332] group-hover:text-[#2D6A4F] transition-colors">
                      {item.title}
                    </h5>
                    <p className="text-[11px] font-medium text-[#52796F] mt-0.5">
                      {item.organization}
                    </p>
                    <p className="text-xs text-[#2D3748] mt-2 leading-relaxed">
                      {item.summary}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E2E8E0] flex items-center justify-between">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-[#2D6A4F] hover:underline flex items-center gap-1"
                    >
                      Visit Official Portal
                      <ArrowRight className="w-3 h-3" />
                    </a>
                    <span className="text-[10px] font-mono text-[#748C7E]">Peer-Reviewed</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Economic Impact Calculator Block */}
      <div className="bg-white rounded-xl border border-[#E2E8E0] p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-[#F0F4F0] gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#B45309] flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-[#1B4332]">
                Economic Impact & Yield Protection Calculator
              </h3>
              <p className="text-xs text-[#52796F]">
                Estimated financial risk exposure if left untreated
              </p>
            </div>
          </div>

          {/* Acreage Selector */}
          <div className="flex items-center gap-2 bg-[#F4F7F4] p-1.5 rounded-lg border border-[#E2E8E0]">
            <span className="text-xs text-[#52796F] font-medium pl-2">Farm Area:</span>
            {[1, 2, 5, 10].map((acres) => (
              <button
                key={acres}
                type="button"
                onClick={() => setAcreCount(acres)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  acreCount === acres
                    ? 'bg-[#1B4332] text-white shadow-xs'
                    : 'text-[#52796F] hover:text-[#1B4332]'
                }`}
              >
                {acres} {acres === 1 ? 'Acre' : 'Acres'}
              </button>
            ))}
          </div>
        </div>

        {/* Financial Loss Highlight Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-red-50 border border-red-200">
            <span className="text-[11px] font-mono uppercase tracking-wider text-red-700 block font-semibold">
              Potential Crop Loss If Untreated
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-display text-3xl font-extrabold text-red-900 font-mono">
                ₹{calculatedTotalLoss.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-red-700 font-medium">({acreCount} {acreCount === 1 ? 'Acre' : 'Acres'})</span>
            </div>
            <p className="text-[11px] text-red-800 mt-1">
              Based on benchmark ₹15,000 / Acre loss for Solanaceae tomato harvest
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#EBF5EE] border border-[#D8F3DC]">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#2D6A4F] block font-semibold">
              Projected Yield At Risk
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-display text-3xl font-extrabold text-[#1B4332] font-mono">
                {(acreCount * 4.2).toFixed(1)} MT
              </span>
              <span className="text-xs text-[#2D6A4F] font-medium">Metric Tons</span>
            </div>
            <p className="text-[11px] text-[#52796F] mt-1">
              Approx. 23.5% foliar drop impacting fruit sizing and weight
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAF8] border border-[#E2E8E0]">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#52796F] block font-semibold">
              Treatment Cost vs Profit Saved
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-display text-3xl font-extrabold text-[#1B4332] font-mono">
                1 : 16.5
              </span>
              <span className="text-xs text-[#2D6A4F] font-semibold">ROI Ratio</span>
            </div>
            <p className="text-[11px] text-[#52796F] mt-1">
              ₹900 spray chemical saves ~₹15,000 in marketable farm produce
            </p>
          </div>
        </div>

        {/* 3 Actionable Strategies Checklist to Maximize Profit */}
        <div>
          <h4 className="text-xs uppercase font-bold tracking-wider text-[#1B4332] mb-3">
            3 Actionable Strategies to Maximize Harvest Profit
          </h4>
          <div className="space-y-3">
            {diagnostic.economics.actionableStrategies.map((strategy) => {
              const isChecked = activeStrategies.includes(strategy.id);
              return (
                <div
                  key={strategy.id}
                  onClick={() => toggleStrategy(strategy.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                    isChecked
                      ? 'bg-[#FFFFFF] border-[#2D6A4F] shadow-xs'
                      : 'bg-[#F8FAF8] border-[#E2E8E0] opacity-75'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${
                        isChecked
                          ? 'bg-[#2D6A4F] border-[#2D6A4F] text-white'
                          : 'border-[#CBD5E0] bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-[#1B4332]">{strategy.title}</h5>
                      <p className="text-xs text-[#52796F] mt-0.5 leading-relaxed">
                        {strategy.description}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-[#2D6A4F] bg-[#EBF5EE] px-3 py-1 rounded-md shrink-0 whitespace-nowrap">
                    {strategy.potentialSavings}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Final CTA Buttons */}
        <div className="mt-8 pt-5 border-t border-[#F0F4F0] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#52796F]">
            Saved diagnostics will be logged with GPS coordinates and weather timestamps in your records.
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={pdfGenerating}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-[#1B4332] bg-[#EBF5EE] hover:bg-[#D8F3DC] border border-[#D8F3DC] rounded-lg transition-all shadow-xs flex items-center justify-center gap-2 whitespace-nowrap active:scale-95"
            >
              <Download className={`w-4 h-4 text-[#2D6A4F] ${pdfGenerating ? 'animate-bounce' : ''}`} />
              <span>{pdfGenerating ? 'Generating PDF...' : 'Download Diagnostic PDF'}</span>
            </button>

            <button
              type="button"
              onClick={onSaveToRecords}
              className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Check className="w-4 h-4" />
              Save to Health Records
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 6. Recovery Photo Upload Modal Component
function RecoveryUploadModal({
  record,
  onClose,
  onConfirmRecovery,
}: {
  record: DbScanRecord;
  onClose: () => void;
  onConfirmRecovery: (recordId: string, recoveryNotes: string) => void;
}) {
  const [selectedRecoveryCount, setSelectedRecoveryCount] = useState<number>(3);
  const [notes, setNotes] = useState<string>(
    'Foliar inspection on day 5 shows lesion desiccation. No new concentric rings observed on upper canopy leaflets.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      onConfirmRecovery(record.id, notes);
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-[#E2E8E0] max-w-lg w-full p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F0F4F0]">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-700 font-semibold">
              Recovery Audit Workflow
            </span>
            <h3 className="font-display text-lg font-bold text-[#1B4332]">
              Upload Recovery Photos
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#52796F] hover:text-[#1B4332] hover:bg-[#F4F7F4]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 mb-4 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Follow-up due for {record.disease} ({record.crop})</p>
            <p className="text-[11px] text-amber-800 mt-0.5">
              Diagnosed {record.daysAgo} days ago in {record.location}. Upload 2 to 4 canopy photos to verify if treatment halted pathogen spore progression.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1B4332] mb-1.5">
              Select Foliar Follow-up Photos ({selectedRecoveryCount} images ready)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((num) => (
                <div
                  key={num}
                  className="aspect-square rounded-lg border border-[#D8F3DC] bg-[#EBF5EE]/50 flex flex-col items-center justify-center p-2 text-center"
                >
                  <Leaf className="w-6 h-6 text-[#2D6A4F] mb-1" />
                  <span className="text-[10px] font-mono text-[#52796F]">Leaflet_{num}.jpg</span>
                  <span className="text-[9px] text-[#2D6A4F] font-semibold">Clear Margin</span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between items-center text-xs text-[#52796F]">
              <span>Simulated high-res capture loaded</span>
              <button
                type="button"
                onClick={() => setSelectedRecoveryCount((prev) => (prev === 3 ? 4 : 3))}
                className="text-[11px] text-[#2D6A4F] hover:underline font-medium"
              >
                Add another angle
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1B4332] mb-1.5">
              Field Agronomist Clinical Observation
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs p-3 rounded-lg border border-[#CBD5E0] focus:ring-2 focus:ring-[#2D6A4F] focus:border-transparent text-[#1B4332]"
              placeholder="Enter visual observations regarding necrotic spot drying, yellow halo fade, etc."
            />
          </div>

          <div className="pt-3 border-t border-[#F0F4F0] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#52796F] hover:bg-[#F4F7F4] rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-lg shadow-xs flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>Validating Foliage...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirm Recovery & Resolve
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 7. Recharts Diagnostic Confidence Trend Chart Component
function ConfidenceScoreTrendChart({ records }: { records: DbScanRecord[] }) {
  // Sort chronologically and extract the past 10 diagnoses
  const chartData = React.useMemo(() => {
    const sorted = [...records]
      .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
      .slice(-10);

    return sorted.map((rec, index) => ({
      id: rec.id,
      sequence: index + 1,
      scanLabel: `Scan #${index + 1}`,
      date: rec.date,
      shortDate: rec.date.split(',')[0],
      disease: rec.disease,
      crop: rec.crop || 'Field Crop',
      confidence: rec.confidence,
      status: rec.status,
      location: rec.location,
    }));
  }, [records]);

  const baseline = chartData[0]?.confidence || 0;
  const latest = chartData[chartData.length - 1]?.confidence || 0;
  const gain = latest - baseline;
  const avg =
    chartData.length > 0
      ? (chartData.reduce((acc, d) => acc + d.confidence, 0) / chartData.length).toFixed(1)
      : '0';
  const highest = chartData.length > 0 ? Math.max(...chartData.map((d) => d.confidence)) : 0;

  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-xl border border-[#CBD5E0] shadow-xl text-xs space-y-1.5 min-w-[210px] animate-in fade-in zoom-in-95 duration-75">
          <div className="flex items-center justify-between border-b border-[#F0F4F0] pb-1.5">
            <span className="font-mono text-[10px] text-[#52796F] font-bold">
              {data.scanLabel} · {data.date}
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#EBF5EE] text-[#1B4332]">
              {data.confidence}%
            </span>
          </div>
          <div>
            <p className="font-display font-bold text-[#1B4332] text-xs">{data.disease}</p>
            <p className="text-[11px] text-[#52796F]">{data.crop}</p>
          </div>
          <div className="pt-1 border-t border-[#F0F4F0] flex items-center justify-between text-[10px]">
            <span className="text-[#748C7E] truncate max-w-[120px]">
              {data.location.split('-')[0] || data.location}
            </span>
            <span
              className={`font-semibold ${
                data.status === 'Resolved'
                  ? 'text-emerald-700'
                  : data.status === 'Follow-up Required'
                  ? 'text-amber-700'
                  : 'text-blue-700'
              }`}
            >
              {data.status}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-[#E2E8E0] shadow-xs space-y-4">
      {/* Header and KPI cards */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EBF5EE] text-[#2D6A4F] border border-[#D8F3DC]">
              AI Diagnostics Precision Telemetry
            </span>
            <span className="text-xs text-[#52796F]">Past 10 Sequential Diagnoses</span>
          </div>
          <h3 className="font-display text-base font-bold text-[#1B4332] mt-1 flex items-center gap-2">
            <span>Confidence Score Trajectory Over Time</span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              {gain >= 0 ? `+${gain}% Calibration Gain` : `${gain}%`}
            </span>
          </h3>
          <p className="text-xs text-[#52796F] mt-0.5">
            Tracking classification certainty evolution as leaf batch resolution and multispectral validation improves.
          </p>
        </div>

        {/* KPI stat chips */}
        <div className="grid grid-cols-3 gap-2 shrink-0">
          <div className="px-3 py-2 rounded-lg bg-[#F8FAF8] border border-[#E2E8E0] text-center">
            <span className="text-[10px] text-[#52796F] block font-medium">10-Scan Avg</span>
            <span className="font-mono font-bold text-sm text-[#1B4332]">{avg}%</span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-[#EBF5EE] border border-[#D8F3DC] text-center">
            <span className="text-[10px] text-[#2D6A4F] block font-medium">Peak Score</span>
            <span className="font-mono font-bold text-sm text-[#1B4332]">{highest}%</span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-[#F8FAF8] border border-[#E2E8E0] text-center">
            <span className="text-[10px] text-[#52796F] block font-medium">Baseline</span>
            <span className="font-mono font-bold text-sm text-[#52796F]">{baseline}%</span>
          </div>
        </div>
      </div>

      {/* Recharts Line Graph */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 25, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F4F0" vertical={false} />
            <XAxis
              dataKey="shortDate"
              stroke="#748C7E"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#E2E8E0' }}
            />
            <YAxis
              domain={[70, 100]}
              stroke="#748C7E"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#E2E8E0' }}
              unit="%"
            />
            <Tooltip content={<CustomChartTooltip />} />
            <ReferenceLine
              y={85}
              stroke="#52796F"
              strokeDasharray="4 4"
              label={{
                value: 'Baseline 85%',
                position: 'right',
                fill: '#52796F',
                fontSize: 10,
              }}
            />
            <Line
              type="monotone"
              dataKey="confidence"
              stroke="#1B4332"
              strokeWidth={3}
              dot={{ fill: '#2D6A4F', stroke: '#ffffff', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 7, fill: '#1B4332', stroke: '#D8F3DC', strokeWidth: 3 }}
              name="Confidence Score"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="pt-2 border-t border-[#F0F4F0] flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-[#52796F] gap-1">
        <span>Sequential timeline from earliest plot baseline (Sep 10) to latest diagnosis (Oct 06).</span>
        <span className="font-mono font-medium text-[#1B4332]">Target Reliability Threshold: &gt;85%</span>
      </div>
    </div>
  );
}

// 8. Digital Health Records View Component
function HealthRecordsView({
  records,
  onUploadRecoveryClick,
  onViewRecordDetails,
  onStartNewScan,
  currentUser,
  onOpenAuth,
}: {
  records: DbScanRecord[];
  onUploadRecoveryClick: (record: DbScanRecord) => void;
  onViewRecordDetails: (record: DbScanRecord) => void;
  onStartNewScan: () => void;
  currentUser: User | null;
  onOpenAuth: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const filteredRecords = records.filter((rec) => {
    const matchesSearch =
      rec.disease.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.crop && rec.crop.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      filterStatus === 'All' ? true : rec.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const followUpCount = records.filter(
    (r) => r.status === 'Follow-up Required' || ((r.daysAgo ?? 0) >= 3 && (r.daysAgo ?? 0) <= 5 && r.status !== 'Resolved')
  ).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Stats Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E2E8E0] shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#52796F]">
            <span>Field Archives</span>
            <span aria-hidden="true">·</span>
            <span>Plot Surveillance Logs</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-[#1B4332]">
              {currentUser ? `Agronomist: ${currentUser.displayName || currentUser.email}` : 'Field Surveillance Workspace'}
            </span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[#1B4332] mt-0.5">
            Digital Health Records
          </h2>
          <p className="text-xs text-[#52796F] mt-0.5">
            Historical foliar pathology diagnoses and recovery verifications across monitored sectors
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#EBF5EE] text-[#1B4332] border border-[#D8F3DC] text-[11px] font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" />
            <span>{records.length} Scans Archived</span>
          </div>

          {!currentUser && (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-3.5 py-2 text-xs font-semibold text-[#1B4332] bg-[#EBF5EE] hover:bg-[#D8F3DC] border border-[#D8F3DC] rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              Sign In to Sync
            </button>
          )}
          <button
            type="button"
            onClick={onStartNewScan}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Camera className="w-4 h-4" />
            Perform New Batch Scan
          </button>
        </div>
      </div>

      {/* Recharts Confidence Score Line Graph */}
      <ConfidenceScoreTrendChart records={records} />

      {/* Follow-up Required Highlights Banner */}
      {followUpCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">
                Action Required: {followUpCount} Field {followUpCount === 1 ? 'Record is' : 'Records are'} at 3–5 Day Post-Treatment Window
              </p>
              <p className="text-[11px] text-amber-800">
                Foliage recovery photos must be uploaded to confirm pathogen arrest before disease recurs.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFilterStatus('Follow-up Required')}
            className="text-xs font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-200 px-3 py-1.5 rounded-md transition-colors shrink-0"
          >
            Filter Pending Follow-ups
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E2E8E0] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#748C7E] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by disease, crop, or district location (e.g. Pune, Blight)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-[#E2E8E0] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] text-[#1B4332]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {['All', 'Follow-up Required', 'Active Treatment', 'Resolved'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                filterStatus === status
                  ? 'bg-[#1B4332] text-white shadow-xs font-bold'
                  : 'bg-[#F4F7F4] text-[#52796F] hover:text-[#1B4332]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-[#E2E8E0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8E0] bg-[#F8FAF8] text-[11px] font-semibold text-[#52796F] uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Disease Identified</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F4F0] text-xs">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#52796F]">
                    <div className="max-w-xs mx-auto">
                      <FileText className="w-8 h-8 text-[#CBD5E0] mx-auto mb-2" />
                      <p className="font-semibold text-[#1B4332]">No matching health records</p>
                      <p className="text-[11px] mt-1">Try adjusting your search terms or filter selection.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const isFollowupDue =
                    record.status === 'Follow-up Required' ||
                    ((record.daysAgo ?? 0) >= 3 && (record.daysAgo ?? 0) <= 5 && record.status !== 'Resolved');

                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-[#F8FAF8] transition-colors group"
                    >
                      {/* Date Column */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-medium text-[#1B4332]">{record.date}</div>
                        <span className="text-[10px] text-[#748C7E]">
                          {record.daysAgo} {record.daysAgo === 1 ? 'day' : 'days'} ago
                        </span>
                      </td>

                      {/* Disease Identified Column */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#1B4332] flex items-center gap-1.5">
                          {record.disease}
                          <span className="font-mono text-[10px] text-[#2D6A4F] bg-[#EBF5EE] px-1.5 py-0.5 rounded">
                            {record.confidence}%
                          </span>
                        </div>
                        <div className="text-[11px] text-[#52796F]">
                          Host: <span className="text-[#1B4332] font-medium">{record.crop || 'Field Crop'}</span>
                        </div>
                      </td>

                      {/* Location Column */}
                      <td className="py-3.5 px-4">
                        <div className="text-[#1B4332] font-medium flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#52796F] shrink-0" />
                          <span>{record.location}</span>
                        </div>
                        <div className="text-[10px] text-[#748C7E] font-mono">
                          {record.imageCount || 12} foliage samples cataloged
                        </div>
                      </td>

                      {/* Status Column with Flashing Warning for 3 to 5 days */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isFollowupDue ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100/90 text-amber-900 border border-amber-300 animate-pulse font-bold text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping"></span>
                            <span>Follow-up Required</span>
                          </div>
                        ) : record.status === 'Active Treatment' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-medium text-[11px]">
                            <Clock className="w-3 h-3 text-blue-600" />
                            Active Treatment
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#EBF5EE] text-[#2D6A4F] border border-[#D8F3DC] font-medium text-[11px]">
                            <CheckCircle2 className="w-3 h-3 text-[#2D6A4F]" />
                            Resolved
                          </span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {isFollowupDue ? (
                            <button
                              type="button"
                              onClick={() => onUploadRecoveryClick(record)}
                              className="px-3 py-1.5 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-md transition-colors shadow-xs flex items-center gap-1.5"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              Upload Recovery Photos
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onViewRecordDetails(record)}
                              className="px-3 py-1 text-xs font-medium text-[#2D6A4F] hover:bg-[#EBF5EE] rounded-md transition-colors"
                            >
                              View Details
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="py-3 px-4 bg-[#F8FAF8] border-t border-[#E2E8E0] flex items-center justify-between text-xs text-[#52796F]">
          <span>Showing {filteredRecords.length} of {records.length} records</span>
          <span className="font-mono">{currentUser ? 'Secure Cloud Storage' : 'Sandbox Storage'}</span>
        </div>
      </div>
    </div>
  );
}

// 8. Record Details Modal
function RecordDetailModal({
  record,
  onClose,
}: {
  record: DbScanRecord;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-[#E2E8E0] max-w-lg w-full p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F0F4F0]">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#52796F] font-semibold">
              Archived Diagnostics · {record.id}
            </span>
            <h3 className="font-display text-lg font-bold text-[#1B4332]">
              {record.disease} ({record.crop || 'Field Crop'})
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#52796F] hover:text-[#1B4332] hover:bg-[#F4F7F4]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#F8FAF8] border border-[#E2E8E0]">
            <div>
              <span className="text-[11px] text-[#52796F]">Diagnosis Date:</span>
              <p className="font-bold text-[#1B4332] font-mono">{record.date}</p>
            </div>
            <div>
              <span className="text-[11px] text-[#52796F]">Confidence Score:</span>
              <p className="font-bold text-[#2D6A4F] font-mono">{record.confidence}%</p>
            </div>
            <div>
              <span className="text-[11px] text-[#52796F]">Location:</span>
              <p className="font-bold text-[#1B4332]">{record.location}</p>
            </div>
            <div>
              <span className="text-[11px] text-[#52796F]">Status:</span>
              <p className="font-bold text-[#1B4332]">{record.status}</p>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-[#1B4332] block mb-1">
              Field Agronomist Audit Notes:
            </span>
            <div className="p-3 rounded-lg bg-[#F4F7F4] border border-[#E2E8E0] text-[#2D3748] leading-relaxed">
              {record.notes || 'Routine foliar inspection successfully documented.'}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#EBF5EE] border border-[#D8F3DC] flex items-center justify-between">
            <span className="text-[#2D6A4F] font-medium">Estimated Crop Loss Mitigated</span>
            <span className="font-mono font-bold text-[#1B4332]">{record.lossMitigated || '₹15,000 / Acre'}</span>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-[#F0F4F0] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-lg"
          >
            Close Record
          </button>
        </div>
      </div>
    </div>
  );
}

// 9. Floating 48-Hour Pathogen Risk Forecast Alert Banner
interface PathogenRiskForecast {
  location: string;
  riskLevel: 'Critical' | 'High' | 'Moderate' | 'Low';
  overallRiskPercentage: number;
  primaryPathogens: string[];
  weatherDriver: string;
  preventativeAction: string;
  timeline: {
    period: string;
    label: string;
    temp: string;
    humidity: string;
    condition: string;
    riskStatus: 'Critical' | 'High' | 'Elevated' | 'Moderate';
    biologicalImpact: string;
  }[];
}

const PATHOGEN_FORECAST_48H: PathogenRiskForecast = {
  location: 'Pune District (Haveli & Khed Ag-Cluster)',
  riskLevel: 'High',
  overallRiskPercentage: 88,
  primaryPathogens: ['Alternaria solani (Early Blight)', 'Colletotrichum coccodes (Anthracnose)'],
  weatherDriver: 'Persistent 75%–86% Relative Humidity with >12 hrs continuous leaf wetness',
  preventativeAction: 'Apply protective contact fungicide before tonight (6:00 PM) and suspend evening overhead irrigation.',
  timeline: [
    {
      period: '0h – 12h',
      label: 'Tonight (6 PM – 6 AM)',
      temp: '24°C',
      humidity: '84%',
      condition: 'Heavy Dew / Overcast',
      riskStatus: 'Critical',
      biologicalImpact: 'Optimal hydration for conidial germination on lower canopy foliage.',
    },
    {
      period: '12h – 24h',
      label: 'Tomorrow AM (6 AM – 12 PM)',
      temp: '27°C',
      humidity: '78%',
      condition: 'Dense Fog / 85% Cloud Cover',
      riskStatus: 'High',
      biologicalImpact: 'Germ tube elongation and initial stomatal cuticle penetration.',
    },
    {
      period: '24h – 36h',
      label: 'Tomorrow Night (6 PM – 6 AM)',
      temp: '23°C',
      humidity: '86%',
      condition: 'Canopy Condensation Window',
      riskStatus: 'Critical',
      biologicalImpact: 'Secondary spore emergence; risk of rapid horizontal plot spreading.',
    },
    {
      period: '36h – 48h',
      label: 'Day 2 (12 PM – 6 PM)',
      temp: '29°C',
      humidity: '68%',
      condition: 'Partial Sun / Wind 12 km/h',
      riskStatus: 'Elevated',
      biologicalImpact: 'Conidiophore desiccation triggers airborne conidia dispersion.',
    },
  ],
};

function PathogenRiskAlertBanner({
  weather,
}: {
  weather: WeatherData;
}) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const forecast = PATHOGEN_FORECAST_48H;

  if (isDismissed) {
    return (
      <div className="flex items-center justify-between p-2.5 px-4 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 shadow-xs mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
          <span className="font-semibold">
            48-Hour Pathogen Risk Alert ({forecast.location}): High Spore Risk ({forecast.overallRiskPercentage}%)
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsDismissed(false)}
          className="text-xs font-bold text-amber-800 hover:text-amber-950 underline px-2 py-0.5"
        >
          Restore Alert
        </button>
      </div>
    );
  }

  return (
    <div className="sticky top-16 z-20 rounded-xl border-2 border-amber-300 bg-amber-50/95 backdrop-blur-md p-4 shadow-md transition-all text-xs text-amber-950 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Icon & Headline */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                48-Hour Pathogen Forecast
              </span>
              <span className="font-mono text-[10px] font-semibold text-amber-800">
                {weather.location} ({weather.temperature} · {weather.humidity} RH)
              </span>
            </div>
            <h4 className="font-display font-extrabold text-sm sm:text-base text-amber-950 mt-0.5 flex items-center gap-1.5">
              <span>Elevated Spore Inoculation Risk Window</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 font-bold">
                {forecast.overallRiskPercentage}% Risk Index
              </span>
            </h4>
            <p className="text-[11px] text-amber-800 mt-0.5">
              Current overcast canopy conditions and 75% humidity favor rapid germination of <strong className="text-amber-950">Alternaria solani</strong> conidia over the next 48 hours.
            </p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 rounded-lg bg-amber-200/80 hover:bg-amber-200 text-amber-900 font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Hide Hourly Trajectory</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>View 48h Trajectory</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-lg text-amber-700 hover:text-amber-950 hover:bg-amber-200/50"
            aria-label="Dismiss alert banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable 48-Hour Microclimate Trajectory Grid */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-amber-200/80 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-[11px] font-semibold text-amber-900">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              Projected 48-Hour Pathogen Lifecycle & Weather Correlation
            </span>
            <span className="font-mono text-[10px] text-amber-800">Meteorological Model: WRF-Agri 3km</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {forecast.timeline.map((item, idx) => (
              <div
                key={idx}
                className="bg-white/90 rounded-lg border border-amber-200 p-3 flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                      {item.period}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        item.riskStatus === 'Critical'
                          ? 'bg-red-100 text-red-800'
                          : item.riskStatus === 'High'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {item.riskStatus} Risk
                    </span>
                  </div>
                  <h5 className="font-display font-bold text-xs text-[#1B4332]">{item.label}</h5>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-[#52796F] mt-1">
                    <span>{item.temp}</span>
                    <span>·</span>
                    <span className="font-bold text-amber-900">{item.humidity} RH</span>
                  </div>
                  <p className="text-[10px] text-[#52796F] mt-0.5">{item.condition}</p>
                </div>
                <div className="mt-2 pt-2 border-t border-amber-100 text-[10px] text-amber-900 leading-snug">
                  <strong>Biological Vector:</strong> {item.biologicalImpact}
                </div>
              </div>
            ))}
          </div>

          {/* Actionable Preventative Spray Window Guidance */}
          <div className="p-3 rounded-lg bg-emerald-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-emerald-300 shrink-0" />
              <div>
                <p className="font-bold text-xs">Immediate Agronomist Preventative Advisory (Next 8 Hours):</p>
                <p className="text-[11px] text-emerald-200 leading-relaxed">
                  {forecast.preventativeAction}
                </p>
              </div>
            </div>
            <span className="font-mono text-[10px] font-bold bg-emerald-800 text-emerald-200 px-2.5 py-1 rounded shrink-0 whitespace-nowrap">
              Spray Window: Open Now
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// End of UI Subcomponents

// --- Main App Component ---

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'reset'>('login');

  const [activeTab, setActiveTab] = useState<'new-scan' | 'health-records'>('new-scan');
  const [scanState, setScanState] = useState<'upload' | 'processing' | 'results'>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileItem[]>([]);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [records, setRecords] = useState<DbScanRecord[]>(DEFAULT_INITIAL_RECORDS);
  const [weatherData] = useState<WeatherData>(INITIAL_WEATHER);
  const [activeModalRecord, setActiveModalRecord] = useState<DbScanRecord | null>(null);
  const [activeDetailRecord, setActiveDetailRecord] = useState<DbScanRecord | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch initial records from the backend database server
  useEffect(() => {
    fetchBackendRecords().then((backendRecs) => {
      if (backendRecs && backendRecs.length > 0) {
        setRecords(backendRecs);
      }
    });
  }, []);

  // Listen to Firebase Auth state for user profile and cloud synchronization
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userRecs = await fetchUserRecordsFromDb(user.uid);
          if (userRecs.length === 0) {
            // Seed initial records for this user in their cloud isolation
            for (const r of DEFAULT_INITIAL_RECORDS) {
              await saveScanRecordToDb(user.uid, { ...r, userId: user.uid });
            }
            setRecords(DEFAULT_INITIAL_RECORDS.map((r) => ({ ...r, userId: user.uid })));
          } else {
            setRecords(userRecs);
          }
        } catch (err) {
          console.warn('Backend database active, cloud sync note:', err);
        }
      } else {
        // Fallback to backend database records
        fetchBackendRecords().then((bRecs) => {
          if (bRecs && bRecs.length > 0) {
            setRecords(bRecs);
          } else {
            setRecords(DEFAULT_INITIAL_RECORDS);
          }
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Validation rules: strictly 10 to 15 images
  const imageCount = uploadedFiles.length;
  const isCountValid = imageCount >= 10 && imageCount <= 15;
  const hasUploadedAny = imageCount > 0;
  const countError =
    hasUploadedAny && !isCountValid
      ? imageCount < 10
        ? `Strict Batch Requirement: You must upload between 10 and 15 images. Currently selected: ${imageCount} (Need at least ${10 - imageCount} more images).`
        : `Strict Batch Requirement: You must upload between 10 and 15 images. Currently selected: ${imageCount} (${imageCount - 15} image(s) over limit).`
      : null;

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFiles(e.target.files);
    }
  };

  const processSelectedFiles = (fileList: FileList) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const newItems: UploadedFileItem[] = [];

    Array.from(fileList).forEach((file, index) => {
      if (validTypes.includes(file.type) || file.name.match(/\.(jpg|jpeg|png)$/i)) {
        newItems.push({
          id: `upload-${Date.now()}-${index}`,
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          leafType: 'Field Leaf Macro Specimen',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      }
    });

    setUploadedFiles((prev) => [...prev, ...newItems]);
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const loadSampleBatch = () => {
    setUploadedFiles([...SAMPLE_LEAF_IMAGES]);
  };

  const clearAllFiles = () => {
    setUploadedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startAnalysis = () => {
    if (!isCountValid) return;
    setScanState('processing');
  };

  const handleProcessingComplete = () => {
    setScanState('results');
  };

  const handleSaveToRecords = async () => {
    const newRecord: DbScanRecord = {
      id: `REC-${Date.now().toString().slice(-4)}`,
      userId: currentUser ? currentUser.uid : 'default',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      daysAgo: 0,
      disease: MOCK_DIAGNOSTIC_RESULT.diseaseName,
      pathogen: MOCK_DIAGNOSTIC_RESULT.pathogenScientificName,
      crop: 'Tomato (Foliar Batch)',
      location: weatherData.location,
      status: 'Active Treatment',
      confidence: MOCK_DIAGNOSTIC_RESULT.confidence,
      imageCount: uploadedFiles.length || 12,
      lossMitigated: '₹15,000 / Acre',
      notes: 'Initial AI diagnosis complete. Treatment protocol with Mancozeb recommended.',
      createdAt: new Date().toISOString(),
    };

    // 1. Save directly to backend database server
    await saveRecordToBackend(newRecord);

    // 2. If user is authenticated, also sync to user cloud storage
    if (currentUser) {
      try {
        await saveScanRecordToDb(currentUser.uid, newRecord);
      } catch (err) {
        console.warn('Cloud sync note:', err);
      }
    }

    setRecords((prev) => [newRecord, ...prev]);
    setScanState('upload');
    setUploadedFiles([]);
    setActiveTab('health-records');
  };

  const handleConfirmRecovery = async (recordId: string, recoveryNotes: string) => {
    // 1. Submit recovery to backend database server
    await submitRecoveryToBackend(recordId, recoveryNotes);

    // 2. If user is authenticated, also update user cloud storage
    if (currentUser) {
      try {
        await updateScanRecordInDb(currentUser.uid, recordId, {
          status: 'Resolved',
          notes: recoveryNotes,
        });
      } catch (err) {
        console.warn('Cloud update note:', err);
      }
    }

    setRecords((prev) =>
      prev.map((rec) =>
        rec.id === recordId
          ? {
              ...rec,
              status: 'Resolved',
              notes: recoveryNotes,
            }
          : rec
      )
    );
  };

  const handleLogout = async () => {
    await logoutUser();
  };

  const followUpRequiredCount = records.filter(
    (r) => r.status === 'Follow-up Required' || ((r.daysAgo ?? 0) >= 3 && (r.daysAgo ?? 0) <= 5 && r.status !== 'Resolved')
  ).length;

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#1E2922] flex flex-col font-sans">
      {/* 1. Global Header with Auth Support */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
        }}
        recordsNeedingFollowupCount={followUpRequiredCount}
        currentUser={currentUser}
        onOpenAuth={(mode) => {
          setAuthModalMode(mode);
          setAuthModalOpen(true);
        }}
        onLogout={handleLogout}
      />

      {/* Main Content Layout with Sidebar for Desktop */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Navigation (Desktop) */}
          <aside className="hidden lg:block lg:col-span-3 space-y-6">
            <div className="bg-white rounded-xl border border-[#E2E8E0] p-4 shadow-xs">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#52796F] font-semibold px-2 mb-2 block">
                Primary Workspace
              </span>
              <nav className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('new-scan');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === 'new-scan'
                      ? 'bg-[#EBF5EE] text-[#1B4332] font-bold border border-[#D8F3DC]'
                      : 'text-[#52796F] hover:bg-[#F4F7F4] hover:text-[#1B4332]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Camera className="w-4 h-4 text-[#2D6A4F]" />
                    <span>New Scan</span>
                  </div>
                  {scanState === 'processing' && (
                    <span className="w-2 h-2 rounded-full bg-[#2D6A4F] animate-ping"></span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('health-records');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === 'health-records'
                      ? 'bg-[#EBF5EE] text-[#1B4332] font-bold border border-[#D8F3DC]'
                      : 'text-[#52796F] hover:bg-[#F4F7F4] hover:text-[#1B4332]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-[#2D6A4F]" />
                    <span>Health Records</span>
                  </div>
                  {followUpRequiredCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-mono font-bold">
                      {followUpRequiredCount}
                    </span>
                  )}
                </button>
              </nav>

              {/* Agronomist Account Profile & Session in Sidebar */}
              <div className="mt-6 pt-5 border-t border-[#F0F4F0] space-y-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#52796F] font-semibold px-2 block">
                  Agronomist Session
                </span>

                {currentUser ? (
                  <div className="p-3 rounded-xl bg-[#F8FAF8] border border-[#E2E8E0] space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-display font-bold text-xs shadow-xs">
                        {(currentUser.displayName || currentUser.email || 'AD').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-display font-bold text-xs text-[#1B4332] truncate">
                          {currentUser.displayName || 'Field Agronomist'}
                        </p>
                        <p className="text-[10px] text-[#52796F] font-mono truncate">
                          {currentUser.email}
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-[#E2E8E0] flex items-center justify-between text-[11px]">
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Online & Verified
                      </span>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="text-red-600 hover:text-red-800 font-semibold text-[11px] flex items-center gap-1"
                      >
                        <LogOut className="w-3 h-3" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-[#F8FAF8] border border-[#E2E8E0] space-y-2.5">
                    <p className="text-[11px] text-[#52796F] leading-snug">
                      Sign in to associate foliar pathology scans and track long-term crop recovery.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthModalMode('login');
                        setAuthModalOpen(true);
                      }}
                      className="w-full py-2 text-xs font-bold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      Sign In / Register
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Field Best Practice Card */}
            <div className="bg-[#EBF5EE]/50 rounded-xl border border-[#D8F3DC] p-4 text-xs">
              <div className="flex items-center gap-2 text-[#2D6A4F] font-bold mb-1">
                <Leaf className="w-4 h-4" />
                <span>Field Pathology Tip</span>
              </div>
              <p className="text-[#52796F] leading-relaxed text-[11px]">
                Always collect foliar samples representing top, mid-canopy, and shaded bottom foliage. Uniform multi-angle batches ensure 90%+ diagnostic confidence.
              </p>
            </div>
          </aside>

          {/* Main Viewport Content (9 cols on desktop) */}
          <main className="col-span-1 lg:col-span-9">
            {activeTab === 'new-scan' ? (
              <div>
                {/* 1. Simulated Processing State */}
                {scanState === 'processing' && (
                  <ProcessingScreen onComplete={handleProcessingComplete} />
                )}

                {/* 2. Diagnostic Results State */}
                {scanState === 'results' && (
                  <DiagnosticResultsView
                    diagnostic={MOCK_DIAGNOSTIC_RESULT}
                    weather={weatherData}
                    onSaveToRecords={handleSaveToRecords}
                    currentUser={currentUser}
                  />
                )}

                {/* 3. Upload State (Batch Upload & Weather) */}
                {scanState === 'upload' && (
                  <div className="space-y-6">
                    {/* Floating 48-Hour Localized Pathogen Risk Forecast Alert Banner */}
                    <PathogenRiskAlertBanner weather={weatherData} />

                    {/* View Intro Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E2E8E0] shadow-xs">
                      <div>
                        <h2 className="font-display text-xl font-bold text-[#1B4332]">
                          Foliar Batch Upload & Weather Synthesis
                        </h2>
                        <p className="text-xs text-[#52796F] mt-0.5">
                          Upload 10 to 15 high-resolution leaf captures to initiate neural pathogen classification
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={loadSampleBatch}
                          className="px-3.5 py-2 text-xs font-bold text-[#1B4332] bg-[#EBF5EE] hover:bg-[#D8F3DC] border border-[#D8F3DC] rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-xs"
                        >
                          <Zap className="w-3.5 h-3.5 text-[#2D6A4F]" />
                          Load Field Sample Batch (12 Images)
                        </button>
                      </div>
                    </div>

                    {/* Dual Column: Upload Zone (left) + Weather Context Card (right) */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      {/* Left: Drag and Drop Upload Zone (7 cols) */}
                      <div className="md:col-span-7 flex flex-col justify-between bg-white rounded-xl border border-[#E2E8E0] p-5 shadow-xs">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs uppercase font-bold tracking-wider text-[#1B4332]">
                              Batch Leaf Upload Zone
                            </span>
                            <span
                              className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                                isCountValid
                                  ? 'bg-[#EBF5EE] text-[#2D6A4F] border border-[#D8F3DC]'
                                  : hasUploadedAny
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-[#F4F7F4] text-[#52796F] border border-[#E2E8E0]'
                              }`}
                            >
                              {imageCount} / 10–15 Images
                            </span>
                          </div>

                          {/* Hidden File Input */}
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,image/jpg"
                            onChange={handleFileInputChange}
                            className="hidden"
                            id="batch-file-input"
                          />

                          {/* Drop Area */}
                          <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                              dragActive
                                ? 'border-[#2D6A4F] bg-[#EBF5EE]/80'
                                : 'border-[#CBD5E0] hover:border-[#2D6A4F] bg-[#F8FAF8]'
                            }`}
                          >
                            <div className="w-12 h-12 rounded-xl bg-white border border-[#E2E8E0] text-[#2D6A4F] mx-auto mb-3 flex items-center justify-center shadow-xs">
                              <UploadCloud className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-bold text-[#1B4332]">
                              Drag & Drop 10 to 15 Leaf Photos
                            </p>
                            <p className="text-xs text-[#52796F] mt-1">
                              Supports JPG & PNG · High-contrast foliar images
                            </p>
                            <button
                              type="button"
                              className="mt-3 px-3.5 py-1.5 text-xs font-semibold text-[#2D6A4F] bg-white border border-[#D8F3DC] rounded-lg shadow-xs hover:bg-[#EBF5EE]"
                            >
                              Browse Local Files
                            </button>
                          </div>

                          {/* Strict Validation Error Message (Shown in Red if outside 10-15 range) */}
                          {countError && (
                            <div className="mt-4 p-3 rounded-xl bg-red-50 border-2 border-red-400 text-red-900 text-xs flex items-start gap-2.5">
                              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-bold text-red-800">Validation Error</p>
                                <p className="text-[11px] leading-relaxed mt-0.5">{countError}</p>
                              </div>
                            </div>
                          )}

                          {/* Success State Validation Message */}
                          {isCountValid && (
                            <div className="mt-4 p-3 rounded-xl bg-[#EBF5EE] border border-[#D8F3DC] text-[#1B4332] text-xs flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-[#2D6A4F]" />
                                <span className="font-semibold">
                                  Valid Batch Count ({imageCount} images selected). Ready for inference.
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={clearAllFiles}
                                className="text-[11px] text-[#52796F] hover:text-red-700 underline"
                              >
                                Clear all
                              </button>
                            </div>
                          )}

                          {/* Thumbnail / List Preview of Selected Files */}
                          {uploadedFiles.length > 0 && (
                            <div className="mt-4">
                              <div className="flex justify-between items-center text-xs text-[#52796F] mb-2">
                                <span>Queued Foliar Captures ({uploadedFiles.length})</span>
                                <span className="text-[11px]">Click ✕ to remove</span>
                              </div>
                              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                                {uploadedFiles.map((file, idx) => (
                                  <div
                                    key={file.id}
                                    className="flex items-center justify-between p-2 rounded-lg bg-[#F8FAF8] border border-[#E2E8E0] text-xs group"
                                  >
                                    <div className="flex items-center gap-2.5 truncate">
                                      <span className="w-5 h-5 rounded bg-[#EBF5EE] text-[#2D6A4F] font-mono text-[10px] flex items-center justify-center font-bold shrink-0">
                                        {idx + 1}
                                      </span>
                                      <div className="truncate">
                                        <p className="font-mono text-xs font-medium text-[#1B4332] truncate">
                                          {file.name}
                                        </p>
                                        <p className="text-[10px] text-[#748C7E]">
                                          {file.size} · {file.leafType}
                                        </p>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeFile(file.id)}
                                      className="p-1 rounded text-[#748C7E] hover:text-red-600 hover:bg-white"
                                      aria-label={`Remove ${file.name}`}
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Button: Prominent "Start AI Analysis" appearing ONLY when valid images are present */}
                        <div className="mt-6 pt-4 border-t border-[#F0F4F0]">
                          {isCountValid ? (
                            <button
                              type="button"
                              onClick={startAnalysis}
                              className="w-full py-3.5 px-6 rounded-xl bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-display font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
                            >
                              <span>Start AI Analysis ({imageCount} Leaves)</span>
                              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                          ) : (
                            <div className="p-3 text-center rounded-xl bg-[#F4F7F4] border border-[#E2E8E0] text-xs text-[#52796F]">
                              <span>Upload exactly 10 to 15 images to enable analysis</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Weather Context Card (5 cols) */}
                      <div className="md:col-span-5">
                        <WeatherContextCard weather={weatherData} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Health Records View */
              <HealthRecordsView
                records={records}
                onUploadRecoveryClick={(rec) => setActiveModalRecord(rec)}
                onViewRecordDetails={(rec) => setActiveDetailRecord(rec)}
                onStartNewScan={() => {
                  setScanState('upload');
                  setActiveTab('new-scan');
                }}
                currentUser={currentUser}
                onOpenAuth={() => {
                  setAuthModalMode('login');
                  setAuthModalOpen(true);
                }}
              />
            )}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden sticky bottom-0 z-30 bg-white border-t border-[#E2E8E0] px-4 py-2 flex items-center justify-around shadow-lg">
        <button
          type="button"
          onClick={() => setActiveTab('new-scan')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-lg text-xs font-semibold ${
            activeTab === 'new-scan'
              ? 'text-[#1B4332]'
              : 'text-[#52796F]'
          }`}
        >
          <Camera className="w-5 h-5 text-[#2D6A4F]" />
          <span>New Scan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('health-records')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-lg text-xs font-semibold relative ${
            activeTab === 'health-records'
              ? 'text-[#1B4332]'
              : 'text-[#52796F]'
          }`}
        >
          <div className="relative">
            <FileText className="w-5 h-5 text-[#2D6A4F]" />
            {followUpRequiredCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white"></span>
            )}
          </div>
          <span>Health Records</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (currentUser) {
              handleLogout();
            } else {
              setAuthModalMode('login');
              setAuthModalOpen(true);
            }
          }}
          className="flex flex-col items-center gap-1 py-1 px-4 rounded-lg text-xs font-semibold text-[#52796F]"
        >
          {currentUser ? <LogOut className="w-5 h-5 text-red-600" /> : <Lock className="w-5 h-5 text-[#2D6A4F]" />}
          <span>{currentUser ? 'Logout' : 'Sign In'}</span>
        </button>
      </div>

      {/* Auth Modal (Signup, Login, Password Reset, Google Auth) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        currentUser={currentUser}
      />

      {/* Recovery Audit Modal */}
      {activeModalRecord && (
        <RecoveryUploadModal
          record={activeModalRecord}
          onClose={() => setActiveModalRecord(null)}
          onConfirmRecovery={handleConfirmRecovery}
        />
      )}

      {/* Record Archive Detail Modal */}
      {activeDetailRecord && (
        <RecordDetailModal
          record={activeDetailRecord}
          onClose={() => setActiveDetailRecord(null)}
        />
      )}
    </div>
  );
}
