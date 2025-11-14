import React, { useEffect, useMemo, useState } from 'react';
import { useSession } from '../../../hooks/useSession';
import { getPassengers, deletePassengers, deletePassenger } from '../../../services/passengers';
import type { Passenger } from '../../../services/passengers';
import '../../personal-center.css';

function maskId(id: string){ if (id.length <= 7) return id; return id.slice(0,4)+'************'+id.slice(-3); }
function maskPhone(code: string, num: string){ if (num.length < 7) return `(${code})`+num; return `(${code})`+num.slice(0,3)+'****'+num.slice(-4); }

const Passengers: React.FC = () => {
  const { username } = useSession();
  const [list, setList] = useState<Passenger[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!username) return; setList(getPassengers(username));
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
    if (ids.length === 0) { alert('请先选择联系人'); return; }
    if (!confirm('您确定要删除选中的乘车人吗？')) return;
    if (!username) return;
    deletePassengers(username, ids);
    setList(getPassengers(username));
    clearSelection();
  };
  const singleDelete = (id: string) => {
    if (!confirm('您确定要删除选中的乘车人吗？')) return;
    if (!username) return;
    deletePassenger(username, id);
    setList(getPassengers(username));
    setSelected(s => { const n = { ...s }; delete n[id]; return n; });
  };

  return (
    <div>
      <div style={{display:'flex',gap:8,marginBottom:12}}>
        <input style={{flex:'0 0 220px'}} placeholder="请输入乘客姓名" value={query} onChange={e=>setQuery(e.target.value)} />
        <button className="link" onClick={()=>setQuery('')}>×</button>
        <button className="primary" onClick={()=>setList(getPassengers(username!))}>查询</button>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:12,background:'#f1f7ff',border:'1px solid #e0efff',padding:'8px 12px',marginBottom:8}}>
        <button style={{color:'#179d28'}} onClick={()=>{ /* 之后进入添加乘车人 */ }}>+ 添加</button>
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
                    <button title="编辑" style={{color:'#1a73e8'}} onClick={()=>{}}>✎</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Passengers;