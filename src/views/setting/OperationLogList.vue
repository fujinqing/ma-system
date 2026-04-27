<template>
  <div class="operation-log-management">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>操作日志</span>
          <div class="header-buttons">
            <el-button type="danger" @click="handleCleanup" :loading="cleaning">
              <i class="el-icon-delete"></i> 清理历史日志
            </el-button>
            <el-button type="warning" @click="handleExport" :loading="exporting">
              <i class="el-icon-download"></i> 导出
            </el-button>
          </div>
        </div>
      </template>

      <div class="search-bar">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索操作描述"
          style="width: 200px"
          clearable
          @clear="handleSearch"
        >
          <template #prefix>
            <i class="el-icon-search"></i>
          </template>
        </el-input>
        <el-input
          v-model="searchForm.username"
          placeholder="搜索用户名"
          style="width: 150px; margin-left: 10px"
          clearable
          @clear="handleSearch"
        />
        <el-select
          v-model="searchForm.module"
          placeholder="选择模块"
          clearable
          style="width: 150px; margin-left: 10px"
          @change="handleSearch"
        >
          <el-option label="全部模块" value="" />
          <el-option label="用户管理" value="auth" />
          <el-option label="部门管理" value="departments" />
          <el-option label="职位管理" value="positions" />
          <el-option label="团队管理" value="teams" />
          <el-option label="项目管理" value="projects" />
          <el-option label="客户管理" value="customers" />
          <el-option label="采购管理" value="purchase" />
          <el-option label="销售管理" value="sales" />
          <el-option label="系统管理" value="system" />
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
        :data="logList"
        style="width: 100%; margin-top: 20px"
        v-loading="loading"
        border
        stripe
      >
        <el-table-column type="index" label="序号" width="80" />
        <el-table-column prop="created_at" label="操作时间" width="180" sortable>
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="user_name" label="姓名" width="100" />
        <el-table-column prop="module" label="模块" width="120">
          <template #default="{ row }">
            <el-tag :type="getModuleTagType(row.module)" size="small">
              {{ getModuleName(row.module) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="action" label="操作" width="200" show-overflow-tooltip />
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column prop="ip_address" label="IP地址" width="140" />
        <el-table-column prop="duration" label="耗时(ms)" width="100">
          <template #default="{ row }">
            <span :class="getDurationClass(row.duration)">{{ row.duration || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleViewDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :page-sizes="[20, 50, 100, 200]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </el-card>

    <el-dialog
      v-model="detailDialogVisible"
      title="操作日志详情"
      width="700px"
    >
      <el-descriptions :column="2" border v-if="currentLog">
        <el-descriptions-item label="用户名">{{ currentLog.username || '-' }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ currentLog.user_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="模块">
          <el-tag :type="getModuleTagType(currentLog.module)" size="small">
            {{ getModuleName(currentLog.module) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ currentLog.ip_address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作方法">{{ currentLog.method || '-' }}</el-descriptions-item>
        <el-descriptions-item label="响应状态">{{ currentLog.status_code || '-' }}</el-descriptions-item>
        <el-descriptions-item label="请求路径" :span="2">{{ currentLog.path || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作耗时">{{ currentLog.duration ? `${currentLog.duration} ms` : '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ formatDate(currentLog.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="User-Agent" :span="2">
          <span style="word-break: break-all; font-size: 12px;">{{ currentLog.user_agent || '-' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="操作描述" :span="2">{{ currentLog.description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="详细信息" :span="2">
          <pre style="margin: 0; white-space: pre-wrap; word-break: break-all; font-size: 12px;">{{ formatDetails(currentLog.details) }}</pre>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3005/api';

const loading = ref(false);
const cleaning = ref(false);
const exporting = ref(false);
const logList = ref([]);
const detailDialogVisible = ref(false);
const currentLog = ref(null);

const searchForm = reactive({
  keyword: '',
  username: '',
  module: '',
  dateRange: null
});

const pagination = reactive({
  page: 1,
  limit: 50,
  total: 0
});

const fetchLogs = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: pagination.page,
      limit: pagination.limit
    });

    if (searchForm.keyword) {
      params.append('keyword', searchForm.keyword);
    }
    if (searchForm.username) {
      params.append('username', searchForm.username);
    }
    if (searchForm.module) {
      params.append('module', searchForm.module);
    }
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.append('startDate', searchForm.dateRange[0]);
      params.append('endDate', searchForm.dateRange[1]);
    }

    const response = await fetch(`${API_BASE}/system/operation-logs?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    });

    const result = await response.json();

    if (result.success && result.data) {
      logList.value = result.data || [];
      if (result.pagination) {
        pagination.total = result.pagination.total || 0;
      }
    } else {
      logList.value = [];
    }
  } catch (err) {
    console.error('获取操作日志失败:', err);
    ElMessage.error('获取操作日志失败');
    logList.value = [];
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  fetchLogs();
};

const handleReset = () => {
  searchForm.keyword = '';
  searchForm.username = '';
  searchForm.module = '';
  searchForm.dateRange = null;
  pagination.page = 1;
  fetchLogs();
};

const handleSizeChange = (val) => {
  pagination.limit = val;
  pagination.page = 1;
  fetchLogs();
};

const handlePageChange = (val) => {
  pagination.page = val;
  fetchLogs();
};

const handleViewDetail = (row) => {
  currentLog.value = row;
  detailDialogVisible.value = true;
};

const handleCleanup = async () => {
  try {
    await ElMessageBox.confirm(
      '即将清理 3 个月前的操作日志，清理后无法恢复。是否继续？',
      '清理确认',
      {
        confirmButtonText: '确定清理',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    cleaning.value = true;
    try {
      const response = await fetch(`${API_BASE}/system/operation-logs/cleanup?months=3`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      const result = await response.json();

      if (result.success) {
        ElMessage.success(result.message || '清理成功');
        fetchLogs();
      } else {
        ElMessage.error(result.message || '清理失败');
      }
    } catch (err) {
      console.error('清理失败:', err);
      ElMessage.error('清理失败');
    } finally {
      cleaning.value = false;
    }
  } catch {
  }
};

const handleExport = async () => {
  exporting.value = true;
  try {
    const params = new URLSearchParams({
      page: 1,
      limit: 10000
    });

    if (searchForm.keyword) {
      params.append('keyword', searchForm.keyword);
    }
    if (searchForm.username) {
      params.append('username', searchForm.username);
    }
    if (searchForm.module) {
      params.append('module', searchForm.module);
    }
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.append('startDate', searchForm.dateRange[0]);
      params.append('endDate', searchForm.dateRange[1]);
    }

    const response = await fetch(`${API_BASE}/system/operation-logs?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    });

    const result = await response.json();

    if (result.success && result.data) {
      const logs = result.data;
      const csvContent = [
        ['序号', '操作时间', '用户名', '姓名', '模块', '操作', '描述', 'IP地址', '耗时(ms)'].join(','),
        ...logs.map((log, index) => [
          index + 1,
          formatDate(log.created_at),
          log.username || '',
          log.user_name || '',
          getModuleName(log.module),
          log.action || '',
          (log.description || '').replace(/,/g, ';'),
          log.ip_address || '',
          log.duration || ''
        ].join(','))
      ].join('\n');

      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `operation_logs_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      ElMessage.success(`已导出 ${logs.length} 条记录`);
    }
  } catch (err) {
    console.error('导出失败:', err);
    ElMessage.error('导出失败');
  } finally {
    exporting.value = false;
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
    minute: '2-digit',
    second: '2-digit'
  });
};

const formatDetails = (details) => {
  if (!details) return '-';
  try {
    const parsed = typeof details === 'string' ? JSON.parse(details) : details;
    return JSON.stringify(parsed, null, 2);
  } catch {
    return details;
  }
};

const getModuleName = (module) => {
  const moduleMap = {
    'auth': '用户管理',
    'departments': '部门管理',
    'positions': '职位管理',
    'teams': '团队管理',
    'projects': '项目管理',
    'customers': '客户管理',
    'purchase': '采购管理',
    'sales': '销售管理',
    'system': '系统管理',
    'hr': '人事管理',
    'master': '主数据',
    'gateway': '网关',
    'debug': '调试',
    'admin': '行政管理',
    'mfg': '制造管理',
    'rd': '研发管理'
  };
  return moduleMap[module] || module || '-';
};

const getModuleTagType = (module) => {
  const typeMap = {
    'auth': 'success',
    'departments': 'primary',
    'positions': 'warning',
    'teams': 'info',
    'projects': 'danger',
    'customers': 'success',
    'purchase': 'warning',
    'sales': 'primary',
    'system': 'info'
  };
  return typeMap[module] || '';
};

const getDurationClass = (duration) => {
  if (!duration) return '';
  if (duration > 5000) return 'duration-slow';
  if (duration > 1000) return 'duration-medium';
  return 'duration-fast';
};

onMounted(() => {
  fetchLogs();
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

.duration-slow {
  color: #F56C6C;
  font-weight: bold;
}

.duration-medium {
  color: #E6A23C;
}

.duration-fast {
  color: #67C23A;
}

pre {
  background: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
}
</style>
