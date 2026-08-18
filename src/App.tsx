'use client'

import { useMemo, useState, useEffect } from 'react'

interface RegistrationDetails {
  registrationNumber: string
  gst?: string
}

interface Representative {
  name: string
  email: string
  mobile: string
  designation: string
}

interface RegistrationField {
  name: string
  label?: string
  type: string
  required?: boolean
  regex?: string | null
  verification?: string | null
  encrypted?: boolean
  options?: string[]
}

interface Organization {
  id: string
  name: string
  orgId?: string | null
  orgName?: string
  type?: string
  country?: string
  email?: string
  phone?: string
  address?: string
  website?: string
  domain?: string
  registrationType?: string
  status: string
  registrationDetails?: RegistrationDetails
  representative?: Representative
  documents?: { name: string }[]
  submittedAt?: string
  createdAt?: string
  approvedAt?: string
  rejectedAt?: string
  suspendedAt?: string
  resumedAt?: string
  orgAdminActivated?: boolean
  infoRequest?: { message: string; requestedAt: string }
  registrationSchemas?: SchemaRecord[]
  fields?: Array<string | RegistrationField>
  payload?: Omit<LoginPolicy, 'id' | 'name' | 'orgId' | 'createdAt'>
}

interface ApplicationRecord {
  id: string
  orgId: string
  orgName: string
  name: string
  type: string
  status: string
  description?: string
  contactEmail?: string
  domain?: string
  redirectUri?: string
  logoutUri?: string
  clientId?: string
  clientSecret?: string
  createdAt?: string
  approvedAt?: string
  rejectedAt?: string
  registrationDetails?: RegistrationDetails
  representative?: Representative
  documents?: { name: string }[]
  submittedAt?: string
  fields?: Array<string | RegistrationField>
  payload?: Omit<LoginPolicy, 'id' | 'name' | 'orgId' | 'createdAt'>
}

interface LoginPolicy {
  id: string
  name: string
  authenticationMethods: string[]
  mfa: boolean
  mfaMethods: string[]
  riskAuthentication: boolean
  flow: string[]
  orgId: string | null
  createdAt: string
}

interface SchemaRecord {
  id: string
  type: string
  name: string
  orgId?: string | null
  orgName?: string
  fields?: Array<string | RegistrationField>
  payload?: Omit<LoginPolicy, 'id' | 'name' | 'orgId' | 'createdAt'>
  status: string
  createdAt: string
  approvedAt?: string
  rejectedAt?: string
}

interface AuditLog {
  id: string
  action: string
  details: string
  timestamp: string
}

interface SavedState {
  organizations?: Organization[]
  pendingOrganizations?: Organization[]
  approvedOrganizations?: Organization[]
  applications?: ApplicationRecord[]
  schemas?: SchemaRecord[]
}

type ApprovalModal = { type: 'org'; item: Organization } | { type: 'app'; item: ApplicationRecord } | { type: 'schema'; item: SchemaRecord }
type RequestModal = { target: Organization; message?: string; open?: boolean }
type CredentialModal = { org: Organization; username: string; password: string }
type AppCredentialModal = { app: ApplicationRecord; clientId?: string; clientSecret?: string }
type ConfirmModal = { title: string; message: string; onConfirm: () => Promise<void> | void }

const readStorage = (key: string): string | null => {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(key)
}

const writeStorage = (key: string, value: string) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, value)
}

const initialPendingOrganizations: Organization[] = [
  {
    id: 'org_fs8b2c4e',
    name: 'Apex Digital',
    type: 'Company',
    country: 'India',
    email: 'admin@apexdigital.io',
    status: 'pending',
    registrationDetails: { registrationNumber: 'CIN123456', gst: '07ABCDE1234F1Z5' },
    representative: { name: 'Priya Shah', email: 'priya@apexdigital.io', mobile: '+91-9876543210', designation: 'Head Legal' },
    documents: [ { name: 'Certificate of Incorporation.pdf' }, { name: 'PAN.pdf' } ],
    submittedAt: '05 Aug 2026, 03:53 pm'
  },
  {
    id: 'org_gv9d3a7f',
    name: 'Verity Health',
    type: 'Government',
    country: 'United States',
    email: 'admin@verityhealth.org',
    status: 'pending',
    registrationDetails: { registrationNumber: 'GH-998877', gst: '' },
    representative: { name: 'Mark Lewis', email: 'mark@verityhealth.org', mobile: '+1-555-234-5678', designation: 'Director' },
    documents: [ { name: 'Registration.pdf' } ],
    submittedAt: '06 Aug 2026, 02:15 pm'
  },
]

const initialApplications: ApplicationRecord[] = [
  { id: 'app-101', orgId: 'org_7k3m9p2x', orgName: 'TechNova Solutions', name: 'Identity Suite', type: 'web', status: 'pending' },
  { id: 'app-102', orgId: 'org_fs8b2c4e', orgName: 'Apex Digital', name: 'Apex Access Portal', type: 'mobile', status: 'pending' },
]

const initialSchemas: SchemaRecord[] = [
  { id: 'schema_001', type: 'registration', name: 'Employee Schema', orgId: 'org_7k3m9p2x', orgName: 'TechNova Solutions', fields: ['firstName','lastName','email','employeeId'], status: 'pending', createdAt: '2026-07-20, 10:32 am' },
  { id: 'schema_002', type: 'registration', name: 'Customer Profile', orgId: 'org_fs8b2c4e', orgName: 'Apex Digital', fields: ['name','email','phone','address'], status: 'pending', createdAt: '2026-08-05, 03:40 pm' },
]

const approvedOrgIds = ['org_7k3m9p2x', 'org_b8c5d1k9', 'org_f9e2h4q7']
const orgAdminMenu = ['Dashboard', 'Organization Profile', 'Applications', 'Registration Builder', 'Login Configuration', 'Auth Policies', 'Users', 'Identity Management', 'API Credentials', 'Webhooks', 'Audit Logs', 'Settings']

const AdminIcon = ({ name }: { name?: string }) => {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  const paths = {
    shield: <><path {...common} d="M12 3l7 3v5c0 4.5-2.8 8-7 10-4.2-2-7-5.5-7-10V6l7-3z" /><path {...common} d="M9 12l2 2 4-5" /></>,
    dashboard: <><rect {...common} x="4" y="4" width="6" height="6" /><rect {...common} x="14" y="4" width="6" height="6" /><rect {...common} x="4" y="14" width="6" height="6" /><rect {...common} x="14" y="14" width="6" height="6" /></>,
    organizations: <><path {...common} d="M6 21V7h8v14" /><path {...common} d="M10 21V3h8v18" /><path {...common} d="M8 11h2M8 15h2M12 7h2M12 11h2M12 15h2" /></>,
    applications: <><path {...common} d="M12 4l8 4-8 4-8-4 8-4z" /><path {...common} d="M4 12l8 4 8-4" /><path {...common} d="M4 16l8 4 8-4" /></>,
    schema: <><path {...common} d="M7 3h7l4 4v14H7V3z" /><path {...common} d="M14 3v5h5" /><path {...common} d="M10 13l2 2 3-5" /></>,
    identity: <><circle {...common} cx="9" cy="8" r="4" /><path {...common} d="M3 21c.7-4 3-6 6-6 2 0 3.6.8 4.8 2.4" /><path {...common} d="M17 8v6M14 11h6" /></>,
    auth: <><path {...common} d="M4 12h4l2-7 4 14 2-7h4" /></>,
    audit: <><path {...common} d="M8 4h8l2 3v14H6V7l2-3z" /><path {...common} d="M9 12h6M9 16h6M10 4v4h4V4" /></>,
    security: <><path {...common} d="M12 3l7 3v5c0 4.5-2.8 8-7 10-4.2-2-7-5.5-7-10V6l7-3z" /></>,
    api: <><path {...common} d="M8 7H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h3M16 7h3a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-3M9 17h6M9 21h6" /></>,
    trust: <><path {...common} d="M5 13l4 4L19 7" /><path {...common} d="M5 5h14v14H5z" /></>,
    reports: <><path {...common} d="M6 20V10M12 20V4M18 20v-7" /></>,
    notifications: <><path {...common} d="M18 16v-5a6 6 0 1 0-12 0v5l-2 3h16l-2-3z" /><path {...common} d="M10 21h4" /></>,
    check: <><circle {...common} cx="12" cy="12" r="9" /><path {...common} d="M8 12l3 3 5-6" /></>,
  }

  return <svg className="admin-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name] || paths.dashboard}</svg>
}

const ProfileField = ({ label, value, mono, link }: { label: string; value?: string | null; mono?: boolean; link?: boolean }) => {
  const displayValue = value || '-'
  const href = link && displayValue !== '-' ? (displayValue.startsWith('http') ? displayValue : `https://${displayValue}`) : ''

  return (
    <div className="profile-field">
      <label>{label}</label>
      {href ? <a href={href} target="_blank" rel="noreferrer">{displayValue}</a> : <p className={mono ? 'mono' : ''}>{displayValue}</p>}
    </div>
  )
}

function App() {
  const [view, setView] = useState('home')
  const [step, setStep] = useState(0)
  const [registrationForm, setRegistrationForm] = useState({
    name: '', type: '', country: '', email: '', phone: '', gst: '', repName: '', repEmail: '', repMobile: '', designation: '', address: '', website: '', domain: '', logo: '',
  })
  const [platformLogin, setPlatformLogin] = useState({ username: '', password: '' })
  const [platformLoginError, setPlatformLoginError] = useState('')
  const [pendingOrganizations, setPendingOrganizations] = useState<Organization[]>(initialPendingOrganizations)
  const [approvedOrganizations, setApprovedOrganizations] = useState<Organization[]>([{
    id: 'org_7k3m9p2x',
    name: 'TechNova Solutions',
    type: 'Company',
    country: 'India',
    email: 'admin@technova.io',
    phone: '+91-8765432109',
    address: 'Embassy Tech Village, Outer Ring Road, Bengaluru, Karnataka - 560103',
    website: 'https://technova.io',
    registrationType: 'GST',
    registrationDetails: { registrationNumber: '27AADCT1234R1Z5', gst: '27AADCT1234R1Z5' },
    representative: { name: 'Aditya Kumar', email: 'aditya@technova.io', mobile: '+91-8765432109', designation: 'Organization Admin' },
    status: 'approved',
    orgAdminActivated: true
  }])
  const [applications, setApplications] = useState<ApplicationRecord[]>(initialApplications)
  const [schemas, setSchemas] = useState<SchemaRecord[]>(initialSchemas)
  const [schemaTab, setSchemaTab] = useState('registration')
  const [schemaSearch, setSchemaSearch] = useState('')
  const [schemaFilterStatus, setSchemaFilterStatus] = useState('All')
  const [policyPreviewModal, setPolicyPreviewModal] = useState<SchemaRecord | LoginPolicy | null>(null)
  const [registerAppModal, setRegisterAppModal] = useState(false)
  const [registerAppForm, setRegisterAppForm] = useState({ name:'', type:'web', description:'', contactEmail:'', domain:'', redirectUri:'', logoutUri:'' })
  const [appSearch, setAppSearch] = useState('')
  const [appFilterStatus, setAppFilterStatus] = useState('All')
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => { try { const raw = readStorage('catalogue_audit_v1'); return raw ? JSON.parse(raw) : [] } catch { return [] } })

  const [loginPolicies, setLoginPolicies] = useState<LoginPolicy[]>(() => {
    try { const raw = readStorage('catalogue_login_policies_v1'); return raw ? JSON.parse(raw) : [] } catch { return [] }
  })

  const addAudit = (action: string, details: string) => {
    const entry = { id: `audit_${Date.now()}`, action, details, timestamp: new Date().toLocaleString() }
    setAuditLogs(prev => [entry, ...prev])
  }

  // local persistence: try to load saved state from localStorage
  const loadSaved = () => {
    try {
      const raw = readStorage('catalogue_state_v1')
      if (!raw) return null
      return JSON.parse(raw) as SavedState
    } catch {
      return null
    }
  }
  const saved = loadSaved()
  // organizations: unified list used by the Platform Organizations view. Keep in sync with pending/approved lists where needed.
  const [organizations, setOrganizations] = useState<Organization[]>(() => {
    if (saved && saved.organizations) return saved.organizations
    // start with approved then pending
    const seed = [
      {
        id: 'org_7k3m9p2x',
        name: 'TechNova Solutions',
        type: 'Company',
        country: 'India',
        email: 'admin@technova.io',
        phone: '+91-8765432109',
        address: 'Embassy Tech Village, Outer Ring Road, Bengaluru, Karnataka - 560103',
        website: 'https://technova.io',
        registrationType: 'GST',
        registrationDetails: { registrationNumber: '27AADCT1234R1Z5', gst: '27AADCT1234R1Z5' },
        representative: { name: 'Aditya Kumar', email: 'aditya@technova.io', mobile: '+91-8765432109', designation: 'Organization Admin' },
        status: 'approved',
        orgAdminActivated: true
      },
      ...initialPendingOrganizations.map(o => ({ ...o })),
    ]
    return seed
  })
  const [orgsFilter, setOrgsFilter] = useState('All')
  const [orgApprovalModal, setOrgApprovalModal] = useState<ApprovalModal | null>(null)
  const [orgLoginStage, setOrgLoginStage] = useState(1)
  const [orgLoginId, setOrgLoginId] = useState('')
  const [orgLoginChannel, setOrgLoginChannel] = useState('email')
  const [orgOtp, setOrgOtp] = useState('')
  const [orgLoginError, setOrgLoginError] = useState('')
  const [successData, setSuccessData] = useState<{ orgId: string; createdAt: string; status: string } | null>(null)

  const currentOrg = useMemo(() => {
    const savedOrg = organizations.find((org) => org.id === orgLoginId)
    const approvedOrg = approvedOrganizations.find((org) => org.id === orgLoginId)
    if (savedOrg && approvedOrg) return { ...savedOrg, ...approvedOrg }
    return savedOrg || approvedOrg || null
  }, [approvedOrganizations, organizations, orgLoginId])
  const registrationSteps = ['Basic Info', 'Registration Details', 'Representative Details', 'Address', 'Digital Presence']

  const updateField = (field: keyof typeof registrationForm, value: string) => setRegistrationForm((prev) => ({ ...prev, [field]: value }))
  const nextStep = () => setStep((prev) => Math.min(prev + 1, registrationSteps.length - 1))
  const previousStep = () => setStep((prev) => Math.max(prev - 1, 0))
  const generateOrgId = () => `org_${Math.random().toString(36).slice(2, 10)}`

  const submitRegistration = () => {
    const generatedId = generateOrgId()
    const newOrg = {
      id: generatedId,
      name: registrationForm.name || 'New Org',
      type: registrationForm.type || 'Company',
      country: registrationForm.country || 'India',
      email: registrationForm.email || 'admin@yourorg.com',
      phone: registrationForm.phone || '',
      address: registrationForm.address || '',
      website: registrationForm.website || '',
      domain: registrationForm.domain || '',
      registrationType: 'GST',
      status: 'pending',
      registrationDetails: {
        registrationNumber: registrationForm.gst || '',
        gst: registrationForm.gst || '',
      },
      representative: {
        name: registrationForm.repName || '',
        email: registrationForm.repEmail || '',
        mobile: registrationForm.repMobile || '',
        designation: registrationForm.designation || ''
      },
      documents: [],
      submittedAt: new Date().toLocaleString(),
    }

    // add to unified organizations list and pending list
    setOrganizations((prev) => [newOrg, ...prev])
    setPendingOrganizations((prev) => [newOrg, ...prev])
    setApplications((prev) => [{ id: `app-${Date.now()}`, orgId: generatedId, orgName: newOrg.name, name: `${newOrg.name} IAM Portal`, type: 'web', status: 'pending' }, ...prev])
    setSuccessData({ orgId: generatedId, createdAt: new Date().toLocaleString(), status: 'Awaiting admin approval' })
    setView('success')
    setStep(0)
  }

  const handlePlatformLogin = () => {
    if (platformLogin.username === 'admin' && platformLogin.password === 'admin') {
      setPlatformLoginError('')
      setView('platform-dashboard')
      return
    }
    setPlatformLoginError('Invalid username or password. Please use admin / admin.')
  }

  const approveOrganization = (org) => {
    // remove from pending
    setPendingOrganizations((prev) => prev.filter((item) => item.id !== org.id))
    // add to approved list with metadata
    setApprovedOrganizations((prev) => [{ ...org, status: 'approved', approvedAt: new Date().toLocaleString(), orgAdminActivated: true }, ...prev])
    // update unified organizations list
    setOrganizations((prev) => {
      const exists = prev.some((i) => i.id === org.id)
      if (exists) return prev.map((i) => (i.id === org.id ? { ...i, status: 'approved', approvedAt: new Date().toLocaleString(), orgAdminActivated: true } : i))
      return [{ ...org, status: 'approved', approvedAt: new Date().toLocaleString(), orgAdminActivated: true }, ...prev]
    })

    // create org admin account mock (for demo) and show credentials modal
    const username = `${org.name.replace(/[^a-zA-Z0-9]/g,'').toLowerCase().slice(0,8)}_admin`
    const password = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(-2)
    setOrgCredentialModal({ org, username, password })

    // close review modal
    setOrgApprovalModal(null)
  }

  const rejectOrganization = (org) => {
    setPendingOrganizations((prev) => prev.filter((item) => item.id !== org.id))
    setOrganizations((prev) => prev.map((i) => (i.id === org.id ? { ...i, status: 'rejected', rejectedAt: new Date().toLocaleString() } : i)))
    setOrgApprovalModal(null)
  }

  const requestMoreInfo = (org, message = 'Please provide additional documentation') => {
    setOrganizations((prev) => prev.map((i) => (i.id === org.id ? { ...i, status: 'requires_more_info', infoRequest: { message, requestedAt: new Date().toLocaleString() } } : i)))
    // keep it in pending list but mark as needs info
    setPendingOrganizations((prev) => prev.map((i) => (i.id === org.id ? { ...i, status: 'requires_more_info' } : i)))
    setOrgApprovalModal(null)
  }

  const approveApplication = (app) => {
    // generate client credentials
    const clientId = `client_${Math.random().toString(36).slice(2,10)}`
    const clientSecret = (() => { try { const arr = new Uint8Array(24); window.crypto.getRandomValues(arr); return Array.from(arr).map(b=>('0'+b.toString(16)).slice(-2)).join('') } catch { return Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2) } })()
    const updated = { ...app, status: 'approved', clientId, clientSecret, approvedAt: new Date().toLocaleString() }
    setApplications((prev) => prev.map((item) => (item.id === app.id ? updated : item)))
    // show credentials modal to platform admin (so they can copy and share)
    setAppCredentialModal({ app: updated, clientId, clientSecret })
    setOrgApprovalModal(null)
  }

  const approveSchema = (schema) => {
    if (schema.type === 'login') {
      // Convert schema.payload into a login policy and persist
      const policy = {
        id: `policy_${Date.now()}`,
        name: schema.name,
        authenticationMethods: schema.payload?.authenticationMethods || [],
        mfa: schema.payload?.mfa || false,
        mfaMethods: schema.payload?.mfaMethods || [],
        riskAuthentication: schema.payload?.riskAuthentication || false,
        flow: schema.payload?.flow || [],
        orgId: schema.orgId || null,
        createdAt: new Date().toLocaleString(),
      }
      try {
        const raw = localStorage.getItem('catalogue_login_policies_v1')
        const existing = raw ? JSON.parse(raw) : []
        const next = [policy, ...existing]
        localStorage.setItem('catalogue_login_policies_v1', JSON.stringify(next))
        setLoginPolicies(next)
        // mark schema approved
        setSchemas((prev) => prev.map((s) => (s.id === schema.id ? { ...s, status: 'approved', approvedAt: new Date().toLocaleString() } : s)))
        addAudit('Approve Login Policy', `Approved login policy ${schema.name}`)
      } catch (e) {
        alert('Failed to persist login policy: ' + String(e))
      }
    } else {
      // registration / other schema types
      setSchemas((prev) => prev.map((s) => (s.id === schema.id ? { ...s, status: 'approved', approvedAt: new Date().toLocaleString() } : s)))
      if (schema.type === 'registration' && schema.orgId) {
        setOrganizations(prev => prev.map(o => o.id === schema.orgId ? ({ ...o, registrationSchemas: [...(o.registrationSchemas||[]), schema] }) : o));
      }
      addAudit('Approve Schema', `Schema ${schema.name} approved`)
    }
    setOrgApprovalModal(null)
  }

  const rejectSchema = (schema) => {
    setSchemas((prev) => prev.map((s) => (s.id === schema.id ? { ...s, status: 'rejected', rejectedAt: new Date().toLocaleString() } : s)))
    addAudit('Reject Schema', `Schema ${schema.name} rejected`)
    setOrgApprovalModal(null)
  }

  // Request more info modal state
  const [requestModal, setRequestModal] = useState<RequestModal | null>(null)
  // Org credential modal shown after approval (mocked credentials)
  const [orgCredentialModal, setOrgCredentialModal] = useState<CredentialModal | null>(null)
  // App credential modal shown after app approval (client id / secret)
  const [appCredentialModal, setAppCredentialModal] = useState<AppCredentialModal | null>(null)
  // publish modal for registration builder
  const [publishModal, setPublishModal] = useState<SchemaRecord | null>(null)
  // publish modal for login policies
  const [loginPublishModal, setLoginPublishModal] = useState<LoginPolicy | null>(null)
  // generic confirm modal state: { title, message, onConfirm }
  const [confirmModal, setConfirmModal] = useState<ConfirmModal | null>(null)
  const [confirmProcessing, setConfirmProcessing] = useState(false)

  useEffect(() => {
    // save key parts of app state to localStorage on change
    try {
      const toSave = { organizations, pendingOrganizations, approvedOrganizations, applications, schemas }
      writeStorage('catalogue_state_v1', JSON.stringify(toSave))
      writeStorage('catalogue_audit_v1', JSON.stringify(auditLogs))
    } catch {
      // ignore
    }
  }, [organizations, pendingOrganizations, approvedOrganizations, applications, schemas, auditLogs, loginPolicies])

  const suspendOrganization = (org) => {
    setOrganizations((prev) => prev.map((i) => (i.id === org.id ? { ...i, status: 'suspended', suspendedAt: new Date().toLocaleString() } : i)))
    // reflect in approvedOrganizations if present
    setApprovedOrganizations((prev) => prev.map((i) => (i.id === org.id ? { ...i, status: 'suspended', suspendedAt: new Date().toLocaleString() } : i)))
  }

  const unsuspendOrganization = (org) => {
    setOrganizations((prev) => prev.map((i) => (i.id === org.id ? { ...i, status: 'approved', resumedAt: new Date().toLocaleString() } : i)))
    setApprovedOrganizations((prev) => prev.map((i) => (i.id === org.id ? { ...i, status: 'approved', resumedAt: new Date().toLocaleString() } : i)))
  }

  const handleOrgLoginSubmit = () => {
    if (orgLoginStage === 1) {
      const exists = approvedOrgIds.includes(orgLoginId) || approvedOrganizations.some((org) => org.id === orgLoginId) || organizations.some((org) => org.id === orgLoginId && org.status === 'approved')
      if (!exists) {
        setOrgLoginError('Organization ID not found or not yet approved.')
        return
      }
      setOrgLoginError('')
      setOrgLoginStage(2)
      return
    }

    if (orgLoginStage === 2) {
      setOrgLoginStage(3)
      setOrgLoginError('')
      return
    }

    if (orgOtp === '000000') {
      setOrgLoginError('Invalid OTP. Please enter a valid 6-digit code.')
      return
    }

    setOrgLoginError('')
    setView('organization-dashboard')
  }

  const renderHome = () => (
    <div className="home-screen">
      <div className="home-topbar">
        <div className="brand-mark">
          <span className="brand-icon">O</span>
          <span>Identity OS</span>
        </div>
        <div className="topbar-right">
          <span className="version-label">v2.5.8</span>
          <div className="status-pill"><span className="status-dot" />All Systems Operational</div>
        </div>
      </div>

      <section className="hero-block">
        <div className="hero-copy">
          <div className="brand-label"><span className="badge-spark">+</span>Enterprise Identity &amp; Access Management</div>
          <h1>Identity <span>OS</span></h1>
          <p>Secure organization onboarding, identity management, and authentication at enterprise scale.</p>
        </div>

        <div className="role-stack">
          <button type="button" className="role-card primary" onClick={() => setView('registration')}>
            <span className="role-icon role-icon-blue">ID</span>
            <span className="role-card-title">Register Organization</span>
            <span className="role-card-subtitle">Onboard your organization to Identity OS</span>
            <span className="role-card-action">Start Registration <span>-&gt;</span></span>
          </button>
          <button type="button" className="role-card admin-card" onClick={() => setView('platform')}>
            <span className="role-icon role-icon-purple">S</span>
            <span className="role-card-title">Platform Admin</span>
            <span className="role-card-subtitle">Review organizations, apps &amp; schemas</span>
            <span className="role-card-action">Admin Login <span>-&gt;</span></span>
          </button>
          <button type="button" className="role-card org-card" onClick={() => setView('organization')}>
            <span className="role-icon role-icon-green">G</span>
            <span className="role-card-title">Organization Admin</span>
            <span className="role-card-subtitle">Manage identity configuration</span>
            <span className="role-card-action">Org Admin Login <span>-&gt;</span></span>
          </button>
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-box"><strong>1,200+</strong><span>Organizations Onboarded</span></div>
        <div className="stat-box"><strong>48M+</strong><span>Identities Managed</span></div>
        <div className="stat-box"><strong>99.99%</strong><span>Uptime SLA</span></div>
      </section>
    </div>
  )

  const renderHeader = (title) => (
    <div className="page-header">
      <button type="button" className="back-button" onClick={() => setView('home')}>Back</button>
      <span className="back-divider">|</span>
      <span className="page-title">{title}</span>
    </div>
  )

  const renderPlatformSidebar = () => {
    const pendingSchemas = schemas.filter(s => s.status === 'pending').length
    const pendingApps = applications.filter(a => a.status === 'pending').length

    const navSections = [
      {
        title: null,
        items: [
          { label: 'Dashboard', key: 'platform-dashboard', icon: 'dashboard' },
        ]
      },
      {
        title: 'Management',
        items: [
          { label: 'Organizations', key: 'platform-organizations', icon: 'organizations', badge: pendingOrganizations.length },
          { label: 'Applications', key: 'platform-apps', icon: 'applications', badge: pendingApps },
          { label: 'Schema Approvals', key: 'platform-schema', icon: 'schema', badge: pendingSchemas },
        ]
      },
      {
        title: 'Security',
        items: [
          { label: 'Identity Management', key: 'platform-identity-mgmt', icon: 'identity' },
          { label: 'Auth Monitoring', key: 'platform-auth-monitor', icon: 'auth' },
          { label: 'Audit Logs', key: 'platform-audit', icon: 'audit' },
          { label: 'Security Monitoring', key: 'platform-security-monitor', icon: 'security' },
        ]
      },
      {
        title: 'Platform',
        items: [
          { label: 'API Management', key: 'platform-api', icon: 'api' },
          { label: 'Trust Management', key: 'platform-trust', icon: 'trust' },
          { label: 'Reports', key: 'platform-reports', icon: 'reports' },
          { label: 'Notifications', key: 'platform-notifications', icon: 'notifications' },
        ]
      }
    ]

    return (
      <aside className="side-nav">
        <div className="brand-block">
          <span className="platform-brand-icon"><AdminIcon name="shield" /></span>
          <span><strong>Identity OS</strong><small>Platform Admin</small></span>
        </div>
        {navSections.map((section, si) => (
          <div key={si} className="nav-section">
            {section.title && <div className="nav-section-title">{section.title}</div>}
            <ul>
              {section.items.map((it) => (
                <li key={it.key} onClick={() => setView(it.key)} className={view === it.key ? 'active' : ''}>
                  <span className="nav-item-label"><AdminIcon name={it.icon} />{it.label}</span>{it.badge ? <span className="nav-badge">{it.badge}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </aside>
    )
  }

  const renderRegistrationStep = () => {
    if (step === 0) {
      return (
        <>
          <div className="step-row"><label>ORGANIZATION NAME*<input value={registrationForm.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Legal entity name" /></label></div>
          <div className="step-row"><label>ORGANIZATION TYPE*<select value={registrationForm.type} onChange={(e) => updateField('type', e.target.value)}><option value="">Select Organization Type</option><option value="Bank">Bank</option><option value="Company">Company</option><option value="Government">Government</option><option value="NGO">NGO</option><option value="Startup">Startup</option><option value="Other">Other</option></select></label></div>
          <div className="step-row"><label>COUNTRY*<select value={registrationForm.country} onChange={(e) => updateField('country', e.target.value)}><option value="">Select Country</option><option value="India">India</option><option value="United States">United States</option><option value="United Kingdom">United Kingdom</option><option value="Singapore">Singapore</option><option value="UAE">UAE</option><option value="Australia">Australia</option></select></label></div>
          <div className="split-row"><label>OFFICIAL EMAIL*<input value={registrationForm.email} onChange={(e) => updateField('email', e.target.value)} placeholder="admin@yourorg.com" /></label><button type="button" className="ghost-button">Send OTP to verify →</button></div>
          <div className="split-row"><label>OFFICIAL PHONE NUMBER*<input value={registrationForm.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="+91-XXXXXXXXXX" /></label><button type="button" className="ghost-button">Send OTP to verify →</button></div>
        </>
      )
    }

    if (step === 1) {
      return (
        <>
          <div className="step-row"><label>REGISTRATION NUMBER*<input value={registrationForm.gst} onChange={(e) => updateField('gst', e.target.value)} placeholder="GST / CIN / NGO registration number" /></label></div>
          <button type="button" className="ghost-button align-start">Verify</button>
        </>
      )
    }

    if (step === 2) {
      return (
        <>
          <div className="step-row"><label>REPRESENTATIVE NAME*<input value={registrationForm.repName} onChange={(e) => updateField('repName', e.target.value)} placeholder="Enter representative name" /></label></div>
          <div className="split-row"><label>REPRESENTATIVE EMAIL*<input value={registrationForm.repEmail} onChange={(e) => updateField('repEmail', e.target.value)} placeholder="rep@yourorg.com" /></label><button type="button" className="ghost-button">Send OTP to verify →</button></div>
          <div className="step-row"><label>MOBILE NUMBER*<input value={registrationForm.repMobile} onChange={(e) => updateField('repMobile', e.target.value)} placeholder="+91-XXXXXXXXXX" /></label></div>
          <div className="step-row"><label>DESIGNATION*<input value={registrationForm.designation} onChange={(e) => updateField('designation', e.target.value)} placeholder="Designation" /></label></div>
        </>
      )
    }

    if (step === 3) {
      return <div className="step-row"><label>ADDRESS*<textarea value={registrationForm.address} onChange={(e) => updateField('address', e.target.value)} placeholder="Street, city, state, postal code, country" rows={5} /></label></div>
    }

    return (
      <>
        <div className="step-row"><label>WEBSITE<input value={registrationForm.website} onChange={(e) => updateField('website', e.target.value)} placeholder="https://www.yourorg.com" /></label></div>
        <div className="step-row"><label>DOMAIN<input value={registrationForm.domain} onChange={(e) => updateField('domain', e.target.value)} placeholder="yourorg.com" /></label></div>
        <div className="step-row"><label>LOGO UPLOAD<input value={registrationForm.logo} onChange={(e) => updateField('logo', e.target.value)} placeholder="Upload logo" /></label></div>
      </>
    )
  }

  const renderRegistration = () => (
    <section className="panel-page">
      {renderHeader('Identity OS — Organization Registration')}
      <div className="progress-indicator">{registrationSteps.map((item, index) => <span key={item} className={`progress-dot ${index === step ? 'active' : ''}`}>{index + 1}</span>)}</div>
      <div className="panel-copy"><h2>Step {step + 1} of {registrationSteps.length}: {registrationSteps[step]}</h2><p>{step === 0 && 'Provide your organization basic details'}{step === 1 && 'Add your registration details'}{step === 2 && 'Provide your representative information'}{step === 3 && 'Add your office address'}{step === 4 && 'Add your digital presence and branding'}</p></div>
      <div className="form-card">
        {renderRegistrationStep()}
        <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setView('home')}>Cancel</button><div className="form-actions-right">{step > 0 && <button type="button" className="secondary-button" onClick={previousStep}>Previous</button>}{step < registrationSteps.length - 1 ? <button type="button" className="primary-button" onClick={nextStep}>Next</button> : <button type="button" className="primary-button" onClick={submitRegistration}>Submit</button>}</div></div>
      </div>
    </section>
  )

  const renderSuccess = () => (
    <section className="panel-page success-page">
      {renderHeader('Identity OS — Registration Submitted')}
      <div className="success-box">
        <div className="success-status">Submitted successfully</div>
        <h2>Organization registration request created</h2>
        <div className="org-id-box"><span>Organization ID</span><strong>{successData?.orgId}</strong><small>Save this ID — you will need it to log in as Organization Admin</small></div>
        <div className="meta-row"><div><label>Created</label><p>{successData?.createdAt}</p></div><div><label>Status</label><p>{successData?.status}</p></div></div>
      </div>
      <div className="success-actions"><button type="button" className="secondary-button" onClick={() => setView('home')}>Back to Home</button><button type="button" className="primary-button" onClick={() => setView('platform')}>Open Admin Portal</button></div>
    </section>
  )

  const renderPlatformLogin = () => (
    <section className="panel-page">
      {renderHeader('Identity OS')}
      <div className="panel-copy compact"><h2>Platform Admin</h2><p>Sign in to the Identity OS control plane</p></div>
      <div className="form-card narrow">
        <div className="step-row"><label>USERNAME<input value={platformLogin.username} onChange={(e) => setPlatformLogin((prev) => ({ ...prev, username: e.target.value }))} placeholder="admin" /></label></div>
        <div className="step-row"><label>PASSWORD<input type="password" value={platformLogin.password} onChange={(e) => setPlatformLogin((prev) => ({ ...prev, password: e.target.value }))} placeholder="••••••••" /></label></div>
        {platformLoginError && <div className="error-message">{platformLoginError}</div>}
        <button type="button" className="primary-button" onClick={handlePlatformLogin}>Sign In</button>
        <p className="hint-text">Default: admin / admin</p>
      </div>
    </section>
  )

  const renderPlatformDashboard = () => {
    const totalOrgs = organizations.length
    const approvedCount = organizations.filter((org) => org.status === 'approved').length
    const pendingOrgCount = pendingOrganizations.filter((org) => org.status === 'pending' || org.status === 'requires_more_info').length
    const appCount = applications.length
    const pendingAppCount = applications.filter((app) => app.status === 'pending').length
    const schemaReviewCount = schemas.filter((schema) => schema.status === 'pending').length
    const recentRows = [
      { type: 'User', text: 'User Registered', meta: 'john.doe@technova.io', time: '09:12:34', dot: 'green' },
      { type: 'Org', text: `${pendingOrganizations[0]?.name || 'Apex Digital'} submitted registration`, meta: pendingOrganizations[0]?.email || 'admin@apexdigital.io', time: '08:45:12', dot: 'blue' },
      { type: 'App', text: `${applications[0]?.name || 'Identity Suite'} awaiting approval`, meta: applications[0]?.orgName || 'TechNova Solutions', time: '08:18:09', dot: 'orange' },
    ]

    return (
      <div className="dashboard-shell platform-dashboard-shell">
        {renderPlatformSidebar()}
        <main className="dashboard-main platform-dashboard-main">
          <header className="platform-topbar">
            <h1>Dashboard</h1>
            <button type="button" className="admin-account-pill" onClick={() => setView('home')}><AdminIcon name="shield" />Platform Admin</button>
          </header>

          <section className="platform-content">
            <div className="admin-stats-grid">
              <article className="admin-stat-card blue">
                <span className="admin-stat-icon"><AdminIcon name="organizations" /></span>
                <strong>{totalOrgs}</strong>
                <h3>Total Orgs</h3>
                <p>{pendingOrgCount} pending</p>
              </article>
              <article className="admin-stat-card green">
                <span className="admin-stat-icon"><AdminIcon name="check" /></span>
                <strong>{approvedCount}</strong>
                <h3>Approved</h3>
                <p>active orgs</p>
              </article>
              <article className="admin-stat-card purple">
                <span className="admin-stat-icon"><AdminIcon name="applications" /></span>
                <strong>{appCount}</strong>
                <h3>Applications</h3>
                <p>{pendingAppCount} pending</p>
              </article>
              <article className="admin-stat-card orange">
                <span className="admin-stat-icon"><AdminIcon name="schema" /></span>
                <strong>{schemaReviewCount}</strong>
                <h3>Schema Reviews</h3>
                <p>awaiting review</p>
              </article>
            </div>

            <div className="admin-chart-grid">
              <article className="admin-chart-card">
                <h2>Organization Registrations</h2>
                <svg className="line-chart" viewBox="0 0 520 210" role="img" aria-label="Organization registrations by month">
                  {[0, 1, 2, 3, 4].map((row) => <line key={`h-${row}`} x1="52" y1={24 + row * 39} x2="500" y2={24 + row * 39} />)}
                  {[0, 1, 2, 3, 4, 5].map((col) => <line key={`v-${col}`} x1={52 + col * 89.6} y1="24" x2={52 + col * 89.6} y2="180" />)}
                  <path className="chart-fill" d="M52 150 C110 140 130 132 160 128 C220 116 235 106 270 102 C330 92 350 88 390 70 C425 55 455 64 500 82 L500 180 L52 180 Z" />
                  <path className="line-path" d="M52 150 C110 140 130 132 160 128 C220 116 235 106 270 102 C330 92 350 88 390 70 C425 55 455 64 500 82" />
                  {[60, 45, 30, 15, 0].map((label, index) => <text key={label} x="28" y={29 + index * 39}>{label}</text>)}
                  {['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'].map((label, index) => <text key={label} x={52 + index * 89.6} y="200">{label}</text>)}
                </svg>
              </article>

              <article className="admin-chart-card">
                <h2>Platform Login Activity</h2>
                <div className="bar-chart">
                  {[
                    ['Mon', 64],
                    ['Tue', 82],
                    ['Wed', 88],
                    ['Thu', 78],
                    ['Fri', 96],
                    ['Sat', 42],
                    ['Sun', 28],
                  ].map(([day, value]) => (
                    <div className="bar-column" key={day}>
                      <span style={{ height: `${value}%` }} />
                      <label>{day}</label>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            <section className="recent-activity-card">
              <h2>Recent Activity</h2>
              <div className="recent-activity-list">
                {recentRows.map((row) => (
                  <div className="recent-activity-row" key={`${row.text}-${row.time}`}>
                    <span className={`activity-dot ${row.dot}`} />
                    <span className="activity-type">{row.type}</span>
                    <strong>{row.text}</strong>
                    <span className="activity-meta">{row.meta}</span>
                    <time>{row.time}</time>
                  </div>
                ))}
              </div>
            </section>
          </section>
        </main>
      </div>
    )
  }

  const _renderPlatformDashboardOld = () => (
    <div className="dashboard-shell">
      {renderPlatformSidebar()}
      <main className="dashboard-main">
        <header className="dashboard-header"><div><div className="eyebrow">Platform Admin</div><h2>Pending Approvals</h2></div><button type="button" className="primary-button" onClick={() => setView('home')}>Sign Out</button></header>
        <div className="tab-row"><button type="button" className="tab active">Pending Organizations</button><button type="button" className="tab">Pending Applications</button><button type="button" className="tab">Approved Organizations</button></div>
        <div className="approval-list">{pendingOrganizations.map((org) => <div key={org.id} className="approval-card"><div><div className="approval-name">{org.name}</div><div className="approval-meta">{org.type} • {org.country} • {org.id}</div></div><div className="approval-actions"><button type="button" className="secondary-button" onClick={() => { setOrgApprovalModal({ type: 'org', item: org }); addAudit('Review Organization', `Reviewing ${org.name}`); }}>Review</button><button type="button" className="primary-button" onClick={() => { approveOrganization(org); addAudit('Approve Organization', `Approved ${org.name}`); }}>Approve</button></div></div>)}</div>
        {applications.filter((app) => app.status === 'pending').length > 0 && <div className="approval-list app-list">{applications.filter((app) => app.status === 'pending').map((app) => <div key={app.id} className="approval-card"><div><div className="approval-name">{app.name}</div><div className="approval-meta">{app.orgName} • {app.type.toUpperCase()} app • {app.id}</div></div><div className="approval-actions"><button type="button" className="secondary-button" onClick={() => { setOrgApprovalModal({ type: 'app', item: app }); addAudit('Review Application', `Reviewing ${app.name}`); }}>Review</button><button type="button" className="primary-button" onClick={() => { approveApplication(app); addAudit('Approve Application', `Approved ${app.name}`); }}>Approve</button></div></div>)}</div>}
            <div className="approval-list schema-list">{schemas.filter(s => s.status === 'pending').map((s) => (<div key={s.id} className="approval-card"><div><div className="approval-name">{s.name}</div><div className="approval-meta">{s.orgName} • Schema • {s.id}</div></div><div className="approval-actions"><button type="button" className="ghost-button" onClick={() => { setOrgApprovalModal({ type: 'schema', item: s }); addAudit('Review Schema', `Reviewing schema ${s.name}`); }}>View</button><button type="button" className="primary-button" onClick={() => { approveSchema(s); addAudit('Approve Schema', `Schema ${s.name} approved`); }}>Approve</button><button type="button" className="secondary-button" onClick={() => { rejectSchema(s); addAudit('Reject Schema', `Schema ${s.name} rejected`); }}>Reject</button></div></div>))}</div>
      </main>
      {orgApprovalModal && renderApprovalModal()}
    </div>
  )

  const renderPlatformIdentityMgmt = () => (
    <div className="dashboard-shell">
      {renderPlatformSidebar()}
      <main className="dashboard-main">
        {renderHeader('Identity OS — Identity Management')}
        <header className="dashboard-header"><div><div className="eyebrow">Platform Admin</div><h2>Identity Management</h2></div><button type="button" className="primary-button" onClick={() => setView('home')}>Sign Out</button></header>
        <div className="panel-copy"><p>Manage identity stores, directories, and organization identity configuration.</p></div>
        <div className="approval-list">{organizations.map((org) => (<div key={org.id} className="approval-card"><div><div className="approval-name">{org.name}</div><div className="approval-meta">{org.type || '—'} • {org.country || '—'} • {org.id}</div></div><div className="approval-actions"><button className="ghost-button" onClick={() => { setOrgApprovalModal({ type: 'org', item: org}); }}>View</button>{org.status === 'approved' ? <button className="secondary-button" onClick={() => suspendOrganization(org)}>Suspend</button> : org.status === 'suspended' ? <button className="primary-button" onClick={() => unsuspendOrganization(org)}>Unsuspend</button> : null}</div></div>))}</div>
      </main>
    </div>
  )

  const renderPlatformPending = () => (
    <div className="dashboard-shell">
      {renderPlatformSidebar()}
      <main className="dashboard-main">
        {renderHeader('Identity OS — Pending Center')}
        <header className="dashboard-header"><div><div className="eyebrow">Platform Admin</div><h2>Pending Items</h2></div><button type="button" className="primary-button" onClick={() => setView('home')}>Sign Out</button></header>
        <div className="panel-copy"><p>Centralized view of all pending organizations, applications, and policies/schemas.</p></div>

        <h4>Pending Organizations</h4>
        <div className="approval-list">{pendingOrganizations.map((org) => (<div key={org.id} className="approval-card"><div><div className="approval-name">{org.name}</div><div className="approval-meta">{org.type} • {org.country} • {org.id}</div></div><div className="approval-actions"><button className="ghost-button" onClick={() => setOrgApprovalModal({ type: 'org', item: org })}>View</button><button className="primary-button" onClick={() => { approveOrganization(org); addAudit('Approve Organization', `Approved ${org.name}`); }}>Approve</button><button className="secondary-button" onClick={() => { rejectOrganization(org); addAudit('Reject Organization', `Rejected ${org.name}`); }}>Reject</button></div></div>))}</div>

        <h4 style={{marginTop:18}}>Pending Applications</h4>
        <div className="approval-list">{applications.filter(a=>a.status==='pending').map((app)=> (<div key={app.id} className="approval-card"><div><div className="approval-name">{app.name}</div><div className="approval-meta">{app.orgName} • {app.type} • {app.id}</div></div><div className="approval-actions"><button className="ghost-button" onClick={()=> setOrgApprovalModal({ type: 'app', item: app })}>View</button><button className="primary-button" onClick={()=>{ approveApplication(app); addAudit('Approve Application', `Approved ${app.name}`); }}>Approve</button></div></div>))}</div>

        <h4 style={{marginTop:18}}>Pending Schemas & Policies</h4>
        <div className="approval-list schema-list">{schemas.filter(s=>s.status==='pending').map((s)=>(<div key={s.id} className="approval-card"><div><div className="approval-name">{s.name}</div><div className="approval-meta">{s.orgName} • {s.type === 'login' ? 'Login Policy' : 'Schema'} • {s.id}</div></div><div className="approval-actions"><button className="ghost-button" onClick={()=> setOrgApprovalModal({ type: 'schema', item: s })}>View</button><button className="primary-button" onClick={()=>{ approveSchema(s); }}>{'Approve'}</button><button className="secondary-button" onClick={()=>{ rejectSchema(s); }}>{'Reject'}</button></div></div>))}</div>

      </main>
    </div>
  )

  const renderPlatformOrganizations = () => (
    <div className="dashboard-shell">
      {renderPlatformSidebar()}
      <main className="dashboard-main">
        {renderHeader('Identity OS — Organizations')}
        <header className="dashboard-header"><div><div className="eyebrow">Platform Admin</div><h2>Organizations</h2></div><button type="button" className="primary-button" onClick={() => setView('home')}>Sign Out</button></header>
        <div className="tab-row">{['All','Approved','Pending','Suspended','Rejected'].map((f) => <button key={f} type="button" className={`tab ${orgsFilter === f ? 'active' : ''}`} onClick={() => setOrgsFilter(f)}>{f}</button>)}</div>
        <div className="approval-list">{organizations.filter((org) => {
          if (orgsFilter === 'All') return true
          if (orgsFilter === 'Approved') return org.status === 'approved'
          if (orgsFilter === 'Pending') return org.status === 'pending'
          if (orgsFilter === 'Suspended') return org.status === 'suspended'
          if (orgsFilter === 'Rejected') return org.status === 'rejected'
          return true
        }).map((org) => (
          <div key={org.id} className="approval-card">
            <div>
              <div className="approval-name">{org.name}</div>
              <div className="approval-meta">{org.type || '—'} • {org.country || '—'} • {org.id}</div>
            </div>
            <div className="approval-actions">
              <button type="button" className="ghost-button" onClick={() => { setOrgApprovalModal({ type: 'org', item: org }); addAudit('View Organization', `Viewed ${org.name}`); }}>View</button>
              {org.status === 'pending' && <button type="button" className="primary-button" onClick={() => { approveOrganization(org); addAudit('Approve Organization', `Approved ${org.name}`); }}>Approve</button>}
              {org.status === 'pending' && <button type="button" className="secondary-button" onClick={() => { rejectOrganization(org); addAudit('Reject Organization', `Rejected ${org.name}`); }}>Reject</button>}
              {org.status === 'approved' && <button type="button" className="secondary-button" onClick={() => { suspendOrganization(org); addAudit('Suspend Organization', `Suspended ${org.name}`); }}>Suspend</button>}
              {org.status === 'suspended' && <button type="button" className="primary-button" onClick={() => { unsuspendOrganization(org); addAudit('Unsuspend Organization', `Unsuspended ${org.name}`); }}>Unsuspend</button>}
            </div>
          </div>
        ))}</div>
      </main>
      {orgApprovalModal && renderApprovalModal()}
    </div>
  )

  const renderOrganizationLogin = () => (
    <section className="panel-page">
      {renderHeader('Identity OS')}
      <div className="progress-indicator three-step">{[1, 2, 3].map((n) => <span key={n} className={`progress-dot ${orgLoginStage === n ? 'active' : ''}`}>{n}</span>)}</div>
      <div className="panel-copy compact"><h2>Organization Admin</h2><p>{orgLoginStage === 1 && 'Enter your Organization ID'}{orgLoginStage === 2 && 'Choose a verification channel'}{orgLoginStage === 3 && 'Enter the OTP received'}</p></div>
      <div className="form-card narrow">
        {orgLoginStage === 1 && <><div className="step-row"><label>ORGANIZATION ID<input value={orgLoginId} onChange={(e) => setOrgLoginId(e.target.value)} placeholder="org_xxxxxxxx" /></label></div>{orgLoginError && <div className="error-message">{orgLoginError}</div>}<button type="button" className="primary-button" onClick={handleOrgLoginSubmit}>Continue</button><p className="hint-text">Demo: org_7k3m9p2x</p></>}
        {orgLoginStage === 2 && <><div className="channel-list"><button type="button" className={`channel-option ${orgLoginChannel === 'email' ? 'selected' : ''}`} onClick={() => setOrgLoginChannel('email')}>Email OTP • ad****@technova.io</button><button type="button" className={`channel-option ${orgLoginChannel === 'mobile' ? 'selected' : ''}`} onClick={() => setOrgLoginChannel('mobile')}>Mobile OTP • +91-•••••43210</button></div><button type="button" className="primary-button" onClick={handleOrgLoginSubmit}>Continue</button></>}
        {orgLoginStage === 3 && <><div className="step-row"><label>ENTER OTP<input value={orgOtp} onChange={(e) => setOrgOtp(e.target.value)} placeholder="123456" /></label></div>{orgLoginError && <div className="error-message">{orgLoginError}</div>}<button type="button" className="primary-button" onClick={handleOrgLoginSubmit}>Verify OTP</button><p className="hint-text">Demo: any 6-digit code except 000000</p></>}
      </div>
    </section>
  )

  const renderPlatformSchema = () => (
    <div className="dashboard-shell">
      {renderPlatformSidebar()}
      <main className="dashboard-main">
        {renderHeader('Identity OS — Schema Approvals')}
        <header className="dashboard-header"><div><div className="eyebrow">Platform Admin</div><h2>Schema Approvals</h2></div><button type="button" className="primary-button" onClick={() => setView('home')}>Sign Out</button></header>
        <div className="panel-copy"><p>Review and approve schema definitions and login policies submitted by organizations.</p></div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,marginBottom:12}}>
          <div className="tab-row" style={{margin:0}}>
            <button className={`tab ${schemaTab === 'registration' ? 'active' : ''}`} onClick={() => setSchemaTab('registration')}>Registration Schemas</button>
            <button className={`tab ${schemaTab === 'login' ? 'active' : ''}`} onClick={() => setSchemaTab('login')}>Login Policies</button>
            <button className={`tab ${schemaTab === 'all' ? 'active' : ''}`} onClick={() => setSchemaTab('all')}>All</button>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <input placeholder="Search by name or org" value={schemaSearch} onChange={(e)=>setSchemaSearch(e.target.value)} style={{minWidth:220}} />
            <select value={schemaFilterStatus} onChange={(e)=>setSchemaFilterStatus(e.target.value)}>
              <option>All</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>
          </div>
        </div>
        <div className="approval-list schema-list">
          {schemas.filter(s => {
            // type filter
            if (schemaTab === 'registration' && s.type !== 'registration') return false
            if (schemaTab === 'login' && s.type !== 'login') return false
            // status filter
            if (schemaFilterStatus !== 'All') {
              if (s.status !== schemaFilterStatus.toLowerCase()) return false
            }
            // search filter
            if (schemaSearch && schemaSearch.trim()) {
              const q = schemaSearch.toLowerCase()
              if (!((s.name || '').toLowerCase().includes(q) || (s.orgName || '').toLowerCase().includes(q) || (s.id || '').toLowerCase().includes(q))) return false
            }
            return true
          }).map((s) => (
            <div key={s.id} className="approval-card"><div><div className="approval-name">{s.name}</div><div className="approval-meta">{s.orgName} • {s.type === 'login' ? 'Login Policy' : 'Schema'} • {s.id}</div></div><div className="approval-actions"><button type="button" className="ghost-button" onClick={() => setOrgApprovalModal({ type: 'schema', item: s })}>View</button>{s.status === 'pending' && <button type="button" className="primary-button" onClick={() => { approveSchema(s); }}>Approve</button>}{s.status === 'pending' && <button type="button" className="secondary-button" onClick={() => { rejectSchema(s); }}>Reject</button>}{s.status === 'approved' && <span className="nav-badge" style={{background:'#34d399'}}>Approved</span>}{s.status === 'rejected' && <span className="nav-badge" style={{background:'#ef4444'}}>Rejected</span>}</div></div>
          ))}
        </div>
      </main>
      {requestModal && (
        <div className="modal-backdrop" onClick={() => setRequestModal(null)}><div className="modal-card" onClick={(e) => e.stopPropagation()}><div className="modal-header"><h3>Request More Information</h3><button type="button" className="close-button" onClick={() => setRequestModal(null)}>×</button></div><div className="form-card"><label>Message<textarea value={requestModal?.message || ''} onChange={(e) => setRequestModal((prev) => ({ ...prev, message: e.target.value }))} rows={4} /></label><div style={{display:'flex',gap:12,justifyContent:'flex-end',marginTop:12}}><button className="secondary-button" onClick={() => setRequestModal(null)}>Cancel</button><button className="primary-button" onClick={() => { if (requestModal && requestModal.target) { requestMoreInfo(requestModal.target, requestModal.message || 'Please provide additional documentation'); addAudit('Request More Info', `Requested more info for ${requestModal.target.name || requestModal.target.id}`); } setRequestModal(null); }}>Send</button></div></div></div></div>
      )}
    </div>
  )

  const renderApprovalModal = () => {
    if (!orgApprovalModal) return null
    const item = orgApprovalModal.item as Organization & ApplicationRecord & SchemaRecord
    return (
      <div className="modal-backdrop" onClick={() => setOrgApprovalModal(null)}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>{orgApprovalModal.type === 'org' ? 'Organization Review' : orgApprovalModal.type === 'app' ? 'Application Review' : orgApprovalModal.type === 'schema' ? 'Schema Review' : 'Review'}</h3>
            <button type="button" className="close-button" onClick={() => setOrgApprovalModal(null)}>×</button>
          </div>

          {orgApprovalModal.type === 'schema' ? (
            <>
              <div className="review-block"><label>Schema</label><p>{item.name}</p></div>
              <div className="review-block"><label>Organization</label><p>{item.orgName} • {item.orgId}</p></div>
              <div className="review-block"><label>Fields</label><p>{(item.fields || []).join(', ')}</p></div>
              <div className="review-block"><label>Created</label><p>{item.createdAt}</p></div>
              <div className="review-block"><label>Status</label><p>{item.status}</p></div>
              <div className="modal-actions">
                {item.type === 'login' && <button type="button" className="ghost-button" onClick={() => { setPolicyPreviewModal(item); }}>Preview policy JSON</button>}
                {item.status !== 'approved' && <button type="button" className="primary-button" onClick={() => setConfirmModal({ title: 'Approve Schema', message: `Approve schema "${item.name}"? This will activate the schema for ${item.orgName || 'Global'}.`, onConfirm: async () => { approveSchema(item); addAudit('Approve Schema', `Schema ${item.name} approved`); } })}>Approve</button>}
                {item.status === 'pending' && <button type="button" className="secondary-button" onClick={() => setConfirmModal({ title: 'Reject Schema', message: `Reject schema "${item.name}"? This will mark it as rejected.`, onConfirm: async () => { rejectSchema(item); addAudit('Reject Schema', `Schema ${item.name} rejected`); } })}>Reject</button>}
              </div>
            </>
          ) : orgApprovalModal.type === 'app' ? (
            <>
              <div className="review-block"><label>Application</label><p>{item.name}</p></div>
              <div className="review-block"><label>Organization</label><p>{item.orgName} • {item.orgId || '—'}</p></div>
              <div className="review-block"><label>Type</label><p>{item.type}</p></div>
              <div className="review-block"><label>Status</label><p>{item.status}</p></div>
              <div className="modal-actions">
                {item.status !== 'approved' && <button type="button" className="primary-button" onClick={() => setConfirmModal({ title: 'Approve Application', message: `Approve application "${item.name}" from ${item.orgName || 'Unknown'}? This will generate client credentials.`, onConfirm: async () => { approveApplication(item); addAudit('Approve Application', `Approved ${item.name}`); } })}>Approve</button>}
              </div>
            </>
          ) : (
            <>
              <div className="review-block"><label>Name</label><p>{item.name}</p></div>
              <div className="review-block"><label>Type</label><p>{item.type}</p></div>
              <div className="review-block"><label>Identifier</label><p>{item.id}</p></div>
              <div className="review-block"><label>Registration Details</label><p>{item.registrationDetails ? JSON.stringify(item.registrationDetails) : '—'}</p></div>
              <div className="review-block"><label>Representative</label><p>{item.representative ? `${item.representative.name} • ${item.representative.email} • ${item.representative.mobile}` : '—'}</p></div>
              <div className="review-block"><label>Documents</label><p>{(item.documents || []).length > 0 ? (item.documents.map(d => d.name).join(', ')) : '—'}</p></div>
              <div className="review-block"><label>Submitted</label><p>{item.submittedAt || '—'}</p></div>
              <div className="review-block"><label>Verification Status</label><p>{item.status}</p></div>
              <div className="modal-actions">
                {item.status !== 'approved' && item.status !== 'suspended' && <button type="button" className="primary-button" onClick={() => setConfirmModal({ title: 'Approve Organization', message: `Approve organization "${item.name}"? This will activate the organization and create an org admin account.`, onConfirm: async () => { approveOrganization(item); addAudit('Approve Organization', `Approved ${item.name}`); } })}>Approve</button>}
                {item.status === 'approved' && <button type="button" className="secondary-button" onClick={() => setConfirmModal({ title: 'Suspend Organization', message: `Suspend organization "${item.name}"? This will deactivate access for the organization.`, onConfirm: async () => { suspendOrganization(item); addAudit('Suspend Organization', `Suspended ${item.name}`); } })}>Suspend</button>}
                {item.status === 'suspended' && <button type="button" className="primary-button" onClick={() => setConfirmModal({ title: 'Unsuspend Organization', message: `Unsuspend organization "${item.name}"? This will restore organization access.`, onConfirm: async () => { unsuspendOrganization(item); addAudit('Unsuspend Organization', `Unsuspended ${item.name}`); } })}>Unsuspend</button>}
                {item.status === 'pending' && <button type="button" className="secondary-button" onClick={() => setConfirmModal({ title: 'Reject Organization', message: `Reject organization "${item.name}"? This will mark the registration as rejected.`, onConfirm: async () => { rejectOrganization(item); addAudit('Reject Organization', `Rejected ${item.name}`); } })}>Reject</button>}
                {item.status === 'pending' && <button type="button" className="ghost-button" onClick={() => setRequestModal({ target: item, open: true })}>Request More Information</button>}
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  const renderCredentialModal = () => {
    if (!orgCredentialModal) return null
    const { org, username, password } = orgCredentialModal
    return (
      <div className="modal-backdrop" onClick={() => setOrgCredentialModal(null)}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Organization Admin Credentials</h3>
            <button type="button" className="close-button" onClick={() => setOrgCredentialModal(null)}>×</button>
          </div>
          <div className="form-card">
            <div className="review-block"><label>Organization</label><p>{org.name} • {org.id}</p></div>
            <div className="review-block"><label>Username</label><p><code style={{background:'rgba(0,0,0,0.25)',padding:'4px 8px',borderRadius:6}}>{username}</code></p></div>
            <div className="review-block"><label>Password</label><p><code style={{background:'rgba(0,0,0,0.25)',padding:'4px 8px',borderRadius:6}}>{password}</code></p></div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:12,marginTop:12}}>
              <button className="secondary-button" onClick={() => { try { navigator.clipboard.writeText(`username: ${username}\npassword: ${password}`); alert('Credentials copied to clipboard') } catch { alert('Unable to copy to clipboard in this environment') } }}>Copy</button>
              <button className="primary-button" onClick={() => setOrgCredentialModal(null)}>Close</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderPolicyPreviewModal = () => {
    if (!policyPreviewModal) return null
    const item = policyPreviewModal
    const json = 'payload' in item && item.payload
      ? JSON.stringify(item.payload, null, 2)
      : 'authenticationMethods' in item
        ? JSON.stringify({ authenticationMethods: item.authenticationMethods, mfa: item.mfa, mfaMethods: item.mfaMethods, riskAuthentication: item.riskAuthentication, flow: item.flow }, null, 2)
        : JSON.stringify({}, null, 2)
    return (
      <div className="modal-backdrop" onClick={() => setPolicyPreviewModal(null)}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header"><h3>Policy JSON Preview</h3><button className="close-button" onClick={() => setPolicyPreviewModal(null)}>×</button></div>
          <div className="form-card"><pre style={{whiteSpace: 'pre-wrap', maxHeight: 420, overflow: 'auto', background:'#071127', padding:12, borderRadius:8}}>{json}</pre><div style={{display:'flex',justifyContent:'flex-end',marginTop:12}}><button className="primary-button" onClick={() => setPolicyPreviewModal(null)}>Close</button></div></div>
        </div>
      </div>
    )
  }

  const renderConfirmModal = () => {
    if (!confirmModal) return null
    const { title, message, onConfirm } = confirmModal
    return (
      <div className="modal-backdrop" onClick={() => { if (!confirmProcessing) setConfirmModal(null) }}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header"><h3>{title || 'Confirm'}</h3><button className="close-button" onClick={() => { if (!confirmProcessing) setConfirmModal(null) }}>×</button></div>
          <div className="form-card">
            <p style={{marginBottom:12}}>{message}</p>
            <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
              <button className="secondary-button" disabled={confirmProcessing} onClick={() => setConfirmModal(null)}>Cancel</button>
              <button className="primary-button" disabled={confirmProcessing} onClick={async () => { try { setConfirmProcessing(true); // allow the provided action to run
                    await (onConfirm ? onConfirm() : Promise.resolve());
                  } catch (e) {
                    console.error('Confirm action failed', e)
                    alert('Action failed: ' + String(e))
                  } finally { setConfirmProcessing(false); setConfirmModal(null); } }}> {confirmProcessing ? 'Processing...' : 'Confirm'}</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  function RegistrationBuilder() {
    const [fields, setFields] = useState(() => {
      try { const saved = JSON.parse(readStorage('registration_builder') || 'null') ; return saved || [{ name: 'fullName', label: 'Full Name', type: 'text', required: true }]
      } catch { return [{ name: 'fullName', label: 'Full Name', type: 'text', required: true }] }
    })
    const [selectedIndex, setSelectedIndex] = useState(0)

    const addField = (type) => {
      const f = { name: `${type}_${Date.now().toString().slice(-4)}`, label: type.charAt(0).toUpperCase() + type.slice(1), type, required: false }
      setFields(prev => { const next = [...prev, f]; localStorage.setItem('registration_builder', JSON.stringify(next)); return next })
    }
    const updateField = (idx, patch) => setFields(prev => { const copy = [...prev]; copy[idx] = { ...copy[idx], ...patch }; localStorage.setItem('registration_builder', JSON.stringify(copy)); return copy })
    const moveUp = (idx) => { if (idx === 0) return; setFields(prev => { const copy = [...prev]; const tmp = copy[idx-1]; copy[idx-1]=copy[idx]; copy[idx]=tmp; localStorage.setItem('registration_builder', JSON.stringify(copy)); return copy }) }
    const removeField = (idx) => setFields(prev => { const copy = prev.filter((_,i)=>i!==idx); localStorage.setItem('registration_builder', JSON.stringify(copy)); return copy })

    return (
      <section className="panel-page">
        {renderHeader('Registration Form Builder')}
        <div className="builder-grid">
          <div className="builder-palette form-card">
            <h4>Available Fields</h4>
            {['text','email','phone','password','date','dropdown','checkbox','address','file','gov-id','custom'].map((t)=> (
              <button key={t} className="ghost-button" draggable onDragStart={(e)=> e.dataTransfer.setData('text/plain', t)} onClick={() => addField(t)}>{t}</button>
            ))}
          </div>
          <div className="builder-preview form-card" onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{ e.preventDefault(); const t = e.dataTransfer.getData('text/plain'); if (t) addField(t); }}>
            <h4>Live Preview</h4>
            <form>
              {fields.map((f, idx) => {
                  const control = f.type === 'dropdown' ? (<select>{(f.options||['Option 1']).map((o,oi)=>(<option key={oi}>{o}</option>))}</select>) : f.type === 'checkbox' ? (<input type="checkbox" />) : (<input placeholder={f.label} />)
                  return (
                    <div key={f.name} className="field-row" onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{ e.preventDefault(); const src = e.dataTransfer.getData('text/index'); if (src) { const s = Number(src); if (!Number.isNaN(s) && s !== idx) { const copy = [...fields]; const [moved] = copy.splice(s,1); copy.splice(idx,0,moved); setFields(copy); localStorage.setItem('registration_builder', JSON.stringify(copy)); setSelectedIndex(idx); } } }}>
                                    <span className="drag-handle" draggable onDragStart={(e)=>{ e.dataTransfer.setData('text/index', String(idx)); }} title="Drag to reorder" />
                                    <div className="control-wrap" style={{flex:1}}>
                                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                                        <label style={{ display: 'block', fontSize: 12, opacity: 0.9, fontWeight:600 }}>{f.label}{f.required ? ' *' : ''}</label>
                                        <span className="field-type-chip">{(f.type||'text').toUpperCase()}</span>
                                      </div>
                                      {control}
                                    </div>
                                  </div>
                                )
                              })}
            </form>
            <div style={{marginTop:12}}><h5>Generated JSON</h5><pre style={{whiteSpace:'pre-wrap',maxHeight:200,overflow:'auto',background:'#071127',padding:12,borderRadius:8}}>{JSON.stringify({ registrationFields: fields }, null, 2)}</pre></div>
          </div>
          <div className="builder-config form-card">
            <h4>Field Configuration</h4>
            {fields.length===0 ? <p>No fields. Add one from left.</p> : (
              <>
                <div style={{display:'flex',gap:8}}>{fields.map((f,idx)=><button key={f.name} className={`ghost-button ${selectedIndex===idx?'active':''}`} onClick={()=>setSelectedIndex(idx)}>{f.label}</button>)}</div>
                <div style={{marginTop:12}}>
                  <label>Field Label<input value={fields[selectedIndex]?.label||''} onChange={(e)=>updateField(selectedIndex,{label:e.target.value})} /></label>
                  <label>Field Name<input value={fields[selectedIndex]?.name||''} onChange={(e)=>updateField(selectedIndex,{name:e.target.value})} /></label>
                  <label>Required<select value={fields[selectedIndex]?.required? 'yes':'no'} onChange={(e)=>updateField(selectedIndex,{required:e.target.value==='yes'})}><option value="no">Optional</option><option value="yes">Required</option></select></label>
                  <label>Validation Regex<input value={fields[selectedIndex]?.regex||''} onChange={(e)=>updateField(selectedIndex,{regex:e.target.value})} placeholder="^\\w+@\\w+\\.com$" /></label>
                  <label>Verification<select value={fields[selectedIndex]?.verification||''} onChange={(e)=>updateField(selectedIndex,{verification:e.target.value})}><option value="">None</option><option value="otp">OTP</option><option value="identity">Identity Verification</option></select></label>
                  <label><input type="checkbox" checked={!!fields[selectedIndex]?.encrypted} onChange={(e)=>updateField(selectedIndex,{encrypted:e.target.checked})} /> Encrypt this field</label>

                  {/* Dropdown options editor */}
                  {fields[selectedIndex]?.type === 'dropdown' && (
                    <div style={{marginTop:10}}>
                      <label style={{display:'block',marginBottom:8}}>Options</label>
                      <div style={{display:'grid',gap:8}}>
                        {(fields[selectedIndex]?.options || ['Option 1']).map((opt, oi) => (
                          <div key={oi} style={{display:'flex',gap:8,alignItems:'center'}}>
                            <input value={opt} onChange={(e)=>{ const copy = [...fields]; copy[selectedIndex] = { ...copy[selectedIndex], options: (copy[selectedIndex].options||[]).map((o, idx) => idx===oi ? e.target.value : o) }; setFields(copy); localStorage.setItem('registration_builder', JSON.stringify(copy)); }} />
                            <button className="ghost-button" onClick={()=>{ const copy=[...fields]; const arr = copy[selectedIndex].options? [...copy[selectedIndex].options] : (copy[selectedIndex].options=[] , ['Option 1']); arr.splice(oi,1); copy[selectedIndex] = { ...copy[selectedIndex], options: arr }; setFields(copy); localStorage.setItem('registration_builder', JSON.stringify(copy)); }}>Remove</button>
                          </div>
                        ))}
                        <button className="ghost-button" onClick={()=>{ const copy=[...fields]; const arr = copy[selectedIndex].options? [...copy[selectedIndex].options] : []; arr.push(`Option ${arr.length+1}`); copy[selectedIndex] = { ...copy[selectedIndex], options: arr }; setFields(copy); localStorage.setItem('registration_builder', JSON.stringify(copy)); }}>Add Option</button>
                      </div>
                    </div>
                  )}
                  <div style={{display:'flex',gap:8,marginTop:8}}><button className="secondary-button" onClick={()=>moveUp(selectedIndex)}>Move Up</button><button className="secondary-button" onClick={()=>removeField(selectedIndex)}>Remove</button></div>
                </div>
                <div style={{marginTop:12,display:'flex',flexDirection:'column',gap:8}}>
                  <input placeholder="Schema name (e.g., Customer Signup)" defaultValue={readStorage('registration_builder_schema_name') || ''} onChange={(e)=>{ const name=e.target.value; /* store transient name in localStorage separately */ localStorage.setItem('registration_builder_schema_name', name); }} />
                  <div style={{display:'flex',gap:8}}><button className="primary-button" onClick={()=>{ localStorage.setItem('registration_builder', JSON.stringify(fields)); alert('Saved registration form schema to localStorage') }}>Save Draft</button><button className="ghost-button" onClick={()=>{ const schemaName = localStorage.getItem('registration_builder_schema_name') || `Schema_${Date.now()}`; const preview: SchemaRecord = { id: `schema_preview_${Date.now()}`, type: 'registration', name: schemaName, orgId: null, orgName: (currentOrg && currentOrg.name) || 'Unassigned', fields: fields.map(f=>({ name:f.name, label:f.label, type:f.type, required:!!f.required, regex:f.regex||null, verification:f.verification||null, encrypted:!!f.encrypted, options:f.options||[] })), status: 'preview', createdAt: new Date().toLocaleString() }; setPublishModal(preview); }}>Publish</button></div></div>
              </>
            )}
          </div>
        </div>
      </section>
    )
  }

  // expose registration builder view mapping
  // when view === 'org-registration-builder', render the component
  
  const handleOrgMenuClick = (item: string) => {
    if (item === 'Dashboard') setView('organization-dashboard')
    if (item === 'Organization Profile') setView('org-profile')
    if (item === 'Registration Builder') setView('org-registration-builder')
    if (item === 'Login Configuration') setView('org-login-builder')
    if (item === 'Applications') setView('org-applications')
  }

  const renderOrgSidebar = (activeItem: string) => {
    const org = currentOrg || approvedOrganizations[0]
    return (
      <aside className="org-sidebar org-admin-sidebar">
        <div className="org-sidebar-brand">
          <span className="platform-brand-icon"><AdminIcon name="shield" /></span>
          <span><strong>{org?.name || 'Organization'}</strong><small>{org?.id || orgLoginId}</small></span>
        </div>
        <nav>
          {orgAdminMenu.map((item) => (
            <button type="button" key={item} className={`menu-item ${item === activeItem ? 'active' : ''}`} onClick={() => handleOrgMenuClick(item)}>
              <span className="nav-item-label"><AdminIcon name={item === 'Organization Profile' ? 'organizations' : item === 'Applications' ? 'applications' : item === 'Registration Builder' ? 'schema' : item === 'Login Configuration' ? 'auth' : item === 'Audit Logs' ? 'audit' : item === 'API Credentials' ? 'api' : item === 'Identity Management' || item === 'Users' ? 'identity' : item === 'Webhooks' ? 'trust' : 'dashboard'} />{item}</span>
            </button>
          ))}
        </nav>
      </aside>
    )
  }

  const renderOrgProfile = () => {
    const org = currentOrg || approvedOrganizations[0]
    const representative = org?.representative
    const registrationNumber = org?.registrationDetails?.gst || org?.registrationDetails?.registrationNumber || '-'
    const initials = (representative?.name || org?.name || 'Org').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()

    return (
      <div className="org-dashboard-shell org-profile-shell">
        {renderOrgSidebar('Organization Profile')}
        <main className="org-main org-profile-main">
          <header className="org-profile-topbar">
            <h1>Organization Profile</h1>
            <div className="org-user-chip"><span>{initials}</span>{representative?.name || 'Organization Admin'}</div>
          </header>

          <section className="org-profile-content">
            <article className="org-profile-card org-profile-summary">
              <div className="org-profile-hero">
                <span className="org-profile-logo"><AdminIcon name="organizations" /></span>
                <div>
                  <h2>{org?.name || '-'}</h2>
                  <div className="org-profile-badges">
                    <span>{org?.type || '-'}</span>
                    <span className="approved">Approved</span>
                  </div>
                  <code>{org?.id || orgLoginId}</code>
                </div>
              </div>

              <div className="org-profile-details-grid">
                <ProfileField label="Organization ID" value={org?.id || orgLoginId} mono />
                <ProfileField label="Name" value={org?.name} />
                <ProfileField label="Type" value={org?.type} />
                <ProfileField label="Country" value={org?.country} />
                <ProfileField label="Official Email" value={org?.email} />
                <ProfileField label="Phone" value={org?.phone} />
                <ProfileField label="Registration Type" value={org?.registrationType || (org?.registrationDetails?.gst ? 'GST' : '-')} />
                <ProfileField label="Registration Number" value={registrationNumber} />
              </div>
            </article>

            <div className="org-profile-lower-grid">
              <article className="org-profile-card">
                <h3>Representative</h3>
                <ProfileField label="Name" value={representative?.name} />
                <ProfileField label="Email" value={representative?.email} />
                <ProfileField label="Mobile" value={representative?.mobile} />
                <ProfileField label="Designation" value={representative?.designation} />
              </article>

              <article className="org-profile-card">
                <h3>Address</h3>
                <p className="org-profile-address">{org?.address || '-'}</p>
                <ProfileField label="Website" value={org?.website || org?.domain} link />
              </article>
            </div>
          </section>
        </main>
      </div>
    )
  }

  const renderOrgAdminDashboard = () => (
    <div className="org-dashboard-shell">
      {renderOrgSidebar('Dashboard')}
      <main className="org-main">
        <header className="org-main-header"><div><div className="eyebrow">Organization Admin</div><h2>{currentOrg?.name || 'TechNova Solutions'} Overview</h2></div><div style={{display:'flex',gap:12}}><button type="button" className="secondary-button" onClick={() => setView('home')}>Sign Out</button><button type="button" className="primary-button" onClick={() => setView('org-registration-builder')}>Open Registration Builder</button></div></header>        <section className="kpi-grid">
          <div className="kpi-card"><strong>{100 + (applications.length || 0)}</strong><span>Total Users</span></div>
          <div className="kpi-card"><strong>{Math.max(0, 80)}</strong><span>Active Users</span></div>
          <div className="kpi-card"><strong>{applications.length}</strong><span>Applications</span></div>
          <div className="kpi-card"><strong>{pendingOrganizations.length}</strong><span>Registration Requests</span></div>
          <div className="kpi-card"><strong>{4200}</strong><span>Login Attempts</span></div>
          <div className="kpi-card"><strong>{3}</strong><span>Security Alerts</span></div>
        </section>
        <section className="chart-grid"><div className="chart-card large"><h4>User Registration Trend</h4><div className="chart-bars">{[20, 40, 55, 70, 80, 95].map((value) => <span key={value} style={{ height: `${value}%` }} />)}</div></div><div className="chart-card"><h4>Login Success vs Failure</h4><div className="donut-wrapper"><div className="donut" /></div></div><div className="chart-card"><h4>Authentication Methods</h4><ul className="mini-list"><li>Password 60%</li><li>OTP 30%</li><li>SSO 10%</li></ul></div><div className="chart-card wide"><h4>Recent Activity</h4><ul className="activity-list">{(applications.slice(0,5)).map(a => <li key={a.id}>{a.orgName} requested {a.name}</li>)}</ul></div></section>
      </main>
    </div>
  )

  const renderOrgApplications = () => {
    const orgId = currentOrg?.id || orgLoginId
    const orgApps = applications.filter(a => a.orgId === orgId)
    return (
      <div className="org-dashboard-shell">
        {renderOrgSidebar('Applications')}
        <main className="org-main org-applications-main">
          <header className="org-main-header"><div><div className="eyebrow">Organization Admin</div><h2>Applications — {currentOrg?.name || orgId}</h2><div className="subtle">Manage applications registered by your organization. Submit new apps for platform approval.</div></div><div style={{display:'flex',gap:12}}><button type="button" className="secondary-button" onClick={() => setView('organization-dashboard')}>Back</button><button type="button" className="primary-button" onClick={() => setRegisterAppModal(true)}>Register Application</button></div></header>
          <div className="panel-copy"><p>Manage your applications and submit new applications to the platform for approval.</p></div>
          <section style={{padding:12}}>
            {orgApps.length === 0 ? <div className="form-card"><p>No applications yet. Click Register Application to add one.</p></div> : (
              <div className="org-app-grid">
                {orgApps.map(app => (
                  <div key={app.id} className="org-app-card">
                    <div className="org-app-left">
                      <div className="app-icon">{(app.type||'app').charAt(0).toUpperCase()}</div>
                      <div className="app-info">
                        <div className="approval-name">{app.name}</div>
                        <div className="approval-meta">{app.type} • {app.id}</div>
                        <div className="app-desc"><small>{app.description}</small></div>
                        <div className="app-meta-row"><span className={`app-status-badge status-${app.status}`}>{app.status}</span><span className="created-at">{app.createdAt}</span></div>
                      </div>
                    </div>
                    <div className="org-app-actions">
                      <button className="ghost-button" onClick={() => setOrgApprovalModal({ type: 'app', item: app })}>View</button>
                      {app.status === 'pending' && <button className="secondary-button" onClick={() => { setApplications(prev => prev.filter(a => a.id !== app.id)); addAudit('Withdraw Application', `Withdrew ${app.name}`); }}>Withdraw</button>}
                      {app.status === 'approved' && <>
                        <button className="secondary-button" onClick={() => { navigator.clipboard?.writeText(app.clientId || '') ; alert('Client ID copied to clipboard') }}>Copy Client ID</button>
                        <button className="secondary-button" onClick={() => { setAppCredentialModal({ app, clientId: app.clientId, clientSecret: app.clientSecret }); }}>View Credentials</button>
                      </>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>

        {registerAppModal && (
          <div className="modal-backdrop" onClick={() => setRegisterAppModal(false)}>
            <div className="modal-card register-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header"><h3>Register Application</h3><button className="close-button" onClick={() => setRegisterAppModal(false)}>×</button></div>
              <div className="form-card">
                <div className="register-form-grid">
                  <label className="full">Application Name<input value={registerAppForm.name} onChange={(e) => setRegisterAppForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Identity Suite" /></label>
                  <label>Type<select value={registerAppForm.type} onChange={(e) => setRegisterAppForm(prev => ({ ...prev, type: e.target.value }))}><option value="web">Web</option><option value="mobile">Mobile</option><option value="spa">Single Page App</option><option value="backend">Backend</option></select></label>
                  <label>Contact Email<input value={registerAppForm.contactEmail} onChange={(e) => setRegisterAppForm(prev => ({ ...prev, contactEmail: e.target.value }))} placeholder="owner@company.com" /></label>
                  <label>Domain<input value={registerAppForm.domain} onChange={(e) => setRegisterAppForm(prev => ({ ...prev, domain: e.target.value }))} placeholder="app.company.com" /></label>
                  <label className="full">Description<textarea value={registerAppForm.description} onChange={(e) => setRegisterAppForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Describe what this application does" /></label>
                  <label>Redirect URI<input value={registerAppForm.redirectUri} onChange={(e) => setRegisterAppForm(prev => ({ ...prev, redirectUri: e.target.value }))} placeholder="https://app.company.com/callback" /></label>
                  <label>Logout URI<input value={registerAppForm.logoutUri} onChange={(e) => setRegisterAppForm(prev => ({ ...prev, logoutUri: e.target.value }))} placeholder="https://app.company.com/logout" /></label>
                </div>
                <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:12}}>
                  <button className="secondary-button" onClick={() => setRegisterAppModal(false)}>Cancel</button>
                  <button className="primary-button" onClick={() => {
                    // validation
                    if (!registerAppForm.name) { alert('Name is required'); return }
                    const newApp = { id: `app-${Date.now()}`, orgId: orgId || null, orgName: currentOrg?.name || 'Unknown', name: registerAppForm.name, type: registerAppForm.type || 'web', description: registerAppForm.description || '', contactEmail: registerAppForm.contactEmail || '', domain: registerAppForm.domain || '', redirectUri: registerAppForm.redirectUri || '', logoutUri: registerAppForm.logoutUri || '', status: 'pending', createdAt: new Date().toLocaleString() }
                    setApplications(prev => [newApp, ...prev])
                    addAudit('Submit Application', `Submitted application ${newApp.name} for approval`)
                    setRegisterAppForm({ name:'', type:'web', description:'', contactEmail:'', domain:'', redirectUri:'', logoutUri:'' })
                    setRegisterAppModal(false)
                    alert('Application submitted for platform approval')
                  }}>Submit</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderPublishModal = () => {
    if (!publishModal) return null
    return (
      <div className="modal-backdrop" onClick={() => setPublishModal(null)}>
        <div className="modal-card" onClick={(e)=>e.stopPropagation()}>
          <div className="modal-header"><h3>Publish Schema</h3><button className="close-button" onClick={()=>setPublishModal(null)}>×</button></div>
          <div className="form-card">
            <div className="review-block"><label>Name</label><p>{publishModal.name}</p></div>
            <div className="review-block"><label>Fields</label><p>{(publishModal.fields || []).map(f=>typeof f === 'string' ? f : f.label).join(', ')}</p></div>
            <div className="review-block"><label>Target Organization</label>
              <select defaultValue={publishModal.orgId || 'GLOBAL'} onChange={(e)=>{ const val = e.target.value; setPublishModal(prev => prev ? ({ ...prev, orgId: val === 'GLOBAL' ? null : val }) : prev); }}>
                <option value="GLOBAL">Global (no org)</option>
                {organizations.map(o => <option key={o.id} value={o.id}>{o.name} — {o.id}</option>)}
              </select>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
              <button className="secondary-button" onClick={()=>setPublishModal(null)}>Cancel</button>
              <button className="primary-button" onClick={()=>{
                const newSchema = { id: `schema_${Date.now()}`, type: 'registration', name: publishModal.name, orgId: publishModal.orgId || (currentOrg && currentOrg.id) || null, orgName: (publishModal.orgId && organizations.find(o=>o.id===publishModal.orgId)?.name) || (currentOrg && currentOrg.name) || 'Unassigned', fields: publishModal.fields, status: 'pending', createdAt: new Date().toLocaleString() }
                setSchemas(prev=>[newSchema,...prev])
                addAudit('Submit Registration Schema', `Submitted registration schema ${newSchema.name} for approval`)
                if (newSchema.orgId) { setOrganizations(prev => prev.map(o => o.id === newSchema.orgId ? ({ ...o, registrationSchemas: [...(o.registrationSchemas||[]), newSchema] }) : o)); }
                setPublishModal(null)
                alert('Schema submitted for approval')
              }}>Confirm Publish</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderLoginPublishModal = () => {
    if (!loginPublishModal) return null
    const defaultSelection = loginPublishModal.orgId || 'GLOBAL'
    return (
      <div className="modal-backdrop" onClick={() => setLoginPublishModal(null)}>
        <div className="modal-card" onClick={(e)=>e.stopPropagation()}>
          <div className="modal-header"><h3>Publish Login Policy</h3><button className="close-button" onClick={()=>setLoginPublishModal(null)}>×</button></div>
          <div className="form-card">
            <div className="review-block"><label>Policy</label><p>{loginPublishModal.name}</p></div>
            <div className="review-block"><label>Authentication Methods</label><p>{(loginPublishModal.authenticationMethods||[]).join(', ')}</p></div>
            <div className="review-block"><label>Target Organization</label>
              <select defaultValue={defaultSelection} onChange={(e)=>{ const val = e.target.value; setLoginPublishModal(prev => prev ? ({ ...prev, orgId: val === 'GLOBAL' ? null : val }) : prev) }}>
                <option value="GLOBAL">Global (no org)</option>
                {organizations.map(o => <option key={o.id} value={o.id}>{o.name} — {o.id}</option>)}
              </select>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
              <button className="secondary-button" onClick={()=>setLoginPublishModal(null)}>Cancel</button>
              <button className="primary-button" onClick={()=>{
                const schemaEntry = {
                  id: `schema_login_${Date.now()}`,
                  type: 'login',
                  name: loginPublishModal.name,
                  orgId: loginPublishModal.orgId || null,
                  orgName: (loginPublishModal.orgId && organizations.find(o=>o.id===loginPublishModal.orgId)?.name) || 'Global',
                  payload: { authenticationMethods: loginPublishModal.authenticationMethods, mfa: loginPublishModal.mfa, mfaMethods: loginPublishModal.mfaMethods, riskAuthentication: loginPublishModal.riskAuthentication, flow: loginPublishModal.flow },
                  status: 'pending',
                  createdAt: new Date().toLocaleString()
                }
                setSchemas(prev => [schemaEntry, ...prev])
                addAudit('Submit Login Policy', `Submitted login policy ${schemaEntry.name} for approval`)
                setLoginPublishModal(null)
                alert('Login policy submitted for platform approval')
              }}>Confirm Publish</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  function LoginBuilder() {
    const authOptions = [
      { key: 'PASSWORD', label: 'Username + Password' },
      { key: 'EMAIL_PASSWORD', label: 'Email + Password' },
      { key: 'MOBILE_OTP', label: 'Mobile OTP' },
      { key: 'EMAIL_OTP', label: 'Email OTP' },
      { key: 'BIOMETRIC', label: 'Biometric' },
      { key: 'SOCIAL', label: 'Social Login' },
      { key: 'HARDWARE', label: 'Hardware Token' },
    ]

    const [selectedMethods, setSelectedMethods] = useState(() => {
      try { const raw = readStorage('catalogue_login_builder_methods'); return raw ? JSON.parse(raw) : ['PASSWORD'] } catch { return ['PASSWORD'] }
    })
    const [flowSteps, setFlowSteps] = useState(() => {
      try { const raw = readStorage('catalogue_login_builder_flow'); return raw ? JSON.parse(raw) : ['Identifier','Identity Lookup','Authentication Verification','MFA Check','Success'] } catch { return ['Identifier','Identity Lookup','Authentication Verification','MFA Check','Success'] }
    })
    const [mfaEnabled, setMfaEnabled] = useState(() => { try { const raw = readStorage('catalogue_login_builder_mfa'); return raw ? JSON.parse(raw) : true } catch { return true } })
    const [mfaMethods, setMfaMethods] = useState(() => { try { const raw = readStorage('catalogue_login_builder_mfa_methods'); return raw ? JSON.parse(raw) : ['OTP'] } catch { return ['OTP'] } })
    const [riskAuth, setRiskAuth] = useState(() => { try { const raw = readStorage('catalogue_login_builder_risk'); return raw ? JSON.parse(raw) : false } catch { return false } })
    const [policyName, setPolicyName] = useState(() => readStorage('catalogue_login_builder_policy_name') || `Login Policy ${new Date().toLocaleDateString()}`)

    const toggleMethod = (key) => {
      setSelectedMethods((prev) => {
        const next = prev.includes(key) ? prev.filter((p)=>p!==key) : [...prev, key]
        localStorage.setItem('catalogue_login_builder_methods', JSON.stringify(next))
        return next
      })
    }

    const moveStep = (idx, dir) => {
      setFlowSteps((prev) => {
        const copy = [...prev]
        const t = copy.splice(idx,1)[0]
        copy.splice(idx + dir, 0, t)
        localStorage.setItem('catalogue_login_builder_flow', JSON.stringify(copy))
        return copy
      })
    }

    const toggleMfaMethod = (m) => {
      setMfaMethods((prev) => {
        const next = prev.includes(m) ? prev.filter(x=>x!==m) : [...prev, m]
        localStorage.setItem('catalogue_login_builder_mfa_methods', JSON.stringify(next))
        return next
      })
    }

    const saveDraft = () => {
      const draft = { id: `draft_${Date.now()}`, name: policyName, authenticationMethods: selectedMethods, mfa: mfaEnabled, mfaMethods, riskAuthentication: riskAuth, flow: flowSteps, orgId: (currentOrg && currentOrg.id) || null, createdAt: new Date().toLocaleString() }
      // store as transient draft in localStorage
      localStorage.setItem('catalogue_login_builder_draft', JSON.stringify(draft))
      alert('Draft saved locally')
    }

    const publishPolicy = () => {
      // open publish modal so user can select org target (or Global)
      const policy = { id: `policy_${Date.now()}`, name: policyName, authenticationMethods: selectedMethods, mfa: mfaEnabled, mfaMethods, riskAuthentication: riskAuth, flow: flowSteps, orgId: (currentOrg && currentOrg.id) || null, createdAt: new Date().toLocaleString() }
      setLoginPublishModal(policy)
    }

    const generatedJSON = JSON.stringify({ authenticationMethods: selectedMethods, mfa: mfaEnabled, mfaMethods, riskAuthentication: riskAuth, flow: flowSteps }, null, 2)

    return (
      <section className="panel-page">
        {renderHeader('Login Page Builder')}
        <div className="builder-grid">
          <div className="builder-palette form-card">
            <h4>Authentication Methods</h4>
            {authOptions.map((opt) => (
              <label key={opt.key} style={{display:'block',marginBottom:8}}>
                <input type="checkbox" checked={selectedMethods.includes(opt.key)} onChange={()=>toggleMethod(opt.key)} /> {opt.label}
              </label>
            ))}
            <div style={{marginTop:12}}>
              <h5>MFA</h5>
              <label style={{display:'block'}}><input type="checkbox" checked={mfaEnabled} onChange={(e)=>{ setMfaEnabled(e.target.checked); localStorage.setItem('catalogue_login_builder_mfa', JSON.stringify(e.target.checked)) }} /> Enable MFA</label>
              {mfaEnabled && (
                <div style={{marginTop:8}}>
                  <label style={{display:'block'}}><input type="checkbox" checked={mfaMethods.includes('OTP')} onChange={()=>toggleMfaMethod('OTP')} /> OTP Verification</label>
                  <label style={{display:'block'}}><input type="checkbox" checked={mfaMethods.includes('AUTH_APP')} onChange={()=>toggleMfaMethod('AUTH_APP')} /> Authenticator App</label>
                  <label style={{display:'block'}}><input type="checkbox" checked={mfaMethods.includes('BIOMETRIC')} onChange={()=>toggleMfaMethod('BIOMETRIC')} /> Biometric</label>
                </div>
              )}

              <div style={{marginTop:12}}>
                <label style={{display:'block'}}>Risk-based Authentication<input type="checkbox" checked={riskAuth} onChange={(e)=>{ setRiskAuth(e.target.checked); localStorage.setItem('catalogue_login_builder_risk', JSON.stringify(e.target.checked)) }} /></label>
              </div>
            </div>
          </div>

          <div className="builder-preview form-card">
            <h4>Login Flow Builder</h4>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {flowSteps.map((s, idx) => (
                              <div key={s} className="field-row" style={{alignItems:'center'}} onDragOver={(e)=>{ e.preventDefault(); e.dataTransfer.dropEffect='move'; }} onDrop={(e)=>{ e.preventDefault(); const src = e.dataTransfer.getData('text/index'); if (src) { const from = Number(src); const to = idx; if (!Number.isNaN(from) && from !== to) { setFlowSteps(prev => { const copy = [...prev]; const [moved] = copy.splice(from, 1); copy.splice(to, 0, moved); localStorage.setItem('catalogue_login_builder_flow', JSON.stringify(copy)); return copy }) } } }}>
                                <span className="drag-handle" draggable onDragStart={(e)=>{ e.dataTransfer.setData('text/index', String(idx)); e.dataTransfer.effectAllowed='move'; }} title="Drag to reorder" />
                                <div className="control-wrap" style={{flex:1}}>
                                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                                    <div>{idx+1}. <strong>{s}</strong></div>
                                    <span className="field-type-chip">STEP</span>
                                  </div>
                                </div>
                                <div style={{display:'flex',gap:8}}>
                                  <button className="ghost-button" onClick={()=>idx>0 && moveStep(idx, -1)}>Up</button>
                                  <button className="ghost-button" onClick={()=>idx<flowSteps.length-1 && moveStep(idx, +1)}>Down</button>
                                  <button className="ghost-button" onClick={()=>{ setFlowSteps(prev => { const copy=[...prev]; copy.splice(idx,1); localStorage.setItem('catalogue_login_builder_flow', JSON.stringify(copy)); return copy }) }}>Remove</button>
                                </div>
                              </div>
                            ))}
              <div style={{display:'flex',gap:8}}>
                <input placeholder="New step" id="newFlowStepInput" />
                <button className="ghost-button" onClick={()=>{ const el = document.getElementById('newFlowStepInput') as HTMLInputElement | null; if (!el) return; const v = el.value.trim(); if (!v) return; setFlowSteps(prev=>{ const next=[...prev, v]; localStorage.setItem('catalogue_login_builder_flow', JSON.stringify(next)); return next }); el.value=''; }}>Add Step</button>
              </div>
            </div>
          </div>

          <div className="builder-config form-card">
            <h4>Policy Configuration</h4>
            <label>Policy Name<input value={policyName} onChange={(e)=>{ setPolicyName(e.target.value); localStorage.setItem('catalogue_login_builder_policy_name', e.target.value) }} /></label>

            <div style={{marginTop:12}}>
              <h5>Preview Policy JSON</h5>
              <pre style={{background:'#071127',padding:12,borderRadius:8,maxHeight:300,overflow:'auto'}}>{generatedJSON}</pre>
            </div>

            <div style={{display:'flex',gap:8,marginTop:12}}>
              <button className="primary-button" onClick={saveDraft}>Save Draft</button>
              <button className="ghost-button" onClick={publishPolicy}>Publish</button>
            </div>

            <div style={{marginTop:12}}>
              <h5>Existing Policies</h5>
              <ul>
                {loginPolicies.map((p) => <li key={p.id}><strong>{p.name}</strong> — {p.orgId || 'Global'} — {p.createdAt}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>
    )
  }

  const renderAppCredentialModal = () => {
    if (!appCredentialModal) return null
    const { app, clientId, clientSecret } = appCredentialModal
    return (
      <div className="modal-backdrop" onClick={() => setAppCredentialModal(null)}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header"><h3>Application Credentials</h3><button className="close-button" onClick={() => setAppCredentialModal(null)}>×</button></div>
          <div className="form-card">
            <div style={{marginBottom:12}}>
              <div><strong>{app?.name}</strong></div>
              <div style={{opacity:0.8,fontSize:12}}>{app?.orgName} • {app?.id}</div>
            </div>
            <div className="review-block"><label>Client ID</label><p style={{wordBreak:'break-all'}}>{clientId}</p></div>
            <div className="review-block"><label>Client Secret</label><p style={{wordBreak:'break-all',fontFamily:'monospace'}}>{clientSecret}</p></div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
              <button className="secondary-button" onClick={() => { try { navigator.clipboard.writeText(`clientId: ${clientId}\nclientSecret: ${clientSecret}`); alert('Credentials copied to clipboard') } catch { alert('Unable to copy to clipboard in this environment') } }}>Copy</button>
              <button className="primary-button" onClick={() => setAppCredentialModal(null)}>Close</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderPlatformApps = () => (
    <div className="dashboard-shell">
      {renderPlatformSidebar()}
      <main className="dashboard-main">
        {renderHeader('Identity OS — Applications')}
        <header className="dashboard-header"><div><div className="eyebrow">Platform Admin</div><h2>Applications</h2></div><button type="button" className="primary-button" onClick={() => setView('home')}>Sign Out</button></header>
        <div className="panel-copy"><p>Approve and manage applications registered by organizations.</p></div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,marginBottom:12}}>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <input placeholder="Search applications" value={appSearch} onChange={(e)=>setAppSearch(e.target.value)} style={{minWidth:300}} />
            <select value={appFilterStatus} onChange={(e)=>setAppFilterStatus(e.target.value)}>
              <option>All</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>
          </div>
          <div>
            <button className="primary-button" onClick={() => setView('platform-pending')}>View Pending Center</button>
          </div>
        </div>
        <div className="approval-list">
          {applications.filter(a => {
            if (appFilterStatus !== 'All' && a.status !== appFilterStatus.toLowerCase()) return false
            if (appSearch && appSearch.trim()) {
              const q = appSearch.toLowerCase()
              if (!((a.name||'').toLowerCase().includes(q) || (a.orgName||'').toLowerCase().includes(q) || (a.id||'').toLowerCase().includes(q))) return false
            }
            return true
          }).map((app) => (
            <div key={app.id} className="approval-card">
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{display:'flex',flexDirection:'column'}}>
                    <div className="approval-name">{app.name}</div>
                    <div className="approval-meta">{app.orgName} • {app.type} • {app.id}</div>
                  </div>
                  <div style={{marginLeft:12}}>
                    <span className={`app-status-badge status-${app.status}`}>{app.status}</span>
                  </div>
                </div>
                <div style={{marginTop:6}}><small style={{opacity:0.86}}>{app.description}</small></div>
              </div>
              <div className="approval-actions">
                <button className="ghost-button" onClick={() => setOrgApprovalModal({ type: 'app', item: app })}>View</button>
                {app.status === 'pending' && <button className="primary-button" onClick={() => { approveApplication(app); addAudit('Approve Application', `Approved ${app.name}`); }}>Approve</button>}
                {app.status === 'pending' && <button className="secondary-button" onClick={() => { setApplications(prev => prev.map(i => i.id === app.id ? { ...i, status: 'rejected', rejectedAt: new Date().toLocaleString() } : i)); addAudit('Reject Application', `Rejected ${app.name}`); }}>Reject</button>}
                {app.status === 'approved' && <>
                  <button className="secondary-button" onClick={() => { navigator.clipboard?.writeText(app.clientId || '') ; alert('Client ID copied to clipboard') }}>Copy Client ID</button>
                  <button className="secondary-button" onClick={() => { setAppCredentialModal({ app, clientId: app.clientId, clientSecret: app.clientSecret }); }}>View Credentials</button>
                </>}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )

  const renderPlatformAudit = () => (
    <div className="dashboard-shell">
      {renderPlatformSidebar()}
      <main className="dashboard-main">
        {renderHeader('Identity OS - Audit Logs')}
        <header className="dashboard-header">
          <div><div className="eyebrow">Platform Admin</div><h2>Audit Logs</h2></div>
          <button type="button" className="primary-button" onClick={() => setView('home')}>Sign Out</button>
        </header>
        <div className="approval-list">
          {auditLogs.length === 0 && <div className="form-card">No audit entries yet.</div>}
          {auditLogs.map((log) => (
            <div key={log.id} className="form-card" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontWeight:700}}>{log.action}</div>
                <div style={{color:'rgba(218,228,255,0.7)'}}>{log.details}</div>
              </div>
              <div style={{fontSize:12,opacity:0.8}}>{log.timestamp}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )

  return (
    <main className="app-shell">
      {view === 'home' && renderHome()}
      {view === 'registration' && renderRegistration()}
      {view === 'success' && renderSuccess()}
      {view === 'platform' && renderPlatformLogin()}
      {view === 'platform-dashboard' && renderPlatformDashboard()}
      {view === 'platform-organizations' && renderPlatformOrganizations()}
      {view === 'platform-approved' && renderPlatformOrganizations()}
      {view === 'platform-apps' && renderPlatformApps && renderPlatformApps()}
      {view === 'platform-audit' && renderPlatformAudit()}
      {view === 'platform-identity-mgmt' && renderPlatformIdentityMgmt()}
      {view === 'platform-settings' && renderPlatformOrganizations()}
      {view === 'platform-schema' && renderPlatformSchema && renderPlatformSchema()}
      {view === 'platform-pending' && renderPlatformPending && renderPlatformPending()}
      {view === 'organization' && renderOrganizationLogin()}
      {view === 'org-registration-builder' && <RegistrationBuilder />}
      {view === 'org-login-builder' && <LoginBuilder />}
      {view === 'org-applications' && renderOrgApplications && renderOrgApplications()}
      {view === 'org-profile' && renderOrgProfile()}
      {view === 'organization-dashboard' && renderOrgAdminDashboard()}

      {/* global modals */}
          {orgApprovalModal && renderApprovalModal()}
      {orgCredentialModal && renderCredentialModal()}
      {appCredentialModal && renderAppCredentialModal && renderAppCredentialModal()}
      {publishModal && renderPublishModal()}
      {loginPublishModal && renderLoginPublishModal()}
      {policyPreviewModal && renderPolicyPreviewModal()}
      {confirmModal && renderConfirmModal()}
    </main>
  )
}

export default App
