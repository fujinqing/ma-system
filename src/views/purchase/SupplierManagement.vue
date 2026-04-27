<template>
  <div class="supplier-management">
    <div class="page-header">
      <h2 class="page-title">供应商管理</h2>
      <el-button type="primary" @click="addSupplier">
        <i class="fa fa-plus"></i> 新建供应商
      </el-button>
    </div>
    
    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索供应商名称或编码"
        prefix-icon="el-icon-search"
        style="width: 300px;"
      ></el-input>
      <el-select v-model="selectedStatus" placeholder="选择状态">
        <el-option label="全部" value=""></el-option>
        <el-option label="合格" value="qualified"></el-option>
        <el-option label="待审核" value="pending"></el-option>
        <el-option label="不合格" value="unqualified"></el-option>
      </el-select>
      <el-button type="primary" @click="search">搜索</el-button>
    </div>
    
    <el-table :data="suppliers" style="width: 100%" border>
      <el-table-column prop="code" label="供应商编码" width="120"></el-table-column>
      <el-table-column prop="name" label="供应商名称" min-width="180"></el-table-column>
      <el-table-column prop="contact" label="联系人" width="100"></el-table-column>
      <el-table-column prop="phone" label="联系电话" width="130"></el-table-column>
      <el-table-column prop="category" label="供应类别" width="120"></el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 'qualified'" type="success">合格</el-tag>
          <el-tag v-else-if="scope.row.status === 'pending'" type="warning">待审核</el-tag>
          <el-tag v-else type="danger">不合格</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="rating" label="评级" width="80">
        <template #default="scope">
          <el-rate v-model="scope.row.rating" disabled></el-rate>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="150"></el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="viewSupplier(scope.row.id)">查看</el-button>
          <el-button type="success" size="small" @click="editSupplier(scope.row.id)">编辑</el-button>
          <el-button type="warning" size="small" @click="qualifySupplier(scope.row.id)" v-if="scope.row.status === 'pending'">审核</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      ></el-pagination>
    </div>
    
    <!-- 供应商表单对话框 -->
    <el-dialog
      v-model="supplierDialogVisible"
      :title="isEditSupplier ? '编辑供应商' : '新建供应商'"
      width="70%"
      destroy-on-close
    >
      <div class="supplier-form">
        <el-form :model="supplierForm" :rules="supplierRules" ref="supplierFormRef" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="供应商编码" prop="code">
                <el-input v-model="supplierForm.code" placeholder="请输入供应商编码" :disabled="isEditSupplier"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="供应商名称" prop="name">
                <el-input v-model="supplierForm.name" placeholder="请输入供应商名称"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="联系人" prop="contact">
                <el-input v-model="supplierForm.contact" placeholder="请输入联系人"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="联系电话" prop="phone">
                <el-input v-model="supplierForm.phone" placeholder="请输入联系电话"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="供应类别" prop="category">
                <el-select v-model="supplierForm.category" placeholder="请选择供应类别" style="width: 100%">
                  <el-option label="电子元器件" value="electronics"></el-option>
                  <el-option label="机械零件" value="mechanical"></el-option>
                  <el-option label="电气设备" value="electrical"></el-option>
                  <el-option label="原材料" value="raw_material"></el-option>
                  <el-option label="其他" value="other"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="邮箱" prop="email">
                <el-input v-model="supplierForm.email" placeholder="请输入邮箱"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="地址" prop="address">
            <el-input v-model="supplierForm.address" placeholder="请输入地址"></el-input>
          </el-form-item>
          <el-form-item label="银行信息" prop="bankInfo">
            <el-input v-model="supplierForm.bankInfo" placeholder="请输入银行信息"></el-input>
          </el-form-item>
          <el-form-item label="资质文件" prop="qualification">
            <el-upload
              class="upload-demo"
              action="#"
              :auto-upload="false"
              :on-change="handleFileChange"
              :file-list="fileList"
            >
              <el-button type="primary">
                <i class="el-icon-upload"></i> 选择文件
              </el-button>
              <template #tip>
                <div class="el-upload__tip">
                  支持上传PDF、图片等格式文件
                </div>
              </template>
            </el-upload>
          </el-form-item>
          <el-form-item label="备注" prop="remark">
            <el-input v-model="supplierForm.remark" type="textarea" :rows="3" placeholder="请输入备注"></el-input>
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="supplierDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveSupplier">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'SupplierManagement',
  data() {
    return {
      suppliers: [],
      searchQuery: '',
      selectedStatus: '',
      currentPage: 1,
      pageSize: 10,
      total: 0,
      supplierDialogVisible: false,
      isEditSupplier: false,
      supplierForm: {
        id: '',
        code: '',
        name: '',
        contact: '',
        phone: '',
        category: '',
        email: '',
        address: '',
        bankInfo: '',
        remark: ''
      },
      supplierRules: {
        code: [
          { required: true, message: '请输入供应商编码', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '请输入供应商名称', trigger: 'blur' }
        ],
        contact: [
          { required: true, message: '请输入联系人', trigger: 'blur' }
        ],
        phone: [
          { required: true, message: '请输入联系电话', trigger: 'blur' }
        ],
        category: [
          { required: true, message: '请选择供应类别', trigger: 'blur' }
        ]
      },
      fileList: []
    }
  },
  mounted() {
    this.loadSuppliers()
  },
  methods: {
    async loadSuppliers() {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/purchase/suppliers`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        })
        const result = await response.json()
        if (result.success) {
          this.suppliers = result.data
          this.total = this.suppliers.length
        }
      } catch (error) {
        console.error('获取供应商数据失败:', error)
      }
    },
    addSupplier() {
      this.isEditSupplier = false
      this.supplierForm = {
        id: '',
        code: '',
        name: '',
        contact: '',
        phone: '',
        category: '',
        email: '',
        address: '',
        bankInfo: '',
        remark: ''
      }
      this.fileList = []
      this.supplierDialogVisible = true
    },
    viewSupplier(id) {
      console.log('查看供应商:', id)
    },
    editSupplier(id) {
      this.isEditSupplier = true
      const supplier = this.suppliers.find(s => s.id === id)
      if (supplier) {
        this.supplierForm = {
          id: supplier.id,
          code: supplier.code,
          name: supplier.name,
          contact: supplier.contact,
          phone: supplier.phone,
          category: supplier.category,
          email: '',
          address: '',
          bankInfo: '',
          remark: ''
        }
        this.fileList = []
        this.supplierDialogVisible = true
      }
    },
    async saveSupplier() {
      this.$refs.supplierFormRef.validate(async (valid) => {
        if (valid) {
          try {
            if (this.isEditSupplier) {
              await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/purchase/suppliers/${this.supplierForm.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                },
                body: JSON.stringify(this.supplierForm)
              })
              this.$message.success('更新成功')
            } else {
              await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/purchase/suppliers`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                },
                body: JSON.stringify(this.supplierForm)
              })
              this.$message.success('创建成功')
            }
            this.supplierDialogVisible = false
            this.loadSuppliers()
          } catch (error) {
            console.error('保存供应商失败:', error)
            this.$message.error('保存失败')
          }
        }
      })
    },
    async qualifySupplier(id) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/purchase/suppliers/${id}/qualify`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        })
        this.$message.success('审核成功')
        this.loadSuppliers()
      } catch (error) {
        console.error('审核供应商失败:', error)
        this.$message.error('审核失败')
      }
    },
    handleFileChange(file, fileList) {
      this.fileList = fileList
    },
    search() {
      console.log('搜索:', this.searchQuery, this.selectedStatus)
    },
    handleSizeChange(size) {
      this.pageSize = size
      this.loadSuppliers()
    },
    handleCurrentChange(current) {
      this.currentPage = current
      this.loadSuppliers()
    }
  }
}
</script>

<style scoped>
.supplier-management {
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

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.supplier-form {
  padding: 20px 0;
}

@media (max-width: 768px) {
  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-bar .el-input {
    width: 100% !important;
  }
}
</style>