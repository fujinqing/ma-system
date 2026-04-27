<template>
  <div class="organization-management">
    <el-card shadow="hover" class="mb-4">
      <template #header>
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-bold">组织架构和人员管理</h3>
          <div>
            <el-button type="primary" @click="addDepartment">
              <i class="fa fa-building mr-2"></i>添加部门
            </el-button>
            <el-button type="success" @click="addEmployee" class="ml-2">
              <i class="fa fa-user-plus mr-2"></i>添加人员
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="organization-tree mb-6">
        <h4 class="font-bold mb-3">组织架构</h4>
        <el-tree
          :data="organizationTree"
          :props="treeProps"
          node-key="id"
          default-expand-all
          @node-click="handleNodeClick"
        >
          <template #default="{ node, data }">
            <div class="flex items-center justify-between w-full">
              <div class="flex items-center">
              <i v-if="data.type === 'department'" class="fa fa-building text-blue-500 mr-2"></i>
              <i v-else class="fa fa-user text-green-500 mr-2"></i>
              <span>{{ data.name }}</span>
              <span v-if="data.managerName" class="text-xs text-gray-500 ml-2">(负责人: {{ data.managerName }})</span>
              <span v-else-if="data.type === 'employee'" class="text-xs text-gray-500 ml-2">{{ data.position }}</span>
            </div>
              <div class="node-actions">
                <el-button size="small" @click="editNode(data)">
                  <i class="fa fa-edit"></i>
                </el-button>
                <el-button size="small" type="danger" @click="deleteNode(data.id)">
                  <i class="fa fa-trash"></i>
                </el-button>
              </div>
            </div>
          </template>
        </el-tree>
      </div>
      
      <div class="employee-list">
        <div class="flex justify-between items-center mb-4">
          <h4 class="font-bold">人员列表</h4>
          <div class="flex items-center">
            <el-input v-model="searchKeyword" placeholder="搜索人员" style="width: 200px; margin-right: 10px"></el-input>
            <el-button type="primary" @click="searchEmployees">搜索</el-button>
          </div>
        </div>
        
        <el-table :data="employees" style="width: 100%">
          <el-table-column prop="name" label="姓名" width="120"></el-table-column>
          <el-table-column prop="position" label="职位" width="150"></el-table-column>
          <el-table-column prop="department" label="部门" width="150"></el-table-column>
          <el-table-column prop="phone" label="电话" width="150"></el-table-column>
          <el-table-column prop="email" label="邮箱"></el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.status === 'active' ? 'success' : 'info'">{{ scope.row.status === 'active' ? '在职' : '离职' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="scope">
              <el-button size="small" type="primary" @click="editEmployee(scope.row.id)">
                <i class="fa fa-edit"></i>
              </el-button>
              <el-button size="small" type="danger" @click="deleteEmployee(scope.row.id)">
                <i class="fa fa-trash"></i>
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination mt-4">
          <el-pagination
            background
            layout="prev, pager, next"
            :total="total"
            :page-size="10"
            @current-change="handleCurrentChange"
          ></el-pagination>
        </div>
      </div>
    </el-card>
    
    <!-- 添加/编辑部门对话框 -->
    <el-dialog :title="isEditingDepartment ? '编辑部门' : '添加部门'" v-model="departmentDialogVisible" width="400px">
      <el-form :model="departmentForm" :rules="departmentRules" ref="departmentForm" label-width="80px">
        <el-form-item label="部门名称" prop="name">
          <el-input v-model="departmentForm.name" placeholder="输入部门名称"></el-input>
        </el-form-item>
        <el-form-item label="上级部门">
          <el-select v-model="departmentForm.parentId" placeholder="选择上级部门" style="width: 100%">
            <el-option label="无" value="0"></el-option>
            <el-option v-for="dept in departments" :key="dept.id" :label="dept.name" :value="dept.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="部门负责人">
          <el-select v-model="departmentForm.managerId" placeholder="选择部门负责人" style="width: 100%">
            <el-option label="无" value="0"></el-option>
            <el-option v-for="emp in employees" :key="emp.id" :label="emp.name" :value="emp.id"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="departmentDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveDepartment">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 添加/编辑人员对话框 -->
    <el-dialog :title="isEditingEmployee ? '编辑人员' : '添加人员'" v-model="employeeDialogVisible" width="600px">
      <el-form :model="employeeForm" :rules="employeeRules" ref="employeeForm" label-width="100px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="employeeForm.name" placeholder="输入姓名"></el-input>
        </el-form-item>
        <el-form-item label="职位" prop="position">
          <el-input v-model="employeeForm.position" placeholder="输入职位"></el-input>
        </el-form-item>
        <el-form-item label="部门" prop="departmentId">
          <el-select v-model="employeeForm.departmentId" placeholder="选择部门" style="width: 100%">
            <el-option v-for="dept in departments" :key="dept.id" :label="dept.name" :value="dept.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="employeeForm.phone" placeholder="输入电话"></el-input>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="employeeForm.email" placeholder="输入邮箱"></el-input>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="employeeForm.status">
            <el-radio label="active">在职</el-radio>
            <el-radio label="inactive">离职</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="employeeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveEmployee">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'OrganizationManagement',
  data() {
    return {
      organizationTree: [
        {
          id: 1,
          name: '采购部',
          type: 'department',
          managerName: '张三',
          children: [
            {
              id: 2,
              name: '采购一组',
              type: 'department',
              managerName: '张三',
              children: [
                { id: 7, name: '张三', type: 'employee', position: '采购经理' },
                { id: 8, name: '李四', type: 'employee', position: '采购员' }
              ]
            },
            {
              id: 3,
              name: '采购二组',
              type: 'department',
              managerName: '王五',
              children: [
                { id: 9, name: '王五', type: 'employee', position: '采购主管' },
                { id: 10, name: '赵六', type: 'employee', position: '采购员' }
              ]
            }
          ]
        },
        {
          id: 4,
          name: '供应商管理部',
          type: 'department',
          managerName: '钱七',
          children: [
            { id: 11, name: '钱七', type: 'employee', position: '供应商管理员' }
          ]
        },
        {
          id: 5,
          name: '合同管理部',
          type: 'department',
          managerName: '孙八',
          children: [
            { id: 12, name: '孙八', type: 'employee', position: '合同管理员' }
          ]
        }
      ],
      treeProps: {
        children: 'children',
        label: 'name'
      },
      departments: [
        { id: 1, name: '采购部' },
        { id: 2, name: '采购一组' },
        { id: 3, name: '采购二组' },
        { id: 4, name: '供应商管理部' },
        { id: 5, name: '合同管理部' }
      ],
      searchKeyword: '',
      total: 20,
      employees: [
        { id: 7, name: '张三', position: '采购经理', department: '采购一组', phone: '13800138001', email: 'zhangsan@example.com', status: 'active' },
        { id: 8, name: '李四', position: '采购员', department: '采购一组', phone: '13800138002', email: 'lisi@example.com', status: 'active' },
        { id: 9, name: '王五', position: '采购主管', department: '采购二组', phone: '13800138003', email: 'wangwu@example.com', status: 'active' },
        { id: 10, name: '赵六', position: '采购员', department: '采购二组', phone: '13800138004', email: 'zhaoliu@example.com', status: 'active' },
        { id: 11, name: '钱七', position: '供应商管理员', department: '供应商管理部', phone: '13800138005', email: 'qianqi@example.com', status: 'active' },
        { id: 12, name: '孙八', position: '合同管理员', department: '合同管理部', phone: '13800138006', email: 'sunba@example.com', status: 'active' }
      ],
      departmentDialogVisible: false,
      employeeDialogVisible: false,
      isEditingDepartment: false,
      isEditingEmployee: false,
      departmentForm: {
        name: '',
        parentId: '0',
        managerId: '0'
      },
      employeeForm: {
        name: '',
        position: '',
        departmentId: '',
        phone: '',
        email: '',
        status: 'active'
      },
      departmentRules: {
        name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }]
      },
      employeeRules: {
        name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
        position: [{ required: true, message: '请输入职位', trigger: 'blur' }],
        departmentId: [{ required: true, message: '请选择部门', trigger: 'change' }],
        phone: [{ required: true, message: '请输入电话', trigger: 'blur' }],
        email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }, { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }]
      }
    }
  },
  methods: {
    addDepartment() {
      this.isEditingDepartment = false
      this.departmentForm = {
        name: '',
        parentId: '0',
        managerId: '0'
      }
      this.departmentDialogVisible = true
    },
    editDepartment(id) {
      this.isEditingDepartment = true
      // 模拟加载部门数据
      this.departmentForm = {
        name: '采购一组',
        parentId: '1',
        managerId: '7'
      }
      this.departmentDialogVisible = true
    },
    deleteDepartment(id) {
      this.$confirm('确定要删除此部门吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$message.success('部门已删除')
      })
    },
    saveDepartment() {
      this.$refs.departmentForm.validate((valid) => {
        if (valid) {
          this.$message.success(this.isEditingDepartment ? '部门更新成功' : '部门添加成功')
          this.departmentDialogVisible = false
        }
      })
    },
    addEmployee() {
      this.isEditingEmployee = false
      this.employeeForm = {
        name: '',
        position: '',
        departmentId: '',
        phone: '',
        email: '',
        status: 'active'
      }
      this.employeeDialogVisible = true
    },
    editEmployee(id) {
      this.isEditingEmployee = true
      // 模拟加载人员数据
      this.employeeForm = {
        name: '张三',
        position: '采购经理',
        departmentId: '2',
        phone: '13800138001',
        email: 'zhangsan@example.com',
        status: 'active'
      }
      this.employeeDialogVisible = true
    },
    deleteEmployee(id) {
      this.$confirm('确定要删除此人员吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$message.success('人员已删除')
      })
    },
    saveEmployee() {
      this.$refs.employeeForm.validate((valid) => {
        if (valid) {
          this.$message.success(this.isEditingEmployee ? '人员更新成功' : '人员添加成功')
          this.employeeDialogVisible = false
        }
      })
    },
    handleNodeClick(data) {
      if (data.type === 'department') {
        // 加载该部门的人员
        this.employees = this.employees.filter(emp => emp.department === data.name)
      }
    },
    editNode(data) {
      if (data.type === 'department') {
        this.editDepartment(data.id)
      } else {
        this.editEmployee(data.id)
      }
    },
    deleteNode(id) {
      this.$confirm('确定要删除此节点吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$message.success('节点已删除')
      })
    },
    searchEmployees() {
      this.$message.info('搜索功能已触发')
    },
    handleCurrentChange(page) {
      console.log('Current page:', page)
    }
  }
}
</script>

<style scoped>
.organization-management {
  padding: 20px;
}

.organization-tree {
  border: 1px solid #eaeaea;
  border-radius: 4px;
  padding: 10px;
  max-height: 400px;
  overflow-y: auto;
}

.pagination {
  display: flex;
  justify-content: center;
}

.node-actions {
  display: flex;
  gap: 5px;
}
</style>