-- 更新竞争对手表中的示例数据，使用正确的行业值
UPDATE competitors SET industry = '3c' WHERE id = 1;
UPDATE competitors SET industry = 'photovoltaic' WHERE id = 2;
UPDATE competitors SET industry = 'new_energy' WHERE id = 3;

PRINT '竞争对手表中的行业数据已更新为与客户管理一致';