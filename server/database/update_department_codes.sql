-- 更新部门编码
UPDATE departments SET department_code = '01' WHERE name = '总经办';
UPDATE departments SET department_code = '02' WHERE name = '人事行政部';
UPDATE departments SET department_code = '03' WHERE name = '预留';
UPDATE departments SET department_code = '04' WHERE name = '产品开发部';
UPDATE departments SET department_code = '05' WHERE name = '供应链管理部';
UPDATE departments SET department_code = '06' WHERE name = '财务&商务部';
UPDATE departments SET department_code = '07' WHERE name = '预留';
UPDATE departments SET department_code = '08' WHERE name = '市场&海外营销部';
UPDATE departments SET department_code = '09' WHERE name = '预留';
UPDATE departments SET department_code = '10' WHERE name = '信息部';
UPDATE departments SET department_code = '11' WHERE name = '质量安全部';
UPDATE departments SET department_code = '12' WHERE name = '预留';
UPDATE departments SET department_code = '13' WHERE name = '光伏半导体事业部';
UPDATE departments SET department_code = '14' WHERE name = '电池事业部';
UPDATE departments SET department_code = '15' WHERE name = '铸造事业部';
UPDATE departments SET department_code = '16' WHERE name = '项目部';
UPDATE departments SET department_code = '17' WHERE name = '工程部';

PRINT '部门编码已更新';