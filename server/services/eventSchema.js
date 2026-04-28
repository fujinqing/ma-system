const { v4: uuidv4 } = require('uuid');

const SYSTEM_CONFIG = {
  SOURCE_SYSTEM: 'ma-system',
  TENANT_ID: 'default-tenant',
  EVENT_VERSION: 'v1.0'
};

function generateTraceId() {
  return `trace-${Date.now()}-${uuidv4().slice(0, 8)}`;
}

function createEventHeader(eventName, operator = null, tenantId = SYSTEM_CONFIG.TENANT_ID) {
  return {
    eventId: uuidv4(),
    eventName: eventName,
    eventTime: new Date().toISOString(),
    sourceModule: eventName.split('.')[0],
    tenantId: tenantId,
    operatorId: operator?.userId || operator?.id || null,
    operatorName: operator?.userName || operator?.name || null,
    eventVersion: SYSTEM_CONFIG.EVENT_VERSION,
    traceId: generateTraceId(),
    retryCount: 0
  };
}

function createStandardEvent(eventName, bodyData, operator = null, tenantId = SYSTEM_CONFIG.TENANT_ID) {
  return {
    header: createEventHeader(eventName, operator, tenantId),
    body: bodyData
  };
}

function publishEvent(eventBus, eventName, businessData, operator = null, tenantId = SYSTEM_CONFIG.TENANT_ID) {
  const event = createStandardEvent(eventName, businessData, operator, tenantId);
  eventBus.publish(eventName, event);
  console.log(`[Event Published] ${eventName}:`, JSON.stringify(event.header, null, 2));
  return event;
}

const eventDefinitions = {
  employee: {
    create: 'mdms.employee.create',
    update: 'mdms.employee.update',
    delete: 'mdms.employee.delete'
  },
  crm: {
    customer: {
      create: 'crm.customer.create',
      update: 'crm.customer.update',
      follow: 'crm.customer.follow',
      archive: 'crm.customer.archive'
    }
  },
  sale: {
    quotation: {
      create: 'sale.quotation.create'
    },
    order: {
      created: 'sale.order.created',
      audit: 'sale.order.audit'
    },
    payment: {
      receive: 'sale.payment.receive'
    }
  },
  project: {
    create: 'project.create',
    milestone: {
      update: 'project.milestone.update'
    },
    task: {
      finish: 'project.task.finish'
    },
    close: 'project.close'
  },
  tech: {
    route: {
      create: 'tech.route.create',
      update: 'tech.route.update'
    },
    doc: {
      change: 'tech.doc.change'
    }
  },
  srm: {
    supplier: {
      audit: 'srm.supplier.audit'
    },
    purchase: {
      create: 'srm.purchase.create',
      arrive: 'srm.purchase.arrive'
    }
  },
  inv: {
    inbound: 'inv.inbound',
    outbound: 'inv.outbound',
    stock: {
      change: 'inv.stock.change'
    },
    check: {
      finish: 'inv.check.finish'
    }
  },
  qc: {
    inspect: {
      create: 'qc.inspect.create',
      pass: 'qc.inspect.pass'
    },
    defect: {
      create: 'qc.defect.create'
    },
    rectify: {
      finish: 'qc.rectify.finish'
    }
  },
  hr: {
    employee: {
      create: 'hr.employee.create',
      leave: 'hr.employee.leave'
    },
    department: {
      update: 'hr.department.update'
    }
  },
  admin: {
    asset: {
      change: 'admin.asset.change'
    },
    approval: {
      finish: 'admin.approval.finish'
    }
  },
  prd: {
    workorder: {
      create: 'prd.workorder.create'
    },
    report: {
      finish: 'prd.report.finish'
    },
    product: {
      instock: 'prd.product.instock'
    }
  },
  rd: {
    bom: {
      update: 'rd.bom.update'
    },
    fmea: {
      update: 'rd.fmea.update'
    },
    version: {
      release: 'rd.version.release'
    }
  },
  after: {
    repair: {
      create: 'after.repair.create',
      finish: 'after.repair.finish'
    },
    solved: 'after.solved'
  },
  file: {
    upload: 'file.upload',
    update: 'file.update',
    delete: 'file.delete'
  },
  kb: {
    article: {
      create: 'kb.article.create',
      update: 'kb.article.update'
    }
  },
  finance: {
    receivable: {
      create: 'finance.receivable.create'
    },
    payable: {
      create: 'finance.payable.create'
    },
    cost: {
      calc: 'finance.cost.calc'
    }
  },
  mdms: {
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
    product: {
      create: 'mdms.product.create',
      update: 'mdms.product.update',
      delete: 'mdms.product.delete'
    },
    material: {
      create: 'mdms.material.create',
      update: 'mdms.material.update',
      delete: 'mdms.material.delete'
    },
    employee: {
      create: 'mdms.employee.create',
      update: 'mdms.employee.update',
      delete: 'mdms.employee.delete'
    },
    org: {
      create: 'mdms.org.create',
      update: 'mdms.org.update',
      delete: 'mdms.org.delete'
    }
  },
  ai: {
    data: {
      sync: 'ai.data.sync',
      summary: {
        generate: 'ai.data.summary.generate'
      },
      recommend: {
        generate: 'ai.data.recommend.generate'
      }
    },
    risk: {
      warning: 'ai.risk.warning'
    },
    model: {
      switch: 'ai.model.switch'
    },
    knowledge: {
      match: 'ai.knowledge.match'
    },
    analysis: {
      finish: 'ai.analysis.finish'
    }
  },
  social: {
    user: {
      sync: 'social.user.sync'
    },
    org: {
      sync: 'social.org.sync'
    },
    approval: {
      push: 'social.approval.push',
      callback: 'social.approval.callback'
    },
    todo: {
      create: 'social.todo.create',
      finish: 'social.todo.finish'
    },
    message: {
      push: 'social.message.push'
    },
    login: {
      success: 'social.login.success'
    }
  }
};

const ALL_EVENT_NAMES = Object.values(eventDefinitions).reduce((events, moduleEvents) => {
  const extractEvents = (obj, prefix = '') => {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        events.push(value);
      } else if (typeof value === 'object') {
        extractEvents(value, prefix ? `${prefix}.${key}` : key);
      }
    }
  };
  extractEvents(moduleEvents);
  return events;
}, []);

module.exports = {
  SYSTEM_CONFIG,
  eventDefinitions,
  ALL_EVENT_NAMES,
  createEventHeader,
  createStandardEvent,
  publishEvent,
  generateTraceId
};
