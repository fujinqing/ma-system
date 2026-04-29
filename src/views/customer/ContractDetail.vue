<template>
  <div class="contract-detail-page">
    <div class="page-header">
      <h2 class="page-title">合同详情</h2>
      <div class="header-actions">
        <el-button @click="goBack">返回</el-button>
        <el-button type="primary" @click="editContract">编辑</el-button>
      </div>
    </div>

    <div v-loading="loading" class="detail-container">
      <el-descriptions v-if="contract" :column="2" border>
        <el-descriptions-item label="合同编号">{{ contract.contract_code }}</el-descriptions-item>
        <el-descriptions-item label="合同名称">{{ contract.contract_name }}</el-descriptions-item>
        <el-descriptions-item label="客户">{{ contract.customer_name }}</el-descriptions-item>
        <el-descriptions-item label="销售人员">{{ contract.sales_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="合同金额">{{ contract.contract_amount || 0 }}万</el-descriptions-item>
        <el-descriptions-item label="已回款">{{ contract.received_amount || 0 }}万</el-descriptions-item>
        <el-descriptions-item label="欠款">
          <span :class="{ 'text-danger': contract.unpaid_amount > 0 }">{{ contract.unpaid_amount || 0 }}万</span>
        </el-descriptions-item>
        <el-descriptions-item label="签约日期">{{ formatDate(contract.signing_date) }}</el-descriptions-item>
        <el-descriptions-item label="开始日期">{{ formatDate(contract.start_date) }}</el-descriptions-item>
        <el-descriptions-item label="结束日期">{{ formatDate(contract.end_date) }}</el-descriptions-item>
        <el-descriptions-item label="合同状态">
          <el-tag size="small" :type="getStatusType(contract.contract_status)">
            {{ getStatusText(contract.contract_status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="付款状态">{{ getPaymentStatusText(contract.payment_status) }}</el-descriptions-item>
        <el-descriptions-item label="付款条件" :span="2">{{ contract.payment_terms || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ contract.remarks || '-' }}</el-descriptions-item>
      </el-descriptions>

      <h4 style="margin-top: 20px;">回款计划</h4>
      <el-table :data="contract?.payment_plans || []" border size="small">
        <el-table-column prop="plan_no" label="期次" width="60"></el-table-column>
        <el-table-column prop="plan_amount" label="计划金额" width="100">
          <template #default="scope">{{ scope.row.plan_amount || 0 }}</template>
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
      <el-table :data="contract?.payment_records || []" border size="small">
        <el-table-column prop="payment_date" label="回款日期" width="120">
          <template #default="scope">{{ formatDate(scope.row.payment_date) }}</template>
        </el-table-column>
        <el-table-column prop="payment_amount" label="回款金额" width="100">
          <template #default="scope">{{ scope.row.payment_amount || 0 }}</template>
        </el-table-column>
        <el-table-column prop="payment_method" label="付款方式" width="100"></el-table-column>
        <el-table-column prop="invoice_no" label="发票号" width="120"></el-table-column>
        <el-table-column prop="remarks" label="备注" min-width="100" show-overflow-tooltip></el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script>
import api from '@/api'

export default {
  name: 'ContractDetail',
  data() {
    return {
      loading: false,
      contract: null,
      contractId: null
    }
  },
  mounted() {
    this.contractId = this.$route.params.id
    if (this.contractId) {
      this.loadContract()
    }
  },
  methods: {
    async loadContract() {
      this.loading = true
      try {
        const response = await api.getCustomerContract(this.contractId)
        if (response && response.success) {
          this.contract = response.data
        }
      } catch (error) {
        this.$message.error('获取合同详情失败')
      } finally {
        this.loading = false
      }
    },
    editContract() {
      this.$router.push(`/crm/contracts/edit/${this.contractId}`)
    },
    goBack() {
      this.$router.push('/crm/contracts')
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
    getPaymentStatusText(status) {
      const map = { pending: '待付款', partial: '部分回款', paid: '已回款', overdue: '已逾期' }
      return map[status] || status || '-'
    }
  }
}
</script>

<style scoped>
.contract-detail-page {
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
.detail-container {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}
.text-danger {
  color: #F56C6C;
  font-weight: bold;
}
</style>
