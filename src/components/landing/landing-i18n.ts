export type LandingLanguage = "en" | "id";

export const LANDING_TRANSLATIONS = {
  en: {
    // Nav
    "nav.search": "Desktop Search",
    "nav.features": "Capabilities",
    "nav.arch": "Architecture",
    "nav.security": "Purview & Security",
    "nav.faq": "Client FAQ",
    "nav.download": "Get App",
    "nav.get_app": "Get App",
    "nav.sign_in": "Sign In",
    "nav.language": "Language",

    // Hero
    "hero.badge": "The Desktop Knowledge Layer for Enterprise & AI",
    "hero.title": "The AI Knowledge Layer for Multi source Enterprise Data",
    "hero.sub":
      "Search local storage, OneDrive, Outlook, and SharePoint instantly, feed your favorite LLMs permission-aware company knowledge, and never leak sensitive files.",
    "hero.cta_download": "Get App",
    "hero.cta_explore": "Explore Desktop Demo ↓",

    // Demo Section Header
    "demo.sub": "The Desktop Knowledge Layer",

    // Connectors
    "connectors.tag": "Enterprise Connectors",
    "connectors.title": "Searches what you already have. Without migration.",
    "connectors.desc":
      "No secondary file uploads. SearchPoint connects through standard OAuth/OIDC with admin consent, keeping your native DLP and ACLs fully intact at the source.",
    "connectors.trust_tag": "Security by Design",
    "connectors.trust_title": "Two trust planes guard every answer.",
    "connectors.trust_desc":
      "Identity decides who may see a result. Secrets management decides how credentials are protected and rotated. Both boundaries fail closed.",
    "connectors.soon": "Soon",
    "connectors.all": "All sources",
    "connectors.ms365": "Microsoft 365",
    "connectors.identity": "Identity & RBAC",
    "connectors.secrets_filter": "Secrets",
    "connectors.device": "On-device",
    "connectors.messaging": "Messaging",
    "connectors.workspace": "Workspace",
    "connectors.panel_hint":
      "Click another node to inspect its trust boundary.",
    "connectors.identity_badge": "Identity plane",
    "connectors.identity_title": "Microsoft Entra ID",
    "connectors.identity_desc":
      "Who is asking? OAuth/OIDC claims, Microsoft 365 groups, and Purview labels decide which documents may surface — on every query.",
    "connectors.identity_p1": "SSO with OAuth 2.0 / OIDC",
    "connectors.identity_p2": "Group, ACL & Purview claims",
    "connectors.identity_p3": "Fail-closed filtering at query time",
    "connectors.identity_note": "Answers: who is allowed to see this result?",
    "connectors.secrets_badge": "Secrets plane",
    "connectors.secrets_title": "HashiCorp Vault",
    "connectors.secrets_desc":
      "How are credentials and keys protected? Dynamic secrets, transit encryption, and KMS auto-unseal keep connector tokens out of config files and rotate them automatically.",
    "connectors.secrets_p1": "Dynamic, short-lived credentials",
    "connectors.secrets_p2": "Transit encryption & audit trail",
    "connectors.secrets_p3": "KMS auto-unseal (AWS / Azure / GCP)",
    "connectors.secrets_note":
      "Answers: how is this secret protected and rotated?",

    // Capabilities
    "features.tag": "Core Differentiators",
    "features.title":
      "Built for enterprises that cannot afford document leaks.",
    "c1.tag": "Data Privacy",
    "c1.title": "Zero Document Retention",
    "c1.desc":
      "We do not store your files. SearchPoint indexes metadata and keywords in a private hybrid search cluster. Raw binaries are parsed in isolated, ephemeral sandboxes and immediately purged.",
    "c1.b1": "Direct-to-Source",
    "c1.b2": "100% Ephemeral",

    "c2.tag": "Access Control",
    "c2.title": "Query-Time Purview & RBAC",
    "c2.desc":
      "The #1 enterprise fear with AI search (oversharing) is architecturally prevented. Every query filters results per user. If someone can't open a file in OneDrive, they cannot see or query it.",
    "c2.b1": "Fail-Closed",
    "c2.b2": "Entra ID Native",

    "c3.tag": "Search Performance",
    "c3.title": "Sub-50ms Desktop Speed",
    "c3.desc":
      "Press Ctrl + Space from any active application. Features boolean operators (AND/OR/NOT), fuzzy matching, multilingual stemming (English + Indonesian), and field boosting.",
    "c3.b1": "Hybrid Search Core",
    "c3.b2": "Instant Launch",

    "c4.tag": "On-Device AI",
    "c4.title": "Intelligent On-Device Rename",
    "c4.desc":
      "Eliminate chaotic downloads like `download(3).pdf`. A lightweight on-device neural model reads document structure and proposes standardized, clutter-free naming conventions.",
    "c4.b1": "On-Device Neural",
    "c4.b2": "Zero Privacy Leak",

    "c5.tag": "AI Grounding",
    "c5.title": "Grounded AI Context (RAG)",
    "c5.desc":
      "Feed ChatGPT, Claude, or local Ollama with verified corporate citations. LLMs receive only permitted departmental snippets, preventing hallucinations and executive data leaks.",
    "c5.b1": "Zero Hallucinations",
    "c5.b2": "Model Agnostic",

    "c6.tag": "Deployment",
    "c6.title": "Self-Hosted Private Stack",
    "c6.desc":
      "Deploy entirely within your enterprise tenant or private VPC. Secrets rotated in HashiCorp Vault with KMS auto-unseal. Client certificates verified at proxy edge with CRL checking.",
    "c6.b1": "Vault KMS Unseal",
    "c6.b2": "mTLS Hardened",

    // Architecture
    "arch.tag": "Architectural Blueprint",
    "arch.title": "Inside the Knowledge Layer.",
    "arch.desc":
      "Not another tool on the side — SearchPoint lives inside your organization, wired into how it actually runs.",
    "step1.title": "01. Delta Ingest",
    "step1.desc":
      "Microsoft Graph delta queries and local filesystem watchers discover document updates without copying binaries.",
    "step2.title": "02. Native Sandbox",
    "step2.desc":
      "Dedicated high-performance native worker processes PDF, Office, and OCR in an ephemeral sandbox. Immediate memory purge.",
    "step3.title": "03. Purview Snapshot",
    "step3.desc":
      "Every record carries its native Entra ID source allow-list (users, groups, public) — the sole signal for query authorization.",
    "step4.title": "04. Hybrid Search Engine",
    "step4.desc":
      "Sub-50ms vector and keyword retrieval with boolean operators, fuzzy matching, and multilingual English/Indonesian stemming.",
    "step5.title": "05. Grounded RAG",
    "step5.desc":
      "Permitted context citations feed your favorite LLM (Claude, ChatGPT, Ollama) with zero hallucinations and zero data leakage.",

    // Manifesto
    "man.tag": "The Architecture Manifesto",
    "man.title":
      "Enterprise search failed because it copied files into secondary silos. The future of knowledge belongs to the zero-retention, permission-true layer.",
    "man.desc":
      "No duplicated file liabilities. No accidental oversharing leaks. Every document stays in its source, protected by the exact same purview that governs your company.",

    // Download
    "dl.tag": "Install SearchPoint Desktop",
    "dl.title": "Get SearchPoint now.",
    "dl.desc":
      "A fast, native application built for daily productivity and secure AI workflows.",
    "dl.mac": "macOS",
    "dl.mac_sub": "Apple Silicon & Intel",
    "dl.win": "Windows",
    "dl.win_sub": "Windows 11 / 10 x64",
    "dl.linux": "Linux (.deb / .rpm)",
    "dl.coming": "Coming Soon",

    // FAQ
    "faq.tag": "Frequently Asked Questions",
    "faq.title": "Client FAQ & Product Architecture.",
    "faq.desc":
      "Answers to common enterprise security and deployment questions, grounded in shipped product behavior.",

    // Footer
    "footer.rights": "© 2026 Hyperjump",
  },

  id: {
    // Nav
    "nav.search": "Pencarian Desktop",
    "nav.features": "Keunggulan",
    "nav.arch": "Arsitektur",
    "nav.security": "Izin & Keamanan",
    "nav.faq": "FAQ Klien",
    "nav.download": "Dapatkan Aplikasi",
    "nav.get_app": "Dapatkan Aplikasi",
    "nav.sign_in": "Masuk",
    "nav.language": "Bahasa",

    // Hero
    "hero.badge": "Lapisan Pengetahuan Desktop untuk Korporasi & AI",
    "hero.title": "The AI Knowledge Layer for Multi source Enterprise Data",
    "hero.sub":
      "Cari penyimpanan lokal, OneDrive, Outlook, dan SharePoint seketika, beri LLM Anda pengetahuan perusahaan yang patuh izin, dan tanpa kebocoran berkas sensitif.",
    "hero.cta_download": "Dapatkan Aplikasi",
    "hero.cta_explore": "Lihat Demo Desktop Interaktif ↓",

    // Demo Section Header
    "demo.sub": "Lapisan Pengetahuan Desktop",

    // Connectors
    "connectors.tag": "Konektor Enterprise",
    "connectors.title": "Mencari berkas yang sudah ada. Tanpa migrasi.",
    "connectors.desc":
      "Tanpa pengunggahan berkas sekunder. SearchPoint terhubung melalui standar OAuth/OIDC dengan persetujuan admin, menjaga DLP dan ACL lokal tetap utuh pada sumber aslinya.",
    "connectors.trust_tag": "Keamanan Sejak Rancangan",
    "connectors.trust_title": "Dua bidang kepercayaan menjaga setiap jawaban.",
    "connectors.trust_desc":
      "Identitas menentukan siapa yang boleh melihat hasil. Manajemen rahasia menentukan bagaimana kredensial dilindungi dan dirotasi. Kedua batas ini fail-closed.",
    "connectors.soon": "Segera",
    "connectors.all": "Semua sumber",
    "connectors.ms365": "Microsoft 365",
    "connectors.identity": "Identitas & RBAC",
    "connectors.secrets_filter": "Rahasia",
    "connectors.device": "Perangkat",
    "connectors.messaging": "Perpesanan",
    "connectors.workspace": "Ruang kerja",
    "connectors.panel_hint":
      "Klik node lain untuk memeriksa batas kepercayaannya.",
    "connectors.identity_badge": "Bidang identitas",
    "connectors.identity_title": "Microsoft Entra ID",
    "connectors.identity_desc":
      "Siapa yang bertanya? Klaim OAuth/OIDC, grup Microsoft 365, dan label Purview menentukan dokumen mana yang boleh muncul — pada setiap kueri.",
    "connectors.identity_p1": "SSO dengan OAuth 2.0 / OIDC",
    "connectors.identity_p2": "Klaim grup, ACL & Purview",
    "connectors.identity_p3": "Pemfilteran fail-closed saat kueri",
    "connectors.identity_note": "Menjawab: siapa yang boleh melihat hasil ini?",
    "connectors.secrets_badge": "Bidang rahasia",
    "connectors.secrets_title": "HashiCorp Vault",
    "connectors.secrets_desc":
      "Bagaimana kredensial dan kunci dilindungi? Rahasia dinamis, enkripsi transit, dan auto-unseal KMS menjaga token konektor tetap di luar berkas konfigurasi dan merotasinya otomatis.",
    "connectors.secrets_p1": "Kredensial dinamis berumur pendek",
    "connectors.secrets_p2": "Enkripsi transit & jejak audit",
    "connectors.secrets_p3": "Auto-unseal KMS (AWS / Azure / GCP)",
    "connectors.secrets_note":
      "Menjawab: bagaimana rahasia ini dilindungi dan dirotasi?",

    // Capabilities
    "features.tag": "Keunggulan Utama",
    "features.title":
      "Dibangun untuk enterprise yang tidak boleh mengalami kebocoran data.",
    "c1.tag": "Privasi Data",
    "c1.title": "Nol Penyimpanan Dokumen",
    "c1.desc":
      "Kami tidak menyimpan berkas Anda. SearchPoint hanya mengindeks metadata, kata kunci, dan ringkasan teks di klaster hybrid search privat. Konten biner diproses di sandbox terisolasi dan langsung dihapus permanen.",
    "c1.b1": "Akses Langsung Sumber",
    "c1.b2": "100% Sementara (Ephemeral)",

    "c2.tag": "Kontrol Akses",
    "c2.title": "Penegakan Izin Saat Kueri (RBAC)",
    "c2.desc":
      "Ketakutan #1 korporasi terhadap AI (oversharing) dicegah secara arsitektural. Setiap kueri disaring per pengguna. Jika seseorang tidak bisa membuka berkas di OneDrive, mereka tidak akan melihatnya di SearchPoint.",
    "c2.b1": "Prinsip Fail-Closed",
    "c2.b2": "Native Entra ID",

    "c3.tag": "Performa Pencarian",
    "c3.title": "Kecepatan Desktop Sub-50ms",
    "c3.desc":
      "Tekan Ctrl + Space dari aplikasi apa pun. Dilengkapi operator boolean (AND/OR/NOT), pencarian fuzzy, stemming multibahasa (Indonesia + Inggris), serta pembobotan field kueri.",
    "c3.b1": "Hybrid Search Core",
    "c3.b2": "Peluncuran Seketika",

    "c4.tag": "AI On-Device",
    "c4.title": "Penamaan Dokumen AI On-Device",
    "c4.desc":
      "Hilangkan berkas unduhan berantakan seperti `download(3).pdf`. Model neural ringan on-device membaca struktur dokumen dan mengusulkan standarisasi nama arsip yang rapi secara otomatis.",
    "c4.b1": "Neural di Perangkat",
    "c4.b2": "Nol Kebocoran Privasi",

    "c5.tag": "Grounding AI",
    "c5.title": "Konteks AI Terverifikasi (RAG)",
    "c5.desc":
      "Beri makan ChatGPT, Claude, atau Ollama lokal dengan sitasi dokumen terverifikasi. LLM hanya menerima potongan informasi yang diizinkan per departemen, mencegah halusinasi dan kebocoran berkas direksi.",
    "c5.b1": "Nol Halusinasi",
    "c5.b2": "Agnostik Model",

    "c6.tag": "Deployment",
    "c6.title": "Stack Privat Self-Hosted",
    "c6.desc":
      "Dapat dijalankan penuh di tenant atau VPC privat Anda. Kunci rahasia dikelola di HashiCorp Vault dengan auto-unseal KMS cloud. Sertifikat klien diverifikasi dengan CRL pada layer proksi.",
    "c6.b1": "Vault KMS Unseal",
    "c6.b2": "Proteksi mTLS",

    // Architecture
    "arch.tag": "Cetak Biru Arsitektur",
    "arch.title": "Di Dalam Lapisan Pengetahuan.",
    "arch.desc":
      "Bukan sekadar alat tambahan — SearchPoint hadir langsung di dalam organisasi Anda, terhubung dengan cara bisnis Anda beroperasi.",
    "step1.title": "01. Ingesti Delta",
    "step1.desc":
      "Kueri delta Microsoft Graph dan pemantau filesystem lokal mendeteksi pembaruan berkas tanpa perlu menyalin biner.",
    "step2.title": "02. Native Sandbox",
    "step2.desc":
      "Worker native berperforma tinggi memproses PDF, Office, dan OCR dalam sandbox sementara yang langsung dibersihkan dari RAM.",
    "step3.title": "03. Snapshot Izin M365",
    "step3.desc":
      "Setiap data membawa allow-list sumber Entra ID (pengguna, grup, publik) — satu-satunya sinyal otorisasi saat pencarian.",
    "step4.title": "04. Mesin Hybrid Search",
    "step4.desc":
      "Pencarian vektor dan kata kunci sub-50ms dengan operator boolean, toleransi saltik fuzzy, dan stemming bahasa Indonesia & Inggris.",
    "step5.title": "05. RAG Terverifikasi",
    "step5.desc":
      "Konteks yang terverifikasi dialirkan ke LLM pilihan Anda (Claude, ChatGPT, Ollama) tanpa halusinasi dan tanpa risiko kebocoran berkas rahasia.",

    // Manifesto
    "man.tag": "Manifesto Arsitektur",
    "man.title":
      "Pencarian korporasi lama gagal karena menyalin berkas ke silo sekunder. Masa depan pengetahuan enterprise adalah lapisan tanpa penyimpanan dengan kepatuhan izin mutlak.",
    "man.desc":
      "Tanpa risiko duplikasi data. Tanpa celah kebocoran hak akses. Setiap berkas tetap di sumber aslinya, dilindungi oleh izin yang sama dengan aturan perusahaan Anda.",

    // Download
    "dl.tag": "Pasang SearchPoint Desktop",
    "dl.title": "Dapatkan SearchPoint Sekarang.",
    "dl.desc":
      "Aplikasi native yang kencang, dirancang untuk produktivitas harian dan alur kerja AI yang aman.",
    "dl.mac": "macOS",
    "dl.mac_sub": "Apple Silicon & Intel",
    "dl.win": "Windows",
    "dl.win_sub": "Windows 11 / 10 x64",
    "dl.linux": "Linux (.deb / .rpm)",
    "dl.coming": "Segera Hadir",

    // FAQ
    "faq.tag": "Tanya Jawab Klien",
    "faq.title": "FAQ Klien & Arsitektur Produk.",
    "faq.desc":
      "Jawaban atas pertanyaan keamanan dan kesiapan implementasi korporasi, sesuai perilaku produk yang telah dirilis.",

    // Footer
    "footer.rights": "© 2026 Hyperjump",
  },
} as const;

export type TranslationKey = keyof (typeof LANDING_TRANSLATIONS)["en"];

export function getLandingTranslation(
  lang: LandingLanguage,
  key: TranslationKey | (string & {}),
  fallback?: string,
): string {
  const langDict = LANDING_TRANSLATIONS[lang];
  if (langDict && key in langDict) {
    return langDict[key as keyof typeof langDict];
  }
  const enDict = LANDING_TRANSLATIONS.en;
  if (key in enDict) {
    return enDict[key as keyof typeof enDict];
  }
  return fallback ?? key;
}
