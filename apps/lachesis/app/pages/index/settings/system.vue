<script setup lang="ts">
import { invoke, isTauri } from '@tauri-apps/api/core'

definePageMeta({
  validate: isTauri,
})

let canTransparent = ref(false)
onMounted(() => {
  invoke<boolean>('can_transparent').then((v) => (canTransparent.value = v))
})

const groups = defineGroups({
  general: [
    {
      key: 'windowTransparency',
      title: 'Enable window transparency',
      description: "If your OS doesn't have a blur effect, this will look off.",
      disabled: computed(() => !canTransparent.value),
    },
    {
      key: 'nativeDecorations',
      title: 'Native decorations',
      description: 'Use system frame/titlebar (restart required).',
    },
    {
      key: 'minimizeToTray',
      title: 'Minimize to tray',
      description: 'Closing (clicking X) will minimize to tray instead of fully exiting the app.',
    },
  ],
})

const {
  controls: { windowTransparency, nativeDecorations, minimizeToTray },
} = useSettings()
</script>

<template>
  <SettingsPrimitive :groups v-slot="{ setting }">
    <Switch v-if="setting.key === 'windowTransparency'" v-model="windowTransparency" />
    <Switch v-if="setting.key === 'nativeDecorations'" v-model="nativeDecorations" />
    <Switch v-if="setting.key === 'minimizeToTray'" v-model="minimizeToTray" />
  </SettingsPrimitive>
</template>
