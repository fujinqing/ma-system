<template>
  <div class="competitor-management">
    <div class="page-header">
      <h2 class="page-title">竞争对手管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="addCompetitor">
          <i class="fa fa-plus"></i> 新建竞争对手
        </el-button>
      </div>
    </div>

    <div class="search-filter-bar">
      <el-input
        v-model="filters.keyword"
        placeholder="输入竞争对手名称或公司"
        class="search-input"
        @keyup.enter="handleSearch"
      >
        <template #append>
          <el-button @click="handleSearch">
            <i class="fa fa-search"></i>
          </el-button>
        </template>
      </el-input>
      <el-select v-model="filters.industry" placeholder="所属行业" clearable @change="handleSearch">
        <el-option v-for="industry in industries" :key="industry.value" :label="industry.label" :value="industry.value"></el-option>
      </el-select>
      <el-select v-model="filters.strength" placeholder="竞争强度" clearable @change="handleSearch">
        <el-option label="低" value="low"></el-option>
        <el-option label="中" value="medium"></el-option>
        <el-option label="高" value="high"></el-option>
      </el-select>
    </div>

    <div class="table-container">
      <el-table :data="competitors" v-loading="loading" border stripe style="width: 100%;">
        <el-table-column prop="name" label="竞争对手名称" min-width="180"></el-table-column>
        <el-table-column prop="company" label="公司名称" width="180"></el-table-column>
        <el-table-column prop="industry" label="所属行业" width="120">
          <template #default="scope">
            <span>{{ getIndustryText(scope.row.industry) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="strength" label="竞争强度" width="100">
          <template #default="scope">
            <el-tag :type="getStrengthTag(scope.row.strength)">{{ getStrengthText(scope.row.strength) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="market_share" label="市场份额" width="100">
          <template #default="scope">
            <span>{{ scope.row.market_share }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="key_products" label="主要产品" min-width="200" show-overflow-tooltip></el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" link @click="viewCompetitor(scope.row.id)">详情</el-button>
            <el-button type="success" size="small" link @click="editCompetitor(scope.row.id)">编辑</el-button>
            <el-button type="danger" size="small" link @click="deleteCompetitor(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      ></el-pagination>
    </div>
  </div>
</template>

<script>
import api from '@/api'

export default {
  name: 'CompetitorList',
  data() {
    return {
      competitors: [],
      loading: false,
      currentPage: 1,
      pageSize: 20,
      pagination: {
        total: 0
      },
      filters: {
        keyword: '',
        industry: '',
        strength: ''
      },
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
    this.loadCompetitors()
  },
  methods: {
    async loadCompetitors() {
      this.loading = true
      try {
        const params = {
          page: this.currentPage,
          limit: this.pageSize,
          ...this.filters
        }
        const response = await api.getCompetitors(params)
        if (response && response.success) {
          if (response.data && response.data.competitors) {
            this.competitors = response.data.competitors || []
            this.pagination = response.data.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 }
          } else if (response.competitors) {
            this.competitors = response.competitors || []
            this.pagination = response.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 }
          } else {
            this.competitors = []
            this.pagination = { total: 0, page: 1, limit: 20, totalPages: 0 }
          }
        } else {
          this.$message.error(response?.message || '获取竞争对手数据失败')
        }
      } catch (error) {
        console.error('获取竞争对手数据异常:', error)
        this.$message.error('获取竞争对手数据失败')
      } finally {
        this.loading = false
      }
    },
    handleSearch() {
      this.currentPage = 1
      this.loadCompetitors()
    },
    handleSizeChange(size) {
      this.pageSize = size
      this.currentPage = 1
      this.loadCompetitors()
    },
    handleCurrentChange(current) {
      this.currentPage = current
      this.loadCompetitors()
    },
    addCompetitor() {
      this.$router.push('/crm/competitors/add')
    },
    viewCompetitor(id) {
      this.$router.push(`/crm/competitors/detail/${id}`)
    },
    editCompetitor(id) {
      this.$router.push(`/crm/competitors/edit/${id}`)
    },
    async deleteCompetitor(id) {
      try {
        await this.$confirm('确定要删除此竞争对手吗？此操作不可恢复。', '删除确认', {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning'
        })
        const response = await api.deleteCompetitor(id)
        if (response.success) {
          this.$message.success('删除成功')
          this.loadCompetitors()
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
      if (!date) return ''
      return new Date(date).toLocaleString()
    }
  }
}
</script>

<style scoped>
.competitor-management {
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

.header-actions {
  display: flex;
  gap: 10px;
}

.search-filter-bar {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 250px;
}

.search-filter-bar .el-select {
  width: 140px;
}

.table-container {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  overflow-x: auto;
}

.table-container .el-table {
  width: 100%;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  background: #fff;
  padding: 16px;
  border-radius: 8px;
}
</style>