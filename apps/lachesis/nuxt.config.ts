// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: 'Lepse | Your personal productivity made fun',

      // Favicon
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon-96x96.png?v=20260926', sizes: '96x96' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg?v=20260926' },
        { rel: 'shortcut icon', href: '/favicon.ico?v=20260926' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png?v=20260926' },
        { rel: 'manifest', href: '/site.webmanifest?v=20260926' },
      ],

      meta: [
        {
          name: 'description',
          content:
            'A personal organization/productivity tool that maps your daily tasks to meaningful goals. and is aesthetic as hell.',
        },
        { name: 'apple-mobile-web-app-title', content: 'Lepse' },

        // OG IMAGE
        { property: 'og:title', content: 'Lepse' },
        {
          property: 'og:description',
          content:
            'A minimal and aesthetic productivity tool to help you focus on what matters and work toward your goals. Its aim is to make being productive simpler, more enjoyable, comfortable, and easy.',
        },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://lepse.app/' },
        { property: 'og:site_name', content: 'Lepse' },
        { property: 'og:locale', content: 'en_US' },
        { property: 'og:image', content: 'https://cdn.lepse.app/og.png' },
        { property: 'og:image:alt', content: 'Lepse logo on a minimal gradient background' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Lepse' },
        {
          name: 'twitter:description',
          content:
            'A minimal and aesthetic productivity tool to help you focus on what matters and work toward your goals. Its aim is to make being productive simpler, more enjoyable, comfortable, and easy.',
        },
        { name: 'twitter:image', content: 'https://cdn.lepse.app/og.png' },
        { name: 'twitter:image:alt', content: 'Lepse logo on a minimal gradient background' },
      ],
    },
  },

  compatibilityDate: '2025-07-15',
  css: ['~/assets/css/main.css'],

  // Enables the development server to be discoverable by other devices when running on iOS physical devices
  devServer: {
    host: '0.0.0.0',
  },

  devtools: { enabled: false },

  extends: ['@lepse/ui'],

  // Avoids error [unhandledRejection] EMFILE: too many open files, watch
  ignore: ['**/src-tauri/**'],

  imports: {
    dirs: ['~/composables/**'],
  },

  modules: ['motion-v/nuxt'],

  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'https://clotho.lepse.app',
    },
  },

  shadcn: {
    prefix: '',
  },

  // Enable CSR
  ssr: false,

  telemetry: false,

  vite: {
    // Better support for Tauri CLI output
    clearScreen: false,
    // Enable environment variables
    // Additional environment variables can be found at
    // https://v2.tauri.app/reference/environment-variables/
    envPrefix: ['VITE_', 'TAURI_'],
    server: {
      // Tauri requires a consistent port
      strictPort: true,
    },
  },

  nitro: {
    preset: 'cloudflare_module',

    cloudflare: {
      deployConfig: false,
      nodeCompat: true,
    },
  },
})
