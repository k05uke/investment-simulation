/* DOMに依存しない計算処理。ブラウザーとNode.jsの両方で使用できます。 */
(function (root) {
  'use strict';
  const types = ['future_value', 'annuity_future_value', 'sinking_fund', 'present_value', 'capital_recovery', 'annuity_present_value'];
  function simulate({ type, amount, annualRate, years, frequency = 'month', timing = 'end', method = 'effective' }) {
    if (!types.includes(type)) throw new Error('計算の種類が無効です。');
    if (!Number.isFinite(amount) || amount < 0 || amount > 1e12) throw new Error('金額は0円〜1兆円の数値を入力してください。');
    if (!Number.isFinite(annualRate) || annualRate < -0.2 || annualRate > 0.3) throw new Error('年利率は−20%〜30%で入力してください。');
    if (!Number.isInteger(years) || years < 1 || years > 50) throw new Error('期間は1〜50年の整数で入力してください。');
    if (!['month', 'year'].includes(frequency) || !['begin', 'end'].includes(timing) || !['effective', 'simple'].includes(method)) throw new Error('計算設定が無効です。');
    const perYear = frequency === 'month' ? 12 : 1;
    const n = years * perYear;
    const r = frequency === 'year' ? annualRate : method === 'simple' ? annualRate / 12 : Math.expm1(Math.log1p(annualRate) / 12);
    const growth = Math.exp(n * Math.log1p(r));
    const fvFactor = r === 0 ? n : Math.expm1(n * Math.log1p(r)) / r;
    const pvFactor = r === 0 ? n : -Math.expm1(-n * Math.log1p(r)) / r;
    const due = timing === 'begin' ? 1 + r : 1;
    let result, initial = 0, payment = 0, withdrawal = false;
    switch (type) {
      case 'future_value': initial = amount; result = amount * growth; break;
      case 'annuity_future_value': payment = amount; result = payment * fvFactor * due; break;
      case 'sinking_fund': result = amount / (fvFactor * due); payment = result; break;
      case 'present_value': result = amount / growth; initial = result; break;
      case 'capital_recovery': initial = amount; result = amount / (pvFactor * due); payment = result; withdrawal = true; break;
      case 'annuity_present_value': result = amount * pvFactor * due; initial = result; payment = amount; withdrawal = true; break;
    }
    const rows = [{ period: 0, balance: initial, comparison: withdrawal ? 0 : initial }];
    let balance = initial;
    for (let i = 1; i <= n; i++) {
      const cash = withdrawal ? -payment : payment;
      balance = timing === 'begin' ? (balance + cash) * (1 + r) : balance * (1 + r) + cash;
      // 最終残高0円の取り崩しでは浮動小数点の誤差を除去。
      if (withdrawal && i === n) balance = 0;
      rows.push({ period: i, balance, comparison: withdrawal ? payment * i : initial + payment * i });
    }
    if (![result, ...rows.flatMap(row => [row.balance, row.comparison])].every(Number.isFinite)) throw new Error('計算可能な範囲を超えています。入力を小さくしてください。');
    return { result, initial, payment, withdrawal, rows, rate: r, periods: n, perYear };
  }
  const api = { simulate, types };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Investment = api;
})(globalThis);
