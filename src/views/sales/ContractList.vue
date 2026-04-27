<template>
  <div class="contract-list">
    <div class="page-header">
      <h2>合同管理</h2>
      <el-button type="primary" @click="addContract">
        <i class="fa fa-plus"></i> 添加合同
      </el-button>
    </div>
    
    <div class="search-container">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="合同编号">
          <el-input v-model="searchForm.contract_no" placeholder="请输入合同编号"></el-input>
        </el-form-item>
        <el-form-item label="客户名称">
          <el-input v-model="searchForm.customer_name" placeholder="请输入客户名称"></el-input>
        </el-form-item>
        <el-form-item label="合同状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态">
            <el-option label="待审批" value="pending"></el-option>
            <el-option label="已审批" value="approved"></el-option>
            <el-option label="已生效" value="effective"></el-option>
            <el-option label="已终止" value="terminated"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <el-table :data="contracts" style="width: 100%" border>
      <el-table-column prop="id" label="合同ID" width="80"></el-table-column>
      <el-table-column prop="contract_no" label="合同编号" min-width="150"></el-table-column>
      <el-table-column prop="customer_name" label="客户名称" min-width="150"></el-table-column>
      <el-table-column prop="amount" label="合同金额" width="120"></el-table-column>
      <el-table-column prop="sign_date" label="签订日期" width="120"></el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 'pending'" type="warning">待审批</el-tag>
          <el-tag v-else-if="scope.row.status === 'approved'" type="info">已审批</el-tag>
          <el-tag v-else-if="scope.row.status === 'effective'" type="success">已生效</el-tag>
          <el-tag v-else type="danger">已终止</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="viewContract(scope.row.id)">查看</el-button>
          <el-button type="success" size="small" @click="editContract(scope.row.id)">编辑</el-button>
          <el-button type="danger" size="small" @click="deleteContract(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <div class="pagination-container">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total">
      </el-pagination>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ContractList',
  data() {
    return {
      searchForm: {
        contract_no: '',
        customer_name: '',
        status: ''
      },
      contracts: [],
      currentPage: 1,
      pageSize: 10,
      total: 0
    }
  },
  mounted() {
    this.loadContracts()
  },
  methods: {
    loadContracts() {
      // 模拟加载合同数据
      setTimeout(() => {
        this.contracts = [
          {
            id: 1,
            contract_no: 'HT2023001',
            customer_name: '上海XX自动化设备有限公司',
            amount: 1280000,
            sign_date: '2023-05-15',
            status: 'effective'
          },
          {
            id: 2,
            contract_no: 'HT2023002',
            customer_name: '北京XX科技有限公司',
            amount: 850000,
            sign_date: '2023-06-20',
            status: 'effective'
          },
          {
            id: 3,
            contract_no: 'HT2023003',
            customer_name: '广州XX制造有限公司',
            amount: 2100000,
            sign_date: '2023-07-10',
            status: 'pending'
          }
        ]
        this.total = this.contracts.length
      }, 500)
    },
    search() {
      // 模拟搜索功能
      this.loadContracts()
    },
    reset() {
      this.searchForm = {
        contract_no: '',
        customer_name: '',
        status: ''
      }
      this.loadContracts()
    },
    addContract() {
      // 跳转到添加合同页面
      this.$router.push('/sales/contract/add')
    },
    viewContract(id) {
      // 跳转到合同详情页面
      this.$router.push(`/sales/contract/detail/${id}`)
    },
    editContract(id) {
      // 跳转到编辑合同页面
      this.$router.push(`/sales/contract/edit/${id}`)
    },
    deleteContract(id) {
      this.$confirm('确定要删除这个合同吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟删除操作
        setTimeout(() => {
          this.$message.success('删除成功')
          this.loadContracts()
        }, 500)
      })
    },
    handleSizeChange(size) {
      this.pageSize = size
      this.loadContracts()
    },
    handleCurrentChange(current) {
      this.currentPage = current
      this.loadContracts()
    }
  }
}
</script>

<style scoped>
.contract-list {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.search-container {
  margin-bottom: 20px;
}

.search-form {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>