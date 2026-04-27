const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('../config');

class DatabaseBackup {
  constructor() {
    this.backupPath = path.join(__dirname, '../backups');
    this.dbConfig = config.database;
    this.ensureBackupDirectory();
  }

  // 确保备份目录存在
  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupPath)) {
      fs.mkdirSync(this.backupPath, { recursive: true });
      console.log(`备份目录已创建: ${this.backupPath}`);
    }
  }

  // 生成备份文件名
  generateBackupFileName() {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `${this.dbConfig.database}_${timestamp}.bak`;
  }

  // 执行数据库备份
  async backup() {
    try {
      const backupFileName = this.generateBackupFileName();
      const backupFilePath = path.join(this.backupPath, backupFileName);

      // 构建 sqlcmd 命令
      const sqlCmd = `sqlcmd -S ${this.dbConfig.server} -d ${this.dbConfig.database} -Q "BACKUP DATABASE [${this.dbConfig.database}] TO DISK = N'${backupFilePath}' WITH NOFORMAT, NOINIT, NAME = N'${this.dbConfig.database}-完整数据库备份', SKIP, NOREWIND, NOUNLOAD, STATS = 10"`;

      return new Promise((resolve, reject) => {
        exec(sqlCmd, (error, stdout, stderr) => {
          if (error) {
            console.error('备份执行失败:', error.message);
            reject(error);
            return;
          }

          if (stderr) {
            console.warn('备份过程中的警告:', stderr);
          }

          console.log('数据库备份成功:', backupFileName);
          console.log('备份输出:', stdout);
          resolve({
            success: true,
            fileName: backupFileName,
            filePath: backupFilePath,
            size: fs.statSync(backupFilePath).size
          });
        });
      });
    } catch (error) {
      console.error('备份过程中出现错误:', error);
      throw error;
    }
  }

  // 清理旧备份文件
  cleanupOldBackups(retentionDays = 7) {
    try {
      const now = new Date();
      const retentionMs = retentionDays * 24 * 60 * 60 * 1000;

      fs.readdirSync(this.backupPath).forEach(file => {
        const filePath = path.join(this.backupPath, file);
        const stats = fs.statSync(filePath);
        const fileAge = now - stats.mtime;

        if (fileAge > retentionMs) {
          fs.unlinkSync(filePath);
          console.log(`已删除旧备份: ${file}`);
        }
      });
    } catch (error) {
      console.error('清理旧备份时出现错误:', error);
    }
  }

  // 定时备份任务
  scheduleBackup(intervalHours = 24, retentionDays = 7) {
    // 立即执行一次备份
    this.backup().then(() => {
      this.cleanupOldBackups(retentionDays);
    }).catch(error => {
      console.error('定时备份初始化失败:', error);
    });

    // 设置定时任务
    const intervalMs = intervalHours * 60 * 60 * 1000;
    setInterval(() => {
      this.backup().then(() => {
        this.cleanupOldBackups(retentionDays);
      }).catch(error => {
        console.error('定时备份执行失败:', error);
      });
    }, intervalMs);

    console.log(`数据库备份任务已启动，每 ${intervalHours} 小时执行一次，保留 ${retentionDays} 天的备份`);
  }
}

module.exports = new DatabaseBackup();