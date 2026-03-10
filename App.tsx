
import React, { useState, useMemo, useEffect } from 'react';
import { CATEGORY_LABELS, OFFICER_DATA } from './data';
import OfficerCard from './components/OfficerCard';
import AddOfficerModal from './components/AddOfficerModal';
import { getOfficers, subscribeToOfficers, upsertOfficer, deleteOfficer } from './lib/supabase';
import { Officer } from './types';

const App: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeUnit, setActiveUnit] = useState('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [officers, setOfficers] = useState<Officer[]>(OFFICER_DATA); // Inicia com o fallback local
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState<Officer | null>(null);

  const handleSaveOfficer = async (data: Omit<Officer, 'id' | 'updated_at'> | Officer) => {
    try {
      const isEditing = 'id' in data;
      const officerData = data as Officer;

      if (isEditing) {
        await upsertOfficer(officerData);
      } else {
        // Verifica se já existe um oficial com o mesmo nome ou matrícula (apenas para novos)
        const existing = officers.find(o => 
          (officerData.matricula && o.matricula === officerData.matricula && o.matricula !== '---' && o.matricula !== '.') ||
          (o.name.toUpperCase().trim() === officerData.name.toUpperCase().trim() && o.unit === officerData.unit)
        );

        if (existing) {
          if (!window.confirm(`Já existe um contato para "${existing.name}" na unidade "${existing.unit}". Deseja atualizar os dados existentes?`)) {
            return;
          }
          await upsertOfficer({ ...officerData, id: existing.id });
        } else {
          // Gera um ID novo
          const id = `new-${Date.now()}`;
          await upsertOfficer({ ...officerData, id });
        }
      }
      // O Realtime cuidará de atualizar a lista
      setEditingOfficer(null);
    } catch (error) {
      console.error('Erro ao salvar oficial:', error);
      throw error;
    }
  };

  const handleDeleteOfficer = async (id: string) => {
    try {
      await deleteOfficer(id);
      setOfficers(prev => prev.filter(off => off.id !== id));
    } catch (error) {
      console.error('Erro ao excluir oficial:', error);
      alert('Erro ao excluir contato. Tente novamente.');
    }
  };

  const handleEditOfficer = (officer: Officer) => {
    handleAdminAction(() => {
      setEditingOfficer(officer);
      setIsModalOpen(true);
    });
  };

  const handleAdminAction = (action: () => void) => {
    if (isAdmin) {
      action();
    } else {
      const password = window.prompt("Digite a senha de Administrador para acessar esta função:");
      if (password === "GSCG2026") {
        setIsAdmin(true);
        action();
      } else if (password !== null) {
        alert("Senha incorreta!");
      }
    }
  };

  // Busca inicial do Supabase
  useEffect(() => {
    async function loadData() {
      try {
        const data = await getOfficers();
        if (data && data.length > 0) {
          setOfficers(data);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do Supabase:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();

    // Inscrição em tempo real para atualizações (Supabase Realtime)
    const subscription = subscribeToOfficers((payload) => {
      console.log('Mudança detectada no Supabase:', payload);
      loadData(); // Recarrega os dados ao detectar mudança
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fecha o menu lateral no mobile ao trocar de categoria e limpa o filtro de unidade
  useEffect(() => {
    setIsSidebarOpen(false);
    setActiveUnit('all'); // Reseta a unidade ao trocar de aba
  }, [activeCategory]);

  const filteredOfficers = useMemo(() => {
    const RANK_PRIORITY: Record<string, number> = {
      'CEL': 1, 'TC': 2, 'MAJ': 3, 'CAP': 4,
      '1º TEN': 5, '2º TEN': 6, 'ASP': 7,
      'ST': 8, '1º SGT': 9, '2º SGT': 10, '3º SGT': 11,
      'CB': 12, 'SD': 13
    };

    const getOfficerPriority = (officer: Officer) => {
      const role = (officer.role || '').toLowerCase().trim();
      
      // Força Absoluta: Comandante Geral e Subcomandante Geral TÊM que ser os 01 e 02 de toda a PMAL.
      if (role === 'comandante geral') return 10;
      if (role === 'subcomandante geral') return 20;

      let priority = 10000;
      
      // Prioridade por Posto/Graduação (Protegido contra null/undefined/espaços)
      const rankKey = (officer.rank || '').toUpperCase().trim();
      const rankPrio = RANK_PRIORITY[rankKey] || 100;
      // Multiplicador alto para garantir que Patente/Graduação seja a regra mais forte EXCLUSIVA
      priority += rankPrio * 200;

      // Bônus de prioridade por Cargo dentro da mesma patente
      // Comandantes, diretores e chefes têm prioridade sobre subs
      if (role.includes('subcomandante') || role.includes('subdiretor') || role.includes('subchefe')) {
        priority -= 20; // Subs ganham 20 pontos de prioridade
      } else if (role.includes('comandante') || role.includes('diretor') || role.includes('chefe')) {
        priority -= 40; // Chefes ganham 40 pontos (ficam acima dos subs)
      }

      if (role.includes('geral')) {
        priority -= 10; // Bônus final para Geral
      }

      return priority;
    };

    const sorted = [...officers] // Cria cópia para garantir que a ordenação seja aplicada
      .filter((officer) => {
        const search = searchTerm.toLowerCase().trim();
        const matchesSearch =
          officer.name.toLowerCase().includes(search) ||
          officer.unit.toLowerCase().includes(search) ||
          officer.contact.replace(/\s|-/g, '').includes(search.replace(/\s|-/g, '')) ||
          (officer.role && officer.role.toLowerCase().includes(search)) ||
          (officer.rank && officer.rank.toLowerCase().includes(search));

        const matchesCategory = activeCategory === 'all' || officer.category === activeCategory;
        const matchesUnit = activeUnit === 'all' || officer.unit.trim().toUpperCase() === activeUnit;

        return matchesSearch && matchesCategory && matchesUnit;
      })
      .sort((a, b) => {
        const prioA = getOfficerPriority(a);
        const prioB = getOfficerPriority(b);
        
        if (prioA !== prioB) return prioA - prioB;
        
        // Se a prioridade for igual, ordena por nome
        return a.name.localeCompare(b.name);
      });
      
      // HIDE "Outros" from non-admins at the end of filtering
      if (!isAdmin) {
          return sorted.filter(officer => officer.category !== 'Outros');
      }
      return sorted;
  }, [searchTerm, activeCategory, activeUnit, officers, isAdmin]);

  const unitsInActiveCategory = useMemo(() => {
    if (activeCategory === 'all') return [];
    
    const units = officers
      .filter(o => o.category === activeCategory)
      .map(o => o.unit.trim().toUpperCase())
      .filter(u => u !== '' && u !== '-' && u !== 'S/U');
    
    return Array.from(new Set(units)).sort();
  }, [activeCategory, officers]);

  const allUnits = useMemo(() => {
    return Array.from(new Set(officers.map(o => o.unit.trim().toUpperCase()))).sort();
  }, [officers]);

  const allRoles = useMemo(() => {
    return Array.from(new Set(officers.map(o => o.role?.trim() || ''))).filter(r => r !== '').sort();
  }, [officers]);

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden relative">
      {/* Overlay Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden transition-opacity backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Menu Lateral */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-[#002b5c] text-white flex flex-col flex-shrink-0 shadow-2xl z-40 transition-transform duration-300 lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 pt-8 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-inner overflow-hidden border-2 border-white/20">
                <img src="/logo.jpeg" alt="Logo PMAL" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tighter leading-none">GSCG</h1>
                <p className="text-[10px] uppercase font-bold text-blue-300 mt-1 tracking-wider">Contatos Oficiais</p>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 hover:bg-white/10 rounded-full transition-colors active:scale-90">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
          </div>
          <div className="h-px bg-white/10 w-full mb-2"></div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-6 space-y-1 custom-scrollbar dark">
          {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setActiveCategory(id)}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-200 group ${activeCategory === id
                ? 'bg-white text-[#002b5c] font-bold shadow-lg shadow-black/20 scale-[1.02]'
                : 'text-blue-100/60 hover:bg-white/10 hover:text-white'
                }`}
            >
              <span className="text-sm truncate pr-2">{label}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`flex-shrink-0 transition-transform duration-300 ${activeCategory === id ? 'rotate-90 text-[#002b5c]' : 'opacity-20 group-hover:opacity-100'}`}
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          ))}
        </nav>

        <div className="p-4 bg-black/20 text-[9px] text-blue-200/50 text-center uppercase tracking-[0.2em] font-bold border-t border-white/5">
          Gabinete do Subcomando Geral <span className="opacity-50 text-[8px] block mt-1">v1.9 - Mobile Ajustado</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden w-full relative">
        {/* Top Header Section */}
        <header className="bg-[#004085] pt-10 pb-6 lg:pt-12 lg:pb-10 px-4 lg:px-10 shadow-xl relative z-20">
          <div className="max-w-4xl mx-auto flex flex-col gap-5">
            <div className="flex items-center justify-between relative">
              <div className="flex items-center gap-4 z-10">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden p-2.5 bg-white/15 rounded-xl text-white active:scale-90 transition-all shadow-lg hover:bg-white/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
                </button>
                <div>
                  <h2 className="text-white text-[10px] lg:text-xs font-black uppercase tracking-[0.3em] opacity-90 drop-shadow-sm">Busca de Oficiais</h2>
                  <div className="h-0.5 w-10 bg-blue-400 mt-1.5 rounded-full shadow-glow"></div>
                </div>
              </div>

              {/* Título Centralizado (Escondido em telas muito pequenas para não encavalar) */}
              <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center -mt-3">
                <h2 className="text-white text-sm lg:text-lg font-black uppercase tracking-[0.15em] opacity-100 drop-shadow-lg text-center">
                  Assessoria do Subcomando Geral
                </h2>
              </div>

              <button
                onClick={() => handleAdminAction(() => setIsModalOpen(true))}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                {isAdmin ? 'Novo Contato' : 'Administrador'}
              </button>
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 lg:pl-5 pointer-events-none text-blue-300 group-focus-within:text-blue-600 transition-colors z-10">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              </div>
              <input
                type="text"
                placeholder="Nome, unidade, cargo ou telefone..."
                className="w-full pl-11 lg:pl-14 pr-4 lg:pr-6 py-4 lg:py-4.5 bg-white border-none rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all text-sm lg:text-base shadow-2xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        {/* Results Body */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-10 bg-[#f1f5f9] custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-blue-700 rounded-full shadow-sm"></div>
                <h2 className="text-lg lg:text-2xl font-black text-slate-800 uppercase tracking-tight">
                  {CATEGORY_LABELS[activeCategory]}
                </h2>
              </div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] bg-slate-200/50 px-3 py-1 rounded-full w-fit">
                {filteredOfficers.length} {filteredOfficers.length === 1 ? 'contato' : 'contatos'}
              </div>
            </div>

            {/* Filtro de Unidades Exclusivo da Categoria */}
            {unitsInActiveCategory.length > 0 && activeCategory !== 'all' && (
              <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-2 custom-scrollbar no-scrollbar-on-mobile">
                <button
                  onClick={() => setActiveUnit('all')}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-wider transition-all shadow-sm
                    ${activeUnit === 'all' 
                      ? 'bg-[#002b5c] text-white' 
                      : 'bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-slate-200'}`}
                >
                  Todas Unidades
                </button>
                {unitsInActiveCategory.map(unit => (
                  <button
                    key={unit}
                    onClick={() => setActiveUnit(unit)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm
                      ${activeUnit === unit 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            )}

            {filteredOfficers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                {filteredOfficers.map((officer) => (
                  <OfficerCard
                    key={officer.id}
                    officer={officer}
                    isAdmin={isAdmin}
                    onDelete={handleDeleteOfficer}
                    onEdit={handleEditOfficer}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mb-6 text-slate-200 shadow-xl border border-slate-100 rotate-12 group">
                  <svg className="group-hover:scale-110 transition-transform" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>
                </div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Não encontramos resultados</h3>
                <p className="text-slate-500 mt-2 font-medium text-sm max-w-xs mx-auto">Verifique a ortografia ou selecione "Todos os Contatos" no menu.</p>
              </div>
            )}

            <div className="h-20 lg:h-10"></div> {/* Espaçador inferior para mobile */}
          </div>
        </main>
      </div>
      <AddOfficerModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingOfficer(null);
        }}
        onSave={handleSaveOfficer}
        initialData={editingOfficer}
        suggestedUnits={allUnits}
        suggestedRoles={allRoles}
      />
    </div>
  );
};

export default App;
