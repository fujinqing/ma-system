<template>
  <div class="crm-dashboard">
    <div class="page-header">
      <h2 class="page-title">CRM数据统计看板</h2>
      <div class="header-actions">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="loadAllData"
        ></el-date-picker>
        <el-button type="primary" @click="exportReport">
          <i class="fa fa-download"></i> 导出报表
        </el-button>
      </div>
    </div>

    <div class="statistics-cards">
      <div class="stat-card">
        <div class="stat-icon total"><i class="fa fa-users"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.totalCustomers || 0 }}</div>
          <div class="stat-label">客户总量</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon success"><i class="fa fa-user-plus"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.newCustomers || 0 }}</div>
          <div class="stat-label">本月新增</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon warning"><i class="fa fa-lightbulb"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.totalOpportunities || 0 }}</div>
          <div class="stat-label">商机总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon info"><i class="fa fa-trophy"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.wonOpportunities || 0 }}</div>
          <div class="stat-label">成交商机</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon danger"><i class="fa fa-percent"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.winRate || 0 }}%</div>
          <div class="stat-label">成交率</div>
        </div>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>客户等级分布</span>
            </div>
          </template>
          <div class="chart-content">
            <div v-if="levelDistribution.length > 0" class="bar-chart">
              <div v-for="item in levelDistribution" :key="item.level" class="bar-item">
                <div class="bar-label">{{ item.level || '未分级' }}</div>
                <div class="bar-wrapper">
                  <div class="bar-fill" :style="{ width: getBarWidth(item.count) + '%', backgroundColor: getBarColor(item.level) }"></div>
                </div>
                <div class="bar-value">{{ item.count }}</div>
              </div>
            </div>
            <div v-else class="empty-chart">暂无数据</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>客户类型分布</span>
            </div>
          </template>
          <div class="chart-content">
            <div v-if="typeDistribution.length > 0" class="bar-chart">
              <div v-for="item in typeDistribution" :key="item.customer_type" class="bar-item">
                <div class="bar-label">{{ item.customer_type || '未知' }}</div>
                <div class="bar-wrapper">
                  <div class="bar-fill" :style="{ width: getBarWidth(item.count) + '%' }"></div>
                </div>
                <div class="bar-value">{{ item.count }}</div>
              </div>
            </div>
            <div v-else class="empty-chart">暂无数据</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>商机阶段分布</span>
            </div>
          </template>
          <div class="chart-content">
            <div v-if="opportunityStages.length > 0" class="stage-chart">
              <div v-for="(stage, index) in opportunityStages" :key="stage.stage" class="stage-item">
                <div class="stage-icon" :style="{ backgroundColor: stageColors[index % stageColors.length] }">
                  {{ index + 1 }}
                </div>
                <div class="stage-info">
                  <div class="stage-name">{{ stage.stage_name }}</div>
                  <div class="stage-count">{{ stage.count }}个</div>
                </div>
                <div class="stage-percent">{{ getStagePercent(stage.count) }}%</div>
              </div>
            </div>
            <div v-else class="empty-chart">暂无数据</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>销售业绩排行 TOP10</span>
            </div>
          </template>
          <div class="chart-content">
            <div v-if="salesRanking.length > 0" class="ranking-list">
              <div v-for="(item, index) in salesRanking" :key="item.sales_id" class="ranking-item">
                <div class="ranking-index" :class="{ 'top-3': index < 3 }">{{ index + 1 }}</div>
                <div class="ranking-info">
                  <div class="ranking-name">{{ item.sales_name }}</div>
                  <div class="ranking-detail">{{ item.customer_count }}个客户 | {{ item.opportunity_count }}个商机</div>
                </div>
                <div class="ranking-value">{{ item.won_amount || 0 }}万</div>
              </div>
            </div>
            <div v-else class="empty-chart">暂无数据</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>最近活动动态</span>
            </div>
          </template>
          <el-table :data="recentActivities" border stripe>
            <el-table-column prop="customer_name" label="客户" width="150"></el-table-column>
            <el-table-column prop="activity_type" label="活动类型" width="120">
              <template #default="scope">
                <el-tag size="small">{{ getActivityTypeText(scope.row.activity_type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="content" label="活动内容" min-width="200" show-overflow-tooltip></el-table-column>
            <el-table-column prop="created_at" label="时间" width="160">
              <template #default="scope">
                {{ formatDateTime(scope.row.created_at) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import api from '@/api'

export default {
  name: 'CRMDashboard',
  data() {
    return {
      dateRange: [],
      statistics: {},
      levelDistribution: [],
      typeDistribution: [],
      opportunityStages: [],
      salesRanking: [],
      recentActivities: [],
      stageColors: ['#409EFF', '#67C23A', '#E6A23C', '#909399', '#F56C6C', '#353535', '#165DFF']
    }
  },
  mounted() {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    this.dateRange = [firstDay, now]
    this.loadAllData()
  },
  methods: {
    async loadAllData() {
      await Promise.all([
        this.loadStatistics(),
        this.loadLevelDistribution(),
        this.loadTypeDistribution(),
        this.loadOpportunityStages(),
        this.loadSalesRanking(),
        this.loadRecentActivities()
      ])
    },
    async loadStatistics() {
      try {
        const [customerRes, opportunityRes] = await Promise.all([
          api.getCustomerStatistics(),
          api.getOpportunityStatistics()
        ])

        if (customerRes && customerRes.success) {
          const data = customerRes.data || {}
          this.statistics = {
            totalCustomers: data.totalCustomers || 0,
            newCustomers: data.newCustomersThisMonth || 0,
            totalOpportunities: opportunityRes?.data?.totalOpportunities || 0,
            wonOpportunities: opportunityRes?.data?.wonCount || 0,
            winRate: opportunityRes?.data?.winRate || 0
          }
        }
      } catch (error) {
        console.warn('获取统计数据失败:', error)
      }
    },
    async loadLevelDistribution() {
      try {
        const response = await api.getCustomers({ page: 1, limit: 1000 })
        if (response && response.success) {
          const customers = response.data?.customers || response.customers || []
          const levelMap = {}
          customers.forEach(c => {
            const level = c.level || '未分级'
            levelMap[level] = (levelMap[level] || 0) + 1
          })
          this.levelDistribution = Object.entries(levelMap).map(([level, count]) => ({ level, count }))
        }
      } catch (error) {
        console.warn('获取等级分布失败:', error)
      }
    },
    async loadTypeDistribution() {
      try {
        const response = await api.getCustomers({ page: 1, limit: 1000 })
        if (response && response.success) {
          const customers = response.data?.customers || response.customers || []
          const typeMap = {}
          customers.forEach(c => {
            const type = c.customer_type || '未知'
            typeMap[type] = (typeMap[type] || 0) + 1
          })
          this.typeDistribution = Object.entries(typeMap).map(([customer_type, count]) => ({ customer_type, count }))
        }
      } catch (error) {
        console.warn('获取类型分布失败:', error)
      }
    },
    async loadOpportunityStages() {
      try {
        const response = await api.getOpportunities({ page: 1, limit: 100 })
        if (response && response.success) {
          const opportunities = response.data?.opportunities || []
          const stageMap = {}
          const stageNames = {
            'initial_contact': '初步接洽',
            'requirements': '需求确认',
            'quotation': '方案报价',
            'technical_review': '技术评审',
            'business_negotiation': '商务谈判',
            'won': '成交',
            'lost': '丢单'
          }
          opportunities.forEach(o => {
            const stage = o.stage || 'unknown'
            stageMap[stage] = (stageMap[stage] || 0) + 1
          })
          this.opportunityStages = Object.entries(stageMap).map(([stage, count]) => ({
            stage,
            stage_name: stageNames[stage] || stage,
            count
          }))
        }
      } catch (error) {
        console.warn('获取商机阶段分布失败:', error)
      }
    },
    async loadSalesRanking() {
      try {
        const response = await api.getSalesStatistics()
        if (response && response.success) {
          this.salesRanking = response.data?.slice(0, 10) || []
        }
      } catch (error) {
        console.warn('获取销售排行失败:', error)
      }
    },
    async loadRecentActivities() {
      try {
        const response = await api.getCustomers({ page: 1, limit: 50 })
        if (response && response.success) {
          const customers = response.data?.customers || response.customers || []
          this.recentActivities = customers.slice(0, 10).map(c => ({
            customer_name: c.name,
            activity_type: 'visit',
            content: c.remarks || '客户信息更新',
            created_at: c.updated_at
          }))
        }
      } catch (error) {
        console.warn('获取最近活动失败:', error)
      }
    },
    getBarWidth(count) {
      if (!this.levelDistribution.length) return 0
      const max = Math.max(...this.levelDistribution.map(d => d.count))
      return max > 0 ? (count / max) * 100 : 0
    },
    getBarColor(level) {
      const colors = { 'A级': '#67C23A', 'B级': '#E6A23C', 'C级': '#909399', 'D级': '#F56C6C' }
      return colors[level] || '#409EFF'
    },
    getStagePercent(count) {
      if (!this.opportunityStages.length) return 0
      const total = this.opportunityStages.reduce((sum, s) => sum + s.count, 0)
      return total > 0 ? ((count / total) * 100).toFixed(1) : 0
    },
    getActivityTypeText(type) {
      const textMap = {
        'visit': '拜访',
        'call': '电话',
        'email': '邮件',
        'meeting': '会议'
      }
      return textMap[type] || type
    },
    formatDateTime(date) {
      if (!date) return '-'
      const d = new Date(date)
      return d.toLocaleString('zh-CN')
    },
    exportReport() {
      this.$message.success('报表导出功能开发中')
    }
  }
}
</script>

<style scoped>
.crm-dashboard {
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

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
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
  min-width: 140px;
  flex: 1;
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
.stat-icon.success { background: #67C23A; }
.stat-icon.warning { background: #E6A23C; }
.stat-icon.info { background: #909399; }
.stat-icon.danger { background: #F56C6C; }

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

.chart-card {
  height: 100%;
}

.card-header {
  font-weight: bold;
}

.chart-content {
  min-height: 200px;
}

.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bar-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bar-label {
  width: 60px;
  font-size: 13px;
  color: #606266;
}

.bar-wrapper {
  flex: 1;
  height: 20px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: #409EFF;
  transition: width 0.3s;
}

.bar-value {
  width: 50px;
  text-align: right;
  font-size: 13px;
  font-weight: bold;
}

.empty-chart {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #909399;
}

.stage-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stage-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stage-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  font-weight: bold;
}

.stage-info {
  flex: 1;
}

.stage-name {
  font-size: 13px;
  color: #303133;
}

.stage-count {
  font-size: 11px;
  color: #909399;
}

.stage-percent {
  font-size: 13px;
  font-weight: bold;
  color: #409EFF;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: #f9f9f9;
  border-radius: 4px;
}

.ranking-index {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: #666;
}

.ranking-index.top-3 {
  background: #F56C6C;
  color: #fff;
}

.ranking-info {
  flex: 1;
}

.ranking-name {
  font-size: 13px;
  color: #303133;
  font-weight: bold;
}

.ranking-detail {
  font-size: 11px;
  color: #909399;
}

.ranking-value {
  font-size: 14px;
  font-weight: bold;
  color: #67C23A;
}
</style>
