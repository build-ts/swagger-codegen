export class Logger {
  static info(message: string) {
    console.log(`ℹ️  ${message}`);
  }

  static success(message: string) {
    console.log(`✅ ${message}`);
  }

  static warning(message: string) {
    console.log(`⚠️  ${message}`);
  }

  static error(message: string) {
    console.error(`❌ ${message}`);
  }

  static step(message: string) {
    console.log(`📍 ${message}`);
  }

  static created(message: string) {
    console.log(`✨ ${message}`);
  }

  static updated(message: string) {
    console.log(`📝 ${message}`);
  }

  static skipped(message: string) {
    console.log(`⏭️  ${message}`);
  }
}