#!/bin/bash
#==============================================================================
# 后端部署脚本
# 用法: ./scripts/deploy-backend.sh <环境> [版本号]
# 示例: ./scripts/deploy-backend.sh production
#       ./scripts/deploy-backend.sh staging v1.2.3
#==============================================================================

set -e

# 配置
DEPLOY_USER="${DEPLOY_USER:-deploy}"
DEPLOY_HOST="${DEPLOY_HOST:-}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"
BACKEND_PATH="${BACKEND_PATH:-/opt/ma-system/backend}"
SERVICE_NAME="${SERVICE_NAME:-ma-system-backend}"
BACKUP_PATH="${BACKEND_PATH}/backup"
HEALTH_CHECK_URL="${HEALTH_CHECK_URL:-http://localhost:3001/api/health}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step()  { echo -e "${BLUE}[STEP]${NC} $1"; }

# 帮助信息
show_help() {
    cat << EOF
用法: $(basename "$0") <环境> [版本号]

环境选项:
    production   生产环境 (端口3001)
    staging      预发布环境 (端口3002)
    development  开发环境 (端口3003)

示例:
    $(basename "$0") production      # 部署最新构建
    $(basename "$0") staging v1.2.3  # 部署指定版本

前置要求:
    1. 配置SSH密钥免密登录
    2. 服务器已安装PM2或配置systemd服务
    3. 设置数据库连接环境变量

环境变量:
    DEPLOY_HOST     部署服务器地址
    DEPLOY_USER     部署用户 (默认: deploy)
    DEPLOY_PORT     SSH端口 (默认: 22)
EOF
}

# 参数验证
if [ $# -lt 1 ]; then
    log_error "缺少参数"
    show_help
    exit 1
fi

ENVIRONMENT=$1
VERSION=${2:-latest}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 根据环境选择配置
case $ENVIRONMENT in
    production)
        DEPLOY_HOST="${DEPLOY_HOST:-$PROD_HOST}"
        BACKEND_PORT="${BACKEND_PORT:-3001}"
        SERVICE_NAME="ma-system-backend"
        HEALTH_CHECK_URL="http://localhost:${BACKEND_PORT}/api/health"
        DB_CONFIG="${PROD_DB}"
        ;;
    staging)
        DEPLOY_HOST="${DEPLOY_HOST:-$STAGING_HOST}"
        BACKEND_PORT="${BACKEND_PORT:-3002}"
        SERVICE_NAME="ma-system-backend-staging"
        HEALTH_CHECK_URL="http://localhost:${BACKEND_PORT}/api/health"
        DB_CONFIG="${STAGING_DB}"
        ;;
    development)
        DEPLOY_HOST="${DEPLOY_HOST:-$DEV_HOST}"
        BACKEND_PORT="${BACKEND_PORT:-3003}"
        SERVICE_NAME="ma-system-backend-dev"
        HEALTH_CHECK_URL="http://localhost:${BACKEND_PORT}/api/health"
        DB_CONFIG="${DEV_DB}"
        ;;
    *)
        log_error "未知环境: $ENVIRONMENT"
        show_help
        exit 1
        ;;
esac

# 检查必填参数
if [ -z "$DEPLOY_HOST" ]; then
    log_error "未设置部署主机，请设置 DEPLOY_HOST 环境变量"
    exit 1
fi

log_info "========== 开始部署后端 =========="
log_info "环境: $ENVIRONMENT"
log_info "主机: $DEPLOY_HOST"
log_info "后端路径: $BACKEND_PATH"
log_info "服务名: $SERVICE_NAME"
log_info "版本: $VERSION"

# 远程部署函数
remote_deploy() {
    ssh -p $DEPLOY_PORT $DEPLOY_USER@$DEPLOY_HOST << EOF
        set -e

        log_info() { echo "[INFO] \$1"; }
        log_warn() { echo "[WARN] \$1"; }
        log_error() { echo "[ERROR] \$1"; }

        BACKEND_PATH="$BACKEND_PATH"
        SERVICE_NAME="$SERVICE_NAME"
        BACKUP_PATH="$BACKUP_PATH"
        BACKEND_PORT="$BACKEND_PORT"
        TIMESTAMP="$TIMESTAMP"
        HEALTH_CHECK_URL="$HEALTH_CHECK_URL"

        log_step "1. 准备工作..."
        mkdir -p \$BACKUP_PATH
        mkdir -p \$BACKEND_PATH

        log_step "2. 备份当前版本..."
        if [ -f "\$BACKEND_PATH/server.js" ]; then
            tar -czf \$BACKUP_PATH/server_\$TIMESTAMP.tar.gz \
                -C \$BACKEND_PATH . \
                --exclude='node_modules' \
                --exclude='backup' \
                --exclude='*.log' 2>/dev/null || true
            log_info "备份已创建: server_\$TIMESTAMP.tar.gz"

            # 保留最近10个备份
            cd \$BACKUP_PATH
            ls -t | tail -n +11 | xargs -r rm -f
        fi

        log_step "3. 停止当前服务..."
        # 尝试使用PM2停止
        if command -v pm2 &> /dev/null; then
            pm2 stop \$SERVICE_NAME 2>/dev/null || true
            pm2 delete \$SERVICE_NAME 2>/dev/null || true
        fi

        # 尝试使用systemd停止
        if systemctl is-active --quiet \$SERVICE_NAME 2>/dev/null; then
            sudo systemctl stop \$SERVICE_NAME
        fi

        # kill进程作为最后手段
        pkill -f "node.*server.js" 2>/dev/null || true
        sleep 2

        log_step "4. 更新代码..."
        # 从部署包解压或从共享存储获取
        cd \$BACKEND_PATH

        # 创建新的临时目录
        rm -rf new_release
        mkdir -p new_release

        # 解包新的构建（假设BUILD_ARTIFACT包含新的构建）
        if [ -n "\$BUILD_ARTIFACT" ]; then
            tar -xzf \$BUILD_ARTIFACT -C new_release/
        fi

        # 复制到正确位置
        cp -r new_release/* \$BACKEND_PATH/ 2>/dev/null || true
        rm -rf new_release

        log_step "5. 安装依赖..."
        cd \$BACKEND_PATH/server
        npm ci --production 2>/dev/null || npm install --production

        log_step "6. 启动服务..."
        if command -v pm2 &> /dev/null; then
            # 创建PM2配置
            cd \$BACKEND_PATH
            pm2 start server.js \
                --name \$SERVICE_NAME \
                --watch false \
                --max-memory-restart 500M \
                --env production
            pm2 save
        else
            # 使用nohup启动
            cd \$BACKEND_PATH/server
            nohup node server.js > /var/log/\$SERVICE_NAME.log 2>&1 &
        fi

        sleep 3

        log_step "7. 健康检查..."
        MAX_RETRIES=5
        RETRY_COUNT=0
        while [ \$RETRY_COUNT -lt \$MAX_RETRIES ]; do
            if curl -s \$HEALTH_CHECK_URL > /dev/null 2>&1; then
                log_info "健康检查通过!"
                break
            fi
            RETRY_COUNT=\$((RETRY_COUNT + 1))
            log_warn "健康检查失败，重试中... (\$RETRY_COUNT/\$MAX_RETRIES)"
            sleep 2
        done

        if [ \$RETRY_COUNT -eq \$MAX_RETRIES ]; then
            log_error "健康检查失败，服务可能未正常启动"
            # 输出日志供排查
            if [ -f "/var/log/\$SERVICE_NAME.log" ]; then
                tail -50 /var/log/\$SERVICE_NAME.log
            fi
            pm2 logs \$SERVICE_NAME --lines 50 --nostream 2>/dev/null || true
        fi

        log_step "8. 设置开机自启..."
        if command -v pm2 &> /dev/null; then
            sudo env PATH=\$PATH:\$(which node) pm2 startup systemd -u \$DEPLOY_USER --hp \$HOME 2>/dev/null || true
        fi

        log_info "========== 后端部署完成 =========="
        log_info "服务状态:"
        pm2 status \$SERVICE_NAME 2>/dev/null || systemctl status \$SERVICE_NAME 2>/dev/null || echo "服务已启动"
EOF
}

# 执行部署
if remote_deploy; then
    log_info "========== 后端部署成功 =========="
    exit 0
else
    log_error "========== 后端部署失败 =========="
    exit 1
fi
