import bcrypt from 'bcrypt';

const DEFAULT_ROUNDS = 10;

function rounds(): number {
  const env = process.env.BCRYPT_ROUNDS;
  const parsed = env ? parseInt(env, 10) : DEFAULT_ROUNDS;
  return Number.isFinite(parsed) && parsed >= 10 ? parsed : DEFAULT_ROUNDS;
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, rounds());
}

export function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
