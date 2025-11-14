import React, { useEffect, useMemo, useState } from 'react';
import { useSession } from '../../../hooks/useSession';
import { getUserByUsername, updateUserInfo } from '../../../services/auth';
import type { BenefitType } from '../../../services/passengers';

function maskId(id: string){ if (id.length <= 7) return id; return id.slice(0,4)+'************'+id.slice(-3); }
function maskPhone(code: string, num: string){ if (!num) return ''; if (num.length < 7) return `(${code})`+num; return `(${code})`+num.slice(0,3)+'****'+num.slice(-4); }

const benefitOptions: BenefitType[] = ['成人','儿童','学生','残疾军人'];

const ProfileView: React.FC = () => {
  const { username } = useSession();
  const [ver, setVer] = useState(0);
  const [editingContact, setEditingContact] = useState(false);
  const [editingExtra, setEditingExtra] = useState(false);
  const [phoneCode, setPhoneCode] = useState<'+86'|'+852'|'+853'|'+886'>('+86');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [benefit, setBenefit] = useState<BenefitType>('成人');
  const [error, setError] = useState('');
  const [okVisible, setOkVisible] = useState(false);

  const user = useMemo(() => username ? getUserByUsername(username) : undefined, [username, ver]);

  useEffect(() => {
    if (!user) return;
    setPhoneCode(user.phoneCode);
    setPhoneNumber(user.phoneNumber);
    setEmail(user.email || '');
    setBenefit(user.benefit);
  }, [user]);

  const saveContact = async () => {
    setError('');
    if (!username) { setError('请先登录'); return; }
    const phoneOk = phoneCode === '+86' ? /^\d{11}$/.test(phoneNumber) : /^\d{5,20}$/.test(phoneNumber);
    if (!phoneNumber || !phoneOk) { setError('电话格式不正确'); return; }
    if (email && !/^.+@.+\..+$/.test(email)) { setError('邮箱格式不正确'); return; }
    const res = await updateUserInfo(username, { phoneCode, phoneNumber, email });
    if (!res.ok) { setError(res.message || '保存失败'); return; }
    setEditingContact(false);
    setOkVisible(true);
    setVer(x=>x+1);
  };
  const saveExtra = async () => {
    setError('');
    if (!username) { setError('请先登录'); return; }
    const res = await updateUserInfo(username, { benefit });
    if (!res.ok) { setError(res.message || '保存失败'); return; }
    setEditingExtra(false);
    setOkVisible(true);
    setVer(x=>x+1);
  };

  if (!user) return <div>请先登录</div>;

  return (
    <div>
      <div style={{fontWeight:700, marginBottom:12}}>基本信息</div>
      <div style={{display:'grid', gridTemplateColumns:'160px 1fr', gap:'8px 12px', marginBottom:16}}>
        <div>用户名*</div>
        <div>{user.username}</div>
        <div>姓名*</div>
        <div>{user.fullName}</div>
        <div>国家/地区</div>
        <div>中国 China</div>
        <div>证件类型*</div>
        <div>{user.idType}</div>
        <div>证件号码*</div>
        <div>{maskId(user.idNo)}</div>
        <div>核验状态</div>
        <div><span style={{color:'#179d28'}}>已通过</span></div>
      </div>

      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', borderTop:'1px solid #eee', paddingTop:12}}>
        <div style={{fontWeight:700}}>联系方式</div>
        {!editingContact ? <button onClick={()=>setEditingContact(true)}>编辑</button> : <button className="primary" onClick={saveContact}>保存</button>}
      </div>
      <div style={{display:'grid', gridTemplateColumns:'160px 1fr', gap:'8px 12px', margin:'12px 0 16px'}}>
        <div>手机号*</div>
        <div style={{display:'flex', gap:8}}>
          {editingContact ? (
            <>
              <select value={phoneCode} onChange={e=>setPhoneCode(e.target.value as ('+86'|'+852'|'+853'|'+886'))}>
                <option value='+86'>+86 中国</option>
                <option value='+852'>+852 中国香港</option>
                <option value='+853'>+853 中国澳门</option>
                <option value='+886'>+886 中国台湾</option>
              </select>
              <input type="tel" value={phoneNumber} onChange={e=>setPhoneNumber(e.target.value)} />
            </>
          ) : (
            <div>{maskPhone(user.phoneCode, user.phoneNumber)} <span style={{color:'#ff6a00'}}>已通过核验</span></div>
          )}
        </div>
        <div>邮箱</div>
        <div>
          {editingContact ? (
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="请填写邮箱" />
          ) : (
            <span>{user.email || ''}</span>
          )}
        </div>
      </div>

      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', borderTop:'1px solid #eee', paddingTop:12}}>
        <div style={{fontWeight:700}}>附加信息</div>
        {!editingExtra ? <button onClick={()=>setEditingExtra(true)}>编辑</button> : <button className="primary" onClick={saveExtra}>保存</button>}
      </div>
      <div style={{display:'grid', gridTemplateColumns:'160px 1fr', gap:'8px 12px', margin:'12px 0 16px'}}>
        <div>优惠(待)类型*</div>
        <div>
          {editingExtra ? (
            <select value={benefit} onChange={e=>setBenefit(e.target.value as BenefitType)}>
              {benefitOptions.map(o=> <option key={o}>{o}</option>)}
            </select>
          ) : (
            <span>{user.benefit}</span>
          )}
        </div>
      </div>

      {error && <div style={{color:'#d93025', marginBottom:12}}>{error}</div>}

      {okVisible && (
        <div style={{position:'fixed', left:0, top:0, right:0, bottom:0, background:'rgba(0,0,0,0.3)', display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div style={{width:360, background:'#fff', borderRadius:4}}>
            <div style={{background:'#2ea5ff', color:'#fff', padding:'10px 12px'}}>修改用户</div>
            <div style={{padding:'16px 12px'}}>成功修改用户信息</div>
            <div style={{padding:'10px 12px', textAlign:'center'}}>
              <button className="primary" onClick={()=>setOkVisible(false)}>确定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileView;