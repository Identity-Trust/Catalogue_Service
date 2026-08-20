'use client'

import PlatformLayout from '../../components/PlatformLayout'
import { useCatalogue } from '../../context/CatalogueContext'

export default function PlatformIdentityManagementPage() {
  const { organizations, setOrgApprovalModal, suspendOrganization, unsuspendOrganization } = useCatalogue()
  return (
    <PlatformLayout title="Identity OS - Identity Management" heading="Identity Management">
      <div className="panel-copy"><p>Manage identity stores, directories, and organization identity configuration.</p></div>
      <div className="approval-list">{organizations.map((org) => <div key={org.id} className="approval-card"><div><div className="approval-name">{org.name}</div><div className="approval-meta">{org.type || '-'} - {org.country || '-'} - {org.id}</div></div><div className="approval-actions"><button className="ghost-button" onClick={() => setOrgApprovalModal({ type: 'org', item: org })}>View</button>{org.status === 'approved' ? <button className="secondary-button" onClick={() => suspendOrganization(org)}>Suspend</button> : org.status === 'suspended' ? <button className="primary-button" onClick={() => unsuspendOrganization(org)}>Unsuspend</button> : null}</div></div>)}</div>
    </PlatformLayout>
  )
}
