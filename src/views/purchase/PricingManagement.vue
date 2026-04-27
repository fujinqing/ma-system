<template>
  <div class="pricing-management">
    <el-card shadow="hover" class="mb-4">
      <template #header>
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-bold">定价管理</h3>
          <el-button type="primary" @click="addPricing">
            <i class="fa fa-plus mr-2"></i>添加定价
          </el-button>
        </div>
      </template>
      
      <div class="pricing-filters mb-4 flex flex-wrap gap-4">
        <el-select v-model="filters.supplierId" placeholder="选择供应商" style="width: 200px">
          <el-option label="全部" value=""></el-option>
          <el-option v-for="supplier in suppliers" :key="supplier.id" :label="supplier.name" :value="supplier.id"></el-option>
        </el-select>
        <el-select v-model="filters.materialId" placeholder="选择物料" style="width: 200px">
          <el-option label="全部" value=""></el-option>
          <el-option v-for="material in materials" :key="material.id" :label="material.name" :value="material.id"></el-option>
        </el-select>
        <el-button type="primary" @click="searchPricing">查询</el-button>
      </div>
      
      <el-table :data="pricingList" style="width: 100%">
        <el-table-column prop="supplierName" label="供应商" width="180"></el-table-column>
        <el-table-column prop="materialName" label="物料" width="180"></el-table-column>
        <el-table-column prop="spec" label="规格型号"></el-table-column>
        <el-table-column prop="unit" label="单位" width="80"></el-table-column>
        <el-table-column prop="price" label="单价" width="120">
          <template #default="scope">
            {{ scope.row.price.toFixed(2) }} 元
          </template>
        </el-table-column>
        <el-table-column prop="currency" label="货币" width="100"></el-table-column>
        <el-table-column prop="effectiveDate" label="生效日期"></el-table-column>
        <el-table-column prop="expiryDate" label="失效日期"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getPriceStatusType(scope.row.status)">{{ getPriceStatusText(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button size="small" type="primary" @click="editPricing(scope.row.id)">
              <i class="fa fa-edit"></i>
            </el-button>
            <el-button size="small" type="danger" @click="deletePricing(scope.row.id)">
              <i class="fa fa-trash"></i>
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination mt-4">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="total"
          :page-size="10"
          @current-change="handleCurrentChange"
        ></el-pagination>
      </div>
    </el-card>
    
    <!-- 添加/编辑定价对话框 -->
    <el-dialog :title="isEditing ? '编辑定价' : '添加定价'" v-model="pricingDialogVisible" width="600px">
      <el-form :model="pricingForm" :rules="pricingRules" ref="pricingForm" label-width="120px">
        <el-form-item label="供应商" prop="supplierId">
          <el-select v-model="pricingForm.supplierId" placeholder="选择供应商" style="width: 100%">
            <el-option v-for="supplier in suppliers" :key="supplier.id" :label="supplier.name" :value="supplier.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="物料" prop="materialId">
          <el-select v-model="pricingForm.materialId" placeholder="选择物料" style="width: 100%" @change="handleMaterialChange">
            <el-option v-for="material in materials" :key="material.id" :label="material.name" :value="material.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="规格型号" prop="spec">
          <el-input v-model="pricingForm.spec" placeholder="输入规格型号" readonly></el-input>
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="pricingForm.unit" placeholder="输入单位" readonly></el-input>
        </el-form-item>
        <el-form-item label="单价" prop="price">
          <el-input-number v-model="pricingForm.price" :min="0" :step="0.01" :precision="2" style="width: 100%"></el-input-number>
        </el-form-item>
        <el-form-item label="货币" prop="currency">
          <el-select v-model="pricingForm.currency" placeholder="选择货币" style="width: 100%">
            <el-option label="人民币 (CNY)" value="CNY"></el-option>
            <el-option label="美元 (USD)" value="USD"></el-option>
            <el-option label="欧元 (EUR)" value="EUR"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="生效日期" prop="effectiveDate">
          <el-date-picker v-model="pricingForm.effectiveDate" type="date" placeholder="选择生效日期" style="width: 100%"></el-date-picker>
        </el-form-item>
        <el-form-item label="失效日期" prop="expiryDate">
          <el-date-picker v-model="pricingForm.expiryDate" type="date" placeholder="选择失效日期" style="width: 100%"></el-date-picker>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="pricingDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="savePricing">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'PricingManagement',
  data() {
    return {
      filters: {
        supplierId: '',
        materialId: ''
      },
      total: 20,
      suppliers: [
        { id: 1, name: '供应商A' },
        { id: 2, name: '供应商B' },
        { id: 3, name: '供应商C' }
      ],
      materials: [
        { id: 1, name: '钢材', spec: 'Q235', unit: 'kg' },
        { id: 2, name: '铝材', spec: '6061', unit: 'kg' },
        { id: 3, name: '塑料', spec: 'ABS', unit: 'kg' },
        { id: 4, name: '轴承', spec: '6204', unit: '个' }
      ],
      pricingList: [
        {
          id: 1,
          supplierName: '供应商A',
          materialName: '钢材',
          spec: 'Q235',
          unit: 'kg',
          price: 5.8,
          currency: 'CNY',
          effectiveDate: '2026-01-01',
          expiryDate: '2026-12-31',
          status: 'active'
        },
        {
          id: 2,
          supplierName: '供应商A',
          materialName: '铝材',
          spec: '6061',
          unit: 'kg',
          price: 18.5,
          currency: 'CNY',
          effectiveDate: '2026-01-01',
          expiryDate: '2026-12-31',
          status: 'active'
        },
        {
          id: 3,
          supplierName: '供应商B',
          materialName: '塑料',
          spec: 'ABS',
          unit: 'kg',
          price: 12.0,
          currency: 'CNY',
          effectiveDate: '2026-01-01',
          expiryDate: '2026-12-31',
          status: 'active'
        },
        {
          id: 4,
          supplierName: '供应商C',
          materialName: '轴承',
          spec: '6204',
          unit: '个',
          price: 15.5,
          currency: 'CNY',
          effectiveDate: '2026-01-01',
          expiryDate: '2026-12-31',
          status: 'active'
        }
      ],
      pricingDialogVisible: false,
      isEditing: false,
      pricingForm: {
        supplierId: '',
        materialId: '',
        spec: '',
        unit: '',
        price: 0,
        currency: 'CNY',
        effectiveDate: new Date(),
        expiryDate: new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate())
      },
      pricingRules: {
        supplierId: [{ required: true, message: '请选择供应商', trigger: 'change' }],
        materialId: [{ required: true, message: '请选择物料', trigger: 'change' }],
        price: [{ required: true, message: '请输入单价', trigger: 'blur' }, { type: 'number', min: 0, message: '单价必须大于0', trigger: 'blur' }],
        effectiveDate: [{ required: true, message: '请选择生效日期', trigger: 'change' }],
        expiryDate: [{ required: true, message: '请选择失效日期', trigger: 'change' }]
      }
    }
  },
  methods: {
    addPricing() {
      this.isEditing = false
      this.pricingForm = {
        supplierId: '',
        materialId: '',
        spec: '',
        unit: '',
        price: 0,
        currency: 'CNY',
        effectiveDate: new Date(),
        expiryDate: new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate())
      }
      this.pricingDialogVisible = true
    },
    editPricing(id) {
      this.isEditing = true
      // 模拟加载定价数据
      this.pricingForm = {
        supplierId: '1',
        materialId: '1',
        spec: 'Q235',
        unit: 'kg',
        price: 5.8,
        currency: 'CNY',
        effectiveDate: new Date('2026-01-01'),
        expiryDate: new Date('2026-12-31')
      }
      this.pricingDialogVisible = true
    },
    deletePricing(id) {
      this.$confirm('确定要删除此定价吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$message.success('定价已删除')
      })
    },
    savePricing() {
      this.$refs.pricingForm.validate((valid) => {
        if (valid) {
          this.$message.success(this.isEditing ? '定价更新成功' : '定价添加成功')
          this.pricingDialogVisible = false
        }
      })
    },
    handleMaterialChange(value) {
      const material = this.materials.find(m => m.id === value)
      if (material) {
        this.pricingForm.spec = material.spec
        this.pricingForm.unit = material.unit
      }
    },
    searchPricing() {
      this.$message.info('搜索功能已触发')
    },
    getPriceStatusType(status) {
      const types = {
        active: 'success',
        expired: 'info',
        future: 'warning'
      }
      return types[status] || 'info'
    },
    getPriceStatusText(status) {
      const texts = {
        active: '生效中',
        expired: '已过期',
        future: '未生效'
      }
      return texts[status] || '未知'
    },
    handleCurrentChange(page) {
      console.log('Current page:', page)
    }
  }
}
</script>

<style scoped>
.pricing-management {
  padding: 20px;
}

.pagination {
  display: flex;
  justify-content: center;
}

.pricing-filters {
  padding: 10px;
  background: #f9f9f9;
  border-radius: 4px;
  margin-bottom: 20px;
}
</style>