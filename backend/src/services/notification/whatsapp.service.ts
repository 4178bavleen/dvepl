import { PrismaClient } from "@prisma/client";
import { decrypt, maskApiKey } from "../../utils/encryption";
import { adminLogs } from "../logger/contextLogger";

const prisma = new PrismaClient();

const AISENSY_API_BASE = "https://backend.aisensy.com";
const AISENSY_SEND_ENDPOINT = "/campaign/t1/api/v2";
const REQUEST_TIMEOUT_MS = 15000;

export interface SendWhatsAppOptions {
  to: string;
  userName: string;
  campaignName: string;
  templateParams?: string[];
  source?: string;
}

export class WhatsappService {
  static async getConfiguration(companyId?: string) {
    const config = await prisma.notificationConfiguration.findFirst({
      where: companyId ? { companyId } : {},
    });

    if (!config) {
      throw new Error("Notification configuration not found.");
    }

    if (!config.whatsappEnabled) {
      throw new Error("WhatsApp notifications are disabled.");
    }

    if (config.whatsappProvider !== "AISENSY") {
      throw new Error("WhatsApp provider is not configured as AiSensy.");
    }

    if (!config.whatsappApiKey) {
      throw new Error("AiSensy API key is not configured.");
    }

    if (!config.whatsappCampaignName) {
      throw new Error("AiSensy campaign name is not configured.");
    }

    return config;
  }

  private static decryptApiKey(encryptedKey: string): string {
    try {
      return decrypt(encryptedKey);
    } catch {
      adminLogs.warn("Failed to decrypt API key, treating as plaintext");
      return encryptedKey;
    }
  }

  static async send(
    options: SendWhatsAppOptions,
    companyId?: string,
    eventCode?: string,
    relatedModule?: string,
    relatedRecordId?: string
  ) {
    const config = await this.getConfiguration(companyId);

    const apiKey = this.decryptApiKey(config.whatsappApiKey!);
    const campaignName = options.campaignName || config.whatsappCampaignName!;

    let status: "SENT" | "FAILED" = "SENT";
    let errorMsg: string | null = null;

    const payload = {
      apiKey,
      campaignName,
      destination: options.to,
      userName: options.userName,
      source: options.source || "DVEPL_CRM",
      ...(options.templateParams && options.templateParams.length > 0
        ? { templateParams: options.templateParams }
        : {}),
    };

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const response = await fetch(
        `${AISENSY_API_BASE}${AISENSY_SEND_ENDPOINT}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `AiSensy API returned ${response.status}: ${body}`
        );
      }

      adminLogs.info("WhatsApp message sent via AiSensy", {
        destination: options.to,
        campaignName,
        companyId,
      });
    } catch (e: any) {
      status = "FAILED";
      errorMsg = e.message || String(e);
      adminLogs.error("WhatsApp message send failed", {
        error: errorMsg,
        destination: options.to,
        companyId,
      });
      throw e;
    } finally {
      try {
        await prisma.notificationLog.create({
          data: {
            eventCode: eventCode || "WHATSAPP_MESSAGE",
            channel: "WHATSAPP",
            recipient: options.to,
            subject: campaignName,
            message: options.templateParams?.join(", ") || "",
            status,
            error: errorMsg,
            relatedModule: relatedModule || null,
            relatedRecordId: relatedRecordId || null,
          },
        });
      } catch (dbError) {
        adminLogs.error("Failed to write to notificationLog", { error: dbError });
      }
    }

    return { status, campaignName };
  }

  static async verify(companyId?: string) {
    const config = await this.getConfiguration(companyId);
    const apiKey = this.decryptApiKey(config.whatsappApiKey!);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(
        `${AISENSY_API_BASE}${AISENSY_SEND_ENDPOINT}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiKey,
            campaignName: config.whatsappCampaignName || "test",
            destination: config.whatsappNumber || "+910000000000",
            userName: "DVEPL Test",
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `AiSensy API returned ${response.status}: ${body}`
        );
      }

      return { success: true, message: "AiSensy connection verified successfully." };
    } catch (e: any) {
      throw new Error(
        e.name === "AbortError"
          ? "AiSensy API request timed out."
          : e.message || "Failed to verify AiSensy connection."
      );
    }
  }

  static async verifyWithCredentials(params: {
    apiKey: string;
    campaignName?: string;
    number?: string;
  }) {
    const { apiKey, campaignName, number } = params;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(
        `${AISENSY_API_BASE}${AISENSY_SEND_ENDPOINT}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiKey,
            campaignName: campaignName || "test",
            destination: number || "+910000000000",
            userName: "DVEPL Test",
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `AiSensy API returned ${response.status}: ${body}`
        );
      }

      return { success: true, message: "AiSensy connection verified successfully." };
    } catch (e: any) {
      throw new Error(
        e.name === "AbortError"
          ? "AiSensy API request timed out."
          : e.message || "Failed to verify AiSensy connection."
      );
    }
  }
}

export default WhatsappService;
