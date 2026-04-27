<template>
  <div class="file-dashboard">
    <el-card shadow="hover" class="mb-4">
      <template #header>
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-bold">文件管理</h3>
          <el-button type="primary" @click="uploadFile">
            <i class="fa fa-upload mr-2"></i>上传文件
          </el-button>
        </div>
      </template>
      
      <div class="file-stats grid grid-cols-3 gap-4 mb-6">
        <div class="stat-card p-4 bg-blue-50 rounded-lg">
          <div class="text-2xl font-bold text-blue-600">{{ totalFiles }}</div>
          <div class="text-gray-600">总文件数</div>
        </div>
        <div class="stat-card p-4 bg-green-50 rounded-lg">
          <div class="text-2xl font-bold text-green-600">{{ totalProjects }}</div>
          <div class="text-gray-600">项目数</div>
        </div>
        <div class="stat-card p-4 bg-purple-50 rounded-lg">
          <div class="text-2xl font-bold text-purple-600">{{ totalStorage }} MB</div>
          <div class="text-gray-600">存储使用</div>
        </div>
      </div>
      
      <el-tabs v-model="activeTab">
        <el-tab-pane label="最近文件" name="recent">
          <el-table :data="recentFiles" style="width: 100%">
            <el-table-column prop="name" label="文件名" width="300">
              <template #default="scope">
                <div class="flex items-center">
                  <i class="fa fa-file text-blue-500 mr-2"></i>
                  <span>{{ scope.row.name }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="project" label="所属项目" width="200"></el-table-column>
            <el-table-column prop="size" label="大小" width="100">
              <template #default="scope">
                {{ (scope.row.size / 1024).toFixed(2) }} KB
              </template>
            </el-table-column>
            <el-table-column prop="uploadTime" label="上传时间"></el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="scope">
                <el-button size="small" type="primary" @click="downloadFile(scope.row.id)">
                  <i class="fa fa-download"></i>
                </el-button>
                <el-button size="small" type="danger" @click="deleteFile(scope.row.id)">
                  <i class="fa fa-trash"></i>
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        
        <el-tab-pane label="项目文件" name="projects">
          <el-table :data="projects" style="width: 100%">
            <el-table-column prop="name" label="项目名称" width="300"></el-table-column>
            <el-table-column prop="fileCount" label="文件数" width="100"></el-table-column>
            <el-table-column prop="lastUpdated" label="最后更新"></el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="scope">
                <el-button size="small" type="primary" @click="viewProjectFiles(scope.row.id)">
                  查看文件
                </el-button>
                <el-button size="small" type="success" @click="packageProjectFiles(scope.row.id)">
                  一键打包
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    
    <!-- 上传文件对话框 -->
    <el-dialog title="上传文件" v-model="uploadDialogVisible" width="500px">
      <el-form :model="uploadForm" label-width="80px">
        <el-form-item label="项目">
          <el-select v-model="uploadForm.projectId" placeholder="选择项目" style="width: 100%">
            <el-option v-for="project in projects" :key="project.id" :label="project.name" :value="project.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="文件">
          <el-upload
            class="upload-demo"
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :multiple="true"
          >
            <el-button size="small" type="primary">选择文件</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitUpload">上传</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'FileDashboard',
  data() {
    return {
      activeTab: 'recent',
      totalFiles: 128,
      totalProjects: 24,
      totalStorage: 156,
      recentFiles: [
        { id: 1, name: '项目需求文档.docx', project: 'A项目', size: 102400, uploadTime: '2026-03-18 14:30' },
        { id: 2, name: '技术方案.pdf', project: 'B项目', size: 204800, uploadTime: '2026-03-17 09:15' },
        { id: 3, name: '采购清单.xlsx', project: 'C项目', size: 51200, uploadTime: '2026-03-16 16:45' },
        { id: 4, name: '测试报告.txt', project: 'A项目', size: 10240, uploadTime: '2026-03-15 11:20' }
      ],
      projects: [
        { id: 1, name: 'A项目', fileCount: 24, lastUpdated: '2026-03-18 14:30' },
        { id: 2, name: 'B项目', fileCount: 18, lastUpdated: '2026-03-17 09:15' },
        { id: 3, name: 'C项目', fileCount: 32, lastUpdated: '2026-03-16 16:45' },
        { id: 4, name: 'D项目', fileCount: 15, lastUpdated: '2026-03-15 11:20' }
      ],
      uploadDialogVisible: false,
      uploadForm: {
        projectId: '',
        files: []
      }
    }
  },
  methods: {
    uploadFile() {
      this.uploadDialogVisible = true
    },
    handleFileChange(file, fileList) {
      this.uploadForm.files = fileList
    },
    submitUpload() {
      // 模拟上传
      this.$message.success('文件上传成功')
      this.uploadDialogVisible = false
    },
    downloadFile(id) {
      this.$message.success('文件下载中...')
    },
    deleteFile(id) {
      this.$confirm('确定要删除此文件吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$message.success('文件已删除')
      })
    },
    viewProjectFiles(projectId) {
      this.$router.push(`/file/project/${projectId}`)
    },
    packageProjectFiles(projectId) {
      this.$router.push(`/file/package/${projectId}`)
    }
  }
}
</script>

<style scoped>
.file-dashboard {
  padding: 20px;
}

.stat-card {
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>