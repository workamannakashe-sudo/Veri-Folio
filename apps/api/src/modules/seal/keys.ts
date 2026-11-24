import { EnvSecretSigner } from './signer';

export interface KeyMetadata {
  keyId: string;
  algorithm: 'Ed25519';
  publicKeyPem: string;
  validFrom: string; // ISO 8601
  validTo?: string;  // ISO 8601
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
}

export class KeyRegistry {
  private readonly keys = new Map<string, KeyMetadata>();

  public registerKey(meta: KeyMetadata): void {
    this.keys.set(meta.keyId, meta);
  }

  public getKey(keyId: string): KeyMetadata | undefined {
    return this.keys.get(keyId);
  }

  public getPublicKeyPem(keyId: string): string | undefined {
    const meta = this.keys.get(keyId);
    if (!meta || meta.status !== 'ACTIVE') return undefined;
    return meta.publicKeyPem;
  }

  public getWellKnownKeys(): {
    keys: Array<{
      kid: string;
      kty: 'OKP';
      crv: 'Ed25519';
      publicKey: string;
      validFrom: string;
      validTo?: string;
    }>;
  } {
    return {
      keys: Array.from(this.keys.values())
        .filter((k) => k.status === 'ACTIVE')
        .map((k) => ({
          kid: k.keyId,
          kty: 'OKP',
          crv: 'Ed25519',
          publicKey: k.publicKeyPem,
          validFrom: k.validFrom,
          validTo: k.validTo
        }))
    };
  }
}

export const DEFAULT_KEY_ID = 'ed25519-demo-2026-v1';
export const defaultSigner = new EnvSecretSigner(DEFAULT_KEY_ID);
export const defaultKeyRegistry = new KeyRegistry();

defaultKeyRegistry.registerKey({
  keyId: DEFAULT_KEY_ID,
  algorithm: 'Ed25519',
  publicKeyPem: defaultSigner.getPublicKey(),
  validFrom: '2026-01-01T00:00:00.000Z',
  status: 'ACTIVE'
});
