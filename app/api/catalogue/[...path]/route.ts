import { NextRequest, NextResponse } from 'next/server'

const ONBOARDING_API_BASE_URL =
  process.env.ONBOARDING_API_BASE_URL ||
  process.env.NEXT_PUBLIC_ONBOARDING_API_BASE_URL ||
  'http://localhost:8081'
const AUTH_API_BASE_URL =
  process.env.AUTH_API_BASE_URL ||
  process.env.NEXT_PUBLIC_AUTH_API_BASE_URL ||
  'http://localhost:8082'

interface RouteContext {
  params: Promise<{ path: string[] }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyOnboardingRequest(request, context)
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyOnboardingRequest(request, context)
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxyOnboardingRequest(request, context)
}

async function proxyOnboardingRequest(request: NextRequest, context: RouteContext) {
  const { path } = await context.params
  const upstreamPath = path.join('/')

  const isOnboardingPath = upstreamPath.startsWith('api/v1/onboarding/')
  const isAuthPath = upstreamPath.startsWith('api/v1/auth/')
  if (!isOnboardingPath && !isAuthPath) {
    return NextResponse.json({ message: 'Unsupported catalogue route' }, { status: 404 })
  }

  const baseUrl = isAuthPath ? AUTH_API_BASE_URL : ONBOARDING_API_BASE_URL
  const target = new URL(`${baseUrl.replace(/\/$/, '')}/${upstreamPath}`)
  request.nextUrl.searchParams.forEach((value, key) => target.searchParams.set(key, value))

  try {
    const body = request.method === 'GET' || request.method === 'HEAD'
      ? undefined
      : await request.text()
    const response = await fetch(target, {
      method: request.method,
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Content-Type': request.headers.get('content-type') || 'application/json',
        ...(request.headers.get('authorization') ? { Authorization: request.headers.get('authorization') as string } : {}),
      },
      body,
    })
    const responseBody = await response.text()
    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
    })
  } catch {
    const serviceName = isAuthPath ? 'authentication service' : 'onboarding service'
    return NextResponse.json({ message: `Unable to reach ${serviceName}` }, { status: 502 })
  }
}
