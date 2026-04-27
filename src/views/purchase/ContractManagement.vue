<template>
  <div class="contract-management">
    <el-card shadow="hover" class="mb-4">
      <template #header>
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-bold">合同管理</h3>
          <el-button type="primary" @click="addContract">
            <i class="fa fa-plus mr-2"></i>添加合同
          </el-button>
        </div>
      </template>
      
      <div class="contract-filters mb-4 flex flex-wrap gap-4">
        <el-select v-model="filters.contractType" placeholder="合同类型" style="width: 150px">
          <el-option label="全部" value=""></el-option>
          <el-option label="NDA保密协议" value="nda"></el-option>
          <el-option label="多物品采购合同" value="purchase"></el-option>
        </el-select>
        <el-select v-model="filters.supplierId" placeholder="选择供应商" style="width: 200px">
          <el-option label="全部" value=""></el-option>
          <el-option v-for="supplier in suppliers" :key="supplier.id" :label="supplier.name" :value="supplier.id"></el-option>
        </el-select>
        <el-date-picker
          v-model="filters.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 250px"
        ></el-date-picker>
        <el-button type="primary" @click="searchContracts">查询</el-button>
      </div>
      
      <el-table :data="contracts" style="width: 100%">
        <el-table-column prop="contractNumber" label="合同编号" width="150"></el-table-column>
        <el-table-column prop="contractName" label="合同名称" width="200"></el-table-column>
        <el-table-column prop="contractType" label="合同类型" width="120">
          <template #default="scope">
            <el-tag :type="getContractTypeType(scope.row.contractType)">{{ getContractTypeName(scope.row.contractType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="supplierName" label="供应商" width="150"></el-table-column>
        <el-table-column prop="amount" label="合同金额" width="120">
          <template #default="scope">
            {{ scope.row.amount ? scope.row.amount.toFixed(2) : '0.00' }} 元
          </template>
        </el-table-column>
        <el-table-column prop="signDate" label="签订日期"></el-table-column>
        <el-table-column prop="expiryDate" label="到期日期"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getContractStatusType(scope.row.status)">{{ getContractStatusText(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" type="primary" @click="viewContract(scope.row.id)">
              <i class="fa fa-eye"></i>
            </el-button>
            <el-button size="small" type="success" @click="editContract(scope.row.id)">
              <i class="fa fa-edit"></i>
            </el-button>
            <el-button size="small" type="danger" @click="deleteContract(scope.row.id)">
              <i class="fa fa-trash"></i>
            </el-button>
            <el-button size="small" type="info" @click="exportContract(scope.row.id)">
              <i class="fa fa-download"></i>
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
    
    <!-- 合同详情对话框 -->
    <el-dialog title="合同详情" v-model="detailDialogVisible" width="800px">
      <div class="contract-detail">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">{{ currentContract.contractName }}</h2>
          <el-tag :type="getContractTypeType(currentContract.contractType)">{{ getContractTypeName(currentContract.contractType) }}</el-tag>
        </div>
        <el-descriptions :column="2" border class="mb-4">
          <el-descriptions-item label="合同编号">{{ currentContract.contractNumber }}</el-descriptions-item>
          <el-descriptions-item label="供应商">{{ currentContract.supplierName }}</el-descriptions-item>
          <el-descriptions-item label="签订日期">{{ currentContract.signDate }}</el-descriptions-item>
          <el-descriptions-item label="到期日期">{{ currentContract.expiryDate }}</el-descriptions-item>
          <el-descriptions-item label="合同金额">{{ currentContract.amount ? currentContract.amount.toFixed(2) : '0.00' }} 元</el-descriptions-item>
          <el-descriptions-item label="状态">{{ getContractStatusText(currentContract.status) }}</el-descriptions-item>
        </el-descriptions>
        
        <div v-if="currentContract.contractType === 'purchase'" class="mb-4">
          <h3 class="font-bold mb-2">采购物品清单</h3>
          <el-table :data="currentContract.items" style="width: 100%">
            <el-table-column prop="name" label="物品名称"></el-table-column>
            <el-table-column prop="spec" label="规格型号"></el-table-column>
            <el-table-column prop="quantity" label="数量" width="100"></el-table-column>
            <el-table-column prop="unit" label="单位" width="80"></el-table-column>
            <el-table-column prop="unitPrice" label="单价" width="100">
              <template #default="scope">
                {{ scope.row.unitPrice.toFixed(2) }} 元
              </template>
            </el-table-column>
            <el-table-column prop="totalPrice" label="总价" width="120">
              <template #default="scope">
                {{ scope.row.totalPrice.toFixed(2) }} 元
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <div class="mb-4">
          <h3 class="font-bold mb-2">合同内容</h3>
          <div class="contract-content" v-html="currentContract.content"></div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="exportContract(currentContract.id)">导出PDF</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'ContractManagement',
  data() {
    return {
      filters: {
        contractType: '',
        supplierId: '',
        dateRange: []
      },
      total: 20,
      suppliers: [
        { id: 1, name: '供应商A' },
        { id: 2, name: '供应商B' },
        { id: 3, name: '供应商C' }
      ],
      contracts: [
        {
          id: 1,
          contractNumber: 'HT2026001',
          contractName: 'NDA保密协议',
          contractType: 'nda',
          supplierName: '供应商A',
          amount: 0,
          signDate: '2026-01-01',
          expiryDate: '2027-01-01',
          status: 'active'
        },
        {
          id: 2,
          contractNumber: 'HT2026002',
          contractName: '钢材采购合同',
          contractType: 'purchase',
          supplierName: '供应商A',
          amount: 58000,
          signDate: '2026-01-10',
          expiryDate: '2026-12-31',
          status: 'active'
        },
        {
          id: 3,
          contractNumber: 'HT2026003',
          contractName: '铝材采购合同',
          contractType: 'purchase',
          supplierName: '供应商B',
          amount: 92500,
          signDate: '2026-01-15',
          expiryDate: '2026-12-31',
          status: 'active'
        }
      ],
      detailDialogVisible: false,
      currentContract: {
        id: '',
        contractNumber: '',
        contractName: '',
        contractType: '',
        supplierName: '',
        amount: 0,
        signDate: '',
        expiryDate: '',
        status: '',
        content: '',
        items: []
      }
    }
  },
  methods: {
    addContract() {
      this.$router.push('/purchase/contract/add')
    },
    editContract(id) {
      this.$router.push(`/purchase/contract/edit/${id}`)
    },
    deleteContract(id) {
      this.$confirm('确定要删除此合同吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$message.success('合同已删除')
      })
    },
    viewContract(id) {
      // 模拟加载合同详情
      this.currentContract = {
        id: id,
        contractNumber: 'HT2026002',
        contractName: '钢材采购合同',
        contractType: 'purchase',
        supplierName: '供应商A',
        amount: 58000,
        signDate: '2026-01-10',
        expiryDate: '2026-12-31',
        status: 'active',
        content: '<h3>1. 合同双方</h3><p>甲方：采购方</p><p>乙方：供应商A</p><h3>2. 采购物品</h3><p>详见采购物品清单</p><h3>3. 交付时间</h3><p>2026年3月31日前</p><h3>4. 付款方式</h3><p>货到付款</p>',
        items: [
          { name: '钢材', spec: 'Q235', quantity: 10000, unit: 'kg', unitPrice: 5.8, totalPrice: 58000 }
        ]
      }
      this.detailDialogVisible = true
    },
    exportContract(id) {
      this.$message.success('合同导出中...')
    },
    searchContracts() {
      this.$message.info('搜索功能已触发')
    },
    getContractTypeType(type) {
      const types = {
        nda: 'info',
        purchase: 'success'
      }
      return types[type] || 'info'
    },
    getContractTypeName(type) {
      const names = {
        nda: 'NDA保密协议',
        purchase: '多物品采购合同'
      }
      return names[type] || '其他'
    },
    getContractStatusType(status) {
      const types = {
        active: 'success',
        expired: 'info',
        draft: 'warning'
      }
      return types[status] || 'info'
    },
    getContractStatusText(status) {
      const texts = {
        active: '生效中',
        expired: '已过期',
        draft: '草稿'
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
.contract-management {
  padding: 20px;
}

.pagination {
  display: flex;
  justify-content: center;
}

.contract-filters {
  padding: 10px;
  background: #f9f9f9;
  border-radius: 4px;
  margin-bottom: 20px;
}

.contract-content {
  line-height: 1.6;
  padding: 10px;
  border: 1px solid #eaeaea;
  border-radius: 4px;
  background: #f9f9f9;
}

.contract-content h3 {
  margin: 20px 0 10px 0;
  color: #333;
}

.contract-content p {
  margin-bottom: 10px;
}
</style>