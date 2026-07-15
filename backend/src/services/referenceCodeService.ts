import { PrismaClient, ReferenceCodeAction } from "@prisma/client";

interface LogParams {
  tenderId: string;
  oldReferenceCode?: string | null;
  newReferenceCode?: string | null;
  actionType: ReferenceCodeAction;
  actionReason?: string | null;
  actionBy?: string | null;
}

export class ReferenceCodeService {
  /**
   * Generates the next sequential reference code in prefix-YYYYMMDD-Sequence format
   */
  static async generateNextCode(
    tx: any, // Accepts Prisma transaction client
    companyId: string,
    prefix: string = "REF"
  ): Promise<{ formattedCode: string; sequence: number }> {
    // 1. Get or Create the ReferenceCodeCounter record
    let counter = await tx.referenceCodeCounter.findUnique({
      where: {
        companyId_prefix: {
          companyId,
          prefix,
        },
      },
    });

    if (!counter) {
      counter = await tx.referenceCodeCounter.create({
        data: {
          companyId,
          prefix,
          lastSequence: 0,
        },
      });
    }

    // 2. Increment the sequence counter
    const updatedCounter = await tx.referenceCodeCounter.update({
      where: { id: counter.id },
      data: {
        lastSequence: {
          increment: 1,
        },
      },
    });

    const newSequence = updatedCounter.lastSequence;

    // 3. Format date component (YYYYMMDD) in IST timezone (Asia/Kolkata)
    const date = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    
    const parts = formatter.formatToParts(date);
    const year = parts.find(p => p.type === "year")?.value || "";
    const month = parts.find(p => p.type === "month")?.value || "";
    const day = parts.find(p => p.type === "day")?.value || "";
    const dateStr = `${year}${month}${day}`;

    // 4. Format sequence padding to 5 digits (e.g. 00001)
    const seqStr = String(newSequence).padStart(5, "0");
    const formattedCode = `${prefix}-${dateStr}-${seqStr}`;

    return {
      formattedCode,
      sequence: newSequence,
    };
  }

  /**
   * Helper method to write log entries to the ReferenceCode table
   */
  static async logAction(
    tx: any,
    params: LogParams
  ): Promise<any> {
    return tx.referenceCode.create({
      data: {
        tenderId: params.tenderId,
        oldReferenceCode: params.oldReferenceCode ?? null,
        newReferenceCode: params.newReferenceCode ?? null,
        actionType: params.actionType,
        actionReason: params.actionReason ?? null,
        actionBy: params.actionBy ?? null,
      },
    });
  }
}
