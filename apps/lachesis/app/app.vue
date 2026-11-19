<script setup lang="ts">
import { focusManager } from '@tanstack/vue-query'
import { isTauri } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { camelCase } from 'change-case'

const { provideSocket } = useSocket()
provideSocket()

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
  <UIProvider>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UIProvider>
  <DialogRenderer />
</template>
