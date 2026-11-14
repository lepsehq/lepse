import { createSharedComposable, useLocalStorage } from '@vueuse/core'
import { isEqual } from 'lodash-es'

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
  // these two take defaultValue and not persisted.value to not share the same object proxy
  // however, it shouldn't be a problem since the immediate watcher should overwrite that
  const draft = ref<T>(defaultValue) // control value
  const initial = ref<T>(defaultValue) // initial to snapshot value when options.requiresRestart

  // set draft to mirror persisted
  watch(
    persisted,
    (v) => {
      draft.value = structuredClone(toRaw(v)) // clone to not share same obj
    },
    { immediate: true }
  )

  // watch draft (control) to watch for changes
  watch(
    draft,
    (v) => {
      if (v === undefined) return
      options?.requiresRestart && initial.value === undefined && (initial.value = persisted.value) // initial is not changing, so doesn't have to be cloned

      const dT = () => delete dirtySettings.value[key]

      // If the value matches the "original", delete the dirty tracker
      if (isEqual(v, persisted.value)) dT()
      else {
        dirtySettings.value[key] = {
          save: () => {
            persisted.value = structuredClone(toRaw(v)) // clone to not share same obj
            dT()
            return options
          },
          reset: () => {
            draft.value = structuredClone(toRaw(persisted.value)) // reset draft | clone to not share same obj
            dT()
          },
        }
      }
    },
    { deep: true }
  )

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
    draft,
  ] as const
}

export const useSettings = createSharedComposable(() => {
  const settings = {
    // Appearance settings
    theme: useSetting<Theme>('localstorage', 'theme', 'beige'),
    themeOptions: useSetting<ThemeOption>('localstorage', 'themeOptions', 'data-fixed-color-clock'),
    blurBackground: useSetting('localstorage', 'blurBackground', true),
    darkenBackground: useSetting('localstorage', 'darkenBackground', true),
    // Focus settings (timer)
    timerDurations: useSetting('localstorage', 'timerDurations', {
      enabled: false,
      focus: 25,
      break: 5,
      longBreak: 15,
    }),
    // enableTimerAutoskip: useSetting('localstorage', 'enableTimerAutoskip', false),
    enableTimerNotifications: useSetting('localstorage', 'enableTimerNotifications', true),
    // enableTimerNotificationSounds: useSetting(
    //   'localstorage',
    //   'enableTimerNotificationSounds',
    //   true
    // ),
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
