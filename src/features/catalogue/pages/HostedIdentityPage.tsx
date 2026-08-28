'use client'

import { useEffect, useMemo, useState } from 'react'
import { AdminIcon } from '../../../components/ui'

type HostedMode = 'register' | 'login' | 'choice'

interface HostedIdentityPageProps {
  initialClientId?: string
  initialRedirectUri?: string
  mode: HostedMode
}

interface HostedApplication {
  id: string
  internalId?: string
  clientId?: string
  orgId?: string
  orgName?: string
  name: string
  type?: string
  redirectUri?: string
  status: string
}

interface HostedSchema {
  id: string
  versionId?: string
  appId?: string
  appName?: string
  name: string
  type: 'registration' | 'login'
  schemaJson?: any
  status: string
  versionNumber?: number
}

interface HostedField {
  name: string
  label?: string
  type: string
  required?: boolean
  options?: string[]
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'

const readJsonStorage = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const safeJson = (value: any) => {
  if (!value) return null
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

const normalizeApp = (app: any): HostedApplication => ({
  id: app.applicationId || app.id,
  internalId: app.id,
  clientId: app.clientId,
  orgId: app.organizationId || app.orgId,
  orgName: app.organizationName || app.orgName || '',
  name: app.applicationName || app.name || app.applicationId || app.id,
  type: app.applicationType || app.type,
  redirectUri: app.redirectUri,
  status: app.status === 'ACTIVE' || app.status === 'approved' ? 'approved' : app.status === 'SUSPENDED' || app.status === 'rejected' ? 'rejected' : 'pending',
})

const normalizeSchema = (schema: any): HostedSchema => ({
  id: schema.schemaId || schema.id,
  versionId: schema.versionId,
  appId: schema.applicationId || schema.appId,
  appName: schema.applicationName || schema.appName,
  name: schema.schemaName || schema.name,
  type: schema.schemaType === 'LOGIN' || schema.type === 'login' ? 'login' : 'registration',
  schemaJson: safeJson(schema.schemaJson) || schema.schemaJson,
  status: schema.status === 'APPROVED' || schema.status === 'PUBLISHED' || schema.status === 'approved' ? 'approved' : schema.status === 'REJECTED' || schema.status === 'rejected' ? 'rejected' : 'pending',
  versionNumber: schema.versionNumber,
})

const appKeys = (app?: HostedApplication) =>
  app ? [app.id, app.clientId, app.internalId].filter(Boolean) : []

const getApprovedSchema = (schemas: HostedSchema[], app: HostedApplication | undefined, type: 'registration' | 'login') => {
  const keys = appKeys(app)
  return schemas.find((schema) => Boolean(schema.appId && keys.includes(schema.appId)) && schema.type === type && schema.status === 'approved')
}

const getRegistrationFields = (schema?: HostedSchema): HostedField[] => {
  const fields = schema?.schemaJson?.registrationFields || schema?.schemaJson?.fields
  return Array.isArray(fields) && fields.length ? fields : []
}

const getLoginFields = (schema?: HostedSchema): HostedField[] => {
  if (!schema) return []
  const configuredFields = schema.schemaJson?.loginFields || schema.schemaJson?.fields
  if (Array.isArray(configuredFields) && configuredFields.length) return configuredFields
  return []
}

const hostedAppKey = (app: HostedApplication) => app.clientId || app.id || app.internalId || ''

const redirectWithParams = (redirectUri: string, params: Record<string, string>) => {
  const url = new URL(redirectUri)
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value))
  window.location.href = url.toString()
}

export default function HostedIdentityPage({ initialClientId = '', initialRedirectUri = '', mode }: HostedIdentityPageProps) {
  const [clientId, setClientId] = useState(initialClientId)
  const [redirectUri, setRedirectUri] = useState(initialRedirectUri)
  const [applications, setApplications] = useState<HostedApplication[]>([])
  const [schemas, setSchemas] = useState<HostedSchema[]>([])
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setClientId(initialClientId || params.get('client_id') || '')
    setRedirectUri(initialRedirectUri || params.get('redirect_uri') || '')
  }, [initialClientId, initialRedirectUri])

  useEffect(() => {
    const loadHostedData = async () => {
      setLoading(true)
      setMessage('')
      try {
        const [appsResponse, schemasResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/v1/onboarding/applications`),
          fetch(`${API_BASE_URL}/api/v1/onboarding/schemas`),
        ])
        const backendApps = appsResponse.ok ? await appsResponse.json() : []
        const backendSchemas = schemasResponse.ok ? await schemasResponse.json() : []
        const saved = readJsonStorage<any>('catalogue_state_v1', {})
        setApplications([
          ...backendApps.map(normalizeApp),
          ...(saved.applications || []).map(normalizeApp),
        ].filter((app, index, all) => all.findIndex((item) => hostedAppKey(item) === hostedAppKey(app)) === index))
        setSchemas([
          ...backendSchemas.map(normalizeSchema),
          ...(saved.schemas || []).map(normalizeSchema),
        ].filter((schema, index, all) => all.findIndex((item) => (item.versionId || item.id) === (schema.versionId || schema.id)) === index))
      } catch {
        const saved = readJsonStorage<any>('catalogue_state_v1', {})
        setApplications((saved.applications || []).map(normalizeApp))
        setSchemas((saved.schemas || []).map(normalizeSchema))
      } finally {
        setLoading(false)
      }
    }

    loadHostedData()
  }, [])

  useEffect(() => {
    if (!clientId) return
    const loadApplication = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/onboarding/applications/client/${encodeURIComponent(clientId)}`)
        if (!response.ok) return
        const application = normalizeApp(await response.json())
        setApplications((prev) => [application, ...prev.filter((item) => item.id !== application.id && item.clientId !== application.clientId)])
      } catch {
        // Keep the list loaded from the bulk endpoint or local state.
      }
    }

    loadApplication()
  }, [clientId])

  const app = useMemo(() => applications.find((item) => appKeys(item).includes(clientId)), [applications, clientId])
  const callbackUri = redirectUri || app?.redirectUri || ''
  const registrationSchema = getApprovedSchema(schemas, app, 'registration')
  const loginSchema = getApprovedSchema(schemas, app, 'login')
  const currentMode = mode === 'choice' ? 'choice' : mode
  const fields = currentMode === 'register' ? getRegistrationFields(registrationSchema) : getLoginFields(loginSchema)
  const schemaMissing = Boolean(app && currentMode === 'register' && !registrationSchema) || Boolean(app && currentMode === 'login' && !loginSchema)
  const fieldsMissing = Boolean(app && currentMode === 'login' && loginSchema && fields.length === 0)

  const updateField = (name: string, value: string) => setFormValues((prev) => ({ ...prev, [name]: value }))
  const submit = async () => {
    if (!app) {
      setMessage('Application was not found. Use the public application id shown in Identity OS, for example app_xxxxx.')
      return
    }
    if (!callbackUri) {
      setMessage('Redirect URI is missing for this application.')
      return
    }
    const missing = fields.find((field) => field.required && !String(formValues[field.name] || '').trim())
    if (missing) {
      setMessage(`${missing.label || missing.name} is required.`)
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const users = readJsonStorage<Record<string, any[]>>('identity_os_demo_users_v1', {})
      const appUsers = users[app.id] || []
      const username = formValues.username || formValues.email

      if (currentMode === 'register') {
        if (appUsers.some((user) => user.username === username)) {
          setMessage('Username already exists for this application.')
          return
        }
        const nextUsers = { ...users, [app.id]: [{ ...formValues, username, createdAt: new Date().toISOString() }, ...appUsers] }
        localStorage.setItem('identity_os_demo_users_v1', JSON.stringify(nextUsers))
        redirectWithParams(callbackUri, {
          registered: 'true',
          client_id: clientId,
          username,
        })
        return
      }

      const matchedUser = appUsers.find((user) => user.username === formValues.username && user.password === formValues.password)
      if (!matchedUser) {
        setMessage('Invalid username or password for this application.')
        return
      }
      redirectWithParams(callbackUri, {
        access_token: `demo_token_${Date.now()}`,
        token_type: 'Bearer',
        client_id: clientId,
        username: formValues.username,
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="hosted-identity-shell"><div className="hosted-card"><p>Loading Identity OS configuration...</p></div></div>

  if (mode === 'choice') {
    return (
      <div className="hosted-identity-shell">
        <section className="hosted-card hosted-choice-card">
          <span className="hosted-brand"><AdminIcon name="shield" />Identity OS</span>
          <h1>{app?.name || 'Choose Identity Flow'}</h1>
          <p>This request includes a client id, but no flow. Choose whether the user clicked Register or Login.</p>
          <div className="hosted-actions">
            <a className="primary-button" href={`/identity/register?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(callbackUri)}`}>Open Registration</a>
            <a className="secondary-button" href={`/identity/login?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(callbackUri)}`}>Open Login</a>
          </div>
          {!app && <div className="hosted-warning">Application not found for client id <code>{clientId || '-'}</code>.</div>}
        </section>
      </div>
    )
  }

  return (
    <div className="hosted-identity-shell">
      <section className="hosted-card">
        <div className="hosted-header">
          <span className="hosted-brand"><AdminIcon name="shield" />Identity OS</span>
          <span className="status-pill-ui status-approved">{app?.status || 'unknown'}</span>
        </div>
        <div className="hosted-app-summary">
          <span className="hosted-app-icon">{(app?.name || 'A').charAt(0).toUpperCase()}</span>
          <div><h1>{currentMode === 'register' ? 'Create account' : 'Sign in'}</h1><p>{app?.name || 'Unknown application'}</p></div>
        </div>
        {!app && <div className="hosted-warning">Application not found. Use application id like <code>app_xxxxx</code>, or keep the generated client id available in Identity OS state.</div>}
        {app && app.status !== 'approved' && <div className="hosted-warning">This application is not approved yet.</div>}
        {app && currentMode === 'register' && !registrationSchema && <div className="hosted-warning">No approved registration schema found for this application. Ask the organization admin to submit and approve a registration schema.</div>}
        {app && currentMode === 'login' && !loginSchema && <div className="hosted-warning">No approved login configuration found for this application. Ask the organization admin to submit and approve a login configuration.</div>}
        {fieldsMissing && <div className="hosted-warning">Login configuration does not define renderable fields. Re-submit this login configuration so Identity OS stores loginFields for this application.</div>}
        <form className="hosted-form" onSubmit={(event) => { event.preventDefault(); submit() }}>
          {fields.map((field) => (
            <label key={field.name}>{field.label || field.name}
              {field.type === 'dropdown'
                ? <select value={formValues[field.name] || ''} onChange={(event) => updateField(field.name, event.target.value)}><option value="">Select {field.label || field.name}</option>{(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}</select>
                : field.type === 'checkbox'
                  ? <input type="checkbox" checked={formValues[field.name] === 'true'} onChange={(event) => updateField(field.name, String(event.target.checked))} />
                  : <input type={field.type === 'password' ? 'password' : field.type === 'email' ? 'email' : 'text'} value={formValues[field.name] || ''} onChange={(event) => updateField(field.name, event.target.value)} placeholder={field.label || field.name} />}
            </label>
          ))}
          {message && <div className="hosted-error">{message}</div>}
          <button className="primary-button hosted-submit" disabled={submitting || !app || app.status !== 'approved' || schemaMissing || fields.length === 0}>{submitting ? 'Processing...' : currentMode === 'register' ? 'Register and return' : 'Login and return'}</button>
        </form>
        <div className="hosted-footer">Redirect URI: <code>{callbackUri || '-'}</code></div>
      </section>
    </div>
  )
}
