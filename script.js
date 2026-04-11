// ─── Cyber Audit Mini Lab · v1.2 ───────────────────────────────────────────
// Stack: HTML + CSS + JS vanilla. Sin frameworks. Sin backend.
// Autor: Matías Godoy · Legal-Tech / GRC / Ciberseguridad

let fullData = [], filteredData = [], selectedId = null;
let sortField = null, sortDir = -1;

const IMPACTO_NUM = { 'Crítico': 5, 'Alto': 4, 'Medio': 3, 'Bajo': 2, 'Mínimo': 1 };

// ─── INICIO ──────────────────────────────────────────────────────────────────
async function init() {
  try {
    const res = await fetch('data/audit_matrix.json');
    fullData = await res.json();
    fullData = fullData.map(enrichRiskData);
    filteredData = [...fullData];
    buildFilters();
    renderSummary(filteredData);
    renderTable(filteredData);
    renderCards(filteredData);
    bindFilters();
    handleResponsiveView();
    window.addEventListener('resize', handleResponsiveView);
  } catch(err) {
    document.getElementById('tableBody').innerHTML =
      '<tr><td colspan="9" style="text-align:center;color:#f87171;padding:20px">Error al cargar audit_matrix.json — usá Live Server o servidor local</td></tr>';
  }
}

// ─── ENRIQUECER DATOS DE RIESGO ──────────────────────────────────────────────
function enrichRiskData(item) {
  const impNum  = IMPACTO_NUM[item.impacto] || 3;
  const prob    = item.probabilidad || 3;
  const inherente = impNum * prob;
  // Efectividad = promedio de diseño y operación (1–5 cada uno)
  const diseno  = item.diseno_control  || 1;
  const operacion = item.operacion_control || 1;
  const efectividad = (diseno + operacion) / 2;
  // Factor de reducción máximo 70% (control perfectamente efectivo reduce hasta 70% del riesgo)
  const factor  = efectividad / 5 * 0.7;
  const residual = Math.round(inherente * (1 - factor));
  return {
    ...item,
    efectividad_control: efectividad,
    riesgo_inherente:  item.riesgo_inherente  ?? inherente,
    riesgo_residual:   item.riesgo_residual   ?? residual
  };
}

// ─── CLASIFICAR NIVEL DE RIESGO ──────────────────────────────────────────────
function riesgoNivel(valor) {
  if (valor >= 18) return { label: 'Crítico', cls: 'critico' };
  if (valor >= 12) return { label: 'Alto',    cls: 'alto' };
  if (valor >= 6)  return { label: 'Medio',   cls: 'medio' };
  return               { label: 'Bajo',    cls: 'bajo' };
}

// ─── MAPEO DE CLASES CSS ─────────────────────────────────────────────────────
function estadoClass(estado) {
  const map = {
    'No implementado': 'noimpl',
    'Parcial':         'parcial',
    'Implementado':    'impl',
    'Validado':        'validado'
  };
  return map[estado] || 'noimpl';
}

function hallazgoClass(estado) {
  const map = {
    'Abierto':   'abierto',
    'En curso':  'encurso',
    'Mitigado':  'mitigado',
    'Aceptado':  'aceptado',
    'Cerrado':   'cerrado'
  };
  return map[estado] || 'abierto';
}

function impactoClass(impacto) {
  const map = { 'Crítico': 'critico', 'Alto': 'alto', 'Medio': 'medio', 'Bajo': 'bajo' };
  return map[impacto] || 'alto';
}

function resultadoClass(resultado) {
  const map = {
    'Satisfactorio':  'ok',
    'Parcial':        'parcial',
    'Insatisfactorio':'fail',
    'No probado':     'noprobado'
  };
  return map[resultado] || 'noprobado';
}

function confianzaClass(nivel) {
  const map = { 'Alto': 'alto', 'Medio': 'medio', 'Bajo': 'bajo' };
  return map[nivel] || 'medio';
}

// ─── FILTROS ─────────────────────────────────────────────────────────────────
function buildFilters() {
  const dominios = [...new Set(fullData.map(d => d.dominio))];
  const sel = document.getElementById('filterDominio');
  dominios.forEach(d => {
    const o = document.createElement('option');
    o.value = d; o.textContent = d; sel.appendChild(o);
  });
}

function bindFilters() {
  ['filterDominio','filterPrioridad','filterImpacto','filterCompliance','filterEstado','filterHallazgo']
    .forEach(id => document.getElementById(id)?.addEventListener('change', applyFilters));
  document.getElementById('btnReset').addEventListener('click', resetFilters);
}

function applyFilters() {
  const dom      = document.getElementById('filterDominio').value;
  const pri      = document.getElementById('filterPrioridad').value;
  const imp      = document.getElementById('filterImpacto').value;
  const comp     = document.getElementById('filterCompliance').value;
  const estado   = document.getElementById('filterEstado').value;
  const hallazgo = document.getElementById('filterHallazgo')?.value || '';
  filteredData = fullData.filter(d =>
    (!dom      || d.dominio === dom) &&
    (!pri      || d.prioridad === pri) &&
    (!imp      || d.impacto === imp) &&
    (!comp     || d.implicancia_compliance === comp) &&
    (!estado   || d.estado_control === estado) &&
    (!hallazgo || d.estado_hallazgo === hallazgo)
  );
  selectedId = null;
  if (sortField) applySort();
  renderSummary(filteredData);
  renderTable(filteredData);
  renderCards(filteredData);
  clearDetail();
}

function resetFilters() {
  ['filterDominio','filterPrioridad','filterImpacto','filterCompliance','filterEstado','filterHallazgo']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  filteredData = [...fullData];
  sortField = null; sortDir = -1;
  selectedId = null;
  renderSummary(filteredData);
  renderTable(filteredData);
  renderCards(filteredData);
  clearDetail();
  document.querySelectorAll('th.sortable').forEach(th => th.classList.remove('sort-asc','sort-desc'));
}

// ─── ORDENAMIENTO ─────────────────────────────────────────────────────────────
function sortBy(field) {
  if (sortField === field) { sortDir *= -1; }
  else { sortField = field; sortDir = -1; }
  applySort();
  renderTable(filteredData);
  document.querySelectorAll('th.sortable').forEach(th => {
    th.classList.remove('sort-asc','sort-desc');
    if (th.dataset.sort === field) th.classList.add(sortDir === 1 ? 'sort-asc' : 'sort-desc');
  });
}

function applySort() {
  filteredData = [...filteredData].sort((a, b) => {
    const va = a[sortField], vb = b[sortField];
    if (typeof va === 'number') return (va - vb) * sortDir;
    return String(va ?? '').localeCompare(String(vb ?? '')) * sortDir;
  });
}

// ─── SUMMARY ─────────────────────────────────────────────────────────────────
function renderSummary(data) {
  const total    = data.length;
  const criticos = data.filter(d => d.impacto === 'Crítico').length;
  const abiertos = data.filter(d => d.estado_hallazgo === 'Abierto').length;
  const noImpl   = data.filter(d => d.estado_control === 'No implementado').length;
  const dominios = new Set(data.map(d => d.dominio)).size;
  const avgEf    = total ? (data.reduce((s,d) => s + d.efectividad_control, 0) / total).toFixed(1) : '—';
  const efPct    = total ? (avgEf / 5 * 100).toFixed(0) : 0;

  document.getElementById('summary').innerHTML = `
    <div class="stat-card">
      <span class="stat-label">Controles en revisión</span>
      <div class="stat-value">${total}</div>
      <div class="stat-sub">de ${fullData.length} totales · ${dominios} dominios NIST</div>
    </div>
    <div class="stat-card card-alert">
      <span class="stat-label">Impacto Crítico</span>
      <div class="stat-value">${criticos}</div>
      <div class="stat-sub">requieren atención inmediata</div>
    </div>
    <div class="stat-card card-danger">
      <span class="stat-label">Hallazgos abiertos</span>
      <div class="stat-value">${abiertos}</div>
      <div class="stat-sub">sin plan de remediación activo</div>
    </div>
    <div class="stat-card card-warn">
      <span class="stat-label">No implementados</span>
      <div class="stat-value">${noImpl}</div>
      <div class="stat-sub">sin control activo</div>
    </div>
    <div class="stat-card">
      <span class="stat-label">Efectividad promedio</span>
      <div class="stat-value">${avgEf}</div>
      <div class="stat-sub">diseño + operación / escala 1–5</div>
      <div class="madurez-bar"><div class="madurez-fill" style="width:${efPct}%"></div></div>
    </div>`;

  document.getElementById('filterCount').textContent =
    data.length === fullData.length
      ? `Mostrando todos (${data.length})`
      : `${data.length} resultado${data.length!==1?'s':''} filtrado${data.length!==1?'s':''}`;
}

// ─── TABLA (DESKTOP) ─────────────────────────────────────────────────────────
function renderTable(data) {
  const tbody = document.getElementById('tableBody');
  const empty = document.getElementById('emptyState');
  tbody.innerHTML = '';
  if (!data.length) { empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  data.forEach(item => {
    const tr = document.createElement('tr');
    if (item.id === selectedId) tr.classList.add('selected');
    const ri = riesgoNivel(item.riesgo_inherente);
    const rr = riesgoNivel(item.riesgo_residual);
    tr.innerHTML = `
      <td class="td-id">${String(item.id).padStart(2,'0')}</td>
      <td><span class="badge-dominio badge-dominio-${item.dominio.toLowerCase()}">${item.dominio}</span></td>
      <td class="td-riesgo">${item.riesgo}</td>
      <td><span class="badge badge-${impactoClass(item.impacto)}">${item.impacto}</span></td>
      <td><span class="badge-estado badge-estado-${estadoClass(item.estado_control)}">${item.estado_control}</span></td>
      <td><span class="badge-hallazgo badge-hallazgo-${hallazgoClass(item.estado_hallazgo)}">${item.estado_hallazgo}</span></td>
      <td class="td-riesgo-num">
        <span class="riesgo-num riesgo-${ri.cls}" title="Inherente: ${ri.label}">${item.riesgo_inherente}</span>
        <span class="riesgo-arrow">→</span>
        <span class="riesgo-num riesgo-${rr.cls}" title="Residual: ${rr.label}">${item.riesgo_residual}</span>
      </td>
      <td>${renderEfectividad(item.diseno_control, item.operacion_control)}</td>`;
    tr.addEventListener('click', () => {
      selectedId = item.id;
      document.querySelectorAll('#tableBody tr').forEach(r => r.classList.remove('selected'));
      tr.classList.add('selected');
      renderDetail(item);
    });
    tbody.appendChild(tr);
  });
}

// ─── CARDS (MOBILE) ──────────────────────────────────────────────────────────
function renderCards(data) {
  const container = document.getElementById('cardsContainer');
  if (!container) return;
  container.innerHTML = '';
  if (!data.length) {
    container.innerHTML = '<p class="empty-state">Sin resultados para los filtros aplicados.</p>';
    return;
  }
  data.forEach(item => {
    const ri = riesgoNivel(item.riesgo_inherente);
    const rr = riesgoNivel(item.riesgo_residual);
    const card = document.createElement('div');
    card.className = 'audit-card';
    if (item.id === selectedId) card.classList.add('selected');
    card.innerHTML = `
      <div class="audit-card-header">
        <span class="badge-dominio badge-dominio-${item.dominio.toLowerCase()}">${item.dominio}</span>
        <span class="td-id">#${String(item.id).padStart(2,'0')}</span>
      </div>
      <p class="audit-card-riesgo">${item.riesgo}</p>
      <p class="audit-card-brecha">⚠ ${item.brecha_detectada}</p>
      <div class="audit-card-badges">
        <span class="badge badge-${impactoClass(item.impacto)}">${item.impacto}</span>
        <span class="badge-estado badge-estado-${estadoClass(item.estado_control)}">${item.estado_control}</span>
        <span class="badge-hallazgo badge-hallazgo-${hallazgoClass(item.estado_hallazgo)}">${item.estado_hallazgo}</span>
      </div>
      <div class="audit-card-footer">
        <span class="card-riesgo-label">
          <span class="riesgo-num riesgo-${ri.cls}">${item.riesgo_inherente}</span>
          <span class="riesgo-arrow">→</span>
          <span class="riesgo-num riesgo-${rr.cls}">${item.riesgo_residual}</span>
        </span>
        <button class="btn-ver-detalle">Ver detalle</button>
      </div>`;
    card.querySelector('.btn-ver-detalle').addEventListener('click', () => {
      selectedId = item.id;
      document.querySelectorAll('.audit-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      renderDetail(item);
      setTimeout(() => document.getElementById('detailPanel').scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    });
    container.appendChild(card);
  });
}

// ─── DETALLE ─────────────────────────────────────────────────────────────────
function renderDetail(item) {
  const panel = document.getElementById('detailPanel');
  const hint  = document.getElementById('detailHint');
  const cont  = document.getElementById('detailContent');
  const ri    = riesgoNivel(item.riesgo_inherente);
  const rr    = riesgoNivel(item.riesgo_residual);

  panel.classList.add('has-content');
  hint.textContent = `Control #${String(item.id).padStart(2,'0')} · ${item.dominio} · ${item.tipo_control}`;
  cont.className = '';

  const fVerif = item.fecha_verificacion
    ? item.fecha_verificacion
    : '<span style="color:var(--text-muted)">Sin fecha aún</span>';

  cont.innerHTML = `<div class="detail-grid">

    <!-- 1. ENCABEZADO: Riesgo + scoring + badges -->
    <div class="detail-riesgo-header">
      <div class="detail-riesgo-title">${item.riesgo}</div>
      <div class="detail-scoring-row">
        Inherente: <span class="riesgo-num riesgo-${ri.cls}">${item.riesgo_inherente} (${ri.label})</span>
        &nbsp;→&nbsp;
        Residual: <span class="riesgo-num riesgo-${rr.cls}">${item.riesgo_residual} (${rr.label})</span>
        &nbsp;&nbsp;·&nbsp;&nbsp;
        ${renderEfectividad(item.diseno_control, item.operacion_control)}
      </div>
      <div class="detail-badges">
        <span class="badge badge-${impactoClass(item.impacto)}">${item.impacto}</span>
        <span class="badge badge-prioridad-${item.prioridad==='Crítica'?'critica':'alta'}">${item.prioridad}</span>
        <span class="badge-dominio badge-dominio-${item.dominio.toLowerCase()}">${item.dominio}</span>
        <span class="badge-estado badge-estado-${estadoClass(item.estado_control)}">${item.estado_control}</span>
        <span class="badge-tipo badge-tipo-${item.tipo_control?.toLowerCase()}">${item.tipo_control}</span>
      </div>
    </div>

    <!-- 2. BRECHA DETECTADA - protagonista del análisis -->
    <div class="detail-cell detail-brecha-block span-full">
      <h4>⚠ Brecha detectada</h4>
      <p class="brecha-texto">${item.brecha_detectada}</p>
      <div class="brecha-meta">
        <span>Resultado: <span class="badge-resultado badge-resultado-${resultadoClass(item.resultado_prueba)}">${item.resultado_prueba}</span></span>
        <span>Confianza del auditor: <span class="badge-confianza badge-confianza-${confianzaClass(item.nivel_confianza)}">${item.nivel_confianza}</span></span>
        <span>Hallazgo: <span class="badge-hallazgo badge-hallazgo-${hallazgoClass(item.estado_hallazgo)}">${item.estado_hallazgo}</span></span>
      </div>
    </div>

    <!-- 3. CONTEXTO: Activo + Tipo/Naturaleza -->
    <div class="detail-cell">
      <h4>Activo afectado</h4>
      <p>${item.activo_afectado ?? '—'}</p>
    </div>
    <div class="detail-cell">
      <h4>Tipo y naturaleza del control</h4>
      <p><span class="badge-tipo badge-tipo-${item.tipo_control?.toLowerCase()}">${item.tipo_control}</span>&nbsp;
      <span class="badge-naturaleza">${item.naturaleza_control}</span></p>
      <p style="margin-top:8px">${item.objetivo_control}</p>
    </div>

    <!-- 4. EVIDENCIA: requerida vs observada -->
    <div class="detail-cell span-full">
      <h4>Evidencia requerida vs observada en campo</h4>
      <div class="evidencia-split">
        <div class="evidencia-block">
          <span class="ev-label">Diseño del control</span>
          <p>${item.evidencia_minima.diseno}</p>
        </div>
        <div class="evidencia-block">
          <span class="ev-label">Funcionamiento del control</span>
          <p>${item.evidencia_minima.funcionamiento}</p>
        </div>
      </div>
      <div class="evidencia-observada-block">
        <span class="ev-label ev-observada">Evidencia observada en campo</span>
        <p>${item.evidencia_observada ?? '—'}</p>
      </div>
    </div>

    <!-- 5. IMPACTO TRIPLE -->
    <div class="detail-cell span-full">
      <h4>Análisis de impacto</h4>
      <div class="impacto-triple">
        <div class="impacto-block">
          <span class="ev-label">Negocio</span>
          <p>${item.impacto_negocio ?? '—'}</p>
        </div>
        <div class="impacto-block">
          <span class="ev-label">Operativo</span>
          <p>${item.impacto_operativo ?? '—'}</p>
        </div>
        <div class="impacto-block">
          <span class="ev-label">Regulatorio</span>
          <p>${item.impacto_regulatorio ?? '—'}</p>
        </div>
      </div>
    </div>

    <!-- 6. LEGAL / COMPLIANCE -->
    <div class="detail-cell detail-legal-block span-full">
      <h4>⚖ Riesgo legal / Compliance</h4>
      <p>${item.riesgo_legal ?? '—'}</p>
      <div style="margin-top:8px">
        <span class="badge-compliance">${item.implicancia_compliance}</span>
      </div>
    </div>

    <!-- 7. POR QUÉ IMPORTA + CONSECUENCIA -->
    <div class="detail-cell">
      <h4>Por qué importa</h4>
      <p>${item.por_que_importa ?? '—'}</p>
    </div>
    <div class="detail-cell">
      <h4>Consecuencia potencial</h4>
      <p>${item.consecuencia_potencial ?? '—'}</p>
    </div>

    <!-- 8. REMEDIACIÓN + GESTIÓN DEL HALLAZGO -->
    <div class="detail-cell">
      <h4>Plan de remediación</h4>
      <p>${item.plan_remediacion}</p>
    </div>
    <div class="detail-cell">
      <h4>Gestión del hallazgo</h4>
      <p>
        <strong>Owner:</strong> ${item.owner_remediacion ?? item.responsable}<br>
        <strong>Fecha compromiso:</strong> ${item.fecha_compromiso ?? '—'}<br>
        <strong>Verificación:</strong> ${fVerif}
      </p>
      <p style="margin-top:8px;color:var(--text-muted);font-size:11px">
        Resp. técnico: ${item.responsable} · ${item.frecuencia}<br>
        Última revisión: ${item.ultima_revision ?? '—'}
      </p>
    </div>

  </div>`;

  setTimeout(() => document.getElementById('detailPanel').scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
}

function clearDetail() {
  const panel = document.getElementById('detailPanel');
  const hint  = document.getElementById('detailHint');
  const cont  = document.getElementById('detailContent');
  panel.classList.remove('has-content');
  hint.textContent = 'Seleccioná un control para ver el análisis completo';
  cont.className = 'detail-empty';
  cont.innerHTML = '<div class="detail-placeholder"><span>↑</span><p>Clic en cualquier fila de la tabla</p></div>';
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function renderEfectividad(diseno, operacion) {
  const d = diseno || 1, o = operacion || 1;
  return `<div class="efect-bars" title="Diseño: ${d}/5 · Operación: ${o}/5">
    <div class="efect-row"><span class="efect-label">D</span>${renderDots(d)}</div>
    <div class="efect-row"><span class="efect-label">O</span>${renderDots(o)}</div>
  </div>`;
}

function renderDots(val, max = 5) {
  return `<div class="madurez-dots">${
    Array.from({length: max}, (_, i) =>
      `<div class="dot ${i < val ? 'active' : ''}"></div>`
    ).join('')
  }</div>`;
}

// ─── RESPONSIVE ──────────────────────────────────────────────────────────────
function handleResponsiveView() {
  const isMobile = window.innerWidth <= 768;
  const tableSection = document.getElementById('tableSection');
  const cardsSection = document.getElementById('cardsSection');
  if (tableSection) tableSection.style.display = isMobile ? 'none' : 'block';
  if (cardsSection) cardsSection.style.display = isMobile ? 'block' : 'none';
}

init();
