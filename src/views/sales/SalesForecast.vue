<template>
  <div class="sales-forecast">
    <div class="page-header">
      <h2 class="page-title">销售预测</h2>
      <div class="forecast-controls">
        <el-select v-model="forecastPeriod" placeholder="预测周期">
          <el-option label="月度" value="monthly"></el-option>
          <el-option label="季度" value="quarterly"></el-option>
          <el-option label="年度" value="yearly"></el-option>
        </el-select>
        <el-button type="primary" @click="generateForecast">
          <i class="fa fa-refresh"></i> 生成预测
        </el-button>
      </div>
    </div>
    
    <div class="forecast-filters">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="产品类别">
          <el-select v-model="filterForm.productCategory" placeholder="请选择产品类别">
            <el-option label="全部" value=""></el-option>
            <el-option label="自动化设备" value="automation"></el-option>
            <el-option label="控制系统" value="control"></el-option>
            <el-option label="传感器" value="sensor"></el-option>
            <el-option label="其他" value="other"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="客户类型">
          <el-select v-model="filterForm.customerType" placeholder="请选择客户类型">
            <el-option label="全部" value=""></el-option>
            <el-option label="大型企业" value="large"></el-option>
            <el-option label="中型企业" value="medium"></el-option>
            <el-option label="小型企业" value="small"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="区域">
          <el-select v-model="filterForm.region" placeholder="请选择区域">
            <el-option label="全部" value=""></el-option>
            <el-option label="华东地区" value="east"></el-option>
            <el-option label="华北地区" value="north"></el-option>
            <el-option label="华南地区" value="south"></el-option>
            <el-option label="西部地区" value="west"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="applyFilters">应用筛选</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <el-card class="forecast-card">
      <template #header>
        <div class="card-header">
          <span>销售趋势与预测</span>
        </div>
      </template>
      <div class="chart-container">
        <canvas ref="forecastChart"></canvas>
      </div>
    </el-card>
    
    <div class="forecast-details">
      <el-card class="details-card">
        <template #header>
          <div class="card-header">
            <span>预测详情</span>
          </div>
        </template>
        <el-table :data="forecastData" style="width: 100%" border>
          <el-table-column prop="period" label="周期" width="120"></el-table-column>
          <el-table-column prop="historicalData" label="历史数据" width="150">
            <template #default="scope">
              ¥{{ scope.row.historicalData.toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column prop="forecastData" label="预测数据" width="150">
            <template #default="scope">
              ¥{{ scope.row.forecastData.toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column prop="growthRate" label="增长率" width="120">
            <template #default="scope">
              <span :class="scope.row.growthRate >= 0 ? 'positive' : 'negative'">
                {{ scope.row.growthRate >= 0 ? '+' : '' }}{{ scope.row.growthRate }}%
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="confidence" label="置信度" width="120">
            <template #default="scope">
              <el-progress :percentage="scope.row.confidence" :format="formatConfidence"></el-progress>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script>
import Chart from 'chart.js/auto'

export default {
  name: 'SalesForecast',
  data() {
    return {
      forecastPeriod: 'monthly',
      filterForm: {
        productCategory: '',
        customerType: '',
        region: ''
      },
      forecastChart: null,
      forecastData: [
        {
          period: '2026-01',
          historicalData: 120000,
          forecastData: 0,
          growthRate: 0,
          confidence: 100
        },
        {
          period: '2026-02',
          historicalData: 190000,
          forecastData: 0,
          growthRate: 58.3,
          confidence: 100
        },
        {
          period: '2026-03',
          historicalData: 300000,
          forecastData: 0,
          growthRate: 57.9,
          confidence: 100
        },
        {
          period: '2026-04',
          historicalData: 0,
          forecastData: 320000,
          growthRate: 6.7,
          confidence: 85
        },
        {
          period: '2026-05',
          historicalData: 0,
          forecastData: 350000,
          growthRate: 9.4,
          confidence: 75
        },
        {
          period: '2026-06',
          historicalData: 0,
          forecastData: 380000,
          growthRate: 8.6,
          confidence: 65
        }
      ]
    }
  },
  mounted() {
    this.initForecastChart()
  },
  beforeUnmount() {
    if (this.forecastChart) {
      this.forecastChart.destroy()
    }
  },
  methods: {
    generateForecast() {
      // 模拟生成预测
      setTimeout(() => {
        this.$message.success('预测生成成功')
        this.initForecastChart()
      }, 1000)
    },
    applyFilters() {
      // 模拟应用筛选
      console.log('应用筛选:', this.filterForm)
      this.initForecastChart()
    },
    resetFilters() {
      this.filterForm = {
        productCategory: '',
        customerType: '',
        region: ''
      }
      this.initForecastChart()
    },
    initForecastChart() {
      const ctx = this.$refs.forecastChart
      if (!ctx) return
      
      if (this.forecastChart) {
        this.forecastChart.destroy()
      }
      
      const labels = this.forecastData.map(item => item.period)
      const historicalData = this.forecastData.map(item => item.historicalData)
      const forecastData = this.forecastData.map(item => item.forecastData)
      
      this.forecastChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: '历史数据',
              data: historicalData,
              borderColor: '#165DFF',
              backgroundColor: 'rgba(22, 93, 255, 0.1)',
              tension: 0.4,
              fill: true,
              pointRadius: 4
            },
            {
              label: '预测数据',
              data: forecastData,
              borderColor: '#ff7d00',
              backgroundColor: 'rgba(255, 125, 0, 0.1)',
              tension: 0.4,
              fill: true,
              pointRadius: 4,
              borderDash: [5, 5]
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
    formatConfidence(percentage) {
      return `${percentage}%`
    }
  }
}
</script>

<style scoped>
.sales-forecast {
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

.forecast-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.forecast-filters {
  margin-bottom: 20px;
}

.filter-form {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
}

.forecast-card {
  margin-bottom: 20px;
  height: 400px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 350px;
  position: relative;
}

.chart-container canvas {
  width: 100% !important;
  height: 100% !important;
}

.forecast-details {
  margin-top: 20px;
}

.details-card {
  margin-top: 20px;
}

.positive {
  color: #67c23a;
}

.negative {
  color: #f56c6c;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .forecast-controls {
    width: 100%;
    justify-content: space-between;
  }
  
  .forecast-filters {
    overflow-x: auto;
  }
  
  .filter-form {
    min-width: 600px;
  }
}
</style>