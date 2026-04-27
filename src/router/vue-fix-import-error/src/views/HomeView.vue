<template>
  <div class="home">
    <h1>MA系统首页</h1>
    <div class="dashboard">
      <div class="card">
        <h2>合同管理</h2>
        <p>管理所有销售合同和协议</p>
        <router-link to="/contracts" class="btn-primary">查看合同</router-link>
      </div>
      <div class="card">
        <h2>项目管理</h2>
        <p>跟踪和管理所有项目进度</p>
        <router-link to="/projects" class="btn-primary">查看项目</router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomeView'
}
</script>

<style scoped>
.home {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  color: #333;
  margin-bottom: 30px;
}

.dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.card h2 {
  color: #333;
  margin-bottom: 10px;
}

.card p {
  color: #666;
  margin-bottom: 20px;
}

.btn-primary {
  display: inline-block;
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.btn-primary:hover {
  background-color: #0056b3;
}
</style>