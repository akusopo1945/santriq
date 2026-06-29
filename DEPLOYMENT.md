# Deployment Guide - SantriQ

Panduan ini berisi langkah-langkah instalasi dan konfigurasi sistem **SantriQ** di Ubuntu VPS dengan RAM 2GB.

---

## 1. Persiapan Awal OS

Hubungkan ke server via SSH dan jalankan pembaruan sistem:
```bash
sudo apt update && sudo apt upgrade -y
```

---

## 2. Instalasi PostgreSQL (Native)

Instal PostgreSQL server:
```bash
sudo apt install postgresql postgresql-contrib -y
```

### 2.1 Konfigurasi RAM Rendah (2GB RAM)
Ubah file konfigurasi utama PostgreSQL `/etc/postgresql/*/main/postgresql.conf`:
```ini
# Resource Allocation untuk RAM 2GB
max_connections = 50
shared_buffers = 512MB
effective_cache_size = 1536MB
maintenance_work_mem = 64MB
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
```

Simpan file, lalu restart PostgreSQL service:
```bash
sudo systemctl restart postgresql
sudo systemctl enable postgresql
```

### 2.2 Membuat Database & User
Masuk ke PostgreSQL console:
```bash
sudo -i -u postgres psql
```
Jalankan command SQL:
```sql
CREATE DATABASE santriq_db;
CREATE USER santriq_user WITH PASSWORD 'P@ssw0rdSantriQ';
GRANT ALL PRIVILEGES ON DATABASE santriq_db TO santriq_user;
ALTER DATABASE santriq_db OWNER TO santriq_user;
\q
```

---

## 3. Instalasi Node.js & PM2

Instal Node.js LTS (versi 20):
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Instal PM2 secara global:
```bash
sudo npm install pm2 -g
```

---

## 4. Setup Backend NestJS

1. Clone repository atau upload source code ke VPS (misalnya ke `/var/www/html/santriq-backend`).
2. Buat file `.env` di folder root backend:
   ```env
   PORT=3000
   DATABASE_URL="postgresql://santriq_user:P@ssw0rdSantriQ@localhost:5462/santriq_db"
   JWT_SECRET="ganti_dengan_secret_key_yang_sangat_panjang_dan_aman"
   UPLOAD_DIR="/var/www/html/santriq-uploads"
   ```
3. Buat direktori untuk file uploads:
   ```bash
   sudo mkdir -p /var/www/html/santriq-uploads
   sudo chown -R $USER:$USER /var/www/html/santriq-uploads
   ```
4. Jalankan build aplikasi:
   ```bash
   npm install
   npm run build
   ```
5. Buat file `ecosystem.config.js` di root folder backend (lihat [ARCHITECTURE.md](file:///var/www/html/santriQ/ARCHITECTURE.md#L69-L97) untuk isinya).
6. Jalankan backend menggunakan PM2:
   ```bash
   pm2 start ecosystem.config.js
   ```
7. Konfigurasi auto-start PM2 setelah reboot VPS:
   ```bash
   pm2 startup systemd
   # (Jalankan perintah output yang diberikan oleh terminal, biasanya menggunakan sudo)
   pm2 save
   ```

---

## 5. Konfigurasi Nginx & Frontend Static

Instal Nginx:
```bash
sudo apt install nginx -y
```

### 5.1 Host Flutter Web Static
1. Letakkan folder build production Flutter Web (berisi `index.html`, `main.dart.js`, dll) ke folder `/var/www/html/santriq-frontend`.
2. Pastikan permission folder benar:
   ```bash
   sudo chown -R www-data:www-data /var/www/html/santriq-frontend
   ```

### 5.2 Konfigurasi Nginx Server Block
Buat file konfigurasi `/etc/nginx/sites-available/santriq`:
```nginx
server {
    listen 80;
    server_name santriq.my.id; # Ganti dengan domain Anda

    # Frontend Static Hosting
    location / {
        root /var/www/html/santriq-frontend;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    # Backend API Proxy
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Static Uploads Access
    location /uploads {
        alias /var/www/html/santriq-uploads;
        expires 7d;
        add_header Cache-Control "public, no-transform";
    }
}
```

Aktifkan konfigurasi dan restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/santriq /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 6. Setup SSL (Let's Encrypt)

Gunakan Certbot untuk menginstal SSL certificate secara otomatis:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d santriq.my.id
```

---

## 7. Script Backup Otomatis (Cronjob)

1. Buat direktori untuk file backup:
   ```bash
   mkdir -p ~/backups
   ```
2. Buat script shell backup `~/backup_db.sh`:
   ```bash
   #!/bin/bash
   BACKUP_DIR="/home/$USER/backups"
   DB_NAME="santriq_db"
   DB_USER="santriq_user"
   DATE=$(date +%Y-%m-%d_%H%M%S)

   pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > "$BACKUP_DIR/db_backup_$DATE.sql.gz"

   # Hapus backup yang lebih dari 7 hari
   find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +7 -delete
   ```
3. Beri izin eksekusi script:
   ```bash
   chmod +x ~/backup_db.sh
   ```
4. Tambahkan ke crontab harian (pukul 02:00 pagi):
   ```bash
   crontab -e
   ```
   Tambahkan baris berikut di paling bawah:
   ```cron
   0 2 * * * /home/username/backup_db.sh
   ```
