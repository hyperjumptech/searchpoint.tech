export type ConnectorCategory = "ms" | "device" | "messaging" | "workspace";

export interface ConnectorSpec {
  label: { en: string; id: string };
  value: { en: string; id: string };
}

export interface ConnectorNode {
  key: string;
  name: string;
  cat: ConnectorCategory;
  ring: "inner" | "outer";
  angle: number; // degrees
  accent: string;
  icon: string;
  delayMs: number;
  status?: "ready" | "soon";
  plane: { en: string; id: string };
  desc: { en: string; id: string };
  specs: ConnectorSpec[];
}

export interface ConnectorFilter {
  id: "all" | ConnectorCategory;
  labelKey: string;
  dotColor?: string;
}

export const CONNECTOR_FILTERS: ConnectorFilter[] = [
  { id: "all", labelKey: "connectors.all" },
  { id: "ms", labelKey: "connectors.ms365", dotColor: "#38bdf8" },
  { id: "device", labelKey: "connectors.device", dotColor: "#22d3ee" },
  { id: "messaging", labelKey: "connectors.messaging", dotColor: "#4ade80" },
  { id: "workspace", labelKey: "connectors.workspace", dotColor: "#f87171" },
];

export const CONNECTOR_NODES: ConnectorNode[] = [
  // Inner ring
  {
    key: "onedrive",
    name: "OneDrive",
    cat: "ms",
    ring: "inner",
    angle: -90,
    accent: "#0364b8",
    icon: "/icons/brands/onedrive.svg",
    delayMs: 0,
    status: "ready",
    plane: { en: "Document source", id: "Sumber dokumen" },
    desc: {
      en: "Personal and shared OneDrive files, parsed through Microsoft Graph without ever copying raw binaries.",
      id: "Berkas OneDrive pribadi dan bersama, diproses melalui Microsoft Graph tanpa pernah menyalin biner mentah.",
    },
    specs: [
      {
        label: { en: "Auth", id: "Autentikasi" },
        value: {
          en: "OAuth 2.0 · delegated or app-only",
          id: "OAuth 2.0 · delegated atau app-only",
        },
      },
      {
        label: { en: "ACL", id: "ACL" },
        value: { en: "Native OneDrive permissions", id: "Izin OneDrive asli" },
      },
      {
        label: { en: "Mode", id: "Mode" },
        value: { en: "Incremental delta crawl", id: "Crawl delta inkremental" },
      },
    ],
  },
  {
    key: "outlook",
    name: "Outlook",
    cat: "ms",
    ring: "inner",
    angle: -18,
    accent: "#0f6cbd",
    icon: "/icons/brands/outlook.svg",
    delayMs: 300,
    status: "ready",
    plane: { en: "Mail & attachments", id: "Surel & lampiran" },
    desc: {
      en: "Mailbox metadata and attachment text, scoped to the signed-in user or the whole tenant.",
      id: "Metadata kotak surat dan teks lampiran, dibatasi untuk pengguna yang masuk atau seluruh tenant.",
    },
    specs: [
      {
        label: { en: "Auth", id: "Autentikasi" },
        value: {
          en: "Graph app-only or delegated",
          id: "Graph app-only atau delegated",
        },
      },
      {
        label: { en: "ACL", id: "ACL" },
        value: {
          en: "Mailbox + folder permissions",
          id: "Izin kotak surat + folder",
        },
      },
      {
        label: { en: "Mode", id: "Mode" },
        value: {
          en: "Metadata-first, ephemeral parse",
          id: "Metadata dulu, parse sementara",
        },
      },
    ],
  },
  {
    key: "teams",
    name: "Teams",
    cat: "ms",
    ring: "inner",
    angle: 54,
    accent: "#6264a7",
    icon: "/icons/brands/teams.svg",
    delayMs: 600,
    status: "ready",
    plane: { en: "Collaboration", id: "Kolaborasi" },
    desc: {
      en: "Channel messages, shared files, and meeting notes across Microsoft Teams.",
      id: "Pesan kanal, berkas bersama, dan catatan rapat di Microsoft Teams.",
    },
    specs: [
      {
        label: { en: "Auth", id: "Autentikasi" },
        value: {
          en: "OAuth 2.0 · admin consent",
          id: "OAuth 2.0 · persetujuan admin",
        },
      },
      {
        label: { en: "ACL", id: "ACL" },
        value: {
          en: "Team, channel & file membership",
          id: "Keanggotaan tim, kanal & berkas",
        },
      },
      {
        label: { en: "Mode", id: "Mode" },
        value: {
          en: "Incremental message crawl",
          id: "Crawl pesan inkremental",
        },
      },
    ],
  },
  {
    key: "onenote",
    name: "OneNote",
    cat: "ms",
    ring: "inner",
    angle: 126,
    accent: "#7719aa",
    icon: "/icons/brands/onenote.svg",
    delayMs: 900,
    status: "ready",
    plane: { en: "Notebooks", id: "Buku catatan" },
    desc: {
      en: "Section and page content from OneNote notebooks, indexed with notebook permissions intact.",
      id: "Konten bagian dan halaman dari buku catatan OneNote, diindeks dengan izin buku catatan tetap utuh.",
    },
    specs: [
      {
        label: { en: "Auth", id: "Autentikasi" },
        value: { en: "OAuth 2.0 via Graph", id: "OAuth 2.0 via Graph" },
      },
      {
        label: { en: "ACL", id: "ACL" },
        value: {
          en: "Notebook & section permissions",
          id: "Izin buku catatan & bagian",
        },
      },
      {
        label: { en: "Mode", id: "Mode" },
        value: {
          en: "Page-level delta sync",
          id: "Sinkronisasi delta per halaman",
        },
      },
    ],
  },
  {
    key: "sticky",
    name: "Sticky Notes",
    cat: "device",
    ring: "inner",
    angle: 198,
    accent: "#f2b600",
    icon: "/icons/brands/sticky-notes.svg",
    delayMs: 1200,
    status: "ready",
    plane: { en: "Local capture", id: "Tangkapan lokal" },
    desc: {
      en: "Windows Sticky Notes read straight from the device — never uploaded, never retained.",
      id: "Sticky Notes Windows dibaca langsung dari perangkat — tidak pernah diunggah, tidak pernah disimpan.",
    },
    specs: [
      {
        label: { en: "Auth", id: "Autentikasi" },
        value: { en: "OS-bound local access", id: "Akses lokal terikat OS" },
      },
      {
        label: { en: "ACL", id: "ACL" },
        value: {
          en: "Device user session only",
          id: "Hanya sesi pengguna perangkat",
        },
      },
      {
        label: { en: "Mode", id: "Mode" },
        value: { en: "On-device parsing", id: "Parsing di perangkat" },
      },
    ],
  },

  // Outer ring
  {
    key: "sharepoint",
    name: "SharePoint",
    cat: "ms",
    ring: "outer",
    angle: -54,
    accent: "#036c70",
    icon: "/icons/brands/sharepoint.svg",
    delayMs: 150,
    status: "ready",
    plane: { en: "Site knowledge", id: "Pengetahuan situs" },
    desc: {
      en: "Document libraries, lists, and site pages across every SharePoint site the tenant authorizes.",
      id: "Pustaka dokumen, daftar, dan halaman situs di setiap situs SharePoint yang diotorisasi tenant.",
    },
    specs: [
      {
        label: { en: "Auth", id: "Autentikasi" },
        value: {
          en: "OAuth 2.0 · admin consent",
          id: "OAuth 2.0 · persetujuan admin",
        },
      },
      {
        label: { en: "ACL", id: "ACL" },
        value: {
          en: "Purview labels + site / library ACLs",
          id: "Label Purview + ACL situs / pustaka",
        },
      },
      {
        label: { en: "Mode", id: "Mode" },
        value: {
          en: "Delta sync per site",
          id: "Sinkronisasi delta per situs",
        },
      },
    ],
  },
  {
    key: "whatsapp",
    name: "WhatsApp",
    cat: "messaging",
    ring: "outer",
    angle: 18,
    accent: "#25d366",
    icon: "/icons/brands/whatsapp-icon.svg",
    delayMs: 450,
    status: "ready",
    plane: { en: "Messaging", id: "Perpesanan" },
    desc: {
      en: "Desktop chat history parsed locally, with no cloud relay and no message upload.",
      id: "Riwayat obrolan desktop diproses secara lokal, tanpa relay cloud dan tanpa unggah pesan.",
    },
    specs: [
      {
        label: { en: "Auth", id: "Autentikasi" },
        value: { en: "Device-bound session", id: "Sesi terikat perangkat" },
      },
      {
        label: { en: "ACL", id: "ACL" },
        value: { en: "Local user only", id: "Hanya pengguna lokal" },
      },
      {
        label: { en: "Mode", id: "Mode" },
        value: { en: "On-device parser", id: "Parser di perangkat" },
      },
    ],
  },
  {
    key: "gmail",
    name: "Gmail",
    cat: "workspace",
    ring: "outer",
    angle: 90,
    accent: "#ea4335",
    icon: "/icons/brands/gmail.svg",
    delayMs: 750,
    status: "soon",
    plane: { en: "Mail (roadmap)", id: "Surel (peta jalan)" },
    desc: {
      en: "Planned Gmail connector using Google OAuth, with label-level scoping and the same fail-closed model.",
      id: "Konektor Gmail yang direncanakan memakai Google OAuth, dengan cakupan level label dan model fail-closed yang sama.",
    },
    specs: [
      {
        label: { en: "Auth", id: "Autentikasi" },
        value: {
          en: "Google OAuth 2.0 (planned)",
          id: "Google OAuth 2.0 (direncanakan)",
        },
      },
      {
        label: { en: "ACL", id: "ACL" },
        value: {
          en: "Gmail labels & delegation",
          id: "Label Gmail & delegasi",
        },
      },
      {
        label: { en: "Mode", id: "Mode" },
        value: { en: "Roadmap", id: "Peta jalan" },
      },
    ],
  },
  {
    key: "gdrive",
    name: "Google Drive",
    cat: "workspace",
    ring: "outer",
    angle: 162,
    accent: "#0f9d58",
    icon: "/icons/brands/google-drive.svg",
    delayMs: 1050,
    status: "soon",
    plane: { en: "Files (roadmap)", id: "Berkas (peta jalan)" },
    desc: {
      en: "Planned Google Drive connector mapping native Drive permissions into the same authorization model.",
      id: "Konektor Google Drive yang direncanakan memetakan izin Drive asli ke model otorisasi yang sama.",
    },
    specs: [
      {
        label: { en: "Auth", id: "Autentikasi" },
        value: {
          en: "Google OAuth 2.0 (planned)",
          id: "Google OAuth 2.0 (direncanakan)",
        },
      },
      {
        label: { en: "ACL", id: "ACL" },
        value: { en: "Drive file permissions", id: "Izin berkas Drive" },
      },
      {
        label: { en: "Mode", id: "Mode" },
        value: { en: "Roadmap", id: "Peta jalan" },
      },
    ],
  },
  {
    key: "local",
    name: "On Device",
    cat: "device",
    ring: "outer",
    angle: 234,
    accent: "#0078d4",
    icon: "/icons/brands/windows.svg",
    delayMs: 1350,
    status: "ready",
    plane: { en: "Local knowledge", id: "Pengetahuan lokal" },
    desc: {
      en: "Local disks and folders indexed on the device, encrypted at rest, never shipped to a third party.",
      id: "Disk dan folder lokal diindeks di perangkat, terenkripsi saat diam, tidak pernah dikirim ke pihak ketiga.",
    },
    specs: [
      {
        label: { en: "Auth", id: "Autentikasi" },
        value: { en: "OS keychain + mTLS", id: "Keychain OS + mTLS" },
      },
      {
        label: { en: "ACL", id: "ACL" },
        value: { en: "Native filesystem ACLs", id: "ACL sistem berkas asli" },
      },
      {
        label: { en: "Mode", id: "Mode" },
        value: {
          en: "On-device parse + local index",
          id: "Parse di perangkat + indeks lokal",
        },
      },
    ],
  },
];
