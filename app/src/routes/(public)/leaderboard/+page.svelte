<script lang="ts">
	import { getColorsFromImage } from '$lib/common/utils.js';
	import { Avatar } from '@skeletonlabs/skeleton';
  export let data

  function getTextColor(element: HTMLDivElement, imageURL: string) {
    getColorsFromImage(imageURL, 10, 4).then((color) => {
      if (!color) {
        element.style.color = "#000"
        element.style.textShadow = `0 0 5px #fff`
        return
      }
      element.style.color = color[1]
      element.style.textShadow = `0 0 5px ${color[3]}`
      return
    });
  }
</script>

{#await data.lazy.topChangers}
<h1>
  Loading...
</h1>
{:then topChangers}
<div class="flex flex-col items-center gap-4 mt-4 h-[calc(100vh-2rem)] overflow-y-auto">
  <h1>
    LEADERBOARD
  </h1>
  {#each topChangers as topChanger}
    <a class={`card p-4 w-full bg-no-repeat bg-cover card-hover`} style={`background-image: url('${topChanger.banner}');`} target="_blank" href={`https://guilded.gg/profile/${topChanger.id}`}>
      <div class="card-body">
        <div class="flex flex-row justify-between">
          <div class="flex gap-4 items-center" use:getTextColor={topChanger.banner}>
            <Avatar src={topChanger.avatar} width="w-16" rounded="rounded-none" />
            <h2 class="text-center">{topChanger.username}</h2>
          </div>
          <div class="flex flex-col items-center" use:getTextColor={topChanger.banner}>
            <h3 class="text-center">Points</h3>
            <h3 class="text-center">{topChanger.totalPixelsChanged}</h3>
          </div>
        </div>
      </div>
    </a>
  {/each}
</div>
{:catch}
<p class="text-error-500">An error ocurred while getting top placers...</p>
{/await}