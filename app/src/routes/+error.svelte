<script>

	import { page } from "$app/stores";

</script>

<h1 class="text-error-500 h-screen w-screen flex justify-center items-center">
  {#if $page.error}
  {$page.error.message}
  {:else}
  An error occurred
  {/if}
</h1>