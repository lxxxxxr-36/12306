import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../../hooks/useSession';
import { getPassengers, deletePassengers, deletePassenger, ensureSelfPassenger } from '../../../services/passengers';
import type { Passenger } from '../../../services/passengers';
import { getUserByUsername } from '../../../services/auth';
import '../../personal-center.css';

function maskId(id: string){ if (id.length <= 7) return id; return id.slice(0,4)+'************'+id.slice(-3); }
function maskPhone(code: string, num: string){ if (num.length < 7) return `(${code})`+num; return `(${code})`+num.slice(0,3)+'****'+num.slice(-4); }

const Passengers: React.FC = () => {
  const { username } = useSession();
  const navigate = useNavigate();
  const [list, setList] = useState<Passenger[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [keyword, setKeyword] = useState('');
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState<{ visible: boolean; title: string; text: string; confirm?: () => void } | null>(null);

  useEffect(() => {
    if (!username) return;
    const current = getPassengers(username);
    if (current.length === 0) {
      const u = getUserByUsername(username);
      if (u) {
        ensureSelfPassenger(username, { fullName: u.fullName, idType: u.idType, idNo: u.idNo, phoneCode: u.phoneCode, phoneNumber: u.phoneNumber, benefit: u.benefit });
      }
    }
    setList(getPassengers(username));
  }, [username]);

  const shown = useMemo(() => {
    const base = list;
    if (!query.trim()) return base;
    return base.filter(x => x.name.includes(query.trim()));
  }, [list, query]);

  const toggle = (id: string, dis?: boolean) => {
    if (dis) return; setSelected(s => ({ ...s, [id]: !s[id] }));
  };
  const clearSelection = () => setSelected({});

  const bulkDelete = () => {
    const ids = Object.keys(selected).filter(id => selected[id]);
    if (ids.length === 0) { setModal({ visible: true, title: '删除乘车人', text: '请先选择联系人' }); return; }
    setModal({ visible: true, title: '删除乘车人', text: '您确定要删除选中的乘车人吗？', confirm: () => {
      if (!username) { setModal(null); return; }
      deletePassengers(username, ids);
      setList(getPassengers(username));
      clearSelection();
      setModal({ visible: true, title: '删除乘车人', text: '删除成功' });
    }});
  };
  const singleDelete = (id: string) => {
    setModal({ visible: true, title: '删除乘车人', text: '您确定要删除选中的乘车人吗？', confirm: () => {
      if (!username) { setModal(null); return; }
      deletePassenger(username, id);
      setList(getPassengers(username));
      setSelected(s => { const n = { ...s }; delete n[id]; return n; });
      setModal({ visible: true, title: '删除乘车人', text: '删除成功' });
    }});
  };

  return (
    <div>
      <div style={{display:'flex',gap:8,marginBottom:12}}>
        <input style={{flex:'0 0 220px'}} placeholder="请输入乘客姓名" value={keyword} onChange={e=>setKeyword(e.target.value)} />
        <button className="link" onClick={()=>{ setKeyword(''); setQuery(''); }}>×</button>
        <button className="primary" onClick={()=>setQuery(keyword.trim())}>查询</button>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:12,background:'#f1f7ff',border:'1px solid #e0efff',padding:'8px 12px',marginBottom:8}}>
        <button style={{color:'#179d28'}} onClick={()=>navigate('/my/common/passengers/add')}>+ 添加</button>
        <button style={{color:'#d93025'}} onClick={bulkDelete}>🗑 批量删除</button>
      </div>
      <table style={{width:'100%',borderCollapse:'collapse'}}>
        <thead>
          <tr style={{background:'#f9f9f9'}}>
            <th style={{textAlign:'left',width:'70px',padding:'8px'}}>序号</th>
            <th style={{textAlign:'left',padding:'8px'}}>姓名</th>
            <th style={{textAlign:'left',padding:'8px'}}>证件类型</th>
            <th style={{textAlign:'left',padding:'8px'}}>证件号码</th>
            <th style={{textAlign:'left',padding:'8px'}}>手机/电话</th>
            <th style={{textAlign:'left',padding:'8px'}}>核验状态</th>
            <th style={{textAlign:'left',padding:'8px'}}>操作</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((p, idx) => (
            <tr key={p.id} style={{borderTop:'1px solid #eee'}}>
              <td style={{padding:'8px'}}>
                <input type="checkbox" disabled={p.isSelf} checked={!!selected[p.id]} onChange={()=>toggle(p.id, p.isSelf)} />
                <span style={{marginLeft:8}}>{idx+1}</span>
              </td>
              <td style={{padding:'8px'}}>{p.name}</td>
              <td style={{padding:'8px'}}>{p.idType}</td>
              <td style={{padding:'8px'}}>{maskId(p.idNo)}</td>
              <td style={{padding:'8px'}}>{maskPhone(p.phoneCode, p.phoneNumber)}</td>
              <td style={{padding:'8px'}}><span style={{color:'#179d28'}}>已核验</span></td>
              <td style={{padding:'8px'}}>
                {p.isSelf ? null : (
                  <>
                    <button title="删除" style={{color:'#d93025',marginRight:12}} onClick={()=>singleDelete(p.id)}>🗑</button>
                    <button title="编辑" style={{color:'#1a73e8'}} onClick={()=>navigate(`/my/common/passengers/edit/${p.id}`)}>✎</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {modal?.visible && (
        <div style={{position:'fixed', left:0, top:0, right:0, bottom:0, background:'rgba(0,0,0,0.3)', display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div style={{width:360, background:'#fff', borderRadius:4}}>
            <div style={{background:'#2ea5ff', color:'#fff', padding:'10px 12px'}}>{modal.title}</div>
            <div style={{padding:'16px 12px'}}>{modal.text}</div>
            <div style={{padding:'10px 12px', textAlign:'center', display:'flex', justifyContent:'center', gap:12}}>
              {modal.confirm ? (
                <>
                  <button onClick={()=>setModal(null)}>取消</button>
                  <button className="primary" onClick={()=>{ const fn = modal.confirm; setModal(null); fn && fn(); }}>确定</button>
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

export default Passengers;