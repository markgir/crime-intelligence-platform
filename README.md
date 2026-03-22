# 🚀 Crime Intelligence Platform

> Plataforma Completa de Inteligência Criminal com Dashboards OSINT, Gestão Integrada e Backups Automáticos

![Node.js](https://img.shields.io/badge/Node.js-v14+-green)
![React](https://img.shields.io/badge/React-v18+-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-336791)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Características Principais](#-características-principais)
- [Arquitetura](#-arquitetura)
- [Instalação Rápida](#-instalação-rápida-uma-linha)
- [Instalação Manual](#-instalação-manual)
- [Configuração](#-configuração)
- [API Endpoints](#-api-endpoints-60)
- [Exemplos de Uso](#-exemplos-de-uso)
- [Stack Tecnológico](#-stack-tecnológico)
- [Roadmap](#-roadmap)
- [Segurança](#-segurança)
- [Contribuições](#-contribuições)
- [Suporte & Contactos](#-suporte--contactos)

---

## 👁️ Visão Geral

A **Crime Intelligence Platform** é uma solução completa e *production-ready* de inteligência criminal que permite:

- 📊 **Análise OSINT em Tempo Real** – Dashboards com visualizações gráficas
- 👥 **Gestão Integrada de Pessoas** – Registo completo com endereços, telefones e redes sociais
- 🚗 **Gestão de Veículos** – Rastreamento e histórico
- 🚨 **Gestão de Crimes** – Sistema dinâmico com vítimas e suspeitos
- 🔗 **Relacionamentos Complexos** – Mapeamento de conexões em grafo
- 💊 **Rede de Drogas** – Rastreamento de cadeias de distribuição
- 💾 **Backups Automáticos** – Agendamento e restauração
- 🔐 **Autenticação Segura** – JWT com controle de roles (RBAC)

---

## ✨ Características Principais

### 🔐 Autenticação & Segurança

- ✅ JWT com tokens de 24 h e refresh de 7 dias
- ✅ Controlo de acesso por roles (`admin`, `investigator`, `analyst`, `viewer`)
- ✅ Hash bcrypt de passwords (10+ rounds)
- ✅ Rate limiting global (200 req / 15 min por IP)
- ✅ Middleware de validação em todas as rotas
- ✅ CORS configurado
- ✅ Helmet.js para security headers

### 👤 Módulo de Pessoas

- ✅ CRUD completo com paginação
- ✅ Múltiplos endereços (residencial, comercial, outro)
- ✅ Múltiplos telefones (móvel, residencial, comercial)
- ✅ Perfis de redes sociais (Twitter, Facebook, Instagram, etc.)
- ✅ Busca avançada por nome, ID, nacionalidade
- ✅ Relacionamentos com veículos e crimes

### 🚗 Módulo de Veículos

- ✅ Registo com matrícula única
- ✅ Associação com proprietários
- ✅ Rastreamento de histórico
- ✅ Busca por matrícula (*plate search*)
- ✅ Relacionamento com crimes
- ✅ Atualização de proprietário

### 🚨 Módulo de Crimes

- ✅ Sistema dinâmico de tipos (customizável)
- ✅ Campos personalizados por tipo (JSON)
- ✅ Múltiplas vítimas e suspeitos
- ✅ Níveis de confiança para suspeitos (`low`, `medium`, `high`)
- ✅ Coordenadas GPS (latitude/longitude)
- ✅ Status (`open`, `investigating`, `closed`)
- ✅ Busca por localização, data, tipo

### 🔗 Módulo de Relacionamentos

- ✅ Pessoa ↔ Pessoa (amigos, colegas, associados)
- ✅ Pessoa ↔ Veículo (proprietário, condutor, passageiro)
- ✅ Pessoa ↔ Crime (vítima, suspeito, testemunha)
- ✅ Veículo ↔ Crime (usado, alvo, fuga)
- ✅ Visualização em grafo com força-dirigida
- ✅ Análise de redes e conexões

### 💊 Módulo de Rede de Drogas

- ✅ Rastreamento Consumidor → Vendedor → Distribuidor
- ✅ Cadeias de distribuição complexas
- ✅ Quantidades de substâncias
- ✅ Datas de transações
- ✅ Análise de fluxo de tráfico

### 📊 Dashboard OSINT

- ✅ Gráficos de linha (crimes por data)
- ✅ Gráficos de pizza (crimes por tipo)
- ✅ Gráficos de barras (top localizações)
- ✅ Cards de estatísticas
- ✅ Métricas rápidas (taxa de resolução, casos ativos)
- ✅ Grafo de relacionamentos interativo

### 💾 Sistema de Backups

- ✅ Backups manuais sob demanda
- ✅ Backups automáticos agendados:
  - ⏰ Horário (a cada hora)
  - ⏰ Diário (02:00 AM)
  - ⏰ Semanal (Domingo 03:00 AM)
  - ⏰ Mensal (1.º dia 04:00 AM)
- ✅ Compressão GZIP automática
- ✅ Restauração completa da base de dados (`pg_dump` / `psql`)
- ✅ Limpeza automática de backups com mais de 30 dias
- ✅ Estatísticas e logs

---

## 🏗️ Arquitetura

```text
┌─────────────────────────────────────────────────┐
│     CRIME INTELLIGENCE PLATFORM v1.0.0          │
├──────────────────┬──────────────────────────────┤
│   FRONTEND       │       BACKEND                │
│   (React 18)     │   (Node.js + Express)        │
├──────────────────┼──────────────────────────────┤
│                  │                              │
│  Dashboard       │  Authentication (JWT)        │
│  Network Graph   │  People Management           │
│  Backup Mgr      │  Vehicle Management          │
│  Forms CRUD      │  Crime Management            │
│  Tables          │  Relationships               │
│  Auth Login      │  Drug Networks               │
│                  │  Backup Scheduler (Cron)     │
│                  │  Statistics & Analytics      │
│                  │                              │
└──────────────────┴──────────────────────────────┘
         ↓ HTTP/REST                   ↓
    ┌────────────────┐        ┌─────────────────┐
    │ Recharts       │        │ PostgreSQL 12+  │
    │ Chart.js       │        │ (Database)      │
    │ Canvas         │        │ (Backups)       │
    └────────────────┘        └─────────────────┘
```

---

## 🚀 Instalação Rápida (Uma Linha)

**Linux / macOS:**

```bash
git clone https://github.com/markgir/crime-intelligence-platform.git && \
  cd crime-intelligence-platform && \
  npm install && \
  npm install -g pm2 && \
  cd backend && npm install && \
  cd ../frontend && npm install && \
  echo "✅ Instalação concluída!"
```

**Windows (PowerShell):**

```powershell
git clone https://github.com/markgir/crime-intelligence-platform.git; `
  cd crime-intelligence-platform; `
  npm install; `
  npm install -g pm2; `
  cd backend; npm install; `
  cd ..\frontend; npm install; `
  Write-Host "✅ Instalação concluída!"
```

> ⚠️ Após a instalação, edite `backend/.env` com as suas credenciais de base de dados antes de iniciar os serviços.

---

## 📦 Instalação Manual

### Pré-requisitos

- [Node.js v14+](https://nodejs.org/)
- [PostgreSQL 12+](https://www.postgresql.org/download/)
- [Git](https://git-scm.com/)

### 1️⃣ Clonar Repositório

```bash
git clone https://github.com/markgir/crime-intelligence-platform.git
cd crime-intelligence-platform
```

### 2️⃣ Configurar Backend

```bash
cd backend
npm install

# Criar ficheiro de ambiente
cat > .env << 'EOF'
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crime_intelligence
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-change-in-production
PORT=5000
NODE_ENV=development
BACKUP_RETENTION_DAYS=30
BACKUP_DIR=./backups
EOF

# Criar base de dados
createdb -U postgres crime_intelligence

# Aplicar esquema
psql -U postgres -d crime_intelligence -f ../database/schema.sql

# Iniciar servidor
npm start
```

### 3️⃣ Configurar Frontend

```bash
cd ../frontend
npm install

# Criar ficheiro de ambiente
cat > .env << 'EOF'
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_JWT_STORAGE_KEY=token
EOF

# Iniciar aplicação
npm start
```

### 4️⃣ Iniciar com PM2 (Produção)

```bash
# A partir da raiz do projeto
npm install -g pm2
npm start          # equivale a: pm2 start ecosystem.config.js
pm2 save           # guardar lista de processos
pm2 startup        # iniciar automaticamente no arranque do sistema
```

---

## ⚙️ Configuração

### Backend (`backend/.env`)

```env
# Base de Dados
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crime_intelligence

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Servidor
PORT=5000
NODE_ENV=development

# Backups
BACKUP_RETENTION_DAYS=30
BACKUP_DIR=./backups
```

### Frontend (`frontend/.env`)

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_JWT_STORAGE_KEY=token
```

---

## 🔌 API Endpoints (60+)

### Autenticação (5 endpoints)

```text
POST   /api/auth/register           # Registar novo utilizador
POST   /api/auth/login              # Login (retorna JWT)
POST   /api/auth/refresh            # Renovar token
POST   /api/auth/logout             # Logout
GET    /api/auth/me                 # Dados do utilizador autenticado
```

### Pessoas (8 endpoints)

```text
GET    /api/people                  # Listar (paginado, com busca)
POST   /api/people                  # Criar
GET    /api/people/:id              # Detalhes
PUT    /api/people/:id              # Atualizar
DELETE /api/people/:id              # Eliminar
POST   /api/people/:id/addresses    # Adicionar endereço
POST   /api/people/:id/phones       # Adicionar telefone
POST   /api/people/:id/social-media # Adicionar rede social
```

### Veículos (7 endpoints)

```text
GET    /api/vehicles                # Listar
POST   /api/vehicles                # Criar
GET    /api/vehicles/:id            # Detalhes
PUT    /api/vehicles/:id            # Atualizar
DELETE /api/vehicles/:id            # Eliminar
GET    /api/vehicles/plate/:plate   # Buscar por matrícula
PUT    /api/vehicles/:id/owner      # Atualizar proprietário
```

### Crimes (12 endpoints)

```text
GET    /api/crimes                              # Listar
POST   /api/crimes                              # Criar
GET    /api/crimes/:id                          # Detalhes
PUT    /api/crimes/:id                          # Atualizar
DELETE /api/crimes/:id                          # Eliminar
POST   /api/crimes/:id/victims                  # Adicionar vítima
DELETE /api/crimes/:crimeId/victims/:victimId   # Remover vítima
POST   /api/crimes/:id/suspects                 # Adicionar suspeito
DELETE /api/crimes/:crimeId/suspects/:suspectId # Remover suspeito
GET    /api/crimes/types/all                    # Listar tipos
POST   /api/crimes/types                        # Criar tipo
DELETE /api/crimes/types/:id                    # Eliminar tipo
```

### Relacionamentos (10 endpoints)

```text
GET    /api/relationships                              # Listar
POST   /api/relationships/person-to-person            # Criar (Pessoa ↔ Pessoa)
POST   /api/relationships/person-to-vehicle           # Criar (Pessoa ↔ Veículo)
POST   /api/relationships/person-to-crime             # Criar (Pessoa ↔ Crime)
POST   /api/relationships/vehicle-to-crime            # Criar (Veículo ↔ Crime)
PUT    /api/relationships/:id                         # Atualizar
DELETE /api/relationships/:id                         # Eliminar
GET    /api/relationships/graph/person/:id            # Grafo de uma pessoa
GET    /api/relationships/crime/:crimeId/relationships # Conexões de um crime
GET    /api/relationships/drug-network/all            # Listar redes de droga
```

### Backups (9 endpoints)

```text
GET    /api/backups                      # Listar
GET    /api/backups/:id                  # Detalhes
POST   /api/backups/manual               # Criar backup manual
POST   /api/backups/automatic            # Criar backup automático
POST   /api/backups/restore/:id          # Restaurar
DELETE /api/backups/:id                  # Eliminar
GET    /api/backups/:id/logs             # Logs do backup
GET    /api/backups/:id/status           # Estado do backup
GET    /api/backups/statistics/overview  # Estatísticas gerais
```

**Total: 60+ Endpoints REST**

---

## 🎯 Exemplos de Uso

### 1. Registar Utilizador

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "investigator1",
    "email": "inv@example.com",
    "password": "SecurePassword123!",
    "role": "investigator"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"investigator1","password":"SecurePassword123!"}'
```

### 3. Criar Pessoa

```bash
TOKEN="seu_token_jwt"
curl -X POST http://localhost:5000/api/people \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"first_name":"João","last_name":"Silva","id_number":"12345678A"}'
```

### 4. Criar Crime

```bash
curl -X POST http://localhost:5000/api/crimes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "location": "Lisboa",
    "crime_date": "2026-03-22T14:30:00Z",
    "description": "Roubo"
  }'
```

### 5. Criar Backup Manual

```bash
curl -X POST http://localhost:5000/api/backups/manual \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"backup_name":"backup_2026-03-22"}'
```

---

## 🛠️ Stack Tecnológico

### Backend

| Tecnologia        | Versão | Uso                    |
|-------------------|--------|------------------------|
| Node.js           | v14+   | Runtime                |
| Express.js        | v4+    | Framework Web          |
| PostgreSQL        | 12+    | Base de Dados          |
| jsonwebtoken      | v9+    | Autenticação JWT       |
| bcryptjs          | v2+    | Hash de passwords      |
| node-cron         | v3+    | Agendamento de backups |
| dotenv            | v16+   | Variáveis de ambiente  |
| helmet            | v7+    | Security headers       |
| cors              | v2+    | CORS                   |
| express-rate-limit| v7+    | Rate limiting          |

### Frontend

| Tecnologia    | Versão | Uso               |
|---------------|--------|-------------------|
| React         | v18+   | Framework UI      |
| React Router  | v6+    | Roteamento SPA    |
| Axios         | v1+    | HTTP Client       |
| Recharts      | v2+    | Gráficos          |
| CSS3          | –      | Estilização       |

### DevOps

| Ferramenta | Uso                            |
|------------|--------------------------------|
| Git        | Versionamento                  |
| GitHub     | Repositório                    |
| PM2        | Process Manager                |
| Docker     | Containerização (opcional)     |

---

## 📈 Roadmap

- [x] Autenticação JWT
- [x] CRUD Pessoas
- [x] CRUD Veículos
- [x] CRUD Crimes
- [x] Sistema de Relacionamentos
- [x] Rede de Drogas
- [x] Dashboard OSINT
- [x] Backups Automáticos
- [ ] Importação de Excel/Access
- [ ] Integração com APIs externas
- [ ] Sistema de alertas
- [ ] Análise de padrões (ML)
- [ ] Geolocalização avançada
- [ ] Relatórios PDF
- [ ] Integração com câmaras CCTV

---

## 🔒 Segurança

- ✅ Autenticação com JWT (access + refresh tokens)
- ✅ Hashing bcrypt (10+ rounds)
- ✅ CORS configurado
- ✅ Helmet.js para security headers
- ✅ Rate limiting global
- ✅ Validação de input
- ✅ SQL injection prevention (parameterized queries)
- ✅ HTTPS em produção (recomendado)
- ✅ Variáveis sensíveis em `.env` (nunca em controlo de versão)
- ✅ Role-based access control (RBAC)

---

## 📝 Licença

MIT License – Veja [LICENSE](LICENSE) para detalhes.

---

## 👥 Contribuições

Contribuições são bem-vindas! Por favor:

1. Faça um **Fork** do projeto
2. Crie uma branch (`git checkout -b feature/YourFeature`)
3. Commit (`git commit -m 'Add YourFeature'`)
4. Push (`git push origin feature/YourFeature`)
5. Abra um **Pull Request**

---

## 📞 Suporte & Contactos

- 📧 Email: [mpc.ferreira@me.com](mailto:mpc.ferreira@me.com)
- 🐙 GitHub: [@markgir](https://github.com/markgir)
- 🔗 Repositório: [markgir/crime-intelligence-platform](https://github.com/markgir/crime-intelligence-platform)

---

## 🎉 Agradecimentos

Desenvolvido com ❤️ para segurança e inteligência criminal.

---

**Versão:** 1.0.0 | **Status:** ✅ Production Ready | **Owner:** [@markgir](https://github.com/markgir)
