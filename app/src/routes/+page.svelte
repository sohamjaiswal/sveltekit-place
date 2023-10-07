<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Pixel } from '@prisma/client';
	import { onMount } from 'svelte';

  export let data;
  const {lazy} = data

  let canvas: HTMLCanvasElement
  let highlighter: HTMLDivElement

  $: zoom = false

  const sortPixels = (pixels: Pick<Pixel, "x"|"y"|"color">[]) => {
    const sorted =  pixels.sort((a,b) => {
      if (a.y == b.y) {
        return a.x - b.x
      }
      return a.y - b.y
    })
    return sorted
  }

  // Function to convert a hex color string to RGB values
  const hexToRgb = (hex: string) => {
    hex = hex.replace(/^#/, '');
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b];
  }

  function drawHighlight(ctx: CanvasRenderingContext2D ,x: number, y: number) {
    if (!ctx) {
      console.error("Failed to get canvas context!");
      return;
    }

    // Clear any previous highlights by clearing the entire canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw a red rectangle stroke around the selected pixel
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 1, y - 1, 3, 3); // Adjust the size as needed
  }

  onMount(async () => {
    const board = await lazy.board
    const pixels = sortPixels(await lazy.pixels)
    if (!board || !pixels) {
      console.error("Failed to load board/pixels!")
      return
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.error("Failed to get canvas context!")
      return
    }
    canvas.height = board.dimY
    canvas.width = board.dimX
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
    console.log(pixels)
    // Create ImageData from the pixel array
    const imageData = createImageData(pixels);

    if (!imageData) {
      console.error("Failed to create ImageData!")
      return
    }
    ctx.imageSmoothingEnabled = false;
    ctx.imageSmoothingQuality = "low";
    // Put the ImageData onto the canvas
    ctx.putImageData(imageData, 0, 0);
    // Add an event listener to the canvas for mouse clicks
    canvas.addEventListener('click', (event) => {
      // Get the mouse click coordinates relative to the canvas
      const x = event.offsetX;
      const y = event.offsetY;

      // Console log the x and y pixel values
      console.log(`Clicked at X: ${x}, Y: ${y}`);

      // Update the position of the highlight div
      highlighter.style.left = `${40*x}px`; // Adjust the size and position as needed
      highlighter.style.top = `${40*y}px`; // Adjust the size and position as needed

      // Ensure the highlight div is visible
      highlighter.style.display = 'block';
    });
  })
</script>

<form method="post" action="?/updateBoard" class="h-screen w-screen flex flex-col" use:enhance>
  {#await lazy.board}
  <div class="flex justify-center items-center text-center w-full h-full">
    <h1>
      Loading Board...
    </h1>
  </div>
  {:then}
  {#await lazy.pixels}
  <div class="flex justify-center items-center text-center w-full h-full">
    <h1>
      Loading Pixels...
    </h1>
  </div>
  {:then pixels}
  <!-- make a screen size scrollable and zoomable canvas element where user will be able to select the pixel -->
  <div class="canvas-container">
    <canvas bind:this={canvas} class:zoom={zoom} />
    <div class="highlight absolute h-10 w-10 stroke-black" bind:this={highlighter} />
  </div>
  {:catch}
  <p class="flex justify-center items-center text-center w-full h-full text-error-500">
    Failed to load pixels!
  </p>
  {/await}
  {:catch}
  <p class="flex justify-center items-center text-center w-full h-full text-error-500">
    Failed to load board!
  </p>
  {/await}
  <!-- color picker and submit button aligned to bottom left -->
  <div class="flex flex-row gap-4 mt-auto m-2 z-10">
    <!-- zoom checkbox with magnifying glass icon -->
    <button class={`btn-icon rounded-none relative h-10 w-10 ${zoom ? 'variant-soft-secondary' : 'variant-soft-success'}`}>
      {#if zoom}
      <iconify-icon icon="memory:pencil" class={`h-10 w-10 absolute left-1/2 top-1/2 -translate-x-1/4 -translate-y-1/4`} />
      {:else}
      <iconify-icon icon="pixelarticons:eye" class={`h-10 w-10 absolute left-1/2 top-1/2 -translate-x-1/4 -translate-y-1/4`} />
      {/if}
      <input type="checkbox" class="h-10 w-10 absolute opacity-0" style="" bind:checked={zoom} on:click={() => {console.log(zoom)}} />
    </button>

    <input type="color" class="h-10 w-10" />
    <button class="btn variant-filled">Submit</button>
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
      100% {
          border-image: linear-gradient(45deg, #6fba82, #07b39b, #1098ad, #5073b8, #a166ab, #ef4e7b, #f37055, #f79533);
          border-image-slice: 1;
      }
  }

  .highlight {
      width: 40px;
      height: 40px;
      border: 3px solid transparent;
      /* border-image: linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet);
      border-image-slice: 1; */
      animation: 1s rainbow-border infinite alternate;
  }
</style>