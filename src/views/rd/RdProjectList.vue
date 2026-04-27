<template>
  <div class="rd-project-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>研发项目管理</span>
          <el-button type="primary" @click="handleAdd">新建项目</el-button>
        </div>
      </template>

      <div class="search-bar">
        <el-input v-model="searchKeyword" placeholder="搜索项目名称、编号" style="width: 250px" clearable @change="fetchProjects" />
        <el-select v-model="searchType" placeholder="项目类型" clearable style="width: 160px; margin-left: 10px" @change="fetchProjects">
          <el-option label="单机设备研发" value="single_machine" />
          <el-option label="自动化系统研发" value="automation_system" />
        </el-select>
        <el-select v-model="searchStatus" placeholder="项目状态" clearable style="width: 130px; margin-left: 10px" @change="fetchProjects">
          <el-option label="规划中" value="planning" />
          <el-option label="进行中" value="in-progress" />
          <el-option label="已暂停" value="paused" />
          <el-option label="已完成" value="completed" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
        <el-button style="margin-left: 10px" @click="fetchProjects">搜索</el-button>
      </div>

      <el-table :data="projectList" v-loading="loading" stripe>
        <el-table-column prop="project_code" label="项目编号" width="140" />
        <el-table-column prop="project_name" label="项目名称" min-width="200" />
        <el-table-column prop="project_type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="row.project_type === 'single_machine' ? 'success' : 'primary'">
              {{ row.project_type === 'single_machine' ? '单机设备' : '自动化系统' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="类别" width="100" />
        <el-table-column prop="priority" label="优先级" width="80">
          <template #default="{ row }">
            <el-tag :type="row.priority === 'urgent' ? 'danger' : row.priority === 'high' ? 'warning' : 'info'">
              {{ row.priority === 'urgent' ? '紧急' : row.priority === 'high' ? '高' : '普通' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="progress_percent" label="进度" width="120">
          <template #default="{ row }">
            <el-progress :percentage="row.progress_percent || 0" :color="getProgressColor(row.progress_percent)" />
          </template>
        </el-table-column>
        <el-table-column prop="budget" label="预算" width="100">
          <template #default="{ row }">
            {{ row.budget ? `¥${row.budget.toLocaleString()}` : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="project_manager" label="项目经理" width="100" />
        <el-table-column prop="start_date" label="开始日期" width="100" />
        <el-table-column prop="planned_end_date" label="计划结束" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
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
        @current-change="fetchProjects"
        @size-change="fetchProjects"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑项目' : '新建项目'" width="850px">
      <el-form :model="projectForm" label-width="110px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="项目编号">
              <el-input v-model="projectForm.project_code" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目名称" required>
              <el-input v-model="projectForm.project_name" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="项目类型" required>
              <el-select v-model="projectForm.project_type" style="width: 100%">
                <el-option label="单机设备研发" value="single_machine" />
                <el-option label="自动化系统研发" value="automation_system" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目类别">
              <el-input v-model="projectForm.category" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="优先级">
              <el-select v-model="projectForm.priority" style="width: 100%">
                <el-option label="紧急" value="urgent" />
                <el-option label="高" value="high" />
                <el-option label="普通" value="normal" />
                <el-option label="低" value="low" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预算">
              <el-input-number v-model="projectForm.budget" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="项目经理">
              <el-input v-model="projectForm.project_manager" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="负责部门">
              <el-input v-model="projectForm.department" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始日期">
              <el-date-picker v-model="projectForm.start_date" type="date" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计划结束日期">
              <el-date-picker v-model="projectForm.planned_end_date" type="date" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="风险等级">
              <el-select v-model="projectForm.risk_level" style="width: 100%">
                <el-option label="高" value="high" />
                <el-option label="中" value="medium" />
                <el-option label="低" value="low" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="projectForm.status" style="width: 100%">
                <el-option label="规划中" value="planning" />
                <el-option label="进行中" value="in-progress" />
                <el-option label="已暂停" value="paused" />
                <el-option label="已完成" value="completed" />
                <el-option label="已取消" value="cancelled" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="项目描述">
          <el-input v-model="projectForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="目标规格">
          <el-input v-model="projectForm.target_specs" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="projectForm.remarks" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/api'

const projectList = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const searchKeyword = ref('')
const searchType = ref('')
const searchStatus = ref('')

const dialogVisible = ref(false)
const isEdit = ref(false)

const projectForm = reactive({
  id: null,
  project_code: '',
  project_name: '',
  project_type: 'single_machine',
  category: '',
  customer_code: '',
  priority: 'normal',
  budget: null,
  start_date: '',
  planned_end_date: '',
  project_manager: '',
  department: '',
  location: '',
  description: '',
  target_specs: '',
  risk_level: 'medium',
  status: 'planning',
  remarks: ''
})

const getProgressColor = (percent) => {
  if (percent >= 100) return '#67C23A'
  if (percent >= 70) return '#409EFF'
  if (percent >= 30) return '#E6A23C'
  return '#909399'
}

const getStatusType = (status) => {
  const map = {
    'planning': 'info',
    'in-progress': 'primary',
    'paused': 'warning',
    'completed': 'success',
    'cancelled': 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    'planning': '规划中',
    'in-progress': '进行中',
    'paused': '已暂停',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return map[status] || status
}

const fetchProjects = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      keyword: searchKeyword.value,
      project_type: searchType.value,
      status: searchStatus.value
    }
    const res = await request.get('/rd/projects', { params })
    if (res.success) {
      projectList.value = res.data.list
      total.value = res.data.pagination.total
    }
  } catch (error) {
    ElMessage.error('获取研发项目列表失败')
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  isEdit.value = false
  Object.keys(projectForm).forEach(key => {
    if (key === 'project_type') projectForm[key] = 'single_machine'
    else if (key === 'priority') projectForm[key] = 'normal'
    else if (key === 'risk_level') projectForm[key] = 'medium'
    else if (key === 'status') projectForm[key] = 'planning'
    else if (key === 'budget') projectForm[key] = null
    else projectForm[key] = ''
  })
  projectForm.id = null
  projectForm.project_code = '系统自动生成'
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(projectForm, row)
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!projectForm.project_name || !projectForm.project_type) {
    ElMessage.warning('请填写必填项')
    return
  }
  try {
    if (isEdit.value) {
      await request.put(`/rd/projects/${projectForm.id}`, projectForm)
      ElMessage.success('更新成功')
    } else {
      await request.post('/rd/projects', projectForm)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchProjects()
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除项目 ${row.project_name} 吗？`, '提示', {
      type: 'warning'
    })
    await request.delete(`/rd/projects/${row.id}`)
    ElMessage.success('删除成功')
    fetchProjects()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  fetchProjects()
})
</script>

<style scoped>
.rd-project-container {
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
</style>