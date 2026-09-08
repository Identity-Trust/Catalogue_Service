import { NextRequest, NextResponse } from 'next/server'

const CMP_BASE_URL = process.env.CMP_BASE_URL || 'http://localhost:3001'
const CMP_API_KEY = process.env.CMP_API_KEY
const CMP_BUSINESS_PROCESS_CODE = process.env.CMP_BUSINESS_PROCESS_CODE
const CMP_BUSINESS_PROCESS_VERSION = Number(process.env.CMP_BUSINESS_PROCESS_VERSION || '1')

const cleanReferencePart = (value: string) =>
  value.trim().replace(/[^a-zA-Z0-9()._\-/]+/g, '_').slice(0, 80)

const normalizeNoticeUrl = (noticeUrl: string) => {
  const cmpUrl = new URL(CMP_BASE_URL)
  const url = new URL(noticeUrl)
  url.protocol = cmpUrl.protocol
  url.host = cmpUrl.host
  return url.toString()
}

export async function POST(request: NextRequest) {
  if (!CMP_API_KEY || !CMP_BUSINESS_PROCESS_CODE) {
    return NextResponse.json(
      { message: 'CMP integration is not configured.' },
      { status: 500 },
    )
  }

  try {
    const body = await request.json()
    const fields = body.fields || {}
    const clientId = String(body.clientId || '')
    const redirectUri = String(body.redirectUri || '')
    const dataPrincipalId = String(
      fields.email || fields.username || fields.mobile || fields.phone || '',
    ).trim()

    if (!clientId || !redirectUri || !dataPrincipalId) {
      return NextResponse.json(
        { message: 'clientId, redirectUri, and a user identifier are required.' },
        { status: 400 },
      )
    }

    const response = await fetch(`${CMP_BASE_URL.replace(/\/$/, '')}/cms/api/v1/notices/grant`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${CMP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reference_id: cleanReferencePart(`registration-${clientId}-${dataPrincipalId}`),
        data_principal_id: cleanReferencePart(dataPrincipalId),
        notice_settings: {
          expires_in_hours: 24,
          redirection_type: 'redirect',
          redirection_url: redirectUri,
          default_language: 'en',
          view_mode: 'purpose_of_consent',
        },
        consent_settings: {
          expires_in_hours: 8760,
        },
        business_process: {
          code: CMP_BUSINESS_PROCESS_CODE,
          version: CMP_BUSINESS_PROCESS_VERSION,
        },
        metadata: [
          { key: 'client_id', value: clientId },
          { key: 'registration_source', value: 'identity_os' },
        ],
      }),
    })

    const data = await response.json().catch(() => null)
    if (!response.ok) {
      return NextResponse.json(
        { message: data?.message || data?.error || 'CMP notice creation failed.' },
        { status: response.status },
      )
    }

    const noticeUrl = data?.data?.link_details?.link
    if (!noticeUrl) {
      return NextResponse.json(
        { message: 'CMP did not return a notice link.' },
        { status: 502 },
      )
    }

    return NextResponse.json({ noticeUrl: normalizeNoticeUrl(noticeUrl) })
  } catch {
    return NextResponse.json(
      { message: 'Unable to create CMP notice.' },
      { status: 502 },
    )
  }
}
