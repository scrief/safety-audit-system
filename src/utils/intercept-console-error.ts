// src/utils/intercept-console-error.ts
const originalConsoleError = console.error;

export const interceptConsoleError = () => {
  console.error = (...args) => {
    // Get stack trace
    const stack = new Error().stack;
    const timestamp = new Date().toISOString();
    
    // Format the error message
    const formattedError = args.map(arg => {
      if (arg instanceof Error) {
        return {
          name: arg.name,
          message: arg.message,
          stack: arg.stack,
        };
      }
      return arg;
    });

    // Log detailed error information
    originalConsoleError(
      `[${timestamp}] Error Details:`,
      JSON.stringify(formattedError, null, 2),
      '\nStack Trace:',
      stack
    );
  };
};

export const restoreConsoleError = () => {
  console.error = originalConsoleError;
};
