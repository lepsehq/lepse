<script setup lang="ts">
import { StorageSerializers, useDebounceFn, useIntervalFn, useLocalStorage } from '@vueuse/core'
import { ChevronsUpDown, FastForward, Pause, Play, RefreshCw, X } from '@lucide/vue'
import { formatDuration, Stopwatch } from '~/lib/time'
import { toBreakMessages, toLongBreakMessages, toFocusMessages } from '~/lib/pomoMessages'

const { popout } = defineProps<{ popout?: boolean }>()

const { send, requestPermission } = useNotification({
  requestOnMount: false,
  ignoreWhenFocused: true,
})
const { user } = useAuth()

const date = getClientDate()
const { focusSession } = useDay(date)

// ─── Lounge ─────────────────────────────────────────────────────────────────

const { sync, onUpdateSync } = useLoungeClient()

const updateLoungeSync = (starting?: boolean) => {
  sync(
    stopwatch.elapsed.value === 0 && !starting
      ? null
      : {
          elapsed: stopwatch.elapsed.value,
          running: stopwatch.running.value,
          duration: focusMethod.value === 'pomodoro' ? pomoStateDuration.value : undefined,
        }
  )
}

onUpdateSync(() => {
  console.log('lounge:clock-focus: heard resync request, resyncing...')
  updateLoungeSync()
}, popout)

// ─── Focus ──────────────────────────────────────────────────────────────────

const focusMethod = useLocalStorage<'stopwatch' | 'pomodoro'>('focus_method', 'stopwatch')
const focusMethodToggleable = ref(true)
const focusDirty = useLocalStorage('focus_dirty', false) // localstorage to expose to other contexts if there is unsaved changes
const toggleFocusMethod = () => {
  const r = () => (focusMethod.value = focusMethod.value === 'stopwatch' ? 'pomodoro' : 'stopwatch')
  if (focusDirty.value) {
    dialog({ title: 'Are you sure?', description: 'Switching will reset your timer.' }).then(
      (v) => v && r()
    )
  } else {
    r()
  }
}

// ─── Task ───────────────────────────────────────────────────────────────────

const { tasks, focusedTaskId, createTaskMutation } = useTasks()
const task = computed(() => tasks.value?.find((t) => t.id === focusedTaskId.value))

const selectTask = (id: number) => {
  // fn SHOULD change focusedTaskId
  const r = () => {
    focusedTaskId.value = id
  }
  if (focusDirty.value && focusedTaskId.value !== -1) {
    dialog({
      title: 'Are you sure?',
      description:
        id > -1
          ? focusMethod.value === 'pomodoro'
            ? 'New pomodoros completed will progress on the new task.'
            : 'Switching will carry over your progress to the new task.'
          : focusMethod.value === 'pomodoro'
            ? "New pomodoros completed won't be counted on this task."
            : 'Cancelling will result in some progress being lost.',
    }).then((v) => {
      if (v) {
        if (focusMethod.value === 'stopwatch' && task.value) {
          // remove from old task
          updateTask(task.value.id, {
            stopwatchMs: Math.round(task.value.stopwatchMs - stopwatchSyncedMs),
          })
          r() // update `task`
          // If user is not cancelling, add to new task
          if (id > -1) {
            updateTask(task.value.id, {
              stopwatchMs: Math.round(task.value.stopwatchMs + stopwatchSyncedMs),
            })
          } else {
            // If user cancels, reset stopwatch
            stopwatch.reset()
          }
          stopwatchSyncedMs = 0
        } else {
          r()
        }
      }
    })
  } else {
    r()
  }
}

const createNewTask = async (search: string) =>
  createTaskMutation.mutateAsync(
    { body: { name: search } },
    {
      onError: (err) => toast.error('Failed to create task!', { description: err.message }),
    }
  )

// ─── Shared stopwatch class ─────────────────────────────────────────────────

focusDirty.value = false // initially set to false
const stopwatch = new Stopwatch({
  onStart: () => {
    if (focusMethod.value === 'stopwatch') stopwatchSyncInterval.resume()
    focusDirty.value = true
    if (focusMethod.value === 'pomodoro') requestPermission()
    updateLoungeSync(true) // call fn to update states accordingly
  },
  onStop: () => {
    if (focusMethod.value === 'stopwatch') {
      syncStopwatch()
      stopwatchSyncInterval.pause()
      focusDirty.value = false // not dirty since progress synced
    }
    updateLoungeSync() // call fn to update states accordingly
  },
  onReset: () => {
    focusDirty.value = false
    updateLoungeSync() // call fn to update states accordingly
  },
})

const formatted = computed(() => {
  if (focusMethod.value === 'stopwatch') {
    return formatDuration(stopwatch.elapsed.value)
  } else if (focusMethod.value === 'pomodoro') {
    const pomoElapsed = pomoStateDuration.value - stopwatch.elapsed.value
    return formatDuration(pomoElapsed, { format: 'mm:ss' })
  } else {
    return ''
  }
})

// Update focusMethodToggleable when stopwatch running state changes
watch(
  stopwatch.running,
  () => {
    if (focusMethodToggleable) focusMethodToggleable.value = !stopwatch.running.value
  },
  { immediate: true }
)
// Reset stopwatch (the global stopwatch) when focusMethod changes
watch(focusMethod, () => {
  stopwatch.reset()
})

// ─── Stopwatch ──────────────────────────────────────────────────────────────

let stopwatchSyncedMs = 0
const syncStopwatch = useDebounceFn(() => {
  const elapsed = stopwatch.elapsed.value

  // Update focus session's stopwatchMs
  updateSession({
    stopwatchMs: Math.round((focusSession.value?.stopwatchMs ?? 0) + (elapsed - stopwatchSyncedMs)),
  })
  // Update selected task
  if (task.value)
    updateTask(task.value.id, {
      stopwatchMs: Math.round(task.value.stopwatchMs + (elapsed - stopwatchSyncedMs)),
    })

  stopwatchSyncedMs = elapsed
}, 5_000)

// Sync every 5 minutes if stopwatch is running
const stopwatchSyncInterval = useIntervalFn(syncStopwatch, 300_000, { immediate: false })

// ─── Pomo ───────────────────────────────────────────────────────────────────

const pomoStates = ['focus', 'break', 'long-break'] as const
const pomoState = ref<(typeof pomoStates)[number]>('focus')
const pomoStateDuration = computed(() =>
  pomoState.value === 'focus' ? POMO_TIME : pomoState.value === 'break' ? SHORT_BREAK : LONG_BREAK
)
const pomoCount = ref(0)

const POMO_TIME = 25 * 60 * 1000
const SHORT_BREAK = 5 * 60 * 1000
const LONG_BREAK = 15 * 60 * 1000

function skipPomo() {
  const r = () => {
    if (pomoState.value === 'focus') {
      pomoCount.value++
      pomoState.value = pomoCount.value % 4 === 0 ? 'long-break' : 'break'

      // If focused, increment focus session's pomoCount
      stopwatch.elapsed.value &&
        updateSession({
          pomoCount: (focusSession.value?.pomoCount ?? 0) + 1,
        })
      // Update selected task
      if (task.value)
        updateTask(task.value.id, {
          pomoCount: task.value.pomoCount + 1,
        })
      send({
        title: 'Focus session over!',
        body:
          pomoState.value === 'break'
            ? pickRandom(toBreakMessages)
            : pickRandom(toLongBreakMessages),
      })
    } else {
      pomoState.value = 'focus'
      setTimeout(() => {
        send({ title: 'Break time over!', body: pickRandom(toFocusMessages) })
      }, 2000)
    }
    stopwatch.reset()
  }

  if (stopwatch.elapsed.value > 0 && pomoState.value === 'focus') {
    dialog({
      title: 'Are you sure you want to skip?',
      description: 'Your time will still be counted in your session totals.',
    }).then((v) => v && r())
  } else {
    r()
  }
}
// Skip pomo when stopwatch reaches duration
watch(stopwatch.elapsed, () => {
  if (focusMethod.value === 'pomodoro' && stopwatch.elapsed.value >= pomoStateDuration.value)
    skipPomo()
})

// ─── Sync ───────────────────────────────────────────────────────────────────

const { updateSession, updateTask } = useFocusSyncClient(popout)

// `flush: sync` makes write sync so it works inside onBeforeUnmount
const focusHandoff = useLocalStorage<FocusHandoff>('focus_handoff', null, {
  flush: 'sync',
  serializer: StorageSerializers.object,
})

// set the elapsed amount before focus unmounts
onBeforeUnmount(() => {
  console.log('[clock-focus] unmounting. handing off...')
  focusHandoff.value = { elapsed: stopwatch.elapsed.value, running: stopwatch.running.value }
})

watch(
  focusHandoff,
  (v) => {
    if (v) {
      focusHandoff.value = null
      console.log('[clock-focus] found handoff. setting values...', v)
      stopwatch.elapsed.value = v.elapsed
      if (v.running && !stopwatch.running.value /* this runs twice sometimes */) stopwatch.start()
    }
  },
  { immediate: true }
)

// EXPOSE
defineExpose({ focusMethod, toggleFocusMethod, pomoState })
</script>

<template>
  <ClockWrapper :popout>
    <!-- Div wrapper to hold children together as one row -->
    <div class="flex flex-col items-center">
      <!-- task selector -->
      <div
        v-if="user?.emailVerified && !popout"
        class="from-background/40 to-background/20 absolute top-1/6 flex -translate-y-1/2 flex-col items-center gap-1 overflow-hidden rounded-md bg-linear-to-t py-2 backdrop-blur-sm"
      >
        <Button
          v-if="task"
          variant="ghost-destructive"
          size="icon-sm"
          class="absolute top-0 right-0 rounded-tl-none rounded-tr-none rounded-br-none border-0 not-hover:opacity-60"
          @click.stop="() => selectTask(-1)"
        >
          <X class="translate-x-1/5 -translate-y-1/5" />
        </Button>
        <p class="font-mono text-[10px] tracking-widest uppercase opacity-60">focusing on</p>
        <ComboboxCreate
          :items="tasks"
          @select="(i) => selectTask(i.id)"
          :create="createNewTask"
          :checked-item-id="task?.id"
          empty="No tasks found."
          placeholder="Search a task"
          align="center"
          class="max-w-64 sm:max-w-80"
          :side-offset="12"
        >
          <div
            class="flex max-w-xs min-w-48 cursor-pointer items-center justify-center sm:max-w-sm sm:min-w-64 md:max-w-md"
          >
            <p
              class="flex w-full items-center gap-3 px-6 text-center text-2xl transition-opacity hover:opacity-80"
              :class="[task ? 'font-light' : 'font-extralight italic opacity-60']"
            >
              <Tooltip>
                <TooltipTrigger
                  class="w-full truncate"
                  :class="{ 'line-through': task?.status === 'done' }"
                >
                  {{ task?.name ?? 'No task selected' }}
                </TooltipTrigger>
                <TooltipContent v-if="task" side="bottom">
                  <p class="max-w-xs">{{ task.name }}</p>
                </TooltipContent>
              </Tooltip>
              <ChevronsUpDown v-if="!task" class="size-4 opacity-60" />
            </p>
          </div>
        </ComboboxCreate>
      </div>

      <!-- Pomo-specific state tabs -->
      <div
        v-if="focusMethod === 'pomodoro' && !popout"
        class="bg-background/40 mb-2 flex gap-1 rounded-full p-1 backdrop-blur-sm [&>button]:backdrop-blur-none"
      >
        <Button
          v-for="state in pomoStates"
          :key="state"
          :variant="state === pomoState ? 'default' : 'ghost'"
          size="sm"
          class="px-3 font-mono text-[10px] font-light tracking-widest uppercase"
          :class="[pomoState === state ? 'font-medium opacity-100!' : 'opacity-60']"
          :disabled="stopwatch.running.value"
          @click="(stopwatch.reset(), (pomoState = state))"
        >
          {{ state }}
        </Button>
      </div>
    </div>

    <!-- Clock -->
    <ClockTime
      :value="
        focusMethod === 'stopwatch'
          ? stopwatch.elapsed.value >= 3600000
            ? formatted.slice(0, -7) // HH:MM
            : formatted.slice(3, -4) // MM:SS
          : formatted
      "
      :sub="
        focusMethod === 'stopwatch' && !popout
          ? stopwatch.elapsed.value >= 3600000
            ? formatted.slice(-6, -1) // ss.ms
            : formatted.slice(-3, -1) // ms
          : undefined
      "
      :popout
      disable-hint
    />

    <!-- Actions -->
    <div class="mt-2 grid w-fit grid-cols-3 place-items-center gap-2 justify-self-center">
      <Button
        variant="ghost"
        :size="popout ? 'icon-sm' : 'icon'"
        :disabled="stopwatch.elapsed.value === 0"
        @click="stopwatch.reset()"
      >
        <RefreshCw />
      </Button>
      <Button
        :size="popout ? 'icon-xl' : 'icon-2xl'"
        class="rounded-full *:fill-current"
        @click="stopwatch.toggle()"
      >
        <Pause v-if="stopwatch.running.value" />
        <Play v-else />
      </Button>
      <Button
        v-if="focusMethod === 'pomodoro'"
        variant="ghost"
        :size="popout ? 'icon-sm' : 'icon'"
        @click="skipPomo"
      >
        <FastForward />
      </Button>
    </div>
  </ClockWrapper>
</template>
