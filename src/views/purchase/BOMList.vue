<template>
  <div class="bom-list">
    <div class="page-header">
      <h2 class="page-title">BOM管理</h2>
      <el-button type="primary" @click="addBOM">
        <i class="fa fa-plus"></i> 添加BOM
      </el-button>
      <el-button type="success" @click="decomposeBOM">
        <i class="fa fa-sync"></i> 自动分解
      </el-button>
    </div>
    
    <div class="search-bar">
      <el-select v-model="selectedProject" placeholder="选择项目">
        <el-option v-for="project in projects" :key="project.id" :label="project.name" :value="project.id"></el-option>
      </el-select>
      <el-select v-model="selectedItemType" placeholder="物料类型">
        <el-option label="全部" value=""></el-option>
        <el-option label="机加件" value="机加件"></el-option>
        <el-option label="电气标准件" value="电气标准件"></el-option>
        <el-option label="机械标准件" value="机械标准件"></el-option>
        <el-option label="焊接件" value="焊接件"></el-option>
        <el-option label="钣金件" value="钣金件"></el-option>
        <el-option label="劳保" value="劳保"></el-option>
        <el-option label="耗材" value="耗材"></el-option>
      </el-select>
      <el-button type="primary" @click="search">搜索</el-button>
    </div>
    
    <el-table :data="boms" style="width: 100%" border>
      <el-table-column prop="id" label="BOM ID" width="80"></el-table-column>
      <el-table-column prop="project_name" label="项目名称" min-width="150"></el-table-column>
      <el-table-column prop="item_name" label="物料名称" min-width="150"></el-table-column>
      <el-table-column prop="item_type" label="物料类型" width="120">
        <template #default="scope">
          <el-tag :type="getItemTypeColor(scope.row.item_type)">{{ scope.row.item_type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="quantity" label="数量" width="80"></el-table-column>
      <el-table-column prop="unit" label="单位" width="80"></el-table-column>
      <el-table-column prop="cost" label="成本(元)" width="100"></el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="editBOM(scope.row.id)">
            编辑
          </el-button>
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
  </div>
</template>

<script>
export default {
  name: 'BOMList',
  data() {
    return {
      boms: [
        {
          id: 1,
          project_name: '项目1',
          item_name: '机加件1',
          item_type: '机加件',
          quantity: 10,
          unit: '个',
          cost: 100
        },
        {
          id: 2,
          project_name: '项目1',
          item_name: '电气标准件1',
          item_type: '电气标准件',
          quantity: 20,
          unit: '个',
          cost: 50
        },
        {
          id: 3,
          project_name: '项目1',
          item_name: '机械标准件1',
          item_type: '机械标准件',
          quantity: 15,
          unit: '个',
          cost: 80
        },
        {
          id: 4,
          project_name: '项目2',
          item_name: '焊接件1',
          item_type: '焊接件',
          quantity: 5,
          unit: '个',
          cost: 200
        },
        {
          id: 5,
          project_name: '项目2',
          item_name: '钣金件1',
          item_type: '钣金件',
          quantity: 8,
          unit: '个',
          cost: 150
        },
        {
          id: 6,
          project_name: '项目3',
          item_name: '劳保用品1',
          item_type: '劳保',
          quantity: 50,
          unit: '个',
          cost: 20
        },
        {
          id: 7,
          project_name: '项目3',
          item_name: '耗材1',
          item_type: '耗材',
          quantity: 100,
          unit: '个',
          cost: 10
        }
      ],
      projects: [
        { id: 1, name: '项目1' },
        { id: 2, name: '项目2' },
        { id: 3, name: '项目3' }
      ],
      selectedProject: '',
      selectedItemType: '',
      currentPage: 1,
      pageSize: 10,
      total: 7
    }
  },
  methods: {
    getItemTypeColor(itemType) {
      switch (itemType) {
        case '机加件':
          return 'primary'
        case '电气标准件':
          return 'success'
        case '机械标准件':
          return 'warning'
        case '焊接件':
          return 'info'
        case '钣金件':
          return 'danger'
        case '劳保':
          return 'purple'
        case '耗材':
          return 'blue'
        default:
          return ''
      }
    },
    addBOM() {
      // 添加BOM
      console.log('添加BOM')
    },
    decomposeBOM() {
      // 自动分解BOM
      this.$confirm('确定要自动分解BOM吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        setTimeout(() => {
          this.$message.success('BOM分解成功')
          // 模拟分解结果
          console.log('BOM自动分解成功')
        }, 1000)
      })
    },
    editBOM(id) {
      // 编辑BOM
      console.log('编辑BOM:', id)
    },
    search() {
      // 模拟搜索操作
      console.log('搜索:', this.selectedProject, this.selectedItemType)
    },
    handleSizeChange(size) {
      this.pageSize = size
      // 模拟分页操作
    },
    handleCurrentChange(current) {
      this.currentPage = current
      // 模拟分页操作
    }
  }
}
</script>

<style scoped>
.bom-list {
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
  gap: 10px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-right: auto;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>