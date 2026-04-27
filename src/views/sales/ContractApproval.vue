<template>
  <div class="contract-approval">
    <div class="page-header">
      <h2 class="page-title">销售合同审批表</h2>
      <el-button type="primary" @click="addApproval">
        <i class="fa fa-plus"></i> 新建审批表
      </el-button>
    </div>
    
    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索合同编号或项目名称"
        prefix-icon="el-icon-search"
        style="width: 300px;"
      ></el-input>
      <el-select v-model="selectedStatus" placeholder="选择状态">
        <el-option label="全部" value=""></el-option>
        <el-option label="草稿" value="draft"></el-option>
        <el-option label="待审批" value="pending"></el-option>
        <el-option label="已审批" value="approved"></el-option>
        <el-option label="已拒绝" value="rejected"></el-option>
      </el-select>
      <el-button type="primary" @click="search">搜索</el-button>
    </div>
    
    <el-table :data="approvals" style="width: 100%" border>
      <el-table-column prop="id" label="编号" width="80"></el-table-column>
      <el-table-column prop="contractNo" label="合同编号" min-width="150"></el-table-column>
      <el-table-column prop="projectName" label="项目名称" min-width="150"></el-table-column>
      <el-table-column prop="customerName" label="客户名称" min-width="150"></el-table-column>
      <el-table-column prop="contractAmount" label="合同金额" width="120">
        <template #default="scope">
          ¥{{ scope.row.contractAmount.toLocaleString() }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 'draft'" type="info">草稿</el-tag>
          <el-tag v-else-if="scope.row.status === 'pending'" type="warning">待审批</el-tag>
          <el-tag v-else-if="scope.row.status === 'approved'" type="success">已审批</el-tag>
          <el-tag v-else type="danger">已拒绝</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="150"></el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="viewApproval(scope.row.id)">查看</el-button>
          <el-button type="success" size="small" @click="editApproval(scope.row.id)">编辑</el-button>
          <el-button type="warning" size="small" @click="submitApproval(scope.row.id)" v-if="scope.row.status === 'draft'">提交审批</el-button>
          <el-button type="info" size="small" @click="printApproval(scope.row.id)">打印</el-button>
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
    
    <!-- 合同审批表单对话框 -->
    <el-dialog
      v-model="approvalDialogVisible"
      :title="isEditApproval ? '编辑合同审批' : '新建合同审批'"
      width="80%"
      destroy-on-close
    >
      <div class="approval-form">
        <el-form :model="approvalForm" :rules="approvalRules" ref="approvalFormRef">
          <el-form-item label="合同编号" prop="contractNo">
            <el-input v-model="approvalForm.contractNo" placeholder="请输入合同编号"></el-input>
          </el-form-item>
          <el-form-item label="项目名称" prop="projectName">
            <el-input v-model="approvalForm.projectName" placeholder="请输入项目名称"></el-input>
          </el-form-item>
          <el-form-item label="客户" prop="customerId">
            <el-select v-model="approvalForm.customerId" placeholder="请选择客户">
              <el-option v-for="customer in customers" :key="customer.id" :label="customer.name" :value="customer.id"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="合同金额" prop="contractAmount">
            <el-input v-model.number="approvalForm.contractAmount" placeholder="请输入合同金额"></el-input>
          </el-form-item>
          <el-form-item label="签订日期" prop="signDate">
            <el-date-picker v-model="approvalForm.signDate" type="date" placeholder="请选择签订日期"></el-date-picker>
          </el-form-item>
          <el-form-item label="生效日期" prop="effectiveDate">
            <el-date-picker v-model="approvalForm.effectiveDate" type="date" placeholder="请选择生效日期"></el-date-picker>
          </el-form-item>
          <el-form-item label="审批流程" prop="flowId">
            <el-select v-model="approvalForm.flowId" placeholder="请选择审批流程">
              <el-option v-for="flow in flows" :key="flow.id" :label="flow.name" :value="flow.id"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="合同文件" prop="contractFile">
            <el-upload
              class="upload-demo"
              action="#"
              :auto-upload="false"
              :on-change="handleFileChange"
              :file-list="fileList"
            >
              <el-button type="primary">
                <i class="el-icon-upload"></i> 选择文件
              </el-button>
              <template #tip>
                <div class="el-upload__tip">
                  支持上传PDF、Word等格式文件
                </div>
              </template>
            </el-upload>
          </el-form-item>
        </el-form>
        
        <div class="approval-history">
          <h3>审批历史</h3>
          <el-timeline>
            <el-timeline-item
              v-for="(item, index) in approvalHistory"
              :key="index"
              :timestamp="item.timestamp"
              :type="item.type"
              :color="item.color"
            >
              <div class="timeline-content">
                <h4>{{ item.title }}</h4>
                <p>{{ item.description }}</p>
                <p class="timeline-user">{{ item.user }}</p>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="approvalDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveApproval">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'ContractApproval',
  data() {
    return {
      approvals: [
        {
          id: 1,
          contractNo: 'HT2026001',
          projectName: '自动化生产线项目',
          customerName: '上海XX自动化设备有限公司',
          contractAmount: 1500000,
          status: 'approved',
          createdAt: '2026-01-15'
        },
        {
          id: 2,
          contractNo: 'HT2026002',
          projectName: '控制系统升级',
          customerName: '北京XX科技有限公司',
          contractAmount: 1000000,
          status: 'pending',
          createdAt: '2026-02-20'
        },
        {
          id: 3,
          contractNo: 'HT2026003',
          projectName: '传感器网络部署',
          customerName: '广州XX制造有限公司',
          contractAmount: 550000,
          status: 'draft',
          createdAt: '2026-03-10'
        }
      ],
      searchQuery: '',
      selectedStatus: '',
      currentPage: 1,
      pageSize: 10,
      total: 3,
      approvalDialogVisible: false,
      isEditApproval: false,
      approvalForm: {
        id: '',
        contractNo: '',
        projectName: '',
        customerId: '',
        contractAmount: 0,
        signDate: '',
        effectiveDate: '',
        flowId: ''
      },
      approvalRules: {
        contractNo: [
          { required: true, message: '请输入合同编号', trigger: 'blur' }
        ],
        projectName: [
          { required: true, message: '请输入项目名称', trigger: 'blur' }
        ],
        customerId: [
          { required: true, message: '请选择客户', trigger: 'blur' }
        ],
        contractAmount: [
          { required: true, message: '请输入合同金额', trigger: 'blur' }
        ],
        signDate: [
          { required: true, message: '请选择签订日期', trigger: 'blur' }
        ],
        effectiveDate: [
          { required: true, message: '请选择生效日期', trigger: 'blur' }
        ],
        flowId: [
          { required: true, message: '请选择审批流程', trigger: 'blur' }
        ]
      },
      approvalHistory: [
        {
          title: '提交审批',
          description: '销售合同审批表已提交',
          user: '销售1',
          timestamp: '2026-02-20 10:00:00',
          type: 'primary',
          color: '#165DFF'
        },
        {
          title: '审批中',
          description: '销售经理审批中',
          user: '销售经理',
          timestamp: '2026-02-20 11:00:00',
          type: 'warning',
          color: '#faad14'
        }
      ],
      fileList: [],
      customers: [
        { id: 1, name: '上海XX自动化设备有限公司' },
        { id: 2, name: '北京XX科技有限公司' },
        { id: 3, name: '广州XX制造有限公司' }
      ],
      flows: [
        { id: 1, name: '销售合同审批流程' },
        { id: 2, name: '特殊合同审批流程' }
      ]
    }
  },
  methods: {
    addApproval() {
      this.isEditApproval = false
      this.approvalForm = {
        id: '',
        contractNo: '',
        projectName: '',
        customerId: '',
        contractAmount: 0,
        signDate: '',
        effectiveDate: '',
        flowId: ''
      }
      this.approvalHistory = []
      this.fileList = []
      this.approvalDialogVisible = true
    },
    viewApproval(id) {
      // 跳转到查看页面
      console.log('查看合同审批:', id)
    },
    editApproval(id) {
      this.isEditApproval = true
      const approval = this.approvals.find(a => a.id === id)
      if (approval) {
        this.approvalForm = {
          id: approval.id,
          contractNo: approval.contractNo,
          projectName: approval.projectName,
          customerId: 1,
          contractAmount: approval.contractAmount,
          signDate: '2026-02-20',
          effectiveDate: '2026-03-01',
          flowId: 1
        }
        this.approvalHistory = [
          {
            title: '提交审批',
            description: '销售合同审批表已提交',
            user: '销售1',
            timestamp: '2026-02-20 10:00:00',
            type: 'primary',
            color: '#165DFF'
          },
          {
            title: '审批中',
            description: '销售经理审批中',
            user: '销售经理',
            timestamp: '2026-02-20 11:00:00',
            type: 'warning',
            color: '#faad14'
          }
        ]
        this.fileList = []
        this.approvalDialogVisible = true
      }
    },
    submitApproval(id) {
      this.$confirm('确定要提交审批吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const approval = this.approvals.find(a => a.id === id)
        if (approval) {
          approval.status = 'pending'
          this.$message.success('提交审批成功')
        }
      })
    },
    printApproval(id) {
      // 模拟打印功能
      this.$message.success('打印成功')
      console.log('打印合同审批:', id)
    },
    saveApproval() {
      this.$refs.approvalFormRef.validate((valid) => {
        if (valid) {
          if (this.isEditApproval) {
            // 模拟更新
            const index = this.approvals.findIndex(a => a.id === this.approvalForm.id)
            if (index !== -1) {
              this.approvals[index].contractNo = this.approvalForm.contractNo
              this.approvals[index].projectName = this.approvalForm.projectName
              this.approvals[index].customerName = this.customers.find(c => c.id === this.approvalForm.customerId)?.name || ''
              this.approvals[index].contractAmount = this.approvalForm.contractAmount
            }
            this.$message.success('更新成功')
          } else {
            // 模拟创建
            const newApproval = {
              id: this.approvals.length + 1,
              contractNo: this.approvalForm.contractNo,
              projectName: this.approvalForm.projectName,
              customerName: this.customers.find(c => c.id === this.approvalForm.customerId)?.name || '',
              contractAmount: this.approvalForm.contractAmount,
              status: 'draft',
              createdAt: new Date().toISOString().split('T')[0]
            }
            this.approvals.push(newApproval)
            this.total++
            this.$message.success('创建成功')
          }
          this.approvalDialogVisible = false
        }
      })
    },
    handleFileChange(file, fileList) {
      this.fileList = fileList
    },
    search() {
      // 模拟搜索操作
      console.log('搜索:', this.searchQuery, this.selectedStatus)
    },
    handleSizeChange(size) {
      this.pageSize = size
      // 模拟分页操作
    },
    handleCurrentChange(current) {
      this.currentPage = current
      // 模拟分页操作
    }
  }
}
</script>

<style scoped>
.contract-approval {
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

.approval-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.approval-history {
  margin-top: 20px;
}

.approval-history h3 {
  margin-top: 0;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
}

.timeline-content {
  width: 100%;
}

.timeline-content h4 {
  margin: 0 0 5px 0;
  font-size: 14px;
  font-weight: 600;
}

.timeline-content p {
  margin: 0 0 5px 0;
  font-size: 14px;
  color: #666;
}

.timeline-user {
  font-size: 12px;
  color: #999;
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