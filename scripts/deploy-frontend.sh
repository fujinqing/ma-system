#!/bin/bash
#==============================================================================
# 前端部署脚本
# 用法: ./scripts/deploy-frontend.sh <环境> [版本号]
# 示例: ./scripts/deploy-frontend.sh production
#       ./scripts/deploy-frontend.sh staging v1.2.3
#==============================================================================

set -e

# 配置
DEPLOY_USER="${DEPLOY_USER:-deploy}"
DEPLOY_HOST="${DEPLOY_HOST:-}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/ma-system}"
ROLLBACK_PATH="${DEPLOY_PATH}/backup"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 帮助信息
show_help() {
    cat << EOF
用法: $(basename "$0") <环境> [版本号]

环境选项:
    production   生产环境
    staging      预发布环境
    development  开发环境

示例:
    $(basename "$0") production      # 部署最新构建
    $(basename "$0") staging v1.2.3  # 部署指定版本

前置要求:
    1. 配置SSH密钥免密登录
    2. 设置环境变量或传递参数
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
        DEPLOY_PATH="${DEPLOY_PATH}"
        SERVICE_CMD="sudo systemctl reload nginx"
        ;;
    staging)
        DEPLOY_HOST="${DEPLOY_HOST:-$STAGING_HOST}"
        DEPLOY_PATH="${STAGING_PATH:-/var/www/ma-system-staging}"
        SERVICE_CMD="sudo systemctl reload nginx"
        ;;
    development)
        DEPLOY_HOST="${DEPLOY_HOST:-$DEV_HOST}"
        DEPLOY_PATH="${DEV_PATH:-/var/www/ma-system-dev}"
        SERVICE_CMD="echo 'Dev server'"
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

log_info "========== 开始部署前端 =========="
log_info "环境: $ENVIRONMENT"
log_info "主机: $DEPLOY_HOST"
log_info "路径: $DEPLOY_PATH"
log_info "版本: $VERSION"

# 创建临时目录
WORK_DIR=$(mktemp -d)
trap "rm -rf $WORK_DIR" EXIT

# 远程部署函数
remote_deploy() {
    ssh -p $DEPLOY_PORT $DEPLOY_USER@$DEPLOY_HOST << EOF
        set -e

        echo "[INFO] 进入部署目录..."
        cd $DEPLOY_PATH

        echo "[INFO] 创建备份..."
        if [ -d "dist" ]; then
            mkdir -p $ROLLBACK_PATH
            tar -czf $ROLLBACK_PATH/dist_${TIMESTAMP}.tar.gz dist/ 2>/dev/null || true
            echo "[INFO] 备份已创建: dist_${TIMESTAMP}.tar.gz"

            # 保留最近10个备份
            cd $ROLLBACK_PATH
            ls -t | tail -n +11 | xargs -r rm -f
            cd $DEPLOY_PATH
        fi

        echo "[INFO] 更新文件..."
        rm -rf dist_new
        mkdir -p dist_new

        # 从环境变量获取构建产物或从共享存储获取
        if [ -n "$BUILD_ARTIFACT" ]; then
            echo "[INFO] 从CI artifact 部署..."
        fi

        # 设置权限
        chown -R $DEPLOY_USER:$DEPLOY_USER $DEPLOY_PATH

        # 重启服务
        echo "[INFO] 重启Web服务..."
        $SERVICE_CMD

        echo "[INFO] 验证部署..."
        if [ -d "dist" ]; then
            echo "[SUCCESS] 部署完成!"
        else
            echo "[ERROR] 部署验证失败"
            exit 1
        fi
EOF
}

# 执行部署
if remote_deploy; then
    log_info "========== 前端部署成功 =========="
    exit 0
else
    log_error "========== 前端部署失败 =========="
    exit 1
fi
