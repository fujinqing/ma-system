<template>
  <div class="expense-management">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>报销管理</span>
          <div class="header-buttons">
            <el-button type="primary" @click="handleCreate">
              <i class="el-icon-plus"></i> 新建报销单
            </el-button>
            <el-button type="success" @click="handleExport">
              <i class="el-icon-download"></i> 导出
            </el-button>
          </div>
        </div>
      </template>

      <div class="search-bar">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索报销单号/事由"
          style="width: 200px"
          clearable
          @clear="handleSearch"
        >
          <template #prefix>
            <i class="el-icon-search"></i>
          </template>
        </el-input>
        <el-select
          v-model="searchForm.status"
          placeholder="审批状态"
          clearable
          style="width: 150px; margin-left: 10px"
          @change="handleSearch"
        >
          <el-option label="全部状态" value="" />
          <el-option label="草稿" value="draft" />
          <el-option label="审批中" value="pending" />
          <el-option label="已通过" value="approved" />
          <el-option label="已拒绝" value="rejected" />
          <el-option label="已打款" value="paid" />
        </el-select>
        <el-date-picker
          v-model="searchForm.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 250px; margin-left: 10px"
          @change="handleSearch"
        />
        <el-button type="primary" @click="handleSearch" style="margin-left: 10px">
          搜索
        </el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <el-table
        :data="expenseList"
        style="width: 100%; margin-top: 20px"
        v-loading="loading"
        border
        stripe
      >
        <el-table-column type="index" label="序号" width="80" />
        <el-table-column prop="expense_no" label="报销单号" width="180" />
        <el-table-column prop="title" label="报销事由" show-overflow-tooltip />
        <el-table-column prop="applicant_name" label="申请人" width="100" />
        <el-table-column prop="department" label="部门" width="120" />
        <el-table-column prop="amount" label="报销金额" width="120">
          <template #default="{ row }">
            <span class="amount">¥{{ formatNumber(row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="申请时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleView(row)">
              查看
            </el-button>
            <el-button type="warning" size="small" @click="handleEdit(row)" v-if="row.status === 'draft'">
              编辑
            </el-button>
            <el-button type="success" size="small" @click="handleApprove(row)" v-if="row.status === 'pending' && isAdmin">
              审批
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      @close="handleDialogClose"
    >
      <el-form
        ref="expenseFormRef"
        :model="expenseForm"
        :rules="expenseRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="报销事由" prop="title">
              <el-input v-model="expenseForm.title" placeholder="请输入报销事由" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="报销金额" prop="amount">
              <el-input-number
                v-model="expenseForm.amount"
                :min="0"
                :precision="2"
                :controls="false"
                placeholder="0.00"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="费用类型" prop="expense_type">
              <el-select v-model="expenseForm.expense_type" placeholder="选择费用类型" style="width: 100%">
                <el-option label="差旅费" value="travel" />
                <el-option label="交通费" value="transport" />
                <el-option label="餐饮费" value="meal" />
                <el-option label="办公费" value="office" />
                <el-option label="招待费" value="entertainment" />
                <el-option label="培训费" value="training" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发生日期" prop="expense_date">
              <el-date-picker
                v-model="expenseForm.expense_date"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="报销说明" prop="description">
          <el-input
            v-model="expenseForm.description"
            type="textarea"
            :rows="3"
            placeholder="请详细描述报销内容"
          />
        </el-form-item>
        <el-form-item label="附件上传">
          <el-upload
            :auto-upload="false"
            :limit="5"
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
          >
            <el-button type="primary">选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持jpg、png、pdf、doc、xls格式，最多上传5个文件</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button @click="handleSaveDraft" :loading="submitting">保存草稿</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">提交审批</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="detailDialogVisible"
      title="报销单详情"
      width="700px"
    >
      <el-descriptions :column="2" border v-if="currentExpense">
        <el-descriptions-item label="报销单号">{{ currentExpense.expense_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentExpense.status)" size="small">
            {{ getStatusName(currentExpense.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="申请人">{{ currentExpense.applicant_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="部门">{{ currentExpense.department || '-' }}</el-descriptions-item>
        <el-descriptions-item label="费用类型">{{ getExpenseTypeName(currentExpense.expense_type) }}</el-descriptions-item>
        <el-descriptions-item label="报销金额">
          <span class="amount">¥{{ formatNumber(currentExpense.amount) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="发生日期">{{ currentExpense.expense_date || '-' }}</el-descriptions-item>
        <el-descriptions-item label="申请时间">{{ formatDate(currentExpense.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="报销事由" :span="2">{{ currentExpense.title || '-' }}</el-descriptions-item>
        <el-descriptions-item label="报销说明" :span="2">{{ currentExpense.description || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="success" @click="handleApproveConfirm" v-if="currentExpense?.status === 'pending' && isAdmin">
          批准
        </el-button>
        <el-button type="danger" @click="handleReject" v-if="currentExpense?.status === 'pending' && isAdmin">
          拒绝
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3005/api';

const loading = ref(false);
const submitting = ref(false);
const expenseList = ref([]);
const dialogVisible = ref(false);
const detailDialogVisible = ref(false);
const currentExpense = ref(null);
const expenseFormRef = ref(null);
const isAdmin = ref(false);

const dialogTitle = computed(() => {
  return currentExpense.value ? '编辑报销单' : '新建报销单';
});

const searchForm = reactive({
  keyword: '',
  status: '',
  dateRange: null
});

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
});

const expenseForm = reactive({
  title: '',
  amount: 0,
  expense_type: '',
  expense_date: '',
  description: ''
});

const expenseRules = {
  title: [{ required: true, message: '请输入报销事由', trigger: 'blur' }],
  amount: [{ required: true, message: '请输入报销金额', trigger: 'blur' }],
  expense_type: [{ required: true, message: '请选择费用类型', trigger: 'change' }],
  expense_date: [{ required: true, message: '请选择发生日期', trigger: 'change' }]
};

const fetchExpenseList = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: pagination.page,
      limit: pagination.limit
    });

    if (searchForm.keyword) {
      params.append('keyword', searchForm.keyword);
    }
    if (searchForm.status) {
      params.append('status', searchForm.status);
    }
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.append('startDate', searchForm.dateRange[0]);
      params.append('endDate', searchForm.dateRange[1]);
    }

    const response = await fetch(`${API_BASE}/finance/expenses?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    });

    const result = await response.json();

    if (result.success && result.data) {
      expenseList.value = result.data || [];
      if (result.pagination) {
        pagination.total = result.pagination.total || 0;
      }
    } else {
      expenseList.value = [];
    }
  } catch (err) {
    console.error('获取报销列表失败:', err);
    expenseList.value = [];
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  fetchExpenseList();
};

const handleReset = () => {
  searchForm.keyword = '';
  searchForm.status = '';
  searchForm.dateRange = null;
  pagination.page = 1;
  fetchExpenseList();
};

const handleSizeChange = (val) => {
  pagination.limit = val;
  pagination.page = 1;
  fetchExpenseList();
};

const handlePageChange = (val) => {
  pagination.page = val;
  fetchExpenseList();
};

const handleCreate = () => {
  currentExpense.value = null;
  resetForm();
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  currentExpense.value = { ...row };
  Object.assign(expenseForm, {
    title: row.title,
    amount: row.amount,
    expense_type: row.expense_type,
    expense_date: row.expense_date,
    description: row.description
  });
  dialogVisible.value = true;
};

const handleView = (row) => {
  currentExpense.value = row;
  detailDialogVisible.value = true;
};

const handleApprove = (row) => {
  currentExpense.value = row;
  detailDialogVisible.value = true;
};

const handleApproveConfirm = async () => {
  try {
    await ElMessageBox.confirm('确认批准此报销单?', '审批确认', {
      confirmButtonText: '确认批准',
      cancelButtonText: '取消',
      type: 'success'
    });

    const response = await fetch(`${API_BASE}/finance/expenses/${currentExpense.value.id}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    });

    const result = await response.json();

    if (result.success) {
      ElMessage.success('报销单已批准');
      detailDialogVisible.value = false;
      fetchExpenseList();
    } else {
      ElMessage.error(result.message || '操作失败');
    }
  } catch (err) {
    if (err !== 'cancel') {
      console.error('批准失败:', err);
      ElMessage.error('批准失败');
    }
  }
};

const handleReject = async () => {
  try {
    await ElMessageBox.confirm('确认拒绝此报销单?', '审批确认', {
      confirmButtonText: '确认拒绝',
      cancelButtonText: '取消',
      type: 'warning'
    });

    const response = await fetch(`${API_BASE}/finance/expenses/${currentExpense.value.id}/reject`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    });

    const result = await response.json();

    if (result.success) {
      ElMessage.success('报销单已拒绝');
      detailDialogVisible.value = false;
      fetchExpenseList();
    } else {
      ElMessage.error(result.message || '操作失败');
    }
  } catch (err) {
    if (err !== 'cancel') {
      console.error('拒绝失败:', err);
      ElMessage.error('拒绝失败');
    }
  }
};

const handleSaveDraft = async () => {
  await handleSave('draft');
};

const handleSubmit = async () => {
  await expenseFormRef.value.validate(async (valid) => {
    if (valid) {
      await handleSave('pending');
    }
  });
};

const handleSave = async (status) => {
  submitting.value = true;
  try {
    const method = currentExpense.value?.id ? 'PUT' : 'POST';
    const url = currentExpense.value?.id
      ? `${API_BASE}/finance/expenses/${currentExpense.value.id}`
      : `${API_BASE}/finance/expenses`;

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...expenseForm,
        status
      })
    });

    const result = await response.json();

    if (result.success) {
      ElMessage.success(status === 'draft' ? '草稿保存成功' : '提交成功');
      dialogVisible.value = false;
      fetchExpenseList();
    } else {
      ElMessage.error(result.message || '操作失败');
    }
  } catch (err) {
    console.error('保存失败:', err);
    ElMessage.error('保存失败');
  } finally {
    submitting.value = false;
  }
};

const handleDialogClose = () => {
  resetForm();
};

const resetForm = () => {
  expenseForm.title = '';
  expenseForm.amount = 0;
  expenseForm.expense_type = '';
  expenseForm.expense_date = '';
  expenseForm.description = '';
  expenseFormRef.value?.resetFields();
};

const handleExport = async () => {
  const response = await fetch(`${API_BASE}/finance/expenses?page=1&limit=10000`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
    }
  });

  const result = await response.json();

  if (result.success && result.data) {
    const expenses = result.data;
    const csvContent = [
      ['序号', '报销单号', '报销事由', '申请人', '部门', '费用类型', '金额', '状态', '申请时间'].join(','),
      ...expenses.map((exp, index) => [
        index + 1,
        exp.expense_no || '',
        (exp.title || '').replace(/,/g, ';'),
        exp.applicant_name || '',
        exp.department || '',
        getExpenseTypeName(exp.expense_type),
        exp.amount || 0,
        getStatusName(exp.status),
        formatDate(exp.created_at)
      ].join(','))
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expense_list_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    ElMessage.success(`已导出 ${expenses.length} 条记录`);
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatNumber = (num) => {
  if (!num && num !== 0) return '0.00';
  return parseFloat(num).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const getStatusType = (status) => {
  const typeMap = {
    'draft': 'info',
    'pending': 'warning',
    'approved': 'success',
    'rejected': 'danger',
    'paid': 'primary'
  };
  return typeMap[status] || '';
};

const getStatusName = (status) => {
  const nameMap = {
    'draft': '草稿',
    'pending': '审批中',
    'approved': '已通过',
    'rejected': '已拒绝',
    'paid': '已打款'
  };
  return nameMap[status] || status;
};

const getExpenseTypeName = (type) => {
  const typeMap = {
    'travel': '差旅费',
    'transport': '交通费',
    'meal': '餐饮费',
    'office': '办公费',
    'entertainment': '招待费',
    'training': '培训费',
    'other': '其他'
  };
  return typeMap[type] || type;
};

const checkUserRole = () => {
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  isAdmin.value = userData.role === 'admin';
};

onMounted(() => {
  checkUserRole();
  fetchExpenseList();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-buttons {
  display: flex;
  gap: 10px;
}

.search-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.amount {
  color: #E6A23C;
  font-weight: bold;
}
</style>
