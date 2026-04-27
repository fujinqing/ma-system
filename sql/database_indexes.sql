-- =====================================================
-- M-A_OP_ODB 数据库索引优化脚本
-- 针对500人规模企业优化
-- =====================================================

USE [M-A_OP_ODB];
GO

-- =====================================================
-- 用户表索引
-- =====================================================
CREATE INDEX IX_users_username ON users(username);
CREATE INDEX IX_users_role ON users(role);
CREATE INDEX IX_users_department_id ON users(department_id);
CREATE INDEX IX_users_status ON users(status);
CREATE INDEX IX_users_email ON users(email);
GO

-- =====================================================
-- 部门表索引
-- =====================================================
CREATE INDEX IX_departments_parent_id ON departments(parent_id);
CREATE INDEX IX_departments_sort_order ON departments(sort_order);
GO

-- =====================================================
-- 客户表索引
-- =====================================================
CREATE INDEX IX_customers_sales_id ON customers(sales_id);
CREATE INDEX IX_customers_status ON customers(status);
CREATE INDEX IX_customers_level ON customers(level);
CREATE INDEX IX_customers_code ON customers(code);
CREATE INDEX IX_customers_name ON customers(name);
GO

-- =====================================================
-- 项目表索引
-- =====================================================
CREATE INDEX IX_projects_customer_id ON projects(customer_id);
CREATE INDEX IX_projects_manager_id ON projects(manager_id);
CREATE INDEX IX_projects_status ON projects(status);
CREATE INDEX IX_projects_project_no ON projects(project_no);
CREATE INDEX IX_projects_created_by ON projects(created_by);
GO

-- =====================================================
-- 供应商表索引
-- =====================================================
CREATE INDEX IX_suppliers_code ON suppliers(code);
CREATE INDEX IX_suppliers_category ON suppliers(category);
CREATE INDEX IX_suppliers_status ON suppliers(status);
CREATE INDEX IX_suppliers_name ON suppliers(name);
GO

-- =====================================================
-- 物料表索引
-- =====================================================
CREATE INDEX IX_materials_code ON materials(code);
CREATE INDEX IX_materials_supplier_id ON materials(supplier_id);
CREATE INDEX IX_materials_category ON materials(category);
CREATE INDEX IX_materials_status ON materials(status);
GO

-- =====================================================
-- 采购订单表索引
-- =====================================================
CREATE INDEX IX_purchase_orders_order_no ON purchase_orders(order_no);
CREATE INDEX IX_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IX_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IX_purchase_orders_created_by ON purchase_orders(created_by);
CREATE INDEX IX_purchase_orders_order_date ON purchase_orders(order_date);
GO

-- =====================================================
-- 销售合同表索引
-- =====================================================
CREATE INDEX IX_sales_contracts_contract_no ON sales_contracts(contract_no);
CREATE INDEX IX_sales_contracts_customer_id ON sales_contracts(customer_id);
CREATE INDEX IX_sales_contracts_status ON sales_contracts(status);
CREATE INDEX IX_sales_contracts_created_by ON sales_contracts(created_by);
GO

-- =====================================================
-- 报价单表索引
-- =====================================================
CREATE INDEX IX_quotations_quotation_no ON quotations(quotation_no);
CREATE INDEX IX_quotations_customer_id ON quotations(customer_id);
CREATE INDEX IX_quotations_status ON quotations(status);
CREATE INDEX IX_quotations_valid_until ON quotations(valid_until);
GO

-- =====================================================
-- BOM表索引
-- =====================================================
CREATE INDEX IX_boms_bom_no ON boms(bom_no);
CREATE INDEX IX_boms_status ON boms(status);
CREATE INDEX IX_boms_created_by ON boms(created_by);
GO

-- =====================================================
-- 项目阶段表索引
-- =====================================================
CREATE INDEX IX_project_phases_project_id ON project_phases(project_id);
CREATE INDEX IX_project_phases_status ON project_phases(status);
GO

-- =====================================================
-- 库存表索引
-- =====================================================
CREATE INDEX IX_inventory_warehouse_id ON inventory(warehouse_id);
CREATE INDEX IX_inventory_material_id ON inventory(material_id);
GO

-- =====================================================
-- 库存出入库记录表索引
-- =====================================================
CREATE INDEX IX_inventory_transactions_transaction_no ON inventory_transactions(transaction_no);
CREATE INDEX IX_inventory_transactions_warehouse_id ON inventory_transactions(warehouse_id);
CREATE INDEX IX_inventory_transactions_material_id ON inventory_transactions(material_id);
CREATE INDEX IX_inventory_transactions_type ON inventory_transactions(type);
CREATE INDEX IX_inventory_transactions_created_at ON inventory_transactions(created_at);
GO

-- =====================================================
-- 审批表索引
-- =====================================================
CREATE INDEX IX_approvals_document_type ON approvals(document_type);
CREATE INDEX IX_approvals_approver_id ON approvals(approver_id);
CREATE INDEX IX_approvals_status ON approvals(status);
GO

-- =====================================================
-- 质量检查表索引
-- =====================================================
CREATE INDEX IX_quality_inspections_inspection_no ON quality_inspections(inspection_no);
CREATE INDEX IX_quality_inspections_project_id ON quality_inspections(project_id);
CREATE INDEX IX_quality_inspections_result ON quality_inspections(result);
GO

-- =====================================================
-- 采购合同表索引
-- =====================================================
CREATE INDEX IX_purchase_contracts_contract_no ON purchase_contracts(contract_no);
CREATE INDEX IX_purchase_contracts_supplier_id ON purchase_contracts(supplier_id);
CREATE INDEX IX_purchase_contracts_status ON purchase_contracts(status);
GO

-- =====================================================
-- 生产工单表索引
-- =====================================================
CREATE INDEX IX_production_orders_order_no ON production_orders(order_no);
CREATE INDEX IX_production_orders_project_id ON production_orders(project_id);
CREATE INDEX IX_production_orders_status ON production_orders(status);
GO

PRINT '数据库索引优化完成！';
GO
