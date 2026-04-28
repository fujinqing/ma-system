const { v4: uuidv4 } = require('uuid');
const { createStandardEvent, eventDefinitions, publishEvent } = require('./eventSchema');

const SYSTEM_CONFIG = {
  SOURCE_SYSTEM: 'ma-system',
  TENANT_ID: 'default-tenant',
  EVENT_VERSION: 'v1.0'
};

class EventPublisher {
  constructor() {
    this.eventBus = null;
  }

  setEventBus(eventBus) {
    this.eventBus = eventBus;
  }

  publish(eventName, businessData, operator = null) {
    if (!this.eventBus) {
      console.warn('[EventPublisher] EventBus not set, skipping event publish');
      return null;
    }
    return publishEvent(this.eventBus, eventName, businessData, operator);
  }

  getOperator(req) {
    if (!req) return null;
    return {
      userId: req.user?.id || req.user?.userId || null,
      userName: req.user?.name || req.user?.userName || null,
      ip: req.ip || req.connection?.remoteAddress || null
    };
  }

  crmCustomer(action, data, req = null) {
    const eventName = eventDefinitions.crm?.customer?.[action];
    if (!eventName) {
      console.warn(`[EventPublisher] Unknown CRM customer action: ${action}`);
      return null;
    }
    return this.publish(eventName, data, this.getOperator(req));
  }

  saleQuotation(action, data, req = null) {
    const eventName = eventDefinitions.sale?.quotation?.[action];
    if (!eventName) {
      console.warn(`[EventPublisher] Unknown sale quotation action: ${action}`);
      return null;
    }
    return this.publish(eventName, data, this.getOperator(req));
  }

  saleOrder(action, data, req = null) {
    const eventName = eventDefinitions.sale?.order?.[action];
    if (!eventName) {
      console.warn(`[EventPublisher] Unknown sale order action: ${action}`);
      return null;
    }
    return this.publish(eventName, data, this.getOperator(req));
  }

  salePayment(action, data, req = null) {
    const eventName = eventDefinitions.sale?.payment?.[action];
    if (!eventName) {
      console.warn(`[EventPublisher] Unknown sale payment action: ${action}`);
      return null;
    }
    return this.publish(eventName, data, this.getOperator(req));
  }

  project(action, data, req = null) {
    let eventName;
    if (action === 'create') eventName = eventDefinitions.project?.create;
    else if (action === 'close') eventName = eventDefinitions.project?.close;
    else {
      console.warn(`[EventPublisher] Unknown project action: ${action}`);
      return null;
    }
    return this.publish(eventName, data, this.getOperator(req));
  }

  projectMilestone(action, data, req = null) {
    const eventName = eventDefinitions.project?.milestone?.[action];
    if (!eventName) {
      console.warn(`[EventPublisher] Unknown project milestone action: ${action}`);
      return null;
    }
    return this.publish(eventName, data, this.getOperator(req));
  }

  projectTask(action, data, req = null) {
    const eventName = eventDefinitions.project?.task?.[action];
    if (!eventName) {
      console.warn(`[EventPublisher] Unknown project task action: ${action}`);
      return null;
    }
    return this.publish(eventName, data, this.getOperator(req));
  }

  techRoute(action, data, req = null) {
    const eventName = eventDefinitions.tech?.route?.[action];
    if (!eventName) {
      console.warn(`[EventPublisher] Unknown tech route action: ${action}`);
      return null;
    }
    return this.publish(eventName, data, this.getOperator(req));
  }

  techDoc(action, data, req = null) {
    const eventName = eventDefinitions.tech?.doc?.[action];
    if (!eventName) {
      console.warn(`[EventPublisher] Unknown tech doc action: ${action}`);
      return null;
    }
    return this.publish(eventName, data, this.getOperator(req));
  }

  srmSupplier(action, data, req = null) {
    const eventName = eventDefinitions.srm?.supplier?.[action];
    if (!eventName) {
      console.warn(`[EventPublisher] Unknown SRM supplier action: ${action}`);
      return null;
    }
    return this.publish(eventName, data, this.getOperator(req));
  }

  srmPurchase(action, data, req = null) {
    const eventName = eventDefinitions.srm?.purchase?.[action];
    if (!eventName) {
      console.warn(`[EventPublisher] Unknown SRM purchase action: ${action}`);
      return null;
    }
    return this.publish(eventName, data, this.getOperator(req));
  }

  invInbound(data, req = null) {
    return this.publish(eventDefinitions.inv?.inbound, data, this.getOperator(req));
  }

  invOutbound(data, req = null) {
    return this.publish(eventDefinitions.inv?.outbound, data, this.getOperator(req));
  }

  invStock(action, data, req = null) {
    const eventName = eventDefinitions.inv?.stock?.[action];
    if (!eventName) {
      console.warn(`[EventPublisher] Unknown inventory stock action: ${action}`);
      return null;
    }
    return this.publish(eventName, data, this.getOperator(req));
  }

  invCheck(action, data, req = null) {
    const eventName = eventDefinitions.inv?.check?.[action];
    if (!eventName) {
      console.warn(`[EventPublisher] Unknown inventory check action: ${action}`);
      return null;
    }
    return this.publish(eventName, data, this.getOperator(req));
  }

  qcInspect(action, data, req = null) {
    const eventName = eventDefinitions.qc?.inspect?.[action];
    if (!eventName) {
      console.warn(`[EventPublisher] Unknown QC inspect action: ${action}`);
      return null;
    }
    return this.publish(eventName, data, this.getOperator(req));
  }

  qcDefect(action, data, req = null) {
    const eventName = eventDefinitions.qc?.defect?.[action];
    if (!eventName) {
      console.warn(`[EventPublisher] Unknown QC defect action: ${action}`);
      return null;
    }
    return this.publish(eventName, data, this.getOperator(req));
  }

  qcRectify(action, data, req = null) {
    const eventName = eventDefinitions.qc?.rectify?.[action];
    if (!eventName) {
      console.warn(`[EventPublisher] Unknown QC rectify action: ${action}`);
      return null;
    }
    return this.publish(eventName, data, this.getOperator(req));
  }

  hrEmployee(action, data, req = null) {
    const eventName = eventDefinitions.hr?.employee?.[action];
    if (!eventName) {
      console.warn(`[EventPublisher] Unknown HR employee action: ${action}`);
      return null;
    }
    return this.publish(eventName, data, this.getOperator(req));
  }

  hrDepartment(action, data, req = null) {
    const eventName = eventDefinitions.hr?.department?.[action];
    if (!eventName) {
      console.warn(`[EventPublisher] Unknown HR department action: ${action}`);
      return null;
    }
    return this.publish(eventName, data, this.getOperator(req));
  }

  adminAsset(action, data, req = null) {
    const eventName = eventDefinitions.admin?.asset?.[action];
    if (!eventName) {
      console.warn(`[EventPublisher] Unknown admin asset action: ${action}`);
      return null;
    }
    return this.publish(eventName, data, this.getOperator(req));
  }

  adminApproval(action, data, req = null) {
    const eventName = eventDefinitions.admin?.approval?.[action];
    if (!eventName) {
      console.warn(`[EventPublisher] Unknown admin approval action: ${action}`);
      return null;
    }
    return this.publish(eventName, data, this.getOperator(req));
  }

  prdWorkorder(action, data, req = null) {
    const eventName = eventDefinitions.prd?.workorder?.[action];
    if (!eventName) {
      console.warn(`[EventPublisher] Unknown production workorder action: ${action}`);
      return null;
    }
    return this.publish(eventName, data, this.getOperator(req));
  }

  prdReport(action, data, req = null) {
    const eventName = eventDefinitions.prd?.report?.[action];
    if (!eventName) {
      console.warn(`[EventPublisher] Unknown production report action: ${action}`);
      return null;
    }
    return this.publish(eventName, data, this.getOperator(req));
  }

  prdProduct(action, data, req = null) {
    const eventName = eventDefinitions.prd?.product?.[action];
    if (!eventName) {
      console.warn(`[EventPublisher] Unknown production product action: ${action}`);
      return null;
    }
    return this.publish(eventName, data, this.getOperator(req));
  }

  rdBom(action, data, req = null) {
    const eventName = eventDefinitions.rd?.bom?.[action];
    if (!eventName) {
      console.warn(`[EventPublisher] Unknown RD BOM action: ${action}`);
      return null;
    }
    return this.publish(eventName, data, this.getOperator(req));
  }

  rdFmea(action, data, req = null) {
    const eventName = eventDefinitions.rd?.fmea?.[action];
    if (!eventName) {
      console.warn(`[EventPublisher] Unknown RD FMEA action: ${action}`);
      return null;
    }
    return this.publish(eventName, data, this.getOperator(req));
  }

  rdVersion(action, data, req = null) {
    const eventName = eventDefinitions.rd?.version?.[action];
    if (!eventName) {
      console.warn(`[EventPublisher] Unknown RD version action: ${action}`);
      return null;
    }
    return this.publish(eventName, data, this.getOperator(req));
  }

  afterRepair(action, data, req = null) {
    const eventName = eventDefinitions.after?.repair?.[action];
    if (!eventName) {
      console.warn(`[EventPublisher] Unknown after repair action: ${action}`);
      return null;
    }
    return this.publish(eventName, data, this.getOperator(req));
  }

  afterSolved(data, req = null) {
    return this.publish(eventDefinitions.after?.solved, data, this.getOperator(req));
  }

  fileUpload(action, data, req = null) {
    const eventName = eventDefinitions.file?.[action];
    if (!eventName) {
      console.warn(`[EventPublisher] Unknown file action: ${action}`);
      return null;
    }
    return this.publish(eventName, data, this.getOperator(req));
  }

  kbArticle(action, data, req = null) {
    const eventName = eventDefinitions.kb?.article?.[action];
    if (!eventName) {
      console.warn(`[EventPublisher] Unknown KB article action: ${action}`);
      return null;
    }
    return this.publish(eventName, data, this.getOperator(req));
  }

  financeReceivable(action, data, req = null) {
    const eventName = eventDefinitions.finance?.receivable?.[action];
    if (!eventName) {
      console.warn(`[EventPublisher] Unknown finance receivable action: ${action}`);
      return null;
    }
    return this.publish(eventName, data, this.getOperator(req));
  }

  financePayable(action, data, req = null) {
    const eventName = eventDefinitions.finance?.payable?.[action];
    if (!eventName) {
      console.warn(`[EventPublisher] Unknown finance payable action: ${action}`);
      return null;
    }
    return this.publish(eventName, data, this.getOperator(req));
  }

  financeCost(action, data, req = null) {
    const eventName = eventDefinitions.finance?.cost?.[action];
    if (!eventName) {
      console.warn(`[EventPublisher] Unknown finance cost action: ${action}`);
      return null;
    }
    return this.publish(eventName, data, this.getOperator(req));
  }

  aiDataSync(action, data, req = null) {
    let eventName;
    if (action === 'sync') eventName = eventDefinitions.ai?.data?.sync;
    else if (action === 'summary') eventName = eventDefinitions.ai?.data?.summary?.generate;
    else if (action === 'recommend') eventName = eventDefinitions.ai?.data?.recommend?.generate;
    else {
      console.warn(`[EventPublisher] Unknown AI data sync action: ${action}`);
      return null;
    }
    return this.publish(eventName, data, this.getOperator(req));
  }

  aiRisk(action, data, req = null) {
    return this.publish(eventDefinitions.ai?.risk?.warning, data, this.getOperator(req));
  }

  aiModel(action, data, req = null) {
    return this.publish(eventDefinitions.ai?.model?.switch, data, this.getOperator(req));
  }

  aiKnowledge(action, data, req = null) {
    return this.publish(eventDefinitions.ai?.knowledge?.match, data, this.getOperator(req));
  }

  aiAnalysis(action, data, req = null) {
    return this.publish(eventDefinitions.ai?.analysis?.finish, data, this.getOperator(req));
  }

  socialUser(action, data, req = null) {
    return this.publish(eventDefinitions.social?.user?.sync, data, this.getOperator(req));
  }

  socialOrg(action, data, req = null) {
    return this.publish(eventDefinitions.social?.org?.sync, data, this.getOperator(req));
  }

  socialApproval(action, data, req = null) {
    const eventName = eventDefinitions.social?.approval?.[action];
    if (!eventName) {
      console.warn(`[EventPublisher] Unknown social approval action: ${action}`);
      return null;
    }
    return this.publish(eventName, data, this.getOperator(req));
  }

  socialTodo(action, data, req = null) {
    const eventName = eventDefinitions.social?.todo?.[action];
    if (!eventName) {
      console.warn(`[EventPublisher] Unknown social todo action: ${action}`);
      return null;
    }
    return this.publish(eventName, data, this.getOperator(req));
  }
}

const eventPublisher = new EventPublisher();

module.exports = eventPublisher;
module.exports.EventPublisher = EventPublisher;