const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const index = trimmed.indexOf('=');
    if (index === -1) return;

    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
} else {
  console.warn('[config] No se encontró el archivo .env, se usan valores por defecto.');
}

module.exports = {
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',

  JWT_SECRET: process.env.JWT_SECRET || 'secreto_de_desarrollo',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  RESET_TOKEN_EXPIRES_MINUTES: Number(process.env.RESET_TOKEN_EXPIRES_MINUTES || 60),

  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: Number(process.env.DB_PORT || 5432),
  DB_DIALECT: process.env.DB_DIALECT || 'postgres',
  DB_SSL: process.env.DB_SSL !== 'false',
};
