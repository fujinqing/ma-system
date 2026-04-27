<template>
  <div class="price-calculation" :class="{ 'fullscreen': isFullscreen }">
    <div class="page-header">
      <h2 class="page-title">价格计算表</h2>
      <div class="header-actions">
        <el-button type="primary" @click="addPriceCalculation">
          <i class="fa fa-plus"></i> 新建价格计算
        </el-button>
        <el-button type="success" @click="exportPriceCalculations">
          <i class="fa fa-download"></i> 导出
        </el-button>
        <el-button type="info" @click="toggleFullscreen">
          <i :class="isFullscreen ? 'fa fa-compress' : 'fa fa-expand'"></i>
          {{ isFullscreen ? '退出全屏' : '全屏' }}
        </el-button>
      </div>
    </div>
    
    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索计算编号、方案编号、项目名称或客户名称"
        prefix-icon="el-icon-search"
        style="width: 400px;"
        @keyup.enter="search"
      ></el-input>
      <el-select v-model="status" placeholder="选择状态" style="width: 120px;">
        <el-option label="全部" value=""></el-option>
        <el-option label="待计算" value="pending"></el-option>
        <el-option label="计算中" value="processing"></el-option>
        <el-option label="已完成" value="completed"></el-option>
      </el-select>
      <el-button type="primary" @click="search">搜索</el-button>
    </div>
    
    <el-table :data="priceCalculations" style="width: 100%" border>
      <el-table-column prop="id" label="计算编号" width="120"></el-table-column>
      <el-table-column prop="solutionId" label="方案编号" width="120"></el-table-column>
      <el-table-column prop="projectName" label="项目名称" min-width="180"></el-table-column>
      <el-table-column prop="customerName" label="客户名称" min-width="150"></el-table-column>
      <el-table-column prop="totalPrice" label="最终成本" width="120" :formatter="formatPrice"></el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 'pending'" type="info">待计算</el-tag>
          <el-tag v-else-if="scope.row.status === 'processing'" type="warning">计算中</el-tag>
          <el-tag v-else type="success">已完成</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createDate" label="创建日期" width="150"></el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="viewPriceCalculation(scope.row.id)">查看</el-button>
          <el-button type="warning" size="small" @click="editPriceCalculation(scope.row.id)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      ></el-pagination>
    </div>
    
    <!-- 价格计算表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="95%"
      destroy-on-close
      :close-on-click-modal="false"
      :fullscreen="isDialogFullscreen"
    >
      <template #header>
        <div class="dialog-header">
          <span class="dialog-title">{{ dialogTitle }}</span>
          <el-button type="info" size="small" @click="toggleDialogFullscreen">
            <i :class="isDialogFullscreen ? 'fa fa-compress' : 'fa fa-expand'"></i>
            {{ isDialogFullscreen ? '退出全屏' : '全屏' }}
          </el-button>
        </div>
      </template>
      <div class="price-form">
        <el-form :model="priceForm" :rules="rules" ref="formRef" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="计算编号" prop="id">
                <el-input v-model="priceForm.id" placeholder="系统自动生成" readonly></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="方案编号" prop="solutionId">
                <el-input v-model="priceForm.solutionId" placeholder="系统自动生成" readonly></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="商机名称" prop="projectName">
                <el-input v-model="priceForm.projectName" placeholder="请输入商机名称"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="客户名称" prop="customerId">
                <el-select v-model="priceForm.customerId" placeholder="请选择客户" style="width: 100%" filterable @change="handleCustomerChange">
                  <el-option v-for="customer in customers" :key="customer.id" :label="customer.name" :value="customer.id"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="商务负责人" prop="businessManager">
                <el-select v-model="priceForm.businessManager" placeholder="请选择商务负责人" style="width: 100%" filterable>
                  <el-option v-for="user in users" :key="user.id" :label="user.name" :value="user.id"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="方案负责人" prop="solutionManager">
                <el-select v-model="priceForm.solutionManager" placeholder="请选择方案负责人" style="width: 100%" filterable>
                  <el-option v-for="user in users" :key="user.id" :label="user.name" :value="user.id"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="电气负责人" prop="electricalManager">
                <el-select v-model="priceForm.electricalManager" placeholder="请选择电气负责人" style="width: 100%" filterable>
                  <el-option v-for="user in users" :key="user.id" :label="user.name" :value="user.id"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="工程负责人" prop="engineeringManager">
                <el-select v-model="priceForm.engineeringManager" placeholder="请选择工程负责人" style="width: 100%" filterable>
                  <el-option v-for="user in users" :key="user.id" :label="user.name" :value="user.id"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          
          <!-- 粗横线分隔 -->
          <div class="thick-divider"></div>
          
          <!-- 设备类型选择 -->
          <el-row :gutter="20" style="margin-bottom: 15px;">
            <el-col :span="6">
              <el-form-item label="设备类型" prop="equipmentType">
                <el-select v-model="priceForm.equipmentType" placeholder="请选择设备类型" style="width: 100%" @change="handleEquipmentTypeChange">
                  <el-option label="产线" value="production_line"></el-option>
                  <el-option label="单机" value="single_machine"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6" v-if="priceForm.equipmentType === 'production_line'">
              <el-form-item label="区域数量">
                <el-input v-model="zoneCount" readonly>
                  <template #append>个</template>
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>
          
          <!-- 模块价格明细表格 -->
          <el-form-item label="模块价格明细">
            <div class="module-table-container">
              <el-table :data="moduleItems" style="width: 100%" border size="small">
                <el-table-column type="index" label="序号" width="50" align="center"></el-table-column>
                <el-table-column prop="productionLine" label="产线" width="80" align="center" v-if="priceForm.equipmentType === 'production_line'">
                  <template #default="scope">
                    <el-input-number v-model="scope.row.productionLine" size="small" :min="1" :precision="0" style="width: 70px;" @change="calculateModuleTotal(scope.row)"></el-input-number>
                  </template>
                </el-table-column>
                <el-table-column prop="zone" label="区域" width="80" align="center" v-if="priceForm.equipmentType === 'production_line'">
                  <template #default="scope">
                    <el-input-number v-model="scope.row.zone" size="small" :min="1" :precision="0" style="width: 70px;" @change="calculateModuleTotal(scope.row); updateZoneCount()"></el-input-number>
                  </template>
                </el-table-column>
                <el-table-column prop="moduleName" label="模块名称" min-width="120">
                  <template #default="scope">
                    <el-input v-model="scope.row.moduleName" size="small" placeholder="请输入模块名称"></el-input>
                  </template>
                </el-table-column>
                <el-table-column prop="moduleType" label="模块类别" width="100">
                  <template #default="scope">
                    <el-select v-model="scope.row.moduleType" size="small" placeholder="类别">
                      <el-option label="机械模块" value="mechanical"></el-option>
                      <el-option label="电气模块" value="electrical"></el-option>
                      <el-option label="软件模块" value="software"></el-option>
                      <el-option label="其他" value="other"></el-option>
                    </el-select>
                  </template>
                </el-table-column>
                <el-table-column prop="manufactureType" label="制造方式" width="100">
                  <template #default="scope">
                    <el-select v-model="scope.row.manufactureType" size="small" placeholder="方式">
                      <el-option label="自制" value="self"></el-option>
                      <el-option label="外购" value="purchase"></el-option>
                      <el-option label="外协" value="outsourcing"></el-option>
                    </el-select>
                  </template>
                </el-table-column>
                <el-table-column prop="mechanicalMaterialPrice" label="机械材料单价" width="110" align="right">
                  <template #default="scope">
                    <el-input-number v-model="scope.row.mechanicalMaterialPrice" size="small" :min="0" :precision="2" @change="calculateModuleTotal(scope.row)"></el-input-number>
                  </template>
                </el-table-column>
                <el-table-column prop="electricalMaterialPrice" label="电气材料单价" width="110" align="right">
                  <template #default="scope">
                    <el-input-number v-model="scope.row.electricalMaterialPrice" size="small" :min="0" :precision="2" @change="calculateModuleTotal(scope.row)"></el-input-number>
                  </template>
                </el-table-column>
                <el-table-column prop="materialPrice" label="材料单价" width="100" align="right">
                  <template #default="scope">
                    <span>{{ formatNumber(scope.row.materialPrice) }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="quantity" label="数量" width="80" align="center">
                  <template #default="scope">
                    <el-input-number v-model="scope.row.quantity" size="small" :min="1" @change="calculateModuleTotal(scope.row)"></el-input-number>
                  </template>
                </el-table-column>
                <el-table-column prop="unit" label="单位" width="70" align="center">
                  <template #default="scope">
                    <el-select v-model="scope.row.unit" size="small" style="width: 60px">
                      <el-option label="套" value="set"></el-option>
                      <el-option label="个" value="piece"></el-option>
                      <el-option label="台" value="unit"></el-option>
                    </el-select>
                  </template>
                </el-table-column>
                <el-table-column prop="materialTotalCost" label="材料总成本" width="110" align="right">
                  <template #default="scope">
                    <span>{{ formatNumber(scope.row.materialTotalCost) }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="mechanicalDesignHours" label="机械设计工时" width="100" align="right">
                  <template #default="scope">
                    <el-input-number v-model="scope.row.mechanicalDesignHours" size="small" :min="0" :precision="2" @change="calculateModuleTotal(scope.row)"></el-input-number>
                  </template>
                </el-table-column>
                <el-table-column prop="electricalDesignHours" label="电气设计工时" width="100" align="right">
                  <template #default="scope">
                    <el-input-number v-model="scope.row.electricalDesignHours" size="small" :min="0" :precision="2" @change="calculateModuleTotal(scope.row)"></el-input-number>
                  </template>
                </el-table-column>
                <el-table-column prop="softwareDesignHours" label="软件设计工时" width="100" align="right">
                  <template #default="scope">
                    <el-input-number v-model="scope.row.softwareDesignHours" size="small" :min="0" :precision="2" @change="calculateModuleTotal(scope.row)"></el-input-number>
                  </template>
                </el-table-column>
                <el-table-column prop="totalDesignHours" label="设计总工时" width="90" align="right">
                  <template #default="scope">
                    <span>{{ scope.row.totalDesignHours }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="designTotalCost" label="设计总费用" width="100" align="right">
                  <template #default="scope">
                    <span>{{ formatNumber(scope.row.designTotalCost) }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="mechanicalProcessHours" label="机械制造工时" width="100" align="right">
                  <template #default="scope">
                    <el-input-number v-model="scope.row.mechanicalProcessHours" size="small" :min="0" :precision="2" @change="calculateModuleTotal(scope.row)"></el-input-number>
                  </template>
                </el-table-column>
                <el-table-column prop="electricalProcessHours" label="电气制造工时" width="100" align="right">
                  <template #default="scope">
                    <el-input-number v-model="scope.row.electricalProcessHours" size="small" :min="0" :precision="2" @change="calculateModuleTotal(scope.row)"></el-input-number>
                  </template>
                </el-table-column>
                <el-table-column prop="totalProcessHours" label="制造总工时" width="90" align="right">
                  <template #default="scope">
                    <span>{{ scope.row.totalProcessHours }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="processTotalCost" label="制造总费用" width="100" align="right">
                  <template #default="scope">
                    <span>{{ formatNumber(scope.row.processTotalCost) }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="moduleTotalCost" label="模块总成本" width="110" align="right" fixed="right">
                  <template #default="scope">
                    <span class="total-cost">{{ formatNumber(scope.row.moduleTotalCost) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="80" fixed="right" align="center">
                  <template #default="scope">
                    <el-button type="danger" size="small" @click="removeModuleItem(scope.$index)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
              <el-button type="primary" size="small" @click="addModuleItem" style="margin-top: 10px;">
                <i class="fa fa-plus"></i> 添加模块
              </el-button>
            </div>
          </el-form-item>
          
          <!-- 制造成本汇总区域 -->
          <el-divider content-position="left">制造成本汇总</el-divider>
          
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="区域数量">
                <el-input v-model="zoneCount" readonly>
                  <template #append>个</template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="厂内整线装配成本">
                <el-input v-model="summary.inHouseAssemblyWholeLineCost" readonly>
                  <template #append>元</template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="厂内整线调试成本">
                <el-input v-model="summary.inHouseCommissioningWholeLineCost" readonly>
                  <template #append>元</template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="现场整线装配成本">
                <el-input v-model="summary.onsiteAssemblyWholeLineCost" readonly>
                  <template #append>元</template>
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="现场整线调试成本">
                <el-input v-model="summary.onsiteCommissioningWholeLineCost" readonly>
                  <template #append>元</template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="材料总成本">
                <el-input v-model="summary.materialTotalCost" readonly>
                  <template #append>元</template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="设计总成本">
                <el-input v-model="summary.designTotalCost" readonly>
                  <template #append>元</template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="制造总成本">
                <el-input v-model="summary.processTotalCost" readonly>
                  <template #append>元</template>
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="项目成本小计">
                <el-input v-model="summary.projectCostSubtotal" readonly class="highlight-input">
                  <template #append>元</template>
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>
          
          <!-- 整线工时 -->
          <el-divider content-position="left">整线工时</el-divider>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="厂内整线装配工时">
                <el-input-number v-model="priceForm.inHouseAssemblyWholeLineHours" :min="0" :precision="2" style="width: 100%;" @change="calculateAll"></el-input-number>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="厂内整线装配方式">
                <el-radio-group v-model="priceForm.inHouseAssemblyWholeLineType" @change="calculateAll">
                  <el-radio label="self">自制</el-radio>
                  <el-radio label="outsource">外包</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="厂内整线调试工时">
                <el-input-number v-model="priceForm.inHouseCommissioningWholeLineHours" :min="0" :precision="2" style="width: 100%;" @change="calculateAll"></el-input-number>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="厂内整线调试方式">
                <el-radio-group v-model="priceForm.inHouseCommissioningWholeLineType" @change="calculateAll">
                  <el-radio label="self">自制</el-radio>
                  <el-radio label="outsource">外包</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="现场整线装配工时">
                <el-input-number v-model="priceForm.onsiteAssemblyWholeLineHours" :min="0" :precision="2" style="width: 100%;" @change="calculateAll"></el-input-number>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="现场整线装配方式">
                <el-radio-group v-model="priceForm.onsiteAssemblyWholeLineType" @change="calculateAll">
                  <el-radio label="self">自制</el-radio>
                  <el-radio label="outsource">外包</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="现场整线调试工时">
                <el-input-number v-model="priceForm.onsiteCommissioningWholeLineHours" :min="0" :precision="2" style="width: 100%;" @change="calculateAll"></el-input-number>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="现场整线调试方式">
                <el-radio-group v-model="priceForm.onsiteCommissioningWholeLineType" @change="calculateAll">
                  <el-radio label="self">自制</el-radio>
                  <el-radio label="outsource">外包</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
          
          <!-- 其他成本 -->
          <el-divider content-position="left">其他成本</el-divider>
          
          <el-row :gutter="10">
            <el-col :span="4">
              <el-form-item label="包装成本">
                <el-input-number v-model="priceForm.packagingCost" :min="0" :precision="2" style="width: 100%;" @change="calculateAll"></el-input-number>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item label="物流成本">
                <el-input-number v-model="priceForm.logisticsCost" :min="0" :precision="2" style="width: 100%;" @change="calculateAll"></el-input-number>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item label="差旅费用">
                <el-input-number v-model="priceForm.travelCost" :min="0" :precision="2" style="width: 100%;" @change="calculateAll"></el-input-number>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item label="报关成本">
                <el-input-number v-model="priceForm.customsCost" :min="0" :precision="2" style="width: 100%;" @change="calculateAll"></el-input-number>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item label="保险成本">
                <el-input-number v-model="priceForm.insuranceCost" :min="0" :precision="2" style="width: 100%;" @change="calculateAll"></el-input-number>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item label="其他成本">
                <el-input-number v-model="priceForm.otherCost" :min="0" :precision="2" style="width: 100%;" @change="calculateAll"></el-input-number>
              </el-form-item>
            </el-col>
          </el-row>
          
          <!-- 差旅成本明细 -->
          <el-divider content-position="left">差旅成本明细</el-divider>
          
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="出差补助费率">
                <el-input-number v-model="travelCostForm.allowanceRate" :min="0" :precision="2" style="width: 100%;" @change="calculateTravelCost"></el-input-number>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="交通费率">
                <el-input-number v-model="travelCostForm.transportRate" :min="0" :precision="2" style="width: 100%;" @change="calculateTravelCost"></el-input-number>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="差旅总成本">
                <el-input v-model="travelCostForm.totalCost" readonly>
                  <template #append>元</template>
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-table :data="travelCostItems" border size="small" style="width: 100%; margin-top: 10px;">
            <el-table-column prop="description" label="描述" min-width="120">
              <template #default="scope">
                <el-input v-model="scope.row.description" size="small" readonly></el-input>
              </template>
            </el-table-column>
            <el-table-column prop="manDays" label="人天" width="100" align="right">
              <template #default="scope">
                <el-input-number v-model="scope.row.manDays" size="small" :min="0" :precision="2" @change="calculateTravelCost"></el-input-number>
              </template>
            </el-table-column>
            <el-table-column prop="peopleCount" label="人数" width="80" align="center">
              <template #default="scope">
                <el-input-number v-model="scope.row.peopleCount" size="small" :min="0" :precision="0" @change="calculateTravelCost"></el-input-number>
              </template>
            </el-table-column>
            <el-table-column prop="travelDays" label="出差天数" width="100" align="right">
              <template #default="scope">
                <el-input-number v-model="scope.row.travelDays" size="small" :min="0" :precision="2" @change="calculateTravelCost"></el-input-number>
              </template>
            </el-table-column>
            <el-table-column prop="allowanceCost" label="补助成本" width="100" align="right">
              <template #default="scope">
                <span>{{ formatNumber(scope.row.allowanceCost) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="travelTimes" label="出差次数" width="100" align="center">
              <template #default="scope">
                <el-input-number v-model="scope.row.travelTimes" size="small" :min="0" :precision="0" @change="calculateTravelCost"></el-input-number>
              </template>
            </el-table-column>
            <el-table-column prop="transportCost" label="交通成本" width="100" align="right">
              <template #default="scope">
                <span>{{ formatNumber(scope.row.transportCost) }}</span>
              </template>
            </el-table-column>
          </el-table>
          
          <!-- 物流成本明细 -->
          <el-divider content-position="left">物流成本明细</el-divider>
          
          <el-table :data="logisticsCostItems" border size="small" style="width: 100%; margin-top: 10px;">
            <el-table-column type="index" label="序号" width="50" align="center"></el-table-column>
            <el-table-column prop="vehicleType" label="车型选择(米)" min-width="120">
              <template #default="scope">
                <el-select v-model="scope.row.vehicleType" size="small" @change="calculateLogisticsCost">
                  <el-option label="4.2*2.4" value="4.2*2.4"></el-option>
                  <el-option label="6.8*2.4" value="6.8*2.4"></el-option>
                  <el-option label="9.6*2.4" value="9.6*2.4"></el-option>
                  <el-option label="13.75*3" value="13.75*3"></el-option>
                  <el-option label="17.5*3" value="17.5*3"></el-option>
                  <el-option label="20尺集装箱(胶合板)" value="20container"></el-option>
                </el-select>
              </template>
            </el-table-column>
            <el-table-column prop="fuelCost" label="每公里油费(元)" width="110" align="right">
              <template #default="scope">
                <el-input-number v-model="scope.row.fuelCost" size="small" :min="0" :precision="2" @change="calculateLogisticsCost"></el-input-number>
              </template>
            </el-table-column>
            <el-table-column prop="tollCost" label="每公里过路费(元)" width="120" align="right">
              <template #default="scope">
                <el-input-number v-model="scope.row.tollCost" size="small" :min="0" :precision="2" @change="calculateLogisticsCost"></el-input-number>
              </template>
            </el-table-column>
            <el-table-column prop="isHighway" label="是否高速" width="90" align="center">
              <template #default="scope">
                <el-select v-model="scope.row.isHighway" size="small" @change="calculateLogisticsCost">
                  <el-option label="是" :value="true"></el-option>
                  <el-option label="否" :value="false"></el-option>
                </el-select>
              </template>
            </el-table-column>
            <el-table-column prop="vehicleCount" label="车辆/集装箱数量" width="110" align="center">
              <template #default="scope">
                <el-input-number v-model="scope.row.vehicleCount" size="small" :min="0" :precision="0" @change="calculateLogisticsCost"></el-input-number>
              </template>
            </el-table-column>
            <el-table-column prop="totalCost" label="费用合计(元)" width="110" align="right">
              <template #default="scope">
                <span>{{ formatNumber(scope.row.totalCost) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="150">
              <template #default="scope">
                <el-input v-model="scope.row.remark" size="small" placeholder="备注"></el-input>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template #default="scope">
                <el-button type="danger" size="small" @click="removeLogisticsItem(scope.$index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button type="primary" size="small" @click="addLogisticsItem" style="margin-top: 10px;">
            <i class="fa fa-plus"></i> 添加物流项
          </el-button>
          
          <el-row :gutter="20" style="margin-top: 15px;">
            <el-col :span="6">
              <el-form-item label="公里数">
                <el-input-number v-model="logisticsCostForm.distance" :min="0" :precision="0" style="width: 100%;" @change="calculateLogisticsCost"></el-input-number>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="打包费">
                <el-input-number v-model="logisticsCostForm.packagingFee" :min="0" :precision="2" style="width: 100%;" @change="calculateLogisticsCost"></el-input-number>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="保险费率">
                <el-input-number v-model="logisticsCostForm.insuranceRate" :min="0" :max="100" :precision="2" style="width: 100%;" @change="calculateLogisticsCost">
                  <template #append>%</template>
                </el-input-number>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="货物总价值">
                <el-input-number v-model="logisticsCostForm.goodsValue" :min="0" :precision="2" style="width: 100%;" @change="calculateLogisticsCost"></el-input-number>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="物流合计(含税)">
                <el-input v-model="logisticsCostForm.subtotal" readonly>
                  <template #append>元</template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="运输公司利润">
                <el-input-number v-model="logisticsCostForm.profitRate" :min="0" :max="100" :precision="2" style="width: 100%;" @change="calculateLogisticsCost">
                  <template #append>%</template>
                </el-input-number>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="司机费用">
                <el-input-number v-model="logisticsCostForm.driverRate" :min="0" :max="100" :precision="2" style="width: 100%;" @change="calculateLogisticsCost">
                  <template #append>%</template>
                </el-input-number>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="物流总计(含税)">
                <el-input v-model="logisticsCostForm.totalCost" readonly class="highlight-input">
                  <template #append>元</template>
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>
          
          <!-- 风险费用和间接成本 -->
          <el-divider content-position="left">风险费用和间接成本</el-divider>
          
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="项目风险比率">
                <el-input-number v-model="priceForm.projectRiskRate" :min="0" :max="100" :precision="2" style="width: 100%;" @change="calculateAll"></el-input-number>
                <template #append>%</template>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目风险费用">
                <el-input v-model="summary.projectRiskCost" readonly>
                  <template #append>元</template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="财务风险比率">
                <el-input-number v-model="priceForm.financialRiskRate" :min="0" :max="100" :precision="2" style="width: 100%;" @change="calculateAll"></el-input-number>
                <template #append>%</template>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="财务风险费用">
                <el-input v-model="summary.financialRiskCost" readonly>
                  <template #append>元</template>
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="质保风险比率">
                <el-input-number v-model="priceForm.warrantyRiskRate" :min="0" :max="100" :precision="2" style="width: 100%;" @change="calculateAll"></el-input-number>
                <template #append>%</template>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="质保风险费用">
                <el-input v-model="summary.warrantyRiskCost" readonly>
                  <template #append>元</template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="间接成本比率">
                <el-input-number v-model="priceForm.indirectCostRate" :min="0" :max="100" :precision="2" style="width: 100%;" @change="calculateAll"></el-input-number>
                <template #append>%</template>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="间接成本">
                <el-input v-model="summary.indirectCost" readonly>
                  <template #append>元</template>
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>
          
          <!-- 最终成本 -->
          <el-divider content-position="left">最终成本</el-divider>
          
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="总成本" prop="totalPrice">
                <el-input v-model="summary.totalCost" readonly class="final-price">
                  <template #append>元</template>
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="备注" prop="remark">
            <el-input v-model="priceForm.remark" type="textarea" :rows="4" placeholder="请输入备注"></el-input>
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">
            {{ isView ? '关闭' : '取消' }}
          </el-button>
          <el-button v-if="!isView" type="primary" @click="calculateAll">重新计算</el-button>
          <el-button v-if="!isView" type="success" @click="savePriceCalculation">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'PriceCalculation',
  data() {
    return {
      searchQuery: '',
      status: '',
      currentPage: 1,
      pageSize: 10,
      total: 0,
      priceCalculations: [],
      customers: [],
      users: [],
      dialogVisible: false,
      isEdit: false,
      isView: false,
      isFullscreen: false,
      isDialogFullscreen: false,
      priceForm: {
        id: '',
        solutionId: '',
        customerId: '',
        customerName: '',
        projectName: '',
        businessManager: '',
        solutionManager: '',
        electricalManager: '',
        engineeringManager: '',
        equipmentType: '',
        inHouseAssemblyWholeLineHours: 0,
        inHouseAssemblyWholeLineType: 'self',
        inHouseCommissioningWholeLineHours: 0,
        inHouseCommissioningWholeLineType: 'self',
        onsiteAssemblyWholeLineHours: 0,
        onsiteAssemblyWholeLineType: 'self',
        onsiteCommissioningWholeLineHours: 0,
        onsiteCommissioningWholeLineType: 'self',
        packagingCost: 0,
        logisticsCost: 0,
        travelCost: 0,
        customsCost: 0,
        insuranceCost: 0,
        otherCost: 0,
        projectRiskRate: 3,
        financialRiskRate: 0.5,
        warrantyRiskRate: 2.5,
        indirectCostRate: 17.44,
        totalPrice: 0,
        remark: ''
      },
      zoneCount: 0,
      rates: {
        mechanicalDesignRate: 150,
        electricalDesignRate: 160,
        softwareDesignRate: 180,
        mechanicalProcessRate: 120,
        electricalProcessRate: 130,
        inHouseAssemblySelfRate: 190.22,
        inHouseAssemblyOutsourceRate: 66.00,
        inHouseCommissioningSelfRate: 190.22,
        inHouseCommissioningOutsourceRate: 66.00,
        onsiteAssemblySelfRate: 190.22,
        onsiteAssemblyOutsourceRate: 66.00,
        onsiteCommissioningSelfRate: 190.22,
        onsiteCommissioningOutsourceRate: 66.00
      },
      moduleItems: [],
      travelCostForm: {
        allowanceRate: 330,
        transportRate: 1200,
        totalCost: 0
      },
      travelCostItems: [
        { description: '机械设计', manDays: 0, peopleCount: 0, travelDays: 0, allowanceCost: 0, travelTimes: 0, transportCost: 0 },
        { description: '电气设计', manDays: 0, peopleCount: 0, travelDays: 0, allowanceCost: 0, travelTimes: 0, transportCost: 0 },
        { description: '液压设计', manDays: 0, peopleCount: 0, travelDays: 0, allowanceCost: 0, travelTimes: 0, transportCost: 0 },
        { description: '方案', manDays: 0, peopleCount: 0, travelDays: 0, allowanceCost: 0, travelTimes: 0, transportCost: 0 },
        { description: '项目管理', manDays: 0, peopleCount: 0, travelDays: 0, allowanceCost: 0, travelTimes: 0, transportCost: 0 },
        { description: '现场调试成本', manDays: 0, peopleCount: 0, travelDays: 0, allowanceCost: 0, travelTimes: 0, transportCost: 0 },
        { description: '现场电气装配', manDays: 0, peopleCount: 0, travelDays: 0, allowanceCost: 0, travelTimes: 0, transportCost: 0 },
        { description: '现场机械装配', manDays: 0, peopleCount: 0, travelDays: 0, allowanceCost: 0, travelTimes: 0, transportCost: 0 }
      ],
      logisticsCostForm: {
        distance: 0,
        packagingFee: 0,
        insuranceRate: 0.05,
        goodsValue: 0,
        subtotal: 0,
        profitRate: 10,
        driverRate: 20,
        totalCost: 0
      },
      logisticsCostItems: [],
      summary: {
        materialTotalCost: 0,
        designTotalCost: 0,
        processTotalCost: 0,
        inHouseAssemblyWholeLineCost: 0,
        inHouseCommissioningWholeLineCost: 0,
        onsiteAssemblyWholeLineCost: 0,
        onsiteCommissioningWholeLineCost: 0,
        projectCostSubtotal: 0,
        otherCosts: 0,
        projectRiskCost: 0,
        financialRiskCost: 0,
        warrantyRiskCost: 0,
        indirectCost: 0,
        totalCost: 0
      },
      rules: {
        projectName: [
          { required: true, message: '请输入项目名称', trigger: 'blur' }
        ],
        customerId: [
          { required: true, message: '请选择客户', trigger: 'change' }
        ]
      }
    }
  },
  computed: {
    dialogTitle() {
      if (this.isView) {
        return '查看价格计算'
      }
      return this.isEdit ? '编辑价格计算' : '新建价格计算'
    },
    nextCalculationId() {
      const maxId = this.priceCalculations.reduce((max, item) => {
        const num = parseInt(item.id.replace('JC', '')) || 0
        return Math.max(max, num)
      }, 0)
      return 'JC' + String(maxId + 1).padStart(4, '0')
    },
    nextSolutionId() {
      const maxId = this.priceCalculations.reduce((max, item) => {
        const num = parseInt(item.solutionId.replace('FA', '')) || 0
        return Math.max(max, num)
      }, 0)
      return 'FA' + String(maxId + 1).padStart(4, '0')
    }
  },
  mounted() {
    this.loadData()
    this.loadRates()
    this.loadCustomers()
    this.loadUsers()
    document.addEventListener('fullscreenchange', this.handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', this.handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', this.handleFullscreenChange)
  },
  beforeUnmount() {
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange)
    document.removeEventListener('webkitfullscreenchange', this.handleFullscreenChange)
    document.removeEventListener('mozfullscreenchange', this.handleFullscreenChange)
    document.removeEventListener('MSFullscreenChange', this.handleFullscreenChange)
  },
  methods: {
    loadData() {
      const savedData = localStorage.getItem('priceCalculations')
      if (savedData) {
        this.priceCalculations = JSON.parse(savedData)
      } else {
        this.priceCalculations = [
          {
            id: 'JC0001',
            solutionId: 'FA0001',
            projectName: '自动化生产线改造',
            customerName: '上海XX电子有限公司',
            totalPrice: 1650000,
            status: 'completed',
            createDate: '2026-03-11'
          }
        ]
      }
      this.total = this.priceCalculations.length
    },
    loadRates() {
      const savedRates = localStorage.getItem('priceCalcRates')
      if (savedRates) {
        try {
          const rates = JSON.parse(savedRates)
          this.rates = {
            mechanicalDesignRate: rates.mechanicalDesignRate || 150,
            electricalDesignRate: rates.electricalDesignRate || 160,
            softwareDesignRate: rates.softwareDesignRate || 180,
            mechanicalProcessRate: rates.mechanicalProcessRate || 120,
            electricalProcessRate: rates.electricalProcessRate || 130,
            inHouseAssemblySelfRate: rates.inHouseAssemblySelfRate || 190.22,
            inHouseAssemblyOutsourceRate: rates.inHouseAssemblyOutsourceRate || 66.00,
            inHouseCommissioningSelfRate: rates.inHouseCommissioningSelfRate || 190.22,
            inHouseCommissioningOutsourceRate: rates.inHouseCommissioningOutsourceRate || 66.00,
            onsiteAssemblySelfRate: rates.onsiteAssemblySelfRate || 190.22,
            onsiteAssemblyOutsourceRate: rates.onsiteAssemblyOutsourceRate || 66.00,
            onsiteCommissioningSelfRate: rates.onsiteCommissioningSelfRate || 190.22,
            onsiteCommissioningOutsourceRate: rates.onsiteCommissioningOutsourceRate || 66.00
          }
        } catch (e) {
          console.error('加载费率失败:', e)
        }
      }
      
      // 从系统设置加载标准成本费率
      const savedStandardRates = localStorage.getItem('standardCostRates')
      if (savedStandardRates) {
        try {
          const standardRates = JSON.parse(savedStandardRates)
          // 查找C05-C10对应的费率
          const c05Self = standardRates.find(r => r.code === 'C05' && r.type === '自制')
          const c05Outsource = standardRates.find(r => r.code === 'C05' && r.type === '外包')
          const c06Self = standardRates.find(r => r.code === 'C06' && r.type === '自制')
          const c06Outsource = standardRates.find(r => r.code === 'C06' && r.type === '外包')
          const c07Self = standardRates.find(r => r.code === 'C07' && r.type === '自制')
          const c07Outsource = standardRates.find(r => r.code === 'C07' && r.type === '外包')
          const c08Self = standardRates.find(r => r.code === 'C08' && r.type === '自制')
          const c08Outsource = standardRates.find(r => r.code === 'C08' && r.type === '外包')
          
          if (c05Self) this.rates.inHouseAssemblySelfRate = c05Self.hourlyRate
          if (c05Outsource) this.rates.inHouseAssemblyOutsourceRate = c05Outsource.hourlyRate
          if (c06Self) this.rates.inHouseCommissioningSelfRate = c06Self.hourlyRate
          if (c06Outsource) this.rates.inHouseCommissioningOutsourceRate = c06Outsource.hourlyRate
          if (c07Self) this.rates.onsiteAssemblySelfRate = c07Self.hourlyRate
          if (c07Outsource) this.rates.onsiteAssemblyOutsourceRate = c07Outsource.hourlyRate
          if (c08Self) this.rates.onsiteCommissioningSelfRate = c08Self.hourlyRate
          if (c08Outsource) this.rates.onsiteCommissioningOutsourceRate = c08Outsource.hourlyRate
        } catch (e) {
          console.error('加载标准成本费率失败:', e)
        }
      }
      
      const savedSelfMadeRates = localStorage.getItem('selfMadeRates')
      if (savedSelfMadeRates) {
        try {
          const rates = JSON.parse(savedSelfMadeRates)
          if (rates.projectManagement) {
            this.rates.projectManagementRate = rates.projectManagement
          }
        } catch (e) {
          console.error('加载自制费率失败:', e)
        }
      }
    },
    loadCustomers() {
      const savedCustomers = localStorage.getItem('customers')
      if (savedCustomers) {
        this.customers = JSON.parse(savedCustomers)
      } else {
        this.customers = [
          { id: 1, name: '上海XX电子有限公司' },
          { id: 2, name: '北京XX物流有限公司' },
          { id: 3, name: '广州XX制造有限公司' },
          { id: 4, name: '深圳XX科技有限公司' },
          { id: 5, name: '杭州XX自动化有限公司' }
        ]
      }
    },
    loadUsers() {
      const savedUsers = localStorage.getItem('users')
      if (savedUsers) {
        this.users = JSON.parse(savedUsers)
      } else {
        this.users = [
          { id: 1, name: '管理员', department: '管理部' },
          { id: 2, name: '销售1', department: '销售部' },
          { id: 3, name: '项目经理1', department: '项目管理部' },
          { id: 4, name: '工程师1', department: '技术部' },
          { id: 5, name: '工程师2', department: '技术部' },
          { id: 6, name: '采购1', department: '采购部' }
        ]
      }
    },
    handleCustomerChange(customerId) {
      const customer = this.customers.find(c => c.id === customerId)
      if (customer) {
        this.priceForm.customerName = customer.name
      }
    },
    toggleFullscreen() {
      if (!this.isFullscreen) {
        const elem = document.documentElement
        if (elem.requestFullscreen) {
          elem.requestFullscreen()
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen()
        } else if (elem.mozRequestFullScreen) {
          elem.mozRequestFullScreen()
        } else if (elem.msRequestFullscreen) {
          elem.msRequestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen()
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen()
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen()
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen()
        }
      }
    },
    handleFullscreenChange() {
      const isFullscreen = !!(document.fullscreenElement || 
                             document.webkitFullscreenElement || 
                             document.mozFullScreenElement || 
                             document.msFullscreenElement)
      this.isFullscreen = isFullscreen
    },
    toggleDialogFullscreen() {
      this.isDialogFullscreen = !this.isDialogFullscreen
    },
    addPriceCalculation() {
      this.isEdit = false
      this.isView = false
      this.isDialogFullscreen = false
      
      this.priceForm = {
        id: this.nextCalculationId,
        solutionId: this.nextSolutionId,
        customerId: '',
        customerName: '',
        projectName: '',
        businessManager: '',
        solutionManager: '',
        electricalManager: '',
        engineeringManager: '',
        equipmentType: '',
        inHouseAssemblyWholeLineHours: 0,
        inHouseAssemblyWholeLineType: 'self',
        inHouseCommissioningWholeLineHours: 0,
        inHouseCommissioningWholeLineType: 'self',
        onsiteAssemblyWholeLineHours: 0,
        onsiteAssemblyWholeLineType: 'self',
        onsiteCommissioningWholeLineHours: 0,
        onsiteCommissioningWholeLineType: 'self',
        packagingCost: 0,
        logisticsCost: 0,
        travelCost: 0,
        customsCost: 0,
        insuranceCost: 0,
        otherCost: 0,
        projectRiskRate: 3,
        financialRiskRate: 0.5,
        warrantyRiskRate: 2.5,
        indirectCostRate: 17.44,
        totalPrice: 0,
        remark: ''
      }
      
      this.moduleItems = []
      this.zoneCount = 0
      this.travelCostForm = {
        allowanceRate: 330,
        transportRate: 1200,
        totalCost: 0
      }
      this.travelCostItems = [
        { description: '机械设计', manDays: 0, peopleCount: 0, travelDays: 0, allowanceCost: 0, travelTimes: 0, transportCost: 0 },
        { description: '电气设计', manDays: 0, peopleCount: 0, travelDays: 0, allowanceCost: 0, travelTimes: 0, transportCost: 0 },
        { description: '液压设计', manDays: 0, peopleCount: 0, travelDays: 0, allowanceCost: 0, travelTimes: 0, transportCost: 0 },
        { description: '方案', manDays: 0, peopleCount: 0, travelDays: 0, allowanceCost: 0, travelTimes: 0, transportCost: 0 },
        { description: '项目管理', manDays: 0, peopleCount: 0, travelDays: 0, allowanceCost: 0, travelTimes: 0, transportCost: 0 },
        { description: '现场调试成本', manDays: 0, peopleCount: 0, travelDays: 0, allowanceCost: 0, travelTimes: 0, transportCost: 0 },
        { description: '现场电气装配', manDays: 0, peopleCount: 0, travelDays: 0, allowanceCost: 0, travelTimes: 0, transportCost: 0 },
        { description: '现场机械装配', manDays: 0, peopleCount: 0, travelDays: 0, allowanceCost: 0, travelTimes: 0, transportCost: 0 }
      ]
      this.logisticsCostForm = {
        distance: 0,
        packagingFee: 0,
        insuranceRate: 0.05,
        goodsValue: 0,
        subtotal: 0,
        profitRate: 10,
        driverRate: 20,
        totalCost: 0
      }
      this.logisticsCostItems = []
      this.resetSummary()
      this.dialogVisible = true
    },
    addModuleItem() {
      this.moduleItems.push({
        moduleName: '',
        productionLine: 1,
        zone: 1,
        moduleType: 'mechanical',
        manufactureType: 'self',
        mechanicalMaterialPrice: 0,
        electricalMaterialPrice: 0,
        materialPrice: 0,
        quantity: 1,
        unit: 'set',
        materialTotalCost: 0,
        mechanicalDesignHours: 0,
        electricalDesignHours: 0,
        softwareDesignHours: 0,
        totalDesignHours: 0,
        designTotalCost: 0,
        mechanicalProcessHours: 0,
        electricalProcessHours: 0,
        totalProcessHours: 0,
        processTotalCost: 0,
        moduleTotalCost: 0,
        remark: ''
      })
    },
    removeModuleItem(index) {
      this.moduleItems.splice(index, 1)
      this.calculateAll()
    },
    calculateModuleTotal(row) {
      row.mechanicalMaterialPrice = parseFloat(row.mechanicalMaterialPrice) || 0
      row.electricalMaterialPrice = parseFloat(row.electricalMaterialPrice) || 0
      row.quantity = parseFloat(row.quantity) || 1
      row.mechanicalDesignHours = parseFloat(row.mechanicalDesignHours) || 0
      row.electricalDesignHours = parseFloat(row.electricalDesignHours) || 0
      row.softwareDesignHours = parseFloat(row.softwareDesignHours) || 0
      row.mechanicalProcessHours = parseFloat(row.mechanicalProcessHours) || 0
      row.electricalProcessHours = parseFloat(row.electricalProcessHours) || 0
      
      row.materialPrice = row.mechanicalMaterialPrice + row.electricalMaterialPrice
      row.materialTotalCost = row.materialPrice * row.quantity
      
      row.totalDesignHours = row.mechanicalDesignHours + row.electricalDesignHours + row.softwareDesignHours
      row.designTotalCost = row.mechanicalDesignHours * this.rates.mechanicalDesignRate + 
                         row.electricalDesignHours * this.rates.electricalDesignRate + 
                         row.softwareDesignHours * this.rates.softwareDesignRate
      
      row.totalProcessHours = row.mechanicalProcessHours + row.electricalProcessHours
      row.processTotalCost = row.mechanicalProcessHours * this.rates.mechanicalProcessRate + 
                          row.electricalProcessHours * this.rates.electricalProcessRate
      
      row.moduleTotalCost = row.materialTotalCost + row.designTotalCost + row.processTotalCost
      
      this.calculateAll()
    },
    calculateAll() {
      this.summary.materialTotalCost = this.moduleItems.reduce((sum, item) => sum + (item.materialTotalCost || 0), 0)
      
      this.summary.designTotalCost = this.moduleItems.reduce((sum, item) => sum + (item.designTotalCost || 0), 0)
      
      this.summary.processTotalCost = this.moduleItems.reduce((sum, item) => sum + (item.processTotalCost || 0), 0)
      
      // 计算整线成本
      const inHouseAssemblyRate = this.priceForm.inHouseAssemblyWholeLineType === 'self' 
        ? this.rates.inHouseAssemblySelfRate 
        : this.rates.inHouseAssemblyOutsourceRate
      const inHouseCommissioningRate = this.priceForm.inHouseCommissioningWholeLineType === 'self'
        ? this.rates.inHouseCommissioningSelfRate
        : this.rates.inHouseCommissioningOutsourceRate
      const onsiteAssemblyRate = this.priceForm.onsiteAssemblyWholeLineType === 'self'
        ? this.rates.onsiteAssemblySelfRate
        : this.rates.onsiteAssemblyOutsourceRate
      const onsiteCommissioningRate = this.priceForm.onsiteCommissioningWholeLineType === 'self'
        ? this.rates.onsiteCommissioningSelfRate
        : this.rates.onsiteCommissioningOutsourceRate
      
      this.summary.inHouseAssemblyWholeLineCost = parseFloat(this.priceForm.inHouseAssemblyWholeLineHours || 0) * inHouseAssemblyRate
      this.summary.inHouseCommissioningWholeLineCost = parseFloat(this.priceForm.inHouseCommissioningWholeLineHours || 0) * inHouseCommissioningRate
      this.summary.onsiteAssemblyWholeLineCost = parseFloat(this.priceForm.onsiteAssemblyWholeLineHours || 0) * onsiteAssemblyRate
      this.summary.onsiteCommissioningWholeLineCost = parseFloat(this.priceForm.onsiteCommissioningWholeLineHours || 0) * onsiteCommissioningRate
      
      const wholeLineTotalCost = this.summary.inHouseAssemblyWholeLineCost + 
                                 this.summary.inHouseCommissioningWholeLineCost + 
                                 this.summary.onsiteAssemblyWholeLineCost + 
                                 this.summary.onsiteCommissioningWholeLineCost
      
      this.summary.projectCostSubtotal = this.summary.materialTotalCost + this.summary.designTotalCost + this.summary.processTotalCost + wholeLineTotalCost
      
      const otherCosts = parseFloat(this.priceForm.packagingCost || 0) + 
                         parseFloat(this.priceForm.logisticsCost || 0) + 
                         parseFloat(this.priceForm.travelCost || 0) + 
                         parseFloat(this.priceForm.customsCost || 0) + 
                         parseFloat(this.priceForm.insuranceCost || 0) +
                         parseFloat(this.priceForm.otherCost || 0)
      
      const baseForRisk = this.summary.projectCostSubtotal + otherCosts
      
      this.summary.projectRiskCost = baseForRisk * (parseFloat(this.priceForm.projectRiskRate) / 100)
      this.summary.financialRiskCost = baseForRisk * (parseFloat(this.priceForm.financialRiskRate) / 100)
      this.summary.warrantyRiskCost = baseForRisk * (parseFloat(this.priceForm.warrantyRiskRate) / 100)
      this.summary.indirectCost = baseForRisk * (parseFloat(this.priceForm.indirectCostRate) / 100)
      
      this.summary.totalCost = baseForRisk + 
                               this.summary.projectRiskCost + 
                               this.summary.financialRiskCost + 
                               this.summary.warrantyRiskCost + 
                               this.summary.indirectCost
      
      this.priceForm.totalPrice = this.summary.totalCost
    },
    resetSummary() {
      this.summary = {
        materialTotalCost: 0,
        designTotalCost: 0,
        processTotalCost: 0,
        inHouseAssemblyWholeLineCost: 0,
        inHouseCommissioningWholeLineCost: 0,
        onsiteAssemblyWholeLineCost: 0,
        onsiteCommissioningWholeLineCost: 0,
        projectCostSubtotal: 0,
        otherCosts: 0,
        projectRiskCost: 0,
        financialRiskCost: 0,
        warrantyRiskCost: 0,
        indirectCost: 0,
        totalCost: 0
      }
    },
    viewPriceCalculation(id) {
      this.isView = true
      this.isEdit = false
      
      const calculation = this.priceCalculations.find(c => c.id === id)
      if (calculation) {
        this.priceForm = { ...calculation }
        this.moduleItems = calculation.moduleItems || []
        this.zoneCount = calculation.zoneCount || 0
        this.travelCostForm = calculation.travelCostForm || {
          allowanceRate: 330,
          transportRate: 1200,
          totalCost: 0
        }
        this.travelCostItems = calculation.travelCostItems || [
          { description: '机械设计', manDays: 0, peopleCount: 0, travelDays: 0, allowanceCost: 0, travelTimes: 0, transportCost: 0 },
          { description: '电气设计', manDays: 0, peopleCount: 0, travelDays: 0, allowanceCost: 0, travelTimes: 0, transportCost: 0 },
          { description: '液压设计', manDays: 0, peopleCount: 0, travelDays: 0, allowanceCost: 0, travelTimes: 0, transportCost: 0 },
          { description: '方案', manDays: 0, peopleCount: 0, travelDays: 0, allowanceCost: 0, travelTimes: 0, transportCost: 0 },
          { description: '项目管理', manDays: 0, peopleCount: 0, travelDays: 0, allowanceCost: 0, travelTimes: 0, transportCost: 0 },
          { description: '现场调试成本', manDays: 0, peopleCount: 0, travelDays: 0, allowanceCost: 0, travelTimes: 0, transportCost: 0 },
          { description: '现场电气装配', manDays: 0, peopleCount: 0, travelDays: 0, allowanceCost: 0, travelTimes: 0, transportCost: 0 },
          { description: '现场机械装配', manDays: 0, peopleCount: 0, travelDays: 0, allowanceCost: 0, travelTimes: 0, transportCost: 0 }
        ]
        this.logisticsCostForm = calculation.logisticsCostForm || {
          distance: 0,
          packagingFee: 0,
          insuranceRate: 0.05,
          goodsValue: 0,
          subtotal: 0,
          profitRate: 10,
          driverRate: 20,
          totalCost: 0
        }
        this.logisticsCostItems = calculation.logisticsCostItems || []
        this.calculateAll()
        this.dialogVisible = true
      }
    },
    editPriceCalculation(id) {
      this.isEdit = true
      this.isView = false
      
      const calculation = this.priceCalculations.find(c => c.id === id)
      if (calculation) {
        this.priceForm = { ...calculation }
        this.moduleItems = calculation.moduleItems || []
        this.travelCostForm = calculation.travelCostForm || {
          allowanceRate: 330,
          transportRate: 1200,
          totalCost: 0
        }
        this.travelCostItems = calculation.travelCostItems || [
          { description: '机械设计', manDays: 0, peopleCount: 0, travelDays: 0, allowanceCost: 0, travelTimes: 0, transportCost: 0 },
          { description: '电气设计', manDays: 0, peopleCount: 0, travelDays: 0, allowanceCost: 0, travelTimes: 0, transportCost: 0 },
          { description: '液压设计', manDays: 0, peopleCount: 0, travelDays: 0, allowanceCost: 0, travelTimes: 0, transportCost: 0 },
          { description: '方案', manDays: 0, peopleCount: 0, travelDays: 0, allowanceCost: 0, travelTimes: 0, transportCost: 0 },
          { description: '项目管理', manDays: 0, peopleCount: 0, travelDays: 0, allowanceCost: 0, travelTimes: 0, transportCost: 0 },
          { description: '现场调试成本', manDays: 0, peopleCount: 0, travelDays: 0, allowanceCost: 0, travelTimes: 0, transportCost: 0 },
          { description: '现场电气装配', manDays: 0, peopleCount: 0, travelDays: 0, allowanceCost: 0, travelTimes: 0, transportCost: 0 },
          { description: '现场机械装配', manDays: 0, peopleCount: 0, travelDays: 0, allowanceCost: 0, travelTimes: 0, transportCost: 0 }
        ]
        this.logisticsCostForm = calculation.logisticsCostForm || {
          distance: 0,
          packagingFee: 0,
          insuranceRate: 0.05,
          goodsValue: 0,
          subtotal: 0,
          profitRate: 10,
          driverRate: 20,
          totalCost: 0
        }
        this.logisticsCostItems = calculation.logisticsCostItems || []
        this.calculateAll()
        this.dialogVisible = true
      }
    },
    savePriceCalculation() {
      this.$refs.formRef.validate((valid) => {
        if (valid) {
          this.calculateAll()
          
          const dataToSave = {
            ...this.priceForm,
            moduleItems: this.moduleItems,
            zoneCount: this.zoneCount,
            travelCostForm: this.travelCostForm,
            travelCostItems: this.travelCostItems,
            logisticsCostForm: this.logisticsCostForm,
            logisticsCostItems: this.logisticsCostItems,
            updateDate: new Date().toISOString().split('T')[0]
          }
          
          if (this.isEdit) {
            const index = this.priceCalculations.findIndex(c => c.id === this.priceForm.id)
            if (index !== -1) {
              this.priceCalculations[index] = dataToSave
            }
            this.$message.success('更新成功')
          } else {
            dataToSave.createDate = new Date().toISOString().split('T')[0]
            dataToSave.status = 'processing'
            this.priceCalculations.push(dataToSave)
            this.total++
            this.$message.success('创建成功')
          }
          
          localStorage.setItem('priceCalculations', JSON.stringify(this.priceCalculations))
          this.dialogVisible = false
        }
      })
    },
    search() {
      console.log('搜索:', this.searchQuery, this.status)
    },
    exportPriceCalculations() {
      this.$message.success('导出成功')
    },
    handleSizeChange(size) {
      this.pageSize = size
    },
    handleCurrentChange(current) {
      this.currentPage = current
    },
    formatPrice(row, column, cellValue) {
      return cellValue ? `¥${cellValue.toLocaleString()}` : ''
    },
    formatNumber(value) {
      return value ? value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'
    },
    handleEquipmentTypeChange(value) {
      if (value === 'single_machine') {
        // 单机类型时，清空产线和区域数据
        this.moduleItems.forEach(item => {
          item.productionLine = null
          item.zone = null
        })
        this.zoneCount = 0
      } else {
        // 产线类型时，初始化产线和区域
        this.moduleItems.forEach(item => {
          item.productionLine = item.productionLine || 1
          item.zone = item.zone || 1
        })
        this.updateZoneCount()
      }
    },
    updateZoneCount() {
      if (this.priceForm.equipmentType === 'production_line') {
        const zones = this.moduleItems.map(item => item.zone).filter(z => z)
        this.zoneCount = zones.length > 0 ? Math.max(...zones) : 0
      } else {
        this.zoneCount = 0
      }
    },
    calculateTravelCost() {
      let totalAllowanceCost = 0
      let totalTransportCost = 0
      
      this.travelCostItems.forEach(item => {
        item.manDays = parseFloat(item.manDays) || 0
        item.peopleCount = parseInt(item.peopleCount) || 0
        item.travelDays = parseFloat(item.travelDays) || 0
        item.travelTimes = parseInt(item.travelTimes) || 0
        
        item.allowanceCost = item.travelDays * this.travelCostForm.allowanceRate * item.peopleCount
        item.transportCost = item.travelTimes * this.travelCostForm.transportRate
        
        totalAllowanceCost += item.allowanceCost
        totalTransportCost += item.transportCost
      })
      
      this.travelCostForm.totalCost = totalAllowanceCost + totalTransportCost
      this.priceForm.travelCost = this.travelCostForm.totalCost
      this.calculateAll()
    },
    addLogisticsItem() {
      this.logisticsCostItems.push({
        vehicleType: '',
        fuelCost: 0,
        tollCost: 0,
        isHighway: false,
        vehicleCount: 0,
        totalCost: 0,
        remark: ''
      })
    },
    removeLogisticsItem(index) {
      this.logisticsCostItems.splice(index, 1)
      this.calculateLogisticsCost()
    },
    calculateLogisticsCost() {
      let itemsTotal = 0
      
      this.logisticsCostItems.forEach(item => {
        item.fuelCost = parseFloat(item.fuelCost) || 0
        item.tollCost = parseFloat(item.tollCost) || 0
        item.vehicleCount = parseInt(item.vehicleCount) || 0
        
        const distance = parseFloat(this.logisticsCostForm.distance) || 0
        const costPerKm = item.isHighway ? item.fuelCost + item.tollCost : item.fuelCost
        item.totalCost = costPerKm * distance * item.vehicleCount
        
        itemsTotal += item.totalCost
      })
      
      const packagingFee = parseFloat(this.logisticsCostForm.packagingFee) || 0
      const insuranceRate = parseFloat(this.logisticsCostForm.insuranceRate) || 0
      const goodsValue = parseFloat(this.logisticsCostForm.goodsValue) || 0
      const insuranceCost = goodsValue * (insuranceRate / 100)
      
      this.logisticsCostForm.subtotal = itemsTotal + packagingFee + insuranceCost
      
      const profitRate = parseFloat(this.logisticsCostForm.profitRate) || 0
      const driverRate = parseFloat(this.logisticsCostForm.driverRate) || 0
      const profitCost = this.logisticsCostForm.subtotal * (profitRate / 100)
      const driverCost = this.logisticsCostForm.subtotal * (driverRate / 100)
      
      this.logisticsCostForm.totalCost = this.logisticsCostForm.subtotal + profitCost + driverCost
      this.priceForm.logisticsCost = this.logisticsCostForm.totalCost
      this.calculateAll()
    }
  }
}
</script>

<style scoped>
.price-calculation {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
}

.price-calculation.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  border-radius: 0;
  overflow-y: auto;
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

.header-actions {
  display: flex;
  gap: 10px;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.price-form {
  padding: 20px 0;
}

.module-table-container {
  overflow-x: auto;
}

.module-table-container :deep(.el-table) {
  min-width: 2500px;
}

.total-cost {
  font-weight: bold;
  color: #f56c6c;
}

.highlight-input :deep(.el-input__inner) {
  font-weight: bold;
  color: #409eff;
}

.final-price :deep(.el-input__inner) {
  font-weight: bold;
  color: #67c23a;
  font-size: 16px;
}

.thick-divider {
  height: 3px;
  background-color: #dcdfe6;
  margin: 20px 0;
  border-radius: 2px;
}
</style>