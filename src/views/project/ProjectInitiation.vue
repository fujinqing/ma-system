<template>
  <div class="project-initiation">
    <div class="page-header">
      <h2 class="page-title">项目立项</h2>
      <el-button type="primary" @click="addProject">
        <i class="fa fa-plus"></i> 新建立项
      </el-button>
    </div>
    
    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索项目名称或客户"
        prefix-icon="el-icon-search"
        style="width: 300px;"
      ></el-input>
      <el-select v-model="selectedStatus" placeholder="选择状态">
        <el-option label="全部" value=""></el-option>
        <el-option label="待审批" value="pending"></el-option>
        <el-option label="已立项" value="approved"></el-option>
        <el-option label="已拒绝" value="rejected"></el-option>
      </el-select>
      <el-button type="primary" @click="search">搜索</el-button>
    </div>
    
    <el-table :data="projects" style="width: 100%" border>
      <el-table-column prop="id" label="立项编号" width="100"></el-table-column>
      <el-table-column prop="name" label="项目名称" min-width="150"></el-table-column>
      <el-table-column prop="customerName" label="客户名称" min-width="150"></el-table-column>
      <el-table-column prop="contractNo" label="关联合同" width="120"></el-table-column>
      <el-table-column prop="projectManager" label="项目经理" width="100"></el-table-column>
      <el-table-column prop="budget" label="项目预算" width="120">
        <template #default="scope">
          ¥{{ scope.row.budget.toLocaleString() }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 'pending'" type="warning">待审批</el-tag>
          <el-tag v-else-if="scope.row.status === 'approved'" type="success">已立项</el-tag>
          <el-tag v-else type="danger">已拒绝</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="150"></el-table-column>
      <el-table-column label="操作" width="250" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="viewProject(scope.row.id)">查看</el-button>
          <el-button type="success" size="small" @click="editProject(scope.row.id)">编辑</el-button>
          <el-button type="warning" size="small" @click="taskDecomposition(scope.row.id)">任务分解</el-button>
          <el-button type="info" size="small" @click="projectBudget(scope.row.id)">项目预算</el-button>
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
    
    <!-- 项目立项表单对话框 -->
    <el-dialog
      v-model="projectDialogVisible"
      :title="isEditProject ? '编辑项目立项' : '新建项目立项'"
      width="70%"
      destroy-on-close
    >
      <div class="project-form">
        <el-form :model="projectForm" :rules="projectRules" ref="projectFormRef" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="项目名称" prop="name">
                <el-input v-model="projectForm.name" placeholder="请输入项目名称"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="客户" prop="customerId">
                <el-select v-model="projectForm.customerId" placeholder="请选择客户" style="width: 100%">
                  <el-option v-for="customer in customers" :key="customer.id" :label="customer.name" :value="customer.id"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="关联合同" prop="contractId">
                <el-select v-model="projectForm.contractId" placeholder="请选择关联合同" style="width: 100%">
                  <el-option v-for="contract in contracts" :key="contract.id" :label="contract.contractNo" :value="contract.id"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="项目经理" prop="projectManagerId">
                <el-select v-model="projectForm.projectManagerId" placeholder="请选择项目经理" style="width: 100%">
                  <el-option v-for="user in users" :key="user.id" :label="user.name" :value="user.id"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="开始日期" prop="startDate">
                <el-date-picker v-model="projectForm.startDate" type="date" placeholder="请选择开始日期" style="width: 100%"></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="结束日期" prop="endDate">
                <el-date-picker v-model="projectForm.endDate" type="date" placeholder="请选择结束日期" style="width: 100%"></el-date-picker>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="项目描述" prop="description">
            <el-input v-model="projectForm.description" type="textarea" :rows="3" placeholder="请输入项目描述"></el-input>
          </el-form-item>
          <el-form-item label="项目目标" prop="objectives">
            <el-input v-model="projectForm.objectives" type="textarea" :rows="3" placeholder="请输入项目目标"></el-input>
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="projectDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveProject">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 任务分解对话框 -->
    <el-dialog
      v-model="taskDialogVisible"
      title="任务分解"
      width="80%"
      destroy-on-close
    >
      <div class="task-decomposition">
        <div class="task-toolbar">
          <el-button type="primary" @click="addTask">
            <i class="fa fa-plus"></i> 添加任务
          </el-button>
        </div>
        <el-table :data="tasks" style="width: 100%" border>
          <el-table-column prop="id" label="序号" width="60"></el-table-column>
          <el-table-column prop="name" label="任务名称" min-width="150">
            <template #default="scope">
              <el-input v-model="scope.row.name" placeholder="请输入任务名称"></el-input>
            </template>
          </el-table-column>
          <el-table-column prop="responsible" label="负责人" width="120">
            <template #default="scope">
              <el-select v-model="scope.row.responsibleId" placeholder="请选择" style="width: 100%">
                <el-option v-for="user in users" :key="user.id" :label="user.name" :value="user.id"></el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="startDate" label="开始日期" width="140">
            <template #default="scope">
              <el-date-picker v-model="scope.row.startDate" type="date" placeholder="选择日期" style="width: 100%"></el-date-picker>
            </template>
          </el-table-column>
          <el-table-column prop="endDate" label="结束日期" width="140">
            <template #default="scope">
              <el-date-picker v-model="scope.row.endDate" type="date" placeholder="选择日期" style="width: 100%"></el-date-picker>
            </template>
          </el-table-column>
          <el-table-column prop="workHours" label="工时" width="100">
            <template #default="scope">
              <el-input-number v-model="scope.row.workHours" :min="0" :precision="1" :step="0.5" style="width: 100%"></el-input-number>
            </template>
          </el-table-column>
          <el-table-column prop="priority" label="优先级" width="100">
            <template #default="scope">
              <el-select v-model="scope.row.priority" placeholder="请选择" style="width: 100%">
                <el-option label="高" value="high"></el-option>
                <el-option label="中" value="medium"></el-option>
                <el-option label="低" value="low"></el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80">
            <template #default="scope">
              <el-button type="danger" size="small" @click="deleteTask(scope.row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="taskDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveTasks">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 项目预算对话框 -->
    <el-dialog
      v-model="budgetDialogVisible"
      title="项目预算"
      width="70%"
      destroy-on-close
    >
      <div class="project-budget">
        <div class="budget-summary">
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="budget-card">
                <div class="budget-label">总预算</div>
                <div class="budget-value">¥{{ totalBudget.toLocaleString() }}</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="budget-card">
                <div class="budget-label">已分配</div>
                <div class="budget-value">¥{{ allocatedBudget.toLocaleString() }}</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="budget-card">
                <div class="budget-label">剩余预算</div>
                <div class="budget-value">¥{{ remainingBudget.toLocaleString() }}</div>
              </div>
            </el-col>
          </el-row>
        </div>
        
        <div class="budget-items">
          <div class="budget-toolbar">
            <el-button type="primary" @click="addBudgetItem">
              <i class="fa fa-plus"></i> 添加预算项
            </el-button>
          </div>
          <el-table :data="budgetItems" style="width: 100%" border>
            <el-table-column prop="id" label="序号" width="60"></el-table-column>
            <el-table-column prop="category" label="预算类别" min-width="150">
              <template #default="scope">
                <el-select v-model="scope.row.category" placeholder="请选择类别" style="width: 100%">
                  <el-option label="材料费" value="material"></el-option>
                  <el-option label="人工费" value="labor"></el-option>
                  <el-option label="设备费" value="equipment"></el-option>
                  <el-option label="差旅费" value="travel"></el-option>
                  <el-option label="其他" value="other"></el-option>
                </el-select>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="200">
              <template #default="scope">
                <el-input v-model="scope.row.description" placeholder="请输入描述"></el-input>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" width="120">
              <template #default="scope">
                <el-input-number v-model="scope.row.amount" :min="0" :precision="2" :step="100" style="width: 100%"></el-input-number>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="scope">
                <el-button type="danger" size="small" @click="deleteBudgetItem(scope.row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="budgetDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveBudget">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'ProjectInitiation',
  data() {
    return {
      projects: [
        {
          id: 'XM2026001',
          name: '自动化生产线项目',
          customerName: '上海XX自动化设备有限公司',
          contractNo: 'HT2026001',
          projectManager: '张三',
          budget: 1500000,
          status: 'approved',
          createdAt: '2026-01-15'
        },
        {
          id: 'XM2026002',
          name: '控制系统升级',
          customerName: '北京XX科技有限公司',
          contractNo: 'HT2026002',
          projectManager: '李四',
          budget: 1000000,
          status: 'pending',
          createdAt: '2026-02-20'
        },
        {
          id: 'XM2026003',
          name: '传感器网络部署',
          customerName: '广州XX制造有限公司',
          contractNo: 'HT2026003',
          projectManager: '王五',
          budget: 550000,
          status: 'draft',
          createdAt: '2026-03-10'
        }
      ],
      searchQuery: '',
      selectedStatus: '',
      currentPage: 1,
      pageSize: 10,
      total: 3,
      projectDialogVisible: false,
      isEditProject: false,
      projectForm: {
        id: '',
        name: '',
        customerId: '',
        contractId: '',
        projectManagerId: '',
        startDate: '',
        endDate: '',
        description: '',
        objectives: ''
      },
      projectRules: {
        name: [
          { required: true, message: '请输入项目名称', trigger: 'blur' }
        ],
        customerId: [
          { required: true, message: '请选择客户', trigger: 'blur' }
        ],
        projectManagerId: [
          { required: true, message: '请选择项目经理', trigger: 'blur' }
        ],
        startDate: [
          { required: true, message: '请选择开始日期', trigger: 'blur' }
        ],
        endDate: [
          { required: true, message: '请选择结束日期', trigger: 'blur' }
        ]
      },
      taskDialogVisible: false,
      currentProjectId: '',
      tasks: [
        {
          id: 1,
          name: '需求分析',
          responsibleId: 1,
          startDate: '2026-01-15',
          endDate: '2026-01-20',
          workHours: 40,
          priority: 'high'
        },
        {
          id: 2,
          name: '方案设计',
          responsibleId: 2,
          startDate: '2026-01-21',
          endDate: '2026-02-05',
          workHours: 80,
          priority: 'high'
        },
        {
          id: 3,
          name: '详细设计',
          responsibleId: 3,
          startDate: '2026-02-06',
          endDate: '2026-02-20',
          workHours: 60,
          priority: 'medium'
        }
      ],
      budgetDialogVisible: false,
      budgetItems: [
        {
          id: 1,
          category: 'material',
          description: 'PLC控制器及配件',
          amount: 50000
        },
        {
          id: 2,
          category: 'labor',
          description: '设计人员工时',
          amount: 80000
        },
        {
          id: 3,
          category: 'equipment',
          description: '测试设备租赁',
          amount: 30000
        }
      ],
      totalBudget: 1500000,
      customers: [
        { id: 1, name: '上海XX自动化设备有限公司' },
        { id: 2, name: '北京XX科技有限公司' },
        { id: 3, name: '广州XX制造有限公司' }
      ],
      contracts: [
        { id: 1, contractNo: 'HT2026001' },
        { id: 2, contractNo: 'HT2026002' },
        { id: 3, contractNo: 'HT2026003' }
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
    allocatedBudget() {
      return this.budgetItems.reduce((sum, item) => sum + (item.amount || 0), 0)
    },
    remainingBudget() {
      return this.totalBudget - this.allocatedBudget
    }
  },
  methods: {
    addProject() {
      this.isEditProject = false
      this.projectForm = {
        id: '',
        name: '',
        customerId: '',
        contractId: '',
        projectManagerId: '',
        startDate: '',
        endDate: '',
        description: '',
        objectives: ''
      }
      this.projectDialogVisible = true
    },
    viewProject(id) {
      console.log('查看项目:', id)
    },
    editProject(id) {
      this.isEditProject = true
      const project = this.projects.find(p => p.id === id)
      if (project) {
        this.projectForm = {
          id: project.id,
          name: project.name,
          customerId: 1,
          contractId: 1,
          projectManagerId: 1,
          startDate: '2026-01-15',
          endDate: '2026-06-15',
          description: '项目描述',
          objectives: '项目目标'
        }
        this.projectDialogVisible = true
      }
    },
    saveProject() {
      this.$refs.projectFormRef.validate((valid) => {
        if (valid) {
          if (this.isEditProject) {
            const index = this.projects.findIndex(p => p.id === this.projectForm.id)
            if (index !== -1) {
              this.projects[index].name = this.projectForm.name
              this.projects[index].customerName = this.customers.find(c => c.id === this.projectForm.customerId)?.name || ''
              this.projects[index].projectManager = this.users.find(u => u.id === this.projectForm.projectManagerId)?.name || ''
            }
            this.$message.success('更新成功')
          } else {
            const newProject = {
              id: 'XM' + (2026000 + this.projects.length + 1),
              name: this.projectForm.name,
              customerName: this.customers.find(c => c.id === this.projectForm.customerId)?.name || '',
              contractNo: this.contracts.find(c => c.id === this.projectForm.contractId)?.contractNo || '',
              projectManager: this.users.find(u => u.id === this.projectForm.projectManagerId)?.name || '',
              budget: 0,
              status: 'pending',
              createdAt: new Date().toISOString().split('T')[0]
            }
            this.projects.push(newProject)
            this.total++
            this.$message.success('创建成功')
          }
          this.projectDialogVisible = false
        }
      })
    },
    taskDecomposition(id) {
      this.currentProjectId = id
      this.taskDialogVisible = true
    },
    addTask() {
      this.tasks.push({
        id: this.tasks.length + 1,
        name: '',
        responsibleId: '',
        startDate: '',
        endDate: '',
        workHours: 0,
        priority: 'medium'
      })
    },
    deleteTask(id) {
      this.tasks = this.tasks.filter(task => task.id !== id)
    },
    saveTasks() {
      this.$message.success('任务分解保存成功')
      this.taskDialogVisible = false
    },
    projectBudget(id) {
      this.currentProjectId = id
      this.budgetDialogVisible = true
    },
    addBudgetItem() {
      this.budgetItems.push({
        id: this.budgetItems.length + 1,
        category: '',
        description: '',
        amount: 0
      })
    },
    deleteBudgetItem(id) {
      this.budgetItems = this.budgetItems.filter(item => item.id !== id)
    },
    saveBudget() {
      this.$message.success('项目预算保存成功')
      this.budgetDialogVisible = false
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
.project-initiation {
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

.project-form {
  padding: 20px 0;
}

.task-decomposition,
.project-budget {
  padding: 20px 0;
}

.task-toolbar,
.budget-toolbar {
  margin-bottom: 15px;
}

.budget-summary {
  margin-bottom: 20px;
}

.budget-card {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
}

.budget-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.budget-value {
  font-size: 20px;
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