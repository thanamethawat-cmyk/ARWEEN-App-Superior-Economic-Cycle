import { AppState, JobState, UserRole, Job, CONSTANTS, LedgerEntry } from '../types';

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
  if (jobData.valueTotal && jobData.valueTotal > 10000 && state.operatorWallet.reputation < 80) {
    throw new Error("Compliance Error: คะแนนความเชื่อมั่นต่ำกว่าเกณฑ์สำหรับสัญญา > 10,000 บาท");
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

  return {
    ...state,
    jobs: [newJob, ...state.jobs]
  };
};

// 1. FUND JOB (Operator)
export const fundJob = (state: AppState, jobId: string): AppState => {
  const jobIndex = state.jobs.findIndex(j => j.id === jobId);
  if (jobIndex === -1) throw new Error("ไม่พบสัญญาในระบบ (Job Not Found)");
  const job = state.jobs[jobIndex];

  if (state.operatorWallet.balanceAvailable < job.valueTotal) {
    throw new Error("ยอดเงินคงเหลือไม่เพียงพอสำหรับ Escrow");
  }

  const newOpWallet = { ...state.operatorWallet };
  newOpWallet.balanceAvailable -= job.valueTotal;
  newOpWallet.balanceEscrow += job.valueTotal;

  const newJobs = [...state.jobs];
  newJobs[jobIndex] = { ...job, state: JobState.FUNDED };

  const entry = createLedgerEntry(`ล็อกเงินเข้า Escrow สำหรับงาน ${job.id}`, job.valueTotal, 'DEBIT', job.id);

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
  if (jobIndex === -1) throw new Error("ไม่พบสัญญาในระบบ (Job Not Found)");
  const job = state.jobs[jobIndex];
  
  if (job.state !== JobState.FUNDED) throw new Error("งานยังไม่มีกองทุนรองรับ");

  const newJobs = [...state.jobs];
  newJobs[jobIndex] = { ...job, state: JobState.ACCEPTED, driverId };

  // Update Driver Reserved Balance (Visual Guarantee)
  const newDrWallet = { ...state.driverWallet };
  newDrWallet.balanceReserved += job.valueTotal;

  return { ...state, jobs: newJobs, driverWallet: newDrWallet };
};

// 3. VERIFY PICKUP (Driver)
export const verifyPickup = (state: AppState, jobId: string): AppState => {
  const jobIndex = state.jobs.findIndex(j => j.id === jobId);
  if (jobIndex === -1) throw new Error("ไม่พบสัญญาในระบบ (Job Not Found)");
  const job = state.jobs[jobIndex];

  if (job.state !== JobState.ACCEPTED) throw new Error("ยังไม่ได้รับงาน");

  const newJobs = [...state.jobs];
  newJobs[jobIndex] = { ...job, state: JobState.PICKUP_VERIFIED };

  return { ...state, jobs: newJobs };
};

// 4. PAYOUT PHASE 1 (System)
export const processPhase1Payout = (state: AppState, jobId: string): AppState => {
  const jobIndex = state.jobs.findIndex(j => j.id === jobId);
  if (jobIndex === -1) throw new Error("ไม่พบสัญญาในระบบ (Job Not Found)");
  const job = state.jobs[jobIndex];

  if (job.state !== JobState.PICKUP_VERIFIED) throw new Error("ยังไม่ผ่านการยืนยันรับของ");

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
    createLedgerEntry(`Phase 1 Release Job ${job.id}`, phase1Amount, 'DEBIT', job.id),
    createLedgerEntry(`Phase 1 Payout (Net)`, payout, 'CREDIT', job.id),
    createLedgerEntry(`Platform Fee (10%)`, fee, 'DEBIT', job.id),
    createLedgerEntry(`WHT (3%)`, tax, 'DEBIT', job.id)
  ];

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
  if (jobIndex === -1) throw new Error("ไม่พบสัญญาในระบบ (Job Not Found)");
  const job = state.jobs[jobIndex];

  if (job.state !== JobState.PHASE1_PAID) throw new Error("Phase 1 not paid");

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
  if (jobIndex === -1) throw new Error("ไม่พบสัญญาในระบบ (Job Not Found)");
  const job = state.jobs[jobIndex];

  if (job.state !== JobState.COMPLETED) throw new Error("งานยังไม่เสร็จสมบูรณ์");

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
    createLedgerEntry(`Phase 2 Release Job ${job.id}`, phase2Amount, 'DEBIT', job.id),
    createLedgerEntry(`Phase 2 Pending (T+1)`, payout, 'CREDIT', job.id),
    createLedgerEntry(`WHT (3%)`, tax, 'DEBIT', job.id)
  ];

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
  
  if (amountToSettle <= 0) throw new Error("ไม่มียอดเงินรอเคลียริ่ง");

  const newDrWallet = { ...state.driverWallet };
  newDrWallet.balancePending = 0;
  newDrWallet.balanceAvailable += amountToSettle;

  const entry = createLedgerEntry(`T+1 Settlement Released`, amountToSettle, 'CREDIT');

  return {
    ...state,
    driverWallet: newDrWallet,
    ledger: [entry, ...state.ledger]
  };
};

// 8. DISPUTE
export const raiseDispute = (state: AppState, jobId: string, reason: string): AppState => {
  const jobIndex = state.jobs.findIndex(j => j.id === jobId);
  if (jobIndex === -1) throw new Error("ไม่พบสัญญาในระบบ (Job Not Found)");
  const job = state.jobs[jobIndex];
  
  const newJobs = [...state.jobs];
  newJobs[jobIndex] = { ...job, state: JobState.DISPUTE };
  
  const entry = createLedgerEntry(`Dispute Raised: ${reason}`, 0, 'DEBIT', job.id);

  return { ...state, jobs: newJobs, ledger: [entry, ...state.ledger] };
};

// 9. RESOLVE
export const resolveDispute = (state: AppState, jobId: string, decision: 'REFUND' | 'PAYOUT'): AppState => {
  const jobIndex = state.jobs.findIndex(j => j.id === jobId);
  if (jobIndex === -1) throw new Error("ไม่พบสัญญาในระบบ (Job Not Found)");
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
     ledgerEntries.push(createLedgerEntry(`Ruling: Refund Operator`, remainingEscrow, 'CREDIT', job.id));
  } else {
     const fee = remainingEscrow * CONSTANTS.PLATFORM_FEE_PERCENT;
     const payout = remainingEscrow - fee;
     newDrWallet.balanceAvailable += payout; 
     newOpWallet.reputation = clampScore(newOpWallet.reputation - 15);
     ledgerEntries.push(createLedgerEntry(`Ruling: Payout Driver`, payout, 'CREDIT', job.id));
  }

  const newJobs = [...state.jobs];
  newJobs[jobIndex] = { ...job, state: JobState.COMPLETED };

  return {
    ...state,
    operatorWallet: newOpWallet,
    driverWallet: newDrWallet,
    jobs: newJobs,
    ledger: [...ledgerEntries, ...state.ledger]
  };
};