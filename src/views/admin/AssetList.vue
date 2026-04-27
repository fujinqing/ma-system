<template>
  <div class="admin-assets-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>资产管理</span>
          <el-button type="primary" @click="handleAdd">新增资产</el-button>
        </div>
      </template>

      <div class="search-bar">
        <el-input v-model="searchKeyword" placeholder="搜索资产名称、编号、序列号" style="width: 300px" clearable @change="fetchAssets" />
        <el-select v-model="searchCategory" placeholder="资产类别" clearable style="width: 150px; margin-left: 10px" @change="fetchAssets">
          <el-option label="设备" value="设备" />
          <el-option label="工具" value="工具" />
          <el-option label="电子产品" value="电子产品" />
          <el-option label="家具" value="家具" />
          <el-option label="车辆" value="车辆" />
        </el-select>
        <el-select v-model="searchStatus" placeholder="状态" clearable style="width: 120px; margin-left: 10px" @change="fetchAssets">
          <el-option label="使用中" value="in-use" />
          <el-option label="闲置" value="idle" />
          <el-option label="维护中" value="maintenance" />
          <el-option label="报废" value="retired" />
        </el-select>
        <el-button style="margin-left: 10px" @click="fetchAssets">搜索</el-button>
      </div>

      <el-table :data="assetList" v-loading="loading" stripe>
        <el-table-column prop="asset_code" label="资产编号" width="140" />
        <el-table-column prop="asset_name" label="资产名称" min-width="150" />
        <el-table-column prop="category" label="类别" width="100" />
        <el-table-column prop="serial_number" label="序列号" width="140" />
        <el-table-column prop="location" label="存放地点" width="120" />
        <el-table-column prop="custodian" label="保管人" width="100" />
        <el-table-column prop="purchase_price" label="购置价格" width="100">
          <template #default="{ row }">
            {{ row.purchase_price ? `¥${row.purchase_price.toLocaleString()}` : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'in-use' ? 'success' : row.status === 'maintenance' ? 'warning' : 'info'">
              {{ row.status === 'in-use' ? '使用中' : row.status === 'idle' ? '闲置' : row.status === 'maintenance' ? '维护中' : '报废' }}
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
        @current-change="fetchAssets"
        @size-change="fetchAssets"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑资产' : '新增资产'" width="700px">
      <el-form :model="assetForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="资产名称" required>
              <el-input v-model="assetForm.asset_name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="资产编号">
              <el-input v-model="assetForm.asset_code" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="资产类别" required>
              <el-select v-model="assetForm.category" style="width: 100%">
                <el-option label="设备" value="设备" />
                <el-option label="工具" value="工具" />
                <el-option label="电子产品" value="电子产品" />
                <el-option label="家具" value="家具" />
                <el-option label="车辆" value="车辆" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="序列号">
              <el-input v-model="assetForm.serial_number" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="购置日期">
              <el-date-picker v-model="assetForm.purchase_date" type="date" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="购置价格">
              <el-input-number v-model="assetForm.purchase_price" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="折旧率(年)">
              <el-input-number v-model="assetForm.depreciation_rate" :min="0" :max="1" :step="0.01" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="存放地点">
              <el-input v-model="assetForm.location" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="保管人">
              <el-input v-model="assetForm.custodian" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="供应商">
              <el-input v-model="assetForm.supplier" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="保修到期">
              <el-date-picker v-model="assetForm.warranty_expiry" type="date" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="assetForm.status" style="width: 100%">
                <el-option label="使用中" value="in-use" />
                <el-option label="闲置" value="idle" />
                <el-option label="维护中" value="maintenance" />
                <el-option label="报废" value="retired" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="assetForm.remarks" type="textarea" :rows="3" />
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

const assetList = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const searchKeyword = ref('')
const searchCategory = ref('')
const searchStatus = ref('')

const dialogVisible = ref(false)
const isEdit = ref(false)
const assetForm = reactive({
  id: null,
  asset_code: '',
  asset_name: '',
  category: '',
  serial_number: '',
  purchase_date: '',
  purchase_price: null,
  depreciation_rate: null,
  location: '',
  custodian: '',
  supplier: '',
  warranty_expiry: '',
  status: 'in-use',
  remarks: ''
})

const fetchAssets = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      keyword: searchKeyword.value,
      category: searchCategory.value,
      status: searchStatus.value
    }
    const res = await request.get('/admin/assets', { params })
    if (res.success) {
      assetList.value = res.data.list
      total.value = res.data.pagination.total
    }
  } catch (error) {
    ElMessage.error('获取资产列表失败')
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  isEdit.value = false
  Object.keys(assetForm).forEach(key => {
    if (key !== 'status') {
      assetForm[key] = key === 'purchase_price' || key === 'depreciation_rate' ? null : ''
    }
  })
  assetForm.id = null
  assetForm.asset_code = '系统自动生成'
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(assetForm, row)
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!assetForm.asset_name || !assetForm.category) {
    ElMessage.warning('请填写必填项')
    return
  }
  try {
    if (isEdit.value) {
      await request.put(`/admin/assets/${assetForm.id}`, assetForm)
      ElMessage.success('更新成功')
    } else {
      await request.post('/admin/assets', assetForm)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchAssets()
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除资产 ${row.asset_name} 吗？`, '提示', {
      type: 'warning'
    })
    await request.delete(`/admin/assets/${row.id}`)
    ElMessage.success('删除成功')
    fetchAssets()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  fetchAssets()
})
</script>

<style scoped>
.admin-assets-container {
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