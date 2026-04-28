const { v4: uuidv4 } = require('uuid');

class MdmEventPublisher {
  constructor() {
    this.eventBus = null;
  }

  setEventBus(eventBus) {
    this.eventBus = eventBus;
  }

  publish(eventType, sourceSystem, entityData, operator = null) {
    if (!this.eventBus) {
      console.warn('[MdmEventPublisher] EventBus not set, skipping event publish');
      return null;
    }

    const event = {
      eventId: uuidv4(),
      eventTime: new Date().toISOString(),
      sourceSystem: sourceSystem,
      eventType: eventType,
      bizCode: this.getBizCode(sourceSystem, eventType),
      operator: operator ? {
        userId: operator.userId || null,
        userName: operator.userName || null,
        ip: operator.ip || null
      } : null,
      data: entityData,
      version: '1.0',
      traceId: `trace-${Date.now()}-${uuidv4().slice(0, 8)}`
    };

    this.eventBus.publish(event.bizCode, event);
    console.log(`[MdmEventPublisher] Published event: ${event.bizCode}`, { eventId: event.eventId });
    return event;
  }

  getBizCode(sourceSystem, eventType) {
    const bizCodeMap = {
      'mdm.material': { create: 'mdms.material.create', update: 'mdms.material.update', delete: 'mdms.material.delete' },
      'mdm.customer': { create: 'mdms.customer.create', update: 'mdms.customer.update', delete: 'mdms.customer.delete' },
      'mdm.supplier': { create: 'mdms.supplier.create', update: 'mdms.supplier.update', delete: 'mdms.supplier.delete' },
      'mdm.employee': { create: 'mdms.employee.create', update: 'mdms.employee.update', delete: 'mdms.employee.delete' },
      'mdm.org': { create: 'mdms.org.create', update: 'mdms.org.update', delete: 'mdms.org.delete' }
    };

    const sourceMap = bizCodeMap[sourceSystem];
    if (sourceMap && sourceMap[eventType]) {
      return sourceMap[eventType];
    }
    return `${sourceSystem}.${eventType}`;
  }

  publishMaterialCreate(materialData, operator) {
    return this.publish('create', 'mdm.material', materialData, operator);
  }

  publishMaterialUpdate(materialData, operator) {
    return this.publish('update', 'mdm.material', materialData, operator);
  }

  publishMaterialDelete(materialId, operator) {
    return this.publish('delete', 'mdm.material', { material_id: materialId }, operator);
  }

  publishCustomerCreate(customerData, operator) {
    return this.publish('create', 'mdm.customer', customerData, operator);
  }

  publishCustomerUpdate(customerData, operator) {
    return this.publish('update', 'mdm.customer', customerData, operator);
  }

  publishCustomerDelete(customerId, operator) {
    return this.publish('delete', 'mdm.customer', { customer_id: customerId }, operator);
  }

  publishSupplierCreate(supplierData, operator) {
    return this.publish('create', 'mdm.supplier', supplierData, operator);
  }

  publishSupplierUpdate(supplierData, operator) {
    return this.publish('update', 'mdm.supplier', supplierData, operator);
  }

  publishSupplierDelete(supplierId, operator) {
    return this.publish('delete', 'mdm.supplier', { supplier_id: supplierId }, operator);
  }

  publishEmployeeCreate(employeeData, operator) {
    return this.publish('create', 'mdm.employee', employeeData, operator);
  }

  publishEmployeeUpdate(employeeData, operator) {
    return this.publish('update', 'mdm.employee', employeeData, operator);
  }

  publishEmployeeDelete(employeeId, operator) {
    return this.publish('delete', 'mdm.employee', { employee_id: employeeId }, operator);
  }

  publishOrgCreate(orgData, operator) {
    return this.publish('create', 'mdm.org', orgData, operator);
  }

  publishOrgUpdate(orgData, operator) {
    return this.publish('update', 'mdm.org', orgData, operator);
  }

  publishOrgDelete(orgId, operator) {
    return this.publish('delete', 'mdm.org', { org_id: orgId }, operator);
  }

  publishOrgSync(orgs, operator) {
    return this.publish('sync', 'mdm.org', { orgs }, operator);
  }

  publishEmployeeSync(employees, operator) {
    return this.publish('sync', 'mdm.employee', { employees }, operator);
  }
}

module.exports = new MdmEventPublisher();
