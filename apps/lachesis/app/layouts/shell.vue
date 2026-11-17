<script setup lang="ts">
import { Minus, SquareDashedTopSolid, SquaresIntersect, X } from '@lucide/vue'
import { isTauri } from '@tauri-apps/api/core'
import { getCurrentWebviewWindow, type WebviewWindow } from '@tauri-apps/api/webviewWindow'
import type { UnlistenFn } from '@tauri-apps/api/event'

const { activeBackground } = useBackgrounds()
const { windowTransparency, nativeDecorations, blurBackground, darkenBackground } = useSettings()
const { isFullscreen } = useFullscreen()

const showSkeleton = ref(false)
onMounted(() => {
  setTimeout(() => {
    showSkeleton.value = true
  }, SKELETON_DELAY_MS)
})

// ─── Tauri ──────────────────────────────────────────────────────── start ───

const isApp = isTauri()
const isAppMaximized = ref(false)
let appWindow: WebviewWindow | undefined
let unlisten: UnlistenFn | undefined

onBeforeMount(async () => {
  if (isApp) {
    appWindow = getCurrentWebviewWindow()
    isAppMaximized.value = await appWindow.isMaximized()

    unlisten = await appWindow?.onResized(async () => {
      isAppMaximized.value = (await appWindow?.isMaximized()) ?? false
    })
  }
})

onBeforeUnmount(() => {
  unlisten?.()
})

// app edge resize (top will be ignored)
const resize = async (
  event: MouseEvent,
  direction: Parameters<NonNullable<typeof appWindow>['startResizeDragging']>[0]
) => {
  if (!appWindow) {
    console.error('appWindow should exist!')
    return
  }

  // with the normal left click only, single click only
  if (event.buttons === 1 && event.detail === 1) {
    appWindow.startResizeDragging(direction)
  }
}

// ─── Tauri ────────────────────────────────────────────────────────── end ───
</script>

<template>
  <main
    class="flex h-dvh flex-col [--corner-offset:--spacing(16)] [--inset:--spacing(2)] [--titlebar-height:--spacing(8)]"
    :class="[windowTransparency ? 'bg-sidebar/80' : 'bg-sidebar']"
    @contextmenu.prevent
  >
    <template v-if="isApp && !nativeDecorations">
      <!-- Resize handlers -->
      <!-- NOTE: North (top) handler is not handled since that space is for the titlebar -->
      <div
        class="absolute top-(--titlebar-height) bottom-(--corner-offset) left-0 w-(--inset) cursor-w-resize"
        @mousedown="resize($event, 'West')"
      />
      <div
        class="absolute bottom-0 left-0 size-(--corner-offset) cursor-sw-resize"
        @mousedown="resize($event, 'SouthWest')"
      />
      <div
        class="absolute inset-x-(--corner-offset) bottom-0 h-(--inset) cursor-s-resize"
        @mousedown="resize($event, 'South')"
      />
      <div
        class="absolute right-0 bottom-0 size-(--corner-offset) cursor-se-resize"
        @mousedown="resize($event, 'SouthEast')"
      />
      <div
        class="absolute top-(--titlebar-height) right-0 bottom-(--corner-offset) w-(--inset) cursor-e-resize"
        @mousedown="resize($event, 'East')"
      />

      <!-- Custom titlebar -->
      <div
        v-show="!isFullscreen"
        data-slot="titlebar"
        data-tauri-drag-region
        class="-mb-2 flex h-(--titlebar-height) items-center justify-between"
        @pointerdown.stop
      >
        <div class="pointer-events-none ps-3 pe-2">
          <img src="/logo.svg" class="h-4" />
        </div>
        <div
          v-if="appWindow"
          class="z-377 [&_button]:pointer-events-auto [&_button]:rounded-none [&_button]:backdrop-blur-none"
        >
          <Updater />
          <span class="bg-border/50 mx-1 inline-block h-4 w-px first:hidden" />
          <Button
            variant="ghost"
            size="icon-sm"
            tabindex="-1"
            @click="appWindow.minimize()"
            class="text-muted-foreground"
          >
            <Minus />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            tabindex="-1"
            @click="appWindow.toggleMaximize()"
            class="text-muted-foreground"
          >
            <SquaresIntersect v-if="isAppMaximized" />
            <SquareDashedTopSolid v-else />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            tabindex="-1"
            @click="appWindow.close()"
            class="text-muted-foreground hover:text-destructive w-9 pr-1 hover:[&>svg]:stroke-3"
          >
            <X />
          </Button>
        </div>
      </div>
    </template>

    <!-- Main App -->
    <section
      data-vaul-drawer-wrapper
      class="bg-background outline-border/50 relative z-0 flex min-h-0 flex-1 flex-col overflow-hidden outline-2"
      :class="[!isFullscreen && 'm-(--inset) rounded-lg']"
    >
      <div class="absolute inset-0 -z-10">
        <Image
          :src="activeBackground.url"
          alt="background image"
          class="pointer-events-none -z-10 size-full bg-black object-cover"
          :class="{ 'blur-xs': blurBackground, 'brightness-75': darkenBackground }"
        />
      </div>

      <ScrollArea class="flex-1">
        <div
          class="relative flex min-h-[calc(512px-var(--titlebar-height)-var(--inset))] min-w-[calc(320px-var(--inset)*2)] flex-1 flex-col"
          :class="[isFullscreen ? 'p-6' : 'p-4']"
        >
          <slot />
        </div>

        <!-- No need for vertical scrollbar since it exists by default -->
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  </main>
</template>
