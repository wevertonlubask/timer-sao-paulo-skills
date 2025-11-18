# ⏱️ Competition Timer - Sistema de Cronometragem

Sistema profissional de cronometragem para competições WorldSkills e SENAI, com suporte a múltiplos competidores, pausas individuais, tempo extra e sincronização em tempo real com telão.

[![Version](https://img.shields.io/badge/version-2.3.2-blue.svg)](https://github.com/seu-usuario/competition-timer/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-purple.svg)](https://vitejs.dev/)

## 📸 Screenshots
<img width="1629" height="795" alt="timer_3" src="https://github.com/user-attachments/assets/78a4ff94-2642-491c-8fbc-1f214f7744a6" />
<img width="1640" height="640" alt="timer_4" src="https://github.com/user-attachments/assets/8cfa514d-c05a-4ef9-949f-fe1639e188f8" />
<img width="1625" height="698" alt="timer_5" src="https://github.com/user-attachments/assets/1dbc9305-9c7f-4031-9405-b7f8befc9cff" />
<img width="1919" height="1079" alt="timer_7" src="https://github.com/user-attachments/assets/64dcb104-b461-4b84-9419-5c81fa6231e2" />
<img width="1907" height="931" alt="timer_8" src="https://github.com/user-attachments/assets/7873cd19-075a-44f9-bd85-594bef6a1605" />
<img width="1919" height="1079" alt="timer_9" src="https://github.com/user-attachments/assets/5660b1b0-0700-4da3-93bc-c4ca09245963" />

### Tela de Configuração
Interface intuitiva para configurar competição, duração e competidores.

<img width="1165" height="852" alt="timer_2" src="https://github.com/user-attachments/assets/f463525f-3722-4819-a3ff-a7a70062812b" />

### Painel Administrativo
Controle total sobre cronômetros gerais e individuais.

<img width="1170" height="721" alt="timer_1" src="https://github.com/user-attachments/assets/f23f6db4-06a7-4f96-b05c-8141092bc914" />


### Telão (Display)
Visualização profissional para projetores com sincronização automática.

<img width="1917" height="1079" alt="timer_6" src="https://github.com/user-attachments/assets/94e8ace9-21a7-4e9f-9b1d-c10f40f6d2f4" />

## ✨ Funcionalidades

### Gerenciamento de Competição
- ✅ Configuração de nome, módulo e duração
- ✅ Upload de logo personalizada
- ✅ Cadastro ilimitado de competidores
- ✅ Import/Export de dados

### Cronometragem
- ✅ Cronômetro geral regressivo
- ✅ Pausas individuais por competidor
- ✅ Suporte a múltiplas pausas (acumulação correta)
- ✅ Tempo extra automático para atendimentos técnicos
- ✅ Pausa geral sincronizada
- ✅ Alerta sonoro ao finalizar

### Telão (Display)
- ✅ Interface em tela cheia para projetor
- ✅ Sincronização em tempo real
- ✅ Design 100% responsivo (800x600 até 4K)
- ✅ Destaque para próximo competidor a finalizar
- ✅ Visualização de todos em tempo extra

### Relatórios
- ✅ Exportação em Excel
- ✅ Histórico completo de pausas
- ✅ Tempo total e compensações
- ✅ Dados auditáveis

## 🚀 Quick Start

### Pré-requisitos

- Node.js 18+ ([Download](https://nodejs.org/))
- npm ou yarn

### Instalação

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/competition-timer.git
cd competition-timer

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse: http://localhost:5173

### Build para Produção

```bash
# Gerar build otimizado
npm run build

# Preview do build
npm run preview
```

## 📖 Documentação

- [📘 Guia de Uso](docs/GUIA_DE_USO.md) - Como usar o sistema
- [🚀 Deploy no GitHub](GUIA_GITHUB_DEPLOY.md) - Implantação completa
- [📝 Changelog](CHANGELOG.md) - Histórico de versões

## 🎯 Uso Básico

### 1. Configurar Competição

```
1. Preencha nome da competição
2. Defina módulo/categoria
3. Configure duração (horas:minutos:segundos)
4. (Opcional) Adicione logo
5. Clique "Próximo"
```

### 2. Adicionar Competidores

```
1. Digite nome do competidor
2. Clique "Adicionar"
3. Repita para todos os competidores
4. Clique "Iniciar Competição"
```

### 3. Gerenciar Tempo

**Tempo Geral:**
- ▶️ **Iniciar** para começar
- ⏸ **Pausar** para pausar TODOS os cronômetros
- ▶️ **Retomar** para continuar

**Tempo Individual:**
- 🔴 **Pausar para Atendimento** no card do competidor
- Tempo geral continua, tempo individual congela
- ✅ **Retomar** quando atendimento finalizar
- Competidor ganha tempo extra = tempo pausado

### 4. Telão

```
1. Clique "Abrir Telão"
2. Arraste janela para projetor
3. Pressione F11 para tela cheia
4. Telão sincroniza automaticamente
```

### 5. Exportar Relatório

```
1. Aguarde término da competição
2. Clique "Exportar Relatório"
3. Arquivo Excel será baixado
4. Contém: tempos finais, pausas, compensações
```

## 🏗️ Arquitetura

### Stack Tecnológico

- **Framework:** React 18
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Excel Export:** xlsx
- **State Management:** React Hooks

### Estrutura do Projeto

```
competition-timer/
├── src/
│   ├── App.jsx              # Componente principal
│   ├── main.jsx            # Entry point
│   └── index.css           # Estilos globais
├── public/
│   ├── alarm.mp3           # Som de alerta
│   └── favicon.ico
├── docs/                   # Documentação
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, siga estes passos:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: adicionar nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

### Padrões de Commit

Seguimos [Conventional Commits](https://www.conventionalcommits.org/pt-br/):

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Mudanças na documentação
- `style:` Formatação de código
- `refactor:` Refatoração
- `test:` Adicionar testes
- `chore:` Manutenção

## 🐛 Reportar Bugs

Encontrou um bug? [Abra uma issue](https://github.com/seu-usuario/competition-timer/issues/new) com:

- Descrição clara do problema
- Passos para reproduzir
- Comportamento esperado vs atual
- Screenshots (se aplicável)
- Versão do navegador/SO

## 📊 Roadmap

### v2.4.0 (Em Planejamento)
- [ ] Modo escuro
- [ ] Múltiplos idiomas (PT/EN/ES)
- [ ] Backup automático
- [ ] PWA (Progressive Web App)

### v2.5.0 (Futuro)
- [ ] App mobile
- [ ] Dashboard de analytics
- [ ] Sistema de rankings
- [ ] Integração com APIs externas

## 👤 Autores

- **Weverton** - *Desenvolvimento Inicial*

## 🙏 Agradecimentos

- WorldSkills Brazil
- SENAI São Paulo
- Comunidade React
- Todos os contribuidores

## 📞 Suporte

- 📧 Email: weverton.lubask@sp.senai.br
- 📖 [Documentação](GUIA_GITHUB_DEPLOY.md)
- 🐛 [Report Bug](https://github.com/seu-usuario/competition-timer/issues)

---

<div align="center">

Feito com ❤️ para competições profissionais

[⬆ Voltar ao topo](#️-competition-timer---sistema-de-cronometragem)

</div>
