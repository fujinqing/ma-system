<template>
  <div class="erp-sync">
    <div class="page-header">
      <h2 class="page-title">ERP对接</h2>
      <el-button type="primary" @click="syncData">
        <i class="fa fa-sync"></i> 手动同步
      </el-button>
    </div>
    
    <div class="sync-config">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>同步配置</span>
          </div>
        </template>
        <el-form :model="syncConfig" label-width="120px">
          <el-form-item label="ERP地址">
            <el-input v-model="syncConfig.erpUrl" placeholder="请输入ERP地址"></el-input>
          </el-form-item>
          <el-form-item label="API密钥">
            <el-input v-model="syncConfig.apiKey" type="password" placeholder="请输入API密钥"></el-input>
          </el-form-item>
          <el-form-item label="同步频率">
            <el-select v-model="syncConfig.syncFrequency" placeholder="请选择同步频率">
              <el-option label="每天" value="daily"></el-option>
              <el-option label="每周" value="weekly"></el-option>
              <el-option label="每月" value="monthly"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveConfig">保存配置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
    
    <div class="sync-history" style="margin-top: 20px;">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>同步历史</span>
          </div>
        </template>
        <el-table :data="syncHistory" style="width: 100%" border>
          <el-table-column prop="id" label="记录ID" width="80"></el-table-column>
          <el-table-column prop="syncType" label="同步类型" min-width="120"></el-table-column>
          <el-table-column prop="syncStatus" label="同步状态" width="100">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.syncStatus)">{{ scope.row.syncStatus }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="syncTime" label="同步时间" width="150"></el-table-column>
          <el-table-column prop="errorMessage" label="错误信息" min-width="200"></el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ERPSync',
  data() {
    return {
      syncConfig: {
        erpUrl: 'http://localhost:8080/erp',
        apiKey: 'your-api-key',
        syncFrequency: 'daily'
      },
      syncHistory: [
        {
          id: 1,
          syncType: '客户数据',
          syncStatus: '成功',
          syncTime: '2026-01-01 10:00:00',
          errorMessage: ''
        },
        {
          id: 2,
          syncType: '采购订单',
          syncStatus: '成功',
          syncTime: '2026-01-01 09:00:00',
          errorMessage: ''
        },
        {
          id: 3,
          syncType: '销售合同',
          syncStatus: '失败',
          syncTime: '2026-01-01 08:00:00',
          errorMessage: '连接超时'
        }
      ]
    }
  },
  methods: {
    getStatusType(status) {
      switch (status) {
        case '成功':
          return 'success'
        case '失败':
          return 'danger'
        default:
          return ''
      }
    },
    syncData() {
      this.$confirm('确定要手动同步数据吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        setTimeout(() => {
          this.$message.success('同步成功')
          // 模拟同步结果
          this.syncHistory.unshift({
            id: this.syncHistory.length + 1,
            syncType: '全部数据',
            syncStatus: '成功',
            syncTime: new Date().toLocaleString(),
            errorMessage: ''
          })
        }, 1000)
      })
    },
    saveConfig() {
      setTimeout(() => {
        this.$message.success('配置保存成功')
      }, 500)
    }
  }
}
</script>

<style scoped>
.erp-sync {
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
}

.sync-config {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>