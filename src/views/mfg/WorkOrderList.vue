<template>
  <div class="mfg-workorder-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>生产工单</span>
          <el-button type="primary" @click="handleAdd">新建工单</el-button>
        </div>
      </template>

      <div class="search-bar">
        <el-input v-model="searchKeyword" placeholder="搜索工单号、名称、产品" style="width: 280px" clearable @change="fetchWorkOrders" />
        <el-select v-model="searchStatus" placeholder="工单状态" clearable style="width: 130px; margin-left: 10px" @change="fetchWorkOrders">
          <el-option label="计划中" value="planned" />
          <el-option label="生产中" value="in-progress" />
          <el-option label="已暂停" value="paused" />
          <el-option label="已完成" value="completed" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
        <el-select v-model="searchPriority" placeholder="优先级" clearable style="width: 100px; margin-left: 10px" @change="fetchWorkOrders">
          <el-option label="紧急" value="urgent" />
          <el-option label="高" value="high" />
          <el-option label="普通" value="normal" />
          <el-option label="低" value="low" />
        </el-select>
        <el-button style="margin-left: 10px" @click="fetchWorkOrders">搜索</el-button>
      </div>

      <el-table :data="workOrderList" v-loading="loading" stripe>
        <el-table-column prop="work_order_code" label="工单编号" width="140" />
        <el-table-column prop="order_name" label="工单名称" min-width="180" />
        <el-table-column prop="product_name" label="产品名称" width="150" />
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column prop="unit" label="单位" width="60" />
        <el-table-column prop="priority" label="优先级" width="80">
          <template #default="{ row }">
            <el-tag :type="row.priority === 'urgent' ? 'danger' : row.priority === 'high' ? 'warning' : 'info'">
              {{ row.priority === 'urgent' ? '紧急' : row.priority === 'high' ? '高' : row.priority === 'normal' ? '普通' : '低' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="progress_percent" label="进度" width="120">
          <template #default="{ row }">
            <el-progress :percentage="row.progress_percent || 0" :color="getProgressColor(row.progress_percent)" />
          </template>
        </el-table-column>
        <el-table-column prop="planned_start_date" label="计划开始" width="100" />
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
        @current-change="fetchWorkOrders"
        @size-change="fetchWorkOrders"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑工单' : '新建工单'" width="800px">
      <el-form :model="workOrderForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="工单编号">
              <el-input v-model="workOrderForm.work_order_code" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工单名称" required>
              <el-input v-model="workOrderForm.order_name" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="产品名称">
              <el-input v-model="workOrderForm.product_name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产品规格">
              <el-input v-model="workOrderForm.product_model" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="数量" required>
              <el-input-number v-model="workOrderForm.quantity" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="单位">
              <el-input v-model="workOrderForm.unit" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="优先级">
              <el-select v-model="workOrderForm.priority" style="width: 100%">
                <el-option label="紧急" value="urgent" />
                <el-option label="高" value="high" />
                <el-option label="普通" value="normal" />
                <el-option label="低" value="low" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="计划开始">
              <el-date-picker v-model="workOrderForm.planned_start_date" type="date" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计划结束">
              <el-date-picker v-model="workOrderForm.planned_end_date" type="date" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="生产车间">
              <el-input v-model="workOrderForm.workshop" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生产线">
              <el-input v-model="workOrderForm.production_line" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="负责人">
              <el-input v-model="workOrderForm.supervisor" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="workOrderForm.status" style="width: 100%">
                <el-option label="计划中" value="planned" />
                <el-option label="生产中" value="in-progress" />
                <el-option label="已暂停" value="paused" />
                <el-option label="已完成" value="completed" />
                <el-option label="已取消" value="cancelled" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="workOrderForm.remarks" type="textarea" :rows="3" />
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

const workOrderList = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const searchKeyword = ref('')
const searchStatus = ref('')
const searchPriority = ref('')

const dialogVisible = ref(false)
const isEdit = ref(false)

const workOrderForm = reactive({
  id: null,
  work_order_code: '',
  order_name: '',
  product_name: '',
  product_model: '',
  quantity: 1,
  unit: '台',
  priority: 'normal',
  planned_start_date: '',
  planned_end_date: '',
  workshop: '',
  production_line: '',
  supervisor: '',
  status: 'planned',
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
    'planned': 'info',
    'in-progress': 'primary',
    'paused': 'warning',
    'completed': 'success',
    'cancelled': 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    'planned': '计划中',
    'in-progress': '生产中',
    'paused': '已暂停',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return map[status] || status
}

const fetchWorkOrders = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      keyword: searchKeyword.value,
      status: searchStatus.value,
      priority: searchPriority.value
    }
    const res = await request.get('/mfg/work-orders', { params })
    if (res.success) {
      workOrderList.value = res.data.list
      total.value = res.data.pagination.total
    }
  } catch (error) {
    ElMessage.error('获取工单列表失败')
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  isEdit.value = false
  Object.keys(workOrderForm).forEach(key => {
    if (key === 'quantity') workOrderForm[key] = 1
    else if (key === 'unit') workOrderForm[key] = '台'
    else if (key === 'priority') workOrderForm[key] = 'normal'
    else if (key === 'status') workOrderForm[key] = 'planned'
    else workOrderForm[key] = ''
  })
  workOrderForm.id = null
  workOrderForm.work_order_code = '系统自动生成'
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(workOrderForm, row)
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!workOrderForm.order_name) {
    ElMessage.warning('请填写工单名称')
    return
  }
  try {
    if (isEdit.value) {
      await request.put(`/mfg/work-orders/${workOrderForm.id}`, workOrderForm)
      ElMessage.success('更新成功')
    } else {
      await request.post('/mfg/work-orders', workOrderForm)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchWorkOrders()
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除工单 ${row.order_name} 吗？`, '提示', {
      type: 'warning'
    })
    await request.delete(`/mfg/work-orders/${row.id}`)
    ElMessage.success('删除成功')
    fetchWorkOrders()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  fetchWorkOrders()
})
</script>

<style scoped>
.mfg-workorder-container {
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