<template>
  <div class="production-order">
    <div class="page-header">
      <h2 class="page-title">生产订单</h2>
      <el-button type="primary" @click="addOrder">
        <i class="fa fa-plus"></i> 新建生产订单
      </el-button>
    </div>
    
    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索订单号或项目名称"
        prefix-icon="el-icon-search"
        style="width: 300px;"
      ></el-input>
      <el-select v-model="selectedStatus" placeholder="选择状态">
        <el-option label="全部" value=""></el-option>
        <el-option label="待生产" value="pending"></el-option>
        <el-option label="生产中" value="producing"></el-option>
        <el-option label="已完成" value="completed"></el-option>
      </el-select>
      <el-button type="primary" @click="search">搜索</el-button>
    </div>
    
    <el-table :data="orders" style="width: 100%" border>
      <el-table-column prop="id" label="订单号" width="120"></el-table-column>
      <el-table-column prop="projectName" label="项目名称" min-width="150"></el-table-column>
      <el-table-column prop="productName" label="产品名称" min-width="150"></el-table-column>
      <el-table-column prop="quantity" label="数量" width="80"></el-table-column>
      <el-table-column prop="plannedStartDate" label="计划开工" width="120"></el-table-column>
      <el-table-column prop="plannedEndDate" label="计划完工" width="120"></el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 'pending'" type="info">待生产</el-tag>
          <el-tag v-else-if="scope.row.status === 'producing'" type="warning">生产中</el-tag>
          <el-tag v-else-if="scope.row.status === 'completed'" type="success">已完成</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="150"></el-table-column>
      <el-table-column label="操作" width="250" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="viewOrder(scope.row.id)">查看</el-button>
          <el-button type="success" size="small" @click="editOrder(scope.row.id)">编辑</el-button>
          <el-button type="warning" size="small" @click="materialPreparation(scope.row.id)" v-if="scope.row.status === 'pending'">工单备料</el-button>
          <el-button type="info" size="small" @click="completeOrder(scope.row.id)" v-if="scope.row.status === 'producing'">完工</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      ></el-pagination>
    </div>
    
    <!-- 生产订单表单对话框 -->
    <el-dialog
      v-model="orderDialogVisible"
      :title="isEditOrder ? '编辑生产订单' : '新建生产订单'"
      width="70%"
      destroy-on-close
    >
      <div class="order-form">
        <el-form :model="orderForm" :rules="orderRules" ref="orderFormRef" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="订单号" prop="id">
                <el-input v-model="orderForm.id" placeholder="请输入订单号" :disabled="isEditOrder"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="关联项目" prop="projectId">
                <el-select v-model="orderForm.projectId" placeholder="请选择关联项目" style="width: 100%">
                  <el-option v-for="project in projects" :key="project.id" :label="project.name" :value="project.id"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="产品名称" prop="productName">
                <el-input v-model="orderForm.productName" placeholder="请输入产品名称"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="产品规格" prop="productSpec">
                <el-input v-model="orderForm.productSpec" placeholder="请输入产品规格"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="生产数量" prop="quantity">
                <el-input-number v-model="orderForm.quantity" :min="1" :precision="0" :step="1" style="width: 100%"></el-input-number>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="单位" prop="unit">
                <el-input v-model="orderForm.unit" placeholder="请输入单位"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="计划开工" prop="plannedStartDate">
                <el-date-picker v-model="orderForm.plannedStartDate" type="date" placeholder="请选择计划开工日期" style="width: 100%"></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="计划完工" prop="plannedEndDate">
                <el-date-picker v-model="orderForm.plannedEndDate" type="date" placeholder="请选择计划完工日期" style="width: 100%"></el-date-picker>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="生产要求" prop="requirements">
            <el-input v-model="orderForm.requirements" type="textarea" :rows="3" placeholder="请输入生产要求"></el-input>
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="orderDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveOrder">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 工单备料对话框 -->
    <el-dialog
      v-model="materialDialogVisible"
      title="工单备料"
      width="80%"
      destroy-on-close
    >
      <div class="material-preparation">
        <div class="material-info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单号">{{ currentOrder.id }}</el-descriptions-item>
            <el-descriptions-item label="产品名称">{{ currentOrder.productName }}</el-descriptions-item>
            <el-descriptions-item label="生产数量">{{ currentOrder.quantity }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag v-if="currentOrder.status === 'pending'" type="info">待生产</el-tag>
              <el-tag v-else-if="currentOrder.status === 'producing'" type="warning">生产中</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>
        
        <div class="material-list">
          <div class="list-toolbar">
            <h3>备料清单</h3>
            <el-button type="primary" @click="importFromBOM">
              <i class="fa fa-download"></i> 从BOM导入
            </el-button>
          </div>
          <el-table :data="materialItems" style="width: 100%" border>
            <el-table-column prop="id" label="序号" width="60"></el-table-column>
            <el-table-column prop="materialCode" label="物料编码" width="120"></el-table-column>
            <el-table-column prop="materialName" label="物料名称" min-width="150"></el-table-column>
            <el-table-column prop="specification" label="规格型号" width="120"></el-table-column>
            <el-table-column prop="requiredQty" label="需求数量" width="100"></el-table-column>
            <el-table-column prop="stockQty" label="库存数量" width="100"></el-table-column>
            <el-table-column prop="pickingQty" label="领料数量" width="120">
              <template #default="scope">
                <el-input-number v-model="scope.row.pickingQty" :min="0" :max="scope.row.requiredQty" :precision="2" :step="1" style="width: 100%"></el-input-number>
              </template>
            </el-table-column>
            <el-table-column prop="warehouse" label="仓库" width="100"></el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="scope">
                <el-tag v-if="scope.row.pickingQty >= scope.row.requiredQty" type="success">已备齐</el-tag>
                <el-tag v-else-if="scope.row.pickingQty > 0" type="warning">部分备料</el-tag>
                <el-tag v-else type="info">未备料</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="materialDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveMaterialPreparation">保存备料</el-button>
          <el-button type="success" @click="startProduction">开始生产</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'ProductionOrder',
  data() {
    return {
      orders: [
        {
          id: 'SC2026001',
          projectName: '自动化生产线项目',
          productName: '自动化控制系统',
          quantity: 2,
          plannedStartDate: '2026-02-01',
          plannedEndDate: '2026-03-15',
          status: 'producing',
          createdAt: '2026-01-25'
        },
        {
          id: 'SC2026002',
          projectName: '控制系统升级',
          productName: 'PLC控制柜',
          quantity: 5,
          plannedStartDate: '2026-03-01',
          plannedEndDate: '2026-04-10',
          status: 'pending',
          createdAt: '2026-02-25'
        },
        {
          id: 'SC2026003',
          projectName: '传感器网络部署',
          productName: '传感器节点',
          quantity: 20,
          plannedStartDate: '2026-03-15',
          plannedEndDate: '2026-04-30',
          status: 'completed',
          createdAt: '2026-03-05'
        }
      ],
      searchQuery: '',
      selectedStatus: '',
      currentPage: 1,
      pageSize: 10,
      total: 3,
      orderDialogVisible: false,
      isEditOrder: false,
      orderForm: {
        id: '',
        projectId: '',
        productName: '',
        productSpec: '',
        quantity: 1,
        unit: '',
        plannedStartDate: '',
        plannedEndDate: '',
        requirements: ''
      },
      orderRules: {
        id: [
          { required: true, message: '请输入订单号', trigger: 'blur' }
        ],
        projectId: [
          { required: true, message: '请选择关联项目', trigger: 'blur' }
        ],
        productName: [
          { required: true, message: '请输入产品名称', trigger: 'blur' }
        ],
        quantity: [
          { required: true, message: '请输入生产数量', trigger: 'blur' }
        ],
        plannedStartDate: [
          { required: true, message: '请选择计划开工日期', trigger: 'blur' }
        ],
        plannedEndDate: [
          { required: true, message: '请选择计划完工日期', trigger: 'blur' }
        ]
      },
      materialDialogVisible: false,
      currentOrder: {},
      materialItems: [
        {
          id: 1,
          materialCode: 'MAT001',
          materialName: 'PLC控制器',
          specification: 'S7-1200',
          requiredQty: 2,
          stockQty: 5,
          pickingQty: 2,
          warehouse: '原材料仓'
        },
        {
          id: 2,
          materialCode: 'MAT002',
          materialName: '传感器',
          specification: '温度传感器',
          requiredQty: 20,
          stockQty: 50,
          pickingQty: 20,
          warehouse: '原材料仓'
        },
        {
          id: 3,
          materialCode: 'MAT003',
          materialName: '电缆',
          specification: 'RVVP 2*1.0',
          requiredQty: 100,
          stockQty: 200,
          pickingQty: 100,
          warehouse: '原材料仓'
        }
      ],
      projects: [
        { id: 1, name: '自动化生产线项目' },
        { id: 2, name: '控制系统升级' },
        { id: 3, name: '传感器网络部署' }
      ]
    }
  },
  methods: {
    addOrder() {
      this.isEditOrder = false
      this.orderForm = {
        id: '',
        projectId: '',
        productName: '',
        productSpec: '',
        quantity: 1,
        unit: '',
        plannedStartDate: '',
        plannedEndDate: '',
        requirements: ''
      }
      this.orderDialogVisible = true
    },
    viewOrder(id) {
      console.log('查看生产订单:', id)
    },
    editOrder(id) {
      this.isEditOrder = true
      const order = this.orders.find(o => o.id === id)
      if (order) {
        this.orderForm = {
          id: order.id,
          projectId: 1,
          productName: order.productName,
          productSpec: '',
          quantity: order.quantity,
          unit: '套',
          plannedStartDate: order.plannedStartDate,
          plannedEndDate: order.plannedEndDate,
          requirements: ''
        }
        this.orderDialogVisible = true
      }
    },
    saveOrder() {
      this.$refs.orderFormRef.validate((valid) => {
        if (valid) {
          if (this.isEditOrder) {
            const index = this.orders.findIndex(o => o.id === this.orderForm.id)
            if (index !== -1) {
              this.orders[index].projectName = this.projects.find(p => p.id === this.orderForm.projectId)?.name || ''
              this.orders[index].productName = this.orderForm.productName
              this.orders[index].quantity = this.orderForm.quantity
              this.orders[index].plannedStartDate = this.orderForm.plannedStartDate
              this.orders[index].plannedEndDate = this.orderForm.plannedEndDate
            }
            this.$message.success('更新成功')
          } else {
            const newOrder = {
              id: this.orderForm.id,
              projectName: this.projects.find(p => p.id === this.orderForm.projectId)?.name || '',
              productName: this.orderForm.productName,
              quantity: this.orderForm.quantity,
              plannedStartDate: this.orderForm.plannedStartDate,
              plannedEndDate: this.orderForm.plannedEndDate,
              status: 'pending',
              createdAt: new Date().toISOString().split('T')[0]
            }
            this.orders.push(newOrder)
            this.total++
            this.$message.success('创建成功')
          }
          this.orderDialogVisible = false
        }
      })
    },
    materialPreparation(id) {
      const order = this.orders.find(o => o.id === id)
      if (order) {
        this.currentOrder = order
        this.materialDialogVisible = true
      }
    },
    importFromBOM() {
      this.$message.success('从BOM导入物料成功')
    },
    saveMaterialPreparation() {
      this.$message.success('备料信息保存成功')
    },
    startProduction() {
      this.$confirm('确定要开始生产吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.currentOrder.status = 'producing'
        const index = this.orders.findIndex(o => o.id === this.currentOrder.id)
        if (index !== -1) {
          this.orders[index].status = 'producing'
        }
        this.$message.success('生产已开始')
        this.materialDialogVisible = false
      })
    },
    completeOrder(id) {
      this.$confirm('确定要完成此生产订单吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const order = this.orders.find(o => o.id === id)
        if (order) {
          order.status = 'completed'
          this.$message.success('生产订单已完成')
        }
      })
    },
    search() {
      console.log('搜索:', this.searchQuery, this.selectedStatus)
    },
    handleSizeChange(size) {
      this.pageSize = size
    },
    handleCurrentChange(current) {
      this.currentPage = current
    }
  }
}
</script>

<style scoped>
.production-order {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.order-form {
  padding: 20px 0;
}

.material-preparation {
  padding: 20px 0;
}

.material-info {
  margin-bottom: 20px;
}

.material-list {
  margin-top: 20px;
}

.list-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.list-toolbar h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

@media (max-width: 768px) {
  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-bar .el-input {
    width: 100% !important;
  }
}
</style>