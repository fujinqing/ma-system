<template>
  <div class="admin-announcements-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>公告通知</span>
          <el-button type="primary" @click="handleAdd">发布公告</el-button>
        </div>
      </template>

      <div class="search-bar">
        <el-input v-model="searchKeyword" placeholder="搜索标题、内容" style="width: 250px" clearable @change="fetchAnnouncements" />
        <el-select v-model="searchCategory" placeholder="公告类别" clearable style="width: 130px; margin-left: 10px" @change="fetchAnnouncements">
          <el-option label="公司通知" value="公司通知" />
          <el-option label="政策" value="政策" />
          <el-option label="活动" value="活动" />
          <el-option label="安全" value="安全" />
        </el-select>
        <el-select v-model="searchPriority" placeholder="优先级" clearable style="width: 100px; margin-left: 10px" @change="fetchAnnouncements">
          <el-option label="紧急" value="urgent" />
          <el-option label="普通" value="normal" />
          <el-option label="低" value="low" />
        </el-select>
        <el-button style="margin-left: 10px" @click="fetchAnnouncements">搜索</el-button>
      </div>

      <el-table :data="announcementList" v-loading="loading" stripe>
        <el-table-column prop="announcement_code" label="公告编号" width="140" />
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column prop="category" label="类别" width="100" />
        <el-table-column prop="priority" label="优先级" width="80">
          <template #default="{ row }">
            <el-tag :type="row.priority === 'urgent' ? 'danger' : row.priority === 'normal' ? 'primary' : 'info'">
              {{ row.priority === 'urgent' ? '紧急' : row.priority === 'normal' ? '普通' : '低' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="publisher" label="发布人" width="100" />
        <el-table-column prop="publish_date" label="发布日期" width="160">
          <template #default="{ row }">
            {{ row.publish_date ? new Date(row.publish_date).toLocaleString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="expiry_date" label="到期日期" width="100" />
        <el-table-column prop="views_count" label="浏览次数" width="80" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">查看</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 20px"
        @current-change="fetchAnnouncements"
        @size-change="fetchAnnouncements"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑公告' : '发布公告'" width="700px">
      <el-form :model="announcementForm" label-width="100px">
        <el-form-item label="标题" required>
          <el-input v-model="announcementForm.title" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="公告类别">
              <el-select v-model="announcementForm.category" style="width: 100%">
                <el-option label="公司通知" value="公司通知" />
                <el-option label="政策" value="政策" />
                <el-option label="活动" value="活动" />
                <el-option label="安全" value="安全" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级">
              <el-select v-model="announcementForm.priority" style="width: 100%">
                <el-option label="紧急" value="urgent" />
                <el-option label="普通" value="normal" />
                <el-option label="低" value="low" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="发布日期">
              <el-date-picker v-model="announcementForm.publish_date" type="datetime" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="到期日期">
              <el-date-picker v-model="announcementForm.expiry_date" type="date" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="内容">
          <el-input v-model="announcementForm.content" type="textarea" :rows="6" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="announcementForm.remarks" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">发布</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="viewDialogVisible" title="公告详情" width="700px">
      <div class="announcement-view" v-if="currentAnnouncement">
        <h2>{{ currentAnnouncement.title }}</h2>
        <div class="meta">
          <span>编号：{{ currentAnnouncement.announcement_code }}</span>
          <span>类别：{{ currentAnnouncement.category }}</span>
          <span>发布人：{{ currentAnnouncement.publisher }}</span>
          <span>发布日期：{{ currentAnnouncement.publish_date ? new Date(currentAnnouncement.publish_date).toLocaleString() : '-' }}</span>
        </div>
        <el-divider />
        <div class="content">{{ currentAnnouncement.content }}</div>
      </div>
      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/api'

const announcementList = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const searchKeyword = ref('')
const searchCategory = ref('')
const searchPriority = ref('')

const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const isEdit = ref(false)
const currentAnnouncement = ref(null)

const announcementForm = reactive({
  id: null,
  announcement_code: '',
  title: '',
  content: '',
  category: '公司通知',
  priority: 'normal',
  publish_date: new Date(),
  expiry_date: '',
  remarks: ''
})

const fetchAnnouncements = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      keyword: searchKeyword.value,
      category: searchCategory.value,
      priority: searchPriority.value
    }
    const res = await request.get('/admin/announcements', { params })
    if (res.success) {
      announcementList.value = res.data.list
      total.value = res.data.pagination.total
    }
  } catch (error) {
    ElMessage.error('获取公告列表失败')
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  isEdit.value = false
  announcementForm.id = null
  announcementForm.title = ''
  announcementForm.content = ''
  announcementForm.category = '公司通知'
  announcementForm.priority = 'normal'
  announcementForm.publish_date = new Date()
  announcementForm.expiry_date = ''
  announcementForm.remarks = ''
  dialogVisible.value = true
}

const handleView = (row) => {
  currentAnnouncement.value = row
  viewDialogVisible.value = true
}

const handleSubmit = async () => {
  if (!announcementForm.title) {
    ElMessage.warning('请填写标题')
    return
  }
  try {
    await request.post('/admin/announcements', announcementForm)
    ElMessage.success('发布成功')
    dialogVisible.value = false
    fetchAnnouncements()
  } catch (error) {
    ElMessage.error('发布失败')
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除公告 ${row.title} 吗？`, '提示', {
      type: 'warning'
    })
    await request.delete(`/admin/announcements/${row.id}`)
    ElMessage.success('删除成功')
    fetchAnnouncements()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  fetchAnnouncements()
})
</script>

<style scoped>
.admin-announcements-container {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.search-bar {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}
.announcement-view h2 {
  margin-bottom: 15px;
}
.announcement-view .meta {
  display: flex;
  gap: 20px;
  color: #666;
  font-size: 14px;
}
.announcement-view .content {
  line-height: 1.8;
  white-space: pre-wrap;
}
</style>