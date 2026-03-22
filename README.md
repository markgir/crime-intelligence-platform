# 🚀 Crime Intelligence Platform

**Plataforma Completa de Inteligência Criminal com Dashboards OSINT, Gestão Integrada e Backups Automáticos**

![Node.js](https://img.shields.io/badge/Node.js-v14+-green)
![React](https://img.shields.io/badge/React-v18+-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-336791)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Version](https://img.shields.io/badge/Version-1.0.0-brightgreen)
![Status](https://img.shields.io/badge/Status-Production%20Ready-success)

---

## 🚀 Instalação Rápida (Uma Linha)

**Linux/macOS:**
```bash
git clone https://github.com/markgir/crime-intelligence-platform.git && cd crime-intelligence-platform && npm install && npm install -g pm2 && cd backend && npm install && cd ../frontend && npm install && echo "✅ Instalação concluída!"
```

**Windows (PowerShell):**
```powershell
git clone https://github.com/markgir/crime-intelligence-platform.git; cd crime-intelligence-platform; npm install; npm install -g pm2; cd backend; npm install; cd ..\frontend; npm install; Write-Host "✅ Instalação concluída!"
```

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Características Principais](#características-principais)
- [Arquitetura](#arquitetura)
- [Instalação Manual](#instalação-manual)
- [Configuração](#configuração)
- [API Endpoints](#api-endpoints)
- [Exemplos de Uso](#exemplos-de-uso)
- [Stack Tecnológico](#stack-tecnológico)
- [Segurança](#segurança)
- [Roadmap](#roadmap)
- [Contribuições](#contribuições)
- [Suporte](#suporte)

---

## 👁️ Visão Geral

A **Crime Intelligence Platform** é uma solução completa e *production-ready* de inteligência criminal concebida para forças de segurança e agências de investigação. A plataforma permite:

| Módulo | Descrição |
|--------|-----------|
| 📊 **Dashboard OSINT** | Análise em tempo real com dashboards e visualizações gráficas interativas |
| 👥 **Gestão de Pessoas** | Registo completo com endereços, telefones e redes sociais |
| 🚗 **Gestão de Veículos** | Rastreamento de matrículas e histórico de propriedade |
| 🚨 **Gestão de Crimes** | Sistema dinâmico com vítimas, suspeitos e coordenadas GPS |
| 🔗 **Relacionamentos** | Mapeamento de conexões em grafo com análise de redes |
| 💊 **Rede de Drogas** | Rastreamento da cadeia Consumidor → Vendedor → Distribuidor |
| 💾 **Backups Automáticos** | Agendamento com compressão GZIP e restauração completa |
| 🔐 **Autenticação RBAC** | JWT com controlo de acesso por roles (Admin, Investigator, Analyst, Viewer) |

---

## ✨ Características Principais

### 🔐 Autenticação & Segurança

- ✅ JWT com tokens de 24h e refresh de 7 dias
- ✅ Controlo de acesso por roles (Admin, Investigator, Analyst, Viewer)
- ✅ Hash bcrypt de passwords (10+ rounds)
- ✅ Middleware de validação em todas as rotas
- ✅ CORS configurado
- ✅ Helmet.js para security headers

### 👤 Módulo de Pessoas

- ✅ CRUD completo com paginação
- ✅ Múltiplos endereços (residencial, comercial, outro)
- ✅ Múltiplos telefones (móvel, residencial, comercial)
- ✅ Perfis de redes sociais (Twitter, Facebook, Instagram, etc.)
- ✅ Pesquisa avançada por nome, número de identificação, nacionalidade
- ✅ Relacionamentos com veículos e crimes
- ✅ Auditoria de alterações

### 🚗 Módulo de Veículos

- ✅ Registo com matrícula única
- ✅ Associação com proprietários
- ✅ Rastreamento de histórico
- ✅ Pesquisa por matrícula (*plate search*)
- ✅ Relacionamento com crimes
- ✅ Atualização de proprietário
- ✅ Marca, modelo, cor e tipo de veículo

### 🚨 Módulo de Crimes

- ✅ Sistema dinâmico de tipos de crime (customizável)
- ✅ Campos personalizados por tipo (JSON)
- ✅ Múltiplas vítimas e suspeitos por crime
- ✅ Níveis de confiança para suspeitos (`low`, `medium`, `high`)
- ✅ Coordenadas GPS (latitude/longitude)
- ✅ Estados: `open`, `investigating`, `closed`
- ✅ Pesquisa por localização, data e tipo

### 🔗 Módulo de Relacionamentos

- ✅ Pessoa ↔ Pessoa (amigos, colegas, associados)
- ✅ Pessoa ↔ Veículo (proprietário, condutor, passageiro)
- ✅ Pessoa ↔ Crime (vítima, suspeito, testemunha)
- ✅ Veículo ↔ Crime (usado, alvo, fuga)
- ✅ Visualização em grafo com força-dirigida
- ✅ Análise de redes e conexões complexas

### 💊 Módulo de Rede de Drogas

- ✅ Rastreamento Consumidor → Vendedor → Distribuidor
- ✅ Cadeias de distribuição complexas
- ✅ Tipo de substância e quantidades
- ✅ Datas de transações
- ✅ Análise de fluxo de tráfico

### 📊 Dashboard OSINT

- ✅ Gráficos de linha (crimes por data)
- ✅ Gráficos de pizza (crimes por tipo)
- ✅ Gráficos de barras (top localizações)
- ✅ Cards de estatísticas rápidas
- ✅ Taxa de resolução e casos ativos
- ✅ Grafo de relacionamentos interativo

### 💾 Sistema de Backups

- ✅ Backups manuais sob demanda
- ✅ Backups automáticos agendados:
  - ⏰ Horário (a cada hora)
  - ⏰ Diário (02:00 AM)
  - ⏰ Semanal (Domingo 03:00 AM)
  - ⏰ Mensal (1.º dia 04:00 AM)
- ✅ Compressão GZIP automática
- ✅ Restauração completa da base de dados
- ✅ Limpeza automática de backups com mais de 30 dias
- ✅ Estatísticas e logs detalhados

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────┐
│        CRIME INTELLIGENCE PLATFORM v1.0.0           │
├──────────────────────┬──────────────────────────────┤
│      FRONTEND        │          BACKEND             │
│     (React 18)       │    (Node.js + Express)       │
├──────────────────────┼──────────────────────────────┤
│                      │                              │
│  ✅ Dashboard OSINT  │  ✅ Authentication (JWT)     │
│  ✅ Network Graph    │  ✅ People Management        │
│  ✅ Backup Manager   │  ✅ Vehicle Management       │
│  ✅ Forms CRUD       │  ✅ Crime Management         │
│  ✅ Data Tables      │  ✅ Relationships            │
│  ✅ Auth / Login     │  ✅ Drug Networks            │
│                      │  ✅ Backup Scheduler (Cron)  │
│                      │  ✅ Statistics & Analytics   │
│                      │                              │
└──────────────────────┴──────────────────────────────┘
          ↓ HTTP / REST API              ↓
     ┌────────────────┐        ┌──────────────────┐
     │  Recharts      │        │  PostgreSQL 12+  │
     │  Chart.js      │        │  (Base de Dados) │
     │  Canvas        │        │  (Backups)       │
     └────────────────┘        └──────────────────┘
```

**Estrutura de Diretórios:**

```
crime-intelligence-platform/
├── backend/                # API Node.js/Express
│   ├── config/             # Configuração da base de dados
│   ├── middleware/         # Autenticação e validação
│   ├── routes/             # Endpoints da API
│   └── server.js           # Ponto de entrada do servidor
├── frontend/               # Aplicação React
│   └── src/
│       └── components/     # Componentes React
├── database/               # Esquema e migrações
│   └── schema.sql          # Esquema PostgreSQL
├── docs/                   # Documentação
│   └── MODULES.md          # Documentação dos módulos
├── middleware/             # Middleware partilhado (JWT)
├── README.md               # Este ficheiro
├── install.sh              # Script de instalação
└── .gitignore
```

---

## 📦 Instalação Manual

### Pré-requisitos

- [Node.js v14+](https://nodejs.org/)
- [PostgreSQL 12+](https://www.postgresql.org/)
- [Git](https://git-scm.com/)

### 1️⃣ Clonar o Repositório

```bash
git clone https://github.com/markgir/crime-intelligence-platform.git
cd crime-intelligence-platform
```

### 2️⃣ Configurar o Backend

```bash
cd backend
npm install

# Criar ficheiro .env
cat > .env << EOF
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
EOF

# Criar a base de dados
createdb -U postgres crime_intelligence

# Aplicar o esquema
psql -U postgres -d crime_intelligence -f ../database/schema.sql

# Iniciar o servidor
npm start
```

### 3️⃣ Configurar o Frontend

```bash
cd ../frontend
npm install

# Criar ficheiro .env
cat > .env << EOF
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_JWT_STORAGE_KEY=token
EOF

# Iniciar a aplicação
npm start
```

**URLs por defeito:**

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| Health Check | http://localhost:5000/api/health |

---

## ⚙️ Configuração

### Backend (`.env`)

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
```

### Frontend (`.env`)

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_JWT_STORAGE_KEY=token
```

### Variáveis de Ambiente

| Variável | Obrigatório | Padrão | Descrição |
|----------|-------------|--------|-----------|
| `DB_USER` | ✅ | `postgres` | Utilizador PostgreSQL |
| `DB_PASSWORD` | ✅ | — | Password PostgreSQL |
| `DB_HOST` | ✅ | `localhost` | Host da base de dados |
| `DB_PORT` | ✅ | `5432` | Porto da base de dados |
| `DB_NAME` | ✅ | `crime_intelligence` | Nome da base de dados |
| `JWT_SECRET` | ✅ | — | Chave secreta JWT |
| `JWT_REFRESH_SECRET` | ✅ | — | Chave de refresh JWT |
| `PORT` | ❌ | `5000` | Porto do servidor |
| `NODE_ENV` | ❌ | `development` | Ambiente (`development`/`production`) |
| `BACKUP_RETENTION_DAYS` | ❌ | `30` | Dias de retenção de backups |

---

## 🔌 API Endpoints (60+)

### Autenticação (5 endpoints)

```
POST   /api/auth/register           # Registar novo utilizador
POST   /api/auth/login              # Login (retorna JWT)
POST   /api/auth/refresh            # Renovar token
POST   /api/auth/logout             # Logout
GET    /api/auth/me                 # Dados do utilizador atual
```

### Pessoas (8 endpoints)

```
GET    /api/people                  # Listar (paginado, com pesquisa)
POST   /api/people                  # Criar pessoa
GET    /api/people/:id              # Detalhes de uma pessoa
PUT    /api/people/:id              # Atualizar pessoa
DELETE /api/people/:id              # Eliminar pessoa
POST   /api/people/:id/addresses    # Adicionar endereço
POST   /api/people/:id/phones       # Adicionar telefone
POST   /api/people/:id/social-media # Adicionar rede social
```

### Veículos (7 endpoints)

```
GET    /api/vehicles                # Listar veículos
POST   /api/vehicles                # Criar veículo
GET    /api/vehicles/:id            # Detalhes de um veículo
PUT    /api/vehicles/:id            # Atualizar veículo
DELETE /api/vehicles/:id            # Eliminar veículo
GET    /api/vehicles/plate/:plate   # Pesquisar por matrícula
PUT    /api/vehicles/:id/owner      # Atualizar proprietário
```

### Crimes (12 endpoints)

```
GET    /api/crimes                          # Listar crimes
POST   /api/crimes                          # Criar crime
GET    /api/crimes/:id                      # Detalhes de um crime
PUT    /api/crimes/:id                      # Atualizar crime
DELETE /api/crimes/:id                      # Eliminar crime
POST   /api/crimes/:id/victims              # Adicionar vítima
DELETE /api/crimes/:crimeId/victims/:victimId    # Remover vítima
POST   /api/crimes/:id/suspects             # Adicionar suspeito
DELETE /api/crimes/:crimeId/suspects/:suspectId  # Remover suspeito
GET    /api/crimes/types/all                # Listar tipos de crime
POST   /api/crimes/types                    # Criar tipo de crime
DELETE /api/crimes/types/:id                # Eliminar tipo de crime
```

### Relacionamentos (10 endpoints)

```
GET    /api/relationships                          # Listar todos
POST   /api/relationships/person-to-person         # Criar relação Pessoa-Pessoa
POST   /api/relationships/person-to-vehicle        # Criar relação Pessoa-Veículo
POST   /api/relationships/person-to-crime          # Criar relação Pessoa-Crime
POST   /api/relationships/vehicle-to-crime         # Criar relação Veículo-Crime
PUT    /api/relationships/:id                      # Atualizar relação
DELETE /api/relationships/:id                      # Eliminar relação
GET    /api/relationships/graph/person/:id         # Grafo de uma pessoa
GET    /api/relationships/crime/:crimeId/relationships  # Conexões de um crime
GET    /api/relationships/drug-network/all         # Listar redes de droga
```

### Backups (9 endpoints)

```
GET    /api/backups                      # Listar backups
GET    /api/backups/:id                  # Detalhes de um backup
POST   /api/backups/manual               # Criar backup manual
POST   /api/backups/automatic            # Criar backup automático
POST   /api/backups/restore/:id          # Restaurar backup
DELETE /api/backups/:id                  # Eliminar backup
GET    /api/backups/:id/logs             # Logs de um backup
GET    /api/backups/:id/status           # Estado de um backup
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
  -d '{"username": "investigator1", "password": "SecurePassword123!"}'
```

### 3. Criar Pessoa

```bash
TOKEN="seu_token_jwt"
curl -X POST http://localhost:5000/api/people \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"first_name": "João", "last_name": "Silva", "id_number": "12345678A"}'
```

### 4. Criar Crime

```bash
curl -X POST http://localhost:5000/api/crimes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "location": "Lisboa",
    "crime_date": "2026-03-22T14:30:00Z",
    "description": "Roubo a estabelecimento comercial"
  }'
```

### 5. Criar Veículo

```bash
curl -X POST http://localhost:5000/api/vehicles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "plate": "AA-00-BB",
    "brand": "Volkswagen",
    "model": "Golf",
    "color": "Preto",
    "owner_id": 1
  }'
```

### 6. Criar Backup Manual

```bash
curl -X POST http://localhost:5000/api/backups/manual \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"backup_name": "backup_2026-03-22"}'
```

---

## 🛠️ Stack Tecnológico

### Backend

| Tecnologia | Versão | Utilização |
|------------|--------|------------|
| **Node.js** | v14+ | Ambiente de execução |
| **Express.js** | v4+ | Framework Web / API |
| **PostgreSQL** | 12+ | Base de dados relacional |
| **Sequelize** | Latest | ORM |
| **jsonwebtoken** | — | Autenticação JWT |
| **bcrypt** | v5+ | Hash de passwords |
| **node-cron** | v3+ | Agendamento de tarefas |
| **dotenv** | v16+ | Variáveis de ambiente |
| **helmet** | v7+ | Security headers HTTP |
| **cors** | v2+ | Cross-Origin Resource Sharing |

### Frontend

| Tecnologia | Versão | Utilização |
|------------|--------|------------|
| **React** | v18+ | Framework UI |
| **React Router** | v6+ | Roteamento do lado do cliente |
| **Axios** | v1+ | Cliente HTTP |
| **Recharts** | v2+ | Gráficos e visualizações |
| **Chart.js** | v3+ | Gráficos avançados |
| **CSS3** | — | Estilização |

### DevOps & Ferramentas

| Ferramenta | Utilização |
|------------|------------|
| **Git** | Controlo de versões |
| **GitHub** | Repositório e CI/CD |
| **PM2** | Process Manager (produção) |
| **Docker** | Containerização (opcional) |

---

## 🔒 Segurança

### Implementações de Segurança

- ✅ **Autenticação JWT** — tokens de acesso (24h) e refresh (7 dias)
- ✅ **Role-Based Access Control (RBAC)** — Admin, Investigator, Analyst, Viewer
- ✅ **bcrypt** — hash de passwords com 10+ rounds
- ✅ **Helmet.js** — security headers HTTP (XSS, CSRF, etc.)
- ✅ **CORS** — restrição de origens permitidas
- ✅ **Validação de input** — middleware em todas as rotas
- ✅ **Parameterized queries** — prevenção de SQL injection
- ✅ **Variáveis sensíveis em `.env`** — nunca em código fonte
- ✅ **HTTPS recomendado** em ambiente de produção

### Roles e Permissões

| Role | Leitura | Escrita | Eliminação | Admin |
|------|---------|---------|------------|-------|
| **Admin** | ✅ | ✅ | ✅ | ✅ |
| **Investigator** | ✅ | ✅ | ✅ | ❌ |
| **Analyst** | ✅ | ✅ | ❌ | ❌ |
| **Viewer** | ✅ | ❌ | ❌ | ❌ |

---

## 📈 Roadmap

### Concluído ✅

- [x] Autenticação JWT + RBAC
- [x] CRUD completo de Pessoas
- [x] CRUD completo de Veículos
- [x] CRUD completo de Crimes
- [x] Sistema de Relacionamentos (grafo)
- [x] Módulo de Rede de Drogas
- [x] Dashboard OSINT com gráficos
- [x] Sistema de Backups Automáticos

### Em desenvolvimento ⏳

- [ ] Importação de Excel / Access
- [ ] Integração com APIs externas
- [ ] Sistema de alertas e notificações
- [ ] Análise de padrões com Machine Learning
- [ ] Geolocalização avançada com mapas
- [ ] Exportação de relatórios em PDF
- [ ] Integração com câmaras CCTV

---

## 👥 Contribuições

Contribuições são bem-vindas! Siga os passos abaixo:

1. Faça um **Fork** do projeto
2. Crie uma branch para a sua funcionalidade:
   ```bash
   git checkout -b feature/NovaFuncionalidade
   ```
3. Faça commit das suas alterações:
   ```bash
   git commit -m 'feat: adicionar NovaFuncionalidade'
   ```
4. Faça push para a branch:
   ```bash
   git push origin feature/NovaFuncionalidade
   ```
5. Abra um **Pull Request**

---

## 📞 Suporte & Contactos

| Canal | Informação |
|-------|-----------|
| 📧 Email | mpc.ferreira@me.com |
| 🐙 GitHub | [@markgir](https://github.com/markgir) |
| 🔗 Repositório | [markgir/crime-intelligence-platform](https://github.com/markgir/crime-intelligence-platform) |

---

## 📝 Licença

Distribuído sob a licença **MIT**. Consulte o ficheiro `LICENSE` para mais detalhes.

---

## 🎉 Estatísticas do Projeto

| Métrica | Valor |
|---------|-------|
| Linhas de código | ~2 000 |
| Módulos principais | 8 |
| Endpoints REST | 60+ |
| Estado | ✅ Production Ready |
| Versão | 1.0.0 |
| Última atualização | 22 de Março de 2026 |

---

*Desenvolvido com ❤️ para segurança e inteligência criminal — [@markgir](https://github.com/markgir)*
