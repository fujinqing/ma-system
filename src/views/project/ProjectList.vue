<template>
  <div class="project-list">
    <div class="page-header">
      <h2 class="page-title">项目管理</h2>
      <el-button type="primary" @click="addProject">
        <i class="fa fa-plus"></i> 添加项目
      </el-button>
    </div>
    
    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索项目名称或客户"
        prefix-icon="el-icon-search"
        style="width: 300px;"
      ></el-input>
      <el-button type="primary" @click="search">搜索</el-button>
    </div>
    
    <el-table :data="projects" style="width: 100%" border>
      <el-table-column prop="id" label="项目ID" width="80"></el-table-column>
      <el-table-column prop="name" label="项目名称" min-width="150"></el-table-column>
      <el-table-column prop="customer_name" label="客户" min-width="150"></el-table-column>
      <el-table-column prop="sales_name" label="销售人员" min-width="100"></el-table-column>
      <el-table-column prop="phase" label="项目阶段" width="120">
        <template #default="scope">
          <el-tag type="info">{{ getPhaseText(scope.row.phase) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="tech_lead_name" label="技术负责人" min-width="100"></el-table-column>
      <el-table-column prop="budget" label="预算" width="100"></el-table-column>
      <el-table-column prop="start_date" label="开始日期" width="120"></el-table-column>
      <el-table-column prop="end_date" label="结束日期" width="120"></el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="viewProject(scope.row.id)">
            查看
          </el-button>
          <el-button type="success" size="small" @click="editProject(scope.row.id)">
            编辑
          </el-button>
          <el-button type="warning" size="small" @click="createBOM(scope.row.id)">
            BOM
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      ></el-pagination>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProjectList',
  data() {
    return {
      projects: [],
      searchQuery: '',
      currentPage: 1,
      pageSize: 10,
      total: 0
    }
  },
  mounted() {
    this.loadProjects()
  },
  methods: {
    async loadProjects() {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/projects`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        })
        const result = await response.json()
        if (result.success) {
          this.projects = result.data
          this.total = this.projects.length
        }
      } catch (error) {
        console.error('获取项目数据失败:', error)
      }
    },
    getStatusType(status) {
      switch (status) {
        case 'follow_up':
          return 'primary'
        case 'won':
        case 'accepted':
          return 'success'
        case 'paused':
          return 'warning'
        case 'abandoned':
          return 'danger'
        default:
          return ''
      }
    },
    getStatusText(status) {
      const statusMap = {
        'follow_up': '跟进中',
        'paused': '暂停',
        'abandoned': '放弃',
        'won': '已中标',
        'accepted': '已验收'
      }
      return statusMap[status] || status
    },
    getPhaseText(phase) {
      const phaseMap = {
        'requirement': '需求对接',
        'design': '方案设计',
        'quotation': '报价商务',
        'contract': '合同签订',
        'production': '下单投产',
        'installation': '安装调试',
        'acceptance': '验收结案'
      }
      return phaseMap[phase] || phase
    },
    addProject() {
      this.$router.push('/project/add')
    },
    viewProject(id) {
      this.$router.push(`/project/detail/${id}`)
    },
    editProject(id) {
      this.$router.push(`/project/edit/${id}`)
    },
    createBOM(id) {
      console.log('创建BOM:', id)
    },
    search() {
      console.log('搜索:', this.searchQuery)
    },
    handleSizeChange(size) {
      this.pageSize = size
      this.loadProjects()
    },
    handleCurrentChange(current) {
      this.currentPage = current
      this.loadProjects()
    }
  }
}
</script>

<style scoped>
.project-list {
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

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>