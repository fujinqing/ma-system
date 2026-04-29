<template>
  <div class="customer-detail" v-loading="loading">
    <div class="detail-header">
      <div class="header-left">
        <el-button @click="goBack" icon="el-icon-back">返回</el-button>
        <h2 class="customer-name">{{ customer.name }}</h2>
        <el-tag :type="getCustomerTypeTag(customer.customer_type)">{{ getCustomerTypeText(customer.customer_type) }}</el-tag>
        <el-tag :type="getLevelTag(customer.level)">{{ customer.level }}</el-tag>
        <el-tag :type="customer.status === 'active' ? 'success' : 'info'">{{ customer.status }}</el-tag>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="editCustomer">编辑</el-button>
        <el-button type="warning" @click="addActivity">添加跟进</el-button>
        <el-button type="danger" @click="deleteCustomer">删除</el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="customer-tabs">
      <el-tab-pane label="基本信息" name="basic">
        <div class="info-section">
          <div class="section-title">基本信息</div>
          <div class="info-grid">
            <div class="info-item">
              <label>客户编码</label>
              <span>{{ customer.code || '-' }}</span>
            </div>
            <div class="info-item">
              <label>客户名称</label>
              <span>{{ customer.name }}</span>
            </div>
            <div class="info-item">
              <label>客户简称</label>
              <span>{{ customer.short_name || '-' }}</span>
            </div>
            <div class="info-item">
              <label>客户类型</label>
              <span>{{ getCustomerTypeText(customer.customer_type) }}</span>
            </div>
            <div class="info-item">
              <label>客户来源</label>
              <span>{{ customer.source || '-' }}</span>
            </div>
            <div class="info-item">
              <label>所属行业</label>
              <span>{{ customer.industry || '-' }}</span>
            </div>
            <div class="info-item">
              <label>客户等级</label>
              <span>{{ customer.level || '-' }}</span>
            </div>
            <div class="info-item">
              <label>信用评级</label>
              <span>{{ customer.credit_rating || '-' }}</span>
            </div>
            <div class="info-item">
              <label>付款条款</label>
              <span>{{ customer.payment_terms || '-' }}</span>
            </div>
            <div class="info-item">
              <label>跟进销售</label>
              <span>{{ customer.sales_name || '-' }}</span>
            </div>
            <div class="info-item">
              <label>最近联系</label>
              <span>{{ formatDate(customer.last_contact_date) }}</span>
            </div>
          </div>
        </div>

        <div class="info-section">
          <div class="section-title">企业信息</div>
          <div class="info-grid">
            <div class="info-item">
              <label>年营业额</label>
              <span>{{ customer.annual_revenue ? `¥${customer.annual_revenue}万` : '-' }}</span>
            </div>
            <div class="info-item">
              <label>员工数量</label>
              <span>{{ customer.employee_count || '-' }}</span>
            </div>
            <div class="info-item">
              <label>主营产品</label>
              <span>{{ customer.main_product || '-' }}</span>
            </div>
            <div class="info-item">
              <label>公司网站</label>
              <span v-if="customer.website"><a :href="customer.website" target="_blank">{{ customer.website }}</a></span>
              <span v-else>-</span>
            </div>
          </div>
        </div>

        <div class="info-section">
          <div class="section-title">联系方式</div>
          <div class="info-grid">
            <div class="info-item">
              <label>联系人</label>
              <span>{{ customer.contact_person || '-' }}</span>
            </div>
            <div class="info-item">
              <label>职务</label>
              <span>{{ customer.contact_position || '-' }}</span>
            </div>
            <div class="info-item">
              <label>电话</label>
              <span>{{ customer.contact_phone || '-' }}</span>
            </div>
            <div class="info-item">
              <label>邮箱</label>
              <span>{{ customer.contact_email || '-' }}</span>
            </div>
            <div class="info-item full-width">
              <label>地址</label>
              <span>{{ customer.address || '-' }}</span>
            </div>
          </div>
        </div>

        <div class="info-section">
          <div class="section-title">银行信息</div>
          <div class="info-grid">
            <div class="info-item">
              <label>开户银行</label>
              <span>{{ customer.bank || '-' }}</span>
            </div>
            <div class="info-item">
              <label>银行账号</label>
              <span>{{ customer.bank_account || '-' }}</span>
            </div>
            <div class="info-item">
              <label>税号</label>
              <span>{{ customer.tax_id || '-' }}</span>
            </div>
          </div>
        </div>

        <div class="info-section" v-if="customer.lost_reason">
          <div class="section-title">流失信息</div>
          <div class="info-grid">
            <div class="info-item full-width">
              <label>流失原因</label>
              <span class="lost-reason">{{ customer.lost_reason }}</span>
            </div>
          </div>
        </div>

        <div class="info-section" v-if="customer.remarks">
          <div class="section-title">备注</div>
          <div class="remarks-content">{{ customer.remarks }}</div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="联系人" name="contacts">
        <div class="tab-header">
          <el-button type="primary" @click="addContact">添加联系人</el-button>
        </div>
        <el-table :data="contacts" border stripe>
          <el-table-column prop="name" label="姓名" width="120"></el-table-column>
          <el-table-column prop="position" label="职务" width="120"></el-table-column>
          <el-table-column prop="phone" label="电话" width="130"></el-table-column>
          <el-table-column prop="mobile" label="手机" width="130"></el-table-column>
          <el-table-column prop="email" label="邮箱" width="180"></el-table-column>
          <el-table-column prop="is_primary" label="主要联系人" width="100">
            <template #default="scope">
              <el-tag v-if="scope.row.is_primary" type="success" size="small">是</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="scope">
              <el-button type="primary" size="small" link @click="editContact(scope.row)">编辑</el-button>
              <el-button type="danger" size="small" link @click="deleteContact(scope.row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="跟进记录" name="activities">
        <div class="tab-header">
          <el-button type="primary" @click="addActivity">添加跟进</el-button>
        </div>
        <el-timeline>
          <el-timeline-item v-for="activity in activities" :key="activity.id" :timestamp="formatDate(activity.created_at)" placement="top">
            <el-card>
              <div class="activity-header">
                <el-tag size="small">{{ getActivityTypeText(activity.activity_type) }}</el-tag>
                <span class="activity-subject">{{ activity.subject }}</span>
              </div>
              <div class="activity-content">{{ activity.content }}</div>
              <div class="activity-footer" v-if="activity.next_plan_date">
                <span class="next-plan">下次计划：{{ formatDate(activity.next_plan_date) }} - {{ activity.next_plan_content }}</span>
              </div>
              <div class="activity-author">跟进人：{{ activity.created_by_name }}</div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="activitiesPage"
            :page-size="activitiesLimit"
            layout="prev, pager, next"
            :total="activitiesTotal"
            @current-change="loadActivities"
          ></el-pagination>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="contactDialogVisible" :title="isEditContact ? '编辑联系人' : '添加联系人'" width="500px">
      <el-form :model="contactForm" label-width="100px">
        <el-form-item label="姓名" required>
          <el-input v-model="contactForm.name"></el-input>
        </el-form-item>
        <el-form-item label="职务">
          <el-input v-model="contactForm.position"></el-input>
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="contactForm.phone"></el-input>
        </el-form-item>
        <el-form-item label="手机">
          <el-input v-model="contactForm.mobile"></el-input>
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="contactForm.email"></el-input>
        </el-form-item>
        <el-form-item label="生日">
          <el-date-picker v-model="contactForm.birthday" type="date" value-format="YYYY-MM-DD"></el-date-picker>
        </el-form-item>
        <el-form-item label="爱好">
          <el-input v-model="contactForm.hobbies"></el-input>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="contactForm.remarks" type="textarea"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="contactDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitContact">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="activityDialogVisible" title="添加跟进记录" width="600px">
      <el-form :model="activityForm" label-width="100px">
        <el-form-item label="跟进类型" required>
          <el-select v-model="activityForm.activity_type" placeholder="请选择">
            <el-option label="电话沟通" value="phone"></el-option>
            <el-option label="邮件往来" value="email"></el-option>
            <el-option label="拜访客户" value="visit"></el-option>
            <el-option label="产品演示" value="demo"></el-option>
            <el-option label="商务洽谈" value="negotiation"></el-option>
            <el-option label="合同签订" value="contract"></el-option>
            <el-option label="售后服务" value="service"></el-option>
            <el-option label="其他" value="other"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="跟进主题">
          <el-input v-model="activityForm.subject" placeholder="请输入跟进主题"></el-input>
        </el-form-item>
        <el-form-item label="跟进内容" required>
          <el-input v-model="activityForm.content" type="textarea" :rows="4"></el-input>
        </el-form-item>
        <el-form-item label="下次计划">
          <el-date-picker v-model="activityForm.next_plan_date" type="date" value-format="YYYY-MM-DD"></el-date-picker>
        </el-form-item>
        <el-form-item label="计划内容">
          <el-input v-model="activityForm.next_plan_content" type="textarea" :rows="2"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="activityDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitActivity">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import api from '@/api'

export default {
  name: 'CustomerDetail',
  data() {
    return {
      customerId: null,
      customer: {},
      contacts: [],
      activities: [],
      statistics: {},
      activeTab: 'basic',
      loading: false,
      contactDialogVisible: false,
      activityDialogVisible: false,
      isEditContact: false,
      contactForm: {
        name: '',
        position: '',
        phone: '',
        mobile: '',
        email: '',
        birthday: '',
        hobbies: '',
        remarks: '',
        is_primary: false
      },
      contactEditId: null,
      activityForm: {
        activity_type: '',
        subject: '',
        content: '',
        next_plan_date: '',
        next_plan_content: ''
      },
      activitiesPage: 1,
      activitiesLimit: 20,
      activitiesTotal: 0
    }
  },
  mounted() {
    this.customerId = this.$route.params.id
    this.loadCustomer()
    this.loadContacts()
    this.loadActivities()
  },
  methods: {
    async loadCustomer() {
      this.loading = true
      try {
        const response = await api.getCustomer(this.customerId)
        if (response && response.success) {
          this.customer = response.data
        }
      } catch (error) {
        console.warn('获取客户详情失败:', error)
        this.$message.error('获取客户详情失败')
      } finally {
        this.loading = false
      }
    },
    async loadContacts() {
      try {
        const response = await api.getCustomerContacts(this.customerId)
        if (response && response.success) {
          this.contacts = response.data
        }
      } catch (error) {
        console.warn('获取联系人失败:', error)
      }
    },
    async loadActivities() {
      try {
        const response = await api.getCustomerActivities(this.customerId, {
          page: this.activitiesPage,
          limit: this.activitiesLimit
        })
        if (response && response.success) {
          this.activities = response.data.activities
          this.activitiesTotal = response.data.pagination.total
        }
      } catch (error) {
        console.warn('获取跟进记录失败:', error)
      }
    },
    goBack() {
      this.$router.push('/crm')
    },
    editCustomer() {
      this.$router.push(`/crm/edit/${this.customerId}`)
    },
    async deleteCustomer() {
      try {
        await this.$confirm('确定要删除此客户吗？此操作不可恢复。', '删除确认', {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning'
        })
        const response = await api.deleteCustomer(this.customerId)
        if (response && response.success) {
          this.$message.success('删除成功')
          this.$router.push('/crm')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.warn('删除客户失败:', error)
          this.$message.error('删除客户失败')
        }
      }
    },
    addActivity() {
      this.activityForm = {
        activity_type: '',
        subject: '',
        content: '',
        next_plan_date: '',
        next_plan_content: ''
      }
      this.activityDialogVisible = true
    },
    async submitActivity() {
      if (!this.activityForm.activity_type || !this.activityForm.content) {
        this.$message.warning('请填写必填项')
        return
      }
      try {
        const response = await api.addCustomerActivity(this.customerId, this.activityForm)
        if (response && response.success) {
          this.$message.success('添加成功')
          this.activityDialogVisible = false
          this.loadActivities()
          this.loadCustomer()
        }
      } catch (error) {
        console.warn('添加跟进记录失败:', error)
        this.$message.error('添加跟进记录失败')
      }
    },
    addContact() {
      this.isEditContact = false
      this.contactForm = {
        name: '',
        position: '',
        phone: '',
        mobile: '',
        email: '',
        birthday: '',
        hobbies: '',
        remarks: '',
        is_primary: false
      }
      this.contactEditId = null
      this.contactDialogVisible = true
    },
    editContact(contact) {
      this.isEditContact = true
      this.contactForm = { ...contact }
      this.contactEditId = contact.id
      this.contactDialogVisible = true
    },
    async submitContact() {
      if (!this.contactForm.name) {
        this.$message.warning('请输入姓名')
        return
      }
      try {
        let response
        if (this.isEditContact) {
          response = await api.updateCustomerContact(this.customerId, this.contactEditId, this.contactForm)
        } else {
          response = await api.addCustomerContact(this.customerId, this.contactForm)
        }
        if (response && response.success) {
          this.$message.success(this.isEditContact ? '更新成功' : '添加成功')
          this.contactDialogVisible = false
          this.loadContacts()
        }
      } catch (error) {
        console.warn('保存联系人失败:', error)
        this.$message.error('保存联系人失败')
      }
    },
    async deleteContact(contactId) {
      try {
        await this.$confirm('确定要删除此联系人吗？', '删除确认', { type: 'warning' })
        const response = await api.deleteCustomerContact(this.customerId, contactId)
        if (response && response.success) {
          this.$message.success('删除成功')
          this.loadContacts()
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.warn('删除联系人失败:', error)
          this.$message.error('删除联系人失败')
        }
      }
    },
    formatDate(date) {
      if (!date) return '-'
      return new Date(date).toLocaleDateString('zh-CN')
    },
    getCustomerTypeText(type) {
      const map = { potential: '潜在客户', formal: '正式客户', intentional: '意向客户' }
      return map[type] || type
    },
    getCustomerTypeTag(type) {
      const map = { potential: 'info', formal: 'success', intentional: 'warning' }
      return map[type] || 'info'
    },
    getLevelTag(level) {
      const map = { vip: 'danger', important: 'warning', normal: 'info', low: 'info' }
      return map[level] || 'info'
    },
    getActivityTypeText(type) {
      const map = {
        phone: '电话沟通', email: '邮件往来', visit: '拜访客户',
        demo: '产品演示', negotiation: '商务洽谈', contract: '合同签订',
        service: '售后服务', other: '其他'
      }
      return map[type] || type
    }
  }
}
</script>

<style scoped>
.customer-detail {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100%;
}

.detail-header {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.customer-name {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.customer-tabs {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}

.info-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-item.full-width {
  grid-column: span 2;
}

.info-item label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.info-item span {
  font-size: 14px;
  color: #303133;
}

.lost-reason {
  color: #f56c6c !important;
}

.remarks-content {
  color: #606266;
  line-height: 1.6;
  white-space: pre-wrap;
}

.tab-header {
  margin-bottom: 16px;
}

.activity-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.activity-subject {
  font-weight: 600;
  color: #303133;
}

.activity-content {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 8px;
}

.activity-footer {
  color: #409eff;
  font-size: 13px;
  margin-bottom: 4px;
}

.activity-author {
  color: #909399;
  font-size: 12px;
  text-align: right;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
