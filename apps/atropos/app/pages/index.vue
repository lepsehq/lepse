<script setup lang="ts">
import { ChevronDown, ChevronsDown, X } from '@lucide/vue'
import LogosApple from '@/components/logos/apple.vue'
import LogosArchLinux from '@/components/logos/arch-linux.vue'
import LogosFedora from '@/components/logos/fedora.vue'
import LogosFlathub from '@/components/logos/flathub.vue'
import LogosGithub from '@/components/logos/github.vue'
import LogosLinux from '@/components/logos/linux.vue'
import LogosMicosoftStore from '@/components/logos/microsoft-store.vue'
import LogosReddit from '@/components/logos/reddit.vue'
import LogosUbuntu from '@/components/logos/ubuntu.vue'
import LogosWindows from '@/components/logos/windows.vue'
import { createReusableTemplate } from '@vueuse/core'

definePageMeta({ layout: 'shell' })

/* ------------------------------------ DOWNLOADS ------------------------------------  */

const { data: release } = useFetch('/api/release')
const { isWindows, isLinux, isMacOS } = useDevice()

const downloadsRef = useTemplateRef('downloads')
const scrollToDownloads = () => {
  downloadsRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

let arch = ref<'x64' | 'a64'>('x64')
const platformDownloads = computed(() => [
  {
    name: 'Windows',
    logo: LogosWindows,
    actions: [
      {
        label: 'Download &nbsp;.exe',
        icon: LogosWindows,
        action: 'download',
        link: release.value?.assets['x64.exe'],
        supportedArches: ['x64'],
      },
      // TODO: Microsoft Store (need to wait until Tauri supports .msix)
      // {
      //   label: 'Microsoft Store',
      //   icon: LogosMicosoftStore,
      //   action: 'open',
      //   link: 'https://apps.microsoft.com/detail/xxxxxxxxxxxxxxxx',
      //   supportedArches: ['x64', 'a64'],
      // },
    ],
  },
  {
    name: 'Linux*',
    logo: LogosLinux,
    actions: [
      {
        label: 'Get it on Flathub',
        icon: LogosFlathub,
        action: 'open',
        link: 'https://flathub.org/en/apps/app.lepse.Lepse',
        supportedArches: ['x64', 'a64'],
      },
      {
        label: 'Download &nbsp;.deb',
        icon: LogosUbuntu,
        action: 'download',
        link: release.value?.assets[arch.value === 'x64' ? 'x64.deb' : 'a64.deb'],
        supportedArches: ['x64', 'a64'],
      },
      {
        label: 'Download &nbsp;.rpm',
        icon: LogosFedora,
        action: 'download',
        link: release.value?.assets[arch.value === 'x64' ? 'x64.rpm' : 'a64.rpm'],
        supportedArches: ['x64', 'a64'],
      },
      // TODO: AUR
      // {
      //   label: 'Get it on the AUR',
      //   icon: LogosArchLinux,
      //   action: 'open',
      //   link: 'https://aur.archlinux.org/packages/lepse-bin',
      //   supportedArches: ['x64'],
      // },
    ],
  },
  {
    name: 'macOS',
    logo: LogosApple,
    actions: [
      {
        label: 'Download &nbsp;.dmg',
        icon: LogosApple,
        action: 'download',
        link: release.value?.assets[arch.value === 'x64' ? 'x64.dmg' : 'a64.dmg'],
        supportedArches: ['x64', 'a64'],
      },
    ],
  },
])

/* ---------------------------------- FEATURES ----------------------------------  */

const [DefineFeatureCard, ReuseFeatureCard] = createReusableTemplate<{
  title: string
  description: string
  src: string
}>()

/* ------------------------------------ NEWS ------------------------------------  */

const newsRef = useTemplateRef('news')
const scrollToNews = () => {
  newsRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
</script>

<template>
  <!-- Hero image -->
  <div
    class="pointer-events-none absolute -z-10 flex w-full flex-col saturate-150 select-none dark:brightness-75 [&_img]:h-224 [&_img]:object-cover"
  >
    <div class="contents *:mask-b-from-0%">
      <img fetchpriority="high" src="/images/hero-dark.webp" alt="" class="not-dark:hidden" />
      <img fetchpriority="high" src="/images/hero-light.webp" alt="" class="dark:hidden" />
    </div>
    <div
      class="contents *:rotate-180 *:mask-t-from-35% *:mask-t-to-60% *:mask-b-from-0% sm:*:mask-t-to-45% lg:*:mask-t-to-50%"
    >
      <img src="/images/hero-dark.webp" alt="" class="not-dark:hidden" />
      <img src="/images/hero-light.webp" alt="" class="dark:hidden" />
    </div>
  </div>

  <div class="flex flex-col gap-24">
    <!-- Hero -->
    <div class="flex flex-col items-center-safe gap-8 p-6 pt-44 sm:pt-40 md:pt-36 lg:pt-32">
      <Button variant="outline" size="xs" class="-mb-4" @click="scrollToNews">
        <span class="bg-primary mr-1 size-2 rounded-full" />
        What is Lepse?
      </Button>
      <p
        class="max-w-[15ch] text-center text-4xl leading-tight font-medium sm:text-5xl md:text-6xl lg:text-7xl"
      >
        Aesthetic productivity made easy
      </p>

      <!-- Dowload buttons -->
      <div class="flex flex-wrap justify-center gap-2">
        <ButtonGroup aria-label="Download options">
          <Button size="xl" @click="isLinux && scrollToDownloads()" :as-child="!isLinux">
            <component
              :is="isLinux ? 'div' : 'a'"
              :href="
                platformDownloads.find(
                  (p) => p.name === (isWindows ? 'Windows' : isMacOS ? 'macOS' : '')
                )?.actions[0]?.link
              "
              :class="{ contents: isLinux }"
            >
              <component
                :is="
                  isWindows ? LogosWindows : isLinux ? LogosLinux : isMacOS ? LogosApple : undefined
                "
              />
              Download Lepse
            </component>
          </Button>
          <Button size="icon-xl" aria-label="Scroll to more downloads" @click="scrollToDownloads">
            <ChevronsDown />
          </Button>
        </ButtonGroup>
        <Button variant="outline" size="xl" as-child>
          <a href="/web">Open in browser</a>
        </Button>
      </div>
      <p class="text-muted-foreground mt-4 text-sm">Enjoy being productive once again.</p>

      <!-- TODO: make a 6.7% chance of the 67 version to load instead -->
      <img
        src="/images/app-mobile.webp"
        alt="mobile app screenshot"
        draggable="false"
        class="bg-accent aspect-6/13 max-h-192 max-w-full rounded-xl border object-contain select-none sm:hidden"
      />
      <img
        src="/images/app-tablet.webp"
        alt="tablet app screenshot"
        draggable="false"
        class="bg-accent aspect-3/4 max-h-156 max-w-full rounded-xl border object-contain select-none max-sm:hidden lg:hidden"
      />
      <img
        src="/images/app-desktop.webp"
        alt="desktop app screenshot"
        draggable="false"
        class="bg-accent aspect-16/10 w-full max-w-5xl rounded-xl border select-none max-lg:hidden"
      />

      <p class="text-muted-foreground -mt-2 -mb-6 h-0 text-center text-xs lg:hidden">
        * Resized desktop app. A mobile app doesn't exist just <i>yet</i>.
      </p>
    </div>

    <!-- Features -->
    <div class="mt-12 flex flex-col items-center-safe gap-12 p-6">
      <p class="text-center text-3xl font-medium md:text-4xl lg:text-5xl">
        Productivity meets aesthetics
      </p>
      <p
        class="text-muted-foreground -mt-8 text-center text-sm tracking-wide sm:text-base md:text-lg lg:-mt-6 lg:text-xl"
      >
        Powerful and beautiful for all your needs
      </p>

      <DefineFeatureCard v-slot="{ title, description, src }">
        <Card class="bg-card/60 justify-between gap-0">
          <img
            :src
            draggable="false"
            class="mask-r-from-20% mask-b-from-40% select-none not-dark:grayscale not-dark:invert"
          />
          <CardHeader class="gap-1">
            <CardTitle class="text-xl">{{ title }}</CardTitle>
            <CardDescription>{{ description }}</CardDescription>
          </CardHeader>
        </Card>
      </DefineFeatureCard>

      <div
        class="grid w-full max-w-sm gap-4 sm:max-w-xl sm:grid-cols-2 sm:grid-rows-13 md:max-w-2xl lg:max-w-3xl"
      >
        <ReuseFeatureCard
          title="Tasks"
          description="Manage your focus and productivity."
          src="/images/app-tasks.png"
          class="order-1 row-span-5 sm:order-1"
        />
        <ReuseFeatureCard
          title="Goals"
          description="Manage what matters."
          src="/images/app-goals.png"
          class="order-4 row-span-7 sm:order-2"
        />
        <ReuseFeatureCard
          title="Focus timer"
          description="A Pomodoro or stopwatch timer to keep track of your focused time on a task."
          src="/images/app-focus.png"
          class="order-2 row-span-8 sm:order-3"
        />
        <ReuseFeatureCard
          title="Lounges"
          description="Focus together with your friends."
          src="/images/app-lounge.png"
          class="order-3 row-span-6 sm:order-4"
        />

        <Card
          class="from-primary/16 to-card/60 order-5 w-full max-w-3xl bg-transparent bg-linear-to-br sm:col-span-2"
        >
          <Empty class="py-6">
            <EmptyHeader>
              <EmptyTitle>And many more</EmptyTitle>
              <EmptyDescription>Coming soon...</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Card>
      </div>
    </div>

    <!-- Downloads -->
    <div ref="downloads" class="bg-card/80 -my-4 flex flex-col items-center-safe gap-6 p-6 py-10">
      <p
        class="max-w-[15ch] text-center text-2xl leading-tight font-medium sm:text-3xl md:text-4xl lg:text-5xl"
      >
        Download Lepse
      </p>

      <p class="text-muted-foreground -mt-2 text-center sm:text-lg">
        Our app is available for all desktop platforms, choose your desired platform.
      </p>

      <div
        class="bg-accent/80 -mb-4 flex gap-1 rounded-full p-1 backdrop-blur-sm [&>button]:backdrop-blur-none"
      >
        <Button
          v-for="a in ['x64', 'a64']"
          :key="a"
          :variant="arch === a ? 'default' : 'ghost'"
          size="sm"
          :class="arch === a ? 'font-medium opacity-100!' : 'opacity-60'"
          @click="arch = a"
        >
          {{ a === 'x64' ? 'x64_86' : 'aarch64' }}
        </Button>
      </div>

      <div class="mt-4 grid sm:grid-cols-2 sm:max-lg:gap-y-4 lg:grid-cols-3">
        <div
          v-for="p in platformDownloads"
          class="flex aspect-square h-60 flex-col items-center-safe justify-center justify-self-center transition-all last:border-0 max-sm:border-b-2 sm:aspect-5/4 sm:border-r-2 sm:max-lg:last:col-span-2 sm:max-lg:nth-last-2:border-r-0 md:h-64"
        >
          <component :is="p.logo" class="size-24 fill-current" />
          <p class="mt-1 text-lg font-semibold tracking-wide">{{ p.name }}</p>
          <ButtonGroup class="mt-4">
            <!-- If download options exist (to check when to show arch not supported) -->
            <template v-if="p.actions.find((a) => a.supportedArches.includes(arch))">
              <Button size="lg" as-child>
                <a
                  :href="p.actions[0]!.link"
                  :target="p.actions[0]!.action === 'open' ? '_blank' : '_self'"
                >
                  <component :is="p.actions[0]!.icon" class="size-6 fill-current opacity-80" />
                  <span v-html="p.actions[0]!.label" />
                </a>
              </Button>

              <DropdownMenu v-if="p.actions.length > 1">
                <DropdownMenuTrigger as-child>
                  <Button size="icon-lg" aria-label="more options">
                    <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <template v-for="a in p.actions.slice(1)" :key="a.label">
                    <DropdownMenuItem v-if="a.supportedArches.includes(arch)" as-child>
                      <a :href="a.link" :target="a.action === 'open' ? '_blank' : '_self'">
                        <component :is="a.icon" class="fill-current" />
                        <span v-html="a.label" />
                      </a>
                    </DropdownMenuItem>
                  </template>
                </DropdownMenuContent>
              </DropdownMenu>
            </template>
            <template v-else>
              <Button variant="link" size="lg" disabled>
                <X class="text-destructive" />
                <p class="">{{ arch === 'x64' ? 'x64_86' : 'aarch64' }} not supported</p>
              </Button>
            </template>
          </ButtonGroup>
        </div>
      </div>

      <p
        class="text-muted-foreground mt-2 max-w-prose text-center text-xs font-light tracking-wide"
      >
        * [Linux] Flathub is the recommended way to install Lepse. The others may be unstable since
        it will always use the system webview.
      </p>
    </div>

    <!-- News -->
    <div ref="news" class="flex flex-col items-center-safe gap-12 px-6">
      <p class="text-center text-3xl font-medium md:text-4xl lg:text-5xl">Latest from Lepse</p>

      <Card class="bg-card/60 w-full max-w-xs">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>News</EmptyTitle>
            <EmptyDescription>Coming soon.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Card>

      <Button size="lg" as-child>
        <NuxtLink to="/news">See all news</NuxtLink>
      </Button>
    </div>

    <!-- Footer -->
    <div class="from-primary/16 bg-muted/32 border-t bg-linear-to-b p-8 pb-4 sm:bg-linear-to-br">
      <div class="mx-auto flex w-full max-w-5xl flex-col">
        <div class="flex gap-x-8 gap-y-4 max-sm:flex-col max-sm:items-center sm:justify-between">
          <img src="/logo.svg" alt="logo" class="h-8 w-fit" />

          <div class="flex gap-1">
            <Tooltip
              v-for="(r, i) in [
                { label: 'Github', href: 'https://github.com/lepsehq/lepse', icon: LogosGithub },
                { label: 'Reddit', href: 'https://reddit.com/r/lepse', icon: LogosReddit },
              ]"
              :key="i"
            >
              <TooltipTrigger as-child>
                <Button variant="ghost" size="icon" :aria-label="r.label" as-child>
                  <a :href="r.href" target="_blank">
                    <component :is="r.icon" class="size-6 fill-current" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{{ r.label }}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div class="text-muted-foreground mt-4 flex flex-col gap-2 max-sm:items-center-safe">
          <p>
            Lepse is
            <a
              href="https://github.com/lepsehq/lepse"
              target="_blank"
              class="text-primary hover:underline"
              >open source</a
            >.*
          </p>
          <div class="flex justify-between gap-1 text-sm">
            <p>© 2026 Lepse.</p>
            <p class="italic">
              built by
              <a
                href="https://github.com/aervxa"
                target="_blank"
                class="text-primary hover:underline"
                >aervxa</a
              >.
            </p>
          </div>
        </div>

        <div class="text-muted-foreground mt-8 text-center text-xs">
          <p>*All of the code is public and contributions are appreciated.</p>
          <p>The app is fully open source, the rest are technically Source Available.</p>
        </div>
      </div>
    </div>
  </div>
</template>
