<script setup lang="ts">
import type { LoungePeer } from '@lepse/clotho/types'
import { formatDuration, Stopwatch } from '~/lib/time'

const props = defineProps<{ timer: LoungePeer['timer'] }>()

const stopwatch = new Stopwatch()

watch(
  () => props.timer,
  () => {
    if (props.timer) {
      // stop the stopwatch if it's running, to avoid #tick overwriting elapsed's value
      stopwatch.running.value && stopwatch.stop()
      // measure how much timer offset happened (only if timer running, paused timers have no offsetting)
      const delta =
        props.timer.running && props.timer.timestamp ? Date.now() - props.timer.timestamp : 0
      stopwatch.elapsed.value = props.timer.elapsed + delta
      // Toggle playing state if doesn't match
      if (props.timer.running !== stopwatch.running.value) {
        stopwatch.toggle()
      }
    } else {
      stopwatch.reset()
    }
  },
  { immediate: true }
)
</script>

<template>
  <Tooltip>
    <TooltipTrigger as-child>
      <div class="relative">
        <div
          class="absolute -inset-1 rounded-full opacity-80 *:rounded-full group-hover/lounge-peer:opacity-100"
        >
          <div
            class="border-muted absolute inset-0 border-4 transition-opacity"
            :class="!timer && 'opacity-60'"
          ></div>
          <div
            v-if="timer"
            class="border-foreground-fixed absolute inset-0 border-4"
            :class="[
              timer.duration
                ? 'mask-conic-from-(--percent) mask-conic-to-(--percent)'
                : 'border-dashed',
              stopwatch.running.value ? 'animate-pulse' : 'opacity-60',
            ]"
            :style="{
              '--percent': `${timer.duration ? Math.max(0, Math.min(stopwatch.elapsed.value / timer.duration, 1)) * 100 : 0}%`,
            }"
          ></div>
        </div>
        <slot />
      </div>
    </TooltipTrigger>

    <TooltipContent v-if="timer" :side-offset="4">
      {{
        formatDuration(
          timer.duration ? timer.duration - stopwatch.elapsed.value : stopwatch.elapsed.value,
          { format: 'mm:ss' }
        )
      }}
    </TooltipContent>
  </Tooltip>
</template>
