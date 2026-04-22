import type { en } from "./en";

export const tr: typeof en = {
  common: {
    email: "E-posta",
    password: "Şifre"
  },
  language: {
    label: "Dil"
  },
  shell: {
    logout: "Çıkış yap"
  },
  login: {
    heroEyebrow: "Control Plane",
    heroTitle: "İşletmeler, alan adları ve yaşam döngüsü tek ekranda.",
    heroBody:
      "Platform giriş akışı aktif. Buradan sonra işletme oluşturma, durdurma, arşivleme ve kurulum (provisioning) gözlemi tek bir süper admin deneyimine bağlanacak.",
    formEyebrow: "Platform Login",
    formTitle: "Süper admin girişi",
    formBody:
      "Bu giriş yalnızca platform yönetimi içindir. İşletme domainleri burada asla fallback almamalıdır.",
    bootstrapNotice:
      "Henüz platform admini yok. PLATFORM_BOOTSTRAP_EMAIL ve PLATFORM_BOOTSTRAP_PASSWORD çevre değişkenleriyle ilk admin otomatik üretilir.",
    emailPlaceholder: "admin@example.com",
    submit: "Giriş yap",
    pending: "Giriş kontrol ediliyor..."
  },
  createTenant: {
    eyebrow: "Yeni İşletme",
    title: "İşletme oluştur",
    bodyPrefix:
      "Bu adım işletme kaydını rezerve eder ve kurulum işi (provisioning job) oluşturur. Konteyner, TLS ve yazılım üretimi sonraki adımlarda çalışacaktır. İlk admin e-postası otomatik olarak",
    bodySuffix: "şeklinde atanır.",
    code: "İşletme kodu",
    codePlaceholder: "moda",
    displayName: "Görünen ad",
    displayNamePlaceholder: "Moda Cafe",
    primaryDomain: "Birincil alan adı",
    primaryDomainPlaceholder: "demo.example.com",
    language: "Çalışma zamanı dili",
    languages: {
      en: "İngilizce",
      tr: "Türkçe"
    },
    currency: "Para birimi",
    timeZone: "Saat dilimi",
    submit: "İşletme oluştur",
    pending: "Oluşturuluyor...",
    viewerBlocked: "Görüntüleyici rolü işletme oluşturamaz."
  },
  dashboard: {
    apiConnectionFailed: "Platform API bağlantısı kurulamadı.",
    eyebrow: "Platform",
    title: "TabFlow Super Admin",
    body: "İşletme kaydı, domain sahipliği, ilk admin yapılandırması ve kurulum akışları tek operasyon panelinde yönetilir.",
    totalTenants: "Toplam işletme",
    role: "Rol",
    active: "Aktif",
    passive: "Pasif",
    auditRecords: "Denetim kaydı",
    tenantsEyebrow: "İşletmeler",
    tenantRecords: "İşletme kayıtları",
    emptyTenants: "Henüz işletme yok. İlk işletmeyi sağdaki formdan oluşturun.",
    code: "Kod",
    domain: "Domain",
    firstAdmin: "İlk admin",
    notSpecified: "Henüz belirtilmedi",
    selectedTenant: "Seçili işletme",
    firstAdminEmail: "İlk admin e-postası",
    regionalSettings: "Bölgesel ayarlar",
    language: "Dil",
    languages: {
      en: "İngilizce",
      tr: "Türkçe"
    },
    currency: "Para birimi",
    timeZone: "Saat dilimi",
    saveRegionalSettings: "Bölgesel ayarları kaydet",
    createdAt: "Oluşturma",
    updatedAt: "Son güncelleme",
    runtimeVisibility: "Çalışma zamanı görünürlüğü",
    unknown: "Bilinmiyor",
    internalHealth: "İç sağlık",
    externalExposure: "Dış erişim",
    ports: "Portlar",
    exposureError: "Erişim hatası",
    activate: "Aktif yap",
    suspend: "Pasif yap",
    archive: "Arşivle",
    latestJobs: "Son işler",
    tenantJobsSuffix: "işleri",
    noProvisionJobs: "Bu bağlamda kurulum işi (provisioning job) yok.",
    step: "Adım",
    attempt: "Deneme",
    latestActivity: "Son hareketler",
    tenantActivitySuffix: "hareketleri",
    noAuditRecords: "Bu bağlamda denetim kaydı yok.",
    statuses: {
      provisioning: "Kuruluyor",
      active: "Aktif",
      suspended: "Pasif",
      archived: "Arşiv"
    }
  },
  messages: {
    loginFailed: "Giriş yapılamadı.",
    sessionMissing: "Oturum bulunamadı.",
    tenantCreated: "İşletme kaydı oluşturuldu. Kurulum işi sıraya alındı.",
    tenantCreateFailed: "İşletme oluşturulamadı.",
    regionalSettingsUpdated: "İşletme bölgesel ayarları güncellendi."
  }
};
