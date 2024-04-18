<script lang="ts">
	import { guildedMediaLink } from '$lib/common/guilded-media.js';
	import { getColorsFromImage } from '$lib/common/utils.js';
	import { Avatar } from '@skeletonlabs/skeleton';
  export let data

  function getTextColor(element: HTMLDivElement, imageURL: string) {
    getColorsFromImage(imageURL, 10, 4).then((color) => {
      console.log(imageURL)
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
<div class="flex flex-col items-center gap-4 mt-4 ">
  <h1>
    LEADERBOARD
  </h1>
  <div class="h-[calc(100vh-3rem)] overflow-y-auto overflow-x-visible hide-scrollbar w-full">
    {#each topChangers as topChanger}
    <a class="w-full" target="_blank" href={`https://guilded.gg/profile/${topChanger.id}`}>
      <div style={`background-image: url('${guildedMediaLink(topChanger.banner)}')`} class="card bg-no-repeat bg-cover w-full flex justify-between p-4" >
        <div class="flex flex-row justify-between w-full">
          <div class="flex gap-4 items-center" use:getTextColor={guildedMediaLink(topChanger.banner)}>
            <Avatar src={guildedMediaLink(topChanger.avatar)} width="w-16" rounded="rounded-none" />
            <h2 class="text-center">{topChanger.username}</h2>
          </div>
          <div class="flex flex-col items-center" use:getTextColor={guildedMediaLink(topChanger.banner)}>
            <h3 class="text-center">Points</h3>
            <h3 class="text-center">{topChanger.totalPixelsChanged}</h3>
          </div>
      </div>
      </div>
    </a>
    {/each}
  </div>
</div>
{:catch}
<p class="text-error-500">An error ocurred while getting top placers...</p>
{/await}