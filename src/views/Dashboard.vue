<template>
  <div class="dashboard">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon blue">
          <i class="fa fa-users"></i>
        </div>
        <div class="stat-content">
          <div class="stat-label">客户总数</div>
          <div class="stat-value">{{ stats.customerCount }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">
          <i class="fa fa-project-diagram"></i>
        </div>
        <div class="stat-content">
          <div class="stat-label">进行中项目</div>
          <div class="stat-value">{{ stats.projectCount }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">
          <i class="fa fa-chart-line"></i>
        </div>
        <div class="stat-content">
          <div class="stat-label">本月销售额</div>
          <div class="stat-value">{{ stats.salesAmount }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red">
          <i class="fa fa-file-alt"></i>
        </div>
        <div class="stat-content">
          <div class="stat-label">待审批单据</div>
          <div class="stat-value">{{ stats.pendingApprovals }}</div>
        </div>
      </div>
    </div>
    
    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-header">
          <h3>项目进度</h3>
        </div>
        <div class="chart-body">
          <canvas ref="projectChart"></canvas>
          <div v-if="chartError.project" class="chart-error">
            <i class="fa fa-exclamation-circle"></i>
            <span>图表加载失败</span>
          </div>
        </div>
      </div>
      <div class="chart-card">
        <div class="chart-header">
          <h3>销售漏斗</h3>
        </div>
        <div class="chart-body">
          <canvas ref="salesChart"></canvas>
          <div v-if="chartError.sales" class="chart-error">
            <i class="fa fa-exclamation-circle"></i>
            <span>图表加载失败</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Chart from 'chart.js/auto'
import { safeExecute, debounce } from '@/utils/helpers'
import api from '@/api'

export default {
  name: 'Dashboard',
  
  data() {
    return {
      stats: {
        customerCount: 0,
        projectCount: 0,
        salesAmount: '¥0万',
        pendingApprovals: 0
      },
      chartError: {
        project: false,
        sales: false
      },
      charts: {
        project: null,
        sales: null
      }
    }
  },

  mounted() {
    this.fetchStats()
    this.$nextTick(() => {
      this.initCharts()
    })
    window.addEventListener('resize', this.handleResize)
  },

  beforeUnmount() {
    this.destroyCharts()
    window.removeEventListener('resize', this.handleResize)
  },

  methods: {
    async fetchStats() {
      try {
        const response = await api.getDashboardStats()
        if (response.success) {
          this.stats = response.data
        }
      } catch (error) {
        console.error('获取统计数据失败:', error)
      }
    },

    initCharts() {
      this.initProjectChart()
      this.initSalesChart()
    },

    /**
     * 初始化项目进度图表
     */
    initProjectChart() {
      safeExecute(() => {
        const canvas = this.$refs.projectChart
        if (!canvas) {
          console.warn('Project chart canvas not found')
          this.chartError.project = true
          return
        }

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          console.warn('Cannot get 2d context for project chart')
          this.chartError.project = true
          return
        }

        // 如果已有图表实例，先销毁
        if (this.charts.project) {
          this.charts.project.destroy()
        }

        this.charts.project = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['设计阶段', '采购阶段', '生产阶段', '调试阶段', '验收阶段'],
            datasets: [{
              label: '项目数量',
              data: [8, 6, 4, 3, 3],
              backgroundColor: [
                'rgba(22, 93, 255, 0.7)',
                'rgba(22, 93, 255, 0.6)',
                'rgba(22, 93, 255, 0.5)',
                'rgba(22, 93, 255, 0.4)',
                'rgba(22, 93, 255, 0.3)'
              ],
              borderColor: 'rgba(22, 93, 255, 1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'top'
              },
              tooltip: {
                enabled: true
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  precision: 0,
                  stepSize: 1
                }
              }
            }
          }
        })

        this.chartError.project = false
      }, null)
    },

    /**
     * 初始化销售漏斗图表
     */
    initSalesChart() {
      safeExecute(() => {
        const canvas = this.$refs.salesChart
        if (!canvas) {
          console.warn('Sales chart canvas not found')
          this.chartError.sales = true
          return
        }

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          console.warn('Cannot get 2d context for sales chart')
          this.chartError.sales = true
          return
        }

        // 如果已有图表实例，先销毁
        if (this.charts.sales) {
          this.charts.sales.destroy()
        }

        this.charts.sales = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['线索', '初步沟通', '方案报价', '商务谈判', '成交'],
            datasets: [{
              label: '金额（万元）',
              data: [1200, 800, 500, 300, 150],
              backgroundColor: [
                'rgba(75, 192, 192, 0.7)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(75, 192, 192, 0.5)',
                'rgba(75, 192, 192, 0.4)',
                'rgba(75, 192, 192, 0.3)'
              ],
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'top'
              },
              tooltip: {
                enabled: true
              }
            },
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        })

        this.chartError.sales = false
      }, null)
    },

    /**
     * 销毁所有图表实例
     */
    destroyCharts() {
      safeExecute(() => {
        if (this.charts.project) {
          this.charts.project.destroy()
          this.charts.project = null
        }
        if (this.charts.sales) {
          this.charts.sales.destroy()
          this.charts.sales = null
        }
      }, null)
    },

    /**
     * 处理窗口大小变化
     */
    handleResize: debounce(function() {
      // Chart.js 会自动处理响应式调整
      // 这里可以添加额外的逻辑
    }, 250)
  }
}
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
  font-size: 20px;
}

.stat-icon.blue {
  background: #165DFF;
}

.stat-icon.green {
  background: #00B42A;
}

.stat-icon.orange {
  background: #FF7D00;
}

.stat-icon.red {
  background: #F53F3F;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.chart-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chart-header {
  margin-bottom: 16px;
}

.chart-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.chart-body {
  height: 300px;
  position: relative;
}

.chart-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #999;
}

.chart-error i {
  font-size: 32px;
  color: #F53F3F;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
