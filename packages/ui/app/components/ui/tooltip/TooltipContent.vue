<script setup lang="ts">
import type { TooltipContentEmits, TooltipContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { TooltipArrow, TooltipContent, TooltipPortal, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/utils'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<TooltipContentProps & { class?: HTMLAttributes['class']; hideArrow?: boolean }>(),
  {
    sideOffset: 0,
    hideArrow: false,
  }
)

const emits = defineEmits<TooltipContentEmits>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <TooltipPortal>
    <TooltipContent
      data-slot="tooltip-content"
      v-bind="{ ...forwarded, ...$attrs }"
      :class="
        cn(
          'data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 bg-accent text-accent-foreground outline-ring/50 z-50 inline-flex w-fit max-w-xs origin-(--reka-tooltip-content-transform-origin) items-center gap-1.5 rounded-2xl px-3 py-1.5 text-xs outline has-data-[slot=kbd]:pr-1.5 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-4xl',
          props.class
        )
      "
    >
      <slot />

      <TooltipArrow
        v-if="!hideArrow"
        class="bg-accent fill-accent border-ring/50 z-50 size-2.5 -translate-y-1/2 rotate-45 rounded-br-xs border border-t-transparent border-l-transparent data-[side=left]:translate-x-[-1.5px] data-[side=right]:translate-x-[1.5px]"
      />
    </TooltipContent>
  </TooltipPortal>
</template>
