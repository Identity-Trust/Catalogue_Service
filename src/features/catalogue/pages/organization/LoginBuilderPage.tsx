'use client'

import { useState } from 'react'
import PageHeader from '../../components/PageHeader'
import { useCatalogue } from '../../context/CatalogueContext'
import { readStorage } from '../../../../utils/storage'

const authOptions = [
  { key: 'PASSWORD', label: 'Username + Password' },
  { key: 'EMAIL_PASSWORD', label: 'Email + Password' },
  { key: 'MOBILE_OTP', label: 'Mobile OTP' },
  { key: 'EMAIL_OTP', label: 'Email OTP' },
  { key: 'BIOMETRIC', label: 'Biometric' },
  { key: 'SOCIAL', label: 'Social Login' },
  { key: 'HARDWARE', label: 'Hardware Token' },
]

export default function LoginBuilderPage() {
  const { currentOrg, loginPolicies, setLoginPublishModal, setView } = useCatalogue()
  const [selectedMethods, setSelectedMethods] = useState<string[]>(() => { try { const raw = readStorage('catalogue_login_builder_methods'); return raw ? JSON.parse(raw) : ['PASSWORD'] } catch { return ['PASSWORD'] } })
  const [flowSteps, setFlowSteps] = useState<string[]>(() => { try { const raw = readStorage('catalogue_login_builder_flow'); return raw ? JSON.parse(raw) : ['Identifier','Identity Lookup','Authentication Verification','MFA Check','Success'] } catch { return ['Identifier','Identity Lookup','Authentication Verification','MFA Check','Success'] } })
  const [mfaEnabled, setMfaEnabled] = useState(() => { try { const raw = readStorage('catalogue_login_builder_mfa'); return raw ? JSON.parse(raw) : true } catch { return true } })
  const [mfaMethods, setMfaMethods] = useState<string[]>(() => { try { const raw = readStorage('catalogue_login_builder_mfa_methods'); return raw ? JSON.parse(raw) : ['OTP'] } catch { return ['OTP'] } })
  const [riskAuth, setRiskAuth] = useState(() => { try { const raw = readStorage('catalogue_login_builder_risk'); return raw ? JSON.parse(raw) : false } catch { return false } })
  const [policyName, setPolicyName] = useState(() => readStorage('catalogue_login_builder_policy_name') || `Login Policy ${new Date().toLocaleDateString()}`)
  const persistMethods = (next: string[]) => { setSelectedMethods(next); localStorage.setItem('catalogue_login_builder_methods', JSON.stringify(next)) }
  const persistFlow = (next: string[]) => { setFlowSteps(next); localStorage.setItem('catalogue_login_builder_flow', JSON.stringify(next)) }
  const toggleMethod = (key: string) => persistMethods(selectedMethods.includes(key) ? selectedMethods.filter((item) => item !== key) : [...selectedMethods, key])
  const toggleMfaMethod = (method: string) => { const next = mfaMethods.includes(method) ? mfaMethods.filter((item) => item !== method) : [...mfaMethods, method]; setMfaMethods(next); localStorage.setItem('catalogue_login_builder_mfa_methods', JSON.stringify(next)) }
  const moveStep = (idx: number, dir: number) => { const copy = [...flowSteps]; const [step] = copy.splice(idx, 1); copy.splice(idx + dir, 0, step); persistFlow(copy) }
  const generatedJSON = JSON.stringify({ authenticationMethods: selectedMethods, mfa: mfaEnabled, mfaMethods, riskAuthentication: riskAuth, flow: flowSteps }, null, 2)

  return (
    <section className="panel-page">
      <PageHeader title="Login Page Builder" onBack={() => setView('home')} />
      <div className="builder-grid">
        <div className="builder-palette form-card"><h4>Authentication Methods</h4>{authOptions.map((option) => <label key={option.key} style={{display:'block',marginBottom:8}}><input type="checkbox" checked={selectedMethods.includes(option.key)} onChange={() => toggleMethod(option.key)} /> {option.label}</label>)}<div style={{marginTop:12}}><h5>MFA</h5><label style={{display:'block'}}><input type="checkbox" checked={mfaEnabled} onChange={(e) => { setMfaEnabled(e.target.checked); localStorage.setItem('catalogue_login_builder_mfa', JSON.stringify(e.target.checked)) }} /> Enable MFA</label>{mfaEnabled && <div style={{marginTop:8}}>{['OTP','AUTH_APP','BIOMETRIC'].map((method) => <label key={method} style={{display:'block'}}><input type="checkbox" checked={mfaMethods.includes(method)} onChange={() => toggleMfaMethod(method)} /> {method}</label>)}</div>}<div style={{marginTop:12}}><label style={{display:'block'}}>Risk-based Authentication<input type="checkbox" checked={riskAuth} onChange={(e) => { setRiskAuth(e.target.checked); localStorage.setItem('catalogue_login_builder_risk', JSON.stringify(e.target.checked)) }} /></label></div></div></div>
        <div className="builder-preview form-card"><h4>Login Flow Builder</h4><div style={{display:'flex',flexDirection:'column',gap:8}}>{flowSteps.map((step, idx) => <div key={step} className="field-row" style={{alignItems:'center'}}><span className="drag-handle" title="Drag to reorder" /><div className="control-wrap" style={{flex:1}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}><div>{idx + 1}. <strong>{step}</strong></div><span className="field-type-chip">STEP</span></div></div><div style={{display:'flex',gap:8}}><button className="ghost-button" onClick={() => idx > 0 && moveStep(idx, -1)}>Up</button><button className="ghost-button" onClick={() => idx < flowSteps.length - 1 && moveStep(idx, 1)}>Down</button><button className="ghost-button" onClick={() => persistFlow(flowSteps.filter((_, index) => index !== idx))}>Remove</button></div></div>)}<div style={{display:'flex',gap:8}}><input placeholder="New step" id="newFlowStepInput" /><button className="ghost-button" onClick={() => { const input = document.getElementById('newFlowStepInput') as HTMLInputElement | null; const value = input?.value.trim(); if (!value) return; persistFlow([...flowSteps, value]); input.value = '' }}>Add Step</button></div></div></div>
        <div className="builder-config form-card"><h4>Policy Configuration</h4><label>Policy Name<input value={policyName} onChange={(e) => { setPolicyName(e.target.value); localStorage.setItem('catalogue_login_builder_policy_name', e.target.value) }} /></label><div style={{marginTop:12}}><h5>Preview Policy JSON</h5><pre style={{background:'#071127',padding:12,borderRadius:8,maxHeight:300,overflow:'auto'}}>{generatedJSON}</pre></div><div style={{display:'flex',gap:8,marginTop:12}}><button className="primary-button" onClick={() => { localStorage.setItem('catalogue_login_builder_draft', JSON.stringify({ id: `draft_${Date.now()}`, name: policyName, authenticationMethods: selectedMethods, mfa: mfaEnabled, mfaMethods, riskAuthentication: riskAuth, flow: flowSteps, orgId: currentOrg?.id || null, createdAt: new Date().toLocaleString() })); alert('Draft saved locally') }}>Save Draft</button><button className="ghost-button" onClick={() => setLoginPublishModal({ id: `policy_${Date.now()}`, name: policyName, authenticationMethods: selectedMethods, mfa: mfaEnabled, mfaMethods, riskAuthentication: riskAuth, flow: flowSteps, orgId: currentOrg?.id || null, createdAt: new Date().toLocaleString() })}>Publish</button></div><div style={{marginTop:12}}><h5>Existing Policies</h5><ul>{loginPolicies.map((policy) => <li key={policy.id}><strong>{policy.name}</strong> - {policy.orgId || 'Global'} - {policy.createdAt}</li>)}</ul></div></div>
      </div>
    </section>
  )
}
