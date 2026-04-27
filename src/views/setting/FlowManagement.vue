<template>
  <div class="flow-management">
    <div class="page-header">
      <h2 class="page-title">流程管理</h2>
      <el-button type="primary" @click="addFlow">
        <i class="fa fa-plus"></i> 创建流程
      </el-button>
    </div>
    
    <div class="flow-list">
      <el-card v-for="flow in flows" :key="flow.id" class="flow-card">
        <div class="flow-header">
          <h3>{{ flow.name }}</h3>
          <div class="flow-actions">
            <el-button type="primary" size="small" @click="editFlow(flow.id)">编辑</el-button>
            <el-button type="success" size="small" @click="activateFlow(flow.id)">{{ flow.status === 'active' ? '停用' : '启用' }}</el-button>
            <el-button type="danger" size="small" @click="deleteFlow(flow.id)">删除</el-button>
          </div>
        </div>
        <div class="flow-info">
          <p><strong>描述：</strong>{{ flow.description }}</p>
          <p><strong>状态：</strong><el-tag :type="flow.status === 'active' ? 'success' : 'info'">{{ flow.status === 'active' ? '启用' : '停用' }}</el-tag></p>
          <p><strong>创建时间：</strong>{{ flow.created_at }}</p>
        </div>
      </el-card>
    </div>
    
    <!-- 流程设计对话框 -->
    <el-dialog
      v-model="flowDialogVisible"
      :title="isEditFlow ? '编辑流程' : '创建流程'"
      width="85%"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <div class="flow-design-container">
        <div class="flow-form">
          <el-form :model="flowForm" :rules="flowRules" ref="flowFormRef" inline>
            <el-form-item label="流程名称" prop="name">
              <el-input v-model="flowForm.name" placeholder="请输入流程名称" style="width: 200px;"></el-input>
            </el-form-item>
            <el-form-item label="流程描述" prop="description">
              <el-input v-model="flowForm.description" placeholder="请输入流程描述" type="textarea" :rows="1" style="width: 300px;"></el-input>
            </el-form-item>
            <el-form-item label="流程类型" prop="type">
              <el-select v-model="flowForm.type" placeholder="请选择流程类型" style="width: 150px;">
                <el-option label="销售审批" value="sales"></el-option>
                <el-option label="采购审批" value="purchase"></el-option>
                <el-option label="项目审批" value="project"></el-option>
                <el-option label="财务审批" value="finance"></el-option>
              </el-select>
            </el-form-item>
          </el-form>
        </div>
        
        <div class="flow-editor">
          <div class="editor-toolbar">
            <h3>流程设计器</h3>
            <div class="toolbar-actions">
              <el-button type="primary" size="small" @click="clearCanvas" plain>
                <i class="fa fa-trash"></i> 清空
              </el-button>
              <el-button type="success" size="small" @click="autoLayout" plain>
                <i class="fa fa-magic"></i> 自动布局
              </el-button>
            </div>
          </div>
          
          <div class="editor-container">
            <div class="palette">
              <h4>节点库</h4>
              <div class="palette-items">
                <div class="palette-item" draggable="true" @dragstart="onDragStart($event, 'start')">
                  <div class="node-icon start"><i class="fa fa-play"></i></div>
                  <span>开始</span>
                </div>
                <div class="palette-item" draggable="true" @dragstart="onDragStart($event, 'approver')">
                  <div class="node-icon approver"><i class="fa fa-user"></i></div>
                  <span>审批人</span>
                </div>
                <div class="palette-item" draggable="true" @dragstart="onDragStart($event, 'condition')">
                  <div class="node-icon condition"><i class="fa fa-code-fork"></i></div>
                  <span>条件分支</span>
                </div>
                <div class="palette-item" draggable="true" @dragstart="onDragStart($event, 'notification')">
                  <div class="node-icon notification"><i class="fa fa-bell"></i></div>
                  <span>通知</span>
                </div>
                <div class="palette-item" draggable="true" @dragstart="onDragStart($event, 'end')">
                  <div class="node-icon end"><i class="fa fa-stop"></i></div>
                  <span>结束</span>
                </div>
              </div>
              
              <div class="connection-help">
                <h4>操作说明</h4>
                <p>1. 拖拽节点到画布</p>
                <p>2. 点击节点上的连接点</p>
                <p>3. 拖拽到目标节点</p>
                <p>4. 创建流程走向</p>
              </div>
            </div>
            
            <div class="canvas-wrapper">
              <div 
                class="canvas" 
                ref="canvasRef"
                @drop="onDrop" 
                @dragover="onDragOver"
                @mousemove="onCanvasMouseMove"
                @mouseup="onCanvasMouseUp"
              >
                <!-- SVG 连接线层 -->
                <svg class="connections-layer" :width="canvasWidth" :height="canvasHeight">
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon points="0 0, 10 3.5, 0 7" fill="#909399" />
                    </marker>
                    <marker
                      id="arrowhead-active"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon points="0 0, 10 3.5, 0 7" fill="#165DFF" />
                    </marker>
                  </defs>
                  
                  <!-- 已存在的连接线 -->
                  <g v-for="(connection, index) in connections" :key="'conn-' + index">
                    <path
                      :d="getConnectionPath(connection)"
                      fill="none"
                      stroke="#909399"
                      stroke-width="2"
                      marker-end="url(#arrowhead)"
                      class="connection-line"
                      @click="selectConnection(index)"
                      @dblclick="deleteConnection(index)"
                      :class="{ 'selected': selectedConnection === index }"
                    />
                    <!-- 删除按钮 - 使用 SVG circle -->
                    <circle
                      v-if="selectedConnection === index"
                      :cx="getConnectionMidpoint(connection).x"
                      :cy="getConnectionMidpoint(connection).y"
                      r="15"
                      fill="#ff4d4f"
                      class="delete-connection-circle"
                      @click.stop="deleteConnection(index)"
                    />
                    <text
                      v-if="selectedConnection === index"
                      :x="getConnectionMidpoint(connection).x"
                      :y="getConnectionMidpoint(connection).y + 5"
                      text-anchor="middle"
                      fill="#fff"
                      font-size="16"
                      font-weight="bold"
                      @click.stop="deleteConnection(index)"
                    >×</text>
                  </g>
                  
                  <!-- 正在拖拽的连接线 -->
                  <path
                    v-if="isConnecting && tempConnection"
                    :d="getTempConnectionPath()"
                    fill="none"
                    stroke="#165DFF"
                    stroke-width="2"
                    stroke-dasharray="5,5"
                  />
                </svg>
                
                <!-- 节点层 -->
                <div class="nodes-layer">
                  <div 
                    v-for="node in flowNodes" 
                    :key="node.id" 
                    class="flow-node" 
                    :class="[node.type, { 'selected': selectedNode === node.id, 'connecting': isConnecting && connectionStart === node.id }]"
                    :style="{ left: node.x + 'px', top: node.y + 'px' }"
                    @mousedown="onNodeMouseDown($event, node)"
                  >
                    <!-- 连接点 - 上 -->
                    <div 
                      class="connection-point top" 
                      @mousedown.stop="startConnection($event, node, 'top')"
                    ></div>
                    <!-- 连接点 - 右 -->
                    <div 
                      class="connection-point right" 
                      @mousedown.stop="startConnection($event, node, 'right')"
                    ></div>
                    <!-- 连接点 - 下 -->
                    <div 
                      class="connection-point bottom" 
                      @mousedown.stop="startConnection($event, node, 'bottom')"
                    ></div>
                    <!-- 连接点 - 左 -->
                    <div 
                      class="connection-point left" 
                      @mousedown.stop="startConnection($event, node, 'left')"
                    ></div>
                    
                    <div class="node-header">
                      <i :class="getNodeIcon(node.type)"></i>
                      <span>{{ getNodeName(node.type) }}</span>
                      <button class="node-delete" @click.stop="deleteNode(node.id)">×</button>
                    </div>
                    <div class="node-content">
                      <template v-if="node.type === 'approver'">
                        <el-select v-model="node.assignee" placeholder="选择审批人" size="small">
                          <el-option v-for="user in users" :key="user.id" :label="user.name" :value="user.id"></el-option>
                        </el-select>
                      </template>
                      <template v-if="node.type === 'condition'">
                        <el-input v-model="node.condition" placeholder="条件表达式" size="small"></el-input>
                      </template>
                      <template v-if="node.type === 'notification'">
                        <el-input v-model="node.message" placeholder="通知内容" size="small"></el-input>
                      </template>
                      <template v-if="node.type === 'start'">
                        <span class="node-label">流程开始</span>
                      </template>
                      <template v-if="node.type === 'end'">
                        <span class="node-label">流程结束</span>
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
          <el-button type="primary" @click="saveFlow">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'FlowManagement',
  data() {
    return {
      flows: [
        {
          id: 1,
          name: '销售价格审批流程',
          description: '销售价格审批流程，包含销售经理和财务审批',
          type: 'sales',
          status: 'active',
          created_at: '2026-01-01'
        },
        {
          id: 2,
          name: '采购审批流程',
          description: '采购审批流程，包含采购经理和财务审批',
          type: 'purchase',
          status: 'active',
          created_at: '2026-01-02'
        },
        {
          id: 3,
          name: '项目立项审批流程',
          description: '项目立项审批流程，包含项目经理和总经理审批',
          type: 'project',
          status: 'inactive',
          created_at: '2026-01-03'
        }
      ],
      flowDialogVisible: false,
      isEditFlow: false,
      flowForm: {
        id: '',
        name: '',
        description: '',
        type: ''
      },
      flowRules: {
        name: [
          { required: true, message: '请输入流程名称', trigger: 'blur' }
        ],
        type: [
          { required: true, message: '请选择流程类型', trigger: 'blur' }
        ]
      },
      flowNodes: [],
      connections: [],
      users: [
        { id: 1, name: '管理员' },
        { id: 2, name: '销售1' },
        { id: 3, name: '项目经理1' },
        { id: 4, name: '工程师1' },
        { id: 5, name: '采购1' },
        { id: 6, name: '质量1' }
      ],
      currentNodeType: '',
      canvasWidth: 800,
      canvasHeight: 500,
      
      // 连接线相关
      isConnecting: false,
      connectionStart: null,
      connectionStartPoint: null,
      tempConnection: null,
      mouseX: 0,
      mouseY: 0,
      selectedConnection: null,
      selectedNode: null,
      isDraggingNode: false,
      dragNodeId: null,
      dragOffsetX: 0,
      dragOffsetY: 0
    }
  },
  methods: {
    addFlow() {
      this.isEditFlow = false
      this.flowForm = {
        id: '',
        name: '',
        description: '',
        type: ''
      }
      this.flowNodes = []
      this.connections = []
      this.selectedConnection = null
      this.selectedNode = null
      this.flowDialogVisible = true
    },
    editFlow(id) {
      this.isEditFlow = true
      const flow = this.flows.find(f => f.id === id)
      if (flow) {
        this.flowForm = { ...flow }
        // 模拟加载流程节点和连接
        this.flowNodes = [
          { id: 1, type: 'start', x: 50, y: 200 },
          { id: 2, type: 'approver', x: 200, y: 200, assignee: 2 },
          { id: 3, type: 'condition', x: 380, y: 200, condition: '金额 > 10000' },
          { id: 4, type: 'approver', x: 550, y: 100, assignee: 1 },
          { id: 5, type: 'approver', x: 550, y: 300, assignee: 3 },
          { id: 6, type: 'end', x: 700, y: 200 }
        ]
        this.connections = [
          { from: 1, to: 2, fromPoint: 'right', toPoint: 'left' },
          { from: 2, to: 3, fromPoint: 'right', toPoint: 'left' },
          { from: 3, to: 4, fromPoint: 'top', toPoint: 'left' },
          { from: 3, to: 5, fromPoint: 'bottom', toPoint: 'left' },
          { from: 4, to: 6, fromPoint: 'right', toPoint: 'top' },
          { from: 5, to: 6, fromPoint: 'right', toPoint: 'bottom' }
        ]
        this.selectedConnection = null
        this.selectedNode = null
        this.flowDialogVisible = true
      }
    },
    activateFlow(id) {
      const flow = this.flows.find(f => f.id === id)
      if (flow) {
        flow.status = flow.status === 'active' ? 'inactive' : 'active'
        this.$message.success(flow.status === 'active' ? '流程已启用' : '流程已停用')
      }
    },
    deleteFlow(id) {
      this.$confirm('确定要删除这个流程吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.flows = this.flows.filter(flow => flow.id !== id)
        this.$message.success('删除成功')
      })
    },
    saveFlow() {
      this.$refs.flowFormRef.validate((valid) => {
        if (valid) {
          if (this.isEditFlow) {
            const index = this.flows.findIndex(f => f.id === this.flowForm.id)
            if (index !== -1) {
              this.flows[index] = { ...this.flowForm }
            }
            this.$message.success('更新成功')
          } else {
            const newFlow = {
              id: this.flows.length + 1,
              ...this.flowForm,
              status: 'inactive',
              created_at: new Date().toISOString().split('T')[0]
            }
            this.flows.push(newFlow)
            this.$message.success('创建成功')
          }
          this.flowDialogVisible = false
        }
      })
    },
    onDragStart(event, nodeType) {
      this.currentNodeType = nodeType
      event.dataTransfer.effectAllowed = 'copy'
    },
    onDragOver(event) {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'copy'
    },
    onDrop(event) {
      event.preventDefault()
      const canvas = this.$refs.canvasRef
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      
      if (this.currentNodeType) {
        const newNode = {
          id: Date.now(),
          type: this.currentNodeType,
          x: x - 60,
          y: y - 30
        }
        this.flowNodes.push(newNode)
        this.currentNodeType = ''
      }
    },
    deleteNode(nodeId) {
      this.flowNodes = this.flowNodes.filter(node => node.id !== nodeId)
      // 删除相关的连接线
      this.connections = this.connections.filter(
        conn => conn.from !== nodeId && conn.to !== nodeId
      )
    },
    getNodeName(type) {
      const nodeNames = {
        start: '开始',
        approver: '审批人',
        condition: '条件分支',
        notification: '通知',
        end: '结束'
      }
      return nodeNames[type] || type
    },
    getNodeIcon(type) {
      const icons = {
        start: 'fa fa-play',
        approver: 'fa fa-user',
        condition: 'fa fa-code-fork',
        notification: 'fa fa-bell',
        end: 'fa fa-stop'
      }
      return icons[type] || 'fa fa-circle'
    },
    
    // 连接线相关方法
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
      const rect = canvas.getBoundingClientRect()
      this.mouseX = event.clientX - rect.left
      this.mouseY = event.clientY - rect.top
      
      // 拖拽节点
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
        // 检查是否点击了目标节点
        const targetNode = this.getNodeAtPosition(this.mouseX, this.mouseY)
        if (targetNode && targetNode.id !== this.connectionStart) {
          // 创建连接
          const toPoint = this.getNearestConnectionPoint(targetNode, this.mouseX, this.mouseY)
          this.connections.push({
            from: this.connectionStart,
            to: targetNode.id,
            fromPoint: this.connectionStartPoint,
            toPoint: toPoint
          })
          this.$message.success('连接创建成功')
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
      const rect = canvas.getBoundingClientRect()
      this.dragOffsetX = event.clientX - rect.left - node.x
      this.dragOffsetY = event.clientY - rect.top - node.y
    },
    getNodeAtPosition(x, y) {
      return this.flowNodes.find(node => {
        return x >= node.x && x <= node.x + 120 &&
               y >= node.y && y <= node.y + 60
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
      return this.calculatePath(
        this.tempConnection.fromX,
        this.tempConnection.fromY,
        this.mouseX,
        this.mouseY,
        this.connectionStartPoint,
        'right'
      )
    },
    calculatePath(fromX, fromY, toX, toY, fromPoint, toPoint) {
      // 计算控制点，创建平滑的贝塞尔曲线
      const dx = Math.abs(toX - fromX)
      const dy = Math.abs(toY - fromY)
      
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
      
      return {
        x: (fromX + toX) / 2,
        y: (fromY + toY) / 2
      }
    },
    selectConnection(index) {
      this.selectedConnection = index
    },
    deleteConnection(index) {
      this.connections.splice(index, 1)
      this.selectedConnection = null
      this.$message.success('连接已删除')
    },
    clearCanvas() {
      this.$confirm('确定要清空所有节点和连接吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.flowNodes = []
        this.connections = []
        this.selectedConnection = null
        this.selectedNode = null
        this.$message.success('画布已清空')
      })
    },
    autoLayout() {
      // 简单的自动布局算法
      if (this.flowNodes.length === 0) return
      
      const startNode = this.flowNodes.find(n => n.type === 'start')
      if (!startNode) {
        this.$message.warning('没有找到开始节点')
        return
      }
      
      // 重置开始节点位置
      startNode.x = 50
      startNode.y = 200
      
      // 根据连接关系布局其他节点
      const visited = new Set()
      const queue = [{ node: startNode, level: 0 }]
      const levelNodes = {}
      
      while (queue.length > 0) {
        const { node, level } = queue.shift()
        if (visited.has(node.id)) continue
        visited.add(node.id)
        
        if (!levelNodes[level]) levelNodes[level] = []
        levelNodes[level].push(node)
        
        // 找到下一级节点
        const nextConnections = this.connections.filter(c => c.from === node.id)
        nextConnections.forEach(conn => {
          const nextNode = this.flowNodes.find(n => n.id === conn.to)
          if (nextNode && !visited.has(nextNode.id)) {
            queue.push({ node: nextNode, level: level + 1 })
          }
        })
      }
      
      // 设置节点位置
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
      
      this.$message.success('自动布局完成')
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
.node-icon.condition { background: #faad14; }
.node-icon.notification { background: #722ed1; }
.node-icon.end { background: #ff4d4f; }

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
