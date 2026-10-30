// ESHOP 中控台 v5 渲染逻辑（整体数据口径）
const M = D.M, MKT = D.MKT, INV = D.INV;
const A = M.anomaly;
const m9 = M.monthly.find(x => x.m === '2026-09') || M.monthly[M.monthly.length - 1];
const mLast = M.monthly[M.monthly.length - 1];
const $ = id => document.getElementById(id);
const mk = id => echarts.init($(id));
const fmt = n => Math.round(n).toLocaleString();
const C = { blue: '#0B5E8F', tblue: '#3A7DF0', teal: '#0E9594', orange: '#E8762C', gold: '#C9971F', red: '#D64545', green: '#1E9E6A', amber: '#E8A13C', gray: '#8A97A6' };

// ---------- Tab 切换 ----------
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.remove('on'));
  document.querySelectorAll('.module').forEach(x => x.classList.remove('on'));
  t.classList.add('on');
  $(t.dataset.m).classList.add('on');
  setTimeout(() => window.dispatchEvent(new Event('resize')), 60);
  aiSetModule(t.dataset.m, document.getElementById('aiDrawer').classList.contains('on'));
}));
window.addEventListener('resize', () => Object.values(charts).forEach(c => c.resize()));
const charts = {};
function reg(id) { charts[id] = mk(id); return charts[id]; }

// ==================== m1 销售概览 ====================
const months = M.monthly.map(x => x.m.slice(2));
reg('ch_month').setOption({
  grid: { left: 70, right: 60, top: 40, bottom: 40 },
  tooltip: { trigger: 'axis' },
  legend: { data: ['GMV（HKD）', '订单数'], textStyle: { fontSize: 12 } },
  xAxis: { type: 'category', data: months },
  yAxis: [{ type: 'value', axisLabel: { formatter: v => (v / 10000) + '万' } }, { type: 'value' }],
  series: [
    { name: 'GMV（HKD）', type: 'bar', barWidth: 26, data: M.monthly.map(x => x.gmv),
      itemStyle: { borderRadius: [6, 6, 0, 0], color: p => p.dataIndex === M.monthly.length - 1 ? C.amber : C.tblue },
      label: { show: true, position: 'top', formatter: p => (p.value / 10000).toFixed(0) + '万', fontSize: 10.5 } },
    { name: '订单数', type: 'line', yAxisIndex: 1, smooth: true, data: M.monthly.map(x => x.orders),
      lineStyle: { width: 3, color: C.gold }, itemStyle: { color: C.gold } }
  ]
});
reg('ch_aov').setOption({
  grid: { left: 60, right: 24, top: 30, bottom: 40 },
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: months },
  yAxis: { type: 'value' },
  series: [{ type: 'line', smooth: true, data: M.monthly.map(x => x.aov),
    areaStyle: { opacity: 0.12 }, lineStyle: { width: 3, color: C.blue }, itemStyle: { color: C.blue },
    label: { show: true, fontSize: 10.5, formatter: p => fmt(p.value) } }]
});
reg('ch_mobile').setOption({
  grid: { left: 56, right: 56, top: 40, bottom: 40 },
  tooltip: { trigger: 'axis', formatter: ps => { const x = M.monthly[ps[0].dataIndex];
    return x.m + `<br/>单量占比 <b>${x.mobOrdersPct}%</b>（${x.mobOrders}/${x.orders} 单）<br/>金额占比 <b>${x.mobAmtPct}%</b>（${(x.mobAmt/10000).toFixed(1)}万/${(x.gmv/10000).toFixed(0)}万 HKD）`; } },
  legend: { data: ['单量占比 %', '金额占比 %'], textStyle: { fontSize: 12 } },
  xAxis: { type: 'category', data: months },
  yAxis: { type: 'value', name: '占比（%）', max: 12 },
  series: [
    { name: '单量占比 %', type: 'line', smooth: true, data: M.monthly.map(x => x.mobOrdersPct),
      lineStyle: { width: 3, color: C.teal }, itemStyle: { color: C.teal }, label: { show: true, fontSize: 10.5 } },
    { name: '金额占比 %', type: 'line', smooth: true, data: M.monthly.map(x => x.mobAmtPct),
      lineStyle: { width: 3, type: 'dashed', color: C.orange }, itemStyle: { color: C.orange },
      areaStyle: { opacity: 0.08 } }
  ]
});

// ==================== m2 客户需求 ====================
const tiers = ['高价值客户', '潜力客户', '普通客户'];
reg('ch_tier').setOption({
  grid: { left: 50, right: 24, top: 40, bottom: 40 },
  tooltip: { trigger: 'axis' },
  legend: { textStyle: { fontSize: 12 } },
  xAxis: { type: 'category', data: tiers.map(t => `${t}\n${M.tierStat[t].count}户`) },
  yAxis: { type: 'value', name: '%' },
  series: [
    { name: '数量占比', type: 'bar', barWidth: 24, data: tiers.map(t => M.tierStat[t].countPct), itemStyle: { color: C.tblue, borderRadius: [5, 5, 0, 0] }, label: { show: true, position: 'top', formatter: '{c}%' } },
    { name: '贡献占比', type: 'bar', barWidth: 24, data: tiers.map(t => M.tierStat[t].amtPct), itemStyle: { color: C.orange, borderRadius: [5, 5, 0, 0] }, label: { show: true, position: 'top', formatter: '{c}%' } }
  ]
});
$('tb_top').innerHTML = '<tr><th>#</th><th>客户简称</th><th>属性</th><th style="text-align:right">累计成交额</th><th style="text-align:right">订单数</th><th>最近下单</th></tr>' +
  M.topCustomers.slice(0, 10).map((c, i) => `<tr><td>${i + 1}</td><td><b>${c.short}</b></td><td>${c.attr || '未映射'}</td>
    <td class="num" style="text-align:right"><b>${(c.amt / 10000).toFixed(1)} 万</b></td><td class="num" style="text-align:right">${c.orders}</td><td class="num">${c.lastDate}</td></tr>`).join('');
reg('ch_attraov').setOption({
  grid: { left: 90, right: 90, top: 20, bottom: 40 },
  tooltip: { trigger: 'axis', formatter: p => { const x = M.attrAov[M.attrAov.length - 1 - p[0].dataIndex];
    return `${x.attr}<br/>客单价 <b>${fmt(x.aov)} HKD</b><br/>订单 ${x.orders} 单 · 客户 ${x.custs} 户`; } },
  xAxis: { type: 'value', axisLabel: { formatter: v => (v / 1000) + 'k' } },
  yAxis: { type: 'category', data: M.attrAov.map(x => x.attr).reverse(), axisLabel: { fontSize: 11.5 } },
  series: [{ type: 'bar', barWidth: 15,
    data: M.attrAov.map(x => ({ value: x.aov, itemStyle: { borderRadius: [0, 6, 6, 0], color: x.aov >= M.overallAov ? C.orange : C.tblue } })).reverse(),
    label: { show: true, position: 'right', formatter: p => fmt(p.value), fontSize: 10.5 },
    markLine: { silent: true, symbol: 'none', data: [{ xAxis: M.overallAov }],
      lineStyle: { type: 'dashed', color: C.red, width: 1.8 }, label: { formatter: `整体 ${fmt(M.overallAov)}`, fontSize: 10.5, color: C.red } } }]
});
// 四象限（JS 端按中位数自动计算）
(function () {
  const items = M.attrAov.filter(x => x.custs > 0).map(x => ({ ...x, freq: +(x.orders / x.custs).toFixed(1) }));
  const aovs = items.map(x => x.aov).sort((a, b) => a - b), freqs = items.map(x => x.freq).sort((a, b) => a - b);
  const aovMed = aovs[Math.floor(aovs.length / 2)], freqMed = freqs[Math.floor(freqs.length / 2)];
  reg('ch_quad').setOption({
    grid: { left: 70, right: 30, top: 30, bottom: 50 },
    tooltip: { formatter: p => `${p.data[3]}<br/>客单价 ${fmt(p.data[1])} HKD · 户均 ${p.data[0]} 单 · ${p.data[4]}` },
    xAxis: { type: 'value', name: '户均频次（单）', scale: true },
    yAxis: { type: 'value', name: '客单价（HKD）', scale: true },
    series: [{ type: 'scatter', symbolSize: d => Math.max(14, Math.sqrt(d[2] / 8000)),
      data: items.map(x => [x.freq, x.aov, x.amt, x.attr, (x.aov >= aovMed ? '大额' : '小额') + (x.freq >= freqMed ? '多单' : '少单')]),
      itemStyle: { color: p => ({ '大额多单': C.blue, '大额少单': C.orange, '小额多单': C.teal, '小额少单': C.gray })[p.data[4]], opacity: 0.8 },
      label: { show: true, formatter: p => p.data[3], position: 'top', fontSize: 10.5 },
      markLine: { silent: true, symbol: 'none', data: [{ xAxis: freqMed }, { yAxis: aovMed }], lineStyle: { type: 'dashed', color: '#B8C4D0' } } }]
  });
})();
$('tb_dormant').innerHTML = '<tr><th>客户简称</th><th>属性</th><th style="text-align:right">历史贡献</th><th style="text-align:right">订单数</th><th style="text-align:right">客单价(HKD)</th><th style="text-align:right">未下单天数</th><th>最近下单</th></tr>' +
  M.dormant.slice(0, 10).map(d => `<tr><td><b>${d.short}</b>${d.highValue ? ' <span style="color:#E8762C;font-size:11px;font-weight:700">★高价值</span>' : ''}</td><td>${d.attr || '未映射'}</td>
    <td class="num" style="text-align:right">${(d.amt / 10000).toFixed(1)} 万</td><td class="num" style="text-align:right">${d.orders}</td>
    <td class="num" style="text-align:right;font-weight:700;color:${d.highValue ? '#E8762C' : '#33475B'}">${fmt(d.aov || Math.round(d.amt / Math.max(1, d.orders)))}</td>
    <td class="num" style="text-align:right;color:${C.red};font-weight:700">${d.days} 天</td><td class="num">${d.lastDate}</td></tr>`).join('');

// ==================== m3 异常变动 ====================
const _anomAll = [...A.smallAnom, ...A.smallDown.map(x => ({ small: x.small, augQty: x.augQty, sepQty: x.sepQty, dqPct: x.dqPct, augAmt: 0, sepAmt: 0, daPct: 0 }))]
  .sort((a, b) => b.dqPct - a.dqPct);
reg('ch_anom_small').setOption({
  grid: { left: 100, right: 70, top: 20, bottom: 40 },
  tooltip: { trigger: 'axis', formatter: p => { const x = _anomAll[p[0].dataIndex];
    return `${x.small}<br/>8月 ${fmt(x.augQty)} kg → 9月 ${fmt(x.sepQty)} kg（<b>${x.dqPct > 0 ? '+' : ''}${x.dqPct}%</b>）`; } },
  xAxis: { type: 'value', name: '销量环比变动（%）' },
  yAxis: { type: 'category', data: _anomAll.map(x => x.small) },
  series: [{ type: 'bar', barWidth: 18,
    data: _anomAll.map(x => ({ value: x.dqPct, itemStyle: { color: x.dqPct >= 0 ? C.green : C.red, borderRadius: 4 } })),
    label: { show: true, position: 'right', formatter: p => (p.value > 0 ? '+' : '') + p.value + '%', fontSize: 11, fontWeight: 'bold' },
    markLine: { silent: true, symbol: 'none', data: [{ xAxis: 0 }], lineStyle: { color: '#B8C4D0' } } }]
});
$('tb_small_down').innerHTML = '<tr><th>小类</th><th style="text-align:right">8月(kg)</th><th style="text-align:right">9月(kg)</th><th style="text-align:right">跌幅</th><th>可能原因</th></tr>' +
  A.smallDown.map(x => `<tr><td><b>${x.small}</b><br><span style="font-size:11px;color:#888">${x.mid}</span></td>
    <td class="num" style="text-align:right">${fmt(x.augQty)}</td><td class="num" style="text-align:right">${fmt(x.sepQty)}</td>
    <td class="num" style="text-align:right;color:${C.red};font-weight:700">${x.dqPct}%</td>
    <td style="font-size:11.5px">${x.reason}</td></tr>`).join('');
reg('ch_anom_new').setOption({
  grid: { left: 110, right: 70, top: 20, bottom: 40 },
  tooltip: { trigger: 'axis', formatter: p => { const x = A.sepTop[p[0].dataIndex];
    return `${x.small}<br/>9月销量 <b>${fmt(x.sepQty)} kg</b> · 金额 ${fmt(x.sepAmt)} HKD`; } },
  xAxis: { type: 'value', axisLabel: { formatter: v => (v / 1000) + 'k' } },
  yAxis: { type: 'category', data: A.sepTop.map(x => x.small) },
  series: [{ type: 'bar', barWidth: 16, data: A.sepTop.map(x => x.sepQty),
    itemStyle: { color: C.tblue, borderRadius: [0, 5, 5, 0] },
    label: { show: true, position: 'right', formatter: p => fmt(p.value), fontSize: 10.5 } }]
});
$('tb_cust_new').innerHTML = '<tr><th>客户简称</th><th style="text-align:right">9月销售额</th></tr>' +
  A.custNew.map(x => `<tr><td><b>${x.short}</b></td><td class="num" style="text-align:right">${fmt(x.sepAmt)} HKD</td></tr>`).join('');
$('tb_cust_lost').innerHTML = '<tr><th>客户简称</th><th style="text-align:right">8月销售额</th></tr>' +
  A.custLost.map(x => `<tr><td><b>${x.short}</b></td><td class="num" style="text-align:right">${fmt(x.augAmt)} HKD</td></tr>`).join('');

// ---- ① 应增未增小类明细（小类 → 掉队客户）----
$('tb_sigmiss').innerHTML = '<tr><th>小类 / 中类</th><th style="text-align:right">客户数<br><span style="font-weight:400">增长/下降</span></th>' +
  '<th style="text-align:right">前3月月均(kg)</th><th style="text-align:right">近2月月均(kg)</th><th style="text-align:right">小类增幅</th>' +
  '<th>掉队客户</th><th>属性</th><th style="text-align:right">该客户前3月月均</th><th style="text-align:right">近2月月均</th><th style="text-align:right">变动</th><th style="text-align:right">缺口(kg/月)</th></tr>' +
  (M.sigMiss || []).map(s => {
    const rows = s.drops.map((d, i) => `<tr${i === 0 ? ' style="border-top:2px solid #D8E0EA"' : ''}>
      ${i === 0 ? `<td rowspan="${s.drops.length}" style="vertical-align:top"><b>${s.small}</b><br><span style="color:#8A97A6;font-size:11px">${s.mid}</span></td>
        <td rowspan="${s.drops.length}" class="num" style="text-align:right;vertical-align:top">${s.custCount} 户<br><span style="color:${C.green}">↑${s.upCount}</span> <span style="color:${C.red}">↓${s.downCount}</span></td>
        <td rowspan="${s.drops.length}" class="num" style="text-align:right;vertical-align:top">${fmt(s.augQty)}</td>
        <td rowspan="${s.drops.length}" class="num" style="text-align:right;vertical-align:top">${fmt(s.sepQty)}</td>
        <td rowspan="${s.drops.length}" class="num" style="text-align:right;vertical-align:top;color:${C.green};font-weight:700">${s.growth > 0 ? '+' : ''}${s.growth}%</td>` : ''}
      <td><b>${d.cust}</b></td><td style="font-size:11.5px">${d.attr}</td>
      <td class="num" style="text-align:right">${fmt(d.augQty)}</td>
      <td class="num" style="text-align:right">${fmt(d.sepQty)}</td>
      <td class="num" style="text-align:right;color:${C.red};font-weight:700">${d.chg}%</td>
      <td class="num" style="text-align:right"><b>${fmt(d.lossQty)}</b></td></tr>`).join('');
    return rows;
  }).join('') || '<tr><td colspan="11" style="text-align:center;color:#8A97A6;padding:18px">本期无符合条件的小类</td></tr>';

// ---- ② 应涨反降客户明细 ----
$('tb_attrdrop').innerHTML = '<tr><th>客户简称</th><th>属性</th><th style="text-align:right">属性整体增幅</th>' +
  '<th style="text-align:right">属性内客户<br><span style="font-weight:400">增长占比</span></th>' +
  '<th style="text-align:right">前3月月均(HKD)</th><th style="text-align:right">近2月月均(HKD)</th><th style="text-align:right">变动</th><th style="text-align:right">缺口(HKD/月)</th></tr>' +
  ((M.attrDrop || []).map(d => `<tr>
    <td><b>${d.cust}</b></td><td style="font-size:11.5px">${d.attr}</td>
    <td class="num" style="text-align:right;color:${C.green};font-weight:700">+${d.attrGrowth}%</td>
    <td class="num" style="text-align:right">${d.attrUpPct}%（${Math.round(d.attrUpPct * d.attrCustCount / 100)}/${d.attrCustCount}）</td>
    <td class="num" style="text-align:right">${fmt(d.augAmt)}</td>
    <td class="num" style="text-align:right">${fmt(d.sepAmt)}</td>
    <td class="num" style="text-align:right;color:${C.red};font-weight:700">${d.chg}%</td>
    <td class="num" style="text-align:right"><b>${fmt(d.lossAmt)}</b></td></tr>`).join('')
   || '<tr><td colspan="8" style="text-align:center;color:#8A97A6;padding:18px">本期无符合条件的客户</td></tr>');

// ==================== m4 关联规则与需求机会 ====================
$('tb_rules').innerHTML = '<tr><th>产品 A <span style="font-weight:400;color:#888">（小类）</span></th><th>产品 B <span style="font-weight:400;color:#888">（小类）</span></th><th style="text-align:right">共现</th><th style="text-align:right">置信度</th><th style="text-align:right">lift</th></tr>' +
  M.skuRules.map(r => `<tr><td>${r.a}<br><span class="grp-tag">${r.aCat || '—'}</span></td><td>${r.b}<br><span class="grp-tag">${r.bCat || '—'}</span></td><td class="num" style="text-align:right">${r.co}</td>
    <td class="num" style="text-align:right">${r.confidence}%</td>
    <td class="num" style="text-align:right"><b style="color:${C.orange}">${r.lift}</b></td></tr>`).join('');
$('tb_smallrules').innerHTML = '<tr><th>小类 A</th><th>小类 B</th><th style="text-align:right">共现</th><th style="text-align:right">置信度</th><th style="text-align:right">lift</th></tr>' +
  (M.smallRules || []).map(r => `<tr><td><b>${r.a}</b></td><td><b>${r.b}</b></td><td class="num" style="text-align:right">${r.co}</td>
    <td class="num" style="text-align:right">${r.confidence}%</td>
    <td class="num" style="text-align:right"><b style="color:${C.teal}">${r.lift}</b></td></tr>`).join('');
$('tb_opps').innerHTML = '<tr><th>类型</th><th>客户</th><th>属性</th><th>目标小类</th><th>机会内容</th></tr>' +
  M.opps.slice(0, 25).map(o => `<tr><td><span class="bdg ${o.type === '品类缺口' ? 'bT' : 'bR'}">${o.type}</span></td>
    <td>${o.cust}</td><td>${o.attr}</td><td><b>${o.cat || '—'}</b></td><td style="font-size:12px">${o.text}</td></tr>`).join('');
const FB_KEY = 'fb_track_v5';
let fbTrack = {};
try { fbTrack = JSON.parse(localStorage.getItem(FB_KEY) || '{}'); } catch (e) { fbTrack = {}; }
$('tb_firstbuy').innerHTML = '<tr><th>首购日期</th><th>客户简称</th><th>属性</th><th>首购产品</th><th>业务员</th><th>追踪状态</th></tr>' +
  M.firstBuy.slice(0, 50).map((a, i) => {
    const k = a.short + '|' + a.sku + '|' + a.date, st = fbTrack[k] || '待跟进';
    const sc = { '待跟进': C.red, '已联系': C.amber, '已回访': C.green }[st];
    return `<tr><td class="num">${a.date}</td><td><b>${a.short}</b></td><td>${a.attr || '未映射'}</td><td>${a.skuName}</td><td>${a.rep}</td>
      <td><select data-fbk="${k}" style="border:1px solid ${sc};color:${sc};border-radius:6px;padding:3px 6px;font-size:12px;font-weight:700;background:#fff">
      ${['待跟进', '已联系', '已回访'].map(s => `<option ${s === st ? 'selected' : ''}>${s}</option>`).join('')}</select></td></tr>`;
  }).join('');
document.querySelectorAll('[data-fbk]').forEach(sel => sel.onchange = () => {
  fbTrack[sel.dataset.fbk] = sel.value;
  try { localStorage.setItem(FB_KEY, JSON.stringify(fbTrack)); } catch (e) {}
});

// ==================== m5 库存预警与供应链（真实库存） ====================
(function () {
  // ① 按仓 × 中类 Top8 堆叠柱
  const mids = INV.midWh.map(x => x.mid);
  const whs = INV.byWarehouse.map(w => w.wh);
  const palette = [C.tblue, C.teal, C.orange, C.gold];
  const maxV = Math.max(...INV.midWh.map(x => whs.reduce((s, w) => s + (x[w] || 0), 0)));
  reg('ch_wh').setOption({
    grid: { left: 62, right: 30, top: 44, bottom: 62 },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' },
      formatter: p => p[0].name + '<br/>' + p.map(x => `${x.marker}${x.seriesName}：<b>${fmt(x.value)}</b> kg`).join('<br/>') },
    legend: { top: 6, itemWidth: 12, itemHeight: 8, textStyle: { fontSize: 11 } },
    xAxis: { type: 'category', data: mids, axisLabel: { fontSize: 10.5, interval: 0, rotate: 22 } },
    yAxis: { type: 'value', name: '吨', max: Math.ceil(maxV / 200000) * 200000,
      axisLabel: { fontSize: 10, formatter: v => (v / 1000) + '' } },
    series: whs.map((w, i) => ({
      name: w, type: 'bar', stack: 'wh', barWidth: 26,
      itemStyle: { color: palette[i % palette.length] },
      data: INV.midWh.map(x => x[w] || 0)
    }))
  });

  // ② 库存金额 Top 10 SKU
  const tv = [...INV.topValue].sort((a, b) => a.value - b.value);
  reg('ch_invval').setOption({
    grid: { left: 10, right: 80, top: 16, bottom: 24, containLabel: true },
    tooltip: { trigger: 'axis', formatter: p => { const x = tv[p[0].dataIndex];
      return `${x.name}<br/>金额 <b>${fmt(x.value)}</b> HKD<br/>现存量 ${fmt(x.qty)} kg · 单价 ${x.cost}`; } },
    xAxis: { type: 'value', axisLabel: { fontSize: 10, formatter: v => (v / 10000) + '万' } },
    yAxis: { type: 'category', data: tv.map(x => x.name.split('|')[0].slice(0, 12)), axisLabel: { fontSize: 10 } },
    series: [{ type: 'bar', barWidth: 13, itemStyle: { color: C.teal, borderRadius: [0, 5, 5, 0] },
      data: tv.map(x => x.value),
      label: { show: true, position: 'right', fontSize: 10, color: '#33475B', formatter: p => (p.value / 10000).toFixed(0) + '万' } }]
  });
})();

// ③ 库存积压表
$('tb_over').innerHTML = '<tr><th>SKU</th><th>中类 / 小类</th><th>仓库分布</th>' +
  '<th style="text-align:right">现存量(kg)</th><th style="text-align:right">库存金额</th>' +
  '<th style="text-align:right">近90天出货</th><th style="text-align:right">可售月数</th><th>最早到期</th><th>建议</th></tr>' +
  INV.overstock.map(o => {
    const wh = Object.entries(o.whs).map(([k, v]) => `${k} ${fmt(v)}`).join(' · ');
    const mc = o.monthsCover == null ? '<b style="color:#D64545">无出货</b>' : `<b style="color:${o.monthsCover >= 12 ? '#D64545' : '#E8A13C'}">${o.monthsCover} 月</b>`;
    const sug = o.monthsCover == null || o.monthsCover >= 24 ? '🟥 优先促销/打包' : (o.monthsCover >= 12 ? '🟧 加大推单' : '🟨 控制进货');
    const exp = o.expiry ? `${o.expiry}${o.daysToExpiry != null ? `（${o.daysToExpiry} 天）` : ''}` : '<span style="color:#A7B2C0">无批次数据</span>';
    return `<tr><td style="font-size:12px">${o.name}</td>
      <td style="font-size:11.5px">${o.mid}<br/><span style="color:#8A97A6">${o.small}</span></td>
      <td style="font-size:11.5px">${wh}</td>
      <td class="num" style="text-align:right"><b>${fmt(o.qty)}</b></td>
      <td class="num" style="text-align:right">${o.value ? fmt(o.value) : '—'}</td>
      <td class="num" style="text-align:right">${fmt(o.sold90)}</td>
      <td style="text-align:right">${mc}</td>
      <td style="font-size:11.5px">${exp}</td>
      <td style="font-size:11.5px">${sug}</td></tr>`;
  }).join('');

// ④ 积压小类 · 应买未买目标客户（小类级）
$('tb_target').innerHTML = '<tr><th>积压小类 / 中类</th><th style="text-align:right">库存量(kg)</th><th style="text-align:right">可售月数</th>' +
  '<th>同属性已购覆盖</th><th>目标客户（未购该小类）</th><th>客户属性</th>' +
  '<th style="text-align:right">近90天采购额(HKD)</th><th>判断依据</th></tr>' +
  ((INV.overSmall || []).map(o => {
    if (!o.targets || !o.targets.length) return '';
    return o.targets.map((t, i) => `<tr${i === 0 ? ' style="border-top:2px solid #D8E0EA"' : ''}>
      ${i === 0 ? `<td rowspan="${o.targets.length}" style="vertical-align:top"><b>${o.small}</b><br/>
        <span style="color:#8A97A6;font-size:11px">${o.mid} · ${o.skuCount} 个 SKU</span></td>
        <td rowspan="${o.targets.length}" class="num" style="text-align:right;vertical-align:top"><b>${fmt(o.qty)}</b></td>
        <td rowspan="${o.targets.length}" class="num" style="text-align:right;vertical-align:top;color:${o.monthsCover >= 12 ? C.red : C.amber};font-weight:700">${o.monthsCover == null ? '无出货' : o.monthsCover + ' 月'}</td>
        <td rowspan="${o.targets.length}" style="vertical-align:top;font-size:11.5px">${(o.attrs || []).slice(0, 3).map(a => `${a.attr} <b>${a.buyers}/${a.total}</b>（${a.cover}%）`).join('<br/>')}</td>` : ''}
      <td><b>${t.cust}</b></td>
      <td style="font-size:11.5px">${t.attr}</td>
      <td class="num" style="text-align:right">${fmt(t.amt90)}</td>
      <td style="font-size:11.5px;color:#5B6B7F">同属性 ${t.buyers}/${t.total} 户（${t.cover}%）已购该小类，该客户未购</td></tr>`).join('');
  }).join('') || '<tr><td colspan="8" style="text-align:center;color:#8A97A6;padding:18px">暂无积压小类</td></tr>');

// ==================== m5 库存缺货预警（可筛选/排序/分页/导出/明细） ====================
(function () {
  const INV_S = INV.skuSales || { months: [], data: {} };
  const MONTHS = INV_S.months || [], SDATA = INV_S.data || {};
  const LV_TEXT = { out: '断货', high: '高风险', mid: '中风险', low: '低风险' };
  const LV_CLS = { out: 'lv-out', high: 'lv-high', mid: 'lv-mid', low: 'lv-low' };
  const st = { rows: [], page: 1, size: 10, sort: 'level', dir: 1, open: null, key: '' };

  // 筛选器选项
  const mids = [...new Set((INV.shortage || []).map(x => x.mid).filter(Boolean))].sort();
  $('sh_mid').innerHTML = '<option value="all">全部类别</option>' + mids.map(m => `<option value="${m}">${m}</option>`).join('');
  const whs = [...new Set((INV.shortage || []).flatMap(x => Object.keys(x.whs || {})))];
  $('sh_wh').innerHTML = '<option value="all">全部仓库</option>' + whs.map(w => `<option value="${w}">${w}</option>`).join('');

  function monthlyAvg(code, n) {
    const arr = SDATA[code] || [];
    const idx = MONTHS.length - n;
    const vals = arr.slice(Math.max(0, idx));
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }

  function compute() {
    const n = +(document.getElementById('sh_win').value || 3);
    const lowQty = +(document.getElementById('sh_qty').value || 1500);
    const lowCover = +(document.getElementById('sh_cover').value || 1);
    const mid = $('sh_mid').value, wh = $('sh_wh').value, lv = $('sh_level').value;
    const out = [];
    (INV.shortage || []).forEach(x => {
      if (mid !== 'all' && x.mid !== mid) return;
      if (wh !== 'all' && !(x.whs && x.whs[wh])) return;
      const mavg = x.qty === 0 ? monthlyAvg(x.code, n) : monthlyAvg(x.code, n) || x.monthly || 0;
      if (mavg < 50) return;
      const mc = x.qty > 0 ? x.qty / mavg : 0;
      let level;
      if (x.qty === 0) level = 'out';
      else if (mc < 0.3) level = 'high';
      else if (mc < lowCover) level = 'mid';
      else if (x.qty < lowQty) level = 'low';
      else return;                        // 库存充足且可售充足 → 不进预警
      if (lv !== 'all' && level !== lv) return;
      out.push({ ...x, mavg: Math.round(mavg), mc: +mc.toFixed(2), level });
    });
    st.rows = out;
    st.page = 1;
    render();
  }

  function sorted() {
    const r = [...st.rows];
    const k = st.sort, d = st.dir;
    const rank = { out: 0, high: 1, mid: 2, low: 3 };
    r.sort((a, b) => {
      let va, vb;
      if (k === 'level') { va = rank[a.level]; vb = rank[b.level]; }
      else if (k === 'name') { va = a.name; vb = b.name; }
      else if (k === 'mid') { va = (a.mid || '') + a.small; vb = (b.mid || '') + b.small; }
      else { va = a[k]; vb = b[k]; }
      if (typeof va === 'string') return va.localeCompare(vb, 'zh') * d;
      return (va - vb) * d;
    });
    return r;
  }

  function render() {
    const rows = sorted();
    const total = rows.length, pages = Math.max(1, Math.ceil(total / st.size));
    st.page = Math.min(st.page, pages);
    const slice = rows.slice((st.page - 1) * st.size, st.page * st.size);
    const arrow = k => st.sort === k ? (st.dir > 0 ? ' ▲' : ' ▼') : '';
    let html = '<tr>' +
      `<th class="sortable" data-k="name">商品名称${arrow('name')}</th>` +
      `<th class="sortable" data-k="mid">中类 / 小类${arrow('mid')}</th>` +
      '<th>仓库分布</th>' +
      `<th class="sortable" style="text-align:right" data-k="qty">当前库存(kg)${arrow('qty')}</th>` +
      `<th class="sortable" style="text-align:right" data-k="mavg">历史月均消耗(kg)${arrow('mavg')}</th>` +
      `<th class="sortable" style="text-align:right" data-k="mc">可售月数${arrow('mc')}</th>` +
      `<th class="sortable" data-k="level">缺货风险${arrow('level')}</th>` +
      '<th>明细</th></tr>';
    html += slice.map(x => {
      const wh = Object.entries(x.whs || {}).map(([k, v]) => `${k} ${fmt(v)}`).join(' · ') || '—';
      const isOpen = st.open === x.code;
      let row = `<tr>
        <td style="font-size:12px"><b>${x.name}</b><br/><span style="color:#8A97A6;font-size:10.5px">${x.code}</span></td>
        <td style="font-size:11.5px">${x.mid || '—'}<br/><span style="color:#8A97A6">${x.small || '—'}</span></td>
        <td style="font-size:11.5px">${wh}</td>
        <td class="num" style="text-align:right"><b>${fmt(x.qty)}</b></td>
        <td class="num" style="text-align:right">${fmt(x.mavg)}</td>
        <td class="num" style="text-align:right;font-weight:700;color:${x.mc < 0.3 ? C.red : (x.mc < 1 ? C.amber : C.green)}">${x.mc}</td>
        <td><span class="lv ${LV_CLS[x.level]}">${LV_TEXT[x.level]}</span></td>
        <td><button class="det-btn" data-code="${x.code}" style="border:1px solid #D3DFEA;background:#fff;border-radius:6px;padding:2px 8px;font-size:11px;cursor:pointer;color:#0B5E8F">${isOpen ? '收起' : '查看'}</button></td></tr>`;
      if (isOpen) {
        const bars = MONTHS.map((m, i) => {
          const v = (SDATA[x.code] || [])[i] || 0;
          const w = Math.min(100, (v / Math.max(1, x.mavg)) * 30);
          return `<div style="display:flex;align-items:center;gap:6px;margin:2px 0"><span style="width:52px;color:#7A8899">${m.slice(2)}</span>
            <span style="flex:1;height:9px;background:#E7EEF6;border-radius:5px;overflow:hidden"><span style="display:block;width:${w}%;height:100%;background:#0B5E8F"></span></span>
            <span style="width:62px;text-align:right">${fmt(v)} kg</span></div>`;
        }).join('');
        row += `<tr class="det-row"><td colspan="8"><div class="det-grid">
          <div class="det-box"><b>库存明细</b><br/>
            商品编码：${x.code}<br/>仓库分布：${wh}<br/>
            当前库存：<b>${fmt(x.qty)} kg</b>　历史月均消耗：${fmt(x.mavg)} kg　可售：${x.mc} 月<br/>
            最早到期：${x.expiry || '无批次数据'}${x.daysToExpiry != null ? `（${x.daysToExpiry} 天后）` : ''}<br/>
            风险判定：${LV_TEXT[x.level]}${x.qty === 0 ? '（现货表无库存记录）' : ''}</div>
          <div class="det-box"><b>近 ${MONTHS.length} 个月出货</b>${bars}</div></div></td></tr>`;
      }
      return row;
    }).join('');
    $('tb_short').innerHTML = html;

    // 排序事件
    document.querySelectorAll('#tb_short th.sortable').forEach(th => th.onclick = () => {
      const k = th.dataset.k;
      if (st.sort === k) st.dir = -st.dir; else { st.sort = k; st.dir = (k === 'level' || k === 'name' || k === 'mid') ? 1 : -1; }
      render();
    });
    // 明细事件
    document.querySelectorAll('#tb_short .det-btn').forEach(b => b.onclick = () => {
      st.open = st.open === b.dataset.code ? null : b.dataset.code; render();
    });

    // 分页
    let pg = `<span>共 ${total} 条 · 第 ${st.page}/${pages} 页</span>`;
    pg += `<button id="sh_prev" ${st.page === 1 ? 'disabled' : ''}>上一页</button>`;
    for (let i = Math.max(1, st.page - 2); i <= Math.min(pages, st.page + 2); i++) pg += `<button class="pg" data-p="${i}" ${i === st.page ? 'on' : ''}>${i}</button>`;
    pg += `<button id="sh_next" ${st.page === pages ? 'disabled' : ''}>下一页</button>`;
    $('sh_pager').innerHTML = pg;
    const prev = $('sh_prev'), next = $('sh_next');
    if (prev) prev.onclick = () => { st.page--; render(); };
    if (next) next.onclick = () => { st.page++; render(); };
    document.querySelectorAll('#sh_pager .pg').forEach(b => b.onclick = () => { st.page = +b.dataset.p; render(); });
  }

  $('sh_apply').onclick = compute;
  $('sh_reset').onclick = () => {
    $('sh_mid').value = 'all'; $('sh_wh').value = 'all'; $('sh_win').value = '3';
    $('sh_level').value = 'all'; $('sh_qty').value = INV.threshold.lowQty; $('sh_cover').value = INV.threshold.lowCover;
    compute();
  };
  $('sh_export').onclick = () => {
    const head = ['商品编码', '商品名称', '中类', '小类', '仓库分布', '当前库存(kg)', '历史月均消耗(kg)', '可售月数', '缺货风险', '最早到期'];
    const lines = [head.join(',')];
    sorted().forEach(x => lines.push([x.code, `"${x.name}"`, x.mid || '', x.small || '',
      `"${Object.entries(x.whs || {}).map(([k, v]) => k + ' ' + v).join(' / ')}"`,
      x.qty, x.mavg, x.mc, LV_TEXT[x.level], x.expiry || ''].join(',')));
    const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `库存缺货预警_${INV.meta.date}.csv`;
    a.click();
  };
  compute();
})();

$('tb_forecast').innerHTML = '<tr><th>SKU</th><th style="text-align:right">近3月月均(kg)</th><th style="text-align:right">趋势因子</th><th style="text-align:right">10月预测(kg)</th><th>备货建议</th></tr>' +
  M.forecast.slice(0, 10).map(f => `<tr><td>${f.name}</td><td class="num" style="text-align:right">${fmt(f.avg3)}</td>
    <td class="num" style="text-align:right">${f.trend}</td><td class="num" style="text-align:right"><b>${fmt(f.oct_forecast)}</b></td>
    <td style="font-size:12px">${f.trend > 1.2 ? '🔥 提前备货' : (f.trend < 0.85 ? '❄️ 收缩安全库存' : '常规补货')}</td></tr>`).join('');

// ==================== m6 市場洞察（搜寻+分类+分组来源） ====================
const SRC_GROUP = {
  '新牧网': '权威行情平台', 'Mysteel 我的钢铁网': '权威行情平台', '鸭子网': '行业协会与垂直门户',
  '食品商务网': '官方价格监测', '中研普华': '行业研报机构', '其他公开渠道': '权威媒体与国际来源'
};
$('src_groups').innerHTML = MKT.meta.sources.map(s =>
  `<a href="${s.url || '#'}" target="_blank" rel="noopener">🌐 ${s.name}<span class="grp-tag">${SRC_GROUP[s.name] || '公开来源'}</span></a>`).join('');
const dimIcon = { '价格走势': '📈', '需求变化': '🛒', '政策动态': '📜', '产源资讯': '🏭', '新技术': '🔬', '竞品动态': '⚔️' };
let mktCat = 'all';
function renderMkt() {
  const q = ($('mkt_q').value || '').trim();
  $('mkt_cards').innerHTML = MKT.intel.filter(c => mktCat === 'all' || c.category === mktCat).map(c => {
    const items = c.items.filter(it => !q || (it.text + it.dim + it.source).includes(q));
    if (!items.length) return '';
    return `<div class="card c12" style="margin-bottom:16px">
      <h3>${c.category} <span style="font-size:12px;color:var(--txt2);font-weight:400">关联在售：${c.matchSkus.join('、')}</span></h3>
      <div class="scroll"><table class="tbl">
        <tr><th style="width:90px">维度</th><th>情报内容</th><th style="width:210px">来源 / 日期 / 原文</th></tr>
        ${items.map(it => `<tr><td>${dimIcon[it.dim] || '📌'} ${it.dim}</td>
          <td style="font-size:12.5px;line-height:1.7">${it.text}</td>
          <td class="src-cell" style="font-size:11.5px">${it.url ? `<a class="src-link" href="${it.url}" target="_blank" rel="noopener">🔗 ${it.source}</a>` : it.source}<span class="src-date">${it.date}</span></td></tr>`).join('')}
      </table></div></div>`;
  }).join('') || '<div class="card c12" style="text-align:center;color:#999;padding:30px">无匹配情报</div>';
}
document.querySelectorAll('.cat-chip').forEach(ch => ch.onclick = () => {
  document.querySelectorAll('.cat-chip').forEach(x => x.classList.remove('on'));
  ch.classList.add('on'); mktCat = ch.dataset.cat; renderMkt();
});
$('mkt_q').addEventListener('input', renderMkt);
renderMkt();

// ==================== 模块专属 AI 助手 ====================
const AI_MODULES = {
  m1: { name: '销售概览', chips: ['这个月整体盘子多大？', '手机订单占比趋势如何？', '9月为什么暴增？'],
    qa: [
      { k: ['盘子', 'gmv', '销售额', '多少'], a: `${M.monthly[0].m} ~ ${mLast.m} 整体已登记订单：GMV <b>${(M.kpi.gmv / 10000).toFixed(1)} 万 HKD</b>、订单 <b>${M.kpi.orders.toLocaleString()} 张</b>、客单价 <b>${M.kpi.aov.toLocaleString()} HKD</b>、动销客户 <b>${M.kpi.custs} 户</b>、总销量约 ${Math.round(M.kpi.qty / 1000).toLocaleString()} 吨。口径：全渠道（含手机订单），按要货单号去重。` },
      { k: ['手机', '占比', '移动'], a: `手机订单占比持续爬坡：单量占比从 ${M.monthly[0].m.slice(5)} 月 ${M.monthly[0].mobOrdersPct}% 升至 <b>9 月 ${m9.mobOrdersPct}%</b>（${m9.mobOrders.toLocaleString()}/${m9.orders.toLocaleString()} 单），金额占比 ${m9.mobAmtPct}%；${mLast.m.slice(5)} 月单量占比 ${mLast.mobOrdersPct}%。金额占比显著低于单量占比——手机订单单值低于整体均值（小单化特征）。` },
      { k: ['9月', '暴增', '增长', '环比', '下滑'], a: '9 月 GMV 2,538 万 vs 8 月 2,810 万（<b>−9.7%</b>），但销量 +6.7%、订单 +3.8%——典型<b>量增价跌</b>，与猪价跌破 10 元关口的行情一致（公司级口径）。结构性异动见模块 3。' }
    ] },
  m2: { name: '客户需求分析与产品机会洞察', chips: ['高价值客户有哪些？', '沉睡客户怎么唤回？', '高价值沉睡客户是谁？', '哪个属性客单价最高？'],
    qa: [
      { k: ['高价值', '分层', 'top'], a: `高价值客户 <b>${M.tierStat['高价值客户'].count} 户（${M.tierStat['高价值客户'].countPct}%）贡献 ${M.tierStat['高价值客户'].amtPct}% GMV</b>（${(M.tierStat['高价值客户'].amt / 10000).toFixed(0)} 万 HKD）。Top3：` + M.topCustomers.slice(0, 3).map(c => `${c.short}（${(c.amt / 10000).toFixed(0)}万）`).join('、') + '。' },
      { k: ['沉睡', '唤回', '流失'], a: `沉睡客户（>30 天未下单）<b>${M.dormantCount} 户</b>，历史贡献 ${(M.dormantAmt / 10000).toFixed(1)} 万 HKD。优先唤回：` + M.dormant.slice(0, 3).map(d => `${d.short}（${d.days}天/${(d.amt / 10000).toFixed(1)}万）`).join('、') + '。' },
      { k: ['高价值沉睡', '客单价高', '大客户沉睡'], a: (() => { const s = M.dormantHighStat || { count: 0, amt: 0, aovThreshold: 0, aovAvg: 0, longSleep: 0 };
          const list = (M.dormantHigh || []).slice(0, 3).map(d => `${d.short}（客单价 ${fmt(d.aov)}、${d.days} 天未下单）`).join('、');
          return `高价值沉睡客户 <b>${s.count} 户</b>（客单价 ≥ ${fmt(s.aovThreshold)} HKD 且未下单 >30 天），客单价均值 ${fmt(s.aovAvg)} HKD，历史贡献合计 ${(s.amt / 10000).toFixed(1)} 万，其中 >90 天 ${s.longSleep} 户。优先回访：${list}。`; })() },
      { k: ['属性', '客单价', '业态'], a: '属性客单价：' + M.attrAov.slice(0, 4).map(x => `${x.attr} ${fmt(x.aov)}`).join(' > ') + ` HKD；虚线为整体 ${M.kpi.aov.toLocaleString()}。零售超市/KA 餐饮为最高单值人群。` }
    ] },
  m3: { name: '异常变动', chips: ['9月哪些品类异常波动？', '哪些客户销售额异动最大？', '哪些小类应增未增？', '谁应涨反降？'],
    qa: [
      { k: ['应增未增', '掉队', '小类增长'], a: (() => { const s = (M.sigMiss || []);
          if (!s.length) return '本期无符合「多数客户增长、个别客户掉队」条件的小类。';
          return `本期 <b>${s.length} 个小类</b>符合「应增未增」：` + s.map(x => `<b>${x.small}</b>（${x.custCount} 户中 ${x.upCount} 户增长、${x.downCount} 户下降，小类整体 ${x.growth > 0 ? '+' : ''}${x.growth}%）`).join('；') + '。掉队客户集中在' + s.flatMap(x => x.drops.slice(0, 2).map(d => `${d.cust}（${x.small} ${d.chg}%）`)).slice(0, 4).join('、') + '，建议按缺口量逐户补单。'; })() },
      { k: ['应涨反降', '属性', '反降'], a: (() => { const d = (M.attrDrop || []);
          if (!d.length) return '本期无符合「属性内多数客户增长、个别客户下降」条件的客户。';
          return `本期 <b>${d.length} 户</b>属「应涨反降」：` + d.slice(0, 4).map(x => `${x.cust}（${x.attr}，${x.chg}%，属性整体 +${x.attrGrowth}%）`).join('、') + '，合计月缺口约 ' + (d.reduce((s, x) => s + x.lossAmt, 0) / 10000).toFixed(1) + ' 万 HKD。'; })() },
      { k: ['下跌', '下滑', '跌'], a: '环比下跌小类 10 个，最深：<b>豬軟骨 −99.9%</b>、豬肚 −98.9%、金錢展 −94.4%、牛肋骨肉 −93.9%——多数被同中类大盘品类承接（如四號肉 4.4→5.9 万 kg、牛胸腩 1.0→5.1 万 kg），属采购向主流规格集中；熟蝦 −71.7% 则被蝦肉承接（加工偏好切换）。' },
      { k: ['品类', '小类', '产品'], a: '上涨异动 Top：<b>牛胸腩 +403.6%</b>（1.0→5.1 万 kg）、肋排 +210.9%、牛霖 +164.8%、整鴨 +131.1%——大盘价跌中的逆势放量品类，多与牛肉/禽类旺季备货有关；下跌侧见「环比下跌小类」卡。' },
      { k: ['客户', '异动', '谁'], a: '可比口径客户异动 110 户。增幅 Top：香港美食 +634%（数量+587%为主）、振興凍肉 +571%、南光谷豐 +466%；下滑侧请关注「8月活跃9月未购」12 户——有成拓展（历史 139.6 万、46 天未下单）优先级最高。' }
    ] },
  m4: { name: '关联规则与需求机会', chips: ['有哪些组合销售机会？', '首购警示有多少？'],
    qa: [
      { k: ['组合', '关联', '连带'], a: `有效关联规则 ${M.skuRules.length} 条（共现≥30 单）：` + M.skuRules.slice(0, 3).map(r => `${r.a.split('｜')[0]}×${r.b.split('｜')[0]}（lift ${r.lift}）`).join('；') + '。多 SKU 订单占比 25.8%，组合装空间大。' },
      { k: ['首购', '初次'], a: `近 60 天老客户首购新产品 <b>${M.firstBuy.length.toLocaleString()} 条</b>（整体口径客户基数大）。页面展示最新 50 条，业务员 3 日回访制，状态本地可追踪。` }
    ] },
  m5: { name: '库存预警与供应链', chips: ['哪些货快断货了？', '库存数据是真实的吗？', '哪些货积压了？', '积压小类该找谁推？'],
    qa: [
      { k: ['缺货', '断货', '补货', '预警'], a: (() => { const s = INV.shortage || [];
          const out = s.filter(x => x.level === 'out').length, hi = s.filter(x => x.level === 'high').length;
          const top = s.slice(0, 3).map(x => `${x.name.split('|')[0]}（库存 ${fmt(x.qty)} kg / 月耗 ${fmt(x.monthly)} kg）`).join('、');
          return `缺货预警共 <b>${s.length} 个 SKU</b>：断货 ${out} 个、高风险 ${hi} 个。优先关注：${top}。判定＝库存低于阈值或可售月数低于覆盖月数，可在「库存缺货预警」按类别/仓库/时间段筛选并调整参数。`; })() },
      { k: ['真实', '模拟', '库存'], a: `库存为<b>真实数据</b>：取自 ${INV.meta.date} 现货表（${INV.meta.file}），合计 <b>${INV.kpis.qtyTon} 吨</b>、${INV.kpis.skuCount} 个在库 SKU，仓库按其士倉 / 沙田二倉归集；金额按采购成本计价（覆盖 ${INV.meta.costCoverage}% 库存量）。` },
      { k: ['积压', '呆滞', '去化'], a: (() => { const o = INV.overstock[0];
          return `积压判定＝现有量 ≥${INV.threshold.minQty} kg 且可售 ≥${INV.threshold.minMonths} 个月，共 <b>${INV.overstock.length} 个 SKU</b>、${fmt(INV.overstock.reduce((s, x) => s + x.qty, 0))} kg（占总量 ${(INV.overstock.reduce((s, x) => s + x.qty, 0) / INV.kpis.qtyKg * 100).toFixed(1)}%）。最重的「${o.name.split('|')[0]}」库存 ${fmt(o.qty)} kg、可售 ${o.monthsCover == null ? '无出货' : o.monthsCover + ' 个月'}。`; })() },
      { k: ['谁', '客户', '推', '应买未买', '小类'], a: (() => { const o = (INV.overSmall || [])[0]; if (!o || !o.targets.length) return '暂无积压小类目标客户。';
          const t = o.targets[0];
          return `积压小类「<b>${o.small}</b>」（库存 ${fmt(o.qty)} kg、可售 ${o.monthsCover == null ? '无出货' : o.monthsCover + ' 个月'}）应买未买：<b>${t.cust}</b>（${t.attr}）——同属性 ${t.buyers}/${t.total} 户（${t.cover}%）已购该小类，该客户近 90 天未购，采购规模 ${fmt(t.amt90)} HKD。另有 ${o.candCount} 户同类候选。`; })() }
    ] },
  m6: { name: '市場洞察', chips: ['猪价怎么走？', '羊肉有什么政策变化？', '信息源有哪些？'],
    qa: [
      { k: ['猪', '猪价'], a: '新牧网猪价指数（9/7）：全国均价 5.51 元/斤、日跌 0.58%；机构全年判断「前低后高」，11–13 元/公斤区间，下半年或迎趋势性反转。<span class="src">来源：新牧网/Mysteel（附原文链接）</span>' },
      { k: ['羊', '关税'], a: '羊肉「淡季不淡」，优质羊肉或冲击 80 元/公斤；进口零关税落地（乌拉圭货源价格优势）。秋冬火锅旺季临近，建议提前锁定内蒙古产区货源。<span class="src">来源：搜狐行情专栏（2026-01）</span>' },
      { k: ['来源', '信息源'], a: '六类来源并列：权威行情平台（新牧网/Mysteel/鸭子网）、官方价格监测（食品商务网）、行业研报（中研普华）、权威媒体与国际来源（搜狐/东方财富/丝路印象等）——每条情报附原文链接可追溯。' }
    ] }
};

let aiModule = 'm1';
const aiFab = $('aiFab'), aiDrawer = $('aiDrawer'), aiMask = $('aiMask'), aiBd = $('aiBd'), aiChips = $('aiChips'), aiTitle = $('aiTitle');
function aiOpen() { aiDrawer.classList.add('on'); aiMask.classList.add('on'); aiSetModule(aiModule, true); }
function aiClose() { aiDrawer.classList.remove('on'); aiMask.classList.remove('on'); }
aiFab.onclick = aiOpen; aiMask.onclick = aiClose; $('aiClose').onclick = aiClose;
function aiSetModule(mid, greet) {
  aiModule = mid;
  const m = AI_MODULES[mid];
  aiTitle.textContent = '🤖 ' + m.name + ' · 专属AI助手';
  aiChips.innerHTML = m.chips.map(c => `<button class="ai-chip">${c}</button>`).join('');
  aiChips.querySelectorAll('.ai-chip').forEach(ch => ch.onclick = () => { $('aiText').value = ch.textContent; aiAsk(); });
  if (greet) aiPush('bot', `您好，我是<b>「${m.name}」</b>模块的专属助手，只回答本模块业务范围内的具体问题（含真实数据出处）。可点击下方推荐问题或直接输入。`);
}
function aiPush(who, t) {
  const d = document.createElement('div');
  d.className = 'ai-msg ' + (who === 'user' ? 'user' : 'bot');
  d.innerHTML = t; aiBd.appendChild(d); aiBd.scrollTop = aiBd.scrollHeight;
}
function aiAsk() {
  const inp = $('aiText'); const q = inp.value.trim(); if (!q) return;
  inp.value = ''; aiPush('user', q);
  const m = AI_MODULES[aiModule];
  let best = null, bs = 0;
  const ql = q.toLowerCase();
  for (const it of m.qa) {
    const sc = it.k.reduce((s, k) => s + (ql.includes(k.toLowerCase()) ? 1 : 0), 0);
    if (sc > bs) { bs = sc; best = it; }
  }
  setTimeout(() => {
    if (best) aiPush('bot', best.a);
    else aiPush('bot', `这个问题超出「${m.name}」模块范围。我可回答：<br>· ${m.chips.join('<br>· ')}<br>其他模块问题请切换后再问。`);
  }, 200);
}
$('aiSend').onclick = aiAsk;
$('aiText').addEventListener('keydown', e => { if (e.key === 'Enter') aiAsk(); });

// ==================== 数据更新中心 ====================
(function () {
  const drawer = $('syncDrawer'), mask = $('syncMask');
  const open = () => { drawer.classList.add('on'); mask.classList.add('on'); renderSync(); };
  const close = () => { drawer.classList.remove('on'); mask.classList.remove('on'); };
  $('btnSync').onclick = open; mask.onclick = close; $('syncClose').onclick = close;
  function renderSync() {
    const meta = M.meta;
    $('syncBody').innerHTML = `
      <div class="logic" style="margin-top:0"><b>数据状态</b>：最新更新 <b>${meta.updatedAt || '—'}</b> ｜ 数据期间 ${meta.period} ｜ 数据源 ${meta.fileCount || '—'} 个文件<br>
      订单 ${M.kpi.orders.toLocaleString()} 张 · GMV ${(M.kpi.gmv / 10000).toFixed(1)} 万 HKD</div>
      <h3 style="margin:16px 0 6px">① 手动更新</h3>
      <div style="font-size:12.5px;line-height:1.9;color:#5B6B7F">在 WorkBuddy 对话中说「<b>更新中控台数据</b>」即可立即执行完整同步（校验→备份→重算→刷新）；或在本机运行：<br>
      <code style="background:#F0F6FB;padding:4px 8px;border-radius:6px;font-size:11.5px">python analysis/update_data.py</code></div>
      <h3 style="margin:16px 0 6px">② 定时自动更新</h3>
      <div style="font-size:12.5px;line-height:1.9;color:#5B6B7F">已配置<b>每工作日 08:30 自动同步</b>（WorkBuddy 自动化任务「ESHOP中控台数据同步」）；频率可在自动化设置中调整（每日/每周/自定义）。</div>
      <h3 style="margin:16px 0 6px">③ 数据校验与回滚</h3>
      <div style="font-size:12.5px;line-height:1.9;color:#5B6B7F">更新前验证：文件可读性、必需列、行数下限、日期解析率、GMV 与上版偏差（>50% 阻断）；异常时自动回滚至上一版指标并重新生成看板，全程写入 <code style="background:#F0F6FB;padding:2px 6px;border-radius:5px;font-size:11px">sync_log.jsonl</code> 日志。</div>
      <h3 style="margin:16px 0 6px">④ 数据源文件清单</h3>
      <div style="font-size:12px;line-height:1.9;color:#5B6B7F;max-height:180px;overflow-y:auto">${(meta.dataFiles || []).map(f => '· ' + f).join('<br>') || '见 OneDrive/ESHOP 目录'}</div>`;
  }
})();

aiSetModule('m1', false);
