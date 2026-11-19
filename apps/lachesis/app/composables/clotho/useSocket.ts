import { Socket } from '@rlanz/socket/client'
import type { AppSocket } from '@lepse/clotho/socket'
import { createSocketComposables } from '@rlanz/socket/client/vue'
import { createSharedComposable } from '@vueuse/core'

export const useSocket = createSharedComposable(() => {
  const config = useRuntimeConfig()
  const { user } = useAuth()

  const socket = new Socket<AppSocket>({
    url: config.public.apiUrl,
    shouldReconnect: (e) => !!user.value,
  })
  const {
    provideSocket,
    useSocket: _useSocket,
    ...socketComposables
  } = createSocketComposables<AppSocket>()

  return {
    socket,
    provideSocket: (options?: Parameters<typeof provideSocket>['1']) => {
      return provideSocket(socket, options)
    },
    ...socketComposables,
  }
})
