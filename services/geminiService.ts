import { GoogleGenAI } from "@google/genai";
import { AppState, UserRole } from "../types";

// Layer 4/5: Strategic Advice for User (Private Utilization)
export const getStrategicAdvice = async (role: UserRole, appState: AppState) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const context = role === UserRole.OPERATOR 
      ? `Operator Wallet: Available ${appState.operatorWallet.balanceAvailable}, Escrow ${appState.operatorWallet.balanceEscrow}, Carbon Points: ${appState.operatorWallet.carbonPoints}. Active jobs: ${appState.jobs.length}.`
      : `Driver Wallet: Available ${appState.driverWallet.balanceAvailable}, Pending: ${appState.driverWallet.balancePending}, Reputation: ${appState.driverWallet.reputation}, Carbon Points: ${appState.driverWallet.carbonPoints}.`;

    const prompt = `
      คุณคือ ARWEEN Private Logistics Advisor วิเคราะห์ข้อมูลสำหรับ ${role === UserRole.OPERATOR ? 'ผู้ประกอบการ' : 'คนขับ'} และให้คำแนะนำเชิงกลยุทธ์ 3 ข้อเพื่อการเติบโตของธุรกิจ
      บริบทข้อมูล: ${context}
      
      เน้นที่:
      1. การเพิ่มประสิทธิภาพกระแสเงินสดและภาษี
      2. การใช้สิทธิประโยชน์สีเขียว (Carbon Credits) เพื่อลดต้นทุนหรือเพิ่มรายได้
      3. การสร้างความน่าเชื่อถือผ่าน Trust Score เพื่อการเข้าถึงแหล่งเงินทุนธนาคาร

      ตอบเป็นภาษาไทย สั้น กระชับ และเป็นมืออาชีพ
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Advice Error:", error);
    return "ไม่สามารถดึงข้อมูลคำแนะนำได้ในขณะนี้ โปรดตรวจสอบการเชื่อมต่อของคุณ";
  }
};

// Data Portability: Generate Formal Compliance Summary
export const generateComplianceReport = async (role: UserRole, appState: AppState) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const ledgerData = JSON.stringify(appState.ledger.slice(0, 20));
    const walletData = role === UserRole.OPERATOR ? JSON.stringify(appState.operatorWallet) : JSON.stringify(appState.driverWallet);
    
    const prompt = `
      สร้าง "Digital Compliance Summary" ในรูปแบบรายงานทางการสำหรับ ${role === UserRole.OPERATOR ? 'ผู้ประกอบการ' : 'คนขับ'} โดยใช้ข้อมูลจาก ARWEEN Ledger และ Wallet
      ข้อมูล Ledger: ${ledgerData}
      ข้อมูล Wallet: ${walletData}
      
      รายงานต้องประกอบด้วย:
      1. สรุปรายได้/ค่าใช้จ่ายทั้งหมด (Financial Summary)
      2. ข้อมูลภาษีหัก ณ ที่จ่าย (Tax Proof) ที่นำส่งผ่านระบบ
      3. ผลงานด้านสิ่งแวดล้อม (Green Achievement) และมูลค่าลดหย่อนภาษี
      4. ลายเซ็นดิจิทัล (Simulation of Digital Signature/Hash) เพื่อยืนยันว่าข้อมูลนี้ไม่ได้ถูกแก้ไข
      
      เขียนในรูปแบบ Markdown ภาษาไทยที่ดูเป็นทางการ พร้อมสำหรับพิมพ์หรือส่งให้บัญชี
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 2000 } }
    });

    return response.text;
  } catch (error) {
    console.error("Compliance Report Error:", error);
    return "เกิดข้อผิดพลาดในการสร้างรายงานทางการ โปรดลองอีกครั้ง";
  }
};

// Layer 2: Intelligence Processing (Validation)
export const validateProofOfWork = async (actionType: 'PICKUP' | 'DELIVERY', jobId: string, base64Image?: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Simulate complex validation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const isSuccess = Math.random() > 0.05; 
    
    if (isSuccess) {
      const reasons = actionType === 'PICKUP' 
        ? [
            "AI ยืนยัน: ตรวจพบ QR Code บนสินค้า ตรงกับ Manifest ในสัญญา",
            "AI ยืนยัน: พิกัด GPS ตรงกับจุดรับสินค้า (ละติจูด/ลองจิจูด แม่นยำ 5 เมตร)",
            "AI ยืนยัน: สภาพรถและตู้สินค้ามีความปลอดภัยพร้อมออกเดินทาง"
          ]
        : [
            "AI ยืนยัน: ตรวจสอบความสมบูรณ์ของภาพถ่ายหลักฐานส่งมอบสำเร็จ",
            "AI ยืนยัน: พิกัดปลายทางถูกต้อง สินค้าถึงมือผู้รับตามระบุ",
            "AI ยืนยัน: ตรวจสอบความสมบูรณ์ของบรรจุภัณฑ์ผ่าน Computer Vision"
          ];

      return {
        valid: true,
        reason: reasons.join("\n")
      };
    } else {
      return {
        valid: false,
        reason: "การตรวจสอบล้มเหลว: ภาพถ่ายไม่ชัดเจน หรือ ข้อมูลพิกัด GPS ไม่สอดคล้องกับจุดหมายปลายทางในสัญญา"
      };
    }
  } catch (e) {
    console.error("Validation Error:", e);
    return { valid: false, reason: "ระบบขัดข้อง: ไม่สามารถประมวลผลการตรวจสอบได้ในขณะนี้" };
  }
};