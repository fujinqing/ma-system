<template>
  <div class="opportunity-form">
    <div class="page-header">
      <h2 class="page-title">{{ isEdit ? '编辑商机' : '新建商机' }}</h2>
      <div class="header-actions">
        <el-button @click="goBack">返回</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">
          {{ isEdit ? '保存修改' : '创建商机' }}
        </el-button>
      </div>
    </div>

    <div class="form-container">
      <el-form ref="opportunityFormRef" :model="opportunityForm" :rules="formRules" label-width="120px">
        <el-card class="form-card">
          <template #header>
            <div class="card-header">
              <span>基本信息</span>
            </div>
          </template>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="商机名称" prop="name">
                <el-input v-model="opportunityForm.name" placeholder="请输入商机名称" maxlength="200"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="关联客户" prop="customer_id">
                <el-select
                  v-model="opportunityForm.customer_id"
                  placeholder="请选择客户"
                  filterable
                  remote
                  :remote-method="searchCustomers"
                  :loading="customerLoading"
                  style="width: 100%"
                  @change="handleCustomerChange"
                >
                  <el-option
                    v-for="customer in customers"
                    :key="customer.id"
                    :label="`${customer.code} - ${customer.name}`"
                    :value="customer.id"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="负责人" prop="sales_id">
                <el-select v-model="opportunityForm.sales_id" placeholder="请选择负责人" style="width: 100%">
                  <el-option v-for="user in salesUsers" :key="user.id" :label="user.name" :value="user.id"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="商机阶段">
                <el-select v-model="opportunityForm.stage" placeholder="请选择阶段" style="width: 100%">
                  <el-option label="初步接洽" value="initial_contact"></el-option>
                  <el-option label="需求确认" value="requirements"></el-option>
                  <el-option label="方案报价" value="quotation"></el-option>
                  <el-option label="技术评审" value="technical_review"></el-option>
                  <el-option label="商务谈判" value="business_negotiation"></el-option>
                  <el-option label="成交" value="won"></el-option>
                  <el-option label="丢单" value="lost"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="优先级">
                <el-select v-model="opportunityForm.priority" placeholder="请选择优先级" style="width: 100%">
                  <el-option label="紧急" value="urgent"></el-option>
                  <el-option label="重要" value="important"></el-option>
                  <el-option label="普通" value="normal"></el-option>
                  <el-option label="低" value="low"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="预期签约日期">
                <el-date-picker
                  v-model="opportunityForm.expected_signing_date"
                  type="date"
                  placeholder="选择日期"
                  style="width: 100%"
                  value-format="YYYY-MM-DD"
                ></el-date-picker>
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <el-card class="form-card">
          <template #header>
            <div class="card-header">
              <span>商务信息</span>
            </div>
          </template>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="预算金额(万)">
                <el-input-number
                  v-model="opportunityForm.budget_amount"
                  :precision="2"
                  :min="0"
                  :step="1"
                  style="width: 100%"
                ></el-input-number>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="交付周期(天)">
                <el-input-number
                  v-model="opportunityForm.delivery_cycle"
                  :min="0"
                  :step="1"
                  style="width: 100%"
                ></el-input-number>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="联系人">
                <el-input v-model="opportunityForm.contact_person" placeholder="请输入联系人姓名"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="联系电话">
                <el-input v-model="opportunityForm.contact_phone" placeholder="请输入联系电话"></el-input>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="联系邮箱">
                <el-input v-model="opportunityForm.contact_email" placeholder="请输入联系邮箱"></el-input>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="设备需求">
            <el-input
              v-model="opportunityForm.equipment_requirements"
              type="textarea"
              :rows="3"
              placeholder="请描述设备需求：设备型号、数量、技术参数等"
              maxlength="2000"
              show-word-limit
            ></el-input>
          </el-form-item>

          <el-form-item label="产能情况">
            <el-input
              v-model="opportunityForm.production_capacity"
              placeholder="请描述客户现有产能情况"
              maxlength="500"
            ></el-input>
          </el-form-item>
        </el-card>

        <el-card class="form-card">
          <template #header>
            <div class="card-header">
              <span>竞争信息</span>
            </div>
          </template>

          <el-form-item label="主要竞争对手">
            <el-input
              v-model="opportunityForm.competitor_info"
              placeholder="请输入主要竞争对手名称"
              maxlength="200"
            ></el-input>
          </el-form-item>

          <el-form-item label="我方优势">
            <el-input
              v-model="opportunityForm.competitor_advantage"
              type="textarea"
              :rows="3"
              placeholder="请描述我方相对竞争对手的优势"
              maxlength="1000"
            ></el-input>
          </el-form-item>

          <el-form-item label="我方劣势">
            <el-input
              v-model="opportunityForm.competitor_disadvantage"
              type="textarea"
              :rows="3"
              placeholder="请描述我方相对竞争对手的劣势"
              maxlength="1000"
            ></el-input>
          </el-form-item>

          <el-form-item label="备注">
            <el-input
              v-model="opportunityForm.remarks"
              type="textarea"
              :rows="3"
              placeholder="其他备注信息"
              maxlength="1000"
            ></el-input>
          </el-form-item>
        </el-card>
      </el-form>
    </div>
  </div>
</template>

<script>
import api from '@/api'

export default {
  name: 'OpportunityForm',
  data() {
    return {
      isEdit: false,
      opportunityId: null,
      submitLoading: false,
      customerLoading: false,
      customers: [],
      salesUsers: [],
      opportunityForm: {
        name: '',
        customer_id: null,
        sales_id: null,
        contact_person: '',
        contact_phone: '',
        contact_email: '',
        stage: 'initial_contact',
        equipment_requirements: '',
        production_capacity: '',
        budget_amount: null,
        delivery_cycle: null,
        expected_signing_date: '',
        competitor_info: '',
        competitor_advantage: '',
        competitor_disadvantage: '',
        remarks: '',
        priority: 'normal'
      },
      formRules: {
        name: [{ required: true, message: '商机名称不能为空', trigger: 'blur' }],
        customer_id: [{ required: true, message: '请选择关联客户', trigger: 'change' }]
      }
    }
  },
  mounted() {
    this.opportunityId = this.$route.params.id
    this.isEdit = !!this.opportunityId

    if (this.isEdit) {
      this.loadOpportunityData()
    }

    this.loadSalesUsers()
    this.loadAllCustomers()
  },
  methods: {
    async loadOpportunityData() {
      try {
        const response = await api.getOpportunity(this.opportunityId)
        if (response && response.success) {
          const data = response.data
          this.opportunityForm = {
            name: data.name,
            customer_id: data.customer_id,
            sales_id: data.sales_id,
            contact_person: data.contact_person || '',
            contact_phone: data.contact_phone || '',
            contact_email: data.contact_email || '',
            stage: data.stage || 'initial_contact',
            equipment_requirements: data.equipment_requirements || '',
            production_capacity: data.production_capacity || '',
            budget_amount: data.budget_amount,
            delivery_cycle: data.delivery_cycle,
            expected_signing_date: data.expected_signing_date ? this.formatDateForInput(data.expected_signing_date) : '',
            competitor_info: data.competitor_info || '',
            competitor_advantage: data.competitor_advantage || '',
            competitor_disadvantage: data.competitor_disadvantage || '',
            remarks: data.remarks || '',
            priority: data.priority || 'normal'
          }
          this.customers = [{ id: data.customer_id, code: data.customer_code, name: data.customer_name }]
        }
      } catch (error) {
        console.warn('获取商机数据失败:', error)
        this.$message.error('获取商机数据失败')
      }
    },
    async loadAllCustomers() {
      try {
        const response = await api.getCustomers({ page: 1, limit: 1000 })
        if (response && response.success) {
          this.customers = response.data.customers || response.customers || []
        }
      } catch (error) {
        console.warn('获取客户列表失败:', error)
      }
    },
    async searchCustomers(query) {
      if (!query) {
        this.loadAllCustomers()
        return
      }
      this.customerLoading = true
      try {
        const response = await api.getCustomers({ page: 1, limit: 50, keyword: query })
        if (response && response.success) {
          this.customers = response.data.customers || response.customers || []
        }
      } catch (error) {
        console.warn('搜索客户失败:', error)
      } finally {
        this.customerLoading = false
      }
    },
    async loadSalesUsers() {
      try {
        const response = await api.getSalesUsers()
        if (response && response.success) {
          this.salesUsers = response.data
        }
      } catch (error) {
        console.warn('获取销售用户失败:', error)
      }
    },
    handleCustomerChange(customerId) {
      this.opportunityForm.customer_id = customerId
    },
    async submitForm() {
      const valid = await this.$refs.opportunityFormRef.validate().catch(() => false)
      if (!valid) return

      this.submitLoading = true
      try {
        let response
        if (this.isEdit) {
          response = await api.updateOpportunity(this.opportunityId, this.opportunityForm)
        } else {
          response = await api.createOpportunity(this.opportunityForm)
        }

        if (response && response.success) {
          this.$message.success(this.isEdit ? '商机更新成功' : '商机创建成功')
          this.$router.push('/crm/opportunities')
        } else {
          this.$message.error(response?.message || (this.isEdit ? '更新失败' : '创建失败'))
        }
      } catch (error) {
        console.warn('提交商机失败:', error)
        this.$message.error(this.isEdit ? '更新失败' : '创建失败')
      } finally {
        this.submitLoading = false
      }
    },
    goBack() {
      this.$router.push('/crm/opportunities')
    },
    formatDateForInput(date) {
      if (!date) return ''
      if (typeof date === 'string' && date.includes('T')) {
        return date.split('T')[0]
      }
      return date
    }
  }
}
</script>

<style scoped>
.opportunity-form {
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
  max-width: 1200px;
}

.form-card {
  margin-bottom: 20px;
}

.card-header {
  font-weight: bold;
}

.header-actions {
  display: flex;
  gap: 10px;
}
</style>
