import React from 'react';

export const MobileFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen w-full bg-[#eef2f6] flex items-center justify-center p-0 md:p-8 font-sans">
      <div className="w-full max-w-[390px] h-[100dvh] md:h-[800px] bg-slate-50 md:rounded-[2.5rem] md:border-[8px] md:border-slate-900 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden relative flex flex-col ring-1 ring-slate-900/5">
        {/* Status Bar Area (Visual Only) */}
        <div className="h-0 md:h-7 w-full bg-slate-900 flex items-center justify-center shrink-0 z-50">
             <div className="hidden md:block w-24 h-4 bg-black rounded-b-xl"></div>
        </div>
        {children}
      </div>
    </div>
  );
};