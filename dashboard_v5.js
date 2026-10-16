// ESHOP 中控台 v5 渲染逻辑（整体数据口径）
const M = D.M, MKT = D.MKT, V2 = D.V2;
const A = M.anomaly;
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
      itemStyle: { borderRadius: [6, 6, 0, 0], color: p => p.dataIndex === 7 ? C.amber : C.tblue },
      label: { show: true, position: 'top', formatter: p => (p.value / 10000).toFixed(0) + '万', fontSize: 10.5 },
      markLine: { silent: true, symbol: 'none', data: [{ xAxis: 0.5 }],
        lineStyle: { type: 'dashed', color: '#C9971F', width: 2 },
        label: { formatter: '口径分界：4月起公司级全品类', fontSize: 11, color: '#C9971F', position: 'insideStartTop' } } },
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
$('tb_dormant').innerHTML = '<tr><th>客户简称</th><th>属性</th><th style="text-align:right">历史贡献</th><th style="text-align:right">订单数</th><th style="text-align:right">未下单天数</th><th>最近下单</th></tr>' +
  M.dormant.slice(0, 10).map(d => `<tr><td><b>${d.short}</b></td><td>${d.attr || '未映射'}</td>
    <td class="num" style="text-align:right">${(d.amt / 10000).toFixed(1)} 万</td><td class="num" style="text-align:right">${d.orders}</td>
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
reg('ch_anom_cust').setOption({
  grid: { left: 60, right: 40, top: 30, bottom: 50 },
  tooltip: { formatter: p => { const x = A.custAnom[p.data[4]];
    return `<b>${x.short}</b><br/>8月 ${fmt(x.augAmt)} → 9月 ${fmt(x.sepAmt)} HKD（${x.daPct > 0 ? '+' : ''}${x.daPct}%）<br/>数量 ${x.dqPct > 0 ? '+' : ''}${x.dqPct}% ｜ 均价 ${x.dpPct > 0 ? '+' : ''}${x.dpPct}%<br/>${x.cause}`; } },
  xAxis: { type: 'log', name: '采购数量变动（% · 对数轴）', min: 10, max: 6000,
    axisLabel: { formatter: v => '+' + v + '%' } },
  yAxis: { type: 'value', name: '均价变动（%）', scale: true },
  series: [{ type: 'scatter',
    symbolSize: d => Math.max(12, Math.min(46, Math.abs(d[2]) / 60)),
    data: A.custAnom.map((x, i) => [Math.max(10, Math.abs(x.dqPct)), Math.max(-120, Math.min(120, x.dpPct)), x.daPct, x.short, i]),
    itemStyle: { color: p => p.data[2] >= 0 ? C.green : C.red, opacity: 0.75 },
    label: { show: true, formatter: p => p.data[3], position: 'top', fontSize: 9.5 },
    markLine: { silent: true, symbol: 'none', data: [{ xAxis: 0 }, { yAxis: 0 }], lineStyle: { color: '#B8C4D0', type: 'dashed' } } }]
});
$('tb_anom_cust').innerHTML = '<tr><th>客户简称</th><th style="text-align:right">8月销售额</th><th style="text-align:right">9月销售额</th><th style="text-align:right">金额变动</th><th style="text-align:right">数量变动</th><th style="text-align:right">均价变动</th><th>原因判定</th></tr>' +
  A.custAnom.slice(0, 20).map(x => `<tr>
    <td><b>${x.short}</b></td>
    <td class="num" style="text-align:right">${fmt(x.augAmt)}</td>
    <td class="num" style="text-align:right">${fmt(x.sepAmt)}</td>
    <td class="num" style="text-align:right;color:${x.daPct >= 0 ? C.green : C.red};font-weight:700">${x.daPct > 0 ? '+' : ''}${x.daPct}%</td>
    <td class="num" style="text-align:right">${x.dqPct > 0 ? '+' : ''}${x.dqPct}%</td>
    <td class="num" style="text-align:right">${x.dpPct > 0 ? '+' : ''}${x.dpPct}%</td>
    <td style="font-size:12px">${x.cause}</td></tr>`).join('');
$('tb_cust_new').innerHTML = '<tr><th>客户简称</th><th style="text-align:right">9月销售额</th></tr>' +
  A.custNew.map(x => `<tr><td><b>${x.short}</b></td><td class="num" style="text-align:right">${fmt(x.sepAmt)} HKD</td></tr>`).join('');
$('tb_cust_lost').innerHTML = '<tr><th>客户简称</th><th style="text-align:right">8月销售额</th></tr>' +
  A.custLost.map(x => `<tr><td><b>${x.short}</b></td><td class="num" style="text-align:right">${fmt(x.augAmt)} HKD</td></tr>`).join('');

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

// ==================== m5 库存预警与供应链 ====================
(function () {
  const lv = [...V2.alerts].sort((a, b) => (b.safety - b.current) - (a.safety - a.current)).slice(0, 10);
  reg('ch_level').setOption({
    grid: { left: 130, right: 110, top: 20, bottom: 40 },
    tooltip: { trigger: 'axis', formatter: p => { const x = lv[p[0].dataIndex];
      return `${x.name}@${x.wname}<br/>在库 <b>${x.current}</b> / 安全 ${x.safety} ${x.unit}（水位 ${(x.current / x.safety * 100).toFixed(0)}%）`; } },
    xAxis: { type: 'value', max: 135, name: '水位 %（在库÷安全）' },
    yAxis: { type: 'category', data: lv.map(x => x.name.slice(0, 10) + '@' + x.wname.slice(0, 3)) },
    series: [{ type: 'bar', barWidth: 15,
      data: lv.map(x => ({ value: +(x.current / x.safety * 100).toFixed(0),
        itemStyle: { color: x.current / x.safety < 0.5 ? C.red : (x.current / x.safety < 1 ? C.amber : C.green), borderRadius: [0, 5, 5, 0] } })),
      label: { show: true, position: 'right', fontSize: 10.5, formatter: p => p.value + '%' },
      markLine: { silent: true, symbol: 'none', data: [{ xAxis: 50 }, { xAxis: 100 }],
        lineStyle: { type: 'dashed', color: C.blue }, label: { fontSize: 10 } } }]
  });
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
      { k: ['盘子', 'gmv', '销售额', '多少'], a: '2026-03-02 ~ 10-10 整体已登记订单：GMV <b>4,354.3 万 HKD</b>、订单 <b>10,865 张</b>、客单价 <b>4,008 HKD</b>、动销客户 <b>379 户</b>、总销量约 4,960 吨。口径：全渠道（含手机订单），按要货单号去重。' },
      { k: ['手机', '占比', '移动'], a: '手机订单占比持续爬坡：单量占比从 3 月 0% 升至 <b>9 月 7.8%</b>（427/5,474 单），金额占比 3.6%；10 月至今单量占比 7.3%。金额占比显著低于单量占比——手机订单单值低于整体均值（小单化特征）。' },
      { k: ['9月', '暴增', '增长', '环比', '下滑'], a: '9 月 GMV 2,538 万 vs 8 月 2,810 万（<b>−9.7%</b>），但销量 +6.7%、订单 +3.8%——典型<b>量增价跌</b>，与猪价跌破 10 元关口的行情一致（公司级口径，4 月起含冻肉全量）。结构性异动见模块 3。' }
    ] },
  m2: { name: '客户需求分析与产品机会洞察', chips: ['高价值客户有哪些？', '沉睡客户怎么唤回？', '哪个属性客单价最高？'],
    qa: [
      { k: ['高价值', '分层', 'top'], a: '高价值客户 <b>94 户（24.8%）贡献 84.2% GMV</b>（3,668 万 HKD）。Top3：' + M.topCustomers.slice(0, 3).map(c => `${c.short}（${(c.amt / 10000).toFixed(0)}万）`).join('、') + '。' },
      { k: ['沉睡', '唤回', '流失'], a: `沉睡客户（>30 天未下单）<b>${M.dormantCount} 户</b>，历史贡献 ${(M.dormantAmt / 10000).toFixed(1)} 万 HKD。优先唤回：` + M.dormant.slice(0, 3).map(d => `${d.short}（${d.days}天/${(d.amt / 10000).toFixed(1)}万）`).join('、') + '。' },
      { k: ['属性', '客单价', '业态'], a: '属性客单价：' + M.attrAov.slice(0, 4).map(x => `${x.attr} ${fmt(x.aov)}`).join(' > ') + ' HKD；虚线为整体 4,008。零售超市/KA 餐饮为最高单值人群。' }
    ] },
  m3: { name: '异常变动', chips: ['9月哪些品类异常波动？', '哪些客户销售额异动最大？', '大快活发生了什么？'],
    qa: [
      { k: ['下跌', '下滑', '跌'], a: '环比下跌小类 10 个，最深：<b>豬軟骨 −99.9%</b>、豬肚 −98.9%、金錢展 −94.4%、牛肋骨肉 −93.9%——多数被同中类大盘品类承接（如四號肉 4.4→5.9 万 kg、牛胸腩 1.0→5.1 万 kg），属采购向主流规格集中；熟蝦 −71.7% 则被蝦肉承接（加工偏好切换）。' },
      { k: ['品类', '小类', '产品'], a: '上涨异动 Top：<b>牛胸腩 +403.6%</b>（1.0→5.1 万 kg）、肋排 +210.9%、牛霖 +164.8%、整鴨 +131.1%——大盘价跌中的逆势放量品类，多与牛肉/禽类旺季备货有关；下跌侧见「环比下跌小类」卡。' },
      { k: ['客户', '异动', '谁'], a: '可比口径客户异动 110 户。增幅 Top：香港美食 +634%（数量+587%为主）、振興凍肉 +571%、南光谷豐 +466%；下滑侧请关注「8月活跃9月未购」12 户——有成拓展（历史 139.6 万、46 天未下单）优先级最高。' },
      { k: ['大快活', '大家樂', '大家乐', '香港美食'], a: '香港美食 8 月 6.3 万 → 9 月 46.0 万（+634%）：采购数量 +587% 为主、均价 +6.8%——<b>数量驱动的放量</b>且结构稳定偏优，建议业务员趁热绑定框架协议；此类「量价齐升」客户在散点图右上区。' }
    ] },
  m4: { name: '关联规则与需求机会', chips: ['有哪些组合销售机会？', '首购警示有多少？'],
    qa: [
      { k: ['组合', '关联', '连带'], a: '有效关联规则 5 条（共现≥30 单）：八合里牛肉丸×牛筋丸（lift 20.4、共现 72 单）最强；遼寧盛佳康帶皮腿扒×小雞胸肉（lift 12.4）；高峰四號肉×金鷹面精肉（lift 7.7）。多 SKU 订单占比 25.8%，组合装空间大。' },
      { k: ['首购', '初次'], a: `近 60 天老客户首购新产品 <b>${M.firstBuy.length.toLocaleString()} 条</b>（整体口径客户基数大）。页面展示最新 50 条，业务员 3 日回访制，状态本地可追踪。` }
    ] },
  m5: { name: '库存预警与供应链', chips: ['10月该备什么货？', '库存数据是真实的吗？'],
    qa: [
      { k: ['10月', '预测', '备货'], a: '10 月需求预测 Top3（真实销量×趋势因子）：' + M.forecast.slice(0, 3).map(f => `${f.name} ${fmt(f.oct_forecast)} kg（趋势 ${f.trend}）`).join('、') + '。趋势 >1.2 的 SKU 提前备货。' },
      { k: ['真实', '模拟', '库存'], a: '库存水位为<b>模拟数据</b>（MCP 规则生成，已声明），用于演示预警与补货逻辑；需求预测基于真实销量。接入真实库存后口径不变、直接换源。' }
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
