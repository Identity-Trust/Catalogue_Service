'use client'

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import keycloak from '../../../lib/keycloak'
import type { ApplicationRecord, AppCredentialModal, ApprovalModal, AuditLog, ConfirmModal, LoginPolicy, Organization, RequestModal, SchemaRecord } from '../../../types/catalogue'
import { readStorage, writeStorage } from '../../../utils/storage'
import { getCatalogueRoute, type CatalogueView } from '../routes'

const registrationSteps = ['Basic Info', 'Registration Details', 'Representative Details', 'Address', 'Digital Presence']

const requiredRegistrationFields: Array<{ key: string; label: string }> = [
  { key: 'name', label: 'Organization name' },
  { key: 'type', label: 'Organization type' },
  { key: 'country', label: 'Country' },
  { key: 'email', label: 'Official email' },
  { key: 'gst', label: 'Registration number' },
  { key: 'repName', label: 'Representative name' },
  { key: 'repEmail', label: 'Representative email' },
  { key: 'address', label: 'Address line 1' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'postalCode', label: 'Postal code' },
]

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'
const ONBOARDING_API_BASE_URL = process.env.NEXT_PUBLIC_ONBOARDING_API_BASE_URL || 'http://localhost:8081'
const AUTH_API_BASE_URL = process.env.NEXT_PUBLIC_AUTH_API_BASE_URL || 'http://localhost:8082'
const DIRECT_ONBOARDING_READ_PATHS = new Set([
  '/api/v1/onboarding/organizations',
  '/api/v1/onboarding/applications',
  '/api/v1/onboarding/schemas',
])

const getReadUrls = (path: string) => {
  const urls = [`/api/catalogue${path}`, `${API_BASE_URL}${path}`]
  if (ONBOARDING_API_BASE_URL !== API_BASE_URL) urls.push(`${ONBOARDING_API_BASE_URL}${path}`)
  return urls
}

const getServiceUrls = (path: string) => {
  const urls = [`/api/catalogue${path}`, `${API_BASE_URL}${path}`]
  const directBaseUrl = path.startsWith('/api/v1/auth/') ? AUTH_API_BASE_URL : ONBOARDING_API_BASE_URL
  if (directBaseUrl !== API_BASE_URL) urls.push(`${directBaseUrl}${path}`)
  return urls
}

const backendRequest = async <TResponse,>(path: string, init?: RequestInit): Promise<TResponse> => {
  if (keycloak.authenticated) {
    await keycloak.updateToken(30)
  }
  const requestInit = {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(keycloak.token ? { Authorization: `Bearer ${keycloak.token}` } : {}),
      ...init?.headers,
    },
  }
  const method = (init?.method || 'GET').toUpperCase()
  let response: Response | null = null
  let fetchError: unknown = null
  const isOnboardingPath = path.startsWith('/api/v1/onboarding/')
  const isAuthPath = path.startsWith('/api/v1/auth/')
  const urls = method === 'GET' && DIRECT_ONBOARDING_READ_PATHS.has(path)
    ? getReadUrls(path)
    : isOnboardingPath || isAuthPath
      ? getServiceUrls(path)
      : [`${API_BASE_URL}${path}`]
  for (const url of urls) {
    try {
      response = await fetch(url, requestInit)
      if (response.ok) break
    } catch (error) {
      fetchError = error
    }
  }
  if (!response) {
    throw fetchError instanceof Error ? fetchError : new Error('Unable to reach backend service')
  }
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed: ${response.status}`)
  }
  if (response.status === 204) return undefined as TResponse
  return response.json() as Promise<TResponse>
}

interface CatalogueProviderProps {
  children: React.ReactNode
  initialView?: CatalogueView
}

const CatalogueContext = createContext<any>(null)

export function CatalogueProvider({ children, initialView = 'home' }: CatalogueProviderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [view, setCurrentView] = useState<CatalogueView>(initialView)
  const [step, setStep] = useState(0)
  const [registrationForm, setRegistrationForm] = useState({
    name: '', type: '', country: '', email: '', phone: '', gst: '', repName: '', repEmail: '', repMobile: '', designation: '', empId: '', address: '', addressLine2: '', city: '', district: '', state: '', postalCode: '', addressProofRef: '', website: '', domain: '', logo: '',
  })
  const [platformLogin, setPlatformLogin] = useState({ username: '', password: '' })
  const [platformLoginError, setPlatformLoginError] = useState('')
  const [pendingOrganizations, setPendingOrganizations] = useState<Organization[]>([])
  const [approvedOrganizations, setApprovedOrganizations] = useState<Organization[]>([])
  const [applications, setApplications] = useState<ApplicationRecord[]>([])
  const [schemas, setSchemas] = useState<SchemaRecord[]>([])
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
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [orgsFilter, setOrgsFilter] = useState('All')
  const [orgApprovalModal, setOrgApprovalModal] = useState<ApprovalModal | null>(null)
  const [orgLoginStage, setOrgLoginStage] = useState(1)
  const [orgLoginId, setOrgLoginId] = useState('')
  const [orgLoginChannel, setOrgLoginChannel] = useState('email')
  const [orgOtp, setOrgOtp] = useState('')
  const [orgLoginError, setOrgLoginError] = useState('')
  const [orgLoginMaskedEmail, setOrgLoginMaskedEmail] = useState('')
  const [authenticatedOrgId, setAuthenticatedOrgId] = useState('')
  const [authenticatedOrgProfile, setAuthenticatedOrgProfile] = useState<Organization | null>(null)
  const [successData, setSuccessData] = useState<{ orgId: string; createdAt: string; status: string; officialEmail?: string } | null>(() => {
    try {
      const raw = readStorage('catalogue_last_registration_v1')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const [registrationError, setRegistrationError] = useState('')
  const [registrationSubmitting, setRegistrationSubmitting] = useState(false)
  const [requestModal, setRequestModal] = useState<RequestModal | null>(null)
  const [appCredentialModal, setAppCredentialModal] = useState<AppCredentialModal | null>(null)
  const [publishModal, setPublishModal] = useState<SchemaRecord | null>(null)
  const [loginPublishModal, setLoginPublishModal] = useState<LoginPolicy | null>(null)
  const [confirmModal, setConfirmModal] = useState<ConfirmModal | null>(null)
  const [confirmProcessing, setConfirmProcessing] = useState(false)
  const refreshInFlight = useRef<Promise<void> | null>(null)

  useEffect(() => setCurrentView(initialView), [initialView])

  const setView = (nextView: CatalogueView) => {
    const nextRoute = getCatalogueRoute(nextView)
    if (pathname === nextRoute) {
      setCurrentView(nextView)
      return
    }
    router.push(nextRoute)
  }

  const currentOrg = useMemo(() => {
    if (authenticatedOrgProfile) return authenticatedOrgProfile
    const effectiveOrgId = authenticatedOrgId || orgLoginId
    if (!effectiveOrgId) return null
    const savedOrg = organizations.find((org) => org.id === effectiveOrgId)
    const approvedOrg = approvedOrganizations.find((org) => org.id === effectiveOrgId)
    return savedOrg && approvedOrg ? { ...savedOrg, ...approvedOrg } : savedOrg || approvedOrg || null
  }, [authenticatedOrgId, authenticatedOrgProfile, approvedOrganizations, organizations, orgLoginId])

  const mapOrganizationProfile = (profile: any): Organization => ({
    id: profile.organizationId,
    name: profile.organizationName,
    type: profile.organizationType,
    country: profile.countryCode,
    email: profile.officialEmail,
    phone: profile.officialPhone,
    website: profile.websiteUrl,
    status: profile.approvalStatus || profile.status || 'ACTIVE',
    registrationType: profile.verificationIdType,
    registrationDetails: {
      registrationNumber: profile.registrationNumber || profile.verificationId || '',
      gst: profile.verificationId,
    },
  })

  const mapBackendApplication = (app: any): ApplicationRecord => ({
    id: app.applicationId,
    orgId: app.organizationId,
    orgName: app.organizationName || '',
    name: app.applicationName,
    type: app.applicationType,
    description: app.description || '',
    redirectUri: app.redirectUri || '',
    clientId: app.clientId || app.applicationId || '',
    clientSecret: app.clientSecret || '',
    status: app.status === 'ACTIVE' ? 'approved' : app.status === 'SUSPENDED' ? 'rejected' : 'pending',
    createdAt: app.createdAt ? new Date(app.createdAt).toLocaleString() : new Date().toLocaleString(),
  })

  const parseJson = (value?: string | null) => {
    if (!value) return null
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }

  const mapBackendSchema = (schema: any): SchemaRecord => {
    const schemaJson = parseJson(schema.schemaJson)
    const configurationJson = parseJson(schema.configurationJson)
    return {
      id: schema.schemaId,
      versionId: schema.versionId,
      versionNumber: schema.versionNumber,
      type: schema.schemaType === 'LOGIN' ? 'login' : 'registration',
      name: schema.schemaName,
      orgId: schema.organizationId,
      orgName: schema.organizationName,
      appId: schema.applicationId,
      appName: schema.applicationName,
      fields: schema.schemaType === 'REGISTRATION' ? (schemaJson?.registrationFields || schemaJson?.fields || []) : undefined,
      payload: schema.schemaType === 'LOGIN' ? schemaJson : undefined,
      schemaJson,
      configurationJson,
      status: schema.status === 'APPROVED' || schema.status === 'PUBLISHED' ? 'approved' : schema.status === 'REJECTED' ? 'rejected' : schema.status === 'DRAFT' ? 'draft' : 'pending',
      createdAt: schema.createdAt ? new Date(schema.createdAt).toLocaleString() : new Date().toLocaleString(),
      approvedAt: schema.publishedAt ? new Date(schema.publishedAt).toLocaleString() : undefined,
    }
  }

  const refreshCatalogueData = async () => {
    if (typeof window === 'undefined') return
    if (refreshInFlight.current) return refreshInFlight.current
    const refreshPromise = (async () => {
      try {
        const [orgProfilesResult, backendAppsResult, backendSchemasResult] = await Promise.allSettled([
          backendRequest<any[]>('/api/v1/onboarding/organizations'),
          backendRequest<any[]>('/api/v1/onboarding/applications'),
          backendRequest<any[]>('/api/v1/onboarding/schemas'),
        ])
        const orgProfiles = orgProfilesResult.status === 'fulfilled' ? orgProfilesResult.value : []
        const backendApps = backendAppsResult.status === 'fulfilled' ? backendAppsResult.value : []
        const backendSchemas = backendSchemasResult.status === 'fulfilled' ? backendSchemasResult.value : []
        const mappedOrgs = orgProfiles.map((profile) => {
          const org = mapOrganizationProfile(profile)
          return {
            ...org,
            status: profile.approvalStatus === 'APPROVED' ? 'approved' : profile.approvalStatus === 'REJECTED' ? 'rejected' : 'pending',
          }
        })
        if (orgProfilesResult.status === 'fulfilled') {
          setOrganizations(mappedOrgs)
          setPendingOrganizations(mappedOrgs.filter((org) => org.status === 'pending'))
          setApprovedOrganizations(mappedOrgs.filter((org) => org.status === 'approved'))
        }
        if (backendAppsResult.status === 'fulfilled') {
          setApplications(backendApps.map(mapBackendApplication))
        }
        if (backendSchemasResult.status === 'fulfilled') {
          setSchemas(backendSchemas.map(mapBackendSchema).filter((schema) => schema.status !== 'draft'))
        }
      } catch {
        // Keep the current in-memory state if services are temporarily unreachable.
      } finally {
        refreshInFlight.current = null
      }
    })()
    refreshInFlight.current = refreshPromise
    return refreshPromise
  }

  useEffect(() => {
    const tokenOrgId = keycloak.tokenParsed?.organization_id as string | undefined
    const username = keycloak.tokenParsed?.preferred_username as string | undefined
    const nextOrgId = tokenOrgId || (keycloak.hasRealmRole?.('ORGANISATION_ADMIN') ? username : '')
    if (!keycloak.authenticated || !nextOrgId) return

    setAuthenticatedOrgId(nextOrgId)
    setOrgLoginId(nextOrgId)

    const loadProfile = async () => {
      try {
        await keycloak.updateToken(30)
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'}/api/v1/onboarding/organizations/${encodeURIComponent(nextOrgId)}`, {
          headers: {
            Authorization: `Bearer ${keycloak.token}`,
          },
        })
        if (!response.ok) return
        const profile = await response.json()
        setAuthenticatedOrgProfile(mapOrganizationProfile(profile))
      } catch {
        // Keep the token organization id even when the profile endpoint is temporarily unavailable.
      }
    }

    loadProfile()
  }, [])

  const addAudit = (action: string, details: string) => {
    setAuditLogs((prev) => [{ id: `audit_${Date.now()}`, action, details, timestamp: new Date().toLocaleString() }, ...prev])
  }

  const updateRegistrationField = (field: keyof typeof registrationForm, value: string) => setRegistrationForm((prev) => ({ ...prev, [field]: value }))
  const validateRegistrationStep = (targetStep = step) => {
    const stepFields: Record<number, string[]> = {
      0: ['name', 'type', 'country', 'email'],
      1: ['gst'],
      2: ['repName', 'repEmail'],
      3: ['address', 'city', 'state', 'postalCode'],
    }
    const missing = (stepFields[targetStep] || [])
      .map((key) => requiredRegistrationFields.find((field) => field.key === key))
      .filter((field): field is { key: string; label: string } => Boolean(field))
      .find((field) => !String(registrationForm[field.key as keyof typeof registrationForm] || '').trim())
    if (missing) {
      setRegistrationError(`${missing.label} is required.`)
      return false
    }
    setRegistrationError('')
    return true
  }

  const nextStep = () => {
    if (!validateRegistrationStep()) return
    setStep((prev) => Math.min(prev + 1, registrationSteps.length - 1))
  }
  const previousStep = () => setStep((prev) => Math.max(prev - 1, 0))

  const submitRegistration = async () => {
    const firstInvalid = [0, 1, 2, 3].find((targetStep) => !validateRegistrationStep(targetStep))
    if (firstInvalid !== undefined) {
      setStep(firstInvalid)
      return
    }
    setRegistrationSubmitting(true)
    setRegistrationError('')
    try {
      const data = await backendRequest<any>('/api/v1/onboarding/organizations', {
        method: 'POST',
        body: JSON.stringify({
          organizationName: registrationForm.name,
          organizationType: registrationForm.type,
          countryCode: registrationForm.country,
          officialEmail: registrationForm.email,
          officialPhone: registrationForm.phone,
          registrationNumber: registrationForm.gst,
          verificationIdType: 'GST',
          verificationId: registrationForm.gst,
          verificationIdVerifyStatus: 'PENDING',
          websiteUrl: registrationForm.website,
          logoUrl: registrationForm.logo,
          representativeName: registrationForm.repName,
          representativeEmail: registrationForm.repEmail,
          representativeMobile: registrationForm.repMobile,
          representativeDesignation: registrationForm.designation,
          representativeEmployeeId: registrationForm.empId,
          addressType: 'REGISTERED',
          addressLine1: registrationForm.address,
          addressLine2: registrationForm.addressLine2,
          city: registrationForm.city,
          district: registrationForm.district,
          state: registrationForm.state,
          postalCode: registrationForm.postalCode,
          addressProofRef: registrationForm.addressProofRef,
        }),
      })

      const nextSuccessData = {
        orgId: data.organizationId,
        createdAt: new Date().toLocaleString(),
        status: 'Admin credentials sent',
        officialEmail: registrationForm.email,
      }
      setSuccessData(nextSuccessData)
      writeStorage('catalogue_last_registration_v1', JSON.stringify(nextSuccessData))
      const newPendingOrg: Organization = {
        id: data.organizationId,
        name: registrationForm.name,
        type: registrationForm.type,
        country: registrationForm.country,
        email: registrationForm.email,
        phone: registrationForm.phone,
        status: 'pending',
        registrationDetails: { registrationNumber: registrationForm.gst, gst: registrationForm.gst },
        representative: { name: registrationForm.repName, email: registrationForm.repEmail, mobile: registrationForm.repMobile, designation: registrationForm.designation },
        address: [registrationForm.address, registrationForm.addressLine2, registrationForm.city, registrationForm.state, registrationForm.postalCode].filter(Boolean).join(', '),
        submittedAt: new Date().toLocaleString(),
      }
      setOrganizations((prev) => [newPendingOrg, ...prev.filter((org) => org.id !== newPendingOrg.id)])
      setPendingOrganizations((prev) => [newPendingOrg, ...prev.filter((org) => org.id !== newPendingOrg.id)])
      setView('success')
      setStep(0)
    } catch (error) {
      setRegistrationError(error instanceof Error ? error.message : 'Registration failed. Please try again.')
    } finally {
      setRegistrationSubmitting(false)
    }
  }

  const handlePlatformLogin = () => {
    if (platformLogin.username === 'admin' && platformLogin.password === 'admin') {
      setPlatformLoginError('')
      setView('platform-dashboard')
      return
    }
    setPlatformLoginError('Invalid username or password. Please use admin / admin.')
  }

  const approveOrganization = async (org: Organization) => {
    await backendRequest<void>(`/api/v1/onboarding/organizations/${encodeURIComponent(org.id)}/approval`, {
      method: 'POST',
      body: JSON.stringify({ decision: 'APPROVED' }),
    })
    const approved = { ...org, status: 'approved', approvedAt: new Date().toLocaleString(), orgAdminActivated: true }
    setPendingOrganizations((prev) => prev.filter((item) => item.id !== org.id))
    setApprovedOrganizations((prev) => [approved, ...prev])
    setOrganizations((prev) => prev.some((item) => item.id === org.id) ? prev.map((item) => item.id === org.id ? approved : item) : [approved, ...prev])
    setOrgApprovalModal(null)
  }

  const rejectOrganization = async (org: Organization) => {
    await backendRequest<void>(`/api/v1/onboarding/organizations/${encodeURIComponent(org.id)}/approval`, {
      method: 'POST',
      body: JSON.stringify({ decision: 'REJECTED' }),
    })
    setPendingOrganizations((prev) => prev.filter((item) => item.id !== org.id))
    setOrganizations((prev) => prev.map((item) => item.id === org.id ? { ...item, status: 'rejected', rejectedAt: new Date().toLocaleString() } : item))
    setOrgApprovalModal(null)
  }

  const requestMoreInfo = (org: Organization, message = 'Please provide additional documentation') => {
    setOrganizations((prev) => prev.map((item) => item.id === org.id ? { ...item, status: 'requires_more_info', infoRequest: { message, requestedAt: new Date().toLocaleString() } } : item))
    setPendingOrganizations((prev) => prev.map((item) => item.id === org.id ? { ...item, status: 'requires_more_info' } : item))
    setOrgApprovalModal(null)
  }

  const approveApplication = async (app: ApplicationRecord) => {
    const response = await backendRequest<any>(`/api/v1/onboarding/applications/${encodeURIComponent(app.id)}/approval`, {
      method: 'POST',
      body: JSON.stringify({ decision: 'APPROVED' }),
    })
    const mapped = mapBackendApplication(response)
    const updated = { ...app, ...mapped, status: 'approved', approvedAt: new Date().toLocaleString() }
    setApplications((prev) => prev.map((item) => item.id === app.id ? updated : item))
    setAppCredentialModal({ app: updated, clientId: updated.clientId || updated.id, clientSecret: updated.clientSecret })
    setOrgApprovalModal(null)
  }

  const rejectApplication = async (app: ApplicationRecord) => {
    await backendRequest<void>(`/api/v1/onboarding/applications/${encodeURIComponent(app.id)}/approval`, {
      method: 'POST',
      body: JSON.stringify({ decision: 'REJECTED' }),
    })
    const updated = { ...app, status: 'rejected', rejectedAt: new Date().toLocaleString() }
    setApplications((prev) => prev.map((item) => item.id === app.id ? updated : item))
    setOrgApprovalModal(null)
  }

  const registerApplication = async () => {
    const orgId = currentOrg?.id || orgLoginId
    if (!orgId) throw new Error('Organization context is missing.')
    if (!registerAppForm.name.trim()) throw new Error('Application name is required.')
    if (!registerAppForm.redirectUri.trim()) throw new Error('Redirect URI is required.')
    const app = await backendRequest<any>(`/api/v1/onboarding/organizations/${encodeURIComponent(orgId)}/applications`, {
      method: 'POST',
      body: JSON.stringify({
        applicationName: registerAppForm.name,
        applicationType: registerAppForm.type || 'web',
        description: registerAppForm.description,
        redirectUri: registerAppForm.redirectUri,
      }),
    })
    const mappedApp = { ...mapBackendApplication(app), orgName: currentOrg?.name || app.organizationName || orgId }
    setApplications((prev) => [mappedApp, ...prev])
    addAudit('Submit Application', `Submitted application ${mappedApp.name} for approval`)
    setRegisterAppForm({ name:'', type:'web', description:'', contactEmail:'', domain:'', redirectUri:'', logoutUri:'' })
    setRegisterAppModal(false)
  }

  const submitIdentitySchemaVersion = async ({
    applicationId,
    schemaType,
    schemaName,
    schemaJson,
    configurationJson,
    changeSummary,
    submitForApproval = true,
  }: {
    applicationId: string
    schemaType: 'REGISTRATION' | 'LOGIN'
    schemaName: string
    schemaJson: Record<string, unknown>
    configurationJson?: Record<string, unknown>
    changeSummary?: string
    submitForApproval?: boolean
  }) => {
    const orgId = currentOrg?.id || orgLoginId
    if (!orgId) throw new Error('Organization context is missing.')
    if (!applicationId) throw new Error('Application is required.')
    const response = await backendRequest<any>(`/api/v1/onboarding/organizations/${encodeURIComponent(orgId)}/applications/${encodeURIComponent(applicationId)}/schemas`, {
      method: 'POST',
      body: JSON.stringify({
        schemaType,
        schemaName,
        schemaJson,
        configurationJson,
        changeSummary,
        submitForApproval,
      }),
    })
    const mappedSchema = mapBackendSchema(response)
    setSchemas((prev) => [mappedSchema, ...prev.filter((schema) => schema.versionId !== mappedSchema.versionId)])
    addAudit('Submit Schema Version', `Submitted ${schemaName} for ${mappedSchema.appName || applicationId}`)
    return mappedSchema
  }

  const approveSchema = async (schema: SchemaRecord) => {
    if (schema.versionId) {
      await backendRequest<void>(`/api/v1/onboarding/schemas/versions/${encodeURIComponent(schema.versionId)}/approval`, {
        method: 'POST',
        body: JSON.stringify({ decision: 'APPROVED' }),
      })
    }
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

  const rejectSchema = async (schema: SchemaRecord) => {
    if (schema.versionId) {
      await backendRequest<void>(`/api/v1/onboarding/schemas/versions/${encodeURIComponent(schema.versionId)}/approval`, {
        method: 'POST',
        body: JSON.stringify({ decision: 'REJECTED' }),
      })
    }
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

  const handleOrgLoginSubmit = async () => {
    if (orgLoginStage === 1) {
      try {
        const data = await backendRequest<any>(`/api/v1/auth/organization/${encodeURIComponent(orgLoginId)}/status`)
        if (!data.success) {
          setOrgLoginError(data.message || 'Organization ID not found or not yet approved.')
          return
        }
        setOrgLoginMaskedEmail(data.maskedEmail || '')
        setOrgLoginError('')
        setOrgLoginStage(2)
      } catch {
        setOrgLoginError('Unable to check organization status. Please try again.')
      }
      return
    }
    if (orgLoginStage === 2) {
      try {
        const data = await backendRequest<any>('/api/v1/auth/organization/otp/request', {
          method: 'POST',
          body: JSON.stringify({ organizationId: orgLoginId }),
        })
        if (!data.success) {
          setOrgLoginError(data.message || 'Unable to send OTP.')
          return
        }
        setOrgLoginMaskedEmail(data.maskedEmail || orgLoginMaskedEmail)
        setOrgLoginError('')
        setOrgLoginStage(3)
      } catch {
        setOrgLoginError('Unable to send OTP. Please try again.')
      }
      return
    }
    try {
      const data = await backendRequest<any>('/api/v1/auth/organization/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ organizationId: orgLoginId, otp: orgOtp }),
      })
      if (!data.success) {
        setOrgLoginError(data.message || 'Invalid OTP.')
        return
      }
      setOrgLoginError('')
      await keycloak.login({
        loginHint: orgLoginId,
        redirectUri: `${window.location.origin}/organization/dashboard`,
      })
    } catch {
      setOrgLoginError('Unable to start Keycloak login. Please try again.')
    }
  }

  useEffect(() => {
    try {
      writeStorage('catalogue_state_v1', JSON.stringify({ organizations, pendingOrganizations, approvedOrganizations, applications, schemas }))
      writeStorage('catalogue_audit_v1', JSON.stringify(auditLogs))
      if (successData) writeStorage('catalogue_last_registration_v1', JSON.stringify(successData))
    } catch {
      // best-effort demo persistence
    }
  }, [organizations, pendingOrganizations, approvedOrganizations, applications, schemas, auditLogs])

  return (
    <CatalogueContext.Provider value={{
      addAudit, appCredentialModal, appFilterStatus, appSearch, applications, approveApplication, approveOrganization, approveSchema,
      approvedOrganizations,
      auditLogs, confirmModal, confirmProcessing, currentOrg, handleOrgLoginSubmit, handlePlatformLogin, loginPolicies, loginPublishModal,
      nextStep, orgApprovalModal, orgLoginChannel, orgLoginError, orgLoginId, orgLoginMaskedEmail, orgLoginStage, orgOtp, orgsFilter,
      organizations, pendingOrganizations, platformLogin, platformLoginError, policyPreviewModal, previousStep, publishModal,
      refreshCatalogueData, registerAppForm, registerAppModal, registrationForm, registrationSteps, rejectApplication, rejectOrganization, rejectSchema, requestModal,
      requestMoreInfo, registerApplication, schemaFilterStatus, schemaSearch, schemas, schemaTab, setAppCredentialModal, setAppFilterStatus, setApplications,
      setAppSearch, setConfirmModal, setConfirmProcessing, setLoginPublishModal, setOrgApprovalModal,
      setOrgLoginChannel, setOrgLoginId, setOrgOtp, setOrgsFilter, setPlatformLogin, setPolicyPreviewModal, setPublishModal,
      setRegisterAppForm, setRegisterAppModal, setRequestModal, setSchemaFilterStatus, setSchemas, setSchemaSearch, setSchemaTab,
      registrationError, registrationSubmitting, setOrganizations, setView, step, submitIdentitySchemaVersion, submitRegistration, successData, suspendOrganization, unsuspendOrganization, updateRegistrationField, view,
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
