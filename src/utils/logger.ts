import winston from "winston";

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, ...rest }) => {
      const meta = Object.keys(rest).length ? JSON.stringify(rest) : "";
      return `${timestamp} ${level}: ${message} ${meta}`;
    }),
  ),
  transports: [
    new winston.transports.Console({
      stderrLevels: ["error", "warn", "info", "debug"],
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  ],
});
