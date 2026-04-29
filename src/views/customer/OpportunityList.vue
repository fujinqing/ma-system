<template>
  <div class="opportunity-management">
    <div class="page-header">
      <h2 class="page-title">商机项目管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="addOpportunity">
          <i class="fa fa-plus"></i> 新建商机
        </el-button>
      </div>
    </div>

    <div class="statistics-cards">
      <div class="stat-card">
        <div class="stat-icon total"><i class="fa fa-lightbulb"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.totalOpportunities || 0 }}</div>
          <div class="stat-label">商机总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon progress"><i class="fa fa-spinner"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.inProgressCount || 0 }}</div>
          <div class="stat-label">进行中</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon success"><i class="fa fa-trophy"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.wonCount || 0 }}</div>
          <div class="stat-label">成交</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon danger"><i class="fa fa-times-circle"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.lostCount || 0 }}</div>
          <div class="stat-label">丢单</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon warning"><i class="fa fa-percent"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.winRate || 0 }}%</div>
          <div class="stat-label">成交率</div>
        </div>
      </div>
    </div>

    <div class="search-filter-bar">
      <div class="search-input">
        <el-input
          v-model="filters.keyword"
          placeholder="搜索商机名称、编码或客户..."
          prefix-icon="el-icon-search"
          clearable
          @input="handleSearch"
        ></el-input>
      </div>
      <el-select v-model="filters.stage" placeholder="商机阶段" clearable @change="loadOpportunities">
        <el-option label="初步接洽" value="initial_contact"></el-option>
        <el-option label="需求确认" value="requirements"></el-option>
        <el-option label="方案报价" value="quotation"></el-option>
        <el-option label="技术评审" value="technical_review"></el-option>
        <el-option label="商务谈判" value="business_negotiation"></el-option>
        <el-option label="成交" value="won"></el-option>
        <el-option label="丢单" value="lost"></el-option>
      </el-select>
      <el-select v-model="filters.salesId" placeholder="负责人" clearable @change="loadOpportunities">
        <el-option v-for="user in salesUsers" :key="user.id" :label="user.name" :value="user.id"></el-option>
      </el-select>
    </div>

    <div class="table-container">
      <el-table :data="opportunities" v-loading="loading" border stripe>
        <el-table-column prop="opportunity_code" label="商机编码" width="130"></el-table-column>
        <el-table-column prop="name" label="商机名称" min-width="180" show-overflow-tooltip></el-table-column>
        <el-table-column prop="customer_name" label="关联客户" width="150" show-overflow-tooltip></el-table-column>
        <el-table-column prop="stage_name" label="阶段" width="100">
          <template #default="scope">
            <el-tag :type="getStageType(scope.row.stage)">{{ scope.row.stage_name || scope.row.stage }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="budget_amount" label="预算(万)" width="100">
          <template #default="scope">
            {{ scope.row.budget_amount ? scope.row.budget_amount.toFixed(2) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="delivery_cycle" label="交付周期(天)" width="100"></el-table-column>
        <el-table-column prop="sales_name" label="负责人" width="100"></el-table-column>
        <el-table-column prop="priority" label="优先级" width="80">
          <template #default="scope">
            <el-tag size="small" :type="getPriorityType(scope.row.priority)">
              {{ getPriorityText(scope.row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="120">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" link @click="viewOpportunity(scope.row.id)">详情</el-button>
            <el-button type="success" size="small" link @click="editOpportunity(scope.row.id)">编辑</el-button>
            <el-button type="warning" size="small" link @click="changeStage(scope.row)">变更阶段</el-button>
            <el-button type="danger" size="small" link @click="deleteOpportunity(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          layout="total, prev, pager, next"
          :total="pagination.total"
          @current-change="loadOpportunities"
        ></el-pagination>
      </div>
    </div>

    <!-- 阶段变更对话框 -->
    <el-dialog v-model="stageDialogVisible" title="变更商机阶段" width="500px">
      <el-form :model="stageForm" label-width="100px">
        <el-form-item label="当前阶段">
          <el-tag :type="getStageType(currentOpportunity?.stage)">
            {{ currentOpportunity?.stage_name || currentOpportunity?.stage }}
          </el-tag>
        </el-form-item>
        <el-form-item label="新阶段" required>
          <el-select v-model="stageForm.stage" placeholder="请选择新阶段">
            <el-option label="初步接洽" value="initial_contact"></el-option>
            <el-option label="需求确认" value="requirements"></el-option>
            <el-option label="方案报价" value="quotation"></el-option>
            <el-option label="技术评审" value="technical_review"></el-option>
            <el-option label="商务谈判" value="business_negotiation"></el-option>
            <el-option label="成交" value="won"></el-option>
            <el-option label="丢单" value="lost"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="丢单原因" v-if="stageForm.stage === 'lost'">
          <el-input v-model="stageForm.lost_reason" type="textarea" rows="3"></el-input>
        </el-form-item>
        <el-form-item label="丢单竞争对手" v-if="stageForm.stage === 'lost'">
          <el-input v-model="stageForm.lost_competitor"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="stageDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitStageChange">确定变更</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import api from '@/api'

export default {
  name: 'OpportunityList',
  data() {
    return {
      opportunities: [],
      statistics: {},
      salesUsers: [],
      loading: false,
      currentPage: 1,
      pageSize: 20,
      pagination: {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0
      },
      filters: {
        keyword: '',
        stage: '',
        salesId: ''
      },
      stageDialogVisible: false,
      currentOpportunity: null,
      stageForm: {
        stage: '',
        lost_reason: '',
        lost_competitor: ''
      }
    }
  },
  mounted() {
    this.loadOpportunities()
    this.loadStatistics()
    this.loadSalesUsers()
  },
  methods: {
    async loadOpportunities() {
      this.loading = true
      try {
        const params = {
          page: this.currentPage,
          limit: this.pageSize,
          ...this.filters
        }
        const response = await api.getOpportunities(params)
        if (response && response.success) {
          this.opportunities = response.data.opportunities || []
          this.pagination = response.data.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 }
        }
      } catch (error) {
        console.warn('获取商机列表失败:', error)
      } finally {
        this.loading = false
      }
    },
    async loadStatistics() {
      try {
        const response = await api.getOpportunityStatistics()
        if (response && response.success) {
          this.statistics = response.data
        }
      } catch (error) {
        console.warn('获取商机统计失败:', error)
      }
    },
    async loadSalesUsers() {
      try {
        const response = await api.getSalesUsers()
        if (response && response.success) {
          this.salesUsers = response.data
        }
      } catch (error) {
        console.warn('获取销售用户失败:', error)
      }
    },
    handleSearch() {
      this.currentPage = 1
      this.loadOpportunities()
    },
    addOpportunity() {
      this.$router.push('/crm/opportunities/add')
    },
    viewOpportunity(id) {
      this.$router.push(`/crm/opportunities/detail/${id}`)
    },
    editOpportunity(id) {
      this.$router.push(`/crm/opportunities/edit/${id}`)
    },
    changeStage(opportunity) {
      this.currentOpportunity = opportunity
      this.stageForm = {
        stage: '',
        lost_reason: '',
        lost_competitor: ''
      }
      this.stageDialogVisible = true
    },
    async submitStageChange() {
      if (!this.stageForm.stage) {
        this.$message.warning('请选择新阶段')
        return
      }
      try {
        const response = await api.changeOpportunityStage(this.currentOpportunity.id, this.stageForm)
        if (response && response.success) {
          this.$message.success('阶段变更成功')
          this.stageDialogVisible = false
          this.loadOpportunities()
          this.loadStatistics()
        } else {
          this.$message.error(response?.message || '阶段变更失败')
        }
      } catch (error) {
        console.warn('变更商机阶段失败:', error)
        this.$message.error('阶段变更失败')
      }
    },
    async deleteOpportunity(id) {
      try {
        await this.$confirm('确定要删除此商机吗？此操作不可恢复。', '删除确认', {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning'
        })
        const response = await api.deleteOpportunity(id)
        if (response && response.success) {
          this.$message.success('删除成功')
          this.loadOpportunities()
          this.loadStatistics()
        } else {
          this.$message.error(response?.message || '删除失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.warn('删除商机失败:', error)
          this.$message.error('删除商机失败')
        }
      }
    },
    getStageType(stage) {
      const typeMap = {
        'initial_contact': 'info',
        'requirements': 'primary',
        'quotation': 'warning',
        'technical_review': 'warning',
        'business_negotiation': 'warning',
        'won': 'success',
        'lost': 'danger'
      }
      return typeMap[stage] || 'info'
    },
    getPriorityType(priority) {
      const typeMap = {
        'urgent': 'danger',
        'important': 'warning',
        'normal': 'primary',
        'low': 'info'
      }
      return typeMap[priority] || 'primary'
    },
    getPriorityText(priority) {
      const textMap = {
        'urgent': '紧急',
        'important': '重要',
        'normal': '普通',
        'low': '低'
      }
      return textMap[priority] || priority || '普通'
    },
    formatDate(date) {
      if (!date) return '-'
      const d = new Date(date)
      return d.toLocaleDateString('zh-CN')
    }
  }
}
</script>

<style scoped>
.opportunity-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.statistics-cards {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  min-width: 150px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
}

.stat-icon.total { background: #409EFF; }
.stat-icon.progress { background: #E6A23C; }
.stat-icon.success { background: #67C23A; }
.stat-icon.danger { background: #F56C6C; }
.stat-icon.warning { background: #909399; }

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.search-filter-bar {
  background: #fff;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.table-container {
  background: #fff;
  border-radius: 8px;
  padding: 15px;
}

.pagination-container {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}
</style>
