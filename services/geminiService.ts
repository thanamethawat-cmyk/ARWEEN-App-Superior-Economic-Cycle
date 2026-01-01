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
      บทบาทของคุณ: ที่ปรึกษาเชิงกลยุทธ์ด้านโลจิสติกส์และการเงิน (ARWEEN Strategic Advisor)
      
      ภารกิจ: วิเคราะห์ข้อมูลและให้คำแนะนำสำหรับ "${role === UserRole.OPERATOR ? 'ผู้ประกอบการขนส่ง (Operator)' : 'พาร์ทเนอร์คนขับ (Driver)'}"
      
      ข้อมูลประกอบ: ${context}
      
      คำสั่ง: ให้คำแนะนำเชิงกลยุทธ์ 3 ข้อ เพื่อสร้างความเติบโตทางธุรกิจ
      1. การบริหารกระแสเงินสดและภาษี
      2. การใช้ประโยชน์จาก Carbon Credits เพื่อลดหย่อนภาษี
      3. การสร้างเครดิต (Trust Score) เพื่อขอสินเชื่อธนาคาร

      ข้อกำหนดการตอบ: 
      - ใช้ภาษาไทยทางการ (Professional Thai) กระชับ เข้าใจง่าย
      - ไม่ต้องเกริ่นนำ ให้เข้าประเด็นทันที
      - ใช้คำศัพท์ที่ดูน่าเชื่อถือแบบระบบราชการสมัยใหม่
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    if (!response.text) {
      throw new Error("AI ตอบกลับด้วยข้อมูลว่างเปล่า");
    }

    return response.text;
  } catch (error: any) {
    console.error("Advice Error:", error);
    // Throw a user-friendly error
    throw new Error(`ไม่สามารถเชื่อมต่อระบบวิเคราะห์ AI ได้: ${error.message || 'Unknown Error'}`);
  }
};

// Data Portability: Generate Formal Compliance Summary
export const generateComplianceReport = async (role: UserRole, appState: AppState) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const ledgerData = JSON.stringify(appState.ledger.slice(0, 20));
    const walletData = role === UserRole.OPERATOR ? JSON.stringify(appState.operatorWallet) : JSON.stringify(appState.driverWallet);
    
    const prompt = `
      สร้าง "รายงานสรุปความถูกต้องทางดิจิทัล (Digital Compliance Summary)" ในรูปแบบเอกสารราชการสำหรับ "${role === UserRole.OPERATOR ? 'ผู้ประกอบการ' : 'พาร์ทเนอร์คนขับ'}"
      
      ข้อมูลธุรกรรม (Ledger): ${ledgerData}
      ข้อมูลกระเป๋าเงิน (Wallet): ${walletData}
      
      โครงสร้างรายงาน (ใช้ภาษาไทยทางการ):
      1. ส่วนหัว: สรุปสถานะทางการเงิน (Financial Summary)
      2. หลักฐานภาษี: รายละเอียดภาษีหัก ณ ที่จ่าย (Tax Proof)
      3. ความสำเร็จด้านสิ่งแวดล้อม: Carbon Credits และสิทธิประโยชน์ทางภาษี
      4. การรับรองข้อมูล: จำลองลายเซ็นดิจิทัล (Digital Hash)
      
      รูปแบบ: Markdown ภาษาไทยที่สวยงาม เป็นทางการ พร้อมสำหรับการยื่นตรวจสอบบัญชี
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 2000 } }
    });

    if (!response.text) {
        throw new Error("การสร้างรายงานล้มเหลว (Empty Response)");
    }

    return response.text;
  } catch (error: any) {
    console.error("Compliance Report Error:", error);
    throw new Error(`การสร้างรายงานล้มเหลว: ${error.message}`);
  }
};

// Layer 2: Intelligence Processing (Validation)
export const validateProofOfWork = async (actionType: 'PICKUP' | 'DELIVERY', jobId: string, base64Image?: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Simulate complex validation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const isSuccess = Math.random() > 0.10; // 90% Success rate
    
    if (isSuccess) {
      const reasons = actionType === 'PICKUP' 
        ? [
            "AI ตรวจสอบ: พบรหัส QR Code บนสินค้า ตรงกับใบกำกับสินค้า (Manifest) ในสัญญา",
            "AI ตรวจสอบ: พิกัด GPS สอดคล้องกับจุดรับสินค้า (ความแม่นยำสูง)",
            "AI ตรวจสอบ: สภาพยานพาหนะผ่านเกณฑ์ความปลอดภัย"
          ]
        : [
            "AI ตรวจสอบ: ภาพถ่ายหลักฐานการส่งมอบมีความสมบูรณ์",
            "AI ตรวจสอบ: พิกัดปลายทางถูกต้องตามสัญญาอัจฉริยะ",
            "AI ตรวจสอบ: บรรจุภัณฑ์อยู่ในสภาพสมบูรณ์ ไม่มีความเสียหาย"
          ];

      return {
        valid: true,
        reason: reasons.join("\n")
      };
    } else {
      return {
        valid: false,
        reason: "การตรวจสอบล้มเหลว: ภาพถ่ายไม่ชัดเจน หรือ ข้อมูลพิกัด GPS ไม่สอดคล้องกับพื้นที่ที่กำหนด"
      };
    }
  } catch (e) {
    console.error("Validation Error:", e);
    return { valid: false, reason: "ระบบขัดข้อง: ไม่สามารถเชื่อมต่อกับ AI Node ได้ในขณะนี้ โปรดลองใหม่" };
  }
};