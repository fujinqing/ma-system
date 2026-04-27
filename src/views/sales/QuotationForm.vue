<template>
  <div class="quotation-form">
    <div class="page-header">
      <h2 class="page-title">添加报价</h2>
      <el-button type="primary" @click="submitForm">保存</el-button>
      <el-button @click="cancel">取消</el-button>
    </div>
    
    <el-form :model="quotationForm" :rules="rules" ref="quotationFormRef" label-width="120px">
      <el-form-item label="客户" prop="customer_id">
        <el-select v-model="quotationForm.customer_id" placeholder="请选择客户">
          <el-option v-for="customer in customers" :key="customer.id" :label="customer.name" :value="customer.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="项目" prop="project_id">
        <el-select v-model="quotationForm.project_id" placeholder="请选择项目">
          <el-option v-for="project in projects" :key="project.id" :label="project.name" :value="project.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="报价编号" prop="quotation_no">
        <el-input v-model="quotationForm.quotation_no" placeholder="请输入报价编号"></el-input>
      </el-form-item>
      
      <el-form-item label="报价模块">
        <el-button type="primary" size="small" @click="addModule" style="margin-bottom: 10px;">
          <i class="fa fa-plus"></i> 添加模块
        </el-button>
        <el-table :data="quotationForm.items" style="width: 100%" border>
          <el-table-column prop="module_name" label="模块名称" min-width="150">
            <template #default="scope">
              <el-input v-model="scope.row.module_name" placeholder="请输入模块名称"></el-input>
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="100">
            <template #default="scope">
              <el-input v-model.number="scope.row.quantity" type="number" placeholder="数量" @change="calculateTotal"></el-input>
            </template>
          </el-table-column>
          <el-table-column prop="cost" label="成本(元)" width="120">
            <template #default="scope">
              <el-input v-model.number="scope.row.cost" type="number" placeholder="成本" @change="calculateTotal"></el-input>
            </template>
          </el-table-column>
          <el-table-column prop="price" label="报价(元)" width="120">
            <template #default="scope">
              <el-input v-model.number="scope.row.price" type="number" placeholder="报价" @change="calculateTotal"></el-input>
            </template>
          </el-table-column>
          <el-table-column prop="subtotal" label="小计(元)" width="120">
            <template #default="scope">
              <span>{{ (scope.row.quantity * scope.row.price).toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80">
            <template #default="scope">
              <el-button type="danger" size="small" @click="removeModule(scope.$index)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-form-item>
      
      <el-form-item label="总金额" prop="total_amount">
        <el-input v-model="quotationForm.total_amount" type="number" placeholder="总金额" readonly></el-input>
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="quotationForm.remark" type="textarea" placeholder="请输入备注"></el-input>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
export default {
  name: 'QuotationForm',
  data() {
    return {
      quotationForm: {
        customer_id: '',
        project_id: '',
        quotation_no: '',
        items: [
          {
            module_name: '',
            quantity: 1,
            cost: 0,
            price: 0
          }
        ],
        total_amount: 0,
        remark: ''
      },
      rules: {
        customer_id: [
          { required: true, message: '请选择客户', trigger: 'blur' }
        ],
        project_id: [
          { required: true, message: '请选择项目', trigger: 'blur' }
        ],
        quotation_no: [
          { required: true, message: '请输入报价编号', trigger: 'blur' }
        ]
      },
      customers: [
        { id: 1, name: '客户1' },
        { id: 2, name: '客户2' },
        { id: 3, name: '客户3' }
      ],
      projects: [
        { id: 1, name: '项目1' },
        { id: 2, name: '项目2' },
        { id: 3, name: '项目3' }
      ]
    }
  },
  methods: {
    addModule() {
      this.quotationForm.items.push({
        module_name: '',
        quantity: 1,
        cost: 0,
        price: 0
      })
    },
    removeModule(index) {
      this.quotationForm.items.splice(index, 1)
      this.calculateTotal()
    },
    calculateTotal() {
      let total = 0
      this.quotationForm.items.forEach(item => {
        total += item.quantity * item.price
      })
      this.quotationForm.total_amount = total
    },
    submitForm() {
      this.$refs.quotationFormRef.validate((valid) => {
        if (valid) {
          // 模拟提交表单
          setTimeout(() => {
            this.$message.success('保存成功')
            this.$router.push('/sales/quotation')
          }, 1000)
        }
      })
    },
    cancel() {
      this.$router.push('/sales/quotation')
    }
  }
}
</script>

<style scoped>
.quotation-form {
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
</style>