import React, { useState, useEffect } from 'react';
import { MobileFrame } from './components/MobileFrame';
import { AppState, JobState, UserRole, Job, CONSTANTS, LedgerEntry } from './types';
import { INITIAL_STATE, fundJob, acceptJob, verifyPickup, processPhase1Payout, completeJob, processPhase2Payout, settleDriverFunds, createJob, raiseDispute, resolveDispute, topUpWallet, withdrawWallet } from './services/stateMachine';
import { Wallet, Truck, ShieldAlert, FileCheck, RefreshCw, User, Settings, AlertTriangle, ArrowRight, Activity, Globe, Scale, X, Package, Lock, Clock, CircleCheck, AlertOctagon, Gavel, ShieldCheck, Shield, Award, MapPin, Camera, Banknote, Heart, Landmark, Leaf, FileText, Plus, ChevronRight, Info, Siren, Zap, History, ScanLine, BarChart3, PieChart as PieChartIcon, Search, Download, Sparkles, Printer, Share2, ExternalLink, Map as MapIcon, Navigation, HardHat, TrendingUp, MoreHorizontal, LayoutGrid, LucideIcon, Home, ArrowUpCircle, ArrowDownCircle, CreditCard } from 'lucide-react';
import { validateProofOfWork, getStrategicAdvice, generateComplianceReport } from './services/geminiService';

// --- SHARED UI COMPONENTS ---

const PageHeader = ({ title, subtitle, rightElement }: { title: string, subtitle?: string, rightElement?: React.ReactNode }) => (
  <div className="flex justify-between items-end mb-6 sticky top-0 bg-slate-50/95 backdrop-blur-md z-30 py-3 -mx-5 px-5 border-b border-slate-200/50 transition-all">
     <div>
        <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">{title}</h1>
        {subtitle && <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">{subtitle}</p>}
     </div>
     {rightElement}
  </div>
);

const RoleSwitcher = ({ currentRole, onSwitch }: { currentRole: UserRole, onSwitch: (r: UserRole) => void }) => (
  <div className="bg-slate-900 text-white px-4 py-2 flex justify-between items-center text-xs z-40 shadow-md shrink-0">
    <span className="font-bold tracking-wider text-slate-200 flex items-center gap-2">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-[pulse_2s_infinite]"></div>
      ARWEEN <span className="text-[9px] opacity-60 uppercase font-mono tracking-widest">OS v2.4 (TH)</span>
    </span>
    <div className="flex bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
      {(Object.keys(UserRole) as Array<keyof typeof UserRole>).map((role) => (
        <button
          key={role}
          onClick={() => onSwitch(UserRole[role])}
          className={`px-3 py-1 rounded-md text-[9px] font-bold transition-all duration-300 ${currentRole === UserRole[role] ? 'bg-slate-700 text-white shadow-sm ring-1 ring-slate-600' : 'text-slate-500 hover:text-slate-300'}`}
        >
          {role === 'OPERATOR' ? 'ผู้ประกอบการ' : 'คนขับ'}
        </button>
      ))}
    </div>
  </div>
);

const Toast: React.FC<{ message: string, type: 'info' | 'success' | 'danger' }> = ({ message, type }) => (
  <div className={`absolute bottom-24 left-4 right-4 px-4 py-3.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-[11px] font-bold flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 border backdrop-blur-md ${
    type === 'success' ? 'bg-emerald-900/90 border-emerald-500/50 text-white' : 
    type === 'danger' ? 'bg-red-900/90 border-red-500/50 text-white' :
    'bg-slate-800/90 border-slate-600/50 text-white'
  }`}>
    <div className={`p-1.5 rounded-full flex-shrink-0 shadow-sm ${
      type === 'success' ? 'bg-emerald-500 text-emerald-950' : 
      type === 'danger' ? 'bg-red-500 text-red-950' :
      'bg-blue-500 text-blue-950'
    }`}>
        {type === 'success' ? <CircleCheck size={14} strokeWidth={3} /> : 
         type === 'danger' ? <Siren size={14} strokeWidth={3} /> :
         <Activity size={14} strokeWidth={3} />}
    </div>
    <span className="leading-tight flex-1 font-medium">{message}</span>
  </div>
);

const AnimatedNumber = ({ value, className }: { value: number, className?: string }) => {
  return (
    <span className={`inline-block font-mono tracking-tight ${className}`}>
      ฿{value.toLocaleString('th-TH')}
    </span>
  );
};

const TrustBadge = ({ score }: { score: number }) => {
  const color = score >= 95 ? 'text-yellow-700 bg-yellow-50 border-yellow-200/60' : score >= 85 ? 'text-slate-700 bg-slate-50 border-slate-200' : 'text-red-700 bg-red-50 border-red-200';
  const Icon = score >= 95 ? Award : score >= 85 ? ShieldCheck : ShieldAlert;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${color} shadow-sm transition-transform active:scale-95`}>
      <Icon size={14} strokeWidth={2.5} />
      <div className="flex flex-col leading-none">
        <span className="text-[7px] uppercase font-bold tracking-widest opacity-60">คะแนนความน่าเชื่อถือ</span>
        <span className="text-[11px] font-black">{score}%</span>
      </div>
    </div>
  );
};

const StatusBadge = ({ state }: { state: JobState }) => {
  const styles: Record<string, string> = {
    [JobState.CREATED]: 'bg-slate-100 text-slate-600 border-slate-200',
    [JobState.FUNDED]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    [JobState.ACCEPTED]: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    [JobState.IN_PROGRESS]: 'bg-purple-100 text-purple-700 border-purple-200',
    [JobState.PICKUP_VERIFIED]: 'bg-amber-100 text-amber-800 border-amber-200',
    [JobState.PHASE1_PAID]: 'bg-teal-100 text-teal-800 border-teal-200',
    [JobState.COMPLETED]: 'bg-emerald-600 text-white border-emerald-600 shadow-sm',
    [JobState.PHASE2_FUNDED]: 'bg-blue-600 text-white border-blue-600 shadow-sm',
    [JobState.DISPUTE]: 'bg-red-600 text-white border-red-600 animate-pulse',
  };
  
  const labels: Record<string, string> = {
    [JobState.CREATED]: 'ร่างสัญญา',
    [JobState.FUNDED]: 'รอรับงาน (ทุนพร้อม)',
    [JobState.ACCEPTED]: 'กำลังดำเนินการ',
    [JobState.IN_PROGRESS]: 'ระหว่างขนส่ง',
    [JobState.PICKUP_VERIFIED]: 'รับของแล้ว',
    [JobState.PHASE1_PAID]: 'จ่ายงวด 1 แล้ว',
    [JobState.COMPLETED]: 'จบงาน',
    [JobState.PHASE2_FUNDED]: 'รอเคลียริ่ง',
    [JobState.DISPUTE]: 'ระงับชั่วคราว',
  };

  return (
    <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider border ${styles[state] || 'bg-gray-100'}`}>
      {labels[state] || state}
    </span>
  );
};

// --- MAP COMPONENT ---

const RouteMap = ({ origin, destination }: { origin: string, destination: string }) => {
  return (
    <div className="w-full h-40 bg-slate-200/50 rounded-3xl relative overflow-hidden border border-slate-200 shadow-inner group">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      
      <svg className="absolute inset-0 w-full h-full pointer-events-none filter drop-shadow-md">
        <path 
          d="M 60 120 Q 180 40 300 80" 
          fill="transparent" 
          stroke="#10b981" 
          strokeWidth="3" 
          strokeDasharray="8 4"
          className="animate-[dash_20s_linear_infinite]"
        />
      </svg>
      <style>{`
        @keyframes dash {
          to { stroke-dashoffset: -120; }
        }
      `}</style>

      <div className="absolute left-[50px] top-[110px] flex flex-col items-center group/marker">
        <div className="bg-white p-1.5 rounded-full shadow-lg border border-slate-100 animate-bounce group-hover/marker:scale-110 transition-transform">
          <MapPin size={16} className="text-emerald-600" />
        </div>
        <div className="bg-slate-900/90 backdrop-blur-md text-white text-[9px] font-bold px-2.5 py-1 rounded-lg mt-1 shadow-lg">
          {origin}
        </div>
      </div>

      <div className="absolute right-[50px] top-[70px] flex flex-col items-center group/marker">
        <div className="bg-white p-1.5 rounded-full shadow-lg border border-slate-100 group-hover/marker:scale-110 transition-transform">
          <Navigation size={16} className="text-indigo-600 rotate-45" />
        </div>
        <div className="bg-slate-900/90 backdrop-blur-md text-white text-[9px] font-bold px-2.5 py-1 rounded-lg mt-1 shadow-lg">
          {destination}
        </div>
      </div>

      <div className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-md px-2 py-1 rounded-lg border border-white/50 shadow-sm flex items-center gap-1.5">
         <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
         <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">ติดตามสถานะ (Live)</span>
      </div>
    </div>
  );
};

// --- RISK ASSESSMENT COMPONENT ---

interface RiskItem {
  id: string;
  icon: LucideIcon;
  color: string;
  title: string;
  desc: string;
}

const RiskAssessment = ({ job }: { job: Job }) => {
  const risks: RiskItem[] = [];

  // High Value Cargo logic
  if (job.valueTotal >= 5000) {
    risks.push({
      id: 'high-value',
      icon: AlertTriangle,
      color: 'text-amber-700 bg-amber-50/50 border-amber-200/60',
      title: 'ทรัพย์สินมูลค่าสูง (High-Value)',
      desc: 'สัญญามีมูลค่าสูง ต้องมีการยืนยันตัวตนคนขับผ่าน Biometrics'
    });
  }

  // Complex Route logic
  if (job.riskScore > 40) {
    risks.push({
      id: 'route-complex',
      icon: TrendingUp,
      color: 'text-blue-700 bg-blue-50/50 border-blue-200/60',
      title: 'เส้นทางความหนาแน่นสูง',
      desc: 'เส้นทางผ่านเขตนิคมอุตสาหกรรม อาจมีความเสี่ยงด้านการจราจร'
    });
  }

  // Generic Safety requirement
  risks.push({
    id: 'safety-audit',
    icon: HardHat,
    color: 'text-slate-700 bg-slate-50/50 border-slate-200/60',
    title: 'ตรวจสอบความปลอดภัยสินค้า',
    desc: 'ระบบ AI จะสุ่มตรวจภาพถ่ายสินค้า 3 ครั้งระหว่างการเดินทาง'
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1"><Shield size={10}/> ประเมินความเสี่ยง (Risk Assessment)</h4>
        <div className={`text-[10px] font-black px-2 py-0.5 rounded-md ${job.riskScore < 30 ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'}`}>
           ดัชนีความเสี่ยง: {job.riskScore}%
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2.5">
        {risks.map(risk => {
          const IconComponent = risk.icon;
          return (
            <div key={risk.id} className={`p-4 rounded-2xl border flex gap-3.5 items-start animate-in fade-in slide-in-from-left-2 duration-300 hover:shadow-sm transition-shadow ${risk.color}`}>
              <div className="p-1.5 rounded-lg bg-white/80 shadow-sm flex-shrink-0">
                 <IconComponent size={14} strokeWidth={2.5}/>
              </div>
              <div>
                 <div className="text-[10px] font-black uppercase tracking-wide leading-none mb-1.5">{risk.title}</div>
                 <p className="text-[10px] leading-relaxed opacity-85 font-medium">{risk.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- MODALS & SPECIAL VIEWS ---

const JobDetailsView = ({ job, onBack, onAction }: { job: Job, onBack: () => void, onAction: (type: string, id: string) => void }) => {
  return (
    <div className="flex flex-col h-full bg-slate-50 animate-in slide-in-from-right-8 duration-300">
      <div className="bg-white/80 backdrop-blur-xl p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-full border border-slate-200 transition-all active:scale-95 group">
             <ChevronRight className="rotate-180 text-slate-600 group-hover:text-slate-900" size={18} strokeWidth={2.5}/>
          </button>
          <div className="flex flex-col">
             <h3 className="font-bold text-slate-900 text-sm leading-none">รายละเอียดภารกิจ</h3>
             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">รหัสงาน: {job.id}</p>
          </div>
        </div>
        <StatusBadge state={job.state} />
      </div>

      <div className="flex-1 p-5 space-y-6 overflow-y-auto pb-32 no-scrollbar">
        {/* Map Section */}
        <div className="space-y-3">
          <RouteMap origin={job.origin} destination={job.destination} />
        </div>

        {/* Info Card */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)] space-y-6">
          <div>
            <div className="flex justify-between items-start mb-2">
                <div className="text-[9px] font-bold text-indigo-500 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md uppercase tracking-wider inline-block">สัญญาอัจฉริยะ (Smart Contract)</div>
                <div className="text-[10px] text-slate-400 font-mono">{new Date(job.createdAt).toLocaleDateString('th-TH')}</div>
            </div>
            <h2 className="text-lg font-black text-slate-900 mt-2 leading-tight">{job.title}</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">มูลค่ารวม</div>
                <div className="text-xl font-black text-slate-900 tracking-tight">฿{job.valueTotal.toLocaleString()}</div>
             </div>
             <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="text-[9px] font-bold text-emerald-600 uppercase mb-2">โบนัสคาร์บอน</div>
                <div className="flex items-center gap-1 text-emerald-700 font-black">
                   <Leaf size={14} className="fill-emerald-500/20"/> +{job.projectedCarbonCredits}
                </div>
             </div>
          </div>

          <div className="space-y-4 pt-2 border-t border-slate-100">
             <div className="relative pl-6 pb-6 border-l-2 border-emerald-100 last:pb-0 last:border-l-0">
                <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-4 ring-white"></div>
                <div>
                   <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">จุดรับสินค้า (Origin)</div>
                   <div className="text-sm font-bold text-slate-700">{job.origin}</div>
                </div>
             </div>
             <div className="relative pl-6">
                <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 bg-indigo-500 rounded-full ring-4 ring-white"></div>
                <div>
                   <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">จุดส่งสินค้า (Destination)</div>
                   <div className="text-sm font-bold text-slate-700">{job.destination}</div>
                </div>
             </div>
          </div>
        </div>

        {/* Risk Assessment Section */}
        <RiskAssessment job={job} />
        
        {/* Spacer for bottom actions */}
        <div className="h-12"></div>
      </div>

      {/* Floating Action Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-white via-white/95 to-transparent z-20">
          <div className="space-y-3">
            {job.state === JobState.FUNDED && !job.driverId && (
                <button 
                onClick={() => onAction('ACCEPT_JOB', job.id)}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                <ShieldCheck size={18}/> ยืนยันรับงาน & ล็อกเงินประกัน
                </button>
            )}

            {job.state === JobState.ACCEPTED && (
                <button 
                onClick={() => onAction('VERIFY_PICKUP', job.id)}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-emerald-600/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                <Camera size={18}/> ถ่ายภาพยืนยัน: การรับของ
                </button>
            )}

            {job.state === JobState.PHASE1_PAID && (
                <button 
                onClick={() => onAction('COMPLETE_JOB', job.id)}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                <ScanLine size={18}/> สแกนส่งงาน: ปิดจ็อบ
                </button>
            )}
             <button className="w-full bg-white text-slate-500 py-3.5 rounded-2xl font-bold text-xs border border-slate-200 hover:bg-slate-50 transition-all">
                ดูเงื่อนไขสัญญาฉบับเต็ม
             </button>
          </div>
      </div>
    </div>
  );
};

const LedgerHistory = ({ ledger, onBack }: { ledger: LedgerEntry[], onBack: () => void }) => (
  <div className="flex flex-col h-full bg-slate-50 animate-in fade-in duration-300">
     <div className="bg-white/80 backdrop-blur-md p-4 border-b border-slate-200 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button onClick={onBack} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full border border-slate-200 transition-all"><ChevronRight className="rotate-180 text-slate-600" size={18}/></button>
        <h3 className="font-bold text-slate-900 text-sm">ประวัติธุรกรรม (Ledger)</h3>
     </div>
     <div className="p-5 space-y-3 overflow-y-auto no-scrollbar pb-24">
      
      <div className="flex justify-center mb-2">
         <div className="flex items-center gap-2 px-4 py-2 bg-slate-200/40 rounded-full border border-slate-200/50">
           <Lock size={10} className="text-slate-400"/>
           <span className="text-[9px] font-bold text-slate-400">ทุกธุรกรรมเกิดจากเหตุการณ์จริง และไม่สามารถแก้ไขย้อนหลังได้</span>
         </div>
      </div>

      {ledger.length === 0 ? (
          <div className="py-24 text-center">
             <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200"><History size={28} className="text-slate-300"/></div>
             <h4 className="text-slate-600 font-bold text-sm mb-1">ยังไม่มีรายการธุรกรรม</h4>
             <p className="text-slate-400 text-xs">รายการเงินเข้า-ออก จะปรากฏที่นี่</p>
          </div>
      ) : (
          ledger.map(entry => (
            <div key={entry.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center group active:scale-[0.98] transition-all hover:border-slate-300">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${entry.type === 'CREDIT' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {entry.type === 'CREDIT' ? <ArrowRight size={18} className="-rotate-45"/> : <ArrowRight className="rotate-45" size={18}/>}
                  </div>
                  <div>
                      <div className="text-[11px] font-bold text-slate-900 leading-tight mb-0.5">{entry.description}</div>
                      <div className="text-[9px] text-slate-400 font-mono tracking-wide">{new Date(entry.timestamp).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})} • {entry.relatedJobId ? entry.relatedJobId.split('-').pop() : 'SYS'}</div>
                  </div>
                </div>
                <div className={`text-xs font-black tracking-tight ${entry.type === 'CREDIT' ? 'text-emerald-600' : 'text-slate-900'}`}>
                  {entry.type === 'CREDIT' ? '+' : '-'}฿{entry.amount.toLocaleString()}
                </div>
            </div>
          ))
      )}
     </div>
  </div>
);

const CreateJobView = ({ onBack, onCreate }: { onBack: () => void, onCreate: (data: any) => void }) => {
  const [title, setTitle] = useState('');
  const [value, setValue] = useState(2500);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');

  const isValid = title && origin && destination && value > 0;

  return (
    <div className="p-5 space-y-6 h-full flex flex-col bg-slate-50 animate-in slide-in-from-bottom-8 duration-300">
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <button onClick={onBack} className="p-2 bg-white hover:bg-slate-100 rounded-full border border-slate-200 transition-all"><X size={18} className="text-slate-600"/></button>
             <h3 className="font-bold text-slate-900 text-sm">สร้างสัญญา e-Contract</h3>
          </div>
          <div className="px-2 py-1 bg-indigo-50 border border-indigo-100 rounded-md text-[9px] font-bold text-indigo-600 uppercase">โหมดร่างสัญญา</div>
       </div>

       <div className="flex-1 space-y-5 overflow-y-auto no-scrollbar">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
             <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">ชื่อสัญญา / รายการสินค้า</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="เช่น ขนส่งชิ้นส่วนอิเล็กทรอนิกส์ ล็อต #88" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all placeholder:text-slate-300" />
             </div>
             
             <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">ต้นทาง</label>
                    <div className="relative">
                       <MapPin size={14} className="absolute left-3.5 top-3.5 text-slate-400"/>
                       <input value={origin} onChange={e => setOrigin(e.target.value)} placeholder="เขต/อำเภอ" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900" />
                    </div>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">ปลายทาง</label>
                    <div className="relative">
                       <Navigation size={14} className="absolute left-3.5 top-3.5 text-slate-400"/>
                       <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="เขต/อำเภอ" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900" />
                    </div>
                </div>
             </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
             <div className="flex justify-between items-center mb-3">
               <label className="text-[10px] font-bold text-slate-400 uppercase">มูลค่าสัญญา (บาท)</label>
               <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">ต้องล็อกเงิน Escrow</span>
             </div>
             <div className="relative">
               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-300">฿</span>
               <input type="number" value={value} onChange={e => setValue(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-xl font-black font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500" />
             </div>
             
             <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200/60 rounded-xl">
                <Lock size={12} className="text-slate-400 flex-shrink-0"/>
                <span className="text-[9px] text-slate-500 font-medium leading-tight">เงินจะถูกล็อกโดยระบบ และปลดเมื่อข้อมูลการทำงานผ่านการยืนยัน</span>
             </div>

             <div className="mt-4 flex gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                 <div className="bg-emerald-500 w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0"><Leaf size={16}/></div>
                 <div>
                    <div className="text-[10px] font-bold text-slate-700">สิทธิประโยชน์ภาษีสีเขียว</div>
                    <div className="text-[9px] text-slate-400 leading-tight">ประมาณการ {Math.floor(value/100)} คาร์บอนเครดิต</div>
                 </div>
             </div>
          </div>
       </div>

       <button 
         disabled={!isValid}
         onClick={() => onCreate({ title, valueTotal: value, origin, destination, projectedCarbonCredits: Math.floor(value / 100) })} 
         className={`w-full py-4 rounded-2xl font-bold shadow-xl transition-all flex items-center justify-center gap-2 text-sm ${isValid ? 'bg-slate-900 text-white shadow-slate-900/20 active:scale-[0.98]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
       >
          <Lock size={16}/> สำรองวงเงิน & สร้างงาน
       </button>
    </div>
  );
};

const ComplianceModal = ({ content, onClose }: { content: string, onClose: () => void }) => (
  <div className="absolute inset-0 z-[60] bg-slate-900/95 backdrop-blur-sm flex flex-col p-6 animate-in fade-in duration-300">
    <div className="flex justify-between items-center mb-6">
       <div className="flex items-center gap-3">
         <div className="p-2.5 bg-emerald-500 rounded-xl text-white shadow-lg shadow-emerald-500/30"><FileCheck size={20}/></div>
         <div>
             <h3 className="text-white font-bold text-base leading-tight">สรุปรายงานดิจิทัล</h3>
             <p className="text-slate-400 text-[10px] font-medium uppercase tracking-wide mt-0.5">รับรองโดย Gemini Pro</p>
         </div>
       </div>
       <button onClick={onClose} className="p-2 text-white/50 hover:text-white transition-colors bg-white/5 rounded-full"><X size={18}/></button>
    </div>
    <div className="flex-1 overflow-y-auto bg-white rounded-[2rem] p-8 shadow-2xl text-slate-800 font-sans text-xs leading-relaxed whitespace-pre-wrap no-scrollbar border border-slate-200/50">
        <div className="prose prose-sm max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-600">
            {content}
        </div>
    </div>
    <div className="mt-6 grid grid-cols-2 gap-3">
       <button className="bg-white/10 text-white py-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-white/20 transition-all border border-white/10">
          <Share2 size={16}/> แชร์
       </button>
       <button className="bg-emerald-600 text-white py-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-emerald-900/40 hover:bg-emerald-500 transition-all active:scale-95">
          <Download size={16}/> บันทึก PDF
       </button>
    </div>
    <div className="text-[8px] text-slate-500 text-center mt-4 flex items-center justify-center gap-1.5 opacity-60">
      <ShieldCheck size={10}/> ข้อมูลยืนยันผ่าน ARWEEN Private Blockchain
    </div>
  </div>
);

const WalletActionModal = ({ type, onClose, onConfirm }: { type: 'TOP_UP' | 'WITHDRAW', onClose: () => void, onConfirm: (amount: number) => void }) => {
  const [amount, setAmount] = useState<number | ''>('');

  return (
     <div className="absolute inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-white w-full max-w-[320px] rounded-[2rem] p-6 shadow-2xl ring-1 ring-white/20 animate-in zoom-in-95 duration-200">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black text-slate-900">{type === 'TOP_UP' ? 'เติมเงินเข้าระบบ' : 'โอนเงินออกจากระบบ'}</h3>
              <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={16}/></button>
           </div>
           
           <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6">
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">จำนวนเงิน (THB)</label>
              <div className="relative">
                 <span className="absolute left-0 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-300 pl-3">฿</span>
                 <input 
                   type="number" 
                   value={amount} 
                   onChange={(e) => setAmount(Number(e.target.value))} 
                   placeholder="0.00" 
                   className="w-full bg-transparent text-2xl font-black font-mono pl-8 focus:outline-none"
                   autoFocus
                 />
              </div>
           </div>

           <button 
             disabled={!amount || amount <= 0}
             onClick={() => amount && onConfirm(Number(amount))}
             className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 text-sm ${
                type === 'TOP_UP' 
                ? 'bg-emerald-600 text-white shadow-emerald-600/30 hover:bg-emerald-500' 
                : 'bg-slate-900 text-white shadow-slate-900/30 hover:bg-slate-800'
             } ${(!amount || amount <= 0) ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
           >
              {type === 'TOP_UP' ? <ArrowDownCircle size={18}/> : <ArrowUpCircle size={18}/>}
              ยืนยันทำรายการ
           </button>
        </div>
     </div>
  );
};

const VerificationModal = ({ type, jobId, onClose, onConfirm }: { type: 'PICKUP' | 'DELIVERY', jobId: string, onClose: () => void, onConfirm: () => void }) => {
  const [step, setStep] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (step === 'IDLE') {
      setStep('PROCESSING');
      validateProofOfWork(type, jobId)
        .then(result => {
           if (result.valid) {
             setMessage(result.reason);
             setStep('SUCCESS');
           } else {
             setMessage(result.reason);
             setStep('FAILED');
           }
        })
        .catch(err => {
           // Catch unexpected validation errors
           setMessage(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบตรวจสอบ");
           setStep('FAILED');
        });
    }
  }, []);

  return (
    <div className="absolute inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-6 backdrop-blur-md">
      <div className="bg-white w-full rounded-[2rem] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200 max-w-[320px] ring-1 ring-white/20">
        <div className="p-8 text-center">
           {step === 'PROCESSING' && (
             <div className="py-6">
               <div className="w-20 h-20 relative mx-auto mb-8">
                   <div className="absolute inset-0 border-[6px] border-slate-100 rounded-full"></div>
                   <div className="absolute inset-0 border-[6px] border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
               </div>
               <h3 className="text-lg font-black text-slate-900 mb-2">กำลังตรวจสอบ...</h3>
               <p className="text-[11px] text-slate-500 leading-relaxed max-w-[200px] mx-auto">AI Node กำลังวิเคราะห์ข้อมูลพิกัด GPS และหลักฐานภาพถ่าย</p>
             </div>
           )}

           {step === 'SUCCESS' && (
             <div className="py-2 animate-in fade-in duration-500">
               <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200">
                 <ShieldCheck size={40} strokeWidth={2.5} />
               </div>
               <h3 className="text-lg font-black text-emerald-700 mb-2">ผ่านการตรวจสอบ</h3>
               <div className="text-[10px] text-slate-600 mt-4 mb-8 bg-slate-50 p-4 rounded-2xl text-left font-medium leading-relaxed whitespace-pre-line border border-slate-100 shadow-inner">
                 {message}
               </div>
               <button onClick={onConfirm} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 active:scale-[0.98] transition-all">
                 ดำเนินการต่อ
               </button>
             </div>
           )}

          {step === 'FAILED' && (
             <div className="py-2 animate-in fade-in duration-500">
               <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-200">
                 <AlertOctagon size={40} strokeWidth={2.5} />
               </div>
               <h3 className="text-lg font-black text-red-700 mb-2">ไม่ผ่านเกณฑ์</h3>
               <p className="text-[11px] text-slate-500 mt-2 mb-8 px-2 max-w-[220px] mx-auto">{message}</p>
               <button onClick={onClose} className="w-full bg-slate-100 text-slate-700 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-[0.98]">
                 ลองใหม่อีกครั้ง
               </button>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENTS ---

const AIStrategicCard = ({ role, appState, onShowError }: { role: UserRole, appState: AppState, onShowError: (msg: string) => void }) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAdvice = async () => {
    setLoading(true);
    try {
      const res = await getStrategicAdvice(role, appState);
      setAdvice(res);
    } catch (e: any) {
      if (onShowError) {
        onShowError(e.message);
      } else {
        console.error("AI Advice Error:", e);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden group border border-white/10 mb-6">
       <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/30 transition-all duration-700"></div>
       <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
       
       <div className="relative z-10">
          <div className="flex justify-between items-start mb-5">
             <div className="flex flex-col">
                <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-300 flex items-center gap-1.5 mb-1">
                    <Zap size={12} className="fill-indigo-400 text-indigo-400"/> ระบบที่ปรึกษา AI
                </div>
                <h3 className="text-lg font-bold text-white leading-tight">วิเคราะห์กลยุทธ์</h3>
             </div>
             {!advice && !loading && (
                <button onClick={fetchAdvice} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-[10px] font-bold transition-all border border-white/10 flex items-center gap-2 backdrop-blur-sm">
                   <Sparkles size={12}/> วิเคราะห์ข้อมูล
                </button>
             )}
          </div>
          
          {loading ? (
             <div className="flex flex-col items-center justify-center py-6 gap-3">
                <RefreshCw size={24} className="animate-spin text-indigo-400"/>
                <div className="text-[10px] font-medium text-slate-400 uppercase tracking-widest animate-pulse">กำลังประมวลผล Ledger และ Wallet...</div>
             </div>
          ) : advice ? (
             <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-500 bg-white/5 p-4 rounded-xl border border-white/5">
                <div className="text-[11px] leading-relaxed text-slate-200 font-medium whitespace-pre-line">
                  {advice}
                </div>
                <button onClick={() => setAdvice(null)} className="mt-2 text-[9px] text-indigo-300 font-bold hover:text-white transition-colors flex items-center gap-1.5 py-1">
                  <X size={10}/> ปิดคำแนะนำ
                </button>
             </div>
          ) : (
             <div className="text-xs text-slate-400 font-medium leading-relaxed max-w-[260px]">
               ใช้ระบบ AI อัจฉริยะช่วยวางแผนกระแสเงินสดและเพิ่มเครดิตสกอร์จากข้อมูลการทำงานจริง
             </div>
          )}
       </div>
    </div>
  );
};

// --- OPERATOR ECONOMIC HOME (READ-ONLY + LIQUIDITY CONTROL) ---

const OperatorEconomicHome = ({ appState, onExport, onAction }: { appState: AppState, onExport: () => void, onAction: (type: string, payload?: any) => void }) => {
   // System Calculations
   const totalJobs = appState.jobs.length;
   const completedJobs = appState.jobs.filter(j => j.state === JobState.COMPLETED).length;
   const completionRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;
   
   // Turnover / Volume derived from system state
   const totalVolume = appState.jobs
     .filter(j => j.state === JobState.COMPLETED)
     .reduce((acc, curr) => acc + curr.valueTotal, 0);

   const estimatedCarbonValue = appState.operatorWallet.carbonPoints * CONSTANTS.CARBON_POINT_VALUE_THB;

   return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-24">
         {/* Identity Card */}
         <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden border border-slate-700">
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
             <div className="relative z-10">
                 <div className="flex justify-between items-start mb-6">
                     <div>
                         <div className="flex items-center gap-2 mb-2">
                             <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-700 text-slate-300 border border-slate-600 uppercase tracking-wider">
                                 {appState.operatorWallet.tier} OPERATOR
                             </span>
                             <div className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                 <ShieldCheck size={10} /> Verified Entity
                             </div>
                         </div>
                         <h2 className="text-2xl font-black tracking-tight">{appState.operatorWallet.ownerId}</h2>
                         <p className="text-[10px] text-slate-400 font-medium mt-1">System Identity ID</p>
                     </div>
                     <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                         <LayoutGrid size={24} className="text-slate-300" />
                     </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Jobs</div>
                        <div className="text-xl font-black text-white">{totalJobs} <span className="text-xs text-slate-500 font-medium">contracts</span></div>
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Completion Rate</div>
                        <div className="text-xl font-black text-emerald-400">{completionRate}% <span className="text-xs text-emerald-500/60 font-medium">efficiency</span></div>
                    </div>
                 </div>
             </div>
         </div>

         {/* Liquidity Control (NEW) */}
         <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-5">
             <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <CreditCard size={14} className="text-slate-900"/> Liquidity Control (User Managed)
             </h3>
             
             {/* Available (User Controlled) */}
             <div>
                <div className="flex justify-between items-end mb-3">
                   <div>
                       <div className="text-[10px] font-bold text-slate-400">AVAILABLE BALANCE</div>
                       <div className="text-2xl font-black text-slate-900 tracking-tight">฿{appState.operatorWallet.balanceAvailable.toLocaleString()}</div>
                   </div>
                   <div className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                      Ready to Use
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <button onClick={() => onAction('OPEN_TOPUP')} className="bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold text-xs shadow-lg shadow-emerald-900/10 active:scale-95 transition-all flex items-center justify-center gap-2">
                      <ArrowDownCircle size={16}/> เติมเงิน (Top Up)
                   </button>
                   <button onClick={() => onAction('OPEN_WITHDRAW')} className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-xs border border-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2">
                      <ArrowUpCircle size={16}/> โอนออก (Withdraw)
                   </button>
                </div>
             </div>

             {/* Escrow (System Controlled) */}
             <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center opacity-60 grayscale">
                   <div className="flex items-center gap-3">
                      <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><Lock size={16}/></div>
                      <div>
                         <div className="text-[10px] font-bold text-slate-900">ESCROW BALANCE</div>
                         <div className="text-[9px] text-slate-400">System Locked • Untouchable</div>
                      </div>
                   </div>
                   <div className="text-base font-black text-slate-500">฿{appState.operatorWallet.balanceEscrow.toLocaleString()}</div>
                </div>
             </div>
         </div>

         {/* Economic Performance */}
         <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
             <div>
                <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-4">
                   <Activity size={14} className="text-slate-900"/> Economic Performance
                </h3>
                <div className="space-y-4">
                   <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                         <div className="text-[10px] font-bold text-slate-500">Business Turnover (YTD)</div>
                         <div className="text-[9px] text-slate-400">Calculated from completed contracts</div>
                      </div>
                      <div className="text-right">
                         <div className="text-lg font-black text-slate-900">฿{totalVolume.toLocaleString()}</div>
                         <div className="text-[9px] font-bold text-emerald-600">Verified Volume</div>
                      </div>
                   </div>

                   <div className="flex justify-between items-center p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                      <div className="flex items-center gap-3">
                         <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600"><Leaf size={16}/></div>
                         <div>
                            <div className="text-[10px] font-bold text-slate-700">Carbon Tax Shield</div>
                            <div className="text-[9px] text-slate-400">{appState.operatorWallet.carbonPoints} pts accumulated</div>
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="text-lg font-black text-emerald-700">-฿{estimatedCarbonValue.toLocaleString()}</div>
                         <div className="text-[9px] font-bold text-emerald-600/70">Est. Deduction</div>
                      </div>
                   </div>
                </div>
             </div>
         </div>

         {/* Action */}
         <button onClick={onExport} className="w-full bg-slate-900 text-white py-4.5 rounded-[2rem] font-black text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">
             <FileText size={16}/> Export Consolidated Report (Audit Ready)
         </button>

         {/* System Statement */}
         <div className="text-center px-6">
            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Scale size={14} className="text-slate-400"/>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">ARWEEN NEUTRAL OPERATOR</p>
            <p className="text-[9px] text-slate-400 leading-relaxed">
                This screen represents the single source of truth for your economic identity. 
                All values are system-calculated and immutable.
            </p>
         </div>
      </div>
   );
}

export default function App() {
  const [appState, setAppState] = useState<AppState>(INITIAL_STATE);
  const [driverTab, setDriverTab] = useState<'HOME' | 'MARKET' | 'WALLET' | 'WELFARE' | 'LEDGER' | 'JOB_DETAIL'>('HOME');
  const [operatorTab, setOperatorTab] = useState<'HOME' | 'JOB_HUB' | 'CREATE' | 'LEDGER' | 'JOB_DETAIL'>('HOME');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Array<{id: number, message: string, type: 'info' | 'success' | 'danger'}>>([]);
  const [activeVerification, setActiveVerification] = useState<{type: 'PICKUP'|'DELIVERY', jobId: string} | null>(null);
  const [complianceReport, setComplianceReport] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [walletModal, setWalletModal] = useState<'TOP_UP' | 'WITHDRAW' | null>(null);
  
  const addToast = (message: string, type: 'info' | 'success' | 'danger' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const generateReport = async () => {
    setExportLoading(true);
    try {
      const res = await generateComplianceReport(appState.currentUserRole, appState);
      setComplianceReport(res);
    } catch (e: any) {
      addToast(e.message, "danger");
    } finally {
      setExportLoading(false);
    }
  };

  const handleAction = (type: string, payload: any) => {
    try {
      let newState = { ...appState };
      switch (type) {
        case 'CREATE_JOB':
          newState = createJob(newState, payload);
          addToast("บันทึกสัญญา e-Contract เข้าสู่ระบบเรียบร้อยแล้ว", "info");
          setOperatorTab('JOB_HUB');
          break;
        case 'FUND_JOB':
          newState = fundJob(newState, payload);
          addToast("ล็อกวงเงินในบัญชีพัก (Escrow) สำเร็จ เตรียมพร้อมสำหรับคนขับ", "success");
          break;
        case 'ACCEPT_JOB':
          newState = acceptJob(newState, payload, 'u_dr_001');
          addToast("รับงานสำเร็จ! ระบบได้ล็อกรายได้งวดแรกไว้ให้ท่านแล้ว", "success");
          setDriverTab('HOME');
          setSelectedJobId(null);
          break;
        case 'VERIFY_PICKUP':
          setActiveVerification({ type: 'PICKUP', jobId: payload });
          break;
        case 'CONFIRM_VERIFY_PICKUP':
           newState = verifyPickup(newState, payload);
           addToast("ยืนยันรับของสำเร็จ: เงินงวดที่ 1 (50%) โอนเข้ากระเป๋าแล้ว", "success");
           setTimeout(() => {
              setAppState(prev => processPhase1Payout(prev, payload));
           }, 500);
           setActiveVerification(null);
           break;
        case 'COMPLETE_JOB':
           setActiveVerification({ type: 'DELIVERY', jobId: payload });
           break;
        case 'CONFIRM_COMPLETE_JOB':
          newState = completeJob(newState, payload);
          addToast("ส่งงานสำเร็จ! เงินส่วนที่เหลือ (50%) อยู่ระหว่างรอเคลียริ่ง (T+1)", "success");
          setTimeout(() => {
            setAppState(prev => processPhase2Payout(prev, payload));
          }, 500);
          setActiveVerification(null);
          break;
        case 'SETTLE_FUNDS':
          setIsSettling(true);
          setTimeout(() => {
             try {
                setAppState(prev => settleDriverFunds(prev));
                addToast("ดำเนินการเคลียริ่ง T+1 สำเร็จ ยอดเงินพร้อมถอนแล้ว", "success");
             } catch (e: any) {
                addToast(e.message, "danger");
             } finally {
                setIsSettling(false);
             }
          }, 1500);
          break;
        case 'OVERRIDE_JOB':
          newState = raiseDispute(newState, payload, "Safety Stop triggered by Operator");
          addToast("คำสั่งระงับการเดินรถฉุกเฉินถูกส่งถึงคนขับทันที!", "danger");
          break;
        case 'OPEN_TOPUP':
           setWalletModal('TOP_UP');
           break;
        case 'OPEN_WITHDRAW':
           setWalletModal('WITHDRAW');
           break;
        case 'CONFIRM_TOPUP':
           newState = topUpWallet(newState, payload);
           addToast(`เติมเงินเข้าระบบสำเร็จ: +฿${payload.toLocaleString()}`, "success");
           setWalletModal(null);
           break;
        case 'CONFIRM_WITHDRAW':
           newState = withdrawWallet(newState, payload);
           addToast(`โอนเงินออกจากระบบสำเร็จ: -฿${payload.toLocaleString()}`, "info");
           setWalletModal(null);
           break;
      }
      setAppState(newState);
    } catch (e: any) {
      console.error("Critical Action Error:", e);
      addToast(e.message, "danger");
    }
  };

  const activeDriverJobs = appState.jobs.filter(j => j.driverId === 'u_dr_001' && j.state !== JobState.PHASE2_FUNDED);
  const currentJob = appState.jobs.find(j => j.id === selectedJobId);

  return (
    <MobileFrame>
      <RoleSwitcher currentRole={appState.currentUserRole} onSwitch={(r) => {
        setAppState(prev => ({ ...prev, currentUserRole: r }));
        setSelectedJobId(null);
        // Reset tabs to HOME when switching roles
        if (r === UserRole.OPERATOR) setOperatorTab('HOME');
        if (r === UserRole.DRIVER) setDriverTab('HOME');
      }} />
      
      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto bg-[#F6F8FA] no-scrollbar pb-24 h-full font-sans relative px-5 pt-4">
        {walletModal && (
           <WalletActionModal 
             type={walletModal} 
             onClose={() => setWalletModal(null)} 
             onConfirm={(amount) => handleAction(walletModal === 'TOP_UP' ? 'CONFIRM_TOPUP' : 'CONFIRM_WITHDRAW', amount)}
           />
        )}
        
        {activeVerification && (
           <VerificationModal 
              type={activeVerification.type} 
              jobId={activeVerification.jobId} 
              onClose={() => setActiveVerification(null)}
              onConfirm={() => {
                 if(activeVerification.type === 'PICKUP') handleAction('CONFIRM_VERIFY_PICKUP', activeVerification.jobId);
                 if(activeVerification.type === 'DELIVERY') handleAction('CONFIRM_COMPLETE_JOB', activeVerification.jobId);
              }}
           />
        )}

        {complianceReport && <ComplianceModal content={complianceReport} onClose={() => setComplianceReport(null)} />}

        {/* DRIVER VIEWS */}
        {appState.currentUserRole === UserRole.DRIVER && (
          <div className="h-full flex flex-col">
            {driverTab !== 'JOB_DETAIL' && (
              <PageHeader 
                title={
                    driverTab === 'HOME' ? 'ภาพรวมภารกิจ' :
                    driverTab === 'MARKET' ? 'ตลาดงานขนส่ง' :
                    driverTab === 'WALLET' ? 'กระเป๋าเงิน' :
                    driverTab === 'WELFARE' ? '(Driver – Member Benefits) : ARWEEN' :
                    'สมุดบัญชี'
                }
                subtitle={driverTab === 'WELFARE' ? 'ARWEEN System Identity' : 'คนขับที่ผ่านการยืนยันตัวตนแล้ว'}
                rightElement={<TrustBadge score={appState.driverWallet.reputation} />}
              />
            )}

            {driverTab === 'HOME' && (
               <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                 <AIStrategicCard role={UserRole.DRIVER} appState={appState} onShowError={(msg) => addToast(msg, 'danger')} />
                 
                 <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-[2rem] p-7 text-white shadow-2xl shadow-emerald-900/20 relative overflow-hidden group transition-transform active:scale-[0.99]">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700"><Lock size={140}/></div>
                    <div className="relative z-10">
                       <div className="flex items-center gap-2 mb-2">
                           <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-sm"><ShieldCheck size={14} className="text-emerald-200"/></div>
                           <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest">รายได้ที่ได้รับการค้ำประกัน (Guaranteed)</span>
                       </div>
                       <div className="text-[2.5rem] font-black tracking-tight leading-none mb-6"><AnimatedNumber value={appState.driverWallet.balanceReserved} /></div>
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                             <span className="text-[10px] text-emerald-100 font-medium">คุ้มครองโดย Escrow</span>
                          </div>
                          <button className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl text-[10px] font-bold backdrop-blur-md transition-all border border-white/10">รายละเอียด</button>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                      <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">ภารกิจที่กำลังดำเนินการ</h3>
                      <button onClick={() => setDriverTab('MARKET')} className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 hover:text-emerald-700">หางานเพิ่ม <ChevronRight size={12}/></button>
                    </div>
                    
                    {activeDriverJobs.length === 0 ? (
                       <div className="bg-white border border-dashed border-slate-300 rounded-[2rem] p-10 text-center">
                          <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100"><Package size={24} className="text-slate-300"/></div>
                          <p className="text-slate-500 text-xs font-bold leading-tight mb-1">ยังไม่มีภารกิจ</p>
                          <p className="text-slate-400 text-[10px]">ค้นหางานใหม่ๆ ได้ที่ตลาดงานขนส่ง</p>
                       </div>
                    ) : (
                       activeDriverJobs.map(job => (
                          <div 
                            key={job.id} 
                            onClick={() => { setSelectedJobId(job.id); setDriverTab('JOB_DETAIL'); }}
                            className={`bg-white p-5 rounded-[2rem] border ${job.state === JobState.DISPUTE ? 'border-red-200 bg-red-50/30' : 'border-slate-200/60'} shadow-sm relative overflow-hidden active:scale-[0.98] transition-all cursor-pointer group hover:border-emerald-500/30`}
                          >
                             {job.state === JobState.DISPUTE && (
                                <div className="absolute top-4 right-4 text-red-600"><Siren size={20} className="animate-ping"/></div>
                             )}
                             <div className="flex justify-between items-start mb-4">
                                <StatusBadge state={job.state}/>
                                <span className="text-[9px] font-mono font-bold text-slate-300 group-hover:text-slate-400 transition-colors">{job.id}</span>
                             </div>
                             <div className="font-bold text-slate-900 text-sm mb-2 leading-tight pr-8">{job.title}</div>
                             
                             {/* ADDED BADGES HERE */}
                             <div className="flex flex-wrap gap-2 mb-3">
                                <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100/50">
                                    <Lock size={10} /> Escrow Active
                                </div>
                                <div className="flex items-center gap-1 text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100/50">
                                    <Clock size={10} /> Auto-Release
                                </div>
                             </div>

                             <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium bg-slate-50 w-fit px-2.5 py-1.5 rounded-lg">
                                <MapPin size={10} className="text-slate-400"/> {job.origin} <ArrowRight size={8} className="text-slate-300"/> {job.destination}
                             </div>
                          </div>
                       ))
                    )}
                 </div>
               </div>
            )}

            {driverTab === 'MARKET' && (
               <div className="space-y-4 pb-4 animate-in slide-in-from-bottom-2 duration-500">
                  <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center gap-3 shadow-sm sticky top-24 z-20">
                    <Search size={18} className="text-slate-400 ml-2"/>
                    <input placeholder="ค้นหาประเภทสินค้า, เส้นทาง, หรือรหัสงาน..." className="bg-transparent text-xs w-full focus:outline-none placeholder:text-slate-400 py-1"/>
                  </div>
                  {appState.jobs.filter(j => j.state === JobState.FUNDED && !j.driverId).map(job => (
                    <div 
                      key={job.id} 
                      onClick={() => { setSelectedJobId(job.id); setDriverTab('JOB_DETAIL'); }}
                      className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm hover:border-emerald-400 transition-all active:scale-[0.98] cursor-pointer group"
                    >
                       <div className="p-5 border-b border-slate-100">
                          <div className="flex justify-between mb-3">
                             <div className="flex gap-2">
                                <div className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-wider border border-emerald-100 flex items-center gap-1">
                                    <Lock size={10}/> Escrow Active
                                </div>
                                <div className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wider border border-blue-100 flex items-center gap-1">
                                    <Clock size={10}/> Auto-Release
                                </div>
                             </div>
                             <div className="text-sm font-black text-slate-900">฿{job.valueTotal.toLocaleString()}</div>
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm mb-2 leading-snug">{job.title}</h4>
                          <div className="text-[10px] text-slate-500 font-medium flex items-center gap-2">
                             <MapPin size={12} className="text-slate-400"/> {job.origin} <span className="text-slate-300">→</span> {job.destination}
                          </div>
                       </div>
                       <div className="px-5 py-3 bg-slate-50/80 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide group-hover:text-emerald-600 transition-colors">ดูรายละเอียด</span>
                          <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:bg-emerald-500 group-hover:border-emerald-500 group-hover:text-white transition-all shadow-sm">
                             <ChevronRight size={14} />
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            )}

            {driverTab === 'WALLET' && (
               <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                  {/* Main Card: Available */}
                  <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden ring-1 ring-white/10">
                     <div className="absolute top-0 right-0 p-8 opacity-10"><Wallet size={140}/></div>
                     <div className="relative z-10">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">เงินที่ปลอดล็อกแล้ว</div>
                        <div className="text-[2.75rem] font-black tracking-tighter mb-8 leading-none"><AnimatedNumber value={appState.driverWallet.balanceAvailable}/></div>
                        
                        <div className="flex gap-3">
                           <button className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 py-3.5 rounded-2xl text-xs font-black shadow-lg shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                              <ArrowRight size={16} className="-rotate-45"/> ถอนเงิน
                           </button>
                           <button onClick={() => setDriverTab('LEDGER')} className="px-5 bg-white/10 hover:bg-white/20 text-white py-3.5 rounded-2xl text-xs font-black backdrop-blur-sm active:scale-95 transition-all flex items-center justify-center border border-white/10">
                              <History size={18}/>
                           </button>
                        </div>
                     </div>
                  </div>
                  
                  {/* Breakdown Grid */}
                  <div className="grid grid-cols-1 gap-3">
                     {/* Reserved Funds */}
                     <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="bg-emerald-50 p-3.5 rounded-2xl text-emerald-600 border border-emerald-100"><Lock size={20}/></div>
                           <div>
                              <div className="text-xs font-black text-slate-900">เงินประกัน (Escrow)</div>
                              <div className="text-[10px] text-slate-400 font-medium">ล็อกไว้เพื่อคุณ</div>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className="text-lg font-black text-slate-900">฿{appState.driverWallet.balanceReserved.toLocaleString()}</div>
                        </div>
                     </div>

                     {/* Pending Settlement */}
                     <div className={`bg-amber-50/50 p-5 rounded-[2rem] border border-amber-100/60 shadow-sm flex justify-between items-center transition-all ${isSettling ? 'animate-pulse opacity-70' : ''}`}>
                        <div className="flex items-center gap-4">
                           <div className="bg-amber-100 p-3.5 rounded-2xl text-amber-600 border border-amber-200"><Clock size={20}/></div>
                           <div>
                              <div className="text-xs font-black text-amber-950">รอเคลียริ่ง (T+1)</div>
                              <div className="text-[10px] text-amber-700 font-medium">ยอดเงินรอเข้าบัญชี</div>
                           </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                           <div className="text-lg font-black text-amber-700">฿{appState.driverWallet.balancePending.toLocaleString()}</div>
                           {appState.driverWallet.balancePending > 0 && (
                              <button onClick={() => handleAction('SETTLE_FUNDS', null)} className="text-[9px] font-bold text-amber-700 bg-amber-100/50 px-2 py-0.5 rounded-md mt-1 hover:bg-amber-200 transition-colors">เร่งยอดเข้าทันที ›</button>
                           )}
                        </div>
                     </div>
                  </div>

                   {/* Total Assets Summary */}
                   <div className="px-4 py-2 flex justify-between items-center border-t border-slate-200/50 pt-4 mt-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">มูลค่าทรัพย์สินรวม</span>
                      <span className="text-sm font-black text-slate-700">฿{(appState.driverWallet.balanceAvailable + appState.driverWallet.balanceReserved + appState.driverWallet.balancePending).toLocaleString()}</span>
                   </div>
               </div>
            )}

            {driverTab === 'WELFARE' && (
               <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500 pb-24">
                  {/* 1) Member Identity Card */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden border border-slate-700">
                        {/* Background Patterns */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 uppercase tracking-wider">
                                            {appState.driverWallet.tier} MEMBER
                                        </span>
                                        {/* System Verified */}
                                        <div className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                            <ShieldCheck size={10} /> ระบบรับรองแล้ว
                                        </div>
                                    </div>
                                    <h2 className="text-2xl font-black tracking-tight">{appState.driverWallet.ownerId}</h2>
                                    <p className="text-[10px] text-slate-400 font-medium mt-1">
                                        ประเมินจากข้อมูลการทำงานจริง • ไม่ใช้ดุลยพินิจบุคคล
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-slate-700/50 rounded-full flex items-center justify-center border border-white/10">
                                    <User size={24} className="text-slate-300" />
                                </div>
                            </div>

                            {/* 6) Credit Score */}
                            <div className="mb-6">
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Economic Identity (Credit Score)</div>
                                <div className="flex items-end gap-3">
                                    <div className="text-4xl font-black text-white">{appState.driverWallet.creditScore}</div>
                                    <div className="text-[10px] text-emerald-400 font-bold mb-1.5 flex items-center gap-1">
                                    <TrendingUp size={12}/> ดีมาก
                                    </div>
                                </div>
                                {/* 3) Member Progression */}
                                <div className="mt-3">
                                    <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-1.5">
                                        <span>ระดับปัจจุบัน: {appState.driverWallet.tier}</span>
                                        <span>ระดับถัดไป: PLATINUM</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-yellow-500 to-amber-300 w-[78%]"></div>
                                    </div>
                                    <div className="mt-2 text-[9px] text-slate-400 font-medium">
                                        เงื่อนไข: รักษาอัตราการส่งงานสำเร็จ 98% อีก 15 งานเพื่อเลื่อนระดับ
                                    </div>
                                </div>
                            </div>
                        </div>
                  </div>

                  {/* 2) System Guarantee */}
                  <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                        <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <Shield size={14} className="text-slate-900"/> ความคุ้มครองโดยระบบ (System Guarantee)
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="bg-emerald-100 text-emerald-700 p-1.5 rounded-lg shrink-0"><Lock size={16}/></div>
                                <div>
                                    <div className="text-[10px] font-black text-slate-900">Escrow Backed</div>
                                    <div className="text-[10px] text-slate-500 leading-tight">ทุกงานมีเงินค้ำประกันในระบบ ไม่ต้องลุ้น</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="bg-indigo-100 text-indigo-700 p-1.5 rounded-lg shrink-0"><Zap size={16}/></div>
                                <div>
                                    <div className="text-[10px] font-black text-slate-900">Automated Payout</div>
                                    <div className="text-[10px] text-slate-500 leading-tight">ระบบโอนเงินอัตโนมัติเมื่อเงื่อนไขครบ</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="bg-blue-100 text-blue-700 p-1.5 rounded-lg shrink-0"><History size={16}/></div>
                                <div>
                                    <div className="text-[10px] font-black text-slate-900">Immutable Ledger</div>
                                    <div className="text-[10px] text-slate-500 leading-tight">ข้อมูลถูกบันทึกถาวร แก้ไขย้อนหลังไม่ได้</div>
                                </div>
                            </div>
                        </div>
                  </div>

                  {/* 4) Active Benefits */}
                  <div>
                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">สิทธิ์ที่เปิดใช้งานแล้ว (Active Benefits)</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                                <div className="text-emerald-600 mb-2"><Banknote size={20}/></div>
                                <div className="text-[10px] font-black text-slate-900 mb-1">รายได้ค้ำประกัน</div>
                                <div className="text-[9px] text-slate-500 leading-tight">ได้รับเงินค่าจ้างแน่นอน 100% หากงานสำเร็จ</div>
                            </div>
                            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                                <div className="text-emerald-600 mb-2"><Clock size={20}/></div>
                                <div className="text-[10px] font-black text-slate-900 mb-1">Instant / T+1</div>
                                <div className="text-[9px] text-slate-500 leading-tight">รอบการจ่ายเงินรวดเร็วพิเศษ</div>
                            </div>
                        </div>
                  </div>

                  {/* 5) Future Benefits */}
                  <div>
                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">สิทธิ์ในระดับถัดไป (Locked)</h3>
                        <div className="space-y-2 opacity-60 grayscale">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-slate-200 text-slate-500 p-2 rounded-xl"><Heart size={16}/></div>
                                    <div>
                                        <div className="text-[10px] font-black text-slate-700">ประกันสังคม & สุขภาพ</div>
                                        <div className="text-[9px] text-slate-500">สำหรับระดับ Platinum</div>
                                    </div>
                                </div>
                                <Lock size={14} className="text-slate-400"/>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-slate-200 text-slate-500 p-2 rounded-xl"><Landmark size={16}/></div>
                                    <div>
                                        <div className="text-[10px] font-black text-slate-700">สินเชื่อเพื่ออาชีพ</div>
                                        <div className="text-[9px] text-slate-500">ดอกเบี้ยพิเศษ 0.5% ต่อเดือน</div>
                                    </div>
                                </div>
                                <Lock size={14} className="text-slate-400"/>
                            </div>
                        </div>
                  </div>

                  {/* 7) System Statement */}
                  <div className="text-center py-6 px-4">
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Scale size={14} className="text-slate-400"/>
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">ARWEEN NEUTRAL OPERATOR</p>
                        <p className="text-[9px] text-slate-400 leading-relaxed max-w-[250px] mx-auto">
                            ระบบเป็นผู้คำนวณสิทธิ์ทั้งหมดโดยอัตโนมัติ ไม่มีการแทรกแซงจากบุคคล และสามารถตรวจสอบย้อนหลังได้เพื่อความยุติธรรมเชิงโครงสร้าง
                        </p>
                  </div>
               </div>
            )}

            {driverTab === 'LEDGER' && (
               <LedgerHistory ledger={appState.ledger} onBack={() => setDriverTab('WALLET')} />
            )}

            {driverTab === 'JOB_DETAIL' && currentJob && (
               <JobDetailsView 
                job={currentJob} 
                onBack={() => setDriverTab(currentJob.driverId ? 'HOME' : 'MARKET')} 
                onAction={(type, id) => handleAction(type, id)}
               />
            )}
          </div>
        )}

        {/* OPERATOR VIEWS */}
        {appState.currentUserRole === UserRole.OPERATOR && (
           <div className="h-full flex flex-col">
              {operatorTab === 'HOME' && (
                 <OperatorEconomicHome appState={appState} onExport={generateReport} onAction={handleAction} />
              )}

              {operatorTab === 'JOB_HUB' && (
                 <>
                    <PageHeader 
                        title="ศูนย์รวมงานขนส่ง"
                        subtitle="แผงควบคุมผู้ประกอบการ"
                        rightElement={<TrustBadge score={appState.operatorWallet.reputation} />}
                    />

                    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500 pb-24">
                        <AIStrategicCard role={UserRole.OPERATOR} appState={appState} onShowError={(msg) => addToast(msg, 'danger')} />

                        <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">เงินที่ควบคุมได้</div>
                            <div className="text-lg font-black text-slate-900">฿{appState.operatorWallet.balanceAvailable.toLocaleString()}</div>
                        </div>
                        <div className="bg-emerald-50/50 p-5 rounded-[2rem] border border-emerald-100 shadow-sm">
                            <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1.5">เงินที่ระบบควบคุม</div>
                            <div className="text-lg font-black text-emerald-700">฿{appState.operatorWallet.balanceEscrow.toLocaleString()}</div>
                        </div>
                        </div>
                        
                        <div className="flex justify-between items-center pt-4 px-1">
                            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">สัญญาอิเล็กทรอนิกส์ทั้งหมด</h3>
                            <button onClick={() => setOperatorTab('CREATE')} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-2 shadow-lg hover:bg-slate-800 transition-all active:scale-95">
                                <Plus size={14}/> สร้างงาน (ต้องมีเงินค้ำประกัน)
                            </button>
                        </div>

                        <div className="space-y-4">
                        {appState.jobs.length === 0 ? (
                            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] p-10 text-center text-slate-400 text-xs font-bold">ไม่พบสัญญา</div>
                        ) : (
                            appState.jobs.map(job => (
                                <div 
                                key={job.id} 
                                onClick={() => { setSelectedJobId(job.id); setOperatorTab('JOB_DETAIL'); }}
                                className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm hover:border-indigo-300 transition-all group cursor-pointer active:scale-[0.98]"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <StatusBadge state={job.state}/>
                                        <div className="text-[10px] font-mono font-bold text-slate-300 group-hover:text-slate-400">{job.id}</div>
                                    </div>
                                    <div className="font-bold text-slate-900 text-sm mb-2 leading-tight">{job.title}</div>
                                    <div className="text-[10px] text-slate-500 font-medium mb-5 flex items-center gap-1.5">
                                        <MapPin size={12} className="text-slate-400"/> {job.origin} <span className="text-slate-300">→</span> {job.destination}
                                    </div>
                                    <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                                        <div className="text-sm font-black text-slate-900">฿{job.valueTotal.toLocaleString()}</div>
                                        <div className="flex gap-2">
                                            {job.state === JobState.CREATED && (
                                                <button onClick={(e) => { e.stopPropagation(); handleAction('FUND_JOB', job.id); }} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black shadow-lg shadow-emerald-200 hover:bg-emerald-500 active:scale-95 transition-all">เติมเงิน Escrow</button>
                                            )}
                                            {(job.state === JobState.IN_PROGRESS || job.state === JobState.ACCEPTED) && (
                                                <button onClick={(e) => { e.stopPropagation(); handleAction('OVERRIDE_JOB', job.id); }} className="bg-red-50 text-red-600 border border-red-100 px-3 py-2 rounded-xl text-[10px] font-black flex items-center gap-1.5 hover:bg-red-100 active:scale-95 transition-all"><Siren size={14}/> ระงับสินค้า</button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        </div>
                    </div>
                 </>
              )}

              {operatorTab === 'CREATE' && (
                 <CreateJobView onBack={() => setOperatorTab('JOB_HUB')} onCreate={(data) => handleAction('CREATE_JOB', data)} />
              )}
              
              {operatorTab === 'LEDGER' && (
                 <LedgerHistory ledger={appState.ledger} onBack={() => setOperatorTab('HOME')} />
              )}

              {operatorTab === 'JOB_DETAIL' && currentJob && (
                <JobDetailsView 
                  job={currentJob} 
                  onBack={() => setOperatorTab('JOB_HUB')} 
                  onAction={(type, id) => handleAction(type, id)}
                />
              )}
           </div>
        )}
      </div>

      {/* BOTTOM NAVIGATION BAR */}
      <div className="bg-white border-t border-slate-200 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] z-40 relative">
        {/* DRIVER NAVIGATION */}
        {appState.currentUserRole === UserRole.DRIVER && !['JOB_DETAIL', 'LEDGER'].includes(driverTab) && (
           <div className="flex justify-between items-center px-6 py-2 pb-5 md:pb-2">
              <button 
                onClick={() => setDriverTab('HOME')} 
                className={`flex flex-col items-center gap-1 p-2 transition-all ${driverTab === 'HOME' ? 'text-emerald-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
              >
                 <LayoutGrid size={22} strokeWidth={driverTab === 'HOME' ? 2.5 : 2} />
                 <span className="text-[9px] font-bold uppercase tracking-wide">หน้าหลัก</span>
              </button>
              
              <button 
                onClick={() => setDriverTab('MARKET')} 
                className={`flex flex-col items-center gap-1 p-2 transition-all ${driverTab === 'MARKET' ? 'text-emerald-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
              >
                 <Search size={22} strokeWidth={driverTab === 'MARKET' ? 2.5 : 2} />
                 <span className="text-[9px] font-bold uppercase tracking-wide">ตลาดงาน</span>
              </button>

              <button 
                onClick={() => setDriverTab('WALLET')} 
                className={`flex flex-col items-center gap-1 p-2 transition-all ${driverTab === 'WALLET' ? 'text-emerald-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
              >
                 <Wallet size={22} strokeWidth={driverTab === 'WALLET' ? 2.5 : 2} />
                 <span className="text-[9px] font-bold uppercase tracking-wide">กระเป๋าเงิน</span>
              </button>

              <button 
                onClick={() => setDriverTab('WELFARE')} 
                className={`flex flex-col items-center gap-1 p-2 transition-all ${driverTab === 'WELFARE' ? 'text-emerald-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
              >
                 <Heart size={22} strokeWidth={driverTab === 'WELFARE' ? 2.5 : 2} />
                 <span className="text-[9px] font-bold uppercase tracking-wide">สิทธิประโยชน์</span>
              </button>
           </div>
        )}

        {/* OPERATOR NAVIGATION */}
        {appState.currentUserRole === UserRole.OPERATOR && !['JOB_DETAIL'].includes(operatorTab) && (
           <div className="flex justify-around items-center px-6 py-2 pb-5 md:pb-2">
              <button 
                onClick={() => setOperatorTab('JOB_HUB')} 
                className={`flex flex-col items-center gap-1 p-2 transition-all ${operatorTab === 'JOB_HUB' ? 'text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
              >
                 <LayoutGrid size={22} strokeWidth={operatorTab === 'JOB_HUB' ? 2.5 : 2} />
                 <span className="text-[9px] font-bold uppercase tracking-wide">งาน (Jobs)</span>
              </button>

              <div className="relative -top-5">
                <button 
                    onClick={() => setOperatorTab('HOME')} 
                    className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all active:scale-95 border-4 border-slate-50 ${operatorTab === 'HOME' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                >
                    <Home size={24} strokeWidth={2.5} />
                </button>
              </div>

              <button 
                onClick={() => setOperatorTab('LEDGER')} 
                className={`flex flex-col items-center gap-1 p-2 transition-all ${operatorTab === 'LEDGER' ? 'text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
              >
                 <History size={22} strokeWidth={operatorTab === 'LEDGER' ? 2.5 : 2} />
                 <span className="text-[9px] font-bold uppercase tracking-wide">ประวัติ</span>
              </button>
           </div>
        )}
      </div>

      {toasts.map(toast => (
         <Toast key={toast.id} message={toast.message} type={toast.type} />
      ))}
    </MobileFrame>
  );
}