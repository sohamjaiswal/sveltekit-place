<script lang="ts">
	import '../app.postcss';
	import 'iconify-icon';
	import { getDrawerStore, initializeStores, Drawer, Avatar, LightSwitch, type DrawerSettings } from '@skeletonlabs/skeleton';

	// Floating UI for Popups
	import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
	import { storePopup } from '@skeletonlabs/skeleton';
	import LoginWithGuilded from '$lib/client/components/LoginWithGuilded.svelte';
	import { page } from '$app/stores';
	storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
	initializeStores()
	
	const drawerStore = getDrawerStore();

	const drawerSettings: DrawerSettings = {
		width: 'w-[280px] md:w-[480px]',
		padding: 'p-4',
		rounded: 'rounded-none',
	}
</script>

<Drawer position="right">
	<div class="flex flex-col gap-4 mt-4 items-center w-full">
		<a href="/">
			<h2>
				Guilded Place
			</h2>
		</a>
		{#if $page.data.localUser}
		<a href="profile" on:click={() => drawerStore.close()} >
		<div class="flex flex-col items-center w-full">
				<Avatar src={$page.data.localUser.avatar} width="w-16" rounded="rounded-none" />
				{$page.data.localUser.username}
			</div>
		</a>
		<hr class="w-2/3" />
		{/if}
		{#if $page.data.localUser}
		<a href="settings" on:click={() => drawerStore.close()}>
			Settings
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

<div class="root-container relative h-screen w-screen">
	<button on:click={() => drawerStore.open(drawerSettings)} class="fixed z-10 m-2">
		<iconify-icon icon="fa-solid:bars" />
	</button>
	<slot />
</div>
