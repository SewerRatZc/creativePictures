<<<<<<< HEAD
<!-- <script setup>
=======
<script setup>
>>>>>>> 9c6009cde14423f7be1409a826a333fc8678bb4d
import { reactive } from 'vue'

const versions = reactive({ ...window.electron.process.versions })
</script>

<template>
  <ul class="versions">
    <li class="electron-version">Electron v{{ versions.electron }}</li>
    <li class="chrome-version">Chromium v{{ versions.chrome }}</li>
    <li class="node-version">Node v{{ versions.node }}</li>
  </ul>
<<<<<<< HEAD
</template> -->
=======
</template>
>>>>>>> 9c6009cde14423f7be1409a826a333fc8678bb4d
