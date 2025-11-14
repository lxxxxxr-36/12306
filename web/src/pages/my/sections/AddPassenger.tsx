import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../../hooks/useSession';
import { addPassenger } from '../../../services/passengers';
import type { IdType, BenefitType } from '../../../services/passengers';

const idOptions: IdType[] = ['居民身份证','港澳居民居住证','台湾居民居住证','外国人永久居留身份证','外国护照','中国护照','港澳居民来往内地通行证','台湾居民来往大陆通行证'];
const benefitOptions: BenefitType[] = ['成人','儿童','学生','残疾军人'];

const AddPassenger: React.FC = () => {
  const { username } = useSession();
  const navigate = useNavigate();
  const [idType, setIdType] = useState<IdType>('居民身份证');
  const [name, setName] = useState('');
  const [idNo, setIdNo] = useState('');
  const [phoneCode, setPhoneCode] = useState<'+86'|'+852'|'+853'|'+886'>('+86');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [benefit, setBenefit] = useState<BenefitType>('成人');
  const [error, setError] = useState('');

  const save = () => {
    setError('');
    if (!username) { setError('请先登录'); return; }
    if (!name || !/^[\u4e00-\u9fa5A-Za-z·\s]{2,30}$/.test(name)) { setError('姓名需为2-30位中文或字母'); return; }
    const digitCount = (idNo.match(/\d/g) || []).length;
    const validDigits = idType === '居民身份证' ? (digitCount >= 17 && digitCount <= 18) :
      (['外国护照','中国护照'].includes(idType) ? (digitCount >= 5 && digitCount <= 18) : (digitCount >= 8 && digitCount <= 18));
    if (!validDigits) { setError('证件号码数字位数不符合要求'); return; }
    const phoneOk = phoneCode === '+86' ? /^\d{11}$/.test(phoneNumber) : /^\d{5,20}$/.test(phoneNumber);
    if (!phoneOk) { setError('电话格式不正确'); return; }
    addPassenger(username, {
      name,
      idType,
      idNo,
      phoneCode,
      phoneNumber,
      benefit,
    });
    navigate('/my/common/passengers');
  };

  return (
    <div>
      <div style={{fontWeight:700, marginBottom:12}}>基本信息</div>
      <div style={{display:'grid', gridTemplateColumns:'160px 1fr', gap:'8px 12px', marginBottom:16}}>
        <div>证件类型*</div>
        <div><select value={idType} onChange={e=>setIdType(e.target.value as IdType)}>{idOptions.map(o=> <option key={o}>{o}</option>)}</select></div>
        <div>姓名*</div>
        <div><input type="text" placeholder="请输入姓名" value={name} onChange={e=>setName(e.target.value)} /></div>
        <div>证件号码*</div>
        <div><input type="text" placeholder="请输入证件号码" value={idNo} onChange={e=>setIdNo(e.target.value)} /></div>
      </div>

      <div style={{fontWeight:700, marginTop:8}}>联系方式<span style={{color:'#ff6a00', fontWeight:400, marginLeft:8}}>(请提供乘车人真实有效的联系方式)</span></div>
      <div style={{display:'grid', gridTemplateColumns:'160px 1fr', gap:'8px 12px', margin:'12px 0 16px'}}>
        <div>手机号码*</div>
        <div style={{display:'flex', gap:8}}>
          <select value={phoneCode} onChange={e=>setPhoneCode(e.target.value as ('+86'|'+852'|'+853'|'+886'))}>
            <option value='+86'>+86 中国</option>
            <option value='+852'>+852 中国香港</option>
            <option value='+853'>+853 中国澳门</option>
            <option value='+886'>+886 中国台湾</option>
          </select>
          <input type="tel" placeholder="请输入手机号" value={phoneNumber} onChange={e=>setPhoneNumber(e.target.value)} />
        </div>
        <div></div>
        <div style={{color:'#ff6a00'}}>请您填写乘车人真实有效的联系方式，以便接收铁路部门推送的重要服务信息，以及在紧急特殊情况下的联系。</div>
      </div>

      <div style={{fontWeight:700, marginBottom:12}}>附加信息</div>
      <div style={{display:'grid', gridTemplateColumns:'160px 1fr', gap:'8px 12px', marginBottom:16}}>
        <div>优惠(待)类型*</div>
        <div><select value={benefit} onChange={e=>setBenefit(e.target.value as BenefitType)}>{benefitOptions.map(o=> <option key={o}>{o}</option>)}</select></div>
      </div>

      {error && <div style={{color:'#d93025', marginBottom:12}}>{error}</div>}

      <div style={{display:'flex', gap:12}}>
        <button onClick={()=>navigate('/my/common/passengers')}>取消</button>
        <button className="primary" onClick={save}>保存</button>
      </div>
    </div>
  );
};

export default AddPassenger;