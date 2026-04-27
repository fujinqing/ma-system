// Mock data for development purposes
module.exports = {
  dashboardStats: {
    customerCount: 156,
    projectCount: 23,
    salesAmount: '¥2500万',
    pendingApprovals: 8
  },
  
  // 用户数据
  users: [
    {
      id: 1,
      username: 'admin',
      name: '管理员',
      role: 'admin',
      department_id: 1,
      department_name: '管理部',
      position: '总经理',
      phone: '13800138000',
      email: 'admin@manfred.com',
      status: 1,
      created_at: '2026-01-01T00:00:00',
      last_login: '2026-03-26T10:00:00',
      department_icon: 'fa-building',
      department_color: '#409EFF'
    },
    {
      id: 2,
      username: 'sales1',
      name: '李销售',
      role: 'sales',
      department_id: 2,
      department_name: '销售部',
      position: '销售经理',
      phone: '13800138001',
      email: 'sales1@manfred.com',
      status: 1,
      created_at: '2026-01-10T00:00:00',
      last_login: '2026-03-25T15:30:00',
      department_icon: 'fa-chart-line',
      department_color: '#67C23A'
    },
    {
      id: 3,
      username: 'sales2',
      name: '刘销售',
      role: 'sales',
      department_id: 2,
      department_name: '销售部',
      position: '销售专员',
      phone: '13800138002',
      email: 'sales2@manfred.com',
      status: 1,
      created_at: '2026-01-15T00:00:00',
      last_login: '2026-03-26T09:15:00',
      department_icon: 'fa-chart-line',
      department_color: '#67C23A'
    },
    {
      id: 4,
      username: 'warehouse1',
      name: '王仓库',
      role: 'warehouse',
      department_id: 3,
      department_name: '仓库部',
      position: '仓库管理员',
      phone: '13800138003',
      email: 'warehouse1@manfred.com',
      status: 1,
      created_at: '2026-02-01T00:00:00',
      last_login: '2026-03-26T08:30:00',
      department_icon: 'fa-box',
      department_color: '#E6A23C'
    }
  ],
  
  // 部门数据
  departments: [
    {
      id: 1,
      name: '管理部',
      icon: 'fa-building',
      color: '#409EFF'
    },
    {
      id: 2,
      name: '销售部',
      icon: 'fa-chart-line',
      color: '#67C23A'
    },
    {
      id: 3,
      name: '仓库部',
      icon: 'fa-box',
      color: '#E6A23C'
    },
    {
      id: 4,
      name: '采购部',
      icon: 'fa-shopping-cart',
      color: '#F56C6C'
    }
  ],
  
  customers: [
    {
      id: 1,
      code: 'C0001',
      name: '上海汽车集团有限公司',
      short_name: '上汽集团',
      customer_type: 'formal',
      status: 'active',
      level: 'vip',
      source: 'referral',
      industry: 'auto_parts',
      factory_address: '上海市浦东新区张江高科技园区博云路2号',
      company_scale: 'giant',
      cooperation_years: 5,
      tags: ['end_customer'],
      contact_person: '张经理',
      contact_phone: '13800138001',
      contact_position: '设备部经理',
      email: 'zhang@saic.com',
      address: '上海市静安区威海路489号',
      website: 'www.saic.com',
      bank: '中国银行上海分行',
      bank_account: '6222021001123456789',
      tax_id: '310106123456789',
      annual_revenue: '800000',
      employee_count: 28000,
      main_products: '汽车及零部件',
      sales_id: 2,
      sales_name: '李销售',
      last_contact_date: '2026-03-25',
      created_at: '2026-01-15',
      updated_at: '2026-03-25'
    },
    {
      id: 2,
      code: 'C0002',
      name: '比亚迪汽车工业有限公司',
      short_name: '比亚迪',
      customer_type: 'formal',
      status: 'active',
      level: 'vip',
      source: 'exhibition',
      industry: 'new_energy',
      factory_address: '深圳市坪山区比亚迪路3009号',
      company_scale: 'giant',
      cooperation_years: 3,
      tags: ['end_customer'],
      contact_person: '王总监',
      contact_phone: '13900139002',
      contact_position: '技术总监',
      email: 'wang@byd.com',
      address: '深圳市坪山区比亚迪路3009号',
      website: 'www.byd.com',
      bank: '工商银行深圳分行',
      bank_account: '6222084000001234567',
      tax_id: '440301123456789',
      annual_revenue: '700000',
      employee_count: 250000,
      main_products: '新能源汽车、电池',
      sales_id: 3,
      sales_name: '刘销售',
      last_contact_date: '2026-03-24',
      created_at: '2026-01-20',
      updated_at: '2026-03-24'
    },
    {
      id: 3,
      code: 'C0003',
      name: '广州汽车集团股份有限公司',
      short_name: '广汽集团',
      customer_type: 'potential',
      status: 'active',
      level: 'important',
      source: 'advertising',
      industry: 'auto_parts',
      factory_address: '广州市番禺区石楼镇莲花山港口大道8号',
      company_scale: 'large',
      cooperation_years: 1,
      tags: ['end_customer'],
      contact_person: '陈经理',
      contact_phone: '13700137003',
      contact_position: '采购经理',
      email: 'chen@gac.com',
      address: '广州市天河区珠江新城兴国路23号',
      website: 'www.gac.com',
      bank: '建设银行广州分行',
      bank_account: '6217003320001234567',
      tax_id: '440101123456789',
      annual_revenue: '600000',
      employee_count: 18000,
      main_products: '汽车及零部件',
      sales_id: 2,
      sales_name: '李销售',
      last_contact_date: '2026-03-20',
      created_at: '2026-02-01',
      updated_at: '2026-03-20'
    }
  ],
  
  customerStatistics: {
    totalCustomers: 156,
    activeCustomers: 124,
    potentialCustomers: 23,
    formalCustomers: 133,
    contactedThisWeek: 45
  },
  
  // 供应商数据
  suppliers: [
    {
      id: 1,
      supplier_code: 'SUP-001',
      name: '上海汽车零部件有限公司',
      contact_person: '李经理',
      contact_phone: '13800138001',
      contact_email: 'li@shauto.com',
      address: '上海市浦东新区张江高科技园区',
      category: '汽车零部件',
      website: 'www.shauto.com',
      bank_info: '中国银行上海分行 1234567890',
      tax_number: '310104123456789',
      status: 'active',
      qualification_status: 'qualified',
      rating: 95,
      remark: '长期合作伙伴',
      created_by: 1,
      created_at: '2026-01-15',
      updated_at: '2026-03-20'
    },
    {
      id: 2,
      supplier_code: 'SUP-002',
      name: '广州电子科技有限公司',
      contact_person: '张总监',
      contact_phone: '13900139002',
      contact_email: 'zhang@guangzhoutech.com',
      address: '广州市天河区科技园区',
      category: '电子元器件',
      website: 'www.guangzhoutech.com',
      bank_info: '工商银行广州分行 9876543210',
      tax_number: '440106987654321',
      status: 'active',
      qualification_status: 'qualified',
      rating: 92,
      remark: '质量稳定',
      created_by: 1,
      created_at: '2026-01-20',
      updated_at: '2026-03-15'
    }
  ],
  
  // 物料数据
  materials: [
    {
      id: 1,
      material_code: 'MAT-001',
      name: '汽车发动机缸体',
      category_id: 1,
      specification: '4缸 铝合金',
      unit: '件',
      cost_price: 5000.00,
      selling_price: 6500.00,
      min_stock: 50,
      max_stock: 200,
      current_stock: 85,
      status: 'active',
      created_by: 1,
      created_at: '2026-01-15',
      updated_at: '2026-03-25'
    },
    {
      id: 2,
      material_code: 'MAT-002',
      name: '汽车座椅',
      category_id: 2,
      specification: '真皮 电动调节',
      unit: '套',
      cost_price: 3000.00,
      selling_price: 4200.00,
      min_stock: 100,
      max_stock: 300,
      current_stock: 120,
      status: 'active',
      created_by: 1,
      created_at: '2026-01-20',
      updated_at: '2026-03-20'
    },
    {
      id: 3,
      material_code: 'MAT-003',
      name: '汽车显示屏',
      category_id: 3,
      specification: '12.3英寸 触控',
      unit: '台',
      cost_price: 1500.00,
      selling_price: 2200.00,
      min_stock: 80,
      max_stock: 250,
      current_stock: 65,
      status: 'active',
      created_by: 1,
      created_at: '2026-02-01',
      updated_at: '2026-03-15'
    }
  ],
  
  // 采购需求数据
  purchaseRequirements: [
    {
      id: 1,
      req_code: 'REQ-20260320-001',
      department_id: 1,
      project_id: 1,
      requester_id: 2,
      req_date: '2026-03-20T08:30:00',
      delivery_date: '2026-04-15T00:00:00',
      status: 'approved',
      total_amount: 325000.00,
      remark: '用于新车型生产',
      items: [
        {
          id: 1,
          requirement_id: 1,
          material_id: 1,
          quantity: 50,
          estimated_price: 5000.00,
          estimated_amount: 250000.00,
          remark: '发动机缸体'
        },
        {
          id: 2,
          requirement_id: 1,
          material_id: 3,
          quantity: 50,
          estimated_price: 1500.00,
          estimated_amount: 75000.00,
          remark: '汽车显示屏'
        }
      ],
      created_by: 2,
      created_at: '2026-03-20T08:30:00',
      updated_at: '2026-03-22T10:15:00'
    },
    {
      id: 2,
      req_code: 'REQ-20260325-002',
      department_id: 1,
      project_id: 2,
      requester_id: 3,
      req_date: '2026-03-25T14:20:00',
      delivery_date: '2026-04-20T00:00:00',
      status: 'submitted',
      total_amount: 210000.00,
      remark: '用于批量生产',
      items: [
        {
          id: 3,
          requirement_id: 2,
          material_id: 2,
          quantity: 70,
          estimated_price: 3000.00,
          estimated_amount: 210000.00,
          remark: '汽车座椅'
        }
      ],
      created_by: 3,
      created_at: '2026-03-25T14:20:00',
      updated_at: '2026-03-25T14:20:00'
    }
  ],
  
  // 采购订单数据
  purchaseOrders: [
    {
      id: 1,
      order_code: 'PO-20260322-001',
      requirement_id: 1,
      supplier_id: 1,
      order_date: '2026-03-22T14:30:00',
      delivery_date: '2026-04-15T00:00:00',
      delivery_address: '上海市浦东新区临港工业区A12号',
      payment_terms: '货到付款30天',
      currency: 'CNY',
      total_amount: 325000.00,
      status: 'confirmed',
      remark: '根据REQ-20260320-001创建',
      items: [
        {
          id: 1,
          order_id: 1,
          material_id: 1,
          material_name: '汽车发动机缸体',
          specification: '4缸 铝合金',
          unit: '件',
          quantity: 50,
          unit_price: 5000.00,
          total_price: 250000.00,
          remark: '发动机缸体'
        },
        {
          id: 2,
          order_id: 1,
          material_id: 3,
          material_name: '汽车显示屏',
          specification: '12.3英寸 触控',
          unit: '台',
          quantity: 50,
          unit_price: 1500.00,
          total_price: 75000.00,
          remark: '汽车显示屏'
        }
      ],
      created_by: 1,
      created_at: '2026-03-22T14:30:00',
      updated_at: '2026-03-23T09:15:00'
    }
  ],
  
  // 采购合同数据
  purchaseContracts: [
    {
      id: 1,
      contract_code: 'CON-20260323-001',
      order_id: 1,
      supplier_id: 1,
      contract_date: '2026-03-23T10:00:00',
      start_date: '2026-03-23T00:00:00',
      end_date: '2026-04-23T00:00:00',
      total_amount: 325000.00,
      contract_file: 'contracts/CON-20260323-001.pdf',
      status: 'active',
      remark: '采购汽车零部件合同',
      created_by: 1,
      created_at: '2026-03-23T10:00:00',
      updated_at: '2026-03-23T11:30:00'
    }
  ],
  
  // 采购入库数据
  purchaseReceipts: [
    {
      id: 1,
      receipt_code: 'RCV-20260410-001',
      order_id: 1,
      warehouse_id: 1,
      receipt_date: '2026-04-10T09:00:00',
      total_quantity: 100,
      status: 'completed',
      remark: '已完成入库',
      items: [
        {
          id: 1,
          receipt_id: 1,
          order_item_id: 1,
          material_id: 1,
          quantity: 50,
          received_quantity: 50,
          unit_price: 5000.00,
          status: 'completed',
          remark: '发动机缸体入库'
        },
        {
          id: 2,
          receipt_id: 1,
          order_item_id: 2,
          material_id: 3,
          quantity: 50,
          received_quantity: 50,
          unit_price: 1500.00,
          status: 'completed',
          remark: '显示屏入库'
        }
      ],
      created_by: 4,
      created_at: '2026-04-10T09:00:00',
      updated_at: '2026-04-10T10:30:00'
    }
  ],
  
  // 采购付款数据
  purchasePayments: [
    {
      id: 1,
      payment_code: 'PMT-20260510-001',
      order_id: 1,
      contract_id: 1,
      payment_date: '2026-05-10T14:00:00',
      payment_amount: 325000.00,
      payment_method: '银行转账',
      payment_status: 'completed',
      payment_reference: 'BANK-TRANSFER-20260510-12345',
      remark: '支付汽车零部件采购款',
      created_by: 1,
      created_at: '2026-05-10T14:00:00',
      updated_at: '2026-05-10T14:30:00'
    }
  ],
  
  // 供应商评估数据
  supplierEvaluations: [
    {
      id: 1,
      supplier_id: 1,
      evaluation_date: '2026-03-31T15:00:00',
      quality_score: 95,
      delivery_score: 98,
      price_score: 92,
      service_score: 96,
      total_score: 381,
      evaluator_id: 1,
      remark: '质量稳定，交付及时，服务态度好',
      created_at: '2026-03-31T15:00:00'
    },
    {
      id: 2,
      supplier_id: 2,
      evaluation_date: '2026-03-30T14:30:00',
      quality_score: 92,
      delivery_score: 94,
      price_score: 90,
      service_score: 93,
      total_score: 369,
      evaluator_id: 1,
      remark: '整体表现良好',
      created_at: '2026-03-30T14:30:00'
    }
  ]
};