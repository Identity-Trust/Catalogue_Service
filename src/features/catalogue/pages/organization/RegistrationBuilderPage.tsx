'use client'

import { useEffect, useMemo, useState } from 'react'
import { AdminIcon } from '../../../../components/ui'
import type { RegistrationField } from '../../../../types/catalogue'
import { readStorage } from '../../../../utils/storage'
import OrgSidebar from '../../components/OrgSidebar'
import OrgTopbar from '../../components/OrgTopbar'
import { useCatalogue } from '../../context/CatalogueContext'

const fieldTypes = ['text', 'email', 'phone', 'password', 'date', 'dropdown', 'checkbox', 'address', 'file', 'gov-id', 'custom']
const schemaEndpointHint = 'Schema API is not available on the running backend. Restart onboarding-and-identity-service with the latest code, then submit again.'
const filters = ['All', 'Pending', 'Approved', 'Rejected']

const parseDropdownOptions = (value: string) => value
  .split(/\r?\n|,/)
  .map((option) => option.trim())
  .filter(Boolean)

export default function RegistrationBuilderPage() {
  const { applications, currentOrg, orgLoginId, refreshCatalogueData, schemas, setPolicyPreviewModal, setView, submitIdentitySchemaVersion } = useCatalogue()
  const orgId = currentOrg?.id || orgLoginId
  const orgApps = useMemo(() => applications.filter((app) => app.orgId === orgId && app.status === 'approved'), [applications, orgId])
  const registrationSchemas = schemas.filter((schema: any) => schema.orgId === orgId && schema.type === 'registration')
  const [fields, setFields] = useState<RegistrationField[]>(() => {
    try { return JSON.parse(readStorage('registration_builder') || 'null') || [{ name: 'fullName', label: 'Full Name', type: 'text', required: true }] } catch { return [{ name: 'fullName', label: 'Full Name', type: 'text', required: true }] }
  })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [schemaName, setSchemaName] = useState(() => readStorage('registration_builder_schema_name') || 'Customer Registration')
  const [selectedAppId, setSelectedAppId] = useState(() => orgApps[0]?.id || '')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [statusFilter, setStatusFilter] = useState('All')
  useEffect(() => { refreshCatalogueData?.() }, [])
  useEffect(() => { if (!selectedAppId && orgApps[0]?.id) setSelectedAppId(orgApps[0].id) }, [orgApps, selectedAppId])

  const persist = (next: RegistrationField[]) => { setFields(next); localStorage.setItem('registration_builder', JSON.stringify(next)) }
  const addField = (type: string) => persist([...fields, { name: `${type}_${Date.now().toString().slice(-4)}`, label: type.charAt(0).toUpperCase() + type.slice(1), type, required: false, options: type === 'dropdown' ? ['Option 1', 'Option 2'] : undefined }])
  const updateField = (idx: number, patch: Partial<RegistrationField>) => persist(fields.map((field, index) => index === idx ? { ...field, ...patch } : field))
  const removeField = (idx: number) => { const next = fields.filter((_, index) => index !== idx); persist(next); setSelectedIndex(Math.max(0, Math.min(selectedIndex, next.length - 1))) }
  const moveUp = (idx: number) => { if (idx === 0) return; const copy = [...fields]; [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]]; persist(copy); setSelectedIndex(idx - 1) }
  const submitSchema = async (submitForApproval: boolean) => {
    if (!selectedAppId) { setMessage('Select an approved application first.'); return }
    setSaving(true)
    setMessage('')
    try {
      await submitIdentitySchemaVersion({
        applicationId: selectedAppId,
        schemaType: 'REGISTRATION',
        schemaName,
        schemaJson: { registrationFields: fields },
        configurationJson: { layout: 'single-page', versionedBy: 'organization-admin' },
        changeSummary: submitForApproval ? 'Submitted registration page schema for approval' : 'Saved registration page draft',
        submitForApproval,
      })
      await refreshCatalogueData?.()
      localStorage.setItem('registration_builder_schema_name', schemaName)
      setStatusFilter(submitForApproval ? 'Pending' : 'All')
      setMessage(submitForApproval ? 'Registration schema submitted for platform approval.' : 'Registration schema draft saved.')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unable to save schema.'
      setMessage(errorMessage.includes('/schemas') || errorMessage.includes('404') ? schemaEndpointHint : errorMessage)
    } finally {
      setSaving(false)
    }
  }
  const filteredRegistrationSchemas = registrationSchemas.filter((schema: any) => statusFilter === 'All' || schema.status === statusFilter.toLowerCase())

  return (
    <div className="org-dashboard-shell org-console-shell">
      <OrgSidebar activeItem="Registration Builder" />
      <main className="org-main org-console-main">
        <OrgTopbar heading="Registration Page Schema" action={<button type="button" className="secondary-button" onClick={() => setView('organization-dashboard')}>Back to Dashboard</button>} />
        <section className="org-console-content builder-console-content">
          <div className="schema-builder-header">
            <div><span className="eyebrow">Application schema</span><h2>Registration Page Builder</h2><p>Design the registration fields used by one approved application.</p><span className="status-pill-ui status-pending builder-approval-pill"><AdminIcon name="pending" />Platform approval required</span></div>
            <div className="schema-builder-actions"><button className="secondary-button icon-text-button" disabled={saving} onClick={() => submitSchema(false)}><AdminIcon name="schema" />Save Draft</button><button className="primary-button icon-text-button" disabled={saving} onClick={() => submitSchema(true)}><AdminIcon name="check" />Submit for Approval</button></div>
          </div>
          {!orgApps.length && <div className="builder-message warning">No approved application is available. Approve an application first, then create its registration schema.</div>}
          <div className="schema-config-strip">
            <label>Application<select value={selectedAppId} onChange={(event) => setSelectedAppId(event.target.value)}><option value="">Select application</option>{orgApps.map((app) => <option key={app.id} value={app.id}>{app.name} - {app.id}</option>)}</select></label>
            <label>Schema Name<input value={schemaName} onChange={(event) => setSchemaName(event.target.value)} /></label>
          </div>
          {message && <div className="builder-message">{message}</div>}
          <div className="builder-grid schema-builder-grid">
            <div className="builder-palette form-card"><h4>Available Fields</h4>{fieldTypes.map((type) => <button key={type} className="ghost-button icon-text-button" draggable onDragStart={(event) => event.dataTransfer.setData('text/plain', type)} onClick={() => addField(type)}><AdminIcon name="schema" />{type}</button>)}</div>
            <div className="builder-preview form-card" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const type = event.dataTransfer.getData('text/plain'); if (type) addField(type) }}><h4>Live Registration Preview</h4><form>{fields.map((field, index) => <div key={field.name} className={`field-row ${selectedIndex === index ? 'selected' : ''}`} onClick={() => setSelectedIndex(index)}><span className="drag-handle" title="Drag to reorder" /><div className="control-wrap" style={{flex:1}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}><label style={{ display: 'block', fontSize: 12, opacity: 0.9, fontWeight:600 }}>{field.label}{field.required ? ' *' : ''}</label><span className="field-type-chip">{(field.type || 'text').toUpperCase()}</span></div>{field.type === 'dropdown' ? <select>{(field.options || ['Option 1']).map((option, optionIndex) => <option key={optionIndex}>{option}</option>)}</select> : field.type === 'checkbox' ? <input type="checkbox" /> : <input placeholder={field.label} />}</div></div>)}</form><div className="json-preview"><h5>Generated JSON</h5><pre>{JSON.stringify({ registrationFields: fields }, null, 2)}</pre></div></div>
            <div className="builder-config form-card"><h4>Field Configuration</h4>{fields.length === 0 ? <p>No fields. Add one from left.</p> : <><div className="field-chip-list">{fields.map((field, idx) => <button key={field.name} className={`ghost-button ${selectedIndex === idx ? 'active' : ''}`} onClick={() => setSelectedIndex(idx)}>{field.label}</button>)}</div><div className="field-config-form"><label>Field Label<input value={fields[selectedIndex]?.label || ''} onChange={(event) => updateField(selectedIndex, { label: event.target.value })} /></label><label>Field Name<input value={fields[selectedIndex]?.name || ''} onChange={(event) => updateField(selectedIndex, { name: event.target.value })} /></label><label>Required<select value={fields[selectedIndex]?.required ? 'yes' : 'no'} onChange={(event) => updateField(selectedIndex, { required: event.target.value === 'yes' })}><option value="no">Optional</option><option value="yes">Required</option></select></label>{fields[selectedIndex]?.type === 'dropdown' && <label>Dropdown Options<textarea value={(fields[selectedIndex]?.options || []).join('\n')} onChange={(event) => updateField(selectedIndex, { options: parseDropdownOptions(event.target.value) })} placeholder="One option per line, or comma separated" rows={5} /></label>}<div className="field-action-row"><button className="secondary-button" onClick={() => moveUp(selectedIndex)}>Move Up</button><button className="secondary-button danger-button" onClick={() => removeField(selectedIndex)}>Remove</button></div></div></>}</div>
          </div>
          <section className="schema-history-panel">
            <div className="panel-heading"><h3>Registration Schemas</h3><span>{registrationSchemas.length} versions</span></div>
            <div className="tab-row">{filters.map((filter) => <button key={filter} type="button" className={`tab ${statusFilter === filter ? 'active' : ''}`} onClick={() => setStatusFilter(filter)}>{filter}</button>)}</div>
            <div className="schema-status-list">
              {filteredRegistrationSchemas.length ? filteredRegistrationSchemas.map((schema: any) => (
                <article key={schema.versionId || schema.id} className="schema-status-card">
                  <div><div className="approval-name-row"><strong>{schema.name}</strong><span className={`status-pill-ui status-${schema.status}`}><AdminIcon name={schema.status === 'approved' ? 'check' : schema.status === 'rejected' ? 'rejected' : 'pending'} />{schema.status}</span></div><p>{schema.appName || schema.appId || 'Application'} - Version {schema.versionNumber || 1}</p></div>
                  <div className="schema-card-actions"><button type="button" className="ghost-button icon-text-button" onClick={() => setPolicyPreviewModal(schema)}><AdminIcon name="view" />View JSON</button><small>{schema.createdAt}</small></div>
                </article>
              )) : <div className="empty-state">No registration schemas found for this filter.</div>}
            </div>
          </section>
        </section>
      </main>
    </div>
  )
}
