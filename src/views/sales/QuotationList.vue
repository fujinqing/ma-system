<template>
  <div class="quotation-list">
    <div class="page-header">
      <h2 class="page-title">报价管理</h2>
      <el-button type="primary" @click="addQuotation">
        <i class="fa fa-plus"></i> 添加报价
      </el-button>
    </div>
    
    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索报价编号或客户"
        prefix-icon="el-icon-search"
        style="width: 300px;"
      ></el-input>
      <el-button type="primary" @click="search">搜索</el-button>
    </div>
    
    <el-table :data="quotations" style="width: 100%" border>
      <el-table-column prop="id" label="报价ID" width="80"></el-table-column>
      <el-table-column prop="project_name" label="项目名称" min-width="150"></el-table-column>
      <el-table-column prop="customer_name" label="客户" min-width="150"></el-table-column>
      <el-table-column prop="total_amount" label="总金额" width="120"></el-table-column>
      <el-table-column prop="status" label="状态" width="100"></el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="150"></el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="viewQuotation(scope.row.id)">
            查看
          </el-button>
          <el-button type="success" size="small" @click="editQuotation(scope.row.id)">
            编辑
          </el-button>
          <el-button type="warning" size="small" @click="createContract(scope.row.id)">
            生成合同
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
  name: 'QuotationList',
  data() {
    return {
      quotations: [
        {
          id: 1,
          project_name: '项目1',
          customer_name: '客户1',
          total_amount: '100万',
          status: '已审批',
          created_at: '2026-01-01'
        },
        {
          id: 2,
          project_name: '项目2',
          customer_name: '客户2',
          total_amount: '80万',
          status: '待审批',
          created_at: '2026-01-02'
        },
        {
          id: 3,
          project_name: '项目3',
          customer_name: '客户3',
          total_amount: '120万',
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
    addQuotation() {
      this.$router.push('/sales/quotation/add')
    },
    viewQuotation(id) {
      // 查看报价详情
      console.log('查看报价:', id)
    },
    editQuotation(id) {
      // 编辑报价
      console.log('编辑报价:', id)
    },
    createContract(id) {
      // 生成合同
      console.log('生成合同:', id)
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
.quotation-list {
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