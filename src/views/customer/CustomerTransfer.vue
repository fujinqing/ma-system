<template>
  <div class="customer-transfer">
    <div class="page-header">
      <h2 class="page-title">客户移交管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showTransferDialog">
          <i class="fa fa-exchange"></i> 批量移交
        </el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="客户移交" name="transfer">
        <el-card class="filter-card">
          <div class="filter-bar">
            <el-input v-model="filters.keyword" placeholder="搜索客户名称/编码" clearable @input="loadCustomers"></el-input>
            <el-select v-model="filters.salesId" placeholder="原负责人" clearable @change="loadCustomers">
              <el-option v-for="user in salesUsers" :key="user.id" :label="user.name" :value="user.id"></el-option>
            </el-select>
            <el-button type="primary" @click="loadCustomers">搜索</el-button>
          </div>

          <el-table :data="customers" v-loading="loading" border stripe @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55"></el-table-column>
            <el-table-column prop="code" label="客户编码" width="120"></el-table-column>
            <el-table-column prop="name" label="客户名称" min-width="180" show-overflow-tooltip></el-table-column>
            <el-table-column prop="sales_name" label="当前负责人" width="100"></el-table-column>
            <el-table-column prop="level" label="等级" width="80">
              <template #default="scope">
                <el-tag size="small" :type="getLevelType(scope.row.level)">{{ scope.row.level || '-' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="customer_type" label="类型" width="100"></el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="scope">
                <el-button type="primary" size="small" link @click="showSingleTransfer(scope.row)">移交</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              :page-size="pageSize"
              layout="total, prev, pager, next"
              :total="pagination.total"
              @current-change="loadCustomers"
            ></el-pagination>
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="移交记录" name="logs">
        <el-card>
          <el-table :data="transferLogs" v-loading="logsLoading" border stripe>
            <el-table-column prop="customer_code" label="客户编码" width="120"></el-table-column>
            <el-table-column prop="customer_name" label="客户名称" min-width="180" show-overflow-tooltip></el-table-column>
            <el-table-column prop="from_user_name" label="原负责人" width="100">
              <template #default="scope">
                {{ scope.row.from_user_name || '无' }}
              </template>
            </el-table-column>
            <el-table-column prop="to_user_name" label="新负责人" width="100"></el-table-column>
            <el-table-column prop="transfer_type" label="移交方式" width="100">
              <template #default="scope">
                <el-tag size="small">{{ getTransferTypeText(scope.row.transfer_type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="transfer_reason" label="移交原因" min-width="150" show-overflow-tooltip></el-table-column>
            <el-table-column prop="created_at" label="移交时间" width="160">
              <template #default="scope">
                {{ formatDate(scope.row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column prop="created_by_name" label="操作人" width="100"></el-table-column>
          </el-table>

          <div class="pagination-container">
            <el-pagination
              v-model:current-page="logPage"
              :page-size="logPageSize"
              layout="total, prev, pager, next"
              :total="logPagination.total"
              @current-change="loadTransferLogs"
            ></el-pagination>
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="transferDialogVisible" title="客户移交" width="500px">
      <el-form :model="transferForm" label-width="100px">
        <el-form-item label="选择客户">
          <span v-if="selectedCustomers.length > 0">
            已选择 {{ selectedCustomers.length }} 个客户
          </span>
          <span v-else-if="transferForm.customer_id">
            单个客户移交
          </span>
          <span v-else class="text-muted">请在列表中选择客户</span>
        </el-form-item>
        <el-form-item label="新负责人" required>
          <el-select v-model="transferForm.to_user_id" placeholder="请选择新负责人" style="width: 100%">
            <el-option v-for="user in salesUsers" :key="user.id" :label="user.name" :value="user.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="移交原因">
          <el-input v-model="transferForm.transfer_reason" placeholder="请输入移交原因"></el-input>
        </el-form-item>
        <el-form-item label="备注说明">
          <el-input v-model="transferForm.transfer_remark" type="textarea" :rows="3" placeholder="其他备注说明"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="transferDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="transferLoading" @click="submitTransfer">确认移交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import api from '@/api'

export default {
  name: 'CustomerTransfer',
  data() {
    return {
      activeTab: 'transfer',
      customers: [],
      transferLogs: [],
      salesUsers: [],
      loading: false,
      logsLoading: false,
      transferLoading: false,
      currentPage: 1,
      pageSize: 20,
      pagination: { total: 0 },
      logPage: 1,
      logPageSize: 20,
      logPagination: { total: 0 },
      selectedCustomers: [],
      filters: {
        keyword: '',
        salesId: ''
      },
      transferDialogVisible: false,
      transferForm: {
        customer_id: null,
        to_user_id: null,
        transfer_reason: '',
        transfer_remark: ''
      }
    }
  },
  mounted() {
    this.loadCustomers()
    this.loadSalesUsers()
    this.loadTransferLogs()
  },
  methods: {
    async loadCustomers() {
      this.loading = true
      try {
        const params = {
          page: this.currentPage,
          limit: this.pageSize,
          ...this.filters
        }
        const response = await api.getCustomers(params)
        if (response && response.success) {
          const data = response.data?.customers || response.customers || []
          this.customers = data
          this.pagination = response.data?.pagination || response.pagination || { total: 0 }
        }
      } catch (error) {
        console.warn('获取客户列表失败:', error)
      } finally {
        this.loading = false
      }
    },
    async loadSalesUsers() {
      try {
        const response = await api.getSalesUsers()
        if (response && response.success) {
          this.salesUsers = response.data || []
        }
      } catch (error) {
        console.warn('获取销售用户失败:', error)
      }
    },
    async loadTransferLogs() {
      this.logsLoading = true
      try {
        const params = {
          page: this.logPage,
          limit: this.logPageSize
        }
        const response = await api.getTransferLogs(params)
        if (response && response.success) {
          this.transferLogs = response.data?.logs || []
          this.logPagination = response.data?.pagination || { total: 0 }
        }
      } catch (error) {
        console.warn('获取移交记录失败:', error)
      } finally {
        this.logsLoading = false
      }
    },
    handleSelectionChange(val) {
      this.selectedCustomers = val
    },
    showTransferDialog() {
      if (this.selectedCustomers.length === 0) {
        this.$message.warning('请先在列表中选择要移交的客户')
        return
      }
      this.transferForm = {
        customer_id: null,
        to_user_id: null,
        transfer_reason: '',
        transfer_remark: ''
      }
      this.transferDialogVisible = true
    },
    showSingleTransfer(customer) {
      this.selectedCustomers = []
      this.transferForm = {
        customer_id: customer.id,
        to_user_id: null,
        transfer_reason: '',
        transfer_remark: ''
      }
      this.transferDialogVisible = true
    },
    async submitTransfer() {
      if (!this.transferForm.to_user_id) {
        this.$message.warning('请选择新负责人')
        return
      }

      this.transferLoading = true
      try {
        let response
        if (this.selectedCustomers.length > 0) {
          response = await api.batchTransferCustomers({
            customer_ids: this.selectedCustomers.map(c => c.id),
            to_user_id: this.transferForm.to_user_id,
            transfer_reason: this.transferForm.transfer_reason,
            transfer_remark: this.transferForm.transfer_remark
          })
        } else if (this.transferForm.customer_id) {
          response = await api.transferCustomer(this.transferForm)
        } else {
          this.$message.warning('请选择要移交的客户')
          return
        }

        if (response && response.success) {
          this.$message.success(response.message || '移交成功')
          this.transferDialogVisible = false
          this.selectedCustomers = []
          this.loadCustomers()
          this.loadTransferLogs()
        } else {
          this.$message.error(response?.message || '移交失败')
        }
      } catch (error) {
        console.warn('移交客户失败:', error)
        this.$message.error('移交失败')
      } finally {
        this.transferLoading = false
      }
    },
    getLevelType(level) {
      const typeMap = { 'A': 'success', 'B': 'warning', 'C': 'info', 'D': 'danger' }
      return typeMap[level] || 'info'
    },
    getTransferTypeText(type) {
      const textMap = { 'manual': '手动移交', 'auto': '自动回收', 'dismiss': '离职移交' }
      return textMap[type] || type
    },
    formatDate(date) {
      if (!date) return '-'
      const d = new Date(date)
      return d.toLocaleString('zh-CN')
    }
  }
}
</script>

<style scoped>
.customer-transfer {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-bar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-bar .el-input {
  width: 200px;
}

.pagination-container {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

.text-muted {
  color: #909399;
}

.header-actions {
  display: flex;
  gap: 10px;
}
</style>
