'use client'

import type React from 'react'
import { createPortal } from 'react-dom'
import { AdminIcon } from '../../../components/ui'
import type { ApplicationRecord, Organization, SchemaRecord } from '../../../types/catalogue'
import { useCatalogue } from '../context/CatalogueContext'

export default function GlobalCatalogueModals() {
  const ctx = useCatalogue()
  const {
    addAudit, appCredentialModal, approveApplication, approveOrganization, approveSchema, confirmModal, confirmProcessing,
    loginPublishModal, organizations, orgApprovalModal, policyPreviewModal, publishModal, rejectOrganization,
    rejectSchema, requestModal, requestMoreInfo, setAppCredentialModal, setConfirmModal, setConfirmProcessing, setLoginPublishModal,
    setOrgApprovalModal, setOrganizations, setPolicyPreviewModal, setPublishModal, setRequestModal, setSchemas,
  } = ctx

  const modals = (
    <>
      {orgApprovalModal && <ApprovalModal item={orgApprovalModal.item} type={orgApprovalModal.type} onClose={() => setOrgApprovalModal(null)} onConfirm={setConfirmModal} actions={{ addAudit, approveApplication, approveOrganization, approveSchema, rejectOrganization, rejectSchema, requestMoreInfo, setPolicyPreviewModal, setRequestModal }} />}
      {appCredentialModal && <AppCredentialModal data={appCredentialModal} onClose={() => setAppCredentialModal(null)} />}
      {publishModal && <PublishSchemaModal data={publishModal} organizations={organizations} onClose={() => setPublishModal(null)} setOrganizations={setOrganizations} setPublishModal={setPublishModal} setSchemas={setSchemas} addAudit={addAudit} />}
      {loginPublishModal && <PublishLoginPolicyModal data={loginPublishModal} organizations={organizations} onClose={() => setLoginPublishModal(null)} setLoginPublishModal={setLoginPublishModal} setSchemas={setSchemas} addAudit={addAudit} />}
      {policyPreviewModal && <PolicyPreviewModal data={policyPreviewModal} onClose={() => setPolicyPreviewModal(null)} />}
      {confirmModal && <ConfirmModal data={confirmModal} processing={confirmProcessing} setProcessing={setConfirmProcessing} onClose={() => setConfirmModal(null)} />}
      {requestModal && <RequestMoreInfoModal data={requestModal} onClose={() => setRequestModal(null)} setRequestModal={setRequestModal} requestMoreInfo={requestMoreInfo} addAudit={addAudit} />}
    </>
  )

  return typeof document === 'undefined' ? null : createPortal(modals, document.body)
}

function ModalShell({ children, icon, onClose, title, wide = false }: { children: React.ReactNode; icon?: string; onClose: () => void; title: string; wide?: boolean }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal-card polished-modal ${wide ? 'wide' : ''}`} onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">{icon && <span className="modal-title-icon"><AdminIcon name={icon} /></span>}<h3>{title}</h3></div>
          <button type="button" className="close-button" onClick={onClose}>x</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="review-block"><label>{label}</label><p>{value || '-'}</p></div>
}

function getSchemaFields(record: SchemaRecord) {
  const json = record.schemaJson as any
  const fields = record.fields || json?.registrationFields || json?.fields || []
  return fields.map((field: any) => typeof field === 'string' ? field : field.label || field.name).filter(Boolean).join(', ')
}

function ApprovalModal({ item, type, onClose, onConfirm, actions }: any) {
  const record = item as Organization & ApplicationRecord & SchemaRecord

  if (type === 'schema') {
    return (
      <ModalShell title="Schema Review" icon={record.type === 'login' ? 'auth' : 'schema'} onClose={onClose} wide>
        <div className="modal-body-grid">
          <DetailRow label="Schema" value={record.name} />
          <DetailRow label="Status" value={<span className={`status-pill-ui status-${record.status}`}><AdminIcon name={record.status === 'approved' ? 'check' : record.status === 'rejected' ? 'rejected' : 'pending'} />{record.status}</span>} />
          <DetailRow label="Organization" value={`${record.orgName || '-'} - ${record.orgId || '-'}`} />
          <DetailRow label="Application" value={`${record.appName || '-'} - ${record.appId || '-'}`} />
          <DetailRow label="Version" value={record.versionNumber || 1} />
          <DetailRow label="Created" value={record.createdAt} />
        </div>
        {record.type === 'registration' && <DetailRow label="Fields" value={getSchemaFields(record)} />}
        <div className="modal-actions">
          <button type="button" className="ghost-button icon-text-button" onClick={() => actions.setPolicyPreviewModal(record)}><AdminIcon name="view" />View JSON</button>
          {record.status === 'pending' && <button type="button" className="primary-button icon-text-button" onClick={() => onConfirm({ title: 'Approve Schema', message: `Approve schema "${record.name}"?`, onConfirm: () => actions.approveSchema(record) })}><AdminIcon name="check" />Approve</button>}
          {record.status === 'pending' && <button type="button" className="secondary-button danger-button icon-text-button" onClick={() => onConfirm({ title: 'Reject Schema', message: `Reject schema "${record.name}"?`, onConfirm: () => actions.rejectSchema(record) })}><AdminIcon name="rejected" />Reject</button>}
        </div>
      </ModalShell>
    )
  }

  if (type === 'app') {
    return (
      <ModalShell title="Application Review" icon="applications" onClose={onClose}>
        <DetailRow label="Application" value={record.name} />
        <DetailRow label="Organization" value={`${record.orgName || '-'} - ${record.orgId || '-'}`} />
        <DetailRow label="Type" value={record.type} />
        <DetailRow label="Status" value={<span className={`status-pill-ui status-${record.status}`}><AdminIcon name={record.status === 'approved' ? 'check' : record.status === 'rejected' ? 'rejected' : 'pending'} />{record.status}</span>} />
        <DetailRow label="Redirect URI" value={record.redirectUri} />
        <div className="modal-actions">{record.status !== 'approved' && <button type="button" className="primary-button icon-text-button" onClick={() => onConfirm({ title: 'Approve Application', message: `Approve application "${record.name}"?`, onConfirm: () => actions.approveApplication(record) })}><AdminIcon name="check" />Approve</button>}</div>
      </ModalShell>
    )
  }

  return (
    <ModalShell title="Organization Review" icon="organizations" onClose={onClose} wide>
      <div className="modal-body-grid">
        <DetailRow label="Name" value={record.name} />
        <DetailRow label="Type" value={record.type} />
        <DetailRow label="Identifier" value={record.id} />
        <DetailRow label="Status" value={<span className={`status-pill-ui status-${record.status}`}><AdminIcon name={record.status === 'approved' ? 'check' : record.status === 'rejected' ? 'rejected' : 'pending'} />{record.status}</span>} />
        <DetailRow label="Registration Details" value={record.registrationDetails ? JSON.stringify(record.registrationDetails) : '-'} />
        <DetailRow label="Representative" value={record.representative ? `${record.representative.name} - ${record.representative.email} - ${record.representative.mobile}` : '-'} />
      </div>
      <div className="modal-actions">
        {record.status !== 'approved' && record.status !== 'suspended' && <button type="button" className="primary-button icon-text-button" onClick={() => onConfirm({ title: 'Approve Organization', message: `Approve organization "${record.name}"?`, onConfirm: () => actions.approveOrganization(record) })}><AdminIcon name="check" />Approve</button>}
        {record.status === 'pending' && <button type="button" className="secondary-button danger-button icon-text-button" onClick={() => onConfirm({ title: 'Reject Organization', message: `Reject organization "${record.name}"?`, onConfirm: () => actions.rejectOrganization(record) })}><AdminIcon name="rejected" />Reject</button>}
        {record.status === 'pending' && <button type="button" className="ghost-button" onClick={() => actions.setRequestModal({ target: record, open: true })}>Request More Information</button>}
      </div>
    </ModalShell>
  )
}

function AppCredentialModal({ data, onClose }: any) {
  return (
    <ModalShell title="Application Credentials" icon="api" onClose={onClose}>
      <DetailRow label="Application" value={`${data.app?.name || '-'} - ${data.app?.id || '-'}`} />
      <DetailRow label="Client ID" value={<code>{data.clientId}</code>} />
      <DetailRow label="Client Secret" value={<code>{data.clientSecret}</code>} />
      <div className="modal-actions"><button className="secondary-button" onClick={() => navigator.clipboard.writeText(`clientId: ${data.clientId}\nclientSecret: ${data.clientSecret}`)}>Copy</button><button className="primary-button" onClick={onClose}>Close</button></div>
    </ModalShell>
  )
}

function PolicyPreviewModal({ data, onClose }: any) {
  const previewData = data.schemaJson || data.payload || { authenticationMethods: data.authenticationMethods, mfa: data.mfa, mfaMethods: data.mfaMethods, riskAuthentication: data.riskAuthentication, flow: data.flow }
  const json = JSON.stringify(previewData, null, 2)
  return (
    <ModalShell title="Schema JSON Preview" icon={data.type === 'login' ? 'auth' : 'schema'} onClose={onClose} wide>
      <div className="json-modal-meta">
        <span>{data.name || 'Schema'}</span>
        {data.status && <span className={`status-pill-ui status-${data.status}`}><AdminIcon name={data.status === 'approved' ? 'check' : data.status === 'rejected' ? 'rejected' : 'pending'} />{data.status}</span>}
      </div>
      <pre className="modal-json-preview">{json}</pre>
      <div className="modal-actions"><button className="primary-button" onClick={onClose}>Close</button></div>
    </ModalShell>
  )
}

function ConfirmModal({ data, processing, setProcessing, onClose }: any) {
  return (
    <ModalShell title={data.title || 'Confirm'} icon="pending" onClose={() => !processing && onClose()}>
      <p className="confirm-message">{data.message}</p>
      <div className="modal-actions"><button className="secondary-button" disabled={processing} onClick={onClose}>Cancel</button><button className="primary-button" disabled={processing} onClick={async () => { try { setProcessing(true); await data.onConfirm?.() } finally { setProcessing(false); onClose() } }}>{processing ? 'Processing...' : 'Confirm'}</button></div>
    </ModalShell>
  )
}

function PublishSchemaModal({ data, organizations, onClose, setPublishModal, setSchemas, setOrganizations, addAudit }: any) {
  return (
    <ModalShell title="Publish Schema" icon="schema" onClose={onClose}>
      <DetailRow label="Name" value={data.name} />
      <DetailRow label="Fields" value={(data.fields || []).map((field: any) => typeof field === 'string' ? field : field.label).join(', ')} />
      <div className="review-block"><label>Target Organization</label><select defaultValue={data.orgId || 'GLOBAL'} onChange={(e) => setPublishModal((prev: any) => prev ? ({ ...prev, orgId: e.target.value === 'GLOBAL' ? null : e.target.value }) : prev)}><option value="GLOBAL">Global (no org)</option>{organizations.map((org: Organization) => <option key={org.id} value={org.id}>{org.name} - {org.id}</option>)}</select></div>
      <div className="modal-actions"><button className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" onClick={() => { const newSchema = { id: `schema_${Date.now()}`, type: 'registration', name: data.name, orgId: data.orgId || null, orgName: (data.orgId && organizations.find((org: Organization) => org.id === data.orgId)?.name) || 'Unassigned', fields: data.fields, status: 'pending', createdAt: new Date().toLocaleString() }; setSchemas((prev: SchemaRecord[]) => [newSchema, ...prev]); addAudit('Submit Registration Schema', `Submitted registration schema ${newSchema.name} for approval`); if (newSchema.orgId) setOrganizations((prev: Organization[]) => prev.map((org) => org.id === newSchema.orgId ? ({ ...org, registrationSchemas: [...(org.registrationSchemas || []), newSchema] }) : org)); onClose(); alert('Schema submitted for approval') }}>Confirm Publish</button></div>
    </ModalShell>
  )
}

function PublishLoginPolicyModal({ data, organizations, onClose, setLoginPublishModal, setSchemas, addAudit }: any) {
  return (
    <ModalShell title="Publish Login Policy" icon="auth" onClose={onClose}>
      <DetailRow label="Policy" value={data.name} />
      <DetailRow label="Authentication Methods" value={(data.authenticationMethods || []).join(', ')} />
      <div className="review-block"><label>Target Organization</label><select defaultValue={data.orgId || 'GLOBAL'} onChange={(e) => setLoginPublishModal((prev: any) => prev ? ({ ...prev, orgId: e.target.value === 'GLOBAL' ? null : e.target.value }) : prev)}><option value="GLOBAL">Global (no org)</option>{organizations.map((org: Organization) => <option key={org.id} value={org.id}>{org.name} - {org.id}</option>)}</select></div>
      <div className="modal-actions"><button className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" onClick={() => { const schemaEntry = { id: `schema_login_${Date.now()}`, type: 'login', name: data.name, orgId: data.orgId || null, orgName: (data.orgId && organizations.find((org: Organization) => org.id === data.orgId)?.name) || 'Global', payload: { authenticationMethods: data.authenticationMethods, mfa: data.mfa, mfaMethods: data.mfaMethods, riskAuthentication: data.riskAuthentication, flow: data.flow }, status: 'pending', createdAt: new Date().toLocaleString() }; setSchemas((prev: SchemaRecord[]) => [schemaEntry, ...prev]); addAudit('Submit Login Policy', `Submitted login policy ${schemaEntry.name} for approval`); onClose(); alert('Login policy submitted for platform approval') }}>Confirm Publish</button></div>
    </ModalShell>
  )
}

function RequestMoreInfoModal({ data, onClose, setRequestModal, requestMoreInfo, addAudit }: any) {
  return (
    <ModalShell title="Request More Information" icon="notifications" onClose={onClose}>
      <div className="review-block"><label>Message</label><textarea value={data?.message || ''} onChange={(e) => setRequestModal((prev: any) => ({ ...prev, message: e.target.value }))} rows={4} /></div>
      <div className="modal-actions"><button className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" onClick={() => { requestMoreInfo(data.target, data.message || 'Please provide additional documentation'); addAudit('Request More Info', `Requested more info for ${data.target.name || data.target.id}`); onClose() }}>Send</button></div>
    </ModalShell>
  )
}
