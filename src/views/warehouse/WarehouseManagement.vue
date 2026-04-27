<template>
  <div class="warehouse-management">
    <div class="page-header">
      <h2 class="page-title">仓库管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="addReceiving">
          <i class="fa fa-plus"></i> 新建收货单
        </el-button>
        <el-button type="success" @click="addSemiInstock">
          <i class="fa fa-plus"></i> 半成品入库
        </el-button>
        <el-button type="info" @click="addFinishedInstock">
          <i class="fa fa-plus"></i> 成品入库
        </el-button>
      </div>
    </div>
    
    <el-tabs v-model="activeTab" type="card">
      <!-- 收货管理 -->
      <el-tab-pane label="收货管理" name="receiving">
        <div class="receiving-management">
          <div class="search-bar">
            <el-input
              v-model="receivingSearchQuery"
              placeholder="搜索收货单号或供应商"
              prefix-icon="el-icon-search"
              style="width: 300px;"
            ></el-input>
            <el-select v-model="receivingStatus" placeholder="选择状态">
              <el-option label="全部" value=""></el-option>
              <el-option label="待收货" value="pending"></el-option>
              <el-option label="已收货" value="received"></el-option>
              <el-option label="已入库" value="instocked"></el-option>
            </el-select>
            <el-button type="primary" @click="searchReceiving">搜索</el-button>
          </div>
          
          <el-table :data="receivings" style="width: 100%" border>
            <el-table-column prop="id" label="收货单号" width="120"></el-table-column>
            <el-table-column prop="supplierName" label="供应商" min-width="150"></el-table-column>
            <el-table-column prop="purchaseOrderNo" label="采购订单" width="120"></el-table-column>
            <el-table-column prop="itemCount" label="物料项数" width="100"></el-table-column>
            <el-table-column prop="totalQuantity" label="总数量" width="100"></el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag v-if="scope.row.status === 'pending'" type="info">待收货</el-tag>
                <el-tag v-else-if="scope.row.status === 'received'" type="warning">已收货</el-tag>
                <el-tag v-else-if="scope.row.status === 'instocked'" type="success">已入库</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="150"></el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="scope">
                <el-button type="primary" size="small" @click="viewReceiving(scope.row.id)">查看</el-button>
                <el-button type="success" size="small" @click="receiveGoods(scope.row.id)" v-if="scope.row.status === 'pending'">收货</el-button>
                <el-button type="warning" size="small" @click="instockGoods(scope.row.id)" v-if="scope.row.status === 'received'">入库</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination">
            <el-pagination
              v-model:current-page="receivingCurrentPage"
              v-model:page-size="receivingPageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="receivingTotal"
              @size-change="handleReceivingSizeChange"
              @current-change="handleReceivingCurrentChange"
            ></el-pagination>
          </div>
        </div>
      </el-tab-pane>
      
      <!-- 库存管理 -->
      <el-tab-pane label="库存管理" name="inventory">
        <div class="inventory-management">
          <div class="search-bar">
            <el-input
              v-model="inventorySearchQuery"
              placeholder="搜索物料编码或名称"
              prefix-icon="el-icon-search"
              style="width: 300px;"
            ></el-input>
            <el-select v-model="inventoryWarehouse" placeholder="选择仓库">
              <el-option label="全部仓库" value=""></el-option>
              <el-option label="原材料仓" value="raw"></el-option>
              <el-option label="半成品仓" value="semi"></el-option>
              <el-option label="成品仓" value="finished"></el-option>
            </el-select>
            <el-button type="primary" @click="searchInventory">搜索</el-button>
          </div>
          
          <el-table :data="inventoryItems" style="width: 100%" border>
            <el-table-column prop="materialCode" label="物料编码" width="120"></el-table-column>
            <el-table-column prop="materialName" label="物料名称" min-width="180"></el-table-column>
            <el-table-column prop="specification" label="规格型号" width="120"></el-table-column>
            <el-table-column prop="unit" label="单位" width="80"></el-table-column>
            <el-table-column prop="quantity" label="库存数量" width="100"></el-table-column>
            <el-table-column prop="warehouse" label="仓库" width="100"></el-table-column>
            <el-table-column prop="location" label="库位" width="100"></el-table-column>
            <el-table-column prop="lastUpdate" label="最后更新" width="150"></el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="scope">
                <el-button type="primary" size="small" @click="viewInventory(scope.row.id)">查看</el-button>
                <el-button type="warning" size="small" @click="adjustInventory(scope.row.id)">调整</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination">
            <el-pagination
              v-model:current-page="inventoryCurrentPage"
              v-model:page-size="inventoryPageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="inventoryTotal"
              @size-change="handleInventorySizeChange"
              @current-change="handleInventoryCurrentChange"
            ></el-pagination>
          </div>
        </div>
      </el-tab-pane>
      
      <!-- 半成品入库 -->
      <el-tab-pane label="半成品入库" name="semi-instock">
        <div class="semi-instock-management">
          <div class="search-bar">
            <el-input
              v-model="semiInstockSearchQuery"
              placeholder="搜索入库单号或产品名称"
              prefix-icon="el-icon-search"
              style="width: 300px;"
            ></el-input>
            <el-select v-model="semiInstockStatus" placeholder="选择状态">
              <el-option label="全部" value=""></el-option>
              <el-option label="待入库" value="pending"></el-option>
              <el-option label="已入库" value="instocked"></el-option>
            </el-select>
            <el-button type="primary" @click="searchSemiInstock">搜索</el-button>
          </div>
          
          <el-table :data="semiInstocks" style="width: 100%" border>
            <el-table-column prop="id" label="入库单号" width="120"></el-table-column>
            <el-table-column prop="productName" label="产品名称" min-width="150"></el-table-column>
            <el-table-column prop="productionOrderNo" label="生产订单" width="120"></el-table-column>
            <el-table-column prop="quantity" label="入库数量" width="100"></el-table-column>
            <el-table-column prop="warehouse" label="仓库" width="100"></el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag v-if="scope.row.status === 'pending'" type="info">待入库</el-tag>
                <el-tag v-else type="success">已入库</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="150"></el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="scope">
                <el-button type="primary" size="small" @click="viewSemiInstock(scope.row.id)">查看</el-button>
                <el-button type="success" size="small" @click="confirmSemiInstock(scope.row.id)" v-if="scope.row.status === 'pending'">确认入库</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination">
            <el-pagination
              v-model:current-page="semiInstockCurrentPage"
              v-model:page-size="semiInstockPageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="semiInstockTotal"
              @size-change="handleSemiInstockSizeChange"
              @current-change="handleSemiInstockCurrentChange"
            ></el-pagination>
          </div>
        </div>
      </el-tab-pane>
      
      <!-- 成品入库 -->
      <el-tab-pane label="成品入库" name="finished-instock">
        <div class="finished-instock-management">
          <div class="search-bar">
            <el-input
              v-model="finishedInstockSearchQuery"
              placeholder="搜索入库单号或产品名称"
              prefix-icon="el-icon-search"
              style="width: 300px;"
            ></el-input>
            <el-select v-model="finishedInstockStatus" placeholder="选择状态">
              <el-option label="全部" value=""></el-option>
              <el-option label="待入库" value="pending"></el-option>
              <el-option label="已入库" value="instocked"></el-option>
            </el-select>
            <el-button type="primary" @click="searchFinishedInstock">搜索</el-button>
          </div>
          
          <el-table :data="finishedInstocks" style="width: 100%" border>
            <el-table-column prop="id" label="入库单号" width="120"></el-table-column>
            <el-table-column prop="productName" label="产品名称" min-width="150"></el-table-column>
            <el-table-column prop="productionOrderNo" label="生产订单" width="120"></el-table-column>
            <el-table-column prop="quantity" label="入库数量" width="100"></el-table-column>
            <el-table-column prop="warehouse" label="仓库" width="100"></el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag v-if="scope.row.status === 'pending'" type="info">待入库</el-tag>
                <el-tag v-else type="success">已入库</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="150"></el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="scope">
                <el-button type="primary" size="small" @click="viewFinishedInstock(scope.row.id)">查看</el-button>
                <el-button type="success" size="small" @click="confirmFinishedInstock(scope.row.id)" v-if="scope.row.status === 'pending'">确认入库</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination">
            <el-pagination
              v-model:current-page="finishedInstockCurrentPage"
              v-model:page-size="finishedInstockPageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="finishedInstockTotal"
              @size-change="handleFinishedInstockSizeChange"
              @current-change="handleFinishedInstockCurrentChange"
            ></el-pagination>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
    
    <!-- 收货单表单对话框 -->
    <el-dialog
      v-model="receivingDialogVisible"
      :title="isEditReceiving ? '编辑收货单' : '新建收货单'"
      width="70%"
      destroy-on-close
    >
      <div class="receiving-form">
        <el-form :model="receivingForm" :rules="receivingRules" ref="receivingFormRef" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="收货单号" prop="id">
                <el-input v-model="receivingForm.id" placeholder="请输入收货单号" :disabled="isEditReceiving"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="供应商" prop="supplierId">
                <el-select v-model="receivingForm.supplierId" placeholder="请选择供应商" style="width: 100%">
                  <el-option v-for="supplier in suppliers" :key="supplier.id" :label="supplier.name" :value="supplier.id"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="采购订单" prop="purchaseOrderId">
                <el-select v-model="receivingForm.purchaseOrderId" placeholder="请选择采购订单" style="width: 100%">
                  <el-option v-for="order in purchaseOrders" :key="order.id" :label="order.id" :value="order.id"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="收货日期" prop="receivingDate">
                <el-date-picker v-model="receivingForm.receivingDate" type="date" placeholder="请选择收货日期" style="width: 100%"></el-date-picker>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        
        <div class="receiving-items">
          <div class="items-toolbar">
            <h3>收货明细</h3>
            <el-button type="primary" @click="addReceivingItem">
              <i class="fa fa-plus"></i> 添加物料
            </el-button>
            <el-button type="success" @click="importFromPurchaseOrder" v-if="receivingForm.purchaseOrderId">
              <i class="fa fa-download"></i> 从采购订单导入
            </el-button>
          </div>
          <el-table :data="receivingItems" style="width: 100%" border>
            <el-table-column prop="id" label="序号" width="60"></el-table-column>
            <el-table-column prop="materialCode" label="物料编码" width="120">
              <template #default="scope">
                <el-input v-model="scope.row.materialCode" placeholder="物料编码"></el-input>
              </template>
            </el-table-column>
            <el-table-column prop="materialName" label="物料名称" min-width="150">
              <template #default="scope">
                <el-input v-model="scope.row.materialName" placeholder="物料名称"></el-input>
              </template>
            </el-table-column>
            <el-table-column prop="specification" label="规格型号" width="120">
              <template #default="scope">
                <el-input v-model="scope.row.specification" placeholder="规格型号"></el-input>
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="100">
              <template #default="scope">
                <el-input-number v-model="scope.row.quantity" :min="0" :precision="2" :step="1" style="width: 100%"></el-input-number>
              </template>
            </el-table-column>
            <el-table-column prop="unit" label="单位" width="80">
              <template #default="scope">
                <el-input v-model="scope.row.unit" placeholder="单位"></el-input>
              </template>
            </el-table-column>
            <el-table-column prop="warehouse" label="仓库" width="100">
              <template #default="scope">
                <el-select v-model="scope.row.warehouse" placeholder="选择仓库" style="width: 100%">
                  <el-option label="原材料仓" value="raw"></el-option>
                  <el-option label="半成品仓" value="semi"></el-option>
                  <el-option label="成品仓" value="finished"></el-option>
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="scope">
                <el-button type="danger" size="small" @click="deleteReceivingItem(scope.row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="receivingDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveReceiving">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 半成品入库表单对话框 -->
    <el-dialog
      v-model="semiInstockDialogVisible"
      :title="isEditSemiInstock ? '编辑半成品入库' : '新建半成品入库'"
      width="70%"
      destroy-on-close
    >
      <div class="semi-instock-form">
        <el-form :model="semiInstockForm" :rules="semiInstockRules" ref="semiInstockFormRef" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="入库单号" prop="id">
                <el-input v-model="semiInstockForm.id" placeholder="请输入入库单号" :disabled="isEditSemiInstock"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="生产订单" prop="productionOrderId">
                <el-select v-model="semiInstockForm.productionOrderId" placeholder="请选择生产订单" style="width: 100%">
                  <el-option v-for="order in productionOrders" :key="order.id" :label="order.id" :value="order.id"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="产品名称" prop="productName">
                <el-input v-model="semiInstockForm.productName" placeholder="请输入产品名称"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="入库日期" prop="instockDate">
                <el-date-picker v-model="semiInstockForm.instockDate" type="date" placeholder="请选择入库日期" style="width: 100%"></el-date-picker>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="入库数量" prop="quantity">
                <el-input-number v-model="semiInstockForm.quantity" :min="1" :precision="0" :step="1" style="width: 100%"></el-input-number>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="仓库" prop="warehouse">
                <el-select v-model="semiInstockForm.warehouse" placeholder="请选择仓库" style="width: 100%">
                  <el-option label="半成品仓" value="semi"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="备注" prop="remark">
            <el-input v-model="semiInstockForm.remark" type="textarea" :rows="2" placeholder="请输入备注"></el-input>
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="semiInstockDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveSemiInstock">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 成品入库表单对话框 -->
    <el-dialog
      v-model="finishedInstockDialogVisible"
      :title="isEditFinishedInstock ? '编辑成品入库' : '新建成品入库'"
      width="70%"
      destroy-on-close
    >
      <div class="finished-instock-form">
        <el-form :model="finishedInstockForm" :rules="finishedInstockRules" ref="finishedInstockFormRef" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="入库单号" prop="id">
                <el-input v-model="finishedInstockForm.id" placeholder="请输入入库单号" :disabled="isEditFinishedInstock"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="生产订单" prop="productionOrderId">
                <el-select v-model="finishedInstockForm.productionOrderId" placeholder="请选择生产订单" style="width: 100%">
                  <el-option v-for="order in productionOrders" :key="order.id" :label="order.id" :value="order.id"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="产品名称" prop="productName">
                <el-input v-model="finishedInstockForm.productName" placeholder="请输入产品名称"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="入库日期" prop="instockDate">
                <el-date-picker v-model="finishedInstockForm.instockDate" type="date" placeholder="请选择入库日期" style="width: 100%"></el-date-picker>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="入库数量" prop="quantity">
                <el-input-number v-model="finishedInstockForm.quantity" :min="1" :precision="0" :step="1" style="width: 100%"></el-input-number>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="仓库" prop="warehouse">
                <el-select v-model="finishedInstockForm.warehouse" placeholder="请选择仓库" style="width: 100%">
                  <el-option label="成品仓" value="finished"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="备注" prop="remark">
            <el-input v-model="finishedInstockForm.remark" type="textarea" :rows="2" placeholder="请输入备注"></el-input>
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="finishedInstockDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveFinishedInstock">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'WarehouseManagement',
  data() {
    return {
      activeTab: 'receiving',
      
      // 收货管理
      receivings: [
        {
          id: 'SH2026001',
          supplierName: '上海XX电子科技有限公司',
          purchaseOrderNo: 'CG2026001',
          itemCount: 5,
          totalQuantity: 100,
          status: 'instocked',
          createdAt: '2026-03-01'
        },
        {
          id: 'SH2026002',
          supplierName: '北京XX机械制造有限公司',
          purchaseOrderNo: 'CG2026002',
          itemCount: 3,
          totalQuantity: 50,
          status: 'received',
          createdAt: '2026-03-10'
        },
        {
          id: 'SH2026003',
          supplierName: '广州XX电气设备有限公司',
          purchaseOrderNo: 'CG2026003',
          itemCount: 2,
          totalQuantity: 20,
          status: 'pending',
          createdAt: '2026-03-15'
        }
      ],
      receivingSearchQuery: '',
      receivingStatus: '',
      receivingCurrentPage: 1,
      receivingPageSize: 10,
      receivingTotal: 3,
      receivingDialogVisible: false,
      isEditReceiving: false,
      receivingForm: {
        id: '',
        supplierId: '',
        purchaseOrderId: '',
        receivingDate: ''
      },
      receivingRules: {
        id: [
          { required: true, message: '请输入收货单号', trigger: 'blur' }
        ],
        supplierId: [
          { required: true, message: '请选择供应商', trigger: 'blur' }
        ],
        purchaseOrderId: [
          { required: true, message: '请选择采购订单', trigger: 'blur' }
        ],
        receivingDate: [
          { required: true, message: '请选择收货日期', trigger: 'blur' }
        ]
      },
      receivingItems: [
        {
          id: 1,
          materialCode: 'MAT001',
          materialName: 'PLC控制器',
          specification: 'S7-1200',
          quantity: 2,
          unit: '台',
          warehouse: 'raw'
        },
        {
          id: 2,
          materialCode: 'MAT002',
          materialName: '传感器',
          specification: '温度传感器',
          quantity: 20,
          unit: '个',
          warehouse: 'raw'
        }
      ],
      
      // 库存管理
      inventoryItems: [
        {
          id: 1,
          materialCode: 'MAT001',
          materialName: 'PLC控制器',
          specification: 'S7-1200',
          unit: '台',
          quantity: 15,
          warehouse: '原材料仓',
          location: 'A-01-01',
          lastUpdate: '2026-03-10'
        },
        {
          id: 2,
          materialCode: 'MAT002',
          materialName: '传感器',
          specification: '温度传感器',
          unit: '个',
          quantity: 100,
          warehouse: '原材料仓',
          location: 'A-02-03',
          lastUpdate: '2026-03-15'
        },
        {
          id: 3,
          materialCode: 'SMP001',
          materialName: '控制板',
          specification: 'V1.0',
          unit: '块',
          quantity: 50,
          warehouse: '半成品仓',
          location: 'B-01-01',
          lastUpdate: '2026-03-05'
        },
        {
          id: 4,
          materialCode: 'FNS001',
          materialName: '自动化控制系统',
          specification: 'V2.0',
          unit: '套',
          quantity: 10,
          warehouse: '成品仓',
          location: 'C-01-01',
          lastUpdate: '2026-03-20'
        }
      ],
      inventorySearchQuery: '',
      inventoryWarehouse: '',
      inventoryCurrentPage: 1,
      inventoryPageSize: 10,
      inventoryTotal: 4,
      
      // 半成品入库
      semiInstocks: [
        {
          id: 'BPRK2026001',
          productName: '控制板',
          productionOrderNo: 'SC2026001',
          quantity: 20,
          warehouse: '半成品仓',
          status: 'instocked',
          createdAt: '2026-03-05'
        },
        {
          id: 'BPRK2026002',
          productName: '传感器模块',
          productionOrderNo: 'SC2026002',
          quantity: 15,
          warehouse: '半成品仓',
          status: 'pending',
          createdAt: '2026-03-15'
        }
      ],
      semiInstockSearchQuery: '',
      semiInstockStatus: '',
      semiInstockCurrentPage: 1,
      semiInstockPageSize: 10,
      semiInstockTotal: 2,
      semiInstockDialogVisible: false,
      isEditSemiInstock: false,
      semiInstockForm: {
        id: '',
        productionOrderId: '',
        productName: '',
        quantity: 1,
        warehouse: 'semi',
        instockDate: '',
        remark: ''
      },
      semiInstockRules: {
        id: [
          { required: true, message: '请输入入库单号', trigger: 'blur' }
        ],
        productionOrderId: [
          { required: true, message: '请选择生产订单', trigger: 'blur' }
        ],
        productName: [
          { required: true, message: '请输入产品名称', trigger: 'blur' }
        ],
        quantity: [
          { required: true, message: '请输入入库数量', trigger: 'blur' }
        ],
        instockDate: [
          { required: true, message: '请选择入库日期', trigger: 'blur' }
        ]
      },
      
      // 成品入库
      finishedInstocks: [
        {
          id: 'CPRK2026001',
          productName: '自动化控制系统',
          productionOrderNo: 'SC2026001',
          quantity: 2,
          warehouse: '成品仓',
          status: 'instocked',
          createdAt: '2026-03-10'
        },
        {
          id: 'CPRK2026002',
          productName: 'PLC控制柜',
          productionOrderNo: 'SC2026002',
          quantity: 5,
          warehouse: '成品仓',
          status: 'pending',
          createdAt: '2026-03-18'
        }
      ],
      finishedInstockSearchQuery: '',
      finishedInstockStatus: '',
      finishedInstockCurrentPage: 1,
      finishedInstockPageSize: 10,
      finishedInstockTotal: 2,
      finishedInstockDialogVisible: false,
      isEditFinishedInstock: false,
      finishedInstockForm: {
        id: '',
        productionOrderId: '',
        productName: '',
        quantity: 1,
        warehouse: 'finished',
        instockDate: '',
        remark: ''
      },
      finishedInstockRules: {
        id: [
          { required: true, message: '请输入入库单号', trigger: 'blur' }
        ],
        productionOrderId: [
          { required: true, message: '请选择生产订单', trigger: 'blur' }
        ],
        productName: [
          { required: true, message: '请输入产品名称', trigger: 'blur' }
        ],
        quantity: [
          { required: true, message: '请输入入库数量', trigger: 'blur' }
        ],
        instockDate: [
          { required: true, message: '请选择入库日期', trigger: 'blur' }
        ]
      },
      
      // 选项数据
      suppliers: [
        { id: 1, name: '上海XX电子科技有限公司' },
        { id: 2, name: '北京XX机械制造有限公司' },
        { id: 3, name: '广州XX电气设备有限公司' }
      ],
      purchaseOrders: [
        { id: 'CG2026001', name: '采购订单1' },
        { id: 'CG2026002', name: '采购订单2' },
        { id: 'CG2026003', name: '采购订单3' }
      ],
      productionOrders: [
        { id: 'SC2026001', name: '生产订单1' },
        { id: 'SC2026002', name: '生产订单2' },
        { id: 'SC2026003', name: '生产订单3' }
      ]
    }
  },
  methods: {
    // 收货管理方法
    addReceiving() {
      this.isEditReceiving = false
      this.receivingForm = {
        id: '',
        supplierId: '',
        purchaseOrderId: '',
        receivingDate: ''
      }
      this.receivingItems = []
      this.receivingDialogVisible = true
    },
    viewReceiving(id) {
      console.log('查看收货单:', id)
    },
    receiveGoods(id) {
      this.$confirm('确定要确认收货吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const receiving = this.receivings.find(r => r.id === id)
        if (receiving) {
          receiving.status = 'received'
          this.$message.success('收货成功')
        }
      })
    },
    instockGoods(id) {
      this.$confirm('确定要入库吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const receiving = this.receivings.find(r => r.id === id)
        if (receiving) {
          receiving.status = 'instocked'
          this.$message.success('入库成功')
        }
      })
    },
    saveReceiving() {
      this.$refs.receivingFormRef.validate((valid) => {
        if (valid) {
          if (this.isEditReceiving) {
            const index = this.receivings.findIndex(r => r.id === this.receivingForm.id)
            if (index !== -1) {
              this.receivings[index].supplierName = this.suppliers.find(s => s.id === this.receivingForm.supplierId)?.name || ''
              this.receivings[index].purchaseOrderNo = this.receivingForm.purchaseOrderId
            }
            this.$message.success('更新成功')
          } else {
            const newReceiving = {
              id: this.receivingForm.id,
              supplierName: this.suppliers.find(s => s.id === this.receivingForm.supplierId)?.name || '',
              purchaseOrderNo: this.receivingForm.purchaseOrderId,
              itemCount: this.receivingItems.length,
              totalQuantity: this.receivingItems.reduce((sum, item) => sum + (item.quantity || 0), 0),
              status: 'pending',
              createdAt: new Date().toISOString().split('T')[0]
            }
            this.receivings.push(newReceiving)
            this.receivingTotal++
            this.$message.success('创建成功')
          }
          this.receivingDialogVisible = false
        }
      })
    },
    addReceivingItem() {
      this.receivingItems.push({
        id: this.receivingItems.length + 1,
        materialCode: '',
        materialName: '',
        specification: '',
        quantity: 1,
        unit: '',
        warehouse: 'raw'
      })
    },
    deleteReceivingItem(id) {
      this.receivingItems = this.receivingItems.filter(item => item.id !== id)
    },
    importFromPurchaseOrder() {
      // 模拟从采购订单导入
      this.receivingItems = [
        {
          id: 1,
          materialCode: 'MAT001',
          materialName: 'PLC控制器',
          specification: 'S7-1200',
          quantity: 2,
          unit: '台',
          warehouse: 'raw'
        },
        {
          id: 2,
          materialCode: 'MAT002',
          materialName: '传感器',
          specification: '温度传感器',
          quantity: 20,
          unit: '个',
          warehouse: 'raw'
        }
      ]
      this.$message.success('从采购订单导入成功')
    },
    searchReceiving() {
      console.log('搜索收货单:', this.receivingSearchQuery, this.receivingStatus)
    },
    handleReceivingSizeChange(size) {
      this.receivingPageSize = size
    },
    handleReceivingCurrentChange(current) {
      this.receivingCurrentPage = current
    },
    
    // 库存管理方法
    viewInventory(id) {
      console.log('查看库存:', id)
    },
    adjustInventory(id) {
      console.log('调整库存:', id)
    },
    searchInventory() {
      console.log('搜索库存:', this.inventorySearchQuery, this.inventoryWarehouse)
    },
    handleInventorySizeChange(size) {
      this.inventoryPageSize = size
    },
    handleInventoryCurrentChange(current) {
      this.inventoryCurrentPage = current
    },
    
    // 半成品入库方法
    addSemiInstock() {
      this.isEditSemiInstock = false
      this.semiInstockForm = {
        id: '',
        productionOrderId: '',
        productName: '',
        quantity: 1,
        warehouse: 'semi',
        instockDate: '',
        remark: ''
      }
      this.semiInstockDialogVisible = true
    },
    viewSemiInstock(id) {
      console.log('查看半成品入库:', id)
    },
    confirmSemiInstock(id) {
      this.$confirm('确定要确认入库吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const semiInstock = this.semiInstocks.find(s => s.id === id)
        if (semiInstock) {
          semiInstock.status = 'instocked'
          this.$message.success('入库成功')
        }
      })
    },
    saveSemiInstock() {
      this.$refs.semiInstockFormRef.validate((valid) => {
        if (valid) {
          if (this.isEditSemiInstock) {
            const index = this.semiInstocks.findIndex(s => s.id === this.semiInstockForm.id)
            if (index !== -1) {
              this.semiInstocks[index].productName = this.semiInstockForm.productName
              this.semiInstocks[index].productionOrderNo = this.semiInstockForm.productionOrderId
              this.semiInstocks[index].quantity = this.semiInstockForm.quantity
            }
            this.$message.success('更新成功')
          } else {
            const newSemiInstock = {
              id: this.semiInstockForm.id,
              productName: this.semiInstockForm.productName,
              productionOrderNo: this.semiInstockForm.productionOrderId,
              quantity: this.semiInstockForm.quantity,
              warehouse: '半成品仓',
              status: 'pending',
              createdAt: new Date().toISOString().split('T')[0]
            }
            this.semiInstocks.push(newSemiInstock)
            this.semiInstockTotal++
            this.$message.success('创建成功')
          }
          this.semiInstockDialogVisible = false
        }
      })
    },
    searchSemiInstock() {
      console.log('搜索半成品入库:', this.semiInstockSearchQuery, this.semiInstockStatus)
    },
    handleSemiInstockSizeChange(size) {
      this.semiInstockPageSize = size
    },
    handleSemiInstockCurrentChange(current) {
      this.semiInstockCurrentPage = current
    },
    
    // 成品入库方法
    addFinishedInstock() {
      this.isEditFinishedInstock = false
      this.finishedInstockForm = {
        id: '',
        productionOrderId: '',
        productName: '',
        quantity: 1,
        warehouse: 'finished',
        instockDate: '',
        remark: ''
      }
      this.finishedInstockDialogVisible = true
    },
    viewFinishedInstock(id) {
      console.log('查看成品入库:', id)
    },
    confirmFinishedInstock(id) {
      this.$confirm('确定要确认入库吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const finishedInstock = this.finishedInstocks.find(f => f.id === id)
        if (finishedInstock) {
          finishedInstock.status = 'instocked'
          this.$message.success('入库成功')
        }
      })
    },
    saveFinishedInstock() {
      this.$refs.finishedInstockFormRef.validate((valid) => {
        if (valid) {
          if (this.isEditFinishedInstock) {
            const index = this.finishedInstocks.findIndex(f => f.id === this.finishedInstockForm.id)
            if (index !== -1) {
              this.finishedInstocks[index].productName = this.finishedInstockForm.productName
              this.finishedInstocks[index].productionOrderNo = this.finishedInstockForm.productionOrderId
              this.finishedInstocks[index].quantity = this.finishedInstockForm.quantity
            }
            this.$message.success('更新成功')
          } else {
            const newFinishedInstock = {
              id: this.finishedInstockForm.id,
              productName: this.finishedInstockForm.productName,
              productionOrderNo: this.finishedInstockForm.productionOrderId,
              quantity: this.finishedInstockForm.quantity,
              warehouse: '成品仓',
              status: 'pending',
              createdAt: new Date().toISOString().split('T')[0]
            }
            this.finishedInstocks.push(newFinishedInstock)
            this.finishedInstockTotal++
            this.$message.success('创建成功')
          }
          this.finishedInstockDialogVisible = false
        }
      })
    },
    searchFinishedInstock() {
      console.log('搜索成品入库:', this.finishedInstockSearchQuery, this.finishedInstockStatus)
    },
    handleFinishedInstockSizeChange(size) {
      this.finishedInstockPageSize = size
    },
    handleFinishedInstockCurrentChange(current) {
      this.finishedInstockCurrentPage = current
    }
  }
}
</script>

<style scoped>
.warehouse-management {
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

.receiving-form,
.semi-instock-form,
.finished-instock-form {
  padding: 20px 0;
}

.receiving-items {
  margin-top: 20px;
}

.items-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.items-toolbar h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

@media (max-width: 768px) {
  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-bar .el-input {
    width: 100% !important;
  }
  
  .header-actions {
    flex-direction: column;
    gap: 5px;
  }
  
  .items-toolbar {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
}
</style>