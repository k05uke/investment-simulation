(function () {
  'use strict';
  const { simulate, types } = typeof module !== 'undefined' && module.exports ? require('../calculations.js') : globalThis.Investment;
  let checks = 0;
  function assert(ok, message) { checks++; if (!ok) throw new Error(message); }
  function near(actual, expected, message) { assert(Math.abs(actual - expected) <= Math.max(1e-5, Math.abs(expected) * 1e-9), `${message}: ${actual} != ${expected}`); }
  const base = { amount: 1000000, annualRate: .05, years: 10, frequency: 'year', timing: 'end' };
  const calc = (type, changes = {}) => simulate({ ...base, type, ...changes });
  const examples = { future_value: 1628894.626777442, annuity_future_value: 12577892.53554884, sinking_fund: 79504.5749654566, present_value: 613913.253540759, capital_recovery: 129504.5749654566, annuity_present_value: 7721734.929184818 };
  for (const [type, value] of Object.entries(examples)) near(calc(type).result, value, `既知の例 ${type}`);
  for (const annualRate of [-.2, 0, 1e-12, .05, .3]) {
    for (const frequency of ['month', 'year']) {
      for (const timing of ['begin', 'end']) {
        for (const method of ['effective', 'simple']) {
          const args = { annualRate, frequency, timing, method, years: 50 };
          const fv = calc('future_value', { ...args, amount: 1000 });
          near(calc('present_value', { ...args, amount: fv.result }).result, 1000, '終価・現価の逆算');
          const afv = calc('annuity_future_value', { ...args, amount: 100 });
          near(afv.rows.at(-1).balance, afv.result, '積立の逐次計算と公式');
          near(calc('sinking_fund', { ...args, amount: afv.result }).result, 100, '積立・目標額の逆算');
          const cr = calc('capital_recovery', args);
          near(calc('annuity_present_value', { ...args, amount: cr.result }).result, base.amount, '取り崩し・必要資産の逆算');
          let balance = base.amount;
          for (let i = 0; i < cr.periods; i++) balance = timing === 'begin' ? (balance - cr.result) * (1 + cr.rate) : balance * (1 + cr.rate) - cr.result;
          // 高利率・50年の逐次計算では誤差も複利で増幅するため、1円未満を許容。
          assert(Math.abs(balance) < 1, `取り崩し後残高: ${balance}`);
          for (const type of types) {
            const zero = calc(type, { ...args, amount: 0 });
            near(zero.result, 0, '金額0円');
            assert(zero.rows.every(row => row.balance === 0 && row.comparison === 0), '0円の推移');
          }
        }
      }
    }
  }
  for (const type of types) {
    const zeroRate = calc(type, { annualRate: 0 });
    const expected = ['annuity_future_value', 'annuity_present_value'].includes(type) ? base.amount * 10 : ['sinking_fund', 'capital_recovery'].includes(type) ? base.amount / 10 : base.amount;
    near(zeroRate.result, expected, '利率0%');
  }
  near(calc('future_value', { frequency: 'month' }).result, calc('future_value').result, '実効月利と年利の一致');
  assert(calc('annuity_future_value', { timing: 'begin' }).result > calc('annuity_future_value').result, '期首積立の利息');
  for (const changes of [{ amount: -1 }, { amount: NaN }, { amount: Infinity }, { amount: 1e13 }, { annualRate: -.21 }, { annualRate: NaN }, { years: 0 }, { years: 1.5 }, { years: 51 }, { timing: 'other' }, { frequency: 'day' }, { method: 'other' }, { type: 'other' }]) {
    let rejected = false;
    try { calc('future_value', changes); } catch (_) { rejected = true; }
    assert(rejected, '無効な入力を拒否');
  }
  const message = `${checks} calculation checks passed`;
  if (typeof document !== 'undefined') document.getElementById('test-results').textContent = message;
  else console.log(message);
})();
