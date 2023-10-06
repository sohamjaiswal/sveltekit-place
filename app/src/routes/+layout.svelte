<script lang="ts">
	import '../app.postcss';
	import { AppShell, AppBar, getDrawerStore, initializeStores, Drawer, Avatar, LightSwitch } from '@skeletonlabs/skeleton';

	// Floating UI for Popups
	import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
	import { storePopup } from '@skeletonlabs/skeleton';
	import LoginWithGuilded from '$lib/client/components/LoginWithGuilded.svelte';
	import { page } from '$app/stores';
	storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
	initializeStores()
	
	const drawerStore = getDrawerStore();
</script>

<Drawer position="bottom">
	<div class="flex flex-col gap-4 mt-4 items-center w-full">
		<h2>
			Guilded Place
		</h2>
		{#if $page.data.localUser}
		<a href="profile" on:click={() => drawerStore.close()} >
		<div class="flex flex-col items-center w-full">
				<Avatar src={$page.data.localUser.avatar} width="w-16" rounded="rounded-full" />
				{$page.data.localUser.username}
			</div>
		</a>
		<hr class="w-2/3" />
		{/if}
		{#if $page.data.localUser}
		<a href="settings" on:click={() => drawerStore.close()}>
			Account Settings
		</a>
		<hr class="w-2/3" />
		<LightSwitch />
		<hr class="w-2/3" />
		<form action="/logout" method="POST">
			<button class="btn variant-ghost-error mb-4" type="submit">
				Logout
			</button>
		</form>
		{:else}
		<hr class="w-2/3" />
			<LoginWithGuilded />
		{/if}
	</div>
</Drawer>

<!-- App Shell -->
<AppShell>
	<svelte:fragment slot="header">
		<button on:click={() => drawerStore.open()}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-6 w-6"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 6h16M4 12h16m-7 6h7"
				/>
			</svg>
		</button>
	</svelte:fragment>
	<!-- Page Route Content -->
	<slot />
</AppShell>
