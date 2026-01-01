import { AppState, JobState, UserRole, Job, CONSTANTS, LedgerEntry } from '../types';

// --- AUDIT LOGGING SYSTEM ---
const logAudit = (level: 'INFO' | 'ERROR' | 'CRITICAL', action: string, details: any) => {
  const timestamp = new Date().toISOString();
  // In a real production app, this would send data to a centralized logging service (Datadog, Sentry, etc.)
  // For this government-grade simulation, we output structured logs to the console.
  if (level === 'ERROR' || level === 'CRITICAL') {
    console.group(`🚨 [ARWEEN SYSTEM AUDIT - ${level}] ${action}`);
    console.error(`Time: ${timestamp}`);
    console.error(`Details:`, details);
    console.groupEnd();
  } else {
    console.log(`[AUDIT] ${action}`, details);
  }
};

// Initial Mock Data
export const INITIAL_STATE: AppState = {
  currentUserRole: UserRole.DRIVER, // Set to Driver by default for this demo
  operatorWallet: {
    id: 'w_op_001',
    ownerId: 'u_op_001',
    balanceAvailable: 500000, // Increased budget for multiple jobs
    balanceEscrow: 150000,
    balanceReserved: 0,
    balancePending: 0,
    reputation: 85,
    creditScore: 0,
    carbonPoints: 120,
    taxWithheld: 0,
    tier: 'SILVER'
  },
  driverWallet: {
    id: 'w_dr_001',
    ownerId: 'u_dr_001',
    balanceAvailable: 1200,
    balanceEscrow: 0,
    balanceReserved: 0,
    balancePending: 0,
    reputation: 92,
    creditScore: 780,
    carbonPoints: 450,
    taxWithheld: 3500,
    tier: 'GOLD'
  },
  jobs: [
    {
      id: 'JOB-24-A001',
      title: 'ขนส่งชิ้นส่วนอิเล็กทรอนิกส์ High-Tech',
      operatorId: 'u_op_001',
      valueTotal: 8500,
      state: JobState.FUNDED,
      origin: 'นิคมฯ อมตะซิตี้ ระยอง',
      destination: 'ICD ลาดกระบัง',
      riskScore: 12,
      projectedCarbonCredits: 45,
      createdAt: new Date(Date.now() - 10000000).toISOString()
    },
    {
      id: 'JOB-24-A002',
      title: 'ผักและผลไม้สดโครงการหลวง (ห้องเย็น)',
      operatorId: 'u_op_001',
      valueTotal: 14500,
      state: JobState.FUNDED,
      origin: 'ศูนย์รวบรวมฯ เชียงใหม่',
      destination: 'ตลาดไท ปทุมธานี',
      riskScore: 25,
      projectedCarbonCredits: 120,
      createdAt: new Date(Date.now() - 9000000).toISOString()
    },
    {
      id: 'JOB-24-A003',
      title: 'ปูนซีเมนต์ผง Bulk 30 ตัน',
      operatorId: 'u_op_001',
      valueTotal: 6200,
      state: JobState.FUNDED,
      origin: 'โรงปูนแก่งคอย สระบุรี',
      destination: 'ไซตืก่อสร้าง บางซื่อ',
      riskScore: 15,
      projectedCarbonCredits: 30,
      createdAt: new Date(Date.now() - 8500000).toISOString()
    },
    {
      id: 'JOB-24-A004',
      title: 'สินค้าอุปโภคบริโภค (FMCG) เข้าศูนย์กระจายสินค้า',
      operatorId: 'u_op_001',
      valueTotal: 9800,
      state: JobState.FUNDED,
      origin: 'คลังสินค้าบางพลี สมุทรปราการ',
      destination: 'DC นครราชสีมา',
      riskScore: 10,
      projectedCarbonCredits: 85,
      createdAt: new Date(Date.now() - 8000000).toISOString()
    },
    {
      id: 'JOB-24-A005',
      title: 'อาหารทะเลแช่แข็งเพื่อการส่งออก',
      operatorId: 'u_op_001',
      valueTotal: 5500,
      state: JobState.FUNDED,
      origin: 'ตลาดทะเลไทย สมุทรสาคร',
      destination: 'Suvarnabhumi Free Zone',
      riskScore: 35, // Time sensitive
      projectedCarbonCredits: 20,
      createdAt: new Date(Date.now() - 7500000).toISOString()
    },
    {
      id: 'JOB-24-A006',
      title: 'ชิ้นส่วนยานยนต์ (JIT Delivery)',
      operatorId: 'u_op_001',
      valueTotal: 4800,
      state: JobState.FUNDED,
      origin: 'นิคมฯ แหลมฉบัง ชลบุรี',
      destination: 'โรงงานประกอบ อยุธยา',
      riskScore: 18,
      projectedCarbonCredits: 55,
      createdAt: new Date(Date.now() - 7000000).toISOString()
    },
    {
      id: 'JOB-24-A007',
      title: 'เคมีภัณฑ์อุตสาหกรรม (วัตถุอันตราย Class 3)',
      operatorId: 'u_op_001',
      valueTotal: 18500,
      state: JobState.FUNDED,
      origin: 'Maptaphut Industrial Estate',
      destination: 'ท่าเรือแหลมฉบัง Terminal B',
      riskScore: 85, // High risk
      projectedCarbonCredits: 40,
      createdAt: new Date(Date.now() - 6500000).toISOString()
    },
    {
      id: 'JOB-24-A008',
      title: 'ข้าวสารบรรจุกระสอบ 15 ตัน',
      operatorId: 'u_op_001',
      valueTotal: 7200,
      state: JobState.FUNDED,
      origin: 'โรงสีข้าว สุพรรณบุรี',
      destination: 'ท่าเรือกรุงเทพ (คลองเตย)',
      riskScore: 8,
      projectedCarbonCredits: 35,
      createdAt: new Date(Date.now() - 6000000).toISOString()
    },
    {
      id: 'JOB-24-A009',
      title: 'เฟอร์นิเจอร์ตกแต่งโรงแรม',
      operatorId: 'u_op_001',
      valueTotal: 22000,
      state: JobState.FUNDED,
      origin: 'บางโพ กรุงเทพฯ',
      destination: 'ป่าตอง ภูเก็ต',
      riskScore: 28, // Long distance
      projectedCarbonCredits: 250,
      createdAt: new Date(Date.now() - 5500000).toISOString()
    },
    {
      id: 'JOB-24-A010',
      title: 'เวชภัณฑ์และอุปกรณ์การแพทย์ด่วน',
      operatorId: 'u_op_001',
      valueTotal: 11000,
      state: JobState.FUNDED,
      origin: 'คลังยาทีซีจี นนทบุรี',
      destination: 'รพ.ศูนย์ขอนแก่น',
      riskScore: 45, // Fragile & Urgent
      projectedCarbonCredits: 90,
      createdAt: new Date(Date.now() - 5000000).toISOString()
    },
    {
      id: 'JOB-24-A011',
      title: 'ยางพาราแผ่นรมควัน',
      operatorId: 'u_op_001',
      valueTotal: 13500,
      state: JobState.FUNDED,
      origin: 'สหกรณ์สุราษฎร์ธานี',
      destination: 'ด่านสะเดา สงขลา',
      riskScore: 12,
      projectedCarbonCredits: 110,
      createdAt: new Date(Date.now() - 4500000).toISOString()
    },
    {
      id: 'JOB-24-A012',
      title: 'เครื่องดื่มบรรจุขวด (Beverages)',
      operatorId: 'u_op_001',
      valueTotal: 15000,
      state: JobState.FUNDED,
      origin: 'โรงงานปทุมธานี',
      destination: 'ศูนย์กระจายสินค้า อุบลราชธานี',
      riskScore: 20,
      projectedCarbonCredits: 150,
      createdAt: new Date(Date.now() - 4000000).toISOString()
    },
    {
      id: 'JOB-24-A013',
      title: 'ม้วนกระดาษอุตสาหกรรม (Paper Rolls)',
      operatorId: 'u_op_001',
      valueTotal: 6800,
      state: JobState.FUNDED,
      origin: 'โรงงานกระดาษ กาญจนบุรี',
      destination: 'โรงพิมพ์ สมุทรสาคร',
      riskScore: 14,
      projectedCarbonCredits: 40,
      createdAt: new Date(Date.now() - 3500000).toISOString()
    },
    {
      id: 'JOB-24-A014',
      title: 'แผงโซลาร์เซลล์ (Solar Panels)',
      operatorId: 'u_op_001',
      valueTotal: 9500,
      state: JobState.FUNDED,
      origin: 'โรงประกอบ ฉะเชิงเทรา',
      destination: 'โซลาร์ฟาร์ม ลพบุรี',
      riskScore: 30, // Fragile
      projectedCarbonCredits: 65,
      createdAt: new Date(Date.now() - 3000000).toISOString()
    },
    {
      id: 'JOB-24-A015',
      title: 'วัสดุก่อสร้างสำเร็จรูป (Precast)',
      operatorId: 'u_op_001',
      valueTotal: 5800,
      state: JobState.FUNDED,
      origin: 'โรงงานนวนคร',
      destination: 'ไซตืหมู่บ้านจัดสรร รังสิต',
      riskScore: 22, // Heavy load
      projectedCarbonCredits: 15,
      createdAt: new Date(Date.now() - 2500000).toISOString()
    }
  ],
  ledger: []
};

// Helper to create ledger entry
const createLedgerEntry = (desc: string, amount: number, type: 'CREDIT' | 'DEBIT', jobId?: string): LedgerEntry => ({
  id: `led_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
  timestamp: new Date().toISOString(),
  description: desc,
  amount,
  type,
  relatedJobId: jobId
});

// Helper to clamp reputation
const clampScore = (score: number) => Math.max(0, Math.min(100, score));

// STATE MACHINE ACTIONS

// 0. CREATE JOB (Operator)
export const createJob = (state: AppState, jobData: Partial<Job>): AppState => {
  // Enhanced Error Handling: Check Role
  if (state.currentUserRole !== UserRole.OPERATOR) {
    logAudit('ERROR', 'CREATE_JOB_UNAUTHORIZED', { role: state.currentUserRole });
    throw new Error("ปฏิเสธการเข้าถึง: เฉพาะผู้ประกอบการ (Operator) เท่านั้นที่สามารถสร้างสัญญาได้");
  }

  // Enhanced Error Handling: Compliance Check
  if (jobData.valueTotal && jobData.valueTotal > 10000 && state.operatorWallet.reputation < 80) {
    const errorDetails = { value: jobData.valueTotal, reputation: state.operatorWallet.reputation };
    logAudit('ERROR', 'CREATE_JOB_COMPLIANCE_FAILED', errorDetails);
    throw new Error(`ไม่ผ่านเกณฑ์ความเชื่อมั่น: คะแนน Trust Score ของคุณ (${state.operatorWallet.reputation}%) ต่ำกว่าเกณฑ์ (80%) สำหรับสัญญาที่มีมูลค่าสูงกว่า 10,000 บาท`);
  }

  const newJob: Job = {
    id: `JOB-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}-${Math.floor(10 + Math.random() * 90)}`,
    title: jobData.title || 'สัญญาจ้างไม่ระบุชื่อ',
    operatorId: state.operatorWallet.ownerId,
    valueTotal: jobData.valueTotal || 0,
    state: JobState.CREATED,
    origin: jobData.origin || 'ไม่ระบุ',
    destination: jobData.destination || 'ไม่ระบุ',
    riskScore: jobData.riskScore || Math.floor(Math.random() * 30), 
    projectedCarbonCredits: jobData.projectedCarbonCredits || 0,
    createdAt: new Date().toISOString()
  };

  logAudit('INFO', 'JOB_CREATED', { jobId: newJob.id, value: newJob.valueTotal });

  return {
    ...state,
    jobs: [newJob, ...state.jobs]
  };
};

// 1. FUND JOB (Operator)
export const fundJob = (state: AppState, jobId: string): AppState => {
  const jobIndex = state.jobs.findIndex(j => j.id === jobId);
  
  if (jobIndex === -1) {
    logAudit('ERROR', 'FUND_JOB_NOT_FOUND', { jobId });
    throw new Error(`ข้อผิดพลาดระบบ: ไม่พบสัญญา ID ${jobId} ในฐานข้อมูล`);
  }
  
  const job = state.jobs[jobIndex];

  if (state.operatorWallet.balanceAvailable < job.valueTotal) {
    logAudit('ERROR', 'FUND_JOB_INSUFFICIENT_FUNDS', { 
      jobId, 
      required: job.valueTotal, 
      available: state.operatorWallet.balanceAvailable 
    });
    throw new Error(`ยอดเงินไม่เพียงพอ: บัญชีของคุณมี ฿${state.operatorWallet.balanceAvailable.toLocaleString()} (ต้องการ ฿${job.valueTotal.toLocaleString()})`);
  }

  const newOpWallet = { ...state.operatorWallet };
  newOpWallet.balanceAvailable -= job.valueTotal;
  newOpWallet.balanceEscrow += job.valueTotal;

  const newJobs = [...state.jobs];
  newJobs[jobIndex] = { ...job, state: JobState.FUNDED };

  const entry = createLedgerEntry(`ล็อกเงินเข้าบัญชีพัก (Escrow) สำหรับงาน ${job.id}`, job.valueTotal, 'DEBIT', job.id);
  logAudit('INFO', 'JOB_FUNDED', { jobId, amount: job.valueTotal });

  return {
    ...state,
    operatorWallet: newOpWallet,
    jobs: newJobs,
    ledger: [entry, ...state.ledger]
  };
};

// 2. ACCEPT JOB (Driver)
export const acceptJob = (state: AppState, jobId: string, driverId: string): AppState => {
  const jobIndex = state.jobs.findIndex(j => j.id === jobId);
  if (jobIndex === -1) {
    logAudit('ERROR', 'ACCEPT_JOB_NOT_FOUND', { jobId });
    throw new Error("ข้อผิดพลาดระบบ: ไม่พบเอกสารสัญญาในระบบ");
  }
  
  const job = state.jobs[jobIndex];
  
  if (job.state !== JobState.FUNDED) {
     logAudit('ERROR', 'ACCEPT_JOB_INVALID_STATE', { jobId, state: job.state });
     throw new Error(`สถานะสัญญาไม่ถูกต้อง: งานนี้ไม่เปิดรับสมัครในขณะนี้ (สถานะ: ${job.state})`);
  }

  const newJobs = [...state.jobs];
  newJobs[jobIndex] = { ...job, state: JobState.ACCEPTED, driverId };

  // Update Driver Reserved Balance (Visual Guarantee)
  const newDrWallet = { ...state.driverWallet };
  newDrWallet.balanceReserved += job.valueTotal;

  logAudit('INFO', 'JOB_ACCEPTED', { jobId, driverId });

  return { ...state, jobs: newJobs, driverWallet: newDrWallet };
};

// 3. VERIFY PICKUP (Driver)
export const verifyPickup = (state: AppState, jobId: string): AppState => {
  const jobIndex = state.jobs.findIndex(j => j.id === jobId);
  if (jobIndex === -1) throw new Error("ข้อผิดพลาดระบบ: ไม่พบสัญญา");
  
  const job = state.jobs[jobIndex];

  if (job.state !== JobState.ACCEPTED) {
    logAudit('ERROR', 'VERIFY_PICKUP_INVALID_STATE', { jobId, state: job.state });
    throw new Error("ขั้นตอนไม่ถูกต้อง: งานยังไม่ได้ถูกกดรับ หรืออยู่ในสถานะที่ไม่ถูกต้อง");
  }

  const newJobs = [...state.jobs];
  newJobs[jobIndex] = { ...job, state: JobState.PICKUP_VERIFIED };

  logAudit('INFO', 'PICKUP_VERIFIED', { jobId });

  return { ...state, jobs: newJobs };
};

// 4. PAYOUT PHASE 1 (System)
export const processPhase1Payout = (state: AppState, jobId: string): AppState => {
  const jobIndex = state.jobs.findIndex(j => j.id === jobId);
  if (jobIndex === -1) throw new Error("ข้อผิดพลาดระบบ: ไม่พบสัญญา");
  const job = state.jobs[jobIndex];

  if (job.state !== JobState.PICKUP_VERIFIED) {
    logAudit('ERROR', 'PAYOUT_PH1_INVALID_STATE', { jobId, state: job.state });
    throw new Error("การชำระเงินล้มเหลว: ไม่สามารถจ่ายเงินงวดที่ 1 ได้เนื่องจากยังไม่ผ่านการตรวจสอบการรับของ");
  }

  const phase1Amount = job.valueTotal * CONSTANTS.PHASE_SPLIT;
  const fee = phase1Amount * CONSTANTS.PLATFORM_FEE_PERCENT;
  const tax = phase1Amount * 0.03; // 3% WHT
  const payout = phase1Amount - fee - tax;

  const newOpWallet = { ...state.operatorWallet };
  newOpWallet.balanceEscrow -= phase1Amount;

  const newDrWallet = { ...state.driverWallet };
  newDrWallet.balanceReserved -= phase1Amount; // Decrease reserved
  newDrWallet.balanceAvailable += payout;
  newDrWallet.taxWithheld += tax;

  const newJobs = [...state.jobs];
  newJobs[jobIndex] = { ...job, state: JobState.PHASE1_PAID };

  const entries = [
    createLedgerEntry(`เบิกจ่ายงวดที่ 1 (50%) สัญญา ${job.id}`, phase1Amount, 'DEBIT', job.id),
    createLedgerEntry(`เงินเข้าสุทธิ (งวดที่ 1)`, payout, 'CREDIT', job.id),
    createLedgerEntry(`ค่าธรรมเนียมแพลตฟอร์ม (10%)`, fee, 'DEBIT', job.id),
    createLedgerEntry(`ภาษีหัก ณ ที่จ่าย (3%)`, tax, 'DEBIT', job.id)
  ];

  logAudit('INFO', 'PAYOUT_PHASE_1', { jobId, payout });

  return {
    ...state,
    operatorWallet: newOpWallet,
    driverWallet: newDrWallet,
    jobs: newJobs,
    ledger: [...entries, ...state.ledger]
  };
};

// 5. COMPLETE JOB
export const completeJob = (state: AppState, jobId: string): AppState => {
  const jobIndex = state.jobs.findIndex(j => j.id === jobId);
  if (jobIndex === -1) throw new Error("ข้อผิดพลาดระบบ: ไม่พบสัญญา");
  const job = state.jobs[jobIndex];

  if (job.state !== JobState.PHASE1_PAID) {
    logAudit('ERROR', 'COMPLETE_JOB_INVALID_STATE', { jobId, state: job.state });
    throw new Error("ขั้นตอนไม่ถูกต้อง: ไม่สามารถปิดงานได้เนื่องจากงวดแรกยังไม่สมบูรณ์");
  }

  const newJobs = [...state.jobs];
  newJobs[jobIndex] = { ...job, state: JobState.COMPLETED };

  // Update Operator Reputation
  const newOpWallet = { ...state.operatorWallet };
  newOpWallet.reputation = clampScore(newOpWallet.reputation + 2);
  // Award Carbon Credits to Operator (Strategic Optimization)
  if (job.projectedCarbonCredits > 0) {
     newOpWallet.carbonPoints += job.projectedCarbonCredits;
  }

  // Update Driver Reputation & Carbon
  const newDrWallet = { ...state.driverWallet };
  newDrWallet.reputation = clampScore(newDrWallet.reputation + 5);
  // Award Carbon Credits to Driver (Eco-driving share)
  if (job.projectedCarbonCredits > 0) {
    newDrWallet.carbonPoints += job.projectedCarbonCredits; 
  }

  logAudit('INFO', 'JOB_COMPLETED', { jobId });

  return { 
    ...state, 
    jobs: newJobs,
    operatorWallet: newOpWallet,
    driverWallet: newDrWallet
  };
};

// 6. PAYOUT PHASE 2
export const processPhase2Payout = (state: AppState, jobId: string): AppState => {
  const jobIndex = state.jobs.findIndex(j => j.id === jobId);
  if (jobIndex === -1) throw new Error("ข้อผิดพลาดระบบ: ไม่พบสัญญา");
  const job = state.jobs[jobIndex];

  if (job.state !== JobState.COMPLETED) {
    logAudit('ERROR', 'PAYOUT_PH2_INVALID_STATE', { jobId, state: job.state });
    throw new Error("การชำระเงินล้มเหลว: งานยังไม่เสร็จสมบูรณ์ ไม่สามารถจ่ายเงินงวดสุดท้ายได้");
  }

  const phase2Amount = job.valueTotal * CONSTANTS.PHASE_SPLIT;
  const fee = phase2Amount * CONSTANTS.PLATFORM_FEE_PERCENT;
  const tax = phase2Amount * 0.03;
  const payout = phase2Amount - fee - tax;

  const newOpWallet = { ...state.operatorWallet };
  newOpWallet.balanceEscrow -= phase2Amount;

  const newDrWallet = { ...state.driverWallet };
  newDrWallet.balanceReserved -= phase2Amount;
  newDrWallet.balancePending += payout;
  newDrWallet.taxWithheld += tax;

  const newJobs = [...state.jobs];
  newJobs[jobIndex] = { ...job, state: JobState.PHASE2_FUNDED };

  const entries = [
    createLedgerEntry(`เบิกจ่ายงวดที่ 2 (50%) สัญญา ${job.id}`, phase2Amount, 'DEBIT', job.id),
    createLedgerEntry(`ยอดเงินรอเคลียริ่ง (T+1)`, payout, 'CREDIT', job.id),
    createLedgerEntry(`ภาษีหัก ณ ที่จ่าย (3%)`, tax, 'DEBIT', job.id)
  ];

  logAudit('INFO', 'PAYOUT_PHASE_2', { jobId, payout });

  return {
    ...state,
    operatorWallet: newOpWallet,
    driverWallet: newDrWallet,
    jobs: newJobs,
    ledger: [...entries, ...state.ledger]
  };
};

// 7. SETTLE
export const settleDriverFunds = (state: AppState): AppState => {
  const amountToSettle = state.driverWallet.balancePending;
  
  if (amountToSettle <= 0) {
    logAudit('ERROR', 'SETTLEMENT_ZERO_BALANCE', {});
    throw new Error("ข้อผิดพลาดระบบ: ไม่มียอดเงินคงค้างรอเคลียริ่งในขณะนี้");
  }

  const newDrWallet = { ...state.driverWallet };
  newDrWallet.balancePending = 0;
  newDrWallet.balanceAvailable += amountToSettle;

  const entry = createLedgerEntry(`เคลียริ่งสำเร็จ (T+1 Settlement)`, amountToSettle, 'CREDIT');
  logAudit('INFO', 'FUNDS_SETTLED', { amount: amountToSettle });

  return {
    ...state,
    driverWallet: newDrWallet,
    ledger: [entry, ...state.ledger]
  };
};

// 8. DISPUTE
export const raiseDispute = (state: AppState, jobId: string, reason: string): AppState => {
  const jobIndex = state.jobs.findIndex(j => j.id === jobId);
  if (jobIndex === -1) throw new Error("ข้อผิดพลาดระบบ: ไม่พบสัญญา");
  const job = state.jobs[jobIndex];
  
  const newJobs = [...state.jobs];
  newJobs[jobIndex] = { ...job, state: JobState.DISPUTE };
  
  const entry = createLedgerEntry(`เปิดเคสข้อพิพาท/ระงับงาน: ${reason}`, 0, 'DEBIT', job.id);
  logAudit('CRITICAL', 'DISPUTE_RAISED', { jobId, reason });

  return { ...state, jobs: newJobs, ledger: [entry, ...state.ledger] };
};

// 9. RESOLVE
export const resolveDispute = (state: AppState, jobId: string, decision: 'REFUND' | 'PAYOUT'): AppState => {
  const jobIndex = state.jobs.findIndex(j => j.id === jobId);
  if (jobIndex === -1) throw new Error("ข้อผิดพลาดระบบ: ไม่พบสัญญา");
  const job = state.jobs[jobIndex];
  
  const isPhase1Paid = state.ledger.some(l => l.relatedJobId === jobId && l.description.includes('Phase 1 Release'));
  const remainingEscrow = isPhase1Paid ? job.valueTotal * CONSTANTS.PHASE_SPLIT : job.valueTotal;

  const newOpWallet = { ...state.operatorWallet };
  const newDrWallet = { ...state.driverWallet };
  const ledgerEntries: LedgerEntry[] = [];

  newOpWallet.balanceEscrow -= remainingEscrow;
  newDrWallet.balanceReserved = Math.max(0, newDrWallet.balanceReserved - remainingEscrow); // Clear reserved

  if (decision === 'REFUND') {
     newOpWallet.balanceAvailable += remainingEscrow;
     newDrWallet.reputation = clampScore(newDrWallet.reputation - 15);
     ledgerEntries.push(createLedgerEntry(`คำตัดสิน: คืนเงินผู้ประกอบการ`, remainingEscrow, 'CREDIT', job.id));
  } else {
     const fee = remainingEscrow * CONSTANTS.PLATFORM_FEE_PERCENT;
     const payout = remainingEscrow - fee;
     newDrWallet.balanceAvailable += payout; 
     newOpWallet.reputation = clampScore(newOpWallet.reputation - 15);
     ledgerEntries.push(createLedgerEntry(`คำตัดสิน: จ่ายเงินชดเชยคนขับ`, payout, 'CREDIT', job.id));
  }

  const newJobs = [...state.jobs];
  newJobs[jobIndex] = { ...job, state: JobState.COMPLETED };

  logAudit('INFO', 'DISPUTE_RESOLVED', { jobId, decision });

  return {
    ...state,
    operatorWallet: newOpWallet,
    driverWallet: newDrWallet,
    jobs: newJobs,
    ledger: [...ledgerEntries, ...state.ledger]
  };
};

// 10. WALLET TOP-UP (External -> Available)
export const topUpWallet = (state: AppState, amount: number): AppState => {
  const newOpWallet = { ...state.operatorWallet };
  newOpWallet.balanceAvailable += amount;
  
  const entry = createLedgerEntry(`เติมเงินเข้าระบบ (Top-up)`, amount, 'CREDIT');
  logAudit('INFO', 'WALLET_TOPUP', { amount });
  
  return { ...state, operatorWallet: newOpWallet, ledger: [entry, ...state.ledger] };
};

// 11. WALLET WITHDRAW (Available -> External)
export const withdrawWallet = (state: AppState, amount: number): AppState => {
  if (state.operatorWallet.balanceAvailable < amount) {
     throw new Error("ยอดเงินคงเหลือไม่เพียงพอสำหรับการโอนออก");
  }
  const newOpWallet = { ...state.operatorWallet };
  newOpWallet.balanceAvailable -= amount;
  
  const entry = createLedgerEntry(`โอนเงินออกจากระบบ (Withdraw)`, amount, 'DEBIT');
  logAudit('INFO', 'WALLET_WITHDRAW', { amount });
  
  return { ...state, operatorWallet: newOpWallet, ledger: [entry, ...state.ledger] };
};