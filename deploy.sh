#!/bin/bash
# ==============================================================================
# Phoenix RP Forum - Automatic Deployment Script for Ubuntu 22.04 / 24.04
# ==============================================================================

set -e

DOMAIN="phoenix-rp.online"
IP="31.77.10.29"
APP_DIR="/var/www/phoenix"
REPO_URL="https://github.com/timadusik-cmd/phoenixforum.git"

echo "================================================================="
echo "  🚀 Запуск автоматической установки форума Phoenix RP на VPS"
echo "  Сервер: $IP | Домен: $DOMAIN"
echo "================================================================="

# 1. Update system packages
echo "📦 [1/6] Обновление пакетов и установка зависимостей..."
apt-get update -y
apt-get install -y curl wget git build-essential nginx certbot python3-certbot-nginx ufw

# 2. Install Node.js 20 LTS
echo "⚡ [2/6] Установка Node.js 20 LTS..."
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'.' -f1) != "v20" && $(node -v | cut -d'.' -f1) != "v22" ]]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

echo "Node.js версия: $(node -v)"
echo "NPM версия: $(npm -v)"

# Install PM2 process manager
npm install -g pm2

# 3. Clone or update repository
echo "📂 [3/6] Загрузка файлов форума из GitHub..."
mkdir -p /var/www
if [ -d "$APP_DIR/.git" ]; then
    echo "Директория существует, обновляем код..."
    cd $APP_DIR
    git reset --hard
    git pull origin main
else
    rm -rf $APP_DIR
    git clone $REPO_URL $APP_DIR
    cd $APP_DIR
fi

# 4. Install npm modules and build production frontend
echo "🔨 [4/6] Установка модулей и сборка продакшн-версии..."
npm install
npm run build

# 5. Configure PM2 daemon
echo "🔄 [5/6] Запуск бэкенда через PM2..."
pm2 delete phoenix-forum 2>/dev/null || true
pm2 start server/index.js --name "phoenix-forum"
pm2 save
pm2 startup systemd -u root --hp /root || true

# 6. Configure Nginx Web Server
echo "🌐 [6/6] Настройка Nginx reverse proxy..."

cat > /etc/nginx/sites-available/phoenix << 'EOF'
server {
    listen 80;
    server_name phoenix-rp.online www.phoenix-rp.online 31.77.10.29;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

ln -sf /etc/nginx/sites-available/phoenix /etc/nginx/sites-enabled/phoenix
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

# Firewall configuration
ufw allow 22/tcp || true
ufw allow 80/tcp || true
ufw allow 443/tcp || true

echo "================================================================="
echo "  ✅ УСТАНОВКА УСПЕШНО ЗАВЕРШЕНА!"
echo "================================================================="
echo ""
echo "  Форум уже доступен напрямую по IP:"
echo "  👉 http://$IP"
echo ""
echo "  После обновления DNS домен откроется:"
echo "  👉 http://$DOMAIN"
echo ""
echo "  Для подключения бесплатного SSL сертификата выполните:"
echo "  certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo "================================================================="
