<script setup lang="ts">
import { Crown } from '@lucide/vue'
import { createReusableTemplate } from '@vueuse/core'

const MAX_SHOWN_PEERS = 4

const props = defineProps<{ floating?: boolean }>()

const { user } = useAuth()
const { peers, hostId, timer } = useLoungeClient()
const peersArray = computed(() => Object.values(peers.value))

const [DefinePeers, ReusePeers] = createReusableTemplate<{ dialog?: boolean }>()
</script>

<template>
  <DefinePeers v-slot="{ dialog }">
    <template v-for="(p, i) in peersArray" :key="p.user.id">
      <div
        v-if="dialog || !floating || i < MAX_SHOWN_PEERS"
        class="group/lounge-peer flex items-center-safe justify-start gap-3"
        :class="{ 'flex-row-reverse': floating && !dialog }"
        :data-dialog="dialog"
      >
        <LoungeTimer :timer="user?.id === p.user.id ? timer : p.timer">
          <Avatar class="opacity-80 group-hover/lounge-peer:opacity-100">
            <AvatarImage :src="p.user.avatarUrl ?? ''" />
            <AvatarFallback :delay-ms="SKELETON_DELAY_MS">
              {{ p.user.initials ?? 'X' }}
            </AvatarFallback>
          </Avatar>
        </LoungeTimer>
        <p
          class="flex items-center gap-1.5 truncate opacity-60 transition-opacity group-hover/lounge-peer:opacity-100"
          :class="{ 'flex-row-reverse max-lg:hidden': floating && !dialog }"
        >
          {{ p.user.name }}
          <Crown v-if="String(p.user.id) === hostId" class="fill-primary text-primary size-3.5" />
        </p>
      </div>
    </template>
  </DefinePeers>

  <div
    class="flex max-h-full flex-col gap-3"
    :class="{
      'absolute top-1/2 -translate-y-1/2 pl-4 max-sm:left-0 sm:right-0 sm:pr-4 lg:max-w-64':
        floating,
    }"
  >
    <ReusePeers />

    <template v-if="floating && peersArray.length > MAX_SHOWN_PEERS">
      <Dialog>
        <DialogTrigger as-child>
          <Button variant="outline" size="xs" class="self-end">
            +{{ peersArray.length - MAX_SHOWN_PEERS }} more
          </Button>
        </DialogTrigger>
        <DialogContent
          class="max-w-64 gap-0 overflow-hidden p-0 sm:max-w-64"
          :aria-describedby="undefined"
        >
          <DialogHeader class="border-b p-6">
            <DialogTitle>Lounge members</DialogTitle>
          </DialogHeader>
          <div class="relative h-48">
            <div class="absolute inset-0">
              <ScrollArea class="size-full">
                <div class="flex flex-col gap-3 p-6 pt-4">
                  <ReusePeers :dialog="true" />
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </template>
  </div>
</template>
