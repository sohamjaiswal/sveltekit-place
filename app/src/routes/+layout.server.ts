export const load = async ({ locals }) => {
	const localUser = locals.localUser
  const remoteUser = locals.remoteUser
  return {
    localUser, remoteUser
  }
}