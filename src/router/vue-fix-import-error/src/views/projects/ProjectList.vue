<template>
  <div class="project-list">
    <h1>项目管理</h1>
    <div class="project-table">
      <table>
        <thead>
          <tr>
            <th>项目编号</th>
            <th>项目名称</th>
            <th>负责人</th>
            <th>开始日期</th>
            <th>结束日期</th>
            <th>进度</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="project in projects" :key="project.id">
            <td>{{ project.code }}</td>
            <td>{{ project.name }}</td>
            <td>{{ project.manager }}</td>
            <td>{{ project.startDate }}</td>
            <td>{{ project.endDate }}</td>
            <td>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: project.progress + '%' }"></div>
                <span class="progress-text">{{ project.progress }}%</span>
              </div>
            </td>
            <td>
              <span :class="`status-${project.status}`">{{ project.statusText }}</span>
            </td>
            <td>
              <button @click="viewProject(project.id)" class="btn-view">查看</button>
              <button @click="editProject(project.id)" class="btn-edit">编辑</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="pagination">
      <button @click="prevPage" :disabled="currentPage === 1">上一页</button>
      <span>{{ currentPage }} / {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage === totalPages">下一页</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProjectList',
  data() {
    return {
      projects: [
        {
          id: 1,
          code: 'XM2024001',
          name: '企业ERP系统升级',
          manager: '张三',
          startDate: '2024-01-10',
          endDate: '2024-06-30',
          progress: 65,
          status: 'active',
          statusText: '进行中'
        },
        {
          id: 2,
          code: 'XM2024002',
          name: '移动端APP开发',
          manager: '李四',
          startDate: '2024-02-15',
          endDate: '2024-08-15',
          progress: 40,
          status: 'active',
          statusText: '进行中'
        },
        {
          id: 3,
          code: 'XM2024003',
          name: '数据中心迁移',
          manager: '王五',
          startDate: '2024-01-01',
          endDate: '2024-03-31',
          progress: 100,
          status: 'completed',
          statusText: '已完成'
        },
        {
          id: 4,
          code: 'XM2024004',
          name: '安全审计系统',
          manager: '赵六',
          startDate: '2024-03-10',
          endDate: '2024-09-10',
          progress: 25,
          status: 'active',
          statusText: '进行中'
        }
      ],
      currentPage: 1,
      pageSize: 10,
      totalPages: 1
    }
  },
  mounted() {
    this.calculateTotalPages();
    this.loadProjects();
  },
  methods: {
    loadProjects() {
      // 实际项目中这里应该调用API获取数据
      console.log('加载项目列表数据');
    },
    viewProject(id) {
      this.$router.push(`/project/view/${id}`);
    },
    editProject(id) {
      this.$router.push(`/project/edit/${id}`);
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.loadProjects();
      }
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.loadProjects();
      }
    },
    calculateTotalPages() {
      this.totalPages = Math.ceil(this.projects.length / this.pageSize);
    }
  }
}
</script>

<style scoped>
.project-list {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  color: #333;
  margin-bottom: 20px;
}

.project-table {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background-color: #f5f5f5;
}

th, td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

th {
  font-weight: 600;
  color: #555;
}

.progress-bar {
  position: relative;
  width: 100px;
  height: 20px;
  background-color: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #28a745;
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 10px;
  color: #333;
  font-weight: 500;
}

.status-active {
  color: #28a745;
  font-weight: 500;
}

.status-completed {
  color: #17a2b8;
  font-weight: 500;
}

.status-pending {
  color: #ffc107;
  font-weight: 500;
}

.status-delayed {
  color: #dc3545;
  font-weight: 500;
}

.btn-view, .btn-edit {
  padding: 5px 10px;
  margin-right: 5px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.3s;
}

.btn-view {
  background-color: #17a2b8;
  color: white;
}

.btn-view:hover {
  background-color: #138496;
}

.btn-edit {
  background-color: #6c757d;
  color: white;
}

.btn-edit:hover {
  background-color: #5a6268;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
}

.pagination button {
  padding: 8px 16px;
  margin: 0 10px;
  border: 1px solid #ddd;
  background-color: white;
  border-radius: 4px;
  cursor: pointer;
}

.pagination button:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
  color: #999;
}

.pagination button:not(:disabled):hover {
  background-color: #e9ecef;
}
</style>