<template>
  <div class="app-container">
    <!-- 水印 -->
    <Watermark 
      v-if="userStore.isLoggedIn" 
      :user-name="userStore.userName"
    />
    
    <!-- 侧边栏 -->
    <aside class="sidebar" v-if="userStore.isLoggedIn">
      <div class="sidebar-header">
        <i class="fa fa-cogs text-blue-600 mr-2"></i>
        <div class="system-title">
          <div class="title-line1">M-A</div>
          <div class="title-line2">运营系统</div>
        </div>
      </div>
      <nav class="sidebar-nav">
        <router-link to="/dashboard" class="nav-item" active-class="active">
          <i class="fa fa-home w-6"></i>
          <span>运营总览</span>
        </router-link>
        
        <!-- CRM管理模块 -->
        <div v-if="hasPermission('crm')" class="nav-item" @click="toggleMenu('crm')">
          <i class="fa fa-users w-6"></i>
          <span>CRM管理</span>
          <i class="fa fa-angle-down ml-2" :class="{ 'rotate-icon': expandedMenus.crm }"></i>
        </div>
        <div v-if="hasPermission('crm')" class="submenu" :class="{ 'expanded': expandedMenus.crm }">
          <router-link to="/crm" class="submenu-item" active-class="active">客户管理</router-link>
          <router-link to="/crm/competitors" class="submenu-item" active-class="active">竞争对手管理</router-link>
          <router-link to="/crm/activities" class="submenu-item" active-class="active">内部协作</router-link>
        </div>
        
        <!-- 销售管理模块 -->
        <div v-if="hasPermission('sales')" class="nav-item" @click="toggleMenu('sales')">
          <i class="fa fa-chart-line w-6"></i>
          <span>销售管理</span>
          <i class="fa fa-angle-down ml-2" :class="{ 'rotate-icon': expandedMenus.sales }"></i>
        </div>
        <div v-if="hasPermission('sales')" class="submenu" :class="{ 'expanded': expandedMenus.sales }">
          <router-link to="/sales/dashboard" class="submenu-item" active-class="active">销售仪表盘</router-link>
          <router-link to="/sales/price-calculation" class="submenu-item" active-class="active">价格计算表</router-link>
          <router-link to="/sales/quotation" class="submenu-item" active-class="active">报价管理</router-link>
          <router-link to="/sales/bidding" class="submenu-item" active-class="active">招投标管理</router-link>
          <router-link to="/sales/contract" class="submenu-item" active-class="active">合同管理</router-link>
          <router-link to="/sales/payment" class="submenu-item" active-class="active">回款管理</router-link>
        </div>
        
        <!-- 项目管理模块 -->
        <div v-if="hasPermission('projects')" class="nav-item" @click="toggleMenu('project')">
          <i class="fa fa-project-diagram w-6"></i>
          <span>项目管理</span>
          <i class="fa fa-angle-down ml-2" :class="{ 'rotate-icon': expandedMenus.project }"></i>
        </div>
        <div v-if="hasPermission('projects')" class="submenu" :class="{ 'expanded': expandedMenus.project }">
          <router-link to="/project/initiation" class="submenu-item" active-class="active">项目立项</router-link>
          <router-link to="/project" class="submenu-item" active-class="active">项目列表</router-link>
        </div>
        
        <!-- 技术与生产模块 -->
        <div v-if="hasPermission('technical')" class="nav-item" @click="toggleMenu('tech')">
          <i class="fa fa-cog w-6"></i>
          <span>技术管理</span>
          <i class="fa fa-angle-down ml-2" :class="{ 'rotate-icon': expandedMenus.tech }"></i>
        </div>
        <div v-if="hasPermission('technical')" class="submenu" :class="{ 'expanded': expandedMenus.tech }">
          <router-link to="/tech/bom" class="submenu-item" active-class="active">BOM管理</router-link>
          <router-link to="/tech/picking" class="submenu-item" active-class="active">领料清单</router-link>
          <router-link to="/tech/change" class="submenu-item" active-class="active">技术变更</router-link>
          <router-link to="/tech/agreement" class="submenu-item" active-class="active">技术协议审批</router-link>
        </div>
        
        <!-- SRM管理模块 -->
        <div v-if="hasPermission('srm')" class="nav-item" @click="toggleMenu('srm')">
          <i class="fa fa-shopping-cart w-6"></i>
          <span>SRM管理</span>
          <i class="fa fa-angle-down ml-2" :class="{ 'rotate-icon': expandedMenus.srm }"></i>
        </div>
        <div v-if="hasPermission('srm')" class="submenu" :class="{ 'expanded': expandedMenus.srm }">
          <router-link to="/srm/supplier" class="submenu-item" active-class="active">供应商管理</router-link>
          <router-link to="/srm/material" class="submenu-item" active-class="active">物料管理</router-link>
          <router-link to="/srm/requirement" class="submenu-item" active-class="active">采购需求</router-link>
          <router-link to="/srm/order" class="submenu-item" active-class="active">采购订单</router-link>
          <router-link to="/srm/contract" class="submenu-item" active-class="active">合同管理</router-link>
          <router-link to="/srm/receipt" class="submenu-item" active-class="active">采购入库</router-link>
          <router-link to="/srm/payment" class="submenu-item" active-class="active">采购付款</router-link>
          <router-link to="/srm/evaluation" class="submenu-item" active-class="active">供应商评估</router-link>
        </div>
        
        <!-- 仓库管理模块 -->
        <div v-if="hasPermission('warehouse')" class="nav-item" @click="toggleMenu('warehouse')">
          <i class="fa fa-warehouse w-6"></i>
          <span>仓库管理</span>
          <i class="fa fa-angle-down ml-2" :class="{ 'rotate-icon': expandedMenus.warehouse }"></i>
        </div>
        <div v-if="hasPermission('warehouse')" class="submenu" :class="{ 'expanded': expandedMenus.warehouse }">
          <router-link to="/warehouse" class="submenu-item" active-class="active">收货/库存</router-link>
          <router-link to="/warehouse" class="submenu-item" active-class="active">半成品入库</router-link>
          <router-link to="/warehouse" class="submenu-item" active-class="active">成品入库</router-link>
        </div>
        
        <!-- 质量管理模块 -->
        <div v-if="hasPermission('quality')" class="nav-item" @click="toggleMenu('quality')">
          <i class="fa fa-check-circle w-6"></i>
          <span>质量管理</span>
          <i class="fa fa-angle-down ml-2" :class="{ 'rotate-icon': expandedMenus.quality }"></i>
        </div>
        <div v-if="hasPermission('quality')" class="submenu" :class="{ 'expanded': expandedMenus.quality }">
          <router-link to="/quality" class="submenu-item" active-class="active">检验报告</router-link>
          <router-link to="/quality" class="submenu-item" active-class="active">检验标准</router-link>
          <router-link to="/quality" class="submenu-item" active-class="active">不合格品处理</router-link>
        </div>

        <!-- 人力资源管理模块 -->
        <div v-if="hasPermission('hr')" class="nav-item" @click="toggleMenu('hr')">
          <i class="fa fa-users w-6"></i>
          <span>人力资源</span>
          <i class="fa fa-angle-down ml-2" :class="{ 'rotate-icon': expandedMenus.hr }"></i>
        </div>
        <div v-if="hasPermission('hr')" class="submenu" :class="{ 'expanded': expandedMenus.hr }">
          <router-link to="/hr/employee" class="submenu-item" active-class="active">员工管理</router-link>
        </div>

        <!-- 行政管理模块 -->
        <div v-if="hasPermission('admin')" class="nav-item" @click="toggleMenu('admin')">
          <i class="fa fa-building w-6"></i>
          <span>行政管理</span>
          <i class="fa fa-angle-down ml-2" :class="{ 'rotate-icon': expandedMenus.admin }"></i>
        </div>
        <div v-if="hasPermission('admin')" class="submenu" :class="{ 'expanded': expandedMenus.admin }">
          <router-link to="/admin/assets" class="submenu-item" active-class="active">资产管理</router-link>
          <router-link to="/admin/announcements" class="submenu-item" active-class="active">公告通知</router-link>
        </div>

        <!-- 生产制造模块 -->
        <div v-if="hasPermission('production')" class="nav-item" @click="toggleMenu('manufacturing')">
          <i class="fa fa-industry w-6"></i>
          <span>生产制造</span>
          <i class="fa fa-angle-down ml-2" :class="{ 'rotate-icon': expandedMenus.manufacturing }"></i>
        </div>
        <div v-if="hasPermission('production')" class="submenu" :class="{ 'expanded': expandedMenus.manufacturing }">
          <router-link to="/manufacturing/work-order" class="submenu-item" active-class="active">生产工单</router-link>
        </div>

        <!-- 研发管理模块 -->
        <div v-if="hasPermission('rnd')" class="nav-item" @click="toggleMenu('rd')">
          <i class="fa fa-flask w-6"></i>
          <span>研发管理</span>
          <i class="fa fa-angle-down ml-2" :class="{ 'rotate-icon': expandedMenus.rd }"></i>
        </div>
        <div v-if="hasPermission('rnd')" class="submenu" :class="{ 'expanded': expandedMenus.rd }">
          <router-link to="/rd/project" class="submenu-item" active-class="active">研发项目</router-link>
        </div>

        <!-- 售后服务模块 -->
        <div v-if="hasPermission('afterSales')" class="nav-item" @click="toggleMenu('service')">
          <i class="fa fa-headset w-6"></i>
          <span>售后服务</span>
          <i class="fa fa-angle-down ml-2" :class="{ 'rotate-icon': expandedMenus.service }"></i>
        </div>
        <div v-if="hasPermission('afterSales')" class="submenu" :class="{ 'expanded': expandedMenus.service }">
          <router-link to="/service/workorder" class="submenu-item" active-class="active">售后工单</router-link>
          <router-link to="/service/equipment" class="submenu-item" active-class="active">设备档案</router-link>
        </div>
        
        <!-- ERP对接模块 -->
        <router-link v-if="hasPermission('admin')" to="/erp" class="nav-item" active-class="active">
          <i class="fa fa-sync w-6"></i>
          <span>ERP对接</span>
        </router-link>
        
        <!-- 文件管理模块 -->
        <div v-if="hasPermission('document')" class="nav-item" @click="toggleMenu('file')">
          <i class="fa fa-folder w-6"></i>
          <span>文件管理</span>
          <i class="fa fa-angle-down ml-2" :class="{ 'rotate-icon': expandedMenus.file }"></i>
        </div>
        <div v-if="hasPermission('document')" class="submenu" :class="{ 'expanded': expandedMenus.file }">
          <router-link to="/file/dashboard" class="submenu-item" active-class="active">文件管理</router-link>
          <router-link to="/file/project/1" class="submenu-item" active-class="active">项目文件</router-link>
          <router-link to="/file/package/1" class="submenu-item" active-class="active">文件打包</router-link>
        </div>
        
        <!-- 知识库模块 -->
        <div v-if="hasPermission('knowledge')" class="nav-item" @click="toggleMenu('knowledge')">
          <i class="fa fa-book w-6"></i>
          <span>知识库</span>
          <i class="fa fa-angle-down ml-2" :class="{ 'rotate-icon': expandedMenus.knowledge }"></i>
        </div>
        <div v-if="hasPermission('knowledge')" class="submenu" :class="{ 'expanded': expandedMenus.knowledge }">
          <router-link to="/knowledge/list" class="submenu-item" active-class="active">知识库</router-link>
          <router-link to="/knowledge/add" class="submenu-item" active-class="active">添加知识</router-link>
        </div>
        
        <!-- 经营报表模块 -->
        <div v-if="hasPermission('report')" class="nav-item" @click="toggleMenu('reports')">
          <i class="fa fa-chart-pie w-6"></i>
          <span>经营报表</span>
          <i class="fa fa-angle-down ml-2" :class="{ 'rotate-icon': expandedMenus.reports }"></i>
        </div>
        <div v-if="hasPermission('report')" class="submenu" :class="{ 'expanded': expandedMenus.reports }">
          <router-link to="/reports/operation" class="submenu-item" active-class="active">经营报表</router-link>
        </div>

        <!-- 财务管理模块 -->
        <div v-if="hasPermission('finance')" class="nav-item" @click="toggleMenu('finance')">
          <i class="fa fa-wallet w-6"></i>
          <span>财务管理</span>
          <i class="fa fa-angle-down ml-2" :class="{ 'rotate-icon': expandedMenus.finance }"></i>
        </div>
        <div v-if="hasPermission('finance')" class="submenu" :class="{ 'expanded': expandedMenus.finance }">
          <router-link to="/finance/expense" class="submenu-item" active-class="active">报销管理</router-link>
        </div>

        <!-- 系统设置模块 -->
        <div v-if="hasPermission('admin')" class="nav-item" @click="toggleMenu('setting')">
          <i class="fa fa-user-cog w-6"></i>
          <span>系统设置</span>
          <i class="fa fa-angle-down ml-2" :class="{ 'rotate-icon': expandedMenus.setting }"></i>
        </div>
        <div v-if="hasPermission('admin')" class="submenu" :class="{ 'expanded': expandedMenus.setting }">
          <router-link to="/setting/user" class="submenu-item" active-class="active">用户管理</router-link>
          <router-link to="/setting/positions" class="submenu-item" active-class="active">职位管理</router-link>
          <router-link to="/setting/flow" class="submenu-item" active-class="active">流程管理</router-link>
          <router-link to="/setting/rates" class="submenu-item" active-class="active">工时费率管理</router-link>
          <router-link to="/setting/operation-logs" class="submenu-item" active-class="active">操作日志</router-link>
        </div>
      </nav>
    </aside>
    
    <!-- 主内容区域 -->
    <main class="main-content" v-if="userStore.isLoggedIn">
      <header class="main-header">
        <div class="header-left">
          <h2 class="text-xl font-bold">{{ pageTitle }}</h2>
        </div>
        <div class="header-right">
          <span class="text-sm text-gray-500">当前用户：{{ userStore.userName }}</span>
          <el-button link @click="handleLogout" class="ml-4">
            <i class="fa fa-sign-out-alt"></i> 退出登录
          </el-button>
        </div>
      </header>
      <div class="content-body">
        <router-view />
      </div>
    </main>
    
    <!-- 登录页面 -->
    <router-view v-else />
  </div>
</template>

<script>
import { useUserStore } from './store/modules/user'
import { useRouter, useRoute } from 'vue-router'
import { computed, onMounted, onErrorCaptured } from 'vue'
import Watermark from './components/Watermark.vue'
import { safeExecute } from './utils/helpers'

export default {
  name: 'App',
  components: {
    Watermark
  },
  setup() {
    const userStore = useUserStore()
    const router = useRouter()
    const route = useRoute()
    
    // 计算页面标题
    const pageTitle = computed(() => {
      return route.meta?.title || '运营总览'
    })
    
    // 处理登出
    const handleLogout = () => {
      safeExecute(() => {
        userStore.logout()
        router.push('/login')
      }, null)
    }
    
    // 导航到指定路径
    const navigateTo = (path) => {
      if (!path || typeof path !== 'string') {
        console.warn('Invalid navigation path')
        return
      }
      safeExecute(() => {
        router.push(path)
      }, null)
    }
    
    // 权限检查
    const hasPermission = computed(() => {
      return userStore.hasPermission
    })
    
    // 错误捕获
    onErrorCaptured((err, instance, info) => {
      console.error('Vue error captured:', err, info)
      return false
    })
    
    // 组件挂载时恢复会话
    onMounted(() => {
      safeExecute(() => {
        userStore.restoreSession()
      }, null)
    })
    
    return {
      userStore,
      pageTitle,
      handleLogout,
      navigateTo,
      hasPermission
    }
  },
  data() {
    return {
      expandedMenus: {
        sales: false,
        project: false,
        tech: false,
        srm: false,
        warehouse: false,
        quality: false,
        service: false,
        file: false,
        knowledge: false,
        setting: false,
        crm: false,
        reports: false,
        hr: false,
        admin: false,
        manufacturing: false,
        rd: false,
        finance: false
      }
    }
  },
  methods: {
    /**
     * 切换菜单展开/收起状态
     * @param {string} menuName - 菜单名称
     */
    toggleMenu(menuName) {
      if (!menuName || typeof menuName !== 'string') {
        console.warn('Invalid menu name')
        return
      }
      
      safeExecute(() => {
        if (this.expandedMenus.hasOwnProperty(menuName)) {
          this.expandedMenus[menuName] = !this.expandedMenus[menuName]
        }
      }, null)
    }
  }
}
</script>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 200px;
  background: #fff;
  border-right: 1px solid #eaeaea;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #eaeaea;
  display: flex;
  align-items: center;
}

.system-title {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.title-line1 {
  font-size: 18px;
  font-weight: bold;
  color: #165DFF;
}

.title-line2 {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.sidebar-nav {
  flex: 1;
  padding: 8px 0;
  overflow-y: auto;
  max-height: calc(100vh - 60px);
}

.sidebar-nav::-webkit-scrollbar {
  width: 6px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  color: #333;
  text-decoration: none;
  transition: all 0.3s;
  cursor: pointer;
}

.nav-item:hover {
  background: #f5f5f5;
}

.nav-item.active {
  border-left: 3px solid #165DFF;
  background: #eef5ff;
  color: #165DFF;
}

.rotate-icon {
  transform: rotate(180deg);
  transition: transform 0.3s;
}

.submenu {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-out;
  background: #f5f5f5;
}

.submenu.expanded {
  max-height: 500px;
  transition: max-height 0.3s ease-in;
}

.submenu-item {
  display: flex;
  align-items: center;
  padding: 10px 16px 10px 48px;
  color: #555;
  text-decoration: none;
  transition: all 0.3s;
  font-size: 14px;
}

.submenu-item:hover {
  background: #e8e8e8;
  color: #165DFF;
}

.submenu-item.active {
  background: #e8f0ff;
  color: #165DFF;
  border-left: 3px solid #165DFF;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  overflow: hidden;
  min-width: 0;
}

.main-header {
  padding: 0 20px;
  height: 60px;
  background: #fff;
  border-bottom: 1px solid #eaeaea;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.content-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .sidebar {
    width: 60px;
  }
  
  .sidebar-header h1,
  .nav-item span,
  .submenu {
    display: none;
  }
  
  .nav-item {
    justify-content: center;
    padding: 12px;
  }
  
  .nav-item i.w-6 {
    margin: 0;
  }
}
</style>