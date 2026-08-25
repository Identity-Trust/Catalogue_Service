'use client'

import { useEffect } from 'react'
import { AdminIcon } from '../../../../components/ui'
import PlatformLayout from '../../components/PlatformLayout'
import { useCatalogue } from '../../context/CatalogueContext'

export default function PlatformOrganizationsPage() {
  const { addAudit, approveOrganization, organizations, orgsFilter, refreshCatalogueData, rejectOrganization, setOrgApprovalModal, setOrgsFilter, suspendOrganization, unsuspendOrganization } = useCatalogue()
  useEffect(() => { refreshCatalogueData?.() }, [])
  const filtered = organizations.filter((org) => orgsFilter === 'All' || org.status === orgsFilter.toLowerCase())
  const statusIcon = (status: string) => status === 'approved' ? 'check' : status === 'rejected' ? 'rejected' : status === 'suspended' ? 'suspended' : 'pending'
  return (
    <PlatformLayout title="Identity OS - Organizations" heading="Organizations">
      <div className="tab-row">{['All','Approved','Pending','Suspended','Rejected'].map((filter) => <button key={filter} type="button" className={`tab ${orgsFilter === filter ? 'active' : ''}`} onClick={() => setOrgsFilter(filter)}>{filter}</button>)}</div>
      <div className="approval-list">{filtered.map((org) => (
        <div key={org.id} className="approval-card">
          <div><div className="approval-name-row"><div className="approval-name">{org.name}</div><span className={`status-pill-ui status-${org.status}`}><AdminIcon name={statusIcon(org.status)} />{org.status}</span></div><div className="approval-meta">{org.type || '-'} - {org.country || '-'} - {org.id}</div></div>
          <div className="approval-actions">
            <button type="button" className="ghost-button icon-text-button" onClick={() => { setOrgApprovalModal({ type: 'org', item: org }); addAudit('View Organization', `Viewed ${org.name}`) }}><AdminIcon name="view" />View</button>
            {org.status === 'pending' && <button type="button" className="primary-button icon-text-button" onClick={async () => { await approveOrganization(org); addAudit('Approve Organization', `Approved ${org.name}`) }}><AdminIcon name="check" />Approve</button>}
            {org.status === 'pending' && <button type="button" className="secondary-button danger-button icon-text-button" onClick={async () => { await rejectOrganization(org); addAudit('Reject Organization', `Rejected ${org.name}`) }}><AdminIcon name="rejected" />Reject</button>}
            {org.status === 'approved' && <button type="button" className="secondary-button" onClick={() => { suspendOrganization(org); addAudit('Suspend Organization', `Suspended ${org.name}`) }}>Suspend</button>}
            {org.status === 'suspended' && <button type="button" className="primary-button" onClick={() => { unsuspendOrganization(org); addAudit('Unsuspend Organization', `Unsuspended ${org.name}`) }}>Unsuspend</button>}
          </div>
        </div>
      ))}{!filtered.length && <div className="empty-state">No organizations found for this filter.</div>}</div>
    </PlatformLayout>
  )
}
