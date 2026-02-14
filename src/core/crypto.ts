function bufToB64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf); let s=''
  for (let i=0;i<bytes.length;i++) s += String.fromCharCode(bytes[i])
  return btoa(s)
}
function b64ToBuf(b64: string) {
  const s=atob(b64); const bytes=new Uint8Array(s.length)
  for (let i=0;i<s.length;i++) bytes[i]=s.charCodeAt(i)
  return bytes.buffer
}
async function deriveKey(password: string, salt: Uint8Array) {
  const enc=new TextEncoder()
  const km=await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey','deriveBits'])
  return crypto.subtle.deriveKey(
    { name:'PBKDF2', salt, iterations:250_000, hash:'SHA-256' },
    km,
    { name:'AES-GCM', length:256 },
    false,
    ['encrypt','decrypt']
  )
}
async function deriveVerifier(password: string, salt: Uint8Array) {
  const enc=new TextEncoder()
  const km=await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits=await crypto.subtle.deriveBits({ name:'PBKDF2', salt, iterations:250_000, hash:'SHA-256' }, km, 256)
  return new Uint8Array(bits)
}
export type StoredPassword = { saltB64:string, verifierB64:string }
export async function createPassword(password: string): Promise<StoredPassword>{
  const salt=crypto.getRandomValues(new Uint8Array(16))
  const ver=await deriveVerifier(password, salt)
  return { saltB64: bufToB64(salt.buffer), verifierB64: bufToB64(ver.buffer) }
}
export async function verifyPassword(password: string, stored: StoredPassword): Promise<boolean>{
  const salt=new Uint8Array(b64ToBuf(stored.saltB64))
  const ver=new Uint8Array(b64ToBuf(stored.verifierB64))
  const test=await deriveVerifier(password, salt)
  let ok=0; for(let i=0;i<test.length;i++) ok |= (test[i]^ver[i])
  return ok===0
}
export type BackupFileV1={ v:1, saltB64:string, ivB64:string, dataB64:string }
export async function encryptBackup(password:string, plain:string): Promise<BackupFileV1>{
  const salt=crypto.getRandomValues(new Uint8Array(16))
  const iv=crypto.getRandomValues(new Uint8Array(12))
  const key=await deriveKey(password, salt)
  const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv}, key, new TextEncoder().encode(plain))
  return { v:1, saltB64: bufToB64(salt.buffer), ivB64: bufToB64(iv.buffer), dataB64: bufToB64(ct) }
}
export async function decryptBackup(password:string, file:BackupFileV1): Promise<string>{
  const salt=new Uint8Array(b64ToBuf(file.saltB64))
  const iv=new Uint8Array(b64ToBuf(file.ivB64))
  const data=b64ToBuf(file.dataB64)
  const key=await deriveKey(password, salt)
  const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv}, key, data)
  return new TextDecoder().decode(pt)
}
