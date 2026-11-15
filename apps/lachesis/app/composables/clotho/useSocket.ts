import { Socket } from '@rlanz/socket/client'
import type { AppSocket } from '@lepse/clotho/socket'
import { createSocketComposables } from '@rlanz/socket/client/vue'
import { isTauri } from '@tauri-apps/api/core'
import { createSharedComposable } from '@vueuse/core'

export const useSocket = createSharedComposable(async () => {
  const config = useRuntimeConfig()
  const { user } = useAuth()

  const token = isTauri() ? await useSecret('credentials').get() : undefined
  const url = config.public.apiUrl + (token ? `?token=${token}` : '')
  const socket = new Socket<AppSocket>({
    url,
    shouldReconnect: (e) => !!user.value,
  })
  const socketComposables = createSocketComposables<AppSocket>()

  return { socket, ...socketComposables, useSocket: undefined }
})
