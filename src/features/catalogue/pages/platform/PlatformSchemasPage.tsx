'use client'

import { useEffect, useMemo, useState } from 'react'
import { AdminIcon } from '../../../../components/ui'
import type { RegistrationField, SchemaRecord } from '../../../../types/catalogue'
import PlatformLayout from '../../components/PlatformLayout'
import { useCatalogue } from '../../context/CatalogueContext'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'
const POLICY_API_BASE_URL = process.env.NEXT_PUBLIC_POLICY_API_BASE_URL || 'http://localhost:8084'

interface PolicyDecision {
  allow: boolean
  reasons: string[]
  policyPath: string
  details?: { sensitiveFields?: string[] }
}

const toObject = (value: unknown): Record<string, any> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {}
const getSchemaJson = (schema: SchemaRecord) => toObject(schema.schemaJson)
const getConfigurationJson = (schema: SchemaRecord) => toObject(schema.configurationJson)

const getSchemaFields = (schema: SchemaRecord): RegistrationField[] => {
  const schemaJson = getSchemaJson(schema)
  const rawFields = schema.fields || schemaJson.registrationFields || schemaJson.loginFields || schemaJson.fields || []
  return Array.isArray(rawFields)
    ? rawFields.map((field) => typeof field === 'string' ? { name: field, type: 'text' } : field).filter((field) => field?.name)
    : []
}

const hasConsentField = (fields: RegistrationField[]) => fields.some((field) => {
  const name = field.name.toLowerCase()
  return name.includes('consent') || name.includes('terms') || name.includes('privacy')
})

const evaluateSchemaPolicy = async (schema: SchemaRecord): Promise<PolicyDecision> => {
  const fields = getSchemaFields(schema)
  const schemaJson = getSchemaJson(schema)
  const configurationJson = getConfigurationJson(schema)
  const input = {
    schema: {
      type: schema.type === 'login' ? 'LOGIN' : 'REGISTRATION',
      name: schema.name,
      fields,
    },
    application: {
      id: schema.appId,
      name: schema.appName,
      purpose: configurationJson.purpose || schemaJson.purpose || '',
    },
    organization: {
      id: schema.orgId,
      name: schema.orgName,
    },
    consent: {
      required: Boolean(configurationJson.consentRequired || schemaJson.consentRequired || hasConsentField(fields)),
    },
    retention: {
      days: Number(configurationJson.retentionDays || schemaJson.retentionDays || 0) || null,
    },
  }

  const payload = {
    policyPackage: 'identityos.schema_compliance',
    rule: 'decision',
    input,
  }
  let lastError: unknown = null
  for (const baseUrl of [API_BASE_URL, POLICY_API_BASE_URL]) {
    try {
      const response = await fetch(`${baseUrl}/api/v1/policy/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => ({}))
      if (response.ok) return data as PolicyDecision
      lastError = new Error(data.message || `Policy request failed: ${response.status}`)
    } catch (error) {
      lastError = error
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Policy evaluation failed')
}

export default function PlatformSchemasPage() {
  const { approveSchema, refreshCatalogueData, rejectSchema, schemaFilterStatus, schemaSearch, schemas, schemaTab, setOrgApprovalModal, setSchemaFilterStatus, setSchemaSearch, setSchemaTab } = useCatalogue()
  const [policyDecisions, setPolicyDecisions] = useState<Record<string, PolicyDecision>>({})
  const [policyLoading, setPolicyLoading] = useState<Record<string, boolean>>({})
  useEffect(() => { refreshCatalogueData?.() }, [])
  const filtered = useMemo(() => schemas.filter((schema) => {
    if (schemaTab === 'registration' && schema.type !== 'registration') return false
    if (schemaTab === 'login' && schema.type !== 'login') return false
    if (schemaFilterStatus !== 'All' && schema.status !== schemaFilterStatus.toLowerCase()) return false
    const query = schemaSearch.trim().toLowerCase()
    return !query || (schema.name || '').toLowerCase().includes(query) || (schema.orgName || '').toLowerCase().includes(query) || (schema.id || '').toLowerCase().includes(query)
  }), [schemaFilterStatus, schemaSearch, schemaTab, schemas])
  useEffect(() => {
    filtered.forEach((schema) => {
      const key = schema.versionId || schema.id
      if (policyDecisions[key] || policyLoading[key]) return
      setPolicyLoading((prev) => ({ ...prev, [key]: true }))
      evaluateSchemaPolicy(schema)
        .then((decision) => setPolicyDecisions((prev) => ({ ...prev, [key]: decision })))
        .catch((error) => setPolicyDecisions((prev) => ({
          ...prev,
          [key]: { allow: false, reasons: [error instanceof Error ? error.message : 'Policy evaluation unavailable'], policyPath: 'identityos/schema_compliance/decision' },
        })))
        .finally(() => setPolicyLoading((prev) => ({ ...prev, [key]: false })))
    })
  }, [filtered, policyDecisions, policyLoading])
  const statusIcon = (status: string) => status === 'approved' ? 'check' : status === 'rejected' ? 'rejected' : 'pending'
  return (
    <PlatformLayout title="Identity OS - Schema Approvals" heading="Schema Approvals">
      <div className="panel-copy"><p>Review and approve schema definitions and login policies submitted by organizations.</p></div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,marginBottom:12}}>
        <div className="tab-row" style={{margin:0}}><button className={`tab ${schemaTab === 'registration' ? 'active' : ''}`} onClick={() => setSchemaTab('registration')}>Registration Schemas</button><button className={`tab ${schemaTab === 'login' ? 'active' : ''}`} onClick={() => setSchemaTab('login')}>Login Policies</button><button className={`tab ${schemaTab === 'all' ? 'active' : ''}`} onClick={() => setSchemaTab('all')}>All</button></div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}><input placeholder="Search by name or org" value={schemaSearch} onChange={(e) => setSchemaSearch(e.target.value)} style={{minWidth:220}} /><select value={schemaFilterStatus} onChange={(e) => setSchemaFilterStatus(e.target.value)}><option>All</option><option>Pending</option><option>Approved</option><option>Rejected</option></select></div>
      </div>
      <div className="approval-list schema-list">{filtered.map((schema) => {
        const policyKey = schema.versionId || schema.id
        const policy = policyDecisions[policyKey]
        return <div key={`${schema.id}-${schema.versionId || schema.createdAt}`} className="approval-card schema-policy-card">
          <div>
            <div className="approval-name-row"><div className="approval-name">{schema.name}</div><span className={`status-pill-ui status-${schema.status}`}><AdminIcon name={statusIcon(schema.status)} />{schema.status}</span></div>
            <div className="approval-meta">{schema.orgName} - {schema.appName || schema.appId || 'Application'} - v{schema.versionNumber || 1} - {schema.type === 'login' ? 'Login Policy' : 'Registration Schema'}</div>
            <div className={`dpdp-policy-box ${policy?.allow ? 'passed' : 'failed'}`}>
              <div className="dpdp-policy-heading">
                <span className={`status-pill-ui ${policy?.allow ? 'status-approved' : 'status-pending'}`}><AdminIcon name={policy?.allow ? 'check' : 'pending'} />{policyLoading[policyKey] ? 'Evaluating DPDP Policy' : policy?.allow ? 'DPDP Policy Passed' : 'DPDP Review Required'}</span>
                <small>{policy?.policyPath || 'identityos/schema_compliance/decision'}</small>
              </div>
              {policy?.details?.sensitiveFields?.length ? <p>Sensitive fields: {policy.details.sensitiveFields.join(', ')}</p> : null}
              {policy?.reasons?.length ? <ul>{policy.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul> : <p>No DPDP policy issues detected.</p>}
            </div>
          </div>
          <div className="approval-actions"><button type="button" className="ghost-button icon-text-button" onClick={() => setOrgApprovalModal({ type: 'schema', item: schema })}><AdminIcon name="view" />View</button>{schema.status === 'pending' && <button type="button" className="primary-button icon-text-button" onClick={async () => approveSchema(schema)}><AdminIcon name="check" />Approve</button>}{schema.status === 'pending' && <button type="button" className="secondary-button danger-button icon-text-button" onClick={async () => rejectSchema(schema)}><AdminIcon name="rejected" />Reject</button>}</div>
        </div>
      })}{!filtered.length && <div className="empty-state">No schema approval records found for this filter.</div>}</div>
    </PlatformLayout>
  )
}
