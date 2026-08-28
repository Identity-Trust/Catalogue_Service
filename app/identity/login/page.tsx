import HostedIdentityPage from '../../../src/features/catalogue/pages/HostedIdentityPage'

interface IdentityLoginPageProps {
  searchParams?: Promise<{ client_id?: string; redirect_uri?: string }>
}

export default async function IdentityLoginPage({ searchParams }: IdentityLoginPageProps) {
  const params = await searchParams
  return <HostedIdentityPage mode="login" initialClientId={params?.client_id || ''} initialRedirectUri={params?.redirect_uri || ''} />
}
