// ─── Cyber Audit Mini Lab · v1.3 ───────────────────────────────────────────
// Stack: HTML + CSS + JS vanilla. Sin frameworks. Sin backend.
// Autor: Matías Godoy · Legal-Tech / GRC / Ciberseguridad

let fullData = [], filteredData = [], selectedId = null;
let sortField = null, sortDir = -1;

const IMPACTO_NUM = { 'Crítico': 5, 'Alto': 4, 'Medio': 3, 'Bajo': 2, 'Mínimo': 1 };

// ─── INICIO ──────────────────────────────────────────────────────────────────
async function init() {
  try {
    const res = await fetch('data/audit_matrix.json');
    const raw = await res.json();
    fullData = raw.map(item => enrichRiskData(flattenItem(item)));
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
      '<tr><td colspan="8" style="text-align:center;color:#f87171;padding:20px">Error al cargar audit_matrix.json — usá Live Server o servidor local</td></tr>';
  }
}

// ─── APLANAR ESTRUCTURA NESTED → FLAT ────────────────────────────────────────
// El JSON v1.3 tiene sub-objetos; este paso produce un objeto plano para
// compatibilidad con todo el resto del código.
function flattenItem(item) {
  const def    = item.control_definition     || {};
  const assess = item.audit_assessment       || {};
  const rem    = item.remediation_tracking   || {};
  const impact = item.impact_analysis        || {};

  return {
    id: item.id,
    // control_definition
    dominio:               def.dominio,
    riesgo:                def.riesgo,
    objetivo_control:      def.objetivo_control,
    control_esperado:      def.control_esperado,
    evidencia_minima:      def.evidencia_minima || {},
    activo_afectado:       def.activo_afectado,
    tipo_control:          def.tipo_control,
    naturaleza_control:    def.naturaleza_control,
    responsable:           def.responsable,
    frecuencia:            def.frecuencia,
    criterio_evaluacion:   def.criterio_evaluacion,
    implicancia_compliance:def.implicancia_compliance,
    impacto:               def.impacto,
    prioridad:             def.prioridad,
    probabilidad:          def.probabilidad,
    hallazgo_potencial:    def.hallazgo_potencial,
    riesgo_legal:          def.riesgo_legal,
    por_que_importa:       def.por_que_importa,
    consecuencia_potencial:def.consecuencia_potencial,
    // audit_assessment
    diseno_control:        assess.diseno_control,
    operacion_control:     assess.operacion_control,
    resultado_prueba:      assess.resultado_prueba,
    evidencia_observada:   assess.evidencia_observada,
    brecha_detectada:      assess.brecha_detectada,
    nivel_confianza:       assess.nivel_confianza,
    estado_control:        assess.estado_control,
    ultima_revision:       assess.ultima_revision,
    observacion_auditor:   assess.observacion_auditor,
    // remediation_tracking
    estado_hallazgo:       rem.estado_hallazgo,
    owner_remediacion:     rem.owner_remediacion,   // puede ser null (C08)
    fecha_compromiso:      rem.fecha_compromiso,
    fecha_verificacion:    rem.fecha_verificacion,
    plan_remediacion:      rem.plan_remediacion,
    decision_riesgo:       rem.decision_riesgo,
    justificacion_aceptacion: rem.justificacion_aceptacion,
    // impact_analysis
    impacto_negocio:       impact.impacto_negocio,
    impacto_operativo:     impact.impacto_operativo,
    impacto_regulatorio:   impact.impacto_regulatorio
  };
}

// ─── ENRIQUECER DATOS DE RIESGO ──────────────────────────────────────────────
// v1.3: scoring ponderado por naturaleza_control + cálculo de aging de hallazgo
function enrichRiskData(item) {
  const impNum     = IMPACTO_NUM[item.impacto] || 3;
  const prob       = item.probabilidad || 3;
  const inherente  = impNum * prob;

  const diseno     = item.diseno_control   || 1;
  const operacion  = item.operacion_control || 1;

  // Pesos según naturaleza del control
  // Automatizado: la operación pesa más (difícil de diseñar, fácil de operar)
  // Manual:       el diseño pesa más (un buen procedimiento es el activo principal)
  // Híbrido:      pesos iguales
  let wD, wO;
  if      (item.naturaleza_control === 'Automatizado') { wD = 0.35; wO = 0.65; }
  else if (item.naturaleza_control === 'Manual')       { wD = 0.65; wO = 0.35; }
  else                                                  { wD = 0.50; wO = 0.50; } // Híbrido

  const efectividad = +(diseno * wD + operacion * wO).toFixed(2);
  const factor      = efectividad / 5 * 0.7;
  const residual    = Math.round(inherente * (1 - factor));

  // Aging del hallazgo
  const aging = calcAging(item.fecha_compromiso);

  return {
    ...item,
    efectividad_control:  efectividad,
    riesgo_inherente:     inherente,
    riesgo_residual:      residual,
    diasHastaCompromiso:  aging.dias,
    agingStatus:          aging.status
  };
}

// ─── CÁLCULO DE AGING ─────────────────────────────────────────────────────────
// Devuelve días hasta (positivo) o desde (negativo) la fecha de compromiso
// y el estado: 'vencido' | 'proximo' (≤7d) | 'en-termino' | 'sin-fecha'
function calcAging(fechaCompromiso) {
  if (!fechaCompromiso) return { dias: null, status: 'sin-fecha' };
  const today    = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(fechaCompromiso + 'T00:00:00');
  const diffMs   = deadline - today;
  const dias     = Math.round(diffMs / (1000 * 60 * 60 * 24));
  let status;
  if (dias < 0)        status = 'vencido';
  else if (dias <= 7)  status = 'proximo';
  else                 status = 'en-termino';
  return { dias, status };
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
    'Abierto':  'abierto',
    'En curso': 'encurso',
    'Mitigado': 'mitigado',
    'Aceptado': 'aceptado',
    'Cerrado':  'cerrado'
  };
  return map[estado] || 'abierto';
}

function impactoClass(impacto) {
  const map = { 'Crítico': 'critico', 'Alto': 'alto', 'Medio': 'medio', 'Bajo': 'bajo' };
  return map[impacto] || 'alto';
}

function resultadoClass(resultado) {
  const map = {
    'Satisfactorio':   'ok',
    'Parcial':         'parcial',
    'Insatisfactorio': 'fail',
    'No probado':      'noprobado'
  };
  return map[resultado] || 'noprobado';
}

function confianzaClass(nivel) {
  const map = { 'Alto': 'alto', 'Medio': 'medio', 'Bajo': 'bajo' };
  return map[nivel] || 'medio';
}

// ─── HELPER: AGING BADGE ─────────────────────────────────────────────────────
function renderAgingBadge(item) {
  const { diasHastaCompromiso: dias, agingStatus: status, fecha_compromiso } = item;
  if (!fecha_compromiso || status === 'sin-fecha') {
    return '<span class="badge-aging badge-aging-sinfecha">Sin fecha</span>';
  }
  if (status === 'vencido') {
    return `<span class="badge-aging badge-aging-vencido">Vencido ${Math.abs(dias)}d</span>`;
  }
  if (status === 'proximo') {
    return `<span class="badge-aging badge-aging-proximo">${dias}d</span>`;
  }
  return `<span class="badge-aging badge-aging-termino">${dias}d</span>`;
}

// ─── HELPER: FORMATO DE FECHA ─────────────────────────────────────────────────
function formatFecha(fecha) {
  if (!fecha) return '—';
  const [y, m, d] = fecha.split('-');
  return `${d}/${m}/${y.slice(2)}`;
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
  ['filterDominio','filterPrioridad','filterImpacto','filterCompliance','filterEstado','filterHallazgo','filterAging']
    .forEach(id => document.getElementById(id)?.addEventListener('change', applyFilters));
  document.getElementById('btnReset').addEventListener('click', resetFilters);
}

function applyFilters() {
  const dom      = document.getElementById('filterDominio').value;
  const pri      = document.getElementById('filterPrioridad').value;
  const imp      = document.getElementById('filterImpacto').value;
  const comp     = document.getElementById('filterCompliance').value;
  const estado   = document.getElementById('filterEstado').value;
  const hallazgo = document.getElementById('filterHallazgo')?.value  || '';
  const aging    = document.getElementById('filterAging')?.value     || '';

  filteredData = fullData.filter(d =>
    (!dom      || d.dominio === dom) &&
    (!pri      || d.prioridad === pri) &&
    (!imp      || d.impacto === imp) &&
    (!comp     || d.implicancia_compliance === comp) &&
    (!estado   || d.estado_control === estado) &&
    (!hallazgo || d.estado_hallazgo === hallazgo) &&
    (!aging    || d.agingStatus === aging)
  );
  selectedId = null;
  if (sortField) applySort();
  renderSummary(filteredData);
  renderTable(filteredData);
  renderCards(filteredData);
  clearDetail();
}

function resetFilters() {
  ['filterDominio','filterPrioridad','filterImpacto','filterCompliance','filterEstado','filterHallazgo','filterAging']
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
    // null va al fondo en cualquier dirección
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    if (typeof va === 'number') return (va - vb) * sortDir;
    return String(va).localeCompare(String(vb)) * sortDir;
  });
}

// ─── SUMMARY ─────────────────────────────────────────────────────────────────
function renderSummary(data) {
  const total    = data.length;
  const criticos = data.filter(d => d.impacto === 'Crítico').length;
  const abiertos = data.filter(d => ['Abierto','En curso'].includes(d.estado_hallazgo)).length;
  const vencidos = data.filter(d => d.agingStatus === 'vencido').length;
  const proximos = data.filter(d => d.agingStatus === 'proximo').length;
  const dominios = new Set(data.map(d => d.dominio)).size;
  const avgEf    = total
    ? (data.reduce((s, d) => s + d.efectividad_control, 0) / total).toFixed(2)
    : '—';
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
      <span class="stat-label">Hallazgos activos</span>
      <div class="stat-value">${abiertos}</div>
      <div class="stat-sub">abiertos o en curso</div>
    </div>
    <div class="stat-card ${vencidos > 0 ? 'card-vencido' : 'card-warn'}">
      <span class="stat-label">Deadlines</span>
      <div class="stat-value">${vencidos > 0 ? vencidos + ' vencido' + (vencidos > 1 ? 's' : '') : proximos + ' próximo' + (proximos !== 1 ? 's' : '')}</div>
      <div class="stat-sub">${vencidos > 0 ? 'requieren escalamiento' : proximos > 0 ? '≤7 días para vencer' : 'todos en término'}</div>
    </div>
    <div class="stat-card">
      <span class="stat-label">Efectividad promedio</span>
      <div class="stat-value">${avgEf}</div>
      <div class="stat-sub">scoring ponderado D·O / escala 1–5</div>
      <div class="madurez-bar"><div class="madurez-fill" style="width:${efPct}%"></div></div>
    </div>`;

  document.getElementById('filterCount').textContent =
    data.length === fullData.length
      ? `Mostrando todos (${data.length})`
      : `${data.length} resultado${data.length !== 1 ? 's' : ''} filtrado${data.length !== 1 ? 's' : ''}`;
}

// ─── TABLA (DESKTOP) ─────────────────────────────────────────────────────────
// v1.3: columnas de gestión → # | Dominio | Riesgo | Estado/Hallazgo | Riesgo R | Owner | Deadline | Aging
function renderTable(data) {
  const tbody = document.getElementById('tableBody');
  const empty = document.getElementById('emptyState');
  tbody.innerHTML = '';
  if (!data.length) { empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  data.forEach(item => {
    const tr = document.createElement('tr');
    if (item.id === selectedId) tr.classList.add('selected');
    if (item.agingStatus === 'vencido') tr.classList.add('row-vencido');

    const rr = riesgoNivel(item.riesgo_residual);

    // Owner: null → alerta
    const ownerHtml = item.owner_remediacion
      ? `<span class="owner-text">${item.owner_remediacion}</span>`
      : `<span class="badge-owner-unset">⚠ Sin asignar</span>`;

    tr.innerHTML = `
      <td class="td-id">${String(item.id).padStart(2, '0')}</td>
      <td><span class="badge-dominio badge-dominio-${item.dominio.toLowerCase()}">${item.dominio}</span></td>
      <td class="td-riesgo">${item.riesgo}</td>
      <td class="td-estado-hallazgo">
        <span class="badge-estado badge-estado-${estadoClass(item.estado_control)}">${item.estado_control}</span>
        <span class="badge-hallazgo badge-hallazgo-${hallazgoClass(item.estado_hallazgo)}">${item.estado_hallazgo}</span>
      </td>
      <td class="td-riesgo-r">
        <span class="riesgo-num riesgo-${rr.cls}" title="${rr.label}">${item.riesgo_residual}</span>
      </td>
      <td class="td-owner">${ownerHtml}</td>
      <td class="td-deadline">${formatFecha(item.fecha_compromiso)}</td>
      <td class="td-aging">${renderAgingBadge(item)}</td>`;

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
    const rr   = riesgoNivel(item.riesgo_residual);
    const card = document.createElement('div');
    card.className = 'audit-card';
    if (item.id === selectedId)         card.classList.add('selected');
    if (item.agingStatus === 'vencido') card.classList.add('vencido');

    const ownerHtml = item.owner_remediacion
      ? item.owner_remediacion
      : '<span class="badge-owner-unset">⚠ Sin asignar</span>';

    card.innerHTML = `
      <div class="audit-card-header">
        <span class="badge-dominio badge-dominio-${item.dominio.toLowerCase()}">${item.dominio}</span>
        <span class="td-id">#${String(item.id).padStart(2, '0')}</span>
      </div>
      <p class="audit-card-riesgo">${item.riesgo}</p>
      <p class="audit-card-brecha">⚠ ${item.brecha_detectada}</p>
      <div class="audit-card-badges">
        <span class="badge badge-${impactoClass(item.impacto)}">${item.impacto}</span>
        <span class="badge-estado badge-estado-${estadoClass(item.estado_control)}">${item.estado_control}</span>
        <span class="badge-hallazgo badge-hallazgo-${hallazgoClass(item.estado_hallazgo)}">${item.estado_hallazgo}</span>
        ${renderAgingBadge(item)}
      </div>
      <div class="audit-card-footer">
        <span class="card-meta">
          <span class="card-owner-label">Owner: ${ownerHtml}</span>
          <span class="card-deadline-label">Deadline: ${formatFecha(item.fecha_compromiso)}</span>
        </span>
        <span class="riesgo-num riesgo-${rr.cls}" title="Riesgo residual">${item.riesgo_residual}</span>
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
  hint.textContent = `Control #${String(item.id).padStart(2, '0')} · ${item.dominio} · ${item.tipo_control}`;
  cont.className = '';

  const fVerif = item.fecha_verificacion
    ? item.fecha_verificacion
    : '<span style="color:var(--text-muted)">Sin fecha aún</span>';

  // Naturaleza del control + pesos aplicados
  let pesosLabel = '';
  if      (item.naturaleza_control === 'Automatizado') pesosLabel = 'D×0.35 + O×0.65';
  else if (item.naturaleza_control === 'Manual')       pesosLabel = 'D×0.65 + O×0.35';
  else                                                  pesosLabel = 'D×0.50 + O×0.50';

  // Sección de gestión: owner + aging
  const ownerDisplay = item.owner_remediacion
    ? item.owner_remediacion
    : `<span class="badge-owner-unset">⚠ Sin responsable asignado — hallazgo sin ownership formal</span>`;

  const agingDisplay = renderAgingBadge(item);
  const agingNote = item.agingStatus === 'vencido'
    ? `<span style="color:#f87171;font-size:11px">Deadline vencido hace ${Math.abs(item.diasHastaCompromiso)} día(s). Requiere escalamiento.</span>`
    : item.agingStatus === 'proximo'
    ? `<span style="color:#fb923c;font-size:11px">Vence en ${item.diasHastaCompromiso} día(s). Confirmar avance.</span>`
    : '';

  // Sección de decisión de riesgo
  const decisionHtml = (() => {
    const dec = item.decision_riesgo || 'Remediar';
    const decClass = dec === 'Aceptado' ? 'aceptado' : dec === 'Transferir' ? 'transferir' : 'remediar';
    let html = `<span class="badge-decision badge-decision-${decClass}">${dec}</span>`;
    if (dec === 'Aceptado' && item.justificacion_aceptacion) {
      html += `<div class="justificacion-aceptacion">
        <span class="ev-label ev-alerta">⚠ Justificación de aceptación</span>
        <p>${item.justificacion_aceptacion}</p>
      </div>`;
    }
    return html;
  })();

  cont.innerHTML = `<div class="detail-grid">

    <!-- 1. ENCABEZADO -->
    <div class="detail-riesgo-header">
      <div class="detail-riesgo-title">${item.riesgo}</div>
      <div class="detail-scoring-row">
        Inherente: <span class="riesgo-num riesgo-${ri.cls}">${item.riesgo_inherente} (${ri.label})</span>
        &nbsp;→&nbsp;
        Residual: <span class="riesgo-num riesgo-${rr.cls}">${item.riesgo_residual} (${rr.label})</span>
        &nbsp;&nbsp;·&nbsp;&nbsp;
        ${renderEfectividad(item.diseno_control, item.operacion_control, item.naturaleza_control)}
        <span class="pesos-label" title="Pesos por naturaleza: ${pesosLabel}">${pesosLabel} = ${item.efectividad_control}</span>
      </div>
      <div class="detail-badges">
        <span class="badge badge-${impactoClass(item.impacto)}">${item.impacto}</span>
        <span class="badge badge-prioridad-${item.prioridad === 'Crítica' ? 'critica' : 'alta'}">${item.prioridad}</span>
        <span class="badge-dominio badge-dominio-${item.dominio.toLowerCase()}">${item.dominio}</span>
        <span class="badge-estado badge-estado-${estadoClass(item.estado_control)}">${item.estado_control}</span>
        <span class="badge-tipo badge-tipo-${item.tipo_control?.toLowerCase()}">${item.tipo_control}</span>
        <span class="badge-naturaleza">${item.naturaleza_control}</span>
      </div>
    </div>

    <!-- 2. BRECHA DETECTADA -->
    <div class="detail-cell detail-brecha-block span-full">
      <h4>⚠ Brecha detectada</h4>
      <p class="brecha-texto">${item.brecha_detectada}</p>
      <div class="brecha-meta">
        <span>Resultado: <span class="badge-resultado badge-resultado-${resultadoClass(item.resultado_prueba)}">${item.resultado_prueba}</span></span>
        <span>Confianza: <span class="badge-confianza badge-confianza-${confianzaClass(item.nivel_confianza)}">${item.nivel_confianza}</span></span>
        <span>Hallazgo: <span class="badge-hallazgo badge-hallazgo-${hallazgoClass(item.estado_hallazgo)}">${item.estado_hallazgo}</span></span>
      </div>
    </div>

    <!-- 3. CONTEXTO -->
    <div class="detail-cell">
      <h4>Activo afectado</h4>
      <p>${item.activo_afectado ?? '—'}</p>
    </div>
    <div class="detail-cell">
      <h4>Tipo y naturaleza del control</h4>
      <p>
        <span class="badge-tipo badge-tipo-${item.tipo_control?.toLowerCase()}">${item.tipo_control}</span>&nbsp;
        <span class="badge-naturaleza">${item.naturaleza_control}</span>
      </p>
      <p style="margin-top:8px">${item.objetivo_control}</p>
    </div>

    <!-- 4. EVIDENCIA -->
    <div class="detail-cell span-full">
      <h4>Evidencia requerida vs observada en campo</h4>
      <div class="evidencia-split">
        <div class="evidencia-block">
          <span class="ev-label">Diseño del control</span>
          <p>${item.evidencia_minima?.diseno ?? '—'}</p>
        </div>
        <div class="evidencia-block">
          <span class="ev-label">Funcionamiento del control</span>
          <p>${item.evidencia_minima?.funcionamiento ?? '—'}</p>
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

    <!-- 8. PLAN DE REMEDIACIÓN -->
    <div class="detail-cell">
      <h4>Plan de remediación</h4>
      <p>${item.plan_remediacion ?? '—'}</p>
    </div>

    <!-- 9. GESTIÓN DEL HALLAZGO (v1.3) -->
    <div class="detail-cell detail-gestion-block">
      <h4>📋 Gestión del hallazgo</h4>
      <div class="gestion-row">
        <span class="gestion-label">Owner:</span>
        <span>${ownerDisplay}</span>
      </div>
      <div class="gestion-row">
        <span class="gestion-label">Deadline:</span>
        <span>${formatFecha(item.fecha_compromiso)} ${agingDisplay} ${agingNote}</span>
      </div>
      <div class="gestion-row">
        <span class="gestion-label">Verificación:</span>
        <span>${fVerif}</span>
      </div>
      <div class="gestion-row">
        <span class="gestion-label">Decisión de riesgo:</span>
        <span>${decisionHtml}</span>
      </div>
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
    Array.from({ length: max }, (_, i) =>
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
