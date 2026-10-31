import { useLocalStorage } from '@vueuse/core'

export const useSettings = () => {
  // Appearance settings
  const THEMES = [
    'white',
    'beige',
    'red',
    'amber',
    'yellow',
    'lime',
    'green',
    'teal',
    'cyan',
    'blue',
    'indigo',
    'violet',
    'magenta',
    'rose',
    'espresso',
  ] as const
  const theme = useLocalStorage<(typeof THEMES)[number]>('theme', 'beige')

  const THEME_OPTIONS = [
    'data-fixed-color-clock',
    'data-fixed-color-image',
    'data-fixed-color-all',
  ] as const
  const THEME_OPTION_LABELS = {
    'data-fixed-color-clock': 'Clock only',
    'data-fixed-color-image': 'Over image only',
    'data-fixed-color-all': 'All',
  } as const satisfies Record<(typeof THEME_OPTIONS)[number], string>
  const themeOptions = useLocalStorage<(typeof THEME_OPTIONS)[number]>(
    'themeOptions',
    'data-fixed-color-clock'
  )

  const blurBackground = useLocalStorage('blurBackground', true)
  const darkenBackground = useLocalStorage('darkenBackground', true)

  const appearanceSettings = {
    THEMES,
    theme,
    THEME_OPTIONS,
    THEME_OPTION_LABELS,
    themeOptions,
    blurBackground,
    darkenBackground,
  }

  // App settings
  const windowTransparency = useLocalStorage('windowTransparency', false)
  const nativeDecorations = useStore('nativeDecorations', false)
  const minimizeToTray = useStore('minimizeToTray', false)

  const appSettings = { windowTransparency, nativeDecorations, minimizeToTray }

  return { ...appearanceSettings, ...appSettings }
}
