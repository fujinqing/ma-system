<template>
  <el-dialog
    v-model="localVisible"
    title="人员管理"
    fullscreen
    class="staff-management-dialog"
  >
    <div class="staff-management-container">
      <div class="staff-sidebar">
        <div class="sidebar-header">
          <span class="title">组织架构</span>
        </div>
        <el-tree
          ref="staffOrgTree"
          :data="staffOrganizationTree"
          :props="staffTreeProps"
          node-key="id"
          :default-expanded-keys="staffExpandedKeys"
          :expand-on-click-node="true"
          :highlight-current="true"
          @node-click="handleStaffNodeClick"
          class="staff-org-tree"
        >
          <template #default="{ node, data }">
            <div class="staff-tree-node" :class="`node-${data.type}`">
              <div class="node-icon" v-if="data.type === 'company'">
                <i class="fa fa-building-o" style="color: #165DFF;"></i>
              </div>
              <div class="node-icon" v-else-if="data.type === 'department'">
                <i :class="data.icon || 'fa fa-building'" :style="{ color: data.color || '#165DFF' }"></i>
              </div>
              <div class="node-icon" v-else-if="data.type === 'team'">
                <i class="fa fa-object-group" style="color: #722ED1;"></i>
              </div>
              <span class="node-label">{{ node.label }}</span>
              <span class="node-count" v-if="data.type === 'department' || data.type === 'team'">
                ({{ data.userCount || 0 }}人)
              </span>
            </div>
          </template>
        </el-tree>
      </div>

      <div class="staff-content">
        <div class="content-header">
          <div class="header-info">
            <span class="current-org" v-if="currentStaffNode">
              {{ currentStaffNode.name }}
            </span>
            <span class="user-count" v-if="currentStaffNode">
              {{ currentStaffNode.userCount || 0 }} 人
            </span>
          </div>
          <div class="header-actions">
            <el-input
              v-model="staffSearchText"
              placeholder="搜索人员..."
              prefix-icon="el-icon-search"
              size="small"
              style="width: 200px"
            />
          </div>
        </div>

        <div class="staff-cards-container">
          <div
            v-for="user in filteredStaffUsers"
            :key="user.id"
            class="staff-user-card"
            draggable="true"
            @dragstart="handleDragStart($event, user)"
            @dragend="handleDragEnd($event)"
          >
            <div class="user-avatar">
              <i class="fa fa-user"></i>
            </div>
            <div class="user-info">
              <div class="user-name">
                {{ user.name }}
                <span class="gender-badge" :class="user.gender === 'female' ? 'female' : 'male'" style="margin-left: 8px;">
                  {{ user.gender === 'female' ? '♀' : '♂' }}
                </span>
              </div>
              <div class="user-details">
                <div class="user-position">{{ user.position || '未设置岗位' }}</div>
                <div class="user-employee-no">{{ user.employeeNo || user.employee_no || '无编号' }}</div>
              </div>
            </div>
            <div class="user-email" v-if="user.email">
              <i class="fa fa-envelope"></i>
              {{ user.email }}
            </div>
            <div class="user-join-date" v-if="user.join_date || user.joinDate">
              <i class="fa fa-calendar"></i>
              入职：{{ formatDate(user.join_date || user.joinDate) }}
            </div>
            <div class="user-department">
              <i class="fa fa-building"></i>
              {{ getDepartmentName(user.department_id) }}
            </div>
            <div class="user-team" v-if="user.team_id">
              <i class="fa fa-object-group"></i>
              {{ getTeamName(user.team_id) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: 'StaffManagement',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    departments: {
      type: Array,
      default: () => []
    },
    teams: {
      type: Array,
      default: () => []
    },
    users: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:visible', 'user-moved'],
  data() {
    return {
      staffOrganizationTree: [],
      staffExpandedKeys: [],
      staffTreeProps: {
        label: 'name',
        children: 'children',
        isLeaf: (data) => data.type === 'user'
      },
      currentStaffNode: null,
      staffSearchText: '',
      draggedUser: null
    }
  },
  computed: {
    localVisible: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      }
    },
    filteredStaffUsers() {
      if (!this.currentStaffNode) {
        return this.users.filter(user => {
          if (!this.staffSearchText) return true
          return user.name.includes(this.staffSearchText) ||
                 (user.employeeNo && user.employeeNo.toString().includes(this.staffSearchText)) ||
                 (user.employee_no && user.employee_no.toString().includes(this.staffSearchText))
        })
      }

      let userIds = []
      if (this.currentStaffNode.type === 'department') {
        userIds = this.users
          .filter(u => u.department_id === this.currentStaffNode.departmentId)
          .map(u => u.id)
      } else if (this.currentStaffNode.type === 'team') {
        userIds = this.users
          .filter(u => u.team_id === this.currentStaffNode.teamId)
          .map(u => u.id)
      }

      return this.users.filter(user => {
        if (!userIds.includes(user.id)) return false
        if (!this.staffSearchText) return true
        return user.name.includes(this.staffSearchText) ||
               (user.employeeNo && user.employeeNo.toString().includes(this.staffSearchText)) ||
               (user.employee_no && user.employee_no.toString().includes(this.staffSearchText))
      })
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.buildStaffOrganizationTree()
      } else {
        this.currentStaffNode = null
        this.staffSearchText = ''
      }
    }
  },
  methods: {
    buildStaffOrganizationTree() {
      // 直接使用父组件传递的 departments 和 teams 构建树形结构
      const companyNode = {
        id: 0,
        name: '曼弗莱德智能制造',
        type: 'company',
        children: []
      }

      // 按部门分组
      this.departments.forEach(dept => {
        const deptNode = {
          id: `dept_${dept.id}`,
          name: dept.name,
          type: 'department',
          departmentId: dept.id,
          icon: dept.icon,
          color: dept.color,
          userCount: this.getDeptUserCount(dept.id),
          children: []
        }

        // 查找该部门下的所有一级团队（没有父团队的团队）
        const deptTeams = this.teams.filter(t => t.department_id === dept.id && !t.parent_team_id)
        deptTeams.forEach(team => {
          const teamNode = {
            id: `team_${team.id}`,
            name: team.name,
            type: 'team',
            teamId: team.id,
            departmentId: dept.id,
            parent_team_id: team.parent_team_id,
            userCount: this.getTeamUserCount(team.id),
            children: []
          }

          // 查找该团队下的子团队
          const subTeams = this.teams.filter(t => t.parent_team_id === team.id)
          subTeams.forEach(subTeam => {
            const subTeamNode = {
              id: `team_${subTeam.id}`,
              name: subTeam.name,
              type: 'team',
              teamId: subTeam.id,
              departmentId: dept.id,
              parent_team_id: subTeam.parent_team_id,
              userCount: this.getTeamUserCount(subTeam.id),
              children: []
            }
            teamNode.children.push(subTeamNode)
          })

          deptNode.children.push(teamNode)
        })

        companyNode.children.push(deptNode)
      })

      this.staffOrganizationTree = [companyNode]
      this.staffExpandedKeys = [0]
    },

    getDeptUserCount(deptId) {
      const deptIdNumber = Number(deptId)
      return this.users.filter(u => {
        const userDeptId = Number(u.department_id || u.departmentId)
        return userDeptId === deptIdNumber
      }).length
    },

    getTeamUserCount(teamId) {
      const teamIdNumber = Number(teamId)
      return this.users.filter(u => {
        const userTeamId = Number(u.team_id || u.teamId)
        return userTeamId === teamIdNumber
      }).length
    },

    getDepartmentName(deptId) {
      if (!deptId) return '未分配'
      const dept = this.departments.find(d => d.id === deptId)
      return dept ? dept.name : '未知部门'
    },

    getTeamName(teamId) {
      if (!teamId) return ''
      const team = this.teams.find(t => t.id === teamId)
      return team ? team.name : '未知小组'
    },

    formatDate(dateStr) {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}年${month}月${day}日`
    },

    handleStaffNodeClick(data) {
      if (data.type === 'company') {
        this.currentStaffNode = null
      } else {
        this.currentStaffNode = data
      }
    },

    handleDragStart(event, user) {
      this.draggedUser = user
      event.dataTransfer.setData('text/plain', JSON.stringify(user))
      event.dataTransfer.effectAllowed = 'move'
    },

    handleDragEnd(event) {
      this.draggedUser = null
    },

    handleDrop(event) {
      event.preventDefault()
      
      if (!this.draggedUser || !this.currentStaffNode) return
      if (this.currentStaffNode.type === 'company') return

      this.$emit('user-moved', {
        user: this.draggedUser,
        targetNode: this.currentStaffNode
      })
    }
  }
}
</script>

<style scoped>
/* 人员管理样式 */
.staff-management-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.staff-management-container {
  display: flex;
  height: calc(100vh - 120px);
}

.staff-sidebar {
  width: 300px;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  background: #fafafa;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
  background: #fff;
}

.sidebar-header .title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.staff-org-tree {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.staff-tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  transition: all 0.2s;
}

.staff-tree-node:hover {
  background: #f0f0f0;
}

.staff-tree-node .node-icon {
  width: 20px;
  text-align: center;
}

.staff-tree-node .node-label {
  flex: 1;
  font-size: 14px;
}

.staff-tree-node .node-count {
  font-size: 12px;
  color: #999;
}

.staff-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e8e8e8;
  background: #fafafa;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-info .current-org {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.header-info .user-count {
  font-size: 14px;
  color: #666;
  background: #e6f7ff;
  padding: 4px 12px;
  border-radius: 12px;
}

.staff-cards-container {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  align-content: start;
}

.staff-user-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
  cursor: grab;
}

.staff-user-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #165DFF;
  transform: translateY(-2px);
}

.staff-user-card:active {
  cursor: grabbing;
}

.staff-user-card .user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 24px;
  align-self: center;
}

.staff-user-card .user-info {
  text-align: center;
}

.staff-user-card .user-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.staff-user-card .gender-badge {
  display: inline-block;
  width: 20px;
  height: 20px;
  line-height: 20px;
  text-align: center;
  border-radius: 50%;
  font-size: 12px;
  color: #fff;
}

.staff-user-card .gender-badge.male {
  background: #409eff;
}

.staff-user-card .gender-badge.female {
  background: #f56c6c;
}

.staff-user-card .user-details {
  display: flex;
  justify-content: center;
  gap: 12px;
  font-size: 12px;
  color: #666;
}

.staff-user-card .user-position {
  color: #165DFF;
  font-weight: 500;
}

.staff-user-card .user-employee-no {
  color: #999;
}

.staff-user-card .user-email,
.staff-user-card .user-join-date {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  color: #666;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
  margin-top: 4px;
}

.staff-user-card .user-email i,
.staff-user-card .user-join-date i {
  font-size: 12px;
  color: #999;
}

.staff-user-card .user-department,
.staff-user-card .user-team {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  color: #666;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
}

.staff-user-card .user-department i,
.staff-user-card .user-team i {
  font-size: 12px;
  color: #999;
}
</style>
