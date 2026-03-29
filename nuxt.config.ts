// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,

  modules: [
    'nuxt-auth-utils',
    'vuetify-nuxt-module',
  ],

  runtimeConfig: {
    session: {
      cookie: {
        secure: false,
        sameSite: 'lax',
      },
    },
  },

  vuetify: {
    moduleOptions: {
      ssrClientHints: {
        reloadOnFirstRequest: false,
      },
    },
  },

  typescript: {
    strict: true,
  },
})
