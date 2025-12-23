export interface LoginInput { username: string; password: string; }


export type IdType = '居民身份证' | '港澳居民居住证' | '台湾居民居住证' | '外国人永久居留身份证' | '外国护照' | '中国护照' | '港澳居民来往内地通行证' | '台湾居民来往大陆通行证'
export type BenefitType = '成人' | '儿童' | '学生' | '残疾军人'
export interface RegisterInput {
  username: string;
  password: string;
  confirmPassword: string;
  idType: IdType;
  fullName: string;
  idNo: string;
  benefit: BenefitType;
  email?: string;
  phoneCode: '+86' | '+852' | '+853' | '+886';
  phoneNumber: string;
}
export interface ResetRequest { account: string }
export interface ResetPayload { account: string; code: string; newPassword: string }
export interface VerifyCodeReq { account: string; code: string }
export interface ValidateIdentityReq { phoneNumber: string; idType: IdType; idNo: string }

// 用户库管理（localStorage，仅演示）
type UserRecord = {
  username: string;
  password: string;
  email?: string;
  phoneCode: '+86' | '+852' | '+853' | '+886';
  phoneNumber: string;
  idType: IdType;
  fullName: string;
  idNo: string;
  benefit: BenefitType;
}
const USERS_KEY = 'users';
function getUsers(): UserRecord[] { try { return JSON.parse(localStorage.getItem(USERS_KEY)||'[]'); } catch { return []; } }
function saveUsers(list: UserRecord[]) { localStorage.setItem(USERS_KEY, JSON.stringify(list)); }
function findUser(account: string): UserRecord | undefined {
  const u = getUsers();
  return u.find(x => x.username === account || x.email === account || x.phoneNumber === account);
}
export function getUserByUsername(username: string): UserRecord | undefined { return getUsers().find(x => x.username === username); }
export async function updateUserInfo(username: string, patch: Partial<{ email: string; phoneCode: '+86' | '+852' | '+853' | '+886'; phoneNumber: string; benefit: BenefitType }>): Promise<{ok:boolean;message?:string}> {
  await new Promise(r=>setTimeout(r, 150));
  const users = getUsers();
  const idx = users.findIndex(u => u.username === username);
  if (idx === -1) return { ok:false, message:'用户不存在' };
  const next = { ...users[idx] } as UserRecord;
  if (typeof patch.email === 'string') {
    if (patch.email && !/^.+@.+\..+$/.test(patch.email)) return { ok:false, message:'邮箱格式不正确' };
    next.email = patch.email || undefined;
  }
  if (typeof patch.phoneCode === 'string' || typeof patch.phoneNumber === 'string') {
    const code = (patch.phoneCode ?? next.phoneCode);
    const num = (patch.phoneNumber ?? next.phoneNumber);
    const phoneOk = code === '+86' ? /^\d{11}$/.test(num) : /^\d{5,20}$/.test(num);
    if (!num || !phoneOk) return { ok:false, message:'电话格式不正确' };
    next.phoneCode = code;
    next.phoneNumber = num;
  }
  if (typeof patch.benefit === 'string') {
    next.benefit = patch.benefit as BenefitType;
  }
  users[idx] = next;
  saveUsers(users);
  try {
    const mod = await import('./passengers');
    mod.ensureSelfPassenger(username, { fullName: next.fullName, idType: next.idType, idNo: next.idNo, phoneCode: next.phoneCode, phoneNumber: next.phoneNumber, benefit: next.benefit });
  } catch (e) { void e; }
  return { ok:true };
}

export async function registerUser(input: RegisterInput): Promise<{ok:boolean;message?:string}> {
  const { username, password, confirmPassword, idType, fullName, idNo, benefit, email, phoneCode, phoneNumber } = input;
  await new Promise(r=>setTimeout(r, 200));
  if (!username || !/^[A-Za-z][A-Za-z0-9_]{5,29}$/.test(username)) return { ok:false, message:'用户名需以字母开头，6-30位字母数字或下划线' };
  if (!password || password.length < 6) return { ok:false, message:'密码长度至少6位' };
  if (password !== confirmPassword) return { ok:false, message:'两次输入的密码不一致' };
  if (!fullName || !/^[\u4e00-\u9fa5A-Za-z·\s]{2,30}$/.test(fullName)) return { ok:false, message:'姓名需为2-30位中文或字母' };
  const validIdDigitCount = (t: IdType, v: string) => {
    const c = (v.match(/\d/g) || []).length;
    switch (t) {
      case '居民身份证': return c >= 17 && c <= 18;
      case '外国护照':
      case '中国护照': return c >= 5 && c <= 18;
      default: return c >= 8 && c <= 18;
    }
  };
  if (!validIdDigitCount(idType, idNo)) return { ok:false, message:'证件号码数字位数不符合要求' };
  if (email && !/^.+@.+\..+$/.test(email)) return { ok:false, message:'邮箱格式不正确' };
  const phoneOk = phoneCode === '+86' ? /^\d{11}$/.test(phoneNumber) : /^\d{5,20}$/.test(phoneNumber);
  if (!phoneNumber || !phoneOk) return { ok:false, message:'电话格式不正确' };
  const exists = findUser(username) || (email ? findUser(email) : undefined) || ((phoneCode === '+86' ? findUser(phoneNumber) : undefined));
  if (exists) return { ok:false, message:'用户名/邮箱/手机号已存在' };
  const users = getUsers();
  users.push({ username, password, email, phoneCode, phoneNumber, idType, fullName, idNo, benefit });
  saveUsers(users);
  try {
    const mod = await import('./passengers');
    mod.ensureSelfPassenger(username, { fullName, idType, idNo, phoneCode, phoneNumber, benefit });
  } catch (e) { void e; }
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
  try {
    fetch('/__dev/log-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ account: req.account, code }) });
  } catch (e) { void e; }
  return { ok:true, code };
}

export async function verifyResetCode(req: VerifyCodeReq): Promise<{ok:boolean;message?:string}> {
  await new Promise(r=>setTimeout(r, 150));
  const dataRaw = localStorage.getItem(RESET_PREFIX+req.account);
  if (!dataRaw) return { ok:false, message:'请先发送验证码' };
  const data = JSON.parse(dataRaw);
  if (Date.now() - data.ts > 60*1000) return { ok:false, message:'验证码已过期' };
  if (req.code !== data.code) return { ok:false, message:'验证码错误' };
  return { ok:true };
}

export async function validateAccountIdentity(req: ValidateIdentityReq): Promise<{ok:boolean;message?:string}> {
  await new Promise(r=>setTimeout(r, 150));
  const user = findUser(req.phoneNumber);
  if (!user) return { ok:false, message:'账号不存在' };
  if (user.idType !== req.idType || user.idNo !== req.idNo) return { ok:false, message:'手机号与证件信息不匹配' };
  return { ok:true };
}
export async function resetPassword(payload: ResetPayload): Promise<{ok:boolean;message?:string}> {
  await new Promise(r=>setTimeout(r, 200));
  const dataRaw = localStorage.getItem(RESET_PREFIX+payload.account);
  if (!dataRaw) return { ok:false, message:'请先发送验证码' };
  const data = JSON.parse(dataRaw);
  if (Date.now() - data.ts > 60*1000) return { ok:false, message:'验证码已过期' };
  if (payload.code !== data.code) return { ok:false, message:'验证码错误' };
  const users = getUsers();
  const idx = users.findIndex(u => u.username === payload.account || u.email === payload.account || u.phoneNumber === payload.account);
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
