<template>
  <div class="picking-list">
    <div class="page-header">
      <h2 class="page-title">领料清单</h2>
      <el-button type="primary" @click="addPickingList">
        <i class="fa fa-plus"></i> 新建领料单
      </el-button>
    </div>
    
    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索领料单号或项目名称"
        prefix-icon="el-icon-search"
        style="width: 300px;"
      ></el-input>
      <el-select v-model="selectedStatus" placeholder="选择状态">
        <el-option label="全部" value=""></el-option>
        <el-option label="待审批" value="pending"></el-option>
        <el-option label="已审批" value="approved"></el-option>
        <el-option label="已领料" value="completed"></el-option>
      </el-select>
      <el-button type="primary" @click="search">搜索</el-button>
    </div>
    
    <el-table :data="pickingLists" style="width: 100%" border>
      <el-table-column prop="id" label="领料单号" width="120"></el-table-column>
      <el-table-column prop="projectName" label="项目名称" min-width="150"></el-table-column>
      <el-table-column prop="bomId" label="关联BOM" width="120"></el-table-column>
      <el-table-column prop="applicant" label="申请人" width="100"></el-table-column>
      <el-table-column prop="itemCount" label="物料项数" width="100"></el-table-column>
      <el-table-column prop="totalQuantity" label="总数量" width="100"></el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 'pending'" type="warning">待审批</el-tag>
          <el-tag v-else-if="scope.row.status === 'approved'" type="success">已审批</el-tag>
          <el-tag v-else-if="scope.row.status === 'completed'" type="info">已领料</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="150"></el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="viewPickingList(scope.row.id)">查看</el-button>
          <el-button type="success" size="small" @click="editPickingList(scope.row.id)">编辑</el-button>
          <el-button type="warning" size="small" @click="approvePickingList(scope.row.id)" v-if="scope.row.status === 'pending'">审批</el-button>
          <el-button type="info" size="small" @click="completePicking(scope.row.id)" v-if="scope.row.status === 'approved'">完成领料</el-button>
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
    
    <!-- 领料单表单对话框 -->
    <el-dialog
      v-model="pickingDialogVisible"
      :title="isEditPicking ? '编辑领料单' : '新建领料单'"
      width="80%"
      destroy-on-close
    >
      <div class="picking-form">
        <el-form :model="pickingForm" :rules="pickingRules" ref="pickingFormRef" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="领料单号" prop="id">
                <el-input v-model="pickingForm.id" placeholder="请输入领料单号" :disabled="isEditPicking"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="关联项目" prop="projectId">
                <el-select v-model="pickingForm.projectId" placeholder="请选择关联项目" style="width: 100%" @change="handleProjectChange">
                  <el-option v-for="project in projects" :key="project.id" :label="project.name" :value="project.id"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="关联BOM" prop="bomId">
                <el-select v-model="pickingForm.bomId" placeholder="请选择关联BOM" style="width: 100%" @change="handleBOMChange">
                  <el-option v-for="bom in boms" :key="bom.id" :label="bom.id" :value="bom.id"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="申请人" prop="applicantId">
                <el-select v-model="pickingForm.applicantId" placeholder="请选择申请人" style="width: 100%">
                  <el-option v-for="user in users" :key="user.id" :label="user.name" :value="user.id"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="领料用途" prop="purpose">
            <el-input v-model="pickingForm.purpose" type="textarea" :rows="2" placeholder="请输入领料用途"></el-input>
          </el-form-item>
        </el-form>
        
        <div class="picking-items">
          <div class="items-toolbar">
            <h3>领料明细</h3>
            <el-button type="primary" @click="addPickingItem">
              <i class="fa fa-plus"></i> 添加物料
            </el-button>
            <el-button type="success" @click="importFromBOM" v-if="pickingForm.bomId">
              <i class="fa fa-download"></i> 从BOM导入
            </el-button>
          </div>
          <el-table :data="pickingItems" style="width: 100%" border>
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
            <el-table-column prop="requiredQuantity" label="需求数量" width="100">
              <template #default="scope">
                <el-input-number v-model="scope.row.requiredQuantity" :min="0" :precision="2" :step="1" style="width: 100%"></el-input-number>
              </template>
            </el-table-column>
            <el-table-column prop="unit" label="单位" width="80">
              <template #default="scope">
                <el-input v-model="scope.row.unit" placeholder="单位"></el-input>
              </template>
            </el-table-column>
            <el-table-column prop="warehouse" label="仓库" width="120">
              <template #default="scope">
                <el-select v-model="scope.row.warehouse" placeholder="选择仓库" style="width: 100%">
                  <el-option label="原材料仓" value="raw"></el-option>
                  <el-option label="半成品仓" value="semi"></el-option>
                  <el-option label="成品仓" value="finished"></el-option>
                </el-select>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="150">
              <template #default="scope">
                <el-input v-model="scope.row.remark" placeholder="备注"></el-input>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="scope">
                <el-button type="danger" size="small" @click="deletePickingItem(scope.row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="picking-summary">
            <div class="summary-item">
              <span class="summary-label">物料项数:</span>
              <span class="summary-value">{{ pickingItems.length }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">总数量:</span>
              <span class="summary-value">{{ totalQuantity }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="pickingDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="savePickingList">保存</el-button>
          <el-button type="success" @click="submitApproval">提交审批</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'PickingList',
  data() {
    return {
      pickingLists: [
        {
          id: 'LL2026001',
          projectName: '自动化生产线项目',
          bomId: 'BOM2026001',
          applicant: '张三',
          itemCount: 15,
          totalQuantity: 150,
          status: 'approved',
          createdAt: '2026-02-01'
        },
        {
          id: 'LL2026002',
          projectName: '控制系统升级',
          bomId: 'BOM2026002',
          applicant: '李四',
          itemCount: 12,
          totalQuantity: 85,
          status: 'pending',
          createdAt: '2026-02-28'
        },
        {
          id: 'LL2026003',
          projectName: '传感器网络部署',
          bomId: 'BOM2026003',
          applicant: '王五',
          itemCount: 8,
          totalQuantity: 45,
          status: 'completed',
          createdAt: '2026-03-20'
        }
      ],
      searchQuery: '',
      selectedStatus: '',
      currentPage: 1,
      pageSize: 10,
      total: 3,
      pickingDialogVisible: false,
      isEditPicking: false,
      pickingForm: {
        id: '',
        projectId: '',
        bomId: '',
        applicantId: '',
        purpose: ''
      },
      pickingRules: {
        id: [
          { required: true, message: '请输入领料单号', trigger: 'blur' }
        ],
        projectId: [
          { required: true, message: '请选择关联项目', trigger: 'blur' }
        ],
        applicantId: [
          { required: true, message: '请选择申请人', trigger: 'blur' }
        ],
        purpose: [
          { required: true, message: '请输入领料用途', trigger: 'blur' }
        ]
      },
      pickingItems: [],
      projects: [
        { id: 1, name: '自动化生产线项目' },
        { id: 2, name: '控制系统升级' },
        { id: 3, name: '传感器网络部署' }
      ],
      boms: [
        { id: 'BOM2026001', name: 'BOM-自动化生产线项目' },
        { id: 'BOM2026002', name: 'BOM-控制系统升级' },
        { id: 'BOM2026003', name: 'BOM-传感器网络部署' }
      ],
      users: [
        { id: 1, name: '张三' },
        { id: 2, name: '李四' },
        { id: 3, name: '王五' },
        { id: 4, name: '赵六' }
      ]
    }
  },
  computed: {
    totalQuantity() {
      return this.pickingItems.reduce((sum, item) => sum + (item.requiredQuantity || 0), 0)
    }
  },
  methods: {
    addPickingList() {
      this.isEditPicking = false
      this.pickingForm = {
        id: '',
        projectId: '',
        bomId: '',
        applicantId: '',
        purpose: ''
      }
      this.pickingItems = []
      this.pickingDialogVisible = true
    },
    viewPickingList(id) {
      console.log('查看领料单:', id)
    },
    editPickingList(id) {
      this.isEditPicking = true
      const picking = this.pickingLists.find(p => p.id === id)
      if (picking) {
        this.pickingForm = {
          id: picking.id,
          projectId: 1,
          bomId: picking.bomId,
          applicantId: 1,
          purpose: '生产领料'
        }
        this.pickingItems = [
          {
            id: 1,
            materialCode: 'MAT001',
            materialName: 'PLC控制器',
            specification: 'S7-1200',
            requiredQuantity: 2,
            unit: '台',
            warehouse: 'raw',
            remark: ''
          },
          {
            id: 2,
            materialCode: 'MAT002',
            materialName: '传感器',
            specification: '温度传感器',
            requiredQuantity: 20,
            unit: '个',
            warehouse: 'raw',
            remark: ''
          }
        ]
        this.pickingDialogVisible = true
      }
    },
    savePickingList() {
      this.$refs.pickingFormRef.validate((valid) => {
        if (valid) {
          if (this.isEditPicking) {
            const index = this.pickingLists.findIndex(p => p.id === this.pickingForm.id)
            if (index !== -1) {
              this.pickingLists[index].projectName = this.projects.find(p => p.id === this.pickingForm.projectId)?.name || ''
              this.pickingLists[index].bomId = this.pickingForm.bomId
              this.pickingLists[index].applicant = this.users.find(u => u.id === this.pickingForm.applicantId)?.name || ''
              this.pickingLists[index].itemCount = this.pickingItems.length
              this.pickingLists[index].totalQuantity = this.totalQuantity
            }
            this.$message.success('更新成功')
          } else {
            const newPicking = {
              id: this.pickingForm.id,
              projectName: this.projects.find(p => p.id === this.pickingForm.projectId)?.name || '',
              bomId: this.pickingForm.bomId,
              applicant: this.users.find(u => u.id === this.pickingForm.applicantId)?.name || '',
              itemCount: this.pickingItems.length,
              totalQuantity: this.totalQuantity,
              status: 'pending',
              createdAt: new Date().toISOString().split('T')[0]
            }
            this.pickingLists.push(newPicking)
            this.total++
            this.$message.success('创建成功')
          }
          this.pickingDialogVisible = false
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
        this.pickingDialogVisible = false
      })
    },
    addPickingItem() {
      this.pickingItems.push({
        id: this.pickingItems.length + 1,
        materialCode: '',
        materialName: '',
        specification: '',
        requiredQuantity: 1,
        unit: '',
        warehouse: 'raw',
        remark: ''
      })
    },
    deletePickingItem(id) {
      this.pickingItems = this.pickingItems.filter(item => item.id !== id)
    },
    importFromBOM() {
      // 模拟从BOM导入物料
      this.pickingItems = [
        {
          id: 1,
          materialCode: 'MAT001',
          materialName: 'PLC控制器',
          specification: 'S7-1200',
          requiredQuantity: 2,
          unit: '台',
          warehouse: 'raw',
          remark: '从BOM导入'
        },
        {
          id: 2,
          materialCode: 'MAT002',
          materialName: '传感器',
          specification: '温度传感器',
          requiredQuantity: 20,
          unit: '个',
          warehouse: 'raw',
          remark: '从BOM导入'
        },
        {
          id: 3,
          materialCode: 'MAT003',
          materialName: '电缆',
          specification: 'RVVP 2*1.0',
          requiredQuantity: 100,
          unit: '米',
          warehouse: 'raw',
          remark: '从BOM导入'
        }
      ]
      this.$message.success('从BOM导入成功')
    },
    handleProjectChange(projectId) {
      // 根据项目筛选BOM列表
      console.log('项目变更:', projectId)
    },
    handleBOMChange(bomId) {
      // BOM变更处理
      console.log('BOM变更:', bomId)
    },
    approvePickingList(id) {
      this.$confirm('确定要审批通过此领料单吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const picking = this.pickingLists.find(p => p.id === id)
        if (picking) {
          picking.status = 'approved'
          this.$message.success('审批成功')
        }
      })
    },
    completePicking(id) {
      this.$confirm('确定要完成领料吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const picking = this.pickingLists.find(p => p.id === id)
        if (picking) {
          picking.status = 'completed'
          this.$message.success('领料完成')
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
.picking-list {
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

.picking-form {
  padding: 20px 0;
}

.picking-items {
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
  flex: 1;
}

.picking-summary {
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
  
  .items-toolbar {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
}
</style>