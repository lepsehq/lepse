<script setup lang="ts">
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  ClockFading,
  LoaderCircle,
  MoreHorizontal,
  Plus,
  Trash,
  Unlink,
} from '@lucide/vue'
import { formatDuration } from '~/lib/time'

definePageMeta({
  validate: (route) => !isNaN(Number(route.params.id)),
})

const route = useRoute()
const { id } = route.params

const { goals, updateGoalMutation, destroyGoalMutation } = useGoals()
const nameEl = useTemplateRef('nameEl')
const descriptionEl = useTemplateRef('descriptionEl')
const goal = computed(() => {
  const g = goals.value?.find((g) => g.id === Number(id))
  if (g) {
    nameEl.value && (nameEl.value.textContent = g.name)
    descriptionEl.value && (descriptionEl.value.innerText = g.description ?? '')
  }
  return g
})

const clearEmptyInput = (event: InputEvent) => {
  const target = event.currentTarget as HTMLElement
  if (!target) return
  if (!target.textContent) target.textContent = null
}

const save = () => {
  if (!goal.value || !nameEl.value || !descriptionEl.value) return
  const name = nameEl.value.textContent
  const description = descriptionEl.value.innerText

  // if values are not dirty, there's nothing to change
  const nameDirty = name !== goal.value.name
  const descriptionDirty = description !== goal.value.description
  if (!nameDirty && !descriptionDirty) return

  updateGoalMutation.mutate(
    { params: { id: Number(id) }, body: { name, description } },
    { onError: (err) => toast.error('Failed to save goal.', { description: err.message }) }
  )
}

const { tasks, attachGoalMutation, detachGoalMutation, createTaskMutation } = useTasks()
const goalTasks = computed(() =>
  tasks.value?.filter((task) => task.goalIds.includes(goal.value?.id ?? -1))
)
const goalTasksDone = computed(() => goalTasks.value?.filter((t) => t.status === 'done').length)

const linkTask = (taskId: number, unlink?: boolean) => {
  if (goal.value) {
    ;(unlink ? detachGoalMutation : attachGoalMutation).mutate(
      {
        params: { taskId, goalId: goal.value.id },
      },
      {
        onError: (err) => toast.error('Failed to link task.', { description: err.message }),
        onSuccess: () => toast.success(unlink ? 'Task unlinked.' : 'Task linked.'),
      }
    )
  }
}

const createNewTask = (search: string) =>
  createTaskMutation
    .mutateAsync(
      { body: { name: search } },
      {
        onError: (err) => toast.error('Failed to create task!', { description: err.message }),
      }
    )
    .catch(() => {})

const deleteGoal = () => {
  dialog({
    title: 'Are you sure?',
    description: "This goal will forever be lost. (linked tasks won't be affected)",
    action: 'Delete',
  }).then((v) => {
    if (v) {
      destroyGoalMutation
        // Mutate async because then/catch is needed so the toast runs after navigateBack unmounts
        .mutateAsync({ params: { id: Number(id) } })
        .then(() => toast.success('Goal deleted successfully.'))
        .catch((err) => toast.error('Failed to delete goal.', { description: err.message }))

      navigateBack()
    }
  })
}
</script>

<template>
  <div class="flex items-center justify-between p-2 pl-0">
    <Button variant="link" size="sm" class="w-fit opacity-60" @click="navigateBack()">
      <ChevronLeft />
      Go back
    </Button>

    <div class="flex items-center gap-2">
      <!-- STATUS -->
      <div v-if="goal" class="flex items-center gap-2">
        <p class="font-mono text-[10px] font-medium tracking-widest uppercase opacity-80">
          Status:
        </p>
        <GoalStatusDropdown :id="goal.id" :status="goal.status" align="end" />
      </div>
      <!-- More options -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="min-w-40" align="end">
          <DropdownMenuItem variant="destructive" @select="deleteGoal">
            <Trash />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>

  <Separator />

  <div class="relative flex-1">
    <div class="absolute inset-0">
      <ScrollArea class="size-full">
        <div v-if="goal" class="flex flex-col gap-4 p-4">
          <!-- Header -->
          <div class="flex flex-col gap-3">
            <p
              ref="nameEl"
              data-placeholder="required"
              class="before:text-destructive/50 no-scrollbar overflow-x-auto text-2xl font-medium whitespace-nowrap outline-none before:pointer-events-none before:text-xl before:font-light before:italic empty:before:content-[attr(data-placeholder)]"
              @keydown.enter.prevent
              @input="clearEmptyInput"
              @blur="save"
              contenteditable
            ></p>
            <!-- Description -->
            <p
              ref="descriptionEl"
              data-placeholder="No description provided."
              class="before:text-muted-foreground text-base font-light outline-none before:pointer-events-none before:italic empty:before:content-[attr(data-placeholder)]"
              @input="clearEmptyInput"
              @blur="save"
              contenteditable
            ></p>
          </div>

          <Separator class="mt-2 opacity-50" />

          <!-- Tasks -->
          <Collapsible default-open v-slot="{ open }">
            <div class="flex items-center justify-between gap-4 pr-3">
              <div class="flex items-center gap-4">
                <CollapsibleTrigger as-child>
                  <Button variant="ghost" size="xs">
                    <ChevronRight class="transition-transform" :class="[open && 'rotate-90']" />
                    Tasks
                  </Button>
                </CollapsibleTrigger>
                <div class="flex items-center gap-1.5 pr-6">
                  <CircularProgress
                    :value="Math.max(4, ((goalTasksDone ?? 0) / (goalTasks?.length ?? 0)) * 100)"
                    :size="12"
                    :thickness="1.5"
                  />
                  <span class="text-muted-foreground text-xs">
                    {{ goalTasksDone ?? 0 }}/{{ goalTasks?.length ?? 0 }}
                  </span>
                </div>
              </div>

              <ComboboxCreate
                :items="tasks?.filter((task) => !task.goalIds.includes(goal?.id ?? -1))"
                @select="(t) => linkTask(t.id)"
                :create="createNewTask"
                empty="No tasks found."
                placeholder="Search a task"
                align="end"
                prevent-select
              >
                <Button variant="secondary" size="icon-xs">
                  <Plus />
                </Button>
              </ComboboxCreate>
            </div>
            <CollapsibleContent>
              <div class="flex flex-col pt-2">
                <ContextMenu v-for="task in goalTasks" :key="task.id">
                  <ContextMenuTrigger>
                    <Item size="sm" as-child>
                      <NuxtLink :to="`/tasks/${task.id}`">
                        <!-- Task status  -->
                        <ItemMedia class="-my-3 -mr-1.5">
                          <TaskStatusDropdown :id="task.id" :status="task.status" />
                        </ItemMedia>
                        <ItemContent>
                          <Tooltip>
                            <TooltipTrigger as-child>
                              <ItemTitle :class="{ 'line-through': task.status === 'done' }">
                                {{ task.name }}
                              </ItemTitle>
                            </TooltipTrigger>
                            <TooltipContent :class="{ 'line-through': task.status === 'done' }">
                              <p>{{ task.name }}</p>
                            </TooltipContent>
                          </Tooltip>
                        </ItemContent>
                        <ItemActions>
                          <div
                            class="text-muted-foreground flex gap-3 text-xs leading-none whitespace-nowrap"
                          >
                            <div class="flex items-center gap-1.5" title="time worked">
                              <Clock class="size-3" />
                              <p>
                                {{
                                  formatDuration(task.stopwatchMs, {
                                    format: 'hhh mmm',
                                    pad: false,
                                  })
                                }}
                              </p>
                            </div>
                            <div class="flex items-center gap-1.5" title="pomos completed">
                              <ClockFading class="size-3" />
                              <p>{{ task.pomoCount }} pomos</p>
                            </div>
                          </div>
                          <ChevronRight class="size-4" />
                        </ItemActions>
                      </NuxtLink>
                    </Item>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem as-child>
                      <NuxtLink :to="`/tasks/${task.id}`">
                        <ArrowUpRight />
                        Open task
                      </NuxtLink>
                    </ContextMenuItem>
                    <ContextMenuItem @select="linkTask(task.id, true)">
                      <Unlink />
                      Unlink
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
    </div>
  </div>

  <LoaderCircle
    v-if="updateGoalMutation.isPending.value"
    class="text-muted-foreground absolute right-4 bottom-4 animate-spin"
  />
</template>
