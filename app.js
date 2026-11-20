'use strict';
const specs = {
  future_value: { name: '終価係数', short: '今の資産を増やす', title: '今のお金が将来いくらになる？', description: 'まとまった資産を運用した場合の将来額を試算します。', amount: '元本（円）', initial: 1000000, years: 20, frequency: 'month', label: () => '将来の資産額', formula: 'FV = PV × (1 + r)^n' },
  annuity_future_value: { name: '年金終価係数', short: '積立の未来を知る', title: '積立を続けるといくらになる？', description: '一定額を積み立てた場合の将来額を試算します。', amount: unit => `${unit}の積立額（円）`, initial: 30000, years: 20, frequency: 'month', label: () => '将来の積立資産', formula: 'FV = PMT × ((1 + r)^n − 1) / r' },
  sinking_fund: { name: '減債基金係数', short: '目標から積立額を知る', title: '目標に向けていくら積み立てる？', description: '目標額を達成するための積立額を逆算します。', amount: '目標額（円）', initial: 10000000, years: 20, frequency: 'month', label: unit => `必要な${unit}の積立額`, formula: 'PMT = FV × r / ((1 + r)^n − 1)' },
  present_value: { name: '現価係数', short: '将来のお金を今に換算', title: '将来のお金は今いくら？', description: '将来の目標額を得るために、今必要な資産額を試算します。', amount: '将来受け取る金額（円）', initial: 10000000, years: 10, frequency: 'year', label: () => '現在価値', formula: 'PV = FV / (1 + r)^n' },
  capital_recovery: { name: '資本回収係数', short: '資産を取り崩す', title: '資産からいくら受け取れる？', description: '資産を運用しながら、指定した期間で使い切る受取額を試算します。', amount: '現在の資産額（円）', initial: 10000000, years: 20, frequency: 'month', label: unit => `${unit}の受取可能額`, formula: 'PMT = PV × r / (1 − (1 + r)^(−n))' },
  annuity_present_value: { name: '年金現価係数', short: '受取額から資産を知る', title: '受け取りたい額にいくら必要？', description: '一定額を受け取り続けるために、今必要な資産額を試算します。', amount: unit => `${unit}受け取りたい額（円）`, initial: 100000, years: 20, frequency: 'year', label: () => '現在必要な資産額', formula: 'PV = PMT × (1 − (1 + r)^(−n)) / r' }
};
const $ = id => document.getElementById(id);
const yen = value => `${Math.round(value).toLocaleString('ja-JP')}円`;
let current = 'annuity_future_value';
let latest;
const saved = {};
const form = $('input-form');
for (const [key, spec] of Object.entries(specs)) {
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'sim-button'; button.dataset.type = key;
  const title = document.createElement('strong'); title.textContent = spec.name;
  const subtitle = document.createElement('span'); subtitle.textContent = spec.short;
  button.append(title, subtitle);
  button.addEventListener('click', () => {
    saved[current] = Object.fromEntries(new FormData(form));
    select(key);
  });
  $('simulations').append(button);
}
function select(key, reset = false) {
  current = key;
  const spec = specs[key];
  const values = !reset && saved[key] || { amount: spec.initial, rate: 5, years: spec.years, frequency: spec.frequency, timing: 'end', method: 'effective' };
  for (const [id, value] of Object.entries(values)) $(id).value = value;
  document.querySelectorAll('.sim-button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.type === key)));
  $('coefficient').textContent = spec.name;
  $('simulation-title').textContent = spec.title;
  $('description').textContent = spec.description;
  $('formula').textContent = spec.formula;
  $('timing-field').hidden = ['future_value', 'present_value'].includes(key);
  update();
}
function update() {
  const spec = specs[current];
  const unit = $('frequency').value === 'month' ? '毎月' : '毎年';
  $('amount-label').textContent = typeof spec.amount === 'function' ? spec.amount(unit) : spec.amount;
  $('rate-output').textContent = `${Number($('rate').value).toFixed(1)} %`;
  $('years-output').textContent = `${$('years').value} 年`;
  $('method').disabled = $('frequency').value === 'year';
  try {
    if (!$('amount').validity.valid) throw new Error('金額は0円〜1兆円の数値を入力してください。');
    const amount = Number($('amount').value);
    const result = Investment.simulate({ type: current, amount, annualRate: Number($('rate').value) / 100, years: Number($('years').value), frequency: $('frequency').value, timing: $('timing').value, method: $('method').value });
    latest = result;
    $('error').hidden = true; $('result-content').hidden = false;
    $('result-label').textContent = spec.label(unit);
    $('result-value').textContent = yen(result.result);
    const years = $('years').value;
    const timing = $('timing').value === 'begin' ? '期首' : '期末';
    const descriptions = {
      future_value: `${yen(amount)}を${years}年間運用した場合の将来額です。`,
      annuity_future_value: `${unit}${yen(amount)}を${timing}に積み立てた場合の、${years}年後の資産額です。`,
      sinking_fund: `${years}年後の${yen(amount)}を目指すには、${unit}の${timing}にこの金額の積立が必要です。`,
      present_value: `${years}年後に${yen(amount)}にするために、現在必要な金額です。`,
      capital_recovery: `${yen(amount)}を運用しながら${years}年間、${unit}の${timing}に受け取る場合の金額です。`,
      annuity_present_value: `${years}年間、${unit}の${timing}に${yen(amount)}を受け取るための資産額です。`
    };
    $('explanation').textContent = descriptions[current];
    let metrics;
    if (result.withdrawal) metrics = [['受取総額', yen(result.payment * result.periods)], ['当初の資産額', yen(result.initial)], ['運用による増減', yen(result.payment * result.periods - result.initial)]];
    else if (current === 'present_value') metrics = [['将来の金額', yen(amount)], ['現在価値との差', yen(amount - result.result)], ['期間', `${years}年`]];
    else {
      const principal = result.initial + result.payment * result.periods;
      const final = result.rows.at(-1).balance;
      metrics = [['元本合計', yen(principal)], ['運用による増減', yen(final - principal)], ['元本に対する倍率', principal === 0 ? '—' : `${(final / principal).toFixed(2)}倍`]];
    }
    $('metrics').replaceChildren(...metrics.map(([label, value]) => {
      const card = document.createElement('div'); card.className = 'metric';
      const p = document.createElement('p'); p.textContent = label;
      const strong = document.createElement('strong'); strong.textContent = value;
      card.append(p, strong); return card;
    }));
    const comparison = result.withdrawal ? '累計受取額' : '元本合計';
    $('comparison-label').textContent = comparison; $('comparison-heading').textContent = comparison;
    $('period-note').textContent = `1期の利率 ${(result.rate * 100).toFixed(4)}% / ${result.periods}期`;
    drawChart(result);
    $('schedule').replaceChildren(...result.rows.map(row => {
      const tr = document.createElement('tr');
      for (const text of [periodLabel(row.period, result.perYear), yen(row.balance), yen(row.comparison)]) {
        const td = document.createElement('td'); td.textContent = text; tr.append(td);
      }
      return tr;
    }));
  } catch (error) {
    latest = null; $('error').textContent = error.message; $('error').hidden = false; $('result-content').hidden = true;
  }
}
function periodLabel(period, perYear) {
  if (perYear === 1) return `${period}年`;
  const years = Math.floor(period / 12), months = period % 12;
  return months ? `${years}年${months}か月` : `${years}年`;
}
function drawChart(result) {
  const { rows, periods, perYear } = result;
  const width = 760, height = 340, left = 96, right = 25, top = 22, bottom = 48;
  const max = Math.max(1, ...rows.flatMap(row => [row.balance, row.comparison])) * 1.08;
  const x = period => left + (width - left - right) * period / periods;
  const y = value => height - bottom - value / max * (height - top - bottom);
  const svgNS = 'http://www.w3.org/2000/svg';
  const el = (tag, attributes, text) => {
    const node = document.createElementNS(svgNS, tag);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const svg = el('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': `${specs[current].name}：資産残高と${result.withdrawal ? '累計受取額' : '元本合計'}の推移。詳細は期間ごとの結果表で確認できます。` });
  for (let i = 0; i <= 4; i++) {
    const value = max * i / 4;
    svg.append(el('line', { x1: left, x2: width - right, y1: y(value), y2: y(value), stroke: '#e4eaf0' }));
    const compact = value >= 1e8 ? `${(value / 1e8).toFixed(1)}億円` : value >= 1e4 ? `${Math.round(value / 1e4).toLocaleString('ja-JP')}万円` : `${Math.round(value)}円`;
    svg.append(el('text', { x: left - 10, y: y(value) + 5, 'text-anchor': 'end' }, compact));
  }
  for (let i = 0; i <= 4; i++) {
    const period = periods * i / 4;
    svg.append(el('text', { x: x(period), y: height - 12, 'text-anchor': 'middle' }, `${Number((period / perYear).toFixed(2))}年`));
  }
  const points = field => rows.map(row => `${x(row.period)},${y(row[field])}`).join(' ');
  svg.append(el('polygon', { points: `${x(0)},${y(0)} ${points('balance')} ${x(periods)},${y(0)}`, fill: '#e6f3ef' }));
  svg.append(el('polyline', { points: points('comparison'), fill: 'none', stroke: '#7f8fae', 'stroke-width': 2, 'stroke-dasharray': '6 5' }));
  svg.append(el('polyline', { points: points('balance'), fill: 'none', stroke: '#16776a', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
  $('chart').replaceChildren(svg);
}
form.addEventListener('submit', event => event.preventDefault());
form.addEventListener('input', update);
form.addEventListener('change', update);
$('reset').addEventListener('click', () => select(current, true));
$('download').addEventListener('click', () => {
  if (!latest) return;
  const settings = ['計算種類,金額（円）,年利率（%）,期間（年）,単位,タイミング,月利換算', `${specs[current].name},${$('amount').value},${$('rate').value},${$('years').value},${$('frequency').value},${$('timing-field').hidden ? '対象外' : $('timing').value},${$('frequency').value === 'year' ? '対象外' : $('method').value}`, ''];
  const csv = [...settings, `経過期,経過年,資産残高（円）,${latest.withdrawal ? '累計受取額' : '元本合計'}（円）`, ...latest.rows.map(row => `${row.period},${row.period / latest.perYear},${Math.round(row.balance)},${Math.round(row.comparison)}`)].join('\r\n');
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = `investment-${current}.csv`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
select(current);
