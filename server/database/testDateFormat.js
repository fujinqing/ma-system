// 测试日期格式化功能
function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}年${month}月${day}日`
}

// 测试用例
const testDates = [
  '2018-04-01T00:00:00.000Z',
  '2018-04-18T00:00:00.000Z',
  '2018-06-01T00:00:00.000Z',
  '2018-07-02T00:00:00.000Z',
  null,
  ''
]

console.log('=== 日期格式化测试 ===\n')
testDates.forEach(dateStr => {
  const formatted = formatDate(dateStr)
  console.log(`原始：${dateStr || '空值'} => 格式化：${formatted || '空值'}`)
})

console.log('\n=== 实际用户数据测试 ===\n')
const users = [
  { employee_no: 1, name: 'Emonts Manfred Claude Jean', join_date: '2018-04-01T00:00:00.000Z' },
  { employee_no: 2, name: '郑风华', join_date: '2018-04-18T00:00:00.000Z' },
  { employee_no: 3, name: '李浩', join_date: '2018-06-01T00:00:00.000Z' }
]

users.forEach(user => {
  console.log(`工号 ${user.employee_no}: ${user.name}`)
  console.log(`  原始日期：${user.join_date}`)
  console.log(`  格式化后：${formatDate(user.join_date)}`)
  console.log('')
})
