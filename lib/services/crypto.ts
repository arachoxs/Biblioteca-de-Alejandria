import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

export async function encryptCardNumber(plainNumber: string): Promise<string> {
  return bcrypt.hash(plainNumber, BCRYPT_ROUNDS);
}

export async function verifyCardNumber(
  plainNumber: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plainNumber, hash);
}

export async function encryptCVV(plainCVV: string): Promise<string> {
  return bcrypt.hash(plainCVV, BCRYPT_ROUNDS);
}

export async function verifyCVV(
  plainCVV: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plainCVV, hash);
}