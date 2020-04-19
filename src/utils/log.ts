enum LogLevel {
  INFO = 'INFO',
  ERROR = 'ERROR',
  WARNING = 'WARN'
}

function log(level: LogLevel, message: string): void {
  const timestamp: Date = new Date();
  console.log(`(${level}) [${timestamp.toLocaleString()}] ${message}`);
}

export function info(message: string): void {
  log(LogLevel.INFO, message);
}

export function error(message: string): void {
  log(LogLevel.ERROR, message);
}

export function warning(message: string): void {
  log(LogLevel.WARNING, message);
}
