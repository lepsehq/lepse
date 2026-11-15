import { registry } from '@lepse/clotho/registry'
import { createTuyau, TuyauHTTPError } from '@tuyau/core/client'
import { persistQueryClient } from '@tanstack/query-persist-client-core'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createTuyauVueQueryClient } from '@tuyau/vue-query'
import { isTauri } from '@tauri-apps/api/core'

export default defineNuxtPlugin({
  name: 'clotho',
  async setup(app) {
    const config = useRuntimeConfig()

    // Use tanstack/vue-query
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: (failureCount, error) => {
            if (
              error instanceof TuyauHTTPError &&
              ([401, 404, 429].includes(error.status ?? 0) || /^5\d\d$/.test(String(error.status)))
            ) {
              return false
            }
            return failureCount < 3
          },
          // refetches will be done manually to avoid calling it so many times.
          refetchOnWindowFocus: false,
          refetchOnMount: false,
          gcTime: 1000 * 60 * 60 * 24 * 7,
        },
      },
    })
    const persistQueryClientProps = {
      queryClient,
      maxAge: 1000 * 60 * 60 * 24 * 7,
      persister: createAsyncStoragePersister({
        storage: localStorage,
        key: QUERY_OFFLINE_CACHE,
      }),
    }
    app.vueApp.use(VueQueryPlugin, {
      queryClient,
      clientPersister: () => persistQueryClient(persistQueryClientProps),
    })

    // the tuyau client
    const client = createTuyau({
      baseUrl: config.public.apiUrl,
      registry,
      credentials: 'include',
      hooks: {
        beforeRequest: [
          async (request) => {
            request.headers.set('x-client-date', getClientDate())
          },
        ],
        afterResponse: [
          (_request, _options, response) => {
            if (response.status === 429) {
              toast.error('Alright, you gotta chill -_-', {
                description: 'You got rate limited. Retry again later.',
              })
            }
          },
        ],
      },
    })

    // the tuyau vue-query client
    const api = createTuyauVueQueryClient({
      client,
    })

    return {
      provide: {
        queryClient, // queries without context (in plugins for example)
        persistQueryClientProps, // for useCacheSyncQueryClient
        client, // for overriding and using client directly instead of type safe options
        api, // for type-safe query and mutation options
      },
    }
  },
})
