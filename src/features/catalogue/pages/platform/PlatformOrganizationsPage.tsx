'use client'

import PlatformLayout from '../../components/PlatformLayout'
import { useCatalogue } from '../../context/CatalogueContext'

export default function PlatformOrganizationsPage() {
  const { addAudit, approveOrganization, organizations, orgsFilter, rejectOrganization, setOrgApprovalModal, setOrgsFilter, suspendOrganization, unsuspendOrganization } = useCatalogue()
  const filtered = organizations.filter((org) => orgsFilter === 'All' || org.status === orgsFilter.toLowerCase())
  return (
    <PlatformLayout title="Identity OS - Organizations" heading="Organizations">
      <div className="tab-row">{['All','Approved','Pending','Suspended','Rejected'].map((filter) => <button key={filter} type="button" className={`tab ${orgsFilter === filter ? 'active' : ''}`} onClick={() => setOrgsFilter(filter)}>{filter}</button>)}</div>
      <div className="approval-list">{filtered.map((org) => (
        <div key={org.id} className="approval-card">
          <div><div className="approval-name">{org.name}</div><div className="approval-meta">{org.type || '-'} - {org.country || '-'} - {org.id}</div></div>
          <div className="approval-actions">
            <button type="button" className="ghost-button" onClick={() => { setOrgApprovalModal({ type: 'org', item: org }); addAudit('View Organization', `Viewed ${org.name}`) }}>View</button>
            {org.status === 'pending' && <button type="button" className="primary-button" onClick={() => { approveOrganization(org); addAudit('Approve Organization', `Approved ${org.name}`) }}>Approve</button>}
            {org.status === 'pending' && <button type="button" className="secondary-button" onClick={() => { rejectOrganization(org); addAudit('Reject Organization', `Rejected ${org.name}`) }}>Reject</button>}
            {org.status === 'approved' && <button type="button" className="secondary-button" onClick={() => { suspendOrganization(org); addAudit('Suspend Organization', `Suspended ${org.name}`) }}>Suspend</button>}
            {org.status === 'suspended' && <button type="button" className="primary-button" onClick={() => { unsuspendOrganization(org); addAudit('Unsuspend Organization', `Unsuspended ${org.name}`) }}>Unsuspend</button>}
          </div>
        </div>
      ))}</div>
    </PlatformLayout>
  )
}
