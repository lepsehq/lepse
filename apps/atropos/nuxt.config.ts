// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      htmlAttrs: {
        lang: 'en',
      },
    },
  },

  compatibilityDate: '2025-07-15',
  css: ['~/assets/css/main.css'],

  devServer: {
    port: 4000,
  },

  devtools: { enabled: true },

  extends: ['@lepse/ui'],

  nitro: {
    preset: 'cloudflare_module',

    cloudflare: {
      deployConfig: false,
      nodeCompat: true,
    },
  },

  modules: ['@nuxtjs/color-mode', '@nuxtjs/device', '@nuxtjs/seo'],

  runtimeConfig: {
    public: {
      webUrl: process.env.NUXT_PUBLIC_WEB_URL || 'https://os.lepse.app',
    },
    githubToken: '',
  },

  // SEO
  site: {
    url: 'https://lepse.app',
    name: 'Lepse',
    description:
      'A minimal and aesthetic productivity tool designed to make being productive simpler, more enjoyable, and easier, with a pomodoro timer, a relaxing clock, and lounges to study together with friends.',
    defaultLocale: 'en',
  },
  ogImage: false,
  schemaOrg: {
    identity: {
      type: 'Organization',
      name: 'Lepse',
      logo: '/logo.svg',
      url: 'https://lepse.app',
      sameAs: ['https://github.com/lepsehq', 'https://www.reddit.com/r/lepse'],
    },
  },
})
