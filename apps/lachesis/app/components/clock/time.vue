<script setup lang="ts">
import { createReusableTemplate, useLocalStorage } from '@vueuse/core'

defineProps<{ value: string; sub?: string; disableHint?: boolean; popout?: boolean }>()

const hasCustomizedAccent = useLocalStorage('hasCustomizedAccent', false)

const [DefineText, ReuseText] = createReusableTemplate()
</script>

<template>
  <DefineText>
    <p
      class="text-foreground-fixed relative w-fit place-self-center text-center font-semibold tabular-nums"
    >
      <span
        class="text-shadow-foreground-fixed/40 -mt-3 h-min leading-none text-shadow-lg"
        :class="popout ? 'text-7xl' : '2xl:text-10xl text-8xl sm:text-9xl'"
      >
        {{ value.replace(':', '꞉' /* modifier colon is more centered */) }}
      </span>
      <span
        v-if="sub"
        class="max-2xs:hidden absolute bottom-1.25 left-full translate-x-4 text-lg tracking-wider brightness-90 sm:bottom-2.25 sm:translate-x-6 sm:text-xl 2xl:bottom-3.25 2xl:text-2xl"
      >
        {{ sub }}
      </span>
    </p>
  </DefineText>

  <!-- Clock -->
  <ReuseText v-if="popout" />
  <ThemePicker v-else @update:open="hasCustomizedAccent = true">
    <ReuseText />
    <p
      v-if="!hasCustomizedAccent && !disableHint"
      class="font-xs text-muted-foreground absolute top-[calc(100%+var(--spacing)*6)] left-1/2 w-max -translate-x-1/2 rounded-sm px-2 text-center font-light tracking-wide backdrop-blur-sm backdrop-brightness-75"
    >
      Right click to change accent
    </p>
  </ThemePicker>
</template>
