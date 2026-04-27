<template>
  <div class="watermark" v-if="visible">
    <div 
      v-for="i in rows" 
      :key="'row-' + i"
      class="watermark-row"
    >
      <div 
        v-for="j in cols" 
        :key="'col-' + j"
        class="watermark-item"
      >
        <div class="watermark-content">
          <div class="company-name">{{ companyName }}</div>
          <div class="user-info">{{ userName }}</div>
          <div class="date-time">{{ currentDateTime }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Watermark',
  props: {
    visible: {
      type: Boolean,
      default: true
    },
    companyName: {
      type: String,
      default: '曼弗莱德智能制造（江苏）有限公司'
    },
    userName: {
      type: String,
      default: ''
    },
    rows: {
      type: Number,
      default: 4
    },
    cols: {
      type: Number,
      default: 4
    }
  },
  data() {
    return {
      currentDateTime: ''
    }
  },
  mounted() {
    this.updateDateTime()
    this.interval = setInterval(this.updateDateTime, 1000)
  },
  beforeUnmount() {
    if (this.interval) {
      clearInterval(this.interval)
    }
  },
  methods: {
    updateDateTime() {
      const now = new Date()
      this.currentDateTime = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
.watermark {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
  overflow: hidden;
}

.watermark-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 200px;
  margin-left: 150px;
  margin-right: 150px;
}

.watermark-item {
  flex: 1;
  display: flex;
  justify-content: center;
  margin: 0 40px;
}

.watermark-content {
  transform: rotate(-30deg);
  opacity: 0.08;
  color: #000;
  font-size: 14px;
  line-height: 1.4;
  text-align: center;
  white-space: nowrap;
}

.company-name {
  font-weight: bold;
  margin-bottom: 4px;
}

.user-info {
  margin-bottom: 4px;
}

.date-time {
  font-size: 12px;
}

@media (max-width: 768px) {
  .watermark-row {
    margin-bottom: 80px;
    margin-left: 40px;
    margin-right: 40px;
  }
  
  .watermark-content {
    font-size: 12px;
  }
}
</style>