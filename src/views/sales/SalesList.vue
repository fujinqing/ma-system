<template>
  <div class="sales-list">
    <div class="page-header">
      <h2 class="page-title">销售管理</h2>
      <el-button type="primary" @click="addSales">
        <i class="fa fa-plus"></i> 添加销售项目
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
    
    <el-table :data="sales" style="width: 100%" border>
      <el-table-column prop="id" label="项目ID" width="80"></el-table-column>
      <el-table-column prop="name" label="项目名称" min-width="150"></el-table-column>
      <el-table-column prop="customer_name" label="客户" min-width="150"></el-table-column>
      <el-table-column prop="sales_name" label="销售人员" min-width="100"></el-table-column>
      <el-table-column prop="status" label="状态" width="100"></el-table-column>
      <el-table-column prop="budget" label="预算" width="100"></el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="150"></el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="viewSales(scope.row.id)">
            查看
          </el-button>
          <el-button type="success" size="small" @click="createQuotation(scope.row.id)">
            报价
          </el-button>
          <el-button type="warning" size="small" @click="createContract(scope.row.id)">
            合同
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
  name: 'SalesList',
  data() {
    return {
      sales: [
        {
          id: 1,
          name: '销售项目1',
          customer_name: '客户1',
          sales_name: '销售1',
          status: '进行中',
          budget: '100万',
          created_at: '2026-01-01'
        },
        {
          id: 2,
          name: '销售项目2',
          customer_name: '客户2',
          sales_name: '销售2',
          status: '已完成',
          budget: '80万',
          created_at: '2025-12-01'
        },
        {
          id: 3,
          name: '销售项目3',
          customer_name: '客户3',
          sales_name: '销售1',
          status: '待报价',
          budget: '120万',
          created_at: '2026-02-01'
        }
      ],
      searchQuery: '',
      currentPage: 1,
      pageSize: 10,
      total: 3
    }
  },
  methods: {
    addSales() {
      // 添加销售项目
      console.log('添加销售项目')
    },
    viewSales(id) {
      // 查看销售项目详情
      console.log('查看销售项目:', id)
    },
    createQuotation(id) {
      this.$router.push(`/sales/quotation/add`)
    },
    createContract(id) {
      // 创建合同
      console.log('创建合同:', id)
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
.sales-list {
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