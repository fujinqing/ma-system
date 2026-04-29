<template>
  <div class="contract-management">
    <div class="page-header">
      <h2 class="page-title">客户合同与回款管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="addContract">
          <i class="fa fa-plus"></i> 新建合同
        </el-button>
      </div>
    </div>

    <div class="statistics-cards">
      <div class="stat-card">
        <div class="stat-icon total"><i class="fa fa-file-contract"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.totalContracts || 0 }}</div>
          <div class="stat-label">合同总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon success"><i class="fa fa-money-bill"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ formatAmount(statistics.totalAmount) }}</div>
          <div class="stat-label">合同总金额(万)</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon warning"><i class="fa fa-check-circle"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ formatAmount(statistics.totalReceived) }}</div>
          <div class="stat-label">已回款(万)</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon danger"><i class="fa fa-exclamation-circle"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ formatAmount(statistics.totalUnpaid) }}</div>
          <div class="stat-label">欠款(万)</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon info"><i class="fa fa-clock"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.expiringContracts || 0 }}</div>
          <div class="stat-label">即将到期</div>
        </div>
      </div>
    </div>

    <div class="search-filter-bar">
      <el-input
        v-model="filters.keyword"
        placeholder="搜索合同名称/编码/客户"
        prefix-icon="el-icon-search"
        clearable
        @input="loadContracts"
        style="width: 250px;"
      ></el-input>
      <el-select v-model="filters.status" placeholder="合同状态" clearable @change="loadContracts" style="width: 150px;">
        <el-option label="草稿" value="draft"></el-option>
        <el-option label="执行中" value="active"></el-option>
        <el-option label="已完成" value="completed"></el-option>
        <el-option label="已终止" value="terminated"></el-option>
      </el-select>
      <el-button @click="resetFilters">重置</el-button>
    </div>

    <div class="table-container">
      <el-table :data="contractList" v-loading="loading" border stripe>
        <el-table-column prop="contract_code" label="合同编号" width="130"></el-table-column>
        <el-table-column prop="contract_name" label="合同名称" min-width="150" show-overflow-tooltip></el-table-column>
        <el-table-column prop="customer_name" label="客户" width="120"></el-table-column>
        <el-table-column prop="contract_amount" label="合同金额(万)" width="110" align="right">
          <template #default="scope">{{ formatAmount(scope.row.contract_amount) }}</template>
        </el-table-column>
        <el-table-column prop="received_amount" label="已回款(万)" width="100" align="right">
          <template #default="scope">{{ formatAmount(scope.row.received_amount) }}</template>
        </el-table-column>
        <el-table-column prop="unpaid_amount" label="欠款(万)" width="100" align="right">
          <template #default="scope">
            <span :class="{ 'text-danger': scope.row.unpaid_amount > 0 }">{{ formatAmount(scope.row.unpaid_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="signing_date" label="签约日期" width="100">
          <template #default="scope">{{ formatDate(scope.row.signing_date) }}</template>
        </el-table-column>
        <el-table-column prop="end_date" label="到期日期" width="100">
          <template #default="scope">
            <span v-if="scope.row.end_date" :class="getExpireClass(scope.row)">
              {{ formatDate(scope.row.end_date) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="contract_status" label="状态" width="90">
          <template #default="scope">
            <el-tag size="small" :type="getStatusType(scope.row.contract_status)">
              {{ getStatusText(scope.row.contract_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" link @click="viewContract(scope.row.id)">详情</el-button>
            <el-button type="success" size="small" link @click="editContract(scope.row.id)">编辑</el-button>
            <el-button type="danger" size="small" link @click="deleteContract(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          layout="total, prev, pager, next"
          :total="pagination.total"
          @current-change="loadContracts"
        ></el-pagination>
      </div>
    </div>

    <el-dialog v-model="formVisible" :title="formTitle" width="700px" @closed="resetForm">
      <el-form :model="contractForm" :rules="formRules" ref="formRef" label-width="120px">
        <el-form-item label="合同名称" prop="contract_name">
          <el-input v-model="contractForm.contract_name" placeholder="请输入合同名称"></el-input>
        </el-form-item>
        <el-form-item label="关联客户" prop="customer_id">
          <el-select v-model="contractForm.customer_id" placeholder="请选择客户" filterable style="width: 100%;">
            <el-option v-for="c in customerList" :key="c.id" :label="c.name" :value="c.id"></el-option>
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="合同金额(万)">
              <el-input-number v-model="contractForm.contract_amount" :min="0" :precision="2" style="width: 100%;"></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="签约日期">
              <el-date-picker v-model="contractForm.signing_date" type="date" placeholder="选择日期" style="width: 100%;"></el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始日期">
              <el-date-picker v-model="contractForm.start_date" type="date" placeholder="选择日期" style="width: 100%;"></el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束日期">
              <el-date-picker v-model="contractForm.end_date" type="date" placeholder="选择日期" style="width: 100%;"></el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="付款条件">
          <el-input v-model="contractForm.payment_terms" type="textarea" :rows="2" placeholder="请输入付款条件"></el-input>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="contractForm.remarks" type="textarea" :rows="2" placeholder="请输入备注"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="合同详情" width="800px">
      <div v-if="contractDetail" class="contract-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="合同编号">{{ contractDetail.contract_code }}</el-descriptions-item>
          <el-descriptions-item label="合同名称">{{ contractDetail.contract_name }}</el-descriptions-item>
          <el-descriptions-item label="客户">{{ contractDetail.customer_name }}</el-descriptions-item>
          <el-descriptions-item label="销售人员">{{ contractDetail.sales_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="合同金额">{{ formatAmount(contractDetail.contract_amount) }}万</el-descriptions-item>
          <el-descriptions-item label="已回款">{{ formatAmount(contractDetail.received_amount) }}万</el-descriptions-item>
          <el-descriptions-item label="欠款">{{ formatAmount(contractDetail.unpaid_amount) }}万</el-descriptions-item>
          <el-descriptions-item label="签约日期">{{ formatDate(contractDetail.signing_date) }}</el-descriptions-item>
          <el-descriptions-item label="开始日期">{{ formatDate(contractDetail.start_date) }}</el-descriptions-item>
          <el-descriptions-item label="结束日期">{{ formatDate(contractDetail.end_date) }}</el-descriptions-item>
          <el-descriptions-item label="合同状态">
            <el-tag size="small" :type="getStatusType(contractDetail.contract_status)">
              {{ getStatusText(contractDetail.contract_status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="付款状态">{{ contractDetail.payment_status }}</el-descriptions-item>
          <el-descriptions-item label="付款条件" :span="2">{{ contractDetail.payment_terms || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ contractDetail.remarks || '-' }}</el-descriptions-item>
        </el-descriptions>

        <h4 style="margin-top: 20px;">回款计划</h4>
        <el-table :data="contractDetail.payment_plans" border size="small">
          <el-table-column prop="plan_no" label="期次" width="60"></el-table-column>
          <el-table-column prop="plan_amount" label="计划金额" width="100">
            <template #default="scope">{{ formatAmount(scope.row.plan_amount) }}</template>
          </el-table-column>
          <el-table-column prop="plan_date" label="计划日期" width="120">
            <template #default="scope">{{ formatDate(scope.row.plan_date) }}</template>
          </el-table-column>
          <el-table-column prop="payment_type" label="付款类型" width="100"></el-table-column>
          <el-table-column prop="plan_status" label="状态" width="80">
            <template #default="scope">
              <el-tag size="small" :type="scope.row.plan_status === 'paid' ? 'success' : 'warning'">
                {{ scope.row.plan_status === 'paid' ? '已回款' : '待回款' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>

        <h4 style="margin-top: 20px;">回款记录</h4>
        <el-table :data="contractDetail.payment_records" border size="small">
          <el-table-column prop="payment_date" label="回款日期" width="120">
            <template #default="scope">{{ formatDate(scope.row.payment_date) }}</template>
          </el-table-column>
          <el-table-column prop="payment_amount" label="回款金额" width="100">
            <template #default="scope">{{ formatAmount(scope.row.payment_amount) }}</template>
          </el-table-column>
          <el-table-column prop="payment_method" label="付款方式" width="100"></el-table-column>
          <el-table-column prop="invoice_no" label="发票号" width="120"></el-table-column>
          <el-table-column prop="remarks" label="备注" min-width="100" show-overflow-tooltip></el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import api from '@/api'

export default {
  name: 'ContractManagement',
  data() {
    return {
      contractList: [],
      customerList: [],
      statistics: {},
      loading: false,
      formVisible: false,
      detailVisible: false,
      submitLoading: false,
      currentPage: 1,
      pageSize: 20,
      pagination: { total: 0 },
      filters: { keyword: '', status: '' },
      formTitle: '新建合同',
      contractForm: {
        contract_name: '',
        customer_id: null,
        contract_amount: 0,
        signing_date: null,
        start_date: null,
        end_date: null,
        payment_terms: '',
        remarks: ''
      },
      formRules: {
        contract_name: [{ required: true, message: '请输入合同名称', trigger: 'blur' }],
        customer_id: [{ required: true, message: '请选择客户', trigger: 'change' }]
      },
      contractDetail: null,
      editingId: null
    }
  },
  mounted() {
    this.loadContracts()
    this.loadStatistics()
    this.loadCustomers()
  },
  methods: {
    async loadContracts() {
      this.loading = true
      try {
        const params = {
          page: this.currentPage,
          limit: this.pageSize,
          keyword: this.filters.keyword,
          status: this.filters.status
        }
        const response = await api.getCustomerContracts(params)
        if (response && response.success) {
          this.contractList = response.data?.contracts || []
          this.pagination = response.data?.pagination || { total: 0 }
        }
      } catch (error) {
        console.warn('获取合同列表失败:', error)
      } finally {
        this.loading = false
      }
    },
    async loadStatistics() {
      try {
        const response = await api.getCustomerContractStatistics()
        if (response && response.success) {
          this.statistics = response.data || {}
        }
      } catch (error) {
        console.warn('获取统计失败:', error)
      }
    },
    async loadCustomers() {
      try {
        const response = await api.getCustomers({ page: 1, limit: 1000 })
        if (response && response.success) {
          this.customerList = response.data?.customers || response.customers || []
        }
      } catch (error) {
        console.warn('获取客户列表失败:', error)
      }
    },
    addContract() {
      this.formTitle = '新建合同'
      this.editingId = null
      this.resetForm()
      this.formVisible = true
    },
    async editContract(id) {
      this.formTitle = '编辑合同'
      this.editingId = id
      try {
        const response = await api.getCustomerContract(id)
        if (response && response.success) {
          const data = response.data
          this.contractForm = {
            contract_name: data.contract_name,
            customer_id: data.customer_id,
            opportunity_id: data.opportunity_id,
            sales_id: data.sales_id,
            contract_amount: data.contract_amount,
            signing_date: data.signing_date,
            start_date: data.start_date,
            end_date: data.end_date,
            payment_terms: data.payment_terms,
            delivery_conditions: data.delivery_conditions,
            quality_guarantee_period: data.quality_guarantee_period,
            remarks: data.remarks
          }
          this.formVisible = true
        }
      } catch (error) {
        this.$message.error('获取合同信息失败')
      }
    },
    async viewContract(id) {
      try {
        const response = await api.getCustomerContract(id)
        if (response && response.success) {
          this.contractDetail = response.data
          this.detailVisible = true
        }
      } catch (error) {
        this.$message.error('获取合同详情失败')
      }
    },
    async submitForm() {
      try {
        await this.$refs.formRef.validate()
        this.submitLoading = true
        if (this.editingId) {
          await api.updateCustomerContract(this.editingId, this.contractForm)
          this.$message.success('合同更新成功')
        } else {
          await api.createCustomerContract(this.contractForm)
          this.$message.success('合同创建成功')
        }
        this.formVisible = false
        this.loadContracts()
        this.loadStatistics()
      } catch (error) {
        if (error !== false) {
          this.$message.error(this.editingId ? '更新失败' : '创建失败')
        }
      } finally {
        this.submitLoading = false
      }
    },
    async deleteContract(id) {
      try {
        await this.$confirm('确定要删除该合同吗？', '提示', { type: 'warning' })
        await api.deleteCustomerContract(id)
        this.$message.success('删除成功')
        this.loadContracts()
        this.loadStatistics()
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除失败')
        }
      }
    },
    resetForm() {
      this.contractForm = {
        contract_name: '',
        customer_id: null,
        contract_amount: 0,
        signing_date: null,
        start_date: null,
        end_date: null,
        payment_terms: '',
        remarks: ''
      }
      this.$refs.formRef?.resetFields()
    },
    resetFilters() {
      this.filters = { keyword: '', status: '' }
      this.currentPage = 1
      this.loadContracts()
    },
    formatAmount(val) {
      if (!val && val !== 0) return '0'
      return parseFloat(val).toFixed(2)
    },
    formatDate(date) {
      if (!date) return '-'
      const d = new Date(date)
      return d.toLocaleDateString('zh-CN')
    },
    getStatusType(status) {
      const map = { draft: 'info', active: 'success', completed: '', terminated: 'danger' }
      return map[status] || 'info'
    },
    getStatusText(status) {
      const map = { draft: '草稿', active: '执行中', completed: '已完成', terminated: '已终止' }
      return map[status] || status
    },
    getExpireClass(row) {
      if (!row.end_date || row.contract_status !== 'active') return ''
      const days = Math.ceil((new Date(row.end_date) - new Date()) / (1000 * 60 * 60 * 24))
      if (days < 0) return 'text-danger'
      if (days <= 30) return 'text-warning'
      return ''
    }
  }
}
</script>

<style scoped>
.contract-management {
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
.statistics-cards {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  min-width: 140px;
  flex: 1;
}
.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
}
.stat-icon.total { background: #409EFF; }
.stat-icon.success { background: #67C23A; }
.stat-icon.warning { background: #E6A23C; }
.stat-icon.info { background: #909399; }
.stat-icon.danger { background: #F56C6C; }
.stat-content { display: flex; flex-direction: column; }
.stat-value { font-size: 24px; font-weight: bold; color: #303133; }
.stat-label { font-size: 12px; color: #909399; }
.search-filter-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  align-items: center;
}
.table-container { background: #fff; border-radius: 8px; padding: 15px; }
.pagination-container { margin-top: 15px; display: flex; justify-content: flex-end; }
.text-danger { color: #F56C6C; }
.text-warning { color: #E6A23C; }
.contract-detail { padding: 10px 0; }
</style>
