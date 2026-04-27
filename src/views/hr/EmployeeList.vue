<template>
  <div class="hr-employee-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>员工管理</span>
          <el-button type="primary" @click="openUserManagement">前往用户管理</el-button>
        </div>
      </template>

      <div class="search-bar">
        <el-input v-model="searchKeyword" placeholder="搜索员工姓名、工号、电话" style="width: 300px" clearable @change="fetchEmployees" />
        <el-select v-model="searchDepartment" placeholder="选择部门" clearable style="width: 150px; margin-left: 10px" @change="fetchEmployees">
          <el-option v-for="dept in departmentList" :key="dept.id" :label="dept.name" :value="dept.name" />
        </el-select>
        <el-select v-model="searchStatus" placeholder="状态" clearable style="width: 120px; margin-left: 10px" @change="fetchEmployees">
          <el-option label="在职" value="active" />
          <el-option label="离职" value="leave" />
          <el-option label="注销" value="terminated" />
        </el-select>
        <el-button style="margin-left: 10px" @click="fetchEmployees">搜索</el-button>
      </div>

      <el-table :data="employeeList" v-loading="loading" stripe>
        <el-table-column prop="employee_code" label="工号" width="120" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="department" label="部门" width="120" />
        <el-table-column prop="position" label="岗位" width="120" />
        <el-table-column prop="phone" label="电话" width="120" />
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : row.status === 'leave' ? 'warning' : 'info'">
              {{ row.status === 'active' ? '在职' : row.status === 'leave' ? '离职' : '注销' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
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
        @current-change="fetchEmployees"
        @size-change="fetchEmployees"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" title="编辑员工" width="600px">
      <el-form :model="employeeForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="工号">
              <el-input v-model="employeeForm.employee_code" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="姓名">
              <el-input v-model="employeeForm.name" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="部门">
              <el-select v-model="employeeForm.department_id" style="width: 100%" placeholder="请选择部门">
                <el-option v-for="dept in departmentList" :key="dept.id" :label="dept.name" :value="dept.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="岗位">
              <el-input v-model="employeeForm.position" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="电话">
              <el-input v-model="employeeForm.phone" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱">
              <el-input v-model="employeeForm.email" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="角色">
              <el-select v-model="employeeForm.role" style="width: 100%">
                <el-option label="管理员" value="admin" />
                <el-option label="主管" value="supervisor" />
                <el-option label="员工" value="employee" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="employeeForm.status" style="width: 100%">
                <el-option label="在职" value="active" />
                <el-option label="离职" value="leave" />
                <el-option label="注销" value="terminated" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
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
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import request from '@/api'

const router = useRouter()
const employeeList = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const searchKeyword = ref('')
const searchDepartment = ref('')
const searchStatus = ref('')
const departmentList = ref([])

const dialogVisible = ref(false)
const employeeForm = reactive({
  id: null,
  employee_code: '',
  name: '',
  department_id: null,
  position: '',
  phone: '',
  email: '',
  role: 'employee',
  status: 'active'
})

const fetchDepartments = async () => {
  try {
    const res = await request.get('/departments')
    if (res.success) {
      departmentList.value = res.data
    }
  } catch (error) {
    console.error('获取部门列表失败:', error)
  }
}

const fetchEmployees = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      keyword: searchKeyword.value,
      department: searchDepartment.value,
      status: searchStatus.value
    }
    const res = await request.get('/hr/employees', { params })
    if (res.success) {
      employeeList.value = res.data.list
      total.value = res.data.pagination.total
    }
  } catch (error) {
    ElMessage.error('获取员工列表失败')
  } finally {
    loading.value = false
  }
}

const handleEdit = (row) => {
  employeeForm.id = row.id
  employeeForm.employee_code = row.employee_code || row.username
  employeeForm.name = row.name
  employeeForm.department_id = row.department_id
  employeeForm.position = row.position
  employeeForm.phone = row.phone
  employeeForm.email = row.email
  employeeForm.role = row.role
  employeeForm.status = row.status
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!employeeForm.name) {
    ElMessage.warning('请填写姓名')
    return
  }
  try {
    await request.put(`/hr/employees/${employeeForm.id}`, employeeForm)
    ElMessage.success('更新成功')
    dialogVisible.value = false
    fetchEmployees()
  } catch (error) {
    ElMessage.error('更新失败')
  }
}

const openUserManagement = () => {
  router.push('/setting/user')
}

onMounted(() => {
  fetchDepartments()
  fetchEmployees()
})
</script>

<style scoped>
.hr-employee-container {
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