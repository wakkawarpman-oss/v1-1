type RetryConfig = {
  timeout: number
  retries: number
  backoff: number
}

const DEFAULT_CONFIG: RetryConfig = {
  timeout: 5000,
  retries: 2,
  backoff: 500,
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  config: Partial<RetryConfig> = {},
): Promise<Response> {
  const { timeout, retries, backoff } = { ...DEFAULT_CONFIG, ...config }
  let lastError: unknown

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (response.ok) return response

      // Retry only for throttling or server failures.
      if (response.status !== 429 && response.status < 500) {
        return response
      }

      lastError = new Error(`Retryable response status: ${response.status}`)
    } catch (error) {
      clearTimeout(timeoutId)
      lastError = error
      if (attempt === retries) throw error
    }

    if (attempt < retries) {
      await delay(backoff * Math.pow(2, attempt))
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('fetchWithRetry exhausted without a terminal response')
}
