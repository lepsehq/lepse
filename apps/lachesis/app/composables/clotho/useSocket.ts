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
  const { provideSocket, useChannel, useChannelEvent, useSocketState } =
    createSocketComposables<AppSocket>()

  return {
    socket,
    provideSocket,
    useChannel,
    useChannelEvent,
    useSocketState,
  }
})
