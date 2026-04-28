const workflow = require('../services/workflow');

const formatResponse = (res, success, data = null, message = '', pagination = null) => {
  const response = { success, timestamp: new Date().toISOString() };
  if (message) response.message = message;
  if (data !== null) response.data = data;
  if (pagination) response.pagination = pagination;
  res.json(response);
};

const getOperator = (req) => {
  return {
    userId: req.user?.id || null,
    userName: req.user?.name || req.user?.username || null,
    isAdmin: req.user?.role === 'admin'
  };
};

const flowController = {
  async createFlow(req, res) {
    try {
      const { flow_name, flow_desc, module_code, flow_config, bindings, is_default } = req.body;

      const errors = await workflow.flowDefinition.validateFlowConfig(flow_config || {});
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Flow config validation failed',
          errors
        });
      }

      const flow = await workflow.flowDefinition.createFlow({
        flow_name,
        flow_desc,
        module_code,
        flow_config,
        bindings,
        is_default
      }, getOperator(req).userId);

      formatResponse(res, true, flow, 'Flow created successfully');
    } catch (err) {
      console.error('[FlowController] Create flow error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async updateFlow(req, res) {
    try {
      const { id } = req.params;
      const { flow_name, flow_desc, flow_config, status, change_desc } = req.body;

      if (flow_config) {
        const errors = await workflow.flowDefinition.validateFlowConfig(flow_config);
        if (errors.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Flow config validation failed',
            errors
          });
        }
      }

      const flow = await workflow.flowDefinition.updateFlow(parseInt(id), {
        flow_name,
        flow_desc,
        flow_config,
        status,
        change_desc,
        created_by: getOperator(req).userId
      });

      formatResponse(res, true, flow, 'Flow updated successfully');
    } catch (err) {
      console.error('[FlowController] Update flow error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async deleteFlow(req, res) {
    try {
      const { id } = req.params;
      await workflow.flowDefinition.deleteFlow(parseInt(id));
      formatResponse(res, true, null, 'Flow deleted successfully');
    } catch (err) {
      console.error('[FlowController] Delete flow error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async enableFlow(req, res) {
    try {
      const { id } = req.params;
      const result = await workflow.flowDefinition.enableFlow(parseInt(id));
      formatResponse(res, true, result, 'Flow enabled successfully');
    } catch (err) {
      console.error('[FlowController] Enable flow error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async disableFlow(req, res) {
    try {
      const { id } = req.params;
      const result = await workflow.flowDefinition.disableFlow(parseInt(id));
      formatResponse(res, true, result, 'Flow disabled successfully');
    } catch (err) {
      console.error('[FlowController] Disable flow error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async freezeFlow(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const result = await workflow.flowDefinition.freezeFlow(parseInt(id), reason);
      formatResponse(res, true, result, 'Flow frozen successfully');
    } catch (err) {
      console.error('[FlowController] Freeze flow error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async reactivateFlow(req, res) {
    try {
      const { id } = req.params;
      const result = await workflow.flowDefinition.reactivateFlow(parseInt(id));
      formatResponse(res, true, result, 'Flow reactivated successfully');
    } catch (err) {
      console.error('[FlowController] Reactivate flow error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async copyFlow(req, res) {
    try {
      const { id } = req.params;
      const newFlow = await workflow.flowDefinition.copyFlow(parseInt(id), getOperator(req).userId);
      formatResponse(res, true, newFlow, 'Flow copied successfully');
    } catch (err) {
      console.error('[FlowController] Copy flow error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getFlow(req, res) {
    try {
      const { id } = req.params;
      const flow = await workflow.flowDefinition.getFlowById(parseInt(id));
      if (!flow) {
        return res.status(404).json({ success: false, message: 'Flow not found' });
      }
      formatResponse(res, true, flow);
    } catch (err) {
      console.error('[FlowController] Get flow error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getFlowList(req, res) {
    try {
      const { module_code, status, keyword, page, limit } = req.query;
      const result = await workflow.flowDefinition.getFlowList({
        module_code,
        status,
        keyword,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
      });
      formatResponse(res, true, result.flows, '', result.pagination);
    } catch (err) {
      console.error('[FlowController] Get flow list error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getFlowVersions(req, res) {
    try {
      const { id } = req.params;
      const versions = await workflow.flowDefinition.getFlowVersions(parseInt(id));
      formatResponse(res, true, versions);
    } catch (err) {
      console.error('[FlowController] Get flow versions error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async rollbackFlow(req, res) {
    try {
      const { id, version } = req.params;
      const versionId = await workflow.flowDefinition.rollbackToVersion(parseInt(id), parseInt(version));
      formatResponse(res, true, { version_id: versionId }, 'Flow rolled back successfully');
    } catch (err) {
      console.error('[FlowController] Rollback flow error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async createApprovalGroup(req, res) {
    try {
      const { group_name, group_type, member_ids, member_roles } = req.body;
      const groupId = await workflow.flowDefinition.createApprovalGroup({
        group_name,
        group_type,
        member_ids,
        member_roles
      }, getOperator(req).userId);
      formatResponse(res, true, { group_id: groupId }, 'Approval group created successfully');
    } catch (err) {
      console.error('[FlowController] Create approval group error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getApprovalGroups(req, res) {
    try {
      const groups = await workflow.flowDefinition.getApprovalGroups();
      formatResponse(res, true, groups);
    } catch (err) {
      console.error('[FlowController] Get approval groups error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async createNodeTemplate(req, res) {
    try {
      const { template_name, node_type, template_config, is_public } = req.body;
      const templateId = await workflow.flowDefinition.createNodeTemplate({
        template_name,
        node_type,
        template_config,
        is_public
      }, getOperator(req).userId);
      formatResponse(res, true, { template_id: templateId }, 'Node template created successfully');
    } catch (err) {
      console.error('[FlowController] Create node template error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getNodeTemplates(req, res) {
    try {
      const { node_type } = req.query;
      const templates = await workflow.flowDefinition.getNodeTemplates(node_type);
      formatResponse(res, true, templates);
    } catch (err) {
      console.error('[FlowController] Get node templates error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
};

const instanceController = {
  async startFlow(req, res) {
    try {
      const { flow_code, biz_id, biz_data, module_code } = req.body;

      const instance = await workflow.flowInstance.startFlowInstance(
        flow_code,
        biz_id,
        biz_data || {},
        getOperator(req),
        module_code
      );

      formatResponse(res, true, instance, 'Flow instance started successfully');
    } catch (err) {
      console.error('[InstanceController] Start flow error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getInstance(req, res) {
    try {
      const { id } = req.params;
      const instance = await workflow.flowInstance.getInstanceById(parseInt(id));
      if (!instance) {
        return res.status(404).json({ success: false, message: 'Instance not found' });
      }
      formatResponse(res, true, instance);
    } catch (err) {
      console.error('[InstanceController] Get instance error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getInstanceList(req, res) {
    try {
      const { flow_id, module_code, status, biz_id, page, limit } = req.query;
      const result = await workflow.flowInstance.getInstanceList({
        flow_id: flow_id ? parseInt(flow_id) : null,
        module_code,
        status,
        biz_id,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
      });
      formatResponse(res, true, result.instances, '', result.pagination);
    } catch (err) {
      console.error('[InstanceController] Get instance list error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getInstanceStats(req, res) {
    try {
      const { module_code } = req.query;
      const stats = await workflow.flowInstance.getInstanceStats({
        module_code: module_code || null
      });
      formatResponse(res, true, stats);
    } catch (err) {
      console.error('[InstanceController] Get instance stats error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getInstanceLogs(req, res) {
    try {
      const { id } = req.params;
      const logs = await workflow.flowInstance.getRunLogs(parseInt(id));
      formatResponse(res, true, logs);
    } catch (err) {
      console.error('[InstanceController] Get instance logs error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async terminateInstance(req, res) {
    try {
      const { id } = req.params;
      const instance = await workflow.flowInstance.terminateInstance(parseInt(id), getOperator(req));
      formatResponse(res, true, instance, 'Instance terminated successfully');
    } catch (err) {
      console.error('[InstanceController] Terminate instance error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async forceApproveInstance(req, res) {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      const operator = getOperator(req);

      if (!operator.isAdmin) {
        return res.status(403).json({ success: false, message: 'Only admin can force approve' });
      }

      const instance = await workflow.flowInstance.forceApproveInstance(parseInt(id), operator, comment || '');
      formatResponse(res, true, instance, 'Instance force approved successfully');
    } catch (err) {
      console.error('[InstanceController] Force approve instance error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async startFlowAsync(req, res) {
    try {
      const { flow_code, biz_id, biz_data, module_code, callback_url, async_mode } = req.body;

      if (async_mode !== true) {
        const instance = await workflow.flowInstance.startFlowInstance(
          flow_code,
          biz_id,
          biz_data || {},
          getOperator(req),
          module_code
        );
        return formatResponse(res, true, instance, 'Flow instance started successfully');
      }

      const { v4: uuidv4 } = require('uuid');
      const taskId = `async_${Date.now()}_${uuidv4().slice(0, 8).toUpperCase()}`;

      const result = await workflow.flowInstance.startFlowInstanceAsync(
        taskId,
        flow_code,
        biz_id,
        biz_data || {},
        getOperator(req),
        module_code,
        callback_url
      );

      formatResponse(res, true, result, 'Async task started successfully');
    } catch (err) {
      console.error('[InstanceController] Start async flow error:', err);
      res.status(err.status || 500).json({ success: false, message: err.message, code: err.code });
    }
  },

  async getAsyncTaskStatus(req, res) {
    try {
      const { task_id } = req.params;
      const task = await workflow.flowInstance.getAsyncTaskStatus(task_id);

      if (!task) {
        return res.status(404).json({ success: false, message: 'Async task not found' });
      }

      formatResponse(res, true, {
        task_id: task.task_id,
        status: task.status,
        flow_code: task.flow_code,
        biz_id: task.biz_id,
        result: task.result ? JSON.parse(task.result) : null,
        error_message: task.error_message,
        created_at: task.created_at,
        finished_at: task.finished_at
      });
    } catch (err) {
      console.error('[InstanceController] Get async task status error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async cancelInstance(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const operator = getOperator(req);

      const instance = await workflow.flowInstance.cancelInstance(parseInt(id), operator, reason || '');
      formatResponse(res, true, instance, 'Instance cancelled successfully');
    } catch (err) {
      console.error('[InstanceController] Cancel instance error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async validateModuleBinding(req, res) {
    try {
      const { flow_code, module_code } = req.params;
      const operator = getOperator(req);

      const flow = await workflow.flowInstance.validateCrossModuleCall(flow_code, module_code, operator);
      formatResponse(res, true, {
        flow_id: flow.flow_id,
        flow_code: flow.flow_code,
        flow_name: flow.flow_name,
        module_code: module_code,
        is_bound: true
      }, 'Module binding validated successfully');
    } catch (err) {
      console.error('[InstanceController] Validate module binding error:', err);
      res.status(err.status || 500).json({ success: false, message: err.message, code: err.code });
    }
  }
};

const approvalController = {
  async approve(req, res) {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      const result = await workflow.approval.approve(parseInt(id), getOperator(req), comment || '');
      formatResponse(res, true, result, 'Approved successfully');
    } catch (err) {
      console.error('[ApprovalController] Approve error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async reject(req, res) {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      const result = await workflow.approval.reject(parseInt(id), getOperator(req), comment || '');
      formatResponse(res, true, result, 'Rejected successfully');
    } catch (err) {
      console.error('[ApprovalController] Reject error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async transfer(req, res) {
    try {
      const { id } = req.params;
      const { to_user_id, to_user_name, comment } = req.body;
      const result = await workflow.approval.transferApproval(
        parseInt(id),
        to_user_id,
        to_user_name,
        getOperator(req),
        comment || ''
      );
      formatResponse(res, true, result, 'Transferred successfully');
    } catch (err) {
      console.error('[ApprovalController] Transfer error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getHistory(req, res) {
    try {
      const { instance_id } = req.query;
      const history = await workflow.approval.getApprovalHistory(parseInt(instance_id));
      formatResponse(res, true, history);
    } catch (err) {
      console.error('[ApprovalController] Get history error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getDetail(req, res) {
    try {
      const { id } = req.params;
      const detail = await workflow.approval.getApprovalDetail(parseInt(id));
      if (!detail) {
        return res.status(404).json({ success: false, message: 'Record not found' });
      }
      formatResponse(res, true, detail);
    } catch (err) {
      console.error('[ApprovalController] Get detail error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async consult(req, res) {
    try {
      const { id } = req.params;
      const { consult_user_id, consult_user_name, comment } = req.body;
      const result = await workflow.approval.consult(
        parseInt(id),
        consult_user_id,
        consult_user_name,
        comment || '',
        getOperator(req)
      );
      formatResponse(res, true, result, 'Consult request sent successfully');
    } catch (err) {
      console.error('[ApprovalController] Consult error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async addSign(req, res) {
    try {
      const { id } = req.params;
      const { sign_user_id, sign_user_name, comment } = req.body;
      const result = await workflow.approval.addSign(
        parseInt(id),
        sign_user_id,
        sign_user_name,
        getOperator(req),
        comment || ''
      );
      formatResponse(res, true, result, 'Added sign successfully');
    } catch (err) {
      console.error('[ApprovalController] Add sign error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
};

const todoController = {
  async getTodoList(req, res) {
    try {
      const { status, page, limit } = req.query;
      const result = await workflow.flowInstance.getTodoList(getOperator(req).userId, {
        status,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
      });
      formatResponse(res, true, result.todos, '', result.pagination);
    } catch (err) {
      console.error('[TodoController] Get todo list error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
};

const bindingController = {
  async getBindingsByModule(req, res) {
    try {
      const { module_code } = req.params;
      const bindings = await workflow.flowDefinition.getBindingsByModule(module_code);
      formatResponse(res, true, bindings);
    } catch (err) {
      console.error('[BindingController] Get bindings error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = {
  flowController,
  instanceController,
  approvalController,
  todoController,
  bindingController
};