export interface CapabilityRow {
  labelKey: string;
  detail: {
    en: string;
    id: string;
  };
}

export interface CapabilityCardData {
  id: string;
  titleKey: string;
  tagKey: string;
  descKey: string;
  accent: string; // "tenant" or hex color
  blobStyle: {
    left: string;
    top: string;
    width: string;
    height: string;
    background: string;
    borderRadius: string;
  };
  avatarBg: string;
  avatarBlobs: Array<{
    bg: string;
    anim: "orbit" | "counter-orbit";
    dur: string;
    posClass: string;
  }>;
  rows: CapabilityRow[];
}

export const CAPABILITY_CARDS: CapabilityCardData[] = [
  // 1. Zero Document Retention (Tenant primary)
  {
    id: "c1",
    titleKey: "c1.title",
    tagKey: "c1.tag",
    descKey: "c1.desc",
    accent: "tenant",
    blobStyle: {
      left: "0%",
      top: "-25%",
      width: "198%",
      height: "237%",
      background:
        "radial-gradient(closest-side, var(--sp-accent-soft) 45%, var(--sp-accent-glow) 75%, transparent 100%)",
      borderRadius: "63% 37% 54% 46% / 55% 48% 52% 45%",
    },
    avatarBg: "hsl(0 60% 16%)",
    avatarBlobs: [
      {
        bg: "var(--sp-accent)",
        anim: "orbit",
        dur: "7s",
        posClass: "-left-1 -top-1",
      },
      {
        bg: "hsl(35 90% 62%)",
        anim: "counter-orbit",
        dur: "5s",
        posClass: "-right-1 top-2",
      },
      {
        bg: "hsl(320 90% 62%)",
        anim: "orbit",
        dur: "9s",
        posClass: "left-1 -bottom-2",
      },
    ],
    rows: [
      {
        labelKey: "c1.b1",
        detail: {
          en: "Files are accessed at the source via read-only APIs and OS handles. No staging buckets, no replica storage.",
          id: "Berkas diakses langsung di sumber melalui API read-only dan handle OS. Tanpa bucket perantara, tanpa replika penyimpanan.",
        },
      },
      {
        labelKey: "c1.b2",
        detail: {
          en: "Parsed byte buffers reside only in volatile RAM sandboxes and are overwritten immediately after vector extraction.",
          id: "Buffer biner hanya berada di sandbox RAM volatil dan ditimpa seketika setelah ekstraksi vektor selesai.",
        },
      },
    ],
  },

  // 2. Query-Time Purview & RBAC (Blue)
  {
    id: "c2",
    titleKey: "c2.title",
    tagKey: "c2.tag",
    descKey: "c2.desc",
    accent: "#3b82f6",
    blobStyle: {
      left: "2%",
      top: "-35%",
      width: "204%",
      height: "247%",
      background:
        "radial-gradient(closest-side, rgba(59,130,246,0.3) 45%, rgba(59,130,246,0.13) 75%, rgba(59,130,246,0) 100%)",
      borderRadius: "41% 59% 48% 52% / 63% 37% 63% 37%",
    },
    avatarBg: "hsl(217 60% 16%)",
    avatarBlobs: [
      {
        bg: "hsl(217 90% 62%)",
        anim: "orbit",
        dur: "7s",
        posClass: "-left-1 -top-1",
      },
      {
        bg: "hsl(252 90% 62%)",
        anim: "counter-orbit",
        dur: "5s",
        posClass: "-right-1 top-2",
      },
      {
        bg: "hsl(182 90% 62%)",
        anim: "orbit",
        dur: "9s",
        posClass: "left-1 -bottom-2",
      },
    ],
    rows: [
      {
        labelKey: "c2.b1",
        detail: {
          en: "If user authentication or permission tokens fail, search results are omitted completely rather than showing unauthorized snippets.",
          id: "Jika token otentikasi atau izin pengguna gagal, hasil pencarian diabaikan sepenuhnya, bukan menampilkan cuplikan tidak sah.",
        },
      },
      {
        labelKey: "c2.b2",
        detail: {
          en: "Direct synchronization with Microsoft Entra ID claims ensures dynamic security group changes apply on the very next query.",
          id: "Sinkronisasi langsung dengan klaim Microsoft Entra ID memastikan perubahan grup keamanan langsung berlaku pada kueri berikutnya.",
        },
      },
    ],
  },

  // 3. Sub-50ms Desktop Speed (Emerald)
  {
    id: "c3",
    titleKey: "c3.title",
    tagKey: "c3.tag",
    descKey: "c3.desc",
    accent: "#10b981",
    blobStyle: {
      left: "1%",
      top: "-30%",
      width: "202%",
      height: "244%",
      background:
        "radial-gradient(closest-side, rgba(16,185,129,0.3) 45%, rgba(16,185,129,0.13) 75%, rgba(16,185,129,0) 100%)",
      borderRadius: "57% 43% 36% 64% / 44% 59% 41% 56%",
    },
    avatarBg: "hsl(160 60% 16%)",
    avatarBlobs: [
      {
        bg: "hsl(160 90% 62%)",
        anim: "orbit",
        dur: "7s",
        posClass: "-left-1 -top-1",
      },
      {
        bg: "hsl(195 90% 62%)",
        anim: "counter-orbit",
        dur: "5s",
        posClass: "-right-1 top-2",
      },
      {
        bg: "hsl(125 90% 62%)",
        anim: "orbit",
        dur: "9s",
        posClass: "left-1 -bottom-2",
      },
    ],
    rows: [
      {
        labelKey: "c3.b1",
        detail: {
          en: "Combines inverted BM25 index with dense embedding vectors for ultra-fast exact keyword and semantic matches.",
          id: "Menggabungkan indeks BM25 terbalik dengan vektor dense embedding untuk kecocokan kata kunci dan semantik super cepat.",
        },
      },
      {
        labelKey: "c3.b2",
        detail: {
          en: "Global system hotkey brings up the desktop spotlight overlay instantly with 0ms cold-start penalty.",
          id: "Hotkey sistem global memunculkan overlay desktop secara instan tanpa penalti cold-start.",
        },
      },
    ],
  },

  // 4. Intelligent On-Device Rename (Amber)
  {
    id: "c4",
    titleKey: "c4.title",
    tagKey: "c4.tag",
    descKey: "c4.desc",
    accent: "#f59e0b",
    blobStyle: {
      left: "-2%",
      top: "-45%",
      width: "204%",
      height: "252%",
      background:
        "radial-gradient(closest-side, rgba(245,158,11,0.3) 45%, rgba(245,158,11,0.13) 75%, rgba(245,158,11,0) 100%)",
      borderRadius: "66% 34% 42% 58% / 48% 55% 45% 52%",
    },
    avatarBg: "hsl(38 60% 16%)",
    avatarBlobs: [
      {
        bg: "hsl(38 90% 62%)",
        anim: "orbit",
        dur: "7s",
        posClass: "-left-1 -top-1",
      },
      {
        bg: "hsl(73 90% 62%)",
        anim: "counter-orbit",
        dur: "5s",
        posClass: "-right-1 top-2",
      },
      {
        bg: "hsl(8 90% 62%)",
        anim: "orbit",
        dur: "9s",
        posClass: "left-1 -bottom-2",
      },
    ],
    rows: [
      {
        labelKey: "c4.b1",
        detail: {
          en: "Runs a compact, quantized neural model entirely locally to extract semantic document titles and dates.",
          id: "Menjalankan model neural terkuantisasi secara lokal untuk mengekstrak judul dokumen dan tanggal secara akurat.",
        },
      },
      {
        labelKey: "c4.b2",
        detail: {
          en: "Zero outbound network traffic. File contents never leave the host operating system during rename inference.",
          id: "Nol lalu lintas jaringan keluar. Konten berkas tidak pernah meninggalkan sistem operasi host selama inferensi.",
        },
      },
    ],
  },

  // 5. Grounded AI Context (RAG) (Purple)
  {
    id: "c5",
    titleKey: "c5.title",
    tagKey: "c5.tag",
    descKey: "c5.desc",
    accent: "#a855f7",
    blobStyle: {
      left: "0%",
      top: "-30%",
      width: "200%",
      height: "247%",
      background:
        "radial-gradient(closest-side, rgba(168,85,247,0.3) 45%, rgba(168,85,247,0.13) 75%, rgba(168,85,247,0) 100%)",
      borderRadius: "57% 43% 36% 64% / 44% 59% 41% 56%",
    },
    avatarBg: "hsl(270 60% 16%)",
    avatarBlobs: [
      {
        bg: "hsl(270 90% 62%)",
        anim: "orbit",
        dur: "7s",
        posClass: "-left-1 -top-1",
      },
      {
        bg: "hsl(305 90% 62%)",
        anim: "counter-orbit",
        dur: "5s",
        posClass: "-right-1 top-2",
      },
      {
        bg: "hsl(240 90% 62%)",
        anim: "orbit",
        dur: "9s",
        posClass: "left-1 -bottom-2",
      },
    ],
    rows: [
      {
        labelKey: "c5.b1",
        detail: {
          en: "Provides deterministic document quotes and exact page references so language models never invent facts.",
          id: "Menyediakan kutipan dokumen deterministik dan nomor halaman presisi agar model bahasa tidak pernah berhalusinasi.",
        },
      },
      {
        labelKey: "c5.b2",
        detail: {
          en: "Standard OpenAI-compatible REST API endpoints allow drop-in integration with ChatGPT, Claude, LangChain, or Ollama.",
          id: "Endpoint REST yang kompatibel dengan OpenAI memudahkan integrasi dengan ChatGPT, Claude, LangChain, atau Ollama.",
        },
      },
    ],
  },

  // 6. Self-Hosted Private Stack (Cyan)
  {
    id: "c6",
    titleKey: "c6.title",
    tagKey: "c6.tag",
    descKey: "c6.desc",
    accent: "#06b6d4",
    blobStyle: {
      left: "-4%",
      top: "-45%",
      width: "204%",
      height: "252%",
      background:
        "radial-gradient(closest-side, rgba(6,182,212,0.3) 45%, rgba(6,182,212,0.13) 75%, rgba(6,182,212,0) 100%)",
      borderRadius: "66% 34% 42% 58% / 48% 55% 45% 52%",
    },
    avatarBg: "hsl(189 60% 16%)",
    avatarBlobs: [
      {
        bg: "hsl(189 90% 62%)",
        anim: "orbit",
        dur: "7s",
        posClass: "-left-1 -top-1",
      },
      {
        bg: "hsl(224 90% 62%)",
        anim: "counter-orbit",
        dur: "5s",
        posClass: "-right-1 top-2",
      },
      {
        bg: "hsl(154 90% 62%)",
        anim: "orbit",
        dur: "9s",
        posClass: "left-1 -bottom-2",
      },
    ],
    rows: [
      {
        labelKey: "c6.b1",
        detail: {
          en: "Keys and tokens are unsealed with cloud KMS (AWS KMS, Azure Key Vault, or GCP Cloud KMS) and never written to disk.",
          id: "Kunci dan token dibuka segelnya dengan KMS cloud (AWS KMS, Azure Key Vault, atau GCP Cloud KMS) tanpa pernah disimpan di disk.",
        },
      },
      {
        labelKey: "c6.b2",
        detail: {
          en: "Enforces mutual TLS across all internal services and client desktop apps with automated certificate revocation checks.",
          id: "Menegakkan mutual TLS di semua layanan internal dan aplikasi desktop klien dengan pemeriksaan pencabutan sertifikat otomatis.",
        },
      },
    ],
  },
];
