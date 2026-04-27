<template>
  <div class="project-files">
    <el-card shadow="hover" class="mb-4">
      <template #header>
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-bold">项目文件管理 - {{ projectName }}</h3>
          <el-button type="primary" @click="uploadFile">
            <i class="fa fa-upload mr-2"></i>上传文件
          </el-button>
        </div>
      </template>
      
      <div class="file-actions mb-4 flex justify-between">
        <div class="flex items-center">
          <el-input v-model="searchKeyword" placeholder="搜索文件名" style="width: 200px; margin-right: 10px"></el-input>
          <el-button type="primary" @click="searchFiles">搜索</el-button>
        </div>
        <div>
          <el-button type="success" @click="packageFiles">
            <i class="fa fa-file-archive mr-2"></i>一键打包
          </el-button>
        </div>
      </div>
      
      <div class="file-tree mb-6">
        <el-tree
          :data="fileTree"
          :props="treeProps"
          node-key="id"
          default-expand-all
          @node-click="handleNodeClick"
        >
          <template #default="{ node, data }">
            <div class="flex items-center justify-between w-full">
              <div class="flex items-center">
                <i v-if="data.type === 'folder'" class="fa fa-folder text-blue-500 mr-2"></i>
                <i v-else class="fa fa-file text-gray-500 mr-2"></i>
                <span>{{ data.name }}</span>
              </div>
              <div class="file-actions">
                <el-button v-if="data.type === 'file'" size="small" @click="downloadFile(data.id)">
                  <i class="fa fa-download"></i>
                </el-button>
                <el-button v-if="data.type === 'file'" size="small" type="danger" @click="deleteFile(data.id)">
                  <i class="fa fa-trash"></i>
                </el-button>
              </div>
            </div>
          </template>
        </el-tree>
      </div>
      
      <el-table :data="fileList" style="width: 100%">
        <el-table-column prop="name" label="文件名" width="300">
          <template #default="scope">
            <div class="flex items-center">
              <i class="fa fa-file text-blue-500 mr-2"></i>
              <span>{{ scope.row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路径"></el-table-column>
        <el-table-column prop="size" label="大小" width="100">
          <template #default="scope">
            {{ (scope.row.size / 1024).toFixed(2) }} KB
          </template>
        </el-table-column>
        <el-table-column prop="uploadTime" label="上传时间"></el-table-column>
        <el-table-column prop="uploader" label="上传人" width="120"></el-table-column>
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
    </el-card>
    
    <!-- 上传文件对话框 -->
    <el-dialog title="上传文件" v-model="uploadDialogVisible" width="500px">
      <el-form :model="uploadForm" label-width="80px">
        <el-form-item label="目标文件夹">
          <el-select v-model="uploadForm.folderId" placeholder="选择文件夹" style="width: 100%">
            <el-option v-for="folder in folders" :key="folder.id" :label="folder.path" :value="folder.id"></el-option>
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
  name: 'ProjectFiles',
  data() {
    return {
      projectId: this.$route.params.projectId || 1,
      projectName: 'A项目',
      searchKeyword: '',
      fileList: [
        { id: 1, name: '需求文档.docx', path: '/A项目/文档/需求', size: 102400, uploadTime: '2026-03-18 14:30', uploader: '张三' },
        { id: 2, name: '技术方案.pdf', path: '/A项目/文档/技术', size: 204800, uploadTime: '2026-03-17 09:15', uploader: '李四' },
        { id: 3, name: '采购清单.xlsx', path: '/A项目/文档/采购', size: 51200, uploadTime: '2026-03-16 16:45', uploader: '王五' },
        { id: 4, name: '测试报告.txt', path: '/A项目/文档/测试', size: 10240, uploadTime: '2026-03-15 11:20', uploader: '赵六' }
      ],
      fileTree: [
        {
          id: 1,
          name: 'A项目',
          type: 'folder',
          children: [
            {
              id: 2,
              name: '文档',
              type: 'folder',
              children: [
                {
                  id: 3,
                  name: '需求',
                  type: 'folder',
                  children: [
                    { id: 4, name: '需求文档.docx', type: 'file' }
                  ]
                },
                {
                  id: 5,
                  name: '技术',
                  type: 'folder',
                  children: [
                    { id: 6, name: '技术方案.pdf', type: 'file' }
                  ]
                },
                {
                  id: 7,
                  name: '采购',
                  type: 'folder',
                  children: [
                    { id: 8, name: '采购清单.xlsx', type: 'file' }
                  ]
                },
                {
                  id: 9,
                  name: '测试',
                  type: 'folder',
                  children: [
                    { id: 10, name: '测试报告.txt', type: 'file' }
                  ]
                }
              ]
            },
            {
              id: 11,
              name: '设计',
              type: 'folder',
              children: [
                { id: 12, name: 'CAD图纸.dwg', type: 'file' },
                { id: 13, name: '3D模型.stp', type: 'file' }
              ]
            }
          ]
        }
      ],
      treeProps: {
        children: 'children',
        label: 'name'
      },
      folders: [
        { id: 3, path: '/A项目/文档/需求' },
        { id: 5, path: '/A项目/文档/技术' },
        { id: 7, path: '/A项目/文档/采购' },
        { id: 9, path: '/A项目/文档/测试' },
        { id: 11, path: '/A项目/设计' }
      ],
      uploadDialogVisible: false,
      uploadForm: {
        folderId: '',
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
    searchFiles() {
      this.$message.info('搜索功能已触发')
    },
    packageFiles() {
      this.$router.push(`/file/package/${this.projectId}`)
    },
    handleNodeClick(data) {
      if (data.type === 'file') {
        this.downloadFile(data.id)
      }
    }
  }
}
</script>

<style scoped>
.project-files {
  padding: 20px;
}

.file-actions {
  margin-top: 10px;
}

.file-tree {
  border: 1px solid #eaeaea;
  border-radius: 4px;
  padding: 10px;
  max-height: 400px;
  overflow-y: auto;
}
</style>