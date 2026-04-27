import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue')
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/AboutView.vue')
  },
  // 销售管理相关路由
  {
    path: '/contracts',
    name: 'ContractList',
    component: () => import('../views/sales/ContractList.vue'),
    meta: { title: '合同管理' }
  },
  // 项目管理相关路由
  {
    path: '/projects',
    name: 'ProjectList',
    component: () => import('../views/projects/ProjectList.vue'),
    meta: { title: '项目管理' }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// 路由前置守卫，设置页面标题
router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} - MA系统`
  } else {
    document.title = 'MA系统'
  }
  next()
})

export default router