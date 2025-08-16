<script lang="ts">
	import { page } from '$app/stores';
	import { PhotoBox, getColorsFromImage, hexToRgb, type UserPresence } from '$lib/common';
	import type { Pixel, User } from '@prisma/client';
	import { Avatar, type ToastSettings, getToastStore } from '@skeletonlabs/skeleton';;
	import { error } from '@sveltejs/kit';
	import { onMount } from 'svelte';
  import { source } from 'sveltekit-sse'
  const connection = source('api/v1/events')
  const pixelUpdates = connection.select('pixel-updates')
  const presenceUpdates = connection.select('user-presence')
  export let data;
  const {lazy, board} = data
  const toastStore = getToastStore();
  let highlighterColorManager = new Map<string, string[]>()
  const setHighlighterColor = (element: HTMLDivElement, imageURL: string) => {
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
  const setHighlighterContext = (element: HTMLDivElement, imageURL: string) => {
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
  async function setPresence (x: number, y: number){
    const res = await fetch(`/api/v1/updatePresence`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        x: x,
        y: y
      })
    })
    switch (res.status) {
      case 400||404:
        toastStore.trigger({
          message: `Invalid position!`,
          background: "variant-filled-error",
          timeout: 2000
        } as ToastSettings)
        break;
      case 401:
        toastStore.trigger({
          message: `You must be logged in to place pixels!`,
          background: "variant-filled-error",
          timeout: 2000
        } as ToastSettings)
        break;
      case 500:
        toastStore.trigger({
          message: `Failed to place pixel! (Server error...)`,
          background: "variant-filled-error",
          timeout: 2000
        } as ToastSettings)
        break;
    }
  }
  $: zoom = false
  let selectedX: number | null = null
  let selectedY: number | null = null
  let selectedPlacer: Promise<User>  | null = null
  let loadedPixels: Pick<Pixel, "x"|"y"|"color">[] 
  let color = "#ffffff"
  let preZoomX = 0
  let preZoomY = 0
  let extPresence: UserPresence[] = []
  $: selX = selectedX
  $: selY = selectedY
  $: selPlacer = selectedPlacer
  $: userPresence = extPresence
  $: downloadedPixels = loadedPixels
  let handleZoomClick = () => {}
  async function getSelPlacer () {
    if (selX == null || selY == null) {
      return null
    }
    selPlacer = (await fetch(`/api/v1/getPlacer?x=${selX}&y=${selY}`)).json() as Promise<User>
    return selPlacer
  }
  const placePixel = async() => {
      const placed = await fetch(`/api/v1/placePixel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          x: selX,
          y: selY,
          color: color
        })
      })
      switch (placed.status) {
        case 400:
          toastStore.trigger({
            message: `Invalid color or position!`,
            background: "variant-filled-error",
            timeout: 2000
          } as ToastSettings)
          break;
        case 401:
          toastStore.trigger({
            message: `You must be logged in to place pixels!`,
            background: "variant-filled-error",
            timeout: 2000
          } as ToastSettings)
          break;
        case 500:
          toastStore.trigger({
            message: `Failed to place pixel! (Server error...)`,
            background: "variant-filled-error",
            timeout: 2000
          } as ToastSettings)
          break;
      }
    }
    const updatePresence = () => {
      if ($page.data.localUser && selX !== null && selY !== null) {
        setPresence(selX, selY)
      }
    }
  const dynamicPixelCanvas = (element: HTMLCanvasElement, pixels: Pick<Pixel, "x"|"y"|"color">[]) => {
    const ctx = element.getContext('2d')
    if (!ctx) {
      console.error("Failed to get canvas context!")
      return
    }
    element.height = board.dimY
    element.width = board.dimX
    ctx.imageSmoothingEnabled = false;
    ctx.imageSmoothingQuality = "low";
    function createImageData(ctx: CanvasRenderingContext2D, pixels: Pick<Pixel, "x"|"y"|"color">[]) {
      const imageData = ctx.createImageData(element.width, element.height);
      for (const pixel of pixels) {
          const { x, y, color } = pixel;
          const index = (y * element.width + x) * 4;
          const [r, g, b] = hexToRgb(color);
          imageData.data[index] = r;
          imageData.data[index + 1] = g;
          imageData.data[index + 2] = b;
          imageData.data[index + 3] = 255; // Alpha channel (fully opaque)
      }
      return imageData;
    }
    const sortPixels = (pixels: Pick<Pixel, "x"|"y"|"color">[]) => {
      const sorted =  pixels.sort((a,b) => {
        if (a.y == b.y) {
          return a.x - b.x
        }
        return a.y - b.y
      })
      return sorted
    }
    if (pixels) {
      const sortedPixels = sortPixels(pixels)
      const imageData = createImageData(ctx, sortedPixels);
      ctx.putImageData(imageData, 0, 0);
    }
    element.addEventListener('click', (event: MouseEvent) => {
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
      getSelPlacer()
      updatePresence()
    });
  }
  let handleKeyDown = (event: KeyboardEvent) => {}
  onMount(async () => {
    const openEyeDropper = () => {
      if (!window.EyeDropper) {
            // show toast
            toastStore.trigger({
              message: `Your browser does not support the eyedropper API!`,
              background: "variant-filled-error",
              timeout: 2000
            } as ToastSettings)
          }
          // open eyedropper
          const eyeDropper = new EyeDropper();
          const abortController = new AbortController();
  
          eyeDropper
            .open({ signal: abortController.signal })
            .then((result: {sRGBHex: string}) => {
              color = result.sRGBHex;
            })
            .catch((e: unknown) => {
              // show toast
              toastStore.trigger({
                message: `Failed to get color!`,
                background: "variant-filled-error",
                timeout: 2000
              } as ToastSettings)
            });
  
          setTimeout(() => {
            abortController.abort();
          }, 2000);
    }
    const keyboardUpdate = async () => {
      updatePresence()
      if (selX != null && selY != null) {
        getSelPlacer()
      }
    }
    handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "Escape":
          zoom = false
          break;
        case "z":
          zoom = !zoom
          break;
        case "ArrowUp":
          if (selY == null) {
            selY = 0
          } else {
            if (selY <= 0) {
              selY = board?.dimY -1 ?? 0
            }
            selY = selY - 1
          }
          keyboardUpdate()
          break;
        case "ArrowDown":
          if (selY == null) {
            selY = 0
          } else {
            if (selY >= (board?.dimY-1 ?? 0)) {
              selY = 0
            }
            selY = selY + 1
          }
          keyboardUpdate()
          break;
        case "ArrowLeft":
          if (selX == null) {
            selX = 0
          } else {
            if (selX <= 0) {
              selX = board?.dimX ?? 0
            }
            selX = selX - 1
          }
          keyboardUpdate()
          break;
        case "ArrowRight":
          if (selX == null) {
            selX = 0
          } else {
            if (selX >= (board?.dimX-1 ?? 0)) {
              selX = 0
            }
            selX = selX + 1
          }
          keyboardUpdate()
          break;
        case "Enter":
          // submit pixel
          placePixel()
          break;
        case "Space":
          // submit pixel
          placePixel()
          break;
        case "e":
          openEyeDropper()
          break
        case "i":
          openEyeDropper()
          break
        }
    }
    handleZoomClick = () => {
      const isZoomed = !zoom
      if (isZoomed) {
        selX = preZoomX
        selY = preZoomY
        return
      }
      selX = null
      selY = null
    }
    getSelPlacer()
    downloadedPixels = await lazy.pixels
    if (!board || !downloadedPixels) {
      throw error(500, "Failed to load board/pixels!")
    }
    pixelUpdates.subscribe((lastPixelUpdates) => {
      try {
        if (lastPixelUpdates == '') {
          return
        }
        const updates = (JSON.parse(lastPixelUpdates)).pixelUpdates as Pick<Pixel, "x"|"y"|"color">[]
        console.log(updates)
        const newPixels = downloadedPixels.filter((pixel) => {
          return !updates.some((update) => {
            return update.x == pixel.x && update.y == pixel.y
          })
        })
        downloadedPixels = (newPixels.concat(updates))
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
  {:then}
  <div class="canvas-container" id="canvas-container">
    <input type="hidden" name="X" value={selX} />
    <input type="hidden" name="Y" value={selY} />
    {#key downloadedPixels}
    <canvas class:zoom={zoom} use:dynamicPixelCanvas={downloadedPixels} />
    {/key}
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
    <div class={`highlight-own absolute h-10 w-10 stroke-black ${zoom ? "block" : "hidden"}`} style={`top: ${40*selY}px; left: ${40*selX}px;`} />
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
    </div>
    {/if}
    <div class="w-5" />
  </div>
</form>
<svelte:window on:keydown={handleKeyDown} />
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