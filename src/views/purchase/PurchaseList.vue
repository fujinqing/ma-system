<template>
  <div class="purchase-list">
    <div class="page-header">
      <h2 class="page-title">采购管理</h2>
      <el-button type="primary" @click="addPurchase">
        <i class="fa fa-plus"></i> 添加采购
      </el-button>
    </div>
    
    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索采购编号或项目"
        prefix-icon="el-icon-search"
        style="width: 300px;"
      ></el-input>
      <el-button type="primary" @click="search">搜索</el-button>
    </div>
    
    <el-table :data="purchases" style="width: 100%" border>
      <el-table-column prop="id" label="采购ID" width="80"></el-table-column>
      <el-table-column prop="purchase_no" label="采购编号" min-width="120"></el-table-column>
      <el-table-column prop="project_name" label="项目名称" min-width="150"></el-table-column>
      <el-table-column prop="supplier_name" label="供应商" min-width="150"></el-table-column>
      <el-table-column prop="total_amount" label="采购金额" width="120"></el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="150"></el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="viewPurchase(scope.row.id)">
            查看
          </el-button>
          <el-button type="success" size="small" @click="editPurchase(scope.row.id)">
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
  name: 'PurchaseList',
  data() {
    return {
      purchases: [
        {
          id: 1,
          purchase_no: 'PO-2026-001',
          project_name: '项目1',
          supplier_name: '供应商1',
          total_amount: '50万',
          status: '已完成',
          created_at: '2026-01-01'
        },
        {
          id: 2,
          purchase_no: 'PO-2026-002',
          project_name: '项目2',
          supplier_name: '供应商2',
          total_amount: '30万',
          status: '进行中',
          created_at: '2026-01-02'
        },
        {
          id: 3,
          purchase_no: 'PO-2026-003',
          project_name: '项目3',
          supplier_name: '供应商3',
          total_amount: '40万',
          status: '待审批',
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
        case '已完成':
          return 'success'
        case '进行中':
          return 'primary'
        case '待审批':
          return 'warning'
        case '已拒绝':
          return 'danger'
        default:
          return ''
      }
    },
    addPurchase() {
      // 添加采购
      console.log('添加采购')
    },
    viewPurchase(id) {
      // 查看采购详情
      console.log('查看采购:', id)
    },
    editPurchase(id) {
      // 编辑采购
      console.log('编辑采购:', id)
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
.purchase-list {
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