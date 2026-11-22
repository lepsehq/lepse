<script setup lang="ts">
const navItems = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'News', href: '/news' },
]
</script>

<template>
  <main class="bg-sidebar flex h-dvh flex-col">
    <!-- Navbar -->
    <nav class="mx-auto grid h-12 w-full max-w-6xl grid-cols-3 items-center px-4">
      <a href="/" class="flex items-center gap-2 select-none">
        <img src="/logo.svg" alt="logo" class="h-6" />
      </a>

      <!-- Notch for navitems for mobile + centered navigation -->
      <div
        class="bg-sidebar before:bg-sidebar border-muted xs:gap-2 max-xs:translate-y-12 max-xs:self-start xs:border-transparent relative z-10 flex gap-1 place-self-center rounded-b-2xl border-2 border-t-0 p-0.5 before:absolute before:bottom-full before:h-1 before:w-full"
      >
        <div
          class="absolute top-0 left-0 h-6 w-8 -translate-x-full -translate-y-0.5 *:rounded-tr-xl"
        >
          <div
            class="border-muted xs:border-transparent absolute inset-0 border-t-2 border-r-2 mask-l-from-50% mask-l-to-100%"
          ></div>
          <div class="absolute inset-0 shadow-[8px_-4px_0_var(--color-sidebar)]"></div>
        </div>
        <div
          class="absolute top-0 right-0 h-6 w-8 translate-x-full -translate-y-0.5 *:rounded-tl-xl"
        >
          <div
            class="border-muted xs:border-transparent absolute inset-0 border-t-2 border-l-2 mask-r-from-50% mask-r-to-100%"
          ></div>
          <div class="absolute inset-0 shadow-[-8px_-4px_0_var(--color-sidebar)]"></div>
        </div>

        <NuxtLink
          v-for="item in navItems"
          :key="item.label"
          v-slot="{ href, navigate, prefetch, shouldPrefetch, isExactActive }"
          :to="item.href"
          custom
        >
          <Button
            :variant="isExactActive ? 'default' : 'link'"
            :class="{
              'bg-primary/20 hover:bg-primary/30 text-primary saturate-150 backdrop-blur-none hover:brightness-110':
                isExactActive,
            }"
            as-child
          >
            <a
              :href="href || ''"
              @click="navigate"
              @pointerenter="shouldPrefetch('interaction') && prefetch()"
              @focus="shouldPrefetch('interaction') && prefetch()"
            >
              {{ item.label }}
            </a>
          </Button>
        </NuxtLink>
      </div>

      <!-- Action -->
      <div class="flex justify-end">
        <Button size="sm">
          <a href="/web">Open Lepse</a>
        </Button>
      </div>
    </nav>

    <!-- Shell -->
    <section
      class="bg-background outline-border/50 relative z-0 m-2 mt-0 flex flex-1 flex-col overflow-auto rounded-lg outline-2"
    >
      <NuxtPage />
    </section>
  </main>
</template>
