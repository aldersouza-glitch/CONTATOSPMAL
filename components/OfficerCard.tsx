
import React from 'react';
import { Officer } from '../types';

interface OfficerCardProps {
  officer: Officer;
}

const OfficerCard: React.FC<OfficerCardProps> = ({ officer }) => {
  const handleCall = () => {
    window.location.href = `tel:${officer.contact.replace(/\s|-/g, '')}`;
  };

  const handleWhatsApp = () => {
    const cleanPhone = officer.contact.replace(/\s|-/g, '');
    const phone = cleanPhone.length === 9 ? `5582${cleanPhone}` : `55${cleanPhone}`;
    window.open(`https://wa.me/${phone}`, '_blank');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all p-5 flex flex-col gap-3">
      {/* Rank and Matricula */}
      <div className="flex gap-2">
        <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500 uppercase">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          {officer.rank} • MAT. {officer.matricula || '---'}
        </div>
      </div>

      {/* Name */}
      <h3 className="text-base font-extrabold text-[#002b5c] uppercase leading-tight">
        {officer.name}
      </h3>

      {/* Role and Unit */}
      <div className="flex items-start gap-2 text-slate-700">
        <div className="mt-0.5 text-blue-600">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
        </div>
        <p className="text-xs font-bold leading-tight">
          {officer.role}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-2">
        <button 
          onClick={handleCall}
          className="flex-1 flex items-center justify-center gap-2 bg-[#002d5c] hover:bg-[#001d3d] text-white py-2.5 rounded-lg font-bold text-sm transition-colors shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          Ligar
        </button>
        
        <button 
          onClick={handleWhatsApp}
          className="w-10 h-10 flex items-center justify-center bg-[#25D366] hover:bg-[#1ebe57] text-white rounded-lg transition-colors shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.539 2.016 2.069-.528c.979.577 1.945.934 3.22.936 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.711-5.769-5.711zm3.174 8.358c-.12.337-.701.628-1.001.665-.262.032-.51-.017-1.482-.409-.972-.393-2.185-1.557-2.613-2.126-.038-.051-.073-.097-.102-.134-.412-.521-.748-.946-.748-1.634 0-.735.386-1.096.522-1.248.117-.132.312-.224.498-.224.061 0 .121.001.178.005.181.015.272.027.393.316.118.28.406.989.441 1.061.035.072.059.155.012.249-.047.094-.071.153-.141.236-.071.082-.149.183-.213.245-.071.069-.145.144-.063.284.082.141.364.601.782 1.018.54.54 1.002.71 1.144.788.141.078.224.065.307-.029.083-.094.354-.413.448-.554.094-.141.189-.12.319-.072.13.047.825.389.967.46.142.071.237.106.271.166.035.06.035.348-.084.685zM12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm.017 19.31c-1.325 0-2.615-.348-3.747-.999l-4.13.585 1.07-4.005c-.779-1.266-1.192-2.727-1.192-4.226 0-4.417 3.593-8.01 8.011-8.01 4.418 0 8.011 3.593 8.011 8.01s-3.593 8.01-8.011 8.011z"/></svg>
        </button>

        <div className="flex-1 bg-slate-50 border border-slate-200 py-2 px-3 rounded-lg text-slate-700 font-bold text-xs flex items-center justify-center">
          {officer.contact}
        </div>
      </div>
    </div>
  );
};

export default OfficerCard;
