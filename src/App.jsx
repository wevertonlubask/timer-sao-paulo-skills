import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Clock, Users, UserPlus, Trash2, Monitor, Settings, Upload, X, Download, AlertCircle, Image } from 'lucide-react';

export default function CompetitionTimer() {
  // Detectar se é janela de display ANTES de inicializar estados
  const urlParams = new URLSearchParams(window.location.search);
  const isDisplayParam = urlParams.get('display') === 'true';
  
  const [view, setView] = useState(isDisplayParam ? 'display' : 'setup');
  const [competition, setCompetition] = useState({
    name: '',
    module: '',
    duration: { hours: 3, minutes: 0, seconds: 0 }
  });
  const [competitors, setCompetitors] = useState([]);
  const [newCompetitorName, setNewCompetitorName] = useState('');
  const [logo, setLogo] = useState(null);
  
  const [generalTime, setGeneralTime] = useState(0);
  const [isGeneralRunning, setIsGeneralRunning] = useState(false);
  const [isGeneralFinished, setIsGeneralFinished] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [reportExported, setReportExported] = useState(false);
  const [isDisplayWindow, setIsDisplayWindow] = useState(isDisplayParam);
  
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const displayWindowRef = useRef(null);
  const syncIntervalRef = useRef(null);

  // Sincronização em tempo real para a janela de display
  useEffect(() => {
    if (isDisplayWindow) {
      // Escutar mudanças no localStorage
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
        if (e.key === 'competitionTimerLogo') {
          setLogo(e.newValue);
        }
      };

      window.addEventListener('storage', handleStorageChange);

      // Sincronização inicial e periódica
      const syncFromStorage = () => {
        const saved = localStorage.getItem('competitionTimerState');
        const savedLogo = localStorage.getItem('competitionTimerLogo');
        
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
        
        if (savedLogo) {
          setLogo(savedLogo);
        }
      };

      // Sincronizar imediatamente
      syncFromStorage();

      // Sincronizar a cada 500ms para garantir atualização em tempo real
      syncIntervalRef.current = setInterval(syncFromStorage, 500);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      };
    }
  }, [isDisplayWindow]);

  // Persistência com localStorage (apenas na janela principal)
  useEffect(() => {
    if (!isDisplayWindow) {
      const saved = localStorage.getItem('competitionTimerState');
      const savedLogo = localStorage.getItem('competitionTimerLogo');
      
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
      
      if (savedLogo) {
        try {
          setLogo(savedLogo);
        } catch (e) {
          console.error('Erro ao carregar logo:', e);
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

  useEffect(() => {
    if (!isDisplayWindow && logo) {
      localStorage.setItem('competitionTimerLogo', logo);
    }
  }, [logo, isDisplayWindow]);

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
  /*useEffect(() => {
    const intervals = {};
    
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
    
    return () => {
      Object.values(intervals).forEach(interval => clearInterval(interval));
    };
  }, [competitors]);*/

  // Cronômetros individuais
  useEffect(() => {
    const intervals = {};
    
    // ✅ Só cria intervalos se o tempo geral estiver rodando
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
    if (!newCompetitorName.trim()) {
      alert('⚠️ Digite um nome válido');
      return;
    }
    
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

    if (!file.name.endsWith('.txt')) {
      alert('⚠️ Por favor, selecione um arquivo .txt');
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const names = text
          .split(/[\r\n]+/)
          .map(name => name.trim())
          .filter(name => name.length > 0);
        
        if (names.length === 0) {
          alert('⚠️ Nenhum nome válido encontrado no arquivo');
          return;
        }
        
        const existingNames = new Set(competitors.map(c => c.name.toLowerCase()));
        const duplicates = names.filter(name => existingNames.has(name.toLowerCase()));
        
        if (duplicates.length > 0) {
          const proceed = window.confirm(
            `⚠️ ${duplicates.length} nome(s) duplicado(s) encontrado(s):\n${duplicates.join(', ')}\n\nDeseja importar apenas os nomes únicos?`
          );
          if (!proceed) return;
        }
        
        const uniqueNames = names.filter(name => !existingNames.has(name.toLowerCase()));
        
        const newCompetitors = uniqueNames.map((name, index) => ({
          id: Date.now() + index,
          name: name,
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
        
        setCompetitors(prev => [...prev, ...newCompetitors]);
        alert(`✅ ${uniqueNames.length} competidor(es) importado(s)!`);
      } catch (error) {
        alert('❌ Erro ao processar arquivo');
        console.error(error);
      }
    };
    
    reader.onerror = () => {
      alert('❌ Erro ao ler arquivo');
    };
    
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [competitors]);

  const handleLogoUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('⚠️ Por favor, selecione uma imagem válida (JPG, PNG, GIF ou WEBP)');
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('⚠️ A imagem deve ter no máximo 2MB');
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const base64String = event.target.result;
        setLogo(base64String);
        alert('✅ Logo carregado com sucesso!');
      } catch (error) {
        alert('❌ Erro ao processar imagem');
        console.error(error);
      }
    };
    
    reader.onerror = () => {
      alert('❌ Erro ao ler imagem');
    };
    
    reader.readAsDataURL(file);
    
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  }, []);

  const removeLogo = useCallback(() => {
    const proceed = window.confirm('⚠️ Tem certeza que deseja remover o logo?');
    if (!proceed) return;
    
    setLogo(null);
    localStorage.removeItem('competitionTimerLogo');
    alert('✅ Logo removido com sucesso!');
  }, []);

  const removeCompetitor = useCallback((id) => {
    const comp = competitors.find(c => c.id === id);
    if (comp && (comp.isPaused || comp.isRunning)) {
      const proceed = window.confirm(
        `⚠️ ${comp.name} está em atendimento/tempo extra. Tem certeza que deseja remover?`
      );
      if (!proceed) return;
    }
    setCompetitors(prev => prev.filter(c => c.id !== id));
  }, [competitors]);

  const validateCompetition = useCallback(() => {
    if (!competition.name.trim()) {
      alert('⚠️ Preencha o nome da ocupação');
      return false;
    }
    
    if (!competition.module.trim()) {
      alert('⚠️ Preencha o módulo');
      return false;
    }
    
    if (competitors.length === 0) {
      alert('⚠️ Adicione pelo menos um competidor');
      return false;
    }
    
    const totalSeconds = 
      competition.duration.hours * 3600 + 
      competition.duration.minutes * 60 + 
      competition.duration.seconds;
    
    if (totalSeconds <= 0) {
      alert('⚠️ Configure um tempo válido para a prova (maior que 0)');
      return false;
    }

    if (totalSeconds > 86400) {
      alert('⚠️ O tempo máximo é de 24 horas');
      return false;
    }
    
    return true;
  }, [competition, competitors]);

  const startCompetition = useCallback(() => {
    if (!validateCompetition()) return;
    
    const totalSeconds = 
      competition.duration.hours * 3600 + 
      competition.duration.minutes * 60 + 
      competition.duration.seconds;
    
    setGeneralTime(totalSeconds);
    setIsGeneralRunning(true);
    setStartTime(Date.now());
    setView('admin');
  }, [competition, validateCompetition]);

  const pauseCompetitor = useCallback((id) => {
    setCompetitors(prev => prev.map(c => {
      if (c.id === id && !c.isPaused && !c.isFinished) {
        console.log(`[DEBUG] Pausando ${c.name}:`, {
          generalTime,
          individualTimeAtual: c.individualTime,
          isRunning: c.isRunning,
          totalPausedTime: c.totalPausedTime
        });
        
        return {
          ...c,
          isPaused: true,
          isRunning: false,
          pausedAt: generalTime,
          pauseStartTime: generalTime, // Sempre o tempo geral no momento da pausa
          // ✅ IMPORTANTE: Preserva individualTime atual (se em tempo extra)
          pauseHistory: [...c.pauseHistory, { 
            pausedAt: generalTime, 
            pausedAtTime: Date.now(),
            resumedAt: null,
            resumedAtTime: null 
          }]
        };
      }
      return c;
    }));
  }, [generalTime]);

  const resumeCompetitor = useCallback((id) => {
    setCompetitors(prev => prev.map(c => {
      if (c.id === id && c.isPaused) {
        // Calcula quanto tempo o GERAL avançou enquanto estava pausado
        const timeLost = c.pauseStartTime - generalTime;
        
        // ✅ CORREÇÃO CRÍTICA: Sempre usar tempo geral + compensação total
        // Isso garante que múltiplas pausas sejam somadas corretamente
        const newTotalPausedTime = c.totalPausedTime + timeLost;
        const newIndividualTime = generalTime + newTotalPausedTime;
        
        console.log(`[DEBUG] Retomando ${c.name}:`, {
          generalTime,
          pauseStartTime: c.pauseStartTime,
          timeLostNestaPausa: timeLost,
          totalPausedTimeAnterior: c.totalPausedTime,
          newTotalPausedTime,
          newIndividualTime,
          diferenca: newIndividualTime - generalTime
        });
        
        return {
          ...c,
          isPaused: false,
          isRunning: true,
          resumedAt: generalTime,
          totalPausedTime: newTotalPausedTime,
          individualTime: newIndividualTime,
          pauseHistory: c.pauseHistory.map((p, idx) => 
            idx === c.pauseHistory.length - 1 ? { 
              ...p, 
              resumedAt: generalTime,
              resumedAtTime: Date.now(),
              timeLost: timeLost 
            } : p
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
    const width = 1920;
    const height = 1080;
    const left = window.screen.availLeft || 0;
    const top = window.screen.availTop || 0;
    
    const features = `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,scrollbars=yes`;
    
    // Fechar janela anterior se existir
    if (displayWindowRef.current && !displayWindowRef.current.closed) {
      displayWindowRef.current.close();
    }
    
    displayWindowRef.current = window.open(displayUrl, 'DisplayWindow', features);
    
    if (!displayWindowRef.current) {
      alert('⚠️ Não foi possível abrir a janela do telão. Verifique se o bloqueador de pop-ups está desativado.');
    }
  }, []);

  const exportReport = useCallback(() => {
    const totalDuration = competition.duration.hours * 3600 + 
                         competition.duration.minutes * 60 + 
                         competition.duration.seconds;
    
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR');
    
    // Função auxiliar para centralizar texto
    const centerText = (text, width = 85) => {
      const padding = Math.max(0, Math.floor((width - text.length) / 2));
      return ' '.repeat(padding) + text;
    };
    
    let report = '';
    report += '='.repeat(85) + '\n';
    report += centerText('RELATÓRIO DOS COMPETIDORES') + '\n';
    report += centerText(competition.module.toUpperCase()) + '\n';
    report += '='.repeat(85) + '\n\n';
    
    report += `Data/Hora do Relatório: ${dateStr} às ${timeStr}\n\n`;
    report += `Ocupação: ${competition.name}\n`;
    report += `Módulo: ${competition.module}\n`;
    report += `Duração da Prova: ${formatTime(totalDuration)}\n`;
    report += `Tempo Restante: ${formatTime(generalTime)}\n`;
    report += `Status: ${isGeneralFinished ? 'ENCERRADO' : isGeneralRunning ? 'EM ANDAMENTO' : 'PAUSADO'}\n\n`;
    
    report += '='.repeat(85) + '\n';
    report += centerText(`COMPETIDORES (${competitors.length})`) + '\n';
    report += '='.repeat(85) + '\n\n';
    
    competitors.forEach((comp, idx) => {
      report += '-'.repeat(85) + '\n';
      report += `Competidor: ${comp.name}\n`;
      
      // Status
      if (comp.isFinished) {
        report += 'Status: FINALIZADO\n';
      } else if (comp.isRunning) {
        report += `Status: TEMPO EXTRA (${formatTime(comp.individualTime)})\n`;
      } else if (comp.isPaused) {
        report += `Status: PAUSADO em ${formatTime(comp.pausedAt)}\n`;
      } else {
        report += 'Status: EM ANDAMENTO\n';
      }
      
      // Informações de pausas
      if (comp.pauseHistory.length > 0) {
        report += `Pausas: ${comp.pauseHistory.length}\n`;
        report += `Tempo Total de Pausas: ${formatTime(comp.totalPausedTime)}\n\n`;
        
        comp.pauseHistory.forEach((pause, pIdx) => {
          report += `  Pausa ${pIdx + 1}:\n`;
          report += `    Pausado em: ${formatTime(pause.pausedAt)}\n`;
          if (pause.resumedAt !== null) {
            report += `    Retomado em: ${formatTime(pause.resumedAt)}\n`;
            report += `    Tempo da Pausa: ${formatTime(pause.timeLost || 0)}\n`;
          } else {
            report += `    Status: AINDA PAUSADO\n`;
          }
          report += '\n';
        });
      } else {
        report += 'Pausas: 0\n';
        report += 'Tempo Total de Pausas: 00:00:00\n';
      }
      
      report += '-'.repeat(85) + '\n';
      if (idx < competitors.length - 1) report += '\n';
    });
    
    report += '\n' + '='.repeat(85) + '\n';
    report += centerText('FIM DO RELATÓRIO') + '\n';
    report += '='.repeat(85) + '\n';
    
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = `Relatorio_${competition.name.replace(/\s+/g, '_')}_${competition.module.replace(/\s+/g, '_')}_${dateStr.replace(/\//g, '-')}_${timeStr.replace(/:/g, '-')}.txt`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setReportExported(true);
    alert('✅ Relatório exportado com sucesso!');
  }, [competition, competitors, generalTime, isGeneralFinished, isGeneralRunning, formatTime]);

  const resetAll = useCallback(() => {
    // Validar se precisa exportar relatório primeiro
    if (isGeneralFinished && !reportExported) {
      alert('⚠️ Para sua segurança, exporte o relatório antes de reiniciar!\n\nClique no botão "Relatório" para fazer o download.');
      return;
    }
    
    const hasActiveCompetitors = competitors.some(c => c.isPaused || c.isRunning);
    const message = hasActiveCompetitors 
      ? '⚠️ Existem competidores em atendimento/tempo extra. Tem certeza que deseja reiniciar tudo? Todos os dados serão perdidos!'
      : '⚠️ Tem certeza que deseja reiniciar? Todos os dados serão perdidos!';
    
    const proceed = window.confirm(message);
    if (!proceed) return;
    
    // Fechar janela de display se estiver aberta
    if (displayWindowRef.current && !displayWindowRef.current.closed) {
      displayWindowRef.current.close();
    }
    
    // Reset completo de TODOS os estados
    setView('setup');
    setGeneralTime(0);
    setIsGeneralRunning(false);
    setIsGeneralFinished(false);
    setStartTime(null);
    setReportExported(false);
    setCompetitors([]);
    setCompetition({
      name: '',
      module: '',
      duration: { hours: 3, minutes: 0, seconds: 0 }
    });
    
    // Limpar localStorage
    localStorage.removeItem('competitionTimerState');
    localStorage.removeItem('competitionTimerLogo');
    
    alert('✅ Sistema reiniciado com sucesso!');
  }, [competition, competitors, generalTime, isGeneralFinished, isGeneralRunning, reportExported]);

  const getTotalDuration = useCallback(() => {
    return competition.duration.hours * 3600 + 
           competition.duration.minutes * 60 + 
           competition.duration.seconds;
  }, [competition]);

  const getTimerColor = useCallback((currentTime, totalTime) => {
    const percentage = (currentTime / totalTime) * 100;
    if (percentage > 20) return 'text-green-400';
    if (percentage > 10) return 'text-yellow-400';
    return 'text-red-500 animate-pulse';
  }, []);

  const getNextCompetitorToFinish = useCallback(() => {
    const activeComps = competitors.filter(c => c.isRunning && c.individualTime > 0);
    if (activeComps.length === 0) return null;
    
    return activeComps.reduce((min, comp) => 
      comp.individualTime < min.individualTime ? comp : min
    );
  }, [competitors]);

  // VIEW: SETUP
  if (view === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-8">
        <audio ref={audioRef} src="data:audio/wav;base64,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" />
        
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Sistema de Cronometragem</h1>
              </div>
              <Settings className="w-6 h-6 text-gray-400" />
            </div>

            {logo && (
              <div className="mb-6 flex flex-col items-center gap-2">
                <img src={logo} alt="Logo" className="h-24 object-contain" />
                <button
                  onClick={removeLogo}
                  className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Remover Logo
                </button>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Logo (opcional)
                </label>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg transition flex items-center justify-center gap-2 font-medium"
                >
                  <Image className="w-4 h-4" />
                  Fazer Upload do Logo
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Formatos aceitos: JPG, PNG, GIF, WEBP (máx. 2MB)
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nome da Ocupação *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Desenvolvimento de Sistemas"
                  value={competition.name}
                  onChange={(e) => setCompetition(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Módulo *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Módulo 1 - Fundamentos"
                  value={competition.module}
                  onChange={(e) => setCompetition(prev => ({ ...prev, module: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Duração da Prova *
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Horas</label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={competition.duration.hours}
                      onChange={(e) => setCompetition(prev => ({
                        ...prev,
                        duration: { ...prev.duration, hours: parseInt(e.target.value) || 0 }
                      }))}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 transition text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Minutos</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={competition.duration.minutes}
                      onChange={(e) => setCompetition(prev => ({
                        ...prev,
                        duration: { ...prev.duration, minutes: parseInt(e.target.value) || 0 }
                      }))}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 transition text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Segundos</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={competition.duration.seconds}
                      onChange={(e) => setCompetition(prev => ({
                        ...prev,
                        duration: { ...prev.duration, seconds: parseInt(e.target.value) || 0 }
                      }))}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 transition text-center"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-800">
                  Competidores ({competitors.length})
                </h2>
              </div>
            </div>

            <div className="mb-6">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg transition flex items-center justify-center gap-2 font-medium mb-4"
              >
                <Upload className="w-4 h-4" />
                Importar Competidores (.txt)
              </button>
              <p className="text-xs text-gray-500 text-center">
                Cada nome em uma linha separada
              </p>
            </div>

            <div className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="Nome do competidor"
                value={newCompetitorName}
                onChange={(e) => setNewCompetitorName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCompetitor()}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 transition"
              />
              <button
                onClick={addCompetitor}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition flex items-center gap-2 font-medium"
              >
                <UserPlus className="w-5 h-5" />
                <span className="hidden sm:inline">Adicionar</span>
              </button>
            </div>

            {competitors.length > 0 && (
              <div className="border-2 border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {competitors.map((comp, index) => (
                    <div key={comp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <span className="font-medium text-gray-700">
                        {index + 1}. {comp.name}
                      </span>
                      <button
                        onClick={() => removeCompetitor(comp.id)}
                        className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {competitors.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Nenhum competidor adicionado</p>
                <p className="text-sm">Adicione competidores manualmente ou importe um arquivo</p>
              </div>
            )}

            <button
              onClick={startCompetition}
              disabled={competitors.length === 0}
              className="w-full mt-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 rounded-lg transition flex items-center justify-center gap-2 font-bold text-lg shadow-lg disabled:cursor-not-allowed"
            >
              <Play className="w-6 h-6" />
              Iniciar Competição
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header com controles */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{competition.name}</h1>
                <p className="text-sm sm:text-base text-gray-600">{competition.module}</p>
              </div>
              
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button
                  onClick={openDisplayWindow}
                  className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2 font-medium"
                >
                  <Monitor className="w-4 h-4" />
                  Abrir Telão
                </button>
                <button
                  onClick={exportReport}
                  className={`flex-1 sm:flex-none ${
                    isGeneralFinished && !reportExported 
                      ? 'bg-orange-600 hover:bg-orange-700 animate-pulse' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2 font-medium`}
                >
                  {isGeneralFinished && !reportExported ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Relatório
                </button>
                <button
                  onClick={resetAll}
                  className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2 font-medium"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reiniciar
                </button>
              </div>
            </div>
          </div>

          {/* Cronômetro Geral */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
            <h2 className="text-lg font-bold text-gray-700 mb-4 text-center">⏱ TEMPO GERAL</h2>
            <div className={`text-5xl sm:text-6xl md:text-7xl font-bold font-mono text-center mb-6 ${getTimerColor(generalTime, totalDuration)}`}>
              {formatTime(generalTime)}
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={toggleGeneralTimer}
                disabled={isGeneralFinished}
                className={`${
                  isGeneralRunning 
                    ? 'bg-yellow-500 hover:bg-yellow-600' 
                    : 'bg-green-500 hover:bg-green-600'
                } disabled:bg-gray-400 text-white px-8 py-4 rounded-lg transition flex items-center gap-3 font-bold text-lg shadow-lg disabled:cursor-not-allowed`}
              >
                {isGeneralRunning ? (
                  <>
                    <Pause className="w-6 h-6" />
                    Pausar Tempo Geral
                  </>
                ) : (
                  <>
                    <Play className="w-6 h-6" />
                    Retomar Tempo Geral
                  </>
                )}
              </button>
            </div>

            {isGeneralFinished && (
              <div className="mt-4 bg-red-50 border-2 border-red-300 rounded-lg p-4">
                <p className="text-center text-red-700 font-bold flex items-center justify-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  TEMPO GERAL ENCERRADO
                </p>
              </div>
            )}
          </div>

          {/* Competidores Regulares */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
            <h2 className="text-lg font-bold text-gray-700 mb-4">
              Competidores Ativos ({regularCompetitors.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {regularCompetitors.map(comp => (
                <div key={comp.id} className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                  <h3 className="font-bold text-gray-800 mb-2 break-words">{comp.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    ✅ Em andamento normal
                  </p>
                  <button
                    onClick={() => pauseCompetitor(comp.id)}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-2 rounded transition flex items-center justify-center gap-1"
                  >
                    <Pause className="w-3 h-3" />
                    Pausar para Atendimento
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Competidores Finalizados */}
          {finishedCompetitors.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
              <h2 className="text-lg font-bold text-gray-700 mb-4">
                Competidores Finalizados ({finishedCompetitors.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {finishedCompetitors.map(comp => (
                  <div key={comp.id} className="p-4 bg-gray-100 border-2 border-gray-300 rounded-lg">
                    <h3 className="font-bold text-gray-800 mb-2 break-words">{comp.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      ✅ FINALIZADO
                    </p>
                    {comp.totalPausedTime > 0 && (
                      <div className="space-y-1 text-xs text-gray-600">
                        <p>Pausas: {comp.pauseHistory.length}</p>
                        <p>Tempo extra usado: {formatTime(comp.totalPausedTime)}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Competidores em Atendimento/Tempo Extra */}
          {activePausedCompetitors.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-700 mb-4">
                Competidores em Atendimento / Tempo Extra ({activePausedCompetitors.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activePausedCompetitors.map(comp => (
                  <div key={comp.id} className={`p-4 rounded-lg border-2 ${
                    comp.isPaused ? 'bg-yellow-50 border-yellow-300' : 'bg-blue-50 border-blue-300'
                  }`}>
                    <h3 className="font-bold text-gray-800 mb-2">{comp.name}</h3>
                    
                    {comp.isPaused && (
                      <>
                        <p className="text-sm text-gray-600 mb-2">
                          ⏸ Pausado em: {formatTime(comp.pausedAt)}
                        </p>
                        <p className="text-xs text-gray-600 mb-3">
                          Tempo atual: {formatTime(generalTime)}
                        </p>
                        <button
                          onClick={() => resumeCompetitor(comp.id)}
                          className="w-full bg-green-500 hover:bg-green-600 text-white text-sm py-2 rounded transition flex items-center justify-center gap-1"
                        >
                          <Play className="w-3 h-3" />
                          Retomar
                        </button>
                      </>
                    )}
                    
                    {comp.isRunning && (
                      <>
                        <p className="text-2xl font-mono font-bold text-blue-600 mb-2">
                          {formatTime(comp.individualTime)}
                        </p>
                        <p className="text-xs text-gray-600">Pausado em: {formatTime(comp.pausedAt)}</p>
                        <p className="text-xs text-gray-600">Retomado em: {formatTime(comp.resumedAt)}</p>
                        <p className="text-xs text-gray-600 mb-3">Tempo extra: {formatTime(comp.totalPausedTime)}</p>
                        <button
                          onClick={() => pauseCompetitor(comp.id)}
                          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-2 rounded transition flex items-center justify-center gap-1"
                        >
                          <Pause className="w-3 h-3" />
                          Pausar Novamente
                        </button>
                      </>
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

    return (
      <div className="h-screen w-screen overflow-hidden bg-slate-800 text-white flex flex-col">
        {!isDisplayWindow && (
          <button
            onClick={() => setView('admin')}
            className="absolute top-4 right-4 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition flex items-center gap-2 z-10"
          >
            <X className="w-4 h-4" />
            <span>Voltar Admin</span>
          </button>
        )}

        <div className="flex-1 flex flex-col justify-center items-center p-4 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-center gap-4 mb-4 w-full">
            {logo && (
              <img 
                src={logo} 
                alt="Logo" 
                style={{ maxHeight: '8vh' }}
                className="object-contain"
              />
            )}
            <div className="text-center">
              <h1 className="font-bold mb-1" style={{ fontSize: 'clamp(1.5rem, 4vw, 3rem)' }}>{competition.name}</h1>
              <p className="text-gray-300" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.75rem)' }}>{competition.module}</p>
            </div>
          </div>

          {!isGeneralFinished && (
            <div className="w-full flex flex-col gap-4">
              <div className="bg-slate-700 rounded-2xl shadow-2xl p-6 border-2 border-slate-600">
                <h2 className="font-bold text-center mb-4 text-gray-400" style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)' }}>
                  {isGeneralFinished ? 'Tempo Geral Encerrado' : 'Tempo Geral'}
                </h2>
                <div className={`font-bold font-mono text-center ${getTimerColor(generalTime, totalDuration)}`} style={{ fontSize: 'clamp(3rem, 12vw, 8rem)' }}>
                  {formatTime(generalTime)}
                </div>
                {!isGeneralRunning && !isGeneralFinished && (
                  <div className="text-center mt-4 text-yellow-400 font-bold animate-pulse" style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)' }}>
                    ⏸ PAUSADO
                  </div>
                )}
              </div>

              {activeCompetitors.length > 0 && (
                <div className="bg-slate-700 rounded-2xl shadow-2xl p-4 border-2 border-blue-600">
                  <h2 className="font-bold text-blue-400 text-center mb-4" style={{ fontSize: 'clamp(0.875rem, 1.75vw, 1.25rem)' }}>
                    ⏱ TEMPO EXTRA - ATENDIMENTO TÉCNICO ({activeCompetitors.length})
                  </h2>
                  <div className="grid gap-3" style={{ 
                    gridTemplateColumns: activeCompetitors.length === 1 ? '1fr' : 
                                        activeCompetitors.length === 2 ? 'repeat(2, 1fr)' : 
                                        'repeat(auto-fit, minmax(250px, 1fr))'
                  }}>
                    {activeCompetitors.map(comp => (
                      <div key={comp.id} className="bg-blue-900/50 rounded-xl p-4 border-2 border-blue-500">
                        <h3 className="font-bold text-white break-words mb-2" style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1.125rem)' }}>{comp.name}</h3>
                        <div className="font-mono font-bold text-blue-300 mb-2" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                          {formatTime(comp.individualTime)}
                        </div>
                        <p className="text-blue-300" style={{ fontSize: 'clamp(0.75rem, 1vw, 0.875rem)' }}>Pausado: {formatTime(comp.pausedAt)}</p>
                        <p className="text-blue-300" style={{ fontSize: 'clamp(0.75rem, 1vw, 0.875rem)' }}>Retomado: {formatTime(comp.resumedAt)}</p>
                        <p className="text-blue-300" style={{ fontSize: 'clamp(0.75rem, 1vw, 0.875rem)' }}>Compensação: {formatTime(comp.totalPausedTime)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {isGeneralFinished && nextToFinish && (
            <div className="w-full flex flex-col gap-4">
              <div className="bg-slate-700 rounded-2xl shadow-xl p-4 border-2 border-slate-600">
                <h2 className="font-bold text-center mb-2 text-gray-400" style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1.125rem)' }}>Tempo Geral Encerrado</h2>
                <div className="font-bold font-mono text-center text-red-500" style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)' }}>
                  00:00:00
                </div>
              </div>

              <div className="bg-blue-900/40 rounded-2xl shadow-2xl p-6 border-2 border-blue-500">
                <h2 className="font-bold text-center mb-3 text-blue-300" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.75rem)' }}>🎯 PRÓXIMO A FINALIZAR</h2>
                <h3 className="font-bold text-center mb-4 text-white break-words" style={{ fontSize: 'clamp(1.5rem, 4vw, 3rem)' }}>{nextToFinish.name}</h3>
                <div className={`font-bold font-mono text-center mb-3 ${getTimerColor(nextToFinish.individualTime, totalDuration)}`} style={{ fontSize: 'clamp(3rem, 10vw, 6rem)' }}>
                  {formatTime(nextToFinish.individualTime)}
                </div>
                <div className="text-center text-blue-300 space-y-1" style={{ fontSize: 'clamp(0.75rem, 1vw, 0.875rem)' }}>
                  <p>Pausado em: {formatTime(nextToFinish.pausedAt)}</p>
                  <p>Retomado em: {formatTime(nextToFinish.resumedAt)}</p>
                  <p>Compensação aplicada: {formatTime(nextToFinish.totalPausedTime)}</p>
                </div>
              </div>

              {activeCompetitors.length > 1 && (
                <div className="bg-slate-700 rounded-2xl shadow-2xl p-4 border-2 border-blue-600">
                  <h2 className="font-bold text-blue-400 text-center mb-4" style={{ fontSize: 'clamp(0.875rem, 1.75vw, 1.25rem)' }}>
                    OUTROS EM TEMPO EXTRA ({activeCompetitors.length - 1})
                  </h2>
                  <div className="grid gap-3" style={{ 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
                  }}>
                    {activeCompetitors
                      .filter(comp => comp.id !== nextToFinish.id)
                      .map(comp => (
                        <div key={comp.id} className="bg-blue-900/50 rounded-xl p-4 border-2 border-blue-500">
                          <h3 className="font-bold text-white break-words mb-2" style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1.125rem)' }}>{comp.name}</h3>
                          <div className="font-mono font-bold text-blue-300 mb-2" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                            {formatTime(comp.individualTime)}
                          </div>
                          <p className="text-blue-300" style={{ fontSize: 'clamp(0.75rem, 1vw, 0.875rem)' }}>Pausado: {formatTime(comp.pausedAt)}</p>
                          <p className="text-blue-300" style={{ fontSize: 'clamp(0.75rem, 1vw, 0.875rem)' }}>Retomado: {formatTime(comp.resumedAt)}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {isGeneralFinished && !nextToFinish && (
            <div className="w-full flex flex-col gap-4">
              <div className="bg-slate-700 rounded-2xl shadow-xl p-4 border-2 border-slate-600">
                <h2 className="font-bold text-center mb-2 text-gray-400" style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1.125rem)' }}>Tempo Geral Encerrado</h2>
                <div className="font-bold font-mono text-center text-red-500" style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)' }}>
                  00:00:00
                </div>
              </div>
              
              <div className="bg-green-900/30 rounded-2xl shadow-2xl p-8 border-2 border-green-600">
                <h2 className="font-bold text-center text-green-500 flex items-center justify-center gap-3" style={{ fontSize: 'clamp(1.5rem, 4vw, 3rem)' }}>
                  <span style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}>✅</span>
                  TODOS OS COMPETIDORES FINALIZARAM
                </h2>
                <p className="text-center text-gray-400 mt-4" style={{ fontSize: 'clamp(1rem, 1.5vw, 1.25rem)' }}>
                  Parabéns a todos os participantes!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}