export const en = {
  common: {
    email: "Email",
    password: "Password"
  },
  language: {
    label: "Language"
  },
  shell: {
    logout: "Log out"
  },
  login: {
    heroEyebrow: "Control Plane",
    heroTitle: "Tenants, domains, and lifecycle in one screen.",
    heroBody:
      "Platform login is active. From here, tenant creation, suspension, archiving, and provisioning observation connect into a single super admin experience.",
    formEyebrow: "Platform Login",
    formTitle: "Super admin login",
    formBody:
      "This login is only for platform management. Tenant domains should never fall back here.",
    bootstrapNotice:
      "No platform admin exists yet. The first admin is created automatically from PLATFORM_BOOTSTRAP_EMAIL and PLATFORM_BOOTSTRAP_PASSWORD.",
    emailPlaceholder: "admin@example.com",
    submit: "Log in",
    pending: "Checking login..."
  },
  createTenant: {
    eyebrow: "New Tenant",
    title: "Create business",
    bodyPrefix:
      "This step reserves the tenant record and queues a provisioning job. Container, TLS, and firmware generation will run in the next worker step. The first admin email is assigned automatically as",
    bodySuffix: ".",
    code: "Tenant code",
    codePlaceholder: "moda",
    displayName: "Display name",
    displayNamePlaceholder: "Moda Cafe",
    primaryDomain: "Primary domain",
    primaryDomainPlaceholder: "demo.example.com",
    language: "Runtime language",
    languages: {
      en: "English",
      tr: "Turkish"
    },
    currency: "Currency",
    timeZone: "Time zone",
    submit: "Create tenant",
    pending: "Creating...",
    viewerBlocked: "Viewer role cannot create tenants."
  },
  dashboard: {
    apiConnectionFailed: "Could not connect to Platform API.",
    eyebrow: "Platform",
    title: "TabFlow Super Admin",
    body: "Tenant registry, domain ownership, first-admin intent, and provisioning flows are managed in one operation panel.",
    totalTenants: "Total tenants",
    role: "Role",
    active: "Active",
    passive: "Suspended",
    auditRecords: "Audit records",
    tenantsEyebrow: "Tenants",
    tenantRecords: "Business records",
    emptyTenants: "No tenants yet. Create the first business from the form on the right.",
    code: "Code",
    domain: "Domain",
    firstAdmin: "First admin",
    notSpecified: "Not specified yet",
    selectedTenant: "Selected tenant",
    firstAdminEmail: "First admin email",
    regionalSettings: "Regional settings",
    language: "Language",
    languages: {
      en: "English",
      tr: "Turkish"
    },
    currency: "Currency",
    timeZone: "Time zone",
    saveRegionalSettings: "Save regional settings",
    createdAt: "Created",
    updatedAt: "Last update",
    runtimeVisibility: "Runtime visibility",
    unknown: "Unknown",
    internalHealth: "Internal health",
    externalExposure: "External exposure",
    ports: "Ports",
    exposureError: "Exposure error",
    activate: "Activate",
    suspend: "Suspend",
    archive: "Archive",
    latestJobs: "Latest jobs",
    tenantJobsSuffix: "jobs",
    noProvisionJobs: "No provisioning jobs in this context.",
    step: "Step",
    attempt: "Attempt",
    latestActivity: "Latest activity",
    tenantActivitySuffix: "activity",
    noAuditRecords: "No audit records in this context.",
    statuses: {
      provisioning: "Provisioning",
      active: "Active",
      suspended: "Suspended",
      archived: "Archived"
    }
  },
  messages: {
    loginFailed: "Could not log in.",
    sessionMissing: "Session was not found.",
    tenantCreated: "Tenant record created. Provisioning job was queued.",
    tenantCreateFailed: "Could not create tenant.",
    regionalSettingsUpdated: "Tenant regional settings were updated."
  }
};
