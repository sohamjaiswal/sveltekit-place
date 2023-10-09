<script lang="ts">
	import { page } from '$app/stores';
	import { getColorsFromImage, hexToRgb, rgbToHex, type UserPresence } from '$lib/common';
	import type { Pixel, User } from '@prisma/client';
	import { Avatar } from '@skeletonlabs/skeleton';;
	import { error } from '@sveltejs/kit';
	import { onMount } from 'svelte';
  import { source } from 'sveltekit-sse'
  const connection = source('api/v1/events')
  const pixelUpdates = connection.select('pixel-updates')
  const presenceUpdates = connection.select('user-presence')
  export let data;
  const {lazy, board} = data
  let canvas: HTMLCanvasElement
  let highlighter: HTMLDivElement
  let highlighterColorManager = new Map<string, string[]>()
  const setHighlighterColor = (element: HTMLElement, imageURL: string) => {
    const currColor = highlighterColorManager.get(imageURL)
    if (currColor) {
      element.style.borderColor = currColor[0]
      element.style.color = currColor[1]
    }
    getColorsFromImage(imageURL).then((colors) => {
      if (!colors) {
        element.style.borderColor = "#000000"
        element.style.color = "#ffffff"
        return
      }
      highlighterColorManager.set(imageURL, colors)
      element.style.borderColor = colors[0]
      element.style.color = colors[1]
    })
  } 
  const setHighlighterContext = (element: HTMLElement, imageURL: string) => {
    const currColor = highlighterColorManager.get(imageURL)
    if (currColor) {
      element.style.backgroundColor = currColor[0]
    }
    getColorsFromImage(imageURL).then((colors) => {
      if (!colors) {
        element.style.backgroundColor = "#000000"
        return
      }
      highlighterColorManager.set(imageURL, colors)
      element.style.backgroundColor = colors[0]
    })
  }
  async function getSelPlacer (x: number = 0, y: number = 0) {
    return (await fetch(`/api/v1/getPlacer?x=${x}&y=${y}`)).json() as Promise<User>
  }
  async function setPresence (x: number, y: number){
    // check if color is valid hex
    if (!color.match(/^#[0-9A-F]{6}$/i)) {
      console.error("Invalid color!")
      return
    }
    await fetch(`/api/v1/updatePresence`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        x: x,
        y: y
      })
    }).catch((err) => {
      console.error(err)
    })
  }
  $: zoom = false
  let selectedX: number | null = null
  let selectedY: number | null = null
  let selectedPlacer: Promise<User>  | null = null
  let color = "#ffffff"
  let preZoomX = 0
  let preZoomY = 0
  let extPresence: UserPresence[] = []
  $: selX = selectedX
  $: selY = selectedY
  $: selPlacer = selectedPlacer
  $: userPresence = extPresence
  const placePixel = async() => {
      await fetch(`/api/v1/placePixel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          x: selX,
          y: selY,
          color: color
        })
      }).catch((err) => {
        console.error(err)
      })
    }
  let handleZoomClick = () => {}
  const sortPixels = (pixels: Pick<Pixel, "x"|"y"|"color">[]) => {
    const sorted =  pixels.sort((a,b) => {
      if (a.y == b.y) {
        return a.x - b.x
      }
      return a.y - b.y
    })
    return sorted
  }

  onMount(async () => {
    if ($page.data.localUser) {
      console.log(await getColorsFromImage($page.data.localUser.avatar))
    }
    handleZoomClick = () => {
      const isZoomed = !zoom
      console.log(isZoomed)
      if (isZoomed) {
        selX = preZoomX
        selY = preZoomY
        return
      }
      selX = null
      selY = null
    }
    selPlacer = getSelPlacer()
    let pixels = await lazy.pixels
    if (!board || !pixels) {
      throw error(500, "Failed to load board/pixels!")
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.error("Failed to get canvas context!")
      return
    }
    canvas.height = board.dimY
    canvas.width = board.dimX
    ctx.imageSmoothingEnabled = false;
    ctx.imageSmoothingQuality = "low";
        // Add an event listener to the canvas for mouse clicks
    canvas.addEventListener('click', (event: MouseEvent) => {
      // Get the mouse click coordinates relative to the canvas
      const x = event.offsetX;
      const y = event.offsetY;
      // Console log the x and y pixel values
      preZoomX = x
      preZoomY = y
      if (zoom) {
        selX = x
        selY = y
      }
      if (selX !== null && selY !== null) {
        selPlacer = getSelPlacer(selX, selY)
        if ($page.data.localUser) {
          setPresence(selX, selY)
        }
      }
    });
    // Function to convert the pixel array into ImageData
    function createImageData(pixels: Pick<Pixel, "x"|"y"|"color">[]) {
      if (!ctx) {
        console.error("Failed to get canvas context!")
        return
      }
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      for (const pixel of pixels) {
          const { x, y, color } = pixel;
          const index = (y * canvas.width + x) * 4;
          const [r, g, b] = hexToRgb(color);
          imageData.data[index] = r;
          imageData.data[index + 1] = g;
          imageData.data[index + 2] = b;
          imageData.data[index + 3] = 255; // Alpha channel (fully opaque)
      }
      return imageData;
    }
    // helper function to update canvas with passed in pixels
    const updateCanvas = (pixels: Pick<Pixel, "x" | "y" | "color">[],newPixels: Pick<Pixel, "x" | "y" | "color">[] = []): Pick<Pixel, "x" | "y" | "color">[] => {
      if (newPixels.length === 0) {
        const sortedPixels = sortPixels(pixels); // Define the sorting logic
        const updatedImageData = createImageData(sortedPixels);
        if (!updatedImageData) {
          console.error("Failed to create ImageData!");
          return pixels; // Return null to indicate failure
        }
        ctx.putImageData(updatedImageData, 0, 0);
        return pixels; // Nothing to update, return the original pixels
      }
      const updatedPixels = pixels.filter((pixel) => {
        return !newPixels.some(
          (newPixel) => pixel.x === newPixel.x && pixel.y === newPixel.y
        );
      });
      // Push all elements from newPixels into updatedPixels
      updatedPixels.push(...newPixels);
      const sortedPixels = sortPixels(updatedPixels); // Define the sorting logic
      const updatedImageData = createImageData(sortedPixels);
      if (!updatedImageData) {
        console.error("Failed to create ImageData!");
        return pixels; // Return null to indicate failure
      }
      ctx.putImageData(updatedImageData, 0, 0);
      return sortedPixels; // Return the updated pixels
    };
    pixelUpdates.subscribe((lastPixelUpdates) => {
      try {
        if (lastPixelUpdates == '') {
          return
        }
        const updates = (JSON.parse(lastPixelUpdates)).pixelUpdates as Pick<Pixel, "x"|"y"|"color">[]
        pixels = updateCanvas(pixels, updates)
      } catch (err) {
        console.error(err)
      }
    })
    presenceUpdates.subscribe((presenceUpdate) => {
      try {
        if (presenceUpdate == '') {
          return
        }
        const update = (JSON.parse(presenceUpdate)).userPresence as UserPresence[]
        // remove own user from list, keep others
        const updateBarSelf = update.filter((presence) => {
          return presence.user.id != $page.data.localUser?.id
        })
        userPresence = updateBarSelf
      } catch (err) {
        console.error(err)
      }
    })
    updateCanvas(pixels, [])
  })
</script>

{#if !lazy}
<p class="flex justify-center items-center text-center w-full h-full text-error-500">
  Failed to load board!
</p>  
{/if}

<form class="h-screen w-screen flex flex-col" on:submit={() => placePixel()}>
  {#await lazy.pixels}
  <div class="flex justify-center items-center text-center w-full h-full">
    <h1>
      Loading Pixels...
    </h1>
    <iconify-icon icon="eos-icons:spinner" class="animate-spin" />
  </div>
  {:then pixels}
  <!-- make a screen size scrollable and zoomable canvas element where user will be able to select the pixel -->
  <div class="canvas-container" id="canvas-container">
    <input type="hidden" name="X" value={selX} />
    <input type="hidden" name="Y" value={selY} />
    <canvas bind:this={canvas} class:zoom={zoom} />
    <div class="absolute">
      {#key userPresence}
      {#each userPresence as presence}
        <div class={`highlight absolute h-10 w-10 stroke-black ${!zoom ? "hidden" : "block"}`} style="left: {40*presence.x}px; top: {40*presence.y - (board?.dimY ?? 0)}px" use:setHighlighterColor={presence.user.avatar}>
          <div style="top: 37px; left: -3px;" class="absolute flex justify-between items-center gap-2 p-1" use:setHighlighterColor={presence.user.avatar} use:setHighlighterContext={presence.user.avatar}>
            <Avatar src={presence.user.avatar} width="w-8" rounded="rounded-none" />
            <p>
              ·
            </p>
            {presence.user.username}
          </div>
        </div>
      {/each}
      {/key}
    </div>
    {#key zoom}
    {#if selX != null && selY != null}
    <div class={`highlight-own absolute h-10 w-10 stroke-black ${zoom ? "block" : "hidden"}`} style={`top: ${40*selY}px; left: ${40*selX}px;`} bind:this={highlighter} />
    {/if}
    {/key}
  </div>
  {:catch}
  <p class="flex justify-center items-center text-center w-full h-full text-error-500">
    Failed to load pixels!
  </p>
  {/await}
  <!-- color picker and submit button aligned to bottom left -->
  <div class="flex flex-row gap-4 mt-auto m-2 z-10 justify-between">
    <!-- zoom checkbox with magnifying glass icon -->
    <div class="flex gap-4">
      <button class={`btn-icon rounded-none relative h-10 w-10 ${zoom ? 'variant-soft-secondary' : 'variant-soft-success'}`}>
        {#if zoom}
        <iconify-icon icon="memory:pencil" class={`h-10 w-10 absolute left-1/2 top-1/2 -translate-x-1/4 -translate-y-1/4`} />
        {:else}
        <iconify-icon icon="pixelarticons:eye" class={`h-10 w-10 absolute left-1/2 top-1/2 -translate-x-1/4 -translate-y-1/4`} />
        {/if}
        <input type="checkbox" class="h-10 w-10 absolute opacity-0" style="" bind:checked={zoom} on:click={() => {handleZoomClick()}} />
      </button>
      <input type="color" class="h-10 w-10" bind:value={color} />
      <button type="submit" class="btn variant-filled">Submit</button>
    </div>
    {#if selX != null && selY != null}
    <div class="flex items-center justify-center gap-2">
      <p>
        Selected Pixel: ({selX}, {selY})
      </p>
        {#key selPlacer}
          {#await selPlacer}
            <iconify-icon icon="eos-icons:spinner" class="animate-spin" />
          {:then placer} 
          {#if placer}
            <div class="flex items-center justify-center gap-2">
              ·
              <a href={`http://guilded.gg/profile/${placer.id}`} target="_blank" class="inline">
                <div class="flex items-center gap-2">
                  <Avatar src={placer.avatar} width="w-8" rounded="rounded-none" />
                  {placer.username}
                </div>
              </a>
              {#if $page.data.localUser}
                {#if placer.id == $page.data.localUser.id}
                  <span class="badge variant-filled-secondary">YOU</span>
                {/if}
              {/if}
              {#if placer.role == "ADMIN"}
              <span class="badge variant-filled-tertiary">ADMIN</span>
              {/if}
            </div>
          {/if}
          {:catch}
            <p class="flex justify-center items-center text-center w-full h-full text-error-500">
              Failed to load placer!
            </p>
          {/await}
        {/key}
    </div>
    {/if}
    <div class="w-5" />
  </div>
</form>

<style lang="postcss">
  .canvas-container {
    width: 100%;
    height: 100%;
    overflow: scroll;
    position: relative;
  }
  canvas {
    transform-origin: top left;
    transform: scale(4);
    image-rendering: pixelated;
    &.zoom {
      transform: scale(40);
    }
  }

  @keyframes rainbow-border {
      0% {
          border-image: linear-gradient(45deg, #f79533, #f37055, #ef4e7b, #a166ab, #5073b8, #1098ad, #07b39b, #6fba82);
          border-image-slice: 1;
      }
      14.28% {
          border-image: linear-gradient(45deg, #f37055, #ef4e7b, #a166ab, #5073b8, #1098ad, #07b39b, #6fba82, #f79533);
          border-image-slice: 1;
      }
      28.57% {
          border-image: linear-gradient(45deg, #ef4e7b, #a166ab, #5073b8, #1098ad, #07b39b, #6fba82, #f79533, #f37055);
          border-image-slice: 1;
      }
      42.85% {
          border-image: linear-gradient(45deg, #a166ab, #5073b8, #1098ad, #07b39b, #6fba82, #f79533, #f37055,  #ef4e7b);
          border-image-slice: 1;
      }
      57.13% {
          border-image: linear-gradient(45deg, #5073b8, #1098ad, #07b39b, #6fba82, #f79533, #f37055,  #ef4e7b, #a166ab);
          border-image-slice: 1;
      }
      71.41% {
          border-image: linear-gradient(45deg, #1098ad, #07b39b, #6fba82, #f79533, #f37055,  #ef4e7b, #a166ab,  #5073b8);
          border-image-slice: 1;
      }
      85.69% {
          border-image: linear-gradient(45deg, #07b39b, #6fba82, #f79533, #f37055,  #ef4e7b, #a166ab,  #5073b8,  #1098ad);
          border-image-slice: 1;
      }
      100% {
          border-image: linear-gradient(45deg, #6fba82, #f79533, #f37055,  #ef4e7b, #a166ab,  #5073b8,  #1098ad,  #07b39b);
          border-image-slice: 1;
      }
  }
  .highlight {
      width: 40px;
      height: 40px;
      border: 3px solid black;
      position: relative;
  }
  .highlight-own {
    width: 40px;
    height: 40px;
    border: 3px solid transparent;
    animation: 1.5s rainbow-border infinite alternate;
  }
</style>