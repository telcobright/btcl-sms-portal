'use client'

import toast from 'react-hot-toast'

interface AxiosLikeError {
  response?: {
    data?: Record<string, unknown>
    status?: number
    statusText?: string
  }
  message?: string
}

interface ApiBodyLike {
  errorCode?: string | number
  message?: string
  status?: string | number
  error?: string
  details?: string
  success?: boolean
  retryAfterSeconds?: number
}

interface ShowApiErrorOptions {
  /** Fallback message used when the error has no readable message. */
  fallbackMessage?: string
  /** Toast duration in ms. Default 5000. */
  duration?: number
  /** Toast id for deduplication. */
  id?: string
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function extractApiError(
  error: unknown,
  fallbackMessage = 'Something went wrong. Please try again.'
): { message: string; code: string | null } {
  const fallback = { message: fallbackMessage, code: null as string | null }

  if (error === null || error === undefined) return fallback

  if (isObject(error)) {
    const axiosLike = error as AxiosLikeError
    if (axiosLike.response) {
      const data = (axiosLike.response.data ?? {}) as ApiBodyLike
      const message =
        data.message ||
        data.error ||
        data.details ||
        axiosLike.message ||
        axiosLike.response.statusText ||
        fallbackMessage
      const rawCode =
        data.errorCode ??
        data.status ??
        (axiosLike.response.status !== undefined
          ? `HTTP ${axiosLike.response.status}`
          : null)
      return { message, code: rawCode !== null && rawCode !== undefined ? String(rawCode) : null }
    }

    const body = error as ApiBodyLike
    if (typeof body.message === 'string' || body.errorCode !== undefined) {
      const rawCode = body.errorCode ?? body.status ?? null
      return {
        message: body.message || fallbackMessage,
        code: rawCode !== null && rawCode !== undefined ? String(rawCode) : null,
      }
    }
  }

  if (error instanceof Error) {
    return { message: error.message || fallbackMessage, code: null }
  }

  if (typeof error === 'string' && error.length > 0) {
    return { message: error, code: null }
  }

  return fallback
}

export function showApiError(error: unknown, options: ShowApiErrorOptions = {}) {
  const { fallbackMessage, duration = 5000, id } = options
  const { message, code } = extractApiError(error, fallbackMessage)

  return toast.error(
    (
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="font-semibold text-sm leading-tight">{message}</span>
        {code && (
          <span className="text-[11px] font-mono opacity-75">{code}</span>
        )}
      </div>
    ),
    { duration, id }
  )
}
