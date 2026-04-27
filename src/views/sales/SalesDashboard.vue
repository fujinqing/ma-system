<template>
  <div class="sales-dashboard">
    <div class="page-header">
      <h2 class="page-title">销售仪表盘</h2>
      <div class="header-actions">
        <div class="date-range">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="handleDateChange"
          ></el-date-picker>
        </div>
        <el-button type="info" @click="toggleFullscreen">
          <i :class="isFullscreen ? 'fa fa-compress' : 'fa fa-expand'"></i>
          {{ isFullscreen ? '退出全屏' : '全屏' }}
        </el-button>
      </div>
    </div>
    
    <div class="dashboard-grid">
      <div class="dashboard-card">
        <div class="card-header">
          <h3>潜在客户</h3>
          <span class="card-icon"><i class="fa fa-user-plus"></i></span>
        </div>
        <div class="card-content">
          <div class="card-value">{{ potentialCustomers }}</div>
          <div class="card-subtitle">客户资料中的客户</div>
        </div>
      </div>
      
      <div class="dashboard-card">
        <div class="card-header">
          <h3>方案及报价阶段</h3>
          <span class="card-icon"><i class="fa fa-file-alt"></i></span>
        </div>
        <div class="card-content">
          <div class="card-value">{{ quoteStageProjects }}</div>
          <div class="card-subtitle">方案更进 + 价格计算</div>
        </div>
      </div>
      
      <div class="dashboard-card">
        <div class="card-header">
          <h3>订单签约</h3>
          <span class="card-icon"><i class="fa fa-handshake"></i></span>
        </div>
        <div class="card-content">
          <div class="card-value">{{ signedProjects }}</div>
          <div class="card-subtitle">已签约订单</div>
        </div>
      </div>
      
      <div class="dashboard-card">
        <div class="card-header">
          <h3>总销售额</h3>
          <span class="card-icon"><i class="fa fa-money"></i></span>
        </div>
        <div class="card-content">
          <div class="card-value">{{ totalSales }}</div>
          <div class="card-change positive">+12.5%</div>
        </div>
      </div>
    </div>
    
    <div class="chart-container">
      <el-card class="chart-card">
        <template #header>
          <div class="chart-header">
            <span>销售漏斗</span>
          </div>
        </template>
        <div class="chart-content">
          <div class="funnel-chart">
            <div class="funnel-item" @click="showPotentialCustomers">
              <div class="funnel-bar" :style="{ width: '100%', backgroundColor: '#165DFF' }">
                <span class="funnel-label">潜在客户</span>
                <span class="funnel-value">{{ potentialCustomers }}</span>
              </div>
            </div>
            <div class="funnel-item" @click="showQuoteStageProjects">
              <div class="funnel-bar" :style="{ width: '70%', backgroundColor: '#69c0ff' }">
                <span class="funnel-label">方案及报价阶段</span>
                <span class="funnel-value">{{ quoteStageProjects }}</span>
              </div>
            </div>
            <div class="funnel-item" @click="showSignedProjects">
              <div class="funnel-bar" :style="{ width: '40%', backgroundColor: '#95de64' }">
                <span class="funnel-label">订单签约</span>
                <span class="funnel-value">{{ signedProjects }}</span>
              </div>
            </div>
          </div>
        </div>
      </el-card>
      
      <el-card class="chart-card">
        <template #header>
          <div class="chart-header">
            <span>销售趋势</span>
          </div>
        </template>
        <div class="chart-content">
          <canvas ref="salesTrendChart"></canvas>
        </div>
      </el-card>
    </div>
    
    <!-- 潜在客户列表对话框 -->
    <el-dialog
      v-model="customerDialogVisible"
      :title="dialogTitle"
      width="70%"
      destroy-on-close
    >
      <el-table :data="customerList" style="width: 100%" border>
        <el-table-column prop="index" label="序号" width="80" align="center"></el-table-column>
        <el-table-column prop="name" label="客户名称" min-width="200"></el-table-column>
        <el-table-column prop="contactPerson" label="联系人" width="120"></el-table-column>
        <el-table-column prop="phone" label="联系电话" width="150"></el-table-column>
        <el-table-column prop="salesName" label="跟进销售" width="120"></el-table-column>
      </el-table>
    </el-dialog>
    
    <!-- 方案及报价阶段项目列表对话框 -->
    <el-dialog
      v-model="quoteDialogVisible"
      title="方案及报价阶段项目"
      width="80%"
      destroy-on-close
    >
      <el-table :data="quoteStageList" style="width: 100%" border>
        <el-table-column prop="id" label="编号" width="120"></el-table-column>
        <el-table-column prop="projectName" label="项目名称" min-width="180"></el-table-column>
        <el-table-column prop="customerName" label="客户名称" min-width="150"></el-table-column>
        <el-table-column prop="stage" label="阶段" width="120">
          <template #default="scope">
            <el-tag v-if="scope.row.stage === 'solution'" type="warning">方案阶段</el-tag>
            <el-tag v-else type="primary">报价阶段</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 'pending'" type="info">待处理</el-tag>
            <el-tag v-else-if="scope.row.status === 'processing'" type="warning">进行中</el-tag>
            <el-tag v-else type="success">已完成</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalPrice" label="报价金额" width="120" align="right">
          <template #default="scope">
            <span>{{ scope.row.totalPrice ? '¥' + scope.row.totalPrice.toLocaleString() : '-' }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
import Chart from 'chart.js/auto'
import { useUserStore } from '../../store/modules/user'
import api from '../../api'

export default {
  name: 'SalesDashboard',
  data() {
    return {
      dateRange: ['2026-01-01', '2026-03-31'],
      totalSales: '¥0',
      totalOrders: 0,
      potentialCustomers: 0,
      quoteStageProjects: 0,
      signedProjects: 0,
      conversionRate: 0,
      salesTrendChart: null,
      customerDialogVisible: false,
      quoteDialogVisible: false,
      contractDialogVisible: false,
      dialogTitle: '潜在客户列表',
      customerList: [],
      quoteStageList: [],
      contractList: [],
      loading: false,
      isFullscreen: false
    }
  },
  mounted() {
    this.loadDashboardData()
    this.initCharts()
    document.addEventListener('fullscreenchange', this.handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', this.handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', this.handleFullscreenChange)
  },
  beforeUnmount() {
    if (this.salesTrendChart) this.salesTrendChart.destroy()
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange)
    document.removeEventListener('webkitfullscreenchange', this.handleFullscreenChange)
    document.removeEventListener('mozfullscreenchange', this.handleFullscreenChange)
    document.removeEventListener('MSFullscreenChange', this.handleFullscreenChange)
  },
  methods: {
    async loadDashboardData() {
      this.loading = true
      try {
        // 从API获取销售仪表盘数据
        const response = await api.getSalesDashboard()
        if (response.success) {
          const data = response.data
          this.potentialCustomers = data.potentialCustomers
          this.quoteStageProjects = data.quoteStageProjects
          this.signedProjects = data.signedProjects
          this.totalSales = data.totalSales
          
          // 计算转化率
          if (this.potentialCustomers > 0) {
            this.conversionRate = (this.signedProjects / this.potentialCustomers * 100).toFixed(1)
          } else {
            this.conversionRate = 0
          }
        }
      } catch (error) {
        console.error('获取销售仪表盘数据失败:', error)
        this.$message.error('获取销售仪表盘数据失败')
      } finally {
        this.loading = false
      }
    },
    async loadCustomerList() {
      try {
        const response = await api.getCustomers()
        if (response.success) {
          this.customerList = response.data.customers
        }
      } catch (error) {
        console.error('获取客户列表失败:', error)
        this.$message.error('获取客户列表失败')
      }
    },
    async loadQuoteStageList() {
      try {
        // 同时获取价格计算表和报价单数据
        const [priceCalcResponse, quoteResponse] = await Promise.all([
          api.getPriceCalculations(),
          api.getQuotations()
        ])
        
        // 合并数据
        const priceCalcs = priceCalcResponse.success ? priceCalcResponse.data : []
        const quotes = quoteResponse.success ? quoteResponse.data : []
        
        // 构建统一格式的列表数据
        this.quoteStageList = [
          ...priceCalcs.map(item => ({
            id: item.id,
            type: 'price_calculation',
            number: item.code,
            projectName: item.project_name,
            customerName: item.customer_name,
            totalPrice: item.total_amount,
            status: item.status,
            salesName: item.sales_name,
            createDate: item.created_at
          })),
          ...quotes.map(item => ({
            id: item.id,
            type: 'quotation',
            number: item.quotation_number,
            projectName: item.project_name,
            customerName: item.customer_name,
            totalPrice: item.total_amount,
            status: item.status,
            salesName: item.sales_name,
            createDate: item.created_at
          }))
        ].sort((a, b) => new Date(b.createDate) - new Date(a.createDate))
      } catch (error) {
        console.error('获取方案及报价阶段数据失败:', error)
        this.$message.error('获取方案及报价阶段数据失败')
      }
    },
    async loadContractList() {
      try {
        const response = await api.getContracts()
        if (response.success) {
          this.contractList = response.data.map(item => ({
            id: item.id,
            number: item.contract_number,
            projectName: item.project_name,
            customerName: item.customer_name,
            totalPrice: item.total_amount,
            status: item.status,
            salesName: item.sales_name,
            createDate: item.created_at
          }))
        }
      } catch (error) {
        console.error('获取合同列表失败:', error)
        this.$message.error('获取合同列表失败')
      }
    },
    handleDateChange() {
      console.log('日期范围变化:', this.dateRange)
    },
    async showPotentialCustomers() {
      this.dialogTitle = '潜在客户列表'
      this.customerDialogVisible = true
      await this.loadCustomerList()
    },
    async showQuoteStageProjects() {
      this.dialogTitle = '方案及报价阶段列表'
      this.quoteDialogVisible = true
      await this.loadQuoteStageList()
    },
    async showSignedProjects() {
      this.dialogTitle = '已签约项目列表'
      this.contractDialogVisible = true
      await this.loadContractList()
    },
    initCharts() {
      this.initSalesTrendChart()
    },
    initSalesTrendChart() {
      const ctx = this.$refs.salesTrendChart
      if (!ctx) return
      
      this.salesTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
          datasets: [
            {
              label: '2026年',
              data: [120000, 190000, 300000, 250000, 280000, 350000],
              borderColor: '#165DFF',
              backgroundColor: 'rgba(22, 93, 255, 0.1)',
              tension: 0.4,
              fill: true
            },
            {
              label: '2025年',
              data: [100000, 150000, 220000, 200000, 230000, 280000],
              borderColor: '#909399',
              backgroundColor: 'rgba(144, 147, 153, 0.1)',
              tension: 0.4,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top'
            },
            tooltip: {
              mode: 'index',
              intersect: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return '¥' + (value / 10000) + '万'
                }
              }
            }
          }
        }
      })
    },
    showPotentialCustomers() {
      this.dialogTitle = '潜在客户列表'
      this.customerList = this.customers.map((customer, index) => ({
        index: index + 1,
        name: customer.name,
        contactPerson: customer.contactPerson,
        phone: customer.phone,
        salesName: customer.salesName
      }))
      this.customerDialogVisible = true
    },
    showQuoteStageProjects() {
      // 合并方案更进表和价格计算表的数据
      const solutionList = this.solutions
        .filter(s => s.status === 'processing' || s.status === 'pending')
        .map(s => ({
          id: s.id,
          projectName: s.projectName,
          customerName: s.customerName,
          stage: 'solution',
          status: s.status,
          totalPrice: null
        }))
      
      const priceCalcList = this.priceCalculations
        .filter(p => p.status === 'processing' || p.status === 'pending')
        .map(p => ({
          id: p.id,
          projectName: p.projectName,
          customerName: p.customerName,
          stage: 'quote',
          status: p.status,
          totalPrice: p.totalPrice
        }))
      
      this.quoteStageList = [...solutionList, ...priceCalcList]
      this.quoteDialogVisible = true
    },
    showSignedProjects() {
      this.dialogTitle = '已签约项目列表'
      this.customerList = this.contracts
        .filter(c => c.status === 'signed')
        .map((contract, index) => ({
          index: index + 1,
          name: contract.customerName,
          projectName: contract.projectName,
          amount: contract.amount,
          contractId: contract.id
        }))
      this.customerDialogVisible = true
    },
    toggleFullscreen() {
      if (!this.isFullscreen) {
        const elem = document.documentElement
        if (elem.requestFullscreen) {
          elem.requestFullscreen()
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen()
        } else if (elem.mozRequestFullScreen) {
          elem.mozRequestFullScreen()
        } else if (elem.msRequestFullscreen) {
          elem.msRequestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen()
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen()
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen()
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen()
        }
      }
    },
    handleFullscreenChange() {
      const isFullscreen = !!(document.fullscreenElement || 
                             document.webkitFullscreenElement || 
                             document.mozFullScreenElement || 
                             document.msFullscreenElement)
      this.isFullscreen = isFullscreen
    }
  }
}
</script>

<style scoped>
.sales-dashboard {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.dashboard-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  cursor: pointer;
}

.dashboard-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.card-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  opacity: 0.9;
}

.card-icon {
  font-size: 20px;
  opacity: 0.8;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.card-value {
  font-size: 24px;
  font-weight: 600;
}

.card-subtitle {
  font-size: 12px;
  opacity: 0.8;
}

.card-change {
  font-size: 12px;
  font-weight: 500;
}

.card-change.positive {
  color: #95de64;
}

.card-change.negative {
  color: #ff7875;
}

.chart-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.chart-card {
  height: 400px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-content {
  height: 350px;
  position: relative;
}

.chart-content canvas {
  width: 100% !important;
  height: 100% !important;
}

.funnel-chart {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  gap: 20px;
  padding: 20px;
}

.funnel-item {
  width: 100%;
  cursor: pointer;
  transition: all 0.3s ease;
}

.funnel-item:hover {
  transform: scale(1.02);
}

.funnel-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-radius: 8px;
  color: #fff;
  min-width: 200px;
  transition: all 0.3s ease;
}

.funnel-label {
  font-size: 14px;
  font-weight: 500;
}

.funnel-value {
  font-size: 18px;
  font-weight: 600;
}

@media (max-width: 1200px) {
  .chart-container {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}

@media (max-width: 480px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>