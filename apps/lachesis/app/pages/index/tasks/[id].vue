<script setup lang="ts">
import { formatDate } from '@vueuse/core'
import {
  ChevronDown,
  ChevronLeft,
  Clock,
  ClockAlert,
  ClockFading,
  Lightbulb,
  LoaderCircle,
  MoreHorizontal,
  Plus,
  Trash,
  X,
} from '@lucide/vue'
import { formatDuration } from '~/lib/time'

definePageMeta({
  validate: (route) => !isNaN(Number(route.params.id)),
})

const route = useRoute()
const { id } = route.params
const source = inject(bubbleNavSourceKey)

const {
  tasks,
  focusedTaskId,
  updateTaskMutation,
  attachGoalMutation,
  detachGoalMutation,
  destroyTaskMutation,
} = useTasks()
const nameEl = useTemplateRef('nameEl')
const descriptionEl = useTemplateRef('descriptionEl')
const task = computed(() => {
  const t = tasks.value?.find((t) => t.id === Number(id))
  if (t) {
    nameEl.value && (nameEl.value.textContent = t.name)
    descriptionEl.value && (descriptionEl.value.innerText = t.description ?? '')
  }
  return t
})

const clearEmptyInput = (event: InputEvent) => {
  const target = event.currentTarget as HTMLElement
  if (!target) return
  if (!target.textContent) target.textContent = null
}

const save = async () => {
  if (!task.value || !nameEl.value || !descriptionEl.value) return
  const name = nameEl.value.textContent
  const description = descriptionEl.value.innerText

  // if values are not dirty, there's nothing to change
  const nameDirty = name !== task.value.name
  const descriptionDirty = description !== task.value.description
  if (!nameDirty && !descriptionDirty) return

  updateTaskMutation.mutate(
    { params: { id: Number(id) }, body: { name, description } },
    { onError: (err) => toast.error('Failed to save task.', { description: err.message }) }
  )
}

const now = new Date()
const date = computed(() => new Date(task.value?.createdAt ?? 0))
const formattedDate = computed(() =>
  formatDate(
    date.value,
    now.getFullYear() - date.value.getFullYear() > 0 ? 'MMM D, YYYYY' : 'MMM D'
  )
)

const { goals, createGoalMutation } = useGoals()
const taskGoals = computed(() =>
  goals.value?.filter((goal) => task.value?.goalIds?.includes(goal.id))
)

const linkGoal = (goalId: number, unlink?: boolean) => {
  if (task.value) {
    ;(unlink ? detachGoalMutation : attachGoalMutation).mutate(
      {
        params: { taskId: task.value.id, goalId },
      },
      {
        onError: (err) => toast.error('Failed to link goal.', { description: err.message }),
        onSuccess: () => toast.success(unlink ? 'Goal unlinked.' : 'Goal linked.'),
      }
    )
  }
}

const createNewGoal = async (search: string) =>
  createGoalMutation
    .mutateAsync(
      { body: { name: search } },
      {
        onError: (err) => toast.error('Failed to create goal!', { description: err.message }),
      }
    )
    .catch(() => {})

const deleteTask = () => {
  dialog({
    title: 'Are you sure?',
    description: "This task will forever be lost. (linked goals won't be affected)",
    action: 'Delete',
  }).then((v) => {
    if (v) {
      destroyTaskMutation
        // Mutate async because then/catch is needed so the toast runs after navigateBack unmounts
        .mutateAsync({ params: { id: Number(id) } })
        .then(() => toast.success('Task deleted successfully.'))
        .catch((err) => toast.error('Failed to delete task.', { description: err.message }))

      navigateBack()
    }
  })
}

const resetTaskTime = () => {
  dialog({
    title: 'Are you sure?',
    description: 'The time spent on this task will be reset to ZERO.',
    action: 'Reset',
  }).then(
    (v) =>
      v &&
      updateTaskMutation.mutate(
        { params: { id: Number(id) }, body: { stopwatchMs: 0, pomoCount: 0 } },
        {
          onError: (err) => toast.error('Failed to reset time.', { description: err.message }),
          onSuccess: () => {
            toast.success('Time reset successfully.')
          },
        }
      )
  )
}

const enterFocus = inject(enterFocusKey)
const focusTask = () => {
  navigateTo('/')
  focusedTaskId.value = Number(task.value?.id)
  enterFocus?.()
}
</script>

<template>
  <div class="flex items-center justify-between gap-4 p-2 pl-0">
    <Button
      variant="link"
      size="sm"
      class="w-fit opacity-60"
      :class="[source === 'drawer' && 'mb-0']"
      @click="navigateBack()"
    >
      <ChevronLeft />
      Go back
    </Button>

    <div class="flex items-center gap-2">
      <!-- FOCUS -->
      <Button size="xs" class="font-mono text-[10px] tracking-widest uppercase" @click="focusTask">
        <Lightbulb />
        Focus
      </Button>
      <!-- More options -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="min-w-40" align="end">
          <DropdownMenuItem variant="destructive" @select="deleteTask">
            <Trash />
            Delete
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" @select="resetTaskTime">
            <ClockAlert />
            Reset time
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>

  <div
    v-if="task"
    class="flex flex-1 flex-col gap-4 p-4"
    :class="[source === 'drawer' ? 'pt-1' : 'pt-0']"
  >
    <!-- Header -->
    <div class="flex flex-col gap-1">
      <p
        ref="nameEl"
        data-placeholder="required"
        class="before:text-destructive/50 no-scrollbar overflow-x-auto text-2xl font-medium whitespace-nowrap outline-none before:pointer-events-none before:text-xl before:font-light before:italic empty:before:content-[attr(data-placeholder)]"
        @keydown.enter.prevent
        @input="clearEmptyInput"
        @blur="save"
        contenteditable
      ></p>

      <!-- Goal linking -->
      <div class="mb-1 flex flex-wrap items-center gap-x-1 gap-y-0.5">
        <p class="text-xs font-light opacity-80">Linked Goals:</p>
        <Badge v-for="goal in taskGoals" :key="goal.id" variant="secondary" as-child>
          <NuxtLink :to="`/goals/${goal.id}`">
            <Link />
            <span :class="{ 'line-through': goal.status === 'completed' }">
              {{ goal.name }}
            </span>
            <Button
              variant="ghost-destructive"
              size="icon-xs"
              class="-mr-1.5 size-4"
              @click.stop.prevent="linkGoal(goal.id, true)"
            >
              <X class="size-3" />
            </Button>
          </NuxtLink>
        </Badge>
        <ComboboxCreate
          :items="goals?.filter((g) => !taskGoals?.includes(g))"
          @select="
            (item) => {
              linkGoal(item.id)
            }
          "
          :create="createNewGoal"
          empty="No goals found."
          placeholder="Search a goal"
          prevent-select
        >
          <Button variant="ghost" size="icon-xs">
            <Plus />
          </Button>
        </ComboboxCreate>
      </div>
      <!-- Time spent on task -->
      <div class="flex items-center gap-2">
        <div
          v-for="item in [
            { icon: ClockFading, label: `${task.pomoCount} pomos` },
            {
              icon: Clock,
              label: `${formatDuration(task.stopwatchMs, {
                format: task.stopwatchMs >= 3_600_000 /* an hour */ ? 'hhh mmm' : 'mmm',
                pad: false,
              })}`,
            },
          ]"
          class="flex items-center gap-1 sm:gap-1.5"
        >
          <component :is="item.icon" class="size-3 opacity-60" />
          <p class="text-[10px] leading-none font-extralight tracking-wide opacity-60">
            {{ item.label }}
          </p>
        </div>
      </div>
    </div>
    <!-- Description | relative/absolute wrapper to force contenteditable p tag into a fixed space (otherwise grows parent) -->
    <div class="relative flex-1">
      <div class="absolute inset-0">
        <ScrollArea class="size-full">
          <p
            ref="descriptionEl"
            data-placeholder="No description provided."
            class="before:text-muted-foreground text-base font-light outline-none before:pointer-events-none before:italic empty:before:content-[attr(data-placeholder)]"
            @input="clearEmptyInput"
            @blur="save"
            contenteditable
          ></p>
        </ScrollArea>
      </div>
    </div>

    <Separator class="opacity-50" />
    <div class="flex items-end justify-between gap-4">
      <div class="flex flex-col gap-1.5">
        <!-- STATUS -->
        <div class="flex items-center gap-2">
          <p class="font-mono text-[10px] font-medium tracking-widest uppercase opacity-80">
            Status:
          </p>
          <TaskStatusDropdown :id="task.id" :status="task.status" align="end" side="right">
            <Button variant="outline" size="xs">
              <TaskStatusIcon :status="task.status" />
              {{ task.status }}
              <ChevronDown />
            </Button>
          </TaskStatusDropdown>
        </div>
        <!-- PRIORITY -->
        <div class="flex items-center gap-2">
          <p class="font-mono text-[10px] font-medium tracking-widest uppercase opacity-80">
            Priority:
          </p>
          <TaskPriorityDropdown :id="task.id" :priority="task.priority" align="end" side="right">
            <Button variant="outline" size="xs">
              <TaskPriorityIcon :priority="task.priority" />
              {{ task.priority }}
              <ChevronDown />
            </Button>
          </TaskPriorityDropdown>
        </div>
        <!-- CREATED AT -->
        <p class="text-muted-foreground mt-1 text-xs">Created at {{ formattedDate }}</p>
      </div>
      <LoaderCircle
        v-if="updateTaskMutation.isPending.value"
        class="text-muted-foreground animate-spin"
      />
    </div>
  </div>
</template>
