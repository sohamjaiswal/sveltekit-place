<script lang="ts">

	import { enhance } from "$app/forms";
	import { page } from "$app/stores";

  export let data
  const {boards} = data 
</script>
<h1>
  Settings
</h1>
{#if $page.data.localUser.role == "ADMIN"}
<!-- a form to create a new board -->
<form action="?/createBoard" method="post" use:enhance>
  <div class="flex flex-col gap-4">
    <div class="w-full flex justify-between">
      <div class="w-7/12">
        <label for="board-name">
          Board Name
        </label>
        <input type="text" name="name" id="board-name" class="input" />
      </div>
      <div class="w-4/12 float-right">
        <label for="bg-color">
          Board Background Color
        </label>
        <input type="color" name="bgColor" id="bg-color" class="input" />
      </div>
    </div>
    <label for="board-description">
      Board Description
    </label>
    <textarea name="description" id="board-description" class="input"></textarea>
    <!-- dimx and dimy entry -->
    <label for="board-dimx">
      Board Width
    </label>
    <input type="number" name="dimx" id="board-dimx" class="input" value=42 />
    <label for="board-dimy">
      Board Height
    </label>
    <input type="number" name="dimy" id="board-dimy" class="input" value=69 />
    <button class="btn variant-filled" type="submit">
      Create Board
    </button>
  </div>
</form>
{:else}
Nothing to view here right now...
{/if}

{#if boards}
<h1 class="mt-4">
  Boards
</h1>
<!-- a list of boards -->
{#if boards.length != 0}
<div class="flex flex-col gap-4">
  {#each boards as board}
  <div class="card card-hover p-2 flex flex-col gap-4">
    <h2>
      {board.name}
    </h2>
    <p>
      {board.description}
    </p>
    <div class="flex gap-4">
    <p>
      {board.dimX} x {board.dimY}
    </p>
    ·
      <p>
        {board.color}
        <!-- preview board color -->
      </p>
      <div class="w-10 h-10" style="background-color: {board.color}"></div>
    </div>
    <div class="flex gap-4">
    <a href="board/{board.id}">
        <button class="btn variant-filled">
          View Board
        </button>
      </a>
      <form action="?/deleteBoard" method="post">
        <input type="hidden" name="id" value={board.id} />
        <button class="btn variant-filled-error">
          Delete Board
        </button>
      </form>
    </div>
  </div>
  {/each}
</div>
{:else}
No boards created yet. Make one!
{/if}
{/if}
