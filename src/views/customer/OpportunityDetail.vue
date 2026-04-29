<template>
  <div class="opportunity-detail">
    <div class="page-header">
      <h2 class="page-title">商机详情</h2>
      <div class="header-actions">
        <el-button @click="goBack">返回</el-button>
        <el-button type="primary" @click="editOpportunity">编辑</el-button>
      </div>
    </div>

    <div v-loading="loading">
      <el-card v-if="opportunity" class="detail-card">
        <template #header>
          <div class="card-header">
            <span>基本信息</span>
            <el-tag :type="getStageType(opportunity.stage)">{{ opportunity.stage_name || opportunity.stage }}</el-tag>
          </div>
        </template>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="商机编码">{{ opportunity.opportunity_code }}</el-descriptions-item>
          <el-descriptions-item label="商机名称">{{ opportunity.name }}</el-descriptions-item>
          <el-descriptions-item label="关联客户">
            <el-link type="primary" @click="viewCustomer(opportunity.customer_id)">
              {{ opportunity.customer_name }} ({{ opportunity.customer_code }})
            </el-link>
          </el-descriptions-item>
          <el-descriptions-item label="负责人">{{ opportunity.sales_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag size="small" :type="getPriorityType(opportunity.priority)">
              {{ getPriorityText(opportunity.priority) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="预期签约日期">
            {{ opportunity.expected_signing_date || '-' }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card v-if="opportunity" class="detail-card">
        <template #header>
          <div class="card-header">
            <span>商务信息</span>
          </div>
        </template>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="预算金额">{{ opportunity.budget_amount ? opportunity.budget_amount.toFixed(2) + ' 万' : '-' }}</el-descriptions-item>
          <el-descriptions-item label="交付周期">{{ opportunity.delivery_cycle ? opportunity.delivery_cycle + ' 天' : '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ opportunity.contact_person || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ opportunity.contact_phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系邮箱">{{ opportunity.contact_email || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-section">
          <div class="section-label">设备需求</div>
          <div class="section-content">{{ opportunity.equipment_requirements || '暂无' }}</div>
        </div>

        <div class="detail-section">
          <div class="section-label">产能情况</div>
          <div class="section-content">{{ opportunity.production_capacity || '暂无' }}</div>
        </div>
      </el-card>

      <el-card v-if="opportunity" class="detail-card">
        <template #header>
          <div class="card-header">
            <span>竞争信息</span>
          </div>
        </template>

        <el-descriptions :column="1" border>
          <el-descriptions-item label="主要竞争对手">{{ opportunity.competitor_info || '-' }}</el-descriptions-item>
          <el-descriptions-item label="我方优势">{{ opportunity.competitor_advantage || '-' }}</el-descriptions-item>
          <el-descriptions-item label="我方劣势">{{ opportunity.competitor_disadvantage || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card v-if="opportunity && (opportunity.lost_reason || opportunity.lost_competitor)" class="detail-card">
        <template #header>
          <div class="card-header">
            <span>丢单信息</span>
          </div>
        </template>

        <el-descriptions :column="1" border>
          <el-descriptions-item label="丢单原因">{{ opportunity.lost_reason || '-' }}</el-descriptions-item>
          <el-descriptions-item label="丢单竞争对手">{{ opportunity.lost_competitor || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card v-if="opportunity" class="detail-card">
        <template #header>
          <div class="card-header">
            <span>其他信息</span>
          </div>
        </template>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="创建时间">{{ formatDate(opportunity.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDate(opportunity.updated_at) }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-section">
          <div class="section-label">备注</div>
          <div class="section-content">{{ opportunity.remarks || '暂无' }}</div>
        </div>
      </el-card>

      <el-card v-if="opportunity" class="detail-card">
        <template #header>
          <div class="card-header">
            <span>阶段变更记录</span>
          </div>
        </template>

        <el-timeline>
          <el-timeline-item
            v-for="(item, index) in stageHistory"
            :key="index"
            :timestamp="item.date"
            :type="item.type"
          >
            <p><strong>{{ item.stage_name }}</strong></p>
            <p v-if="item.note">{{ item.note }}</p>
          </el-timeline-item>
        </el-timeline>
      </el-card>
    </div>
  </div>
</template>

<script>
import api from '@/api'

export default {
  name: 'OpportunityDetail',
  data() {
    return {
      opportunityId: null,
      loading: false,
      opportunity: null,
      stageHistory: []
    }
  },
  mounted() {
    this.opportunityId = this.$route.params.id
    this.loadOpportunity()
  },
  methods: {
    async loadOpportunity() {
      this.loading = true
      try {
        const response = await api.getOpportunity(this.opportunityId)
        if (response && response.success) {
          this.opportunity = response.data
          this.buildStageHistory()
        } else {
          this.$message.error('获取商机详情失败')
        }
      } catch (error) {
        console.warn('获取商机详情失败:', error)
        this.$message.error('获取商机详情失败')
      } finally {
        this.loading = false
      }
    },
    buildStageHistory() {
      const stageNames = {
        'initial_contact': '初步接洽',
        'requirements': '需求确认',
        'quotation': '方案报价',
        'technical_review': '技术评审',
        'business_negotiation': '商务谈判',
        'won': '成交',
        'lost': '丢单'
      }

      const typeMap = {
        'initial_contact': 'primary',
        'requirements': 'primary',
        'quotation': 'warning',
        'technical_review': 'warning',
        'business_negotiation': 'warning',
        'won': 'success',
        'lost': 'danger'
      }

      this.stageHistory = [
        {
          date: this.formatDate(this.opportunity.created_at),
          stage_name: stageNames[this.opportunity.stage] || this.opportunity.stage,
          type: typeMap[this.opportunity.stage] || 'primary'
        }
      ]

      if (this.opportunity.stage === 'lost' && this.opportunity.lost_reason) {
        this.stageHistory.push({
          date: this.formatDate(this.opportunity.updated_at),
          stage_name: '丢单',
          note: `原因: ${this.opportunity.lost_reason}`,
          type: 'danger'
        })
      }

      if (this.opportunity.stage === 'won') {
        this.stageHistory.push({
          date: this.formatDate(this.opportunity.updated_at),
          stage_name: '成交',
          type: 'success'
        })
      }
    },
    editOpportunity() {
      this.$router.push(`/crm/opportunities/edit/${this.opportunityId}`)
    },
    viewCustomer(customerId) {
      this.$router.push(`/crm/detail/${customerId}`)
    },
    goBack() {
      this.$router.push('/crm/opportunities')
    },
    getStageType(stage) {
      const typeMap = {
        'initial_contact': 'info',
        'requirements': 'primary',
        'quotation': 'warning',
        'technical_review': 'warning',
        'business_negotiation': 'warning',
        'won': 'success',
        'lost': 'danger'
      }
      return typeMap[stage] || 'info'
    },
    getPriorityType(priority) {
      const typeMap = {
        'urgent': 'danger',
        'important': 'warning',
        'normal': 'primary',
        'low': 'info'
      }
      return typeMap[priority] || 'primary'
    },
    getPriorityText(priority) {
      const textMap = {
        'urgent': '紧急',
        'important': '重要',
        'normal': '普通',
        'low': '低'
      }
      return textMap[priority] || priority || '普通'
    },
    formatDate(date) {
      if (!date) return '-'
      const d = new Date(date)
      return d.toLocaleString('zh-CN')
    }
  }
}
</script>

<style scoped>
.opportunity-detail {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.detail-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-section {
  margin-top: 15px;
}

.section-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
}

.section-content {
  font-size: 14px;
  color: #303133;
  line-height: 1.6;
}

.header-actions {
  display: flex;
  gap: 10px;
}
</style>
