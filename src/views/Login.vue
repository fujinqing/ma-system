<template>
  <div class="login-container">
    <div class="login-form">
      <div class="login-header">
        <i class="fa fa-cogs text-blue-600 text-4xl"></i>
        <div class="system-title mt-2">
          <div class="title-line1 font-bold text-2xl">M-A</div>
          <div class="title-line2 font-bold text-xl">运营系统</div>
        </div>
        <p class="text-gray-500 mt-1">请登录您的账号</p>
      </div>
      <el-form :model="loginForm" :rules="rules" ref="loginFormRef" label-position="top">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" prefix-icon="el-icon-user"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" prefix-icon="el-icon-lock"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="w-full" @click="login">登录</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
import { useUserStore } from '../store/modules/user'

export default {
  name: 'Login',
  data() {
    return {
      loginForm: {
        username: '',
        password: ''
      },
      rules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' }
        ]
      }
    }
  },
  methods: {
    login() {
      this.$refs.loginFormRef.validate((valid) => {
        if (valid) {
          // 模拟登录请求
          setTimeout(() => {
            const userInfo = {
              id: 1,
              username: this.loginForm.username,
              name: '管理员',
              role: 'admin',
              token: 'mock-token-' + Date.now()
            }
            const userStore = useUserStore()
            userStore.login(userInfo)
            this.$router.push('/dashboard')
          }, 1000)
        }
      })
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-form {
  width: 400px;
  background: #fff;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}
</style>