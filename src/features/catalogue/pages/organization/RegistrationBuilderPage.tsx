'use client'

import { useState } from 'react'
import OrgSidebar from '../../components/OrgSidebar'
import { useCatalogue } from '../../context/CatalogueContext'
import { readStorage } from '../../../../utils/storage'
import type { RegistrationField, SchemaRecord } from '../../../../types/catalogue'

export default function RegistrationBuilderPage() {
  const { currentOrg, setPublishModal, setView } = useCatalogue()
  const [fields, setFields] = useState<RegistrationField[]>(() => {
    try { return JSON.parse(readStorage('registration_builder') || 'null') || [{ name: 'fullName', label: 'Full Name', type: 'text', required: true }] } catch { return [{ name: 'fullName', label: 'Full Name', type: 'text', required: true }] }
  })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const persist = (next: RegistrationField[]) => { setFields(next); localStorage.setItem('registration_builder', JSON.stringify(next)) }
  const addField = (type: string) => persist([...fields, { name: `${type}_${Date.now().toString().slice(-4)}`, label: type.charAt(0).toUpperCase() + type.slice(1), type, required: false }])
  const updateField = (idx: number, patch: Partial<RegistrationField>) => persist(fields.map((field, index) => index === idx ? { ...field, ...patch } : field))
  const removeField = (idx: number) => persist(fields.filter((_, index) => index !== idx))
  const moveUp = (idx: number) => { if (idx === 0) return; const copy = [...fields]; [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]]; persist(copy) }

  return (
    <div className="org-dashboard-shell org-console-shell">
      <OrgSidebar activeItem="Registration Builder" />
      <main className="org-main org-console-main">
        <header className="org-console-topbar"><div className="org-console-title"><div className="eyebrow">Organization Admin</div><h1>Registration Form Builder</h1></div><button type="button" className="secondary-button" onClick={() => setView('organization-dashboard')}>Back to Dashboard</button></header>
        <section className="org-console-content builder-console-content">
      <div className="builder-grid">
        <div className="builder-palette form-card"><h4>Available Fields</h4>{['text','email','phone','password','date','dropdown','checkbox','address','file','gov-id','custom'].map((type) => <button key={type} className="ghost-button" draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', type)} onClick={() => addField(type)}>{type}</button>)}</div>
        <div className="builder-preview form-card" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const type = e.dataTransfer.getData('text/plain'); if (type) addField(type) }}><h4>Live Preview</h4><form>{fields.map((field) => <div key={field.name} className="field-row"><span className="drag-handle" title="Drag to reorder" /><div className="control-wrap" style={{flex:1}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}><label style={{ display: 'block', fontSize: 12, opacity: 0.9, fontWeight:600 }}>{field.label}{field.required ? ' *' : ''}</label><span className="field-type-chip">{(field.type || 'text').toUpperCase()}</span></div>{field.type === 'dropdown' ? <select>{(field.options || ['Option 1']).map((option, index) => <option key={index}>{option}</option>)}</select> : field.type === 'checkbox' ? <input type="checkbox" /> : <input placeholder={field.label} />}</div></div>)}</form><div style={{marginTop:12}}><h5>Generated JSON</h5><pre style={{whiteSpace:'pre-wrap',maxHeight:200,overflow:'auto',background:'#071127',padding:12,borderRadius:8}}>{JSON.stringify({ registrationFields: fields }, null, 2)}</pre></div></div>
        <div className="builder-config form-card"><h4>Field Configuration</h4>{fields.length === 0 ? <p>No fields. Add one from left.</p> : <><div style={{display:'flex',gap:8}}>{fields.map((field, idx) => <button key={field.name} className={`ghost-button ${selectedIndex === idx ? 'active' : ''}`} onClick={() => setSelectedIndex(idx)}>{field.label}</button>)}</div><div style={{marginTop:12}}><label>Field Label<input value={fields[selectedIndex]?.label || ''} onChange={(e) => updateField(selectedIndex, { label: e.target.value })} /></label><label>Field Name<input value={fields[selectedIndex]?.name || ''} onChange={(e) => updateField(selectedIndex, { name: e.target.value })} /></label><label>Required<select value={fields[selectedIndex]?.required ? 'yes' : 'no'} onChange={(e) => updateField(selectedIndex, { required: e.target.value === 'yes' })}><option value="no">Optional</option><option value="yes">Required</option></select></label><div style={{display:'flex',gap:8,marginTop:8}}><button className="secondary-button" onClick={() => moveUp(selectedIndex)}>Move Up</button><button className="secondary-button" onClick={() => removeField(selectedIndex)}>Remove</button></div></div><div style={{marginTop:12,display:'flex',flexDirection:'column',gap:8}}><input placeholder="Schema name (e.g., Customer Signup)" defaultValue={readStorage('registration_builder_schema_name') || ''} onChange={(e) => localStorage.setItem('registration_builder_schema_name', e.target.value)} /><div style={{display:'flex',gap:8}}><button className="primary-button" onClick={() => { localStorage.setItem('registration_builder', JSON.stringify(fields)); alert('Saved registration form schema to localStorage') }}>Save Draft</button><button className="ghost-button" onClick={() => { const schemaName = localStorage.getItem('registration_builder_schema_name') || `Schema_${Date.now()}`; const preview: SchemaRecord = { id: `schema_preview_${Date.now()}`, type: 'registration', name: schemaName, orgId: null, orgName: currentOrg?.name || 'Unassigned', fields, status: 'preview', createdAt: new Date().toLocaleString() }; setPublishModal(preview) }}>Publish</button></div></div></>}</div>
      </div>
        </section>
      </main>
    </div>
  )
}
