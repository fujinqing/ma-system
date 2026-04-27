<template>
  <div class="file-package">
    <el-card shadow="hover" class="mb-4">
      <template #header>
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-bold">文件打包 - {{ projectName }}</h3>
        </div>
      </template>
      
      <div class="package-info mb-6">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="项目名称">{{ projectName }}</el-descriptions-item>
          <el-descriptions-item label="文件数量">{{ selectedFiles.length }}个文件</el-descriptions-item>
          <el-descriptions-item label="预计大小">{{ totalSize }} MB</el-descriptions-item>
          <el-descriptions-item label="打包格式">{{ packageFormat }}</el-descriptions-item>
        </el-descriptions>
      </div>
      
      <div class="file-selection mb-6">
        <h4 class="font-bold mb-3">选择文件</h4>
        <el-tree
          :data="fileTree"
          :props="treeProps"
          node-key="id"
          show-checkbox
          default-expand-all
          @check-change="handleCheckChange"
        >
          <template #default="{ node, data }">
            <div class="flex items-center">
              <i v-if="data.type === 'folder'" class="fa fa-folder text-blue-500 mr-2"></i>
              <i v-else class="fa fa-file text-gray-500 mr-2"></i>
              <span>{{ data.name }}</span>
              <span v-if="data.type === 'file'" class="text-xs text-gray-500 ml-2">{{ (data.size / 1024).toFixed(2) }} KB</span>
            </div>
          </template>
        </el-tree>
      </div>
      
      <div class="package-options mb-6">
        <h4 class="font-bold mb-3">打包选项</h4>
        <el-form :model="packageOptions" label-width="120px">
          <el-form-item label="打包格式">
            <el-radio-group v-model="packageFormat">
              <el-radio label="zip">ZIP</el-radio>
              <el-radio label="rar">RAR</el-radio>
              <el-radio label="7z">7Z</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="打包名称">
            <el-input v-model="packageOptions.name" placeholder="输入打包文件名"></el-input>
          </el-form-item>
          <el-form-item label="包含子文件夹">
            <el-checkbox v-model="packageOptions.includeSubfolders"></el-checkbox>
          </el-form-item>
          <el-form-item label="添加时间戳">
            <el-checkbox v-model="packageOptions.addTimestamp"></el-checkbox>
          </el-form-item>
        </el-form>
      </div>
      
      <div class="package-actions flex justify-center">
        <el-button type="primary" size="large" @click="startPackage" :disabled="selectedFiles.length === 0">
          <i class="fa fa-file-archive mr-2"></i>开始打包
        </el-button>
        <el-button type="info" size="large" @click="previewPackage" :disabled="selectedFiles.length === 0" class="ml-4">
          <i class="fa fa-eye mr-2"></i>预览打包内容
        </el-button>
      </div>
    </el-card>
    
    <!-- 打包进度对话框 -->
    <el-dialog title="打包进度" v-model="progressDialogVisible" width="400px">
      <div class="text-center py-4">
        <el-progress :percentage="progress" :stroke-width="15"></el-progress>
        <div class="mt-4">{{ progressText }}</div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelPackage" :disabled="progress < 100">取消</el-button>
          <el-button type="primary" @click="downloadPackage" :disabled="progress < 100">下载</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 预览对话框 -->
    <el-dialog title="打包内容预览" v-model="previewDialogVisible" width="600px">
      <el-table :data="selectedFiles" style="width: 100%">
        <el-table-column prop="name" label="文件名" width="300"></el-table-column>
        <el-table-column prop="path" label="路径"></el-table-column>
        <el-table-column prop="size" label="大小" width="100">
          <template #default="scope">
            {{ (scope.row.size / 1024).toFixed(2) }} KB
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="previewDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'FilePackage',
  data() {
    return {
      projectId: this.$route.params.projectId || 1,
      projectName: 'A项目',
      packageFormat: 'zip',
      packageOptions: {
        name: 'A项目文件包',
        includeSubfolders: true,
        addTimestamp: true
      },
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
                    { id: 4, name: '需求文档.docx', type: 'file', size: 102400 }
                  ]
                },
                {
                  id: 5,
                  name: '技术',
                  type: 'folder',
                  children: [
                    { id: 6, name: '技术方案.pdf', type: 'file', size: 204800 }
                  ]
                },
                {
                  id: 7,
                  name: '采购',
                  type: 'folder',
                  children: [
                    { id: 8, name: '采购清单.xlsx', type: 'file', size: 51200 }
                  ]
                },
                {
                  id: 9,
                  name: '测试',
                  type: 'folder',
                  children: [
                    { id: 10, name: '测试报告.txt', type: 'file', size: 10240 }
                  ]
                }
              ]
            },
            {
              id: 11,
              name: '设计',
              type: 'folder',
              children: [
                { id: 12, name: 'CAD图纸.dwg', type: 'file', size: 512000 },
                { id: 13, name: '3D模型.stp', type: 'file', size: 1024000 }
              ]
            }
          ]
        }
      ],
      treeProps: {
        children: 'children',
        label: 'name'
      },
      selectedFiles: [],
      totalSize: 1.8,
      progressDialogVisible: false,
      previewDialogVisible: false,
      progress: 0,
      progressText: '准备打包...'
    }
  },
  methods: {
    handleCheckChange(data, checked) {
      if (data.type === 'file') {
        if (checked) {
          this.selectedFiles.push(data)
        } else {
          this.selectedFiles = this.selectedFiles.filter(file => file.id !== data.id)
        }
      }
      this.calculateTotalSize()
    },
    calculateTotalSize() {
      let total = 0
      this.selectedFiles.forEach(file => {
        total += file.size
      })
      this.totalSize = (total / (1024 * 1024)).toFixed(1)
    },
    startPackage() {
      this.progressDialogVisible = true
      this.progress = 0
      this.progressText = '准备打包...'
      
      // 模拟打包进度
      const timer = setInterval(() => {
        this.progress += 10
        if (this.progress < 30) {
          this.progressText = '正在收集文件...'
        } else if (this.progress < 70) {
          this.progressText = '正在压缩文件...'
        } else if (this.progress < 90) {
          this.progressText = '正在生成包文件...'
        } else {
          this.progressText = '打包完成！'
        }
        
        if (this.progress >= 100) {
          clearInterval(timer)
        }
      }, 500)
    },
    cancelPackage() {
      this.progressDialogVisible = false
      this.$message.info('打包已取消')
    },
    downloadPackage() {
      this.$message.success('文件包下载中...')
      this.progressDialogVisible = false
    },
    previewPackage() {
      this.previewDialogVisible = true
    }
  }
}
</script>

<style scoped>
.file-package {
  padding: 20px;
}

.file-selection {
  border: 1px solid #eaeaea;
  border-radius: 4px;
  padding: 10px;
  max-height: 400px;
  overflow-y: auto;
}

.package-actions {
  margin-top: 20px;
}
</style>