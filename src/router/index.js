import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { title: '运营总览' }
  },
  // CRM管理
  {
    path: '/crm',
    name: 'CRM',
    component: () => import('../views/customer/CustomerList.vue'),
    meta: { title: 'CRM管理' }
  },
  {
    path: '/crm/add',
    name: 'AddCRM',
    component: () => import('../views/customer/CustomerForm.vue'),
    meta: { title: '添加客户' }
  },
  {
    path: '/crm/edit/:id',
    name: 'EditCRM',
    component: () => import('../views/customer/CustomerForm.vue'),
    meta: { title: '编辑客户' }
  },
  {
    path: '/crm/detail/:id',
    name: 'CRMDetail',
    component: () => import('../views/customer/CustomerDetail.vue'),
    meta: { title: '客户详情' }
  },
  {
    path: '/crm/opportunities',
    name: 'Opportunities',
    component: () => import('../views/customer/OpportunityList.vue'),
    meta: { title: '商机管理' }
  },
  {
    path: '/crm/opportunities/add',
    name: 'AddOpportunity',
    component: () => import('../views/customer/OpportunityForm.vue'),
    meta: { title: '新建商机' }
  },
  {
    path: '/crm/opportunities/edit/:id',
    name: 'EditOpportunity',
    component: () => import('../views/customer/OpportunityForm.vue'),
    meta: { title: '编辑商机' }
  },
  {
    path: '/crm/opportunities/detail/:id',
    name: 'OpportunityDetail',
    component: () => import('../views/customer/OpportunityDetail.vue'),
    meta: { title: '商机详情' }
  },
  {
    path: '/crm/transfer',
    name: 'CustomerTransfer',
    component: () => import('../views/customer/CustomerTransfer.vue'),
    meta: { title: '客户移交' }
  },
  {
    path: '/crm/equipment',
    name: 'EquipmentManagement',
    component: () => import('../views/customer/EquipmentList.vue'),
    meta: { title: '设备台账' }
  },
  {
    path: '/crm/dashboard',
    name: 'CRMDashboard',
    component: () => import('../views/customer/CRMDashboard.vue'),
    meta: { title: 'CRM看板' }
  },
  {
    path: '/crm/contracts/add',
    name: 'AddContract',
    component: () => import('../views/customer/ContractForm.vue'),
    meta: { title: '新增合同' }
  },
  {
    path: '/crm/contracts/edit/:id',
    name: 'EditContract',
    component: () => import('../views/customer/ContractForm.vue'),
    meta: { title: '编辑合同' }
  },
  {
    path: '/crm/contracts/detail/:id',
    name: 'ContractDetail',
    component: () => import('../views/customer/ContractDetail.vue'),
    meta: { title: '合同详情' }
  },
  {
    path: '/crm/contracts',
    name: 'CRMContractManagement',
    component: () => import('../views/sales/ContractManagement.vue'),
    meta: { title: '合同管理' }
  },
  {
    path: '/crm/equipment/add',
    name: 'AddEquipment',
    component: () => import('../views/customer/EquipmentForm.vue'),
    meta: { title: '新增设备' }
  },
  // 销售管理
  {
    path: '/sales',
    redirect: '/sales/dashboard',
    meta: { title: '销售管理' }
  },
  {
    path: '/sales/quotation',
    name: 'QuotationList',
    component: () => import('../views/sales/QuotationList.vue'),
    meta: { title: '报价管理' }
  },
  {
    path: '/sales/quotation/add',
    name: 'AddQuotation',
    component: () => import('../views/sales/QuotationForm.vue'),
    meta: { title: '添加报价' }
  },
  {
    path: '/sales/contract',
    name: 'ContractManagement',
    component: () => import('../views/sales/ContractManagement.vue'),
    meta: { title: '合同管理' }
  },
  {
    path: '/sales/price-approval',
    name: 'PriceApproval',
    component: () => import('../views/sales/PriceApproval.vue'),
    meta: { title: '价格计算审批表' }
  },
  // 项目管理
  {
    path: '/project',
    redirect: '/project/list',
    meta: { title: '项目管理' }
  },
  {
    path: '/project/list',
    name: 'ProjectList',
    component: () => import('../views/project/ProjectList.vue'),
    meta: { title: '项目列表' }
  },
  {
    path: '/project/initiation',
    name: 'ProjectInitiation',
    component: () => import('../views/project/ProjectInitiation.vue'),
    meta: { title: '项目立项' }
  },
  {
    path: '/project/add',
    name: 'AddProject',
    component: () => import('../views/project/ProjectForm.vue'),
    meta: { title: '添加项目' }
  },
  {
    path: '/project/detail/:id',
    name: 'ProjectDetail',
    component: () => import('../views/project/ProjectDetail.vue'),
    meta: { title: '项目详情' }
  },
  // 技术管理
  {
    path: '/tech',
    redirect: '/tech/change',
    meta: { title: '技术管理' }
  },
  {
    path: '/tech/change',
    name: 'TechChangeList',
    component: () => import('../views/tech/TechChangeList.vue'),
    meta: { title: '技术变更' }
  },
  {
    path: '/tech/bom',
    name: 'BOMManagement',
    component: () => import('../views/tech/BOMManagement.vue'),
    meta: { title: 'BOM管理' }
  },
  {
    path: '/tech/picking',
    name: 'PickingList',
    component: () => import('../views/tech/PickingList.vue'),
    meta: { title: '领料清单' }
  },
  {
    path: '/tech/agreement',
    name: 'TechAgreement',
    component: () => import('../views/tech/TechAgreement.vue'),
    meta: { title: '技术协议审批' }
  },
  // 生产管理
  {
    path: '/production',
    name: 'ProductionOrder',
    component: () => import('../views/production/ProductionOrder.vue'),
    meta: { title: '生产订单' }
  },
  // SRM管理
  {
    path: '/srm',
    redirect: '/srm/order',
    meta: { title: 'SRM管理' }
  },
  {
    path: '/srm/order',
    name: 'SRMPurchaseOrder',
    component: () => import('../views/purchase/PurchaseList.vue'),
    meta: { title: '采购订单' }
  },
  {
    path: '/srm/supplier',
    name: 'SRMSupplierManagement',
    component: () => import('../views/purchase/SupplierManagement.vue'),
    meta: { title: '供应商管理' }
  },
  {
    path: '/srm/material',
    name: 'SRMMaterialManagement',
    component: () => import('../views/purchase/MaterialManagement.vue'),
    meta: { title: '物料管理' }
  },
  {
    path: '/srm/contract',
    name: 'SRMPurchaseContractManagement',
    component: () => import('../views/purchase/ContractManagement.vue'),
    meta: { title: '合同管理' }
  },
  {
    path: '/srm/contract/add',
    name: 'SRMAddPurchaseContract',
    component: () => import('../views/purchase/ContractForm.vue'),
    meta: { title: '添加合同' }
  },
  {
    path: '/srm/contract/edit/:id',
    name: 'SRMEditPurchaseContract',
    component: () => import('../views/purchase/ContractForm.vue'),
    meta: { title: '编辑合同' }
  },
  // 新SRM功能路由（使用现有组件作为占位符，后续可扩展）
  {
    path: '/srm/requirement',
    name: 'SRMPurchaseRequirement',
    component: () => import('../views/purchase/PurchaseList.vue'),
    meta: { title: '采购需求' }
  },
  {
    path: '/srm/receipt',
    name: 'SRMPurchaseReceipt',
    component: () => import('../views/purchase/PurchaseList.vue'),
    meta: { title: '采购入库' }
  },
  {
    path: '/srm/payment',
    name: 'SRMPurchasePayment',
    component: () => import('../views/purchase/PurchaseList.vue'),
    meta: { title: '采购付款' }
  },
  {
    path: '/srm/evaluation',
    name: 'SRMSupplierEvaluation',
    component: () => import('../views/purchase/PurchaseList.vue'),
    meta: { title: '供应商评估' }
  },
  // 仓库管理
  {
    path: '/warehouse',
    name: 'WarehouseManagement',
    component: () => import('../views/warehouse/WarehouseManagement.vue'),
    meta: { title: '仓库管理' }
  },
  // 质量管理
  {
    path: '/quality',
    name: 'QualityManagement',
    component: () => import('../views/quality/QualityManagement.vue'),
    meta: { title: '质量管理' }
  },
  // 人力资源管理
  {
    path: '/hr',
    redirect: '/hr/employee',
    meta: { title: '人力资源' }
  },
  {
    path: '/hr/employee',
    name: 'HrEmployee',
    component: () => import('../views/hr/EmployeeList.vue'),
    meta: { title: '员工管理' }
  },
  // 行政管理
  {
    path: '/admin',
    redirect: '/admin/assets',
    meta: { title: '行政管理' }
  },
  {
    path: '/admin/assets',
    name: 'AdminAssets',
    component: () => import('../views/admin/AssetList.vue'),
    meta: { title: '资产管理' }
  },
  {
    path: '/admin/announcements',
    name: 'AdminAnnouncements',
    component: () => import('../views/admin/AnnouncementList.vue'),
    meta: { title: '公告通知' }
  },
  // 生产制造管理
  {
    path: '/manufacturing',
    redirect: '/manufacturing/work-order',
    meta: { title: '生产制造' }
  },
  {
    path: '/manufacturing/work-order',
    name: 'MfgWorkOrder',
    component: () => import('../views/mfg/WorkOrderList.vue'),
    meta: { title: '生产工单' }
  },
  // 研发管理
  {
    path: '/rd',
    redirect: '/rd/project',
    meta: { title: '研发管理' }
  },
  {
    path: '/rd/project',
    name: 'RdProject',
    component: () => import('../views/rd/RdProjectList.vue'),
    meta: { title: '研发项目' }
  },
  // 文件管理
  {
    path: '/file',
    redirect: '/file/dashboard',
    meta: { title: '文件管理' }
  },
  {
    path: '/file/dashboard',
    name: 'FileDashboard',
    component: () => import('../views/file/FileDashboard.vue'),
    meta: { title: '文件管理' }
  },
  {
    path: '/file/project/:projectId',
    name: 'ProjectFiles',
    component: () => import('../views/file/ProjectFiles.vue'),
    meta: { title: '项目文件' }
  },
  {
    path: '/file/package/:projectId',
    name: 'FilePackage',
    component: () => import('../views/file/FilePackage.vue'),
    meta: { title: '文件打包' }
  },
  // 知识库
  {
    path: '/knowledge',
    redirect: '/knowledge/list',
    meta: { title: '知识库' }
  },
  {
    path: '/knowledge/list',
    name: 'KnowledgeList',
    component: () => import('../views/knowledge/KnowledgeList.vue'),
    meta: { title: '知识库' }
  },
  {
    path: '/knowledge/add',
    name: 'AddKnowledge',
    component: () => import('../views/knowledge/KnowledgeForm.vue'),
    meta: { title: '添加知识' }
  },
  {
    path: '/knowledge/edit/:id',
    name: 'EditKnowledge',
    component: () => import('../views/knowledge/KnowledgeForm.vue'),
    meta: { title: '编辑知识' }
  },
  // ERP对接
  {
    path: '/erp',
    name: 'ERP',
    component: () => import('../views/erp/ERPSync.vue'),
    meta: { title: 'ERP对接' }
  },
  // 测试管理
  {
    path: '/test-management',
    name: 'TestManagement',
    component: () => import('../views/test/TestManagement.vue'),
    meta: { title: '测试管理', permission: 'test:management' }
  },
  // 系统设置
  {
    path: '/setting',
    redirect: '/setting/user',
    meta: { title: '系统设置' }
  },
  {
    path: '/setting/user',
    name: 'UserList',
    component: () => import('../views/setting/UserList.vue'),
    meta: { title: '用户管理' }
  },
  {
    path: '/setting/positions',
    name: 'PositionList',
    component: () => import('../views/setting/PositionList.vue'),
    meta: { title: '职位管理' }
  },
  {
    path: '/setting/flow',
    name: 'FlowManagement',
    component: () => import('../views/setting/FlowManagement.vue'),
    meta: { title: '流程管理' }
  },
  {
    path: '/workflow/instance/:id',
    name: 'InstanceDetail',
    component: () => import('../views/workflow/InstanceDetail.vue'),
    meta: { title: '流程实例详情' }
  },
  {
    path: '/setting/rates',
    name: 'RateManagement',
    component: () => import('../views/setting/RateManagement.vue'),
    meta: { title: '工时费率管理' }
  },
  {
    path: '/setting/operation-logs',
    name: 'OperationLogList',
    component: () => import('../views/setting/OperationLogList.vue'),
    meta: { title: '操作日志', roles: ['admin'] }
  },
  // 财务管理
  {
    path: '/finance/expense',
    name: 'ExpenseList',
    component: () => import('../views/finance/ExpenseList.vue'),
    meta: { title: '报销管理', roles: ['admin', 'finance'] }
  },
  // 销售管理
  {
    path: '/sales/dashboard',
    name: 'SalesDashboard',
    component: () => import('../views/sales/SalesDashboard.vue'),
    meta: { title: '销售仪表盘' }
  },
  {
    path: '/sales/forecast',
    name: 'SalesForecast',
    component: () => import('../views/sales/SalesForecast.vue'),
    meta: { title: '销售预测' }
  },
  {
    path: '/sales/solution-tracking',
    name: 'SolutionTracking',
    component: () => import('../views/sales/SolutionTracking.vue'),
    meta: { title: '方案更进表', hidden: true }
  },
  {
    path: '/sales/price-calculation',
    name: 'PriceCalculation',
    component: () => import('../views/sales/PriceCalculation.vue'),
    meta: { title: '价格计算表' }
  },
  {
    path: '/sales/price-approval',
    name: 'PriceApproval',
    component: () => import('../views/sales/PriceApproval.vue'),
    meta: { title: '销售价格审批表' }
  },
  {
    path: '/sales/contract-approval',
    name: 'ContractApproval',
    component: () => import('../views/sales/ContractApproval.vue'),
    meta: { title: '销售合同审批表' }
  },
  { path: '/crm/competitors', name: 'Competitors', component: () => import('../views/customer/CompetitorList.vue'), meta: { title: '竞争对手管理' } },
  { path: '/crm/competitors/add', name: 'AddCompetitor', component: () => import('../views/customer/CompetitorForm.vue'), meta: { title: '添加竞争对手' } },
  { path: '/crm/competitors/edit/:id', name: 'EditCompetitor', component: () => import('../views/customer/CompetitorForm.vue'), meta: { title: '编辑竞争对手' } },
  { path: '/crm/competitors/detail/:id', name: 'CompetitorDetail', component: () => import('../views/customer/CompetitorDetail.vue'), meta: { title: '竞争对手详情' } },
  {
    path: '/crm/activities',
    name: 'Activities',
    component: () => import('../views/PlaceholderPage.vue'),
    meta: { title: '内部协作' }
  },
  {
    path: '/sales/bidding',
    name: 'Bidding',
    component: () => import('../views/PlaceholderPage.vue'),
    meta: { title: '招投标管理' }
  },
  {
    path: '/sales/payment',
    name: 'Payment',
    component: () => import('../views/PlaceholderPage.vue'),
    meta: { title: '回款管理' }
  },
  {
    path: '/service/workorder',
    name: 'Workorder',
    component: () => import('../views/PlaceholderPage.vue'),
    meta: { title: '售后工单' }
  },
  {
    path: '/service/equipment',
    name: 'Equipment',
    component: () => import('../views/PlaceholderPage.vue'),
    meta: { title: '设备档案' }
  },
  {
    path: '/reports/operation',
    name: 'OperationReport',
    component: () => import('../views/PlaceholderPage.vue'),
    meta: { title: '经营报表' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - M-A 运营系统` : 'M-A 运营系统'
  
  // 登录验证
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
  if (to.path !== '/login' && !isLoggedIn) {
    next('/login')
  } else {
    next()
  }
})

export default router