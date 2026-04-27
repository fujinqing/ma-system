<template>
  <div class="solution-tracking">
    <div class="page-header">
      <h2 class="page-title">方案更进表</h2>
      <div class="header-actions">
        <el-button type="primary" @click="addSolution">
          <i class="fa fa-plus"></i> 新建方案
        </el-button>
        <el-button type="success" @click="exportSolutions">
          <i class="fa fa-download"></i> 导出
        </el-button>
      </div>
    </div>
    
    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索项目名称或客户"
        prefix-icon="el-icon-search"
        style="width: 300px;"
      ></el-input>
      <el-select v-model="status" placeholder="选择状态">
        <el-option label="全部" value=""></el-option>
        <el-option label="待启动" value="pending"></el-option>
        <el-option label="进行中" value="processing"></el-option>
        <el-option label="已完成" value="completed"></el-option>
        <el-option label="已终止" value="terminated"></el-option>
      </el-select>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        style="width: 240px;"
      ></el-date-picker>
      <el-button type="primary" @click="search">搜索</el-button>
    </div>
    
    <el-table :data="solutions" style="width: 100%" border>
      <el-table-column prop="id" label="方案编号" width="120"></el-table-column>
      <el-table-column prop="customerName" label="客户名称" min-width="150"></el-table-column>
      <el-table-column prop="base" label="基地" width="100"></el-table-column>
      <el-table-column prop="projectName" label="项目名称" min-width="180"></el-table-column>
      <el-table-column prop="tracker" label="跟进人员" width="100"></el-table-column>
      <el-table-column prop="status" label="进展状态" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 'pending'" type="info">待启动</el-tag>
          <el-tag v-else-if="scope.row.status === 'processing'" type="warning">进行中</el-tag>
          <el-tag v-else-if="scope.row.status === 'completed'" type="success">已完成</el-tag>
          <el-tag v-else type="danger">已终止</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createDate" label="创建日期" width="150"></el-table-column>
      <el-table-column prop="updateDate" label="更新日期" width="150"></el-table-column>
      <el-table-column label="操作" width="250" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="viewSolution(scope.row.id)">查看</el-button>
          <el-button type="warning" size="small" @click="editSolution(scope.row.id)">编辑</el-button>
          <el-button v-if="scope.row.status === 'completed'" type="success" size="small" @click="goToPriceCalculation(scope.row.id)">价格计算</el-button>
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
    
    <!-- 方案表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑方案' : '新建方案'"
      width="70%"
      destroy-on-close
    >
      <div class="solution-form">
        <el-form :model="solutionForm" :rules="rules" ref="formRef" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="方案编号" prop="id">
                <el-input v-model="solutionForm.id" placeholder="请输入方案编号" :disabled="isEdit"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="客户名称" prop="customerId">
                <el-select v-model="solutionForm.customerId" placeholder="请选择客户" style="width: 100%">
                  <el-option v-for="customer in customers" :key="customer.id" :label="customer.name" :value="customer.id"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="基地" prop="base">
                <el-input v-model="solutionForm.base" placeholder="请输入基地"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="项目名称" prop="projectName">
                <el-input v-model="solutionForm.projectName" placeholder="请输入项目名称"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="跟进人员" prop="tracker">
                <el-input v-model="solutionForm.tracker" placeholder="请输入跟进人员"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="进展状态" prop="status">
                <el-select v-model="solutionForm.status" placeholder="请选择进展状态" style="width: 100%">
                  <el-option label="待启动" value="pending"></el-option>
                  <el-option label="进行中" value="processing"></el-option>
                  <el-option label="已完成" value="completed"></el-option>
                  <el-option label="已终止" value="terminated"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="创建日期" prop="createDate">
                <el-date-picker v-model="solutionForm.createDate" type="date" placeholder="请选择创建日期" style="width: 100%"></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="更新日期" prop="updateDate">
                <el-date-picker v-model="solutionForm.updateDate" type="date" placeholder="请选择更新日期" style="width: 100%"></el-date-picker>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="方案描述" prop="description">
            <el-input v-model="solutionForm.description" type="textarea" :rows="4" placeholder="请输入方案描述"></el-input>
          </el-form-item>
          <el-form-item label="进展情况" prop="progress">
            <el-input v-model="solutionForm.progress" type="textarea" :rows="4" placeholder="请输入进展情况"></el-input>
          </el-form-item>
          <el-form-item label="附件" prop="attachments">
            <el-upload
              class="upload-demo"
              action="#"
              :on-change="handleFileChange"
              :auto-upload="false"
              :file-list="fileList"
            >
              <el-button type="primary">
                <i class="el-icon-upload"></i> 选择文件
              </el-button>
              <template #tip>
                <div class="el-upload__tip">
                  支持上传PDF、Word、Excel文件
                </div>
              </template>
            </el-upload>
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveSolution">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { useRouter } from 'vue-router'

export default {
  name: 'SolutionTracking',
  setup() {
    const router = useRouter()
    
    return {
      router
    }
  },
  data() {
    return {
      searchQuery: '',
      status: '',
      dateRange: [],
      currentPage: 1,
      pageSize: 10,
      total: 0,
      solutions: [
        {
          id: 'FA2026001',
          customerName: '上海XX电子有限公司',
          base: '上海',
          projectName: '自动化生产线改造',
          tracker: '张三',
          status: 'completed',
          createDate: '2026-03-01',
          updateDate: '2026-03-10',
          description: '为客户提供自动化生产线改造方案',
          progress: '方案已完成，等待价格计算',
          attachments: []
        },
        {
          id: 'FA2026002',
          customerName: '北京XX物流有限公司',
          base: '北京',
          projectName: '智能仓储系统',
          tracker: '李四',
          status: 'processing',
          createDate: '2026-03-05',
          updateDate: '2026-03-15',
          description: '智能仓储系统方案设计',
          progress: '方案设计中，预计下周完成',
          attachments: []
        },
        {
          id: 'FA2026003',
          customerName: '广州XX制造有限公司',
          base: '广州',
          projectName: '机器人工作站',
          tracker: '王五',
          status: 'pending',
          createDate: '2026-03-10',
          updateDate: '2026-03-10',
          description: '机器人工作站方案规划',
          progress: '方案待启动',
          attachments: []
        }
      ],
      dialogVisible: false,
      isEdit: false,
      solutionForm: {
        id: '',
        customerId: '',
        base: '',
        projectName: '',
        tracker: '',
        status: 'pending',
        createDate: '',
        updateDate: '',
        description: '',
        progress: '',
        attachments: []
      },
      rules: {
        id: [
          { required: true, message: '请输入方案编号', trigger: 'blur' }
        ],
        customerId: [
          { required: true, message: '请选择客户', trigger: 'blur' }
        ],
        projectName: [
          { required: true, message: '请输入项目名称', trigger: 'blur' }
        ],
        tracker: [
          { required: true, message: '请输入跟进人员', trigger: 'blur' }
        ],
        status: [
          { required: true, message: '请选择进展状态', trigger: 'blur' }
        ],
        createDate: [
          { required: true, message: '请选择创建日期', trigger: 'blur' }
        ]
      },
      fileList: [],
      customers: [
        { id: 1, name: '上海XX电子有限公司' },
        { id: 2, name: '北京XX物流有限公司' },
        { id: 3, name: '广州XX制造有限公司' }
      ]
    }
  },
  mounted() {
    this.total = this.solutions.length
  },
  methods: {
    addSolution() {
      this.isEdit = false
      this.solutionForm = {
        id: '',
        customerId: '',
        base: '',
        projectName: '',
        tracker: '',
        status: 'pending',
        createDate: new Date().toISOString().split('T')[0],
        updateDate: new Date().toISOString().split('T')[0],
        description: '',
        progress: '',
        attachments: []
      }
      this.fileList = []
      this.dialogVisible = true
    },
    viewSolution(id) {
      console.log('查看方案:', id)
    },
    editSolution(id) {
      this.isEdit = true
      const solution = this.solutions.find(s => s.id === id)
      if (solution) {
        this.solutionForm = {
          id: solution.id,
          customerId: '',
          base: solution.base,
          projectName: solution.projectName,
          tracker: solution.tracker,
          status: solution.status,
          createDate: solution.createDate,
          updateDate: new Date().toISOString().split('T')[0],
          description: solution.description,
          progress: solution.progress,
          attachments: []
        }
        this.fileList = []
        this.dialogVisible = true
      }
    },
    goToPriceCalculation(id) {
      // 跳转到价格计算表，并传递方案ID
      this.router.push(`/sales/price-calculation?solutionId=${id}`)
    },
    saveSolution() {
      this.$refs.formRef.validate((valid) => {
        if (valid) {
          if (this.isEdit) {
            const index = this.solutions.findIndex(s => s.id === this.solutionForm.id)
            if (index !== -1) {
              this.solutions[index].base = this.solutionForm.base
              this.solutions[index].projectName = this.solutionForm.projectName
              this.solutions[index].tracker = this.solutionForm.tracker
              this.solutions[index].status = this.solutionForm.status
              this.solutions[index].updateDate = this.solutionForm.updateDate
              this.solutions[index].description = this.solutionForm.description
              this.solutions[index].progress = this.solutionForm.progress
            }
            this.$message.success('更新成功')
          } else {
            const newSolution = {
              id: this.solutionForm.id,
              customerName: this.customers.find(c => c.id === this.solutionForm.customerId)?.name || '',
              base: this.solutionForm.base,
              projectName: this.solutionForm.projectName,
              tracker: this.solutionForm.tracker,
              status: this.solutionForm.status,
              createDate: this.solutionForm.createDate,
              updateDate: this.solutionForm.updateDate,
              description: this.solutionForm.description,
              progress: this.solutionForm.progress,
              attachments: []
            }
            this.solutions.push(newSolution)
            this.total++
            this.$message.success('创建成功')
          }
          this.dialogVisible = false
        }
      })
    },
    search() {
      console.log('搜索方案:', this.searchQuery, this.status, this.dateRange)
    },
    exportSolutions() {
      this.$message.success('导出成功')
    },
    handleSizeChange(size) {
      this.pageSize = size
    },
    handleCurrentChange(current) {
      this.currentPage = current
    },
    handleFileChange(file, fileList) {
      this.fileList = fileList
    }
  }
}
</script>

<style scoped>
.solution-tracking {
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

.header-actions {
  display: flex;
  gap: 10px;
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

.solution-form {
  padding: 20px 0;
}

@media (max-width: 768px) {
  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-bar .el-input,
  .search-bar .el-date-picker {
    width: 100% !important;
  }
  
  .header-actions {
    flex-direction: column;
    gap: 5px;
  }
}
</style>