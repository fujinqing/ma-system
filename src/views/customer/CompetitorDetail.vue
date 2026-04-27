<template>
  <div class="competitor-detail">
    <div class="page-header">
      <h2 class="page-title">竞争对手详情</h2>
      <el-button type="primary" @click="goBack">返回列表</el-button>
    </div>

    <div class="detail-container" v-loading="loading">
      <el-card shadow="hover">
        <template #header>
          <div class="card-header">
            <h3>{{ competitor.name }}</h3>
            <div class="header-actions">
              <el-button type="success" @click="editCompetitor">编辑</el-button>
              <el-button type="danger" @click="deleteCompetitor">删除</el-button>
            </div>
          </div>
        </template>

        <div class="detail-content">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-descriptions :column="1" border>
                <el-descriptions-item label="公司名称">{{ competitor.company }}</el-descriptions-item>
                <el-descriptions-item label="所属行业">{{ getIndustryText(competitor.industry) }}</el-descriptions-item>
                <el-descriptions-item label="竞争强度">
                  <el-tag :type="getStrengthTag(competitor.strength)">{{ getStrengthText(competitor.strength) }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="市场份额">{{ competitor.market_share }}%</el-descriptions-item>
                <el-descriptions-item label="成立时间">{{ formatDate(competitor.founded_date) }}</el-descriptions-item>
                <el-descriptions-item label="联系方式">{{ competitor.contact_info || '-' }}</el-descriptions-item>
              </el-descriptions>
            </el-col>
          </el-row>

          <div class="detail-section">
            <h4>主要产品</h4>
            <p>{{ competitor.key_products || '-' }}</p>
          </div>

          <div class="detail-section">
            <h4>核心优势</h4>
            <p>{{ competitor.core_advantages || '-' }}</p>
          </div>

          <div class="detail-section">
            <h4>劣势</h4>
            <p>{{ competitor.disadvantages || '-' }}</p>
          </div>

          <div class="detail-section">
            <h4>市场策略</h4>
            <p>{{ competitor.market_strategy || '-' }}</p>
          </div>

          <div class="detail-section">
            <h4>备注</h4>
            <p>{{ competitor.remarks || '-' }}</p>
          </div>

          <div class="detail-section">
            <h4>创建信息</h4>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="创建时间">{{ formatDate(competitor.created_at) }}</el-descriptions-item>
              <el-descriptions-item label="更新时间">{{ formatDate(competitor.updated_at) }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import api from '@/api'

export default {
  name: 'CompetitorDetail',
  data() {
    return {
      competitor: {},
      loading: false,
      industries: [
        { label: '3C', value: '3c' },
        { label: '光伏', value: 'photovoltaic' },
        { label: '新能源', value: 'new_energy' },
        { label: '汽配', value: 'auto_parts' },
        { label: '医疗', value: 'medical' },
        { label: '食品', value: 'food' },
        { label: '其他', value: 'other' }
      ]
    }
  },
  mounted() {
    const id = this.$route.params.id
    if (id) {
      this.loadCompetitor(id)
    }
  },
  methods: {
    async loadCompetitor(id) {
      this.loading = true
      try {
        const response = await api.getCompetitor(id)
        if (response.success) {
          this.competitor = response.data
        } else {
          this.$message.error(response.message || '获取竞争对手信息失败')
        }
      } catch (error) {
        console.error('获取竞争对手信息异常:', error)
        this.$message.error('获取竞争对手信息失败')
      } finally {
        this.loading = false
      }
    },
    goBack() {
      this.$router.push('/crm/competitors')
    },
    editCompetitor() {
      this.$router.push(`/crm/competitors/edit/${this.competitor.id}`)
    },
    async deleteCompetitor() {
      try {
        await this.$confirm('确定要删除此竞争对手吗？此操作不可恢复。', '删除确认', {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning'
        })
        const response = await api.deleteCompetitor(this.competitor.id)
        if (response.success) {
          this.$message.success('删除成功')
          this.goBack()
        } else {
          this.$message.error(response.message || '删除失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除竞争对手失败:', error)
          this.$message.error('删除竞争对手失败')
        }
      }
    },
    getIndustryText(industry) {
      const industryMap = {
        '3c': '3C',
        'photovoltaic': '光伏',
        'new_energy': '新能源',
        'auto_parts': '汽配',
        'medical': '医疗',
        'food': '食品',
        'other': '其他'
      }
      return industryMap[industry] || industry
    },
    getStrengthText(strength) {
      const strengthMap = {
        'low': '低',
        'medium': '中',
        'high': '高'
      }
      return strengthMap[strength] || strength
    },
    getStrengthTag(strength) {
      const tagMap = {
        'low': 'success',
        'medium': 'warning',
        'high': 'danger'
      }
      return tagMap[strength] || 'info'
    },
    formatDate(date) {
      if (!date) return '-' 
      return new Date(date).toLocaleString()
    }
  }
}
</script>

<style scoped>
.competitor-detail {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
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
  color: #303133;
  margin: 0;
}

.detail-container {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.detail-content {
  margin-top: 20px;
}

.detail-section {
  margin-top: 24px;
}

.detail-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.detail-section p {
  margin: 0;
  line-height: 1.5;
  color: #606266;
}
</style>