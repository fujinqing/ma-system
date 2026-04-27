<template>
  <div class="tech-agreement">
    <div class="page-header">
      <h2 class="page-title">技术协议审批</h2>
      <div class="header-actions">
        <el-button type="primary" @click="addAgreement">
          <i class="fa fa-plus"></i> 新建技术协议
        </el-button>
        <el-button type="success" @click="exportAgreements">
          <i class="fa fa-download"></i> 导出
        </el-button>
      </div>
    </div>
    
    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索协议编号或项目名称"
        prefix-icon="el-icon-search"
        style="width: 300px;"
      ></el-input>
      <el-select v-model="status" placeholder="选择状态">
        <el-option label="全部" value=""></el-option>
        <el-option label="待审批" value="pending"></el-option>
        <el-option label="审批中" value="processing"></el-option>
        <el-option label="已通过" value="approved"></el-option>
        <el-option label="已拒绝" value="rejected"></el-option>
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
    
    <el-table :data="agreements" style="width: 100%" border>
      <el-table-column prop="id" label="协议编号" width="120"></el-table-column>
      <el-table-column prop="projectName" label="项目名称" min-width="180"></el-table-column>
      <el-table-column prop="customerName" label="客户名称" min-width="150"></el-table-column>
      <el-table-column prop="version" label="版本" width="80"></el-table-column>
      <el-table-column prop="creator" label="创建人" width="100"></el-table-column>
      <el-table-column prop="createDate" label="创建日期" width="150"></el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 'pending'" type="info">待审批</el-tag>
          <el-tag v-else-if="scope.row.status === 'processing'" type="warning">审批中</el-tag>
          <el-tag v-else-if="scope.row.status === 'approved'" type="success">已通过</el-tag>
          <el-tag v-else type="danger">已拒绝</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="300" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" @click="viewAgreement(scope.row.id)">查看</el-button>
            <el-button type="warning" size="small" @click="editAgreement(scope.row.id)" v-if="scope.row.status === 'pending'">编辑</el-button>
            <el-button v-if="scope.row.status === 'pending'" type="success" size="small" @click="submitForApproval(scope.row.id)">提交审批</el-button>
            <el-button v-if="scope.row.status === 'processing'" type="info" size="small" @click="approveAgreement(scope.row.id)">审批</el-button>
            <el-button v-if="scope.row.status === 'processing' && scope.row.creator === '当前用户'" type="danger" size="small" @click="withdrawAgreement(scope.row.id)">撤回</el-button>
            <el-button v-if="scope.row.status === 'approved' || scope.row.status === 'rejected'" type="info" size="small" @click="endAgreement(scope.row.id)">结束流程</el-button>
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
    
    <!-- 技术协议表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑技术协议' : '新建技术协议'"
      width="80%"
      destroy-on-close
    >
      <div class="agreement-form">
        <el-form :model="agreementForm" :rules="rules" ref="formRef" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="协议编号" prop="id">
                <el-input v-model="agreementForm.id" placeholder="请输入协议编号" :disabled="isEdit"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="项目名称" prop="projectId">
                <el-select v-model="agreementForm.projectId" placeholder="请选择项目" style="width: 100%">
                  <el-option v-for="project in projects" :key="project.id" :label="project.name" :value="project.id"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="客户名称" prop="customerId">
                <el-select v-model="agreementForm.customerId" placeholder="请选择客户" style="width: 100%">
                  <el-option v-for="customer in customers" :key="customer.id" :label="customer.name" :value="customer.id"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="版本" prop="version">
                <el-input v-model="agreementForm.version" placeholder="请输入版本"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="创建日期" prop="createDate">
                <el-date-picker v-model="agreementForm.createDate" type="date" placeholder="请选择创建日期" style="width: 100%"></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="有效期至" prop="expiryDate">
                <el-date-picker v-model="agreementForm.expiryDate" type="date" placeholder="请选择有效期至" style="width: 100%"></el-date-picker>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="协议内容" prop="content">
            <el-input v-model="agreementForm.content" type="textarea" :rows="8" placeholder="请输入协议内容"></el-input>
          </el-form-item>
          <el-form-item label="技术要求" prop="technicalRequirements">
            <el-input v-model="agreementForm.technicalRequirements" type="textarea" :rows="5" placeholder="请输入技术要求"></el-input>
          </el-form-item>
          <el-form-item label="验收标准" prop="acceptanceCriteria">
            <el-input v-model="agreementForm.acceptanceCriteria" type="textarea" :rows="5" placeholder="请输入验收标准"></el-input>
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
          <el-button type="primary" @click="saveAgreement">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 审批对话框 -->
    <el-dialog
      v-model="approvalDialogVisible"
      title="技术协议审批"
      width="70%"
      destroy-on-close
    >
      <div class="approval-form">
        <el-form :model="approvalForm" :rules="approvalRules" ref="approvalFormRef" label-width="120px">
          <el-form-item label="审批意见" prop="comment">
            <el-input v-model="approvalForm.comment" type="textarea" :rows="4" placeholder="请输入审批意见"></el-input>
          </el-form-item>
          <el-form-item label="审批结果" prop="result">
            <el-radio-group v-model="approvalForm.result">
              <el-radio label="approved">审批同意</el-radio>
              <el-radio label="rejected">退回修改</el-radio>
              <el-radio label="canceled">取消作废</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="个人签名">
            <div class="signature-container">
              <canvas ref="signatureCanvas" class="signature-canvas" width="400" height="150"></canvas>
              <div class="signature-buttons">
                <el-button size="small" @click="clearSignature">清除签名</el-button>
                <el-button size="small" type="primary" @click="saveSignature">保存签名</el-button>
              </div>
            </div>
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="approvalDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitApproval">提交审批</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'TechAgreement',
  data() {
    return {
      searchQuery: '',
      status: '',
      dateRange: [],
      currentPage: 1,
      pageSize: 10,
      total: 0,
      agreements: [
        {
          id: 'XSY2026001',
          projectName: '自动化生产线改造',
          customerName: '上海XX电子有限公司',
          version: 'V1.0',
          creator: '张三',
          createDate: '2026-03-01',
          status: 'approved',
          approvalHistory: [
            {
              approver: '李四',
              comment: '同意',
              result: 'approved',
              date: '2026-03-02',
              signature: ''
            }
          ]
        },
        {
          id: 'XSY2026002',
          projectName: '智能仓储系统',
          customerName: '北京XX物流有限公司',
          version: 'V1.0',
          creator: '李四',
          createDate: '2026-03-10',
          status: 'processing',
          approvalHistory: [
            {
              approver: '张三',
              comment: '请补充技术细节',
              result: 'rejected',
              date: '2026-03-11',
              signature: ''
            }
          ]
        },
        {
          id: 'XSY2026003',
          projectName: '机器人工作站',
          customerName: '广州XX制造有限公司',
          version: 'V1.0',
          creator: '当前用户',
          createDate: '2026-03-15',
          status: 'pending',
          approvalHistory: []
        }
      ],
      dialogVisible: false,
      isEdit: false,
      agreementForm: {
        id: '',
        projectId: '',
        customerId: '',
        version: 'V1.0',
        createDate: '',
        expiryDate: '',
        content: '',
        technicalRequirements: '',
        acceptanceCriteria: '',
        attachments: []
      },
      rules: {
        id: [
          { required: true, message: '请输入协议编号', trigger: 'blur' }
        ],
        projectId: [
          { required: true, message: '请选择项目', trigger: 'blur' }
        ],
        customerId: [
          { required: true, message: '请选择客户', trigger: 'blur' }
        ],
        version: [
          { required: true, message: '请输入版本', trigger: 'blur' }
        ],
        createDate: [
          { required: true, message: '请选择创建日期', trigger: 'blur' }
        ],
        content: [
          { required: true, message: '请输入协议内容', trigger: 'blur' }
        ]
      },
      fileList: [],
      approvalDialogVisible: false,
      currentAgreementId: '',
      approvalForm: {
        comment: '',
        result: 'approved',
        signature: ''
      },
      approvalRules: {
        comment: [
          { required: true, message: '请输入审批意见', trigger: 'blur' }
        ],
        result: [
          { required: true, message: '请选择审批结果', trigger: 'blur' }
        ]
      },
      signatureImage: '',
      projects: [
        { id: 1, name: '自动化生产线改造' },
        { id: 2, name: '智能仓储系统' },
        { id: 3, name: '机器人工作站' }
      ],
      customers: [
        { id: 1, name: '上海XX电子有限公司' },
        { id: 2, name: '北京XX物流有限公司' },
        { id: 3, name: '广州XX制造有限公司' }
      ],
      // 审批流程定义
      approvalFlow: [
        { role: '技术主管', approver: '张三' },
        { role: '项目经理', approver: '李四' },
        { role: '部门经理', approver: '王五' }
      ]
    }
  },
  mounted() {
    this.total = this.agreements.length
  },
  methods: {
    addAgreement() {
      this.isEdit = false
      this.agreementForm = {
        id: '',
        projectId: '',
        customerId: '',
        version: 'V1.0',
        createDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        content: '',
        technicalRequirements: '',
        acceptanceCriteria: '',
        attachments: []
      }
      this.fileList = []
      this.dialogVisible = true
    },
    viewAgreement(id) {
      console.log('查看技术协议:', id)
    },
    editAgreement(id) {
      this.isEdit = true
      const agreement = this.agreements.find(a => a.id === id)
      if (agreement) {
        this.agreementForm = {
          id: agreement.id,
          projectId: '',
          customerId: '',
          version: agreement.version,
          createDate: agreement.createDate,
          expiryDate: '',
          content: '技术协议内容...',
          technicalRequirements: '技术要求...',
          acceptanceCriteria: '验收标准...',
          attachments: []
        }
        this.fileList = []
        this.dialogVisible = true
      }
    },
    submitForApproval(id) {
      this.$confirm('确定要提交审批吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const agreement = this.agreements.find(a => a.id === id)
        if (agreement) {
          agreement.status = 'processing'
          this.$message.success('提交审批成功')
        }
      })
    },
    approveAgreement(id) {
      this.currentAgreementId = id
      this.approvalForm = {
        comment: '',
        result: 'approved'
      }
      this.approvalDialogVisible = true
    },
    saveAgreement() {
      this.$refs.formRef.validate((valid) => {
        if (valid) {
          if (this.isEdit) {
            const index = this.agreements.findIndex(a => a.id === this.agreementForm.id)
            if (index !== -1) {
              this.agreements[index].version = this.agreementForm.version
              this.agreements[index].createDate = this.agreementForm.createDate
            }
            this.$message.success('更新成功')
          } else {
            const newAgreement = {
              id: this.agreementForm.id,
              projectName: this.projects.find(p => p.id === this.agreementForm.projectId)?.name || '',
              customerName: this.customers.find(c => c.id === this.agreementForm.customerId)?.name || '',
              version: this.agreementForm.version,
              creator: '当前用户',
              createDate: this.agreementForm.createDate,
              status: 'pending'
            }
            this.agreements.push(newAgreement)
            this.total++
            this.$message.success('创建成功')
          }
          this.dialogVisible = false
        }
      })
    },
    submitApproval() {
      this.$refs.approvalFormRef.validate((valid) => {
        if (valid) {
          const agreement = this.agreements.find(a => a.id === this.currentAgreementId)
          if (agreement) {
            // 添加审批历史记录
            const approvalRecord = {
              approver: '当前审批人',
              comment: this.approvalForm.comment,
              result: this.approvalForm.result,
              date: new Date().toISOString().split('T')[0],
              signature: this.approvalForm.signature
            }
            agreement.approvalHistory.push(approvalRecord)
            
            // 处理不同的审批结果
            if (this.approvalForm.result === 'approved') {
              // 检查是否有下一审批流程
              const currentApprovalIndex = agreement.approvalHistory.length - 1
              if (currentApprovalIndex < this.approvalFlow.length - 1) {
                // 自动推送至下一流程负责人
                agreement.status = 'processing'
                this.$message.success(`审批通过，已自动推送至${this.approvalFlow[currentApprovalIndex + 1].role}${this.approvalFlow[currentApprovalIndex + 1].approver}处理`)
              } else {
                // 流程结束
                agreement.status = 'approved'
                this.$message.success('审批通过，流程已完成')
              }
            } else if (this.approvalForm.result === 'rejected') {
              // 退回修改
              agreement.status = 'pending'
              this.$message.success('已退回修改，请通知提交人进行修改')
            } else if (this.approvalForm.result === 'canceled') {
              // 取消作废
              agreement.status = 'canceled'
              this.$message.success('流程已取消作废')
            }
          }
          this.approvalDialogVisible = false
        }
      })
    },
    withdrawAgreement(id) {
      this.$confirm('确定要撤回审批吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const agreement = this.agreements.find(a => a.id === id)
        if (agreement) {
          agreement.status = 'pending'
          agreement.approvalHistory = []
          this.$message.success('撤回成功')
        }
      })
    },
    endAgreement(id) {
      this.$confirm('确定要结束流程吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const agreement = this.agreements.find(a => a.id === id)
        if (agreement) {
          agreement.status = 'ended'
          this.$message.success('流程已结束')
        }
      })
    },
    // 签名功能
    mounted() {
      this.total = this.agreements.length
      this.initSignatureCanvas()
    },
    initSignatureCanvas() {
      const canvas = this.$refs.signatureCanvas
      if (canvas) {
        const ctx = canvas.getContext('2d')
        let isDrawing = false
        let lastX = 0
        let lastY = 0
        
        canvas.addEventListener('mousedown', (e) => {
          isDrawing = true
          const rect = canvas.getBoundingClientRect()
          lastX = e.clientX - rect.left
          lastY = e.clientY - rect.top
        })
        
        canvas.addEventListener('mousemove', (e) => {
          if (!isDrawing) return
          const rect = canvas.getBoundingClientRect()
          const currentX = e.clientX - rect.left
          const currentY = e.clientY - rect.top
          
          ctx.beginPath()
          ctx.moveTo(lastX, lastY)
          ctx.lineTo(currentX, currentY)
          ctx.strokeStyle = '#000'
          ctx.lineWidth = 2
          ctx.stroke()
          
          lastX = currentX
          lastY = currentY
        })
        
        canvas.addEventListener('mouseup', () => {
          isDrawing = false
        })
        
        canvas.addEventListener('mouseout', () => {
          isDrawing = false
        })
      }
    },
    clearSignature() {
      const canvas = this.$refs.signatureCanvas
      if (canvas) {
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        this.approvalForm.signature = ''
      }
    },
    saveSignature() {
      const canvas = this.$refs.signatureCanvas
      if (canvas) {
        this.approvalForm.signature = canvas.toDataURL('image/png')
        this.$message.success('签名保存成功')
      }
    },
    search() {
      console.log('搜索技术协议:', this.searchQuery, this.status, this.dateRange)
    },
    exportAgreements() {
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
.tech-agreement {
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

.agreement-form,
.approval-form {
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