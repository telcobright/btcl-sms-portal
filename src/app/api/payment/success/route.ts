import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Extract SSLCommerz parameters
    const tranId = formData.get('tran_id') as string
    const amount = formData.get('amount') || formData.get('total_amount')
    const status = formData.get('status')

    // Build redirect URL with params
    const params = new URLSearchParams()
    if (tranId) params.set('tran_id', tranId)
    if (amount) params.set('amount', amount.toString())
    if (status) params.set('status', status.toString())

    // Redirect to success page
    const redirectUrl = new URL(`/pg/success?${params.toString()}`, request.url)
    return NextResponse.redirect(redirectUrl, { status: 303 })

  } catch (error) {
    console.error('Payment success handler error:', error)
    return NextResponse.redirect(new URL('/pg/failed', request.url), { status: 303 })
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)

  // Build redirect URL with existing params
  const params = new URLSearchParams()
  url.searchParams.forEach((value, key) => {
    params.set(key, value)
  })

  // Redirect to success page
  const redirectUrl = new URL(`/pg/success?${params.toString()}`, request.url)
  return NextResponse.redirect(redirectUrl, { status: 303 })
}
