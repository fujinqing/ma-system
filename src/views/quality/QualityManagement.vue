<template>
  <div class="quality-management">
    <div class="page-header">
      <h2 class="page-title">质量管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="addInspectionReport">
          <i class="fa fa-plus"></i> 新建检验报告
        </el-button>
        <el-button type="success" @click="addInspectionStandard">
          <i class="fa fa-plus"></i> 新建检验标准
        </el-button>
        <el-button type="warning" @click="addNonconforming">
          <i class="fa fa-plus"></i> 新建不合格品
        </el-button>
      </div>
    </div>
    
    <el-tabs v-model="activeTab" type="card">
      <!-- 检验报告 -->
      <el-tab-pane label="检验报告" name="inspection-report">
        <div class="inspection-report-management">
          <div class="search-bar">
            <el-input
              v-model="reportSearchQuery"
              placeholder="搜索报告编号或产品名称"
              prefix-icon="el-icon-search"
              style="width: 300px;"
            ></el-input>
            <el-select v-model="reportType" placeholder="选择检验类型">
              <el-option label="全部" value=""></el-option>
              <el-option label="原材料检验" value="raw"></el-option>
              <el-option label="半成品检验" value="semi"></el-option>
              <el-option label="成品检验" value="finished"></el-option>
            </el-select>
            <el-select v-model="reportStatus" placeholder="选择状态">
              <el-option label="全部" value=""></el-option>
              <el-option label="待检验" value="pending"></el-option>
              <el-option label="已检验" value="inspected"></el-option>
              <el-option label="不合格" value="nonconforming"></el-option>
            </el-select>
            <el-button type="primary" @click="searchReport">搜索</el-button>
          </div>
          
          <el-table :data="inspectionReports" style="width: 100%" border>
            <el-table-column prop="id" label="报告编号" width="120"></el-table-column>
            <el-table-column prop="productName" label="产品名称" min-width="150"></el-table-column>
            <el-table-column prop="type" label="检验类型" width="120">
              <template #default="scope">
                <el-tag v-if="scope.row.type === 'raw'" type="info">原材料检验</el-tag>
                <el-tag v-else-if="scope.row.type === 'semi'" type="warning">半成品检验</el-tag>
                <el-tag v-else type="success">成品检验</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="inspectionDate" label="检验日期" width="150"></el-table-column>
            <el-table-column prop="inspector" label="检验员" width="100"></el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag v-if="scope.row.status === 'pending'" type="info">待检验</el-tag>
                <el-tag v-else-if="scope.row.status === 'inspected'" type="success">已检验</el-tag>
                <el-tag v-else type="danger">不合格</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="result" label="检验结果" width="100">
              <template #default="scope">
                <el-tag v-if="scope.row.result === 'pass'" type="success">合格</el-tag>
                <el-tag v-else type="danger">不合格</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="scope">
                <el-button type="primary" size="small" @click="viewReport(scope.row.id)">查看</el-button>
                <el-button type="warning" size="small" @click="editReport(scope.row.id)">编辑</el-button>
                <el-button type="danger" size="small" @click="deleteReport(scope.row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination">
            <el-pagination
              v-model:current-page="reportCurrentPage"
              v-model:page-size="reportPageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="reportTotal"
              @size-change="handleReportSizeChange"
              @current-change="handleReportCurrentChange"
            ></el-pagination>
          </div>
        </div>
      </el-tab-pane>
      
      <!-- 检验标准 -->
      <el-tab-pane label="检验标准" name="inspection-standard">
        <div class="inspection-standard-management">
          <div class="search-bar">
            <el-input
              v-model="standardSearchQuery"
              placeholder="搜索标准编号或名称"
              prefix-icon="el-icon-search"
              style="width: 300px;"
            ></el-input>
            <el-select v-model="standardCategory" placeholder="选择类别">
              <el-option label="全部" value=""></el-option>
              <el-option label="原材料" value="raw"></el-option>
              <el-option label="半成品" value="semi"></el-option>
              <el-option label="成品" value="finished"></el-option>
            </el-select>
            <el-button type="primary" @click="searchStandard">搜索</el-button>
          </div>
          
          <el-table :data="inspectionStandards" style="width: 100%" border>
            <el-table-column prop="id" label="标准编号" width="120"></el-table-column>
            <el-table-column prop="name" label="标准名称" min-width="180"></el-table-column>
            <el-table-column prop="category" label="类别" width="100">
              <template #default="scope">
                <el-tag v-if="scope.row.category === 'raw'" type="info">原材料</el-tag>
                <el-tag v-else-if="scope.row.category === 'semi'" type="warning">半成品</el-tag>
                <el-tag v-else type="success">成品</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="version" label="版本" width="80"></el-table-column>
            <el-table-column prop="effectiveDate" label="生效日期" width="150"></el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag v-if="scope.row.status === 'active'" type="success">有效</el-tag>
                <el-tag v-else type="info">失效</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="scope">
                <el-button type="primary" size="small" @click="viewStandard(scope.row.id)">查看</el-button>
                <el-button type="warning" size="small" @click="editStandard(scope.row.id)">编辑</el-button>
                <el-button type="danger" size="small" @click="deleteStandard(scope.row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination">
            <el-pagination
              v-model:current-page="standardCurrentPage"
              v-model:page-size="standardPageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="standardTotal"
              @size-change="handleStandardSizeChange"
              @current-change="handleStandardCurrentChange"
            ></el-pagination>
          </div>
        </div>
      </el-tab-pane>
      
      <!-- 不合格品处理 -->
      <el-tab-pane label="不合格品处理" name="nonconforming">
        <div class="nonconforming-management">
          <div class="search-bar">
            <el-input
              v-model="nonconformingSearchQuery"
              placeholder="搜索编号或产品名称"
              prefix-icon="el-icon-search"
              style="width: 300px;"
            ></el-input>
            <el-select v-model="nonconformingType" placeholder="选择类型">
              <el-option label="全部" value=""></el-option>
              <el-option label="原材料" value="raw"></el-option>
              <el-option label="半成品" value="semi"></el-option>
              <el-option label="成品" value="finished"></el-option>
            </el-select>
            <el-select v-model="nonconformingStatus" placeholder="选择处理状态">
              <el-option label="全部" value=""></el-option>
              <el-option label="待处理" value="pending"></el-option>
              <el-option label="处理中" value="processing"></el-option>
              <el-option label="已处理" value="processed"></el-option>
            </el-select>
            <el-button type="primary" @click="searchNonconforming">搜索</el-button>
          </div>
          
          <el-table :data="nonconformingItems" style="width: 100%" border>
            <el-table-column prop="id" label="编号" width="120"></el-table-column>
            <el-table-column prop="productName" label="产品名称" min-width="150"></el-table-column>
            <el-table-column prop="type" label="类型" width="100">
              <template #default="scope">
                <el-tag v-if="scope.row.type === 'raw'" type="info">原材料</el-tag>
                <el-tag v-else-if="scope.row.type === 'semi'" type="warning">半成品</el-tag>
                <el-tag v-else type="success">成品</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="100"></el-table-column>
            <el-table-column prop="defectDescription" label="缺陷描述" min-width="200"></el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag v-if="scope.row.status === 'pending'" type="info">待处理</el-tag>
                <el-tag v-else-if="scope.row.status === 'processing'" type="warning">处理中</el-tag>
                <el-tag v-else type="success">已处理</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createDate" label="创建日期" width="150"></el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="scope">
                <el-button type="primary" size="small" @click="viewNonconforming(scope.row.id)">查看</el-button>
                <el-button type="warning" size="small" @click="processNonconforming(scope.row.id)">处理</el-button>
                <el-button type="danger" size="small" @click="deleteNonconforming(scope.row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination">
            <el-pagination
              v-model:current-page="nonconformingCurrentPage"
              v-model:page-size="nonconformingPageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="nonconformingTotal"
              @size-change="handleNonconformingSizeChange"
              @current-change="handleNonconformingCurrentChange"
            ></el-pagination>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
    
    <!-- 检验报告表单对话框 -->
    <el-dialog
      v-model="reportDialogVisible"
      :title="isEditReport ? '编辑检验报告' : '新建检验报告'"
      width="70%"
      destroy-on-close
    >
      <div class="report-form">
        <el-form :model="reportForm" :rules="reportRules" ref="reportFormRef" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="报告编号" prop="id">
                <el-input v-model="reportForm.id" placeholder="请输入报告编号" :disabled="isEditReport"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="产品名称" prop="productName">
                <el-input v-model="reportForm.productName" placeholder="请输入产品名称"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="检验类型" prop="type">
                <el-select v-model="reportForm.type" placeholder="请选择检验类型" style="width: 100%">
                  <el-option label="原材料检验" value="raw"></el-option>
                  <el-option label="半成品检验" value="semi"></el-option>
                  <el-option label="成品检验" value="finished"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="检验日期" prop="inspectionDate">
                <el-date-picker v-model="reportForm.inspectionDate" type="date" placeholder="请选择检验日期" style="width: 100%"></el-date-picker>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="检验员" prop="inspector">
                <el-input v-model="reportForm.inspector" placeholder="请输入检验员"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="检验标准" prop="standardId">
                <el-select v-model="reportForm.standardId" placeholder="请选择检验标准" style="width: 100%">
                  <el-option v-for="standard in inspectionStandards" :key="standard.id" :label="standard.name" :value="standard.id"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="检验项目" prop="items">
            <el-table :data="reportItems" style="width: 100%" border>
              <el-table-column prop="name" label="项目名称" min-width="150">
                <template #default="scope">
                  <el-input v-model="scope.row.name" placeholder="项目名称"></el-input>
                </template>
              </el-table-column>
              <el-table-column prop="specification" label="规格要求" min-width="150">
                <template #default="scope">
                  <el-input v-model="scope.row.specification" placeholder="规格要求"></el-input>
                </template>
              </el-table-column>
              <el-table-column prop="actual" label="实际值" min-width="100">
                <template #default="scope">
                  <el-input v-model="scope.row.actual" placeholder="实际值"></el-input>
                </template>
              </el-table-column>
              <el-table-column prop="result" label="结果" width="100">
                <template #default="scope">
                  <el-select v-model="scope.row.result" placeholder="选择结果" style="width: 100%">
                    <el-option label="合格" value="pass"></el-option>
                    <el-option label="不合格" value="fail"></el-option>
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80">
                <template #default="scope">
                  <el-button type="danger" size="small" @click="deleteReportItem(scope.row.id)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-button type="primary" @click="addReportItem" style="margin-top: 10px;">
              <i class="fa fa-plus"></i> 添加检验项目
            </el-button>
          </el-form-item>
          <el-form-item label="检验结论" prop="result">
            <el-select v-model="reportForm.result" placeholder="请选择检验结论" style="width: 100%">
              <el-option label="合格" value="pass"></el-option>
              <el-option label="不合格" value="fail"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="备注" prop="remark">
            <el-input v-model="reportForm.remark" type="textarea" :rows="3" placeholder="请输入备注"></el-input>
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="reportDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveReport">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 检验标准表单对话框 -->
    <el-dialog
      v-model="standardDialogVisible"
      :title="isEditStandard ? '编辑检验标准' : '新建检验标准'"
      width="70%"
      destroy-on-close
    >
      <div class="standard-form">
        <el-form :model="standardForm" :rules="standardRules" ref="standardFormRef" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="标准编号" prop="id">
                <el-input v-model="standardForm.id" placeholder="请输入标准编号" :disabled="isEditStandard"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="标准名称" prop="name">
                <el-input v-model="standardForm.name" placeholder="请输入标准名称"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="类别" prop="category">
                <el-select v-model="standardForm.category" placeholder="请选择类别" style="width: 100%">
                  <el-option label="原材料" value="raw"></el-option>
                  <el-option label="半成品" value="semi"></el-option>
                  <el-option label="成品" value="finished"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="版本" prop="version">
                <el-input v-model="standardForm.version" placeholder="请输入版本"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="生效日期" prop="effectiveDate">
                <el-date-picker v-model="standardForm.effectiveDate" type="date" placeholder="请选择生效日期" style="width: 100%"></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="状态" prop="status">
                <el-select v-model="standardForm.status" placeholder="请选择状态" style="width: 100%">
                  <el-option label="有效" value="active"></el-option>
                  <el-option label="失效" value="inactive"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="标准内容" prop="content">
            <el-input v-model="standardForm.content" type="textarea" :rows="5" placeholder="请输入标准内容"></el-input>
          </el-form-item>
          <el-form-item label="检验项目" prop="items">
            <el-table :data="standardItems" style="width: 100%" border>
              <el-table-column prop="name" label="项目名称" min-width="150">
                <template #default="scope">
                  <el-input v-model="scope.row.name" placeholder="项目名称"></el-input>
                </template>
              </el-table-column>
              <el-table-column prop="specification" label="规格要求" min-width="150">
                <template #default="scope">
                  <el-input v-model="scope.row.specification" placeholder="规格要求"></el-input>
                </template>
              </el-table-column>
              <el-table-column prop="method" label="检验方法" min-width="150">
                <template #default="scope">
                  <el-input v-model="scope.row.method" placeholder="检验方法"></el-input>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80">
                <template #default="scope">
                  <el-button type="danger" size="small" @click="deleteStandardItem(scope.row.id)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-button type="primary" @click="addStandardItem" style="margin-top: 10px;">
              <i class="fa fa-plus"></i> 添加检验项目
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="standardDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveStandard">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 不合格品表单对话框 -->
    <el-dialog
      v-model="nonconformingDialogVisible"
      :title="isEditNonconforming ? '编辑不合格品' : '新建不合格品'"
      width="70%"
      destroy-on-close
    >
      <div class="nonconforming-form">
        <el-form :model="nonconformingForm" :rules="nonconformingRules" ref="nonconformingFormRef" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="编号" prop="id">
                <el-input v-model="nonconformingForm.id" placeholder="请输入编号" :disabled="isEditNonconforming"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="产品名称" prop="productName">
                <el-input v-model="nonconformingForm.productName" placeholder="请输入产品名称"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="类型" prop="type">
                <el-select v-model="nonconformingForm.type" placeholder="请选择类型" style="width: 100%">
                  <el-option label="原材料" value="raw"></el-option>
                  <el-option label="半成品" value="semi"></el-option>
                  <el-option label="成品" value="finished"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="数量" prop="quantity">
                <el-input-number v-model="nonconformingForm.quantity" :min="1" :precision="0" :step="1" style="width: 100%"></el-input-number>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="发现日期" prop="createDate">
                <el-date-picker v-model="nonconformingForm.createDate" type="date" placeholder="请选择发现日期" style="width: 100%"></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="发现人" prop="discoverer">
                <el-input v-model="nonconformingForm.discoverer" placeholder="请输入发现人"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="缺陷描述" prop="defectDescription">
            <el-input v-model="nonconformingForm.defectDescription" type="textarea" :rows="3" placeholder="请输入缺陷描述"></el-input>
          </el-form-item>
          <el-form-item label="处理方案" prop="treatmentPlan">
            <el-input v-model="nonconformingForm.treatmentPlan" type="textarea" :rows="3" placeholder="请输入处理方案"></el-input>
          </el-form-item>
          <el-form-item label="处理状态" prop="status">
            <el-select v-model="nonconformingForm.status" placeholder="请选择处理状态" style="width: 100%">
              <el-option label="待处理" value="pending"></el-option>
              <el-option label="处理中" value="processing"></el-option>
              <el-option label="已处理" value="processed"></el-option>
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="nonconformingDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveNonconforming">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'QualityManagement',
  data() {
    return {
      activeTab: 'inspection-report',
      
      // 检验报告
      inspectionReports: [
        {
          id: 'JYB2026001',
          productName: 'PLC控制器',
          type: 'raw',
          inspectionDate: '2026-03-01',
          inspector: '张三',
          status: 'inspected',
          result: 'pass'
        },
        {
          id: 'JYB2026002',
          productName: '控制板',
          type: 'semi',
          inspectionDate: '2026-03-10',
          inspector: '李四',
          status: 'inspected',
          result: 'fail'
        },
        {
          id: 'JYB2026003',
          productName: '自动化控制系统',
          type: 'finished',
          inspectionDate: '2026-03-15',
          inspector: '王五',
          status: 'pending',
          result: ''
        }
      ],
      reportSearchQuery: '',
      reportType: '',
      reportStatus: '',
      reportCurrentPage: 1,
      reportPageSize: 10,
      reportTotal: 3,
      reportDialogVisible: false,
      isEditReport: false,
      reportForm: {
        id: '',
        productName: '',
        type: 'raw',
        inspectionDate: '',
        inspector: '',
        standardId: '',
        result: 'pass',
        remark: ''
      },
      reportRules: {
        id: [
          { required: true, message: '请输入报告编号', trigger: 'blur' }
        ],
        productName: [
          { required: true, message: '请输入产品名称', trigger: 'blur' }
        ],
        type: [
          { required: true, message: '请选择检验类型', trigger: 'blur' }
        ],
        inspectionDate: [
          { required: true, message: '请选择检验日期', trigger: 'blur' }
        ],
        inspector: [
          { required: true, message: '请输入检验员', trigger: 'blur' }
        ],
        result: [
          { required: true, message: '请选择检验结论', trigger: 'blur' }
        ]
      },
      reportItems: [
        {
          id: 1,
          name: '外观检查',
          specification: '无明显划痕',
          actual: '无划痕',
          result: 'pass'
        },
        {
          id: 2,
          name: '功能测试',
          specification: '正常运行',
          actual: '运行正常',
          result: 'pass'
        }
      ],
      
      // 检验标准
      inspectionStandards: [
        {
          id: 'BZ2026001',
          name: '原材料检验标准',
          category: 'raw',
          version: 'V1.0',
          effectiveDate: '2026-01-01',
          status: 'active'
        },
        {
          id: 'BZ2026002',
          name: '半成品检验标准',
          category: 'semi',
          version: 'V1.0',
          effectiveDate: '2026-01-01',
          status: 'active'
        },
        {
          id: 'BZ2026003',
          name: '成品检验标准',
          category: 'finished',
          version: 'V1.0',
          effectiveDate: '2026-01-01',
          status: 'active'
        }
      ],
      standardSearchQuery: '',
      standardCategory: '',
      standardCurrentPage: 1,
      standardPageSize: 10,
      standardTotal: 3,
      standardDialogVisible: false,
      isEditStandard: false,
      standardForm: {
        id: '',
        name: '',
        category: 'raw',
        version: 'V1.0',
        effectiveDate: '',
        status: 'active',
        content: ''
      },
      standardRules: {
        id: [
          { required: true, message: '请输入标准编号', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '请输入标准名称', trigger: 'blur' }
        ],
        category: [
          { required: true, message: '请选择类别', trigger: 'blur' }
        ],
        effectiveDate: [
          { required: true, message: '请选择生效日期', trigger: 'blur' }
        ],
        content: [
          { required: true, message: '请输入标准内容', trigger: 'blur' }
        ]
      },
      standardItems: [
        {
          id: 1,
          name: '外观检查',
          specification: '无明显划痕',
          method: '目视检查'
        },
        {
          id: 2,
          name: '尺寸检查',
          specification: '符合图纸要求',
          method: '卡尺测量'
        }
      ],
      
      // 不合格品处理
      nonconformingItems: [
        {
          id: 'BHP2026001',
          productName: '传感器',
          type: 'raw',
          quantity: 5,
          defectDescription: '外观划痕',
          status: 'processed',
          createDate: '2026-03-05'
        },
        {
          id: 'BHP2026002',
          productName: '控制板',
          type: 'semi',
          quantity: 2,
          defectDescription: '焊接不良',
          status: 'processing',
          createDate: '2026-03-10'
        },
        {
          id: 'BHP2026003',
          productName: 'PLC控制柜',
          type: 'finished',
          quantity: 1,
          defectDescription: '门体变形',
          status: 'pending',
          createDate: '2026-03-15'
        }
      ],
      nonconformingSearchQuery: '',
      nonconformingType: '',
      nonconformingStatus: '',
      nonconformingCurrentPage: 1,
      nonconformingPageSize: 10,
      nonconformingTotal: 3,
      nonconformingDialogVisible: false,
      isEditNonconforming: false,
      nonconformingForm: {
        id: '',
        productName: '',
        type: 'raw',
        quantity: 1,
        createDate: '',
        discoverer: '',
        defectDescription: '',
        treatmentPlan: '',
        status: 'pending'
      },
      nonconformingRules: {
        id: [
          { required: true, message: '请输入编号', trigger: 'blur' }
        ],
        productName: [
          { required: true, message: '请输入产品名称', trigger: 'blur' }
        ],
        type: [
          { required: true, message: '请选择类型', trigger: 'blur' }
        ],
        quantity: [
          { required: true, message: '请输入数量', trigger: 'blur' }
        ],
        createDate: [
          { required: true, message: '请选择发现日期', trigger: 'blur' }
        ],
        discoverer: [
          { required: true, message: '请输入发现人', trigger: 'blur' }
        ],
        defectDescription: [
          { required: true, message: '请输入缺陷描述', trigger: 'blur' }
        ]
      }
    }
  },
  methods: {
    // 检验报告方法
    addInspectionReport() {
      this.isEditReport = false
      this.reportForm = {
        id: '',
        productName: '',
        type: 'raw',
        inspectionDate: '',
        inspector: '',
        standardId: '',
        result: 'pass',
        remark: ''
      }
      this.reportItems = []
      this.reportDialogVisible = true
    },
    viewReport(id) {
      console.log('查看检验报告:', id)
    },
    editReport(id) {
      this.isEditReport = true
      const report = this.inspectionReports.find(r => r.id === id)
      if (report) {
        this.reportForm = {
          id: report.id,
          productName: report.productName,
          type: report.type,
          inspectionDate: report.inspectionDate,
          inspector: report.inspector,
          standardId: '',
          result: report.result,
          remark: ''
        }
        this.reportItems = [
          {
            id: 1,
            name: '外观检查',
            specification: '无明显划痕',
            actual: '无划痕',
            result: 'pass'
          },
          {
            id: 2,
            name: '功能测试',
            specification: '正常运行',
            actual: '运行正常',
            result: 'pass'
          }
        ]
        this.reportDialogVisible = true
      }
    },
    deleteReport(id) {
      this.$confirm('确定要删除这个检验报告吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'danger'
      }).then(() => {
        this.inspectionReports = this.inspectionReports.filter(r => r.id !== id)
        this.reportTotal--
        this.$message.success('删除成功')
      })
    },
    saveReport() {
      this.$refs.reportFormRef.validate((valid) => {
        if (valid) {
          if (this.isEditReport) {
            const index = this.inspectionReports.findIndex(r => r.id === this.reportForm.id)
            if (index !== -1) {
              this.inspectionReports[index].productName = this.reportForm.productName
              this.inspectionReports[index].type = this.reportForm.type
              this.inspectionReports[index].inspectionDate = this.reportForm.inspectionDate
              this.inspectionReports[index].inspector = this.reportForm.inspector
              this.inspectionReports[index].result = this.reportForm.result
              this.inspectionReports[index].status = 'inspected'
            }
            this.$message.success('更新成功')
          } else {
            const newReport = {
              id: this.reportForm.id,
              productName: this.reportForm.productName,
              type: this.reportForm.type,
              inspectionDate: this.reportForm.inspectionDate,
              inspector: this.reportForm.inspector,
              status: 'inspected',
              result: this.reportForm.result
            }
            this.inspectionReports.push(newReport)
            this.reportTotal++
            this.$message.success('创建成功')
          }
          this.reportDialogVisible = false
        }
      })
    },
    addReportItem() {
      this.reportItems.push({
        id: this.reportItems.length + 1,
        name: '',
        specification: '',
        actual: '',
        result: 'pass'
      })
    },
    deleteReportItem(id) {
      this.reportItems = this.reportItems.filter(item => item.id !== id)
    },
    searchReport() {
      console.log('搜索检验报告:', this.reportSearchQuery, this.reportType, this.reportStatus)
    },
    handleReportSizeChange(size) {
      this.reportPageSize = size
    },
    handleReportCurrentChange(current) {
      this.reportCurrentPage = current
    },
    
    // 检验标准方法
    addInspectionStandard() {
      this.isEditStandard = false
      this.standardForm = {
        id: '',
        name: '',
        category: 'raw',
        version: 'V1.0',
        effectiveDate: '',
        status: 'active',
        content: ''
      }
      this.standardItems = []
      this.standardDialogVisible = true
    },
    viewStandard(id) {
      console.log('查看检验标准:', id)
    },
    editStandard(id) {
      this.isEditStandard = true
      const standard = this.inspectionStandards.find(s => s.id === id)
      if (standard) {
        this.standardForm = {
          id: standard.id,
          name: standard.name,
          category: standard.category,
          version: standard.version,
          effectiveDate: standard.effectiveDate,
          status: standard.status,
          content: '检验标准内容...'
        }
        this.standardItems = [
          {
            id: 1,
            name: '外观检查',
            specification: '无明显划痕',
            method: '目视检查'
          },
          {
            id: 2,
            name: '尺寸检查',
            specification: '符合图纸要求',
            method: '卡尺测量'
          }
        ]
        this.standardDialogVisible = true
      }
    },
    deleteStandard(id) {
      this.$confirm('确定要删除这个检验标准吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'danger'
      }).then(() => {
        this.inspectionStandards = this.inspectionStandards.filter(s => s.id !== id)
        this.standardTotal--
        this.$message.success('删除成功')
      })
    },
    saveStandard() {
      this.$refs.standardFormRef.validate((valid) => {
        if (valid) {
          if (this.isEditStandard) {
            const index = this.inspectionStandards.findIndex(s => s.id === this.standardForm.id)
            if (index !== -1) {
              this.inspectionStandards[index].name = this.standardForm.name
              this.inspectionStandards[index].category = this.standardForm.category
              this.inspectionStandards[index].version = this.standardForm.version
              this.inspectionStandards[index].effectiveDate = this.standardForm.effectiveDate
              this.inspectionStandards[index].status = this.standardForm.status
            }
            this.$message.success('更新成功')
          } else {
            const newStandard = {
              id: this.standardForm.id,
              name: this.standardForm.name,
              category: this.standardForm.category,
              version: this.standardForm.version,
              effectiveDate: this.standardForm.effectiveDate,
              status: this.standardForm.status
            }
            this.inspectionStandards.push(newStandard)
            this.standardTotal++
            this.$message.success('创建成功')
          }
          this.standardDialogVisible = false
        }
      })
    },
    addStandardItem() {
      this.standardItems.push({
        id: this.standardItems.length + 1,
        name: '',
        specification: '',
        method: ''
      })
    },
    deleteStandardItem(id) {
      this.standardItems = this.standardItems.filter(item => item.id !== id)
    },
    searchStandard() {
      console.log('搜索检验标准:', this.standardSearchQuery, this.standardCategory)
    },
    handleStandardSizeChange(size) {
      this.standardPageSize = size
    },
    handleStandardCurrentChange(current) {
      this.standardCurrentPage = current
    },
    
    // 不合格品处理方法
    addNonconforming() {
      this.isEditNonconforming = false
      this.nonconformingForm = {
        id: '',
        productName: '',
        type: 'raw',
        quantity: 1,
        createDate: '',
        discoverer: '',
        defectDescription: '',
        treatmentPlan: '',
        status: 'pending'
      }
      this.nonconformingDialogVisible = true
    },
    viewNonconforming(id) {
      console.log('查看不合格品:', id)
    },
    processNonconforming(id) {
      this.isEditNonconforming = true
      const item = this.nonconformingItems.find(n => n.id === id)
      if (item) {
        this.nonconformingForm = {
          id: item.id,
          productName: item.productName,
          type: item.type,
          quantity: item.quantity,
          createDate: item.createDate,
          discoverer: '',
          defectDescription: item.defectDescription,
          treatmentPlan: '',
          status: 'processing'
        }
        this.nonconformingDialogVisible = true
      }
    },
    deleteNonconforming(id) {
      this.$confirm('确定要删除这个不合格品吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'danger'
      }).then(() => {
        this.nonconformingItems = this.nonconformingItems.filter(n => n.id !== id)
        this.nonconformingTotal--
        this.$message.success('删除成功')
      })
    },
    saveNonconforming() {
      this.$refs.nonconformingFormRef.validate((valid) => {
        if (valid) {
          if (this.isEditNonconforming) {
            const index = this.nonconformingItems.findIndex(n => n.id === this.nonconformingForm.id)
            if (index !== -1) {
              this.nonconformingItems[index].productName = this.nonconformingForm.productName
              this.nonconformingItems[index].type = this.nonconformingForm.type
              this.nonconformingItems[index].quantity = this.nonconformingForm.quantity
              this.nonconformingItems[index].defectDescription = this.nonconformingForm.defectDescription
              this.nonconformingItems[index].status = this.nonconformingForm.status
            }
            this.$message.success('更新成功')
          } else {
            const newItem = {
              id: this.nonconformingForm.id,
              productName: this.nonconformingForm.productName,
              type: this.nonconformingForm.type,
              quantity: this.nonconformingForm.quantity,
              defectDescription: this.nonconformingForm.defectDescription,
              status: this.nonconformingForm.status,
              createDate: this.nonconformingForm.createDate
            }
            this.nonconformingItems.push(newItem)
            this.nonconformingTotal++
            this.$message.success('创建成功')
          }
          this.nonconformingDialogVisible = false
        }
      })
    },
    searchNonconforming() {
      console.log('搜索不合格品:', this.nonconformingSearchQuery, this.nonconformingType, this.nonconformingStatus)
    },
    handleNonconformingSizeChange(size) {
      this.nonconformingPageSize = size
    },
    handleNonconformingCurrentChange(current) {
      this.nonconformingCurrentPage = current
    }
  }
}
</script>

<style scoped>
.quality-management {
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

.report-form,
.standard-form,
.nonconforming-form {
  padding: 20px 0;
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
}
</style>