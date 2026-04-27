<template>
  <div class="material-management">
    <el-card shadow="hover" class="mb-4">
      <template #header>
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-bold">物料和品类管理</h3>
          <div>
            <el-button type="primary" @click="addMaterial">
              <i class="fa fa-plus mr-2"></i>添加物料
            </el-button>
            <el-button type="success" @click="addCategory" class="ml-2">
              <i class="fa fa-folder-plus mr-2"></i>添加品类
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="category-tree mb-6">
        <h4 class="font-bold mb-3">品类树</h4>
        <el-tree
          :data="categoryTree"
          :props="treeProps"
          node-key="id"
          default-expand-all
          @node-click="handleCategoryClick"
        >
          <template #default="{ node, data }">
            <div class="flex items-center justify-between w-full">
              <span>{{ data.name }}</span>
              <div class="category-actions">
                <el-button size="small" @click="editCategory(data.id)">
                  <i class="fa fa-edit"></i>
                </el-button>
                <el-button size="small" type="danger" @click="deleteCategory(data.id)">
                  <i class="fa fa-trash"></i>
                </el-button>
              </div>
            </div>
          </template>
        </el-tree>
      </div>
      
      <div class="material-list">
        <div class="flex justify-between items-center mb-4">
          <h4 class="font-bold">{{ currentCategory ? currentCategory.name : '所有物料' }}</h4>
          <div class="flex items-center">
            <el-input v-model="searchKeyword" placeholder="搜索物料" style="width: 200px; margin-right: 10px"></el-input>
            <el-button type="primary" @click="searchMaterials">搜索</el-button>
          </div>
        </div>
        
        <el-table :data="materials" style="width: 100%">
          <el-table-column prop="code" label="物料编码" width="150"></el-table-column>
          <el-table-column prop="name" label="物料名称" width="200"></el-table-column>
          <el-table-column prop="spec" label="规格型号"></el-table-column>
          <el-table-column prop="category" label="所属品类" width="150"></el-table-column>
          <el-table-column prop="unit" label="单位" width="80"></el-table-column>
          <el-table-column prop="minStock" label="最小库存" width="100"></el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="scope">
              <el-button size="small" type="primary" @click="editMaterial(scope.row.id)">
                <i class="fa fa-edit"></i>
              </el-button>
              <el-button size="small" type="danger" @click="deleteMaterial(scope.row.id)">
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
    
    <!-- 添加/编辑物料对话框 -->
    <el-dialog :title="isEditingMaterial ? '编辑物料' : '添加物料'" v-model="materialDialogVisible" width="600px">
      <el-form :model="materialForm" :rules="materialRules" ref="materialForm" label-width="120px">
        <el-form-item label="物料编码" prop="code">
          <el-input v-model="materialForm.code" placeholder="输入物料编码"></el-input>
        </el-form-item>
        <el-form-item label="物料名称" prop="name">
          <el-input v-model="materialForm.name" placeholder="输入物料名称"></el-input>
        </el-form-item>
        <el-form-item label="规格型号" prop="spec">
          <el-input v-model="materialForm.spec" placeholder="输入规格型号"></el-input>
        </el-form-item>
        <el-form-item label="所属品类" prop="categoryId">
          <el-select v-model="materialForm.categoryId" placeholder="选择品类" style="width: 100%">
            <el-option v-for="category in allCategories" :key="category.id" :label="category.name" :value="category.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="materialForm.unit" placeholder="输入单位"></el-input>
        </el-form-item>
        <el-form-item label="最小库存" prop="minStock">
          <el-input-number v-model="materialForm.minStock" :min="0" style="width: 100%"></el-input-number>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="materialDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveMaterial">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 添加/编辑品类对话框 -->
    <el-dialog :title="isEditingCategory ? '编辑品类' : '添加品类'" v-model="categoryDialogVisible" width="400px">
      <el-form :model="categoryForm" :rules="categoryRules" ref="categoryForm" label-width="80px">
        <el-form-item label="品类名称" prop="name">
          <el-input v-model="categoryForm.name" placeholder="输入品类名称"></el-input>
        </el-form-item>
        <el-form-item label="父品类">
          <el-select v-model="categoryForm.parentId" placeholder="选择父品类" style="width: 100%">
            <el-option label="根品类" value="0"></el-option>
            <el-option v-for="category in allCategories" :key="category.id" :label="category.name" :value="category.id"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="categoryDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveCategory">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'MaterialManagement',
  data() {
    return {
      categoryTree: [
        {
          id: 1,
          name: '原材料',
          children: [
            { id: 2, name: '金属材料' },
            { id: 3, name: '非金属材料' }
          ]
        },
        {
          id: 4,
          name: '半成品',
          children: [
            { id: 5, name: '机械配件' },
            { id: 6, name: '电气配件' }
          ]
        },
        {
          id: 7,
          name: '成品'
        }
      ],
      treeProps: {
        children: 'children',
        label: 'name'
      },
      allCategories: [
        { id: 1, name: '原材料' },
        { id: 2, name: '金属材料' },
        { id: 3, name: '非金属材料' },
        { id: 4, name: '半成品' },
        { id: 5, name: '机械配件' },
        { id: 6, name: '电气配件' },
        { id: 7, name: '成品' }
      ],
      currentCategory: null,
      searchKeyword: '',
      total: 0,
      materials: [],
      materialDialogVisible: false,
      categoryDialogVisible: false,
      isEditingMaterial: false,
      isEditingCategory: false,
      materialForm: {
        code: '',
        name: '',
        specification: '',
        category: '',
        unit: '',
        supplier_id: null,
        price: 0,
        min_order_quantity: 0
      },
      categoryForm: {
        name: '',
        parentId: '0'
      },
      materialRules: {
        code: [{ required: true, message: '请输入物料编码', trigger: 'blur' }],
        name: [{ required: true, message: '请输入物料名称', trigger: 'blur' }],
        unit: [{ required: true, message: '请输入单位', trigger: 'blur' }]
      },
      categoryRules: {
        name: [{ required: true, message: '请输入品类名称', trigger: 'blur' }]
      }
    }
  },
  mounted() {
    this.loadMaterials()
  },
  methods: {
    async loadMaterials() {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/purchase/materials`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        })
        const result = await response.json()
        if (result.success) {
          this.materials = result.data
          this.total = this.materials.length
        }
      } catch (error) {
        console.error('获取物料数据失败:', error)
      }
    },
    addMaterial() {
      this.isEditingMaterial = false
      this.materialForm = {
        code: '',
        name: '',
        spec: '',
        categoryId: '',
        unit: '',
        minStock: 0
      }
      this.materialDialogVisible = true
    },
    editMaterial(id) {
      this.isEditingMaterial = true
      // 模拟加载物料数据
      this.materialForm = {
        code: 'MAT001',
        name: '钢材',
        spec: 'Q235',
        categoryId: '2',
        unit: 'kg',
        minStock: 1000
      }
      this.materialDialogVisible = true
    },
    async deleteMaterial(id) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/purchase/materials/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        })
        this.$message.success('物料已删除')
        this.loadMaterials()
      } catch (error) {
        console.error('删除物料失败:', error)
        this.$message.error('删除失败')
      }
    },
    async saveMaterial() {
      this.$refs.materialForm.validate(async (valid) => {
        if (valid) {
          try {
            if (this.isEditingMaterial) {
              await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/purchase/materials/${this.materialForm.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                },
                body: JSON.stringify(this.materialForm)
              })
            } else {
              await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/purchase/materials`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                },
                body: JSON.stringify(this.materialForm)
              })
            }
            this.$message.success(this.isEditingMaterial ? '物料更新成功' : '物料添加成功')
            this.materialDialogVisible = false
            this.loadMaterials()
          } catch (error) {
            console.error('保存物料失败:', error)
            this.$message.error('保存失败')
          }
        }
      })
    },
    addCategory() {
      this.isEditingCategory = false
      this.categoryForm = {
        name: '',
        parentId: '0'
      }
      this.categoryDialogVisible = true
    },
    editCategory(id) {
      this.isEditingCategory = true
      // 模拟加载品类数据
      this.categoryForm = {
        name: '金属材料',
        parentId: '1'
      }
      this.categoryDialogVisible = true
    },
    deleteCategory(id) {
      this.$confirm('确定要删除此品类吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$message.success('品类已删除')
      })
    },
    saveCategory() {
      this.$refs.categoryForm.validate((valid) => {
        if (valid) {
          this.$message.success(this.isEditingCategory ? '品类更新成功' : '品类添加成功')
          this.categoryDialogVisible = false
        }
      })
    },
    handleCategoryClick(data) {
      this.currentCategory = data
      // 模拟加载该品类下的物料
      this.materials = [
        { id: 1, code: 'MAT001', name: '钢材', spec: 'Q235', category: data.name, unit: 'kg', minStock: 1000 },
        { id: 2, code: 'MAT002', name: '铝材', spec: '6061', category: data.name, unit: 'kg', minStock: 500 }
      ]
    },
    searchMaterials() {
      this.$message.info('搜索功能已触发')
    },
    handleCurrentChange(page) {
      console.log('Current page:', page)
    }
  }
}
</script>

<style scoped>
.material-management {
  padding: 20px;
}

.category-tree {
  border: 1px solid #eaeaea;
  border-radius: 4px;
  padding: 10px;
  max-height: 300px;
  overflow-y: auto;
}

.pagination {
  display: flex;
  justify-content: center;
}

.category-actions {
  display: flex;
  gap: 5px;
}
</style>