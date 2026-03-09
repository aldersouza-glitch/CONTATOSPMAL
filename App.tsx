
import React, { useState, useMemo, useEffect } from 'react';
import { CATEGORY_LABELS, OFFICER_DATA } from './data';
import OfficerCard from './components/OfficerCard';
import AddOfficerModal from './components/AddOfficerModal';
import { getOfficers, subscribeToOfficers, insertOfficer, deleteOfficer } from './lib/supabase';
import { Officer } from './types';

const App: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [officers, setOfficers] = useState<Officer[]>(OFFICER_DATA); // Inicia com o fallback local
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleSaveOfficer = async (newOfficer: Omit<Officer, 'id' | 'updated_at'>) => {
    try {
      // Gera um ID simples se não houver um (o Supabase pode gerar se for UUID, mas aqui estamos usando strings customizadas)
      const id = `new-${Date.now()}`;
      await insertOfficer({ ...newOfficer, id });
      // O Realtime cuidará de atualizar a lista, mas podemos dar um feedback visual ou recarregar
    } catch (error) {
      console.error('Erro ao salvar oficial:', error);
      throw error;
    }
  };

  const handleDeleteOfficer = async (id: string) => {
    try {
      await deleteOfficer(id);
      // Supabase's Realtime will handle the state update if it's active.
      // But we can also eagerly update local state for faster UI reaction:
      setOfficers(prev => prev.filter(off => off.id !== id));
    } catch (error) {
      console.error('Erro ao excluir oficial:', error);
      alert('Erro ao excluir contato. Tente novamente.');
    }
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

  // Fecha o menu lateral no mobile ao trocar de categoria
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [activeCategory]);

  const filteredOfficers = useMemo(() => {
    return officers.filter((officer) => {
      const search = searchTerm.toLowerCase().trim();
      const matchesSearch =
        officer.name.toLowerCase().includes(search) ||
        officer.unit.toLowerCase().includes(search) ||
        officer.contact.replace(/\s|-/g, '').includes(search.replace(/\s|-/g, '')) ||
        (officer.role && officer.role.toLowerCase().includes(search)) ||
        (officer.rank && officer.rank.toLowerCase().includes(search));

      const matchesCategory = activeCategory === 'all' || officer.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, activeCategory, officers]);

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
                <p className="text-[9px] uppercase font-semibold text-white/80 mt-1.5 leading-tight tracking-wide">
                  Assessoria do<br />Subcomando Geral
                </p>
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
          Gabinete do Comando Geral
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden w-full relative">
        {/* Top Header Section */}
        <header className="bg-[#004085] pt-10 pb-6 lg:pt-12 lg:pb-10 px-4 lg:px-10 shadow-xl relative z-20">
          <div className="max-w-4xl mx-auto flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
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

            {filteredOfficers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                {filteredOfficers.map((officer) => (
                  <OfficerCard
                    key={officer.id}
                    officer={officer}
                    isAdmin={isAdmin}
                    onDelete={handleDeleteOfficer}
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
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveOfficer}
      />
    </div>
  );
};

export default App;
