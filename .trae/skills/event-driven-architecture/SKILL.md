---
name: "event-driven-architecture"
description: "Event-driven architecture implementation for ma-system. Invoke when user needs event publishing, event subscription, master data sync, or ETL data pipeline configuration."
---

# Event-Driven Architecture

Event-driven architecture implementation for M-A System enterprise management platform.

## Core Components

### 1. Event Bus (services/eventBus.js)
```javascript
const EventEmitter = require('events');
class EventBus extends EventEmitter {
  publish(eventName, payload) { ... }
  subscribe(eventName, handler) { ... }
}
```

### 2. Event Schema (services/eventSchema.js)
```javascript
const eventDefinitions = {
  customer: { create: 'mdms.customer.create', update: 'mdms.customer.update' },
  supplier: { create: 'mdms.supplier.create', update: 'mdms.supplier.update' },
  product: { create: 'mdms.product.create', update: 'mdms.product.update' },
  ai: { dataSync: 'ai.data.sync', summaryGenerate: 'ai.data.summary.generate' },
  social: { userSync: 'social.user.sync', approvalPush: 'social.approval.push' }
};
```

## Event Types

### Master Data Events
| Event | Description |
|-------|-------------|
| mdms.customer.create/update/delete | Customer master data |
| mdms.supplier.create/update/delete | Supplier master data |
| mdms.product.create/update/delete | Product master data |
| mdms.org.create/update/delete | Organization master data |

### Business Events
| Event | Description |
|-------|-------------|
| crm.order.create/audit.pass/reject | Sales orders |
| inv.inbound/outbound/stock.change | Inventory |
| prd.workorder.create/finish | Manufacturing |
| srm.purchase.create/pass | Procurement |

### AI Events
| Event | Description |
|-------|-------------|
| ai.data.sync | Data sync to AI model |
| ai.data.summary.generate | AI summary generation |
| ai.risk.warning | AI risk warning |

### Social Platform Events
| Event | Description |
|-------|-------------|
| social.user.sync | User account sync |
| social.approval.push/callback | Approval sync |
| social.message.push | Message push |

## Publishing Events
```javascript
const { publishEvent } = require('./services/eventSchema');
publishEvent(eventBus, 'mdms.customer.create', 'customer', 'create',
  { id: 1, name: 'Customer A' }, 'admin');
```

## Subscribing Events
```javascript
eventBus.subscribe('mdms.customer.create', async (event) => {
  await masterDataSync.upsertCustomer(event);
});
```

## Master Data Sync (services/masterDataSync.js)
- Subscribes to all mdms.* events
- Upserts data to MSSQL tables
- Maintains data consistency

## ETL Service (services/etl/index.js)
- Subscribes to business events
- Syncs data to data warehouse tables
- Supports: customer, supplier, product, order, inventory, production, quality, hr

## Architecture Rules
1. All business must use master data (no self-built customer/product/org)
2. Cross-module interaction via event bus only
3. Same module can use direct API calls
4. Data changes sync to data warehouse via ETL

## Usage

Invoke this skill when:
- User asks to add new event types
- User needs to publish/subscribe events
- User wants to configure ETL pipelines
- User needs master data synchronization