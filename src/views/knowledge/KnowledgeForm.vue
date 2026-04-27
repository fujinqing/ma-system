<template>
  <div class="knowledge-form">
    <el-card shadow="hover">
      <template #header>
        <h3 class="text-lg font-bold">{{ isEdit ? '编辑知识' : '添加知识' }}</h3>
      </template>
      
      <el-form :model="form" :rules="rules" ref="form" label-width="100px" class="mt-4">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="输入知识标题" style="width: 500px"></el-input>
        </el-form-item>
        
        <el-form-item label="分类" prop="category">
          <el-select v-model="form.category" placeholder="选择分类" style="width: 200px">
            <el-option label="技术文档" value="tech"></el-option>
            <el-option label="流程规范" value="process"></el-option>
            <el-option label="常见问题" value="faq"></el-option>
            <el-option label="其他" value="other"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="标签" prop="tags">
          <el-tag v-for="tag in form.tags" :key="tag" closable @close="removeTag(tag)" class="mr-2 mb-2">
            {{ tag }}
          </el-tag>
          <el-input
            v-model="inputTag"
            placeholder="输入标签后按回车添加"
            @keyup.enter="addTag"
            style="width: 300px; margin-top: 10px"
          ></el-input>
        </el-form-item>
        
        <el-form-item label="内容" prop="content">
          <div class="editor-container">
            <el-button type="primary" @click="insertImage" class="mb-2">
              <i class="fa fa-image mr-2"></i>插入图片
            </el-button>
            <el-button type="info" @click="insertLink" class="mb-2 ml-2">
              <i class="fa fa-link mr-2"></i>插入链接
            </el-button>
            <textarea
              v-model="form.content"
              placeholder="输入知识内容（支持HTML格式）"
              rows="10"
              style="width: 100%; padding: 10px; border: 1px solid #dcdfe6; border-radius: 4px; resize: vertical"
            ></textarea>
          </div>
        </el-form-item>
        
        <el-form-item label="附件">
          <el-upload
            class="upload-demo"
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :multiple="true"
            list-type="picture"
          >
            <el-button size="small" type="primary">选择附件</el-button>
          </el-upload>
        </el-form-item>
        
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio label="published">已发布</el-radio>
            <el-radio label="draft">草稿</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitForm">提交</el-button>
          <el-button @click="resetForm">重置</el-button>
          <el-button @click="cancel">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 插入图片对话框 -->
    <el-dialog title="插入图片" v-model="imageDialogVisible" width="400px">
      <el-form :model="imageForm" label-width="80px">
        <el-form-item label="图片URL">
          <el-input v-model="imageForm.url" placeholder="输入图片URL"></el-input>
        </el-form-item>
        <el-form-item label="图片描述">
          <el-input v-model="imageForm.alt" placeholder="输入图片描述"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="imageDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmInsertImage">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 插入链接对话框 -->
    <el-dialog title="插入链接" v-model="linkDialogVisible" width="400px">
      <el-form :model="linkForm" label-width="80px">
        <el-form-item label="链接文本">
          <el-input v-model="linkForm.text" placeholder="输入链接文本"></el-input>
        </el-form-item>
        <el-form-item label="链接URL">
          <el-input v-model="linkForm.url" placeholder="输入链接URL"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="linkDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmInsertLink">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'KnowledgeForm',
  data() {
    return {
      isEdit: !!this.$route.params.id,
      form: {
        title: '',
        category: 'tech',
        tags: [],
        content: '',
        status: 'published',
        attachments: []
      },
      inputTag: '',
      imageDialogVisible: false,
      linkDialogVisible: false,
      imageForm: {
        url: '',
        alt: ''
      },
      linkForm: {
        text: '',
        url: ''
      },
      rules: {
        title: [
          { required: true, message: '请输入标题', trigger: 'blur' },
          { min: 2, max: 100, message: '标题长度在 2 到 100 个字符', trigger: 'blur' }
        ],
        category: [
          { required: true, message: '请选择分类', trigger: 'change' }
        ],
        content: [
          { required: true, message: '请输入内容', trigger: 'blur' }
        ]
      }
    }
  },
  mounted() {
    if (this.isEdit) {
      this.loadKnowledge()
    }
  },
  methods: {
    loadKnowledge() {
      // 模拟加载知识数据
      this.form = {
        title: '项目管理流程规范',
        category: 'process',
        tags: ['项目管理', '流程', '规范'],
        content: '<h3>1. 项目立项流程</h3><p>项目立项需要经过以下步骤：</p><ol><li>提交立项申请</li><li>技术评审</li><li>财务评审</li><li>管理层审批</li></ol>',
        status: 'published',
        attachments: []
      }
    },
    addTag() {
      if (this.inputTag && !this.form.tags.includes(this.inputTag)) {
        this.form.tags.push(this.inputTag)
        this.inputTag = ''
      }
    },
    removeTag(tag) {
      this.form.tags = this.form.tags.filter(t => t !== tag)
    },
    insertImage() {
      this.imageDialogVisible = true
    },
    insertLink() {
      this.linkDialogVisible = true
    },
    confirmInsertImage() {
      const imageHtml = `<img src="${this.imageForm.url}" alt="${this.imageForm.alt}" style="max-width: 100%;">`
      this.form.content += imageHtml
      this.imageDialogVisible = false
      this.imageForm = { url: '', alt: '' }
    },
    confirmInsertLink() {
      const linkHtml = `<a href="${this.linkForm.url}" target="_blank">${this.linkForm.text}</a>`
      this.form.content += linkHtml
      this.linkDialogVisible = false
      this.linkForm = { text: '', url: '' }
    },
    handleFileChange(file, fileList) {
      this.form.attachments = fileList
    },
    submitForm() {
      this.$refs.form.validate((valid) => {
        if (valid) {
          // 模拟提交
          this.$message.success(this.isEdit ? '知识更新成功' : '知识添加成功')
          this.$router.push('/knowledge/list')
        } else {
          return false
        }
      })
    },
    resetForm() {
      this.$refs.form.resetFields()
      this.form.tags = []
      this.form.attachments = []
    },
    cancel() {
      this.$router.push('/knowledge/list')
    }
  }
}
</script>

<style scoped>
.knowledge-form {
  padding: 20px;
}

.editor-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
  background: #f9f9f9;
}

.upload-demo {
  margin-top: 10px;
}
</style>