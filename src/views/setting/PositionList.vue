<template>
  <div class="position-management">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>职位管理</span>
          <div class="header-buttons">
            <el-button type="primary" @click="handleAdd">
              <i class="el-icon-plus"></i> 新增职位
            </el-button>
            <el-button type="warning" @click="handleBatchUpdateCodes">
              <i class="el-icon-refresh"></i> 批量更新职位代码
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索职位名称"
          style="width: 300px"
          clearable
          @clear="handleSearch"
        >
          <template #prefix>
            <i class="el-icon-search"></i>
          </template>
        </el-input>
        <el-select
          v-model="searchForm.departmentId"
          placeholder="选择部门"
          clearable
          style="width: 200px; margin-left: 10px"
          @change="handleSearch"
        >
          <el-option label="全部部门" :value="0" />
          <el-option
            v-for="dept in departments"
            :key="dept.id"
            :label="dept.name"
            :value="dept.id"
          />
        </el-select>
        <el-select
          v-model="searchForm.positionType"
          placeholder="职位类型"
          clearable
          style="width: 150px; margin-left: 10px"
          @change="handleSearch"
        >
          <el-option label="全部类型" value="" />
          <el-option label="管理职位" value="management" />
          <el-option label="技术职位" value="technical" />
          <el-option label="通用职位" value="common" />
        </el-select>
        <el-button type="primary" @click="handleSearch" style="margin-left: 10px">
          搜索
        </el-button>
      </div>

      <!-- 职位列表 -->
      <el-table
        :data="positionList"
        style="width: 100%; margin-top: 20px"
        v-loading="loading"
        border
      >
        <el-table-column type="index" label="序号" width="80" :index="indexMethod" />
        <el-table-column prop="position_code" label="职位代码" width="120" sortable />
        <el-table-column prop="position_name" label="职位名称" width="150" sortable />
        <el-table-column prop="department_name" label="所属部门" width="150" sortable />
        <el-table-column label="职位类型" width="120" sortable :sort-method="positionTypeSort">
          <template #default="{ row }">
            <el-tag
              :type="getPositionTypeTag(row.position_type)"
              size="small"
            >
              {{ getPositionTypeText(row.position_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <!-- 可排序列 -->
        <el-table-column prop="description" label="描述" show-overflow-tooltip sortable />
        <el-table-column label="状态" width="100" sortable :sort-method="statusSort">
          <template #default="{ row }">
            <el-tag
              :type="row.status === 'active' ? 'success' : 'info'"
              size="small"
            >
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form
        ref="positionFormRef"
        :model="positionForm"
        :rules="positionRules"
        label-width="100px"
      >
        <el-form-item label="职位代码" prop="position_code">
          <el-input 
            v-model="positionForm.position_code" 
            placeholder="例如：MANAGER" 
            @input="handleCodeInput"
            style="text-transform: uppercase;"
          />
        </el-form-item>
        <el-form-item label="职位名称" prop="position_name">
          <el-input 
            v-model="positionForm.position_name" 
            placeholder="例如：经理" 
            @input="handlePositionNameInput"
          />
        </el-form-item>
        <el-form-item label="所属部门" prop="department_id">
          <el-select
            v-model="positionForm.department_id"
            placeholder="选择部门（可选）"
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="dept in departments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="职位类型" prop="position_type">
          <el-select v-model="positionForm.position_type" placeholder="选择职位类型" style="width: 100%">
            <el-option label="管理职位" value="management" />
            <el-option label="技术职位" value="technical" />
            <el-option label="通用职位" value="common" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="positionForm.description"
            type="textarea"
            :rows="3"
            placeholder="职位描述"
          />
        </el-form-item>
        <el-form-item label="排序" prop="sort_order">
          <el-input-number v-model="positionForm.sort_order" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="positionForm.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// API 请求
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3005/api';

// 数据
const loading = ref(false);
const submitting = ref(false);
const positionList = ref([]);
const departments = ref([]);
const positionMappings = ref([]); // 职位映射列表（从数据库获取）
const searchForm = reactive({
  keyword: '',
  departmentId: 0,
  positionType: ''
});

// 对话框
const dialogVisible = ref(false);
const dialogTitle = ref('新增职位');
const positionFormRef = ref(null);
const positionForm = reactive({
  id: null,
  position_code: '',
  position_name: '',
  department_id: null,
  position_type: 'common',
  description: '',
  sort_order: 0,
  status: 'active'
});

// 表单验证规则
const positionRules = {
  position_code: [
    { required: true, message: '请输入职位代码', trigger: 'blur' },
    { 
      pattern: /^[A-Za-z_][A-Za-z0-9_]*$/, 
      message: '职位代码必须以字母或下划线开头，只能包含字母、数字和下划线', 
      trigger: 'blur' 
    }
  ],
  position_name: [
    { required: true, message: '请输入职位名称', trigger: 'blur' }
  ],
  position_type: [
    { required: true, message: '请选择职位类型', trigger: 'change' }
  ]
};

// 获取职位列表 - 同一部门下相同职位名称只保留一个
const fetchPositions = async () => {
  loading.value = true;
  try {
    const response = await fetch(`${API_BASE}/positions`);
    const result = await response.json();

    if (result.success && Array.isArray(result.data)) {
      let data = result.data;

      // 筛选
      if (searchForm.keyword) {
        const keyword = searchForm.keyword.toLowerCase();
        data = data.filter(p => (p.position_name || '').toLowerCase().includes(keyword));
      }
      if (searchForm.departmentId && searchForm.departmentId !== 0) {
        data = data.filter(p => p.department_id === searchForm.departmentId);
      }
      if (searchForm.positionType) {
        data = data.filter(p => p.position_type === searchForm.positionType);
      }

      // 不同部门下相同职位名称只保留一个
      // 使用 Map 来存储唯一的职位，键为 position_name
      const uniquePositionsMap = new Map();
      data.forEach(position => {
        // 构建唯一键：仅使用职位名称
        const uniqueKey = position.position_name;
        // 如果键不存在，则添加到 Map 中
        if (!uniquePositionsMap.has(uniqueKey)) {
          uniquePositionsMap.set(uniqueKey, position);
        }
      });

      // 将 Map 的值转换为数组
      let uniquePositions = Array.from(uniquePositionsMap.values());
      
      // 按照部门编号进行排序
      // 首先创建部门ID到部门信息的映射
      const departmentMap = new Map();
      departments.value.forEach(dept => {
        departmentMap.set(dept.id, dept);
      });
      
      // 排序职位：按部门编号排序，没有部门的放最后
      uniquePositions.sort((a, b) => {
        // 获取两个职位的部门信息
        const deptA = a.department_id ? departmentMap.get(a.department_id) : null;
        const deptB = b.department_id ? departmentMap.get(b.department_id) : null;
        
        // 如果两个职位都没有部门，按职位名称排序
        if (!deptA && !deptB) {
          return (a.position_name || '').localeCompare(b.position_name || '');
        }
        
        // 如果只有一个职位有部门，有部门的排在前面
        if (!deptA) return 1;
        if (!deptB) return -1;
        
        // 都有部门，按部门编号排序
        const deptCodeA = deptA.department_code || '';
        const deptCodeB = deptB.department_code || '';
        
        // 先比较部门编号
        if (deptCodeA !== deptCodeB) {
          return deptCodeA.localeCompare(deptCodeB, undefined, { numeric: true });
        }
        
        // 部门编号相同，按职位名称排序
        return (a.position_name || '').localeCompare(b.position_name || '');
      });
      
      positionList.value = uniquePositions;
    } else {
      positionList.value = [];
    }
  } catch (err) {
    console.error('获取职位列表失败:', err);
    ElMessage.error('获取职位列表失败');
    positionList.value = [];
  } finally {
    loading.value = false;
  }
};

// 获取部门列表
const fetchDepartments = async () => {
  try {
    const response = await fetch(`${API_BASE}/departments`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    });
    const result = await response.json();

    if (result.success && Array.isArray(result.data)) {
      departments.value = result.data;
    } else {
      departments.value = [];
    }
  } catch (err) {
    console.error('获取部门列表失败:', err);
    departments.value = [];
  }
};

// 获取职位映射列表
const fetchPositionMappings = async () => {
  try {
    const response = await fetch(`${API_BASE}/position-mappings`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    });
    const result = await response.json();

    if (result.success && Array.isArray(result.data)) {
      positionMappings.value = result.data;
    } else {
      positionMappings.value = [];
    }
  } catch (err) {
    console.error('获取职位映射列表失败:', err);
    positionMappings.value = [];
  }
};

// 搜索
const handleSearch = () => {
  fetchPositions();
};

// 生成职位代码简写 - 根据职位名称，使用纯英文
const generatePositionCode = (positionName) => {
  if (!positionName || typeof positionName !== 'string') {
    return 'POSITION';
  }
  
  // 从数据库获取的职位映射中查找
  const mapping = positionMappings.value.find(m => m.position_name === positionName);
  if (mapping && mapping.english_code) {
    return mapping.english_code;
  }
  
  // 尝试提取职位中的关键词并组合英文代码（作为备选方案）
  const keywords = {
    '经理': 'MANAGER',
    '总监': 'DIRECTOR',
    '工程师': 'ENGINEER',
    '专员': 'SPECIALIST',
    '主管': 'SUPERVISOR',
    '组长': 'LEAD',
    '顾问': 'CONSULTANT',
    '设计师': 'DESIGNER',
    '程序员': 'PROGRAMMER',
    '助理': 'ASSISTANT',
    '高级': 'SENIOR',
    '首席': 'CHIEF',
    '总': 'CHIEF',
    '副': 'DEPUTY'
  };
  
  // 行业领域关键词
  const industryKeywords = {
    '行政': 'ADMIN',
    '财务': 'FINANCE',
    '人事': 'HR',
    '技术': 'TECHNICAL',
    '销售': 'SALES',
    '市场': 'MARKETING',
    '运营': 'OPERATIONS',
    '研发': 'R&D',
    '生产': 'PRODUCTION',
    '质量': 'QUALITY',
    '安全': 'SAFETY',
    '采购': 'PURCHASING',
    '物流': 'LOGISTICS',
    '客服': 'CUSTOMER_SERVICE',
    '电气': 'ELECTRICAL',
    '机械': 'MECHANICAL',
    '电子': 'ELECTRONIC',
    '软件': 'SOFTWARE',
    '硬件': 'HARDWARE',
    '项目': 'PROJECT'
  };
  
  // 提取行业关键词
  let industryCode = '';
  for (const [key, value] of Object.entries(industryKeywords)) {
    if (positionName.includes(key)) {
      industryCode = value;
      break;
    }
  }
  
  // 提取职位关键词
  let positionCode = '';
  for (const [key, value] of Object.entries(keywords)) {
    if (positionName.includes(key)) {
      positionCode = value;
      break;
    }
  }
  
  // 如果找到了行业和职位关键词，组合成代码
  if (industryCode && positionCode) {
    return `${industryCode}_${positionCode}`;
  } else if (industryCode) {
    return industryCode;
  } else if (positionCode) {
    return positionCode;
  }
  
  // 如果没有匹配的关键词，返回默认代码
  return 'POSITION';
};

// 处理职位名称输入 - 自动生成职位代码
const handlePositionNameInput = (value) => {
  // 只有当职位代码为空时才自动生成
  if (!positionForm.position_code) {
    positionForm.position_code = generatePositionCode(value);
  }
};

// 处理职位代码输入 - 自动转换为大写
const handleCodeInput = (value) => {
  // 将输入转换为大写
  positionForm.position_code = value.toUpperCase();
};

// 新增职位
const handleAdd = () => {
  dialogTitle.value = '新增职位';
  Object.assign(positionForm, {
    id: null,
    position_code: '',
    position_name: '',
    department_id: null,
    position_type: 'common',
    description: '',
    sort_order: 0,
    status: 'active'
  });
  dialogVisible.value = true;
};

// 编辑职位
const handleEdit = (row) => {
  dialogTitle.value = '编辑职位';
  Object.assign(positionForm, {
    id: row.id,
    position_code: row.position_code,
    position_name: row.position_name,
    department_id: row.department_id,
    position_type: row.position_type,
    description: row.description,
    sort_order: row.sort_order,
    status: row.status
  });
  dialogVisible.value = true;
};

// 删除职位 - 同时删除同一部门下相同职位名称的所有职位
const handleDelete = (row) => {
  if (!row || !row.id) {
    ElMessage.error('无效的职位数据');
    return;
  }

  // 查找同一部门下相同职位名称的所有职位
  const samePositionJobs = positionList.value.filter(p => 
    p.department_id === row.department_id && 
    p.position_name === row.position_name
  );
  
  let confirmMessage;
  if (samePositionJobs.length > 1) {
    // 如果有多个相同职位，提示用户将删除所有
    confirmMessage = `找到同一部门下${samePositionJobs.length}个"${row.position_name || ''}"职位。\n确定要删除所有这些职位吗？`;
  } else {
    // 只有一个职位，正常提示
    confirmMessage = `确定要删除职位"${row.position_name || ''}"吗？`;
  }

  ElMessageBox.confirm(
    confirmMessage,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    loading.value = true;
    try {
      // 删除所有同一部门下相同职位名称的职位
      const deletePromises = samePositionJobs.map(job => 
        fetch(`${API_BASE}/positions/${job.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        }).then(res => res.json())
      );
      
      // 等待所有删除请求完成
      const results = await Promise.all(deletePromises);
      
      // 检查是否所有删除都成功
      const allSuccess = results.every(result => result.success);
      
      if (allSuccess) {
        ElMessage.success(samePositionJobs.length > 1 ? `成功删除${samePositionJobs.length}个职位` : '删除成功');
        fetchPositions();
      } else {
        // 收集失败的结果
        const failedResults = results.filter(result => !result.success);
        ElMessage.error(failedResults.length > 0 ? failedResults[0].message || '删除失败' : '删除失败');
      }
    } catch (err) {
      console.error('删除失败:', err);
      ElMessage.error('删除失败');
    } finally {
      loading.value = false;
    }
  }).catch(() => {});
};

// 提交表单
const handleSubmit = async () => {
  if (!positionFormRef.value) return;
  
  await positionFormRef.value.validate(async (valid) => {
    if (!valid) return;
    
    submitting.value = true;
    try {
      const url = positionForm.id 
        ? `${API_BASE}/positions/${positionForm.id}`
        : `${API_BASE}/positions`;
      
      const method = positionForm.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(positionForm)
      });
      
      const result = await response.json();
      
      if (result.success) {
        ElMessage.success(positionForm.id ? '更新成功' : '创建成功');
        dialogVisible.value = false;
        fetchPositions();
      } else {
        ElMessage.error(result.message || '操作失败');
      }
    } catch (err) {
      console.error('操作失败:', err);
      ElMessage.error('操作失败');
    } finally {
      submitting.value = false;
    }
  });
};

// 关闭对话框
const handleDialogClose = () => {
  if (positionFormRef.value) {
    positionFormRef.value.resetFields();
  }
};

// 获取职位类型标签
const getPositionTypeTag = (type) => {
  const tagMap = {
    management: 'warning',
    technical: 'success',
    common: ''
  };
  return tagMap[type] || '';
};

// 获取职位类型文本
const getPositionTypeText = (type) => {
  const textMap = {
    management: '管理职位',
    technical: '技术职位',
    common: '通用职位'
  };
  return textMap[type] || '其他';
};

// 批量更新所有职位的代码
const handleBatchUpdateCodes = () => {
  ElMessageBox.confirm(
    '确定要批量更新所有职位的代码吗？这将根据职位名称重新生成所有职位的代码。',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    loading.value = true;
    try {
      // 获取所有职位数据
      const response = await fetch(`${API_BASE}/positions`);
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        // 批量更新所有职位的代码
      const updatePromises = result.data.map(async (position) => {
        // 生成新的职位代码
        const newCode = generatePositionCode(position.position_name);
        
        // 不比较，直接更新所有职位代码
        const updateResponse = await fetch(`${API_BASE}/positions/${position.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify({
            ...position,
            position_code: newCode
          })
        });
        
        return updateResponse.json();
      });
        
        // 等待所有更新请求完成
        const results = await Promise.all(updatePromises);
        
        // 检查更新结果
        const successCount = results.filter(r => r.success).length;
        const totalCount = results.length;
        
        if (successCount === totalCount) {
          ElMessage.success(`成功更新了${successCount}个职位的代码`);
        } else {
          ElMessage.warning(`更新了${successCount}个职位的代码，${totalCount - successCount}个更新失败`);
        }
        
        // 重新获取职位列表
        fetchPositions();
      }
    } catch (err) {
      console.error('批量更新职位代码失败:', err);
      ElMessage.error('批量更新职位代码失败');
    } finally {
      loading.value = false;
    }
  }).catch(() => {});
};

// 序号生成方法 - 连续编号
const indexMethod = (index) => {
  return index + 1;
};

// 自定义排序：按职位类型显示文本排序
const positionTypeSort = (a, b) => {
  return getPositionTypeText(a.position_type).localeCompare(getPositionTypeText(b.position_type));
};

// 自定义排序：按状态排序（active 在前）
const statusSort = (a, b) => {
  const sa = a.status || '';
  const sb = b.status || '';
  // 希望 active 在前
  if (sa === sb) return 0;
  if (sa === 'active') return -1;
  if (sb === 'active') return 1;
  return sa.localeCompare(sb);
};

// 初始化
onMounted(() => {
  fetchPositions();
  fetchDepartments();
  fetchPositionMappings();
});
</script>

<style scoped>
.position-management {
  padding: 20px;
}

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
  align-items: center;
  margin-bottom: 20px;
}
</style>
