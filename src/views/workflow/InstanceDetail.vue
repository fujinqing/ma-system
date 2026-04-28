<template>
  <div class="instance-detail">
    <div class="page-header">
      <h2 class="page-title">流程实例详情</h2>
      <div class="header-actions">
        <el-button @click="$router.back()" size="small">
          <i class="fa fa-arrow-left"></i> 返回
        </el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card class="instance-info-card">
          <template #header>
            <div class="card-header">
              <span>实例信息</span>
              <el-tag :type="getStatusType(instance.status)">{{ getStatusText(instance.status) }}</el-tag>
            </div>
          </template>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="实例ID">{{ instance.instance_id }}</el-descriptions-item>
            <el-descriptions-item label="流程名称">{{ instance.flow_name }}</el-descriptions-item>
            <el-descriptions-item label="流程编码">{{ instance.flow_code }}</el-descriptions-item>
            <el-descriptions-item label="模块">{{ instance.module_code }}</el-descriptions-item>
            <el-descriptions-item label="业务ID">{{ instance.biz_id }}</el-descriptions-item>
            <el-descriptions-item label="版本">v{{ instance.version_number }}</el-descriptions-item>
            <el-descriptions-item label="发起人">{{ instance.start_user_name }}</el-descriptions-item>
            <el-descriptions-item label="开始时间">{{ instance.start_at }}</el-descriptions-item>
            <el-descriptions-item label="结束时间">{{ instance.end_at || '-' }}</el-descriptions-item>
            <el-descriptions-item label="耗时">{{ getDuration(instance.start_at, instance.end_at) }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="biz-data-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <span>业务数据</span>
            </div>
          </template>
          <el-scrollbar height="300px">
            <pre class="biz-data-content">{{ formatJson(instance.biz_data) }}</pre>
          </el-scrollbar>
        </el-card>

        <el-card class="flow-trace-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <span>流程轨迹</span>
            </div>
          </template>
          <el-steps direction="vertical" :space="80" finish-status="success">
            <el-step v-for="(trace, index) in flowTrace" :key="index" :title="trace.node_name" :description="trace.description">
              <template #icon>
                <div class="step-icon" :class="trace.status">
                  <i :class="getStepIcon(trace.node_type, trace.status)"></i>
                </div>
              </template>
            </el-step>
          </el-steps>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="node-list-card">
          <template #header>
            <div class="card-header">
              <span>节点列表</span>
            </div>
          </template>
          <div class="node-list">
            <div v-for="node in nodeRecords" :key="node.record_id" class="node-item" :class="{ 'active': node.status === 'pending', 'completed': node.status === 'approved', 'rejected': node.status === 'rejected' }">
              <div class="node-header">
                <i :class="getNodeIcon(node.node_type)"></i>
                <span class="node-name">{{ node.node_name }}</span>
                <el-tag size="small" :type="getNodeStatusType(node.status)">{{ getNodeStatusText(node.status) }}</el-tag>
              </div>
              <div class="node-info">
                <p v-if="node.assignee_name"><strong>审批人:</strong> {{ node.assignee_name }}</p>
                <p v-if="node.start_at"><strong>开始时间:</strong> {{ node.start_at }}</p>
                <p v-if="node.finished_at"><strong>完成时间:</strong> {{ node.finished_at }}</p>
                <p v-if="node.action"><strong>操作:</strong> {{ getActionText(node.action) }}</p>
                <p v-if="node.comment" class="comment"><strong>意见:</strong> {{ node.comment }}</p>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="approval-history-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <span>审批历史</span>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item v-for="(history, index) in approvalHistory" :key="index" :timestamp="history.created_at" placement="top">
              <el-card shadow="hover">
                <p><strong>{{ history.user_name }}</strong> {{ getActionText(history.action) }}</p>
                <p v-if="history.comment" class="comment">{{ history.comment }}</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-card>

        <el-card class="actions-card" style="margin-top: 20px;" v-if="instance.status === 'running'">
          <template #header>
            <div class="card-header">
              <span>管理操作</span>
            </div>
          </template>
          <div class="action-buttons">
            <el-button type="danger" size="small" @click="handleTerminate">终止实例</el-button>
            <el-button type="warning" size="small" @click="handleSuspend">暂停实例</el-button>
            <el-button type="success" size="small" @click="handleResume">恢复实例</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'InstanceDetail',
  data() {
    return {
      instanceId: null,
      instance: {},
      nodeRecords: [],
      approvalHistory: [],
      flowTrace: [],
      loading: false
    }
  },
  mounted() {
    this.instanceId = this.$route.params.id
    if (this.instanceId) {
      this.loadInstanceDetail()
    }
  },
  methods: {
    async loadInstanceDetail() {
      this.loading = true
      try {
        const [instanceRes, logsRes] = await Promise.all([
          fetch(`/api/workflow/instances/${this.instanceId}`),
          fetch(`/api/workflow/instances/${this.instanceId}/logs`)
        ])
        const instanceData = await instanceRes.json()
        const logsData = await logsRes.json()

        if (instanceData.success) {
          this.instance = instanceData.data || {}
          this.nodeRecords = instanceData.data?.node_records || []
          this.approvalHistory = instanceData.data?.approval_history || []
          this.buildFlowTrace()
        }

        if (logsData.success) {
          this.buildTraceFromLogs(logsData.data || [])
        }
      } catch (error) {
        console.error('Load instance detail error:', error)
        ElMessage.error('加载实例详情失败')
      } finally {
        this.loading = false
      }
    },
    buildFlowTrace() {
      if (!this.instance.current_config?.nodes) return

      const nodes = this.instance.current_config.nodes
      const nodeRecordsMap = {}
      this.nodeRecords.forEach(record => {
        nodeRecordsMap[record.node_code] = record
      })

      this.flowTrace = nodes.map(node => {
        const record = nodeRecordsMap[node.node_code] || {}
        return {
          node_code: node.node_code,
          node_name: node.node_name || node.label,
          node_type: node.node_type,
          status: record.status || (node.is_start ? 'approved' : 'waiting'),
          assignee_name: record.assignee_name,
          start_at: record.start_at,
          finished_at: record.finished_at,
          action: record.action,
          comment: record.comment,
          description: this.getTraceDescription(record)
        }
      })
    },
    buildTraceFromLogs(logs) {
      logs.forEach(log => {
        const traceIndex = this.flowTrace.findIndex(t => t.node_code === log.node_code)
        if (traceIndex !== -1) {
          this.flowTrace[traceIndex].description += `\n[${log.log_level}] ${log.message}`
        }
      })
    },
    getTraceDescription(record) {
      if (record.status === 'approved') {
        return `${record.assignee_name || '系统'} 已通过`
      }
      if (record.status === 'rejected') {
        return `${record.assignee_name || '系统'} 已驳回 - ${record.comment || ''}`
      }
      if (record.status === 'pending') {
        return `等待 ${record.assignee_name || '未知审批人'} 处理`
      }
      return ''
    },
    getStatusType(status) {
      const types = {
        running: 'primary',
        completed: 'success',
        rejected: 'danger',
        terminated: 'info',
        suspended: 'warning'
      }
      return types[status] || 'info'
    },
    getStatusText(status) {
      const texts = {
        running: '进行中',
        completed: '已完成',
        rejected: '已驳回',
        terminated: '已终止',
        suspended: '已暂停'
      }
      return texts[status] || status
    },
    getDuration(startAt, endAt) {
      if (!startAt) return '-'
      const start = new Date(startAt)
      const end = endAt ? new Date(endAt) : new Date()
      const diff = Math.floor((end - start) / 1000)

      if (diff < 60) return `${diff}秒`
      if (diff < 3600) return `${Math.floor(diff / 60)}分钟`
      if (diff < 86400) return `${Math.floor(diff / 3600)}小时${Math.floor((diff % 3600) / 60)}分钟`
      return `${Math.floor(diff / 86400)}天${Math.floor((diff % 86400) / 3600)}小时`
    },
    formatJson(data) {
      if (!data) return '{}'
      if (typeof data === 'string') {
        try {
          return JSON.stringify(JSON.parse(data), null, 2)
        } catch {
          return data
        }
      }
      return JSON.stringify(data, null, 2)
    },
    getNodeIcon(type) {
      const icons = {
        start: 'fa fa-play',
        approval_single: 'fa fa-user',
        approval_multi: 'fa fa-users',
        condition: 'fa fa-code-fork',
        action: 'fa fa-cog',
        notify: 'fa fa-bell',
        end: 'fa fa-flag-checkered'
      }
      return icons[type] || 'fa fa-circle'
    },
    getStepIcon(type, status) {
      if (status === 'approved') return 'fa fa-check'
      if (status === 'rejected') return 'fa fa-times'
      if (status === 'pending') return 'fa fa-clock-o'
      return this.getNodeIcon(type)
    },
    getNodeStatusType(status) {
      const types = {
        pending: 'warning',
        approved: 'success',
        rejected: 'danger',
        skipped: 'info'
      }
      return types[status] || 'info'
    },
    getNodeStatusText(status) {
      const texts = {
        pending: '待处理',
        approved: '已通过',
        rejected: '已驳回',
        skipped: '已跳过'
      }
      return texts[status] || status
    },
    getActionText(action) {
      const texts = {
        approve: '审批通过',
        reject: '审批驳回',
        transfer: '已转交',
        consult: '征询意见',
        'add-sign': '已加签',
        submit: '提交',
        start: '启动',
        timeout: '超时自动通过',
        system: '系统操作'
      }
      return texts[action] || action
    },
    async handleTerminate() {
      try {
        await ElMessageBox.confirm('确定要终止这个流程实例吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        await fetch(`/api/workflow/instances/${this.instanceId}/terminate`, { method: 'POST' })
        ElMessage.success('实例已终止')
        this.loadInstanceDetail()
      } catch (error) {
        if (error !== 'cancel') ElMessage.error('终止失败')
      }
    },
    async handleSuspend() {
      try {
        await ElMessageBox.confirm('确定要暂停这个流程实例吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        ElMessage.success('实例已暂停')
        this.loadInstanceDetail()
      } catch (error) {
        if (error !== 'cancel') ElMessage.error('操作失败')
      }
    },
    async handleResume() {
      try {
        ElMessage.success('实例已恢复')
        this.loadInstanceDetail()
      } catch (error) {
        ElMessage.error('操作失败')
      }
    }
  }
}
</script>

<style scoped>
.instance-detail {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.biz-data-content {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.6;
  overflow-x: auto;
}

.step-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
}

.step-icon.approved { background: #67c23a; }
.step-icon.rejected { background: #f56c6c; }
.step-icon.pending { background: #e6a23c; }
.step-icon.waiting { background: #909399; }

.node-list {
  max-height: 400px;
  overflow-y: auto;
}

.node-item {
  padding: 12px;
  border-bottom: 1px solid #ebeef5;
  transition: all 0.3s;
}

.node-item:last-child {
  border-bottom: none;
}

.node-item.active {
  background: #f0f9eb;
  border-left: 3px solid #67c23a;
}

.node-item.completed {
  background: #f5f7fa;
}

.node-item.rejected {
  background: #fef0f0;
  border-left: 3px solid #f56c6c;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.node-header i {
  color: #409eff;
}

.node-name {
  font-weight: 600;
  flex: 1;
}

.node-info p {
  margin: 4px 0;
  font-size: 13px;
  color: #666;
}

.node-info .comment {
  color: #909399;
  font-style: italic;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-buttons .el-button {
  width: 100%;
}
</style>
