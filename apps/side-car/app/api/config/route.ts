import { NextRequest, NextResponse } from 'next/server'

const OPENCODE_BASE_URL = process.env.OPENCODE_BASE_URL || 'http://localhost:4096'

/**
 * API route that proxies requests to the OpenCode server.
 * This avoids the webpack issue with node: internal modules in the SDK.
 */
export async function GET(request: NextRequest) {
  try {
    // Forward request to OpenCode server
    const response = await fetch(`${OPENCODE_BASE_URL}/api/v1/config`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Include credentials for authorized requests
      credentials: 'include',
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `OpenCode server returned ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to connect to OpenCode server', details: message },
      { status: 502 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()

    // Forward request to OpenCode server
    const response = await fetch(`${OPENCODE_BASE_URL}/api/v1/config`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `OpenCode server returned ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to update config', details: message },
      { status: 502 }
    )
  }
}