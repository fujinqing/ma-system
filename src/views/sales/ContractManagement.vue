<template>
  <div class="contract-management">
    <div class="page-header">
      <h2 class="page-title">合同管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="addContract">
          <i class="fa fa-plus"></i> 新建合同
        </el-button>
        <el-button type="success" @click="exportContracts">
          <i class="fa fa-download"></i> 导出
        </el-button>
      </div>
    </div>
    
    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索合同编号或客户名称"
        prefix-icon="el-icon-search"
        style="width: 300px;"
      ></el-input>
      <el-select v-model="status" placeholder="选择状态">
        <el-option label="全部" value=""></el-option>
        <el-option label="草稿" value="draft"></el-option>
        <el-option label="审批中" value="processing"></el-option>
        <el-option label="已签署" value="signed"></el-option>
        <el-option label="执行中" value="executing"></el-option>
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
    
    <el-table :data="contracts" style="width: 100%" border>
      <el-table-column prop="id" label="合同编号" width="120"></el-table-column>
      <el-table-column prop="customerName" label="客户名称" min-width="150"></el-table-column>
      <el-table-column prop="projectName" label="项目名称" min-width="180"></el-table-column>
      <el-table-column prop="amount" label="合同金额" width="120" :formatter="formatAmount"></el-table-column>
      <el-table-column prop="currency" label="货币" width="80"></el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 'draft'" type="info">草稿</el-tag>
          <el-tag v-else-if="scope.row.status === 'processing'" type="warning">审批中</el-tag>
          <el-tag v-else-if="scope.row.status === 'signed'" type="primary">已签署</el-tag>
          <el-tag v-else-if="scope.row.status === 'executing'" type="success">执行中</el-tag>
          <el-tag v-else-if="scope.row.status === 'completed'" type="success">已完成</el-tag>
          <el-tag v-else type="danger">已终止</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="signDate" label="签署日期" width="150"></el-table-column>
      <el-table-column prop="expiryDate" label="到期日期" width="150"></el-table-column>
      <el-table-column label="操作" width="250" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="viewContract(scope.row.id)">查看</el-button>
          <el-button type="warning" size="small" @click="editContract(scope.row.id)" v-if="scope.row.status === 'draft'">编辑</el-button>
          <el-button type="success" size="small" @click="signContract(scope.row.id)" v-if="scope.row.status === 'processing'">签署</el-button>
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
    
    <!-- 合同表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑合同' : '新建合同'"
      width="70%"
      destroy-on-close
    >
      <div class="contract-form">
        <el-form :model="contractForm" :rules="rules" ref="formRef" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="合同编号" prop="id">
                <el-input v-model="contractForm.id" placeholder="请输入合同编号" :disabled="isEdit"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="客户名称" prop="customerId">
                <el-select v-model="contractForm.customerId" placeholder="请选择客户" style="width: 100%">
                  <el-option v-for="customer in customers" :key="customer.id" :label="customer.name" :value="customer.id"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="项目名称" prop="projectName">
                <el-input v-model="contractForm.projectName" placeholder="请输入项目名称"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="合同金额" prop="amount">
                <el-input v-model="contractForm.amount" type="number" placeholder="请输入合同金额"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="货币" prop="currency">
                <el-select v-model="contractForm.currency" placeholder="请选择货币" style="width: 100%">
                  <el-option label="人民币" value="CNY"></el-option>
                  <el-option label="美元" value="USD"></el-option>
                  <el-option label="欧元" value="EUR"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="签署日期" prop="signDate">
                <el-date-picker v-model="contractForm.signDate" type="date" placeholder="请选择签署日期" style="width: 100%"></el-date-picker>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="到期日期" prop="expiryDate">
                <el-date-picker v-model="contractForm.expiryDate" type="date" placeholder="请选择到期日期" style="width: 100%"></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="合同状态" prop="status">
                <el-select v-model="contractForm.status" placeholder="请选择合同状态" style="width: 100%">
                  <el-option label="草稿" value="draft"></el-option>
                  <el-option label="审批中" value="processing"></el-option>
                  <el-option label="已签署" value="signed"></el-option>
                  <el-option label="执行中" value="executing"></el-option>
                  <el-option label="已完成" value="completed"></el-option>
                  <el-option label="已终止" value="terminated"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="合同内容" prop="content">
            <el-input v-model="contractForm.content" type="textarea" :rows="4" placeholder="请输入合同内容"></el-input>
          </el-form-item>
          <el-form-item label="备注" prop="remark">
            <el-input v-model="contractForm.remark" type="textarea" :rows="4" placeholder="请输入备注"></el-input>
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
          <el-button type="primary" @click="saveContract">保存</el-button>
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
      searchQuery: '',
      status: '',
      dateRange: [],
      currentPage: 1,
      pageSize: 10,
      total: 0,
      contracts: [
        {
          id: 'HT2026001',
          customerName: '上海XX电子有限公司',
          projectName: '自动化生产线改造',
          amount: 1500000,
          currency: 'CNY',
          status: 'executing',
          signDate: '2026-03-01',
          expiryDate: '2027-03-01'
        },
        {
          id: 'HT2026002',
          customerName: '北京XX物流有限公司',
          projectName: '智能仓储系统',
          amount: 800000,
          currency: 'CNY',
          status: 'signed',
          signDate: '2026-03-10',
          expiryDate: '2027-03-10'
        },
        {
          id: 'HT2026003',
          customerName: '广州XX制造有限公司',
          projectName: '机器人工作站',
          amount: 500000,
          currency: 'CNY',
          status: 'draft',
          signDate: '',
          expiryDate: ''
        }
      ],
      dialogVisible: false,
      isEdit: false,
      contractForm: {
        id: '',
        customerId: '',
        projectName: '',
        amount: '',
        currency: 'CNY',
        signDate: '',
        expiryDate: '',
        status: 'draft',
        content: '',
        remark: '',
        attachments: []
      },
      rules: {
        id: [
          { required: true, message: '请输入合同编号', trigger: 'blur' }
        ],
        customerId: [
          { required: true, message: '请选择客户', trigger: 'blur' }
        ],
        projectName: [
          { required: true, message: '请输入项目名称', trigger: 'blur' }
        ],
        amount: [
          { required: true, message: '请输入合同金额', trigger: 'blur' }
        ],
        currency: [
          { required: true, message: '请选择货币', trigger: 'blur' }
        ],
        status: [
          { required: true, message: '请选择合同状态', trigger: 'blur' }
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
    this.total = this.contracts.length
  },
  methods: {
    addContract() {
      this.isEdit = false
      this.contractForm = {
        id: '',
        customerId: '',
        projectName: '',
        amount: '',
        currency: 'CNY',
        signDate: '',
        expiryDate: '',
        status: 'draft',
        content: '',
        remark: '',
        attachments: []
      }
      this.fileList = []
      this.dialogVisible = true
    },
    viewContract(id) {
      console.log('查看合同:', id)
    },
    editContract(id) {
      this.isEdit = true
      const contract = this.contracts.find(c => c.id === id)
      if (contract) {
        this.contractForm = {
          id: contract.id,
          customerId: '',
          projectName: contract.projectName,
          amount: contract.amount,
          currency: contract.currency,
          signDate: contract.signDate,
          expiryDate: contract.expiryDate,
          status: contract.status,
          content: '',
          remark: '',
          attachments: []
        }
        this.fileList = []
        this.dialogVisible = true
      }
    },
    signContract(id) {
      this.$confirm('确定要签署合同吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const contract = this.contracts.find(c => c.id === id)
        if (contract) {
          contract.status = 'signed'
          contract.signDate = new Date().toISOString().split('T')[0]
          this.$message.success('合同签署成功')
        }
      })
    },
    saveContract() {
      this.$refs.formRef.validate((valid) => {
        if (valid) {
          if (this.isEdit) {
            const index = this.contracts.findIndex(c => c.id === this.contractForm.id)
            if (index !== -1) {
              this.contracts[index].projectName = this.contractForm.projectName
              this.contracts[index].amount = this.contractForm.amount
              this.contracts[index].currency = this.contractForm.currency
              this.contracts[index].signDate = this.contractForm.signDate
              this.contracts[index].expiryDate = this.contractForm.expiryDate
              this.contracts[index].status = this.contractForm.status
            }
            this.$message.success('更新成功')
          } else {
            const newContract = {
              id: this.contractForm.id,
              customerName: this.customers.find(c => c.id === this.contractForm.customerId)?.name || '',
              projectName: this.contractForm.projectName,
              amount: this.contractForm.amount,
              currency: this.contractForm.currency,
              status: this.contractForm.status,
              signDate: this.contractForm.signDate,
              expiryDate: this.contractForm.expiryDate
            }
            this.contracts.push(newContract)
            this.total++
            this.$message.success('创建成功')
          }
          this.dialogVisible = false
        }
      })
    },
    search() {
      console.log('搜索合同:', this.searchQuery, this.status, this.dateRange)
    },
    exportContracts() {
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
    },
    formatAmount(row, column, cellValue) {
      return cellValue ? `${cellValue.toLocaleString()} ${row.currency}` : ''
    }
  }
}
</script>

<style scoped>
.contract-management {
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

.contract-form {
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