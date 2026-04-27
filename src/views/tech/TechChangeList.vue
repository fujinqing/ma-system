<template>
  <div class="tech-change-list">
    <div class="page-header">
      <h2 class="page-title">技术管理</h2>
      <el-button type="primary" @click="addTechChange">
        <i class="fa fa-plus"></i> 添加设计变更
      </el-button>
    </div>
    
    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索变更编号或项目"
        prefix-icon="el-icon-search"
        style="width: 300px;"
      ></el-input>
      <el-button type="primary" @click="search">搜索</el-button>
    </div>
    
    <el-table :data="techChanges" style="width: 100%" border>
      <el-table-column prop="id" label="变更ID" width="80"></el-table-column>
      <el-table-column prop="change_no" label="变更编号" min-width="120"></el-table-column>
      <el-table-column prop="project_name" label="项目名称" min-width="150"></el-table-column>
      <el-table-column prop="module_name" label="模块名称" min-width="150"></el-table-column>
      <el-table-column prop="change_reason" label="变更原因" min-width="200"></el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="150"></el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="viewTechChange(scope.row.id)">
            查看
          </el-button>
          <el-button type="success" size="small" @click="editTechChange(scope.row.id)">
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
  name: 'TechChangeList',
  data() {
    return {
      techChanges: [
        {
          id: 1,
          change_no: 'ECN-2026-001',
          project_name: '项目1',
          module_name: '模块1',
          change_reason: '客户需求变更',
          status: '已审批',
          created_at: '2026-01-01'
        },
        {
          id: 2,
          change_no: 'ECN-2026-002',
          project_name: '项目2',
          module_name: '模块2',
          change_reason: '设计优化',
          status: '待审批',
          created_at: '2026-01-02'
        },
        {
          id: 3,
          change_no: 'ECN-2026-003',
          project_name: '项目3',
          module_name: '模块3',
          change_reason: '供应商变更',
          status: '已拒绝',
          created_at: '2026-01-03'
        }
      ],
      searchQuery: '',
      currentPage: 1,
      pageSize: 10,
      total: 3
    }
  },
  methods: {
    getStatusType(status) {
      switch (status) {
        case '已审批':
          return 'success'
        case '待审批':
          return 'warning'
        case '已拒绝':
          return 'danger'
        default:
          return ''
      }
    },
    addTechChange() {
      // 添加设计变更
      console.log('添加设计变更')
    },
    viewTechChange(id) {
      // 查看设计变更详情
      console.log('查看设计变更:', id)
    },
    editTechChange(id) {
      // 编辑设计变更
      console.log('编辑设计变更:', id)
    },
    search() {
      // 模拟搜索操作
      console.log('搜索:', this.searchQuery)
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
.tech-change-list {
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