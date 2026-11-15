import { invoke } from '@tauri-apps/api/core'

export const useSecret = (key: string) => {
  const get = async () => {
    try {
      return await invoke<string>('get_secret', { key })
    } catch (err) {
      console.error(err)
    }
  }
  const set = async (password: string) => {
    try {
      await invoke('set_secret', { key, password })
    } catch (err) {
      console.error(err)
    }
  }
  const del = async () => {
    try {
      await invoke('delete_secret', { key })
    } catch (err) {
      console.error(err)
    }
  }

  return { get, set, del }
}
