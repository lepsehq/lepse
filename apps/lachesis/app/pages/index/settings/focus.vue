<script setup lang="ts">
const groups = defineGroups({
  timer: [
    {
      key: 'customizeTimerDurations',
      title: 'Change timer durations',
      description: 'Set your preferred duration for timer.',
    },
    {
      key: 'enableTimerAutoskip',
      title: 'Autoskip timer',
      description: 'Skip to the next state (focus to break or vice versa) when the duration ends.',
    },
  ],
  notifications: [
    {
      key: 'enableTimerNotifications',
      title: 'Send notifications',
      description: 'Notifications are sent when a timer is completed.',
    },
    {
      key: 'enableTimerNotificationSounds',
      title: 'Notification sounds',
      description: 'A sound is played when a timer is completed.',
    },
  ],
})
</script>

<template>
  <SettingsPrimitive :groups>
    <template #default="{ setting }">
      <Switch v-if="setting.key === 'customizeTimerDurations'" />
      <Switch v-if="setting.key === 'enableTimerAutoskip'" />
      <Switch v-if="setting.key === 'enableTimerNotifications'" />
      <Switch v-if="setting.key === 'enableTimerNotificationSounds'" />
    </template>

    <template #content="{ setting }">
      <!-- TODO: take disabled only when the value is ON -->
      <fieldset
        v-if="setting.key === 'customizeTimerDurations'"
        class="flex justify-start"
        disabled
      >
        <InputGroup class="mr-2 h-8 w-fit rounded-md">
          <Tooltip
            v-for="(input, i) in [
              // TODO: Use actual defaults from settings
              { label: 'Focus', default: 25 },
              { label: 'Break', default: 5 },
              { label: 'Long break', default: 15 },
            ]"
            :key="i"
          >
            <TooltipTrigger as-child>
              <InputGroupInput
                :placeholder="input.default"
                class="border-border! h-full w-[calc(--spacing(4)+2ch)] border-r-2 px-2 py-1 text-center text-xs tabular-nums last:border-none"
                maxlength="2"
                inputmode="numeric"
              />
            </TooltipTrigger>
            <TooltipContent>{{ input.label }}</TooltipContent>
          </Tooltip>
        </InputGroup>
      </fieldset>
    </template>
  </SettingsPrimitive>
</template>
