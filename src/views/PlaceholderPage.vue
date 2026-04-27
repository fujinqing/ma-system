<template>
  <div class="placeholder-page">
    <el-card>
      <template #header>
        <span>{{ pageTitle }}</span>
      </template>
      <el-empty :description="pageTitle + ' - 功能开发中'" />
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'PlaceholderPage',
  computed: {
    pageTitle() {
      const routeNames = {
        '/crm/competitors': '竞争对手管理',
        '/crm/activities': '内部协作',
        '/sales/bidding': '招投标管理',
        '/sales/payment': '回款管理',
        '/service/workorder': '售后工单',
        '/service/equipment': '设备档案',
        '/reports/operation': '经营报表'
      }
      return routeNames[this.$route.path] || '页面'
    }
  }
}
</script>

<style scoped>
.placeholder-page {
  padding: 20px;
}
</style>
