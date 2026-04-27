<template>
  <div class="competitor-form">
    <div class="page-header">
      <h2 class="page-title">{{ isEdit ? '编辑竞争对手' : '新建竞争对手' }}</h2>
    </div>

    <div class="form-container">
      <el-form :model="competitorForm" :rules="rules" ref="competitorForm" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="竞争对手名称" prop="name">
              <el-input v-model="competitorForm.name" placeholder="请输入竞争对手名称" required></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="公司名称" prop="company">
              <el-input v-model="competitorForm.company" placeholder="请输入公司名称" required></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属行业" prop="industry">
              <el-select v-model="competitorForm.industry" placeholder="请选择所属行业" required>
                <el-option v-for="industry in industries" :key="industry.value" :label="industry.label" :value="industry.value"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="竞争强度" prop="strength">
              <el-select v-model="competitorForm.strength" placeholder="请选择竞争强度" required>
                <el-option label="低" value="low"></el-option>
                <el-option label="中" value="medium"></el-option>
                <el-option label="高" value="high"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="市场份额(%)" prop="market_share">
              <el-input-number v-model="competitorForm.market_share" :min="0" :max="100" :step="1" placeholder="请输入市场份额"></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="成立时间">
              <el-date-picker v-model="competitorForm.founded_date" type="date" placeholder="选择成立时间"></el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="主要产品" prop="key_products">
          <el-input v-model="competitorForm.key_products" type="textarea" :rows="3" placeholder="请输入主要产品"></el-input>
        </el-form-item>

        <el-form-item label="核心优势" prop="core_advantages">
          <el-input v-model="competitorForm.core_advantages" type="textarea" :rows="3" placeholder="请输入核心优势"></el-input>
        </el-form-item>

        <el-form-item label="劣势" prop="disadvantages">
          <el-input v-model="competitorForm.disadvantages" type="textarea" :rows="3" placeholder="请输入劣势"></el-input>
        </el-form-item>

        <el-form-item label="市场策略" prop="market_strategy">
          <el-input v-model="competitorForm.market_strategy" type="textarea" :rows="3" placeholder="请输入市场策略"></el-input>
        </el-form-item>

        <el-form-item label="联系方式">
          <el-input v-model="competitorForm.contact_info" placeholder="请输入联系方式"></el-input>
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="competitorForm.remarks" type="textarea" :rows="2" placeholder="请输入备注信息"></el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitForm">保存</el-button>
          <el-button @click="resetForm">重置</el-button>
          <el-button @click="goBack">返回</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
import api from '@/api'

export default {
  name: 'CompetitorForm',
  data() {
    return {
      isEdit: false,
      competitorId: null,
      competitorForm: {
        name: '',
        company: '',
        industry: '',
        strength: '',
        market_share: 0,
        founded_date: null,
        key_products: '',
        core_advantages: '',
        disadvantages: '',
        market_strategy: '',
        contact_info: '',
        remarks: ''
      },
      rules: {
        name: [
          { required: true, message: '请输入竞争对手名称', trigger: 'blur' }
        ],
        company: [
          { required: true, message: '请输入公司名称', trigger: 'blur' }
        ],
        industry: [
          { required: true, message: '请选择所属行业', trigger: 'change' }
        ],
        strength: [
          { required: true, message: '请选择竞争强度', trigger: 'change' }
        ]
      },
      industries: [
        { label: '3C', value: '3c' },
        { label: '光伏', value: 'photovoltaic' },
        { label: '新能源', value: 'new_energy' },
        { label: '汽配', value: 'auto_parts' },
        { label: '医疗', value: 'medical' },
        { label: '食品', value: 'food' },
        { label: '其他', value: 'other' }
      ]
    }
  },
  mounted() {
    const id = this.$route.params.id
    if (id) {
      this.isEdit = true
      this.competitorId = id
      this.loadCompetitor()
    }
  },
  methods: {
    async loadCompetitor() {
      try {
        const response = await api.getCompetitor(this.competitorId)
        if (response.success) {
          this.competitorForm = response.data
        } else {
          this.$message.error(response.message || '获取竞争对手信息失败')
        }
      } catch (error) {
        console.error('获取竞争对手信息异常:', error)
        this.$message.error('获取竞争对手信息失败')
      }
    },
    submitForm() {
      this.$refs.competitorForm.validate(async (valid) => {
        if (valid) {
          try {
            let response
            if (this.isEdit) {
              response = await api.updateCompetitor(this.competitorId, this.competitorForm)
            } else {
              response = await api.createCompetitor(this.competitorForm)
            }
            if (response.success) {
              this.$message.success(this.isEdit ? '更新成功' : '创建成功')
              this.goBack()
            } else {
              this.$message.error(response.message || (this.isEdit ? '更新失败' : '创建失败'))
            }
          } catch (error) {
            console.error(this.isEdit ? '更新竞争对手失败:' : '创建竞争对手失败:', error)
            this.$message.error(this.isEdit ? '更新竞争对手失败' : '创建竞争对手失败')
          }
        }
      })
    },
    resetForm() {
      this.$refs.competitorForm.resetFields()
    },
    goBack() {
      this.$router.push('/crm/competitors')
    }
  }
}
</script>

<style scoped>
.competitor-form {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.form-container {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
}

.el-form-item {
  margin-bottom: 20px;
}
</style>