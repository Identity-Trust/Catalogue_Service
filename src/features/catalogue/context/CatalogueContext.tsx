'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { approvedOrgIds, approvedSeedOrganizations, initialApplications, initialPendingOrganizations, initialSchemas } from '../../../data/mockCatalogueData'
import type { ApplicationRecord, AppCredentialModal, ApprovalModal, AuditLog, ConfirmModal, CredentialModal, LoginPolicy, Organization, RequestModal, SavedState, SchemaRecord } from '../../../types/catalogue'
import { readStorage, writeStorage } from '../../../utils/storage'
import { getCatalogueRoute, type CatalogueView } from '../routes'

const registrationSteps = ['Basic Info', 'Registration Details', 'Representative Details', 'Address', 'Digital Presence']

const loadSaved = () => {
  try {
    const raw = readStorage('catalogue_state_v1')
    return raw ? JSON.parse(raw) as SavedState : null
  } catch {
    return null
  }
}

const createClientSecret = () => {
  try {
    const arr = new Uint8Array(24)
    window.crypto.getRandomValues(arr)
    return Array.from(arr).map((b) => (`0${b.toString(16)}`).slice(-2)).join('')
  } catch {
    return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
  }
}

interface CatalogueProviderProps {
  children: React.ReactNode
  initialView?: CatalogueView
}

const CatalogueContext = createContext<any>(null)

export function CatalogueProvider({ children, initialView = 'home' }: CatalogueProviderProps) {
  const router = useRouter()
  const [view, setCurrentView] = useState<CatalogueView>(initialView)
  const [step, setStep] = useState(0)
  const [registrationForm, setRegistrationForm] = useState({
    name: '', type: '', country: '', email: '', phone: '', gst: '', repName: '', repEmail: '', repMobile: '', designation: '', address: '', website: '', domain: '', logo: '',
  })
  const [platformLogin, setPlatformLogin] = useState({ username: '', password: '' })
  const [platformLoginError, setPlatformLoginError] = useState('')
  const [pendingOrganizations, setPendingOrganizations] = useState<Organization[]>(initialPendingOrganizations)
  const [approvedOrganizations, setApprovedOrganizations] = useState<Organization[]>(approvedSeedOrganizations)
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
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const raw = readStorage('catalogue_audit_v1')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const [loginPolicies, setLoginPolicies] = useState<LoginPolicy[]>(() => {
    try {
      const raw = readStorage('catalogue_login_policies_v1')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const saved = loadSaved()
  const [organizations, setOrganizations] = useState<Organization[]>(() => saved?.organizations || [...approvedSeedOrganizations, ...initialPendingOrganizations.map((org) => ({ ...org }))])
  const [orgsFilter, setOrgsFilter] = useState('All')
  const [orgApprovalModal, setOrgApprovalModal] = useState<ApprovalModal | null>(null)
  const [orgLoginStage, setOrgLoginStage] = useState(1)
  const [orgLoginId, setOrgLoginId] = useState('')
  const [orgLoginChannel, setOrgLoginChannel] = useState('email')
  const [orgOtp, setOrgOtp] = useState('')
  const [orgLoginError, setOrgLoginError] = useState('')
  const [successData, setSuccessData] = useState<{ orgId: string; createdAt: string; status: string } | null>(null)
  const [requestModal, setRequestModal] = useState<RequestModal | null>(null)
  const [orgCredentialModal, setOrgCredentialModal] = useState<CredentialModal | null>(null)
  const [appCredentialModal, setAppCredentialModal] = useState<AppCredentialModal | null>(null)
  const [publishModal, setPublishModal] = useState<SchemaRecord | null>(null)
  const [loginPublishModal, setLoginPublishModal] = useState<LoginPolicy | null>(null)
  const [confirmModal, setConfirmModal] = useState<ConfirmModal | null>(null)
  const [confirmProcessing, setConfirmProcessing] = useState(false)

  useEffect(() => setCurrentView(initialView), [initialView])

  const setView = (nextView: CatalogueView) => {
    setCurrentView(nextView)
    router.push(getCatalogueRoute(nextView))
  }

  const currentOrg = useMemo(() => {
    const savedOrg = organizations.find((org) => org.id === orgLoginId)
    const approvedOrg = approvedOrganizations.find((org) => org.id === orgLoginId)
    return savedOrg && approvedOrg ? { ...savedOrg, ...approvedOrg } : savedOrg || approvedOrg || null
  }, [approvedOrganizations, organizations, orgLoginId])

  const addAudit = (action: string, details: string) => {
    setAuditLogs((prev) => [{ id: `audit_${Date.now()}`, action, details, timestamp: new Date().toLocaleString() }, ...prev])
  }

  const updateRegistrationField = (field: keyof typeof registrationForm, value: string) => setRegistrationForm((prev) => ({ ...prev, [field]: value }))
  const nextStep = () => setStep((prev) => Math.min(prev + 1, registrationSteps.length - 1))
  const previousStep = () => setStep((prev) => Math.max(prev - 1, 0))

  const submitRegistration = () => {
    const generatedId = `org_${Math.random().toString(36).slice(2, 10)}`
    const newOrg: Organization = {
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
      registrationDetails: { registrationNumber: registrationForm.gst || '', gst: registrationForm.gst || '' },
      representative: { name: registrationForm.repName || '', email: registrationForm.repEmail || '', mobile: registrationForm.repMobile || '', designation: registrationForm.designation || '' },
      documents: [],
      submittedAt: new Date().toLocaleString(),
    }
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

  const approveOrganization = (org: Organization) => {
    const approved = { ...org, status: 'approved', approvedAt: new Date().toLocaleString(), orgAdminActivated: true }
    setPendingOrganizations((prev) => prev.filter((item) => item.id !== org.id))
    setApprovedOrganizations((prev) => [approved, ...prev])
    setOrganizations((prev) => prev.some((item) => item.id === org.id) ? prev.map((item) => item.id === org.id ? approved : item) : [approved, ...prev])
    setOrgCredentialModal({ org, username: `${org.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 8)}_admin`, password: Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(-2) })
    setOrgApprovalModal(null)
  }

  const rejectOrganization = (org: Organization) => {
    setPendingOrganizations((prev) => prev.filter((item) => item.id !== org.id))
    setOrganizations((prev) => prev.map((item) => item.id === org.id ? { ...item, status: 'rejected', rejectedAt: new Date().toLocaleString() } : item))
    setOrgApprovalModal(null)
  }

  const requestMoreInfo = (org: Organization, message = 'Please provide additional documentation') => {
    setOrganizations((prev) => prev.map((item) => item.id === org.id ? { ...item, status: 'requires_more_info', infoRequest: { message, requestedAt: new Date().toLocaleString() } } : item))
    setPendingOrganizations((prev) => prev.map((item) => item.id === org.id ? { ...item, status: 'requires_more_info' } : item))
    setOrgApprovalModal(null)
  }

  const approveApplication = (app: ApplicationRecord) => {
    const clientId = `client_${Math.random().toString(36).slice(2, 10)}`
    const clientSecret = createClientSecret()
    const updated = { ...app, status: 'approved', clientId, clientSecret, approvedAt: new Date().toLocaleString() }
    setApplications((prev) => prev.map((item) => item.id === app.id ? updated : item))
    setAppCredentialModal({ app: updated, clientId, clientSecret })
    setOrgApprovalModal(null)
  }

  const approveSchema = (schema: SchemaRecord) => {
    if (schema.type === 'login') {
      const policy: LoginPolicy = {
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
      const next = [policy, ...loginPolicies]
      writeStorage('catalogue_login_policies_v1', JSON.stringify(next))
      setLoginPolicies(next)
      addAudit('Approve Login Policy', `Approved login policy ${schema.name}`)
    } else {
      addAudit('Approve Schema', `Schema ${schema.name} approved`)
    }
    setSchemas((prev) => prev.map((item) => item.id === schema.id ? { ...item, status: 'approved', approvedAt: new Date().toLocaleString() } : item))
    if (schema.type === 'registration' && schema.orgId) {
      setOrganizations((prev) => prev.map((org) => org.id === schema.orgId ? ({ ...org, registrationSchemas: [...(org.registrationSchemas || []), schema] }) : org))
    }
    setOrgApprovalModal(null)
  }

  const rejectSchema = (schema: SchemaRecord) => {
    setSchemas((prev) => prev.map((item) => item.id === schema.id ? { ...item, status: 'rejected', rejectedAt: new Date().toLocaleString() } : item))
    addAudit('Reject Schema', `Schema ${schema.name} rejected`)
    setOrgApprovalModal(null)
  }

  const suspendOrganization = (org: Organization) => {
    setOrganizations((prev) => prev.map((item) => item.id === org.id ? { ...item, status: 'suspended', suspendedAt: new Date().toLocaleString() } : item))
    setApprovedOrganizations((prev) => prev.map((item) => item.id === org.id ? { ...item, status: 'suspended', suspendedAt: new Date().toLocaleString() } : item))
  }

  const unsuspendOrganization = (org: Organization) => {
    setOrganizations((prev) => prev.map((item) => item.id === org.id ? { ...item, status: 'approved', resumedAt: new Date().toLocaleString() } : item))
    setApprovedOrganizations((prev) => prev.map((item) => item.id === org.id ? { ...item, status: 'approved', resumedAt: new Date().toLocaleString() } : item))
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

  useEffect(() => {
    try {
      writeStorage('catalogue_state_v1', JSON.stringify({ organizations, pendingOrganizations, approvedOrganizations, applications, schemas }))
      writeStorage('catalogue_audit_v1', JSON.stringify(auditLogs))
    } catch {
      // best-effort demo persistence
    }
  }, [organizations, pendingOrganizations, approvedOrganizations, applications, schemas, auditLogs])

  return (
    <CatalogueContext.Provider value={{
      addAudit, appCredentialModal, appFilterStatus, appSearch, applications, approveApplication, approveOrganization, approveSchema,
      approvedOrganizations,
      auditLogs, confirmModal, confirmProcessing, currentOrg, handleOrgLoginSubmit, handlePlatformLogin, loginPolicies, loginPublishModal,
      nextStep, orgApprovalModal, orgCredentialModal, orgLoginChannel, orgLoginError, orgLoginId, orgLoginStage, orgOtp, orgsFilter,
      organizations, pendingOrganizations, platformLogin, platformLoginError, policyPreviewModal, previousStep, publishModal,
      registerAppForm, registerAppModal, registrationForm, registrationSteps, rejectOrganization, rejectSchema, requestModal,
      requestMoreInfo, schemaFilterStatus, schemaSearch, schemas, schemaTab, setAppCredentialModal, setAppFilterStatus, setApplications,
      setAppSearch, setConfirmModal, setConfirmProcessing, setLoginPublishModal, setOrgApprovalModal, setOrgCredentialModal,
      setOrgLoginChannel, setOrgLoginId, setOrgOtp, setOrgsFilter, setPlatformLogin, setPolicyPreviewModal, setPublishModal,
      setRegisterAppForm, setRegisterAppModal, setRequestModal, setSchemaFilterStatus, setSchemas, setSchemaSearch, setSchemaTab,
      setOrganizations, setView, step, submitRegistration, successData, suspendOrganization, unsuspendOrganization, updateRegistrationField, view,
    }}>
      {children}
    </CatalogueContext.Provider>
  )
}

export const useCatalogue = () => {
  const context = useContext(CatalogueContext)
  if (!context) throw new Error('useCatalogue must be used inside CatalogueProvider')
  return context
}
