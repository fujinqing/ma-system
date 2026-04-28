<template>
  <div class="test-management">
    <div class="page-header">
      <h2 class="page-title">测试管理</h2>
      <div class="header-actions">
        <el-select v-model="filterStatus" placeholder="流程状态" clearable size="small" style="width: 120px; margin-right: 10px;">
          <el-option label="全部" value=""></el-option>
          <el-option label="草稿" value="draft"></el-option>
          <el-option label="启用" value="active"></el-option>
          <el-option label="停用" value="disabled"></el-option>
        </el-select>
        <el-input v-model="searchKeyword" placeholder="搜索流程名称" size="small" style="width: 200px; margin-right: 10px;">
          <template #prefix><i class="el-icon-search"></i></template>
        </el-input>
      </div>
    </div>

    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="测试流程" name="test-flows">
        <div class="test-flow-list">
          <div class="flow-summary">
            <el-row :gutter="20">
              <el-col :span="6">
                <div class="summary-card">
                  <div class="summary-icon"><i class="fa fa-stream"></i></div>
                  <div class="summary-content">
                    <div class="summary-value">{{ totalFlows }}</div>
                    <div class="summary-label">可用流程</div>
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="summary-card">
                  <div class="summary-icon success"><i class="fa fa-check-circle"></i></div>
                  <div class="summary-content">
                    <div class="summary-value">{{ activeFlows }}</div>
                    <div class="summary-label">启用流程</div>
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="summary-card">
                  <div class="summary-icon warning"><i class="fa fa-spinner"></i></div>
                  <div class="summary-content">
                    <div class="summary-value">{{ runningInstances }}</div>
                    <div class="summary-label">进行中</div>
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="summary-card">
                  <div class="summary-icon info"><i class="fa fa-check-double"></i></div>
                  <div class="summary-content">
                    <div class="summary-value">{{ completedInstances }}</div>
                    <div class="summary-label">已完成</div>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>

          <el-table :data="filteredFlows" border stripe size="small" v-loading="loading">
            <el-table-column prop="flow_code" label="流程编码" width="150"></el-table-column>
            <el-table-column prop="flow_name" label="流程名称" min-width="180">
              <template #default="{ row }">
                <el-link type="primary" @click="viewFlowDetail(row)">{{ row.flow_name }}</el-link>
              </template>
            </el-table-column>
            <el-table-column prop="flow_desc" label="流程描述" min-width="200" show-overflow-tooltip></el-table-column>
            <el-table-column prop="version" label="版本" width="80">
              <template #default="{ row }">
                <el-tag type="info" size="small">v{{ row.current_version || 1 }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.status === 'active'" type="success" size="small">启用</el-tag>
                <el-tag v-else-if="row.status === 'draft'" type="info" size="small">草稿</el-tag>
                <el-tag v-else type="danger" size="small">停用</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="160"></el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="startTestFlow(row)">发起测试</el-button>
                <el-button type="success" size="small" link @click="viewTestHistory(row)">历史记录</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="测试历史" name="test-history">
        <div class="test-history">
          <el-form :inline="true" size="small" class="search-form">
            <el-form-item label="流程名称">
              <el-input v-model="historyFilter.flow_name" placeholder="流程名称" style="width: 150px;"></el-input>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="historyFilter.status" placeholder="全部" clearable style="width: 120px;">
                <el-option label="进行中" value="running"></el-option>
                <el-option label="已完成" value="completed"></el-option>
                <el-option label="已驳回" value="rejected"></el-option>
                <el-option label="已终止" value="terminated"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="historyFilter.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                style="width: 240px;"
              ></el-date-picker>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadTestHistory">查询</el-button>
              <el-button @click="resetHistoryFilter">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="testHistoryList" border stripe size="small" v-loading="historyLoading">
            <el-table-column prop="instance_id" label="实例ID" width="120"></el-table-column>
            <el-table-column prop="flow_name" label="流程名称" min-width="150"></el-table-column>
            <el-table-column prop="flow_code" label="流程编码" width="150"></el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.status === 'running'" type="warning" size="small">进行中</el-tag>
                <el-tag v-else-if="row.status === 'completed'" type="success" size="small">已完成</el-tag>
                <el-tag v-else-if="row.status === 'rejected'" type="danger" size="small">已驳回</el-tag>
                <el-tag v-else type="info" size="small">已终止</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="initiator" label="发起人" width="100"></el-table-column>
            <el-table-column prop="start_at" label="开始时间" width="160"></el-table-column>
            <el-table-column prop="end_at" label="结束时间" width="160">
              <template #default="{ row }">
                {{ row.end_at || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="viewInstanceDetail(row)">详情</el-button>
                <el-button v-if="row.status === 'running'" type="danger" size="small" link @click="terminateInstance(row)">终止</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination">
            <el-pagination
              v-model:current-page="historyPage"
              v-model:page-size="historyPageSize"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next"
              :total="historyTotal"
              @size-change="handleHistorySizeChange"
              @current-change="handleHistoryPageChange"
            ></el-pagination>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="startFlowDialogVisible" title="发起测试流程" width="600px" destroy-on-close>
      <el-form :model="testFlowForm" :rules="testFlowRules" ref="testFlowFormRef" label-width="100px">
        <el-form-item label="流程名称">
          <el-input v-model="testFlowForm.flow_name" disabled></el-input>
        </el-form-item>
        <el-form-item label="流程编码">
          <el-input v-model="testFlowForm.flow_code" disabled></el-input>
        </el-form-item>
        <el-form-item label="测试备注" prop="test_remark">
          <el-input v-model="testFlowForm.test_remark" type="textarea" :rows="3" placeholder="请输入测试备注（可选）"></el-input>
        </el-form-item>
        <el-form-item label="测试数据" prop="test_data">
          <el-input v-model="testFlowForm.test_data" type="textarea" :rows="4" placeholder="请输入JSON格式的测试数据（可选）"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="startFlowDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitTestFlow" :loading="submitLoading">确认发起</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="historyDetailDialogVisible" title="测试历史详情" width="900px" destroy-on-close>
      <div v-if="currentInstance" class="instance-detail">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="实例ID">{{ currentInstance.instance_id }}</el-descriptions-item>
          <el-descriptions-item label="流程名称">{{ currentInstance.flow_name }}</el-descriptions-item>
          <el-descriptions-item label="流程编码">{{ currentInstance.flow_code }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag v-if="currentInstance.status === 'running'" type="warning">进行中</el-tag>
            <el-tag v-else-if="currentInstance.status === 'completed'" type="success">已完成</el-tag>
            <el-tag v-else-if="currentInstance.status === 'rejected'" type="danger">已驳回</el-tag>
            <el-tag v-else type="info">已终止</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发起人">{{ currentInstance.initiator || '-' }}</el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ currentInstance.start_at }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ currentInstance.end_at || '-' }}</el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">审批进度</el-divider>

        <el-timeline v-if="instanceTimeline.length">
          <el-timeline-item v-for="(item, index) in instanceTimeline" :key="index" :timestamp="item.created_at" :type="getTimelineItemType(item.status)">
            <div class="timeline-content">
              <div class="timeline-node">{{ item.node_name || item.node_code }}</div>
              <div class="timeline-approver">{{ item.approver_name || item.approver || '-' }}</div>
              <div class="timeline-status">
                <el-tag v-if="item.status === 'pending'" type="warning" size="small">待处理</el-tag>
                <el-tag v-else-if="item.status === 'approved'" type="success" size="small">已通过</el-tag>
                <el-tag v-else-if="item.status === 'rejected'" type="danger" size="small">已驳回</el-tag>
                <el-tag v-else-if="item.status === 'skipped'" type="info" size="small">已跳过</el-tag>
              </div>
              <div class="timeline-comment" v-if="item.comment">备注：{{ item.comment }}</div>
            </div>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无审批记录"></el-empty>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'

export default {
  name: 'TestManagement',
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const historyLoading = ref(false)
    const submitLoading = ref(false)
    const activeTab = ref('test-flows')
    const searchKeyword = ref('')
    const filterStatus = ref('')
    const flows = ref([])
    const testHistoryList = ref([])
    const historyPage = ref(1)
    const historyPageSize = ref(10)
    const historyTotal = ref(0)
    const instanceTimeline = ref([])

    const startFlowDialogVisible = ref(false)
    const historyDetailDialogVisible = ref(false)
    const currentInstance = ref(null)

    const testFlowFormRef = ref(null)
    const testFlowForm = reactive({
      flow_id: '',
      flow_code: '',
      flow_name: '',
      test_remark: '',
      test_data: ''
    })

    const testFlowRules = {
      test_data: [
        { validator: (rule, value, callback) => {
          if (value && !value.trim()) {
            callback(new Error('测试数据不能为空'))
          } else if (value) {
            try {
              if (value.trim()) {
                JSON.parse(value)
              }
              callback()
            } catch (e) {
              callback(new Error('请输入有效的JSON格式'))
            }
          } else {
            callback()
          }
        }, trigger: 'blur' }
      ]
    }

    const historyFilter = reactive({
      flow_name: '',
      status: '',
      dateRange: null
    })

    const totalFlows = computed(() => flows.value.length)
    const activeFlows = computed(() => flows.value.filter(f => f.status === 'active').length)
    const runningInstances = ref(0)
    const completedInstances = ref(0)

    const filteredFlows = computed(() => {
      let result = flows.value
      if (searchKeyword.value) {
        const keyword = searchKeyword.value.toLowerCase()
        result = result.filter(f => 
          f.flow_name.toLowerCase().includes(keyword) ||
          f.flow_code.toLowerCase().includes(keyword)
        )
      }
      if (filterStatus.value) {
        result = result.filter(f => f.status === filterStatus.value)
      }
      return result
    })

    const loadFlows = async () => {
      loading.value = true
      try {
        const response = await fetch('/api/workflow/flows?module_code=TEST_MANAGEMENT', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          flows.value = data.flows || data.data || []
        } else {
          flows.value = []
        }
      } catch (error) {
        console.error('加载流程失败:', error)
        flows.value = []
      } finally {
        loading.value = false
      }
    }

    const loadTestHistory = async () => {
      historyLoading.value = true
      try {
        const params = new URLSearchParams({
          page: historyPage.value,
          page_size: historyPageSize.value,
          module_code: 'TEST_MANAGEMENT'
        })
        if (historyFilter.flow_name) {
          params.append('flow_name', historyFilter.flow_name)
        }
        if (historyFilter.status) {
          params.append('status', historyFilter.status)
        }
        if (historyFilter.dateRange && historyFilter.dateRange.length === 2) {
          params.append('start_date', historyFilter.dateRange[0].toISOString().split('T')[0])
          params.append('end_date', historyFilter.dateRange[1].toISOString().split('T')[0])
        }

        const response = await fetch(`/api/workflow/instances?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          testHistoryList.value = data.instances || data.data || []
          historyTotal.value = data.total || testHistoryList.value.length
        } else {
          testHistoryList.value = []
          historyTotal.value = 0
        }
      } catch (error) {
        console.error('加载测试历史失败:', error)
        testHistoryList.value = []
        historyTotal.value = 0
      } finally {
        historyLoading.value = false
      }
    }

    const loadInstanceStats = async () => {
      try {
        runningInstances.value = 0
        completedInstances.value = 0
      } catch (error) {
        console.error('加载统计数据失败:', error)
      }
    }

    const startTestFlow = (row) => {
      testFlowForm.flow_id = row.flow_id || row.id
      testFlowForm.flow_code = row.flow_code
      testFlowForm.flow_name = row.flow_name
      testFlowForm.test_remark = ''
      testFlowForm.test_data = ''
      startFlowDialogVisible.value = true
    }

    const submitTestFlow = async () => {
      try {
        await testFlowFormRef.value.validate()
      } catch (e) {
        return
      }

      submitLoading.value = true
      try {
        let testData = null
        if (testFlowForm.test_data && testFlowForm.test_data.trim()) {
          try {
            testData = JSON.parse(testFlowForm.test_data)
          } catch (e) {
            ElMessage.error('测试数据JSON格式不正确')
            return
          }
        }

        const response = await fetch('/api/workflow/instances', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            flow_id: testFlowForm.flow_id,
            flow_code: testFlowForm.flow_code,
            module_code: 'TEST_MANAGEMENT',
            biz_id: `TEST_${Date.now()}`,
            test_mode: true,
            test_remark: testFlowForm.test_remark,
            test_data: testData
          })
        })

        if (response.ok) {
          ElMessage.success('测试流程发起成功')
          startFlowDialogVisible.value = false
          loadFlows()
          loadInstanceStats()
          activeTab.value = 'test-history'
          loadTestHistory()
        } else {
          const error = await response.json()
          ElMessage.error(error.message || '发起测试流程失败')
        }
      } catch (error) {
        console.error('发起测试流程失败:', error)
        ElMessage.error('发起测试流程失败')
      } finally {
        submitLoading.value = false
      }
    }

    const viewFlowDetail = (row) => {
      router.push(`/setting/flow?highlight=${row.flow_id || row.id}`)
    }

    const viewTestHistory = (row) => {
      historyFilter.flow_name = row.flow_name
      activeTab.value = 'test-history'
      loadTestHistory()
    }

    const viewInstanceDetail = async (row) => {
      currentInstance.value = row
      instanceTimeline.value = []
      
      try {
        const response = await fetch(`/api/workflow/instances/${row.instance_id}/timeline`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          instanceTimeline.value = data.timeline || data.data || []
        }
      } catch (error) {
        console.error('加载实例详情失败:', error)
      }
      
      historyDetailDialogVisible.value = true
    }

    const terminateInstance = async (row) => {
      try {
        await ElMessageBox.confirm('确定要终止该流程实例吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })

        const response = await fetch(`/api/workflow/instances/${row.instance_id}/terminate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        if (response.ok) {
          ElMessage.success('流程实例已终止')
          loadTestHistory()
          loadInstanceStats()
        } else {
          ElMessage.error('终止失败')
        }
      } catch (e) {
        if (e !== 'cancel') {
          console.error('终止流程实例失败:', e)
          ElMessage.error('终止失败')
        }
      }
    }

    const handleTabChange = (tab) => {
      if (tab === 'test-history') {
        loadTestHistory()
      }
    }

    const resetHistoryFilter = () => {
      historyFilter.flow_name = ''
      historyFilter.status = ''
      historyFilter.dateRange = null
      historyPage.value = 1
      loadTestHistory()
    }

    const handleHistorySizeChange = (size) => {
      historyPageSize.value = size
      loadTestHistory()
    }

    const handleHistoryPageChange = (page) => {
      historyPage.value = page
      loadTestHistory()
    }

    const getTimelineItemType = (status) => {
      const typeMap = {
        'pending': 'warning',
        'approved': 'success',
        'rejected': 'danger',
        'skipped': 'info'
      }
      return typeMap[status] || 'info'
    }

    onMounted(() => {
      loadFlows()
      loadInstanceStats()
    })

    return {
      loading,
      historyLoading,
      submitLoading,
      activeTab,
      searchKeyword,
      filterStatus,
      flows,
      filteredFlows,
      totalFlows,
      activeFlows,
      runningInstances,
      completedInstances,
      testHistoryList,
      historyPage,
      historyPageSize,
      historyTotal,
      historyFilter,
      instanceTimeline,
      startFlowDialogVisible,
      historyDetailDialogVisible,
      currentInstance,
      testFlowFormRef,
      testFlowForm,
      testFlowRules,
      loadFlows,
      loadTestHistory,
      startTestFlow,
      submitTestFlow,
      viewFlowDetail,
      viewTestHistory,
      viewInstanceDetail,
      terminateInstance,
      handleTabChange,
      resetHistoryFilter,
      handleHistorySizeChange,
      handleHistoryPageChange,
      getTimelineItemType
    }
  }
}
</script>

<style scoped>
.test-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
}

.flow-summary {
  margin-bottom: 20px;
}

.summary-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.summary-icon {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  background: #165DFF;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 15px;
}

.summary-icon.success {
  background: #67C23A;
}

.summary-icon.warning {
  background: #E6A23C;
}

.summary-icon.info {
  background: #909399;
}

.summary-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.summary-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.search-form {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.timeline-content {
  padding: 5px 0;
}

.timeline-node {
  font-weight: 600;
  color: #303133;
}

.timeline-approver {
  color: #606266;
  margin-top: 4px;
}

.timeline-status {
  margin-top: 4px;
}

.timeline-comment {
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
}
</style>
