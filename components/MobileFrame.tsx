import React from 'react';

export const MobileFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen w-full bg-gray-200 flex items-center justify-center p-0 md:p-4">
      {/* Reduced max-width and height for better overview visibility */}
      <div className="w-full max-w-[360px] h-screen md:h-[700px] bg-gray-50 md:rounded-[2rem] md:border-[6px] md:border-gray-800 shadow-2xl overflow-hidden relative flex flex-col font-sans">
        {/* Notch simulation for desktop */}
        <div className="hidden md:block absolute top-0 left-1/2 transform -translate-x-1/2 w-28 h-5 bg-gray-800 rounded-b-xl z-50"></div>
        {children}
      </div>
    </div>
  );
};