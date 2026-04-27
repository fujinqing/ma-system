<template>
  <div class="bom-management">
    <div class="page-header">
      <h2 class="page-title">BOM管理</h2>
      <el-button type="primary" @click="addBOM">
        <i class="fa fa-plus"></i> 新建BOM
      </el-button>
    </div>
    
    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索BOM编号或项目名称"
        prefix-icon="el-icon-search"
        style="width: 300px;"
      ></el-input>
      <el-select v-model="selectedProject" placeholder="选择项目">
        <el-option label="全部项目" value=""></el-option>
        <el-option v-for="project in projects" :key="project.id" :label="project.name" :value="project.id"></el-option>
      </el-select>
      <el-button type="primary" @click="search">搜索</el-button>
    </div>
    
    <el-table :data="boms" style="width: 100%" border>
      <el-table-column prop="id" label="BOM编号" width="120"></el-table-column>
      <el-table-column prop="projectName" label="项目名称" min-width="150"></el-table-column>
      <el-table-column prop="version" label="版本" width="80"></el-table-column>
      <el-table-column prop="itemCount" label="物料数量" width="100"></el-table-column>
      <el-table-column prop="totalCost" label="总成本" width="120">
        <template #default="scope">
          ¥{{ scope.row.totalCost.toLocaleString() }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 'draft'" type="info">草稿</el-tag>
          <el-tag v-else-if="scope.row.status === 'approved'" type="success">已审批</el-tag>
          <el-tag v-else-if="scope.row.status === 'archived'" type="warning">已归档</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="150"></el-table-column>
      <el-table-column label="操作" width="250" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="viewBOM(scope.row.id)">查看</el-button>
          <el-button type="success" size="small" @click="editBOM(scope.row.id)">编辑</el-button>
          <el-button type="warning" size="small" @click="createPickingList(scope.row.id)">生成领料单</el-button>
          <el-button type="info" size="small" @click="archiveBOM(scope.row.id)" v-if="scope.row.status === 'approved'">归档</el-button>
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
    
    <!-- BOM表单对话框 -->
    <el-dialog
      v-model="bomDialogVisible"
      :title="isEditBOM ? '编辑BOM' : '新建BOM'"
      width="80%"
      destroy-on-close
    >
      <div class="bom-form">
        <el-form :model="bomForm" :rules="bomRules" ref="bomFormRef" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="BOM编号" prop="id">
                <el-input v-model="bomForm.id" placeholder="请输入BOM编号" :disabled="isEditBOM"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="版本" prop="version">
                <el-input v-model="bomForm.version" placeholder="请输入版本号"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="关联项目" prop="projectId">
                <el-select v-model="bomForm.projectId" placeholder="请选择关联项目" style="width: 100%">
                  <el-option v-for="project in projects" :key="project.id" :label="project.name" :value="project.id"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="BOM名称" prop="name">
                <el-input v-model="bomForm.name" placeholder="请输入BOM名称"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="备注" prop="remark">
            <el-input v-model="bomForm.remark" type="textarea" :rows="2" placeholder="请输入备注"></el-input>
          </el-form-item>
        </el-form>
        
        <div class="bom-items">
          <div class="items-toolbar">
            <h3>BOM明细</h3>
            <el-button type="primary" @click="addBOMItem">
              <i class="fa fa-plus"></i> 添加物料
            </el-button>
          </div>
          <el-table :data="bomItems" style="width: 100%" border>
            <el-table-column prop="id" label="序号" width="60"></el-table-column>
            <el-table-column prop="materialCode" label="物料编码" width="120">
              <template #default="scope">
                <el-input v-model="scope.row.materialCode" placeholder="物料编码"></el-input>
              </template>
            </el-table-column>
            <el-table-column prop="materialName" label="物料名称" min-width="150">
              <template #default="scope">
                <el-input v-model="scope.row.materialName" placeholder="物料名称"></el-input>
              </template>
            </el-table-column>
            <el-table-column prop="specification" label="规格型号" width="120">
              <template #default="scope">
                <el-input v-model="scope.row.specification" placeholder="规格型号"></el-input>
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="100">
              <template #default="scope">
                <el-input-number v-model="scope.row.quantity" :min="0" :precision="2" :step="1" style="width: 100%"></el-input-number>
              </template>
            </el-table-column>
            <el-table-column prop="unit" label="单位" width="80">
              <template #default="scope">
                <el-input v-model="scope.row.unit" placeholder="单位"></el-input>
              </template>
            </el-table-column>
            <el-table-column prop="unitPrice" label="单价" width="120">
              <template #default="scope">
                <el-input-number v-model="scope.row.unitPrice" :min="0" :precision="2" :step="0.1" style="width: 100%"></el-input-number>
              </template>
            </el-table-column>
            <el-table-column prop="totalPrice" label="小计" width="120">
              <template #default="scope">
                ¥{{ (scope.row.quantity * scope.row.unitPrice).toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="scope">
                <el-button type="danger" size="small" @click="deleteBOMItem(scope.row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="bom-summary">
            <div class="summary-item">
              <span class="summary-label">物料总数:</span>
              <span class="summary-value">{{ bomItems.length }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">总成本:</span>
              <span class="summary-value">¥{{ totalCost.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="bomDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveBOM">保存</el-button>
          <el-button type="success" @click="submitApproval">提交审批</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'BOMManagement',
  data() {
    return {
      boms: [
        {
          id: 'BOM2026001',
          projectName: '自动化生产线项目',
          version: 'V1.0',
          itemCount: 25,
          totalCost: 128000,
          status: 'approved',
          createdAt: '2026-01-20'
        },
        {
          id: 'BOM2026002',
          projectName: '控制系统升级',
          version: 'V1.0',
          itemCount: 18,
          totalCost: 85000,
          status: 'draft',
          createdAt: '2026-02-25'
        },
        {
          id: 'BOM2026003',
          projectName: '传感器网络部署',
          version: 'V1.0',
          itemCount: 12,
          totalCost: 45000,
          status: 'archived',
          createdAt: '2026-03-15'
        }
      ],
      searchQuery: '',
      selectedProject: '',
      currentPage: 1,
      pageSize: 10,
      total: 3,
      bomDialogVisible: false,
      isEditBOM: false,
      bomForm: {
        id: '',
        version: '',
        projectId: '',
        name: '',
        remark: ''
      },
      bomRules: {
        id: [
          { required: true, message: '请输入BOM编号', trigger: 'blur' }
        ],
        version: [
          { required: true, message: '请输入版本号', trigger: 'blur' }
        ],
        projectId: [
          { required: true, message: '请选择关联项目', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '请输入BOM名称', trigger: 'blur' }
        ]
      },
      bomItems: [
        {
          id: 1,
          materialCode: 'MAT001',
          materialName: 'PLC控制器',
          specification: 'S7-1200',
          quantity: 2,
          unit: '台',
          unitPrice: 15000
        },
        {
          id: 2,
          materialCode: 'MAT002',
          materialName: '传感器',
          specification: '温度传感器',
          quantity: 20,
          unit: '个',
          unitPrice: 800
        },
        {
          id: 3,
          materialCode: 'MAT003',
          materialName: '电缆',
          specification: 'RVVP 2*1.0',
          quantity: 100,
          unit: '米',
          unitPrice: 15
        }
      ],
      projects: [
        { id: 1, name: '自动化生产线项目' },
        { id: 2, name: '控制系统升级' },
        { id: 3, name: '传感器网络部署' }
      ]
    }
  },
  computed: {
    totalCost() {
      return this.bomItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    }
  },
  methods: {
    addBOM() {
      this.isEditBOM = false
      this.bomForm = {
        id: '',
        version: 'V1.0',
        projectId: '',
        name: '',
        remark: ''
      }
      this.bomItems = []
      this.bomDialogVisible = true
    },
    viewBOM(id) {
      console.log('查看BOM:', id)
    },
    editBOM(id) {
      this.isEditBOM = true
      const bom = this.boms.find(b => b.id === id)
      if (bom) {
        this.bomForm = {
          id: bom.id,
          version: bom.version,
          projectId: 1,
          name: 'BOM-' + bom.projectName,
          remark: ''
        }
        this.bomItems = [
          {
            id: 1,
            materialCode: 'MAT001',
            materialName: 'PLC控制器',
            specification: 'S7-1200',
            quantity: 2,
            unit: '台',
            unitPrice: 15000
          },
          {
            id: 2,
            materialCode: 'MAT002',
            materialName: '传感器',
            specification: '温度传感器',
            quantity: 20,
            unit: '个',
            unitPrice: 800
          }
        ]
        this.bomDialogVisible = true
      }
    },
    saveBOM() {
      this.$refs.bomFormRef.validate((valid) => {
        if (valid) {
          if (this.isEditBOM) {
            const index = this.boms.findIndex(b => b.id === this.bomForm.id)
            if (index !== -1) {
              this.boms[index].version = this.bomForm.version
              this.boms[index].projectName = this.projects.find(p => p.id === this.bomForm.projectId)?.name || ''
              this.boms[index].itemCount = this.bomItems.length
              this.boms[index].totalCost = this.totalCost
            }
            this.$message.success('更新成功')
          } else {
            const newBOM = {
              id: this.bomForm.id,
              projectName: this.projects.find(p => p.id === this.bomForm.projectId)?.name || '',
              version: this.bomForm.version,
              itemCount: this.bomItems.length,
              totalCost: this.totalCost,
              status: 'draft',
              createdAt: new Date().toISOString().split('T')[0]
            }
            this.boms.push(newBOM)
            this.total++
            this.$message.success('创建成功')
          }
          this.bomDialogVisible = false
        }
      })
    },
    submitApproval() {
      this.$confirm('确定要提交审批吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$message.success('提交审批成功')
        this.bomDialogVisible = false
      })
    },
    addBOMItem() {
      this.bomItems.push({
        id: this.bomItems.length + 1,
        materialCode: '',
        materialName: '',
        specification: '',
        quantity: 1,
        unit: '',
        unitPrice: 0
      })
    },
    deleteBOMItem(id) {
      this.bomItems = this.bomItems.filter(item => item.id !== id)
    },
    createPickingList(id) {
      this.$message.success('领料单生成成功')
      console.log('生成领料单:', id)
    },
    archiveBOM(id) {
      this.$confirm('确定要归档此BOM吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const bom = this.boms.find(b => b.id === id)
        if (bom) {
          bom.status = 'archived'
          this.$message.success('归档成功')
        }
      })
    },
    search() {
      console.log('搜索:', this.searchQuery, this.selectedProject)
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
.bom-management {
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

.bom-form {
  padding: 20px 0;
}

.bom-items {
  margin-top: 20px;
}

.items-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.items-toolbar h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.bom-summary {
  display: flex;
  justify-content: flex-end;
  gap: 30px;
  margin-top: 15px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-label {
  font-size: 14px;
  color: #666;
}

.summary-value {
  font-size: 16px;
  font-weight: 600;
  color: #165DFF;
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