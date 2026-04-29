<template>
  <div class="equipment-management">
    <div class="page-header">
      <h2 class="page-title">客户设备台账</h2>
      <div class="header-actions">
        <el-button type="primary" @click="addEquipment">
          <i class="fa fa-plus"></i> 新建设备
        </el-button>
      </div>
    </div>

    <div class="statistics-cards">
      <div class="stat-card">
        <div class="stat-icon total"><i class="fa fa-cogs"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.totalEquipment || 0 }}</div>
          <div class="stat-label">设备总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon success"><i class="fa fa-check-circle"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.normalCount || 0 }}</div>
          <div class="stat-label">正常</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon warning"><i class="fa fa-wrench"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.maintenanceCount || 0 }}</div>
          <div class="stat-label">维保中</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon danger"><i class="fa fa-exclamation-triangle"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.brokenCount || 0 }}</div>
          <div class="stat-label">故障</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon info"><i class="fa fa-clock"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.warrantyExpiringCount || 0 }}</div>
          <div class="stat-label">即将过保</div>
        </div>
      </div>
    </div>

    <div class="search-filter-bar">
      <el-input
        v-model="filters.keyword"
        placeholder="搜索设备名称/编码/序列号"
        prefix-icon="el-icon-search"
        clearable
        @input="loadEquipment"
        style="width: 250px;"
      ></el-input>
      <el-select v-model="filters.status" placeholder="设备状态" clearable @change="loadEquipment" style="width: 150px;">
        <el-option label="正常" value="normal"></el-option>
        <el-option label="运行中" value="running"></el-option>
        <el-option label="维保中" value="maintenance"></el-option>
        <el-option label="故障" value="broken"></el-option>
        <el-option label="报废" value="scraped"></el-option>
      </el-select>
    </div>

    <div class="table-container">
      <el-table :data="equipmentList" v-loading="loading" border stripe>
        <el-table-column prop="equipment_code" label="设备编码" width="130"></el-table-column>
        <el-table-column prop="equipment_name" label="设备名称" min-width="150" show-overflow-tooltip></el-table-column>
        <el-table-column prop="customer_name" label="所属客户" width="150" show-overflow-tooltip></el-table-column>
        <el-table-column prop="equipment_model" label="型号" width="120" show-overflow-tooltip></el-table-column>
        <el-table-column prop="serial_number" label="序列号" width="130" show-overflow-tooltip></el-table-column>
        <el-table-column prop="equipment_status" label="状态" width="90">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.equipment_status)" size="small">
              {{ getStatusText(scope.row.equipment_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="warranty_expire_date" label="保修到期" width="110">
          <template #default="scope">
            <span :class="{ 'text-danger': isWarrantyExpiring(scope.row.warranty_expire_date) }">
              {{ formatDate(scope.row.warranty_expire_date) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="equipment_location" label="设备位置" width="120" show-overflow-tooltip></el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" link @click="viewEquipment(scope.row.id)">详情</el-button>
            <el-button type="success" size="small" link @click="editEquipment(scope.row.id)">编辑</el-button>
            <el-button type="danger" size="small" link @click="deleteEquipment(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          layout="total, prev, pager, next"
          :total="pagination.total"
          @current-change="loadEquipment"
        ></el-pagination>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/api'

export default {
  name: 'EquipmentManagement',
  data() {
    return {
      equipmentList: [],
      statistics: {},
      loading: false,
      currentPage: 1,
      pageSize: 20,
      pagination: { total: 0 },
      filters: {
        keyword: '',
        status: ''
      }
    }
  },
  mounted() {
    this.loadEquipment()
    this.loadStatistics()
  },
  methods: {
    async loadEquipment() {
      this.loading = true
      try {
        const params = {
          page: this.currentPage,
          limit: this.pageSize,
          ...this.filters
        }
        const response = await api.getEquipmentList(params)
        if (response && response.success) {
          this.equipmentList = response.data?.equipment || []
          this.pagination = response.data?.pagination || { total: 0 }
        }
      } catch (error) {
        console.warn('获取设备列表失败:', error)
      } finally {
        this.loading = false
      }
    },
    async loadStatistics() {
      try {
        const response = await api.getEquipmentStatistics()
        if (response && response.success) {
          this.statistics = response.data
        }
      } catch (error) {
        console.warn('获取设备统计失败:', error)
      }
    },
    addEquipment() {
      this.$router.push('/crm/equipment/add')
    },
    viewEquipment(id) {
      this.$router.push(`/crm/equipment/detail/${id}`)
    },
    editEquipment(id) {
      this.$router.push(`/crm/equipment/edit/${id}`)
    },
    async deleteEquipment(id) {
      try {
        await this.$confirm('确定要删除此设备吗？此操作不可恢复。', '删除确认', {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning'
        })
        const response = await api.deleteEquipment(id)
        if (response && response.success) {
          this.$message.success('删除成功')
          this.loadEquipment()
          this.loadStatistics()
        } else {
          this.$message.error(response?.message || '删除失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.warn('删除设备失败:', error)
          this.$message.error('删除设备失败')
        }
      }
    },
    getStatusType(status) {
      const typeMap = {
        'normal': 'success',
        'running': 'primary',
        'maintenance': 'warning',
        'broken': 'danger',
        'scraped': 'info'
      }
      return typeMap[status] || 'info'
    },
    getStatusText(status) {
      const textMap = {
        'normal': '正常',
        'running': '运行中',
        'maintenance': '维保中',
        'broken': '故障',
        'scraped': '报废'
      }
      return textMap[status] || status || '正常'
    },
    isWarrantyExpiring(date) {
      if (!date) return false
      const expireDate = new Date(date)
      const now = new Date()
      const daysDiff = (expireDate - now) / (1000 * 60 * 60 * 24)
      return daysDiff > 0 && daysDiff <= 30
    },
    formatDate(date) {
      if (!date) return '-'
      const d = new Date(date)
      return d.toLocaleDateString('zh-CN')
    }
  }
}
</script>

<style scoped>
.equipment-management {
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

.statistics-cards {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  min-width: 140px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
}

.stat-icon.total { background: #409EFF; }
.stat-icon.success { background: #67C23A; }
.stat-icon.warning { background: #E6A23C; }
.stat-icon.danger { background: #F56C6C; }
.stat-icon.info { background: #909399; }

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.search-filter-bar {
  background: #fff;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.table-container {
  background: #fff;
  border-radius: 8px;
  padding: 15px;
}

.pagination-container {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

.text-danger {
  color: #F56C6C;
}

.header-actions {
  display: flex;
  gap: 10px;
}
</style>
