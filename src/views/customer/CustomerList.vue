<template>
  <div class="customer-management">
    <div class="page-header">
      <h2 class="page-title">CRM管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="addCustomer">
          <i class="fa fa-plus"></i> 新建客户
        </el-button>
        <el-button type="success" @click="scanBusinessCard">
          <i class="fa fa-id-card"></i> 名片扫描
        </el-button>
      </div>
    </div>

    <div class="statistics-cards">
      <div class="stat-card">
        <div class="stat-icon total"><i class="fa fa-building"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.totalCustomers || 0 }}</div>
          <div class="stat-label">客户总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon active"><i class="fa fa-check-circle"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.activeCustomers || 0 }}</div>
          <div class="stat-label">活跃客户</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon potential"><i class="fa fa-user-plus"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.potentialCustomers || 0 }}</div>
          <div class="stat-label">潜在客户</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon formal"><i class="fa fa-handshake"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.formalCustomers || 0 }}</div>
          <div class="stat-label">正式客户</div>
        </div>
      </div>
    </div>

    <div class="search-filter-bar">
      <div class="search-input">
        <el-input
          v-model="filters.keyword"
          placeholder="搜索客户名称、简称或联系人..."
          prefix-icon="el-icon-search"
          clearable
          @input="handleSearch"
        ></el-input>
      </div>
      <el-select v-model="filters.customerType" placeholder="客户类型" clearable @change="loadCustomers">
        <el-option label="潜在客户" value="potential"></el-option>
        <el-option label="正式客户" value="formal"></el-option>
        <el-option label="意向客户" value="intentional"></el-option>
      </el-select>
      <el-select v-model="filters.customerPoolType" placeholder="客户池" clearable @change="loadCustomers">
        <el-option label="公海客户" value="public"></el-option>
        <el-option label="私海客户" value="private"></el-option>
      </el-select>
      <el-select v-model="filters.status" placeholder="客户状态" clearable @change="loadCustomers">
        <el-option label="活跃" value="active"></el-option>
        <el-option label="冻结" value="frozen"></el-option>
        <el-option label="流失" value="lost"></el-option>
      </el-select>
      <el-select v-model="filters.level" placeholder="客户等级" clearable @change="loadCustomers">
        <el-option label="VIP" value="vip"></el-option>
        <el-option label="重点" value="important"></el-option>
        <el-option label="普通" value="normal"></el-option>
        <el-option label="低价值" value="low"></el-option>
      </el-select>
      <el-select v-model="filters.salesId" placeholder="跟进销售" clearable @change="loadCustomers">
        <el-option v-for="user in salesUsers" :key="user.id" :label="user.name" :value="user.id"></el-option>
      </el-select>
    </div>

    <div class="table-container">
      <el-table :data="customers" v-loading="loading" border stripe style="max-width: 100%;">
      <el-table-column prop="code" label="客户编码" width="120"></el-table-column>
      <el-table-column prop="name" label="客户名称" min-width="180" show-overflow-tooltip>
        <template #default="scope">
          <span class="customer-name" @click="viewCustomer(scope.row.id)">{{ scope.row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="short_name" label="简称" width="120" show-overflow-tooltip></el-table-column>
      <el-table-column prop="industry" label="所属行业" width="120">
        <template #default="scope">
          <span>{{ getIndustryText(scope.row.industry) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="customer_type" label="类型" width="100">
        <template #default="scope">
          <el-tag :type="getCustomerTypeTag(scope.row.customer_type)" size="small">
            {{ getCustomerTypeText(scope.row.customer_type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="customer_pool_type" label="客户池" width="100">
        <template #default="scope">
          <el-tag :type="getPoolTypeTag(scope.row.customer_pool_type)" size="small">
            {{ getPoolTypeText(scope.row.customer_pool_type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="tags" label="客户标签" width="150">
        <template #default="scope">
          <el-tag size="small" v-for="tag in scope.row.tags" :key="tag" class="mr-1">
            {{ getTagText(tag) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="level" label="等级" width="80">
        <template #default="scope">
          <el-tag :type="getLevelTag(scope.row.level)" size="small">{{ scope.row.level }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="company_scale" label="企业规模" width="120">
        <template #default="scope">
          <span>{{ getCompanyScaleText(scope.row.company_scale) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="contact_person" label="联系人" width="100"></el-table-column>
      <el-table-column prop="contact_phone" label="联系电话" width="130"></el-table-column>
      <el-table-column prop="sales_name" label="跟进销售" width="100"></el-table-column>
      <el-table-column prop="last_contact_date" label="最近联系" width="120">
        <template #default="scope">
          {{ formatDate(scope.row.last_contact_date) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="300" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" link @click="viewCustomer(scope.row.id)">详情</el-button>
          <el-button type="success" size="small" link @click="editCustomer(scope.row.id)">编辑</el-button>
          <el-button type="warning" size="small" link @click="addActivity(scope.row)">跟进</el-button>
          <el-button type="danger" size="small" link @click="deleteCustomer(scope.row.id)">删除</el-button>
          <!-- 公海客户可以领取 -->
          <el-button 
            v-if="scope.row.customer_pool_type === 'public'" 
            type="info" 
            size="small" 
            link 
            @click="claimCustomer(scope.row)">
            领取
          </el-button>
          <!-- 私海客户可以释放 -->
          <el-button 
            v-if="scope.row.customer_pool_type === 'private' && scope.row.sales_id === currentUserId" 
            type="danger" 
            size="small" 
            link 
            @click="releaseCustomer(scope.row)">
            释放
          </el-button>
          <!-- 管理员可以分配 -->
          <el-button 
            v-if="isManager" 
            type="primary" 
            size="small" 
            link 
            @click="assignCustomer(scope.row)">
            分配
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      ></el-pagination>
    </div>

    <el-dialog v-model="activityDialogVisible" title="添加跟进记录" width="600px">
      <el-form :model="activityForm" label-width="100px">
        <el-form-item label="跟进类型">
          <el-select v-model="activityForm.activity_type" placeholder="请选择">
            <el-option label="电话沟通" value="phone"></el-option>
            <el-option label="邮件往来" value="email"></el-option>
            <el-option label="拜访客户" value="visit"></el-option>
            <el-option label="产品演示" value="demo"></el-option>
            <el-option label="商务洽谈" value="negotiation"></el-option>
            <el-option label="合同签订" value="contract"></el-option>
            <el-option label="售后服务" value="service"></el-option>
            <el-option label="其他" value="other"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="跟进主题">
          <el-input v-model="activityForm.subject" placeholder="请输入跟进主题"></el-input>
        </el-form-item>
        <el-form-item label="跟进内容">
          <el-input v-model="activityForm.content" type="textarea" :rows="4" placeholder="请输入跟进内容"></el-input>
        </el-form-item>
        <el-form-item label="下次计划">
          <el-date-picker v-model="activityForm.next_plan_date" type="date" placeholder="选择日期"></el-date-picker>
        </el-form-item>
        <el-form-item label="计划内容">
          <el-input v-model="activityForm.next_plan_content" type="textarea" :rows="2" placeholder="下次跟进计划"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="activityDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitActivity">确定</el-button>
      </template>
    </el-dialog>

    <!-- 分配客户对话框 -->
    <el-dialog v-model="assignDialogVisible" title="分配客户" width="500px">
      <el-form :model="assignForm" label-width="100px">
        <el-form-item label="选择销售员" prop="salesId" required>
          <el-select v-model="assignForm.salesId" placeholder="请选择销售员" style="width: 100%">
            <el-option v-for="user in salesUsers" :key="user.id" :label="user.name" :value="user.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="assignForm.remarks" type="textarea" :rows="3" placeholder="请输入分配备注"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAssign">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import api from '@/api'
import axios from 'axios'

export default {
  name: 'CustomerList',
  data() {
    return {
      customers: [],
      salesUsers: [],
      statistics: {},
      filters: {
        keyword: '',
        customerType: '',
        customerPoolType: '',
        status: '',
        level: '',
        salesId: ''
      },
      currentPage: 1,
      pageSize: 20,
      pagination: {
        total: 0,
        totalPages: 0
      },
      loading: false,
      activityDialogVisible: false,
      assignDialogVisible: false,
      assignForm: {
        customerId: null,
        salesId: null,
        remarks: ''
      },
      activityForm: {
        activity_type: '',
        subject: '',
        content: '',
        next_plan_date: '',
        next_plan_content: ''
      },
      currentCustomerId: null,
      currentUserId: null,
      isManager: false
    }
  },
  computed: {
    // 当前登录用户ID
    getCurrentUserId() {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      return user.id || null
    }
  },
  mounted() {
    console.log('=== CustomerList组件挂载开始 ===')
    console.log('当前路由路径:', this.$route.path)
    console.log('当前组件名称:', this.$options.name)
    
    // 获取当前用户信息
    this.getCurrentUserInfo()
    
    // 延迟执行，确保组件完全挂载
    setTimeout(() => {
      console.log('开始直接加载客户列表(使用真实数据库API)')
      this.loadCustomers()
      console.log('开始加载统计数据')
      this.loadStatistics()
      console.log('开始加载销售用户')
      this.loadSalesUsers()
    }, 100)
    
    console.log('=== CustomerList组件挂载完成 ===')
  },
  methods: {
    async loadCustomers() {
      this.loading = true
      try {
        const params = {
          page: this.currentPage,
          limit: this.pageSize,
          ...this.filters
        }
        
        const response = await api.getCustomers(params)
        
        if (response && response.success) {
          // 检查响应数据的结构，兼容不同的API格式
          if (response.data && response.data.customers) {
            // 格式：{ success: true, data: { customers: [...], pagination: {...} } }
            this.customers = response.data.customers || []
            this.pagination = response.data.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 }
          } else if (response.customers) {
            // 格式：{ success: true, customers: [...], pagination: {...} }
            this.customers = response.customers || []
            this.pagination = response.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 }
          } else {
            // 默认格式
            this.customers = []
            this.pagination = { total: 0, page: 1, limit: 20, totalPages: 0 }
          }
        } else {
          this.$message.error(response?.message || '获取客户数据失败')
        }
      } catch (error) {
        console.error('获取客户数据异常:', error)
        this.$message.error('获取客户数据失败')
      } finally {
        this.loading = false
      }
    },
    async loadStatistics() {
      try {
        const response = await api.getCustomerStatistics()
        if (response.success) {
          this.statistics = response.data
        }
      } catch (error) {
        console.error('获取统计数据失败:', error)
      }
    },
    async loadSalesUsers() {
      try {
        const response = await api.getSalesUsers()
        if (response.success) {
          this.salesUsers = response.data
        }
      } catch (error) {
        console.error('获取销售用户失败:', error)
      }
    },
    handleSearch() {
      this.currentPage = 1
      this.loadCustomers()
    },
    handleSizeChange(size) {
      this.pageSize = size
      this.currentPage = 1
      this.loadCustomers()
    },
    handleCurrentChange(current) {
      this.currentPage = current
      this.loadCustomers()
    },
    addCustomer() {
      this.$router.push('/crm/add')
    },
    viewCustomer(id) {
      this.$router.push(`/crm/detail/${id}`)
    },
    editCustomer(id) {
      this.$router.push(`/crm/edit/${id}`)
    },
    async deleteCustomer(id) {
      try {
        await this.$confirm('确定要删除此客户吗？此操作不可恢复。', '删除确认', {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning'
        })
        const response = await api.deleteCustomer(id)
        if (response.success) {
          this.$message.success('删除成功')
          this.loadCustomers()
          this.loadStatistics()
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除客户失败:', error)
          this.$message.error('删除客户失败')
        }
      }
    },
    addActivity(customer) {
      this.currentCustomerId = customer.id
      this.activityForm = {
        activity_type: '',
        subject: '',
        content: '',
        next_plan_date: '',
        next_plan_content: ''
      }
      this.activityDialogVisible = true
    },
    async submitActivity() {
      if (!this.activityForm.activity_type) {
        this.$message.warning('请选择跟进类型')
        return
      }
      if (!this.activityForm.content) {
        this.$message.warning('请输入跟进内容')
        return
      }
      try {
        const response = await api.addCustomerActivity(this.currentCustomerId, this.activityForm)
        if (response.success) {
          this.$message.success('跟进记录添加成功')
          this.activityDialogVisible = false
          this.loadCustomers()
        }
      } catch (error) {
        console.error('添加跟进记录失败:', error)
        this.$message.error('添加跟进记录失败')
      }
    },
    scanBusinessCard() {
      this.$prompt('请将名片放置在摄像头前进行扫描，或手动输入名片信息', '名片扫描', {
        confirmButtonText: '开始扫描',
        cancelButtonText: '手动输入',
        inputPlaceholder: '或直接输入公司名称'
      }).then(({ value }) => {
        if (value) {
          this.$router.push({ path: '/crm/add', query: { name: value } })
        }
      }).catch(() => {
        this.$router.push('/crm/add')
      })
    },
    formatDate(date) {
      if (!date) return '-'
      return new Date(date).toLocaleDateString('zh-CN')
    },
    getCustomerTypeText(type) {
      const map = {
        potential: '潜在',
        formal: '正式',
        intentional: '意向'
      }
      return map[type] || type
    },
    getCustomerTypeTag(type) {
      const map = {
        potential: 'info',
        formal: 'success',
        intentional: 'warning'
      }
      return map[type] || 'info'
    },
    getLevelTag(level) {
      const map = {
        vip: 'danger',
        important: 'warning',
        normal: 'info',
        low: 'info'
      }
      return map[level] || 'info'
    },
    getIndustryText(industry) {
      const map = {
        '3c': '3C',
        'photovoltaic': '光伏',
        'new_energy': '新能源',
        'auto_parts': '汽配',
        'medical': '医疗',
        'food': '食品',
        'other': '其他'
      }
      return map[industry] || industry
    },
    getTagText(tag) {
      const map = {
        'end_customer': '终端客户',
        'integrator': '集成商',
        'trader': '贸易商',
        'peer_cooperation': '同行外协'
      }
      return map[tag] || tag
    },
    getCompanyScaleText(scale) {
      const map = {
        'micro': '微型 (< 20人)',
        'small': '小型 (20-100人)',
        'medium': '中型 (100-500人)',
        'large': '大型 (500-2000人)',
        'giant': '超大型 (> 2000人)'
      }
      return map[scale] || scale
    },
    // 获取客户池类型文本
    getPoolTypeText(type) {
      const map = {
        'public': '公海',
        'private': '私海'
      }
      return map[type] || type
    },
    // 获取客户池类型标签样式
    getPoolTypeTag(type) {
      const map = {
        'public': 'info',
        'private': 'success'
      }
      return map[type] || 'info'
    },
    // 获取当前用户信息
    getCurrentUserInfo() {
      let user = JSON.parse(localStorage.getItem('user') || '{}')
      // 如果没有用户信息，设置默认的管理员用户（管理员，ID为1）
      if (!user.id) {
        user = {
          id: 1,
          username: 'admin',
          name: '管理员',
          role: 'admin'
        }
        localStorage.setItem('user', JSON.stringify(user))
      }
      this.currentUserId = user.id || null
      // 检查是否为管理员或销售经理
      this.isManager = user.role === 'admin' || user.role === 'sales_manager'
    },
    // 领取公海客户
    async claimCustomer(customer) {
      try {
        await this.$confirm(`确定要领取客户 "${customer.name}" 吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        const response = await api.claimCustomer(customer.id)
        if (response.success) {
          this.$message.success('客户领取成功')
          this.loadCustomers()
          this.loadStatistics()
        } else {
          this.$message.error(response.message || '领取失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('领取客户失败:', error)
          this.$message.error('领取客户失败')
        }
      }
    },
    // 释放客户到公海
    async releaseCustomer(customer) {
      try {
        await this.$confirm(`确定要将客户 "${customer.name}" 释放到公海吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        const response = await api.releaseCustomer(customer.id)
        if (response.success) {
          this.$message.success('客户已释放到公海')
          this.loadCustomers()
          this.loadStatistics()
        } else {
          this.$message.error(response.message || '释放失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('释放客户失败:', error)
          this.$message.error('释放客户失败')
        }
      }
    },
    // 打开分配客户对话框
    assignCustomer(customer) {
      this.assignForm = {
        customerId: customer.id,
        salesId: null,
        remarks: ''
      }
      this.assignDialogVisible = true
    },
    // 提交分配客户
    async submitAssign() {
      if (!this.assignForm.salesId) {
        this.$message.warning('请选择要分配的销售员')
        return
      }
      
      try {
        const response = await api.assignCustomer(this.assignForm.customerId, {
          sales_id: this.assignForm.salesId,
          remarks: this.assignForm.remarks
        })
        
        if (response.success) {
          this.$message.success('客户分配成功')
          this.assignDialogVisible = false
          this.loadCustomers()
          this.loadStatistics()
        } else {
          this.$message.error(response.message || '分配失败')
        }
      } catch (error) {
        console.error('分配客户失败:', error)
        this.$message.error('分配客户失败')
      }
    }
  }
}
</script>

<style scoped>
.customer-management {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.statistics-cards {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 20px;
  color: #fff;
}

.stat-icon.total { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.stat-icon.active { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
.stat-icon.potential { background: linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%); }
.stat-icon.formal { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.stat-icon.week { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.search-filter-bar {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 250px;
}

.search-filter-bar .el-select {
  width: 140px;
}

.table-container {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  overflow-x: auto;
}

.table-container .el-table {
  width: auto;
  min-width: 100%;
}

.customer-name {
  color: #409eff;
  cursor: pointer;
  font-weight: 500;
}

.customer-name:hover {
  text-decoration: underline;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  background: #fff;
  padding: 16px;
  border-radius: 8px;
}
</style>
