<script setup>
import { Check, RotateCcw, X } from '@lucide/vue'

const open = ref(false)
const { theme } = useSettings()

const close = () => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
}
</script>

<template>
  <ContextMenu v-model:open="open">
    <ContextMenuTrigger
      class="relative transition-[filter] ease-out"
      :class="[open ? 'blur-xs brightness-75 duration-500' : 'duration-300']"
    >
      <slot />
    </ContextMenuTrigger>
    <ContextMenuContent
      @interact-outside="
        (e) => {
          e.target
        }
      "
      style="--radius: calc(var(--spacing) * 14)"
      class="pointer-events-none size-[calc(var(--radius)*2)] min-w-0 -translate-1/2 animate-none! overflow-visible rounded-full bg-transparent shadow-none ring-0 backdrop-blur-none"
    >
      <div
        style="--inner-radius: calc(var(--spacing) * 3.5)"
        class="relative top-1/2 left-1/2 size-[calc(var(--inner-radius)*2)] -translate-1/2 rounded-full [&_button]:transition-transform [&_button]:duration-100 [&_button]:ease-out [&_button]:outline-none [&_button]:hover:scale-140 [&_button]:active:scale-125"
      >
        <button
          v-show="open"
          class="text-destructive absolute grid size-full place-content-center rounded-full hover:contrast-200"
          @click="close"
        >
          <X class="size-5 stroke-3" />
        </button>
        <div
          v-for="(t, i) in THEMES"
          :style="{
            '--angle': `calc(360deg / ${THEMES.length} * ${i} + 90deg)`,
            'transform':
              'rotate(var(--angle)) translateX(calc(var(--radius) - var(--inner-radius))) rotate(calc(-1 * var(--angle)))',
          }"
          class="absolute size-full rounded-full"
          :class="[i === 0 ? 'z-10' : 'z-0']"
          :data-theme="t"
        >
          <ContextMenuItem class="contents" @select="theme = t">
            <Motion
              as="button"
              :initial="{ opacity: 0, scale: 0.8 }"
              :animate="{
                opacity: 1,
                scale: 1,
                transition: {
                  delay: (0.5 / THEMES.length) * i,
                  ...popoverTransition.after(),
                },
              }"
              :exit="{
                opacity: 0,
                scale: 0.8,
                transition: {
                  delay: 0.2 - (0.2 / THEMES.length) * i,
                  ...popoverTransition.before(),
                },
              }"
              class="bg-foreground-fixed [&>svg]:text-primary-foreground/40 absolute inset-0 grid place-content-center rounded-full border border-black/10 [&>svg]:size-(--inner-radius)"
            >
              <Check v-if="theme === t" />
              <RotateCcw v-else-if="i === 0" />
            </Motion>
          </ContextMenuItem>
        </div>
      </div>
    </ContextMenuContent>
  </ContextMenu>
</template>
