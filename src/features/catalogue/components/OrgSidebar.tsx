'use client'

import { orgAdminMenu } from '../../../data/mockCatalogueData'
import { AdminIcon } from '../../../components/ui'
import { useCatalogue } from '../context/CatalogueContext'

interface OrgSidebarProps {
  activeItem: string
}

export default function OrgSidebar({ activeItem }: OrgSidebarProps) {
  const { applications, currentOrg, orgLoginId, schemas, setView } = useCatalogue()
  const org = currentOrg
  const organizationId = org?.id || orgLoginId
  const orgApplications = applications.filter((app: any) => app.orgId === organizationId)
  const orgSchemas = schemas.filter((schema: any) => schema.orgId === organizationId)
  const badges: Record<string, number> = {
    Applications: orgApplications.filter((app: any) => app.status === 'pending').length,
    'Registration Builder': orgSchemas.filter((schema: any) => schema.type === 'registration' && schema.status === 'pending').length,
    'Login Configuration': orgSchemas.filter((schema: any) => schema.type === 'login' && schema.status === 'pending').length,
  }

  const handleClick = (item: string) => {
    if (item === 'Dashboard') setView('organization-dashboard')
    if (item === 'Organization Profile') setView('org-profile')
    if (item === 'Registration Builder') setView('org-registration-builder')
    if (item === 'Login Configuration') setView('org-login-builder')
    if (item === 'Applications') setView('org-applications')
  }

  return (
    <aside className="org-sidebar org-admin-sidebar">
      <div className="org-sidebar-brand">
        <span className="platform-brand-icon"><AdminIcon name="shield" /></span>
        <span><strong>{org?.name || 'Organization'}</strong><small>{org?.id || orgLoginId}</small></span>
      </div>
      <nav>
        {orgAdminMenu.map((item) => (
          <button type="button" key={item} className={`menu-item ${item === activeItem ? 'active' : ''}`} onClick={() => handleClick(item)}>
            <span className="nav-item-label"><AdminIcon name={item === 'Organization Profile' ? 'organizations' : item === 'Applications' ? 'applications' : item === 'Registration Builder' ? 'schema' : item === 'Login Configuration' ? 'auth' : item === 'Audit Logs' ? 'audit' : item === 'API Credentials' ? 'api' : item === 'Identity Management' || item === 'Users' ? 'identity' : item === 'Webhooks' ? 'trust' : 'dashboard'} />{item}</span>
            {badges[item] > 0 && <span className="nav-badge">{badges[item]}</span>}
          </button>
        ))}
      </nav>
    </aside>
  )
}
