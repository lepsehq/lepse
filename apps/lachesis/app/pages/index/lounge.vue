<script setup lang="ts">
import { Check, Copy, X } from '@lucide/vue'
import { useClipboard } from '@vueuse/core'
import { PopoverClose } from 'reka-ui'

const source = inject(bubbleNavSourceKey)

const { user } = useAuth()
const { $client } = useNuxtApp()
const { useSocketState, socket } = useSocket()
const { id, connection, join, leave } = useLoungeClient()
const { state } = useSocketState()

const loungeId = ref('') // just for joining
const censoredId = computed(() => (id.value || '').replace(/[^-](?<=-.*)/g, '*'))

const createLounge = () =>
  $client.api.lounges
    .store({})
    .then(({ data: { id } }) => {
      join(id)
    })
    .catch((err) => {
      toast.error('Failed to create Lounge!', { description: err.message })
    })

const { copy, copied } = useClipboard()
</script>

<template>
  <Gatekeep
    v-if="!user"
    title="You must be logged in to join lounges."
    action-label="Login"
    :action="async () => (await navigateTo('/'), await navigateTo('/login'))"
  />
  <Gatekeep v-else-if="!user.emailVerified" title="Please verify your email to join lounges." />
  <Gatekeep
    v-else-if="state === 'connecting'"
    title="Connecting to websocket..."
    :show-action="false"
  />
  <Gatekeep
    v-else-if="state === 'disconnected'"
    title="Not connected to websocket!"
    action-label="Connect"
    :action="() => socket.connect()"
  />

  <div class="flex size-full flex-1 flex-col" :class="[source === 'drawer' && 'mx-auto max-w-sm']">
    <AnimatePresence mode="popLayout">
      <Motion
        as="div"
        class="flex flex-1 flex-col"
        :initial="{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }"
        :animate="{ opacity: 1, scale: 1, filter: 'blur(0px)', transition: contentTransition.in() }"
        :exit="{
          opacity: 0,
          scale: 0.95,
          filter: 'blur(4px)',
          transition: contentTransition.out(),
        }"
      >
        <!-- Close button -->
        <PopoverClose v-if="source === 'popover'" as-child>
          <Button variant="ghost" size="icon" class="absolute top-1.5 right-1.5">
            <X />
          </Button>
        </PopoverClose>
        <!-- Heading -->
        <DrawerHeader v-if="source === 'drawer'">
          <DrawerTitle class="text-2xl">Lounge</DrawerTitle>
          <DrawerDescription>Invite your friends to hangout.</DrawerDescription>
        </DrawerHeader>
        <PopoverHeader v-if="source === 'popover'" class="p-4 pb-2">
          <PopoverTitle class="text-2xl">Lounge</PopoverTitle>
          <PopoverDescription>Invite your friends to hangout.</PopoverDescription>
        </PopoverHeader>

        <div class="flex flex-1 flex-col gap-4 p-4">
          <template v-if="id">
            <div class="flex gap-2">
              <InputGroup>
                <InputGroupInput v-model="censoredId" readonly class="text-foreground" />
                <InputGroupAddon align="inline-end">
                  <Tooltip :open="copied">
                    <TooltipTrigger as-child>
                      <InputGroupButton
                        size="icon-xs"
                        @click="id && copy(id)"
                        :disabled="copied"
                        aria-label="Copy lounge code"
                      >
                        <component :is="copied ? Check : Copy" />
                      </InputGroupButton>
                    </TooltipTrigger>
                    <TooltipContent>Copied!</TooltipContent>
                  </Tooltip>
                </InputGroupAddon>
              </InputGroup>

              <Button variant="ghost-destructive" @click="leave">Leave</Button>
            </div>
            <Separator />

            <div class="relative flex-1">
              <div class="absolute inset-0">
                <ScrollArea class="size-full">
                  <LoungePeers />
                </ScrollArea>
              </div>
            </div>
          </template>

          <template v-else>
            <Empty>
              <EmptyHeader>
                <EmptyTitle>It's quiet in here</EmptyTitle>
                <EmptyDescription>Create a lobby or join one.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <LoadingButton variant="outline" :action="createLounge">
                  Create Lounge
                </LoadingButton>
              </EmptyContent>
            </Empty>

            <ButtonGroup class="w-full">
              <Input v-model="loungeId" placeholder="Enter Lounge ID..." />
              <LoadingButton
                @click="join(loungeId)"
                :loading="connection === 'connecting'"
                force-slot
                :disabled="loungeId.length === 0"
              >
                Join Lounge
              </LoadingButton>
            </ButtonGroup>
          </template>
        </div>
      </Motion>
    </AnimatePresence>
  </div>
</template>
