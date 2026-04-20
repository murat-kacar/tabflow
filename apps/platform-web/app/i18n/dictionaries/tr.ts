import type { en } from "./en";

export const tr: typeof en = {
  common: {
    email: "Email",
    password: "Sifre"
  },
  language: {
    label: "Dil"
  },
  shell: {
    logout: "Cikis yap"
  },
  login: {
    heroEyebrow: "Control Plane",
    heroTitle: "Tenantlar, domainler ve lifecycle tek ekranda.",
    heroBody:
      "Platform login akisi aktif. Buradan sonra tenant yaratma, durdurma, arsivleme ve provisioning gozlemi tek bir super admin deneyimine baglanacak.",
    formEyebrow: "Platform Login",
    formTitle: "Super admin girisi",
    formBody:
      "Bu giris yalnizca platform yonetimi icindir. Tenant domainleri burada asla fallback almamali.",
    bootstrapNotice:
      "Henuz platform admin yok. PLATFORM_BOOTSTRAP_EMAIL ve PLATFORM_BOOTSTRAP_PASSWORD env degerleriyle ilk admin otomatik uretilir.",
    emailPlaceholder: "admin@example.com",
    submit: "Giris yap",
    pending: "Giris kontrol ediliyor..."
  },
  createTenant: {
    eyebrow: "Yeni Tenant",
    title: "Isletme olustur",
    bodyPrefix:
      "Bu adim tenant kaydini rezerve eder ve provisioning job olusturur. Container, TLS ve firmware uretimi sonraki worker adiminda calisacak. Ilk admin e-postasi otomatik olarak",
    bodySuffix: "seklinde atanir.",
    code: "Tenant kodu",
    codePlaceholder: "moda",
    displayName: "Gorunen ad",
    displayNamePlaceholder: "Moda Cafe",
    primaryDomain: "Primary domain",
    primaryDomainPlaceholder: "demo.example.com",
    language: "Runtime dili",
    languages: {
      en: "Ingilizce",
      tr: "Turkce"
    },
    currency: "Para birimi",
    timeZone: "Saat dilimi",
    submit: "Tenant olustur",
    pending: "Olusturuluyor...",
    viewerBlocked: "Viewer rolu tenant olusturamaz."
  },
  dashboard: {
    apiConnectionFailed: "Platform API baglantisi kurulamadi.",
    eyebrow: "Platform",
    title: "TabFlow Super Admin",
    body: "Tenant registry, domain sahipligi, ilk admin niyeti ve provisioning akislari tek operasyon panelinde yonetilir.",
    totalTenants: "Toplam tenant",
    role: "Rol",
    active: "Aktif",
    passive: "Pasif",
    auditRecords: "Audit kaydi",
    tenantsEyebrow: "Tenantlar",
    tenantRecords: "Isletme kayitlari",
    emptyTenants: "Henuz tenant yok. Ilk isletmeyi sagdaki formdan olustur.",
    code: "Kod",
    domain: "Domain",
    firstAdmin: "Ilk admin",
    notSpecified: "Henuz belirtilmedi",
    selectedTenant: "Secili tenant",
    firstAdminEmail: "Ilk admin e-postasi",
    regionalSettings: "Bolgesel ayarlar",
    language: "Dil",
    languages: {
      en: "Ingilizce",
      tr: "Turkce"
    },
    currency: "Para birimi",
    timeZone: "Saat dilimi",
    saveRegionalSettings: "Bolgesel ayarlari kaydet",
    createdAt: "Olusturma",
    updatedAt: "Son guncelleme",
    runtimeVisibility: "Runtime gorunurlugu",
    unknown: "Bilinmiyor",
    internalHealth: "Ic health",
    externalExposure: "Dis exposure",
    ports: "Portlar",
    exposureError: "Exposure hata",
    activate: "Aktif yap",
    suspend: "Pasif yap",
    archive: "Arsivle",
    latestJobs: "Son joblar",
    tenantJobsSuffix: "joblari",
    noProvisionJobs: "Bu baglamda provisioning job yok.",
    step: "Adim",
    attempt: "Deneme",
    latestActivity: "Son hareketler",
    tenantActivitySuffix: "hareketleri",
    noAuditRecords: "Bu baglamda audit kaydi yok.",
    statuses: {
      provisioning: "Provisioning",
      active: "Aktif",
      suspended: "Pasif",
      archived: "Arsiv"
    }
  },
  messages: {
    loginFailed: "Giris yapilamadi.",
    sessionMissing: "Oturum bulunamadi.",
    tenantCreated: "Tenant kaydi olusturuldu. Provisioning job siraya alindi.",
    tenantCreateFailed: "Tenant olusturulamadi.",
    regionalSettingsUpdated: "Tenant bolgesel ayarlari guncellendi."
  }
};
