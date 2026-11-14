<script setup lang="ts">
const groups = defineGroups({
  timer: [
    {
      key: 'timerDurations',
      title: 'Customize timer durations',
      description: 'Set your preferred duration for timers.',
    },
    // TODO: impl
    // {
    //   key: 'enableTimerAutoskip',
    //   title: 'Autoskip timer',
    //   description: 'Skip to the next state (focus to break or vice versa) when the duration ends.',
    // },
  ],
  notifications: [
    {
      key: 'enableTimerNotifications',
      title: 'Send notifications',
      description: 'Notifications are sent when a timer is completed.',
    },
    // TODO: impl
    // {
    //   key: 'enableTimerNotificationSounds',
    //   title: 'Notification sounds',
    //   description: 'A sound is played when a timer is completed.',
    // },
  ],
})

const {
  controls: { timerDurations, enableTimerNotifications },
} = useSettings()
</script>

<template>
  <SettingsPrimitive :groups>
    <template #default="{ setting }">
      <Switch v-if="setting.key === 'timerDurations'" v-model="timerDurations.enabled" />
      <!-- <Switch v-if="setting.key === 'enableTimerAutoskip'" /> -->
      <Switch
        v-if="setting.key === 'enableTimerNotifications'"
        v-model="enableTimerNotifications"
      />
      <!-- <Switch v-if="setting.key === 'enableTimerNotificationSounds'" /> -->
    </template>

    <template #content="{ setting }">
      <fieldset
        v-if="setting.key === 'timerDurations'"
        class="flex justify-start"
        :disabled="!timerDurations.enabled"
      >
        <InputGroup class="mr-2 h-8 w-fit rounded-md">
          <Tooltip
            v-for="input in [
              { key: 'focus', label: 'Focus' },
              { key: 'break', label: 'Break' },
              { key: 'longBreak', label: 'Long break' },
            ] satisfies { key: keyof typeof timerDurations; label: string }[]"
            :key="input.key"
          >
            <TooltipTrigger as-child>
              <InputGroupInput
                class="border-border! h-full w-[calc(--spacing(4)+2ch)] border-r-2 px-2 py-1 text-center text-xs tabular-nums last:border-none"
                maxlength="2"
                inputmode="numeric"
                :placeholder="timerDurations[input.key]"
                @beforeinput="/\D/.test($event.data ?? '') && $event.preventDefault()"
                v-model.number="timerDurations[input.key]"
              />
            </TooltipTrigger>
            <TooltipContent>{{ input.label }}</TooltipContent>
          </Tooltip>
        </InputGroup>
      </fieldset>
    </template>
  </SettingsPrimitive>
</template>
