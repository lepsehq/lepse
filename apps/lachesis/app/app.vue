<script setup lang="ts">
import { focusManager } from '@tanstack/vue-query'
import { isTauri } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { camelCase } from 'change-case'

const { $provideSocket, $socket } = useNuxtApp()

$provideSocket($socket, { owned: true })

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
  </Head>

  <UIProvider>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UIProvider>
  <DialogRenderer />
</template>
