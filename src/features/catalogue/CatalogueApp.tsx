'use client'

import GlobalCatalogueModals from './components/GlobalCatalogueModals'
import { CatalogueProvider, useCatalogue } from './context/CatalogueContext'
import HomePage from './pages/HomePage'
import OrganizationLoginPage from './pages/OrganizationLoginPage'
import PlatformLoginPage from './pages/PlatformLoginPage'
import RegistrationPage from './pages/RegistrationPage'
import RegistrationSuccessPage from './pages/RegistrationSuccessPage'
import LoginBuilderPage from './pages/organization/LoginBuilderPage'
import OrganizationApplicationsPage from './pages/organization/OrganizationApplicationsPage'
import OrganizationDashboardPage from './pages/organization/OrganizationDashboardPage'
import OrganizationProfilePage from './pages/organization/OrganizationProfilePage'
import RegistrationBuilderPage from './pages/organization/RegistrationBuilderPage'
import PlatformApplicationsPage from './pages/platform/PlatformApplicationsPage'
import PlatformAuditPage from './pages/platform/PlatformAuditPage'
import PlatformDashboardPage from './pages/platform/PlatformDashboardPage'
import PlatformIdentityManagementPage from './pages/platform/PlatformIdentityManagementPage'
import PlatformOrganizationsPage from './pages/platform/PlatformOrganizationsPage'
import PlatformPendingPage from './pages/platform/PlatformPendingPage'
import PlatformPlaceholderPage from './pages/platform/PlatformPlaceholderPage'
import PlatformSchemasPage from './pages/platform/PlatformSchemasPage'
import type { CatalogueView } from './routes'

interface CatalogueAppProps {
  initialView?: CatalogueView
}

function CatalogueRoutes() {
  const { view } = useCatalogue()

  return (
    <main className="app-shell">
      {view === 'home' && <HomePage />}
      {view === 'registration' && <RegistrationPage />}
      {view === 'success' && <RegistrationSuccessPage />}
      {view === 'platform' && <PlatformLoginPage />}
      {view === 'platform-dashboard' && <PlatformDashboardPage />}
      {(view === 'platform-organizations' || view === 'platform-approved' || view === 'platform-settings') && <PlatformOrganizationsPage />}
      {view === 'platform-apps' && <PlatformApplicationsPage />}
      {view === 'platform-schema' && <PlatformSchemasPage />}
      {view === 'platform-pending' && <PlatformPendingPage />}
      {view === 'platform-audit' && <PlatformAuditPage />}
      {view === 'platform-identity-mgmt' && <PlatformIdentityManagementPage />}
      {view === 'platform-auth-monitor' && <PlatformPlaceholderPage title="Auth Monitoring" />}
      {view === 'platform-security-monitor' && <PlatformPlaceholderPage title="Security Monitoring" />}
      {view === 'platform-api' && <PlatformPlaceholderPage title="API Management" />}
      {view === 'platform-trust' && <PlatformPlaceholderPage title="Trust Management" />}
      {view === 'platform-reports' && <PlatformPlaceholderPage title="Reports" />}
      {view === 'platform-notifications' && <PlatformPlaceholderPage title="Notifications" />}
      {view === 'organization' && <OrganizationLoginPage />}
      {view === 'organization-dashboard' && <OrganizationDashboardPage />}
      {view === 'org-profile' && <OrganizationProfilePage />}
      {view === 'org-applications' && <OrganizationApplicationsPage />}
      {view === 'org-registration-builder' && <RegistrationBuilderPage />}
      {view === 'org-login-builder' && <LoginBuilderPage />}
      <GlobalCatalogueModals />
    </main>
  )
}

export default function CatalogueApp({ initialView = 'home' }: CatalogueAppProps) {
  return (
    <CatalogueProvider initialView={initialView}>
      <CatalogueRoutes />
    </CatalogueProvider>
  )
}
