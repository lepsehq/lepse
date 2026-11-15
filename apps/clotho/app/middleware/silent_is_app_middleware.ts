import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import type { NextFn } from '@adonisjs/core/types/http'

export default class SilentIsAppMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    /**
     * Get Origin header
     */
    const origin = ctx.request.header('Origin')

    // Share app origins as isApp
    ctx.isApp = ['http://tauri.localhost', 'tauri://localhost'].includes(origin || '') || app.inDev // in development, treat everything as app

    return next()
  }
}

declare module '@adonisjs/core/http' {
  interface HttpContext {
    isApp: boolean
  }
}
