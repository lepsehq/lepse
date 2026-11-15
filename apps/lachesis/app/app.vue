<script setup lang="ts">
import { focusManager } from '@tanstack/vue-query'
import { isTauri } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { camelCase } from 'change-case'

const { provideSocket, socket } = useSocket()
provideSocket(socket, { owned: true })

useLoungeServer()

const { theme, themeOptions } = useSettings()

// manage tanstack/vue-query's window focusManger to be handled by tauri
// NOTE: On linux, focusChanged runs as true on blur when using alt+tab? (can be ignored since refetchOnFocus is never enabled for everything or something all the time)
onMounted(() => {
  if (!isTauri()) return
  focusManager.setEventListener((handleFocus) => {
    const unlistenPromise = getCurrentWindow().onFocusChanged(({ payload: focused }) => {
      handleFocus(focused)
    })
    return () => {
      unlistenPromise.then((unlisten) => unlisten())
    }
  })
})

onMounted(() => {
  watch(
    theme,
    () => {
      window.document.documentElement.dataset.theme = theme.value
    },
    { immediate: true }
  )
  watch(
    themeOptions,
    () => {
      for (const to of THEME_OPTIONS) {
        if (themeOptions.value === to) {
          window.document.documentElement.dataset[camelCase(to.slice(5))] = ''
        } else {
          window.document.documentElement.removeAttribute(to)
        }
      }
    },
    { immediate: true }
  )
})
</script>

<template>
  <Head>
    <Title>Lepse | Your personal productivity made fun</Title>
    <Meta
      name="description"
      content="A personal organization/productivity tool that maps your daily tasks to meaningful goals. and is aesthetic as hell."
    />

    <!-- Favicon -->
    <Link rel="icon" type="image/png" href="/favicon-96x96.png?v=20260926" sizes="96x96" />
    <Link rel="icon" type="image/svg+xml" href="/favicon.svg?v=20260926" />
    <Link rel="shortcut icon" href="/favicon.ico?v=20260926" />
    <Link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=20260926" />
    <Meta name="apple-mobile-web-app-title" content="Lepse" />
    <Link rel="manifest" href="/site.webmanifest?v=20260926" />

    <!-- OG IMAGE -->
    <Meta property="og:title" content="Lepse" />
    <Meta
      property="og:description"
      content="A minimal and aesthetic productivity tool to help you focus on what matters and work toward your goals. Its aim is to make being productive simpler, more enjoyable, comfortable, and easy."
    />
    <Meta property="og:type" content="website" />
    <Meta property="og:url" content="https://lepse.app/" />
    <Meta property="og:site_name" content="Lepse" />
    <Meta property="og:locale" content="en_US" />
    <Meta property="og:image" content="https://cdn.lepse.app/og.png" />
    <Meta property="og:image:alt" content="Lepse logo on a minimal gradient background" />
    <Meta property="og:image:width" content="1200" />
    <Meta property="og:image:height" content="630" />
    <Meta name="twitter:card" content="summary_large_image" />
    <Meta name="twitter:title" content="Lepse" />
    <Meta
      name="twitter:description"
      content="A minimal and aesthetic productivity tool to help you focus on what matters and work toward your goals. Its aim is to make being productive simpler, more enjoyable, comfortable, and easy."
    />
    <Meta name="twitter:image" content="https://cdn.lepse.app/og.png" />
    <Meta name="twitter:image:alt" content="Lepse logo on a minimal gradient background" />
  </Head>

  <UIProvider>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UIProvider>
  <DialogRenderer />
</template>
