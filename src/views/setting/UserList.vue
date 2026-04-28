<template>
  <div class="user-management-container">
    <div class="sidebar">
      <div class="tree-panel-header">
        <div class="header-buttons">
          <div class="btn-group">
            <el-button type="primary" size="small" @click="handleAddRootDept" class="header-btn">
              <i class="fa fa-plus"></i> 部门
            </el-button>
            <el-button type="success" size="small" @click="handleAddUser" class="header-btn">
              <i class="fa fa-user-plus"></i> 人员
            </el-button>
          </div>
          <el-input v-model="searchKeyword" placeholder="搜索人员姓名或工号" clearable style="width: 200px; margin-top: 8px" />
        </div>
      </div>
      <div class="tree-content">
        <el-tree
          ref="organizationTree"
          :data="organizationTree"
          :props="treeProps"
          node-key="id"
          :default-expanded-keys="expandedKeys"
          :expand-on-click-node="false"
          :highlight-current="true"
          @node-click="handleNodeClick"
          @node-expand="handleNodeExpand"
          @node-collapse="handleNodeCollapse"
          class="organization-tree"
        >
          <template #default="{ node, data }">
            <div class="tree-node" :class="`node-${data.type}`">
              <div class="node-icon" v-if="data.type === 'company'">
                <i class="fa fa-building-o" style="color: #165DFF;"></i>
              </div>
              <div class="node-icon" v-else-if="data.type === 'department'">
                <i :class="data.icon || 'fa fa-building'" :style="{ color: data.color || '#165DFF' }"></i>
              </div>
              <div class="node-icon" v-else-if="data.type === 'team'">
                <i class="fa fa-object-group" style="color: #722ED1;"></i>
              </div>
              <div class="node-icon" v-else-if="data.type === 'user'">
                <i class="fa fa-user" style="color: #52C41A;"></i>
              </div>
              <div class="node-content">
                <span class="node-label">{{ node.label }}</span>
                <span v-if="data.type === 'department' || data.type === 'team'" class="node-count">
                  ({{ getNodeUserCount(data) }})
                </span>
                <span v-if="data.type === 'user' && data.position" class="node-position">{{ data.position }}</span>
              </div>
            </div>
          </template>
        </el-tree>
      </div>
    </div>
    <div class="content-panel">
        <div class="panel-header">
          <span class="panel-title">{{ selectedNode ? selectedNode.name : '请选择组织节点' }}</span>
        </div>

        <div class="panel-content">
          <!-- 公司概览 -->
          <div v-if="selectedNode && selectedNode.type === 'company'" class="company-overview">
            <div class="overview-stats">
              <div class="stat-item">
                <div class="stat-value">{{ getDepartmentCount() }}</div>
                <div class="stat-label">部门数</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ getTotalEmployeeCount() }}</div>
                <div class="stat-label">员工数</div>
              </div>
            </div>
            
            <!-- 公司全员列表 -->
            <div class="all-employees-list">
              <h4>公司全员列表</h4>
              <el-table :data="allEmployees" style="width: 100%" class="user-table">
                <el-table-column prop="employee_no" label="工号" width="100" sortable />
                <el-table-column prop="name" label="姓名" width="120" sortable>
                  <template #default="{ row }">
                    <span :style="{ textDecoration: row.status === 'resigned' ? 'line-through' : 'none' }">
                      {{ row.name }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="性别" width="80" sortable>
                  <template #default="{ row }">
                    <span :style="{ color: row.gender === 'female' ? '#f56c6c' : '#409eff' }">
                      {{ row.gender === 'female' ? '女' : '男' }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="position" label="职位" width="150" sortable />
                <el-table-column label="所属部门" width="150" sortable>
                  <template #default="{ row }">
                    {{ getDepartmentName(row) }}
                  </template>
                </el-table-column>
                <el-table-column label="所属小组" width="150" sortable>
                  <template #default="{ row }">
                    {{ getTeamName(row) }}
                  </template>
                </el-table-column>
                <el-table-column label="入职时间" width="150" sortable>
                  <template #default="{ row }">
                    {{ formatDate(row.join_date || row.joinDate) }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="240" fixed="right">
                  <template #default="scope">
                    <el-button size="small" @click="handleEditUser(scope.row)">编辑</el-button>
                    <el-button 
                      v-if="scope.row.status === 'resigned'"
                      size="small" 
                      type="primary"
                      @click="handleActivateUser(scope.row)"
                    >
                      激活
                    </el-button>
                    <el-button 
                      v-else
                      size="small" 
                      type="warning"
                      @click="handleResignUser(scope.row)"
                    >
                      离职
                    </el-button>
                    <el-button size="small" type="danger" @click="handleDeleteUser(scope.row)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>

          <!-- 部门详情 -->
          <div v-if="selectedNode && selectedNode.type === 'department'" class="detail-section">
            <el-form label-width="100px" class="detail-form">
              <el-form-item label="部门名称">
                <el-input v-model="selectedNode.name" disabled />
              </el-form-item>
              <el-form-item label="部门编码">
                <el-input :value="selectedNode.department_code" disabled />
              </el-form-item>
              <el-form-item label="部门负责人">
                <el-input :value="getManagerName(selectedNode.manager)" disabled />
              </el-form-item>
              <el-form-item label="部门人数">
                <el-input :value="getNodeUserCount(selectedNode) + '人'" disabled />
              </el-form-item>
              <el-form-item label="编制人数">
                <el-input :value="(selectedNode.headcount || 0) + '人'" disabled />
              </el-form-item>
            </el-form>
            <div class="detail-actions">
              <el-button type="primary" @click="handleAddTeam(selectedNode)">添加小组</el-button>
              <el-button type="success" @click="handleAddUserToNode(selectedNode)">添加人员</el-button>
              <el-button @click="handleEditNode(selectedNode)">编辑</el-button>
              <el-button type="danger" @click="handleDeleteNode(selectedNode)">删除</el-button>
            </div>
          </div>

          <!-- 小组详情 -->
          <div v-if="selectedNode && selectedNode.type === 'team'" class="detail-section">
            <el-form label-width="100px" class="detail-form">
              <el-form-item label="小组名称">
                <el-input v-model="selectedNode.name" disabled />
              </el-form-item>
              <el-form-item label="小组负责人">
                <el-input :value="getTeamLeaderName(selectedNode)" disabled />
              </el-form-item>
              <el-form-item label="小组人数">
                <el-input :value="getNodeUserCount(selectedNode) + '人'" disabled />
              </el-form-item>
              <el-form-item label="编制人数">
                <el-input :value="(selectedNode.headcount || 0) + '人'" disabled />
              </el-form-item>
            </el-form>
            <div class="detail-actions">
              <el-button type="primary" @click="handleAddSubTeam(selectedNode)">增加小组</el-button>
              <el-button type="success" @click="handleAddUserToNode(selectedNode)">增加人员</el-button>
              <el-button @click="handleEditTeam(selectedNode)">编辑</el-button>
              <el-button type="danger" @click="handleDeleteNode(selectedNode)">删除</el-button>
            </div>
          </div>

          <!-- 人员列表 -->
          <div v-if="selectedNode && (selectedNode.type === 'department' || selectedNode.type === 'team')" class="user-list-section">
            <h3 class="section-title">人员列表</h3>
            <el-table :data="filteredNodeUsers" style="width: 100%" class="user-table" @row-click="handleUserRowClick" highlight-current-row>
              <el-table-column prop="employee_no" label="工号" width="100" sortable />
              <el-table-column prop="name" label="姓名" width="120" sortable>
                <template #default="{ row }">
                  <span :style="{ textDecoration: row.status === 'resigned' ? 'line-through' : 'none' }">
                    {{ row.name }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="性别" width="80" sortable>
                <template #default="{ row }">
                  <span :style="{ color: row.gender === 'female' ? '#f56c6c' : '#409eff' }">
                    {{ row.gender === 'female' ? '女' : '男' }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="position" label="职位" width="150" sortable />
              <el-table-column label="所属部门" width="150" sortable>
                <template #default="{ row }">
                  {{ getDepartmentName(row) }}
                </template>
              </el-table-column>
              <el-table-column label="所属小组" width="150" sortable>
                <template #default="{ row }">
                  {{ getTeamName(row) }}
                </template>
              </el-table-column>
              <el-table-column label="入职时间" width="150" sortable>
                <template #default="{ row }">
                  {{ formatDate(row.join_date || row.joinDate) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="240" fixed="right">
                <template #default="scope">
                    <el-button size="small" @click="handleEditUser(scope.row)">编辑</el-button>
                    <el-button 
                      v-if="scope.row.status === 'resigned'"
                      size="small" 
                      type="primary"
                      @click="handleActivateUser(scope.row)"
                    >
                      激活
                    </el-button>
                    <el-button 
                      v-else
                      size="small" 
                      type="warning"
                      @click="handleResignUser(scope.row)"
                    >
                      离职
                    </el-button>
                    <el-button size="small" type="danger" @click="handleDeleteUser(scope.row)">删除</el-button>
                  </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 个人信息 -->
          <div v-if="selectedNode && selectedNode.type === 'user'" class="detail-section">
            <el-form label-width="100px" class="detail-form">
              <el-form-item label="工号">
                <el-input :value="selectedNode.employee_no || selectedNode.employeeNo || '-'" disabled />
              </el-form-item>
              <el-form-item label="姓名">
                <el-input v-model="selectedNode.name" disabled />
              </el-form-item>
              <el-form-item label="性别">
                <el-input :value="selectedNode.gender === 'female' ? '女' : '男'" disabled :style="{ color: selectedNode.gender === 'female' ? '#f56c6c' : '#409eff' }" />
              </el-form-item>
              <el-form-item label="职位">
                <el-input :value="selectedNode.position" disabled />
              </el-form-item>
              <el-form-item label="用户名">
                <el-input v-model="selectedNode.username" disabled />
              </el-form-item>
              <el-form-item label="邮箱">
                <el-input :value="selectedNode.email || '-'" disabled />
              </el-form-item>
              <el-form-item label="入职时间">
                <el-input :value="formatDate(selectedNode.join_date || selectedNode.joinDate)" disabled />
              </el-form-item>
              <el-form-item label="所属部门">
                <el-input :value="getDepartmentName(selectedNode)" disabled />
              </el-form-item>
              <el-form-item label="所属小组">
                <el-input :value="getTeamName(selectedNode)" disabled />
              </el-form-item>
            </el-form>
            <div class="detail-actions">
              <el-button @click="handleEditUser(selectedNode)">编辑</el-button>
              <el-button type="danger" @click="handleDeleteUser(selectedNode)">删除</el-button>
            </div>
          </div>
        </div>
      </div>

    <!-- 添加/编辑用户对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="isEdit ? '编辑用户' : '添加用户'"
      width="600px"
    >
      <el-form ref="userForm" :model="userForm" :rules="userRules" label-width="100px">
        <el-form-item label="工号" prop="employeeNo" required>
          <el-input v-model="userForm.employeeNo" placeholder="请输入员工编号" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="userForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="userForm.gender">
            <el-radio value="male">男</el-radio>
            <el-radio value="female">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="职位" prop="position" required>
          <el-select v-model="userForm.position" placeholder="请选择职位" style="width: 100%" clearable filterable allow-create>
            <el-option
              v-for="pos in positions"
              :key="pos.id"
              :label="pos.position_name"
              :value="pos.position_name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="所属部门" prop="department_id" required>
          <el-select v-model="userForm.department_id" placeholder="请选择部门" style="width: 100%">
            <el-option
              v-for="dept in departments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="所属小组" prop="team_id">
          <el-select v-model="userForm.team_id" placeholder="请选择小组" style="width: 100%" clearable>
            <el-option
              v-for="team in filteredTeams"
              :key="team.id"
              :label="team.name"
              :value="team.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" type="email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="入职时间" prop="joinDate">
          <el-date-picker
            v-model="userForm.joinDate"
            type="date"
            placeholder="请选择入职时间"
            style="width: 100%"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!isEdit">
          <el-input v-model="userForm.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        
        <!-- 权限设置 -->
        <el-form-item label="权限设置">
          <el-collapse v-model="activePermissionCollapse">
            <el-collapse-item title="系统模块权限" name="permissions">
              <div class="permission-settings">
                <div v-for="(perms, module) in userForm.permissions" :key="module" class="permission-module">
                  <h4>{{ getModuleName(module) }}</h4>
                  <div class="permission-actions">
                    <el-checkbox v-model="perms.view" label="view">查看</el-checkbox>
                    <el-checkbox v-model="perms.add" label="add" v-if="perms.add !== undefined">添加</el-checkbox>
                    <el-checkbox v-model="perms.edit" label="edit" v-if="perms.edit !== undefined">编辑</el-checkbox>
                    <el-checkbox v-model="perms.delete" label="delete" v-if="perms.delete !== undefined">删除</el-checkbox>
                    <el-checkbox v-model="perms.apply" label="apply" v-if="perms.apply !== undefined">申请</el-checkbox>
                    <el-checkbox v-model="perms.approve" label="approve" v-if="perms.approve !== undefined">审批</el-checkbox>
                  </div>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveUser">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加/编辑部门对话框 -->
    <el-dialog
      v-model="showAddDeptDialog"
      :title="deptForm.id ? '编辑部门' : '新增部门'"
      width="600px"
    >
      <el-form ref="deptForm" :model="deptForm" :rules="deptRules" label-width="100px">
        <el-form-item label="部门名称" prop="name">
          <el-input v-model="deptForm.name" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item label="部门编码" prop="department_code">
          <el-input v-model="deptForm.department_code" placeholder="请输入部门编码" :disabled="!isAdmin" />
        </el-form-item>
        <el-form-item label="部门负责人" prop="managerId">
          <el-select v-model="deptForm.managerId" placeholder="请选择部门负责人" style="width: 100%" clearable>
            <el-option label="无" :value="0" />
            <el-option
              v-for="user in users"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="编制人数" prop="headcount">
          <el-input-number v-model="deptForm.headcount" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="部门图标" prop="icon">
          <el-select v-model="deptForm.icon" placeholder="请选择部门图标" style="width: 100%">
            <el-option label="办公楼" value="fa-building" />
            <el-option label="灯泡" value="fa fa-lightbulb" />
            <el-option label="用户" value="fa fa-users" />
            <el-option label="卡车" value="fa fa-truck" />
            <el-option label="日元" value="fa fa-yen-sign" />
            <el-option label="工业" value="fa fa-industry" />
            <el-option label="太阳能" value="fa fa-solar-panel" />
            <el-option label="电池" value="fa fa-car-battery" />
            <el-option label="地球" value="fa fa-globe" />
            <el-option label="齿轮" value="fa fa-cogs" />
            <el-option label="项目" value="fa fa-project-diagram" />
            <el-option label="盾牌" value="fa fa-shield-alt" />
          </el-select>
        </el-form-item>
        <el-form-item label="部门颜色" prop="color">
          <el-color-picker v-model="deptForm.color" />
        </el-form-item>
        
        <!-- 权限设置 -->
        <el-form-item label="权限设置">
          <el-collapse v-model="activeDeptPermissionCollapse">
            <el-collapse-item title="系统模块权限" name="permissions">
              <div class="permission-settings">
                <div v-for="(perms, module) in deptForm.permissions" :key="module" class="permission-module">
                  <h4>{{ getModuleName(module) }}</h4>
                  <div class="permission-actions">
                    <el-checkbox v-model="perms.view" label="view">查看</el-checkbox>
                    <el-checkbox v-model="perms.add" label="add" v-if="perms.add !== undefined">添加</el-checkbox>
                    <el-checkbox v-model="perms.edit" label="edit" v-if="perms.edit !== undefined">编辑</el-checkbox>
                    <el-checkbox v-model="perms.delete" label="delete" v-if="perms.delete !== undefined">删除</el-checkbox>
                    <el-checkbox v-model="perms.apply" label="apply" v-if="perms.apply !== undefined">申请</el-checkbox>
                    <el-checkbox v-model="perms.approve" label="approve" v-if="perms.approve !== undefined">审批</el-checkbox>
                  </div>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDeptDialog = false">取消</el-button>
        <el-button type="primary" @click="saveDepartment">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加/编辑小组对话框 -->
    <el-dialog
      v-model="showTeamDialog"
      :title="isEditTeam ? '编辑小组' : '新增小组'"
      width="500px"
    >
      <el-form ref="teamForm" :model="teamForm" :rules="teamRules" label-width="80px">
        <el-form-item label="小组名称" prop="name">
          <el-input v-model="teamForm.name" placeholder="请输入小组名称" />
        </el-form-item>
        
        <!-- 权限设置 -->
        <el-form-item label="权限设置">
          <el-collapse v-model="activeTeamPermissionCollapse">
            <el-collapse-item title="系统模块权限" name="permissions">
              <div class="permission-settings">
                <div v-for="(perms, module) in teamForm.permissions" :key="module" class="permission-module">
                  <h4>{{ getModuleName(module) }}</h4>
                  <div class="permission-actions">
                    <el-checkbox v-model="perms.view" label="view">查看</el-checkbox>
                    <el-checkbox v-model="perms.add" label="add" v-if="perms.add !== undefined">添加</el-checkbox>
                    <el-checkbox v-model="perms.edit" label="edit" v-if="perms.edit !== undefined">编辑</el-checkbox>
                    <el-checkbox v-model="perms.delete" label="delete" v-if="perms.delete !== undefined">删除</el-checkbox>
                    <el-checkbox v-model="perms.apply" label="apply" v-if="perms.apply !== undefined">申请</el-checkbox>
                    <el-checkbox v-model="perms.approve" label="approve" v-if="perms.approve !== undefined">审批</el-checkbox>
                  </div>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTeamDialog = false">取消</el-button>
        <el-button type="primary" @click="saveTeam">确定</el-button>
      </template>
    </el-dialog>




  </div>
</template>

<script>
export default {
  name: 'UserList',
  components: {},
  data() {
    const userStore = JSON.parse(localStorage.getItem('userStore') || '{}')
    const isAdmin = userStore.user?.role === 'admin'

    return {
      userStore,
      isAdmin,
      organizationTree: [],
      expandedKeys: [],
      treeProps: {
        label: 'name',
        children: 'children'
      },
      selectedNode: null,
      departments: [],
      teams: [],
      userPermissionsMap: new Map(), // 用户权限映射，用于存储从组织树中提取的用户权限
      users: [],
      positions: [],

      // 对话框显示状态
      showAddDialog: false,
      showTeamDialog: false,
      showAddDeptDialog: false,
      isEdit: false,
      isEditTeam: false,

      // 搜索相关
      searchKeyword: '',

      // 组织成员显示
      showAllMembers: false,

      // 权限折叠面板展开状态
      activePermissionCollapse: ['permissions'],
      activeDeptPermissionCollapse: ['permissions'],
      activeTeamPermissionCollapse: ['permissions'],

      // 用户表单
      userForm: {
        id: null,
        name: '',
        gender: 'male',
        password: '',
        position: '',
        employeeNo: '',
        email: '',
        joinDate: '',
        department_id: null,
        team_id: null,
        permissions: {
          crm: { view: false, add: false, edit: false, delete: false },
          sales: { view: false, add: false, edit: false, delete: false },
          projects: { view: false, add: false, edit: false, delete: false },
          technical: { view: false, add: false, edit: false, delete: false },
          srm: { view: false, add: false, edit: false, delete: false },
          warehouse: { view: false, add: false, edit: false, delete: false },
          quality: { view: false, add: false, edit: false, delete: false },
          hr: { view: false, add: false, edit: false, delete: false },
          admin: { view: false, add: false, edit: false, delete: false },
          production: { view: false, add: false, edit: false, delete: false },
          rnd: { view: false, add: false, edit: false, delete: false },
          afterSales: { view: false, add: false, edit: false, delete: false },
          document: { view: false, add: false, edit: false, delete: false },
          knowledge: { view: false, add: false, edit: false, delete: false },
          report: { view: false, add: false, edit: false, delete: false }
        }
      },
      userRules: {
        name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
        password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
        position: [{ required: true, message: '请选择职位', trigger: 'change' }],
        employeeNo: [
          { required: true, message: '请输入员工编号', trigger: 'blur' },
          { pattern: /^[0-9]+$/, message: '员工编号必须为数字', trigger: 'blur' }
        ],
        department_id: [{ required: true, message: '请选择部门', trigger: 'change' }]
      },

      // 部门表单
      deptForm: {
        id: null,
        name: '',
        department_code: '',
        managerId: 0,
        headcount: 0,
        icon: 'fa-building',
        color: '#165DFF',
        permissions: {
          crm: { view: true, add: false, edit: false, delete: false },
          sales: { view: true, add: false, edit: false, delete: false },
          projects: { view: true, add: false, edit: false, delete: false },
          technical: { view: true, add: false, edit: false, delete: false },
          srm: { view: true, add: false, edit: false, delete: false },
          warehouse: { view: true, add: false, edit: false, delete: false },
          quality: { view: true, add: false, edit: false, delete: false },
          hr: { view: true, add: false, edit: false, delete: false },
          admin: { view: true, add: false, edit: false, delete: false },
          production: { view: true, add: false, edit: false, delete: false },
          rnd: { view: true, add: false, edit: false, delete: false },
          afterSales: { view: true, add: false, edit: false, delete: false },
          document: { view: true, add: false, edit: false, delete: false },
          knowledge: { view: true, add: false, edit: false, delete: false },
          report: { view: true, add: false, edit: false, delete: false }
        }
      },
      deptRules: {
        name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }]
      },

      // 小组表单
      teamForm: {
        id: null,
        name: '',
        department_id: null,
        parent_team_id: null,
        permissions: {
          crm: { view: false, add: false, edit: false, delete: false },
          sales: { view: false, add: false, edit: false, delete: false },
          projects: { view: false, add: false, edit: false, delete: false },
          technical: { view: false, add: false, edit: false, delete: false },
          srm: { view: false, add: false, edit: false, delete: false },
          warehouse: { view: false, add: false, edit: false, delete: false },
          quality: { view: false, add: false, edit: false, delete: false },
          hr: { view: false, add: false, edit: false, delete: false },
          admin: { view: false, add: false, edit: false, delete: false },
          production: { view: false, add: false, edit: false, delete: false },
          rnd: { view: false, add: false, edit: false, delete: false },
          afterSales: { view: false, add: false, edit: false, delete: false },
          document: { view: false, add: false, edit: false, delete: false },
          knowledge: { view: false, add: false, edit: false, delete: false },
          report: { view: false, add: false, edit: false, delete: false }
        }
      },
      teamRules: {
        name: [{ required: true, message: '请输入小组名称', trigger: 'blur' }]
      }
    }
  },
  computed: {
    nodeUsers() {
      if (!this.selectedNode) return []
      if (this.selectedNode.type === 'department') {
        return this.users.filter(u => u.department_id === this.selectedNode.departmentId)
      } else if (this.selectedNode.type === 'team') {
        return this.users.filter(u => u.team_id === this.selectedNode.teamId)
      }
      return []
    },
    
    filteredTeams() {
      if (!this.userForm.department_id) return []
      return this.teams.filter(team => team.department_id === this.userForm.department_id)
    },
    
    filteredNodeUsers() {
      let filtered = this.nodeUsers
      // 只显示有工号的人员
      filtered = filtered.filter(user => 
        user.employee_no || user.employeeNo
      )
      // 过滤离职员工（只有管理员可以看到离职员工）
      if (!this.isAdmin) {
        filtered = filtered.filter(user => 
          user.status !== 'resigned'
        )
      }
      // 应用搜索过滤
      if (this.searchKeyword) {
        const keyword = this.searchKeyword.toLowerCase()
        filtered = filtered.filter(user => 
          user.name.toLowerCase().includes(keyword) || 
          (user.employee_no && user.employee_no.toString().includes(keyword)) ||
          (user.employeeNo && user.employeeNo.toString().includes(keyword))
        )
      }
      // 去重：按姓名分组，保留有工号的，若都有工号则保留第一个
      const nameMap = {}
      filtered.forEach(user => {
        const name = user.name
        if (!nameMap[name]) {
          nameMap[name] = user
        } else {
          // 如果已有相同姓名的用户，检查是否都有工号
          const existingUser = nameMap[name]
          const currentHasEmployeeNo = user.employee_no || user.employeeNo
          const existingHasEmployeeNo = existingUser.employee_no || existingUser.employeeNo
          
          // 如果当前用户有工号而现有用户没有，则替换
          if (currentHasEmployeeNo && !existingHasEmployeeNo) {
            nameMap[name] = user
          }
          // 如果都有工号，则保留第一个
        }
      })
      // 将去重后的用户转换为数组
      filtered = Object.values(nameMap)
      return filtered
    },
    
    // 公司全员列表
    allEmployees() {
      const employees = []
      
      console.log('组织树数据:', this.organizationTree)
      
      // 遍历组织树，收集所有用户
      const traverse = (nodes, parentDepartmentId = null, parentTeamId = null) => {
        if (!nodes || !Array.isArray(nodes)) return
        
        nodes.forEach(node => {
          console.log('遍历节点:', node)
          
          // 更新当前节点的部门和小组ID
          let currentDepartmentId = parentDepartmentId
          let currentTeamId = parentTeamId
          
          if (node.type === 'department') {
            currentDepartmentId = node.departmentId
          } else if (node.type === 'team') {
            currentDepartmentId = node.departmentId
            currentTeamId = node.teamId
          } else if (node.type === 'user') {
            // 从父节点获取部门和小组ID，同时也检查用户节点本身是否有这些属性
            const deptId = node.department_id || node.departmentId || currentDepartmentId
            const teamId = node.team_id || node.teamId || currentTeamId
            
            employees.push({
              id: node.userId,
              name: node.name,
              gender: node.gender,
              position: node.position,
              employee_no: node.employee_no,
              join_date: node.join_date,
              department_id: deptId,
              team_id: teamId,
              status: node.status
            })
          }
          
          // 递归处理子节点，传递当前的部门和小组ID
          if (node.children && node.children.length > 0) {
            traverse(node.children, currentDepartmentId, currentTeamId)
          }
        })
      }
      
      traverse(this.organizationTree)
      
      console.log('收集到的员工数据:', employees)
      
      // 去重处理
      const nameMap = {}
      employees.forEach(user => {
        // 过滤离职员工（只有管理员可以看到离职员工）
        if (!this.isAdmin && user.status === 'resigned') {
          return
        }
        
        const name = user.name
        if (!nameMap[name]) {
          nameMap[name] = user
        } else {
          // 如果已有相同姓名的用户，检查是否都有工号
          const existingUser = nameMap[name]
          const currentHasEmployeeNo = user.employee_no || user.employeeNo
          const existingHasEmployeeNo = existingUser.employee_no || existingUser.employeeNo
          
          // 如果当前用户有工号而现有用户没有，则替换
          if (currentHasEmployeeNo && !existingHasEmployeeNo) {
            nameMap[name] = user
          }
          // 如果都有工号，则保留第一个
        }
      })
      
      const result = Object.values(nameMap)
      console.log('去重后的员工数据:', result)
      
      return result
    }
  },
  mounted() {
    this.fetchOrganizationData()
    this.fetchUsers()
    this.fetchPositions()
  },
  methods: {
    // 获取组织架构数据
    async fetchOrganizationData() {
      try {
        const token = localStorage.getItem('token') || ''
        console.log('获取组织架构数据，token:', token)
        
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/teams/organization/tree`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        console.log('组织架构 API 响应状态:', response.status)
        const result = await response.json()
        console.log('组织架构 API 返回:', result)
        
        if (result.success) {
          // API 返回的 data 就是树形结构数组
          let treeData = Array.isArray(result.data) ? result.data : (result.data.tree || [])
          
          // 按部门编码从小到大排序部门节点
          const sortDepartmentsByCode = (nodes) => {
            if (!nodes || !Array.isArray(nodes)) return
            
            // 对当前节点的子节点按部门编码排序（仅对部门节点）
            if (nodes.length > 0) {
              nodes.sort((a, b) => {
                // 如果都是部门节点，按部门编码排序
                if (a.type === 'department' && b.type === 'department') {
                  const codeA = a.department_code || a.code || ''
                  const codeB = b.department_code || b.code || ''
                  return codeA.localeCompare(codeB, undefined, { numeric: true })
                }
                // 如果一个是部门一个不是，部门在前
                if (a.type === 'department') return -1
                if (b.type === 'department') return 1
                // 其他情况保持原有顺序
                return 0
              })
            }
            
            // 递归处理子节点
            nodes.forEach(node => {
              if (node.children && node.children.length > 0) {
                sortDepartmentsByCode(node.children)
              }
            })
          }
          
          // 先排序，再添加节点ID
          sortDepartmentsByCode(treeData)

          this.organizationTree = treeData
          // 从树中提取部门和小组信息
          this.extractDepartmentsAndTeams(this.organizationTree)
          // 恢复之前保存的展开状态，如果没有则默认展开公司节点
          const savedExpandedKeys = localStorage.getItem('organizationExpandedKeys')
          if (savedExpandedKeys) {
            const parsedKeys = JSON.parse(savedExpandedKeys)
            this.expandedKeys = parsedKeys.map(k => String(k))
            localStorage.setItem('organizationExpandedKeys', JSON.stringify(this.expandedKeys))
          } else {
            this.expandedKeys = ['0'] // 默认展开公司节点（字符串类型，与后端一致）
          }
          console.log('组织树数据:', this.organizationTree)
          console.log('部门列表:', this.departments)
          console.log('小组列表:', this.teams)
          console.log('展开状态:', this.expandedKeys)
        } else {
          console.error('获取组织架构数据失败:', result.message)
        }
      } catch (error) {
        console.error('获取组织架构数据异常:', error)
      }
    },

    // 从组织树中提取部门、小组和用户权限信息
    extractDepartmentsAndTeams(tree) {
      // 清空旧数据
      this.departments = []
      this.teams = []
      this.userPermissionsMap = new Map() // 用于存储用户ID到权限的映射
      
      console.log('开始提取组织树数据:', tree)
      
      // 递归遍历组织树
      const traverse = (nodes) => {
        if (!nodes || !Array.isArray(nodes)) {
          console.log('不是有效数组:', nodes)
          return
        }
        
        nodes.forEach(node => {
          console.log('处理节点:', node)
          
          // 处理部门节点
          if (node.type === 'department') {
            const deptId = node.departmentId
            console.log('添加部门:', node.name, 'ID:', deptId)
            // 直接使用后端提供的权限数据
            const permissions = this.getPermissions(node.permissions)
            this.departments.push({
              id: deptId,
              name: node.name,
              icon: node.icon,
              color: node.color,
              manager: node.manager,
              department_code: node.department_code || node.code,
              headcount: node.headcount,
              permissions: permissions
            })
          } 
          // 处理小组节点
          else if (node.type === 'team') {
            const teamId = node.teamId
            const deptId = node.departmentId
            console.log('添加小组:', node.name, 'ID:', teamId, '部门ID:', deptId)
            // 直接使用后端提供的权限数据
            const permissions = this.getPermissions(node.permissions)
            this.teams.push({
              id: teamId,
              name: node.name,
              department_id: deptId,
              permissions: permissions
            })
          }
          // 处理用户节点，提取权限信息
          else if (node.type === 'user') {
            const userId = node.userId
            if (userId && node.permissions) {
              console.log('添加用户权限:', node.name, 'ID:', userId, '权限:', node.permissions)
              // 直接使用后端提供的权限数据
              const permissions = this.getPermissions(node.permissions)
              this.userPermissionsMap.set(userId, permissions)
            }
          }
          // 递归处理子节点
          if (node.children && node.children.length > 0) {
            console.log('处理子节点:', node.name, '子节点数量:', node.children.length)
            traverse(node.children)
          }
        })
      }
      
      traverse(tree)
      console.log('提取的部门列表:', this.departments)
      console.log('提取的小组列表:', this.teams)
      console.log('提取的用户权限映射:', this.userPermissionsMap)
    },

    // 获取用户数据
    async fetchUsers() {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/auth/users`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        })
        const result = await response.json()
        if (result.success) {
          this.users = result.data || []
          // 合并用户权限信息
          this.mergeUserPermissions()
        }
      } catch (error) {
        console.error('获取用户数据失败:', error)
      }
    },
    
    // 获取权限数据，确保包含所有权限模块和权限项
    getPermissions(permissions) {
      console.log('getPermissions - 输入权限数据:', permissions)
      
      // 定义所有可能的权限操作项的默认值
      const defaultActions = { view: false, add: false, edit: false, delete: false, apply: false, approve: false }
      
      // 定义所有权限模块的默认结构
      const defaultPermissions = {
        crm: { ...defaultActions },
        sales: { ...defaultActions },
        projects: { ...defaultActions },
        technical: { ...defaultActions },
        srm: { ...defaultActions },
        warehouse: { ...defaultActions },
        quality: { ...defaultActions },
        hr: { ...defaultActions },
        admin: { ...defaultActions },
        production: { ...defaultActions },
        rnd: { ...defaultActions },
        afterSales: { ...defaultActions },
        document: { ...defaultActions },
        knowledge: { ...defaultActions },
        report: { ...defaultActions }
      }
      
      // 如果后端返回了有效权限数据，则覆盖默认值
      if (permissions && typeof permissions === 'object' && !Array.isArray(permissions)) {
        // 创建一个深拷贝，避免修改原始默认值
        const mergedPermissions = JSON.parse(JSON.stringify(defaultPermissions))
        
        // 遍历后端返回的权限模块
        Object.keys(permissions).forEach(module => {
          if (typeof module === 'string' && module in mergedPermissions) {
            const modulePermissions = permissions[module]
            if (modulePermissions && typeof modulePermissions === 'object' && !Array.isArray(modulePermissions)) {
              // 遍历后端返回的权限操作项，并覆盖默认值
              Object.keys(modulePermissions).forEach(action => {
                if (typeof action === 'string' && action in mergedPermissions[module]) {
                  // 只在后端明确提供了值时才覆盖默认值
                  // 这样可以确保后端可以设置权限为false，而不仅仅是undefined
                  mergedPermissions[module][action] = modulePermissions[action]
                  console.log(`  覆盖权限: ${module}.${action} = ${modulePermissions[action]}`)
                }
              })
            }
          }
        })
        
        console.log('getPermissions - 输出权限数据:', mergedPermissions)
        return mergedPermissions
      }
      
      // 如果后端返回的权限数据为空或无效，则返回默认权限结构
      console.log('getPermissions - 输出默认权限结构:', defaultPermissions)
      return defaultPermissions
    },
    
    // 合并用户权限信息
    mergeUserPermissions() {
      if (!this.userPermissionsMap || this.userPermissionsMap.size === 0) {
        console.log('没有用户权限信息需要合并')
        return
      }
      
      console.log('开始合并用户权限信息')
      this.users = this.users.map(user => {
        // 从权限映射中获取用户权限
        const permissions = this.userPermissionsMap.get(user.id)
        if (permissions) {
          console.log('合并用户权限:', user.name, 'ID:', user.id, '权限:', permissions)
          // 直接使用后端提供的权限数据
          const userPermissions = this.getPermissions(permissions)
          return { ...user, permissions: userPermissions }
        }
        return user
      })
      console.log('合并后的用户数据:', this.users)
    },

    // 获取职位数据
    async fetchPositions() {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/positions`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        })
        const result = await response.json()
        if (result.success) {
          this.positions = result.data || []
        }
      } catch (error) {
        console.error('获取职位数据失败:', error)
      }
    },

    // 处理节点点击
    handleNodeClick(data) {
      // 如果是部门节点，从 this.departments 中获取包含权限的完整信息
      if (data.type === 'department') {
        const deptId = data.departmentId
        const fullDeptInfo = this.departments.find(d => d.id === deptId)
        if (fullDeptInfo) {
          this.selectedNode = { ...fullDeptInfo, type: 'department', departmentId: deptId }
        } else {
          this.selectedNode = data
        }
      }
      // 如果是小组节点，从 this.teams 中获取包含权限的完整信息
      else if (data.type === 'team') {
        const teamId = data.teamId
        const fullTeamInfo = this.teams.find(t => t.id === teamId)
        if (fullTeamInfo) {
          this.selectedNode = { ...fullTeamInfo, type: 'team', teamId: teamId, departmentId: data.departmentId }
        } else {
          this.selectedNode = data
        }
      }
      // 其他类型节点直接使用
      else {
        this.selectedNode = data
      }
      
      // 当点击公司节点时，显示公司全员的员工列表
      if (data.type === 'company') {
        // 这里可以添加显示全员列表的逻辑
      }
    },

    // 获取负责人姓名
    getManagerName(managerId) {
      if (!managerId || managerId === '0' || managerId === 0 || managerId === '') return '-'
      const user = this.users.find(u => u.id === Number(managerId))
      return user ? user.name : '-'
    },

    // 获取节点用户数
    getNodeUserCount(node) {
      // 过滤条件：有工号且非离职（只有管理员可以看到离职员工）
      const userFilter = (user) => {
        const hasEmployeeNo = user.employee_no || user.employeeNo
        const isResigned = user.status === 'resigned'
        return hasEmployeeNo && (this.isAdmin || !isResigned)
      }
      
      if (node.type === 'department') {
        // 计算部门总人数 = 直接属于该部门的用户 + 所有小组的用户
        const deptId = node.departmentId
        const deptIdNumber = Number(deptId)
        
        console.log('计算部门人数:', node.name, 'deptId:', deptId, 'deptIdNumber:', deptIdNumber)
        
        // 直接属于部门的用户（添加类型转换）
        const directUsers = this.users.filter(u => {
          const userDeptId = Number(u.department_id || u.departmentId || u.dept_id)
          return userDeptId === deptIdNumber && !u.team_id && userFilter(u)
        }).length
        console.log('直接用户数:', directUsers)
        
        // 属于该部门下所有小组的用户
        const deptTeams = this.teams.filter(t => {
          const teamDeptId = Number(t.department_id || t.departmentId)
          return teamDeptId === deptIdNumber
        })
        console.log('部门下小组数量:', deptTeams.length)
        
        const teamUserCount = deptTeams.reduce((sum, team) => {
          const teamId = Number(team.id || team.teamId)
          const teamUsers = this.users.filter(u => {
            const userTeamId = Number(u.team_id || u.teamId)
            return userTeamId === teamId && userFilter(u)
          }).length
          console.log('小组', team.name, '用户数:', teamUsers)
          return sum + teamUsers
        }, 0)
        console.log('小组用户数:', teamUserCount)
        
        const total = directUsers + teamUserCount
        console.log('部门', node.name, '总人数:', total)
        return total
      } else if (node.type === 'team') {
        const teamId = Number(node.teamId)
        const teamUsers = this.users.filter(u => {
          const userTeamId = Number(u.team_id || u.teamId)
          return userTeamId === teamId && userFilter(u)
        }).length
        console.log('小组', node.name, '用户数:', teamUsers)
        return teamUsers
      }
      return 0
    },

    // 获取小组负责人姓名
    getTeamLeaderName(team) {
      const teamId = Number(team.teamId || team.id)
      const teamUsers = this.users.filter(u => {
        const userTeamId = Number(u.team_id || u.teamId)
        return userTeamId === teamId
      })
      if (teamUsers.length === 0) return '-'
      // 假设有职位字段，优先找职位高的，否则返回第一个
      const leader = teamUsers.find(u => u.position && u.position.includes('主管')) || teamUsers[0]
      return leader ? leader.name : '-'
    },

    // 获取部门名称
    getDepartmentName(user) {
      if (!user.department_id) return '-'
      const dept = this.departments.find(d => d.id === user.department_id)
      return dept ? dept.name : '-'
    },

    // 获取小组名称
    getTeamName(user) {
      if (!user.team_id) return '-'
      const team = this.teams.find(t => t.id === user.team_id)
      return team ? team.name : '-'
    },

    // 获取模块名称
    getModuleName(module) {
      const moduleNames = {
        crm: 'CRM管理',
        sales: '销售管理',
        projects: '项目管理',
        technical: '技术管理',
        srm: 'SRM管理',
        warehouse: '仓库管理',
        quality: '质量管理',
        hr: '人力资源',
        admin: '行政管理',
        production: '生产制造',
        rnd: '研发管理',
        afterSales: '售后服务',
        document: '文件管理',
        knowledge: '知识库',
        report: '经营报报'
      }
      return moduleNames[module] || module
    },

    // 获取部门数量
    getDepartmentCount() {
      // 从组织树中计算部门数量
      let count = 0
      const countDepartments = (nodes) => {
        nodes.forEach(node => {
          if (node.type === 'department') {
            count++
          }
          if (node.children && node.children.length > 0) {
            countDepartments(node.children)
          }
        })
      }
      countDepartments(this.organizationTree)
      return count
    },

    // 获取总员工数量
    getTotalEmployeeCount() {
      // 只计算有工号的员工，并且非离职员工（只有管理员可以看到离职员工）
      let filtered = this.users.filter(user => user.employee_no || user.employeeNo)
      if (!this.isAdmin) {
        filtered = filtered.filter(user => user.status !== 'resigned')
      }
      return filtered.length
    },

    // 显示所有组织成员
    showAllOrganizationMembers() {
      this.showAllMembers = !this.showAllMembers
    },

    // 处理节点展开事件
    handleNodeExpand(data, node) {
      const nodeId = data.id
      if (!this.expandedKeys.includes(nodeId)) {
        this.expandedKeys.push(nodeId)
        // 保存展开状态到本地存储
        localStorage.setItem('organizationExpandedKeys', JSON.stringify(this.expandedKeys))
      }
    },

    // 处理节点折叠事件
    handleNodeCollapse(data, node) {
      const nodeId = data.id
      this.expandedKeys = this.expandedKeys.filter(id => id !== nodeId)
      // 保存展开状态到本地存储
      localStorage.setItem('organizationExpandedKeys', JSON.stringify(this.expandedKeys))
    },

    // 处理节点展开/缩合事件（保留兼容性）
    handleExpandChange(node, expanded) {
      // 这个方法现在由handleNodeExpand和handleNodeCollapse替代
      console.log('handleExpandChange called:', node, expanded)
    },

    // 组织架构部门列表
    organizationDepartments() {
      const departments = []
      
      // 去重函数
      const deduplicateUsers = (users) => {
        const nameMap = {}
        users.forEach(user => {
          const name = user.name
          if (!nameMap[name]) {
            nameMap[name] = user
          } else {
            // 如果已有相同姓名的用户，检查是否都有工号
            const existingUser = nameMap[name]
            const currentHasEmployeeNo = user.employee_no || user.employeeNo
            const existingHasEmployeeNo = existingUser.employee_no || existingUser.employeeNo
            
            // 如果当前用户有工号而现有用户没有，则替换
            if (currentHasEmployeeNo && !existingHasEmployeeNo) {
              nameMap[name] = user
            }
            // 如果都有工号，则保留第一个
          }
        })
        return Object.values(nameMap)
      }
      
      // 遍历组织树，构建部门和小组的人员列表
      const traverse = (nodes) => {
        if (!nodes || !Array.isArray(nodes)) return
        
        nodes.forEach(node => {
          if (node.type === 'department') {
            // 构建部门对象
            const dept = {
              id: node.departmentId,
              name: node.name,
              directUsers: [], // 部门直接成员（没有小组的用户）
              teams: [] // 部门下的小组
            }
            
            // 处理部门的子节点
            if (node.children && node.children.length > 0) {
              node.children.forEach(child => {
                if (child.type === 'user') {
                  // 添加部门直接成员
                  dept.directUsers.push({
                    id: child.userId,
                    name: child.name,
                    gender: child.gender,
                    position: child.position,
                    employee_no: child.employee_no,
                    join_date: child.join_date
                  })
                } else if (child.type === 'team') {
                  // 构建小组对象
                  const team = {
                    id: child.teamId,
                    name: child.name,
                    users: [] // 小组成员
                  }
                  
                  // 添加小组成员
                  if (child.children && child.children.length > 0) {
                    child.children.forEach(user => {
                      if (user.type === 'user') {
                        team.users.push({
                          id: user.userId,
                          name: user.name,
                          gender: user.gender,
                          position: user.position,
                          employee_no: user.employee_no,
                          join_date: user.join_date,
                          team_id: child.teamId
                        })
                      }
                    })
                  }
                  
                  // 对小组成员去重
                  team.users = deduplicateUsers(team.users)
                  dept.teams.push(team)
                }
              })
            }
            
            // 对部门直接成员去重
            dept.directUsers = deduplicateUsers(dept.directUsers)
            departments.push(dept)
          }
          
          // 递归处理子节点
          if (node.children && node.children.length > 0) {
            traverse(node.children)
          }
        })
      }
      
      traverse(this.organizationTree)
      return departments
    },
    


    // 格式化日期
    formatDate(dateStr) {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}年${month}月${day}日`
    },

    // 处理用户行点击
    handleUserRowClick(row) {
      this.selectedNode = {
        ...row,
        type: 'user'
      }
    },

    // 添加子小组
    handleAddSubTeam(team) {
      this.teamForm = {
        id: null,
        name: '',
        department_id: team.departmentId,
        parent_team_id: team.teamId,
        permissions: {} // 权限由后端设置默认值，前端不设置
      }
      this.showTeamDialog = true
    },

    // 添加根部门
    handleAddRootDept() {
      this.deptForm = {
        id: null,
        name: '',
        department_code: '',
        managerId: 0,
        headcount: 0,
        icon: 'fa-building',
        color: '#165DFF',
        permissions: {} // 权限由后端设置默认值，前端不设置
      }
      this.showAddDeptDialog = true
    },

    // 编辑节点
    handleEditNode(dept) {
      console.log('编辑部门 - 原始数据:', dept)
      console.log('编辑部门 - permissions:', dept.permissions)
      // 直接使用后端提供的权限数据
      const permissions = this.getPermissions(dept.permissions)
      this.deptForm = {
        id: dept.id,
        name: dept.name || '',
        department_code: dept.department_code !== null && dept.department_code !== undefined ? String(dept.department_code) : '',
        managerId: dept.manager !== null && dept.manager !== undefined && dept.manager !== '' ? Number(dept.manager) : 0,
        headcount: dept.headcount || 0,
        icon: dept.icon || 'fa-building',
        color: dept.color || '#165DFF',
        permissions: permissions
      }
      this.showAddDeptDialog = true
    },

    // 保存部门
    async saveDepartment() {
      try {
        console.log('保存部门 - deptForm:', this.deptForm)
        console.log('保存部门 - permissions:', this.deptForm.permissions)
        const url = this.deptForm.id
          ? `${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/departments/${this.deptForm.id}`
          : `${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/departments`

        const method = this.deptForm.id ? 'PUT' : 'POST'

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify({
            name: this.deptForm.name,
            department_code: this.deptForm.department_code || null,
            manager: this.deptForm.managerId === 0 ? null : this.deptForm.managerId,
            headcount: this.deptForm.headcount,
            icon: this.deptForm.icon,
            color: this.deptForm.color,
            permissions: this.deptForm.permissions
          })
        })

        const result = await response.json()
        if (result.success) {
          this.$message.success(this.deptForm.id ? '部门更新成功' : '部门创建成功')
          this.showAddDeptDialog = false
          await this.fetchOrganizationData()
          await this.fetchUsers()
        } else {
          this.$message.error(result.message || '操作失败')
        }
      } catch (error) {
        console.error('保存部门失败:', error)
        this.$message.error('保存失败，请重试')
      }
    },

    // 添加小组
    handleAddTeam(dept) {
      this.teamForm = {
        id: null,
        name: '',
        department_id: dept.departmentId,
        parent_team_id: null,
        permissions: {} // 权限由后端设置默认值，前端不设置
      }
      this.showTeamDialog = true
    },

    // 编辑小组
    handleEditTeam(team) {
      console.log('编辑小组 - 原始数据:', team)
      console.log('编辑小组 - permissions:', team.permissions)
      // 直接使用后端提供的权限数据
      const permissions = this.getPermissions(team.permissions)
      this.teamForm = {
        id: team.teamId || team.id,
        name: team.name,
        department_id: team.departmentId,
        parent_team_id: team.parent_team_id || null,
        permissions: permissions
      }
      this.isEditTeam = true
      this.showTeamDialog = true
    },

    // 保存小组
    async saveTeam() {
      try {
        const url = this.teamForm.id
          ? `${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/teams/${this.teamForm.id}`
          : `${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/teams`

        const method = this.teamForm.id ? 'PUT' : 'POST'

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify({
            name: this.teamForm.name,
            department_id: this.teamForm.department_id,
            parent_team_id: this.teamForm.parent_team_id,
            permissions: this.teamForm.permissions
          })
        })

        const result = await response.json()
        if (result.success) {
          this.$message.success(this.teamForm.id ? '小组更新成功' : '小组创建成功')
          this.showTeamDialog = false
          this.isEditTeam = false
          await this.fetchOrganizationData()
        } else {
          this.$message.error(result.message || '操作失败')
        }
      } catch (error) {
        console.error('保存小组失败:', error)
        this.$message.error('保存失败，请重试')
      }
    },

    // 删除节点
    handleDeleteNode(node) {
      this.$confirm('确定要删除该节点吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const url = node.type === 'department'
            ? `${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/departments/${node.departmentId}`
            : `${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/teams/${node.teamId}`

          const response = await fetch(url, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
          })

          const result = await response.json()
          if (result.success) {
            this.$message.success('删除成功')
            this.selectedNode = null
            await this.fetchOrganizationData()
          } else {
            this.$message.error(result.message || '删除失败')
          }
        } catch (error) {
          console.error('删除失败:', error)
          this.$message.error('删除失败，请重试')
        }
      })
    },

    // 添加用户
    handleAddUser() {
      this.userForm = {
        id: null,
        username: '',
        name: '',
        gender: 'male',
        password: '',
        position: '',
        employeeNo: '',
        email: '',
        joinDate: '',
        department_id: null,
        team_id: null,
        permissions: {} // 权限由后端设置默认值，前端不设置
      }
      this.isEdit = false
      this.showAddDialog = true
    },

    // 添加用户到节点
    handleAddUserToNode(node) {
      this.userForm = {
        id: null,
        username: '',
        name: '',
        gender: 'male',
        password: '',
        position: '',
        employeeNo: '',
        email: '',
        joinDate: '',
        department_id: node.type === 'department' ? node.departmentId : null,
        team_id: node.type === 'team' ? node.teamId : null,
        permissions: {} // 权限由后端设置默认值，前端不设置
      }
      this.isEdit = false
      this.showAddDialog = true
    },

    // 编辑用户
    handleEditUser(user) {
      console.log('编辑用户 - 原始数据:', user)
      // 直接使用后端提供的权限数据
      const permissions = this.getPermissions(user.permissions)
      this.userForm = {
        id: user.id,
        name: user.name,
        gender: user.gender || 'male',
        password: '',
        position: user.position || '',
        employeeNo: user.employeeNo || user.employee_no || String(user.employeeNo) || '',
        email: user.email || '',
        joinDate: user.joinDate || user.join_date || '',
        department_id: user.department_id || user.departmentId || user.department_id || user.dept_id,
        team_id: user.team_id || user.teamId || user.team_id,
        permissions: permissions
      }
      console.log('编辑用户 - 表单数据:', this.userForm)
      this.isEdit = true
      this.showAddDialog = true
    },

    // 保存用户
    async saveUser() {
      try {
        const url = this.isEdit
          ? `${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/auth/users/${this.userForm.id}`
          : `${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/auth/users`

        const method = this.isEdit ? 'PUT' : 'POST'

        const body = {
          name: this.userForm.name,
          gender: this.userForm.gender || 'male',
          position: this.userForm.position || '',
          employee_no: this.userForm.employeeNo,
          email: this.userForm.email || '',
          join_date: this.userForm.joinDate || null,
          department_id: this.userForm.department_id,
          team_id: this.userForm.team_id || null,
          permissions: this.userForm.permissions || {}
        }

        if (!this.isEdit && this.userForm.password) {
          body.password = this.userForm.password
        }

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify(body)
        })

        const result = await response.json()
        if (result.success) {
          this.$message.success(this.isEdit ? '用户更新成功' : '用户创建成功')
          this.showAddDialog = false
          await this.fetchUsers()
          await this.fetchOrganizationData()
          if (this.isEdit && this.selectedNode && this.selectedNode.type === 'user') {
            const updatedUser = this.users.find(u => u.id === this.userForm.id)
            if (updatedUser) {
              this.selectedNode = { ...updatedUser, type: 'user' }
            }
          }
        } else {
          this.$message.error(result.message || '操作失败')
        }
      } catch (error) {
        console.error('保存用户失败:', error)
        this.$message.error('保存失败，请重试')
      }
    },

    // 处理员工离职
    handleResignUser(user) {
      this.$confirm('确定要将该员工标记为离职吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const userData = {
            name: user?.name || '',
            gender: user?.gender || 'male',
            position: user?.position || '',
            employee_no: user?.employee_no || user?.employeeNo || '',
            email: user?.email || '',
            join_date: user?.join_date || user?.joinDate || '',
            department_id: user?.department_id || user?.departmentId || null,
            team_id: user?.team_id || user?.teamId || null,
            status: 'resigned'
          }

          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/auth/users/${user?.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            },
            body: JSON.stringify(userData)
          })

          const result = await response.json()
          if (result.success) {
            this.$message.success('员工已标记为离职')
            await this.fetchUsers()
            await this.fetchOrganizationData()
          } else {
            this.$message.error(result.message || '操作失败')
          }
        } catch (error) {
          console.error('标记离职失败:', error)
          this.$message.error('操作失败，请重试')
        }
      })
    },

    // 处理员工激活
    handleActivateUser(user) {
      this.$confirm('确定要激活该员工吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'primary'
      }).then(async () => {
        try {
          const userData = {
            name: user?.name || '',
            gender: user?.gender || 'male',
            position: user?.position || '',
            employee_no: user?.employee_no || user?.employeeNo || '',
            email: user?.email || '',
            join_date: user?.join_date || user?.joinDate || '',
            department_id: user?.department_id || user?.departmentId || null,
            team_id: user?.team_id || user?.teamId || null,
            status: 'active'
          }

          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/auth/users/${user?.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            },
            body: JSON.stringify(userData)
          })

          const result = await response.json()
          if (result.success) {
            this.$message.success('员工已激活')
            await this.fetchUsers()
            await this.fetchOrganizationData()
          } else {
            this.$message.error(result.message || '操作失败')
          }
        } catch (error) {
          console.error('激活员工失败:', error)
          this.$message.error('操作失败，请重试')
        }
      })
    },

    // 删除用户
    handleDeleteUser(user) {
      this.$confirm('确定要删除该用户吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/auth/users/${user.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
          })

          const result = await response.json()
          if (result.success) {
            this.$message.success('删除成功')
            await this.fetchUsers()
            await this.fetchOrganizationData()
          } else {
            this.$message.error(result.message || '删除失败')
          }
        } catch (error) {
          console.error('删除失败:', error)
          this.$message.error('删除失败，请重试')
        }
      })
    },


  }
}
</script>

<style scoped>
.user-management-container {
  display: flex;
  height: calc(100vh - 84px);
  overflow: hidden;
}

.sidebar {
  width: 280px;
  background: #fff;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
}

.tree-panel-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e8e8e8;
  background: #fafafa;
  align-items: center;
  width: 100%;
}

.header-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.btn-group {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
}

.header-buttons .header-btn {
  flex: 1;
  min-width: 80px;
}

.permission-settings {
  padding: 10px 0;
}

.permission-module {
  margin-bottom: 15px;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 4px;
}

.permission-module h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.permission-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.permission-actions .el-checkbox {
  margin-right: 0;
}

.tree-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.organization-tree {
  width: 100%;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  transition: all 0.2s;
}

.tree-node:hover {
  background: #f0f0f0;
}

.tree-node .node-icon {
  width: 20px;
  text-align: center;
}

.tree-node .node-label {
  flex: 1;
  font-size: 14px;
}

.tree-node .node-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tree-node .node-position {
  font-size: 12px;
  color: #999;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
}

.tree-node .node-count {
  font-size: 12px;
  color: #bbb;
  margin-left: 4px;
}

.content-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 16px 24px;
  border-bottom: 1px solid #e8e8e8;
  background: #fff;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.panel-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: #fff;
  margin: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.company-overview {
  padding: 24px;
  background: #fafafa;
  border-radius: 8px;
}

.company-overview h3 {
  margin: 0 0 24px 0;
  font-size: 18px;
  color: #333;
}

.overview-stats {
  display: flex;
  gap: 48px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 36px;
  font-weight: 600;
  color: #165DFF;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
}

.detail-section {
  max-width: 800px;
}

.detail-form {
  background: #fafafa;
  padding: 24px;
  border-radius: 8px;
}

.detail-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e8e8e8;
}

.user-list-section {
  margin-top: 24px;
}



.section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.all-organization-members {
  margin-top: 20px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 4px;
}

.department-section {
  margin-bottom: 25px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.department-section h5 {
  margin: 0;
  padding: 10px 15px;
  background: #f0f0f0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.team-section {
  margin: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.team-section h6 {
  margin: 0;
  padding: 8px 12px;
  background: #f5f5f5;
  font-size: 13px;
  font-weight: 600;
  color: #666;
}

.department-direct-users {
  margin: 15px;
}

.user-table {
  width: 100%;
}
</style>
