export const readStorage = (key: string): string | null => {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(key)
}

export const writeStorage = (key: string, value: string) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, value)
}
