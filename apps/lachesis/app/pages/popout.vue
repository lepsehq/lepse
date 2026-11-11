<script setup lang="ts">
import { ArrowLeftRight, SquareArrowOutDownLeft, X } from '@lucide/vue'
import { isTauri } from '@tauri-apps/api/core'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { useEventListener, useLocalStorage } from '@vueuse/core'

const { activeBackground } = useBackgrounds()
const { blurBackground, darkenBackground } = useSettings()

const main = useTemplateRef('main')
const focusRef = useTemplateRef('focus')

useEventListener(main, 'mousedown', (e) => {
  if (!(e.target as Element).closest('button') && e.buttons === 1) {
    isTauri() && getCurrentWebviewWindow().startDragging()
  }
})

useCacheSyncQueryClient()

const isPopoutOpen = useLocalStorage('popout-open', false)
</script>

<template>
  <main ref="main" class="bg-sidebar flex h-dvh flex-col pt-4">
    <Image
      :src="activeBackground.url"
      class="pointer-events-none absolute inset-0 size-full bg-black object-cover saturate-75"
      :class="{ 'blur-[2px]': blurBackground, 'brightness-75': darkenBackground }"
    />

    <div
      class="bg-sidebar/40 border-border/50 absolute inset-x-0 top-0 grid h-8 grid-cols-[--spacing(8)_1fr_--spacing(8)] overflow-hidden border-b-2 backdrop-blur-sm"
    >
      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            variant="ghost-destructive"
            size="icon-sm"
            tabindex="-1"
            @click="getCurrentWebviewWindow().close()"
            class="w-9 rounded-none pl-1 text-muted-foreground"
          >
            <SquareArrowOutDownLeft />
          </Button>
        </TooltipTrigger>
        <TooltipContent :align-offset="6" :side-offset="6" hide-arrow align="start">
          Return to window
        </TooltipContent>
      </Tooltip>

      <p
        class="text-muted-foreground content-center-safe text-center text-xs font-light tracking-widest"
      >
        {{ focusRef?.focusMethod === 'pomodoro' ? focusRef?.pomoState : 'stopwatch' }} session
      </p>

      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            variant="ghost"
            size="icon-sm"
            tabindex="-1"
            @click="focusRef?.toggleFocusMethod()"
            class="w-9 rounded-none pr-1 text-muted-foreground"
          >
            <ArrowLeftRight />
          </Button>
        </TooltipTrigger>
        <TooltipContent :align-offset="6" :side-offset="6" hide-arrow align="end">
          Toggle to {{ focusRef?.focusMethod === 'stopwatch' ? 'Pomodoro' : 'Stopwatch' }}
        </TooltipContent>
      </Tooltip>
    </div>

    <ClockFocus v-if="isPopoutOpen" ref="focus" popout />
  </main>
</template>
