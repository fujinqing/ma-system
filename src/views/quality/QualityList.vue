<template>
  <div class="quality-list">
    <div class="page-header">
      <h2 class="page-title">质量管理</h2>
      <el-button type="primary" @click="addQualityIssue">
        <i class="fa fa-plus"></i> 添加质量问题
      </el-button>
    </div>
    
    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索问题标题或项目"
        prefix-icon="el-icon-search"
        style="width: 300px;"
      ></el-input>
      <el-select v-model="selectedSeverity" placeholder="严重程度">
        <el-option label="全部" value=""></el-option>
        <el-option label="严重" value="严重"></el-option>
        <el-option label="一般" value="一般"></el-option>
        <el-option label="轻微" value="轻微"></el-option>
      </el-select>
      <el-select v-model="selectedStatus" placeholder="状态">
        <el-option label="全部" value=""></el-option>
        <el-option label="待处理" value="待处理"></el-option>
        <el-option label="处理中" value="处理中"></el-option>
        <el-option label="已解决" value="已解决"></el-option>
        <el-option label="已关闭" value="已关闭"></el-option>
      </el-select>
      <el-button type="primary" @click="search">搜索</el-button>
    </div>
    
    <el-table :data="qualityIssues" style="width: 100%" border>
      <el-table-column prop="id" label="问题ID" width="80"></el-table-column>
      <el-table-column prop="project_name" label="项目名称" min-width="150"></el-table-column>
      <el-table-column prop="issue_title" label="问题标题" min-width="200"></el-table-column>
      <el-table-column prop="severity" label="严重程度" width="100">
        <template #default="scope">
          <el-tag :type="getSeverityType(scope.row.severity)">{{ scope.row.severity }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="assignee_name" label="负责人" min-width="100"></el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="150"></el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="viewQualityIssue(scope.row.id)">
            查看
          </el-button>
          <el-button type="success" size="small" @click="editQualityIssue(scope.row.id)">
            编辑
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
  name: 'QualityList',
  data() {
    return {
      qualityIssues: [
        {
          id: 1,
          project_name: '项目1',
          issue_title: '机加件尺寸偏差',
          severity: '严重',
          status: '处理中',
          assignee_name: '工程师1',
          created_at: '2026-01-01'
        },
        {
          id: 2,
          project_name: '项目2',
          issue_title: '电气元件故障',
          severity: '一般',
          status: '待处理',
          assignee_name: '工程师2',
          created_at: '2026-01-02'
        },
        {
          id: 3,
          project_name: '项目3',
          issue_title: '表面处理不良',
          severity: '轻微',
          status: '已解决',
          assignee_name: '工程师3',
          created_at: '2026-01-03'
        },
        {
          id: 4,
          project_name: '项目1',
          issue_title: '装配间隙过大',
          severity: '一般',
          status: '已关闭',
          assignee_name: '工程师1',
          created_at: '2026-01-04'
        }
      ],
      searchQuery: '',
      selectedSeverity: '',
      selectedStatus: '',
      currentPage: 1,
      pageSize: 10,
      total: 4
    }
  },
  methods: {
    getSeverityType(severity) {
      switch (severity) {
        case '严重':
          return 'danger'
        case '一般':
          return 'warning'
        case '轻微':
          return 'info'
        default:
          return ''
      }
    },
    getStatusType(status) {
      switch (status) {
        case '待处理':
          return 'warning'
        case '处理中':
          return 'primary'
        case '已解决':
          return 'success'
        case '已关闭':
          return 'info'
        default:
          return ''
      }
    },
    addQualityIssue() {
      // 添加质量问题
      console.log('添加质量问题')
    },
    viewQualityIssue(id) {
      // 查看质量问题详情
      console.log('查看质量问题:', id)
    },
    editQualityIssue(id) {
      // 编辑质量问题
      console.log('编辑质量问题:', id)
    },
    search() {
      // 模拟搜索操作
      console.log('搜索:', this.searchQuery, this.selectedSeverity, this.selectedStatus)
    },
    handleSizeChange(size) {
      this.pageSize = size
      // 模拟分页操作
    },
    handleCurrentChange(current) {
      this.currentPage = current
      // 模拟分页操作
    }
  }
}
</script>

<style scoped>
.quality-list {
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
  flex-wrap: wrap;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>