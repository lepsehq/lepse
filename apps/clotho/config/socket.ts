import { defineConfig } from '@rlanz/socket'
import { allowedOrigins } from '../app/lib/util/origin.ts'
import UserTransformer from '#transformers/user_transformer'

export default defineConfig({
  websocket: {
    origin: allowedOrigins,
    middleware: [
      () => import('@adonisjs/auth/initialize_auth_middleware'),
      () => import('#middleware/silent_auth_middleware'),
    ],
    authenticate: async ({ httpContext }) => {
      const user = await httpContext.auth.authenticate()
      const serialization = await httpContext.serialize(
        UserTransformer.transform(user).useVariant('toPublic')
      )
      return serialization.data
    },
    pingInterval: '25s',
    pingTimeout: '5s',
  },
})
