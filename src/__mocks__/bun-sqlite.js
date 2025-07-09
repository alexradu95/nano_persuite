// Minimal mock for bun:sqlite - only needed for module imports during testing
// Tests use injected mock repositories, so this is never actually used
class Database {
  constructor() {}
  exec() {}
  prepare() {
    return {
      run: () => {},
      all: () => [],
      get: () => null
    };
  }
  close() {}
}

module.exports = { Database };