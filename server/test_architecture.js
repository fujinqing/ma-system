const eventBus = require('./services/eventBus');
const { eventDefinitions, publishEvent, createStandardEvent } = require('./services/eventSchema');
const eventPublisher = require('./services/eventPublisher');

console.log('=== Ma-System Architecture Test ===\n');

console.log('1. Testing Event Definitions:');
console.log('   CRM Events:', JSON.stringify(eventDefinitions.crm, null, 2));
console.log('   Sale Events:', JSON.stringify(eventDefinitions.sale, null, 2));
console.log('   SRM Events:', JSON.stringify(eventDefinitions.srm, null, 2));
console.log('   Inv Events:', JSON.stringify(eventDefinitions.inv, null, 2));
console.log('   QC Events:', JSON.stringify(eventDefinitions.qc, null, 2));
console.log('   HR Events:', JSON.stringify(eventDefinitions.hr, null, 2));
console.log('   PRD Events:', JSON.stringify(eventDefinitions.prd, null, 2));
console.log('   RD Events:', JSON.stringify(eventDefinitions.rd, null, 2));
console.log('   After Events:', JSON.stringify(eventDefinitions.after, null, 2));
console.log('   KB Events:', JSON.stringify(eventDefinitions.kb, null, 2));
console.log('   Finance Events:', JSON.stringify(eventDefinitions.finance, null, 2));
console.log('   MDMS Events:', JSON.stringify(eventDefinitions.mdms, null, 2));
console.log('   AI Events:', JSON.stringify(eventDefinitions.ai, null, 2));
console.log('   Social Events:', JSON.stringify(eventDefinitions.social, null, 2));

console.log('\n2. Testing Standard Event Creation:');
const standardEvent = createStandardEvent(
  'mdms.material.create',
  { material_id: 1, material_code: 'M001', material_name: 'Test Material' },
  { userId: 1, userName: 'admin' }
);
console.log('   Standard Event:', JSON.stringify(standardEvent, null, 2));

console.log('\n3. Testing Event Publisher:');
eventPublisher.setEventBus(eventBus);
const testCustomerEvent = eventPublisher.crmCustomer('create', { id: 1, name: 'Test Customer' }, { id: 1, name: 'admin' });
console.log('   CRM Customer Created Event:', testCustomerEvent ? 'Published successfully' : 'Failed');

const testMaterialEvent = eventPublisher.publish(
  'mdms.material.create',
  { material_id: 1, material_code: 'M001', material_name: 'Test Material' },
  { userId: 1, userName: 'admin' }
);
console.log('   Material Created Event:', testMaterialEvent ? 'Published successfully' : 'Failed');

const testSaleOrderEvent = eventPublisher.saleOrder('created', { order_id: 1, order_amount: 1000 }, { id: 1, name: 'admin' });
console.log('   Sale Order Created Event:', testSaleOrderEvent ? 'Published successfully' : 'Failed');

const testPrdWorkorderEvent = eventPublisher.prdWorkorder('create', { workorder_id: 1, product_id: 1 }, { id: 1, name: 'admin' });
console.log('   PRD Workorder Created Event:', testPrdWorkorderEvent ? 'Published successfully' : 'Failed');

console.log('\n4. Testing Event Bus Subscriptions:');
eventBus.subscribe('test.event', (event) => {
  console.log('   Test event received:', event.header?.eventName || event.eventName);
});
eventBus.publish('test.event', createStandardEvent('test.event', { test: 'data' }));

console.log('\n5. Testing ETL Service:');
const etl = require('./services/etl/index.js');
console.log('   ETL Rules:', Object.keys(etl.ETL_RULES));

console.log('\n6. Testing API Gateway (optional):');
try {
  const gateway = require('./services/gateway/index.js');
  console.log('   Gateway module loaded:', gateway ? 'Success' : 'Failed');
} catch (err) {
  console.log('   Gateway module skipped (optional dependency missing)');
}

console.log('\n7. Event Summary:');
const eventCount = [
  ...Object.values(eventDefinitions.crm?.customer || {}),
  ...Object.values(eventDefinitions.sale?.quotation || {}),
  ...Object.values(eventDefinitions.sale?.order || {}),
  ...Object.values(eventDefinitions.sale?.payment || {}),
  eventDefinitions.project?.create,
  eventDefinitions.project?.close,
  ...Object.values(eventDefinitions.project?.milestone || {}),
  ...Object.values(eventDefinitions.project?.task || {}),
  ...Object.values(eventDefinitions.tech?.route || {}),
  ...Object.values(eventDefinitions.tech?.doc || {}),
  ...Object.values(eventDefinitions.srm?.supplier || {}),
  ...Object.values(eventDefinitions.srm?.purchase || {}),
  eventDefinitions.inv?.inbound,
  eventDefinitions.inv?.outbound,
  ...Object.values(eventDefinitions.inv?.stock || {}),
  ...Object.values(eventDefinitions.inv?.check || {}),
  ...Object.values(eventDefinitions.qc?.inspect || {}),
  ...Object.values(eventDefinitions.qc?.defect || {}),
  ...Object.values(eventDefinitions.qc?.rectify || {}),
  ...Object.values(eventDefinitions.hr?.employee || {}),
  ...Object.values(eventDefinitions.hr?.department || {}),
  ...Object.values(eventDefinitions.admin?.asset || {}),
  ...Object.values(eventDefinitions.admin?.approval || {}),
  ...Object.values(eventDefinitions.prd?.workorder || {}),
  ...Object.values(eventDefinitions.prd?.report || {}),
  ...Object.values(eventDefinitions.prd?.product || {}),
  ...Object.values(eventDefinitions.rd?.bom || {}),
  ...Object.values(eventDefinitions.rd?.fmea || {}),
  ...Object.values(eventDefinitions.rd?.version || {}),
  ...Object.values(eventDefinitions.after?.repair || {}),
  eventDefinitions.after?.solved,
  ...Object.values(eventDefinitions.file || {}),
  ...Object.values(eventDefinitions.kb?.article || {}),
  ...Object.values(eventDefinitions.finance?.receivable || {}),
  ...Object.values(eventDefinitions.finance?.payable || {}),
  ...Object.values(eventDefinitions.finance?.cost || {}),
  ...Object.values(eventDefinitions.mdms?.customer || {}),
  ...Object.values(eventDefinitions.mdms?.supplier || {}),
  ...Object.values(eventDefinitions.mdms?.product || {}),
  ...Object.values(eventDefinitions.mdms?.material || {}),
  ...Object.values(eventDefinitions.mdms?.employee || {}),
  ...Object.values(eventDefinitions.mdms?.org || {})
].filter(Boolean).length;
console.log('   Total defined events: ~' + eventCount + '+');

console.log('\n=== Architecture Test Complete ===');