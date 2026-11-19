<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    showAction?: boolean
    actionLabel?: string
    action?: () => void
  }>(),
  {
    title: 'Access denied.',
    showAction: true,
    actionLabel: 'Go back',
  }
)
</script>

<template>
  <div class="absolute inset-0 z-50 grid place-content-center bg-black/80 backdrop-blur-xs">
    <Empty>
      <EmptyHeader>
        <EmptyTitle>{{ title }}</EmptyTitle>
      </EmptyHeader>
      <EmptyContent v-if="showAction">
        <LoadingButton :action="async () => (action ? action() : navigateBack())">
          {{ actionLabel }}
        </LoadingButton>
      </EmptyContent>
    </Empty>
  </div>
</template>
