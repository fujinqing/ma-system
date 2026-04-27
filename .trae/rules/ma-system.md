1.2 架构核心规则（强制遵循）
主数据唯一规则
客户、物料、供应商、员工、部门、BOM、产品 只在 MDM 主数据平台创建
所有业务系统禁止自建主数据，仅通过 API / 消息订阅使用
主数据变更全量推送消息，下游系统自动同步
事件驱动规则
所有业务状态变更必须发布标准事件到消息总线
下游系统仅通过订阅事件触发业务动作，禁止跨库直连
事件必须包含：ID、时间戳、源系统、业务类型、实体数据、操作人
入口统一规则
员工只使用统一门户操作，不直接访问独立业务系统后台
跨系统数据查询必须走 API 网关聚合，禁止多系统切换查询
数据闭环规则
业务数据 → 消息总线 → 数据中台 ODS/DWD → 统一报表 / 看板
售后 / 生产故障 → 事件 → 研发 / 质量知识库自动更新，形成闭环
1.3 模块边界规则
模块	核心职责	依赖	输出事件
MDM 主数据	全局编码、去重、分发	无	mdms.employee.update、mdms.material.create
CRM	客户、商机、订单	MDM 客户 / 员工	crm.order.created、crm.order.audit
SRM	供应商、采购、招标	MDM 供应商 / 物料	srm.purchase.created、srm.supplier.change
仓库 WMS	入库、出库、库存、盘点	MDM 物料 / 库位	inv.inbound、inv.outbound、inv.stock.change
生产 MES	工单、报工、领料、入库	MDM BOM / 物料	prd.workorder.created、prd.report.finish
项目 / 研发	项目、任务、文档、DFMEA	MDM 员工 / 项目	project.milestone、rd.fmea.update
质量	检验、不合格、整改	生产 / 仓库事件	qc.inspect.pass、qc.defect.create
售后	报修、维修、回访	MDM 产品 / 客户	after.repair.start、after.solved
知识库	案例、方案、文档	售后 / 研发事件	kb.article.update
HR / 行政	组织、考勤、审批	MDM 员工	hr.entry、hr.dimission
1.4 开发规范
所有接口遵循 RESTful，统一通过 API 网关暴露
事件格式统一为 JSON Schema，不可随意修改字段
数据库禁止跨库关联查询，统一在数据中台做关联
前端统一权限、统一登录、统一布局风格
所有服务必须支持监控、日志、链路追踪
1.5 实施阶段规则（必须按顺序）
阶段 1：消息总线 → 阶段 2：MDM 主数据 → 阶段 3：业务系统事件改造 → 阶段 4：数据中台 → 阶段 5：API 网关 / 聚合服务 → 阶段 6：知识库 / 售后闭环