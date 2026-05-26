'use client';

import React, { useState, useCallback } from 'react';
import { Calculator, Swords, Users, Gift, ArrowRight } from 'lucide-react';

type CalcMode = 'enemy' | 'npc' | 'quest_reward';

interface BreakdownItem {
  value?: number;
  count?: number;
  cost: number;
}

interface CalcResult {
  total_points: number;
  consumed_points: number;
  remaining_points: number;
  is_valid: boolean;
  breakdown: Record<string, BreakdownItem>;
}

const getAuthHeaders = async () => {
  const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession();
  const token = session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export default function BalanceCalculatorPanel() {
  const [mode, setMode] = useState<CalcMode>('enemy');
  const [result, setResult] = useState<CalcResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Enemy inputs
  const [eLevel, setELevel] = useState(5);
  const [eHp, setEHp] = useState(30);
  const [eAtk, setEAtk] = useState(5);
  const [eDef, setEDef] = useState(3);
  const [eSkills, setESkills] = useState('');

  // NPC inputs
  const [nLevel, setNLevel] = useState(5);
  const [nAtk, setNAtk] = useState(5);
  const [nDef, setNDef] = useState(5);
  const [nDur, setNDur] = useState(100);
  const [nCover, setNCover] = useState(10);
  const [nSkills, setNSkills] = useState('');

  // Quest reward inputs
  const [qLevel, setQLevel] = useState(5);
  const [qBattles, setQBattles] = useState(1);
  const [qNodes, setQNodes] = useState(4);

  const calculate = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      let params: Record<string, unknown> = {};

      switch (mode) {
        case 'enemy':
          params = { level: eLevel, hp: eHp, atk: eAtk, def: eDef, skills: eSkills ? eSkills.split(',').map(s => s.trim()) : [] };
          break;
        case 'npc':
          params = { level: nLevel, atk: nAtk, def: nDef, durability: nDur, cover_rate: nCover, skills: nSkills ? nSkills.split(',').map(s => s.trim()) : [] };
          break;
        case 'quest_reward':
          params = { rec_level: qLevel, battle_count: qBattles, node_count: qNodes };
          break;
      }

      const res = await fetch('/api/ugc/v2/calculate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ mode, params }),
      });
      const json = await res.json();
      if (res.ok) {
        setResult(json.result);
      }
    } catch (e) {
      console.error('Calculate error:', e);
    } finally {
      setLoading(false);
    }
  }, [mode, eLevel, eHp, eAtk, eDef, eSkills, nLevel, nAtk, nDef, nDur, nCover, nSkills, qLevel, qBattles, qNodes]);

  const modes: { key: CalcMode; label: string; icon: React.ReactNode }[] = [
    { key: 'enemy', label: 'エネミーTP', icon: <Swords className="w-4 h-4" /> },
    { key: 'npc', label: 'NPC NP', icon: <Users className="w-4 h-4" /> },
    { key: 'quest_reward', label: '報酬PB', icon: <Gift className="w-4 h-4" /> },
  ];

  const inputClass = "w-full px-3 py-2 bg-[#1a120e] border border-[#5c3c2a] rounded text-sm text-[#e3d5b8] focus:outline-none focus:border-amber-600";
  const labelClass = "text-[11px] font-bold text-[#a38b6b] tracking-wider mb-1";

  return (
    <div className="space-y-4">
      {/* Mode Tabs */}
      <div className="flex gap-1 bg-[#2c1e1a] p-1 rounded">
        {modes.map(m => (
          <button
            key={m.key}
            onClick={() => { setMode(m.key); setResult(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-colors ${
              mode === m.key ? 'bg-[#8b5a2b] text-[#e3d5b8]' : 'text-[#8b5a2b] hover:bg-[#3e2723]'
            }`}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="bg-[#2c1e1a] rounded p-4 space-y-3">
        {mode === 'enemy' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div><div className={labelClass}>レベル</div><input type="number" value={eLevel} onChange={e => setELevel(+e.target.value)} min={1} max={50} className={inputClass} /></div>
              <div><div className={labelClass}>HP</div><input type="number" value={eHp} onChange={e => setEHp(+e.target.value)} min={1} className={inputClass} /></div>
              <div><div className={labelClass}>ATK</div><input type="number" value={eAtk} onChange={e => setEAtk(+e.target.value)} min={0} className={inputClass} /></div>
              <div><div className={labelClass}>DEF</div><input type="number" value={eDef} onChange={e => setEDef(+e.target.value)} min={0} className={inputClass} /></div>
            </div>
            <div><div className={labelClass}>スキル（カンマ区切り）</div><input type="text" value={eSkills} onChange={e => setESkills(e.target.value)} placeholder="fireball, drain_vit" className={inputClass} /></div>
          </>
        )}

        {mode === 'npc' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div><div className={labelClass}>レベル</div><input type="number" value={nLevel} onChange={e => setNLevel(+e.target.value)} min={1} max={50} className={inputClass} /></div>
              <div><div className={labelClass}>ATK</div><input type="number" value={nAtk} onChange={e => setNAtk(+e.target.value)} min={0} className={inputClass} /></div>
              <div><div className={labelClass}>DEF</div><input type="number" value={nDef} onChange={e => setNDef(+e.target.value)} min={0} className={inputClass} /></div>
              <div><div className={labelClass}>耐久度</div><input type="number" value={nDur} onChange={e => setNDur(+e.target.value)} min={1} className={inputClass} /></div>
              <div><div className={labelClass}>カバー率(%)</div><input type="number" value={nCover} onChange={e => setNCover(+e.target.value)} min={0} max={100} className={inputClass} /></div>
            </div>
            <div><div className={labelClass}>スキル（カンマ区切り）</div><input type="text" value={nSkills} onChange={e => setNSkills(e.target.value)} placeholder="arrow, heal" className={inputClass} /></div>
          </>
        )}

        {mode === 'quest_reward' && (
          <div className="grid grid-cols-3 gap-3">
            <div><div className={labelClass}>推奨レベル</div><input type="number" value={qLevel} onChange={e => setQLevel(+e.target.value)} min={1} max={50} className={inputClass} /></div>
            <div><div className={labelClass}>バトル数</div><input type="number" value={qBattles} onChange={e => setQBattles(+e.target.value)} min={0} className={inputClass} /></div>
            <div><div className={labelClass}>ノード数</div><input type="number" value={qNodes} onChange={e => setQNodes(+e.target.value)} min={1} className={inputClass} /></div>
          </div>
        )}

        <button
          onClick={calculate}
          disabled={loading}
          className="w-full py-2.5 bg-[#8b5a2b] text-white font-bold rounded hover:bg-[#6b4522] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Calculator className="w-4 h-4" /> {loading ? '計算中...' : '計算する'}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded p-4 border-2 ${result.is_valid ? 'bg-emerald-900/20 border-emerald-600/50' : 'bg-red-900/20 border-red-600/50'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-[#e3d5b8]">
              {mode === 'enemy' ? 'TP' : mode === 'npc' ? 'NP' : 'PB'} 計算結果
            </span>
            <span className={`text-xs font-bold px-2 py-1 rounded ${result.is_valid ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
              {result.is_valid ? '✓ 範囲内' : '✗ 超過'}
            </span>
          </div>

          {/* Progress bar */}
          <div className="relative h-4 bg-[#1a120e] rounded overflow-hidden mb-2">
            <div
              className={`h-full transition-all duration-500 ${result.is_valid ? 'bg-emerald-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(100, (result.consumed_points / result.total_points) * 100)}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
              {result.consumed_points} / {result.total_points}
            </div>
          </div>

          <div className="text-xs text-[#a38b6b]">
            残り: {result.remaining_points} ポイント
          </div>

          {/* Breakdown */}
          <div className="mt-3 space-y-1">
            {Object.entries(result.breakdown).map(([key, item]) => (
              <div key={key} className="flex items-center justify-between text-xs text-[#e3d5b8]/80">
                <span>{key}</span>
                <span className="flex items-center gap-1">
                  {item.value !== undefined && <span className="text-[#a38b6b]">({item.value})</span>}
                  {item.count !== undefined && <span className="text-[#a38b6b]">×{item.count}</span>}
                  <ArrowRight className="w-3 h-3 text-[#5c3c2a]" />
                  <span className="font-bold">{item.cost}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
