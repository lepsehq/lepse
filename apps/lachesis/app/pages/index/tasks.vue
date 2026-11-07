<script setup lang="ts">
import { revalidateLogic, useForm } from '@tanstack/vue-form'
import { ChevronRight, Loader2, Plus, X } from '@lucide/vue'
import { PopoverClose } from 'reka-ui'
import z from 'zod'

const source = inject(bubbleNavSourceKey)

const route = useRoute()
const { user } = useAuth()
const { tasks, tasksQuery, createTaskMutation } = useTasks()

onMounted(() => {
  user.value && tasksQuery.refetch()
})

const inSubpage = computed(() => /tasks\/\d+/.test(route.path))

const [subpage, animateSubpage] = useAnimate()
const openSubpage = () => {
  animateSubpage(
    subpage.value,
    {
      opacity: [0, 1],
      x: ['2rem', 0],
      filter: ['blur(4px)', 'blur(0px)'],
    },
    contentTransition.in()
  )
}

const createOpen = ref(false)
const schema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(2500),
})

const {
  handleSubmit,
  Field: FormField,
  Subscribe: FormSubscribe,
} = useForm({
  validationLogic: revalidateLogic(),
  validators: {
    onDynamic: schema,
    onSubmitAsync: async ({ value }) => {
      let validationError = null

      await createTaskMutation
        .mutateAsync(
          { body: { name: value.name, description: value.description } },
          {
            onError: (err) => {
              if (err.isValidationError()) {
                const errors = mapErrors(err.response.errors)
                validationError = {
                  fields: {
                    name: errors.name?.message,
                    description: errors.description?.message,
                  },
                }
              } else {
                toast.error('Something went wrong!', { description: err.message })
              }
            },
          }
        )
        .catch(() => {})

      return validationError
    },
  },
  defaultValues: { name: '', description: '' },
  onSubmit: () => {
    toast.success('Task created!')
    createOpen.value = false
  },
})
</script>

<template>
  <Gatekeep
    v-if="!user"
    title="You must be logged in to create tasks."
    action-label="Login"
    :action="async () => (await navigateTo('/'), await navigateTo('/login'))"
  />
  <Gatekeep v-else-if="!user.emailVerified" title="Please verify your email to create tasks." />

  <div class="flex size-full flex-1 flex-col" :class="[source === 'drawer' && 'mx-auto max-w-sm']">
    <AnimatePresence mode="popLayout">
      <Motion
        v-show="!inSubpage"
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
          <DrawerTitle class="text-2xl">Tasks</DrawerTitle>
          <DrawerDescription>Manage your focus and productivity.</DrawerDescription>
        </DrawerHeader>
        <PopoverHeader v-if="source === 'popover'" class="p-4 pb-2">
          <PopoverTitle class="text-2xl">Tasks</PopoverTitle>
          <PopoverDescription>Manage your focus and productivity.</PopoverDescription>
        </PopoverHeader>

        <div
          v-if="tasksQuery.isLoading.value"
          class="bg-background/40 pointer-events-none absolute z-50 h-full w-full rounded-2xl"
        >
          <Loader2 class="absolute bottom-4 left-4 size-8 animate-spin opacity-40" />
        </div>
        <Empty v-else-if="tasks?.length === 0" class="mb-12">
          <EmptyHeader>
            <EmptyTitle>No tasks yet.</EmptyTitle>
            <EmptyDescription>You have yet to create any tasks.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button @click="createOpen = true">Create Task</Button>
          </EmptyContent>
        </Empty>
        <!-- List | relative/absolute wrapper to force contenteditable p tag into a fixed space (otherwise grows parent) -->
        <div v-else class="relative flex-1">
          <div class="absolute inset-0">
            <ScrollArea class="size-full">
              <div class="flex flex-col gap-3 p-4">
                <Item
                  v-for="task in sortByOrder(tasks, 'status', [
                    'in_progress',
                    'todo',
                    'done',
                    'canceled',
                  ])"
                  :key="task.id"
                  variant="outline"
                  size="sm"
                  as-child
                >
                  <NuxtLink :to="`/tasks/${task.id}`" @click="openSubpage">
                    <!-- Task status  -->
                    <ItemMedia class="-my-3 -mr-1.5">
                      <TaskStatusDropdown :id="task.id" :status="task.status" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{{ task.name }}</ItemTitle>
                    </ItemContent>
                    <ItemActions>
                      <ChevronRight class="size-4" />
                    </ItemActions>
                  </NuxtLink>
                </Item>
              </div>
            </ScrollArea>
          </div>
        </div>

        <!-- Create -->
        <Dialog v-model:open="createOpen">
          <DialogTrigger v-if="(tasks?.length ?? 0) > 0" as-child>
            <Button size="icon-lg" class="absolute right-4 bottom-4">
              <Plus />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form class="contents" @submit.prevent="handleSubmit">
              <DialogHeader>
                <DialogTitle>New Task</DialogTitle>
                <DialogDescription>Remember to complete this task</DialogDescription>
              </DialogHeader>

              <FieldGroup>
                <!-- Name -->
                <FormField name="name" v-slot="{ field }">
                  <Field :data-invalid="!field.state.meta.isValid">
                    <FieldLabel :for="field.name">Name *</FieldLabel>
                    <Input
                      :id="field.name"
                      :name="field.name"
                      :model-value="field.state.value"
                      :aria-invalid="!field.state.meta.isValid"
                      placeholder="e.g. Do xyz"
                      @blur="field.handleBlur"
                      @input="field.handleChange($event.target.value)"
                    />
                    <FieldError
                      v-if="!field.state.meta.isValid"
                      :errors="field.state.meta.errors"
                    />
                  </Field>
                </FormField>

                <!-- Description -->
                <FormField name="description" v-slot="{ field }">
                  <Field :data-invalid="!field.state.meta.isValid">
                    <FieldLabel :for="field.name">Description</FieldLabel>
                    <Textarea
                      :id="field.name"
                      :name="field.name"
                      :model-value="field.state.value"
                      :aria-invalid="!field.state.meta.isValid"
                      rows="3"
                      class="resize-none"
                      placeholder="Add context..."
                      @blur="field.handleBlur"
                      @input="field.handleChange($event.target.value)"
                    />
                    <FieldError
                      v-if="!field.state.meta.isValid"
                      :errors="field.state.meta.errors"
                    />
                  </Field>
                </FormField>
              </FieldGroup>

              <DialogFooter>
                <DialogClose>
                  <Button variant="outline" type="button">Cancel</Button>
                </DialogClose>
                <FormSubscribe v-slot="{ canSubmit, isPristine, isSubmitting }">
                  <LoadingButton
                    type="submit"
                    :disabled="!canSubmit || isPristine"
                    :loading="isSubmitting"
                  >
                    Create Task
                  </LoadingButton>
                </FormSubscribe>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </Motion>

      <!-- item page -->
      <Motion
        v-show="inSubpage"
        as="div"
        ref="subpage"
        class="flex flex-1 flex-col"
        :initial="{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }"
        :animate="{ opacity: 1, scale: 1, filter: 'blur(0px)', transition: contentTransition.in() }"
      >
        <NuxtPage />
      </Motion>
    </AnimatePresence>
  </div>
</template>
