import { createSharedComposable, useNow } from '@vueuse/core'

export function mapErrors<T extends { field: string }>(errors: T[]) {
  return Object.fromEntries(errors.map((e) => [e.field, e]))
}

export function getClientDate(date?: Date | string | null) {
  const d =
    typeof date === 'string'
      ? new Date(date.includes('T') ? date : date + 'T00:00')
      : (date ?? new Date())
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/** Go back if previous page is of this app, else cut down the last segment of the route */
export function navigateBack() {
  return window.history.state?.back
    ? useRouter().back()
    : navigateTo(
        '/' +
          useRoute()
            .path.split('/')
            .filter(Boolean) // removes empty strings from the arr due to trailing slashes
            .slice(0, -1) // remove the last segment (to go back)
            .join('/')
      )
}

// IMPORTANT: MUST match tailwind breakpoints
export const BREAKPOINTS = {
  '2xs': 448,
  'xs': 512,
  'sm': 640,
  'md': 768,
  'lg': 1024,
  'xl': 1280,
  '2xl': 1536,
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

export const useSharedNow = createSharedComposable(useNow)

export const QUERY_OFFLINE_CACHE = 'QUERY_OFFLINE_CACHE'

export type FocusHandoff = { elapsed: number; running: boolean } | null

/**
 * Sorts an array by given key value order
 * falls back to "createdAt" (ISO string)
 */
export const sortByOrder = <T extends { createdAt?: string | null }, K extends keyof T>(
  items: T[] = [],
  key?: K,
  order: T[K][] = []
) => {
  // Give the rank based on the index position
  const rank = (item: T) => (key ? order.indexOf(item[key]) : 0)

  return items.toSorted(
    // if rank equals out, fallback to sorting by createdAt date (ISO string)
    (a, b) => rank(a) - rank(b) || (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
  )
}
