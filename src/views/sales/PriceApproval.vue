<template>
  <div class="price-approval">
    <div class="page-header">
      <h2 class="page-title">价格计算审批表</h2>
      <div class="header-actions">
        <el-button type="primary" @click="addRecord">
          <i class="fa fa-plus"></i> 新建记录
        </el-button>
        <el-button type="success" @click="exportRecords">
          <i class="fa fa-download"></i> 导出
        </el-button>
        <el-button type="info" @click="toggleFullscreen">
          <i :class="isFullscreen ? 'fa fa-compress' : 'fa fa-expand'"></i>
          {{ isFullscreen ? '退出全屏' : '全屏' }}
        </el-button>
      </div>
    </div>
    
    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索项目名称、客户名称或编号"
        prefix-icon="el-icon-search"
        style="width: 400px;"
        @keyup.enter="search"
      ></el-input>
      <el-select v-model="stageFilter" placeholder="选择阶段" style="width: 120px;">
        <el-option label="全部" value=""></el-option>
        <el-option label="方案阶段" value="solution"></el-option>
        <el-option label="报价阶段" value="quote"></el-option>
      </el-select>
      <el-select v-model="status" placeholder="选择状态" style="width: 120px;">
        <el-option label="全部" value=""></el-option>
        <el-option label="待处理" value="pending"></el-option>
        <el-option label="进行中" value="processing"></el-option>
        <el-option label="已完成" value="completed"></el-option>
        <el-option label="已终止" value="terminated"></el-option>
      </el-select>
      <el-button type="primary" @click="search">搜索</el-button>
    </div>
    
    <el-table :data="filteredRecords" style="width: 100%" border>
      <el-table-column prop="id" label="编号" width="120"></el-table-column>
      <el-table-column prop="projectName" label="项目名称" min-width="180"></el-table-column>
      <el-table-column prop="customerName" label="客户名称" min-width="150"></el-table-column>
      <el-table-column prop="stage" label="阶段" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.stage === 'solution'" type="warning">方案阶段</el-tag>
          <el-tag v-else type="primary">报价阶段</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 'pending'" type="info">待处理</el-tag>
          <el-tag v-else-if="scope.row.status === 'processing'" type="warning">进行中</el-tag>
          <el-tag v-else-if="scope.row.status === 'completed'" type="success">已完成</el-tag>
          <el-tag v-else type="danger">已终止</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="totalPrice" label="报价金额" width="130" align="right">
        <template #default="scope">
          <span>{{ scope.row.totalPrice ? '¥' + scope.row.totalPrice.toLocaleString() : '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="tracker" label="跟进人员" width="100"></el-table-column>
      <el-table-column prop="createDate" label="创建日期" width="120"></el-table-column>
      <el-table-column prop="attachmentCount" label="附件" width="80" align="center">
        <template #default="scope">
          <el-badge :value="scope.row.attachments?.length || 0" :hidden="!scope.row.attachments?.length">
            <i class="fa fa-paperclip"></i>
          </el-badge>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="250" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="viewRecord(scope.row)">查看</el-button>
          <el-button type="warning" size="small" @click="editRecord(scope.row)">编辑</el-button>
          <el-button type="success" size="small" @click="uploadFile(scope.row)">上传附件</el-button>
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
    
    <!-- 记录表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="90%"
      destroy-on-close
      :fullscreen="isDialogFullscreen"
    >
      <template #header>
        <div class="dialog-header">
          <span class="dialog-title">{{ dialogTitle }}</span>
          <el-button type="info" size="small" @click="toggleDialogFullscreen">
            <i :class="isDialogFullscreen ? 'fa fa-compress' : 'fa fa-expand'"></i>
            {{ isDialogFullscreen ? '退出全屏' : '全屏' }}
          </el-button>
        </div>
      </template>
      
      <div class="record-form">
        <el-form :model="recordForm" :rules="rules" ref="formRef" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="编号" prop="id">
                <el-input v-model="recordForm.id" placeholder="请输入编号" :disabled="isEdit"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="阶段" prop="stage">
                <el-select v-model="recordForm.stage" placeholder="请选择阶段" style="width: 100%" :disabled="isEdit">
                  <el-option label="方案阶段" value="solution"></el-option>
                  <el-option label="报价阶段" value="quote"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="状态" prop="status">
                <el-select v-model="recordForm.status" placeholder="请选择状态" style="width: 100%">
                  <el-option label="待处理" value="pending"></el-option>
                  <el-option label="进行中" value="processing"></el-option>
                  <el-option label="已完成" value="completed"></el-option>
                  <el-option label="已终止" value="terminated"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="项目名称" prop="projectName">
                <el-input v-model="recordForm.projectName" placeholder="请输入项目名称"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="客户名称" prop="customerName">
                <el-input v-model="recordForm.customerName" placeholder="请输入客户名称"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="跟进人员" prop="tracker">
                <el-input v-model="recordForm.tracker" placeholder="请输入跟进人员"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="报价金额" prop="totalPrice">
                <el-input-number 
                  v-model="recordForm.totalPrice" 
                  :min="0" 
                  :precision="2" 
                  :controls="false"
                  style="width: 100%;"
                  placeholder="请输入报价金额"
                ></el-input-number>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="创建日期" prop="createDate">
                <el-date-picker 
                  v-model="recordForm.createDate" 
                  type="date" 
                  placeholder="请选择创建日期" 
                  style="width: 100%"
                  :disabled="isEdit"
                ></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="更新时间" prop="updateDate">
                <el-date-picker 
                  v-model="recordForm.updateDate" 
                  type="date" 
                  placeholder="请选择更新日期" 
                  style="width: 100%"
                ></el-date-picker>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="方案描述" prop="description">
            <el-input v-model="recordForm.description" type="textarea" :rows="3" placeholder="请输入方案描述"></el-input>
          </el-form-item>
          <el-form-item label="进展情况" prop="progress">
            <el-input v-model="recordForm.progress" type="textarea" :rows="3" placeholder="请输入进展情况"></el-input>
          </el-form-item>
          
          <!-- 附件列表 -->
          <el-form-item label="附件列表">
            <div class="attachment-list" v-if="recordForm.attachments?.length">
              <div class="attachment-item" v-for="(file, index) in recordForm.attachments" :key="index">
                <i class="fa fa-file attachment-icon"></i>
                <span class="attachment-name" @click="viewFile(file)">{{ file.name }}</span>
                <span class="attachment-size">{{ formatFileSize(file.size) }}</span>
                <el-button type="danger" size="small" @click="removeAttachment(index)" :disabled="isView">删除</el-button>
              </div>
            </div>
            <div v-else class="no-attachment">暂无附件</div>
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">
            {{ isView ? '关闭' : '取消' }}
          </el-button>
          <el-button v-if="!isView" type="primary" @click="saveRecord">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 文件上传对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="上传附件"
      width="400px"
      destroy-on-close
    >
      <el-upload
        class="upload-demo"
        drag
        action="#"
        :auto-upload="false"
        :on-change="handleFileChange"
        :file-list="fileList"
        multiple
      >
        <i class="fa fa-cloud-upload-alt fa-3x"></i>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">支持任意格式文件，单个文件不超过10MB</div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmUpload">确定上传</el-button>
      </template>
    </el-dialog>
    
    <!-- 文件预览对话框 -->
    <el-dialog
      v-model="previewDialogVisible"
      title="文件预览"
      width="80%"
      destroy-on-close
    >
      <div class="file-preview">
        <iframe v-if="previewUrl" :src="previewUrl" class="preview-frame"></iframe>
        <div v-else class="preview-placeholder">
          <i class="fa fa-file fa-5x"></i>
          <p>该文件类型不支持在线预览，请下载后查看</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="previewDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="downloadFile">下载文件</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'PriceApproval',
  data() {
    return {
      searchQuery: '',
      stageFilter: '',
      status: '',
      currentPage: 1,
      pageSize: 10,
      total: 0,
      records: [],
      dialogVisible: false,
      dialogTitle: '新建记录',
      isEdit: false,
      isView: false,
      isDialogFullscreen: false,
      recordForm: {
        id: '',
        projectName: '',
        customerName: '',
        stage: 'solution',
        status: 'pending',
        totalPrice: null,
        tracker: '',
        createDate: '',
        updateDate: '',
        description: '',
        progress: '',
        attachments: []
      },
      rules: {
        id: [
          { required: true, message: '请输入编号', trigger: 'blur' }
        ],
        projectName: [
          { required: true, message: '请输入项目名称', trigger: 'blur' }
        ],
        customerName: [
          { required: true, message: '请输入客户名称', trigger: 'blur' }
        ],
        stage: [
          { required: true, message: '请选择阶段', trigger: 'change' }
        ],
        status: [
          { required: true, message: '请选择状态', trigger: 'change' }
        ]
      },
      uploadDialogVisible: false,
      fileList: [],
      currentUploadRecord: null,
      previewDialogVisible: false,
      previewUrl: '',
      previewFile: null,
      isFullscreen: false
    }
  },
  computed: {
    filteredRecords() {
      let result = [...this.records]
      
      if (this.searchQuery) {
        const keyword = this.searchQuery.toLowerCase()
        result = result.filter(item => {
          return item.id.toLowerCase().includes(keyword) ||
                 item.projectName.toLowerCase().includes(keyword) ||
                 item.customerName.toLowerCase().includes(keyword)
        })
      }
      
      if (this.stageFilter) {
        result = result.filter(item => item.stage === this.stageFilter)
      }
      
      if (this.status) {
        result = result.filter(item => item.status === this.status)
      }
      
      return result
    }
  },
  mounted() {
    this.loadData()
    this.total = this.records.length
    document.addEventListener('fullscreenchange', this.handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', this.handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', this.handleFullscreenChange)
  },
  beforeUnmount() {
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange)
    document.removeEventListener('webkitfullscreenchange', this.handleFullscreenChange)
    document.removeEventListener('mozfullscreenchange', this.handleFullscreenChange)
    document.removeEventListener('MSFullscreenChange', this.handleFullscreenChange)
  },
  methods: {
    loadData() {
      // 从localStorage加载方案数据
      const savedSolutions = localStorage.getItem('solutions')
      if (savedSolutions) {
        const solutions = JSON.parse(savedSolutions)
        solutions.forEach(s => {
          s.stage = 'solution'
          s.attachmentCount = s.attachments?.length || 0
        })
        this.records = [...solutions]
      }
      
      // 从localStorage加载价格计算数据
      const savedPriceCalcs = localStorage.getItem('priceCalculations')
      if (savedPriceCalcs) {
        const priceCalcs = JSON.parse(savedPriceCalcs)
        priceCalcs.forEach(p => {
          p.stage = 'quote'
          p.attachmentCount = p.attachments?.length || 0
        })
        this.records = [...this.records, ...priceCalcs]
      }
      
      // 如果都没有数据，使用示例数据
      if (this.records.length === 0) {
        this.records = [
          {
            id: 'FA2026001',
            projectName: '自动化生产线改造',
            customerName: '上海XX电子有限公司',
            stage: 'solution',
            status: 'completed',
            totalPrice: null,
            tracker: '张三',
            createDate: '2026-01-15',
            updateDate: '2026-02-20',
            description: '需要对现有生产线进行自动化改造',
            progress: '方案已完成，等待客户确认',
            attachments: []
          },
          {
            id: 'JC2026001',
            projectName: '自动化生产线改造',
            customerName: '上海XX电子有限公司',
            stage: 'quote',
            status: 'completed',
            totalPrice: 1500000,
            tracker: '张三',
            createDate: '2026-02-21',
            updateDate: '2026-03-10',
            description: '已完成详细报价',
            progress: '已提交报价，等待客户确认',
            attachments: []
          },
          {
            id: 'FA2026002',
            projectName: '智能仓储系统',
            customerName: '北京XX物流有限公司',
            stage: 'solution',
            status: 'processing',
            totalPrice: null,
            tracker: '李四',
            createDate: '2026-03-01',
            updateDate: '2026-03-15',
            description: '建设智能化仓储物流系统',
            progress: '方案制定中',
            attachments: []
          },
          {
            id: 'JC2026002',
            projectName: '智能仓储系统',
            customerName: '北京XX物流有限公司',
            stage: 'quote',
            status: 'processing',
            totalPrice: 800000,
            tracker: '李四',
            createDate: '2026-03-16',
            updateDate: '2026-03-18',
            description: '报价计算中',
            progress: '正在计算各项成本',
            attachments: []
          }
        ]
      }
      
      this.total = this.records.length
    },
    search() {
      console.log('搜索:', this.searchQuery, this.stageFilter, this.status)
    },
    addRecord() {
      this.isEdit = false
      this.isView = false
      this.isDialogFullscreen = false
      this.recordForm = {
        id: '',
        projectName: '',
        customerName: '',
        stage: 'solution',
        status: 'pending',
        totalPrice: null,
        tracker: '',
        createDate: new Date().toISOString().split('T')[0],
        updateDate: new Date().toISOString().split('T')[0],
        description: '',
        progress: '',
        attachments: []
      }
      this.dialogTitle = '新建记录'
      this.dialogVisible = true
    },
    editRecord(row) {
      this.isEdit = true
      this.isView = false
      this.isDialogFullscreen = false
      this.recordForm = {
        ...row,
        attachments: row.attachments ? [...row.attachments] : []
      }
      this.dialogTitle = '编辑记录'
      this.dialogVisible = true
    },
    viewRecord(row) {
      this.isEdit = false
      this.isView = true
      this.isDialogFullscreen = false
      this.recordForm = {
        ...row,
        attachments: row.attachments ? [...row.attachments] : []
      }
      this.dialogTitle = '查看记录'
      this.dialogVisible = true
    },
    saveRecord() {
      // 保存到对应的存储
      if (this.recordForm.stage === 'solution') {
        // 保存到方案更进表
        let solutions = JSON.parse(localStorage.getItem('solutions') || '[]')
        const index = solutions.findIndex(s => s.id === this.recordForm.id)
        if (index !== -1) {
          solutions[index] = { ...this.recordForm }
        } else {
          solutions.push({ ...this.recordForm })
        }
        localStorage.setItem('solutions', JSON.stringify(solutions))
      } else {
        // 保存到价格计算表
        let priceCalcs = JSON.parse(localStorage.getItem('priceCalculations') || '[]')
        const index = priceCalcs.findIndex(p => p.id === this.recordForm.id)
        if (index !== -1) {
          priceCalcs[index] = { ...this.recordForm }
        } else {
          priceCalcs.push({ ...this.recordForm })
        }
        localStorage.setItem('priceCalculations', JSON.stringify(priceCalcs))
      }
      
      this.$message.success('保存成功')
      this.loadData()
      this.dialogVisible = false
    },
    uploadFile(row) {
      this.currentUploadRecord = row
      this.fileList = []
      this.uploadDialogVisible = true
    },
    handleFileChange(file, files) {
      this.fileList = files
    },
    confirmUpload() {
      if (this.fileList.length === 0) {
        this.$message.warning('请选择要上传的文件')
        return
      }
      
      // 模拟文件上传
      const newAttachments = this.fileList.map(f => ({
        name: f.name,
        size: f.size,
        url: URL.createObjectURL(f.raw),
        uploadDate: new Date().toISOString().split('T')[0]
      }))
      
      // 更新记录
      if (this.currentUploadRecord.stage === 'solution') {
        let solutions = JSON.parse(localStorage.getItem('solutions') || '[]')
        const index = solutions.findIndex(s => s.id === this.currentUploadRecord.id)
        if (index !== -1) {
          solutions[index].attachments = [...(solutions[index].attachments || []), ...newAttachments]
          localStorage.setItem('solutions', JSON.stringify(solutions))
        }
      } else {
        let priceCalcs = JSON.parse(localStorage.getItem('priceCalculations') || '[]')
        const index = priceCalcs.findIndex(p => p.id === this.currentUploadRecord.id)
        if (index !== -1) {
          priceCalcs[index].attachments = [...(priceCalcs[index].attachments || []), ...newAttachments]
          localStorage.setItem('priceCalculations', JSON.stringify(priceCalcs))
        }
      }
      
      this.$message.success('上传成功')
      this.uploadDialogVisible = false
      this.loadData()
    },
    removeAttachment(index) {
      this.recordForm.attachments.splice(index, 1)
    },
    viewFile(file) {
      this.previewFile = file
      this.previewUrl = file.url || ''
      this.previewDialogVisible = true
    },
    downloadFile() {
      if (this.previewFile) {
        const link = document.createElement('a')
        link.href = this.previewFile.url
        link.download = this.previewFile.name
        link.click()
      }
    },
    formatFileSize(size) {
      if (size < 1024) return size + ' B'
      if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB'
      return (size / (1024 * 1024)).toFixed(2) + ' MB'
    },
    exportRecords() {
      this.$message.success('导出成功')
    },
    handleSizeChange(size) {
      this.pageSize = size
    },
    handleCurrentChange(current) {
      this.currentPage = current
    },
    toggleFullscreen() {
      if (!this.isFullscreen) {
        const elem = document.documentElement
        if (elem.requestFullscreen) {
          elem.requestFullscreen()
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen()
        } else if (elem.mozRequestFullScreen) {
          elem.mozRequestFullScreen()
        } else if (elem.msRequestFullscreen) {
          elem.msRequestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen()
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen()
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen()
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen()
        }
      }
    },
    toggleDialogFullscreen() {
      this.isDialogFullscreen = !this.isDialogFullscreen
    },
    handleFullscreenChange() {
      const isFullscreen = !!(document.fullscreenElement || 
                             document.webkitFullscreenElement || 
                             document.mozFullScreenElement || 
                             document.msFullscreenElement)
      this.isFullscreen = isFullscreen
    }
  }
}
</script>

<style scoped>
.price-approval {
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

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
}

.record-form {
  padding: 20px 0;
}

.attachment-list {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  min-height: 100px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.attachment-item:last-child {
  border-bottom: none;
}

.attachment-icon {
  color: #909399;
  font-size: 20px;
}

.attachment-name {
  flex: 1;
  color: #165DFF;
  cursor: pointer;
}

.attachment-name:hover {
  text-decoration: underline;
}

.attachment-size {
  color: #909399;
  font-size: 12px;
}

.no-attachment {
  color: #909399;
  text-align: center;
  padding: 20px;
}

.upload-demo {
  text-align: center;
}

.upload-demo i {
  color: #909399;
  margin-bottom: 10px;
}

.file-preview {
  height: 500px;
}

.preview-frame {
  width: 100%;
  height: 100%;
  border: none;
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #909399;
}

.preview-placeholder i {
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-bar .el-input,
  .search-bar .el-select {
    width: 100% !important;
  }
}
</style>