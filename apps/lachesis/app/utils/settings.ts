export function defineGroups<const T extends Record<string, object[]>>(
  groups: T
): Record<string, T[keyof T][number][]> {
  return groups
}
