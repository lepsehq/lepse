<script setup lang="ts">
import { getVersion, getName } from '@tauri-apps/api/app'
import { invoke, isTauri } from '@tauri-apps/api/core'
import {
  CircleAlert,
  Image,
  LogOut,
  MonitorCog,
  Palette,
  Pencil,
  RotateCcwClock,
  Save,
  Timer,
  User,
  type LucideIcon,
} from '@lucide/vue'
import { useWindowSize } from '@vueuse/core'

const route = useRoute()
const { user, logoutMutation } = useAuth()
const { width } = useWindowSize()
const container = useTemplateRef('container')

type Item = {
  name: string
  path: string
  icon: LucideIcon
  disabled?: ComputedRef<boolean>
}

const sidebar: {
  header: Item
  groups: { label?: string; items: Item[] }[]
} = {
  header: {
    name: 'Edit profile',
    path: '/settings/profile',
    icon: Pencil,
    disabled: computed(() => user.value === undefined),
  },
  groups: [
    {
      items: [
        {
          name: 'Account',
          path: '/settings/account',
          icon: User,
          disabled: computed(() => user.value === undefined),
        },
      ],
    },
    {
      label: 'Experience',
      items: [
        {
          name: 'Appearance',
          path: '/settings/appearance',
          icon: Palette,
        },
        {
          name: 'Backgrounds',
          path: '/settings/background',
          icon: Image,
        },
        {
          name: 'Focus',
          path: '/settings/focus',
          icon: Timer,
        },
        ...(isTauri()
          ? [
              {
                name: `System`,
                path: '/settings/system',
                icon: MonitorCog,
              },
            ]
          : []),
      ],
    },
  ],
}
const activeSidebarItem = computed(() =>
  // Gather all Items
  [sidebar.header, ...sidebar.groups.flatMap((g) => g.items)].find((i) =>
    route.path.startsWith(i.path)
  )
)

const { dirty, save, reset } = useSettings()

const open = computed({
  get: () => route.path.startsWith('/settings'),
  set: (value: boolean) => {
    if (!value && route.path.startsWith('/settings')) {
      navigateTo('/')
    }
    return !value
  },
})

const unsavedChangesBannerRef = useTemplateRef('unsavedChangesBanner')
let stopTimeout: NodeJS.Timeout
let stopBannerShake = ref<null | (() => void)>(null)
const triggerUnsavedChanges = () => {
  stopBannerShake.value?.() // cleanup old shake
  if (unsavedChangesBannerRef.value) {
    stopBannerShake.value = shake(unsavedChangesBannerRef.value.$el)
  }
  clearTimeout(stopTimeout)
  stopTimeout = setTimeout(() => {
    stopBannerShake.value?.()
    stopBannerShake.value = null
  }, 400)
}

const router = useRouter()
router.beforeEach(() => {
  // Prevent the user from navigating
  // NOTE: check for open.value too just incase a quirk has dirty change to true some other way
  if (open.value && dirty.value) {
    triggerUnsavedChanges()
    return false
  }
})

// Open the sidebar on mobile only when coming "generally", and not to a specific page (/settings is written to redirect into /account)
const defaultMobileOpen = ref(false)
watch(open, () => {
  if (route.redirectedFrom?.path === '/settings') {
    defaultMobileOpen.value = true
  } else {
    defaultMobileOpen.value = false
  }
})

const appInfo = shallowRef<{
  os: string
  name: string
  version: string
}>()
onMounted(async () => {
  isTauri() &&
    (appInfo.value = {
      os: await invoke('get_os'),
      name: await getName(),
      version: await getVersion(),
    })
})
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="h-152 max-h-[calc(100%-2rem)] overflow-hidden p-0 sm:h-128 md:max-w-2xl lg:max-w-3xl"
    >
      <div ref="container" class="contents">
        <DialogTitle class="sr-only">Settings</DialogTitle>
        <DialogDescription class="sr-only">adjust ur likings and preferences</DialogDescription>

        <SidebarProvider
          :default-mobile-open
          class="min-h-full max-lg:[--sidebar-width:14rem]!"
          v-slot="{ isMobile }"
        >
          <Sidebar
            :container="container ?? undefined"
            :collapsible="isMobile ? 'offcanvas' : 'none'"
            class="hidden border-r md:flex"
          >
            <SidebarHeader>
              <SidebarMenuButton
                size="lg"
                class="group gap-3 rounded-tl-4xl"
                :is-active="activeSidebarItem?.path === sidebar.header.path"
                close-mobile-on-click
                as-child
                :aria-disabled="sidebar.header.disabled?.value"
              >
                <NuxtLink :to="!sidebar.header.disabled?.value ? sidebar.header.path : undefined">
                  <Avatar size="lg">
                    <AvatarImage :src="user?.avatarUrl ?? ''" />
                    <AvatarFallback :delay-ms="SKELETON_DELAY_MS">
                      {{ user?.initials ?? 'X' }}
                    </AvatarFallback>
                  </Avatar>
                  <div class="flex flex-1 flex-col gap-1">
                    <span class="truncate text-xs tracking-wide">{{ user?.name ?? 'wraith' }}</span>
                    <div
                      class="group-hover:text-foreground text-muted-foreground flex items-center gap-1 text-xs leading-none font-light"
                    >
                      <span>{{ sidebar.header.name }}</span>
                      <component :is="sidebar.header.icon" class="size-3!" />
                    </div>
                  </div>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarHeader>

            <SidebarContent>
              <template v-for="group in sidebar.groups">
                <SidebarSeparator class="first:hidden" />
                <SidebarGroup>
                  <SidebarGroupLabel v-if="group.label">{{ group.label }}</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem v-for="item in group.items" :key="item.name">
                        <SidebarMenuButton
                          :aria-disabled="item.disabled?.value"
                          :is-active="route.path.startsWith(item.path)"
                          close-mobile-on-click
                          as-child
                        >
                          <NuxtLink :to="!item.disabled?.value ? item.path : undefined">
                            <component :is="item.icon" />
                            <span>{{ item.name }}</span>
                          </NuxtLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </template>
              <template v-if="user">
                <SidebarSeparator />
                <SidebarGroup>
                  <SidebarMenuButton as-child>
                    <LoadingButton
                      variant="ghost"
                      size="sm"
                      :loading="logoutMutation.isPending.value"
                      class="text-destructive! hover:bg-destructive/10! justify-start"
                      @click="
                        dialog({
                          title: 'Are you sure you want to logout?',
                          description:
                            'This will end this session and return you to the login page.',
                          action: 'Logout',
                        }).then((v) => v && logoutMutation.mutate({}))
                      "
                    >
                      <LogOut />
                      Log Out
                    </LoadingButton>
                  </SidebarMenuButton>
                </SidebarGroup>
              </template>
            </SidebarContent>
            <SidebarFooter v-if="appInfo" class="flex-row items-center p-3">
              <!-- TODO: make button do smt cool -->
              <Button tabindex="-1" variant="ghost" size="icon-xl">
                <img src="/favicon.svg" class="size-7" />
              </Button>
              <div class="text-muted-foreground flex flex-col gap-1.5 *:leading-none *:capitalize">
                <p class="text-sm">{{ appInfo.name }} {{ appInfo.version }}</p>
                <p class="text-[11px] font-light">{{ appInfo.os }}</p>
              </div>
            </SidebarFooter>
          </Sidebar>

          <section class="md:bg-background relative flex flex-1 flex-col">
            <div class="border-border flex items-center gap-2 border-b px-6 py-4">
              <SidebarTrigger v-if="isMobile" />
              <DialogTitle class="leading-8">{{ activeSidebarItem?.name }}</DialogTitle>
            </div>

            <ScrollArea class="flex-1">
              <div class="flex flex-1 flex-col gap-8 p-6" :class="dirty && 'pb-20'">
                <NuxtPage />
              </div>
            </ScrollArea>

            <Item
              v-if="dirty"
              ref="unsavedChangesBanner"
              variant="outline"
              size="xs"
              class="absolute bottom-4 left-1/2 w-max -translate-x-1/2 backdrop-blur-lg transition-colors duration-200 ease-in"
              :class="
                !!stopBannerShake
                  ? 'border-destructive bg-[color-mix(in_oklch,var(--destructive)_10%,var(--card))]'
                  : 'bg-card/80 delay-2000'
              "
            >
              <ItemMedia variant="icon">
                <CircleAlert />
              </ItemMedia>
              <ItemContent class="mr-4">
                <ItemTitle>You have unsaved changes!</ItemTitle>
              </ItemContent>
              <ItemActions>
                <Button
                  variant="outline"
                  :size="width < BREAKPOINTS.xs ? 'icon-sm' : 'sm'"
                  @click="reset"
                >
                  <RotateCcwClock />
                  <span class="max-xs:hidden">Reset</span>
                </Button>
                <Button size="sm" @click="save">
                  <Save />
                  Save
                </Button>
              </ItemActions>
            </Item>
          </section>
        </SidebarProvider>
      </div>
    </DialogContent>
  </Dialog>
</template>
