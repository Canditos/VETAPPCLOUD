import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/request'

export function middleware(request: NextRequest) {
  const acceptHeader = request.headers.get('accept')

  if (acceptHeader === 'text/markdown') {
    // Basic agent-ready response for agents requesting markdown
    const markdown = `
# VetConnect SaaS - Agent API Catalog
Welcome to the VetConnect Agent Interface.

## Available Resources
- [Dashboard](/dashboard) - Overview of clinical operations
- [Patients](/dashboard/patients) - Manage animal health records
- [Agenda](/dashboard/calendar) - View and manage appointments
- [Customers](/dashboard/customers) - Manage client data

## API Documentation
Documentation is available at [/docs/api](/docs/api).

---
*VetConnect SaaS - Premium Veterinary Management*
    `
    return new NextResponse(markdown, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'X-Markdown-Tokens': 'supported'
      }
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/dashboard/:path*'],
}
