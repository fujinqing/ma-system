#!/bin/bash
#==============================================================================
# 回滚脚本 - 自动回滚到上一个稳定版本
# 用法: ./scripts/rollback.sh <frontend|backend|all> [环境]
# 示例: ./scripts/rollback.sh frontend production
#       ./scripts/rollback.sh backend staging
#       ./scripts/rollback.sh all production
#==============================================================================

set -e

# 配置
DEPLOY_USER="${DEPLOY_USER:-deploy}"
DEPLOY_HOST="${DEPLOY_HOST:-}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"
BACKEND_PATH="${BACKEND_PATH:-/opt/ma-system/backend}"
FRONTEND_PATH="${FRONTEND_PATH:-/var/www/ma-system}"

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
用法: $(basename "$0") <frontend|backend|all> [环境]

参数:
    frontend   回滚前端
    backend    回滚后端
    all        回滚前端和后端

环境: production | staging | development (默认: production)

示例:
    $(basename "$0") frontend production   # 回滚前端到生产环境
    $(basename "$0") backend staging       # 回滚后端到预发布环境
    $(basename "$0") all                   # 回滚所有到生产环境

重要: 回滚将使用最近一次备份，请确保备份存在
EOF
}

# 参数验证
if [ $# -lt 1 ]; then
    log_error "缺少参数"
    show_help
    exit 1
fi

TARGET=$1
ENVIRONMENT=${2:-production}

# 验证目标
case $TARGET in
    frontend|backend|all) ;;
    *)
        log_error "未知目标: $TARGET"
        show_help
        exit 1
        ;;
esac

# 验证环境
case $ENVIRONMENT in
    production|staging|development) ;;
    *)
        log_error "未知环境: $ENVIRONMENT"
        show_help
        exit 1
        ;;
esac

# 根据环境选择部署主机
case $ENVIRONMENT in
    production)
        DEPLOY_HOST="${DEPLOY_HOST:-$PROD_HOST}"
        BACKEND_PORT="${BACKEND_PORT:-3001}"
        ;;
    staging)
        DEPLOY_HOST="${DEPLOY_HOST:-$STAGING_HOST}"
        BACKEND_PORT="${BACKEND_PORT:-3002}"
        ;;
    development)
        DEPLOY_HOST="${DEPLOY_HOST:-$DEV_HOST}"
        BACKEND_PORT="${BACKEND_PORT:-3003}"
        ;;
esac

if [ -z "$DEPLOY_HOST" ]; then
    log_error "未设置部署主机，请设置 DEPLOY_HOST 环境变量"
    exit 1
fi

log_warn "========== 开始回滚操作 =========="
log_info "目标: $TARGET"
log_info "环境: $ENVIRONMENT"
log_info "主机: $DEPLOY_HOST"

# 回滚前端
rollback_frontend() {
    log_step "回滚前端..."

    ssh -p $DEPLOY_PORT $DEPLOY_USER@$DEPLOY_HOST << 'EOF'
        set -e

        FRONTEND_PATH="$FRONTEND_PATH"
        BACKUP_PATH="$FRONTEND_PATH/backup"

        echo "[INFO] 检查备份..."
        if [ ! -d "$BACKUP_PATH" ]; then
            echo "[ERROR] 备份目录不存在: $BACKUP_PATH"
            exit 1
        fi

        LATEST_BACKUP=$(ls -t $BACKUP_PATH/dist_*.tar.gz 2>/dev/null | head -1)
        if [ -z "$LATEST_BACKUP" ]; then
            echo "[ERROR] 未找到可用的备份文件"
            exit 1
        fi

        echo "[INFO] 使用备份: $LATEST_BACKUP"

        echo "[INFO] 备份当前版本..."
        if [ -d "$FRONTEND_PATH/dist" ]; then
            tar -czf $BACKUP_PATH/dist_emergency_$(date +%Y%m%d_%H%M%S).tar.gz -C $FRONTEND_PATH dist/ 2>/dev/null || true
            rm -rf $FRONTEND_PATH/dist
        fi

        echo "[INFO] 解压备份..."
        tar -xzf $LATEST_BACKUP -C $FRONTEND_PATH/

        echo "[INFO] 重启Web服务..."
        sudo systemctl reload nginx 2>/dev/null || true

        echo "[SUCCESS] 前端回滚完成!"
EOF

    if [ $? -eq 0 ]; then
        log_info "前端回滚成功"
    else
        log_error "前端回滚失败"
    fi
}

# 回滚后端
rollback_backend() {
    log_step "回滚后端..."

    ssh -p $DEPLOY_PORT $DEPLOY_USER@$DEPLOY_HOST << 'EOF'
        set -e

        BACKEND_PATH="$BACKEND_PATH"
        BACKUP_PATH="$BACKEND_PATH/backup"
        BACKEND_PORT="$BACKEND_PORT"
        SERVICE_NAME="ma-system-backend"

        echo "[INFO] 检查备份..."
        if [ ! -d "$BACKUP_PATH" ]; then
            echo "[ERROR] 备份目录不存在: $BACKUP_PATH"
            exit 1
        fi

        LATEST_BACKUP=$(ls -t $BACKUP_PATH/server_*.tar.gz 2>/dev/null | head -1)
        if [ -z "$LATEST_BACKUP" ]; then
            echo "[ERROR] 未找到可用的备份文件"
            exit 1
        fi

        echo "[INFO] 使用备份: $LATEST_BACKUP"

        echo "[INFO] 停止当前服务..."
        pm2 stop $SERVICE_NAME 2>/dev/null || true
        pkill -f "node.*server.js" 2>/dev/null || true
        sleep 2

        echo "[INFO] 备份当前版本..."
        if [ -f "$BACKEND_PATH/server.js" ]; then
            tar -czf $BACKUP_PATH/server_emergency_$(date +%Y%m%d_%H%M%S).tar.gz \
                -C $BACKEND_PATH . \
                --exclude='node_modules' \
                --exclude='backup' 2>/dev/null || true
        fi

        echo "[INFO] 解压备份..."
        rm -rf $BACKEND_PATH/*
        tar -xzf $LATEST_BACKUP -C $BACKEND_PATH/

        echo "[INFO] 重启服务..."
        cd $BACKEND_PATH/server
        pm2 start server.js --name $SERVICE_NAME --env production 2>/dev/null || \
            nohup node server.js > /var/log/$SERVICE_NAME.log 2>&1 &

        sleep 3

        echo "[INFO] 健康检查..."
        HEALTH_URL="http://localhost:$BACKEND_PORT/api/health"
        if curl -s $HEALTH_URL > /dev/null 2>&1; then
            echo "[SUCCESS] 后端回滚完成!"
        else
            echo "[WARN] 健康检查未通过，请检查服务状态"
        fi
EOF

    if [ $? -eq 0 ]; then
        log_info "后端回滚成功"
    else
        log_error "后端回滚失败"
    fi
}

# 执行回滚
case $TARGET in
    frontend)
        rollback_frontend
        ;;
    backend)
        rollback_backend
        ;;
    all)
        rollback_frontend
        rollback_backend
        ;;
esac

log_info "========== 回滚操作完成 =========="
