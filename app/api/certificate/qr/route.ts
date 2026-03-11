// app/api/certificate/qr/route.ts
//
// Generates a QR code PNG entirely on the server using the `qrcode` npm package.
// No external HTTP dependency — safe for print/PDF and offline environments.
//
// Install once:  npm install qrcode  &&  npm install -D @types/qrcode

import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.trim().toUpperCase()
  if (!code) {
    return NextResponse.json({ error: 'Certificate code is required.' }, { status: 400 })
  }

  // ── Build the verify URL ──────────────────────────────────────────────────
  // NEXTAUTH_URL must be set in production .env — we throw clearly if missing
  // rather than silently producing a localhost QR on a live certificate.
  const base = process.env.NEXTAUTH_URL?.replace(/\/$/, '')
  if (!base) {
    console.error('[QR Route] NEXTAUTH_URL is not set. Cannot generate QR code.')
    return NextResponse.json(
      { error: 'Server misconfiguration: NEXTAUTH_URL is not set.' },
      { status: 500 }
    )
  }

  const verifyUrl = `${base}/verify-certificate?code=${encodeURIComponent(code)}`

  // ── Generate PNG buffer ───────────────────────────────────────────────────
  try {
    const pngBuffer = await QRCode.toBuffer(verifyUrl, {
      type: 'png',
      width: 220,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })

    const pngBytes = new Uint8Array(pngBuffer)
    return new NextResponse(pngBytes, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        // Cache for 7 days — QR content never changes for a given code
        'Cache-Control': 'public, max-age=604800, immutable',
        'Content-Length': String(pngBuffer.length),
      },
    })
  } catch (err) {
    console.error('[QR Route] QRCode generation failed:', err)
    return NextResponse.json({ error: 'Failed to generate QR code.' }, { status: 500 })
  }
}
