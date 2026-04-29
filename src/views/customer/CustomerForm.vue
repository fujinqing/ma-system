<template>
  <div class="customer-form">
    <div class="page-header">
      <h2 class="page-title">{{ isEdit ? '编辑客户' : '新建客户' }}</h2>
      <el-button type="primary" @click="submitForm" :loading="submitLoading">
        {{ isEdit ? '更新' : '保存' }}
      </el-button>
      <el-button @click="cancel">取消</el-button>
    </div>
    
    <el-form :model="customerForm" :rules="rules" ref="customerFormRef" label-width="120px">
      <el-card class="form-section">
        <template #header>
          <div class="card-header">
            <span>基本信息</span>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户名称" prop="name">
              <el-input v-model="customerForm.name" placeholder="请输入客户名称"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户简称" prop="short_name">
              <el-input v-model="customerForm.short_name" placeholder="请输入客户简称"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="客户类型" prop="customer_type">
              <el-select v-model="customerForm.customer_type" placeholder="请选择客户类型" style="width: 100%">
                <el-option label="潜在客户" value="potential"></el-option>
                <el-option label="意向客户" value="intentional"></el-option>
                <el-option label="正式客户" value="formal"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="企业类别" prop="enterprise_category">
              <el-select v-model="customerForm.enterprise_category" placeholder="请选择企业类别" style="width: 100%">
                <el-option label="设备厂商" value="equipment_vendor"></el-option>
                <el-option label="集成商" value="integrator"></el-option>
                <el-option label="终端客户" value="end_customer"></el-option>
                <el-option label="代理商" value="agent"></el-option>
                <el-option label="外协厂" value="subcontractor"></el-option>
                <el-option label="贸易商" value="trader"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="客户池" prop="customer_pool_type">
              <el-select v-model="customerForm.customer_pool_type" placeholder="请选择客户池" style="width: 100%">
                <el-option label="公海" value="public"></el-option>
                <el-option label="私海" value="private"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="客户等级" prop="level">
              <el-select v-model="customerForm.level" placeholder="请选择客户等级" style="width: 100%">
                <el-option label="VIP" value="vip"></el-option>
                <el-option label="重点客户" value="important"></el-option>
                <el-option label="普通客户" value="normal"></el-option>
                <el-option label="低价值客户" value="low"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户来源" prop="source">
              <el-select v-model="customerForm.source" placeholder="请选择客户来源" style="width: 100%">
                <el-option label="自然流量" value="organic"></el-option>
                <el-option label="广告投放" value="advertising"></el-option>
                <el-option label="客户推荐" value="referral"></el-option>
                <el-option label="展会获客" value="exhibition"></el-option>
                <el-option label="电话营销" value="telemarketing"></el-option>
                <el-option label="主动开发" value="active_dev"></el-option>
                <el-option label="渠道推荐" value="channel"></el-option>
                <el-option label="其他" value="other"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属行业" prop="industry">
              <el-select v-model="customerForm.industry" placeholder="请选择所属行业" style="width: 100%">
                <el-option label="汽车零部件" value="auto_parts"></el-option>
                <el-option label="3C电子" value="3c"></el-option>
                <el-option label="光伏" value="photovoltaic"></el-option>
                <el-option label="新能源" value="new_energy"></el-option>
                <el-option label="半导体" value="semiconductor"></el-option>
                <el-option label="医疗设备" value="medical"></el-option>
                <el-option label="食品饮料" value="food"></el-option>
                <el-option label="工程机械" value="engineering"></el-option>
                <el-option label="航空航天" value="aerospace"></el-option>
                <el-option label="轨道交通" value="railway"></el-option>
                <el-option label="其他" value="other"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="设备类型" prop="equipment_type">
              <el-select v-model="customerForm.equipment_type" placeholder="请选择设备类型" style="width: 100%">
                <el-option label="非标自动化" value="custom_automation"></el-option>
                <el-option label="标准设备" value="standard_equipment"></el-option>
                <el-option label="工装夹具" value="fixture"></el-option>
                <el-option label="检测设备" value="testing"></el-option>
                <el-option label="机器人" value="robot"></el-option>
                <el-option label="生产线" value="production_line"></el-option>
                <el-option label="其他" value="other"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="年采购量" prop="annual_purchase_amount">
              <el-input v-model="customerForm.annual_purchase_amount" placeholder="请输入年采购量">
                <template #append>万元</template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="合作等级" prop="cooperation_level">
              <el-select v-model="customerForm.cooperation_level" placeholder="请选择合作等级" style="width: 100%">
                <el-option label="战略合作" value="strategic"></el-option>
                <el-option label="优先供应商" value="preferred"></el-option>
                <el-option label="合格供应商" value="qualified"></el-option>
                <el-option label="备选供应商" value="alternative"></el-option>
                <el-option label="新开发" value="new"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所在区域" prop="region">
              <el-input v-model="customerForm.region" placeholder="请输入所在区域/省份"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主营设备" prop="main_equipment">
              <el-input v-model="customerForm.main_equipment" placeholder="请输入主营设备或产品" type="textarea"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="厂区地址" prop="factory_address">
              <el-input v-model="customerForm.factory_address" placeholder="请输入厂区详细地址" type="textarea"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="企业规模" prop="company_scale">
              <el-select v-model="customerForm.company_scale" placeholder="请选择企业规模" style="width: 100%">
                <el-option label="微型 (< 20人)" value="micro"></el-option>
                <el-option label="小型 (20-100人)" value="small"></el-option>
                <el-option label="中型 (100-500人)" value="medium"></el-option>
                <el-option label="大型 (500-2000人)" value="large"></el-option>
                <el-option label="超大型 (> 2000人)" value="giant"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="合作年限" prop="cooperation_years">
              <el-input v-model="customerForm.cooperation_years" placeholder="请输入合作年限" type="number"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户标签" prop="tags">
              <el-select v-model="customerForm.tags" placeholder="请选择客户标签" style="width: 100%" multiple>
                <el-option label="终端客户" value="end_customer"></el-option>
                <el-option label="集成商" value="integrator"></el-option>
                <el-option label="贸易商" value="trader"></el-option>
                <el-option label="同行外协" value="peer_cooperation"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <el-card class="form-section">
        <template #header>
          <div class="card-header">
            <span>联系方式</span>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系人" prop="contact_person">
              <el-input v-model="customerForm.contact_person" placeholder="请输入联系人姓名"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="职位" prop="contact_position">
              <el-input v-model="customerForm.contact_position" placeholder="请输入联系人职位"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系电话" prop="contact_phone">
              <el-input v-model="customerForm.contact_phone" placeholder="请输入联系电话"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="customerForm.email" placeholder="请输入邮箱地址"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="地址" prop="address">
              <el-input v-model="customerForm.address" placeholder="请输入详细地址" type="textarea"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="公司主页" prop="website">
              <el-input v-model="customerForm.website" placeholder="请输入公司主页"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <el-card class="form-section">
        <template #header>
          <div class="card-header">
            <span>银行信息</span>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开户行" prop="bank">
              <el-input v-model="customerForm.bank" placeholder="请输入开户行"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="银行账号" prop="bank_account">
              <el-input v-model="customerForm.bank_account" placeholder="请输入银行账号"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="纳税人识别号" prop="tax_id">
              <el-input v-model="customerForm.tax_id" placeholder="请输入纳税人识别号"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <el-card class="form-section">
        <template #header>
          <div class="card-header">
            <span>企业信息</span>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="年营业额" prop="annual_revenue">
              <el-input v-model="customerForm.annual_revenue" placeholder="请输入年营业额">
                <template #append>万元</template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="员工数量" prop="employee_count">
              <el-input v-model="customerForm.employee_count" placeholder="请输入员工数量"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="主营产品" prop="main_products">
              <el-input v-model="customerForm.main_products" placeholder="请输入主营产品" type="textarea"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <el-card class="form-section">
        <template #header>
          <div class="card-header">
            <span>销售分配</span>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="跟进销售" prop="sales_id">
              <el-select v-model="customerForm.sales_id" placeholder="请选择跟进销售人员" style="width: 100%">
                <el-option v-for="sales in salesUsers" :key="sales.id" :label="sales.name" :value="sales.id"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <el-card class="form-section">
        <template #header>
          <div class="card-header">
            <span>备注</span>
          </div>
        </template>
        <el-form-item label="备注信息" prop="remarks">
          <el-input v-model="customerForm.remarks" placeholder="请输入备注信息" type="textarea" :rows="4"></el-input>
        </el-form-item>
      </el-card>
    </el-form>
  </div>
</template>

<script>
import api from '@/api'

export default {
  name: 'CustomerForm',
  data() {
    return {
      isEdit: false,
      customerId: null,
      submitLoading: false,
      customerForm: {
        name: '',
        short_name: '',
        customer_type: 'potential',
        enterprise_category: '',
        customer_pool_type: 'public',
        level: 'normal',
        status: 'active',
        source: '',
        industry: '',
        equipment_type: '',
        annual_purchase_amount: '',
        cooperation_level: '',
        region: '',
        main_equipment: '',
        factory_address: '',
        company_scale: '',
        cooperation_years: null,
        tags: [],
        contact_person: '',
        contact_position: '',
        contact_phone: '',
        email: '',
        address: '',
        website: '',
        bank: '',
        bank_account: '',
        tax_id: '',
        annual_revenue: '',
        employee_count: '',
        main_products: '',
        sales_id: null,
        remarks: ''
      },
      rules: {
        name: [
          { required: true, message: '请输入客户名称', trigger: 'blur' }
        ],
        short_name: [
          { required: true, message: '请输入客户简称', trigger: 'blur' }
        ],
        contact_person: [
          { required: true, message: '请输入联系人姓名', trigger: 'blur' }
        ],
        contact_phone: [
          { required: true, message: '请输入联系电话', trigger: 'blur' }
        ],
        email: [
          { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
        ]
      },
      salesUsers: []
    }
  },
  async mounted() {
    this.isEdit = this.$route.path.includes('/edit')
    this.customerId = this.$route.params.id
    
    await this.loadSalesUsers()
    
    if (this.isEdit && this.customerId) {
      await this.loadCustomerData()
    }
    
    if (this.$route.query.name) {
      this.customerForm.name = this.$route.query.name
    }
    
    if (this.$route.query.scannedData) {
      try {
        const scannedData = JSON.parse(this.$route.query.scannedData)
        this.customerForm = { ...this.customerForm, ...scannedData }
      } catch (error) {
        console.error('解析扫描数据失败:', error)
      }
    }
  },
  methods: {
    async loadSalesUsers() {
      try {
        const response = await api.getSalesUsers()
        if (response.success) {
          this.salesUsers = response.data
        }
      } catch (error) {
        console.error('获取销售用户失败:', error)
      }
    },
    async loadCustomerData() {
      try {
        const response = await api.getCustomer(this.customerId)
        if (response.success) {
          this.customerForm = {
            ...this.customerForm,
            ...response.data
          }
        }
      } catch (error) {
        console.error('获取客户数据失败:', error)
        this.$message.error('获取客户数据失败')
      }
    },
    submitForm() {
      this.$refs.customerFormRef.validate(async (valid) => {
        if (valid) {
          this.submitLoading = true
          try {
            let response
            if (this.isEdit) {
              response = await api.updateCustomer(this.customerId, this.customerForm)
            } else {
              response = await api.createCustomer(this.customerForm)
            }

            if (response && response.success) {
              this.$message.success(this.isEdit ? '更新成功' : '保存成功')
              this.$router.push('/crm')
            } else {
              this.$message.error(response?.message || (this.isEdit ? '更新失败' : '保存失败'))
            }
          } catch (error) {
            console.error('提交表单失败:', error)
            this.$message.error(this.isEdit ? '更新失败' : '保存失败')
          } finally {
            this.submitLoading = false
          }
        }
      })
    },
    cancel() {
      this.$router.push('/crm')
    }
  }
}
</script>

<style scoped>
.customer-form {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  gap: 10px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-right: auto;
}

.form-section {
  margin-bottom: 20px;
}

.card-header {
  font-weight: 600;
  color: #303133;
}

:deep(.el-card__header) {
  padding: 12px 20px;
  background-color: #f5f7fa;
}

:deep(.el-form-item) {
  margin-bottom: 18px;
}

:deep(.el-select) {
  width: 100%;
}
</style>
