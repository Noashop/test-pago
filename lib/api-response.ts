import { NextResponse } from 'next/server'

type JsonValue = any

interface JsonInit extends ResponseInit {
  headers?: HeadersInit
}

export function jsonOk(
  data: JsonValue,
  init: JsonInit = {},
  extras?: Record<string, unknown>
) {
  const body = { success: true, data, ...(extras || {}) }
  return NextResponse.json(body, { status: 200, ...init })
}

export function jsonError(
  message: string,
  status = 400,
  init: JsonInit = {},
  extras?: Record<string, unknown>
) {
  const body = { success: false, error: message, ...(extras || {}) }
  return NextResponse.json(body, { status, ...init })
}

export function jsonPaginated<T>(
  items: T[],
  pagination: {
    page: number
    limit: number
    totalPages: number
    totalItems?: number
  },
  init: JsonInit = {},
  extras?: Record<string, unknown>
) {
  const body = { success: true, data: { items, pagination }, ...(extras || {}) }
  return NextResponse.json(body, { status: 200, ...init })
}



