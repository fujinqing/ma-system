/**
 * 通用工具函数 - 增强代码健壮性
 */

/**
 * 安全地解析JSON
 * @param {string} str - 要解析的字符串
 * @param {*} defaultValue - 解析失败时的默认值
 * @returns {*} 解析结果或默认值
 */
export function safeJSONParse(str, defaultValue = null) {
  if (!str || typeof str !== 'string') return defaultValue
  try {
    return JSON.parse(str)
  } catch (e) {
    console.warn('JSON parse error:', e)
    return defaultValue
  }
}

/**
 * 安全地执行函数（带错误捕获）
 * @param {Function} fn - 要执行的函数
 * @param {*} defaultValue - 执行失败时的默认值
 * @param {...*} args - 函数参数
 * @returns {*} 函数执行结果或默认值
 */
export function safeExecute(fn, defaultValue = null, ...args) {
  if (typeof fn !== 'function') return defaultValue
  try {
    return fn(...args)
  } catch (e) {
    console.error('Function execution error:', e)
    return defaultValue
  }
}

/**
 * 安全地访问对象属性
 * @param {Object} obj - 目标对象
 * @param {string} path - 属性路径，如 'a.b.c'
 * @param {*} defaultValue - 属性不存在时的默认值
 * @returns {*} 属性值或默认值
 */
export function safeGet(obj, path, defaultValue = null) {
  if (!obj || typeof obj !== 'object') return defaultValue
  const keys = path.split('.')
  let result = obj
  for (const key of keys) {
    if (result == null || typeof result !== 'object') return defaultValue
    result = result[key]
  }
  return result !== undefined ? result : defaultValue
}

/**
 * 安全地设置对象属性
 * @param {Object} obj - 目标对象
 * @param {string} path - 属性路径
 * @param {*} value - 要设置的值
 */
export function safeSet(obj, path, value) {
  if (!obj || typeof obj !== 'object') return
  const keys = path.split('.')
  let current = obj
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (current[key] == null || typeof current[key] !== 'object') {
      current[key] = {}
    }
    current = current[key]
  }
  current[keys[keys.length - 1]] = value
}

/**
 * 格式化数字，处理各种边界情况
 * @param {*} value - 要格式化的值
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的字符串
 */
export function formatNumber(value, decimals = 2) {
  const num = parseFloat(value)
  if (isNaN(num)) return '0.' + '0'.repeat(decimals)
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

/**
 * 安全地格式化价格
 * @param {*} value - 要格式化的值
 * @returns {string} 格式化后的价格字符串
 */
export function formatPrice(value) {
  const num = parseFloat(value)
  if (isNaN(num) || num === 0) return '¥0.00'
  return '¥' + num.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

/**
 * 验证是否为有效的日期
 * @param {*} date - 要验证的值
 * @returns {boolean} 是否为有效日期
 */
export function isValidDate(date) {
  if (!date) return false
  const d = new Date(date)
  return d instanceof Date && !isNaN(d.getTime())
}

/**
 * 格式化日期，处理各种边界情况
 * @param {*} date - 要格式化的日期
 * @param {string} format - 格式模板
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
  if (!isValidDate(date)) return '-'
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 防抖函数
 * @param {Function} fn - 要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export function debounce(fn, delay = 300) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * 节流函数
 * @param {Function} fn - 要节流的函数
 * @param {number} interval - 间隔时间（毫秒）
 * @returns {Function} 节流后的函数
 */
export function throttle(fn, interval = 300) {
  let lastTime = 0
  return function (...args) {
    const now = Date.now()
    if (now - lastTime >= interval) {
      lastTime = now
      fn.apply(this, args)
    }
  }
}

/**
 * 深拷贝对象
 * @param {*} obj - 要拷贝的对象
 * @returns {*} 拷贝后的对象
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (Array.isArray(obj)) return obj.map(item => deepClone(item))
  const cloned = {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key])
    }
  }
  return cloned
}

/**
 * 安全地从localStorage获取数据
 * @param {string} key - 键名
 * @param {*} defaultValue - 默认值
 * @returns {*} 存储的数据或默认值
 */
export function safeLocalStorageGet(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key)
    return item !== null ? safeJSONParse(item, defaultValue) : defaultValue
  } catch (e) {
    console.warn('localStorage get error:', e)
    return defaultValue
  }
}

/**
 * 安全地存储数据到localStorage
 * @param {string} key - 键名
 * @param {*} value - 要存储的值
 * @returns {boolean} 是否存储成功
 */
export function safeLocalStorageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (e) {
    console.error('localStorage set error:', e)
    return false
  }
}

/**
 * 生成唯一ID
 * @returns {string} 唯一ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * 验证必填字段
 * @param {Object} data - 数据对象
 * @param {Array<string>} fields - 必填字段列表
 * @returns {Object} 验证结果 { valid: boolean, missing: Array<string> }
 */
export function validateRequired(data, fields) {
  const missing = fields.filter(field => {
    const value = safeGet(data, field)
    return value === undefined || value === null || value === ''
  })
  return {
    valid: missing.length === 0,
    missing
  }
}

/**
 * 限制字符串长度
 * @param {string} str - 原始字符串
 * @param {number} maxLength - 最大长度
 * @param {string} suffix - 超出时的后缀
 * @returns {string} 处理后的字符串
 */
export function truncateString(str, maxLength = 100, suffix = '...') {
  if (!str || typeof str !== 'string') return ''
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength - suffix.length) + suffix
}

/**
 * 安全地计算数组总和
 * @param {Array} arr - 数组
 * @param {string} field - 要计算的字段（可选）
 * @returns {number} 总和
 */
export function safeSum(arr, field = null) {
  if (!Array.isArray(arr)) return 0
  return arr.reduce((sum, item) => {
    const value = field ? safeGet(item, field, 0) : item
    const num = parseFloat(value)
    return sum + (isNaN(num) ? 0 : num)
  }, 0)
}

/**
 * 检查对象是否为空
 * @param {*} obj - 要检查的对象
 * @returns {boolean} 是否为空
 */
export function isEmptyObject(obj) {
  if (!obj || typeof obj !== 'object') return true
  return Object.keys(obj).length === 0
}

/**
 * 安全地合并对象
 * @param {...Object} objects - 要合并的对象
 * @returns {Object} 合并后的对象
 */
export function safeMerge(...objects) {
  return objects.reduce((result, obj) => {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        if (obj[key] !== undefined) {
          result[key] = obj[key]
        }
      })
    }
    return result
  }, {})
}
