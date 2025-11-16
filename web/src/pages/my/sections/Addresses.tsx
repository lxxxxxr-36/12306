import React, { useEffect, useMemo, useState } from 'react';
import { useSession } from '../../../hooks/useSession';
import { DIVISIONS } from '../../../data/divisions';

type AddressRecord = {
  id: string;
  receiver: string;
  province: string;
  city: string;
  district: string;
  town: string;
  area: string;
  detail: string;
  phone: string;
  isDefault: boolean;
  createdAt: number;
};

const DATA = DIVISIONS;

function genId(){ return Math.random().toString(36).slice(2); }
function maskPhone(num: string){ if (num.length < 7) return num; return num.slice(0,3)+'****'+num.slice(-4); }

const KEY_PREFIX = 'addresses:';
function getList(owner: string): AddressRecord[] { try { return JSON.parse(localStorage.getItem(KEY_PREFIX+owner)||'[]'); } catch { return []; } }
function saveList(owner: string, list: AddressRecord[]) { localStorage.setItem(KEY_PREFIX+owner, JSON.stringify(list)); }

const Addresses: React.FC = () => {
  const { username } = useSession();
  const [list, setList] = useState<AddressRecord[]>([]);
  const [mode, setMode] = useState<'list'|'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modal, setModal] = useState<{ visible: boolean; title: string; text: string; confirm?: () => void } | null>(null);

  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [town, setTown] = useState('');
  const [area, setArea] = useState('');
  const [detail, setDetail] = useState('');
  const [receiver, setReceiver] = useState('');
  const [phone, setPhone] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState('');
  const [ruleHover, setRuleHover] = useState(false);

  useEffect(() => { if (!username) return; setList(getList(username)); }, [username]);

  const provinces = useMemo(() => Object.keys(DATA), []);
  const cities = useMemo(() => province ? Object.keys(DATA[province]) : [], [province]);
  const districts = useMemo(() => (province && city) ? Object.keys(DATA[province][city]) : [], [province, city]);
  const towns = useMemo(() => (province && city && district) ? DATA[province][city][district].towns : [], [province, city, district]);
  const areas = useMemo(() => (province && city && district) ? DATA[province][city][district].areas : [], [province, city, district]);

  const resetForm = () => {
    setProvince(''); setCity(''); setDistrict(''); setTown(''); setArea(''); setDetail(''); setReceiver(''); setPhone(''); setIsDefault(false); setError(''); setRuleHover(false);
  };
  const openAdd = () => { setEditingId(null); resetForm(); setMode('form'); };
  const openEdit = (id: string) => {
    const rec = list.find(x => x.id === id); if (!rec) return;
    setEditingId(id);
    setProvince(rec.province); setCity(rec.city); setDistrict(rec.district); setTown(rec.town); setArea(rec.area);
    setDetail(rec.detail); setReceiver(rec.receiver); setPhone(rec.phone); setIsDefault(rec.isDefault);
    setMode('form');
  };

  const applyDefault = (id: string, val: boolean) => {
    if (!username) return;
    const next = list.map(x => ({ ...x, isDefault: x.id === id ? val : (val ? false : x.isDefault) }));
    saveList(username, next); setList(next);
    setModal({ visible: true, title: '默认地址', text: val ? '设置默认成功' : '取消默认成功' });
  };
  const removeOne = (id: string) => {
    setModal({ visible: true, title: '删除地址', text: '您确定要删除选中的车票快递地址吗？', confirm: () => {
      if (!username) { setModal(null); return; }
      const next = list.filter(x => x.id !== id);
      saveList(username, next); setList(next);
      setModal({ visible: true, title: '删除地址', text: '删除成功' });
    }});
  };

  const cancelForm = () => { setMode('list'); };
  const saveForm = () => {
    setError('');
    if (!username) { setError('请先登录'); return; }
    if (!province || !city || !district || !town || !area) { setError('请选择完整地址'); return; }
    if (!detail.trim()) { setError('请填写详细地址'); return; }
    if (!receiver || !/^[\u4e00-\u9fa5A-Za-z·\s]{2,30}$/.test(receiver)) { setError('收件人需为2-30位中文或字母'); return; }
    if (!/^\d{11}$/.test(phone)) { setError('手机号需为11位数字'); return; }
    if (!editingId && list.length >= 20) { setModal({ visible: true, title: '添加地址', text: '最多添加20个地址' }); return; }
    const base: AddressRecord = {
      id: editingId || ('A'+genId()), receiver, province, city, district, town, area, detail, phone, isDefault, createdAt: Date.now()
    };
    let next = editingId ? list.map(x => x.id === editingId ? base : x) : [...list, base];
    if (isDefault) next = next.map(x => ({ ...x, isDefault: x.id === base.id }));
    saveList(username, next); setList(next);
    setModal({ visible: true, title: editingId ? '修改地址' : '添加地址', text: editingId ? '修改成功' : '添加成功', confirm: () => { setMode('list'); } });
  };

  return (
    <div>
      {mode === 'list' ? (
        <>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:'#f9f9f9'}}>
                <th style={{textAlign:'left',width:'70px',padding:'8px'}}>序号</th>
                <th style={{textAlign:'left',padding:'8px'}}>收件人</th>
                <th style={{textAlign:'left',padding:'8px'}}>地址</th>
                <th style={{textAlign:'left',padding:'8px'}}>手机</th>
                <th style={{textAlign:'left',padding:'8px'}}>是否默认</th>
                <th style={{textAlign:'left',padding:'8px'}}>操作</th>
              </tr>
            </thead>
          </table>
          <div style={{display:'flex',alignItems:'center',gap:12,background:'#f1f7ff',border:'1px solid #e0efff',padding:'8px 12px',margin:'8px 0'}}>
            <button style={{color:'#179d28'}} onClick={openAdd}>+ 增加</button>
          </div>
          {list.length > 0 ? (
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <tbody>
                {list.map((a, idx) => (
                  <tr key={a.id} style={{borderTop:'1px solid #eee'}}>
                    <td style={{padding:'8px',width:70}}>{idx+1}</td>
                    <td style={{padding:'8px'}}>{a.receiver}</td>
                    <td style={{padding:'8px'}}>{a.province}{a.city}{a.district}{a.town}{a.area}{a.detail}</td>
                    <td style={{padding:'8px'}}>{maskPhone(a.phone)}</td>
                    <td style={{padding:'8px'}}>
                      {a.isDefault ? (
                        <button className="link" style={{color:'#1a73e8', textDecoration:'underline'}} onClick={()=>applyDefault(a.id, false)}>取消默认</button>
                      ) : (
                        <button className="link" style={{color:'#1a73e8', textDecoration:'underline'}} onClick={()=>applyDefault(a.id, true)}>设为默认</button>
                      )}
                    </td>
                    <td style={{padding:'8px'}}>
                      <button title="删除" style={{color:'#d93025',marginRight:12}} onClick={()=>removeOne(a.id)}>🗑</button>
                      <button title="编辑" style={{color:'#1a73e8'}} onClick={()=>openEdit(a.id)}>✎</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
          <div style={{background:'#fff7f1',border:'1px solid #ffd5a8',padding:'12px',marginTop:12}}>
            <div style={{fontWeight:700, marginBottom:8}}>温馨提示</div>
            <div>1.您最多可添加20个车票快递地址，对已支付的地址30天内不可删除与修改。</div>
            <div>2.请您准确完整的填写收件地址、收件人姓名、手机号码等信息，并保持电话畅通，以免耽误接收车票。</div>
          </div>
        </>
      ) : (
        <>
          <div style={{fontWeight:700, marginBottom:12}}>选择地址（*为必填项）</div>
          <div style={{display:'grid', gridTemplateColumns:'160px 1fr', gap:'8px 12px', marginBottom:16}}>
            <div>所在地址*</div>
            <div style={{display:'flex', gap:8}}>
              <select value={province} onChange={e=>{ setProvince(e.target.value); setCity(''); setDistrict(''); setTown(''); setArea(''); }}>
                <option value="">请选择省</option>
                {provinces.map(p => <option key={p}>{p}</option>)}
              </select>
              <select value={city} onChange={e=>{ setCity(e.target.value); setDistrict(''); setTown(''); setArea(''); }}>
                <option value="">请选择市</option>
                {cities.map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={district} onChange={e=>{ setDistrict(e.target.value); setTown(''); setArea(''); }}>
                <option value="">请选择区/县</option>
                {districts.map(d => <option key={d}>{d}</option>)}
              </select>
              <select value={town} onChange={e=>setTown(e.target.value)}>
                <option value="">请选择乡镇（周边地区）</option>
                {towns.map(t => <option key={t}>{t}</option>)}
              </select>
              <select value={area} onChange={e=>setArea(e.target.value)}>
                <option value="">请选择附近区域</option>
                {areas.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>详细地址*</div>
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <input type="text" placeholder="请填写详细地址" value={detail} onChange={e=>setDetail(e.target.value)} style={{width:'360px'}} />
              <div style={{position:'relative', display:'inline-block'}}>
                <span style={{color:'#888', fontSize:12}} onMouseEnter={()=>setRuleHover(true)} onMouseLeave={()=>setRuleHover(false)}>(地址填写规则)</span>
                {ruleHover && (
                  <div style={{position:'absolute', background:'#fff', border:'1px solid #a9d2ff', color:'#1a73e8', padding:'8px', top:18, left:0, borderRadius:4, width:'380px', zIndex:10}}>
                    
                    <ol style={{ paddingLeft:18, margin:0 }}>
                      <li>例如您的地址为：北京市海淀区学院南路中国铁道科学研究院A号楼1109室；</li>
                      <li>依次选择省：北京市；选择市：北京市；选择区/县：海淀区；选择乡镇（周边地区）：学院南路；选择附近区域：铁科院；</li>
                      <li>详细地址只需填写：A号楼1109室；</li>
                      <li>注意事项：周边地区、附近区域依照就近原则选择；详细地址不需重复填写已选的省市区等信息</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
            <div>收件人*</div>
            <div><input type="text" placeholder="请填写收件人" value={receiver} onChange={e=>setReceiver(e.target.value)} /></div>
            <div>手机号*</div>
            <div><input type="tel" placeholder="请填写手机号" value={phone} onChange={e=>setPhone(e.target.value)} /></div>
            <div></div>
            <div><label><input type="checkbox" checked={isDefault} onChange={e=>setIsDefault(e.target.checked)} /> 设为默认地址</label></div>
          </div>
          {error && <div style={{color:'#d93025', marginBottom:12}}>{error}</div>}
          <div style={{display:'flex', gap:12}}>
            <button onClick={cancelForm}>取消</button>
            <button className="primary" onClick={saveForm}>保存</button>
          </div>
          <div style={{background:'#fff7f1',border:'1px solid #ffd5a8',padding:'12px',marginTop:12}}>
            <div style={{fontWeight:700, marginBottom:8}}>温馨提示</div>
            <div>1.您最多可添加20个地址，对已支付的地址30天内不可删除与修改。</div>
            <div>2.请您准确完整的填写收件地址、收件人姓名、手机号码等信息，并保持电话畅通，以免耽误接收车票。</div>
          </div>
        </>
      )}
      {modal?.visible && (
        <div style={{position:'fixed', left:0, top:0, right:0, bottom:0, background:'rgba(0,0,0,0.3)', display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div style={{width:360, background:'#fff', borderRadius:4}}>
            <div style={{background:'#2ea5ff', color:'#fff', padding:'10px 12px'}}>{modal.title}</div>
            <div style={{padding:'16px 12px'}}>{modal.text}</div>
            <div style={{padding:'10px 12px', textAlign:'center', display:'flex', justifyContent:'center', gap:12}}>
              {modal.confirm ? (
                <>
                  <button onClick={()=>setModal(null)}>取消</button>
                  <button className="primary" onClick={()=>{ const fn = modal.confirm; setModal(null); if (fn) fn(); }}>确定</button>
                </>
              ) : (
                <button className="primary" onClick={()=>setModal(null)}>确定</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Addresses;