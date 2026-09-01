export interface RegistrationDetails {
  registrationNumber: string
  gst?: string
  authority?: string
  verificationStatus?: string
}

export interface Representative {
  name: string
  email: string
  mobile: string
  designation: string
  employeeId?: string
}

export interface OrganizationAddress {
  type?: string
  line1?: string
  line2?: string
  city?: string
  district?: string
  state?: string
  postalCode?: string
  country?: string
  proofRef?: string
}

export interface RegistrationField {
  name: string
  label?: string
  type: string
  required?: boolean
  regex?: string | null
  verification?: string | null
  encrypted?: boolean
  options?: string[]
}

export interface Organization {
  id: string
  name: string
  orgId?: string | null
  orgName?: string
  type?: string
  country?: string
  email?: string
  phone?: string
  address?: string
  addressDetails?: OrganizationAddress
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

export interface ApplicationRecord {
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

export interface LoginPolicy {
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

export interface SchemaRecord {
  id: string
  versionId?: string
  versionNumber?: number
  type: string
  name: string
  orgId?: string | null
  orgName?: string
  appId?: string | null
  appName?: string
  fields?: Array<string | RegistrationField>
  payload?: Omit<LoginPolicy, 'id' | 'name' | 'orgId' | 'createdAt'>
  schemaJson?: unknown
  configurationJson?: unknown
  status: string
  createdAt: string
  approvedAt?: string
  rejectedAt?: string
}

export interface AuditLog {
  id: string
  action: string
  details: string
  timestamp: string
}

export interface SavedState {
  organizations?: Organization[]
  pendingOrganizations?: Organization[]
  approvedOrganizations?: Organization[]
  applications?: ApplicationRecord[]
  schemas?: SchemaRecord[]
}

export type ApprovalModal =
  | { type: 'org'; item: Organization }
  | { type: 'app'; item: ApplicationRecord }
  | { type: 'schema'; item: SchemaRecord }

export type RequestModal = { target: Organization; message?: string; open?: boolean }
export type AppCredentialModal = { app: ApplicationRecord; clientId?: string; clientSecret?: string }
export type ConfirmModal = { title: string; message: string; onConfirm: () => Promise<void> | void }
