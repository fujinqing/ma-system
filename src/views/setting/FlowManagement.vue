<template>
  <div class="flow-management">
    <div class="page-header">
      <h2 class="page-title">流程管理</h2>
      <div class="header-actions">
        <el-select v-model="filterModule" placeholder="选择模块" clearable size="small" style="width: 150px; margin-right: 10px;">
          <el-option label="CRM" value="CRM"></el-option>
          <el-option label="SRM" value="SRM"></el-option>
          <el-option label="WMS" value="WMS"></el-option>
          <el-option label="MES" value="MES"></el-option>
          <el-option label="项目" value="PROJECT"></el-option>
          <el-option label="财务" value="FINANCE"></el-option>
          <el-option label="测试管理" value="TEST_MANAGEMENT"></el-option>
        </el-select>
        <el-select v-model="filterStatus" placeholder="状态" clearable size="small" style="width: 120px; margin-right: 10px;">
          <el-option label="草稿" value="draft"></el-option>
          <el-option label="启用" value="active"></el-option>
          <el-option label="停用" value="disabled"></el-option>
        </el-select>
        <el-input v-model="filterName" placeholder="搜索流程名称" size="small" style="width: 200px; margin-right: 10px;">
          <template #prefix><i class="el-icon-search"></i></template>
        </el-input>
        <el-button type="primary" @click="addFlow" size="small">
          <i class="fa fa-plus"></i> 创建流程
        </el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="流程列表" name="list">
        <div class="flow-list">
          <el-table :data="filteredFlows" border stripe size="small">
            <el-table-column prop="flow_code" label="流程编码" width="180"></el-table-column>
            <el-table-column prop="flow_name" label="流程名称" min-width="180">
              <template #default="{ row }">
                <el-link type="primary" @click="viewFlowDetail(row)">{{ row.flow_name }}</el-link>
              </template>
            </el-table-column>
            <el-table-column prop="module_code" label="归属模块" width="120">
              <template #default="{ row }">
                <el-tag size="small">{{ row.module_code }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="version_count" label="版本" width="80">
              <template #default="{ row }">
                <el-tag type="info" size="small">v{{ row.current_version || 1 }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-switch v-model="row.status" active-value="active" inactive-value="disabled" @change="toggleFlowStatus(row)"></el-switch>
              </template>
            </el-table-column>
            <el-table-column prop="is_default" label="默认流程" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.is_default" type="success" size="small">是</el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="160"></el-table-column>
            <el-table-column label="操作" width="380" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="editFlow(row)">编辑</el-button>
                <el-button type="success" size="small" link @click="openVersionDialog(row)">版本</el-button>
                <el-button type="warning" size="small" link @click="openBindingDialog(row)">绑定</el-button>
                <el-button v-if="row.status === 'draft'" type="success" size="small" link @click="enableFlow(row)">启用</el-button>
                <el-button v-if="row.status === 'active'" type="info" size="small" link @click="disableFlow(row)">停用</el-button>
                <el-button v-if="row.status === 'active'" type="warning" size="small" link @click="freezeFlow(row)">冻结</el-button>
                <el-button v-if="row.status === 'frozen'" type="success" size="small" link @click="reactivateFlow(row)">激活</el-button>
                <el-button type="info" size="small" link @click="copyFlow(row)">复制</el-button>
                <el-button type="danger" size="small" link @click="deleteFlow(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="流程实例" name="instances">
        <div class="instance-list">
          <el-form :inline="true" size="small">
            <el-form-item label="实例状态">
              <el-select v-model="instanceFilter.status" placeholder="全部" clearable style="width: 120px;">
                <el-option label="进行中" value="running"></el-option>
                <el-option label="已完成" value="completed"></el-option>
                <el-option label="已驳回" value="rejected"></el-option>
                <el-option label="已终止" value="terminated"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="模块">
              <el-input v-model="instanceFilter.module_code" placeholder="模块编码" style="width: 120px;"></el-input>
            </el-form-item>
            <el-form-item label="业务ID">
              <el-input v-model="instanceFilter.biz_id" placeholder="业务ID" style="width: 120px;"></el-input>
            </el-form-item>
            <el-form-item><el-button type="primary" @click="loadInstances">查询</el-button></el-form-item>
          </el-form>
          <el-table :data="instances" border stripe size="small" v-loading="instanceLoading">
            <el-table-column prop="instance_id" label="实例ID" width="100"></el-table-column>
            <el-table-column prop="flow_name" label="流程名称" min-width="150"></el-table-column>
            <el-table-column prop="biz_id" label="业务ID" width="150"></el-table-column>
            <el-table-column prop="module_code" label="模块" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ row.module_code }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getInstanceStatusType(row.status)" size="small">{{ getInstanceStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="start_user_name" label="发起人" width="100"></el-table-column>
            <el-table-column prop="start_at" label="开始时间" width="160"></el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="viewInstanceDetail(row)">详情</el-button>
                <el-button v-if="row.status === 'running'" type="danger" size="small" link @click="terminateInstance(row)">终止</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="待我审批" name="todos">
        <div class="todo-list">
          <el-table :data="todos" border stripe size="small" v-loading="todoLoading">
            <el-table-column prop="todo_id" label="待办ID" width="100"></el-table-column>
            <el-table-column prop="title" label="标题" min-width="200"></el-table-column>
            <el-table-column prop="content" label="内容" min-width="250"></el-table-column>
            <el-table-column prop="flow_name" label="流程" width="150"></el-table-column>
            <el-table-column prop="priority" label="优先级" width="100">
              <template #default="{ row }">
                <el-tag :type="getPriorityType(row.priority)" size="small">{{ getPriorityText(row.priority) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="due_date" label="截止时间" width="160"></el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="openApprovalDialog(row)">审批</el-button>
                <el-button type="info" size="small" link @click="viewInstanceDetailById(row.instance_id)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="运行日志" name="logs">
        <div class="log-list">
          <el-form :inline="true" size="small">
            <el-form-item label="实例ID">
              <el-input v-model="logFilter.instance_id" placeholder="实例ID" style="width: 120px;"></el-input>
            </el-form-item>
            <el-form-item label="日志级别">
              <el-select v-model="logFilter.level" placeholder="全部" clearable style="width: 100px;">
                <el-option label="INFO" value="info"></el-option>
                <el-option label="WARN" value="warn"></el-option>
                <el-option label="ERROR" value="error"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item><el-button type="primary" @click="loadLogs">查询</el-button></el-form-item>
          </el-form>
          <el-timeline>
            <el-timeline-item v-for="log in logs" :key="log.log_id" :timestamp="log.created_at" :type="getLogType(log.log_level)" placement="top">
              <el-card shadow="hover">
                <p><strong>节点:</strong> {{ log.node_code || '-' }}</p>
                <p><strong>级别:</strong> <el-tag size="small" :type="getLogType(log.log_level)">{{ log.log_level }}</el-tag></p>
                <p><strong>消息:</strong> {{ log.message }}</p>
                <p v-if="log.details" style="margin-top: 8px; color: #666;">{{ log.details }}</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="flowDialogVisible" :title="isEditFlow ? '编辑流程' : '创建流程'" width="90%" top="5vh" destroy-on-close :close-on-click-modal="false">
      <div class="flow-design-container">
        <el-form :model="flowForm" :rules="flowRules" ref="flowFormRef" label-width="100px" size="small">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="流程名称" prop="flow_name">
                <el-input v-model="flowForm.flow_name" placeholder="请输入流程名称"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="归属模块" prop="module_code">
                <el-select v-model="flowForm.module_code" placeholder="请选择归属模块" style="width: 100%;">
                  <el-option label="CRM - 客户管理" value="CRM"></el-option>
                  <el-option label="SRM - 供应商管理" value="SRM"></el-option>
                  <el-option label="WMS - 仓库管理" value="WMS"></el-option>
                  <el-option label="MES - 生产管理" value="MES"></el-option>
                  <el-option label="PROJECT - 项目管理" value="PROJECT"></el-option>
                  <el-option label="FINANCE - 财务管理" value="FINANCE"></el-option>
                  <el-option label="HR - 人事管理" value="HR"></el-option>
                  <el-option label="QC - 质量管理" value="QC"></el-option>
                  <el-option label="TEST_MANAGEMENT - 测试管理" value="TEST_MANAGEMENT"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="流程描述">
                <el-input v-model="flowForm.flow_desc" type="textarea" :rows="2" placeholder="请输入流程描述"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="设为默认"><el-switch v-model="flowForm.is_default"></el-switch></el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <el-divider content-position="left">流程设计器</el-divider>

        <div class="flow-editor">
          <div class="editor-toolbar">
            <div class="toolbar-left">
              <span class="toolbar-hint">提示：拖拽节点到画布，双击节点配置属性，从连接点拖拽创建连接线</span>
            </div>
            <div class="toolbar-right">
              <el-button link type="primary" size="small" @click="openNodeTemplateDialog" style="margin-right: 10px;">
                <i class="fa fa-bookmark"></i> 节点模板
              </el-button>
              <el-button link type="primary" size="small" @click="clearCanvas" plain><i class="fa fa-trash"></i> 清空</el-button>
              <el-button link type="primary" size="small" @click="autoLayout" plain><i class="fa fa-magic"></i> 自动布局</el-button>
            </div>
          </div>

          <div class="editor-container">
            <div class="palette">
              <h4>节点库</h4>
              <div class="palette-items">
                <div class="palette-item" draggable="true" @dragstart="onDragStart($event, 'start')">
                  <div class="node-icon start"><i class="fa fa-play"></i></div>
                  <span>开始节点</span>
                </div>
                <div class="palette-item" draggable="true" @dragstart="onDragStart($event, 'approval_single')">
                  <div class="node-icon approver"><i class="fa fa-user"></i></div>
                  <span>单人审批</span>
                </div>
                <div class="palette-item" draggable="true" @dragstart="onDragStart($event, 'approval_multi')">
                  <div class="node-icon approver-multi"><i class="fa fa-users"></i></div>
                  <span>多人审批</span>
                </div>
                <div class="palette-item" draggable="true" @dragstart="onDragStart($event, 'condition')">
                  <div class="node-icon condition"><i class="fa fa-code-fork"></i></div>
                  <span>条件分支</span>
                </div>
                <div class="palette-item" draggable="true" @dragstart="onDragStart($event, 'action')">
                  <div class="node-icon action"><i class="fa fa-cog"></i></div>
                  <span>操作节点</span>
                </div>
                <div class="palette-item" draggable="true" @dragstart="onDragStart($event, 'notify')">
                  <div class="node-icon notification"><i class="fa fa-bell"></i></div>
                  <span>通知节点</span>
                </div>
                <div class="palette-item" draggable="true" @dragstart="onDragStart($event, 'initiator')">
                  <div class="node-icon initiator"><i class="fa fa-user-plus"></i></div>
                  <span>发起人</span>
                </div>
                <div class="palette-item" draggable="true" @dragstart="onDragStart($event, 'dept_manager')">
                  <div class="node-icon dept-manager"><i class="fa fa-building"></i></div>
                  <span>部门主管</span>
                </div>
                <div class="palette-item" draggable="true" @dragstart="onDragStart($event, 'role_approval')">
                  <div class="node-icon role-approval"><i class="fa fa-id-badge"></i></div>
                  <span>角色审批</span>
                </div>
                <div class="palette-item" draggable="true" @dragstart="onDragStart($event, 'cc')">
                  <div class="node-icon cc"><i class="fa fa-eye"></i></div>
                  <span>抄送节点</span>
                </div>
                <div class="palette-item" draggable="true" @dragstart="onDragStart($event, 'countersign')">
                  <div class="node-icon countersign"><i class="fa fa-check-circle"></i></div>
                  <span>会签节点</span>
                </div>
                <div class="palette-item" draggable="true" @dragstart="onDragStart($event, 'or_sign')">
                  <div class="node-icon or-sign"><i class="fa fa-check-square"></i></div>
                  <span>或签节点</span>
                </div>
                <div class="palette-item" draggable="true" @dragstart="onDragStart($event, 'auto_action')">
                  <div class="node-icon auto-action"><i class="fa fa-robot"></i></div>
                  <span>自动处理</span>
                </div>
                <div class="palette-item" draggable="true" @dragstart="onDragStart($event, 'branch_condition')">
                  <div class="node-icon branch-condition"><i class="fa fa-share-alt"></i></div>
                  <span>分支条件</span>
                </div>
                <div class="palette-item" draggable="true" @dragstart="onDragStart($event, 'reject_branch')">
                  <div class="node-icon reject-branch"><i class="fa fa-reply"></i></div>
                  <span>驳回分支</span>
                </div>
                <div class="palette-item" draggable="true" @dragstart="onDragStart($event, 'timeout')">
                  <div class="node-icon timeout"><i class="fa fa-clock"></i></div>
                  <span>超时节点</span>
                </div>
                <div class="palette-item" draggable="true" @dragstart="onDragStart($event, 'end')">
                  <div class="node-icon end"><i class="fa fa-stop"></i></div>
                  <span>结束节点</span>
                </div>
              </div>
            </div>

            <div class="canvas-wrapper">
              <div class="canvas" ref="canvasRef" @drop="onDrop" @dragover="onDragOver" @mousemove="onCanvasMouseMove" @mouseup="onCanvasMouseUp" @click="onCanvasClick">
                <svg class="connections-layer" :width="canvasWidth" :height="canvasHeight">
                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#909399" />
                    </marker>
                  </defs>
                  <g v-for="(connection, index) in connections" :key="'conn-' + index">
                    <path :d="getConnectionPath(connection)" fill="none" :stroke="selectedConnection === index ? '#165DFF' : '#909399'" stroke-width="2" marker-end="url(#arrowhead)" class="connection-line" @click.stop="selectConnection(index)" @dblclick.stop="deleteConnection(index)" :class="{ 'selected': selectedConnection === index }" />
                    <g v-if="selectedConnection === index" @click.stop="deleteConnection(index)">
                      <circle :cx="getConnectionMidpoint(connection).x" :cy="getConnectionMidpoint(connection).y" r="12" fill="#ff4d4f" class="delete-btn" />
                      <text :x="getConnectionMidpoint(connection).x" :y="getConnectionMidpoint(connection).y + 4" text-anchor="middle" fill="#fff" font-size="14" font-weight="bold">×</text>
                    </g>
                  </g>
                  <path v-if="isConnecting && tempConnection" :d="getTempConnectionPath()" fill="none" stroke="#165DFF" stroke-width="2" stroke-dasharray="5,5" />
                </svg>

                <div class="nodes-layer">
                  <div v-for="node in flowNodes" :key="node.id" class="flow-node" :class="[node.node_type, { 'selected': selectedNode === node.id, 'connecting': isConnecting && connectionStart === node.id }]" :style="{ left: node.x + 'px', top: node.y + 'px' }" @mousedown="onNodeMouseDown($event, node)" @dblclick.stop="openNodeConfigDialog(node)">
                    <div class="connection-point top" @mousedown.stop="startConnection($event, node, 'top')"></div>
                    <div class="connection-point right" @mousedown.stop="startConnection($event, node, 'right')"></div>
                    <div class="connection-point bottom" @mousedown.stop="startConnection($event, node, 'bottom')"></div>
                    <div class="connection-point left" @mousedown.stop="startConnection($event, node, 'left')"></div>
                    <div class="node-header">
                      <i :class="getNodeIcon(node.node_type)"></i>
                      <span>{{ getNodeName(node.node_type) }}</span>
                      <el-tag v-if="node.node_name && node.node_name !== getNodeName(node.node_type)" size="small" type="info">{{ node.node_name }}</el-tag>
                      <button class="node-delete" @click.stop="deleteNode(node.id)">×</button>
                    </div>
                    <div class="node-content">
                      <template v-if="node.node_type === 'approval_single' || node.node_type === 'approval_multi'">
                        <span class="node-label" v-if="node.assignee_name">{{ node.assignee_name }}</span>
                        <span class="node-label placeholder" v-else>点击配置审批人</span>
                      </template>
                      <template v-if="node.node_type === 'condition'">
                        <span class="node-label" v-if="node.condition_expr">{{ node.condition_expr }}</span>
                        <span class="node-label placeholder" v-else>点击配置条件</span>
                      </template>
                      <template v-if="node.node_type === 'action'">
                        <span class="node-label" v-if="node.action_name">{{ node.action_name }}</span>
                        <span class="node-label placeholder" v-else>点击配置动作</span>
                      </template>
                      <template v-if="node.node_type === 'notify'">
                        <span class="node-label" v-if="node.notify_type">{{ getNotifyTypeText(node.notify_type) }}</span>
                        <span class="node-label placeholder" v-else>点击配置通知</span>
                      </template>
                      <template v-if="node.node_type === 'start' || node.node_type === 'end'">
                        <span class="node-label">{{ node.node_type === 'start' ? '开始' : '结束' }}</span>
                      </template>
                      <template v-if="node.node_type === 'initiator'">
                        <span class="node-label" v-if="node.node_name">{{ node.node_name }}</span>
                        <span class="node-label placeholder" v-else>发起人节点</span>
                      </template>
                      <template v-if="node.node_type === 'dept_manager'">
                        <span class="node-label" v-if="node.manager_level">主管L{{ node.manager_level }}</span>
                        <span class="node-label placeholder" v-else>部门主管</span>
                      </template>
                      <template v-if="node.node_type === 'role_approval'">
                        <span class="node-label" v-if="node.biz_role">{{ node.biz_role }}</span>
                        <span class="node-label placeholder" v-else>角色审批</span>
                      </template>
                      <template v-if="node.node_type === 'cc'">
                        <span class="node-label">抄送</span>
                      </template>
                      <template v-if="node.node_type === 'countersign'">
                        <span class="node-label" v-if="node.countersign_users && node.countersign_users.length">{{ node.countersign_users.length }}人会签</span>
                        <span class="node-label placeholder" v-else>会签节点</span>
                      </template>
                      <template v-if="node.node_type === 'or_sign'">
                        <span class="node-label" v-if="node.or_sign_users && node.or_sign_users.length">{{ node.or_sign_users.length }}人或签</span>
                        <span class="node-label placeholder" v-else>或签节点</span>
                      </template>
                      <template v-if="node.node_type === 'auto_action'">
                        <span class="node-label" v-if="node.auto_action_type">{{ node.auto_action_type }}</span>
                        <span class="node-label placeholder" v-else>自动处理</span>
                      </template>
                      <template v-if="node.node_type === 'branch_condition'">
                        <span class="node-label" v-if="node.branch_label">{{ node.branch_label }}</span>
                        <span class="node-label placeholder" v-else>分支条件</span>
                      </template>
                      <template v-if="node.node_type === 'reject_branch'">
                        <span class="node-label">驳回分支</span>
                      </template>
                      <template v-if="node.node_type === 'timeout'">
                        <span class="node-label" v-if="node.timeout_hours">{{ node.timeout_hours }}h超时</span>
                        <span class="node-label placeholder" v-else>超时节点</span>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="flowDialogVisible = false">取消</el-button>
          <el-button @click="saveFlowDraft">保存草稿</el-button>
          <el-button type="primary" @click="saveFlow">保存并发布</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog title="节点配置" v-model="nodeConfigDialogVisible" width="600px" destroy-on-close>
      <el-form :model="nodeConfig" label-width="120px" size="small">
        <el-form-item label="节点名称"><el-input v-model="nodeConfig.node_name" placeholder="请输入节点名称"></el-input></el-form-item>

        <template v-if="nodeConfig.node_type === 'approval_single' || nodeConfig.node_type === 'approval_multi'">
          <el-divider content-position="left">审批人配置</el-divider>
          <el-form-item label="审批人类型">
            <el-select v-model="nodeConfig.approver_type" placeholder="请选择" style="width: 100%;">
              <el-option label="指定用户" value="user"></el-option>
              <el-option label="指定角色" value="role"></el-option>
              <el-option label="上级审批" value="superior"></el-option>
              <el-option label="审批组" value="group"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="审批人" v-if="nodeConfig.approver_type === 'user'">
            <el-select v-model="nodeConfig.assignee_id" placeholder="请选择审批人" style="width: 100%;" filterable>
              <el-option v-for="user in users" :key="user.id" :label="user.name" :value="user.id"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="角色" v-if="nodeConfig.approver_type === 'role'">
            <el-select v-model="nodeConfig.assignee_role" placeholder="请选择角色" style="width: 100%;">
              <el-option v-for="role in roles" :key="role.id" :label="role.name" :value="role.id"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="审批组" v-if="nodeConfig.approver_type === 'group'">
            <el-select v-model="nodeConfig.assignee_group" placeholder="请选择审批组" style="width: 100%;">
              <el-option v-for="group in approvalGroups" :key="group.group_id" :label="group.group_name" :value="group.group_id"></el-option>
            </el-select>
          </el-form-item>
          <el-divider content-position="left">审批规则配置</el-divider>
          <el-form-item label="审批方式">
            <el-radio-group v-model="nodeConfig.approval_mode">
              <el-radio value="any">一票通过</el-radio>
              <el-radio value="all">一票否决</el-radio>
              <el-radio value="sequence">按序审批</el-radio>
              <el-radio value="parallel">并行审批</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="超时设置">
            <el-input v-model="nodeConfig.timeout_hours" placeholder="超时小时数" style="width: 100px;"></el-input>
            <span style="margin-left: 10px;">小时后</span>
            <el-select v-model="nodeConfig.timeout_action" placeholder="超时动作" style="width: 120px; margin-left: 10px;">
              <el-option label="自动通过" value="pass"></el-option>
              <el-option label="自动驳回" value="reject"></el-option>
              <el-option label="发送催办" value="remind"></el-option>
            </el-select>
          </el-form-item>
        </template>

        <template v-if="nodeConfig.node_type === 'condition'">
          <el-divider content-position="left">条件配置</el-divider>
          <el-form-item label="条件表达式">
            <el-input v-model="nodeConfig.condition_expr" type="textarea" :rows="3" placeholder="请输入条件表达式，如: bizData.amount > 10000"></el-input>
          </el-form-item>
          <el-form-item label="条件说明"><el-input v-model="nodeConfig.condition_desc" placeholder="请输入条件说明"></el-input></el-form-item>
          <el-form-item label="条件分支标签"><el-input v-model="nodeConfig.branch_label" placeholder="如: 金额大于1万"></el-input></el-form-item>
        </template>

        <template v-if="nodeConfig.node_type === 'action'">
          <el-divider content-position="left">操作配置</el-divider>
          <el-form-item label="操作类型">
            <el-select v-model="nodeConfig.action_type" placeholder="请选择操作类型" style="width: 100%;">
              <el-option label="更新数据" value="update"></el-option>
              <el-option label="发送消息" value="message"></el-option>
              <el-option label="调用API" value="api"></el-option>
              <el-option label="触发事件" value="event"></el-option>
              <el-option label="发送邮件" value="email"></el-option>
              <el-option label="发送短信" value="sms"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="操作名称"><el-input v-model="nodeConfig.action_name" placeholder="请输入操作名称"></el-input></el-form-item>
          <el-form-item label="目标模块" v-if="nodeConfig.action_type">
            <el-select v-model="nodeConfig.target_module" placeholder="请选择目标模块" style="width: 100%;">
              <el-option label="CRM" value="CRM"></el-option>
              <el-option label="SRM" value="SRM"></el-option>
              <el-option label="WMS" value="WMS"></el-option>
              <el-option label="MES" value="MES"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="操作参数">
            <el-input v-model="nodeConfig.action_params" type="textarea" :rows="3" placeholder='请输入JSON格式参数，如: {"field": "status", "value": "approved"}'></el-input>
          </el-form-item>
        </template>

        <template v-if="nodeConfig.node_type === 'notify'">
          <el-divider content-position="left">通知配置</el-divider>
          <el-form-item label="通知方式">
            <el-checkbox-group v-model="nodeConfig.notify_channels">
              <el-checkbox value="system">系统通知</el-checkbox>
              <el-checkbox value="email">邮件</el-checkbox>
              <el-checkbox value="sms">短信</el-checkbox>
              <el-checkbox value="wechat">企业微信</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="通知类型">
            <el-select v-model="nodeConfig.notify_type" placeholder="请选择" style="width: 100%;">
              <el-option label="审批通知" value="approval"></el-option>
              <el-option label="结果通知" value="result"></el-option>
              <el-option label="催办通知" value="remind"></el-option>
              <el-option label="超时通知" value="timeout"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="通知模板">
            <el-input v-model="nodeConfig.notify_template" type="textarea" :rows="3" placeholder="通知内容模板，支持变量: {operator}, {flow_name}, {node_name}"></el-input>
          </el-form-item>
          <el-form-item label="通知人">
            <el-select v-model="nodeConfig.notify_receiver_type" placeholder="请选择" style="width: 100%;">
              <el-option label="发起人" value="start_user"></el-option>
              <el-option label="审批人" value="approver"></el-option>
              <el-option label="指定用户" value="user"></el-option>
            </el-select>
          </el-form-item>
        </template>

        <template v-if="nodeConfig.node_type === 'initiator'">
          <el-divider content-position="left">发起人配置</el-divider>
          <el-form-item label="部门限制">
            <el-select v-model="nodeConfig.dept限制" placeholder="不限制" clearable style="width: 100%;">
              <el-option label="不限制" value=""></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="岗位限制">
            <el-select v-model="nodeConfig.position限制" placeholder="不限制" clearable style="width: 100%;">
              <el-option label="不限制" value=""></el-option>
            </el-select>
          </el-form-item>
        </template>

        <template v-if="nodeConfig.node_type === 'dept_manager'">
          <el-divider content-position="left">部门主管配置</el-divider>
          <el-form-item label="审批层级">
            <el-select v-model="nodeConfig.manager_level" placeholder="直接主管" style="width: 100%;">
              <el-option label="直接主管" value="1"></el-option>
              <el-option label="二级主管" value="2"></el-option>
              <el-option label="三级主管" value="3"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="找不到主管时">
            <el-select v-model="nodeConfig.no_manager_action" placeholder="请选择" style="width: 100%;">
              <el-option label="自动通过" value="pass"></el-option>
              <el-option label="转交指定人" value="assign"></el-option>
              <el-option label="终止流程" value="terminate"></el-option>
            </el-select>
          </el-form-item>
        </template>

        <template v-if="nodeConfig.node_type === 'role_approval'">
          <el-divider content-position="left">角色审批配置</el-divider>
          <el-form-item label="业务角色">
            <el-select v-model="nodeConfig.biz_role" placeholder="请选择角色" style="width: 100%;">
              <el-option label="采购员" value="purchaser"></el-option>
              <el-option label="生产主管" value="production_leader"></el-option>
              <el-option label="质检员" value="qc_inspector"></el-option>
              <el-option label="仓库管理员" value="warehouse_keeper"></el-option>
              <el-option label="财务" value="finance"></el-option>
              <el-option label="售后工程师" value="after_sales"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="审批规则">
            <el-radio-group v-model="nodeConfig.role_approval_mode">
              <el-radio value="any">任意角色人通过</el-radio>
              <el-radio value="all">全部角色人通过</el-radio>
            </el-radio-group>
          </el-form-item>
        </template>

        <template v-if="nodeConfig.node_type === 'cc'">
          <el-divider content-position="left">抄送配置</el-divider>
          <el-form-item label="抄送对象">
            <el-select v-model="nodeConfig.cc_type" placeholder="请选择" style="width: 100%;">
              <el-option label="发起人" value="start_user"></el-option>
              <el-option label="审批人" value="approver"></el-option>
              <el-option label="指定人" value="user"></el-option>
              <el-option label="角色" value="role"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="选择人员" v-if="nodeConfig.cc_type === 'user'">
            <el-select v-model="nodeConfig.cc_user_ids" placeholder="请选择" style="width: 100%;" multiple>
              <el-option v-for="user in users" :key="user.id" :label="user.name" :value="user.id"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="选择角色" v-if="nodeConfig.cc_type === 'role'">
            <el-select v-model="nodeConfig.cc_role_codes" placeholder="请选择" style="width: 100%;" multiple>
              <el-option v-for="role in roles" :key="role.id" :label="role.name" :value="role.code"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="是否需要确认">
            <el-switch v-model="nodeConfig.cc_require_confirm"></el-switch>
          </el-form-item>
        </template>

        <template v-if="nodeConfig.node_type === 'countersign'">
          <el-divider content-position="left">会签配置</el-divider>
          <el-form-item label="会签人员">
            <el-select v-model="nodeConfig.countersign_users" placeholder="请选择" style="width: 100%;" multiple>
              <el-option v-for="user in users" :key="user.id" :label="user.name" :value="user.id"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="会签规则">
            <el-radio-group v-model="nodeConfig.countersign_rule">
              <el-radio value="all_pass">全员通过</el-radio>
              <el-radio value="one_reject">一票否决</el-radio>
              <el-radio value="percentage">按比例</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="通过比例" v-if="nodeConfig.countersign_rule === 'percentage'" >
            <el-input-number v-model="nodeConfig.countersign_percentage" :min="1" :max="100"></el-input-number>
            <span>%</span>
          </el-form-item>
        </template>

        <template v-if="nodeConfig.node_type === 'or_sign'">
          <el-divider content-position="left">或签配置</el-divider>
          <el-form-item label="或签人员">
            <el-select v-model="nodeConfig.or_sign_users" placeholder="请选择" style="width: 100%;" multiple>
              <el-option v-for="user in users" :key="user.id" :label="user.name" :value="user.id"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="通过条件">
            <el-radio-group v-model="nodeConfig.or_sign_condition">
              <el-radio value="any_pass">任意一人通过即可</el-radio>
              <el-radio value="first_pass">第一个人通过即结束</el-radio>
            </el-radio-group>
          </el-form-item>
        </template>

        <template v-if="nodeConfig.node_type === 'auto_action'">
          <el-divider content-position="left">自动处理配置</el-divider>
          <el-form-item label="处理类型">
            <el-select v-model="nodeConfig.auto_action_type" placeholder="请选择" style="width: 100%;">
              <el-option label="生成单据" value="create_bill"></el-option>
              <el-option label="更新字段" value="update_field"></el-option>
              <el-option label="发送消息" value="send_message"></el-option>
              <el-option label="调用接口" value="call_api"></el-option>
              <el-option label="数据转换" value="data_transform"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="目标模块">
            <el-select v-model="nodeConfig.auto_target_module" placeholder="请选择" style="width: 100%;">
              <el-option label="CRM" value="CRM"></el-option>
              <el-option label="SRM" value="SRM"></el-option>
              <el-option label="WMS" value="WMS"></el-option>
              <el-option label="MES" value="MES"></el-option>
              <el-option label="QC" value="QC"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="处理参数">
            <el-input v-model="nodeConfig.auto_action_params" type="textarea" :rows="3" placeholder='JSON格式参数'></el-input>
          </el-form-item>
        </template>

        <template v-if="nodeConfig.node_type === 'branch_condition'">
          <el-divider content-position="left">分支条件配置</el-divider>
          <el-form-item label="条件类型">
            <el-select v-model="nodeConfig.branch_type" placeholder="请选择" style="width: 100%;">
              <el-option label="金额条件" value="amount"></el-option>
              <el-option label="物料类型" value="material_type"></el-option>
              <el-option label="订单类型" value="order_type"></el-option>
              <el-option label="部门条件" value="dept"></el-option>
              <el-option label="自定义" value="custom"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="条件表达式">
            <el-input v-model="nodeConfig.branch_condition_expr" type="textarea" :rows="2" placeholder="如: bizData.amount > 10000"></el-input>
          </el-form-item>
          <el-form-item label="分支标签">
            <el-input v-model="nodeConfig.branch_label" placeholder="如: 金额大于1万"></el-input>
          </el-form-item>
        </template>

        <template v-if="nodeConfig.node_type === 'reject_branch'">
          <el-divider content-position="left">驳回分支配置</el-divider>
          <el-form-item label="驳回模式">
            <el-radio-group v-model="nodeConfig.reject_mode">
              <el-radio value="to_start">驳回到开始</el-radio>
              <el-radio value="to_node">驳回到指定节点</el-radio>
              <el-radio value="to_prev">驳回到上一节点</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="目标节点" v-if="nodeConfig.reject_mode === 'to_node'">
            <el-select v-model="nodeConfig.reject_target_node" placeholder="请选择节点" style="width: 100%;">
              <el-option v-for="node in flowNodes" :key="node.id" :label="node.node_name || getNodeName(node.node_type)" :value="node.id"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="驳回原因必填">
            <el-switch v-model="nodeConfig.reject_require_reason"></el-switch>
          </el-form-item>
        </template>

        <template v-if="nodeConfig.node_type === 'timeout'">
          <el-divider content-position="left">超时配置</el-divider>
          <el-form-item label="超时时间">
            <el-input-number v-model="nodeConfig.timeout_hours" :min="1" :max="720"></el-input-number>
            <span>小时</span>
          </el-form-item>
          <el-form-item label="超时动作">
            <el-select v-model="nodeConfig.timeout_action" placeholder="请选择" style="width: 100%;">
              <el-option label="自动通过" value="auto_pass"></el-option>
              <el-option label="自动驳回" value="auto_reject"></el-option>
              <el-option label="自动转交" value="auto_transfer"></el-option>
              <el-option label="发送催办" value="send_remind"></el-option>
              <el-option label="继续等待" value="continue"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="转交给" v-if="nodeConfig.timeout_action === 'auto_transfer'">
            <el-select v-model="nodeConfig.timeout_transfer_user" placeholder="请选择" style="width: 100%;">
              <el-option v-for="user in users" :key="user.id" :label="user.name" :value="user.id"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="重复催办间隔">
            <el-input-number v-model="nodeConfig.timeout_remind_interval" :min="1" :max="24"></el-input-number>
            <span>小时（0表示不重复）</span>
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="nodeConfigDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveNodeConfig">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog title="版本历史" v-model="versionDialogVisible" width="700px" destroy-on-close>
      <el-table :data="flowVersions" border stripe size="small">
        <el-table-column prop="version_number" label="版本号" width="100"></el-table-column>
        <el-table-column prop="node_count" label="节点数" width="80"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.is_current" type="success" size="small">当前版本</el-tag>
            <el-tag v-else type="info" size="small">v{{ row.version_number }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="change_desc" label="变更说明" min-width="200"></el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160"></el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button v-if="!row.is_current" type="primary" size="small" link @click="rollbackVersion(row)">回滚</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog title="模块绑定" v-model="bindingDialogVisible" width="600px" destroy-on-close>
      <el-form label-width="100px" size="small">
        <el-form-item label="当前流程"><el-input v-model="currentBindingFlow.flow_name" disabled></el-input></el-form-item>
        <el-form-item label="绑定模块">
          <el-checkbox-group v-model="selectedBindings">
            <el-checkbox v-for="mod in availableModules" :key="mod.code" :value="mod.code">{{ mod.name }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <el-table :data="currentBindingFlow.bindings || []" border stripe size="small" style="margin-top: 20px;">
        <el-table-column prop="module_code" label="模块编码" width="150"></el-table-column>
        <el-table-column prop="module_name" label="模块名称" min-width="150"></el-table-column>
        <el-table-column prop="is_default" label="默认流程" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.is_default" type="success" size="small">是</el-tag>
            <el-tag v-else type="info" size="small">否</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="100"></el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="danger" size="small" link @click="removeBinding(row)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="bindingDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="saveBindings">保存绑定</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog title="审批处理" v-model="approvalDialogVisible" width="600px" destroy-on-close>
      <el-form :model="approvalForm" label-width="100px" size="small">
        <el-form-item label="待办标题"><el-input v-model="approvalForm.title" disabled></el-input></el-form-item>
        <el-form-item label="待办内容"><el-input v-model="approvalForm.content" type="textarea" :rows="3" disabled></el-input></el-form-item>
        <el-form-item label="流程名称"><el-input v-model="approvalForm.flow_name" disabled></el-input></el-form-item>
        <el-form-item label="业务数据"><el-input v-model="approvalForm.biz_data" type="textarea" :rows="3" disabled></el-input></el-form-item>
        <el-form-item label="审批意见"><el-input v-model="approvalForm.comment" type="textarea" :rows="3" placeholder="请输入审批意见"></el-input></el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="approvalDialogVisible = false">取消</el-button>
          <el-button type="success" @click="submitApproval('approve')">通过</el-button>
          <el-button type="danger" @click="submitApproval('reject')">驳回</el-button>
          <el-dropdown @command="handleMoreAction">
            <el-button type="warning">更多<i class="el-icon-arrow-down el-icon--right"></i></el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="transfer">转交</el-dropdown-item>
                <el-dropdown-item command="consult">征询意见</el-dropdown-item>
                <el-dropdown-item command="add-sign">加签</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </span>
      </template>
    </el-dialog>

    <el-dialog title="节点模板" v-model="nodeTemplateDialogVisible" width="800px" destroy-on-close>
      <el-form :inline="true" size="small" style="margin-bottom: 15px;">
        <el-form-item label="模板名称"><el-input v-model="templateFilter.name" placeholder="搜索模板"></el-input></el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadNodeTemplates">查询</el-button>
          <el-button type="success" @click="openCreateTemplateDialog">创建模板</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="nodeTemplates" border stripe size="small">
        <el-table-column prop="template_code" label="模板编码" width="150"></el-table-column>
        <el-table-column prop="template_name" label="模板名称" min-width="150"></el-table-column>
        <el-table-column prop="node_type" label="节点类型" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ getNodeName(row.node_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160"></el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="useTemplate(row)">使用</el-button>
            <el-button type="danger" size="small" link @click="deleteTemplate(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>
    
<script>
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'FlowManagement',
  data() {
    return {
      activeTab: 'list',
      flows: [],
      flowLoading: false,
      filterModule: '',
      filterStatus: '',
      filterName: '',
      instances: [],
      instanceLoading: false,
      instanceFilter: {
        status: '',
        module_code: '',
        biz_id: ''
      },
      todos: [],
      todoLoading: false,
      logs: [],
      logLoading: false,
      logFilter: {
        instance_id: '',
        level: ''
      },
      flowDialogVisible: false,
      isEditFlow: false,
      editingFlowId: null,
      flowForm: {
        flow_name: '',
        flow_desc: '',
        module_code: '',
        is_default: false
      },
      flowRules: {
        flow_name: [{ required: true, message: '请输入流程名称', trigger: 'blur' }],
        module_code: [{ required: true, message: '请选择归属模块', trigger: 'change' }]
      },
      flowNodes: [],
      connections: [],
      selectedNode: null,
      selectedConnection: null,
      isConnecting: false,
      connectionStart: null,
      connectionStartPoint: null,
      tempConnection: null,
      mouseX: 0,
      mouseY: 0,
      isDraggingNode: false,
      dragNodeId: null,
      dragOffsetX: 0,
      dragOffsetY: 0,
      canvasWidth: 2000,
      canvasHeight: 1000,
      nodeConfigDialogVisible: false,
      nodeConfig: {
        node_type: '',
        node_name: '',
        approver_type: 'user',
        assignee_ids: [],
        assignee_names: [],
        role_codes: [],
        group_id: null,
        condition_expr: '',
        condition_fields: [],
        action_type: 'webhook',
        action_name: '',
        webhook_url: '',
        notify_type: 'system',
        notify_channels: ['system'],
        approver_rule: 'any',
        timeout_action: 'none',
        timeout_hours: 24,
        manager_level: '1',
        no_manager_action: 'pass',
        biz_role: '',
        role_approval_mode: 'any',
        cc_type: 'start_user',
        cc_user_ids: [],
        cc_role_codes: [],
        cc_require_confirm: false,
        countersign_users: [],
        countersign_rule: 'all_pass',
        countersign_percentage: 100,
        or_sign_users: [],
        or_sign_condition: 'any_pass',
        auto_action_type: 'create_bill',
        auto_target_module: '',
        auto_action_params: '',
        branch_type: 'amount',
        branch_condition_expr: '',
        branch_label: '',
        reject_mode: 'to_start',
        reject_target_node: null,
        reject_require_reason: true,
        timeout_transfer_user: null,
        timeout_remind_interval: 0
      },
      versionDialogVisible: false,
      versions: [],
      selectedVersion: null,
      bindingDialogVisible: false,
      bindingModules: ['CRM', 'SRM', 'WMS', 'MES', 'PROJECT', 'FINANCE', 'HR', 'QC'],
      flowBindings: [],
      flowVersions: [],
      currentBindingFlow: {},
      approvalDialogVisible: false,
      approvalForm: {
        title: '',
        content: '',
        flow_name: '',
        biz_data: '',
        comment: ''
      },
      nodeTemplateDialogVisible: false,
      nodeTemplates: [],
      templateFilter: { name: '' },
      users: [],
      roles: [],
      approvalGroups: [],
      moduleList: [
        { code: 'CRM', name: '客户管理' },
        { code: 'SRM', name: '供应商管理' },
        { code: 'WMS', name: '仓库管理' },
        { code: 'MES', name: '生产管理' },
        { code: 'PROJECT', name: '项目管理' },
        { code: 'FINANCE', name: '财务管理' },
        { code: 'HR', name: '人事管理' },
        { code: 'QC', name: '质量管理' }
      ]
    }
  },
  computed: {
    filteredFlows() {
      let result = this.flows
      if (this.filterModule) {
        result = result.filter(f => f.module_code === this.filterModule)
      }
      if (this.filterStatus) {
        result = result.filter(f => f.status === this.filterStatus)
      }
      if (this.filterName) {
        result = result.filter(f => f.flow_name.toLowerCase().includes(this.filterName.toLowerCase()))
      }
      return result
    }
  },
  mounted() {
    this.loadFlows()
    this.loadUsers()
    this.loadRoles()
    this.loadApprovalGroups()
  },
  methods: {
    handleTabChange(tab) {
      if (tab === 'instances') this.loadInstances()
      if (tab === 'todos') this.loadTodos()
      if (tab === 'logs') this.loadLogs()
    },
    async loadFlows() {
      this.flowLoading = true
      try {
        const response = await fetch('/api/workflow/flows')
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        const text = await response.text()
        if (!text.startsWith('{') && !text.startsWith('[')) {
          throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`)
        }
        const data = JSON.parse(text)
        if (data.success) {
          this.flows = data.data || []
        } else {
          ElMessage.error(data.message || '加载流程列表失败')
        }
      } catch (error) {
        console.error('Load flows error:', error)
        ElMessage.error('加载流程列表失败: ' + error.message)
      } finally {
        this.flowLoading = false
      }
    },
    async loadInstances() {
      this.instanceLoading = true
      try {
        const params = new URLSearchParams()
        if (this.instanceFilter.status) params.append('status', this.instanceFilter.status)
        if (this.instanceFilter.module_code) params.append('module_code', this.instanceFilter.module_code)
        if (this.instanceFilter.biz_id) params.append('biz_id', this.instanceFilter.biz_id)
        const response = await fetch(`/api/workflow/instances?${params}`)
        const data = await response.json()
        if (data.success) {
          this.instances = data.data || []
        }
      } catch (error) {
        console.error('Load instances error:', error)
        ElMessage.error('加载流程实例失败')
      } finally {
        this.instanceLoading = false
      }
    },
    async loadTodos() {
      this.todoLoading = true
      try {
        const response = await fetch('/api/workflow/todos')
        const data = await response.json()
        if (data.success) {
          this.todos = data.data || []
        }
      } catch (error) {
        console.error('Load todos error:', error)
        ElMessage.error('加载待办列表失败')
      } finally {
        this.todoLoading = false
      }
    },
    async loadLogs() {
      this.logLoading = true
      try {
        const params = new URLSearchParams()
        if (this.logFilter.instance_id) params.append('instance_id', this.logFilter.instance_id)
        if (this.logFilter.level) params.append('level', this.logFilter.level)
        const response = await fetch(`/api/workflow/logs?${params}`)
        const data = await response.json()
        if (data.success) {
          this.logs = data.data || []
        }
      } catch (error) {
        console.error('Load logs error:', error)
        ElMessage.error('加载运行日志失败')
      } finally {
        this.logLoading = false
      }
    },
    async loadUsers() {
      try {
        const response = await fetch('/api/auth/users', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        })
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        const text = await response.text()
        if (!text.startsWith('{') && !text.startsWith('[')) {
          throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`)
        }
        const data = JSON.parse(text)
        if (data.success) {
          this.users = data.data || []
        }
      } catch (error) {
        console.error('Load users error:', error)
        ElMessage.error('加载用户列表失败: ' + error.message)
      }
    },
    async loadRoles() {
      try {
        const response = await fetch('/api/admin/roles')
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        const text = await response.text()
        if (!text.startsWith('{') && !text.startsWith('[')) {
          throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`)
        }
        const data = JSON.parse(text)
        if (data.success) {
          this.roles = data.data || []
        }
      } catch (error) {
        console.error('Load roles error:', error)
        ElMessage.error('加载角色列表失败: ' + error.message)
      }
    },
    async loadApprovalGroups() {
      try {
        const response = await fetch('/api/workflow/approval-groups')
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        const text = await response.text()
        if (!text.startsWith('{') && !text.startsWith('[')) {
          throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`)
        }
        const data = JSON.parse(text)
        if (data.success) {
          this.approvalGroups = data.data || []
        }
      } catch (error) {
        console.error('Load approval groups error:', error)
        ElMessage.error('加载审批组列表失败: ' + error.message)
      }
    },
    addFlow() {
      this.isEditFlow = false
      this.flowForm = {
        flow_name: '',
        flow_desc: '',
        module_code: '',
        is_default: false
      }
      this.flowNodes = []
      this.connections = []
      this.selectedNode = null
      this.selectedConnection = null
      this.flowDialogVisible = true
    },
    async editFlow(row) {
      this.isEditFlow = true
      this.editingFlowId = row.flow_id
      try {
        const response = await fetch(`/api/workflow/flows/${row.flow_id}`)
        const data = await response.json()
        if (data.success) {
          const flow = data.data
          this.flowForm = {
            flow_name: flow.flow_name,
            flow_desc: flow.flow_desc,
            module_code: flow.module_code,
            is_default: flow.is_default
          }
          if (flow.current_config && flow.current_config.nodes) {
            this.flowNodes = flow.current_config.nodes.map((n, index) => ({
              ...n,
              id: n.node_id || Date.now() + index,
              x: n.position_x || 100 + (index % 3) * 200,
              y: n.position_y || 100 + Math.floor(index / 3) * 120,
              node_code: n.node_code || `node_${Date.now()}_${index}`,
              node_name: n.node_name || n.label,
              label: n.label || n.node_name
            }))
            this.connections = flow.current_config.connections || []
          } else {
            this.flowNodes = []
            this.connections = []
          }
        }
      } catch (error) {
        console.error('Load flow detail error:', error)
        ElMessage.error('加载流程详情失败')
      }
      this.selectedNode = null
      this.selectedConnection = null
      this.flowDialogVisible = true
    },
    async toggleFlowStatus(row) {
      try {
        const newStatus = row.status === 'active' ? 'disabled' : 'active'
        await fetch(`/api/workflow/flows/${row.flow_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        })
        ElMessage.success(newStatus === 'active' ? '流程已启用' : '流程已停用')
      } catch (error) {
        ElMessage.error('更新流程状态失败')
        this.loadFlows()
      }
    },
    async deleteFlow(row) {
      try {
        await ElMessageBox.confirm('确定要删除这个流程吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        await fetch(`/api/workflow/flows/${row.flow_id}`, { method: 'DELETE' })
        ElMessage.success('删除成功')
        this.loadFlows()
      } catch (error) {
        if (error !== 'cancel') ElMessage.error('删除失败')
      }
    },
    async enableFlow(row) {
      try {
        await ElMessageBox.confirm('确定要启用这个流程吗？启用后流程将可以发起新实例。', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        const response = await fetch(`/api/workflow/flows/${row.flow_id}/enable`, { method: 'POST' })
        const data = await response.json()
        if (data.success) {
          ElMessage.success('流程启用成功')
          this.loadFlows()
        } else {
          ElMessage.error(data.message || '启用失败')
        }
      } catch (error) {
        if (error !== 'cancel') ElMessage.error('启用失败')
      }
    },
    async disableFlow(row) {
      try {
        await ElMessageBox.confirm('确定要停用这个流程吗？停用后流程将不能发起新实例。', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        const response = await fetch(`/api/workflow/flows/${row.flow_id}/disable`, { method: 'POST' })
        const data = await response.json()
        if (data.success) {
          ElMessage.success('流程停用成功')
          this.loadFlows()
        } else {
          ElMessage.error(data.message || '停用失败')
        }
      } catch (error) {
        if (error !== 'cancel') ElMessage.error('停用失败')
      }
    },
    async freezeFlow(row) {
      try {
        const { value: reason } = await ElMessageBox.prompt('请输入冻结原因（可选）：', '冻结流程', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        const response = await fetch(`/api/workflow/flows/${row.flow_id}/freeze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: reason || '' })
        })
        const data = await response.json()
        if (data.success) {
          ElMessage.success('流程冻结成功')
          this.loadFlows()
        } else {
          ElMessage.error(data.message || '冻结失败')
        }
      } catch (error) {
        if (error !== 'cancel') ElMessage.error('冻结失败')
      }
    },
    async reactivateFlow(row) {
      try {
        await ElMessageBox.confirm('确定要重新激活这个流程吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        const response = await fetch(`/api/workflow/flows/${row.flow_id}/reactivate`, { method: 'POST' })
        const data = await response.json()
        if (data.success) {
          ElMessage.success('流程激活成功')
          this.loadFlows()
        } else {
          ElMessage.error(data.message || '激活失败')
        }
      } catch (error) {
        if (error !== 'cancel') ElMessage.error('激活失败')
      }
    },
    async copyFlow(row) {
      try {
        await ElMessageBox.confirm('确定要复制这个流程吗？将创建一个新的流程副本。', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        const response = await fetch(`/api/workflow/flows/${row.flow_id}/copy`, { method: 'POST' })
        const data = await response.json()
        if (data.success) {
          ElMessage.success('流程复制成功')
          this.loadFlows()
        } else {
          ElMessage.error(data.message || '复制失败')
        }
      } catch (error) {
        if (error !== 'cancel') ElMessage.error('复制失败')
      }
    },
    async saveFlow() {
      this.$refs.flowFormRef.validate(async (valid) => {
        if (!valid) return
        try {
          const flowConfig = {
            nodes: this.flowNodes.map((n, index) => ({
              node_id: n.node_id || `node_${Date.now()}_${index}`,
              node_code: n.node_code || `node_${Date.now()}_${index}`,
              node_name: n.node_name || n.label,
              node_type: n.node_type,
              position_x: n.x,
              position_y: n.y,
              is_start: n.node_type === 'start',
              is_end: n.node_type === 'end',
              config: n.config || {},
              rules: n.rules || []
            })),
            connections: this.connections.map(c => ({
              from: c.from,
              to: c.to,
              fromPoint: c.fromPoint || 'right',
              toPoint: c.toPoint || 'left'
            }))
          }
          const payload = {
            ...this.flowForm,
            flow_config: flowConfig
          }
          let url, method
          if (this.isEditFlow && this.editingFlowId) {
            url = `/api/workflow/flows/${this.editingFlowId}`
            method = 'PUT'
          } else {
            url = '/api/workflow/flows'
            method = 'POST'
          }
          const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
          const result = await response.json()
          if (result.success) {
            ElMessage.success(this.isEditFlow ? '更新成功' : '创建成功')
            this.flowDialogVisible = false
            this.loadFlows()
          } else {
            ElMessage.error(result.message || '保存失败')
          }
        } catch (error) {
          console.error('Save flow error:', error)
          ElMessage.error('保存失败: ' + error.message)
        }
      })
    },
    async saveFlowDraft() {
      try {
        const flowConfig = {
          nodes: this.flowNodes,
          connections: this.connections
        }
        const payload = { ...this.flowForm, flow_config: flowConfig, status: 'draft' }
        if (this.isEditFlow) {
          const flow = this.flows.find(f => f.flow_name === this.flowForm.flow_name)
          if (flow) {
            await fetch(`/api/workflow/flows/${flow.flow_id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            })
          }
        } else {
          await fetch('/api/workflow/flows', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
        }
        ElMessage.success('草稿保存成功')
        this.flowDialogVisible = false
        this.loadFlows()
      } catch (error) {
        ElMessage.error('保存草稿失败')
      }
    },
    viewFlowDetail(row) {
      this.editFlow(row)
    },
    async openVersionDialog(row) {
      try {
        const response = await fetch(`/api/workflow/flows/${row.flow_id}/versions`)
        const data = await response.json()
        if (data.success) {
          this.versions = data.data || []
        }
        this.selectedVersion = null
        this.versionDialogVisible = true
      } catch (error) {
        ElMessage.error('加载版本历史失败')
      }
    },
    async rollbackVersion(row) {
      try {
        await ElMessageBox.confirm('确定要回滚到这个版本吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        await fetch(`/api/workflow/flows/${row.flow_id}/rollback/${this.selectedVersion}`, {
          method: 'POST'
        })
        ElMessage.success('回滚成功')
        this.versionDialogVisible = false
        this.loadFlows()
      } catch (error) {
        if (error !== 'cancel') ElMessage.error('回滚失败')
      }
    },
    async openBindingDialog(row) {
      try {
        const response = await fetch(`/api/workflow/bindings/${row.module_code}`)
        const data = await response.json()
        if (data.success) {
          this.flowBindings = data.data || []
        }
        this.bindingDialogVisible = true
      } catch (error) {
        this.flowBindings = []
        this.bindingDialogVisible = true
      }
    },
    async openApprovalDialog(row) {
      this.approvalForm = {
        title: row.title,
        content: row.content,
        flow_name: row.flow_name,
        biz_data: JSON.stringify(row.biz_data, null, 2),
        comment: ''
      }
      this.currentApprovalRecord = row
      this.approvalDialogVisible = true
    },
    async submitApproval(action) {
      try {
        const recordId = this.currentApprovalRecord?.record_id
        if (!recordId) {
          ElMessage.error('审批记录不存在')
          return
        }
        const endpoint = action === 'approve' ? 'approve' : 'reject'
        await fetch(`/api/workflow/approvals/${recordId}/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ comment: this.approvalForm.comment })
        })
        ElMessage.success(action === 'approve' ? '审批通过' : '已驳回')
        this.approvalDialogVisible = false
        this.loadTodos()
        this.loadInstances()
      } catch (error) {
        ElMessage.error('审批操作失败')
      }
    },
    handleMoreAction(command) {
      const recordId = this.currentApprovalRecord?.record_id
      if (command === 'transfer') {
        ElMessage.info('转交功能开发中')
      } else if (command === 'consult') {
        ElMessage.info('征询意见功能开发中')
      } else if (command === 'add-sign') {
        ElMessage.info('加签功能开发中')
      }
    },
    async openNodeTemplateDialog() {
      try {
        const response = await fetch('/api/workflow/node-templates')
        const data = await response.json()
        if (data.success) {
          this.nodeTemplates = data.data || []
        }
      } catch (error) {
        this.nodeTemplates = []
      }
      this.nodeTemplateDialogVisible = true
    },
    useTemplate(row) {
      const templateConfig = JSON.parse(row.template_config || '{}')
      const newNode = {
        id: Date.now(),
        node_id: templateConfig.node_id || Date.now(),
        node_code: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        node_type: row.node_type,
        node_name: templateConfig.node_name || templateConfig.label || row.template_name,
        label: templateConfig.label || row.template_name,
        x: 400,
        y: 300,
        config: templateConfig.config || {},
        rules: templateConfig.rules || []
      }
      this.flowNodes.push(newNode)
      this.nodeTemplateDialogVisible = false
      ElMessage.success('模板已应用')
    },
    async deleteTemplate(row) {
      try {
        await ElMessageBox.confirm('确定要删除这个模板吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        ElMessage.success('删除成功')
        this.loadNodeTemplates()
      } catch (error) {
        if (error !== 'cancel') ElMessage.error('删除失败')
      }
    },
    viewInstanceDetail(row) {
      this.$router.push(`/workflow/instance/${row.instance_id}`)
    },
    async viewInstanceDetailById(instanceId) {
      this.$router.push(`/workflow/instance/${instanceId}`)
    },
    async terminateInstance(row) {
      try {
        await ElMessageBox.confirm('确定要终止这个流程实例吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        await fetch(`/api/workflow/instances/${row.instance_id}/terminate`, { method: 'POST' })
        ElMessage.success('实例已终止')
        this.loadInstances()
      } catch (error) {
        if (error !== 'cancel') ElMessage.error('终止失败')
      }
    },
    getInstanceStatusType(status) {
      const types = {
        running: 'primary',
        completed: 'success',
        rejected: 'danger',
        terminated: 'info'
      }
      return types[status] || 'info'
    },
    getInstanceStatusText(status) {
      const texts = {
        running: '进行中',
        completed: '已完成',
        rejected: '已驳回',
        terminated: '已终止'
      }
      return texts[status] || status
    },
    getPriorityType(priority) {
      const types = { high: 'danger', normal: 'warning', low: 'info' }
      return types[priority] || 'info'
    },
    getPriorityText(priority) {
      const texts = { high: '高', normal: '中', low: '低' }
      return texts[priority] || priority
    },
    getLogType(level) {
      const types = { info: 'primary', warn: 'warning', error: 'danger' }
      return types[level] || 'info'
    },
    onDragStart(event, nodeType) {
      event.dataTransfer.setData('nodeType', nodeType)
      event.dataTransfer.effectAllowed = 'copy'
    },
    onDragOver(event) {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'copy'
    },
    onDrop(event) {
      event.preventDefault()
      const canvas = this.$refs.canvasRef
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      const nodeType = event.dataTransfer.getData('nodeType')
      if (nodeType) {
        const nodeCode = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const nodeNames = {
          start: '开始',
          approval_single: '单人审批',
          approval_multi: '多人审批',
          condition: '条件分支',
          action: '操作节点',
          notify: '通知节点',
          end: '结束'
        }
        const newNode = {
          id: Date.now(),
          node_id: Date.now(),
          node_code: nodeCode,
          node_type: nodeType,
          node_name: nodeNames[nodeType] || nodeType,
          label: nodeNames[nodeType] || nodeType,
          x: x - 60,
          y: y - 30,
          is_start: nodeType === 'start',
          is_end: nodeType === 'end',
          config: {},
          rules: []
        }
        this.flowNodes.push(newNode)
      }
    },
    onCanvasClick() {
      this.selectedNode = null
      this.selectedConnection = null
    },
    openNodeConfigDialog(node) {
      this.selectedNode = node.id
      this.nodeConfig = {
        node_type: node.node_type,
        node_name: node.node_name || node.label,
        approver_type: node.config?.approver_type || 'user',
        assignee_ids: node.config?.assignee_ids || [],
        assignee_names: node.config?.assignee_names || [],
        role_codes: node.config?.role_codes || [],
        group_id: node.config?.group_id || null,
        condition_expr: node.config?.condition_expr || '',
        condition_fields: node.config?.condition_fields || [],
        action_type: node.config?.action_type || 'webhook',
        action_name: node.config?.action_name || '',
        webhook_url: node.config?.webhook_url || '',
        notify_type: node.config?.notify_type || 'system',
        notify_channels: node.config?.notify_channels || ['system'],
        approver_rule: node.rules?.find(r => r.rule_type === 'approval_type')?.rule_value || 'any',
        timeout_action: node.rules?.find(r => r.rule_type === 'timeout')?.rule_value || 'none',
        timeout_hours: node.rules?.find(r => r.rule_type === 'timeout_hours')?.rule_value || 24
      }
      this.nodeConfigDialogVisible = true
    },
    saveNodeConfig() {
      const node = this.flowNodes.find(n => n.id === this.selectedNode)
      if (node) {
        node.node_name = this.nodeConfig.node_name
        node.label = this.nodeConfig.node_name
        node.config = {
          approver_type: this.nodeConfig.approver_type,
          assignee_ids: this.nodeConfig.assignee_ids,
          assignee_names: this.nodeConfig.assignee_names,
          role_codes: this.nodeConfig.role_codes,
          group_id: this.nodeConfig.group_id,
          condition_expr: this.nodeConfig.condition_expr,
          condition_fields: this.nodeConfig.condition_fields,
          action_type: this.nodeConfig.action_type,
          action_name: this.nodeConfig.action_name,
          webhook_url: this.nodeConfig.webhook_url,
          notify_type: this.nodeConfig.notify_type,
          notify_channels: this.nodeConfig.notify_channels
        }
        node.rules = [
          { rule_type: 'approval_type', rule_value: this.nodeConfig.approver_rule },
          { rule_type: 'timeout', rule_value: this.nodeConfig.timeout_action },
          { rule_type: 'timeout_hours', rule_value: this.nodeConfig.timeout_hours }
        ]
        ElMessage.success('节点配置已保存')
      }
      this.nodeConfigDialogVisible = false
    },
    deleteNode(nodeId) {
      this.flowNodes = this.flowNodes.filter(n => n.id !== nodeId)
      this.connections = this.connections.filter(c => c.from !== nodeId && c.to !== nodeId)
    },
    getNodeName(type) {
      const names = {
        start: '开始',
        end: '结束',
        approval_single: '单人审批',
        approval_multi: '多人审批',
        condition: '条件分支',
        action: '操作节点',
        notify: '通知节点',
        initiator: '发起人',
        dept_manager: '部门主管',
        role_approval: '角色审批',
        cc: '抄送',
        countersign: '会签',
        or_sign: '或签',
        auto_action: '自动处理',
        branch_condition: '分支条件',
        reject_branch: '驳回分支',
        timeout: '超时节点'
      }
      return names[type] || type
    },
    getNodeIcon(type) {
      const icons = {
        start: 'fa fa-play',
        end: 'fa fa-stop',
        approval_single: 'fa fa-user',
        approval_multi: 'fa fa-users',
        condition: 'fa fa-code-fork',
        action: 'fa fa-cog',
        notify: 'fa fa-bell',
        initiator: 'fa fa-user-plus',
        dept_manager: 'fa fa-building',
        role_approval: 'fa fa-id-badge',
        cc: 'fa fa-eye',
        countersign: 'fa fa-check-circle',
        or_sign: 'fa fa-check-square',
        auto_action: 'fa fa-robot',
        branch_condition: 'fa fa-share-alt',
        reject_branch: 'fa fa-reply',
        timeout: 'fa fa-clock'
      }
      return icons[type] || 'fa fa-circle'
    },
    getNotifyTypeText(type) {
      const texts = { system: '系统通知', sms: '短信', email: '邮件', wechat: '微信' }
      return texts[type] || type
    },
    startConnection(event, node, point) {
      event.stopPropagation()
      this.isConnecting = true
      this.connectionStart = node.id
      this.connectionStartPoint = point
      this.tempConnection = {
        fromX: this.getConnectionPointX(node, point),
        fromY: this.getConnectionPointY(node, point)
      }
    },
    onCanvasMouseMove(event) {
      const canvas = this.$refs.canvasRef
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      this.mouseX = event.clientX - rect.left
      this.mouseY = event.clientY - rect.top
      if (this.isDraggingNode && this.dragNodeId) {
        const node = this.flowNodes.find(n => n.id === this.dragNodeId)
        if (node) {
          node.x = this.mouseX - this.dragOffsetX
          node.y = this.mouseY - this.dragOffsetY
        }
      }
    },
    onCanvasMouseUp(event) {
      if (this.isConnecting) {
        const targetNode = this.getNodeAtPosition(this.mouseX, this.mouseY)
        if (targetNode && targetNode.id !== this.connectionStart) {
          const toPoint = this.getNearestConnectionPoint(targetNode, this.mouseX, this.mouseY)
          this.connections.push({
            from: this.connectionStart,
            to: targetNode.id,
            fromPoint: this.connectionStartPoint,
            toPoint: toPoint
          })
          ElMessage.success('连接创建成功')
        }
        this.isConnecting = false
        this.connectionStart = null
        this.connectionStartPoint = null
        this.tempConnection = null
      }
      if (this.isDraggingNode) {
        this.isDraggingNode = false
        this.dragNodeId = null
      }
    },
    onNodeMouseDown(event, node) {
      if (this.isConnecting) return
      this.selectedNode = node.id
      this.isDraggingNode = true
      this.dragNodeId = node.id
      const canvas = this.$refs.canvasRef
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      this.dragOffsetX = event.clientX - rect.left - node.x
      this.dragOffsetY = event.clientY - rect.top - node.y
    },
    getNodeAtPosition(x, y) {
      return this.flowNodes.find(node => {
        return x >= node.x && x <= node.x + 120 && y >= node.y && y <= node.y + 60
      })
    },
    getNearestConnectionPoint(node, x, y) {
      const points = ['top', 'right', 'bottom', 'left']
      const pointPositions = {
        top: { x: node.x + 60, y: node.y },
        right: { x: node.x + 120, y: node.y + 30 },
        bottom: { x: node.x + 60, y: node.y + 60 },
        left: { x: node.x, y: node.y + 30 }
      }
      let nearest = 'top'
      let minDistance = Infinity
      points.forEach(point => {
        const pos = pointPositions[point]
        const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2))
        if (distance < minDistance) {
          minDistance = distance
          nearest = point
        }
      })
      return nearest
    },
    getConnectionPointX(node, point) {
      const offsets = { top: 60, right: 120, bottom: 60, left: 0 }
      return node.x + offsets[point]
    },
    getConnectionPointY(node, point) {
      const offsets = { top: 0, right: 30, bottom: 60, left: 30 }
      return node.y + offsets[point]
    },
    getConnectionPath(connection) {
      const fromNode = this.flowNodes.find(n => n.id === connection.from)
      const toNode = this.flowNodes.find(n => n.id === connection.to)
      if (!fromNode || !toNode) return ''
      const fromX = this.getConnectionPointX(fromNode, connection.fromPoint)
      const fromY = this.getConnectionPointY(fromNode, connection.fromPoint)
      const toX = this.getConnectionPointX(toNode, connection.toPoint)
      const toY = this.getConnectionPointY(toNode, connection.toPoint)
      return this.calculatePath(fromX, fromY, toX, toY, connection.fromPoint, connection.toPoint)
    },
    getTempConnectionPath() {
      if (!this.tempConnection) return ''
      return this.calculatePath(this.tempConnection.fromX, this.tempConnection.fromY, this.mouseX, this.mouseY, this.connectionStartPoint, 'right')
    },
    calculatePath(fromX, fromY, toX, toY, fromPoint, toPoint) {
      let controlPoint1X, controlPoint1Y, controlPoint2X, controlPoint2Y
      if (fromPoint === 'right' || fromPoint === 'left') {
        controlPoint1X = fromX + (toX - fromX) * 0.5
        controlPoint1Y = fromY
        controlPoint2X = toX - (toX - fromX) * 0.5
        controlPoint2Y = toY
      } else {
        controlPoint1X = fromX
        controlPoint1Y = fromY + (toY - fromY) * 0.5
        controlPoint2X = toX
        controlPoint2Y = toY - (toY - fromY) * 0.5
      }
      return `M ${fromX} ${fromY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${toX} ${toY}`
    },
    getConnectionMidpoint(connection) {
      const fromNode = this.flowNodes.find(n => n.id === connection.from)
      const toNode = this.flowNodes.find(n => n.id === connection.to)
      if (!fromNode || !toNode) return { x: 0, y: 0 }
      const fromX = this.getConnectionPointX(fromNode, connection.fromPoint)
      const fromY = this.getConnectionPointY(fromNode, connection.fromPoint)
      const toX = this.getConnectionPointX(toNode, connection.toPoint)
      const toY = this.getConnectionPointY(toNode, connection.toPoint)
      return { x: (fromX + toX) / 2, y: (fromY + toY) / 2 }
    },
    selectConnection(index) {
      this.selectedConnection = index
    },
    deleteConnection(index) {
      this.connections.splice(index, 1)
      this.selectedConnection = null
      ElMessage.success('连接已删除')
    },
    clearCanvas() {
      ElMessageBox.confirm('确定要清空所有节点和连接吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.flowNodes = []
        this.connections = []
        this.selectedConnection = null
        this.selectedNode = null
        ElMessage.success('画布已清空')
      }).catch(() => {})
    },
    autoLayout() {
      if (this.flowNodes.length === 0) return
      const startNode = this.flowNodes.find(n => n.node_type === 'start')
      if (!startNode) {
        ElMessage.warning('没有找到开始节点')
        return
      }
      startNode.x = 50
      startNode.y = 200
      const visited = new Set()
      const queue = [{ node: startNode, level: 0 }]
      const levelNodes = {}
      while (queue.length > 0) {
        const { node, level } = queue.shift()
        if (visited.has(node.id)) continue
        visited.add(node.id)
        if (!levelNodes[level]) levelNodes[level] = []
        levelNodes[level].push(node)
        const nextConnections = this.connections.filter(c => c.from === node.id)
        nextConnections.forEach(conn => {
          const nextNode = this.flowNodes.find(n => n.id === conn.to)
          if (nextNode && !visited.has(nextNode.id)) {
            queue.push({ node: nextNode, level: level + 1 })
          }
        })
      }
      Object.keys(levelNodes).forEach(level => {
        const nodes = levelNodes[level]
        const x = 50 + level * 180
        const totalHeight = nodes.length * 80
        const startY = 250 - totalHeight / 2
        nodes.forEach((node, index) => {
          node.x = x
          node.y = startY + index * 80
        })
      })
      ElMessage.success('自动布局完成')
    }
  }
}
</script>

<style scoped>
.flow-management {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.flow-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.flow-card {
  transition: all 0.3s ease;
}

.flow-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.flow-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.flow-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.flow-actions {
  display: flex;
  gap: 8px;
}

.flow-info {
  margin-top: 10px;
}

.flow-info p {
  margin: 5px 0;
  font-size: 14px;
}

.flow-design-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.flow-form {
  padding: 15px;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  background: #fafafa;
}

.flow-editor {
  padding: 15px;
  border: 1px solid #eaeaea;
  border-radius: 8px;
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.editor-toolbar h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.toolbar-actions {
  display: flex;
  gap: 10px;
}

.editor-container {
  display: flex;
  gap: 20px;
  height: 500px;
}

.palette {
  width: 180px;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  padding: 15px;
  background: #fafafa;
}

.palette h4 {
  margin-top: 0;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #333;
}

.palette-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.palette-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid #eaeaea;
  border-radius: 6px;
  cursor: move;
  background: #fff;
  transition: all 0.3s ease;
}

.palette-item:hover {
  background: #eef5ff;
  border-color: #165DFF;
  box-shadow: 0 2px 8px rgba(22, 93, 255, 0.15);
}

.node-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
}

.node-icon.start { background: #52c41a; }
.node-icon.approver { background: #165DFF; }
.node-icon.approver-multi { background: #1677FF; }
.node-icon.condition { background: #faad14; }
.node-icon.notification { background: #722ed1; }
.node-icon.end { background: #ff4d4f; }
.node-icon.action { background: #1890ff; }
.node-icon.initiator { background: #13c2c2; }
.node-icon.dept-manager { background: #2f54d2; }
.node-icon.role-approval { background: #722ed1; }
.node-icon.cc { background: #8B5CF6; }
.node-icon.countersign { background: #10B981; }
.node-icon.or-sign { background: #F59E0B; }
.node-icon.auto-action { background: #EC4899; }
.node-icon.branch-condition { background: #F97316; }
.node-icon.reject-branch { background: #EF4444; }
.node-icon.timeout { background: #6366F1; }

.connection-help {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #eaeaea;
}

.connection-help h4 {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #666;
}

.connection-help p {
  font-size: 12px;
  color: #999;
  margin: 5px 0;
  line-height: 1.5;
}

.canvas-wrapper {
  flex: 1;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  overflow: hidden;
}

.canvas {
  width: 100%;
  height: 100%;
  position: relative;
  background: #fff;
  background-image: 
    linear-gradient(#f0f0f0 1px, transparent 1px),
    linear-gradient(90deg, #f0f0f0 1px, transparent 1px);
  background-size: 20px 20px;
}

.connections-layer {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 1;
}

.connections-layer path {
  pointer-events: stroke;
  cursor: pointer;
}

.connections-layer circle,
.connections-layer text {
  pointer-events: all;
  cursor: pointer;
}

.connection-line {
  transition: all 0.3s ease;
}

.connection-line:hover,
.connection-line.selected {
  stroke: #165DFF;
  stroke-width: 3;
}

.delete-connection-circle {
  cursor: pointer;
  transition: all 0.3s ease;
}

.delete-connection-circle:hover {
  r: 12;
  fill: #ff7875;
}

.nodes-layer {
  position: relative;
  z-index: 2;
}

.flow-node {
  position: absolute;
  width: 120px;
  border: 2px solid #eaeaea;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: move;
  transition: all 0.3s ease;
}

.flow-node:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.flow-node.selected {
  border-color: #165DFF;
  box-shadow: 0 0 0 3px rgba(22, 93, 255, 0.2);
}

.flow-node.connecting {
  border-color: #52c41a;
}

.flow-node.start { border-color: #52c41a; }
.flow-node.approver { border-color: #165DFF; }
.flow-node.condition { border-color: #faad14; }
.flow-node.notification { border-color: #722ed1; }
.flow-node.end { border-color: #ff4d4f; }

.connection-point {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #fff;
  border: 2px solid #909399;
  border-radius: 50%;
  cursor: crosshair;
  z-index: 10;
  transition: all 0.3s ease;
}

.connection-point:hover {
  background: #165DFF;
  border-color: #165DFF;
  transform: scale(1.2);
}

.connection-point.top {
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
}

.connection-point.right {
  top: 50%;
  right: -6px;
  transform: translateY(-50%);
}

.connection-point.bottom {
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
}

.connection-point.left {
  top: 50%;
  left: -6px;
  transform: translateY(-50%);
}

.node-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: #f5f7fa;
  border-bottom: 1px solid #eaeaea;
  border-radius: 6px 6px 0 0;
}

.node-header i {
  font-size: 12px;
  color: #666;
}

.node-header span {
  font-size: 12px;
  font-weight: 600;
  flex: 1;
}

.node-delete {
  background: none;
  border: none;
  font-size: 14px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.node-delete:hover {
  color: #ff4d4f;
}

.node-content {
  padding: 8px;
}

.node-content .el-select,
.node-content .el-input {
  width: 100%;
}

.node-label {
  font-size: 11px;
  color: #999;
}
</style>
