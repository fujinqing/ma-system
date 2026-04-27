<template>
  <div class="contract-list">
    <h1>合同管理</h1>
    <div class="contract-table">
      <table>
        <thead>
          <tr>
            <th>合同编号</th>
            <th>客户名称</th>
            <th>合同金额</th>
            <th>签订日期</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="contract in contracts" :key="contract.id">
            <td>{{ contract.code }}</td>
            <td>{{ contract.customerName }}</td>
            <td>{{ contract.amount }}</td>
            <td>{{ contract.signDate }}</td>
            <td>
              <span :class="`status-${contract.status}`">{{ contract.statusText }}</span>
            </td>
            <td>
              <button @click="viewContract(contract.id)" class="btn-view">查看</button>
              <button @click="editContract(contract.id)" class="btn-edit">编辑</button>
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
  name: 'ContractList',
  data() {
    return {
      contracts: [
        {
          id: 1,
          code: 'HT2024001',
          customerName: '北京科技有限公司',
          amount: '100,000.00',
          signDate: '2024-01-15',
          status: 'active',
          statusText: '生效中'
        },
        {
          id: 2,
          code: 'HT2024002',
          customerName: '上海贸易公司',
          amount: '150,000.00',
          signDate: '2024-02-20',
          status: 'pending',
          statusText: '待审批'
        },
        {
          id: 3,
          code: 'HT2024003',
          customerName: '广州制造企业',
          amount: '200,000.00',
          signDate: '2024-03-10',
          status: 'expired',
          statusText: '已过期'
        }
      ],
      currentPage: 1,
      pageSize: 10,
      totalPages: 1
    }
  },
  mounted() {
    this.calculateTotalPages();
    this.loadContracts();
  },
  methods: {
    loadContracts() {
      // 实际项目中这里应该调用API获取数据
      console.log('加载合同列表数据');
    },
    viewContract(id) {
      this.$router.push(`/contract/view/${id}`);
    },
    editContract(id) {
      this.$router.push(`/contract/edit/${id}`);
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.loadContracts();
      }
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.loadContracts();
      }
    },
    calculateTotalPages() {
      this.totalPages = Math.ceil(this.contracts.length / this.pageSize);
    }
  }
}
</script>

<style scoped>
.contract-list {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  color: #333;
  margin-bottom: 20px;
}

.contract-table {
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

.status-active {
  color: #28a745;
  font-weight: 500;
}

.status-pending {
  color: #ffc107;
  font-weight: 500;
}

.status-expired {
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