/**
 * ==============================================================================
 * PASSVAULT++ PURE BINARY VAULT FORMAT SPECIFICATION (.pvdb v1.0)
 * ==============================================================================
 * Magic: "PVDB" (0x50, 0x56, 0x44, 0x42)
 * Version: 0x01
 * Cipher Suite: 0x01 (AES-256-GCM + PBKDF2/Argon2id)
 * Flags: 0x0000 (2 Bytes Reserved)
 * Salt: 16 Bytes (Raw CSPRNG Salt)
 * Nonce / IV: 12 Bytes (Raw AES-GCM IV)
 * Payload Length: 4 Bytes (Big-Endian uint32)
 * Ciphertext + Tag: N Bytes (Raw AES-GCM Ciphertext with 16-byte GHASH Tag)
 * ==============================================================================
 */

export const PVDB_MAGIC = 0x50564442; // "PVDB"
export const PVDB_VERSION = 0x01;
export const PVDB_SUITE_AES256GCM = 0x01;
export const PVDB_HEADER_SIZE = 40;

export interface BinaryVaultPayload {
  salt: Uint8Array; // 16 Bytes
  iv: Uint8Array;   // 12 Bytes
  ciphertext: Uint8Array; // N Bytes (includes 16-byte GHASH tag)
}

/**
 * Packs raw cryptographic buffers into a pure binary .pvdb container
 */
export const packBinaryVault = (
  salt: Uint8Array,
  iv: Uint8Array,
  ciphertextWithTag: Uint8Array
): Uint8Array => {
  if (salt.length !== 16) {
    throw new Error(`Invalid salt length: expected 16 bytes, got ${salt.length}`);
  }
  if (iv.length !== 12) {
    throw new Error(`Invalid IV length: expected 12 bytes, got ${iv.length}`);
  }

  const payloadLength = ciphertextWithTag.length;
  const totalLength = PVDB_HEADER_SIZE + payloadLength;
  const buffer = new Uint8Array(totalLength);
  const view = new DataView(buffer.buffer);

  // 1. Magic Signature (4 Bytes: "PVDB")
  view.setUint32(0, PVDB_MAGIC, false); // Big-Endian

  // 2. Version (1 Byte)
  view.setUint8(4, PVDB_VERSION);

  // 3. Cipher Suite (1 Byte)
  view.setUint8(5, PVDB_SUITE_AES256GCM);

  // 4. Flags / Reserved (2 Bytes)
  view.setUint16(6, 0x0000, false);

  // 5. KDF Master Salt (16 Bytes, offset 8..24)
  buffer.set(salt, 8);

  // 6. Vault Nonce / IV (12 Bytes, offset 24..36)
  buffer.set(iv, 24);

  // 7. Payload Length (4 Bytes, offset 36..40)
  view.setUint32(36, payloadLength, false);

  // 8. Ciphertext + GHASH Tag (N Bytes, offset 40..)
  buffer.set(ciphertextWithTag, PVDB_HEADER_SIZE);

  return buffer;
};

/**
 * Unpacks and validates a binary .pvdb container into its raw cryptographic buffers
 */
export const unpackBinaryVault = (binaryData: Uint8Array): BinaryVaultPayload => {
  if (binaryData.length < PVDB_HEADER_SIZE) {
    throw new Error("Invalid .pvdb container: file size is smaller than header size (40 bytes)");
  }

  const view = new DataView(binaryData.buffer, binaryData.byteOffset, binaryData.byteLength);

  // 1. Validate Magic Signature
  const magic = view.getUint32(0, false);
  if (magic !== PVDB_MAGIC) {
    throw new Error(`Corrupted binary vault: invalid magic signature (0x${magic.toString(16)})`);
  }

  // 2. Validate Version
  const version = view.getUint8(4);
  if (version !== PVDB_VERSION) {
    throw new Error(`Unsupported .pvdb version: ${version}`);
  }

  // 3. Extract KDF Salt (16 Bytes)
  const salt = binaryData.slice(8, 24);

  // 4. Extract Nonce / IV (12 Bytes)
  const iv = binaryData.slice(24, 36);

  // 5. Read Payload Length
  const payloadLength = view.getUint32(36, false);
  const expectedTotal = PVDB_HEADER_SIZE + payloadLength;

  if (binaryData.length < expectedTotal) {
    throw new Error(`Truncated .pvdb container: expected ${expectedTotal} bytes, got ${binaryData.length}`);
  }

  // 6. Extract Ciphertext + Tag
  const ciphertext = binaryData.slice(PVDB_HEADER_SIZE, expectedTotal);

  return { salt, iv, ciphertext };
};

/**
 * Sniffs first 4 bytes to check if data is binary .pvdb or legacy JSON .pv
 */
export const isBinaryVault = (data: Uint8Array): boolean => {
  if (data.length < 4) return false;
  const view = new DataView(data.buffer, data.byteOffset, 4);
  return view.getUint32(0, false) === PVDB_MAGIC;
};
