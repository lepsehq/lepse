import { LazyStore } from '@tauri-apps/plugin-store'
import { isTauri } from '@tauri-apps/api/core'

export const useStore = <T>(key: string, defaultValue: T) => {
  const raw = ref<T>(defaultValue) // raw value
  if (!isTauri()) return raw // return empty ref if not in tauri (sake of types)

  const store = new LazyStore('settings.json')

  // initialize value only once
  callOnce(`init-${key}`, async () => {
    raw.value = (await store.get<T>(key)) ?? defaultValue
  })

  // reactive value with setter
  return computed({
    get: () => raw.value,
    set: (v) => {
      raw.value = v
      store.set(key, v)
    },
  })
}
