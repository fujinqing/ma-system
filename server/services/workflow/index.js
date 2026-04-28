const flowDefinition = require('./flowDefinition');
const flowInstance = require('./flowInstance');
const approval = require('./approval');

module.exports = {
  flowDefinition,
  flowInstance,
  approval,
  NODE_TYPES: flowDefinition.NODE_TYPES,
  FLOW_STATUS: flowDefinition.FLOW_STATUS,
  RULE_TYPES: flowDefinition.RULE_TYPES,
  INSTANCE_STATUS: flowInstance.INSTANCE_STATUS,
  NODE_STATUS: flowInstance.NODE_STATUS,
  APPROVAL_ACTIONS: approval.APPROVAL_ACTIONS
};