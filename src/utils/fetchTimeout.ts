export const DATA_FETCH_TIMEOUT_MS = 25000

export function withTimeout<T>(promiseOrFactory: Promise<T> | (() => Promise<T>), ms = DATA_FETCH_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('timeout')), ms)
  })
  const promise = typeof promiseOrFactory === 'function' ? promiseOrFactory() : promiseOrFactory
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer))
}