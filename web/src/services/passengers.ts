export type IdType = '居民身份证' | '港澳居民居住证' | '台湾居民居住证' | '外国人永久居留身份证' | '外国护照' | '中国护照' | '港澳居民来往内地通行证' | '台湾居民来往大陆通行证'
export type BenefitType = '成人' | '儿童' | '学生' | '残疾军人'
export type Passenger = {
  id: string;
  owner: string;
  isSelf: boolean;
  name: string;
  idType: IdType;
  idNo: string;
  phoneCode: '+86' | '+852' | '+853' | '+886';
  phoneNumber: string;
  benefit: BenefitType;
  verified: boolean;
  createdAt?: string;
};

const KEY_PREFIX = 'passengers:';

function genId(){ return Math.random().toString(36).slice(2); }

export function getPassengers(owner: string): Passenger[] {
  try { return JSON.parse(localStorage.getItem(KEY_PREFIX+owner) || '[]'); } catch { return []; }
}
export function savePassengers(owner: string, list: Passenger[]): void {
  localStorage.setItem(KEY_PREFIX+owner, JSON.stringify(list));
}
export function ensureSelfPassenger(owner: string, payload: { fullName: string; idType: IdType; idNo: string; phoneCode: '+86' | '+852' | '+853' | '+886'; phoneNumber: string; benefit: BenefitType }){
  const list = getPassengers(owner);
  const existsSelf = list.find(x => x.isSelf);
  const self: Passenger = {
    id: existsSelf?.id || genId(),
    owner,
    isSelf: true,
    name: payload.fullName,
    idType: payload.idType,
    idNo: payload.idNo,
    phoneCode: payload.phoneCode,
    phoneNumber: payload.phoneNumber,
    benefit: payload.benefit,
    verified: true,
    createdAt: existsSelf?.createdAt || new Date().toISOString().slice(0,10),
  };
  const newList = existsSelf ? list.map(x => x.isSelf ? self : x) : [self, ...list];
  savePassengers(owner, newList);
}
export function deletePassengers(owner: string, ids: string[]){
  const list = getPassengers(owner);
  savePassengers(owner, list.filter(x => !ids.includes(x.id)));
}
export function deletePassenger(owner: string, id: string){ deletePassengers(owner, [id]); }
export function addPassenger(owner: string, payload: { name: string; idType: IdType; idNo: string; phoneCode: '+86'|'+852'|'+853'|'+886'; phoneNumber: string; benefit: BenefitType }){
  const list = getPassengers(owner);
  const p: Passenger = {
    id: genId(),
    owner,
    isSelf: false,
    name: payload.name,
    idType: payload.idType,
    idNo: payload.idNo,
    phoneCode: payload.phoneCode,
    phoneNumber: payload.phoneNumber,
    benefit: payload.benefit,
    verified: true,
    createdAt: new Date().toISOString().slice(0,10),
  };
  savePassengers(owner, [...list, p]);
}
export function getPassenger(owner: string, id: string): Passenger | undefined {
  const list = getPassengers(owner);
  return list.find(x => x.id === id);
}
export function updatePassenger(owner: string, id: string, patch: Partial<Pick<Passenger, 'phoneCode'|'phoneNumber'|'benefit'>>): void {
  const list = getPassengers(owner);
  const next = list.map(x => x.id === id ? { ...x, ...patch } : x);
  savePassengers(owner, next);
}