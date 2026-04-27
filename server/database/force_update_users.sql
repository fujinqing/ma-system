-- 根据 Excel 表格强制更新用户数据（包含性别和入职时间）
-- 执行时间：2026-04-06
-- 说明：根据工号 (employee_no) 强制更新用户的姓名、性别、入职时间和职位

-- 创建临时表存储要更新的数据
CREATE TABLE #temp_users (
    employee_no INT,
    name NVARCHAR(100),
    gender NVARCHAR(10),
    join_date DATE,
    position NVARCHAR(200)
);

-- 插入要更新的数据（根据最新 Excel 表格）
INSERT INTO #temp_users (employee_no, name, gender, join_date, position) VALUES
(1, 'Emonts Manfred Claude Jean', 'male', '2018-04-01', '技术顾问'),
(2, '郑风华', 'female', '2018-04-18', '总经理'),
(3, '李浩', 'male', '2018-06-01', '电气经理'),
(8, '张秀兰', 'female', '2018-06-22', '销售部经理'),
(9, '唐峰', 'male', '2018-07-02', '产品研发经理'),
(10, '李海', 'male', '2018-07-02', '事业部总经理'),
(14, '方雯', 'female', '2018-07-23', '市场&海外营销部经理'),
(16, '周美芳', 'female', '2018-07-30', '人事行政经理'),
(17, '陈小明', 'male', '2018-08-01', '高级编程工程师'),
(18, '陈云明', 'male', '2018-08-01', '财务&商务负责人'),
(19, '李培兵', 'male', '2018-08-01', '工程经理'),
(20, '秦海军', 'male', '2018-08-01', '事业部总经理'),
(21, '马志乐', 'male', '2018-08-01', '销售总监'),
(23, '毕照卫', 'male', '2018-08-16', '项目部经理'),
(26, '傅晋清', 'male', '2018-10-08', '事业部总经理'),
(28, '李继连', 'male', '2018-10-08', '现场经理'),
(30, '王冰冰', 'male', '2018-10-08', '项目经理'),
(36, '夏前锦', 'male', '2018-12-03', '调试工程师'),
(45, '张益汉', 'male', '2019-12-16', '电池回收方案主管'),
(46, '陈庆权', 'male', '2019-12-23', '钳工组长'),
(47, '蔡振月', 'female', '2019-12-23', '计划部主管'),
(49, '李全', 'male', '2019-12-30', '质量安全经理'),
(50, '吴飞', 'male', '2019-12-30', '电池产线方案主管'),
(51, '陈明杰', 'male', '2020-01-13', '调试工程师'),
(53, '连加华', 'male', '2020-02-26', '机械工程师'),
(54, '刘建涛', 'male', '2020-03-02', '销售总监'),
(58, '薄宏林', 'male', '2020-04-13', '技术部经理');

-- 强制更新用户数据（覆盖所有字段）
UPDATE u
SET 
    u.name = t.name,
    u.gender = t.gender,
    u.join_date = t.join_date,
    u.position = t.position
FROM sys_users u
INNER JOIN #temp_users t ON u.employee_no = t.employee_no
WHERE u.status = 'active';

-- 显示更新结果
PRINT '强制更新完成！受影响的行数：' + CAST(@@ROWCOUNT AS NVARCHAR(10));

-- 验证更新结果
SELECT 
    u.employee_no AS '工号',
    u.name AS '姓名',
    CASE WHEN u.gender = 'male' THEN '男' ELSE '女' END AS '性别',
    u.join_date AS '入职时间',
    u.position AS '职位'
FROM sys_users u
INNER JOIN #temp_users t ON u.employee_no = t.employee_no
WHERE u.status = 'active'
ORDER BY u.employee_no;

-- 删除临时表
DROP TABLE #temp_users;
