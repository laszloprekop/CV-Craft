/**
 * Helpers for reading axios/API errors caught as `unknown`.
 *
 * Axios rejects with an Error carrying a `response`; the backend puts its own
 * explanation in `response.data.message`. These narrow that shape without
 * spreading `any` through every catch block.
 */

interface ApiErrorShape {
  code?: unknown
  response?: {
    status?: unknown
    data?: { message?: unknown }
  }
}

/** HTTP status of a failed request, or undefined for network/timeout errors. */
export function getErrorStatus(err: unknown): number | undefined {
  const status = (err as ApiErrorShape)?.response?.status
  return typeof status === 'number' ? status : undefined
}

/** True for 4xx - a request that will not succeed if retried unchanged. */
export function isClientError(err: unknown): boolean {
  const status = getErrorStatus(err)
  return status !== undefined && status >= 400 && status < 500
}

/**
 * Prefer the API's own message ("Invalid CV content: ...") over axios's
 * generic "Request failed with status code 400".
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  const apiMessage = (err as ApiErrorShape)?.response?.data?.message
  if (typeof apiMessage === 'string' && apiMessage.trim()) return apiMessage
  return err instanceof Error ? err.message : fallback
}
