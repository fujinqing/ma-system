const { v4: uuidv4 } = require('uuid');

const SOURCE_SYSTEM = 'M-A-SYSTEM';

const BUSINESS_TYPES = {
  EMPLOYEE: 'employee',
  DEPARTMENT: 'department',
  CUSTOMER: 'customer',
  SUPPLIER: 'supplier',
  MATERIAL: 'material',
  BOM: 'bom',
  PRODUCT: 'product',
  PROJECT: 'project',
  PURCHASE: 'purchase',
  SALES: 'sales',
  EXPENSE: 'expense',
  QUALITY: 'quality',
  WAREHOUSE: 'warehouse',
  MANUFACTURING: 'manufacturing'
};

const EVENT_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  APPROVE: 'approve',
  REJECT: 'reject',
  SUBMIT: 'submit',
  CANCEL: 'cancel',
  ASSIGN: 'assign'
};

function createEvent(businessType, action, entityData, operator = null, extra = {}) {
  return {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    sourceSystem: SOURCE_SYSTEM,
    businessType,
    action,
    entityData,
    operator,
    ...extra
  };
}

function publishEvent(eventBus, eventName, businessType, action, entityData, operator = null, extra = {}) {
  const event = createEvent(businessType, action, entityData, operator, extra);
  eventBus.publish(eventName, event);
  console.log(`[Event Published] ${eventName}:`, JSON.stringify(event, null, 2));
  return event;
}

const eventDefinitions = {
  employee: {
    create: 'mdms.employee.create',
    update: 'mdms.employee.update',
    delete: 'mdms.employee.delete'
  },
  department: {
    create: 'mdms.department.create',
    update: 'mdms.department.update',
    delete: 'mdms.department.delete'
  },
  customer: {
    create: 'mdms.customer.create',
    update: 'mdms.customer.update',
    delete: 'mdms.customer.delete'
  },
  supplier: {
    create: 'mdms.supplier.create',
    update: 'mdms.supplier.update',
    delete: 'mdms.supplier.delete'
  },
  material: {
    create: 'mdms.material.create',
    update: 'mdms.material.update',
    delete: 'mdms.material.delete'
  },
  bom: {
    create: 'mdms.bom.create',
    update: 'mdms.bom.update',
    delete: 'mdms.bom.delete'
  },
  product: {
    create: 'mdms.product.create',
    update: 'mdms.product.update',
    delete: 'mdms.product.delete'
  },
  project: {
    create: 'project.create',
    update: 'project.update',
    milestone: 'project.milestone',
    complete: 'project.complete'
  },
  purchase: {
    create: 'srm.purchase.create',
    submit: 'srm.purchase.submit',
    approve: 'srm.purchase.approve',
    reject: 'srm.purchase.reject'
  },
  sales: {
    create: 'crm.order.create',
    submit: 'crm.order.submit',
    approve: 'crm.order.approve',
    reject: 'crm.order.reject'
  },
  expense: {
    create: 'finance.expense.create',
    submit: 'finance.expense.submit',
    approve: 'finance.expense.approve',
    reject: 'finance.expense.reject',
    pay: 'finance.expense.pay'
  },
  quality: {
    inspect: 'qc.inspect.complete',
    defect: 'qc.defect.create',
    repair: 'after.repair.start',
    solved: 'after.solved'
  },
  warehouse: {
    inbound: 'inv.inbound',
    outbound: 'inv.outbound',
    stockChange: 'inv.stock.change'
  },
  manufacturing: {
    workorderCreate: 'prd.workorder.create',
    reportFinish: 'prd.report.finish',
    materialConsume: 'prd.material.consume'
  },
  knowledge: {
    articleUpdate: 'kb.article.update'
  }
};

module.exports = {
  SOURCE_SYSTEM,
  BUSINESS_TYPES,
  EVENT_ACTIONS,
  createEvent,
  publishEvent,
  eventDefinitions
};
