import { createLogger, transports, format, Logger } from "winston";
import "winston-daily-rotate-file";
import path from "path";
import fs from "fs";

// Timezone helper for log timestamps
const timezoned = (): string => {
  return new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
};

// Base logs directory
const logsDir = path.join(process.cwd(), "storage/logs");

// Ensure base logs folder exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Reusable function to create loggers for any context (admin, user, mail, etc.)
const createCustomLogger = (logType: string, daysLimit: number): Logger => {
  const basePath = path.join(logsDir, logType);

  // Create directory if missing
  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, { recursive: true });
  }

  const infoTransport = new transports.DailyRotateFile({
    filename: path.join(basePath, "info-%DATE%.log"),
    datePattern: "DD-MM-YYYY",
    maxFiles: `${daysLimit}d`,
    level: "info",
    format: format.combine(
      format.timestamp({ format: timezoned }),
      format.json(),
    ),
  });

  const errorTransport = new transports.DailyRotateFile({
    filename: path.join(basePath, "error-%DATE%.log"),
    datePattern: "DD-MM-YYYY",
    maxFiles: `${daysLimit * 2}d`,
    level: "error",
    format: format.combine(
      format.timestamp({ format: timezoned }),
      format.json(),
    ),
  });

  return createLogger({
    transports: [infoTransport, errorTransport],
  });
};

// Exported loggers
export const adminLogs = createCustomLogger("admin", 30);
export const userLogs = createCustomLogger("user", 20);
export const customerLogs = createCustomLogger("customer", 20);
export const commonLogs = createCustomLogger("common", 10);
export const kafkaLogs = createCustomLogger("kafka", 10);

