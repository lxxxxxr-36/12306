export interface LoginInput { username: string; password: string; }


export interface RegisterInput { username: string; password: string; email?: string; mobile?: string }
export interface ResetRequest { account: string }
export interface ResetPayload { account: string; code: string; newPassword: string }

// 用户库管理（localStorage，仅演示）
type UserRecord = { username: string; password: string; email?: string; mobile?: string }
const USERS_KEY = 'users';
function getUsers(): UserRecord[] { try { return JSON.parse(localStorage.getItem(USERS_KEY)||'[]'); } catch { return []; } }
function saveUsers(list: UserRecord[]) { localStorage.setItem(USERS_KEY, JSON.stringify(list)); }
function findUser(account: string): UserRecord | undefined {
  const u = getUsers();
  return u.find(x => x.username === account || x.email === account || x.mobile === account);
}

export async function registerUser(input: RegisterInput): Promise<{ok:boolean;message?:string}> {
  const { username, password, email, mobile } = input;
  await new Promise(r=>setTimeout(r, 200));
  if (!username || !/^[A-Za-z0-9_]{3,30}$/.test(username)) return { ok:false, message:'用户名需为3-30位字母数字或下划线' };
  if (email && !/.+@.+/.test(email)) return { ok:false, message:'邮箱格式不正确' };
  if (mobile && !/^1\d{10}$/.test(mobile)) return { ok:false, message:'手机号格式不正确' };
  if (!password || password.length < 6) return { ok:false, message:'密码长度至少6位' };
  const exists = findUser(username) || (email ? findUser(email) : undefined) || (mobile ? findUser(mobile) : undefined);
  if (exists) return { ok:false, message:'用户名/邮箱/手机号已存在' };
  const users = getUsers();
  users.push({ username, password, email, mobile });
  saveUsers(users);
  return { ok:true };
}

// 修改 validateLogin：如果用户存在则校验密码；否则提示需注册
export async function validateLogin(input: LoginInput): Promise<{ok:boolean;message?:string}> {
  const { username, password } = input;
  await new Promise(r=>setTimeout(r, 300));
  if (!username || username.trim().length < 3) return { ok:false, message:'请输入有效的用户名/手机号/邮箱' };
  if (!password || password.length < 6) return { ok:false, message:'密码长度至少6位' };
  const user = findUser(username);
  if (!user) return { ok:false, message:'账号不存在，请先注册' };
  if (user.password !== password) return { ok:false, message:'密码错误' };
  return { ok:true };
}

// 重置密码流程（演示）
const RESET_PREFIX = 'pwreset:';
export async function requestPasswordReset(req: ResetRequest): Promise<{ok:boolean;message?:string;code?:string}> {
  await new Promise(r=>setTimeout(r, 200));
  const user = findUser(req.account);
  if (!user) return { ok:false, message:'账号不存在' };
  const code = String(Math.floor(100000 + Math.random()*900000));
  localStorage.setItem(RESET_PREFIX+req.account, JSON.stringify({ code, ts: Date.now() }));
  return { ok:true, code };
}
export async function resetPassword(payload: ResetPayload): Promise<{ok:boolean;message?:string}> {
  await new Promise(r=>setTimeout(r, 200));
  const dataRaw = localStorage.getItem(RESET_PREFIX+payload.account);
  if (!dataRaw) return { ok:false, message:'请先发送验证码' };
  const data = JSON.parse(dataRaw);
  if (Date.now() - data.ts > 10*60*1000) return { ok:false, message:'验证码已过期' };
  if (payload.code !== data.code) return { ok:false, message:'验证码错误' };
  const users = getUsers();
  const idx = users.findIndex(u => u.username === payload.account || u.email === payload.account || u.mobile === payload.account);
  if (idx === -1) return { ok:false, message:'账号不存在' };
  users[idx].password = payload.newPassword;
  saveUsers(users);
  localStorage.removeItem(RESET_PREFIX+payload.account);
  return { ok:true };
}

// 扫码登录（演示）
const QR_PREFIX = 'qr:';
export type QrStatus = 'pending' | 'scanned' | 'confirmed' | 'expired';
export function createQrSession(): { id: string; content: string } {
  const id = Math.random().toString(36).slice(2);
  const content = 'LOGIN:'+id; // 供二维码展示
  localStorage.setItem(QR_PREFIX+id, JSON.stringify({ status: 'pending', ts: Date.now() }));
  return { id, content };
}
export function getQrStatus(id: string): QrStatus {
  const raw = localStorage.getItem(QR_PREFIX+id);
  if (!raw) return 'expired';
  const obj = JSON.parse(raw);
  if (Date.now() - obj.ts > 5*60*1000) return 'expired';
  return obj.status as QrStatus;
}
export function markQrScanned(id: string){
  const raw = localStorage.getItem(QR_PREFIX+id); if (!raw) return;
  const obj = JSON.parse(raw); obj.status = 'scanned'; localStorage.setItem(QR_PREFIX+id, JSON.stringify(obj));
}
export function markQrConfirmed(id: string){
  const raw = localStorage.getItem(QR_PREFIX+id); if (!raw) return;
  const obj = JSON.parse(raw); obj.status = 'confirmed'; localStorage.setItem(QR_PREFIX+id, JSON.stringify(obj));
}
export type Session = { username: string };
const SESSION_KEY = 'session';
export function setSession(username: string){
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username }));
  // 通知全局会话变更（当前窗口）
  window.dispatchEvent(new CustomEvent('sessionchange', { detail: { username } }));
}
export function getSession(): Session | null { const s = localStorage.getItem(SESSION_KEY); return s ? JSON.parse(s) : null; }
export function isLoggedIn(): boolean { return !!getSession(); }
export function logout(){
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new CustomEvent('sessionchange', { detail: { username: null } }));
}