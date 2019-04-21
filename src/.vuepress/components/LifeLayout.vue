<template>
  <div class="custom-layout">

    <!-- .main-div is the block with white background -->
    <div class="main-div">
      <h4 style="color:cornflowerblue">这不是一个好的时代，但也绝不是最坏的...</h4>
    </div>

    <div class="main-div">
      <!-- <Content /> is to show the rendered markdown content of this page -->
      <Content />
    </div>
  </div>
</template>

<script>

export default {
  name: 'LifeLayout',
}
</script>