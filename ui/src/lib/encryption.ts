// Simple encryption utility using Web Crypto API
export async function encryptFile(file: File, password: string): Promise<Blob> {
  const fileBuffer = await file.arrayBuffer();
  const passwordKey = await getKeyFromPassword(password);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encryptedContent = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    passwordKey,
    fileBuffer
  );
  
  // Combine IV and encrypted content
  const combined = new Uint8Array(iv.length + encryptedContent.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedContent), iv.length);
  
  return new Blob([combined], { type: 'application/octet-stream' });
}

export async function decryptFile(encryptedBlob: Blob, password: string): Promise<ArrayBuffer> {
  const buffer = await encryptedBlob.arrayBuffer();
  const data = new Uint8Array(buffer);
  
  // Extract IV and encrypted content
  const iv = data.slice(0, 12);
  const encryptedContent = data.slice(12);
  
  const passwordKey = await getKeyFromPassword(password);
  
  return await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    passwordKey,
    encryptedContent
  );
}

async function getKeyFromPassword(password: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('cryptseal-salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}
