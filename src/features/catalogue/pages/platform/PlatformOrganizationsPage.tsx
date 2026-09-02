'use client'

import { useEffect, useMemo, useState } from 'react'
import { AdminIcon } from '../../../../components/ui'
import PlatformLayout from '../../components/PlatformLayout'
import { useCatalogue } from '../../context/CatalogueContext'

export default function PlatformOrganizationsPage() {
  const { addAudit, approveOrganization, organizations, orgsFilter, refreshCatalogueData, rejectOrganization, setOrgApprovalModal, setOrgsFilter, suspendOrganization, unsuspendOrganization } = useCatalogue()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState('10')
  useEffect(() => { refreshCatalogueData?.() }, [])
  const filtered = useMemo(() => organizations.filter((org) => orgsFilter === 'All' || org.status === orgsFilter.toLowerCase()), [organizations, orgsFilter])
  const pageLimit = pageSize === 'all' ? filtered.length || 1 : Number(pageSize)
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageLimit))
  const pageStart = pageSize === 'all' ? 0 : (currentPage - 1) * pageLimit
  const visibleOrganizations = filtered.slice(pageStart, pageStart + pageLimit)
  const pageFrom = filtered.length ? pageStart + 1 : 0
  const pageTo = Math.min(pageStart + pageLimit, filtered.length)
  const statusIcon = (status: string) => status === 'approved' ? 'check' : status === 'rejected' ? 'rejected' : status === 'suspended' ? 'suspended' : 'pending'
  useEffect(() => { setCurrentPage(1) }, [orgsFilter, pageSize])
  useEffect(() => { setCurrentPage((page) => Math.min(page, totalPages)) }, [totalPages])
  return (
    <PlatformLayout title="Identity OS - Organizations" heading="Organizations">
      <div className="tab-row">{['All','Approved','Pending','Suspended','Rejected'].map((filter) => <button key={filter} type="button" className={`tab ${orgsFilter === filter ? 'active' : ''}`} onClick={() => setOrgsFilter(filter)}>{filter}</button>)}</div>
      <div className="approval-list">{visibleOrganizations.map((org) => (
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
      {!!filtered.length && (
        <div className="pagination-bar">
          <div className="pagination-summary">Showing {pageFrom}-{pageTo} of {filtered.length} organizations</div>
          <label className="page-size-control">Rows
            <select value={pageSize} onChange={(event) => setPageSize(event.target.value)}>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="30">30</option>
              <option value="all">All</option>
            </select>
          </label>
          <div className="pagination-actions">
            <button type="button" className="secondary-button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1 || pageSize === 'all'}>Prev</button>
            <span>Page {currentPage} of {totalPages}</span>
            <button type="button" className="secondary-button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages || pageSize === 'all'}>Next</button>
          </div>
        </div>
      )}
    </PlatformLayout>
  )
}
