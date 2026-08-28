import HostedIdentityPage from '../../../src/features/catalogue/pages/HostedIdentityPage'

interface IdentityRegisterPageProps {
  searchParams?: Promise<{ client_id?: string; redirect_uri?: string }>
}

export default async function IdentityRegisterPage({ searchParams }: IdentityRegisterPageProps) {
  const params = await searchParams
  return <HostedIdentityPage mode="register" initialClientId={params?.client_id || ''} initialRedirectUri={params?.redirect_uri || ''} />
}
