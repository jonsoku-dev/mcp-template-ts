import { processData, processDataTool } from "./processData.js";
import { processWithRetry, processWithRetryTool } from "./processWithRetry.js";

// Export tool definitions
export const tools = [processDataTool, processWithRetryTool];

// Export tool implementations
export const toolHandlers = {
  [processDataTool.name]: processData,
  [processWithRetryTool.name]: processWithRetry,
};
