export type IdType = '居民身份证' | '港澳居民居住证' | '台湾居民居住证' | '外国人永久居留身份证' | '外国护照' | '中国护照' | '港澳居民来往内地通行证' | '台湾居民来往大陆通行证'
export type Gender = '男' | '女'

export type Beneficiary = {
  id: string
  owner: string
  name: string
  idType: IdType
  idNo: string
  gender?: Gender
  birthDate?: string
  phoneCode?: '+86' | '+852' | '+853' | '+886'
  phoneNumber?: string
  email?: string
  effectiveDate?: string
  verified: boolean
  createdAt: string
}

const KEY_PREFIX = 'beneficiaries:'
function genId(){ return Math.random().toString(36).slice(2) }
function today(){ return new Date().toISOString().slice(0,10) }

export function getBeneficiaries(owner: string): Beneficiary[] {
  try { return JSON.parse(localStorage.getItem(KEY_PREFIX+owner) || '[]') } catch { return [] }
}
export function saveBeneficiaries(owner: string, list: Beneficiary[]): void {
  localStorage.setItem(KEY_PREFIX+owner, JSON.stringify(list))
}
export function ensureSelfBeneficiary(owner: string): void {
  try {
    const usersRaw = localStorage.getItem('users') || '[]'
    const users = JSON.parse(usersRaw) as Array<any>
    const user = users.find((u:any)=>u.username===owner)
    if (!user) return
    const list = getBeneficiaries(owner)
    const existsSelf = list.find(x => x.name === user.fullName)
    const self: Beneficiary = {
      id: existsSelf?.id || genId(),
      owner,
      name: user.fullName,
      idType: user.idType,
      idNo: user.idNo,
      phoneCode: user.phoneCode,
      phoneNumber: user.phoneNumber,
      email: user.email,
      effectiveDate: existsSelf?.effectiveDate || today(),
      verified: true,
      createdAt: existsSelf?.createdAt || today(),
    }
    const next = existsSelf ? list.map(x => (x.id === existsSelf.id ? self : x)) : [self, ...list]
    saveBeneficiaries(owner, next)
  } catch { }
}
export function addBeneficiary(owner: string, payload: Omit<Beneficiary, 'id' | 'owner' | 'verified' | 'createdAt'>): { ok: boolean; message?: string; id?: string } {
  const list = getBeneficiaries(owner)
  const countExSelf = list.filter(x => !(x.name === payload.name && x.idNo === payload.idNo)).length
  if (countExSelf >= 8) return { ok:false, message:'受让人添加上限为8人' }
  const existsByName = list.find(x => x.name === payload.name)
  if (existsByName) return { ok:false, message:`受让人${payload.name}已经存在!` }
  const id = genId()
  const item: Beneficiary = { ...payload, id, owner, verified:true, createdAt: today(), effectiveDate: payload.effectiveDate || today() }
  saveBeneficiaries(owner, [ ...list, item ])
  return { ok:true, id }
}
export function updateBeneficiary(owner: string, id: string, patch: Partial<Pick<Beneficiary,'phoneCode'|'phoneNumber'|'email'>>): { ok: boolean; message?: string } {
  const list = getBeneficiaries(owner)
  const idx = list.findIndex(x => x.id === id)
  if (idx === -1) return { ok:false, message:'未找到受让人' }
  const next = { ...list[idx] }
  if (typeof patch.phoneCode === 'string') next.phoneCode = patch.phoneCode
  if (typeof patch.phoneNumber === 'string') next.phoneNumber = patch.phoneNumber
  if (typeof patch.email === 'string') next.email = patch.email || undefined
  list[idx] = next
  saveBeneficiaries(owner, list)
  return { ok:true }
}
export function deleteBeneficiary(owner: string, id: string): { ok: boolean } {
  const list = getBeneficiaries(owner)
  saveBeneficiaries(owner, list.filter(x => x.id !== id))
  return { ok:true }
}
export function addBeneficiariesFromPassengers(owner: string, ids: string[]): { ok: boolean; message?: string } {
  try {
    const srcRaw = localStorage.getItem('passengers:'+owner) || '[]'
    const passengers = JSON.parse(srcRaw) as Array<any>
    const list = getBeneficiaries(owner)
    const src = passengers.filter(p => ids.includes(p.id))
    const existsAny = src.find(p => list.find(b => b.name === p.name))
    if (existsAny) return { ok:false, message:`受让人${existsAny.name}已经存在!` }
    const next = [ ...list, ...src.map(p => ({ id: genId(), owner, name: p.name, idType: p.idType, idNo: p.idNo, phoneCode: p.phoneCode, phoneNumber: p.phoneNumber, effectiveDate: today(), verified: true, createdAt: today() } as Beneficiary)) ]
    const countExSelf = next.length
    if (countExSelf > 8) return { ok:false, message:'受让人添加上限为8人' }
    saveBeneficiaries(owner, next)
    return { ok:true }
  } catch { return { ok:false, message:'获取乘车人失败' } }
}
