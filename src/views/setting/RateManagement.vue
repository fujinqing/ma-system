<template>
  <div class="rate-management">
    <div class="page-header">
      <h2 class="page-title">工时费率管理</h2>
      <div class="header-actions">
        <el-tag :type="isAdmin ? 'success' : 'info'" style="margin-right: 10px;">
          {{ isAdmin ? '管理员模式' : '只读模式' }}
        </el-tag>
        <el-button type="primary" @click="saveRates" v-if="isAdmin">
          <i class="fa fa-save"></i> 保存设置
        </el-button>
        <el-button type="warning" @click="toggleAdminMode" size="small">
          {{ isAdmin ? '退出管理' : '管理员登录' }}
        </el-button>
      </div>
    </div>
    
    <!-- 标准成本费率表 (C01-C17) -->
    <el-card class="rate-card">
      <template #header>
        <div class="card-header">
          <span>标准成本费率表</span>
          <el-tag type="info" size="small">参考A1标准</el-tag>
        </div>
      </template>
      <el-table :data="standardCostRates" border style="width: 100%" size="small">
        <el-table-column prop="code" label="代码" width="70" align="center"></el-table-column>
        <el-table-column prop="nameEn" label="Items (English)" min-width="180"></el-table-column>
        <el-table-column prop="nameCn" label="明细 (中文)" min-width="150"></el-table-column>
        <el-table-column prop="type" label="类型" width="80" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.type === '自制' ? 'success' : 'warning'" size="small">
              {{ scope.row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="percentage" label="%" width="100" align="right">
          <template #default="scope">
            <el-input-number
              v-if="scope.row.editablePercent"
              v-model="scope.row.percentage"
              :min="0"
              :max="100"
              :precision="2"
              size="small"
              style="width: 80px;"
              :controls="false"
              :disabled="!isAdmin"
              @change="updateCalculations"
            ></el-input-number>
            <span v-else-if="scope.row.percentage">{{ scope.row.percentage }}%</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="hourlyRate" label="每小时工费" width="120" align="right">
          <template #default="scope">
            <el-input-number
              v-if="scope.row.editableRate"
              v-model="scope.row.hourlyRate"
              :min="0"
              :precision="2"
              size="small"
              style="width: 90px;"
              :controls="false"
              :disabled="!isAdmin"
              @change="updateCalculations"
            ></el-input-number>
            <span v-else-if="scope.row.hourlyRate">¥{{ scope.row.hourlyRate.toFixed(2) }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 工时费率-自制 -->
    <el-card class="rate-card" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>工时费率-自制</span>
        </div>
      </template>
      <div class="rate-grid">
        <div class="rate-item">
          <label>方案和设计师-电池</label>
          <el-input-number v-model="selfMadeRates.planDesignBattery" :min="0" :precision="2" :step="0.5" :controls="false" :disabled="!isAdmin"></el-input-number>
          <span class="rate-unit">元/小时</span>
        </div>
        <div class="rate-item">
          <label>方案和设计师-半导体</label>
          <el-input-number v-model="selfMadeRates.planDesignSemiconductor" :min="0" :precision="2" :step="0.5" :controls="false" :disabled="!isAdmin"></el-input-number>
          <span class="rate-unit">元/小时</span>
        </div>
        <div class="rate-item">
          <label>方案和设计师-铸造</label>
          <el-input-number v-model="selfMadeRates.planDesignCasting" :min="0" :precision="2" :step="0.5" :controls="false" :disabled="!isAdmin"></el-input-number>
          <span class="rate-unit">元/小时</span>
        </div>
        <div class="rate-item">
          <label>项目管理费率</label>
          <el-input-number v-model="selfMadeRates.projectManagement" :min="0" :precision="2" :step="0.5" :controls="false" :disabled="!isAdmin"></el-input-number>
          <span class="rate-unit">元/小时</span>
        </div>
        <div class="rate-item">
          <label>装配费率</label>
          <el-input-number v-model="selfMadeRates.assembly" :min="0" :precision="2" :step="0.5" :controls="false" :disabled="!isAdmin"></el-input-number>
          <span class="rate-unit">元/小时</span>
        </div>
        <div class="rate-item">
          <label>调试费率</label>
          <el-input-number v-model="selfMadeRates.debug" :min="0" :precision="2" :step="0.5" :controls="false" :disabled="!isAdmin"></el-input-number>
          <span class="rate-unit">元/小时</span>
        </div>
      </div>
    </el-card>
    
    <!-- 工时费率-外包 -->
    <el-card class="rate-card" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>工时费率-外包</span>
        </div>
      </template>
      <div class="rate-grid">
        <div class="rate-item">
          <label>外包设计费率</label>
          <el-input-number v-model="outsourceRates.design" :min="0" :precision="2" :step="0.5" :controls="false" :disabled="!isAdmin"></el-input-number>
          <span class="rate-unit">元/小时</span>
        </div>
        <div class="rate-item">
          <label>外包装配费率-厂内</label>
          <el-input-number v-model="outsourceRates.assemblyInternal" :min="0" :precision="2" :step="0.5" :controls="false" :disabled="!isAdmin"></el-input-number>
          <span class="rate-unit">元/小时</span>
        </div>
        <div class="rate-item">
          <label>外包装配费率-现场</label>
          <el-input-number v-model="outsourceRates.assemblyOnsite" :min="0" :precision="2" :step="0.5" :controls="false" :disabled="!isAdmin"></el-input-number>
          <span class="rate-unit">元/小时</span>
        </div>
        <div class="rate-item">
          <label>外包调试费率-厂内</label>
          <el-input-number v-model="outsourceRates.debugInternal" :min="0" :precision="2" :step="0.5" :controls="false" :disabled="!isAdmin"></el-input-number>
          <span class="rate-unit">元/小时</span>
        </div>
        <div class="rate-item">
          <label>外包调试费率-现场</label>
          <el-input-number v-model="outsourceRates.debugOnsite" :min="0" :precision="2" :step="0.5" :controls="false" :disabled="!isAdmin"></el-input-number>
          <span class="rate-unit">元/小时</span>
        </div>
      </div>
    </el-card>
    
    <!-- 管理成本费率 -->
    <el-card class="rate-card" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>管理成本费率</span>
        </div>
      </template>
      <div class="rate-grid">
        <div class="rate-item">
          <label>间接成本费率</label>
          <el-input-number v-model="managementRates.indirectCost" :min="0" :precision="2" :step="0.5" :controls="false" :disabled="!isAdmin"></el-input-number>
          <span class="rate-unit">%</span>
        </div>
        <div class="rate-item">
          <label>项目风险费率</label>
          <el-input-number v-model="managementRates.projectRisk" :min="0" :precision="2" :step="0.5" :controls="false" :disabled="!isAdmin"></el-input-number>
          <span class="rate-unit">%</span>
        </div>
        <div class="rate-item">
          <label>财务风险费率</label>
          <el-input-number v-model="managementRates.financialRisk" :min="0" :precision="2" :step="0.5" :controls="false" :disabled="!isAdmin"></el-input-number>
          <span class="rate-unit">%</span>
        </div>
        <div class="rate-item">
          <label>质保风险费率</label>
          <el-input-number v-model="managementRates.warrantyRisk" :min="0" :precision="2" :step="0.5" :controls="false" :disabled="!isAdmin"></el-input-number>
          <span class="rate-unit">%</span>
        </div>
      </div>
    </el-card>
    
    <!-- 国家/地区差旅费用配置 -->
    <el-card class="rate-card" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>国家/地区差旅费用配置</span>
        </div>
      </template>
      <el-table :data="regionTravelData" border style="width: 100%">
        <el-table-column prop="label" label="费用类型" width="120" align="center"></el-table-column>
        <el-table-column label="国内" align="center">
          <template #default="scope">
            <div v-if="scope.row.key === 'other'">
              <el-input v-model="regionTravelRates.domestic.other" size="small" :disabled="!isAdmin"></el-input>
            </div>
            <div v-else>
              <el-input-number v-model="regionTravelRates.domestic[scope.row.key]" :min="0" :precision="2" size="small" :controls="false" :disabled="!isAdmin"></el-input-number>
              <span class="rate-unit-small">元</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="阿联酋" align="center">
          <template #default="scope">
            <div v-if="scope.row.key === 'other'">
              <el-input v-model="regionTravelRates.uae.other" size="small" :disabled="!isAdmin"></el-input>
            </div>
            <div v-else>
              <el-input-number v-model="regionTravelRates.uae[scope.row.key]" :min="0" :precision="2" size="small" :controls="false" :disabled="!isAdmin"></el-input-number>
              <span class="rate-unit-small">元</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="印度" align="center">
          <template #default="scope">
            <div v-if="scope.row.key === 'other'">
              <el-input v-model="regionTravelRates.india.other" size="small" :disabled="!isAdmin"></el-input>
            </div>
            <div v-else>
              <el-input-number v-model="regionTravelRates.india[scope.row.key]" :min="0" :precision="2" size="small" :controls="false" :disabled="!isAdmin"></el-input-number>
              <span class="rate-unit-small">元</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="美国" align="center">
          <template #default="scope">
            <div v-if="scope.row.key === 'other'">
              <el-input v-model="regionTravelRates.usa.other" size="small" :disabled="!isAdmin"></el-input>
            </div>
            <div v-else>
              <el-input-number v-model="regionTravelRates.usa[scope.row.key]" :min="0" :precision="2" size="small" :controls="false" :disabled="!isAdmin"></el-input-number>
              <span class="rate-unit-small">元</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'RateManagement',
  data() {
    return {
      isAdmin: false,
      // C01-C17 标准成本费率表 (根据A1.PNG)
      standardCostRates: [
        { code: 'C01', nameEn: 'Proposal', nameCn: '方案', type: '', hourlyRate: 200.91, percentage: null, editableRate: true, editablePercent: false },
        { code: 'C02', nameEn: 'Project Management', nameCn: '项目管理', type: '', hourlyRate: 170.16, percentage: null, editableRate: true, editablePercent: false },
        { code: 'C03', nameEn: 'Design', nameCn: '设计', type: '', hourlyRate: 200.91, percentage: null, editableRate: true, editablePercent: false },
        { code: 'C04', nameEn: 'Material, purchased parts', nameCn: '物料/采购件', type: '', hourlyRate: null, percentage: null, editableRate: false, editablePercent: false },
        { code: 'C05', nameEn: 'In-house Assembly cost', nameCn: '厂内装配成本', type: '自制', hourlyRate: 190.22, percentage: null, editableRate: true, editablePercent: false },
        { code: 'C05', nameEn: 'In-house Assembly cost', nameCn: '厂内装配成本', type: '外包', hourlyRate: 66.00, percentage: null, editableRate: true, editablePercent: false },
        { code: 'C05', nameEn: 'In-house Assembly cost/ whole line', nameCn: '厂内整线装配成本', type: '自制', hourlyRate: 190.22, percentage: null, editableRate: true, editablePercent: false },
        { code: 'C05', nameEn: 'In-house Assembly cost/ whole line', nameCn: '厂内整线装配成本', type: '外包', hourlyRate: 66.00, percentage: null, editableRate: true, editablePercent: false },
        { code: 'C05', nameEn: 'Onsite installation cost', nameCn: '现场安装成本', type: '自制', hourlyRate: 190.22, percentage: null, editableRate: true, editablePercent: false },
        { code: 'C05', nameEn: 'Onsite installation cost', nameCn: '现场安装成本', type: '外包', hourlyRate: 76.00, percentage: null, editableRate: true, editablePercent: false },
        { code: 'C06', nameEn: 'In-house commissioning cost', nameCn: '厂内调试成本', type: '自制', hourlyRate: 205.45, percentage: null, editableRate: true, editablePercent: false },
        { code: 'C06', nameEn: 'In-house commissioning cost', nameCn: '厂内调试成本', type: '外包', hourlyRate: 140.00, percentage: null, editableRate: true, editablePercent: false },
        { code: 'C06', nameEn: 'In-house commissioning cost/ off-line', nameCn: '厂内离线编程成本', type: '', hourlyRate: 205.45, percentage: null, editableRate: true, editablePercent: false },
        { code: 'C06', nameEn: 'Onsite commissioning cost', nameCn: '现场调试成本', type: '自制', hourlyRate: 205.45, percentage: null, editableRate: true, editablePercent: false },
        { code: 'C06', nameEn: 'Onsite commissioning cost', nameCn: '现场调试成本', type: '外包', hourlyRate: 170.00, percentage: null, editableRate: true, editablePercent: false },
        { code: 'C07', nameEn: 'Travelling cost', nameCn: '差旅成本', type: '', hourlyRate: null, percentage: null, editableRate: false, editablePercent: false },
        { code: 'C08', nameEn: 'Industrial Design', nameCn: '工业设计', type: '', hourlyRate: null, percentage: null, editableRate: false, editablePercent: false },
        { code: 'C08', nameEn: 'Other (e.g. transportation, customs, packaging, insurance) based on C05', nameCn: '其他（如：交通、清关、包装、保险等）基于C05', type: '', hourlyRate: null, percentage: 3.50, editableRate: false, editablePercent: true },
        { code: 'C09', nameEn: 'Project Risk provision', nameCn: '项目风险预提', type: '', hourlyRate: null, percentage: 3.00, editableRate: false, editablePercent: true },
        { code: 'C12', nameEn: 'Overhead (based on C05)', nameCn: '间接成本（基于C05）', type: '', hourlyRate: null, percentage: 17.44, editableRate: false, editablePercent: true },
        { code: 'C18', nameEn: 'EBIT (based on sales price)', nameCn: '息税前利润（基于未税售价）', type: '', hourlyRate: null, percentage: 8.34, editableRate: false, editablePercent: true },
        { code: 'C16', nameEn: 'Financial Risk (based on sales price)', nameCn: '财务风险（基于未税售价）', type: '', hourlyRate: null, percentage: 0.50, editableRate: false, editablePercent: true },
        { code: 'C17', nameEn: 'Warranty (based on sales price)', nameCn: '质保风险（基于未税售价）', type: '', hourlyRate: null, percentage: 2.50, editableRate: false, editablePercent: true }
      ],
      // 工时费率-自制
      selfMadeRates: {
        planDesignBattery: 186.22,
        planDesignSemiconductor: 200.91,
        planDesignCasting: 267.97,
        projectManagement: 170.16,
        assembly: 190.22,
        debug: 205.45
      },
      // 工时费率-外包
      outsourceRates: {
        design: 200.00,
        assemblyInternal: 66.00,
        assemblyOnsite: 76.00,
        debugInternal: 140.00,
        debugOnsite: 170.00
      },
      // 管理成本费率
      managementRates: {
        indirectCost: 17.44,
        projectRisk: 3.00,
        financialRisk: 0.50,
        warrantyRisk: 2.50
      },
      // 国家/地区差旅费用配置
      regionTravelRates: {
        domestic: {
          name: '国内',
          allowance: 330,
          accommodation: 0,
          visaFee: 0,
          other: ''
        },
        uae: {
          name: '阿联酋',
          allowance: 450,
          accommodation: 80,
          visaFee: 2000,
          other: '租车2w/月+往返机票'
        },
        india: {
          name: '印度',
          allowance: 280,
          accommodation: 500,
          visaFee: 2080,
          other: '租车1.2w/月+往返机票8000'
        },
        usa: {
          name: '美国',
          allowance: 450,
          accommodation: 1000,
          visaFee: 475,
          other: '租车2w/月+往返机票2w'
        }
      }
    }
  },
  computed: {
    regionTravelData() {
      return [
        { key: 'allowance', label: '出差补助' },
        { key: 'accommodation', label: '住宿费' },
        { key: 'visaFee', label: '签证费' },
        { key: 'other', label: '其他' }
      ]
    },
  },
  mounted() {
    this.checkUserPermission()
    this.loadRates()
  },
  methods: {
    checkUserPermission() {
      const userInfoStr = localStorage.getItem('userInfo')
      if (!userInfoStr) {
        const user = localStorage.getItem('user')
        const currentUser = localStorage.getItem('currentUser')
        if (user) {
          const userData = JSON.parse(user)
          this.isAdmin = userData.role === 'admin' || userData.isAdmin === true
          return
        }
        if (currentUser) {
          const userData = JSON.parse(currentUser)
          this.isAdmin = userData.role === 'admin' || userData.isAdmin === true
          return
        }
        this.isAdmin = true
        return
      }
      const userInfo = JSON.parse(userInfoStr)
      this.isAdmin = userInfo.role === 'admin' || userInfo.isAdmin === true || userInfo.role === '管理员'
    },
    loadRates() {
      const savedRates = localStorage.getItem('rateManagementSettings')
      if (savedRates) {
        const rates = JSON.parse(savedRates)
        if (rates.standardCostRates) this.standardCostRates = rates.standardCostRates
        if (rates.selfMadeRates) this.selfMadeRates = rates.selfMadeRates
        if (rates.outsourceRates) this.outsourceRates = rates.outsourceRates
        if (rates.managementRates) this.managementRates = rates.managementRates
        if (rates.regionTravelRates) this.regionTravelRates = rates.regionTravelRates
      }
    },
    saveRates() {
      if (!this.isAdmin) {
        this.$message.warning('您没有权限修改费率设置')
        return
      }
      const ratesData = {
        standardCostRates: this.standardCostRates,
        selfMadeRates: this.selfMadeRates,
        outsourceRates: this.outsourceRates,
        managementRates: this.managementRates,
        regionTravelRates: this.regionTravelRates
      }
      localStorage.setItem('rateManagementSettings', JSON.stringify(ratesData))
      this.$message.success('保存成功')
    },
    toggleAdminMode() {
      this.isAdmin = !this.isAdmin
    },
    updateCalculations() {
      // 触发表格重新计算
      this.$forceUpdate()
    }
  }
}
</script>

<style scoped>
.rate-management {
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
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.header-actions {
  display: flex;
  align-items: center;
}

.rate-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rate-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.rate-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rate-item label {
  min-width: 140px;
  font-size: 14px;
  color: #606266;
}

.rate-unit {
  color: #909399;
  font-size: 13px;
}

.rate-unit-small {
  color: #909399;
  font-size: 12px;
  margin-left: 5px;
}

/* 汇总行样式 */
:deep(.el-table .cell) {
  white-space: nowrap;
}
</style>
