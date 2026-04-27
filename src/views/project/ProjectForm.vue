<template>
  <div class="project-form">
    <div class="page-header">
      <h2 class="page-title">{{ isEdit ? '编辑项目' : '添加项目' }}</h2>
      <el-button type="primary" @click="submitForm">
        {{ isEdit ? '更新' : '保存' }}
      </el-button>
      <el-button @click="cancel">取消</el-button>
    </div>
    
    <el-form :model="projectForm" :rules="rules" ref="projectFormRef" label-width="120px">
      <el-card class="form-section">
        <template #header>
          <div class="card-header">
            <span>基本信息</span>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="项目名称" prop="name">
              <el-input v-model="projectForm.name" placeholder="请输入项目名称"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户" prop="customer_id">
              <el-select v-model="projectForm.customer_id" placeholder="请选择客户">
                <el-option v-for="customer in customers" :key="customer.id" :label="customer.name" :value="customer.id"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="项目阶段" prop="phase">
              <el-select v-model="projectForm.phase" placeholder="请选择项目阶段">
                <el-option label="需求对接" value="requirement"></el-option>
                <el-option label="方案设计" value="design"></el-option>
                <el-option label="报价商务" value="quotation"></el-option>
                <el-option label="合同签订" value="contract"></el-option>
                <el-option label="下单投产" value="production"></el-option>
                <el-option label="安装调试" value="installation"></el-option>
                <el-option label="验收结案" value="acceptance"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目状态" prop="status">
              <el-select v-model="projectForm.status" placeholder="请选择项目状态">
                <el-option label="跟进中" value="follow_up"></el-option>
                <el-option label="暂停" value="paused"></el-option>
                <el-option label="放弃" value="abandoned"></el-option>
                <el-option label="已中标" value="won"></el-option>
                <el-option label="已验收" value="accepted"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="销售人员" prop="sales_id">
              <el-select v-model="projectForm.sales_id" placeholder="请选择销售人员">
                <el-option v-for="sales in salesList" :key="sales.id" :label="sales.name" :value="sales.id"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="技术负责人" prop="tech_lead_id">
              <el-select v-model="projectForm.tech_lead_id" placeholder="请选择技术负责人">
                <el-option v-for="tech in techList" :key="tech.id" :label="tech.name" :value="tech.id"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <el-card class="form-section">
        <template #header>
          <div class="card-header">
            <span>技术要求</span>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="产品工艺" prop="product_process">
              <el-input v-model="projectForm.product_process" placeholder="请输入产品工艺"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产能要求" prop="capacity_requirement">
              <el-input v-model="projectForm.capacity_requirement" placeholder="请输入产能要求"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="交付周期" prop="delivery_period">
              <el-input v-model="projectForm.delivery_period" placeholder="请输入交付周期"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预算区间" prop="budget_range">
              <el-input v-model="projectForm.budget_range" placeholder="请输入预算区间"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <el-card class="form-section">
        <template #header>
          <div class="card-header">
            <span>时间与预算</span>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="预算金额" prop="budget">
              <el-input v-model="projectForm.budget" placeholder="请输入预算金额"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="开始日期" prop="start_date">
              <el-date-picker v-model="projectForm.start_date" type="date" placeholder="选择开始日期"></el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="结束日期" prop="end_date">
              <el-date-picker v-model="projectForm.end_date" type="date" placeholder="选择结束日期"></el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <el-card class="form-section">
        <template #header>
          <div class="card-header">
            <span>备注信息</span>
          </div>
        </template>
        <el-form-item label="备注">
          <el-input v-model="projectForm.remark" type="textarea" placeholder="请输入备注"></el-input>
        </el-form-item>
      </el-card>
    </el-form>
  </div>
</template>

<script>
export default {
  name: 'ProjectForm',
  data() {
    return {
      isEdit: this.$route.path.includes('/edit'),
      projectForm: {
        id: '',
        name: '',
        customer_id: '',
        phase: 'requirement',
        status: 'follow_up',
        sales_id: '',
        tech_lead_id: '',
        product_process: '',
        capacity_requirement: '',
        delivery_period: '',
        budget_range: '',
        budget: '',
        start_date: '',
        end_date: '',
        remark: ''
      },
      rules: {
        name: [
          { required: true, message: '请输入项目名称', trigger: 'blur' }
        ],
        customer_id: [
          { required: true, message: '请选择客户', trigger: 'blur' }
        ],
        sales_id: [
          { required: true, message: '请选择销售人员', trigger: 'blur' }
        ],
        status: [
          { required: true, message: '请选择状态', trigger: 'blur' }
        ],
        phase: [
          { required: true, message: '请选择项目阶段', trigger: 'blur' }
        ]
      },
      customers: [
        { id: 1, name: '客户1' },
        { id: 2, name: '客户2' },
        { id: 3, name: '客户3' }
      ],
      salesList: [
        { id: 1, name: '销售1' },
        { id: 2, name: '销售2' },
        { id: 3, name: '销售3' }
      ],
      techList: [
        { id: 1, name: '技术1' },
        { id: 2, name: '技术2' },
        { id: 3, name: '技术3' }
      ]
    }
  },
  mounted() {
    if (this.isEdit) {
      this.loadProjectData()
    }
  },
  methods: {
    loadProjectData() {
      // 模拟加载项目数据
      const projectId = this.$route.params.id
      setTimeout(() => {
        this.projectForm = {
          id: projectId,
          name: `项目${projectId}`,
          customer_id: 1,
          sales_id: 1,
          status: '进行中',
          budget: '100万',
          start_date: '2026-01-01',
          end_date: '2026-06-30',
          remark: '项目备注'
        }
      }, 500)
    },
    submitForm() {
      this.$refs.projectFormRef.validate((valid) => {
        if (valid) {
          // 模拟提交表单
          setTimeout(() => {
            this.$message.success(this.isEdit ? '更新成功' : '保存成功')
            this.$router.push('/project')
          }, 1000)
        }
      })
    },
    cancel() {
      this.$router.push('/project')
    }
  }
}
</script>

<style scoped>
.project-form {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-header {
  display: flex;
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
</style>