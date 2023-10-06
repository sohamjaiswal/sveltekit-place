<script lang="ts">
  import 'iconify-icon'
  import {PUBLIC_CARDBOARD_URL} from '$env/static/public'
</script>

<a href={PUBLIC_CARDBOARD_URL}>
  <button class="btn variant-ghost-surface flex gap-2">
    <iconify-icon icon="fa-brands:guilded" />
    Login with Guilded
  </button>
</a>