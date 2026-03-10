import React, { useState } from 'react';
import { Officer } from '../types';
import { CATEGORY_LABELS } from '../data';

interface AddOfficerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (officer: Omit<Officer, 'id' | 'updated_at'> | Officer) => Promise<void>;
    initialData?: Officer | null;
}

const AddOfficerModal: React.FC<AddOfficerModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = React.useState({
        name: '',
        rank: 'CEL',
        role: '',
        unit: '',
        contact: '',
        category: 'Comando',
        matricula: ''
    });
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    React.useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                rank: initialData.rank,
                role: initialData.role || '',
                unit: initialData.unit,
                contact: initialData.contact,
                category: initialData.category,
                matricula: initialData.matricula || ''
            });
        } else {
            setFormData({
                name: '',
                rank: 'CEL',
                role: '',
                unit: '',
                contact: '',
                category: 'Comando',
                matricula: ''
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (initialData) {
                // Ao editar, passamos o objeto completo com ID
                await onSave({ ...formData, id: initialData.id as string } as Officer);
            } else {
                // Ao criar, passamos apenas os campos de dados
                await onSave(formData as Omit<Officer, 'id' | 'updated_at'>);
            }
            onClose();
            setFormData({
                name: '',
                rank: 'CEL',
                role: '',
                unit: '',
                contact: '',
                category: 'Comando',
                matricula: ''
            });
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar oficial. Verifique o console.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const ranks = ['CEL', 'TC', 'MAJ', 'CAP', '1º TEN', '2º TEN', 'ASP', 'ST', '1º SGT', '2º SGT', '3º SGT', 'CB', 'SD'];

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="bg-[#002b5c] p-6 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight">
                            {initialData ? 'Editar Oficial' : 'Novo Oficial'}
                        </h2>
                        <p className="text-blue-200/60 text-[10px] font-bold uppercase tracking-widest mt-1">
                            {initialData ? 'Atualizar no Banco de Dados' : 'Adicionar ao Banco de Dados'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nome Completo</label>
                            <input
                                required
                                className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800"
                                placeholder="Ex: PAULO AMORIM..."
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Posto / Graduação</label>
                            <select
                                className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800"
                                value={formData.rank}
                                onChange={e => setFormData({ ...formData, rank: e.target.value })}
                            >
                                {ranks.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Matrícula</label>
                            <input
                                className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800"
                                placeholder="Ex: 12345-6"
                                value={formData.matricula}
                                onChange={e => setFormData({ ...formData, matricula: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Cargo / Função</label>
                            <input
                                required
                                className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800"
                                placeholder="Ex: Comandante Geral"
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Unidade / OPM</label>
                            <input
                                required
                                className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800"
                                placeholder="Ex: GCG, 1º BPM..."
                                value={formData.unit}
                                onChange={e => setFormData({ ...formData, unit: e.target.value.toUpperCase() })}
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Telefone (Contato)</label>
                            <input
                                required
                                className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800"
                                placeholder="Ex: 98888-8888"
                                value={formData.contact}
                                onChange={e => setFormData({ ...formData, contact: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Categoria (Menu Lateral)</label>
                            <select
                                className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
                                    id !== 'all' && <option key={id} value={id}>{label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 px-6 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-[2] py-4 px-6 bg-blue-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/30 hover:bg-blue-800 hover:shadow-blue-500/50 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            ) : null}
                            Salvar Oficial
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddOfficerModal;
