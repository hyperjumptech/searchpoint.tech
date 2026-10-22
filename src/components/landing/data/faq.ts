export interface FaqItem {
  q: string;
  a: string;
}

export interface FaqData {
  en: FaqItem[];
  id: FaqItem[];
}

export const FAQ_DATA: FaqData = {
  en: [
    {
      q: "Do you store copies or binary contents of our company files?",
      a: "No. SearchPoint is an indexing and retrieval engine, NOT a document repository. We never store copies or binaries of your files. During indexing, content is parsed temporarily in an isolated, short-lived native sandbox and immediately purged from memory. SearchPoint only retains metadata, keywords, and text summaries in your private hybrid search cluster.",
    },
    {
      q: "How does SearchPoint enforce permissions and prevent accidental oversharing?",
      a: "This is our core architectural differentiator: document-level purview enforced per query, mirroring your real Microsoft 365, SharePoint, and filesystem permissions. If an employee cannot open a document in OneDrive or Windows, they will not see it in SearchPoint or AI context. Authorization is strictly fail-closed — if a snapshot is missing, access is denied.",
    },
    {
      q: "What happens when a document is deleted, moved, or locked down at the source?",
      a: "Truth-mirroring deletes are instantaneous. Through Microsoft Graph delta queries and real-time reconciliation backstops, whenever a file is deleted, moved, or restricted at the source, it disappears immediately from SearchPoint. No ghost copies haunt search results or AI pipelines.",
    },
    {
      q: "Do we need to migrate our files or re-upload them to your cloud?",
      a: "Zero migration and zero re-upload. SearchPoint connects directly to your existing Microsoft Entra ID (Azure AD), OneDrive, SharePoint sites, and local desktop directories. Your data stays exactly where it lives today.",
    },
    {
      q: "Can SearchPoint be deployed fully on-premise or in our private tenant?",
      a: "Yes. The entire stack runs self-hosted on your own VMs and private network. No document content ever leaves your tenant into a third-party SaaS. All credentials and encryption keys are stored and rotated in HashiCorp Vault with KMS auto-unseal (AWS/Azure/GCP) and mTLS certificate revocation checking.",
    },
    {
      q: "How does the on-device AI Intelligent Rename feature work?",
      a: "SearchPoint uses a lightweight on-device neural model that inspects the structure and first few pages of chaotic downloads (e.g. `download(3).pdf` or raw scanner files). It automatically suggests clean, standardized naming conventions (such as `Category - Entity - Year - Title.pdf`) without sending file content over the internet.",
    },
    {
      q: "Which search operators and languages are supported?",
      a: "SearchPoint supports boolean logic operators (AND, OR, NOT), exact phrase matching, field boosting (`source:on_device`, `type:pdf`), fuzzy tolerance for typos, and full multilingual stemming for English and Bahasa Indonesia.",
    },
    {
      q: "How does SearchPoint ground LLMs (like ChatGPT, Claude, or Ollama)?",
      a: "SearchPoint provides a structured, context-rich retrieval pipeline (RAG). When you query your AI, SearchPoint fetches only verified, permission-permitted document snippets with verbatim source citations. This eliminates hallucinations while ensuring confidential executive documents are never leaked into employee AI prompts.",
    },
  ],

  id: [
    {
      q: "Apakah SearchPoint menyimpan salinan atau isi biner dokumen kami?",
      a: "Tidak. SearchPoint adalah mesin pengindeksan dan pencarian, BUKAN repositori dokumen. Kami tidak pernah menyimpan salinan atau berkas biner dokumen Anda. Selama pengindeksan, konten diparsing sementara dalam sandbox native yang terisolasi dan langsung dihapus dari memori. SearchPoint hanya menyimpan metadata, kata kunci, dan ringkasan teks di klaster hybrid search privat Anda.",
    },
    {
      q: "Bagaimana SearchPoint menegakkan izin dan mencegah kebocoran data (oversharing)?",
      a: "Ini adalah pembeda arsitektural utama kami: penegakan izin tingkat dokumen per kueri secara real-time, mencerminkan izin asli Microsoft 365, SharePoint, dan filesystem lokal Anda. Jika seorang karyawan tidak berhak membuka dokumen di OneDrive atau Windows, berkas tersebut tidak akan muncul di SearchPoint atau konteks AI. Otorisasi bersifat fail-closed — jika snapshot izin belum lengkap, akses langsung ditolak.",
    },
    {
      q: "Apa yang terjadi saat dokumen dihapus, dipindah, atau dikunci di sumber aslinya?",
      a: "Penghapusan cermin kebenaran bersifat seketika. Melalui kueri delta Microsoft Graph dan sistem rekonsiliasi berkala, begitu berkas dihapus atau dibatasi di sumbernya, berkas tersebut seketika hilang dari indeks SearchPoint. Tidak ada salinan hantu yang tertinggal pada hasil pencarian maupun pipeline AI.",
    },
    {
      q: "Apakah kami perlu memindahkan atau mengunggah ulang berkas ke cloud SearchPoint?",
      a: "Nol migrasi dan tanpa unggah ulang. SearchPoint terhubung langsung ke Microsoft Entra ID (Azure AD), OneDrive, situs SharePoint, serta direktori desktop lokal Anda yang sudah berjalan. Berkas dan data Anda tetap berada tepat di tempat penyimpanannya saat ini.",
    },
    {
      q: "Bisakah SearchPoint diinstal sepenuhnya secara on-premise di jaringan privat kami?",
      a: "Bisa. Seluruh stack SearchPoint dapat dijalankan mandiri (self-hosted) di atas VM dan jaringan privat Anda sendiri. Tidak ada konten dokumen yang pernah keluar dari tenant Anda ke SaaS pihak ketiga. Seluruh rahasia dan kunci dikelola di HashiCorp Vault dengan auto-unseal KMS cloud dan verifikasi mTLS dengan CRL checking.",
    },
    {
      q: "Bagaimana cara kerja fitur Rename Pintar AI On-Device?",
      a: "SearchPoint menggunakan model neural ringan yang berjalan sepenuhnya di perangkat lokal Anda untuk memeriksa struktur isi berkas unduhan acak (misal: `download(3).pdf` atau berkas scanner). Model ini mengusulkan standarisasi penamaan berkas yang rapi (seperti `Kategori - Lembaga - Tahun - Judul.pdf`) tanpa mengirimkan berkas Anda ke internet.",
    },
    {
      q: "Operator pencarian dan bahasa apa saja yang didukung?",
      a: "SearchPoint mendukung operator logika boolean (AND, OR, NOT), pencarian frasa tepat dengan tanda kutip, filter atribut field (`source:on_device`, `type:pdf`), toleransi salah ketik (fuzzy), dan stemming multibahasa penuh untuk Bahasa Indonesia dan Bahasa Inggris.",
    },
    {
      q: "Bagaimana SearchPoint menyuplai konteks bagi model AI (Claude, ChatGPT, Ollama)?",
      a: "SearchPoint menyediakan pipeline retrieval (RAG) berizin ketat. Ketika karyawan bertanya pada AI, SearchPoint hanya mengambil potongan dokumen yang memang diizinkan untuk dibaca oleh karyawan tersebut, lengkap dengan sitasi sumber asli. Hal ini mengeliminasi halusinasi sekaligus menjamin berkas rahasia eksekutif tidak bocor ke prompt AI karyawan biasa.",
    },
  ],
};
