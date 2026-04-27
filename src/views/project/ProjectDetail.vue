<template>
  <div class="project-detail">
    <div class="page-header">
      <h2 class="page-title">项目详情</h2>
      <el-button type="primary" @click="editProject">
        <i class="fa fa-edit"></i> 编辑
      </el-button>
      <el-button @click="back">返回</el-button>
    </div>
    
    <el-card class="project-info">
      <template #header>
        <div class="card-header">
          <span>基本信息</span>
        </div>
      </template>
      <div class="info-grid">
        <div class="info-item">
          <label>项目名称：</label>
          <span>{{ project.name }}</span>
        </div>
        <div class="info-item">
          <label>客户：</label>
          <span>{{ project.customer_name }}</span>
        </div>
        <div class="info-item">
          <label>销售人员：</label>
          <span>{{ project.sales_name }}</span>
        </div>
        <div class="info-item">
          <label>状态：</label>
          <el-tag :type="getStatusType(project.status)">{{ project.status }}</el-tag>
        </div>
        <div class="info-item">
          <label>预算：</label>
          <span>{{ project.budget }}</span>
        </div>
        <div class="info-item">
          <label>开始日期：</label>
          <span>{{ project.start_date }}</span>
        </div>
        <div class="info-item">
          <label>结束日期：</label>
          <span>{{ project.end_date }}</span>
        </div>
        <div class="info-item">
          <label>备注：</label>
          <span>{{ project.remark }}</span>
        </div>
      </div>
    </el-card>
    
    <el-card class="project-modules" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>项目模块</span>
          <el-button type="primary" size="small" @click="addModule">
            <i class="fa fa-plus"></i> 添加模块
          </el-button>
        </div>
      </template>
      <el-table :data="modules" style="width: 100%" border>
        <el-table-column prop="id" label="模块ID" width="80"></el-table-column>
        <el-table-column prop="module_name" label="模块名称" min-width="150"></el-table-column>
        <el-table-column prop="leader_name" label="负责人" min-width="100"></el-table-column>
        <el-table-column prop="start_date" label="开始日期" width="120"></el-table-column>
        <el-table-column prop="end_date" label="结束日期" width="120"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" @click="editModule(scope.row.id)">
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <el-card class="project-progress" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>项目进度</span>
        </div>
      </template>
      <div class="progress-chart">
        <canvas ref="progressChart"></canvas>
      </div>
    </el-card>
  </div>
</template>

<script>
import Chart from 'chart.js/auto'

export default {
  name: 'ProjectDetail',
  data() {
    return {
      project: {
        id: '',
        name: '',
        customer_name: '',
        sales_name: '',
        status: '',
        budget: '',
        start_date: '',
        end_date: '',
        remark: ''
      },
      modules: []
    }
  },
  mounted() {
    this.loadProjectData()
    this.loadModules()
    this.initProgressChart()
  },
  methods: {
    getStatusType(status) {
      switch (status) {
        case '进行中':
          return 'primary'
        case '已完成':
          return 'success'
        case '待启动':
          return 'warning'
        case '已暂停':
          return 'info'
        case '已取消':
          return 'danger'
        default:
          return ''
      }
    },
    loadProjectData() {
      // 模拟加载项目数据
      const projectId = this.$route.params.id
      setTimeout(() => {
        this.project = {
          id: projectId,
          name: `项目${projectId}`,
          customer_name: '客户1',
          sales_name: '销售1',
          status: '进行中',
          budget: '100万',
          start_date: '2026-01-01',
          end_date: '2026-06-30',
          remark: '项目备注'
        }
      }, 500)
    },
    loadModules() {
      // 模拟加载项目模块数据
      setTimeout(() => {
        this.modules = [
          {
            id: 1,
            module_name: '模块1',
            leader_name: '工程师1',
            start_date: '2026-01-01',
            end_date: '2026-02-28',
            status: '已完成'
          },
          {
            id: 2,
            module_name: '模块2',
            leader_name: '工程师2',
            start_date: '2026-03-01',
            end_date: '2026-04-30',
            status: '进行中'
          },
          {
            id: 3,
            module_name: '模块3',
            leader_name: '工程师3',
            start_date: '2026-05-01',
            end_date: '2026-06-30',
            status: '待启动'
          }
        ]
      }, 500)
    },
    initProgressChart() {
      setTimeout(() => {
        const ctx = this.$refs.progressChart.getContext('2d')
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['设计阶段', '采购阶段', '生产阶段', '调试阶段', '验收阶段'],
            datasets: [{
              label: '计划进度',
              data: [100, 100, 100, 100, 100],
              backgroundColor: 'rgba(22, 93, 255, 0.2)',
              borderColor: 'rgba(22, 93, 255, 1)',
              borderWidth: 1
            }, {
              label: '实际进度',
              data: [100, 75, 50, 25, 0],
              backgroundColor: 'rgba(22, 93, 255, 0.7)',
              borderColor: 'rgba(22, 93, 255, 1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                  callback: function(value) {
                    return value + '%'
                  }
                }
              }
            }
          }
        })
      }, 1000)
    },
    editProject() {
      this.$router.push(`/project/edit/${this.project.id}`)
    },
    addModule() {
      // 添加模块
      console.log('添加模块')
    },
    editModule(moduleId) {
      // 编辑模块
      console.log('编辑模块:', moduleId)
    },
    back() {
      this.$router.push('/project')
    }
  }
}
</script>

<style scoped>
.project-detail {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  gap: 10px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-right: auto;
}

.project-info {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-top: 16px;
}

.info-item {
  display: flex;
  align-items: center;
}

.info-item label {
  font-weight: 600;
  margin-right: 8px;
  min-width: 100px;
}

.project-modules {
  margin-top: 20px;
}

.project-progress {
  margin-top: 20px;
}

.progress-chart {
  height: 300px;
}
</style>