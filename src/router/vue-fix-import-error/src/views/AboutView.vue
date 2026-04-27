<template>
  <div class="about">
    <h1>关于MA系统</h1>
    <div class="about-content">
      <p>MA系统是一个现代化的企业管理系统，提供合同管理、项目管理等核心功能。</p>
      <p>版本: 0.0.0</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AboutView'
}
</script>

<style scoped>
.about {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  color: #333;
  margin-bottom: 20px;
}

.about-content {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 10px;
}
</style>