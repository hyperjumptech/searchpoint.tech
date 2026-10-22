export interface DemoFileTag {
  label: string;
  bg?: string;
  color?: string;
}

export interface DemoFileRecommendation {
  name: string;
}

export interface DemoFileMeta {
  size: string;
  type: string;
  pages: number;
  author: string;
  created: string;
}

export interface DemoSearchResult {
  id: string;
  title: string;
  path: string;
  source: string;
  fileType: string;
  size: string;
  date: string;
  tags?: DemoFileTag[];
  meta: DemoFileMeta;
  recommendations: DemoFileRecommendation[];
  recommendationRule: string;
  recommendationNote: string;
}

export interface DemoSidebarSource {
  id: string;
  label: string;
  iconType: "grid" | "dot";
  dotColor?: string; // CSS color string or dynamic "tenant"
}

export interface DemoSidebarType {
  id: string;
  label: string;
  iconType: "doc" | "pdf" | "word" | "sheet" | "ppt";
}

export interface DemoSidebarTag {
  id: string;
  label: string;
  count: number;
  dotColor: string;
}

export const DEMO_SOURCES: DemoSidebarSource[] = [
  { id: "all", label: "All sources", iconType: "grid" },
  { id: "on_device", label: "On Device", iconType: "dot", dotColor: "tenant" },
  { id: "onedrive", label: "OneDrive", iconType: "dot", dotColor: "#2563eb" },
  {
    id: "sharepoint",
    label: "SharePoint",
    iconType: "dot",
    dotColor: "#059669",
  },
];

export const DEMO_TYPES: DemoSidebarType[] = [
  { id: "doc", label: "Document", iconType: "doc" },
  { id: "pdf", label: "PDF", iconType: "pdf" },
  { id: "word", label: "Word", iconType: "word" },
  { id: "sheet", label: "Spreadsheets", iconType: "sheet" },
  { id: "ppt", label: "PPT", iconType: "ppt" },
];

export const DEMO_TAGS: DemoSidebarTag[] = [
  { id: "confidential", label: "Confidential", count: 4, dotColor: "#ef4444" },
  { id: "q3_review", label: "Q3-Review", count: 2, dotColor: "#ec4899" },
];

export const DEMO_DEFAULT_QUERY = "source:on_device kind:document type:pdf";

export const DEMO_TYPING_QUERIES = [
  "source:on_device kind:document type:pdf",
  "Financial Performance Q3 2026",
  "Zero Trust Security Architecture",
  "Annual Sustainability ESG Audit",
];

export const DEMO_SEARCH_RESULTS: DemoSearchResult[] = [
  {
    id: "item-1",
    title: "Q3_2026_Global_Financial_Performance_Report.pdf",
    path: "Corporate / Finance / Quarterly Reports",
    source: "On Device",
    fileType: "PDF",
    size: "14.2 MB",
    date: "Mon, 12 Oct",
    tags: [
      {
        label: "Confidential",
        bg: "rgba(239, 68, 68, 0.15)",
        color: "#ef4444",
      },
    ],
    meta: {
      size: "14.2 MB",
      type: "pdf",
      pages: 58,
      author: "finance.analytics@acme.corp",
      created: "Mon, 12 Oct 2026",
    },
    recommendations: [
      {
        name: "Report - Finance - 2026 - Q3 Global Financial Performance.pdf",
      },
      { name: "Report - Finance - Q3 Performance Summary 2026.pdf" },
    ],
    recommendationRule: "Rule: Category / Fiscal Quarter First",
    recommendationNote:
      "The on-device model reads document contents and automatically suggests standard, clutter-free naming conventions.",
  },
  {
    id: "item-2",
    title: "Enterprise_Zero_Trust_Security_Architecture.pdf",
    path: "Engineering / Security / Whitepapers",
    source: "On Device",
    fileType: "PDF",
    size: "6.8 MB",
    date: "Thu, 08 Oct",
    meta: {
      size: "6.8 MB",
      type: "pdf",
      pages: 42,
      author: "security.arch@acme.corp",
      created: "Thu, 08 Oct 2026",
    },
    recommendations: [
      { name: "Architecture - Security - 2026 - Zero Trust Architecture.pdf" },
      { name: "Architecture - Security - Identity Perimeter Blueprint.pdf" },
    ],
    recommendationRule: "Rule: System Domain & Classification",
    recommendationNote:
      "Auto-detects security framework references (NIST 800-207) and applies enterprise infrastructure naming schemas.",
  },
  {
    id: "item-3",
    title: "Annual_Sustainability_ESG_Compliance_Audit_2025.pdf",
    path: "Legal / Compliance / Annual Audits",
    source: "On Device",
    fileType: "PDF",
    size: "52.4 MB",
    date: "Tue, 29 Sep",
    meta: {
      size: "52.4 MB",
      type: "pdf",
      pages: 116,
      author: "compliance.audit@acme.corp",
      created: "Tue, 29 Sep 2026",
    },
    recommendations: [
      {
        name: "Audit - Compliance - 2025 - Annual Sustainability ESG Report.pdf",
      },
      { name: "Audit - Compliance - ESG Verification Summary 2025.pdf" },
    ],
    recommendationRule: "Rule: Regulatory Compliance Taxonomy",
    recommendationNote:
      "Preserves ISO 14001 validation seals while standardizing multi-regional auditor filing codes.",
  },
  {
    id: "item-4",
    title: "Product_Strategy_AI_Knowledge_Engine_2027.pdf",
    path: "Product / Strategy / Decks",
    source: "On Device",
    fileType: "PDF",
    size: "3.2 MB",
    date: "Fri, 18 Sep",
    tags: [
      { label: "Q3-Review", bg: "rgba(236, 72, 153, 0.15)", color: "#ec4899" },
    ],
    meta: {
      size: "3.2 MB",
      type: "pdf",
      pages: 26,
      author: "product.strategy@acme.corp",
      created: "Fri, 18 Sep 2026",
    },
    recommendations: [
      {
        name: "Presentation - Strategy - 2027 - AI Knowledge Engine Roadmap.pdf",
      },
      { name: "Presentation - Strategy - Product Architecture Overview.pdf" },
    ],
    recommendationRule: "Rule: Strategic Asset Taxonomy",
    recommendationNote:
      "Identifies pitch deck structures, executive keynotes, and milestone roadmaps for unified indexing.",
  },
  {
    id: "item-5",
    title: "Client_Master_Services_Agreement_Template.docx",
    path: "OneDrive / Legal / Contracts 2026",
    source: "OneDrive",
    fileType: "Word",
    size: "1.4 MB",
    date: "Wed, 16 Sep",
    meta: {
      size: "1.4 MB",
      type: "docx",
      pages: 18,
      author: "legal.contracts@acme.corp",
      created: "Wed, 16 Sep 2026",
    },
    recommendations: [
      {
        name: "Legal - Contracts - Master Services Agreement Template 2026.docx",
      },
      { name: "Legal - Agreement - MSA Standard Terms.docx" },
    ],
    recommendationRule: "Rule: Legal Document Taxonomy",
    recommendationNote:
      "Categorizes indemnification clauses and liability schedules automatically.",
  },
  {
    id: "item-6",
    title: "Q4_Operating_Budget_Forecast_Model.xlsx",
    path: "SharePoint / Corporate Planning / Budgets",
    source: "SharePoint",
    fileType: "Spreadsheets",
    size: "4.8 MB",
    date: "Mon, 14 Sep",
    tags: [
      {
        label: "Confidential",
        bg: "rgba(239, 68, 68, 0.15)",
        color: "#ef4444",
      },
    ],
    meta: {
      size: "4.8 MB",
      type: "xlsx",
      pages: 12,
      author: "fpna.lead@acme.corp",
      created: "Mon, 14 Sep 2026",
    },
    recommendations: [
      { name: "Finance - Planning - 2026 - Q4 Operating Budget Model.xlsx" },
      { name: "Finance - Forecast - Operating Model 2026 Q4.xlsx" },
    ],
    recommendationRule: "Rule: Financial Modeling Taxonomy",
    recommendationNote:
      "Indexes sheet headers, EBITDA formulas, and sensitivity matrices.",
  },
  {
    id: "item-7",
    title: "Executive_Townhall_Keynote_Deck.pptx",
    path: "SharePoint / Internal Comms / All Hands",
    source: "SharePoint",
    fileType: "PPT",
    size: "22.1 MB",
    date: "Fri, 11 Sep",
    tags: [
      { label: "Q3-Review", bg: "rgba(236, 72, 153, 0.15)", color: "#ec4899" },
    ],
    meta: {
      size: "22.1 MB",
      type: "pptx",
      pages: 35,
      author: "executive.office@acme.corp",
      created: "Fri, 11 Sep 2026",
    },
    recommendations: [
      { name: "Deck - AllHands - 2026 - Executive Townhall Keynote.pptx" },
      { name: "Deck - Executive - Q3 Strategic Direction.pptx" },
    ],
    recommendationRule: "Rule: Presentation Slide Structure",
    recommendationNote:
      "Extracts slide titles and bullet points into unified search index.",
  },
];
