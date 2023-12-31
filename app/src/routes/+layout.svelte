<script lang="ts">
	import '../app.postcss';
	import 'iconify-icon';
	import { getDrawerStore, initializeStores, Drawer, Avatar, LightSwitch, type DrawerSettings, Toast } from '@skeletonlabs/skeleton';

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

<Toast />

<Drawer position="right">
	<div class="flex flex-col h-full p-4 justify-between">
		<div class="flex flex-col gap-4 mt-4 items-center w-full">
			<a href="/">
				<h2>
					GPlace
				</h2>
			</a>
			{#if $page.data.localUser}
			<a href="profile" on:click={() => drawerStore.close()} >
			<div class="flex flex-col items-center w-full">
					<Avatar src={$page.data.localUser.avatar} width="w-16" rounded="rounded-none" />
					<div class="flex gap-2 items-center mt-2">
						{$page.data.localUser.username}
						{#if $page.data.localUser.role == "ADMIN"}
						·
						<span class="badge variant-filled-tertiary">ADMIN</span>
						{/if}
					</div>
				</div>
			</a>
			{/if}
			<hr class="w-2/3" />
			<a href="/tips" target="_blank" rel="noopener noreferrer">Tips</a>
			<a href="/leaderboard" target="_blank" rel="noopener noreferrer">Leaderboard</a>
			{#if $page.data.localUser}
			<a href="settings" on:click={() => drawerStore.close()}>
				Settings
			</a>
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
		<footer class="flex flex-col gap-4 mt- items-center w-full">
			<hr class="w-2/3" />
			<p>
				Join our
				<a href="https://www.guilded.gg/i/EzrJGDdE" target="_blank">
					Guilded Server!
				</a>
			</p>
		</footer>
	</div>
</Drawer>

<svelte:head>
  <title>
    GPlace!
  </title>
  <meta property="og:title" content="GPlace" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://gplace.ink" />
  <meta property="og:image" content="https://gplace.ink/favicon.png" />
  <meta property="og:description" content="Create pixel art together!" />
	<meta name="keywords" content="Guilded, GPlace, r/place, Pixel Art">
  <meta name="author" content="Ham aka TooMuchHam, SoSweetHam">
</svelte:head>

<div class="root-container relative h-screen w-screen">
	<button on:click={() => drawerStore.open(drawerSettings)} class="btn variant-filled-primary fixed bottom-3 right-3 z-20">
		<iconify-icon icon="fa-solid:bars" />
	</button>
	<slot />
</div>
