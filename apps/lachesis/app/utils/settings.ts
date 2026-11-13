export const THEMES = [
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
export type Theme = (typeof THEMES)[number]
export const THEME_OPTIONS = [
  'data-fixed-color-clock',
  'data-fixed-color-image',
  'data-fixed-color-all',
] as const
export type ThemeOption = (typeof THEME_OPTIONS)[number]
export const THEME_OPTION_LABELS = {
  'data-fixed-color-clock': 'Clock only',
  'data-fixed-color-image': 'Over image only',
  'data-fixed-color-all': 'All',
} as const satisfies Record<(typeof THEME_OPTIONS)[number], string>

export function defineGroups<const T extends Record<string, object[]>>(
  groups: T
): Record<string, T[keyof T][number][]> {
  return groups
}
