'use strict';

// ---------- Datos ----------
const KEY = 'misfinanzas-v1';
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const METODOS = ['Débito', 'Crédito', 'Transferencia', 'Efectivo'];
const CUOTAS = [1, 2, 3, 6, 9, 12, 18];
const COLORES = ['#3B3F8F', '#0A6FB8', '#B4400C', '#6B3FA0', '#0B7A5C', '#8A5A00', '#9C2F5B', '#2F6F7A'];

const ALTERNATIVAS = {
  'Delivery': 'Cocinar 2 noches más por semana, o retirar en el local en vez de pagar envío.',
  'Salidas': 'Una salida menos por semana, o aprovechar promos 2x1 y descuentos de tu banco.',
  'Supermercado': 'Comprar lo no perecedero en mayorista y usar los días de descuento de Galicia o Mercado Pago.',
  'Transporte': 'Combinar más transporte público y revisar los descuentos de SUBE.',
  'Servicios': 'Revisar tu plan de celular e internet: suele haber planes más baratos para lo mismo.',
  'Ropa': 'Esperar a Hot Sale o Cyber Monday, o comprar en cuotas sin interés.',
  'Salud': 'Comparar precios de farmacia y pedir genéricos cuando se pueda.'
};

function defaultData() {
  return {
    rate: 1400,
    rateName: 'MEP',
    rateUpdated: null,
    lastBackup: null,
    accounts: [
      { id: 'cocos', name: 'Cocos', color: '#3B3F8F', curs: ['ARS', 'USD'], start: { ARS: 0, USD: 0 } },
      { id: 'mp', name: 'Mercado Pago', color: '#0A6FB8', curs: ['ARS'], start: { ARS: 0 } },
      { id: 'galicia', name: 'Galicia', color: '#B4400C', curs: ['ARS', 'USD'], start: { ARS: 0, USD: 0 } },
      { id: 'utopia', name: 'Utopia', color: '#6B3FA0', curs: ['USD'], start: { USD: 0 } },
      { id: 'dolarapp', name: 'Dólar App', color: '#0B7A5C', curs: ['USD'], start: { USD: 0 } },
      { id: 'efectivo', name: 'Efectivo', color: '#5B6068', curs: ['ARS', 'USD'], start: { ARS: 0, USD: 0 } }
    ],
    cats: {
      gasto: ['Supermercado', 'Delivery', 'Transporte', 'Servicios', 'Salidas', 'Ropa', 'Salud', 'Pinky', 'Casa', 'Otros'],
      ingreso: ['Sueldo', 'Freelance', 'Rendimientos', 'Regalo', 'Otros']
    },
    movs: []
  };
}

let data = load();
// Cambio pedido: la categoría "Suscripciones" pasa a llamarse "Pinky" (también en lo ya cargado).
if (!data.renamedPinky) {
  const g = data.cats.gasto, i = g.indexOf('Suscripciones');
  if (i >= 0) { if (g.includes('Pinky')) g.splice(i, 1); else g[i] = 'Pinky'; }
  for (const m of data.movs) if (m.cat === 'Suscripciones') m.cat = 'Pinky';
  data.renamedPinky = true;
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* sin espacio */ }
}
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return Object.assign(defaultData(), JSON.parse(raw));
  } catch (e) { /* sin datos */ }
  return defaultData();
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); }
  catch (e) { toast('No se pudo guardar. ¿Está lleno el almacenamiento?'); }
}

// ---------- Utilidades ----------
const $ = (s) => document.querySelector(s);
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function today() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function mk(date) { return date.slice(0, 7); }
function addM(key, n) { let [y, m] = key.split('-').map(Number); m += n; while (m > 12) { m -= 12; y++; } while (m < 1) { m += 12; y--; } return y + '-' + String(m).padStart(2, '0'); }
function mName(key) { return MESES[Number(key.slice(5, 7)) - 1]; }
function mShort(key) { return MESES_CORTOS[Number(key.slice(5, 7)) - 1]; }
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function fmt(n, cur) {
  const usd = cur === 'USD';
  const s = Math.abs(n).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: usd ? 2 : 0 });
  return (n < 0 ? '- ' : '') + (usd ? 'US$ ' : '$ ') + s;
}
function parseAmount(s) {
  s = String(s || '').replace(/US\$|U\$S|USD|\$|\s/gi, '');
  if (!s) return 0;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  const n = parseFloat(s);
  return isFinite(n) ? n : 0;
}
function toARS(n, cur) { return cur === 'USD' ? n * data.rate : n; }
function acc(id) { return data.accounts.find((a) => a.id === id) || { id, name: id, color: '#5B6068', curs: ['ARS'] }; }
function initials(name) { const w = name.split(/\s+/); return (w.length > 1 ? w[0][0] + w[1][0] : name.slice(0, 2)).toUpperCase(); }
function shortDate(d) { return Number(d.slice(8, 10)) + ' ' + mShort(d).toLowerCase(); }
let toastTimer;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600); }

// ---------- Cálculos ----------
// Cada gasto se reparte en los meses en que realmente se paga (crédito = mes siguiente, en cuotas).
// En un gasto compartido, para las estadísticas solo cuenta tu parte (ars); de la cuenta sale el total (amount).
function myShare(m) { return m.split > 1 ? 1 / m.split : 1; }
function gastoParts(m) {
  const ars = toARS(m.amount, m.cur) * myShare(m);
  if (m.method !== 'Crédito') return [{ month: mk(m.date), ars, amount: m.amount, cur: m.cur }];
  const n = m.cuotas || 1;
  const out = [];
  for (let i = 1; i <= n; i++) out.push({ month: addM(mk(m.date), i), ars: ars / n, amount: m.amount / n, cur: m.cur, cuota: i, of: n });
  return out;
}
// Gastos compartidos en los que todavía te deben plata.
function personName(g, i) { return ((g.people || [])[i] || '').trim() || 'Persona ' + (i + 1); }
function sharedPending() {
  const paid = {}, paidBy = {};
  for (const m of data.movs) if (m.type === 'reintegro') {
    paid[m.sharedId] = (paid[m.sharedId] || 0) + m.amount;
    if (m.person != null) (paidBy[m.sharedId] = paidBy[m.sharedId] || {})[m.person] = true;
  }
  return data.movs.filter((m) => m.type === 'gasto' && m.split > 1)
    .map((m) => {
      const owed = m.amount * (1 - 1 / m.split);
      const left = owed - (paid[m.id] || 0);
      const share = m.amount / m.split;
      const persons = [];
      for (let i = 0; i < m.split - 1; i++) persons.push({ i, name: personName(m, i), share, paid: !!(paidBy[m.id] || {})[i] });
      return { m, owed, left, persons: persons.filter((p) => !p.paid) };
    })
    .filter((x) => x.left > 0.5)
    .sort((a, b) => b.m.date.localeCompare(a.m.date));
}
function monthTotals(key) {
  let ing = 0, gas = 0;
  const byCat = {};
  for (const m of data.movs) {
    if (m.type === 'ingreso' && mk(m.date) === key) ing += toARS(m.amount, m.cur);
    if (m.type === 'gasto') for (const p of gastoParts(m)) if (p.month === key) { gas += p.ars; byCat[m.cat] = (byCat[m.cat] || 0) + p.ars; }
  }
  return { ing, gas, byCat };
}
function balances() {
  const b = {};
  for (const a of data.accounts) { b[a.id] = {}; for (const c of a.curs) b[a.id][c] = Number((a.start || {})[c] || 0); }
  const add = (id, cur, n) => { if (!b[id]) b[id] = {}; b[id][cur] = (b[id][cur] || 0) + n; };
  const cur = mk(today());
  for (const m of data.movs) {
    if (m.type === 'ingreso' || m.type === 'reintegro') add(m.account, m.cur, m.amount);
    else if (m.type === 'gasto') { for (const p of gastoParts(m)) if (p.month <= cur) add(m.account, m.cur, -p.amount); }
    else if (m.type === 'dolar') {
      if (m.op === 'compra') { add(m.arsAccount, 'ARS', -m.usd * m.price); add(m.usdAccount, 'USD', m.usd); }
      else { add(m.usdAccount, 'USD', -m.usd); add(m.arsAccount, 'ARS', m.usd * m.price); }
    } else if (m.type === 'mover') { add(m.from, m.cur, -m.amount); add(m.to, m.cur, m.amount); }
  }
  return b;
}
function creditDue(key) {
  let t = 0;
  for (const m of data.movs) if (m.type === 'gasto' && m.method === 'Crédito') for (const p of gastoParts(m)) if (p.month === key) t += toARS(p.amount, p.cur);
  return t;
}
// Ganancia en pesos por comprar USD y venderlos más caro (costo promedio de lo comprado).
function dollarStats() {
  const ops = data.movs.filter((m) => m.type === 'dolar').sort((a, b) => a.date.localeCompare(b.date));
  let stock = 0, avg = 0;
  const gainByMonth = {}, buys = {}, sells = {};
  for (const o of ops) {
    const key = mk(o.date);
    if (o.op === 'compra') {
      avg = stock + o.usd > 0 ? (stock * avg + o.usd * o.price) / (stock + o.usd) : o.price;
      stock += o.usd;
      buys[key] = buys[key] || { usd: 0, ars: 0 }; buys[key].usd += o.usd; buys[key].ars += o.usd * o.price;
    } else {
      const g = avg > 0 ? o.usd * (o.price - avg) : 0;
      o._gain = g; o._avg = avg;
      gainByMonth[key] = (gainByMonth[key] || 0) + g;
      stock = Math.max(0, stock - o.usd);
      sells[key] = sells[key] || { usd: 0, ars: 0 }; sells[key].usd += o.usd; sells[key].ars += o.usd * o.price;
    }
  }
  return { gainByMonth, buys, sells, avg, stock, ops };
}

// ---------- Estado de pantalla ----------
const ui = {
  tab: 'inicio',
  month: mk(today()),
  totalCur: 'ARS',
  filter: 'Todos',
  draft: null,
  settings: false
};
function newDraft(type) {
  return { id: null, type: type || 'gasto', date: today(), amount: '', cur: 'ARS', cat: '', method: 'Débito', cuotas: 1, split: 1, people: [], person: '', sharedId: '', account: 'galicia', desc: '', op: 'compra', usd: '', price: '', usdAccount: 'galicia', arsAccount: 'galicia', from: 'galicia', to: 'dolarapp' };
}
ui.draft = newDraft();

// ---------- Pantallas ----------
function render() {
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('on', t.dataset.tab === ui.tab && !ui.settings));
  const app = $('#app');
  if (ui.settings) app.innerHTML = viewSettings();
  else app.innerHTML = ({ inicio: viewInicio, cargar: viewCargar, movimientos: viewMovs, estadisticas: viewStats })[ui.tab]();
  if (!ui.settings && ui.tab !== 'cargar') app.insertAdjacentHTML('beforeend', '<button class="fab" data-tab="cargar" aria-label="Cargar gasto o ingreso">+</button>');
}

function monthNav() {
  return `<div class="row"><button class="iconbtn" data-act="mprev" aria-label="Mes anterior">‹</button>
    <span style="font-weight:700;min-width:90px;text-align:center">${cap(mName(ui.month))} ${ui.month.slice(0, 4)}</span>
    <button class="iconbtn" data-act="mnext" aria-label="Mes siguiente">›</button></div>`;
}

function viewInicio() {
  const t = monthTotals(ui.month);
  const left = t.ing - t.gas;
  const usd = ui.totalCur === 'USD';
  const show = (n) => usd ? fmt(n / data.rate, 'USD') : fmt(n, 'ARS');
  const pct = t.ing > 0 ? Math.round(left / t.ing * 100) + '%' : '-';
  const b = balances();
  let total = 0;
  const rows = data.accounts.map((a) => {
    const lines = Object.entries(b[a.id] || {}).filter(([c, v]) => a.curs.includes(c) || Math.abs(v) > 0.001);
    lines.forEach(([c, v]) => { total += toARS(v, c); });
    return `<div class="item"><div class="avatar" style="background:${esc(a.color)}">${esc(initials(a.name))}</div>
      <div class="grow"><div class="t">${esc(a.name)}</div></div>
      <div class="r">${lines.map(([c, v]) => `<span class="${c === 'USD' ? 'pos' : ''}">${fmt(v, c)}</span>`).join('')}</div></div>`;
  }).join('');
  const nextKey = addM(mk(today()), 1);
  const due = creditDue(nextKey);
  const tip = suggestions()[0];
  const needBackup = data.movs.length > 5 && (!data.lastBackup || (Date.now() - data.lastBackup) > 30 * 864e5);
  return `
    <div class="between">
      <div><div class="muted small">${cap(mName(ui.month))} ${ui.month.slice(0, 4)}</div><h1>Hola, Flor</h1></div>
      <div class="row" style="gap:8px">${monthNavSmall()}<button class="iconbtn" data-act="settings" aria-label="Ajustes">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg></button></div>
    </div>
    ${needBackup ? `<button class="card orange" data-act="settings" style="text-align:left;font-size:14px"><b>Hace más de un mes que no guardás una copia.</b>Tocá acá para hacer una copia de seguridad.</button>` : ''}
    <div class="card dark">
      <div class="between"><span class="muted small">${left >= 0 ? 'Te queda este mes' : 'Gastaste de más este mes'}</span>
        <div class="seg"><button class="${!usd ? 'on' : ''}" data-act="tcur" data-v="ARS">$</button><button class="${usd ? 'on' : ''}" data-act="tcur" data-v="USD">US$</button></div></div>
      <div class="big">${show(left)}</div>
      <div class="grid3">
        <div><div class="label">Ingresos</div><div class="val pos">${show(t.ing)}</div></div>
        <div><div class="label">Gastos</div><div class="val neg">${show(t.gas)}</div></div>
        <div><div class="label">Ahorro</div><div class="val">${pct}</div></div>
      </div>
      <div class="label" style="border-top:1px solid #2E3238;padding-top:10px">Dólar ${esc(data.rateName)}: ${fmt(data.rate, 'ARS')}. Lo cambiás en Ajustes.</div>
    </div>
    ${due > 0 ? `<div class="card"><div class="row"><div class="avatar" style="background:#FDEBDD;color:#B4400C;border-radius:12px">TC</div>
      <div class="grow" style="display:flex;flex-direction:column;gap:2px"><b>Tarjeta de crédito: ${fmt(due, 'ARS')}</b>
      <span class="muted small">Se paga en ${mName(nextKey)}. Ya está contado en los gastos de ese mes.</span></div></div></div>` : ''}
    ${owedCard()}
    <div class="between"><h2>¿Dónde está mi plata?</h2><span class="muted small">Total ${usd ? fmt(total / data.rate, 'USD') : fmt(total, 'ARS')}</span></div>
    <div class="card list">${rows}</div>
    ${tip ? `<div class="card green" style="gap:4px"><div class="small" style="font-weight:700;color:var(--green)">SUGERENCIA</div>
      <div style="font-size:14px">${esc(tip.text)}</div>
      <button data-tab="estadisticas" style="background:none;border:none;padding:6px 0 0;text-align:left;font-weight:700;color:var(--green);font-size:13px">Ver todas las sugerencias</button></div>` : ''}
    ${data.movs.length === 0 ? `<div class="card green"><b>¡Bienvenida!</b><span style="font-size:14px">Primero cargá cuánta plata tenés hoy en cada cuenta en Ajustes (el engranaje de arriba). Después, cada gasto o ingreso lo sumás desde Cargar.</span></div>` : ''}
  `;
}
function owedCard() {
  const p = sharedPending();
  if (!p.length) return '';
  const total = p.reduce((s, x) => s + toARS(x.left, x.m.cur), 0);
  return `<div class="card"><div class="between"><h2>Te deben</h2><b class="pos">${fmt(total, 'ARS')}</b></div>
    ${p.map((x) => `<div style="display:flex;flex-direction:column;gap:8px;border-top:1px solid var(--line2);padding-top:10px">
      <div class="between" style="font-size:14px"><b>${esc(x.m.desc || x.m.cat)} <span class="muted small" style="font-weight:500">· ${shortDate(x.m.date)}</span></b><span class="muted small">faltan ${fmt(x.left, x.m.cur)}</span></div>
      ${x.persons.map((pp) => `<div class="between" style="font-size:14px"><span>${esc(pp.name)} · ${fmt(pp.share, x.m.cur)}</span>
        <button class="chip" style="min-height:36px;border-color:var(--green);color:var(--green)" data-act="paid" data-v="${esc(x.m.id)}|${pp.i}">Me pagó</button></div>`).join('')}
    </div>`).join('')}
    <span class="muted small">Tocá "Me pagó" cuando te transfieran: suma a la cuenta donde pagaste y no cuenta como ingreso.</span></div>`;
}
function monthNavSmall() {
  return `<button class="iconbtn" data-act="mprev" aria-label="Mes anterior">‹</button><button class="iconbtn" data-act="mnext" aria-label="Mes siguiente">›</button>`;
}

function chips(list, current, act, extra) {
  return `<div class="chips">${list.map((v) => `<button class="chip ${String(v) === String(current) ? 'on' : ''}" data-act="${act}" data-v="${esc(v)}">${esc(v)}</button>`).join('')}${extra || ''}</div>`;
}
function accChips(current, act, cur) {
  const list = data.accounts.filter((a) => !cur || a.curs.includes(cur));
  return `<div class="chips">${list.map((a) => `<button class="chip ${a.id === current ? 'on' : ''}" data-act="${act}" data-v="${esc(a.id)}">${esc(a.name)}</button>`).join('')}</div>`;
}

function viewCargar() {
  const d = ui.draft;
  const tipos = [['gasto', 'Gasto'], ['ingreso', 'Ingreso'], ['dolar', 'Dólares'], ['mover', 'Entre cuentas']];
  let body = '';
  const pending = d.type === 'ingreso' ? sharedPending().filter((x) => x.m.id !== d.sharedId) : [];
  if (d.type === 'ingreso' && d.sharedId) {
    const g = data.movs.find((m) => m.id === d.sharedId);
    if (g) pending.unshift({ m: g, left: 0 });
  }
  if (d.type === 'ingreso' && pending.length) {
    body += `<div class="card green" style="gap:8px"><b style="font-size:14px">¿Es plata que te devuelven de un gasto compartido?</b>
      <div class="chips"><button class="chip ${!d.sharedId ? 'on' : ''}" data-act="shared" data-v="">No</button>
      ${pending.map((x) => `<button class="chip ${d.sharedId === x.m.id ? 'on' : ''}" data-act="shared" data-v="${esc(x.m.id)}">${esc(x.m.desc || x.m.cat)}${x.left ? ' · faltan ' + fmt(x.left, x.m.cur) : ''}</button>`).join('')}</div>
      ${d.sharedId ? sharedPersonChips(d) + '<span class="small">No cuenta como ingreso: solo baja lo que te deben y suma a tu cuenta.</span>' : ''}</div>`;
  }
  if (d.type === 'gasto' || d.type === 'ingreso') {
    const amt = parseAmount(d.amount);
    const equiv = amt > 0 ? (d.cur === 'USD' ? 'Equivale a ' + fmt(amt * data.rate, 'ARS') : 'Equivale a ' + fmt(amt / data.rate, 'USD')) + ' con dólar ' + data.rateName : '';
    const cats = data.cats[d.type];
    body += `
      <div class="field"><div class="between"><label class="lbl" for="f-amount">Monto</label>
        <div class="seg"><button class="${d.cur === 'ARS' ? 'on' : ''}" data-act="cur" data-v="ARS">Pesos</button><button class="${d.cur === 'USD' ? 'on' : ''}" data-act="cur" data-v="USD">Dólares</button></div></div>
        <input id="f-amount" class="amount" inputmode="decimal" placeholder="${d.cur === 'USD' ? 'US$ 0' : '$ 0'}" value="${esc(d.amount)}" data-bind="amount">
        <div class="muted small" id="equiv">${equiv}</div></div>
      ${d.sharedId ? '' : `<div class="field"><span class="lbl">Categoría</span>${chips(cats, d.cat, 'cat', '<button class="chip" data-act="newcat">+ Nueva</button>')}</div>`}`;
    if (d.type === 'gasto') {
      body += `<div class="field"><span class="lbl">¿Con qué pagaste?</span><div class="grid2">${METODOS.map((m) => `<button class="chip ${d.method === m ? 'on' : ''}" data-act="method" data-v="${m}">${m}</button>`).join('')}</div>
        ${d.method === 'Crédito' ? cuotasBox(d) : ''}</div>
        <div class="field"><span class="lbl">¿Lo dividiste con otras personas? (cuántos son en total, con vos)</span>
        ${chips(['No', 2, 3, 4, 5, 6, 8, 10], d.split > 1 ? d.split : 'No', 'split')}
        ${d.split > 1 ? `<div class="card green" style="gap:8px;font-size:13px"><b id="split-line" style="font-size:15px">${esc(splitLine(d))}</b>
          <span>¿Quiénes te tienen que pagar? (opcional)</span>
          ${(d.people || []).map((n, i) => `<input class="input" placeholder="Persona ${i + 1}" value="${esc(n)}" data-person="${i}" aria-label="Nombre de la persona ${i + 1}">`).join('')}
          <span>En tus estadísticas cuenta solo tu parte. Cuando te paguen, tocá "Me pagó" en Inicio.</span></div>` : ''}</div>`;
    }
    body += `<div class="field"><span class="lbl">${d.type === 'gasto' ? (d.method === 'Crédito' ? '¿Qué tarjeta? (cuenta desde la que se paga)' : '¿De qué cuenta?') : '¿A qué cuenta entró?'}</span>${accChips(d.account, 'account')}</div>`;
  } else if (d.type === 'dolar') {
    const usd = parseAmount(d.usd), price = parseAmount(d.price);
    const compra = d.op === 'compra';
    let info = 'Poné la cantidad y el precio para ver el total.';
    if (usd > 0 && price > 0) {
      info = (compra ? 'Pagaste ' : 'Recibiste ') + fmt(usd * price, 'ARS') + ' por ' + fmt(usd, 'USD') + '.';
      if (!compra) { const ds = dollarStats(); if (ds.avg > 0) { const g = usd * (price - ds.avg); info += ' ' + (g >= 0 ? 'Ganancia' : 'Pérdida') + ': ' + fmt(Math.abs(g), 'ARS') + ' contra tu compra promedio de ' + fmt(ds.avg, 'ARS') + '.'; } }
    }
    body += `
      <div class="field"><span class="lbl">¿Qué hiciste?</span><div class="grid2">
        <button class="chip ${compra ? 'on' : ''}" data-act="op" data-v="compra">Compré USD</button><button class="chip ${!compra ? 'on' : ''}" data-act="op" data-v="venta">Vendí USD</button></div></div>
      <div class="grid2" style="gap:12px">
        <label class="field"><span class="lbl">Cantidad (US$)</span><input class="amount" style="font-size:24px" inputmode="decimal" placeholder="US$ 0" value="${esc(d.usd)}" data-bind="usd"></label>
        <label class="field"><span class="lbl">Precio de ${compra ? 'compra' : 'venta'}</span><input class="amount" style="font-size:24px" inputmode="decimal" placeholder="$ 0" value="${esc(d.price)}" data-bind="price"></label>
      </div>
      <div class="card" style="gap:4px"><b id="dolar-info" style="font-size:14px">${esc(info)}</b></div>
      <div class="field"><span class="lbl">${compra ? '¿En qué cuenta quedaron los dólares?' : '¿De qué cuenta salieron los dólares?'}</span>${accChips(d.usdAccount, 'usdAccount', 'USD')}</div>
      <div class="field"><span class="lbl">${compra ? '¿De qué cuenta salieron los pesos?' : '¿A qué cuenta entraron los pesos?'}</span>${accChips(d.arsAccount, 'arsAccount', 'ARS')}</div>`;
  } else {
    body += `
      <div class="field"><div class="between"><label class="lbl" for="f-amount">Monto</label>
        <div class="seg"><button class="${d.cur === 'ARS' ? 'on' : ''}" data-act="cur" data-v="ARS">Pesos</button><button class="${d.cur === 'USD' ? 'on' : ''}" data-act="cur" data-v="USD">Dólares</button></div></div>
        <input id="f-amount" class="amount" inputmode="decimal" placeholder="${d.cur === 'USD' ? 'US$ 0' : '$ 0'}" value="${esc(d.amount)}" data-bind="amount"></div>
      <div class="field"><span class="lbl">Desde</span>${accChips(d.from, 'from')}</div>
      <div class="field"><span class="lbl">Hacia</span>${accChips(d.to, 'to')}</div>
      <div class="muted small">Mover plata entre tus cuentas no cuenta como gasto.</div>`;
  }
  return `
    <div class="between"><h1>${d.id ? 'Editar movimiento' : 'Cargar movimiento'}</h1>${d.id ? '<button class="iconbtn" data-act="cancel">Cancelar</button>' : ''}</div>
    ${!d.id && (d.type === 'gasto' || d.type === 'ingreso') ? `<label class="scan"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>
      <span style="display:flex;flex-direction:column"><b id="scan-title">Leer comprobante (opcional)</b><span class="small">Elegí una captura y se completan monto y fecha. Gratis y sin internet.</span></span>
      <input type="file" accept="image/*" id="scan-file" style="display:none"></label>` : ''}
    <div class="seg" style="flex-wrap:wrap">${tipos.map(([v, l]) => `<button class="${d.type === v ? 'on' : ''}" data-act="type" data-v="${v}">${l}</button>`).join('')}</div>
    ${body}
    <label class="field"><span class="lbl">Fecha</span><input type="date" class="input" value="${esc(d.date)}" data-bind="date"></label>
    <label class="field"><span class="lbl">Descripción (opcional)</span><textarea class="input" rows="2" placeholder="Ej: regalo de cumpleaños para mamá" data-bind="desc">${esc(d.desc)}</textarea></label>
    <button class="btn" data-act="save">Guardar</button>
    ${d.id ? '<button class="btn danger" data-act="delete">Borrar movimiento</button>' : ''}
  `;
}
function sharedPersonChips(d) {
  const g = data.movs.find((m) => m.id === d.sharedId);
  if (!g) return '';
  const x = sharedPending().find((y) => y.m.id === g.id);
  const list = (x ? x.persons : []).map((p) => p.i);
  if (d.person != null && d.person !== '' && !list.includes(Number(d.person))) list.unshift(Number(d.person));
  if (!list.length) return '';
  return `<b style="font-size:14px">¿Quién te pagó?</b><div class="chips">${list.map((i) => `<button class="chip ${Number(d.person) === i && d.person !== '' ? 'on' : ''}" data-act="person" data-v="${i}">${esc(personName(g, i))}</button>`).join('')}</div>`;
}
function splitLine(d) {
  const amt = parseAmount(d.amount);
  if (!(amt > 0)) return 'Poné el monto total que pagaste';
  return 'Tu parte: ' + fmt(amt / d.split, d.cur) + '. Te deben ' + fmt(amt - amt / d.split, d.cur) + ' (' + fmt(amt / d.split, d.cur) + ' cada uno).';
}
function cuotasBox(d) {
  const amt = parseAmount(d.amount);
  const n = d.cuotas || 1;
  const first = addM(mk(d.date || today()), 1), last = addM(first, n - 1);
  const line = amt > 0 ? (n === 1 ? 'Un pago de ' + fmt(amt, d.cur) : n + ' cuotas de ' + fmt(amt / n, d.cur)) : 'Poné el monto total de la compra';
  const months = n === 1 ? 'Se paga en el resumen de ' + mName(first) + '. No baja tu plata de este mes.' : 'De ' + mName(first) + ' a ' + mName(last) + '. Cada mes se descuenta solo la cuota que toca.';
  return `<div class="card orange" style="gap:10px;font-size:13px"><b>¿En cuántas cuotas?</b>${chips(CUOTAS, n, 'cuotas')}
    <b style="font-size:15px" id="cuota-line">${esc(line)}</b><span>${esc(months)}</span></div>`;
}

function movLabel(m) {
  if (m.type === 'dolar') {
    const g = m._gain;
    return {
      t: m.op === 'compra' ? 'Compra de dólares' : 'Venta de dólares',
      d: (m.op === 'compra' ? acc(m.arsAccount).name + ' → ' + acc(m.usdAccount).name + ' · compraste a ' : acc(m.usdAccount).name + ' · vendiste a ') + fmt(m.price, 'ARS') +
        (m.op === 'venta' && g ? ' · ' + (g >= 0 ? 'ganaste ' : 'perdiste ') + fmt(Math.abs(g), 'ARS') : ''),
      amt: (m.op === 'compra' ? '+ ' : '- ') + fmt(m.usd, 'USD'),
      cls: m.op === 'compra' ? 'pos' : ''
    };
  }
  if (m.type === 'reintegro') {
    const g = data.movs.find((x) => x.id === m.sharedId);
    const who = g && m.person != null ? personName(g, m.person) + ' te pagó' : 'Te devolvieron';
    return { t: who + ': ' + (g ? (g.desc || g.cat) : 'gasto compartido'), d: acc(m.account).name + ' · no cuenta como ingreso', amt: '+ ' + fmt(m.amount, m.cur), cls: 'pos' };
  }
  if (m.type === 'mover') return { t: 'Entre cuentas', d: acc(m.from).name + ' → ' + acc(m.to).name, amt: fmt(m.amount, m.cur), cls: '' };
  const isG = m.type === 'gasto';
  let d = esc(m.cat || (isG ? 'Gasto' : 'Ingreso'));
  if (isG) {
    d += ' · ' + (m.method === 'Crédito' ? 'Crédito ' : m.method === 'Débito' ? 'Débito ' : '') + esc(acc(m.account).name);
    if (m.method === 'Crédito') d += (m.cuotas > 1 ? ' · ' + m.cuotas + ' cuotas desde ' : ' · se paga en ') + mShort(addM(mk(m.date), 1)).toLowerCase();
    if (m.split > 1) d += ' · dividido entre ' + m.split + ', tu parte ' + fmt(m.amount / m.split, m.cur);
  } else d += ' · ' + esc(acc(m.account).name);
  if (m.cur === 'USD') d += ' · ≈ ' + fmt(m.amount * data.rate, 'ARS');
  return { t: esc(m.desc || m.cat || (isG ? 'Gasto' : 'Ingreso')), d, amt: (isG ? '- ' : '+ ') + fmt(m.amount, m.cur), cls: isG ? 'neg' : 'pos', raw: true };
}

function viewMovs() {
  dollarStats(); // calcula la ganancia de cada venta
  const filtros = ['Todos', 'Gastos', 'Ingresos', 'Crédito', 'Dólares'];
  const list = data.movs.filter((m) => mk(m.date) === ui.month).filter((m) => {
    switch (ui.filter) {
      case 'Gastos': return m.type === 'gasto';
      case 'Ingresos': return m.type === 'ingreso';
      case 'Crédito': return m.type === 'gasto' && m.method === 'Crédito';
      case 'Dólares': return m.type === 'dolar';
      default: return true;
    }
  }).sort((a, b) => b.date.localeCompare(a.date));
  const items = list.map((m) => {
    const l = movLabel(m);
    const t = l.raw ? l.t : esc(l.t), dd = l.raw ? l.d : esc(l.d);
    const extra = m.desc && m.type !== 'gasto' && m.type !== 'ingreso' ? ' · “' + esc(m.desc) + '”' : '';
    return `<button class="item" data-act="edit" data-v="${esc(m.id)}"><div class="grow"><div class="t">${t}</div><div class="d">${dd}${extra}</div></div>
      <div class="r"><span class="${l.cls}">${esc(l.amt)}</span><span class="muted small" style="font-weight:500">${shortDate(m.date)}</span></div></button>`;
  }).join('');
  return `
    <div class="between"><h1>Movimientos</h1>${monthNav()}</div>
    ${chips(filtros, ui.filter, 'filter')}
    ${list.length ? `<div class="card list">${items}</div><div class="muted small" style="text-align:center">Tocá un movimiento para editarlo o borrarlo.</div>` : '<div class="empty">No hay movimientos en este mes.</div>'}
  `;
}

function suggestions() {
  const out = [];
  const cur = mk(today());
  const now = monthTotals(cur);
  const prev = [1, 2, 3].map((i) => monthTotals(addM(cur, -i)));
  const hasHistory = prev.some((p) => p.gas > 0);
  for (const [cat, val] of Object.entries(now.byCat).sort((a, b) => b[1] - a[1])) {
    const avg = prev.reduce((s, p) => s + (p.byCat[cat] || 0), 0) / 3;
    const alt = ALTERNATIVAS[cat] || 'Ponete un tope mensual para esta categoría y revisalo a mitad de mes.';
    if (hasHistory && avg > 0 && val > avg * 1.2 && val - avg > 5000) {
      out.push({ title: cat, save: '~ ' + fmt(val - avg, 'ARS') + '/mes', text: 'Este mes llevás ' + fmt(val, 'ARS') + ' en ' + cat + ', ' + Math.round((val / avg - 1) * 100) + '% más que tu promedio. ' + alt });
    } else if (now.gas > 0 && val / now.gas > 0.3 && ALTERNATIVAS[cat]) {
      out.push({ title: cat, save: '~ ' + fmt(val * 0.15, 'ARS') + '/mes', text: cat + ' es el ' + Math.round(val / now.gas * 100) + '% de tus gastos. Bajándolo un 15% ahorrarías unos ' + fmt(val * 0.15, 'ARS') + '. ' + alt });
    } else if (['Delivery', 'Pinky', 'Salidas'].includes(cat) && val > 20000) {
      out.push({ title: cat, save: '~ ' + fmt(val * 0.3, 'ARS') + '/mes', text: 'Llevás ' + fmt(val, 'ARS') + ' en ' + cat + ' este mes. ' + alt });
    }
  }
  const due = creditDue(addM(cur, 1));
  if (now.ing > 0 && due > now.ing * 0.3) out.push({ title: 'Tarjeta', save: '', text: 'El mes que viene pagás ' + fmt(due, 'ARS') + ' de tarjeta, más del 30% de tus ingresos. Conviene frenar compras en cuotas por un tiempo.' });
  const b = balances();
  for (const a of data.accounts) {
    const ars = (b[a.id] || {}).ARS || 0;
    if (a.id !== 'cocos' && a.id !== 'efectivo' && ars > 300000) out.push({ title: 'Plata quieta en ' + a.name, save: 'Rinde más', text: 'Tenés ' + fmt(ars, 'ARS') + ' en ' + a.name + '. Podrías poner una parte a rendir en un FCI o plazo fijo, por ejemplo en Cocos.' });
  }
  return out;
}

function viewStats() {
  const cur = ui.month;
  const months = [-5, -4, -3, -2, -1, 0].map((i) => addM(cur, i));
  const sav = months.map((k) => { const t = monthTotals(k); return { k, pct: t.ing > 0 ? Math.round((t.ing - t.gas) / t.ing * 100) : 0, has: t.ing > 0 }; });
  const withData = sav.filter((s) => s.has);
  const avgPct = withData.length ? Math.round(withData.reduce((s, x) => s + x.pct, 0) / withData.length) : null;
  const maxPct = Math.max(10, ...sav.map((s) => Math.abs(s.pct)));
  const t = monthTotals(cur);
  const cats = Object.entries(t.byCat).sort((a, b) => b[1] - a[1]);
  const maxCat = cats.length ? cats[0][1] : 1;

  const ds = dollarStats();
  const gains = months.map((k) => ({ k, g: ds.gainByMonth[k] || 0 }));
  const g6 = gains.reduce((s, x) => s + x.g, 0);
  const maxG = Math.max(1, ...gains.map((x) => Math.abs(x.g)));
  const sum = (obj) => months.reduce((acc2, k) => { const v = obj[k]; if (v) { acc2.usd += v.usd; acc2.ars += v.ars; } return acc2; }, { usd: 0, ars: 0 });
  const B = sum(ds.buys), S = sum(ds.sells);
  const avgB = B.usd ? B.ars / B.usd : 0, avgS = S.usd ? S.ars / S.usd : 0;
  const tips = suggestions();

  return `
    <div class="between"><h1>Estadísticas</h1>${monthNav()}</div>
    <div class="card">
      <div class="between"><h2>Ahorro por mes</h2><span class="muted small">${avgPct === null ? 'Sin datos todavía' : 'Promedio ' + avgPct + '%'}</span></div>
      <div class="bars" style="grid-template-columns:repeat(6,minmax(0,1fr))">${sav.map((s) => `<div class="bar ${s.k === cur ? 'cur' : ''}"><b>${s.has ? s.pct + '%' : ''}</b><i style="height:${s.has ? Math.max(2, Math.round(Math.max(0, s.pct) / maxPct * 80)) : 2}px"></i><span>${mShort(s.k)}</span></div>`).join('')}</div>
    </div>
    <div class="card dark">
      <div><h2>Ganancia con dólares</h2><div class="muted small">Lo que ganaste vendiendo más caro de lo que compraste</div></div>
      <div class="grid2" style="gap:10px">
        <div><div class="label">${cap(mName(cur))}</div><div style="font-size:24px;font-weight:800" class="${(ds.gainByMonth[cur] || 0) >= 0 ? 'pos' : 'neg'}">${(ds.gainByMonth[cur] || 0) >= 0 ? '+ ' : ''}${fmt(ds.gainByMonth[cur] || 0, 'ARS')}</div></div>
        <div><div class="label">Últimos 6 meses</div><div style="font-size:24px;font-weight:800" class="${g6 >= 0 ? 'pos' : 'neg'}">${g6 >= 0 ? '+ ' : ''}${fmt(g6, 'ARS')}</div></div>
      </div>
      <div class="grid3" style="border-top:1px solid #2E3238;padding-top:10px">
        <div><div class="label">Compra prom.</div><div class="val">${avgB ? fmt(avgB, 'ARS') : '-'}</div></div>
        <div><div class="label">Venta prom.</div><div class="val">${avgS ? fmt(avgS, 'ARS') : '-'}</div></div>
        <div><div class="label">Por dólar</div><div class="val pos">${avgB && avgS ? (avgS - avgB >= 0 ? '+ ' : '') + fmt(avgS - avgB, 'ARS') : '-'}</div></div>
      </div>
      <div class="bars" style="grid-template-columns:repeat(6,minmax(0,1fr));height:96px">${gains.map((x) => `<div class="bar ${x.k === cur ? 'cur' : ''}"><b>${x.g ? Math.round(x.g / 1000) + 'k' : ''}</b><i style="height:${Math.max(2, Math.round(Math.abs(x.g) / maxG * 52))}px"></i><span>${mShort(x.k)}</span></div>`).join('')}</div>
      ${ds.stock > 0 ? `<div class="label">Te quedan ${fmt(ds.stock, 'USD')} comprados a ${fmt(ds.avg, 'ARS')} promedio.</div>` : ''}
    </div>
    <div class="card">
      <h2>¿En qué se va la plata? (${mName(cur)})</h2>
      ${cats.length ? cats.map(([c, v]) => `<div style="display:flex;flex-direction:column;gap:4px"><div class="between" style="font-size:13px"><span style="font-weight:600">${esc(c)}</span><b>${fmt(v, 'ARS')}</b></div><div class="hbar"><i style="width:${Math.round(v / maxCat * 100)}%"></i></div></div>`).join('') : '<div class="muted small">Todavía no cargaste gastos este mes.</div>'}
    </div>
    <h2>Dónde podés recortar</h2>
    ${tips.length ? tips.map((x) => `<div class="card green" style="gap:6px"><div class="between"><b>${esc(x.title)}</b><b class="pos small">${esc(x.save)}</b></div><div style="font-size:13px">${esc(x.text)}</div></div>`).join('') : '<div class="card green"><span style="font-size:14px">Todavía no hay suficientes datos. Cuantos más gastos cargues, mejores sugerencias vas a ver.</span></div>'}
  `;
}

function viewSettings() {
  const rows = data.accounts.map((a) => `<div class="card" style="gap:8px"><div class="between"><b>${esc(a.name)}</b><button class="iconbtn" data-act="delacc" data-v="${esc(a.id)}" aria-label="Quitar ${esc(a.name)}">Quitar</button></div>
    <div class="grid2">${a.curs.map((c) => `<label class="field"><span class="lbl">Saldo inicial ${c === 'USD' ? 'US$' : '$'}</span><input class="input" inputmode="decimal" value="${(a.start || {})[c] || ''}" placeholder="0" data-start="${esc(a.id)}" data-cur="${c}"></label>`).join('')}</div></div>`).join('');
  return `
    <div class="between"><h1>Ajustes</h1><button class="iconbtn" data-act="closesettings">Listo</button></div>
    <div class="card">
      <h2>Al abrir la app, ir a</h2>
      <div class="seg"><button class="${data.openOnCargar !== false ? 'on' : ''}" data-act="openon" data-v="cargar">Cargar</button><button class="${data.openOnCargar === false ? 'on' : ''}" data-act="openon" data-v="inicio">Inicio</button></div>
      <span class="muted small">Con "Cargar", tocás el icono y ya podés anotar el gasto o ingreso.</span>
    </div>
    <div class="card">
      <h2>Cotización del dólar</h2>
      <div class="seg">${['Oficial', 'MEP', 'Blue'].map((n) => `<button class="${data.rateName === n ? 'on' : ''}" data-act="ratename" data-v="${n}">${n}</button>`).join('')}</div>
      <label class="field"><span class="lbl">Precio del dólar (lo usa la app para pasar de una moneda a otra)</span><input class="input" inputmode="decimal" value="${data.rate}" data-rate="1"></label>
      <button class="btn light" data-act="fetchrate">Actualizar desde internet</button>
      <span class="muted small">${data.rateUpdated ? 'Última actualización: ' + new Date(data.rateUpdated).toLocaleString('es-AR') : 'Sin internet podés escribirlo a mano.'}</span>
    </div>
    <h2>Cuentas y saldos iniciales</h2>
    <span class="muted small" style="margin-top:-8px">Poné cuánto tenías en cada cuenta cuando empezaste a usar la app.</span>
    ${rows}
    <div class="card"><h2>Agregar cuenta</h2>
      <input class="input" id="newacc" placeholder="Nombre, por ejemplo Brubank">
      <div class="seg"><button data-act="addacc" data-v="ARS">Solo pesos</button><button data-act="addacc" data-v="USD">Solo dólares</button><button data-act="addacc" data-v="BOTH">Ambas</button></div>
    </div>
    <div class="card"><h2>Copia de seguridad</h2>
      <span class="muted small">Tus datos viven solo en este iPhone. Guardá una copia en Archivos o iCloud de vez en cuando.</span>
      <button class="btn" data-act="export">Guardar copia</button>
      <label class="btn light" style="display:flex;align-items:center;justify-content:center">Restaurar una copia<input type="file" accept=".json,application/json" id="import-file" style="display:none"></label>
      <button class="btn danger" data-act="wipe">Borrar todos los datos</button>
    </div>
  `;
}

// ---------- Acciones ----------
document.addEventListener('click', (e) => {
  const tabBtn = e.target.closest('[data-tab]');
  if (tabBtn) { ui.tab = tabBtn.dataset.tab; ui.settings = false; render(); window.scrollTo(0, 0); return; }
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act, v = el.dataset.v;
  const d = ui.draft;
  switch (act) {
    case 'mprev': ui.month = addM(ui.month, -1); break;
    case 'mnext': ui.month = addM(ui.month, 1); break;
    case 'tcur': ui.totalCur = v; break;
    case 'settings': ui.settings = true; window.scrollTo(0, 0); break;
    case 'closesettings': ui.settings = false; break;
    case 'filter': ui.filter = v; break;
    case 'split': {
      d.split = v === 'No' ? 1 : Number(v);
      const prev = d.people || [];
      d.people = Array.from({ length: Math.max(0, d.split - 1) }, (_, i) => prev[i] || '');
      break;
    }
    case 'person': d.person = Number(v); break;
    case 'paid': {
      const [gid, pi] = v.split('|');
      const g = data.movs.find((m) => m.id === gid);
      if (!g) return;
      data.movs.push({ id: uid(), type: 'reintegro', sharedId: gid, person: Number(pi), date: today(), amount: g.amount / g.split, cur: g.cur, account: g.account, desc: '' });
      save();
      toast('Anotado: ' + personName(g, Number(pi)) + ' te pagó ' + fmt(g.amount / g.split, g.cur));
      break;
    }
    case 'shared': {
      d.sharedId = v; d.person = '';
      const g = data.movs.find((m) => m.id === v);
      if (g) { d.cur = g.cur; d.amount = String(Math.round(g.amount / g.split * 100) / 100).replace('.', ','); fixAccounts(); }
      break;
    }
    case 'type': d.type = v; d.cat = ''; d.sharedId = ''; if (v === 'dolar') { d.usdAccount = 'galicia'; d.arsAccount = 'galicia'; } break;
    case 'cur': d.cur = v; fixAccounts(); break;
    case 'cat': d.cat = v; break;
    case 'method': d.method = v; if (v !== 'Crédito') d.cuotas = 1; break;
    case 'cuotas': d.cuotas = Number(v); break;
    case 'account': d.account = v; break;
    case 'from': d.from = v; break;
    case 'to': d.to = v; break;
    case 'usdAccount': d.usdAccount = v; break;
    case 'arsAccount': d.arsAccount = v; break;
    case 'op': d.op = v; d.usdAccount = v === 'compra' ? 'galicia' : 'dolarapp'; d.arsAccount = 'galicia'; break;
    case 'newcat': {
      const name = (prompt('Nombre de la nueva categoría') || '').trim();
      if (name && !data.cats[d.type].includes(name)) { data.cats[d.type].splice(data.cats[d.type].length - 1, 0, name); save(); }
      if (name) d.cat = name;
      break;
    }
    case 'save': saveDraft(); return;
    case 'cancel': ui.draft = newDraft(); ui.tab = 'movimientos'; break;
    case 'delete':
      if (confirm('¿Borrar este movimiento?')) { data.movs = data.movs.filter((m) => m.id !== d.id); save(); ui.draft = newDraft(); ui.tab = 'movimientos'; toast('Movimiento borrado'); }
      break;
    case 'edit': {
      const m = data.movs.find((x) => x.id === v);
      if (!m) return;
      ui.draft = Object.assign(newDraft(m.type), m, m.type === 'reintegro' ? { type: 'ingreso' } : {}, {
        amount: m.amount != null ? String(m.amount).replace('.', ',') : '',
        usd: m.usd != null ? String(m.usd).replace('.', ',') : '',
        price: m.price != null ? String(m.price).replace('.', ',') : ''
      });
      delete ui.draft._gain; delete ui.draft._avg;
      ui.draft.people = (m.people || []).slice();
      while (ui.draft.people.length < (m.split || 1) - 1) ui.draft.people.push('');
      if (m.person == null) ui.draft.person = '';
      ui.tab = 'cargar'; window.scrollTo(0, 0);
      break;
    }
    case 'ratename': data.rateName = v; save(); break;
    case 'openon': data.openOnCargar = v === 'cargar'; save(); break;
    case 'fetchrate': fetchRate(); return;
    case 'addacc': {
      const inp = $('#newacc'); const name = (inp.value || '').trim();
      if (!name) { toast('Escribí el nombre de la cuenta'); return; }
      const curs = v === 'BOTH' ? ['ARS', 'USD'] : [v];
      data.accounts.push({ id: uid(), name, color: COLORES[data.accounts.length % COLORES.length], curs, start: {} });
      save(); toast('Cuenta agregada'); break;
    }
    case 'delacc': {
      const used = data.movs.some((m) => [m.account, m.from, m.to, m.usdAccount, m.arsAccount].includes(v));
      if (used) { toast('Esta cuenta tiene movimientos, no se puede quitar'); return; }
      if (confirm('¿Quitar esta cuenta?')) { data.accounts = data.accounts.filter((a) => a.id !== v); save(); }
      break;
    }
    case 'export': exportData(); return;
    case 'wipe':
      if (confirm('¿Seguro? Se borran todos tus movimientos y saldos de este iPhone.') && confirm('Última confirmación: ¿borrar todo?')) { data = defaultData(); save(); ui.settings = false; toast('Datos borrados'); }
      break;
    default: return;
  }
  render();
});

// Todas las cuentas se pueden elegir en cualquier moneda; si una cuenta todavía no tenía esa moneda, se le agrega al guardar.
function fixAccounts() {}
function ensureCur(id, cur) {
  const a = data.accounts.find((x) => x.id === id);
  if (a && cur && !a.curs.includes(cur)) { a.curs.push(cur); a.start = a.start || {}; }
}

document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.dataset.bind) {
    ui.draft[el.dataset.bind] = el.value;
    // Actualiza los textos de ayuda sin redibujar (para no perder el teclado).
    const d = ui.draft;
    if (el.dataset.bind === 'amount') {
      const amt = parseAmount(d.amount);
      const eq = $('#equiv');
      if (eq) eq.textContent = amt > 0 ? (d.cur === 'USD' ? 'Equivale a ' + fmt(amt * data.rate, 'ARS') : 'Equivale a ' + fmt(amt / data.rate, 'USD')) + ' con dólar ' + data.rateName : '';
      const sl = $('#split-line');
      if (sl) sl.textContent = splitLine(d);
      const cl = $('#cuota-line');
      if (cl) { const n = d.cuotas || 1; cl.textContent = amt > 0 ? (n === 1 ? 'Un pago de ' + fmt(amt, d.cur) : n + ' cuotas de ' + fmt(amt / n, d.cur)) : 'Poné el monto total de la compra'; }
    }
    if (el.dataset.bind === 'usd' || el.dataset.bind === 'price') {
      const info = $('#dolar-info');
      const usd = parseAmount(d.usd), price = parseAmount(d.price);
      if (info && usd > 0 && price > 0) {
        let t = (d.op === 'compra' ? 'Pagaste ' : 'Recibiste ') + fmt(usd * price, 'ARS') + ' por ' + fmt(usd, 'USD') + '.';
        if (d.op === 'venta') { const ds = dollarStats(); if (ds.avg > 0) { const g = usd * (price - ds.avg); t += ' ' + (g >= 0 ? 'Ganancia' : 'Pérdida') + ': ' + fmt(Math.abs(g), 'ARS') + ' contra tu compra promedio de ' + fmt(ds.avg, 'ARS') + '.'; } }
        info.textContent = t;
      }
    }
    return;
  }
  if (el.dataset.person != null) { ui.draft.people[Number(el.dataset.person)] = el.value; return; }
  if (el.dataset.start) {
    const a = data.accounts.find((x) => x.id === el.dataset.start);
    if (a) { a.start = a.start || {}; a.start[el.dataset.cur] = parseAmount(el.value); save(); }
    return;
  }
  if (el.dataset.rate) { const r = parseAmount(el.value); if (r > 0) { data.rate = r; save(); } }
});

document.addEventListener('change', (e) => {
  if (e.target.id === 'scan-file' && e.target.files[0]) scanReceipt(e.target.files[0]);
  if (e.target.id === 'import-file' && e.target.files[0]) importData(e.target.files[0]);
  if (e.target.dataset.bind === 'date') render();
});

function saveDraft() {
  const d = ui.draft;
  let m;
  if (d.type === 'gasto' || d.type === 'ingreso') {
    const amount = parseAmount(d.amount);
    if (!(amount > 0)) return toast('Poné el monto');
    if (d.type === 'ingreso' && d.sharedId) {
      m = { type: 'reintegro', sharedId: d.sharedId, date: d.date, amount, cur: d.cur, account: d.account, desc: d.desc.trim() };
      if (d.person !== '' && d.person != null) m.person = Number(d.person);
    } else {
      if (!d.cat) return toast('Elegí una categoría');
      m = { type: d.type, date: d.date, amount, cur: d.cur, cat: d.cat, account: d.account, desc: d.desc.trim() };
      if (d.type === 'gasto') { m.method = d.method; m.cuotas = d.method === 'Crédito' ? d.cuotas : 1; if (d.split > 1) { m.split = d.split; m.people = (d.people || []).map((s) => s.trim()); } }
    }
  } else if (d.type === 'dolar') {
    const usd = parseAmount(d.usd), price = parseAmount(d.price);
    if (!(usd > 0)) return toast('Poné cuántos dólares');
    if (!(price > 0)) return toast('Poné el precio del dólar');
    m = { type: 'dolar', op: d.op, date: d.date, usd, price, usdAccount: d.usdAccount, arsAccount: d.arsAccount, desc: d.desc.trim() };
  } else {
    const amount = parseAmount(d.amount);
    if (!(amount > 0)) return toast('Poné el monto');
    if (d.from === d.to) return toast('Elegí dos cuentas distintas');
    m = { type: 'mover', date: d.date, amount, cur: d.cur, from: d.from, to: d.to, desc: d.desc.trim() };
  }
  if (!d.date) return toast('Poné la fecha');
  if (m.account) ensureCur(m.account, m.cur);
  if (m.type === 'mover') { ensureCur(m.from, m.cur); ensureCur(m.to, m.cur); }
  if (d.id) { m.id = d.id; data.movs = data.movs.map((x) => (x.id === d.id ? m : x)); }
  else { m.id = uid(); data.movs.push(m); }
  save();
  const wasEdit = !!d.id;
  ui.draft = newDraft(d.type);
  ui.draft.cur = d.cur; ui.draft.account = d.account; ui.draft.method = d.method;
  if (wasEdit) ui.tab = 'movimientos';
  ui.month = mk(m.date);
  render();
  window.scrollTo(0, 0);
  toast(wasEdit ? 'Cambios guardados' : 'Guardado ✓');
}

async function fetchRate() {
  const map = { Oficial: 'oficial', MEP: 'bolsa', Blue: 'blue' };
  try {
    const r = await fetch('https://dolarapi.com/v1/dolares/' + map[data.rateName], { cache: 'no-store' });
    const j = await r.json();
    const v = Number(j.venta);
    if (!(v > 0)) throw new Error('sin dato');
    data.rate = v; data.rateUpdated = Date.now(); save(); render();
    toast('Dólar ' + data.rateName + ': ' + fmt(v, 'ARS'));
  } catch (e) { toast('No se pudo actualizar. Escribilo a mano.'); }
}

async function exportData() {
  const json = JSON.stringify(data, null, 1);
  const name = 'mis-finanzas-' + today() + '.json';
  try {
    const file = new File([json], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Copia de Mis Finanzas' });
      data.lastBackup = Date.now(); save(); toast('Copia guardada'); return;
    }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
  data.lastBackup = Date.now(); save(); toast('Copia descargada');
}
function importData(file) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const j = JSON.parse(r.result);
      if (!j || !Array.isArray(j.movs) || !Array.isArray(j.accounts)) throw new Error('formato');
      if (!confirm('Esto reemplaza los datos actuales por los de la copia. ¿Seguir?')) return;
      data = Object.assign(defaultData(), j); save(); ui.settings = false; render(); toast('Copia restaurada');
    } catch (e) { toast('Ese archivo no es una copia válida'); }
  };
  r.readAsText(file);
}

// ---------- Leer comprobante (gratis, en el iPhone) ----------
let ocrWorker = null;
function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
async function scanReceipt(file) {
  const title = $('#scan-title');
  try {
    if (title) title.textContent = 'Leyendo comprobante…';
    if (!window.Tesseract) await loadScript('ocr/tesseract.min.js');
    if (!ocrWorker) {
      const base = new URL('.', location.href).href;
      ocrWorker = await Tesseract.createWorker('spa', 1, { workerPath: base + 'ocr/worker.min.js', corePath: base + 'ocr/core', langPath: base + 'ocr/lang', gzip: true });
    }
    const { data: { text } } = await ocrWorker.recognize(file);
    applyReceipt(parseReceipt(text));
  } catch (e) {
    toast('No pude leer la imagen. Cargalo a mano.');
    if (title) title.textContent = 'Leer comprobante (opcional)';
  }
}
function parseReceipt(text) {
  const t = text.replace(/\r/g, '');
  const low = t.toLowerCase();
  const out = {};
  // Monto: el número más grande que venga con signo $ o US$
  const re = /(US\s?\$|U\$S|USD|\$)\s?(\d{1,3}(?:[.\s]\d{3})*(?:,\d{1,2})?|\d+(?:,\d{1,2})?)/gi;
  let best = 0, bestCur = 'ARS', m;
  while ((m = re.exec(t))) {
    const n = parseAmount(m[2].replace(/\s/g, '.'));
    if (n > best) { best = n; bestCur = /US|USD/i.test(m[1]) ? 'USD' : 'ARS'; }
  }
  if (best > 0) { out.amount = String(best).replace('.', ','); out.cur = bestCur; }
  // Fecha
  let dm = t.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (dm) {
    let y = Number(dm[3]); if (y < 100) y += 2000;
    out.date = y + '-' + String(dm[2]).padStart(2, '0') + '-' + String(dm[1]).padStart(2, '0');
  } else {
    dm = low.match(/(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)(?:\s+(?:de\s+)?(\d{4}))?/);
    if (dm) {
      const mi = MESES.indexOf(dm[2] === 'setiembre' ? 'septiembre' : dm[2]) + 1;
      out.date = (dm[3] || today().slice(0, 4)) + '-' + String(mi).padStart(2, '0') + '-' + String(dm[1]).padStart(2, '0');
    }
  }
  if (out.date && !/^\d{4}-\d{2}-\d{2}$/.test(out.date)) delete out.date;
  // Cuenta y medio de pago
  if (/mercado\s?pago/.test(low)) out.account = 'mp';
  else if (/galicia/.test(low)) out.account = 'galicia';
  else if (/cocos/.test(low)) out.account = 'cocos';
  else if (/utop[ií]a/.test(low)) out.account = 'utopia';
  else if (/d[oó]lar\s?app/.test(low)) out.account = 'dolarapp';
  if (/cr[eé]dito|cuotas?/.test(low)) out.method = 'Crédito';
  else if (/transferencia|transferiste|cvu|cbu/.test(low)) out.method = 'Transferencia';
  else if (/d[eé]bito/.test(low)) out.method = 'Débito';
  if (/recibiste|te transfiri[oó]|te envi[oó]|acreditamos/.test(low)) out.type = 'ingreso';
  // Descripción: a quién se pagó
  const lines = t.split('\n').map((s) => s.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const mm = l.match(/^(?:para|destinatario|a|comercio|pagaste a|le pagaste a)\s*:?\s*(.+)$/i);
    if (mm && /[a-záéíóúñ]{3,}/i.test(mm[1])) { out.desc = mm[1].slice(0, 60); break; }
    if (/^(para|destinatario|comercio)\s*:?$/i.test(l) && lines[i + 1]) { out.desc = lines[i + 1].slice(0, 60); break; }
  }
  return out;
}
function applyReceipt(r) {
  const d = ui.draft;
  if (r.type) d.type = r.type;
  if (r.amount) d.amount = r.amount;
  if (r.cur) d.cur = r.cur;
  if (r.date) d.date = r.date;
  if (r.method && d.type === 'gasto') d.method = r.method;
  if (r.account && acc(r.account).curs.includes(d.cur)) d.account = r.account;
  if (r.desc && !d.desc) d.desc = r.desc;
  fixAccounts();
  render();
  toast(r.amount ? 'Listo. Revisá los datos y elegí la categoría.' : 'No encontré el monto. Completalo a mano.');
}

// ---------- Inicio ----------
// El icono funciona como un "+": al abrir (o volver después de un rato) va directo a Cargar.
function goQuickAdd() {
  if (data.openOnCargar === false || ui.draft.id) return;
  ui.tab = 'cargar'; ui.settings = false;
  if (!ui.draft.amount && !ui.draft.usd) ui.draft = newDraft();
}
goQuickAdd();
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { hiddenAt = Date.now(); return; }
  if (hiddenAt && Date.now() - hiddenAt > 3 * 60 * 1000) { goQuickAdd(); render(); window.scrollTo(0, 0); }
});
render();
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}
