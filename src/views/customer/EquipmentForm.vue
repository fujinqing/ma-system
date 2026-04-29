<template>
  <div class="equipment-form-page">
    <div class="page-header">
      <h2 class="page-title">{{ isEdit ? '编辑设备' : '新增设备' }}</h2>
      <div class="header-actions">
        <el-button @click="goBack">返回</el-button>
      </div>
    </div>
    <div class="form-container">
      <el-form :model="form" ref="formRef" label-width="120px">
        <el-form-item label="设备名称">
          <el-input v-model="form.equipment_name" placeholder="请输入设备名称"></el-input>
        </el-form-item>
        <el-form-item label="设备编码">
          <el-input v-model="form.equipment_code" placeholder="请输入设备编码"></el-input>
        </el-form-item>
        <el-form-item label="关联客户">
          <el-select v-model="form.customer_id" placeholder="请选择客户" filterable style="width: 100%;">
            <el-option v-for="c in customers" :key="c.id" :label="c.name" :value="c.id"></el-option>
          </el-select>
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
  name: 'EquipmentForm',
  data() {
    return {
      form: {
        equipment_name: '',
        equipment_code: '',
        customer_id: null
      },
      customers: [],
      submitLoading: false,
      isEdit: false
    }
  },
  mounted() {
    this.isEdit = !!this.$route.params.id
    this.loadCustomers()
  },
  methods: {
    async loadCustomers() {
      try {
        const response = await api.getCustomers({ page: 1, limit: 1000 })
        if (response && response.success) {
          this.customers = response.data?.customers || []
        }
      } catch (error) {
        console.warn('获取客户列表失败')
      }
    },
    async submitForm() {
      this.submitLoading = true
      try {
        if (this.isEdit) {
          await api.updateEquipment(this.$route.params.id, this.form)
        } else {
          await api.createEquipment(this.form)
        }
        this.$message.success('保存成功')
        this.goBack()
      } catch (error) {
        this.$message.error('保存失败')
      } finally {
        this.submitLoading = false
      }
    },
    goBack() {
      this.$router.push('/crm/equipment')
    }
  }
}
</script>

<style scoped>
.equipment-form-page { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-title { margin: 0; font-size: 20px; color: #303133; }
.form-container { background: #fff; border-radius: 8px; padding: 20px; max-width: 600px; }
</style>
