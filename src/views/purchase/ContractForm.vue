<template>
  <div class="contract-form">
    <el-card shadow="hover">
      <template #header>
        <h3 class="text-lg font-bold">{{ isEdit ? '编辑合同' : '添加合同' }}</h3>
      </template>
      
      <el-form :model="form" :rules="rules" ref="form" label-width="120px" class="mt-4">
        <el-form-item label="合同类型" prop="contractType">
          <el-radio-group v-model="form.contractType" @change="handleContractTypeChange">
            <el-radio label="nda">NDA保密协议</el-radio>
            <el-radio label="purchase">多物品采购合同</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="合同编号" prop="contractNumber">
          <el-input v-model="form.contractNumber" placeholder="输入合同编号"></el-input>
        </el-form-item>
        
        <el-form-item label="合同名称" prop="contractName">
          <el-input v-model="form.contractName" placeholder="输入合同名称"></el-input>
        </el-form-item>
        
        <el-form-item label="供应商" prop="supplierId">
          <el-select v-model="form.supplierId" placeholder="选择供应商" style="width: 100%">
            <el-option v-for="supplier in suppliers" :key="supplier.id" :label="supplier.name" :value="supplier.id"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="签订日期" prop="signDate">
          <el-date-picker v-model="form.signDate" type="date" placeholder="选择签订日期" style="width: 100%"></el-date-picker>
        </el-form-item>
        
        <el-form-item label="到期日期" prop="expiryDate">
          <el-date-picker v-model="form.expiryDate" type="date" placeholder="选择到期日期" style="width: 100%"></el-date-picker>
        </el-form-item>
        
        <el-form-item label="合同状态" prop="status">
          <el-select v-model="form.status" placeholder="选择状态" style="width: 100%">
            <el-option label="草稿" value="draft"></el-option>
            <el-option label="生效中" value="active"></el-option>
            <el-option label="已过期" value="expired"></el-option>
          </el-select>
        </el-form-item>
        
        <!-- 采购合同特有字段 -->
        <div v-if="form.contractType === 'purchase'">
          <el-form-item label="采购物品" prop="items">
            <el-table :data="form.items" style="width: 100%" border>
              <el-table-column prop="name" label="物品名称">
                <template #default="scope">
                  <el-input v-model="scope.row.name" placeholder="输入物品名称"></el-input>
                </template>
              </el-table-column>
              <el-table-column prop="spec" label="规格型号">
                <template #default="scope">
                  <el-input v-model="scope.row.spec" placeholder="输入规格型号"></el-input>
                </template>
              </el-table-column>
              <el-table-column prop="quantity" label="数量">
                <template #default="scope">
                  <el-input-number v-model="scope.row.quantity" :min="1" @change="calculateItemTotal(scope.row)"></el-input-number>
                </template>
              </el-table-column>
              <el-table-column prop="unit" label="单位">
                <template #default="scope">
                  <el-input v-model="scope.row.unit" placeholder="输入单位"></el-input>
                </template>
              </el-table-column>
              <el-table-column prop="unitPrice" label="单价">
                <template #default="scope">
                  <el-input-number v-model="scope.row.unitPrice" :min="0" :step="0.01" :precision="2" @change="calculateItemTotal(scope.row)"></el-input-number>
                </template>
              </el-table-column>
              <el-table-column prop="totalPrice" label="总价" width="120">
                <template #default="scope">
                  {{ scope.row.totalPrice ? scope.row.totalPrice.toFixed(2) : '0.00' }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100">
                <template #default="scope">
                  <el-button type="danger" size="small" @click="removeItem(scope.$index)">
                    <i class="fa fa-trash"></i>
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-button type="primary" size="small" @click="addItem" class="mt-2">
              <i class="fa fa-plus mr-2"></i>添加物品
            </el-button>
          </el-form-item>
          
          <el-form-item label="合同总金额" prop="amount">
            <el-input-number v-model="form.amount" :min="0" :step="0.01" :precision="2" readonly style="width: 100%"></el-input-number>
          </el-form-item>
        </div>
        
        <el-form-item label="合同内容" prop="content">
          <div class="editor-container">
            <el-button type="primary" @click="insertImage" class="mb-2">
              <i class="fa fa-image mr-2"></i>插入图片
            </el-button>
            <el-button type="info" @click="insertLink" class="mb-2 ml-2">
              <i class="fa fa-link mr-2"></i>插入链接
            </el-button>
            <textarea
              v-model="form.content"
              placeholder="输入合同内容（支持HTML格式）"
              rows="10"
              style="width: 100%; padding: 10px; border: 1px solid #dcdfe6; border-radius: 4px; resize: vertical"
            ></textarea>
          </div>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitForm">提交</el-button>
          <el-button @click="resetForm">重置</el-button>
          <el-button @click="cancel">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 插入图片对话框 -->
    <el-dialog title="插入图片" v-model="imageDialogVisible" width="400px">
      <el-form :model="imageForm" label-width="80px">
        <el-form-item label="图片URL">
          <el-input v-model="imageForm.url" placeholder="输入图片URL"></el-input>
        </el-form-item>
        <el-form-item label="图片描述">
          <el-input v-model="imageForm.alt" placeholder="输入图片描述"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="imageDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmInsertImage">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 插入链接对话框 -->
    <el-dialog title="插入链接" v-model="linkDialogVisible" width="400px">
      <el-form :model="linkForm" label-width="80px">
        <el-form-item label="链接文本">
          <el-input v-model="linkForm.text" placeholder="输入链接文本"></el-input>
        </el-form-item>
        <el-form-item label="链接URL">
          <el-input v-model="linkForm.url" placeholder="输入链接URL"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="linkDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmInsertLink">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'ContractForm',
  data() {
    return {
      isEdit: !!this.$route.params.id,
      form: {
        contractType: 'nda',
        contractNumber: '',
        contractName: '',
        supplierId: '',
        signDate: new Date(),
        expiryDate: new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()),
        status: 'draft',
        amount: 0,
        content: '',
        items: []
      },
      suppliers: [
        { id: 1, name: '供应商A' },
        { id: 2, name: '供应商B' },
        { id: 3, name: '供应商C' }
      ],
      imageDialogVisible: false,
      linkDialogVisible: false,
      imageForm: {
        url: '',
        alt: ''
      },
      linkForm: {
        text: '',
        url: ''
      },
      rules: {
        contractType: [{ required: true, message: '请选择合同类型', trigger: 'change' }],
        contractNumber: [{ required: true, message: '请输入合同编号', trigger: 'blur' }],
        contractName: [{ required: true, message: '请输入合同名称', trigger: 'blur' }],
        supplierId: [{ required: true, message: '请选择供应商', trigger: 'change' }],
        signDate: [{ required: true, message: '请选择签订日期', trigger: 'change' }],
        expiryDate: [{ required: true, message: '请选择到期日期', trigger: 'change' }],
        status: [{ required: true, message: '请选择合同状态', trigger: 'change' }],
        content: [{ required: true, message: '请输入合同内容', trigger: 'blur' }]
      }
    }
  },
  mounted() {
    if (this.isEdit) {
      this.loadContract()
    }
  },
  methods: {
    loadContract() {
      // 模拟加载合同数据
      this.form = {
        contractType: 'purchase',
        contractNumber: 'HT2026002',
        contractName: '钢材采购合同',
        supplierId: '1',
        signDate: new Date('2026-01-10'),
        expiryDate: new Date('2026-12-31'),
        status: 'active',
        amount: 58000,
        content: '<h3>1. 合同双方</h3><p>甲方：采购方</p><p>乙方：供应商A</p><h3>2. 采购物品</h3><p>详见采购物品清单</p><h3>3. 交付时间</h3><p>2026年3月31日前</p><h3>4. 付款方式</h3><p>货到付款</p>',
        items: [
          { name: '钢材', spec: 'Q235', quantity: 10000, unit: 'kg', unitPrice: 5.8, totalPrice: 58000 }
        ]
      }
    },
    handleContractTypeChange() {
      if (this.form.contractType === 'nda') {
        this.form.items = []
        this.form.amount = 0
      } else {
        this.addItem()
      }
    },
    addItem() {
      this.form.items.push({
        name: '',
        spec: '',
        quantity: 1,
        unit: '',
        unitPrice: 0,
        totalPrice: 0
      })
    },
    removeItem(index) {
      this.form.items.splice(index, 1)
      this.calculateTotal()
    },
    calculateItemTotal(item) {
      item.totalPrice = item.quantity * item.unitPrice
      this.calculateTotal()
    },
    calculateTotal() {
      let total = 0
      this.form.items.forEach(item => {
        total += item.totalPrice
      })
      this.form.amount = total
    },
    insertImage() {
      this.imageDialogVisible = true
    },
    insertLink() {
      this.linkDialogVisible = true
    },
    confirmInsertImage() {
      const imageHtml = `<img src="${this.imageForm.url}" alt="${this.imageForm.alt}" style="max-width: 100%;">`
      this.form.content += imageHtml
      this.imageDialogVisible = false
      this.imageForm = { url: '', alt: '' }
    },
    confirmInsertLink() {
      const linkHtml = `<a href="${this.linkForm.url}" target="_blank">${this.linkForm.text}</a>`
      this.form.content += linkHtml
      this.linkDialogVisible = false
      this.linkForm = { text: '', url: '' }
    },
    submitForm() {
      this.$refs.form.validate((valid) => {
        if (valid) {
          // 模拟提交
          this.$message.success(this.isEdit ? '合同更新成功' : '合同添加成功')
          this.$router.push('/purchase/contract')
        } else {
          return false
        }
      })
    },
    resetForm() {
      this.$refs.form.resetFields()
      this.form.items = []
      this.form.amount = 0
    },
    cancel() {
      this.$router.push('/purchase/contract')
    }
  }
}
</script>

<style scoped>
.contract-form {
  padding: 20px;
}

.editor-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
  background: #f9f9f9;
}
</style>