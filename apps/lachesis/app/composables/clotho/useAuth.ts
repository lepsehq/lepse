import { hashKey, Query, useMutation, useQuery } from '@tanstack/vue-query'

export const useAuth = () => {
  const { $api, $queryClient } = useNuxtApp()

  const userQuery = useQuery(
    $api.account.profile.show.queryOptions(undefined, {
      // refetch when window is focused if the email is not verified
      refetchOnWindowFocus: (q) => (q.state.data ? !q.state.data?.data.emailVerified : false),
      enabled: false, // user query must be only loaded on hard .refetch
    })
  )
  const user = computed(() => userQuery.data.value?.data)

  const loginMutation = useMutation(
    $api.auth.accessToken.store.mutationOptions({
      onSuccess: ({ data }) => {
        useSocket().socket.connect()
        $queryClient.setQueryData($api.account.profile.show.queryKey(), { data: data.user })
      },
    })
  )

  const signupMutation = useMutation(
    $api.auth.newAccount.store.mutationOptions({
      onSuccess: ({ data }) => {
        useSocket().socket.connect()
        $queryClient.setQueryData($api.account.profile.show.queryKey(), { data: data.user })
      },
    })
  )

  const logoutMutation = useMutation(
    $api.auth.accessToken.destroy.mutationOptions({
      // logout should never fail, and should fallback to be able to be done offline
      onSettled: () => {
        useSocket().socket.disconnect()

        const safeQueries = (query: Query) => {
          return [''].includes(hashKey(query.queryKey))
        }
        // Reset queries to remove all data
        $queryClient.resetQueries({ predicate: (q) => !safeQueries(q) })
      },
    })
  )

  const requestEmailVerificationMutation = useMutation($api.verify.email.request.mutationOptions())
  const requestPasswordResetMutation = useMutation($api.reset.password.request.mutationOptions())

  const queryKey = $api.account.profile.show.queryKey()
  const updateProfileMutation = useMutation(
    $api.account.profile.update.mutationOptions({
      onMutate: async ({ body }) => {
        await $queryClient.cancelQueries({ queryKey })
        const old = $queryClient.getQueryData(queryKey)

        $queryClient.setQueryData(
          queryKey,
          (old) =>
            old && {
              data: {
                ...old.data,
                name: body?.name ?? old.data.name,
                /* avatarUrl cannot be updated, since the url comes computed from the server (obviously) */
              },
            }
        )

        return { old }
      },
      onError: (_err, _req, onMutateResult) => {
        $queryClient.setQueryData(queryKey, onMutateResult?.old)
      },
      onSuccess: ({ data }) => {
        // If this is the only mutation (to have LAST entry take precedense)
        if (
          $queryClient.isMutating({ mutationKey: $api.account.profile.update.mutationKey() }) === 1
        )
          $queryClient.setQueryData(queryKey, { data: data.user })
      },
    })
  )

  return {
    userQuery,
    user,
    loginMutation,
    signupMutation,
    logoutMutation,
    requestEmailVerificationMutation,
    requestPasswordResetMutation,
    updateProfileMutation,
  }
}
