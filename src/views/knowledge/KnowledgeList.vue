<template>
  <div class="knowledge-list">
    <el-card shadow="hover" class="mb-4">
      <template #header>
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-bold">知识库</h3>
          <el-button type="primary" @click="addKnowledge">
            <i class="fa fa-plus mr-2"></i>添加知识
          </el-button>
        </div>
      </template>
      
      <div class="knowledge-actions mb-4 flex justify-between">
        <div class="flex items-center">
          <el-input v-model="searchKeyword" placeholder="搜索关键词" style="width: 200px; margin-right: 10px"></el-input>
          <el-select v-model="category" placeholder="选择分类" style="width: 150px; margin-right: 10px">
            <el-option label="全部" value=""></el-option>
            <el-option label="技术文档" value="tech"></el-option>
            <el-option label="流程规范" value="process"></el-option>
            <el-option label="常见问题" value="faq"></el-option>
            <el-option label="其他" value="other"></el-option>
          </el-select>
          <el-button type="primary" @click="searchKnowledge">搜索</el-button>
        </div>
        <div>
          <el-button type="info" @click="exportKnowledge">
            <i class="fa fa-download mr-2"></i>导出
          </el-button>
        </div>
      </div>
      
      <el-table :data="knowledgeList" style="width: 100%">
        <el-table-column prop="title" label="标题" width="300">
          <template #default="scope">
            <div class="flex items-center">
              <i class="fa fa-file-text text-blue-500 mr-2"></i>
              <span class="cursor-pointer hover:text-blue-600" @click="viewKnowledge(scope.row.id)">{{ scope.row.title }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="120">
          <template #default="scope">
            <el-tag :type="getCategoryType(scope.row.category)">{{ getCategoryName(scope.row.category) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="author" label="作者" width="100"></el-table-column>
        <el-table-column prop="createTime" label="创建时间"></el-table-column>
        <el-table-column prop="viewCount" label="浏览量" width="80"></el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button size="small" type="primary" @click="editKnowledge(scope.row.id)">
              <i class="fa fa-edit"></i>
            </el-button>
            <el-button size="small" type="danger" @click="deleteKnowledge(scope.row.id)">
              <i class="fa fa-trash"></i>
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination mt-4">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="total"
          :page-size="10"
          @current-change="handleCurrentChange"
        ></el-pagination>
      </div>
    </el-card>
    
    <!-- 知识详情对话框 -->
    <el-dialog title="知识详情" v-model="detailDialogVisible" width="800px">
      <div class="knowledge-detail">
        <h2 class="text-xl font-bold mb-4">{{ currentKnowledge.title }}</h2>
        <div class="flex justify-between items-center mb-4">
          <div>
            <el-tag :type="getCategoryType(currentKnowledge.category)">{{ getCategoryName(currentKnowledge.category) }}</el-tag>
            <span class="ml-4 text-gray-500">{{ currentKnowledge.author }} · {{ currentKnowledge.createTime }}</span>
          </div>
          <span class="text-gray-500">{{ currentKnowledge.viewCount }} 浏览</span>
        </div>
        <div class="content" v-html="currentKnowledge.content"></div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'KnowledgeList',
  data() {
    return {
      searchKeyword: '',
      category: '',
      total: 20,
      knowledgeList: [
        {
          id: 1,
          title: '项目管理流程规范',
          category: 'process',
          author: '张三',
          createTime: '2026-03-18 14:30',
          viewCount: 128
        },
        {
          id: 2,
          title: '技术方案设计指南',
          category: 'tech',
          author: '李四',
          createTime: '2026-03-17 09:15',
          viewCount: 89
        },
        {
          id: 3,
          title: '常见问题解答',
          category: 'faq',
          author: '王五',
          createTime: '2026-03-16 16:45',
          viewCount: 234
        },
        {
          id: 4,
          title: '设备维护手册',
          category: 'tech',
          author: '赵六',
          createTime: '2026-03-15 11:20',
          viewCount: 67
        }
      ],
      detailDialogVisible: false,
      currentKnowledge: {
        title: '',
        category: '',
        author: '',
        createTime: '',
        viewCount: 0,
        content: ''
      }
    }
  },
  methods: {
    addKnowledge() {
      this.$router.push('/knowledge/add')
    },
    editKnowledge(id) {
      this.$router.push(`/knowledge/edit/${id}`)
    },
    deleteKnowledge(id) {
      this.$confirm('确定要删除此知识吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$message.success('知识已删除')
      })
    },
    searchKnowledge() {
      this.$message.info('搜索功能已触发')
    },
    exportKnowledge() {
      this.$message.success('导出功能已触发')
    },
    viewKnowledge(id) {
      // 模拟获取知识详情
      this.currentKnowledge = {
        id: id,
        title: '项目管理流程规范',
        category: 'process',
        author: '张三',
        createTime: '2026-03-18 14:30',
        viewCount: 128,
        content: '<h3>1. 项目立项流程</h3><p>项目立项需要经过以下步骤：</p><ol><li>提交立项申请</li><li>技术评审</li><li>财务评审</li><li>管理层审批</li></ol><h3>2. 项目实施流程</h3><p>项目实施过程包括：</p><ul><li>需求分析</li><li>方案设计</li><li>开发实施</li><li>测试验收</li></ul>'
      }
      this.detailDialogVisible = true
    },
    getCategoryType(category) {
      const types = {
        tech: 'primary',
        process: 'success',
        faq: 'warning',
        other: 'info'
      }
      return types[category] || 'info'
    },
    getCategoryName(category) {
      const names = {
        tech: '技术文档',
        process: '流程规范',
        faq: '常见问题',
        other: '其他'
      }
      return names[category] || '其他'
    },
    handleCurrentChange(page) {
      console.log('Current page:', page)
    }
  }
}
</script>

<style scoped>
.knowledge-list {
  padding: 20px;
}

.pagination {
  display: flex;
  justify-content: center;
}

.knowledge-detail {
  line-height: 1.6;
}

.content {
  margin-top: 20px;
}

.content h3 {
  margin: 20px 0 10px 0;
  color: #333;
}

.content p {
  margin-bottom: 10px;
}

.content ol, .content ul {
  margin-left: 20px;
  margin-bottom: 10px;
}

.content li {
  margin-bottom: 5px;
}
</style>