import crypto from 'crypto';

export interface Signer {
  readonly keyId: string;
  sign(data: string | Buffer): string;
  getPublicKey(): string;
}

/**
 * In-memory / Environment Ed25519 Signer implementation.
 * Sits behind the Signer interface so KMS or Hardware Security Modules (HSM)
 * can be plugged in without changing domain logic.
 */
export class EnvSecretSigner implements Signer {
  public readonly keyId: string;
  private readonly privateKey: crypto.KeyObject;
  private readonly publicKey: crypto.KeyObject;

  constructor(keyId: string, privateKeyPemOrDer?: string, publicKeyPemOrDer?: string) {
    this.keyId = keyId;

    if (privateKeyPemOrDer && publicKeyPemOrDer) {
      this.privateKey = crypto.createPrivateKey(privateKeyPemOrDer);
      this.publicKey = crypto.createPublicKey(publicKeyPemOrDer);
    } else {
      // Generate a new ephemeral Ed25519 key pair if not provided (e.g. for testing)
      const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
      this.privateKey = privateKey;
      this.publicKey = publicKey;
    }
  }

  /**
   * Signs data with Ed25519 using SHA-512 internally per RFC 8032.
   * Returns base64url or hex signature.
   */
  public sign(data: string | Buffer): string {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf-8');
    const signature = crypto.sign(null, buffer, this.privateKey);
    return signature.toString('hex');
  }

  /**
   * Returns public key in SPKI PEM format.
   */
  public getPublicKey(): string {
    return this.publicKey.export({ type: 'spki', format: 'pem' }).toString();
  }

  /**
   * Exports raw private key in PKCS8 PEM format (for persistence/env).
   */
  public getPrivateKeyPem(): string {
    return this.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
  }
}

/**
 * Verifies an Ed25519 signature against data and a public key.
 */
export function verifyEd25519(data: string | Buffer, signatureHex: string, publicKeyPem: string): boolean {
  try {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf-8');
    const signature = Buffer.from(signatureHex, 'hex');
    const pubKeyObj = crypto.createPublicKey(publicKeyPem);
    return crypto.verify(null, buffer, pubKeyObj, signature);
  } catch {
    return false;
  }
}
