import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, Pause, RotateCcw, Clock, Users, UserPlus, Trash2, 
  Monitor, Upload, X, Download, AlertCircle, Image, 
  Timer, Zap, CheckCircle2, Settings2, Sparkles, ChevronRight,
  FileText, ClipboardSignature
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export default function CompetitionTimer() {
  const urlParams = new URLSearchParams(window.location.search);
  const isDisplayParam = urlParams.get('display') === 'true';
  
  const [view, setView] = useState(isDisplayParam ? 'display' : 'setup');
  const [competition, setCompetition] = useState({
    name: '',
    module: '',
    prova: '',
    duration: { hours: 3, minutes: 0, seconds: 0 }
  });
  const [competitors, setCompetitors] = useState([]);
  const [newCompetitorName, setNewCompetitorName] = useState('');
  // Logo carregada da pasta public/logo/logo.png (ou .svg, .jpg)
  const logo = '/logo/logo.png';
  const [avaliadores, setAvaliadores] = useState([]);
  
  const [generalTime, setGeneralTime] = useState(0);
  const [isGeneralRunning, setIsGeneralRunning] = useState(false);
  const [isGeneralFinished, setIsGeneralFinished] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [reportExported, setReportExported] = useState(false);
  const [isDisplayWindow, setIsDisplayWindow] = useState(isDisplayParam);
  
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const avaliadoresInputRef = useRef(null);
  const displayWindowRef = useRef(null);
  const syncIntervalRef = useRef(null);

  // Sincronização em tempo real para a janela de display
  useEffect(() => {
    if (isDisplayWindow) {
      const handleStorageChange = (e) => {
        if (e.key === 'competitionTimerState') {
          try {
            const state = JSON.parse(e.newValue);
            setCompetition(state.competition);
            setCompetitors(state.competitors);
            setGeneralTime(state.generalTime);
            setIsGeneralRunning(state.isGeneralRunning);
            setIsGeneralFinished(state.isGeneralFinished);
          } catch (err) {
            console.error('Erro ao sincronizar estado:', err);
          }
        }
      };

      window.addEventListener('storage', handleStorageChange);

      const syncFromStorage = () => {
        const saved = localStorage.getItem('competitionTimerState');
        
        if (saved) {
          try {
            const state = JSON.parse(saved);
            setCompetition(state.competition);
            setCompetitors(state.competitors);
            setGeneralTime(state.generalTime);
            setIsGeneralRunning(state.isGeneralRunning);
            setIsGeneralFinished(state.isGeneralFinished);
          } catch (e) {
            console.error('Erro ao sincronizar:', e);
          }
        }
      };

      syncFromStorage();
      syncIntervalRef.current = setInterval(syncFromStorage, 500);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      };
    }
  }, [isDisplayWindow]);

  // Persistência com localStorage
  useEffect(() => {
    if (!isDisplayWindow) {
      const saved = localStorage.getItem('competitionTimerState');
      
      if (saved) {
        try {
          const state = JSON.parse(saved);
          setCompetition(state.competition);
          setCompetitors(state.competitors);
          setGeneralTime(state.generalTime);
          setIsGeneralRunning(false);
          setIsGeneralFinished(state.isGeneralFinished);
          if (state.view !== 'setup') {
            setView(state.view);
          }
        } catch (e) {
          console.error('Erro ao carregar estado salvo:', e);
        }
      }
    }
  }, [isDisplayWindow]);

  useEffect(() => {
    if (!isDisplayWindow && view !== 'setup') {
      const state = {
        competition,
        competitors,
        generalTime,
        isGeneralRunning,
        isGeneralFinished,
        view
      };
      localStorage.setItem('competitionTimerState', JSON.stringify(state));
    }
  }, [competition, competitors, generalTime, isGeneralRunning, isGeneralFinished, view, isDisplayWindow]);

  // Cronômetro geral
  useEffect(() => {
    let interval = null;
    
    if (isGeneralRunning && generalTime > 0) {
      interval = setInterval(() => {
        setGeneralTime(prev => {
          if (prev <= 1) {
            setIsGeneralRunning(false);
            setIsGeneralFinished(true);
            playSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGeneralRunning, generalTime]);

  // Cronômetros individuais
  useEffect(() => {
    const intervals = {};
    
    if (isGeneralRunning || isGeneralFinished) {
      competitors.forEach(comp => {
        if (comp.isRunning && comp.individualTime > 0) {
          intervals[comp.id] = setInterval(() => {
            setCompetitors(prev => prev.map(c => {
              if (c.id === comp.id && c.individualTime > 0) {
                const newTime = c.individualTime - 1;
                if (newTime <= 0) {
                  playSound();
                  return { ...c, individualTime: 0, isRunning: false, isFinished: true };
                }
                return { ...c, individualTime: newTime };
              }
              return c;
            }));
          }, 1000);
        }
      });
    }
  
    return () => {
      Object.values(intervals).forEach(interval => clearInterval(interval));
    };
  }, [competitors, isGeneralRunning, isGeneralFinished]);

  const playSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log('Erro ao tocar som:', e));
    }
  }, []);

  const formatTime = useCallback((totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  const addCompetitor = useCallback(() => {
    if (!newCompetitorName.trim()) return;
    
    const duplicate = competitors.find(c => 
      c.name.toLowerCase() === newCompetitorName.trim().toLowerCase()
    );
    
    if (duplicate) {
      alert('⚠️ Já existe um competidor com este nome');
      return;
    }
    
    const newComp = {
      id: Date.now(),
      name: newCompetitorName.trim(),
      isPaused: false,
      isRunning: false,
      isFinished: false,
      pausedAt: null,
      pauseStartTime: null,
      resumedAt: null,
      totalPausedTime: 0,
      individualTime: 0,
      pauseHistory: []
    };
    
    setCompetitors(prev => [...prev, newComp]);
    setNewCompetitorName('');
  }, [newCompetitorName, competitors]);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const names = text.split(/[\r\n]+/).map(name => name.trim()).filter(name => name.length > 0);
      
      const existingNames = new Set(competitors.map(c => c.name.toLowerCase()));
      const newComps = names
        .filter(name => !existingNames.has(name.toLowerCase()))
        .map(name => ({
          id: Date.now() + Math.random(),
          name,
          isPaused: false,
          isRunning: false,
          isFinished: false,
          pausedAt: null,
          pauseStartTime: null,
          resumedAt: null,
          totalPausedTime: 0,
          individualTime: 0,
          pauseHistory: []
        }));
      
      setCompetitors(prev => [...prev, ...newComps]);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [competitors]);

  // Upload de logo desabilitado - logo é carregada de /logo/logo.png
  // const handleLogoUpload = useCallback((e) => { ... }, []);
  // const removeLogo = useCallback(() => { ... }, []);

  const handleAvaliadoresUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const names = text.split(/[\r\n]+/).map(name => name.trim()).filter(name => name.length > 0);
      setAvaliadores(names);
    };
    reader.readAsText(file);
    if (avaliadoresInputRef.current) avaliadoresInputRef.current.value = '';
  }, []);

  const removeCompetitor = useCallback((id) => {
    setCompetitors(prev => prev.filter(c => c.id !== id));
  }, []);

  // Formata o módulo completo (MÓDULO X - PY)
  const getFullModule = useCallback(() => {
    if (competition.module && competition.prova) {
      return `${competition.module} - ${competition.prova}`;
    }
    return competition.module || competition.prova || '';
  }, [competition.module, competition.prova]);

  const validateCompetition = useCallback(() => {
    if (!competition.name.trim() || !competition.module.trim() || !competition.prova.trim() || competitors.length === 0) {
      return false;
    }
    const totalSeconds = competition.duration.hours * 3600 + competition.duration.minutes * 60 + competition.duration.seconds;
    return totalSeconds > 0;
  }, [competition, competitors]);

  const startCompetition = useCallback(() => {
    if (!validateCompetition()) {
      alert('⚠️ Preencha todos os campos obrigatórios');
      return;
    }
    
    const totalSeconds = competition.duration.hours * 3600 + competition.duration.minutes * 60 + competition.duration.seconds;
    setGeneralTime(totalSeconds);
    setIsGeneralRunning(true);
    setStartTime(Date.now());
    setView('admin');
  }, [competition, validateCompetition]);

  const pauseCompetitor = useCallback((id) => {
    setCompetitors(prev => prev.map(c => {
      if (c.id === id && !c.isPaused && !c.isFinished) {
        return {
          ...c,
          isPaused: true,
          isRunning: false,
          pausedAt: generalTime,
          pauseStartTime: generalTime,
          pauseHistory: [...c.pauseHistory, { pausedAt: generalTime, resumedAt: null }]
        };
      }
      return c;
    }));
  }, [generalTime]);

  const resumeCompetitor = useCallback((id) => {
    setCompetitors(prev => prev.map(c => {
      if (c.id === id && c.isPaused) {
        const timeLost = c.pauseStartTime - generalTime;
        const newTotalPausedTime = c.totalPausedTime + timeLost;
        const newIndividualTime = generalTime + newTotalPausedTime;
        
        return {
          ...c,
          isPaused: false,
          isRunning: true,
          resumedAt: generalTime,
          totalPausedTime: newTotalPausedTime,
          individualTime: newIndividualTime,
          pauseHistory: c.pauseHistory.map((p, idx) => 
            idx === c.pauseHistory.length - 1 ? { ...p, resumedAt: generalTime, timeLost } : p
          )
        };
      }
      return c;
    }));
  }, [generalTime]);

  const toggleGeneralTimer = useCallback(() => {
    setIsGeneralRunning(prev => !prev);
  }, []);

  const openDisplayWindow = useCallback(() => {
    const displayUrl = `${window.location.origin}${window.location.pathname}?display=true`;
    displayWindowRef.current = window.open(displayUrl, 'DisplayWindow', 'width=1920,height=1080');
  }, []);

  const getTotalDuration = useCallback(() => {
    return competition.duration.hours * 3600 + competition.duration.minutes * 60 + competition.duration.seconds;
  }, [competition.duration]);

  const getTimerColor = useCallback((time, total) => {
    if (time <= 0) return 'text-red-500';
    const percentage = (time / total) * 100;
    if (percentage > 50) return 'text-emerald-400';
    if (percentage > 20) return 'text-amber-400';
    if (percentage > 10) return 'text-orange-500';
    return 'text-red-500';
  }, []);

  const getNextCompetitorToFinish = useCallback(() => {
    const active = competitors.filter(c => c.isRunning && c.individualTime > 0);
    if (active.length === 0) return null;
    return active.reduce((min, c) => c.individualTime < min.individualTime ? c : min);
  }, [competitors]);

  // Função para carregar imagem e converter para base64
  const loadImageAsBase64 = useCallback((src) => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }, []);

  const exportReport = useCallback(async () => {
    const totalDuration = getTotalDuration();
    // Criar PDF em modo paisagem
    const doc = new jsPDF('landscape');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Carregar logo como base64
    const logoBase64 = await loadImageAsBase64(logo);
    
    // Cores do tema
    const colors = {
      primary: [37, 99, 235],
      primaryLight: [239, 246, 255],
      dark: [30, 41, 59],
      gray: [100, 116, 139],
      lightGray: [248, 250, 252],
      green: [22, 163, 74],
      greenLight: [220, 252, 231],
      yellow: [202, 138, 4],
      yellowLight: [254, 249, 195],
      white: [255, 255, 255]
    };
    
    // Estatísticas
    const finalizados = competitors.filter(c => c.isFinished).length;
    const pediramAtendimento = competitors.filter(c => c.pauseHistory.length > 0).length;
    
    // ==================== CABEÇALHO ====================
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Logo (à esquerda)
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', 10, 5, 0, 30);
      } catch (e) {
        console.log('Erro ao adicionar logo:', e);
      }
    }
    
    // Título CENTRALIZADO
    doc.setTextColor(...colors.white);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATÓRIO DE CRONOMETRAGEM', pageWidth / 2, 12, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(competition.name, pageWidth / 2, 22, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(getFullModule(), pageWidth / 2, 30, { align: 'center' });
    
    // Data e Hora (à direita)
    doc.setFontSize(9);
    const dataHora = new Date().toLocaleDateString('pt-BR', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    }) + ' às ' + new Date().toLocaleTimeString('pt-BR');
    doc.text(dataHora, pageWidth - 10, 15, { align: 'right' });
    
    doc.text(`Duração da prova: ${formatTime(totalDuration)}`, pageWidth - 10, 25, { align: 'right' });
    
    // ==================== DASHBOARD (3 CARDS) ====================
    let yPos = 50;
    
    doc.setTextColor(...colors.dark);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo', pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 8;
    
    const cardWidth = 70;
    const cardHeight = 30;
    const totalCardsWidth = cardWidth * 3 + 20; // 3 cards + 2 espaços de 10
    const startX = (pageWidth - totalCardsWidth) / 2; // Centralizar os cards
    
    // Card 1 - Total Competidores (Azul)
    doc.setFillColor(...colors.primaryLight);
    doc.roundedRect(startX, yPos, cardWidth, cardHeight, 3, 3, 'F');
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(0.5);
    doc.roundedRect(startX, yPos, cardWidth, cardHeight, 3, 3, 'S');
    
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.primary);
    doc.text(competitors.length.toString(), startX + cardWidth/2, yPos + 14, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Total Competidores', startX + cardWidth/2, yPos + 24, { align: 'center' });
    
    // Card 2 - Finalizados (Verde)
    const card2X = startX + cardWidth + 10;
    doc.setFillColor(...colors.greenLight);
    doc.roundedRect(card2X, yPos, cardWidth, cardHeight, 3, 3, 'F');
    doc.setDrawColor(...colors.green);
    doc.roundedRect(card2X, yPos, cardWidth, cardHeight, 3, 3, 'S');
    
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.green);
    doc.text(finalizados.toString(), card2X + cardWidth/2, yPos + 14, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Finalizados', card2X + cardWidth/2, yPos + 24, { align: 'center' });
    
    // Card 3 - Pediram Atendimento (Amarelo)
    const card3X = startX + (cardWidth + 10) * 2;
    doc.setFillColor(...colors.yellowLight);
    doc.roundedRect(card3X, yPos, cardWidth, cardHeight, 3, 3, 'F');
    doc.setDrawColor(...colors.yellow);
    doc.roundedRect(card3X, yPos, cardWidth, cardHeight, 3, 3, 'S');
    
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.yellow);
    doc.text(pediramAtendimento.toString(), card3X + cardWidth/2, yPos + 14, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Pediram Atendimento', card3X + cardWidth/2, yPos + 24, { align: 'center' });
    
    // ==================== TABELA DE COMPETIDORES ====================
    yPos += cardHeight + 15;
    
    doc.setTextColor(...colors.dark);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Lista de Competidores', pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 5;
    
    // Dados da tabela
    const tableData = competitors.map((comp, index) => {
      let status = 'Em Andamento';
      if (comp.isFinished) status = 'Finalizado';
      else if (comp.isRunning) status = 'Tempo Extra';
      else if (comp.isPaused) status = 'Pausado';
      
      return [
        (index + 1).toString(),
        comp.name,
        status,
        comp.pauseHistory.length > 0 ? 'Sim' : 'Não',
        comp.pauseHistory.length.toString(),
        formatTime(comp.totalPausedTime)
      ];
    });
    
    doc.autoTable({
      startY: yPos,
      head: [['#', 'Nome do Competidor', 'Status', 'Pediu Atendimento', 'Nº Pausas', 'Tempo Compensado']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: colors.primary,
        textColor: colors.white,
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
        cellPadding: 3
      },
      bodyStyles: {
        fontSize: 9,
        textColor: colors.dark,
        cellPadding: 3,
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: colors.lightGray
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 80 },
        2: { cellWidth: 35, halign: 'center' },
        3: { cellWidth: 35, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 35, halign: 'center' }
      },
      // Centralizar tabela na página
      margin: { left: (pageWidth - 225) / 2, right: (pageWidth - 225) / 2 },
      tableWidth: 225,
      didParseCell: function(data) {
        if (data.column.index === 2 && data.section === 'body') {
          const status = data.cell.raw;
          if (status === 'Finalizado') {
            data.cell.styles.textColor = colors.green;
            data.cell.styles.fontStyle = 'bold';
          } else if (status === 'Tempo Extra') {
            data.cell.styles.textColor = colors.primary;
            data.cell.styles.fontStyle = 'bold';
          } else if (status === 'Pausado') {
            data.cell.styles.textColor = colors.yellow;
            data.cell.styles.fontStyle = 'bold';
          }
        }
        if (data.column.index === 3 && data.section === 'body') {
          if (data.cell.raw === 'Sim') {
            data.cell.styles.textColor = colors.yellow;
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });
    
    // ==================== HISTÓRICO DE ATENDIMENTOS ====================
    const competidoresComPausa = competitors.filter(c => c.pauseHistory.length > 0);
    
    if (competidoresComPausa.length > 0) {
      // Nova página para histórico
      doc.addPage('landscape');
      
      // Cabeçalho da página 2
      doc.setFillColor(...colors.primary);
      doc.rect(0, 0, pageWidth, 25, 'F');
      
      doc.setTextColor(...colors.white);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('HISTÓRICO DE ATENDIMENTOS', pageWidth / 2, 16, { align: 'center' });
      
      let detailY = 40;
      
      doc.setTextColor(...colors.gray);
      doc.setFontSize(10);
      doc.text(`${competidoresComPausa.length} competidor(es) solicitaram atendimento técnico durante a prova`, pageWidth / 2, detailY, { align: 'center' });
      
      detailY += 10;
      
      // Criar tabela de histórico
      const historicoData = [];
      
      competidoresComPausa.forEach((comp, compIndex) => {
        comp.pauseHistory.forEach((pausa, pausaIndex) => {
          historicoData.push([
            pausaIndex === 0 ? `${compIndex + 1}. ${comp.name}` : '',
            pausaIndex === 0 ? comp.pauseHistory.length.toString() : '',
            pausaIndex === 0 ? formatTime(comp.totalPausedTime) : '',
            `Atendimento ${pausaIndex + 1}`,
            formatTime(pausa.pausedAt),
            pausa.resumedAt ? formatTime(pausa.resumedAt) : 'Aguardando',
            pausa.timeLost ? formatTime(pausa.timeLost) : '-'
          ]);
        });
      });
      
      doc.autoTable({
        startY: detailY,
        head: [['Competidor', 'Total Pausas', 'Total Compensado', 'Atendimento', 'Pausado em', 'Retomado em', 'Tempo Compensado']],
        body: historicoData,
        theme: 'grid',
        headStyles: {
          fillColor: colors.yellow,
          textColor: colors.dark,
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center',
          cellPadding: 3
        },
        bodyStyles: {
          fontSize: 9,
          textColor: colors.dark,
          cellPadding: 3
        },
        alternateRowStyles: {
          fillColor: colors.yellowLight
        },
        columnStyles: {
          0: { cellWidth: 70, fontStyle: 'bold' },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 35, halign: 'center' },
          3: { cellWidth: 30, halign: 'center' },
          4: { cellWidth: 30, halign: 'center' },
          5: { cellWidth: 30, halign: 'center' },
          6: { cellWidth: 35, halign: 'center' }
        },
        // Centralizar tabela na página
        margin: { left: (pageWidth - 255) / 2, right: (pageWidth - 255) / 2 },
        tableWidth: 255,
        didParseCell: function(data) {
          if (data.column.index === 6 && data.section === 'body' && data.cell.raw !== '-') {
            data.cell.styles.textColor = colors.green;
            data.cell.styles.fontStyle = 'bold';
          }
        }
      });
    }
    
    // ==================== PÁGINA DE ASSINATURAS ====================
    if (avaliadores.length > 0) {
      doc.addPage('landscape');
      
      // Cabeçalho
      doc.setFillColor(...colors.primary);
      doc.rect(0, 0, pageWidth, 25, 'F');
      
      doc.setTextColor(...colors.white);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('ASSINATURAS', pageWidth / 2, 16, { align: 'center' });
      
      let signY = 45;
      
      // Avaliador Líder e Adjunto (os dois primeiros)
      if (avaliadores.length >= 2) {
        const lider = avaliadores[0];
        const adjunto = avaliadores[1];
        
        const boxWidth = 100;
        const boxSpacing = 40;
        const startX = (pageWidth - (boxWidth * 2 + boxSpacing)) / 2;
        
        // Avaliador Líder
        doc.setDrawColor(...colors.dark);
        doc.setLineWidth(0.5);
        doc.line(startX, signY + 20, startX + boxWidth, signY + 20);
        
        doc.setTextColor(...colors.dark);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(lider, startX + boxWidth / 2, signY + 28, { align: 'center' });
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.gray);
        doc.text('Avaliador Líder', startX + boxWidth / 2, signY + 35, { align: 'center' });
        
        // Avaliador Líder Adjunto
        const adjX = startX + boxWidth + boxSpacing;
        doc.setDrawColor(...colors.dark);
        doc.line(adjX, signY + 20, adjX + boxWidth, signY + 20);
        
        doc.setTextColor(...colors.dark);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(adjunto, adjX + boxWidth / 2, signY + 28, { align: 'center' });
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.gray);
        doc.text('Avaliador Líder Adjunto', adjX + boxWidth / 2, signY + 35, { align: 'center' });
        
        signY += 55;
      } else if (avaliadores.length === 1) {
        // Apenas um avaliador (líder)
        const lider = avaliadores[0];
        const boxWidth = 100;
        const startX = (pageWidth - boxWidth) / 2;
        
        doc.setDrawColor(...colors.dark);
        doc.setLineWidth(0.5);
        doc.line(startX, signY + 20, startX + boxWidth, signY + 20);
        
        doc.setTextColor(...colors.dark);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(lider, startX + boxWidth / 2, signY + 28, { align: 'center' });
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.gray);
        doc.text('Avaliador Líder', startX + boxWidth / 2, signY + 35, { align: 'center' });
        
        signY += 55;
      }
      
      // Tabela de Avaliadores (a partir do terceiro)
      if (avaliadores.length > 2) {
        doc.setTextColor(...colors.dark);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('AVALIADORES', pageWidth / 2, signY, { align: 'center' });
        
        signY += 8;
        
        const avaliadoresRestantes = avaliadores.slice(2).map((nome, index) => [
          (index + 1).toString(),
          nome,
          '' // Espaço para assinatura
        ]);
        
        doc.autoTable({
          startY: signY,
          head: [['#', 'Nome do Avaliador', 'Assinatura']],
          body: avaliadoresRestantes,
          theme: 'grid',
          headStyles: {
            fillColor: colors.primary,
            textColor: colors.white,
            fontStyle: 'bold',
            fontSize: 10,
            halign: 'center',
            cellPadding: 4
          },
          bodyStyles: {
            fontSize: 10,
            textColor: colors.dark,
            cellPadding: 8,
            minCellHeight: 15
          },
          alternateRowStyles: {
            fillColor: colors.lightGray
          },
          columnStyles: {
            0: { cellWidth: 20, halign: 'center' },
            1: { cellWidth: 80 },
            2: { cellWidth: 100 } // Espaço amplo para assinatura
          },
          margin: { left: (pageWidth - 200) / 2, right: (pageWidth - 200) / 2 },
          tableWidth: 200
        });
      }
    }
    
    // ==================== RODAPÉ EM TODAS AS PÁGINAS ====================
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      doc.setDrawColor(...colors.gray);
      doc.setLineWidth(0.2);
      doc.line(15, pageHeight - 12, pageWidth - 15, pageHeight - 12);
      
      doc.setFontSize(8);
      doc.setTextColor(...colors.gray);
      doc.setFont('helvetica', 'normal');
      doc.text('SP Skills Timer - Sistema de Cronometragem para Competições', 15, pageHeight - 6);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - 15, pageHeight - 6, { align: 'right' });
    }
    
    // Salvar PDF
    const fileName = `Relatorio_${competition.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    setReportExported(true);
  }, [competition, competitors, formatTime, getTotalDuration, logo, avaliadores, loadImageAsBase64, getFullModule]);

  const resetAll = useCallback(() => {
    // Se a competição terminou e o relatório não foi exportado, bloquear
    if (isGeneralFinished && !reportExported) {
      alert('⚠️ Faça o download do relatório PDF antes de reiniciar!\n\nIsso garante que você não perca os dados da competição.');
      return;
    }
    
    if (!window.confirm('⚠️ Deseja reiniciar toda a competição?')) return;
    
    setView('setup');
    setGeneralTime(0);
    setIsGeneralRunning(false);
    setIsGeneralFinished(false);
    setReportExported(false);
    setCompetitors(prev => prev.map(c => ({
      ...c,
      isPaused: false,
      isRunning: false,
      isFinished: false,
      pausedAt: null,
      pauseStartTime: null,
      resumedAt: null,
      totalPausedTime: 0,
      individualTime: 0,
      pauseHistory: []
    })));
    localStorage.removeItem('competitionTimerState');
  }, [isGeneralFinished, reportExported]);

  // VIEW: SETUP
  if (view === 'setup') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        {/* Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>
        
        <audio ref={audioRef} src="data:audio/wav;base64,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" />
        
        <div className="relative max-w-5xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/10 mb-6">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-400">Sistema de Cronometragem</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent mb-4">
              Timer São Paulo Skills
            </h1>
            <p className="text-gray-400 text-lg">Configure sua competição</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Configuração da Competição */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                  <Settings2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Configuração</h2>
                  <p className="text-sm text-gray-400">Dados da prova</p>
                </div>
              </div>

              {/* Logo carregada da pasta public/logo/logo.png */}
              <div className="mb-6 flex flex-col items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                <img 
                  src={logo} 
                  alt="Logo" 
                  className="h-20 object-contain"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <p className="text-xs text-gray-500">Logo: public/logo/logo.png</p>
              </div>

              {/* Upload de logo desabilitado - coloque a logo manualmente em public/logo/logo.png
              <div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                />
                <button
                  className="w-full py-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/30 rounded-2xl transition flex items-center justify-center gap-3 text-purple-300"
                >
                  <Image className="w-5 h-5" />
                  Carregar Logo
                </button>
              </div>
              */}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nome da Ocupação</label>
                  <select
                    value={competition.name}
                    onChange={(e) => setCompetition(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-blue-500/50 focus:bg-white/10 transition text-white outline-none appearance-none cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5rem' }}
                  >
                    <option value="" className="bg-[#1a1a2e] text-gray-400">Selecione a ocupação...</option>
                    {/* Lista de ocupações - adicione novas aqui em ordem crescente */}
                    <option value="#06 - TORNEARIA CNC" className="bg-[#1a1a2e]">#06 - TORNEARIA CNC</option>
                    <option value="#09 - SOLUÇÕES DE SOFTWARE PARA NEGÓCIOS" className="bg-[#1a1a2e]">#09 - SOLUÇÕES DE SOFTWARE PARA NEGÓCIOS</option>
                    <option value="#16 - ELETRÔNICA" className="bg-[#1a1a2e]">#16 - ELETRÔNICA</option>
                    <option value="#17 - TECNOLOGIAS WEB" className="bg-[#1a1a2e]">#17 - TECNOLOGIAS WEB</option>
                    <option value="#18 - INSTALAÇÕES ELÉTRICAS" className="bg-[#1a1a2e]">#18 - INSTALAÇÕES ELÉTRICAS</option>
                    <option value="#47 - PANIFICAÇÃO" className="bg-[#1a1a2e]">#47 - PANIFICAÇÃO</option>
                    <option value="#52 - TECNOLOGIA LABORATORIAL QUÍMICA" className="bg-[#1a1a2e]">#52 - TECNOLOGIA LABORATORIAL QUÍMICA</option>
                    <option value="#53 - COMPUTAÇÃO EM NUVEM" className="bg-[#1a1a2e]">#53 - COMPUTAÇÃO EM NUVEM</option>
                    <option value="#60 - TECNOLOGIA OPTOELETRÔNICA" className="bg-[#1a1a2e]">#60 - TECNOLOGIA OPTOELETRÔNICA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Módulo</label>
                  <select
                    value={competition.module}
                    onChange={(e) => setCompetition(prev => ({ ...prev, module: e.target.value }))}
                    className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-blue-500/50 focus:bg-white/10 transition text-white outline-none appearance-none cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5rem' }}
                  >
                    <option value="" className="bg-[#1a1a2e] text-gray-400">Selecione o módulo...</option>
                    <option value="MÓDULO A" className="bg-[#1a1a2e]">MÓDULO A</option>
                    <option value="MÓDULO B" className="bg-[#1a1a2e]">MÓDULO B</option>
                    <option value="MÓDULO C" className="bg-[#1a1a2e]">MÓDULO C</option>
                    <option value="MÓDULO D" className="bg-[#1a1a2e]">MÓDULO D</option>
                    <option value="MÓDULO E" className="bg-[#1a1a2e]">MÓDULO E</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Prova</label>
                  <select
                    value={competition.prova}
                    onChange={(e) => setCompetition(prev => ({ ...prev, prova: e.target.value }))}
                    className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-blue-500/50 focus:bg-white/10 transition text-white outline-none appearance-none cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5rem' }}
                  >
                    <option value="" className="bg-[#1a1a2e] text-gray-400">Selecione a prova...</option>
                    <option value="P1" className="bg-[#1a1a2e]">P1</option>
                    <option value="P2" className="bg-[#1a1a2e]">P2</option>
                    <option value="P3" className="bg-[#1a1a2e]">P3</option>
                    <option value="P4" className="bg-[#1a1a2e]">P4</option>
                    <option value="P5" className="bg-[#1a1a2e]">P5</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Duração da Prova</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['hours', 'minutes', 'seconds'].map((unit, i) => (
                      <div key={unit}>
                        <label className="block text-xs text-gray-500 mb-1 text-center">
                          {['Horas', 'Minutos', 'Segundos'][i]}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={unit === 'hours' ? 23 : 59}
                          value={competition.duration[unit]}
                          onChange={(e) => setCompetition(prev => ({
                            ...prev,
                            duration: { ...prev.duration, [unit]: parseInt(e.target.value) || 0 }
                          }))}
                          className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-center text-2xl font-mono text-white outline-none focus:border-blue-500/50"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Competidores */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Competidores</h2>
                  <p className="text-sm text-gray-400">{competitors.length} adicionados</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/30 rounded-2xl transition flex items-center justify-center gap-3 text-emerald-300"
                >
                  <Upload className="w-5 h-5" />
                  Importar de arquivo .txt
                </button>

                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Nome do competidor"
                    value={newCompetitorName}
                    onChange={(e) => setNewCompetitorName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCompetitor()}
                    className="flex-1 px-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-blue-500/50 transition text-white placeholder-gray-500 outline-none"
                  />
                  <button
                    onClick={addCompetitor}
                    className="px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-2xl transition flex items-center gap-2 text-white font-medium"
                  >
                    <UserPlus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {competitors.map((comp, index) => (
                  <div 
                    key={comp.id} 
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center text-sm text-blue-400 font-medium">
                        {index + 1}
                      </span>
                      <span className="text-white">{comp.name}</span>
                    </div>
                    <button
                      onClick={() => removeCompetitor(comp.id)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {competitors.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhum competidor adicionado</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Avaliadores */}
          <div className="mt-6 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-2xl flex items-center justify-center">
                <ClipboardSignature className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Avaliadores</h2>
                <p className="text-sm text-gray-400">Para assinaturas no relatório PDF</p>
              </div>
            </div>

            <div className="space-y-4">
              <input
                ref={avaliadoresInputRef}
                type="file"
                accept=".txt"
                onChange={handleAvaliadoresUpload}
                className="hidden"
              />
              <button
                onClick={() => avaliadoresInputRef.current?.click()}
                className="w-full py-4 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/30 rounded-2xl transition flex items-center justify-center gap-3 text-amber-300"
              >
                <Upload className="w-5 h-5" />
                Importar Avaliadores (.txt)
              </button>
              <p className="text-xs text-gray-500 text-center">
                Arquivo com um nome por linha. Os dois primeiros serão Líder e Adjunto.
              </p>

              {avaliadores.length > 0 && (
                <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {avaliadores.map((av, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center text-sm text-amber-400 font-medium">
                          {index + 1}
                        </span>
                        <span className="text-white">{av}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {index === 0 && (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-lg">Líder</span>
                        )}
                        {index === 1 && (
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-lg">Adjunto</span>
                        )}
                        {index > 1 && (
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-lg">Avaliador</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {avaliadores.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <ClipboardSignature className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum avaliador adicionado</p>
                  <p className="text-xs text-gray-600 mt-1">Opcional - campos de assinatura no PDF</p>
                </div>
              )}
            </div>
          </div>

          {/* Botão Iniciar */}
          <div className="mt-8 text-center">
            <button
              onClick={startCompetition}
              disabled={!validateCompetition()}
              className="group px-12 py-5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-2xl transition-all duration-300 shadow-lg shadow-blue-500/25 disabled:shadow-none"
            >
              <span className="flex items-center gap-3 text-white font-bold text-lg">
                <Zap className="w-6 h-6" />
                Iniciar Competição
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // VIEW: ADMIN
  if (view === 'admin') {
    const totalDuration = getTotalDuration();
    const activePausedCompetitors = competitors.filter(c => c.isPaused || c.isRunning);
    const regularCompetitors = competitors.filter(c => !c.isPaused && !c.isRunning && !c.isFinished);
    const finishedCompetitors = competitors.filter(c => c.isFinished);

    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-6">
        {/* Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 md:p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                {logo && <img src={logo} alt="Logo" className="h-12 object-contain" />}
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-white">{competition.name}</h1>
                  <p className="text-gray-400">{getFullModule()}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <button
                  onClick={openDisplayWindow}
                  className="flex-1 md:flex-none px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl transition flex items-center justify-center gap-2 text-purple-300"
                >
                  <Monitor className="w-4 h-4" />
                  <span className="hidden sm:inline">Telão</span>
                </button>
                <button
                  onClick={exportReport}
                  className={`flex-1 md:flex-none px-4 py-3 ${
                    isGeneralFinished && !reportExported 
                      ? 'bg-orange-500/20 hover:bg-orange-500/30 border-orange-500/30 text-orange-300 animate-pulse' 
                      : 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30 text-blue-300'
                  } border rounded-xl transition flex items-center justify-center gap-2`}
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">PDF</span>
                </button>
                <button
                  onClick={resetAll}
                  title={isGeneralFinished && !reportExported ? 'Faça o download do PDF antes de reiniciar' : 'Reiniciar competição'}
                  className={`flex-1 md:flex-none px-4 py-3 border rounded-xl transition flex items-center justify-center gap-2 ${
                    isGeneralFinished && !reportExported 
                      ? 'bg-gray-500/20 border-gray-500/30 text-gray-500 cursor-not-allowed opacity-50' 
                      : 'bg-red-500/20 hover:bg-red-500/30 border-red-500/30 text-red-300'
                  }`}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="hidden sm:inline">Reiniciar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Timer Principal */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 md:p-10 mb-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6">
                <Timer className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-300">
                  {isGeneralFinished ? 'Tempo Encerrado' : isGeneralRunning ? 'Em Andamento' : 'Pausado'}
                </span>
              </div>
              
              <div className={`text-6xl md:text-8xl lg:text-9xl font-bold font-mono mb-8 ${getTimerColor(generalTime, totalDuration)}`}>
                {formatTime(generalTime)}
              </div>
              
              <button
                onClick={toggleGeneralTimer}
                disabled={isGeneralFinished}
                className={`px-10 py-5 rounded-2xl transition-all duration-300 flex items-center gap-4 mx-auto font-bold text-lg ${
                  isGeneralRunning 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25' 
                    : 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-lg shadow-emerald-500/25'
                } disabled:from-gray-600 disabled:to-gray-700 disabled:shadow-none disabled:cursor-not-allowed text-white`}
              >
                {isGeneralRunning ? (
                  <>
                    <Pause className="w-6 h-6" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="w-6 h-6" />
                    {isGeneralFinished ? 'Encerrado' : 'Retomar'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Grid de Competidores */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Competidores em Andamento */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <Play className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="font-bold text-white">Em Andamento</h2>
                  <p className="text-sm text-gray-400">{regularCompetitors.length} competidores</p>
                </div>
              </div>
              
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {regularCompetitors.map(comp => (
                  <div key={comp.id} className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">{comp.name}</span>
                      <button
                        onClick={() => pauseCompetitor(comp.id)}
                        className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-sm rounded-lg transition flex items-center gap-2"
                      >
                        <Pause className="w-3 h-3" />
                        Pausar
                      </button>
                    </div>
                  </div>
                ))}
                {regularCompetitors.length === 0 && (
                  <p className="text-center text-gray-500 py-8">Nenhum competidor em andamento</p>
                )}
              </div>
            </div>

            {/* Competidores Pausados / Tempo Extra */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="font-bold text-white">Atendimento / Tempo Extra</h2>
                  <p className="text-sm text-gray-400">{activePausedCompetitors.length} competidores</p>
                </div>
              </div>
              
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {activePausedCompetitors.map(comp => (
                  <div 
                    key={comp.id} 
                    className={`p-4 rounded-xl border ${
                      comp.isPaused 
                        ? 'bg-amber-500/10 border-amber-500/20' 
                        : 'bg-blue-500/10 border-blue-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-white">{comp.name}</span>
                      {comp.isRunning && (
                        <span className="text-2xl font-mono font-bold text-blue-400">
                          {formatTime(comp.individualTime)}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-400 space-y-1 mb-3">
                      <p>Pausado em: {formatTime(comp.pausedAt)}</p>
                      {comp.resumedAt && <p>Retomado em: {formatTime(comp.resumedAt)}</p>}
                      {comp.totalPausedTime > 0 && (
                        <p className="text-blue-400">Compensação: {formatTime(comp.totalPausedTime)}</p>
                      )}
                    </div>
                    
                    {comp.isPaused ? (
                      <button
                        onClick={() => resumeCompetitor(comp.id)}
                        className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-sm rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <Play className="w-3 h-3" />
                        Retomar
                      </button>
                    ) : (
                      <button
                        onClick={() => pauseCompetitor(comp.id)}
                        className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-sm rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <Pause className="w-3 h-3" />
                        Pausar Novamente
                      </button>
                    )}
                  </div>
                ))}
                {activePausedCompetitors.length === 0 && (
                  <p className="text-center text-gray-500 py-8">Nenhum competidor em atendimento</p>
                )}
              </div>
            </div>
          </div>

          {/* Finalizados */}
          {finishedCompetitors.length > 0 && (
            <div className="mt-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h2 className="font-bold text-white">Finalizados</h2>
                  <p className="text-sm text-gray-400">{finishedCompetitors.length} competidores</p>
                </div>
              </div>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {finishedCompetitors.map(comp => (
                  <div key={comp.id} className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span className="font-medium text-white">{comp.name}</span>
                    </div>
                    {comp.totalPausedTime > 0 && (
                      <p className="text-xs text-gray-400 mt-2">
                        Compensação usada: {formatTime(comp.totalPausedTime)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // VIEW: DISPLAY (Telão)
  if (view === 'display') {
    const totalDuration = getTotalDuration();
    const activeCompetitors = competitors.filter(c => c.isRunning && c.individualTime > 0);
    const nextToFinish = getNextCompetitorToFinish();
    const hasExtraTime = activeCompetitors.length > 0;

    // Grid sempre horizontal e compacto
    const getGridCols = (count) => {
      if (count <= 3) return count;
      if (count <= 6) return 3;
      if (count <= 8) return 4;
      if (count <= 10) return 5;
      if (count <= 12) return 6;
      if (count <= 16) return 8;
      return Math.min(10, Math.ceil(count / 2));
    };

    return (
      <div className="h-screen w-screen overflow-hidden bg-[#0a0a0f] text-white flex flex-col">
        {/* Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>
        
        {!isDisplayWindow && (
          <button
            onClick={() => setView('admin')}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition flex items-center gap-2 z-10 backdrop-blur-xl border border-white/10"
          >
            <X className="w-4 h-4" />
            <span>Voltar</span>
          </button>
        )}

        <div className="relative flex-1 flex flex-col p-4 overflow-hidden">
          {/* Header - Com mais margem top */}
          <div className="flex items-center justify-center gap-4 pt-2 mb-6 flex-shrink-0">
            {logo && (
              <img 
                src={logo} 
                alt="Logo" 
                className="h-12 md:h-16 object-contain flex-shrink-0"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">
                {competition.name}
              </h1>
              <p className="text-sm md:text-base text-gray-400">{getFullModule()}</p>
            </div>
          </div>

          {/* Conteúdo Principal */}
          <div className="flex-1 flex flex-col min-h-0">
            
            {/* Timer Geral em andamento */}
            {!isGeneralFinished && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Timer Principal - Maior altura */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 md:p-12 lg:p-16 flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6">
                      <div className={`w-3 h-3 rounded-full ${isGeneralRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></div>
                      <span className="text-sm md:text-base text-gray-300">{isGeneralRunning ? 'Em Andamento' : 'Pausado'}</span>
                    </div>
                    
                    <div className={`text-7xl md:text-8xl lg:text-9xl font-bold font-mono ${getTimerColor(generalTime, totalDuration)}`}>
                      {formatTime(generalTime)}
                    </div>
                  </div>
                </div>

                {/* Competidores em Tempo Extra - Fixo no rodapé */}
                {hasExtraTime && (
                  <div className="bg-blue-500/10 backdrop-blur-xl rounded-xl border border-blue-500/30 p-2 mt-4 flex-shrink-0">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-bold text-blue-300">
                        Tempo Extra ({activeCompetitors.length})
                      </span>
                    </div>
                    
                    {/* Grid Horizontal Compacto */}
                    <div 
                      className="grid gap-1"
                      style={{ 
                        gridTemplateColumns: `repeat(${getGridCols(activeCompetitors.length)}, 1fr)`
                      }}
                    >
                      {activeCompetitors.map(comp => (
                        <div 
                          key={comp.id} 
                          className="bg-blue-500/15 rounded-lg border border-blue-500/20 px-2 py-1 text-center"
                        >
                          <div className="text-[10px] text-white truncate font-medium">{comp.name}</div>
                          <div className={`text-sm font-mono font-bold ${getTimerColor(comp.individualTime, totalDuration)}`}>
                            {formatTime(comp.individualTime)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tempo Encerrado com próximo a finalizar */}
            {isGeneralFinished && nextToFinish && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Timer zerado */}
                <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-3 text-center mb-4 flex-shrink-0">
                  <span className="text-gray-400 text-sm">Tempo Geral Encerrado</span>
                  <div className="text-3xl md:text-4xl font-mono font-bold text-red-500">00:00:00</div>
                </div>

                {/* Próximo a finalizar - GRANDE */}
                <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-8 md:p-12 flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6">
                      <Zap className="w-5 h-5 text-blue-400" />
                      <span className="text-blue-300 font-medium">Próximo a Finalizar</span>
                    </div>
                    
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{nextToFinish.name}</h2>
                    
                    <div className={`text-6xl md:text-7xl lg:text-8xl font-mono font-bold mb-4 ${getTimerColor(nextToFinish.individualTime, totalDuration)}`}>
                      {formatTime(nextToFinish.individualTime)}
                    </div>
                    
                    <div className="text-blue-300/70">
                      Compensação: {formatTime(nextToFinish.totalPausedTime)}
                    </div>
                  </div>
                </div>

                {/* Outros em Tempo Extra - Fixo no rodapé */}
                {activeCompetitors.length > 1 && (
                  <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-2 mt-4 flex-shrink-0">
                    <div className="text-center text-gray-400 text-xs mb-2">
                      Outros em Tempo Extra ({activeCompetitors.length - 1})
                    </div>
                    <div 
                      className="grid gap-1"
                      style={{ 
                        gridTemplateColumns: `repeat(${getGridCols(activeCompetitors.length - 1)}, 1fr)`
                      }}
                    >
                      {activeCompetitors.filter(c => c.id !== nextToFinish.id).map(comp => (
                        <div 
                          key={comp.id} 
                          className="bg-blue-500/15 rounded-lg border border-blue-500/20 px-2 py-1 text-center"
                        >
                          <div className="text-[10px] text-white truncate font-medium">{comp.name}</div>
                          <div className="text-sm font-mono font-bold text-blue-400">
                            {formatTime(comp.individualTime)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Todos Finalizados */}
            {isGeneralFinished && !nextToFinish && (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-full max-w-3xl space-y-4">
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 text-center">
                    <span className="text-gray-400 text-sm">Tempo Geral Encerrado</span>
                    <div className="text-3xl md:text-4xl font-mono font-bold text-red-500 mt-1">00:00:00</div>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 backdrop-blur-xl rounded-2xl border border-emerald-500/30 p-10 md:p-16 text-center">
                    <CheckCircle2 className="w-20 h-20 md:w-24 md:h-24 text-emerald-400 mx-auto mb-6" />
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-emerald-400 mb-3">
                      Todos Finalizaram!
                    </h2>
                    <p className="text-lg md:text-xl text-gray-400">Parabéns a todos os participantes!</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="relative text-center py-2 flex-shrink-0">
          <p className="text-gray-600 text-xs">São Paulo Skills Timer</p>
          <p className="text-gray-600 text-xs">Desenvolvido por Prof. Weverton E. Lubask | v17.0.20251214</p>
        </div>
      </div>
    );
  }
}
