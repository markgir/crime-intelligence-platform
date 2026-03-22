# Módulos — Crime Intelligence Platform

Documentação detalhada dos 8 módulos principais da plataforma.

---

## Módulo 1 — Autenticação & Segurança

Sistema de autenticação baseado em JWT com controlo de acesso por roles (RBAC).

**Funcionalidades:**
- Registo e login de utilizadores
- Tokens JWT com expiração de 24 horas
- Refresh tokens com duração de 7 dias
- Roles: `admin`, `investigator`, `analyst`, `viewer`
- Hash de passwords com bcrypt (10+ rounds)
- Middleware de autenticação em todas as rotas protegidas

**Endpoints:**
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
```

---

## Módulo 2 — Gestão de Pessoas

Registo e gestão completa de indivíduos de interesse para investigações.

**Funcionalidades:**
- CRUD completo com paginação
- Múltiplos endereços por pessoa (residencial, comercial, outro)
- Múltiplos contactos telefónicos (móvel, residencial, comercial)
- Perfis de redes sociais (Twitter, Facebook, Instagram, LinkedIn, etc.)
- Pesquisa por nome, número de identificação e nacionalidade
- Associação com veículos e crimes
- Auditoria de alterações

**Endpoints:**
```
GET    /api/people
POST   /api/people
GET    /api/people/:id
PUT    /api/people/:id
DELETE /api/people/:id
POST   /api/people/:id/addresses
POST   /api/people/:id/phones
POST   /api/people/:id/social-media
```

---

## Módulo 3 — Gestão de Veículos

Rastreamento de veículos e histórico de propriedade.

**Funcionalidades:**
- Registo com matrícula única
- Associação com proprietário
- Histórico de proprietários anteriores
- Pesquisa por matrícula
- Associação a crimes
- Atualização de proprietário
- Campos: marca, modelo, cor, tipo, ano

**Endpoints:**
```
GET    /api/vehicles
POST   /api/vehicles
GET    /api/vehicles/:id
PUT    /api/vehicles/:id
DELETE /api/vehicles/:id
GET    /api/vehicles/plate/:plate
PUT    /api/vehicles/:id/owner
```

---

## Módulo 4 — Gestão de Crimes

Sistema dinâmico de registo e gestão de ocorrências criminais.

**Funcionalidades:**
- Tipos de crime configuráveis (customizável via API)
- Campos personalizados por tipo de crime (armazenados em JSON)
- Múltiplas vítimas por crime
- Múltiplos suspeitos com nível de confiança (`low`, `medium`, `high`)
- Coordenadas GPS (latitude e longitude)
- Estados: `open`, `investigating`, `closed`
- Pesquisa por localização, data e tipo de crime

**Endpoints:**
```
GET    /api/crimes
POST   /api/crimes
GET    /api/crimes/:id
PUT    /api/crimes/:id
DELETE /api/crimes/:id
POST   /api/crimes/:id/victims
DELETE /api/crimes/:crimeId/victims/:victimId
POST   /api/crimes/:id/suspects
DELETE /api/crimes/:crimeId/suspects/:suspectId
GET    /api/crimes/types/all
POST   /api/crimes/types
DELETE /api/crimes/types/:id
```

---

## Módulo 5 — Relacionamentos

Mapeamento de conexões entre pessoas, veículos e crimes com visualização em grafo.

**Funcionalidades:**
- Relações Pessoa ↔ Pessoa (amigos, colegas, associados, família)
- Relações Pessoa ↔ Veículo (proprietário, condutor, passageiro)
- Relações Pessoa ↔ Crime (vítima, suspeito, testemunha)
- Relações Veículo ↔ Crime (usado no crime, alvo, veículo de fuga)
- Grafo interativo com força-dirigida
- Análise de redes e descoberta de conexões ocultas

**Endpoints:**
```
GET    /api/relationships
POST   /api/relationships/person-to-person
POST   /api/relationships/person-to-vehicle
POST   /api/relationships/person-to-crime
POST   /api/relationships/vehicle-to-crime
PUT    /api/relationships/:id
DELETE /api/relationships/:id
GET    /api/relationships/graph/person/:id
GET    /api/relationships/crime/:crimeId/relationships
```

---

## Módulo 6 — Rede de Drogas

Rastreamento de redes de tráfico de droga e cadeias de distribuição.

**Funcionalidades:**
- Mapeamento da cadeia: Consumidor → Vendedor → Distribuidor
- Tipo de substância e quantidade por transação
- Data e localização das transações
- Análise do fluxo de tráfico
- Hierarquia de distribuição
- Integração com o módulo de relacionamentos

**Endpoints:**
```
GET    /api/relationships/drug-network/all
POST   /api/relationships/drug-network
GET    /api/relationships/drug-network/:id
PUT    /api/relationships/drug-network/:id
DELETE /api/relationships/drug-network/:id
```

---

## Módulo 7 — Dashboard OSINT

Painel analítico com visualizações em tempo real para apoio à decisão.

**Funcionalidades:**
- Gráfico de linha: crimes ao longo do tempo
- Gráfico de pizza: distribuição por tipo de crime
- Gráfico de barras: top localizações de maior incidência
- Cards de estatísticas: total de casos, taxa de resolução, casos ativos
- Grafo de relacionamentos interativo
- Filtros temporais e por categoria
- Exportação de dados (em desenvolvimento)

**Tecnologias de visualização:**
- Recharts (gráficos de linha, pizza, barras)
- Chart.js (gráficos avançados)
- Grafo com força-dirigida (canvas)

---

## Módulo 8 — Sistema de Backups

Gestão automatizada de backups com agendamento, compressão e restauração.

**Funcionalidades:**
- Backups manuais sob demanda
- Backups automáticos agendados via cron:
  - Horário (a cada hora)
  - Diário (02:00 AM)
  - Semanal (Domingo às 03:00 AM)
  - Mensal (1.º dia do mês às 04:00 AM)
- Compressão automática GZIP
- Restauração completa da base de dados
- Limpeza automática de backups com mais de 30 dias
- Monitorização do estado: `success`, `failed`, `in_progress`
- Logs detalhados e estatísticas de armazenamento

**Endpoints:**
```
GET    /api/backups
GET    /api/backups/:id
POST   /api/backups/manual
POST   /api/backups/automatic
POST   /api/backups/restore/:id
DELETE /api/backups/:id
GET    /api/backups/:id/logs
GET    /api/backups/:id/status
GET    /api/backups/statistics/overview
```