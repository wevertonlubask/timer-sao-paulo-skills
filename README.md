# SP Skills Timer ⏱️

Sistema profissional de cronometragem para competições WorldSkills e SENAI, com suporte a múltiplos competidores, pausas individuais, tempo extra e sincronização em tempo real com telão.

[![Version](https://img.shields.io/badge/version-2.3.2-blue.svg)](https://github.com/seu-usuario/competition-timer/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-purple.svg)](https://vitejs.dev/)

## 📸 Screenshots

### Tela de Configuração
Interface intuitiva para configurar competição, duração e competidores.

### Painel Administrativo
Controle total sobre cronômetros gerais e individuais.

### Telão (Display)
Visualização profissional para projetores com sincronização automática.

## ✨ Funcionalidades

- ⏱️ Timer regressivo geral da prova
- 👥 Gerenciamento individual de competidores
- ⏸️ Sistema de pausa/atendimento com compensação de tempo
- 🔴 Modo "Tempo Extra" para competidores que excedem o limite
- ✅ Marcação automática de competidores finalizados
- 📺 Modo Telão para projeção (abre em nova janela)
- 📄 Exportação de relatório em PDF
- ✍️ Campos de assinatura para avaliadores

## 🚀 Instalação

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 🖼️ Personalização

### Logo da Competição
Coloque sua logo na pasta:
```
public/logo/logo.png
```
- Formatos suportados: PNG, JPG, SVG
- Tamanho recomendado: 200x200 pixels ou maior

A logo será exibida:
- Na tela de configuração
- No cabeçalho durante a prova
- No relatório PDF

### Ícone da Aba (Favicon)
Coloque seu ícone na pasta:
```
public/icon/favicon.png
```
- Formatos suportados: PNG, ICO, SVG
- Tamanho recomendado: 32x32 ou 64x64 pixels

O ícone será exibido na aba do navegador.

## 📁 Estrutura de Pastas

```
timer-modern/
├── public/
│   ├── logo/
│   │   └── logo.png        ← Sua logo aqui
│   └── icon/
│       └── favicon.png     ← Seu favicon aqui
├── src/
│   ├── App.jsx             ← Componente principal
│   ├── index.css           ← Estilos globais
│   └── main.jsx            ← Entrada da aplicação
├── index.html
├── package.json
└── README.md
```

## 📋 Formato dos Arquivos de Importação

### Competidores (competidores.txt)
```
Nome do Competidor 1
Nome do Competidor 2
Nome do Competidor 3
```

### Avaliadores (avaliadores.txt)
```
Nome do Líder
Nome do Adjunto
Nome do Avaliador 1
Nome do Avaliador 2
```
- O primeiro nome será o Avaliador Líder
- O segundo nome será o Avaliador Adjunto
- Os demais serão listados na tabela de avaliadores

## 📄 Licença

MIT License
