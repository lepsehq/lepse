import { isTauri } from '@tauri-apps/api/core'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification'
import { useWebNotification, useWindowFocus } from '@vueuse/core'

export const useNotification = ({
  requestOnMount = true,
  ignoreWhenFocused = false,
  disabled = false,
}: {
  requestOnMount?: boolean
  ignoreWhenFocused?: boolean
  disabled?: boolean | (() => boolean)
} = {}) => {
  const focused = useWindowFocus() // using here instead of in sendWrapper function since its an SPA

  const sendWrapper = <T extends unknown[]>(fn: (...args: T) => unknown) => {
    return async (...args: T) => {
      const isAppFocused = isTauri() ? await getCurrentWebviewWindow().isFocused() : focused.value

      const isDisabled = typeof disabled === 'boolean' ? disabled : disabled()
      if ((ignoreWhenFocused && isAppFocused) || isDisabled === true) return
      fn(...args)
    }
  }

  if (isTauri()) {
    const reqPermission = () => {
      isPermissionGranted().then((granted) => {
        if (!granted) requestPermission()
      })
    }

    if (requestOnMount) requestPermission()

    return {
      send: sendWrapper(sendNotification),
      requestPermission: reqPermission,
    }
  } else {
    const { show, ensurePermissions } = useWebNotification({ requestPermissions: requestOnMount })

    return {
      send: sendWrapper(show),
      requestPermission: () => {
        ensurePermissions()
      },
    }
  }
}
