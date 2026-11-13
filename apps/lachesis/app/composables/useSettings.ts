import { createSharedComposable, useLocalStorage } from '@vueuse/core'

type Options = { live?: boolean; requiresRestart?: boolean }
const dirtySettings = ref<Record<string, { save: () => Options; reset: () => void }>>({})

/**
 * @returns `[value, controlValue]` where `value` is readonly and `controlValue` is reactive at all times
 */
const useSetting = <T>(
  storage: 'localstorage' | 'store',
  key: string,
  defaultValue: T,
  options?: Options
) => {
  options = { live: true, requiresRestart: false, ...options }
  const store = storage === 'store' ? useStore : useLocalStorage

  const persisted = store<T>(key, defaultValue) // the persisted saved setting
  const draft = ref<T | undefined>(undefined) // draft to save changed value when options.live
  const initial = ref<T | undefined>(undefined) // initial to snapshot value when options.requiresRestart
  return [
    // readonly view
    readonly(
      computed<T>(
        () =>
          (options.requiresRestart ? initial.value : undefined) ??
          (options.live ? draft.value : undefined) ??
          persisted.value
      )
    ),
    // control view
    computed<T>({
      get: () => draft.value ?? persisted.value /* fallback to persisted for defaultValue */,
      set: (v) => {
        // Set initial once if options.requiresRestart
        if (options?.requiresRestart && !initial.value) initial.value = persisted.value
        draft.value = v
        if (v === persisted.value && dirtySettings.value[key] !== undefined) {
          // Reseting the value to the "original" removes dirty marking
          delete dirtySettings.value[key]
        } else {
          dirtySettings.value[key] = {
            save: () => {
              persisted.value = v
              draft.value = undefined
              return options
            },
            reset: () => {
              draft.value = undefined
            },
          }
        }
      },
    }),
  ] as const
}

export const useSettings = createSharedComposable(() => {
  const settings = {
    // Appearance settings
    theme: useSetting<Theme>('localstorage', 'theme', 'beige'),
    themeOptions: useSetting<ThemeOption>('localstorage', 'themeOptions', 'data-fixed-color-clock'),
    blurBackground: useSetting('localstorage', 'blurBackground', true),
    darkenBackground: useSetting('localstorage', 'darkenBackground', true),
    // System settings
    windowTransparency: useSetting('localstorage', 'windowTransparency', false),
    nativeDecorations: useSetting('store', 'nativeDecorations', false, { requiresRestart: true }),
    minimizeToTray: useSetting('store', 'minimizeToTray', false),
  }

  const dirty = computed(() => Object.values(dirtySettings.value).length > 0)
  const save = () => {
    for (const setting of Object.values(dirtySettings.value)) {
      const _ = setting.save() // TODO: check returned options for requires restart
    }
    dirtySettings.value = {}
  }
  const reset = () => {
    for (const setting of Object.values(dirtySettings.value)) {
      setting.reset()
    }
    dirtySettings.value = {}
  }

  // Types and function to get settings' values and controls
  type Settings = typeof settings
  type Values = { [K in keyof Settings]: Settings[K][0] }
  type Controls = { [K in keyof Settings]: Settings[K][1] }

  const values: Record<string, unknown> = {}
  const controls: Record<string, unknown> = {}
  for (const [key, [v, c]] of Object.entries(settings)) {
    values[key] = v
    controls[key] = c
  }

  return {
    // Forward the first and second indexes for the values and control values respectively
    ...(values as Values),
    controls: controls as Controls,
    dirty,
    save,
    reset,
  }
})
