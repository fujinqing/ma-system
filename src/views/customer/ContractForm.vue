<template>
  <div class="contract-form-page">
    <div class="page-header">
      <h2 class="page-title">{{ isEdit ? '编辑合同' : '新增合同' }}</h2>
      <div class="header-actions">
        <el-button @click="goBack">返回</el-button>
      </div>
    </div>

    <div class="form-container">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="合同名称" prop="contract_name">
          <el-input v-model="form.contract_name" placeholder="请输入合同名称"></el-input>
        </el-form-item>
        <el-form-item label="关联客户" prop="customer_id">
          <el-select v-model="form.customer_id" placeholder="请选择客户" filterable style="width: 100%;">
            <el-option v-for="c in customerList" :key="c.id" :label="c.name" :value="c.id"></el-option>
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="合同金额(万)">
              <el-input-number v-model="form.contract_amount" :min="0" :precision="2" style="width: 100%;"></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="签约日期">
              <el-date-picker v-model="form.signing_date" type="date" placeholder="选择日期" style="width: 100%;"></el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始日期">
              <el-date-picker v-model="form.start_date" type="date" placeholder="选择日期" style="width: 100%;"></el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束日期">
              <el-date-picker v-model="form.end_date" type="date" placeholder="选择日期" style="width: 100%;"></el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="付款条件">
          <el-input v-model="form.payment_terms" type="textarea" :rows="2" placeholder="请输入付款条件"></el-input>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remarks" type="textarea" :rows="2" placeholder="请输入备注"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="submitLoading">保存</el-button>
          <el-button @click="goBack">取消</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
import api from '@/api'

export default {
  name: 'ContractForm',
  data() {
    return {
      form: {
        contract_name: '',
        customer_id: null,
        contract_amount: 0,
        signing_date: null,
        start_date: null,
        end_date: null,
        payment_terms: '',
        remarks: ''
      },
      rules: {
        contract_name: [{ required: true, message: '请输入合同名称', trigger: 'blur' }],
        customer_id: [{ required: true, message: '请选择客户', trigger: 'change' }]
      },
      customerList: [],
      submitLoading: false,
      isEdit: false,
      contractId: null
    }
  },
  mounted() {
    this.isEdit = !!this.$route.params.id
    if (this.isEdit) {
      this.contractId = this.$route.params.id
      this.loadContract()
    }
    this.loadCustomers()
  },
  methods: {
    async loadContract() {
      try {
        const response = await api.getCustomerContract(this.contractId)
        if (response && response.success) {
          const data = response.data
          this.form = {
            contract_name: data.contract_name,
            customer_id: data.customer_id,
            contract_amount: data.contract_amount,
            signing_date: data.signing_date,
            start_date: data.start_date,
            end_date: data.end_date,
            payment_terms: data.payment_terms,
            remarks: data.remarks
          }
        }
      } catch (error) {
        this.$message.error('获取合同信息失败')
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
    async submitForm() {
      try {
        await this.$refs.formRef.validate()
        this.submitLoading = true
        if (this.isEdit) {
          await api.updateCustomerContract(this.contractId, this.form)
          this.$message.success('更新成功')
        } else {
          await api.createCustomerContract(this.form)
          this.$message.success('创建成功')
        }
        this.goBack()
      } catch (error) {
        if (error !== false) {
          this.$message.error(this.isEdit ? '更新失败' : '创建失败')
        }
      } finally {
        this.submitLoading = false
      }
    },
    goBack() {
      this.$router.push('/crm/contracts')
    }
  }
}
</script>

<style scoped>
.contract-form-page {
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
.form-container {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  max-width: 800px;
}
</style>
