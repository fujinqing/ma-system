import { defineStore } from 'pinia'
import { safeJSONParse, safeExecute } from '@/utils/helpers'

/**
 * 用户状态管理
 * 增强健壮性：添加错误处理和默认值
 */
export const useUserStore = defineStore('user', {
  state: () => {
    // 安全地从localStorage读取数据
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
    const user = safeJSONParse(localStorage.getItem('user'), null)
    const token = localStorage.getItem('token') || ''

    return {
      isLoggedIn,
      user,
      token
    }
  },

  getters: {
    /**
     * 获取用户ID
     */
    userId: (state) => {
      return state.user?.id || null
    },

    /**
     * 获取用户名
     */
    userName: (state) => {
      return state.user?.name || '未知用户'
    },

    /**
     * 获取用户角色
     */
    userRole: (state) => {
      return state.user?.role || 'user'
    },

    /**
     * 是否为管理员
     */
    isAdmin: (state) => {
      return state.user?.role === 'admin' || state.user?.isAdmin === true
    },

    /**
     * 检查用户是否有特定模块的权限
     */
    hasPermission: (state) => (module, action = 'view') => {
      // 管理员拥有所有权限
      if (state.user?.role === 'admin') {
        return true
      }
      
      // 检查用户权限
      const permissions = state.user?.permissions || {}
      const modulePermissions = permissions[module] || {}
      
      // 默认检查view权限
      return modulePermissions[action] || false
    }
  },

  actions: {
    /**
     * 用户登录
     * @param {Object} userInfo - 用户信息
     */
    login(userInfo) {
      if (!userInfo || typeof userInfo !== 'object') {
        console.error('Login failed: invalid user info')
        return false
      }

      try {
        this.isLoggedIn = true
        this.user = userInfo
        this.token = userInfo.token || ''

        // 安全地存储到localStorage
        localStorage.setItem('isLoggedIn', 'true')
        localStorage.setItem('user', JSON.stringify(userInfo))
        localStorage.setItem('token', userInfo.token || '')

        return true
      } catch (e) {
        console.error('Login error:', e)
        return false
      }
    },

    /**
     * 用户登出
     */
    logout() {
      try {
        this.isLoggedIn = false
        this.user = null
        this.token = ''

        localStorage.removeItem('isLoggedIn')
        localStorage.removeItem('user')
        localStorage.removeItem('token')

        return true
      } catch (e) {
        console.error('Logout error:', e)
        return false
      }
    },

    /**
     * 更新用户信息
     * @param {Object} userInfo - 用户信息
     */
    setUser(userInfo) {
      if (!userInfo || typeof userInfo !== 'object') {
        console.warn('Set user failed: invalid user info')
        return false
      }

      try {
        this.user = { ...this.user, ...userInfo }
        localStorage.setItem('user', JSON.stringify(this.user))
        return true
      } catch (e) {
        console.error('Set user error:', e)
        return false
      }
    },

    /**
     * 更新Token
     * @param {string} token - 新token
     */
    setToken(token) {
      if (!token || typeof token !== 'string') {
        console.warn('Set token failed: invalid token')
        return false
      }

      try {
        this.token = token
        localStorage.setItem('token', token)
        return true
      } catch (e) {
        console.error('Set token error:', e)
        return false
      }
    },

    /**
     * 检查并恢复登录状态
     */
    restoreSession() {
      try {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
        const user = safeJSONParse(localStorage.getItem('user'), null)
        const token = localStorage.getItem('token') || ''

        if (isLoggedIn && user && token) {
          this.isLoggedIn = true
          this.user = user
          this.token = token
          return true
        }

        // 如果数据不完整，清除登录状态
        this.logout()
        return false
      } catch (e) {
        console.error('Restore session error:', e)
        this.logout()
        return false
      }
    },

    /**
     * 清除所有用户数据（用于重置）
     */
    clearAll() {
      return this.logout()
    }
  }
})
