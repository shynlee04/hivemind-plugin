interface ToolOutput {
  success: boolean;
  data?: unknown;
  error?: string;
  message?: string;
}

function stringifyOutput(output: ToolOutput): string {
  return JSON.stringify(output, null, 2);
}

export function toJsonOutput(data: unknown, message?: string): string {
  const output: ToolOutput = {
    success: true,
    data,
    ...(message ? { message } : {}),
  };

  return stringifyOutput(output);
}

export function toSuccessOutput(message: string): string {
  const output: ToolOutput = {
    success: true,
    message,
  };

  return stringifyOutput(output);
}

export function toErrorOutput(error: string, context?: string): string {
  const output: ToolOutput = {
    success: false,
    error,
    ...(context ? { message: context } : {}),
  };

  return stringifyOutput(output);
}
