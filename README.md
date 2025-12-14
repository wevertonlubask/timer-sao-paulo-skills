# SP Skills Timer v3.0

Sistema de cronometragem para competições São Paulo Skills, com suporte a múltiplos competidores, tempo extra individual, telão para projeção e geração de relatórios PDF.

![SP Skills Timer](https://img.shields.io/badge/version-3.0-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![Vite](https://img.shields.io/badge/Vite-5-646cff)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38bdf8)

---

## 📋 Índice

1. [Funcionalidades](#-funcionalidades)
2. [Requisitos](#-requisitos)
3. [Instalação Local (Desenvolvimento)](#-instalação-local-desenvolvimento)
4. [Implantação em Produção](#-implantação-em-produção-debian-12--apache)
   - [Preparação do Servidor](#1-preparação-do-servidor)
   - [Instalação do Node.js](#2-instalação-do-nodejs)
   - [Build do Projeto](#3-build-do-projeto)
   - [Configuração do Apache](#4-configuração-do-apache)
   - [Certificado HTTPS (Let's Encrypt)](#5-certificado-https-lets-encrypt)
   - [Configuração Final](#6-configuração-final)
5. [Personalização](#-personalização)
6. [Estrutura do Projeto](#-estrutura-do-projeto)
7. [Troubleshooting](#-troubleshooting)

---

## ✨ Funcionalidades

- ⏱️ **Timer Geral** - Cronômetro principal da prova
- 👥 **Múltiplos Competidores** - Suporte ilimitado de participantes
- ⏸️ **Pausa Individual** - Cada competidor pode pausar/retomar independentemente
- 🕐 **Tempo Extra** - Compensação automática de tempo pausado
- 📺 **Telão** - Visualização para projeção em tela grande
- 📄 **Relatório PDF** - Geração automática com histórico detalhado
- ✍️ **Página de Assinaturas** - Campos para avaliadores no PDF
- 🔒 **Proteção de Dados** - Exige download do PDF antes de reiniciar
- 💾 **Persistência** - Dados salvos automaticamente no navegador
- 🎨 **Interface Moderna** - Design escuro com glassmorphism

---

## 📦 Requisitos

### Para Desenvolvimento
- Node.js 18+ 
- npm 9+

### Para Produção
- Debian 12 (ou Ubuntu 22.04+)
- Apache 2.4+
- Certificado SSL (Let's Encrypt recomendado)
- Domínio configurado

---

## 💻 Instalação Local (Desenvolvimento)

```bash
# Clonar/extrair o projeto
unzip timer-modern.zip
cd timer-modern

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse: `http://localhost:5173`

---

## 🚀 Implantação em Produção (Debian 12 + Apache)

### 1. Preparação do Servidor

```bash
# Conectar via SSH
ssh usuario@seu_servidor

# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar ferramentas básicas
sudo apt install -y curl wget unzip git
```

### 2. Instalação do Node.js

O Node.js é necessário apenas para fazer o build. Após o build, pode ser removido.

```bash
# Instalar Node.js 20 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalação
node --version   # v20.x.x
npm --version    # 10.x.x
```

### 3. Build do Projeto

```bash
# Criar diretório de trabalho
mkdir -p ~/build
cd ~/build

# Fazer upload do projeto (via SCP do seu computador)
# scp timer-modern.zip usuario@servidor:~/build/

# Extrair
unzip timer-modern.zip
cd timer-modern

# Instalar dependências
npm install

# Gerar build de produção
npm run build
```

O build gera a pasta `dist/` com os arquivos estáticos.

### 4. Configuração do Apache

#### 4.1. Instalar Apache (se necessário)

```bash
sudo apt install -y apache2
sudo systemctl enable apache2
sudo systemctl start apache2
```

#### 4.2. Habilitar módulos necessários

```bash
sudo a2enmod rewrite
sudo a2enmod headers
sudo a2enmod ssl
sudo a2enmod http2
sudo systemctl restart apache2
```

#### 4.3. Criar diretório do site

```bash
# Criar diretório
sudo mkdir -p /var/www/timer

# Copiar arquivos do build
sudo cp -r ~/build/timer-modern/dist/* /var/www/timer/

# Copiar pastas de assets
sudo cp -r ~/build/timer-modern/public/logo /var/www/timer/
sudo cp -r ~/build/timer-modern/public/icon /var/www/timer/

# Ajustar permissões
sudo chown -R www-data:www-data /var/www/timer
sudo chmod -R 755 /var/www/timer
```

#### 4.4. Criar Virtual Host

```bash
sudo nano /etc/apache2/sites-available/timer.conf
```

Cole o seguinte conteúdo (substitua `seu-dominio.com.br` pelo seu domínio):

```apache
<VirtualHost *:80>
    ServerName seu-dominio.com.br
    ServerAlias www.seu-dominio.com.br
    
    # Redirecionar HTTP para HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</VirtualHost>

<VirtualHost *:443>
    ServerName seu-dominio.com.br
    ServerAlias www.seu-dominio.com.br
    
    DocumentRoot /var/www/timer
    
    # HTTP/2
    Protocols h2 http/1.1
    
    # SSL (será configurado pelo Certbot)
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/seu-dominio.com.br/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/seu-dominio.com.br/privkey.pem
    
    # Diretório do site
    <Directory /var/www/timer>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        # SPA - Redireciona rotas para index.html
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    # Cache para assets estáticos
    <Directory /var/www/timer/assets>
        <FilesMatch "\.(js|css|woff2|woff|ttf)$">
            Header set Cache-Control "max-age=31536000, public, immutable"
        </FilesMatch>
    </Directory>
    
    # Cache para imagens
    <FilesMatch "\.(png|jpg|jpeg|svg|ico|gif|webp)$">
        Header set Cache-Control "max-age=86400, public"
    </FilesMatch>
    
    # Segurança
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    
    # Logs
    ErrorLog ${APACHE_LOG_DIR}/timer_error.log
    CustomLog ${APACHE_LOG_DIR}/timer_access.log combined
</VirtualHost>
```

#### 4.5. Criar .htaccess

```bash
sudo nano /var/www/timer/.htaccess
```

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    
    # SPA - Redireciona para index.html
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>

# Compressão GZIP
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/css
    AddOutputFilterByType DEFLATE application/javascript application/json
    AddOutputFilterByType DEFLATE image/svg+xml
</IfModule>

# Segurança
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "SAMEORIGIN"
</IfModule>

# Prevenir listagem de diretórios
Options -Indexes
```

### 5. Certificado HTTPS (Let's Encrypt)

#### 5.1. Instalar Certbot

```bash
sudo apt install -y certbot python3-certbot-apache
```

#### 5.2. Obter certificado

**Opção A: Se você ainda NÃO tem certificado**

```bash
# Primeiro, habilite o site apenas com HTTP (comente as linhas SSL no timer.conf)
# Ou crie uma versão simplificada temporária

# Habilitar site
sudo a2ensite timer.conf
sudo a2dissite 000-default.conf
sudo systemctl reload apache2

# Obter certificado (substitua pelo seu domínio e email)
sudo certbot --apache -d seu-dominio.com.br -d www.seu-dominio.com.br \
    --email seu-email@exemplo.com \
    --agree-tos \
    --no-eff-email
```

**Opção B: Se você JÁ tem certificado instalado**

Apenas verifique os caminhos no arquivo `timer.conf`:

```bash
# Verificar certificados existentes
sudo certbot certificates

# O output mostrará os caminhos, por exemplo:
# Certificate Path: /etc/letsencrypt/live/seu-dominio.com.br/fullchain.pem
# Private Key Path: /etc/letsencrypt/live/seu-dominio.com.br/privkey.pem
```

Ajuste os caminhos no `timer.conf` se necessário.

#### 5.3. Renovação automática

O Certbot configura renovação automática. Para verificar:

```bash
# Testar renovação
sudo certbot renew --dry-run

# Verificar timer de renovação
sudo systemctl status certbot.timer
```

#### 5.4. Configuração SSL otimizada (opcional)

Para melhor segurança, edite:

```bash
sudo nano /etc/letsencrypt/options-ssl-apache.conf
```

Adicione/verifique:
```apache
SSLProtocol             all -SSLv2 -SSLv3 -TLSv1 -TLSv1.1
SSLCipherSuite          ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256
SSLHonorCipherOrder     off
SSLSessionTickets       off
```

### 6. Configuração Final

#### 6.1. Ativar site e reiniciar Apache

```bash
# Habilitar site
sudo a2ensite timer.conf

# Desabilitar site padrão (opcional)
sudo a2dissite 000-default.conf

# Testar configuração
sudo apache2ctl configtest

# Reiniciar Apache
sudo systemctl restart apache2
```

#### 6.2. Configurar Firewall (UFW)

```bash
sudo apt install -y ufw
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status
```

#### 6.3. Verificar instalação

```bash
# Verificar Apache
sudo systemctl status apache2

# Verificar certificado
sudo certbot certificates

# Testar acesso
curl -I https://seu-dominio.com.br
```

Acesse no navegador: `https://seu-dominio.com.br`

---

## 🎨 Personalização

### Logo da Competição

Coloque sua logo em `/var/www/timer/logo/`:

```bash
# Upload via SCP
scp sua-logo.png usuario@servidor:/tmp/

# Mover para pasta correta
sudo mv /tmp/sua-logo.png /var/www/timer/logo/logo.png
sudo chown www-data:www-data /var/www/timer/logo/logo.png
```

**Especificações:**
- Nome: `logo.png` (ou `.svg`, `.jpg`)
- Tamanho recomendado: 200x200 pixels ou maior
- Fundo transparente (se PNG)

### Favicon

Coloque seu favicon em `/var/www/timer/icon/`:

```bash
sudo mv /tmp/seu-favicon.svg /var/www/timer/icon/favicon.svg
sudo chown www-data:www-data /var/www/timer/icon/favicon.svg
```

### Adicionar Ocupações

Edite o arquivo `src/App.jsx` antes do build, procure pelo select de ocupações (~linha 920):

```jsx
<option value="NOVA OCUPAÇÃO" className="bg-[#1a1a2e]">NOVA OCUPAÇÃO</option>
```

### Adicionar Módulos/Provas

No mesmo arquivo, procure pelos selects de Módulo e Prova (~linha 940-960).

---

## 📁 Estrutura do Projeto

```
timer-modern/
├── public/
│   ├── logo/
│   │   ├── README.txt
│   │   └── logo.png          # Sua logo aqui
│   └── icon/
│       ├── README.txt
│       └── favicon.svg       # Seu favicon aqui
├── src/
│   ├── App.jsx               # Componente principal
│   ├── main.jsx              # Entry point
│   └── index.css             # Estilos globais
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

### Estrutura após build (`dist/`)

```
dist/
├── assets/
│   ├── index-[hash].css
│   └── index-[hash].js
├── logo/
│   └── logo.png
├── icon/
│   └── favicon.svg
└── index.html
```

---

## 🔧 Troubleshooting

### Página em branco

```bash
# Verificar arquivos
ls -la /var/www/timer/

# Verificar permissões
sudo chown -R www-data:www-data /var/www/timer
sudo chmod -R 755 /var/www/timer

# Verificar logs
sudo tail -50 /var/log/apache2/timer_error.log
```

### Erro 404 ao recarregar página

```bash
# Verificar mod_rewrite
sudo a2enmod rewrite
sudo systemctl restart apache2

# Verificar .htaccess
cat /var/www/timer/.htaccess
```

### Logo não aparece

```bash
# Verificar arquivo
ls -la /var/www/timer/logo/

# Verificar permissões
sudo chmod 644 /var/www/timer/logo/logo.png

# Testar acesso
curl -I https://seu-dominio.com.br/logo/logo.png
```

### Certificado SSL não renova

```bash
# Testar renovação manual
sudo certbot renew --dry-run

# Forçar renovação
sudo certbot renew --force-renewal

# Verificar logs
sudo journalctl -u certbot
```

### PDF não gera

- Verifique o Console do navegador (F12)
- Teste em outro navegador (Chrome/Firefox)
- Verifique se há erros de JavaScript

### Limpar cache do navegador

- Chrome: `Ctrl+Shift+R` ou `Ctrl+F5`
- Firefox: `Ctrl+Shift+R`
- Ou abra em aba anônima

---

## 📊 Comandos Úteis

```bash
# Status do Apache
sudo systemctl status apache2

# Reiniciar Apache
sudo systemctl restart apache2

# Testar configuração
sudo apache2ctl configtest

# Ver logs em tempo real
sudo tail -f /var/log/apache2/timer_error.log
sudo tail -f /var/log/apache2/timer_access.log

# Verificar certificados
sudo certbot certificates

# Uso de disco
df -h /var/www/timer

# Backup do site
sudo tar -czvf timer-backup.tar.gz /var/www/timer
```

---

## 🔄 Atualizações

Para atualizar o sistema:

```bash
cd ~/build/timer-modern

# Fazer backup
sudo cp -r /var/www/timer /var/www/timer.backup

# Upload da nova versão
# scp timer-modern-novo.zip usuario@servidor:~/build/

# Extrair e rebuild
unzip -o timer-modern-novo.zip
npm install
npm run build

# Atualizar arquivos
sudo cp -r dist/* /var/www/timer/
sudo chown -R www-data:www-data /var/www/timer

# Manter logo e favicon personalizados
# (eles já estão em /var/www/timer/logo e /var/www/timer/icon)
```

---

## 📝 Licença

Desenvolvido para São Paulo Skills.

---

## 🆘 Suporte

Em caso de problemas:

1. Verifique os logs do Apache
2. Consulte a seção Troubleshooting
3. Teste em modo anônimo do navegador
4. Verifique o Console do navegador (F12)
