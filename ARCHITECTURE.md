# 架构设计概览 — 主数据驱动 + 事件驱动 + API 网关 + 轻量数据中台

目标：打通 CRM、SRM、ERP、MES、WMS、项目管理、售后等模块，消除系统割裂与数据孤岛，减少人工搬砖。

核心组件：
- 主数据平台（Master Data）：集中治理客户、物料、供应商、员工、BOM 等主数据，提供只读查询与订阅变更的能力。
- 事件总线（Event Bus）：统一业务事件（订单创建、生产报工、入库、发货、客户变更等），下游系统按需消费实现最终一致性。当前实现为轻量进程内 EventEmitter，未来可替换为 Redis/RabbitMQ/Kafka。
- API 网关（Gateway）：统一外部入口、路由聚合与安全控制，提供跨系统聚合查询示例与流量治理。
- 轻量数据中台（Data Middle Platform）：为跨系统查询提供聚合 API（例如：跨系统的客户视图、销售仪表盘聚合），并可缓存热点数据以提高性能。

已实现（示例与基础设施）：
- `server/services/eventBus.js`：轻量事件总线，支持 `publish/subscribe`。可在多个控制器中发布事件。
- `server/controllers/masterDataController.js` + `server/routes/masterDataRoutes.js`：主数据只读 API（客户/用户/供应商）。
- `server/routes/gatewayRoutes.js`：API 网关示例（`/api/gateway/sales-dashboard` 代理到现有销售仪表盘），并展示聚合点。
- 在 `server/controllers/customerController.js` 中：发布了 `customer.created`、`customer.updated`、`customer.deleted` 事件，示范事件驱动改造方法。
- 在 `server/server.js` 中挂载了主数据与网关路由。

推荐下一步（实施策略）：
1. 将所有核心写操作（客户、物料、供应商、员工、订单、入库/出库等）都发布事件（变更事件 + 补偿/回滚事件）。
2. 引入持久化事件存储（Event Store）或可靠队列（Redis Streams / RabbitMQ / Kafka），保证事件不丢失与可重试消费。先选 Redis 作为轻量级选项。 
3. 构建主数据同步器：订阅事件并维护主数据视图（用于只读查询与多系统订阅）。
4. 逐步替换跨系统调用：各系统从“拉取/复制”转为“订阅/消费”主数据变更或在 API 网关通过数据中台聚合查询。
5. 增加监控与可观测性：事件队列长度、消费错误、重试策略、补偿链路等。

注意事项：
- 初期使用进程内 EventEmitter 便于迭代，但生产环境需部署可靠队列以满足高可用与跨进程消费场景。
- 主数据平台需制定治理与权限策略，例如唯一键（客户 code）、字段主权（哪个系统对某些字段有写权限）、数据质量校验规则。

文档位置：本文件为起点；后续可补充时序图、ER/消息模型、部署拓扑与演进计划。
