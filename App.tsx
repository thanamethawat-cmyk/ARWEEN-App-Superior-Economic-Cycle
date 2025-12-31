import React, { useState, useEffect, useRef } from 'react';
import { MobileFrame } from './components/MobileFrame';
import { AppState, JobState, UserRole, Job, CONSTANTS, LedgerEntry } from './types';
import { INITIAL_STATE, fundJob, acceptJob, verifyPickup, processPhase1Payout, completeJob, processPhase2Payout, settleDriverFunds, createJob, raiseDispute, resolveDispute } from './services/stateMachine';
import { Wallet, Truck, ShieldAlert, FileCheck, RefreshCw, User, Settings, AlertTriangle, ArrowRight, Activity, Globe, Scale, X, Package, Lock, Clock, CircleCheck, AlertOctagon, Gavel, ShieldCheck, Shield, Award, MapPin, Camera, Banknote, Heart, Landmark, Leaf, FileText, Plus, ChevronRight, Info, Siren, Zap, History, ScanLine, BarChart3, PieChart as PieChartIcon, Search, Download, Sparkles, Printer, Share2, ExternalLink, Map as MapIcon, Navigation, HardHat, TrendingUp } from 'lucide-react';
import { validateProofOfWork, getStrategicAdvice, generateComplianceReport } from './services/geminiService';

// --- SHARED UI COMPONENTS ---

const RoleSwitcher = ({ currentRole, onSwitch }: { currentRole: UserRole, onSwitch: (r: UserRole) => void }) => (
  <div className="bg-slate-900 text-white p-2 flex justify-between items-center text-xs z-40 shadow-md">
    <span className="font-bold tracking-wider text-slate-400 flex items-center gap-1">
      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
      ARWEEN OS <span className="text-[9px] opacity-50 uppercase">{currentRole}</span>
    </span>
    <div className="flex gap-1 bg-slate-800 p-0.5 rounded-lg">
      {(Object.keys(UserRole) as Array<keyof typeof UserRole>).map((role) => (
        <button
          key={role}
          onClick={() => onSwitch(UserRole[role])}
          className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${currentRole === UserRole[role] ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
        >
          {role === 'OPERATOR' ? 'ผู้ประกอบการ' : 'คนขับ'}
        </button>
      ))}
    </div>
  </div>
);

const Toast: React.FC<{ message: string, type: 'info' | 'success' | 'danger' }> = ({ message, type }) => (
  <div className={`absolute bottom-24 left-4 right-4 px-4 py-3 rounded-xl shadow-2xl text-[11px] font-bold flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 border ${
    type === 'success' ? 'bg-emerald-900/95 border-emerald-500 text-white' : 
    type === 'danger' ? 'bg-red-900/95 border-red-500 text-white' :
    'bg-slate-800/95 border-slate-600 text-white'
  }`}>
    <div className={`p-1.5 rounded-full flex-shrink-0 ${
      type === 'success' ? 'bg-emerald-500' : 
      type === 'danger' ? 'bg-red-500' :
      'bg-blue-500'
    }`}>
        {type === 'success' ? <CircleCheck size={14} /> : 
         type === 'danger' ? <Siren size={14} /> :
         <Activity size={14} />}
    </div>
    <span className="leading-tight">{message}</span>
  </div>
);

const AnimatedNumber = ({ value, className }: { value: number, className?: string }) => {
  return (
    <span className={`inline-block font-mono ${className}`}>
      ฿{value.toLocaleString('th-TH')}
    </span>
  );
};

const TrustBadge = ({ score }: { score: number }) => {
  const tier = score >= 95 ? 'Gold' : score >= 85 ? 'Silver' : 'Basic';
  const color = score >= 95 ? 'text-yellow-700 bg-yellow-100 border-yellow-200' : score >= 85 ? 'text-slate-700 bg-slate-100 border-slate-200' : 'text-red-700 bg-red-100 border-red-200';
  const Icon = score >= 95 ? Award : score >= 85 ? ShieldCheck : ShieldAlert;

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${color} shadow-sm`}>
      <Icon size={12} strokeWidth={2.5} />
      <div className="flex flex-col leading-none">
        <span className="text-[7px] uppercase font-bold tracking-wider opacity-60">Reputation</span>
        <span className="text-[10px] font-black">{score}%</span>
      </div>
    </div>
  );
};

const StatusBadge = ({ state }: { state: JobState }) => {
  const styles: Record<string, string> = {
    [JobState.CREATED]: 'bg-slate-100 text-slate-600',
    [JobState.FUNDED]: 'bg-emerald-600 text-white',
    [JobState.ACCEPTED]: 'bg-indigo-600 text-white',
    [JobState.IN_PROGRESS]: 'bg-purple-100 text-purple-700',
    [JobState.PICKUP_VERIFIED]: 'bg-amber-100 text-amber-800',
    [JobState.PHASE1_PAID]: 'bg-emerald-100 text-emerald-800',
    [JobState.COMPLETED]: 'bg-emerald-600 text-white',
    [JobState.PHASE2_FUNDED]: 'bg-blue-600 text-white',
    [JobState.DISPUTE]: 'bg-red-600 text-white animate-pulse',
  };
  
  const labels: Record<string, string> = {
    [JobState.CREATED]: 'Draft',
    [JobState.FUNDED]: 'Funded',
    [JobState.ACCEPTED]: 'Active',
    [JobState.IN_PROGRESS]: 'In Transit',
    [JobState.PICKUP_VERIFIED]: 'Verified',
    [JobState.PHASE1_PAID]: 'Ph1 Paid',
    [JobState.COMPLETED]: 'Completed',
    [JobState.PHASE2_FUNDED]: 'Pending Clear',
    [JobState.DISPUTE]: 'STOPPED',
  };

  return (
    <span className={`px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-widest ${styles[state] || 'bg-gray-100'}`}>
      {labels[state] || state}
    </span>
  );
};

// --- MAP COMPONENT ---

const RouteMap = ({ origin, destination }: { origin: string, destination: string }) => {
  return (
    <div className="w-full h-40 bg-slate-200 rounded-3xl relative overflow-hidden border border-slate-300 shadow-inner group">
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
      
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
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

      <div className="absolute left-[50px] top-[110px] flex flex-col items-center">
        <div className="bg-white p-1 rounded-full shadow-lg border border-slate-200 animate-bounce">
          <MapPin size={16} className="text-emerald-600" />
        </div>
        <div className="bg-slate-900/80 backdrop-blur-sm text-white text-[8px] font-black px-2 py-0.5 rounded-full mt-1">
          {origin}
        </div>
      </div>

      <div className="absolute right-[50px] top-[70px] flex flex-col items-center">
        <div className="bg-white p-1 rounded-full shadow-lg border border-slate-200">
          <Navigation size={16} className="text-indigo-600 rotate-45" />
        </div>
        <div className="bg-slate-900/80 backdrop-blur-sm text-white text-[8px] font-black px-2 py-0.5 rounded-full mt-1">
          {destination}
        </div>
      </div>

      <div className="absolute bottom-3 right-3 bg-white/60 backdrop-blur-sm p-1.5 rounded-xl border border-white/50 shadow-sm flex items-center gap-1.5">
         <Globe size={10} className="text-slate-500" />
         <span className="text-[7px] font-bold text-slate-600 uppercase tracking-widest">ARWEEN Tracking Active</span>
      </div>
    </div>
  );
};

// --- RISK ASSESSMENT COMPONENT ---

const RiskAssessment = ({ job }: { job: Job }) => {
  const risks = [];

  // High Value Cargo logic
  if (job.valueTotal >= 5000) {
    risks.push({
      id: 'high-value',
      icon: AlertTriangle,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
      title: 'High-Value Asset',
      desc: 'สัญญามีมูลค่าสูง ต้องมีการยืนยันตัวตนคนขับผ่าน Biometrics เพิ่มเติม'
    });
  }

  // Complex Route logic
  if (job.riskScore > 40) {
    risks.push({
      id: 'route-complex',
      icon: TrendingUp,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
      title: 'Dense Route Profile',
      desc: 'เส้นทางผ่านเขตนิคมอุตสาหกรรมหนาแน่น อาจมีความเสี่ยงด้านการจราจร'
    });
  }

  // Generic Safety requirement
  risks.push({
    id: 'safety-audit',
    icon: HardHat,
    color: 'text-slate-600 bg-slate-50 border-slate-100',
    title: 'Cargo Integrity Audit',
    desc: 'ระบบ AI จะสุ่มตรวจภาพถ่ายสินค้า 3 ครั้งระหว่างการเดินทาง'
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Risk Assessment</h4>
        <div className={`text-[10px] font-black ${job.riskScore < 30 ? 'text-emerald-500' : 'text-amber-500'}`}>
           Risk Index: {job.riskScore}%
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {risks.map(risk => (
          <div key={risk.id} className={`p-4 rounded-2xl border flex gap-3 items-start animate-in fade-in slide-in-from-left-2 duration-300 ${risk.color}`}>
            <div className="p-1.5 rounded-lg bg-white shadow-sm flex-shrink-0">
               <risk.icon size={14} strokeWidth={2.5}/>
            </div>
            <div>
               <div className="text-[10px] font-black uppercase tracking-wide leading-none mb-1">{risk.title}</div>
               <p className="text-[10px] leading-tight opacity-75">{risk.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- MODALS & SPECIAL VIEWS ---

const JobDetailsView = ({ job, onBack, onAction }: { job: Job, onBack: () => void, onAction: (type: string, id: string) => void }) => {
  return (
    <div className="flex flex-col h-full bg-slate-50 animate-in slide-in-from-right-10 duration-300">
      <div className="bg-white p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex flex-col">
           <div className="flex items-center gap-3">
             <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-all"><ChevronRight className="rotate-180" size={20}/></button>
             <h3 className="font-bold text-slate-800">Job Detail</h3>
           </div>
           <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest pl-12 -mt-1">Verified Mission Profile</p>
        </div>
        <StatusBadge state={job.state} />
      </div>

      <div className="flex-1 p-5 space-y-6 overflow-y-auto pb-10 no-scrollbar">
        {/* Map Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Route Overview</h4>
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
               <Navigation size={10}/> GPS Encrypted
            </span>
          </div>
          <RouteMap origin={job.origin} destination={job.destination} />
        </div>

        {/* Info Card */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div>
            <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-1">Mission Identifier</div>
            <div className="text-xs font-mono font-black text-slate-400">{job.id}</div>
            <h2 className="text-lg font-black text-slate-900 mt-2 leading-tight">{job.title}</h2>
          </div>

          <div className="grid grid-cols-2 gap-6">
             <div>
                <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Payout Schedule</div>
                <div className="space-y-1.5">
                   <div className="flex justify-between text-[10px]">
                      <span className="text-slate-500">Immediate:</span>
                      <span className="font-black text-emerald-600">฿{(job.valueTotal/2).toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between text-[10px]">
                      <span className="text-slate-500">T+1 Settlement:</span>
                      <span className="font-black text-amber-600">฿{(job.valueTotal/2).toLocaleString()}</span>
                   </div>
                </div>
             </div>
             <div>
                <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Incentives</div>
                <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-2xl border border-emerald-100">
                   <Leaf size={14} className="text-emerald-500" />
                   <span className="text-[10px] font-black text-emerald-700">+{job.projectedCarbonCredits} Credits</span>
                </div>
             </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-50">
             <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                <div>
                   <div className="text-[9px] font-bold text-slate-400 uppercase">Load Location</div>
                   <div className="text-xs font-bold text-slate-700">{job.origin}</div>
                </div>
             </div>
             <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5"></div>
                <div>
                   <div className="text-[9px] font-bold text-slate-400 uppercase">Delivery Location</div>
                   <div className="text-xs font-bold text-slate-700">{job.destination}</div>
                </div>
             </div>
          </div>
        </div>

        {/* Risk Assessment Section */}
        <RiskAssessment job={job} />

        {/* Contextual Actions */}
        <div className="space-y-3 pt-4">
          {job.state === JobState.FUNDED && !job.driverId && (
            <button 
              onClick={() => onAction('ACCEPT_JOB', job.id)}
              className="w-full bg-slate-900 text-white py-4.5 rounded-[2rem] font-black text-sm shadow-xl active:scale-95 transition-all"
            >
               Accept Mission & Secure Funds
            </button>
          )}

          {job.state === JobState.ACCEPTED && (
            <button 
              onClick={() => onAction('VERIFY_PICKUP', job.id)}
              className="w-full bg-emerald-600 text-white py-4.5 rounded-[2rem] font-black text-sm shadow-xl shadow-emerald-200 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
               <Camera size={20}/> Photo Verification: Pickup
            </button>
          )}

          {job.state === JobState.PHASE1_PAID && (
            <button 
              onClick={() => onAction('COMPLETE_JOB', job.id)}
              className="w-full bg-indigo-600 text-white py-4.5 rounded-[2rem] font-black text-sm shadow-xl shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
               <ScanLine size={20}/> Scan Proof: Delivery
            </button>
          )}

          <button className="w-full bg-white text-slate-600 py-3.5 rounded-[1.5rem] font-bold text-xs border border-slate-100 flex items-center justify-center gap-2 shadow-sm">
             <Info size={16}/> View Terms & Conditions
          </button>
        </div>
      </div>
    </div>
  );
};

const LedgerHistory = ({ ledger, onBack }: { ledger: LedgerEntry[], onBack: () => void }) => (
  <div className="flex flex-col h-full bg-slate-50 animate-in fade-in duration-300">
     <div className="bg-white p-4 border-b border-slate-100 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-all"><ChevronRight className="rotate-180" size={20}/></button>
        <h3 className="font-bold text-slate-800">ประวัติธุรกรรม (Ledger)</h3>
     </div>
     <div className="p-4 space-y-3 overflow-y-auto no-scrollbar">
      {ledger.length === 0 ? (
          <div className="py-20 text-center">
             <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3"><History size={24} className="text-slate-300"/></div>
             <p className="text-slate-400 text-xs font-medium">ยังไม่มีรายการธุรกรรมในบัญชี</p>
          </div>
      ) : (
          ledger.map(entry => (
            <div key={entry.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center group active:scale-[0.98] transition-transform">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl flex-shrink-0 ${entry.type === 'CREDIT' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      {entry.type === 'CREDIT' ? <ArrowRight size={16}/> : <ArrowRight className="rotate-180" size={16}/>}
                  </div>
                  <div>
                      <div className="text-[11px] font-bold text-slate-800 leading-tight">{entry.description}</div>
                      <div className="text-[9px] text-slate-400 mt-1 font-mono">{new Date(entry.timestamp).toLocaleTimeString('th-TH')} • {entry.relatedJobId || 'System'}</div>
                  </div>
                </div>
                <div className={`text-xs font-black ${entry.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-500'}`}>
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
    <div className="p-5 space-y-6 h-full flex flex-col bg-white animate-in slide-in-from-bottom-5 duration-300">
       <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-all"><X size={20}/></button>
          <h3 className="font-bold text-slate-800">สร้างสัญญา Smart e-Contract</h3>
       </div>
       <div className="flex-1 space-y-5 overflow-y-auto no-scrollbar">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
             <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">ชื่อสัญญา / รายการสินค้า</label>
             <input value={title} onChange={e => setTitle(e.target.value)} placeholder="เช่น ขนส่งเคมีภัณฑ์อุตสาหกรรม #A12" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">ต้นทาง (Origin)</label>
                <input value={origin} onChange={e => setOrigin(e.target.value)} placeholder="นิคมฯ มาบตาพุด" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm" />
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">ปลายทาง (Dest.)</label>
                <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="ท่าเรือแหลมฉบัง" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm" />
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
             <div className="flex justify-between items-center mb-1.5">
               <label className="text-[10px] font-bold text-slate-400 uppercase">มูลค่าสัญญารวม (บาท)</label>
               <span className="text-[10px] font-bold text-emerald-600">Phase 1 (50%) | Phase 2 (50%)</span>
             </div>
             <input type="number" value={value} onChange={e => setValue(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-lg font-black font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm" />
          </div>
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-3">
             <div className="bg-emerald-500 p-2 h-fit rounded-lg text-white"><Leaf size={16}/></div>
             <div>
                <div className="text-[10px] font-bold text-emerald-800 uppercase">Green Incentive</div>
                <p className="text-[10px] text-emerald-600 leading-tight mt-0.5">สัญญาใบนี้จะสร้างคะแนน Carbon Credits ประมาณ {Math.floor(value/100)} คะแนน เพื่อใช้ลดหย่อนภาษี</p>
             </div>
          </div>
       </div>
       <button 
         disabled={!isValid}
         onClick={() => onCreate({ title, valueTotal: value, origin, destination, projectedCarbonCredits: Math.floor(value / 100) })} 
         className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${isValid ? 'bg-slate-900 text-white shadow-slate-300 active:scale-[0.98]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
       >
          <Lock size={18}/> สร้างสัญญา & ผูกมัดงบประมาณ
       </button>
    </div>
  );
};

const ComplianceModal = ({ content, onClose }: { content: string, onClose: () => void }) => (
  <div className="absolute inset-0 z-[60] bg-slate-900/95 flex flex-col p-6 animate-in fade-in duration-300">
    <div className="flex justify-between items-center mb-6">
       <div className="flex items-center gap-2">
         <div className="p-2 bg-emerald-500 rounded-xl text-white"><FileCheck size={20}/></div>
         <h3 className="text-white font-bold text-base leading-tight">Digital Compliance Summary</h3>
       </div>
       <button onClick={onClose} className="p-2 text-white/50 hover:text-white transition-colors"><X/></button>
    </div>
    <div className="flex-1 overflow-y-auto bg-white rounded-3xl p-6 shadow-2xl text-slate-800 font-sans text-xs leading-relaxed whitespace-pre-wrap no-scrollbar">
        <div className="whitespace-pre-wrap">{content}</div>
    </div>
    <div className="mt-6 grid grid-cols-2 gap-3">
       <button className="bg-white/10 text-white py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-white/20 transition-all border border-white/20">
          <Share2 size={16}/> ส่งทางอีเมล
       </button>
       <button className="bg-emerald-600 text-white py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-emerald-900/40 hover:bg-emerald-500 transition-all active:scale-95">
          <Download size={16}/> บันทึกเอกสาร
       </button>
    </div>
    <div className="text-[8px] text-slate-500 text-center mt-4 flex items-center justify-center gap-1">
      <ShieldCheck size={10}/> ข้อมูลรับรองโดย ARWEEN Private OS • ยืนยันผ่าน Blockchain Hash
    </div>
  </div>
);

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
        });
    }
  }, []);

  return (
    <div className="absolute inset-0 z-50 bg-slate-900/90 flex items-center justify-center p-6 backdrop-blur-md">
      <div className="bg-white w-full rounded-3xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200 max-w-[320px]">
        <div className="p-8 text-center">
           {step === 'PROCESSING' && (
             <div className="py-4">
               <div className="w-16 h-16 border-[5px] border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
               <h3 className="text-base font-bold text-slate-800">AI กำลังวิเคราะห์ข้อมูล</h3>
               <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">กำลังเปรียบเทียบพิกัด GPS และตรวจสอบความสมบูรณ์ของภาพถ่ายหลักฐาน...</p>
             </div>
           )}

           {step === 'SUCCESS' && (
             <div className="py-2 animate-in fade-in duration-500">
               <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5">
                 <ShieldCheck size={36} />
               </div>
               <h3 className="text-base font-bold text-emerald-700">ยืนยันหลักฐานสำเร็จ</h3>
               <div className="text-[10px] text-slate-500 mt-3 mb-8 bg-slate-50 p-4 rounded-2xl text-left font-medium leading-relaxed whitespace-pre-line border border-slate-100">
                 {message}
               </div>
               <button onClick={onConfirm} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-500 active:scale-[0.98] transition-all">
                 ดำเนินการขั้นตอนถัดไป
               </button>
             </div>
           )}

          {step === 'FAILED' && (
             <div className="py-2 animate-in fade-in duration-500">
               <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-5">
                 <AlertOctagon size={36} />
               </div>
               <h3 className="text-base font-bold text-red-700">การตรวจสอบไม่ผ่าน</h3>
               <p className="text-[11px] text-slate-500 mt-3 mb-8 px-2">{message}</p>
               <button onClick={onClose} className="w-full bg-slate-200 text-slate-700 py-4 rounded-2xl font-bold hover:bg-slate-300 transition-all active:scale-[0.98]">
                 ปิดและลองใหม่อีกครั้ง
               </button>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENTS ---

const AIStrategicCard = ({ role, appState }: { role: UserRole, appState: AppState }) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAdvice = async () => {
    setLoading(true);
    const res = await getStrategicAdvice(role, appState);
    setAdvice(res);
    setLoading(false);
  };

  return (
    <div className="bg-indigo-900 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden group border border-white/10">
       <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-700 pointer-events-none"><Sparkles size={100}/></div>
       <div className="relative z-10">
          <div className="flex justify-between items-center mb-4">
             <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-300 flex items-center gap-1.5">
               <Zap size={12} className="fill-indigo-400"/> Strategic Insight
             </div>
             {!advice && !loading && (
                <button onClick={fetchAdvice} className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-[9px] font-bold transition-all border border-white/20">
                   Generate Advice
                </button>
             )}
          </div>
          
          {loading ? (
             <div className="flex items-center gap-3 py-4">
                <RefreshCw size={18} className="animate-spin text-indigo-300"/>
                <div className="text-[11px] font-medium text-indigo-100 italic">กำลังวิเคราะห์ข้อมูลเชิงลึกด้วย AI...</div>
             </div>
          ) : advice ? (
             <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-500">
                <div className="text-[11px] leading-relaxed text-indigo-50 font-medium whitespace-pre-line">
                  {advice}
                </div>
                <button onClick={() => setAdvice(null)} className="mt-4 text-[9px] text-indigo-300 font-bold hover:text-white transition-colors flex items-center gap-1">
                  ปิดคำแนะนำ <X size={10}/>
                </button>
             </div>
          ) : (
             <div className="text-sm font-bold leading-tight">ใช้พลังของ Gemini AI ช่วยวางแผนการบริหารจัดการและการเข้าถึงแหล่งเงินทุนธนาคาร</div>
          )}
       </div>
    </div>
  );
};

export default function App() {
  const [appState, setAppState] = useState<AppState>(INITIAL_STATE);
  const [driverTab, setDriverTab] = useState<'HOME' | 'MARKET' | 'WALLET' | 'WELFARE' | 'LEDGER' | 'JOB_DETAIL'>('HOME');
  const [operatorTab, setOperatorTab] = useState<'JOB_HUB' | 'CREATE' | 'LEDGER' | 'JOB_DETAIL'>('JOB_HUB');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Array<{id: number, message: string, type: 'info' | 'success' | 'danger'}>>([]);
  const [activeVerification, setActiveVerification] = useState<{type: 'PICKUP'|'DELIVERY', jobId: string} | null>(null);
  const [complianceReport, setComplianceReport] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  
  const addToast = (message: string, type: 'info' | 'success' | 'danger' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const generateReport = async () => {
    setExportLoading(true);
    const res = await generateComplianceReport(appState.currentUserRole, appState);
    setComplianceReport(res);
    setExportLoading(false);
  };

  const handleAction = (type: string, payload: any) => {
    try {
      let newState = { ...appState };
      switch (type) {
        case 'CREATE_JOB':
          newState = createJob(newState, payload);
          addToast("สัญญา e-Contract ถูกสร้างและบันทึกในระบบเรียบร้อย", "info");
          setOperatorTab('JOB_HUB');
          break;
        case 'FUND_JOB':
          newState = fundJob(newState, payload);
          addToast("งบประมาณถูกล็อกใน Escrow สำเร็จ เพื่อค้ำประกันการจ่ายเงินให้คนขับ", "success");
          break;
        case 'ACCEPT_JOB':
          newState = acceptJob(newState, payload, 'u_dr_001');
          addToast("คุณได้รับงานใหม่แล้ว รายได้ครึ่งแรกถูกล็อกเพื่อคุณในระบบทันที", "success");
          setDriverTab('HOME');
          setSelectedJobId(null);
          break;
        case 'VERIFY_PICKUP':
          setActiveVerification({ type: 'PICKUP', jobId: payload });
          break;
        case 'CONFIRM_VERIFY_PICKUP':
           newState = verifyPickup(newState, payload);
           addToast("AI ตรวจสอบสำเร็จ ปลดล็อกรายได้งวดที่ 1 (50%) เข้ากระเป๋าของคุณทันที", "success");
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
          addToast("งานเสร็จสมบูรณ์! รายได้ส่วนที่เหลือ (50%) อยู่ในระหว่างการเคลียริ่ง T+1", "success");
          setTimeout(() => {
            setAppState(prev => processPhase2Payout(prev, payload));
          }, 500);
          setActiveVerification(null);
          break;
        case 'SETTLE_FUNDS':
          setIsSettling(true);
          setTimeout(() => {
            setAppState(prev => settleDriverFunds(prev));
            addToast("การเคลียริ่ง T+1 สำเร็จ ยอดเงินพร้อมถอนเข้าบัญชีธนาคารแล้ว", "success");
            setIsSettling(false);
          }, 1500);
          break;
        case 'OVERRIDE_JOB':
          newState = raiseDispute(newState, payload, "Safety Stop triggered by Operator");
          addToast("คำสั่งระงับการเดินรถฉุกเฉินถูกส่งถึงคนขับทันที!", "danger");
          break;
      }
      setAppState(newState);
    } catch (e: any) {
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
      }} />
      
      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto bg-slate-50 no-scrollbar pb-24 h-full font-sans relative">
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
          <div className="p-5 space-y-6 h-full flex flex-col">
            {driverTab !== 'JOB_DETAIL' && (
              <div className="flex justify-between items-end mb-2">
                 <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">
                      {driverTab === 'HOME' && 'Active Mission'}
                      {driverTab === 'MARKET' && 'Job Hub'}
                      {driverTab === 'WALLET' && 'Smart Wallet'}
                      {driverTab === 'WELFARE' && 'Welfare'}
                      {driverTab === 'LEDGER' && 'Journal'}
                    </h1>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                      Verified Driver Profile
                    </p>
                 </div>
                 <TrustBadge score={appState.driverWallet.reputation} />
              </div>
            )}

            {driverTab === 'HOME' && (
               <>
                 <AIStrategicCard role={UserRole.DRIVER} appState={appState} />
                 
                 <div className="bg-emerald-600 rounded-[2rem] p-6 text-white shadow-xl shadow-emerald-200 relative overflow-hidden active:scale-[0.98] transition-transform">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Lock size={120}/></div>
                    <div className="relative z-10">
                       <div className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                         <ShieldCheck size={12}/> Guaranteed Income
                       </div>
                       <div className="text-4xl font-black"><AnimatedNumber value={appState.driverWallet.balanceReserved} /></div>
                       <div className="mt-6 flex items-center gap-2">
                          <div className="bg-emerald-700/50 backdrop-blur-sm px-3 py-1.5 rounded-xl text-[9px] font-bold">
                             Secure Smart Escrow
                          </div>
                          <div className="text-[9px] text-emerald-100 font-medium">Locked & Verified</div>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                      <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ongoing Missions</h3>
                      <button onClick={() => setDriverTab('MARKET')} className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">Find more <ChevronRight size={12}/></button>
                    </div>
                    
                    {activeDriverJobs.length === 0 ? (
                       <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3"><Truck size={24} className="text-slate-300"/></div>
                          <p className="text-slate-400 text-xs font-bold leading-tight">คุณยังไม่มีงานที่รับผิดชอบ<br/>ไปค้นหาที่ตลาดงานสิ!</p>
                       </div>
                    ) : (
                       activeDriverJobs.map(job => (
                          <div 
                            key={job.id} 
                            onClick={() => { setSelectedJobId(job.id); setDriverTab('JOB_DETAIL'); }}
                            className={`bg-white p-5 rounded-3xl border ${job.state === JobState.DISPUTE ? 'border-red-300 bg-red-50' : 'border-slate-100'} shadow-sm relative overflow-hidden active:scale-[0.98] transition-all cursor-pointer`}
                          >
                             {job.state === JobState.DISPUTE && (
                                <div className="absolute top-0 right-0 p-3 text-red-600"><Siren size={20} className="animate-ping"/></div>
                             )}
                             <div className="flex justify-between items-start mb-3">
                                <StatusBadge state={job.state}/>
                                <span className="text-[9px] font-mono font-bold text-slate-300">{job.id}</span>
                             </div>
                             <div className="font-black text-slate-800 text-sm mb-1">{job.title}</div>
                             <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                                <MapPin size={10} className="text-slate-400"/> {job.origin} → {job.destination}
                             </div>
                          </div>
                       ))
                    )}
                 </div>
               </>
            )}

            {driverTab === 'MARKET' && (
               <div className="space-y-4 pb-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-3 shadow-sm">
                    <Search size={18} className="text-slate-400"/>
                    <input placeholder="ค้นหาตามพิกัดหรือชื่อโครงการ..." className="bg-transparent text-xs w-full focus:outline-none"/>
                  </div>
                  {appState.jobs.filter(j => j.state === JobState.FUNDED && !j.driverId).map(job => (
                    <div 
                      key={job.id} 
                      onClick={() => { setSelectedJobId(job.id); setDriverTab('JOB_DETAIL'); }}
                      className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm group hover:border-emerald-300 transition-all active:scale-[0.98] cursor-pointer"
                    >
                       <div className="p-5 border-b border-slate-50">
                          <div className="flex justify-between mb-2">
                             <div className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest border border-emerald-100">Escrow Ready</div>
                             <div className="text-[10px] font-black text-slate-800">฿{job.valueTotal.toLocaleString()}</div>
                          </div>
                          <h4 className="font-bold text-slate-800 text-sm mb-1">{job.title}</h4>
                          <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5">
                             <MapPin size={10} className="text-slate-400"/> {job.origin} → {job.destination}
                          </div>
                       </div>
                       <div className="p-4 bg-slate-50/50 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">View Map & Details</span>
                          <ChevronRight size={16} className="text-slate-300" />
                       </div>
                    </div>
                  ))}
               </div>
            )}

            {driverTab === 'WALLET' && (
               <div className="space-y-6">
                  {/* Main Card: Available */}
                  <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-6 opacity-20"><Wallet size={120}/></div>
                     <div className="relative z-10">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Available Balance</div>
                        <div className="text-5xl font-black tracking-tighter mb-6"><AnimatedNumber value={appState.driverWallet.balanceAvailable}/></div>
                        
                        <div className="flex gap-3">
                           <button className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white py-3 rounded-xl text-xs font-black shadow-lg shadow-emerald-900/20 active:scale-95 transition-all">Withdraw</button>
                           <button onClick={() => setDriverTab('LEDGER')} className="px-5 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl text-xs font-black backdrop-blur-sm active:scale-95 transition-all"><History size={18}/></button>
                        </div>
                     </div>
                  </div>
                  
                  {/* Breakdown Grid */}
                  <div className="grid grid-cols-1 gap-3">
                     {/* Reserved Funds */}
                     <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600"><Lock size={20}/></div>
                           <div>
                              <div className="text-xs font-black text-slate-800">Reserved Funds</div>
                              <div className="text-[10px] text-slate-400 font-medium">Locked in Escrow</div>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className="text-lg font-black text-slate-800">฿{appState.driverWallet.balanceReserved.toLocaleString()}</div>
                        </div>
                     </div>

                     {/* Pending Settlement */}
                     <div className={`bg-amber-50 p-5 rounded-[2rem] border border-amber-100 shadow-sm flex justify-between items-center transition-all ${isSettling ? 'animate-pulse opacity-70' : ''}`}>
                        <div className="flex items-center gap-4">
                           <div className="bg-amber-100 p-3 rounded-2xl text-amber-600"><Clock size={20}/></div>
                           <div>
                              <div className="text-xs font-black text-amber-900">Pending Settlement</div>
                              <div className="text-[10px] text-amber-700 font-medium">Clearing (T+1)</div>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className="text-lg font-black text-amber-600">฿{appState.driverWallet.balancePending.toLocaleString()}</div>
                           {appState.driverWallet.balancePending > 0 && (
                              <button onClick={() => handleAction('SETTLE_FUNDS', null)} className="text-[9px] font-bold text-amber-800 underline decoration-amber-300 block mt-1">Fast Settle</button>
                           )}
                        </div>
                     </div>
                  </div>

                   {/* Total Assets Summary */}
                   <div className="px-4 py-2 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Asset Value</span>
                      <span className="text-sm font-black text-slate-600">฿{(appState.driverWallet.balanceAvailable + appState.driverWallet.balanceReserved + appState.driverWallet.balancePending).toLocaleString()}</span>
                   </div>
               </div>
            )}

            {driverTab === 'WELFARE' && (
               <div className="space-y-6">
                  <div className="bg-slate-900 p-7 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                     <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                           <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Green Tax Shield</div>
                              <div className="text-3xl font-black text-emerald-400">{appState.driverWallet.carbonPoints} pts</div>
                           </div>
                           <Leaf className="text-emerald-500/50 fill-emerald-500/10" size={32}/>
                        </div>
                        <div className="bg-slate-800/80 p-4 rounded-2xl border border-white/5">
                           <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase mb-2">
                              <span>Estimated Tax Deduction</span>
                              <span className="text-white">฿{(appState.driverWallet.carbonPoints * CONSTANTS.CARBON_POINT_VALUE_THB).toLocaleString()}</span>
                           </div>
                           <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 w-[65%] rounded-full"></div>
                           </div>
                        </div>
                     </div>
                  </div>
                  
                  <div className="space-y-3">
                     <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="bg-blue-100 p-2.5 rounded-2xl text-blue-600"><Landmark size={20}/></div>
                           <div>
                              <div className="text-xs font-black text-slate-800">Credit Score</div>
                              <div className="text-[10px] text-slate-500 font-medium">Ready for Bank Loan</div>
                           </div>
                        </div>
                        <div className="text-sm font-black text-blue-600">{appState.driverWallet.creditScore}</div>
                     </div>
                     <button onClick={generateReport} disabled={exportLoading} className="w-full bg-slate-900 text-white py-4.5 rounded-[2rem] font-black text-sm flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
                        {exportLoading ? <RefreshCw className="animate-spin" size={20}/> : <FileCheck size={20}/>}
                        Export Compliance Pack
                     </button>
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
           <div className="p-5 space-y-6">
              {operatorTab === 'JOB_HUB' && (
                 <>
                    <div className="flex justify-between items-end mb-2">
                       <div>
                          <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Job Hub</h1>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Verified Operator Profile</p>
                       </div>
                       <TrustBadge score={appState.operatorWallet.reputation} />
                    </div>

                    <AIStrategicCard role={UserRole.OPERATOR} appState={appState} />

                    <div className="grid grid-cols-2 gap-3">
                       <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Ops Budget</div>
                          <div className="text-lg font-black text-slate-800">฿{appState.operatorWallet.balanceAvailable.toLocaleString()}</div>
                       </div>
                       <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100 shadow-sm">
                          <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1.5">In Escrow</div>
                          <div className="text-lg font-black text-emerald-700">฿{appState.operatorWallet.balanceEscrow.toLocaleString()}</div>
                       </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-8 px-1">
                       <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">e-Contract Pipeline</h3>
                       <button onClick={() => setOperatorTab('CREATE')} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-1.5 shadow-lg active:scale-95 transition-all">
                          <Plus size={14}/> สร้างงาน (Create Job)
                       </button>
                    </div>

                    <div className="space-y-4">
                       {appState.jobs.length === 0 ? (
                          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center text-slate-400 text-xs font-bold">No contracts found.</div>
                       ) : (
                          appState.jobs.map(job => (
                             <div 
                              key={job.id} 
                              onClick={() => { setSelectedJobId(job.id); setOperatorTab('JOB_DETAIL'); }}
                              className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-all group cursor-pointer active:scale-[0.98]"
                             >
                                <div className="flex justify-between items-start mb-3">
                                   <StatusBadge state={job.state}/>
                                   <div className="text-[10px] font-mono font-bold text-slate-300">{job.id}</div>
                                </div>
                                <div className="font-bold text-slate-800 text-sm mb-1">{job.title}</div>
                                <div className="text-[10px] text-slate-500 font-medium mb-4 flex items-center gap-1">
                                   <MapPin size={10}/> {job.origin} → {job.destination}
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                                   <div className="text-xs font-black text-slate-900">฿{job.valueTotal.toLocaleString()}</div>
                                   <div className="flex gap-2">
                                      {job.state === JobState.CREATED && (
                                         <button onClick={(e) => { e.stopPropagation(); handleAction('FUND_JOB', job.id); }} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black shadow-lg shadow-emerald-100 active:scale-95">Fund Escrow</button>
                                      )}
                                      {(job.state === JobState.IN_PROGRESS || job.state === JobState.ACCEPTED) && (
                                         <button onClick={(e) => { e.stopPropagation(); handleAction('OVERRIDE_JOB', job.id); }} className="bg-red-50 text-red-600 border border-red-100 px-3 py-2 rounded-xl text-[10px] font-black flex items-center gap-1.5 active:scale-95"><Siren size={14}/> Stop Cargo</button>
                                      )}
                                   </div>
                                </div>
                             </div>
                          ))
                       )}
                    </div>
                    <button onClick={generateReport} className="w-full mt-4 bg-slate-100 text-slate-600 py-4 rounded-[2rem] font-black text-xs flex items-center justify-center gap-2 hover:bg-slate-200 transition-all">
                       <FileText size={18}/> Export Private Audit Pack
                    </button>
                 </>
              )}

              {operatorTab === 'CREATE' && (
                 <CreateJobView onBack={() => setOperatorTab('JOB_HUB')} onCreate={(data) => handleAction('CREATE_JOB', data)} />
              )}
              
              {operatorTab === 'LEDGER' && (
                 <LedgerHistory ledger={appState.ledger} onBack={() => setOperatorTab('JOB_HUB')} />
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

      {/* BOTTOM NAV */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 h-20 flex justify-around items-center px-4 z-40">
        {appState.currentUserRole === UserRole.DRIVER ? (
          <>
            <button onClick={() => { setDriverTab('HOME'); setSelectedJobId(null); }} className={`flex flex-col items-center p-2 transition-all ${driverTab === 'HOME' ? 'text-emerald-600 scale-110' : 'text-slate-300 hover:text-slate-400'}`}>
               <ShieldCheck size={22} className={driverTab === 'HOME' ? 'fill-emerald-600/10' : ''} />
               <span className="text-[9px] mt-1 font-black uppercase tracking-tighter">Mission</span>
            </button>
            <button onClick={() => { setDriverTab('MARKET'); setSelectedJobId(null); }} className={`flex flex-col items-center p-2 transition-all ${driverTab === 'MARKET' ? 'text-emerald-600 scale-110' : 'text-slate-300 hover:text-slate-400'}`}>
               <Truck size={22} className={driverTab === 'MARKET' ? 'fill-emerald-600/10' : ''} />
               <span className="text-[9px] mt-1 font-black uppercase tracking-tighter">Hub</span>
            </button>
            <button onClick={() => { setDriverTab('WALLET'); setSelectedJobId(null); }} className={`flex flex-col items-center p-2 transition-all ${driverTab === 'WALLET' || driverTab === 'LEDGER' ? 'text-emerald-600 scale-110' : 'text-slate-300 hover:text-slate-400'}`}>
               <Wallet size={22} className={driverTab === 'WALLET' ? 'fill-emerald-600/10' : ''} />
               <span className="text-[9px] mt-1 font-black uppercase tracking-tighter">Wallet</span>
            </button>
            <button onClick={() => { setDriverTab('WELFARE'); setSelectedJobId(null); }} className={`flex flex-col items-center p-2 transition-all ${driverTab === 'WELFARE' ? 'text-emerald-600 scale-110' : 'text-slate-300 hover:text-slate-400'}`}>
               <Heart size={22} className={driverTab === 'WELFARE' ? 'fill-emerald-600/10' : ''} />
               <span className="text-[9px] mt-1 font-black uppercase tracking-tighter">Welfare</span>
            </button>
          </>
        ) : (
          <>
            <button onClick={() => { setOperatorTab('JOB_HUB'); setSelectedJobId(null); }} className={`flex flex-col items-center p-2 transition-all ${operatorTab === 'JOB_HUB' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}>
               <BarChart3 size={22} />
               <span className="text-[9px] mt-1 font-black uppercase tracking-tighter">Job Hub</span>
            </button>
            <button onClick={() => { setOperatorTab('CREATE'); setSelectedJobId(null); }} className={`flex flex-col items-center p-2 transition-all ${operatorTab === 'CREATE' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}>
               <Plus size={22} />
               <span className="text-[9px] mt-1 font-black uppercase tracking-tighter">Contract</span>
            </button>
            <button onClick={() => { setOperatorTab('LEDGER'); setSelectedJobId(null); }} className={`flex flex-col items-center p-2 transition-all ${operatorTab === 'LEDGER' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}>
               <History size={22} />
               <span className="text-[9px] mt-1 font-black uppercase tracking-tighter">Ledger</span>
            </button>
          </>
        )}
      </div>

      {toasts.map(toast => (
         <Toast key={toast.id} message={toast.message} type={toast.type} />
      ))}
    </MobileFrame>
  );
}