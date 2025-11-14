import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSession } from '../../../hooks/useSession';
import { getPassenger, updatePassenger } from '../../../services/passengers';
import type { BenefitType } from '../../../services/passengers';

const benefitOptions: BenefitType[] = ['成人','儿童','学生','残疾军人'];

function maskId(id: string){ if (id.length <= 7) return id; return id.slice(0,4)+'************'+id.slice(-3); }

const EditPassenger: React.FC = () => {
  const { username } = useSession();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState('');
  const [idType, setIdType] = useState('');
  const [idNo, setIdNo] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [phoneCode, setPhoneCode] = useState<'+86'|'+852'|'+853'|'+886'>('+86');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [benefit, setBenefit] = useState<BenefitType>('成人');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!username || !id) return;
    const p = getPassenger(username, id);
    if (!p) { setLoaded(true); return; }
    setName(p.name);
    setIdType(p.idType);
    setIdNo(p.idNo);
    setPhoneCode(p.phoneCode);
    setPhoneNumber(p.phoneNumber);
    setBenefit(p.benefit);
    setCreatedAt(p.createdAt || '');
    setLoaded(true);
  }, [username, id]);

  const save = () => {
    setError('');
    if (!username || !id) { setError('请先登录'); return; }
    const phoneOk = phoneCode === '+86' ? /^\d{11}$/.test(phoneNumber) : /^\d{5,20}$/.test(phoneNumber);
    if (!phoneOk) { setError('电话格式不正确'); return; }
    updatePassenger(username, id, { phoneCode, phoneNumber, benefit });
    navigate('/my/common/passengers');
  };

  if (!loaded) return <div></div>;
  const notFound = !name;

  return (
    <div>
      {notFound ? (
        <div style={{color:'#d93025', marginBottom:12}}>未找到乘车人</div>
      ) : (
        <>
          <div style={{fontWeight:700, marginBottom:12}}>基本信息</div>
          <div style={{display:'grid', gridTemplateColumns:'160px 1fr', gap:'8px 12px', marginBottom:16}}>
            <div>证件类型*</div>
            <div>{idType}</div>
            <div>姓名*</div>
            <div>{name}</div>
            <div>证件号码*</div>
            <div>{maskId(idNo)}</div>
            <div>国家/地区</div>
            <div>中国 China</div>
            <div>添加日期</div>
            <div>{createdAt || '--'}</div>
            <div>核验状态</div>
            <div><span style={{color:'#179d28'}}>已通过</span></div>
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
        </>
      )}
    </div>
  );
};

export default EditPassenger;