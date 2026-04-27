<template>
  <div class="organization-management">
    <el-dialog 
      title="组织架构管理" 
      v-model="dialogVisible" 
      :width="isFullscreen ? '100%' : '1200px'"
      :fullscreen="isFullscreen"
      :close-on-click-modal="false"
      class="org-dialog"
      :class="{ 'is-fullscreen': isFullscreen }"
    >
      <template #header>
        <div class="dialog-header">
          <span>组织架构管理</span>
          <el-button link @click="toggleFullscreen" class="fullscreen-btn">
            <i :class="isFullscreen ? 'fa fa-compress' : 'fa fa-expand'"></i>
            {{ isFullscreen ? '退出全屏' : '全屏' }}
          </el-button>
        </div>
      </template>
      <div class="org-management-tabs">
        <el-tabs v-model="activeTab" type="border-card">
          <!-- 部门与小组管理 -->
          <el-tab-pane label="部门与小组" name="structure">
            <div class="structure-container">
              <!-- 左侧：组织树 -->
              <div class="tree-panel">
                <div class="panel-header">
                  <span>组织架构</span>
                  <el-button type="primary" size="small" @click="handleAddRootDept">
                    <i class="fa fa-plus"></i> 添加部门
                  </el-button>
                </div>
                <el-tree
                  ref="orgTree"
                  :data="organizationTree"
                  :props="treeProps"
                  node-key="id"
                  :default-expanded-keys="expandedKeys"
                  @node-click="handleNodeClick"
                  @node-expand="handleNodeExpand"
                  @node-collapse="handleNodeCollapse"
                  draggable
                  :allow-drop="allowDrop"
                  :allow-drag="allowDrag"
                  @node-drop="handleNodeDrop"
                >
                  <template #default="{ node, data }">
                    <div class="tree-node" :class="`node-${data.type}`">
                      <div class="node-icon" v-if="data.type === 'department'">
                        <i :class="data.icon || 'fa fa-building'" :style="{ color: data.color }"></i>
                      </div>
                      <div class="node-icon team-icon" v-else-if="data.type === 'team'">
                        <i class="fa fa-object-group" style="color: #722ED1;"></i>
                      </div>
                      <div class="node-label">
                        <span class="node-name">{{ node.label }}</span>
                        <span class="node-count" v-if="data.type === 'department'">
                          {{ getNodeUserCount(data) }}人
                        </span>
                        <span class="node-count team-count" v-else-if="data.type === 'team'">
                          {{ getNodeUserCount(data) }}人
                        </span>
                      </div>
                      <div class="node-actions">
                        <el-dropdown trigger="click" @command="handleNodeCommand($event, data)">
                          <span class="action-btn">
                            <i class="fa fa-ellipsis-v"></i>
                          </span>
                          <template #dropdown>
                            <el-dropdown-menu>
                              <el-dropdown-item command="add" v-if="data.type === 'department' || data.type === 'team'">
                                <i class="fa fa-plus"></i> 添加小组
                              </el-dropdown-item>
                              <el-dropdown-item command="addUser" v-if="data.type === 'department' || data.type === 'team'">
                                <i class="fa fa-user-plus"></i> 添加人员
                              </el-dropdown-item>
                              <el-dropdown-item command="edit">
                                <i class="fa fa-edit"></i> 编辑
                              </el-dropdown-item>
                              <el-dropdown-item command="delete" divided v-if="data.type !== 'user'">
                                <i class="fa fa-trash"></i> 删除
                              </el-dropdown-item>
                            </el-dropdown-menu>
                          </template>
                        </el-dropdown>
                      </div>
                    </div>
                  </template>
                </el-tree>
              </div>

              <!-- 右侧：详情面板 -->
              <div class="detail-panel">
                <div class="panel-header">
                  <span>{{ selectedNode ? selectedNode.name : '请选择节点' }}</span>
                </div>
                <div class="detail-content" v-if="selectedNode">
                  <!-- 部门详情 -->
                  <div v-if="selectedNode.type === 'department'" class="detail-form">
                    <el-form :model="selectedNode" label-width="100px" size="small">
                      <el-form-item label="部门名称">
                        <el-input v-model="selectedNode.name" @blur="updateDepartment"></el-input>
                      </el-form-item>
                      <el-form-item label="部门编码">
                        <template v-if="userStore.isAdmin">
                          <el-input v-model="selectedNode.department_code" @blur="updateDepartment"></el-input>
                        </template>
                        <template v-else>
                          <span>{{ selectedNode.department_code }}</span>
                        </template>
                      </el-form-item>
                      <el-form-item label="部门负责人">
                        <el-select v-model="selectedNode.manager" @change="updateDepartment" placeholder="选择部门负责人">
                          <el-option label="无" value=""></el-option>
                          <el-option v-for="user in users" :key="user.id" :label="user.name" :value="user.name"></el-option>
                        </el-select>
                      </el-form-item>
                      <el-form-item label="编制人数">
                        <el-input-number v-model="selectedNode.headcount" :min="0" @change="updateDepartment"></el-input-number>
                      </el-form-item>
                      <el-form-item label="部门图标">
                        <el-select v-model="selectedNode.icon" @change="updateDepartment">
                          <el-option label="🏢 办公楼" value="fa fa-building"></el-option>
                          <el-option label="⚙️ 齿轮" value="fa fa-cog"></el-option>
                          <el-option label="👥 人群" value="fa fa-users"></el-option>
                          <el-option label="📊 图表" value="fa fa-chart-line"></el-option>
                          <el-option label="🔧 工具" value="fa fa-tools"></el-option>
                        </el-select>
                      </el-form-item>
                      <el-form-item label="部门颜色">
                        <el-color-picker v-model="selectedNode.color" @change="updateDepartment"></el-color-picker>
                      </el-form-item>
                      <el-form-item label="小组合集">
                        <div class="teams-list">
                          <div v-for="team in getDepartmentTeams(selectedNode.id)" :key="team.id" class="team-item">
                            <span>{{ team.name }}</span>
                            <span class="team-info">{{ team.currentStaff || 0 }}/{{ team.headcount }}人</span>
                            <el-button size="small" link type="primary" @click="editTeam(team)">
                              <i class="fa fa-edit"></i>
                            </el-button>
                            <el-button size="small" link type="danger" @click="deleteTeam(team)">
                              <i class="fa fa-trash"></i>
                            </el-button>
                          </div>
                          <el-button type="dashed" size="small" @click="showAddTeam(selectedNode.id)">
                            <i class="fa fa-plus"></i> 添加小组
                          </el-button>
                        </div>
                      </el-form-item>
                    </el-form>
                  </div>

                  <!-- 小组详情 -->
                  <div v-else-if="selectedNode.type === 'team'" class="detail-form">
                    <el-form :model="selectedNode" label-width="100px" size="small">
                      <el-form-item label="小组名称">
                        <el-input v-model="selectedNode.name" @blur="updateTeam"></el-input>
                      </el-form-item>
                      <el-form-item label="小组编码">
                        <span>{{ selectedNode.team_code }}</span>
                      </el-form-item>
                      <el-form-item label="所属部门">
                        <span>{{ selectedNode.department_name }}</span>
                      </el-form-item>
                      <el-form-item label="编制人数">
                        <el-input-number v-model="selectedNode.headcount" :min="0" @change="updateTeam"></el-input-number>
                      </el-form-item>
                      <el-form-item label="组长">
                        <el-select v-model="selectedNode.leader_id" placeholder="请选择组长" @change="updateTeam" clearable>
                          <el-option
                            v-for="user in getTeamAvailableUsers(selectedNode.id)"
                            :key="user.id"
                            :label="user.name"
                            :value="user.id"
                          >
                            <span>{{ user.name }}</span>
                            <span class="user-position">{{ user.position }}</span>
                          </el-option>
                        </el-select>
                      </el-form-item>
                      <el-form-item label="描述">
                        <el-input v-model="selectedNode.description" type="textarea" @blur="updateTeam"></el-input>
                      </el-form-item>
                      <el-form-item label="小组成员">
                        <div class="team-members">
                          <div v-for="user in getTeamMembers(selectedNode.id)" :key="user.id" class="member-item">
                            <span class="member-name">{{ user.name }}</span>
                            <span class="member-position">{{ user.position }}</span>
                          </div>
                          <div v-if="getTeamMembers(selectedNode.id).length === 0" class="no-members">
                            暂无成员，可拖拽用户到此处
                          </div>
                        </div>
                      </el-form-item>
                    </el-form>
                  </div>

                  <!-- 人员详情 -->
                  <div v-else-if="selectedNode.type === 'user'" class="detail-form">
                    <el-descriptions :column="1" border size="small">
                      <el-descriptions-item label="工号">{{ selectedNode.username }}</el-descriptions-item>
                      <el-descriptions-item label="姓名">{{ selectedNode.name }}</el-descriptions-item>
                      <el-descriptions-item label="职位">{{ selectedNode.position }}</el-descriptions-item>
                      <el-descriptions-item label="部门">{{ selectedNode.department_name }}</el-descriptions-item>
                      <el-descriptions-item label="小组">{{ selectedNode.team_name || '未分配' }}</el-descriptions-item>
                    </el-descriptions>
                  </div>
                </div>
                <div v-else class="no-selection">
                  <i class="fa fa-hand-pointer-o"></i>
                  <p>请从左侧选择一个部门、小组或人员</p>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 用户管理 -->
          <el-tab-pane label="用户管理" name="users">
            <div class="users-panel">
              <div class="users-toolbar">
                <el-button type="primary" @click="openAddTeamInUsers">
                  <i class="fa fa-object-group"></i> 添加小组
                </el-button>
                <el-input v-model="userSearchKeyword" placeholder="搜索用户姓名或工号" style="width: 300px; margin-left: 10px;" clearable @input="filterUsers" />
                <el-select v-model="filterDepartment" placeholder="选择部门" clearable style="width: 150px; margin-left: 10px;" @change="filterUsers">
                  <el-option v-for="dept in departments" :key="dept.id" :label="dept.name" :value="dept.id"></el-option>
                </el-select>
                <el-select v-model="filterTeam" placeholder="选择小组" clearable style="width: 150px; margin-left: 10px;" @change="filterUsers">
                  <el-option v-for="team in allTeams" :key="team.id" :label="team.name" :value="team.id"></el-option>
                </el-select>
              </div>

              <!-- 用户列表（可拖动） -->
              <div class="users-list-container">
                <div class="users-list">
                  <div
                    v-for="user in filteredUsers"
                    :key="user.id"
                    class="user-card"
                    draggable="true"
                    @dragstart="handleUserDragStart($event, user)"
                    @dragend="handleUserDragEnd"
                  >
                    <div class="user-card-header">
                      <span class="user-name">{{ user.name }}</span>
                      <el-tag size="small" type="info">{{ user.username }}</el-tag>
                    </div>
                    <div class="user-card-body">
                      <div class="user-info">
                        <span class="user-position">{{ user.position }}</span>
                      </div>
                      <div class="user-dept">
                        <i class="fa fa-building"></i> {{ user.department_name }}
                        <span v-if="user.team_name"> / {{ user.team_name }}</span>
                      </div>
                    </div>
                    <div class="user-card-actions">
                      <el-button size="small" link type="primary" @click="editUser(user)">
                        <i class="fa fa-edit"></i>
                      </el-button>
                    </div>
                  </div>
                </div>
                <div class="users-hint">
                  <i class="fa fa-info-circle"></i>
                  提示：拖拽用户卡片可将其分配到不同的小组
                </div>
              </div>

              <!-- 小组接收区 -->
              <div class="team-drop-zones">
                <h4>拖放到小组</h4>
                <div class="drop-zones-list">
                  <div
                    v-for="team in allTeams"
                    :key="team.id"
                    class="drop-zone"
                    :class="{ 'drag-over': dragOverTeamId === team.id }"
                    @dragover.prevent="handleTeamDragOver($event, team.id)"
                    @dragleave="handleTeamDragLeave"
                    @drop="handleTeamDrop($event, team.id)"
                  >
                    <div class="drop-zone-header">
                      <span class="drop-zone-name">{{ team.name }}</span>
                      <el-tag size="small">{{ team.currentStaff || 0 }}/{{ team.headcount }}</el-tag>
                    </div>
                    <div class="drop-zone-dept">{{ team.department_name }}</div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="refreshData">刷新</el-button>
      </template>
    </el-dialog>

    <!-- 添加/编辑部门对话框 -->
    <el-dialog :title="isEditDept ? '编辑部门' : '新增部门'" v-model="deptDialogVisible" width="500px">
      <el-form :model="deptForm" label-width="100px">
        <el-form-item label="部门名称" required>
          <el-input v-model="deptForm.name" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item label="部门编码" v-if="userStore.isAdmin">
          <el-input v-model="deptForm.department_code" placeholder="请输入部门编码" />
        </el-form-item>
        <el-form-item label="部门负责人">
          <el-select v-model="deptForm.manager" placeholder="选择部门负责人">
            <el-option label="无" value=""></el-option>
            <el-option v-for="user in users" :key="user.id" :label="user.name" :value="user.name"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="编制人数">
          <el-input-number v-model="deptForm.headcount" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="部门图标">
          <el-select v-model="deptForm.icon" placeholder="请选择图标" style="width: 100%">
            <el-option label="🏢 办公楼" value="fa fa-building"></el-option>
            <el-option label="⚙️ 齿轮" value="fa fa-cog"></el-option>
            <el-option label="👥 人群" value="fa fa-users"></el-option>
            <el-option label="📊 图表" value="fa fa-chart-line"></el-option>
            <el-option label="🔧 工具" value="fa fa-tools"></el-option>
            <el-option label="📦 箱子" value="fa fa-box"></el-option>
            <el-option label="✅ 检查" value="fa fa-check-circle"></el-option>
            <el-option label="🎯 目标" value="fa fa-bullseye"></el-option>
            <el-option label="💼 公文包" value="fa fa-briefcase"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="部门颜色">
          <el-color-picker v-model="deptForm.color" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="deptDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveDepartment">保存</el-button>
      </template>
    </el-dialog>

    <!-- 添加/编辑小组对话框 -->
    <el-dialog :title="isEditTeam ? '编辑小组' : '新增小组'" v-model="teamDialogVisible" width="500px">
      <el-form :model="teamForm" label-width="100px">
        <el-form-item label="小组名称" required>
          <el-input v-model="teamForm.name" placeholder="请输入小组名称" />
        </el-form-item>
        <el-form-item label="所属部门">
          <span>{{ teamForm.department_name }}</span>
        </el-form-item>
        <el-form-item label="父小组" v-if="teamForm.parent_team_id">
          <el-tag type="purple">{{ getParentTeamName(teamForm.parent_team_id) }}</el-tag>
        </el-form-item>
        <el-form-item label="编制人数">
          <el-input-number v-model="teamForm.headcount" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="组长">
          <el-select v-model="teamForm.leader_id" placeholder="请选择组长" clearable style="width: 100%">
            <el-option
              v-for="user in getDeptUsers(teamForm.department_id)"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            >
              <span>{{ user.name }}</span>
              <span class="user-position">{{ user.position }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="teamForm.description" type="textarea" placeholder="请输入小组描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="teamDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTeam">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { useUserStore } from '@/store/modules/user'

export default {
  name: 'DepartmentManagement',
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    const userStore = useUserStore()
    return {
      userStore,
      dialogVisible: false,
      isFullscreen: false,
      activeTab: 'structure',
      expandedKeys: ['0'], // 默认展开根节点
      departments: [],
      teams: [],
      users: [],
      organizationTree: [],
      treeProps: {
        children: 'children',
        label: 'name'
      },
      selectedNode: null,
      allTeams: [],

      // 用户筛选
      userSearchKeyword: '',
      filterDepartment: null,
      filterTeam: null,
      filteredUsers: [],

      // 拖拽相关
      draggingUser: null,
      dragOverTeamId: null,

      // 部门表单
      deptDialogVisible: false,
      isEditDept: false,
      deptForm: {
        id: null,
        name: '',
        department_code: '',
        manager: '',
        headcount: 10,
        icon: 'fa fa-building',
        color: '#165DFF',
        parent_id: null
      },

      // 小组表单
      teamDialogVisible: false,
      isEditTeam: false,
      teamForm: {
        id: null,
        name: '',
        department_id: null,
        department_name: '',
        parent_team_id: null,
        leader_id: null,
        headcount: 5,
        description: ''
      }
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.open()
      }
    },
    dialogVisible(val) {
      this.$emit('update:visible', val)
    }
  },
  methods: {
    async open() {
      this.dialogVisible = true
      this.isFullscreen = false
      this.activeTab = 'structure'
      await this.refreshData()
    },

    toggleFullscreen() {
      this.isFullscreen = !this.isFullscreen
    },

    handleNodeExpand(data) {
      // 记录展开的节点
      if (!this.expandedKeys.includes(data.id)) {
        this.expandedKeys.push(data.id)
      }
    },

    handleNodeCollapse(data) {
      // 记录折叠的节点
      const index = this.expandedKeys.indexOf(data.id)
      if (index > -1) {
        this.expandedKeys.splice(index, 1)
      }
    },

    async refreshData() {
      await Promise.all([
        this.fetchDepartments(),
        this.fetchTeams(),
        this.fetchUsers(),
        this.fetchOrganizationTree()
      ])
      this.filterUsers()
    },

    async fetchDepartments() {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/departments`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        })
        const result = await response.json()
        if (result.success) {
          this.departments = result.data
        }
      } catch (error) {
        console.error('获取部门失败:', error)
      }
    },

    async fetchTeams() {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/teams`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        })
        const result = await response.json()
        if (result.success) {
          this.teams = result.data
          this.allTeams = result.data
        }
      } catch (error) {
        console.error('获取团队失败:', error)
      }
    },

    async fetchUsers() {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/auth/users`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        })
        const result = await response.json()
        if (result.success) {
          this.users = result.data.map(u => ({
            ...u,
            departmentId: u.department_id,
            department_name: u.department_name || '',
            team_name: u.team_name || ''
          }))
          this.filteredUsers = this.users
        }
      } catch (error) {
        console.error('获取用户失败:', error)
      }
    },

    async fetchOrganizationTree() {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/teams/organization/tree`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        })
        const result = await response.json()
        if (result.success) {
          this.organizationTree = result.data
        }
      } catch (error) {
        console.error('获取组织树失败:', error)
      }
    },

    handleNodeClick(data) {
      this.selectedNode = data
    },

    handleNodeCommand(command, data) {
      if (command === 'add') {
        if (data.type === 'department') {
          this.showAddTeam(data.id)
        } else if (data.type === 'team') {
          this.showAddSubTeam(data)
        }
      } else if (command === 'addUser') {
        this.$emit('add-user-to-node', data)
      } else if (command === 'edit') {
        if (data.type === 'department') {
          this.editDepartment(data)
        } else if (data.type === 'team') {
          this.editTeam(data)
        }
      } else if (command === 'delete') {
        if (data.type === 'department') {
          this.deleteDepartment(data)
        } else if (data.type === 'team') {
          this.deleteTeam(data)
        }
      }
    },

    openAddTeamInUsers() {
      this.activeTab = 'structure'
      this.$nextTick(() => {
        this.$message.info('请在左侧组织树中选择一个部门，然后点击添加小组')
      })
    },

    showAddSubTeam(parentTeam) {
      this.isEditTeam = false
      // 从组织树节点获取真实的 teamId 和 departmentId
      const parentTeamId = parentTeam.teamId || parentTeam.id
      const departmentId = parentTeam.departmentId || parentTeam.department_id
      const dept = this.departments.find(d => d.id === departmentId)
      
      this.teamForm = {
        id: null,
        name: '',
        department_id: departmentId,
        department_name: dept ? dept.name : (parentTeam.department_name || ''),
        parent_team_id: parentTeamId,
        leader_id: null,
        headcount: 5,
        description: ''
      }
      this.teamDialogVisible = true
    },

    handleAddRootDept() {
      this.isEditDept = false
      this.deptForm = {
        id: null,
        name: '',
        manager: '',
        headcount: 10,
        icon: 'fa fa-building',
        color: '#165DFF',
        parent_id: null
      }
      this.deptDialogVisible = true
    },

    showAddTeam(departmentId) {
      this.isEditTeam = false
      const dept = this.departments.find(d => d.id === departmentId)
      this.teamForm = {
        id: null,
        name: '',
        department_id: departmentId,
        department_name: dept ? dept.name : '',
        leader_id: null,
        headcount: 5,
        description: ''
      }
      this.teamDialogVisible = true
    },

    editDepartment(dept) {
      this.isEditDept = true
      this.deptForm = {
        id: dept.departmentId || dept.id,
        name: dept.name,
        department_code: dept.department_code || '',
        manager: dept.manager || '',
        headcount: dept.headcount || 10,
        icon: dept.icon || 'fa fa-building',
        color: dept.color || '#165DFF',
        parent_id: dept.parent_id
      }
      this.deptDialogVisible = true
    },

    editTeam(team) {
      this.isEditTeam = true
      this.teamForm = {
        id: team.teamId || team.id,
        name: team.name,
        department_id: team.departmentId || team.department_id,
        department_name: team.department_name || '',
        leader_id: team.leaderId || team.leader_id,
        headcount: team.headcount || 5,
        description: team.description || ''
      }
      this.teamDialogVisible = true
    },

    async saveDepartment() {
      if (!this.deptForm.name) {
        this.$message.warning('请输入部门名称')
        return
      }

      try {
        const url = this.isEditDept
          ? `${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/departments/${this.deptForm.id}`
          : `${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/departments`

        const method = this.isEditDept ? 'PUT' : 'POST'

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify({
            name: this.deptForm.name,
            department_code: this.deptForm.department_code,
            manager: this.deptForm.manager,
            headcount: this.deptForm.headcount,
            icon: this.deptForm.icon,
            color: this.deptForm.color,
            description: `${this.deptForm.name}部门`
          })
        })

        const result = await response.json()
        if (result.success) {
          this.$message.success(this.isEditDept ? '更新成功' : '创建成功')
          this.deptDialogVisible = false
          await this.refreshData()
          // 通知父组件部门数据已更新
          this.$emit('departments-updated', this.departments)
        } else {
          this.$message.error(result.message || '保存失败')
        }
      } catch (error) {
        console.error('保存部门失败:', error)
        this.$message.error('保存失败')
      }
    },

    async updateDepartment() {
      if (!this.selectedNode || this.selectedNode.type !== 'department') return

      try {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/departments/${this.selectedNode.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify({
            name: this.selectedNode.name,
            department_code: this.selectedNode.department_code,
            manager: this.selectedNode.manager,
            headcount: this.selectedNode.headcount,
            icon: this.selectedNode.icon,
            color: this.selectedNode.color
          })
        })
        await this.refreshData()
        // 通知父组件部门数据已更新
        this.$emit('departments-updated', this.departments)
      } catch (error) {
        console.error('更新部门失败:', error)
      }
    },

    async deleteDepartment(dept) {
      try {
        await this.$confirm(`确定删除部门 "${dept.name}" 吗？`, '提示', {
          type: 'warning'
        })

        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/departments/${dept.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        })

        this.$message.success('删除成功')
        this.selectedNode = null
        await this.refreshData()
        // 通知父组件部门数据已更新
        this.$emit('departments-updated', this.departments)
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除失败')
        }
      }
    },

    async saveTeam() {
      if (!this.teamForm.name) {
        this.$message.warning('请输入小组名称')
        return
      }

      try {
        const url = this.isEditTeam
          ? `${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/teams/${this.teamForm.id}`
          : `${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/teams`

        const method = this.isEditTeam ? 'PUT' : 'POST'

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify(this.teamForm)
        })

        const result = await response.json()
        if (result.success) {
          this.$message.success(this.isEditTeam ? '更新成功' : '创建成功')
          this.teamDialogVisible = false
          await this.refreshData()
          // 通知父组件小组数据已更新
          this.$emit('teams-updated', this.teams)
        } else {
          this.$message.error(result.message || '保存失败')
        }
      } catch (error) {
        console.error('保存小组失败:', error)
        this.$message.error('保存失败')
      }
    },

    async updateTeam() {
      if (!this.selectedNode || this.selectedNode.type !== 'team') return

      try {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/teams/${this.selectedNode.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify({
            name: this.selectedNode.name,
            leader_id: this.selectedNode.leader_id,
            headcount: this.selectedNode.headcount,
            description: this.selectedNode.description
          })
        })
        await this.refreshData()
        // 通知父组件小组数据已更新
        this.$emit('teams-updated', this.teams)
      } catch (error) {
        console.error('更新小组失败:', error)
      }
    },

    async deleteTeam(team) {
      try {
        await this.$confirm(`确定删除小组 "${team.name}" 吗？`, '提示', {
          type: 'warning'
        })

        // 从组织树节点获取真实的 teamId
        const teamId = team.teamId || team.id
        
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/teams/${teamId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json'
          }
        })
        
        const result = await response.json()
        
        if (!response.ok || !result.success) {
          throw new Error(result.message || '删除失败')
        }

        this.$message.success('删除成功')
        this.selectedNode = null
        await this.refreshData()
        // 通知父组件小组数据已更新
        this.$emit('teams-updated', this.teams)
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除小组失败:', error)
          this.$message.error(error.message || '删除失败')
        }
      }
    },

    // 用户筛选
    filterUsers() {
      let filtered = [...this.users]

      if (this.userSearchKeyword) {
        const keyword = this.userSearchKeyword.toLowerCase()
        filtered = filtered.filter(u =>
          u.name.toLowerCase().includes(keyword) ||
          (u.username && u.username.toLowerCase().includes(keyword))
        )
      }

      if (this.filterDepartment) {
        filtered = filtered.filter(u => u.department_id === this.filterDepartment)
      }

      if (this.filterTeam !== null) {
        filtered = filtered.filter(u => u.team_id === this.filterTeam)
      }

      this.filteredUsers = filtered
    },

    // 拖拽相关
    handleUserDragStart(event, user) {
      this.draggingUser = user
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', JSON.stringify(user))
    },

    handleUserDragEnd() {
      this.draggingUser = null
    },

    handleTeamDragOver(event, teamId) {
      event.preventDefault()
      this.dragOverTeamId = teamId
    },

    handleTeamDragLeave() {
      this.dragOverTeamId = null
    },

    async handleTeamDrop(event, teamId) {
      event.preventDefault()
      this.dragOverTeamId = null

      if (!this.draggingUser) return

      // 确保 teamId 是数字
      const numericTeamId = parseInt(teamId)
      const numericUserId = parseInt(this.draggingUser.id)

      console.log('分配用户到小组:', { userId: numericUserId, teamId: numericTeamId, user: this.draggingUser })

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/teams/assign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify({
            userId: numericUserId,
            teamId: numericTeamId
          })
        })

        const result = await response.json()
        console.log('分配结果:', result)
        
        if (result.success) {
          this.$message.success('分配成功')
          await this.refreshData()
        } else {
          this.$message.error(result.message || '分配失败')
        }
      } catch (error) {
        console.error('分配用户到团队失败:', error)
        this.$message.error('分配失败')
      }

      this.draggingUser = null
    },

    // 树节点拖拽
    allowDrop(draggingNode, dropNode, type) {
      return type !== 'inner'
    },

    allowDrag(node) {
      return true
    },

    async handleNodeDrop(draggingNode, dropNode, dropType) {
      console.log('Node dropped:', draggingNode.data, dropNode.data, dropType)
    },

    // 获取数据的方法
    getDepartmentTeams(departmentId) {
      return this.teams.filter(t => t.department_id === departmentId)
    },

    getTeamMembers(teamId) {
      return this.users.filter(u => u.team_id === teamId)
    },

    getTeamAvailableUsers(teamId) {
      const team = this.teams.find(t => t.id === teamId)
      if (!team) return []
      return this.users.filter(u => u.department_id === team.department_id)
    },

    getDeptUsers(departmentId) {
      return this.users.filter(u => u.department_id === departmentId)
    },

    getParentTeamName(teamId) {
      const team = this.teams.find(t => t.id === teamId)
      return team ? team.name : ''
    },

    getNodeUserCount(node) {
      if (node.type === 'department') {
        // 从组织树节点获取真实的 departmentId
        const deptId = node.departmentId || node.id
        const deptIdNumber = Number(deptId)
        // 计算部门人数：包括部门下所有用户（包括分配到小组的）
        const deptUsers = this.users.filter(u => {
          const userDeptId = Number(u.department_id || u.departmentId)
          return userDeptId === deptIdNumber
        })
        return deptUsers.length
      } else if (node.type === 'team') {
        // 从组织树节点获取真实的 teamId
        const teamId = node.teamId || node.id
        const teamIdNumber = Number(teamId)
        // 从 users 数组中实时计算小组成员数
        const teamUsers = this.users.filter(u => {
          const userTeamId = Number(u.team_id || u.teamId)
          return userTeamId === teamIdNumber
        })
        return teamUsers.length
      }
      return 0
    },

    editUser(user) {
      // 确保用户对象包含正确的部门信息格式
      const userWithCorrectFormat = {
        ...user,
        department_id: user.department_id || user.departmentId,
        team_id: user.team_id || user.teamId
      }
      this.$emit('edit-user', userWithCorrectFormat)
    }
  }
}
</script>

<style scoped>
.organization-management {
  font-size: 14px;
}

.structure-container {
  display: flex;
  height: 500px;
  gap: 10px;
}

.tree-panel {
  width: 400px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 10px 15px;
  background: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.detail-panel {
  flex: 1;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
}

.detail-content {
  padding: 15px;
  overflow-y: auto;
}

.no-selection {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
}

.no-selection i {
  font-size: 48px;
  margin-bottom: 10px;
}

.tree-node {
  display: flex;
  align-items: center;
  flex: 1;
  padding-right: 10px;
}

.node-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  font-size: 12px;
}

.node-label {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.node-name {
  font-weight: 500;
}

.node-count {
  font-size: 12px;
  color: #909399;
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 10px;
}

.team-icon {
  background: #f3e8ff;
}

.team-count {
  background: #f3e8ff;
  color: #722ed1;
}

.node-actions {
  opacity: 0;
  transition: opacity 0.3s;
}

.tree-node:hover .node-actions {
  opacity: 1;
}

.action-btn {
  cursor: pointer;
  padding: 4px 8px;
}

.teams-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.team-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
}

.team-info {
  color: #909399;
  font-size: 12px;
}

.team-members {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.member-item {
  display: flex;
  flex-direction: column;
  padding: 6px 10px;
  background: #ecf5ff;
  border-radius: 4px;
  font-size: 12px;
}

.member-name {
  font-weight: 500;
  color: #303133;
}

.member-position {
  color: #909399;
  font-size: 11px;
}

.no-members {
  color: #c0c4cc;
  font-style: italic;
}

/* 用户管理 */
.users-panel {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.users-toolbar {
  display: flex;
  align-items: center;
}

.users-list-container {
  display: flex;
  gap: 20px;
}

.users-list {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  max-height: 350px;
  overflow-y: auto;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

.user-card {
  width: 180px;
  padding: 12px;
  background: white;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: move;
  transition: all 0.3s;
}

.user-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.user-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.user-name {
  font-weight: 600;
  color: #303133;
}

.user-card-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-position {
  color: #606266;
  font-size: 12px;
}

.user-dept {
  color: #909399;
  font-size: 11px;
}

.user-dept i {
  margin-right: 4px;
}

.user-card-actions {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f5f5f5;
  display: flex;
  justify-content: flex-end;
}

.users-hint {
  padding: 10px;
  background: #ecf5ff;
  border-radius: 4px;
  color: #409eff;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.users-hint i {
  font-size: 16px;
}

/* 小组接收区 */
.team-drop-zones {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 15px;
}

.team-drop-zones h4 {
  margin: 0 0 10px 0;
  color: #303133;
}

.drop-zones-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.drop-zone {
  width: 200px;
  padding: 12px;
  border: 2px dashed #dcdfe6;
  border-radius: 4px;
  background: #fafafa;
  transition: all 0.3s;
}

.drop-zone.drag-over {
  border-color: #409eff;
  background: #ecf5ff;
}

.drop-zone-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.drop-zone-name {
  font-weight: 600;
  color: #303133;
}

.drop-zone-dept {
  font-size: 12px;
  color: #909399;
}

/* 描述列表样式 */
.detail-form {
  padding: 10px;
}

.user-position {
  color: #909399;
  font-size: 13px;
  margin-left: 10px;
}

/* 全屏对话框样式 */
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.fullscreen-btn {
  font-size: 14px;
}

.org-dialog :deep(.el-dialog__body) {
  padding: 10px 20px;
}

.org-dialog.is-fullscreen :deep(.el-dialog__body) {
  height: calc(100vh - 120px);
  overflow: hidden;
}

.org-dialog.is-fullscreen .structure-container {
  height: calc(100vh - 180px);
}

.org-dialog.is-fullscreen .tree-panel,
.org-dialog.is-fullscreen .detail-panel {
  height: 100%;
}

.org-dialog.is-fullscreen .el-tree {
  max-height: calc(100vh - 240px);
  overflow-y: auto;
}
</style>
