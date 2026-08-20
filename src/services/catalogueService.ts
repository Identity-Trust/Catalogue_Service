import { apiRequest } from './apiClient'
import type { ApplicationRecord, Organization, SchemaRecord } from '../types/catalogue'

export const catalogueService = {
  listOrganizations: () => apiRequest<Organization[]>('/organizations'),
  listApplications: () => apiRequest<ApplicationRecord[]>('/applications'),
  listSchemas: () => apiRequest<SchemaRecord[]>('/schemas'),
}
