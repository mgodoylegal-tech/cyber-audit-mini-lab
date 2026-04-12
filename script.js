// ─── Cyber Audit Mini Lab · v1.4 ───────────────────────────────────────────
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
// El JSON v1.4 tiene sub-objetos; este paso produce un objeto plano para
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
    estado_hallazgo:           rem.estado_hallazgo,
    owner_remediacion:         rem.owner_remediacion,   // puede ser null (C08)
    fecha_compromiso:          rem.fecha_compromiso,
    fecha_verificacion:        rem.fecha_verificacion,
    plan_remediacion:          rem.plan_remediacion,
    decision_riesgo:           rem.decision_riesgo,
    justificacion_aceptacion:  rem.justificacion_aceptacion,
    fecha_apertura_hallazgo:   rem.fecha_apertura_hallazgo,
    fecha_cierre_hallazgo:     rem.fecha_cierre_hallazgo,
    motivo_cierre:             rem.motivo_cierre,
    aprobador_riesgo:          rem.aprobador_riesgo,
    explicacion_riesgo_residual: rem.explicacion_riesgo_residual,
    // impact_analysis
    impacto_negocio:       impact.impacto_negocio,
    impacto_operativo:     impact.impacto_operativo,
    impacto_regulatorio:   impact.impacto_regulatorio
  };
}

// ─── ENRIQUECER DATOS DE RIESGO ──────────────────────────────────────────────
// v1.4: scoring ponderado + penalizaciones de gestión + flags de riesgo
//
// El riesgo residual no solo depende de la efectividad del control,
// sino de la calidad de su gestión. Un hallazgo sin owner, vencido,
// o abierto sin iniciar → el riesgo real es mayor que el teórico.
function enrichRiskData(item) {
  const impNum    = IMPACTO_NUM[item.impacto] || 3;
  const prob      = item.probabilidad || 3;
  const inherente = impNum * prob;

  const diseno    = item.diseno_control    || 1;
  const operacion = item.operacion_control || 1;

  // Pesos según naturaleza del control
  // Automatizado: la operación pesa más (difícil de diseñar, fácil de operar)
  // Manual:       el diseño pesa más (el procedimiento es el activo principal)
  // Híbrido:      pesos iguales
  let wD, wO;
  if      (item.naturaleza_control === 'Automatizado') { wD = 0.35; wO = 0.65; }
  else if (item.naturaleza_control === 'Manual')       { wD = 0.65; wO = 0.35; }
  else                                                  { wD = 0.50; wO = 0.50; }

  const efectividad = +(diseno * wD + operacion * wO).toFixed(2);
  const factor      = efectividad / 5 * 0.7;
  let   residual    = Math.round(inherente * (1 - factor));

  // Aging del hallazgo
  const aging = calcAging(item.fecha_compromiso);

  // ── Penalizaciones de gestión (v1.4) ──────────────────────────────────────
  // Principio: un hallazgo mal gestionado tiene más riesgo real que el
  // calculado por la efectividad del control. Los factores son deliberadamente
  // simples y explicables (no fórmulas opacas).
  //
  //   +15% deadline vencido     → remediación demorada amplifica la exposición
  //   +10% sin owner asignado   → sin responsable, no hay remediación posible
  //   +5%  hallazgo Abierto     → aún no se inició ninguna acción correctiva
  //
  // El resultado no puede superar el riesgo inherente (techo natural).
  let penalizacion = 0;
  if (aging.status === 'vencido')          penalizacion += 0.15;
  if (!item.owner_remediacion)             penalizacion += 0.10;
  if (item.estado_hallazgo === 'Abierto')  penalizacion += 0.05;

  const residualBase = residual; // valor antes de penalizar → visible en UI como "Base"

  if (penalizacion > 0) {
    residual = Math.min(inherente, Math.round(residual * (1 + penalizacion)));
  }

  // ── Flags de riesgo (v1.4) ───────────────────────────────────────────────
  // Señales de alerta que superan el scoring individual.
  // Combinar condiciones revela situaciones que requieren atención inmediata.
  const riskFlags = [];
  if (inherente >= 12 && aging.status === 'vencido')
    riskFlags.push('critico-vencido');
  if (!item.owner_remediacion)
    riskFlags.push('sin-owner');
  if (item.estado_hallazgo === 'Abierto' && IMPACTO_NUM[item.impacto] >= 4)
    riskFlags.push('hallazgo-critico-abierto');
  if (item.decision_riesgo === 'Aceptado' && !item.aprobador_riesgo)
    riskFlags.push('aceptado-sin-aprobador');

  return {
    ...item,
    efectividad_control:  efectividad,
    riesgo_inherente:     inherente,
    riesgo_residual_base: residualBase,
    riesgo_residual:      residual,
    penalizacion_gestion: penalizacion > 0 ? penalizacion : null,
    riskFlags,
    diasHastaCompromiso:  aging.dias,
    agingStatus:          aging.status
  };
}

// ─── CÁLCULO DE AGING ─────────────────────────────────────────────────────────
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

// ─── HELPER: RISK FLAGS BADGES ───────────────────────────────────────────────
// Señales de alerta compuestas — más allá del scoring individual.
function renderRiskFlags(item) {
  if (!item.riskFlags || !item.riskFlags.length) return '';
  return item.riskFlags.map(flag => {
    switch (flag) {
      case 'critico-vencido':
        return '<span class="risk-flag risk-flag-critico-vencido" title="Riesgo alto + deadline vencido">⚡ Crítico vencido</span>';
      case 'sin-owner':
        return '<span class="risk-flag risk-flag-sin-owner" title="Sin responsable formal asignado">◎ Sin owner</span>';
      case 'hallazgo-critico-abierto':
        return '<span class="risk-flag risk-flag-hallazgo-critico" title="Hallazgo crítico sin iniciar">▲ Abierto crítico</span>';
      case 'aceptado-sin-aprobador':
        return '<span class="risk-flag risk-flag-aceptado-sin-aprobador" title="Riesgo aceptado sin aprobador formal">⚠ Aceptado sin aprobador</span>';
      default:
        return '';
    }
  }).join('');
}

// ─── HELPER: PENALIZACIÓN BADGE ──────────────────────────────────────────────
function renderPenalizacionBadge(item) {
  if (!item.penalizacion_gestion) return '';
  const pct = Math.round(item.penalizacion_gestion * 100);
  return `<span class="badge-penalizacion" title="Penalización por gestión deficiente: +${pct}%">+${pct}%</span>`;
}

// ─── HELPER: CÁLCULO DE ANTIGÜEDAD ───────────────────────────────────────────
// Días desde la apertura del hallazgo hasta hoy.
function calcAntiguedad(fechaApertura) {
  if (!fechaApertura) return null;
  const today   = new Date(); today.setHours(0,0,0,0);
  const apertura = new Date(fechaApertura + 'T00:00:00');
  return Math.round((today - apertura) / (1000 * 60 * 60 * 24));
}

// ─── TRIAGE BAR ──────────────────────────────────────────────────────────────
// Banda de situación: visible solo cuando hay flags activos.
// Muestra qué escalar hoy con un clic para aplicar el filtro correspondiente.
function renderTriageBar(data) {
  const bar = document.getElementById('triageBar');
  if (!bar) return;

  const cv  = data.filter(d => d.riskFlags?.includes('critico-vencido')).length;
  const so  = data.filter(d => d.riskFlags?.includes('sin-owner')).length;
  const hc  = data.filter(d => d.riskFlags?.includes('hallazgo-critico-abierto')).length;
  const asa = data.filter(d => d.riskFlags?.includes('aceptado-sin-aprobador')).length;
  const total = cv + so + hc + asa;

  if (!total) {
    bar.style.display = 'none';
    bar.innerHTML = '';
    return;
  }

  bar.style.display = 'flex';
  bar.innerHTML = `
    <span class="triage-label">TRIAGE</span>
    ${cv  ? `<button class="triage-item triage-critico-vencido" onclick="triageFilter('vencido','')">⚡ ${cv} crítico${cv>1?'s':''} + vencido${cv>1?'s':''}</button>` : ''}
    ${so  ? `<button class="triage-item triage-sin-owner"       onclick="triageFilter('','')">◎ ${so} sin owner</button>` : ''}
    ${hc  ? `<button class="triage-item triage-hallazgo-critico" onclick="triageFilter('','Abierto')">▲ ${hc} crítico${hc>1?'s':''} abierto${hc>1?'s':''}</button>` : ''}
    ${asa ? `<button class="triage-item triage-aceptado-sin-aprobador" onclick="triageFilter('','')">⚠ ${asa} aceptación sin aprobador</button>` : ''}
    <span class="triage-hint">→ clic para filtrar · ${total} situación${total>1?'es':''} requieren atención</span>`;
}

// Aplica filtros desde el triage bar
function triageFilter(aging, hallazgo) {
  const elAging    = document.getElementById('filterAging');
  const elHallazgo = document.getElementById('filterHallazgo');
  if (elAging    && aging)    elAging.value    = aging;
  if (elHallazgo && hallazgo) elHallazgo.value = hallazgo;
  applyFilters();
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
  ['filterDominio','filterPrioridad','filterImpacto','filterCompliance','filterEstado','filterHallazgo','filterAging','filterDecision']
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
  const decision = document.getElementById('filterDecision')?.value  || '';

  filteredData = fullData.filter(d =>
    (!dom      || d.dominio === dom) &&
    (!pri      || d.prioridad === pri) &&
    (!imp      || d.impacto === imp) &&
    (!comp     || d.implicancia_compliance === comp) &&
    (!estado   || d.estado_control === estado) &&
    (!hallazgo || d.estado_hallazgo === hallazgo) &&
    (!aging    || d.agingStatus === aging) &&
    (!decision || d.decision_riesgo === decision)
  );
  selectedId = null;
  if (sortField) applySort();
  renderSummary(filteredData);
  renderTable(filteredData);
  renderCards(filteredData);
  clearDetail();
}

function resetFilters() {
  ['filterDominio','filterPrioridad','filterImpacto','filterCompliance','filterEstado','filterHallazgo','filterAging','filterDecision']
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

  // Contar flags críticos para el resumen
  const flagCriticos = data.filter(d => d.riskFlags && d.riskFlags.length > 0).length;

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

  renderTriageBar(data);
}

// ─── TABLA (DESKTOP) ─────────────────────────────────────────────────────────
// v1.4: flags de riesgo compuestos visibles en columna de riesgo
function renderTable(data) {
  const tbody = document.getElementById('tableBody');
  const empty = document.getElementById('emptyState');
  tbody.innerHTML = '';
  if (!data.length) { empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  data.forEach(item => {
    const tr = document.createElement('tr');
    if (item.id === selectedId)                                  tr.classList.add('selected');
    if (item.agingStatus === 'vencido')                          tr.classList.add('row-vencido');
    if (item.riskFlags?.includes('critico-vencido'))             tr.classList.add('row-critico-vencido');

    const rr = riesgoNivel(item.riesgo_residual);

    // Owner: null → alerta naranja
    const ownerHtml = item.owner_remediacion
      ? `<span class="owner-text">${item.owner_remediacion}</span>`
      : `<span class="badge-owner-unset">⚠ Sin asignar</span>`;

    // Risk flags compactos para la celda de riesgo
    const flagsHtml = renderRiskFlags(item);

    // Riesgo residual: muestra base → ajustado cuando hay penalización
    const penalizado = item.penalizacion_gestion && item.riesgo_residual !== item.riesgo_residual_base;
    const pct = penalizado ? Math.round(item.penalizacion_gestion * 100) : 0;
    const rrCell = penalizado
      ? `<div class="riesgo-delta-cell" title="Base: ${item.riesgo_residual_base} → Ajustado por gestión deficiente (+${pct}%): ${item.riesgo_residual}">
           <span class="riesgo-base-val">${item.riesgo_residual_base}</span>
           <span class="riesgo-delta-arrow">→</span>
           <span class="riesgo-num riesgo-${rr.cls}">${item.riesgo_residual}</span>
           <span class="badge-penalizacion">+${pct}%</span>
         </div>`
      : `<span class="riesgo-num riesgo-${rr.cls}" title="${rr.label}">${item.riesgo_residual}</span>`;

    tr.innerHTML = `
      <td class="td-id">${String(item.id).padStart(2, '0')}</td>
      <td><span class="badge-dominio badge-dominio-${item.dominio.toLowerCase()}">${item.dominio}</span></td>
      <td class="td-riesgo">
        ${item.riesgo}
        ${flagsHtml ? `<div class="td-flags">${flagsHtml}</div>` : ''}
      </td>
      <td class="td-estado-hallazgo">
        <span class="badge-estado badge-estado-${estadoClass(item.estado_control)}">${item.estado_control}</span>
        <span class="badge-hallazgo badge-hallazgo-${hallazgoClass(item.estado_hallazgo)}">${item.estado_hallazgo}</span>
      </td>
      <td class="td-riesgo-r">${rrCell}</td>
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
    if (item.riskFlags?.includes('critico-vencido')) card.classList.add('critico-vencido');

    const ownerHtml = item.owner_remediacion
      ? item.owner_remediacion
      : '<span class="badge-owner-unset">⚠ Sin asignar</span>';

    const flagsHtml = renderRiskFlags(item);

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
      ${flagsHtml ? `<div class="audit-card-flags">${flagsHtml}</div>` : ''}
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
// v1.4: orden orientado a decisión (no a información)
//
// 1. Encabezado: riesgo inherente → residual · scoring · badges
// 2. Brecha detectada · resultado · confianza
// 3. Seguimiento del hallazgo (operativo: owner, deadline, decisión, lifecycle)
// 4. Evidencia requerida vs observada + criterio de evaluación
// 5. Observación del auditor
// 6. Análisis de impacto (negocio · operativo · regulatorio)
// 7. Riesgo legal / compliance
// 8. Plan de remediación + contexto del control
function renderDetail(item) {
  const panel = document.getElementById('detailPanel');
  const hint  = document.getElementById('detailHint');
  const cont  = document.getElementById('detailContent');
  const ri    = riesgoNivel(item.riesgo_inherente);
  const rr    = riesgoNivel(item.riesgo_residual);

  panel.classList.add('has-content');
  hint.textContent = `Control #${String(item.id).padStart(2, '0')} · ${item.dominio} · ${item.tipo_control}`;
  cont.className = '';

  // Naturaleza del control + pesos aplicados
  let pesosLabel = '';
  if      (item.naturaleza_control === 'Automatizado') pesosLabel = 'D×0.35 + O×0.65';
  else if (item.naturaleza_control === 'Manual')       pesosLabel = 'D×0.65 + O×0.35';
  else                                                  pesosLabel = 'D×0.50 + O×0.50';

  // Penalización + residual base vs ajustado — visible en el encabezado
  const penalizado = item.penalizacion_gestion && item.riesgo_residual !== item.riesgo_residual_base;
  let penalText = '';
  if (penalizado) {
    const pct = Math.round(item.penalizacion_gestion * 100);
    const motivos = [];
    if (item.agingStatus === 'vencido')          motivos.push('deadline vencido <em>(+15%)</em>');
    if (!item.owner_remediacion)                 motivos.push('sin owner <em>(+10%)</em>');
    if (item.estado_hallazgo === 'Abierto')      motivos.push('hallazgo abierto <em>(+5%)</em>');
    const rrBase = riesgoNivel(item.riesgo_residual_base);
    penalText = `<div class="penalizacion-explicacion">
      <span class="penal-delta">
        Residual base: <span class="riesgo-num riesgo-${rrBase.cls}" style="font-size:11px">${item.riesgo_residual_base}</span>
        &nbsp;→&nbsp;
        Ajustado por gestión: <span class="riesgo-num riesgo-${rr.cls}" style="font-size:11px">${item.riesgo_residual}</span>
        <span class="badge-penalizacion">+${pct}% gestión</span>
      </span>
      <span class="penalizacion-motivos">${motivos.join(' · ')}</span>
    </div>`;
  }

  // ── Sección 3: Seguimiento del hallazgo ───────────────────────────────────
  const ownerDisplay = item.owner_remediacion
    ? item.owner_remediacion
    : `<span class="badge-owner-unset">⚠ Sin responsable asignado — hallazgo sin ownership formal</span>`;

  const agingDisplay = renderAgingBadge(item);
  const agingNote = item.agingStatus === 'vencido'
    ? `<span class="aging-note aging-note-vencido">Deadline vencido hace ${Math.abs(item.diasHastaCompromiso)} día(s). Requiere escalamiento.</span>`
    : item.agingStatus === 'proximo'
    ? `<span class="aging-note aging-note-proximo">Vence en ${item.diasHastaCompromiso} día(s). Confirmar avance.</span>`
    : '';

  const decisionHtml = (() => {
    const dec = item.decision_riesgo || 'Remediar';
    const decClass = dec === 'Aceptado' ? 'aceptado' : dec === 'Transferir' ? 'transferir' : dec === 'Mitigar' ? 'mitigar' : 'remediar';
    let html = `<span class="badge-decision badge-decision-${decClass}">${dec}</span>`;

    if (dec === 'Aceptado') {
      // Aprobador
      html += item.aprobador_riesgo
        ? `<span class="aprobador-tag">Aprobado por: ${item.aprobador_riesgo}</span>`
        : `<span class="badge-owner-unset" style="margin-left:6px">⚠ Sin aprobador formal</span>`;
      // Justificación
      if (item.justificacion_aceptacion) {
        html += `<div class="justificacion-aceptacion">
          <span class="ev-label ev-alerta">⚠ Justificación de aceptación</span>
          <p>${item.justificacion_aceptacion}</p>
        </div>`;
      }
    }
    return html;
  })();

  // Lifecycle del hallazgo: timeline visual
  const diasAbierto = calcAntiguedad(item.fecha_apertura_hallazgo);
  const estaAbierto = !item.fecha_cierre_hallazgo;
  const lifecycleHtml = `
    <div class="lifecycle-timeline">
      <div class="lt-step lt-step-done">
        <div class="lt-dot lt-dot-done"></div>
        <div class="lt-info">
          <span class="lt-label">Apertura</span>
          <span class="lt-date">${formatFecha(item.fecha_apertura_hallazgo)}</span>
        </div>
      </div>
      <div class="lt-connector ${estaAbierto ? 'lt-connector-active' : 'lt-connector-done'}"></div>
      <div class="lt-step ${item.fecha_verificacion ? 'lt-step-done' : 'lt-step-pending'}">
        <div class="lt-dot ${item.fecha_verificacion ? 'lt-dot-done' : 'lt-dot-pending'}"></div>
        <div class="lt-info">
          <span class="lt-label">Verificación</span>
          <span class="lt-date">${item.fecha_verificacion ? formatFecha(item.fecha_verificacion) : 'Pendiente'}</span>
        </div>
      </div>
      <div class="lt-connector ${item.fecha_cierre_hallazgo ? 'lt-connector-done' : 'lt-connector-pending'}"></div>
      <div class="lt-step ${item.fecha_cierre_hallazgo ? 'lt-step-done' : 'lt-step-pending'}">
        <div class="lt-dot ${item.fecha_cierre_hallazgo ? 'lt-dot-done' : 'lt-dot-pending'}"></div>
        <div class="lt-info">
          <span class="lt-label">Cierre</span>
          <span class="lt-date">${item.fecha_cierre_hallazgo ? formatFecha(item.fecha_cierre_hallazgo) : 'Abierto'}</span>
          ${item.motivo_cierre ? `<span class="lt-motivo">${item.motivo_cierre}</span>` : ''}
        </div>
      </div>
    </div>
    ${diasAbierto !== null ? `<div class="lifecycle-antiguedad ${diasAbierto > 180 ? 'ant-alto' : diasAbierto > 60 ? 'ant-medio' : 'ant-normal'}">
      Hallazgo abierto hace <strong>${diasAbierto}</strong> día${diasAbierto !== 1 ? 's' : ''}
      ${diasAbierto > 180 ? ' · Antigüedad elevada — considerar escalamiento' : ''}
    </div>` : ''}`;

  // Risk flags en el detalle
  const flagsDetailHtml = item.riskFlags?.length
    ? `<div class="detail-flags-row">${renderRiskFlags(item)}</div>`
    : '';

  // Explicación del riesgo residual → se muestra junto al scoring, no en sección 3
  const explicacionHeaderHtml = item.explicacion_riesgo_residual
    ? `<div class="explicacion-residual-inline">
        <span class="ev-label ev-criterio" style="font-size:8px">Por qué este residual</span>
        <p style="margin:0;font-size:11px;color:var(--text-secondary);line-height:1.5">${item.explicacion_riesgo_residual}</p>
      </div>`
    : '';

  cont.innerHTML = `<div class="detail-grid">

    <!-- 1. ENCABEZADO: RIESGO I → R -->
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
      ${penalText}
      ${explicacionHeaderHtml}
      ${flagsDetailHtml}
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

    <!-- 3. SEGUIMIENTO DEL HALLAZGO (operativo — decisión) -->
    <div class="detail-cell detail-seguimiento-block span-full">
      <h4>📋 Seguimiento del hallazgo</h4>
      <div class="seguimiento-grid">
        <div class="gestion-row">
          <span class="gestion-label">Owner:</span>
          <span>${ownerDisplay}</span>
        </div>
        <div class="gestion-row">
          <span class="gestion-label">Deadline:</span>
          <span>${formatFecha(item.fecha_compromiso)} &nbsp;${agingDisplay} ${agingNote}</span>
        </div>
        <div class="gestion-row">
          <span class="gestion-label">Decisión de riesgo:</span>
          <span>${decisionHtml}</span>
        </div>
        <div class="gestion-row">
          <span class="gestion-label">Ciclo de vida:</span>
          <span style="flex:1">${lifecycleHtml}</span>
        </div>
      </div>
    </div>

    <!-- 4. EVIDENCIA REQUERIDA VS OBSERVADA -->
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
      ${item.criterio_evaluacion ? `
      <div class="criterio-evaluacion-block">
        <span class="ev-label ev-criterio">Criterio de evaluación</span>
        <p>${item.criterio_evaluacion}</p>
      </div>` : ''}
    </div>

    <!-- 5. OBSERVACIÓN DEL AUDITOR -->
    ${item.observacion_auditor ? `
    <div class="detail-cell span-full detail-observacion-block">
      <h4>🔍 Observación del auditor</h4>
      <p class="observacion-texto">${item.observacion_auditor}</p>
      <div style="margin-top:8px;font-size:11px;color:var(--text-muted)">
        Última revisión: ${item.ultima_revision ?? '—'} · Responsable técnico: ${item.responsable ?? '—'}
      </div>
    </div>` : ''}

    <!-- 6. ANÁLISIS DE IMPACTO -->
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

    <!-- 7. RIESGO LEGAL / COMPLIANCE -->
    <div class="detail-cell detail-legal-block span-full">
      <h4>⚖ Riesgo legal / Compliance</h4>
      <p>${item.riesgo_legal ?? '—'}</p>
      <div style="margin-top:10px;display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <span class="badge-compliance">${item.implicancia_compliance}</span>
        <span style="font-size:11px;color:var(--text-muted)">Por qué importa: ${item.por_que_importa ?? '—'}</span>
      </div>
    </div>

    <!-- 8. PLAN DE REMEDIACIÓN + CONTEXTO -->
    <div class="detail-cell">
      <h4>Plan de remediación</h4>
      <p>${item.plan_remediacion ?? '—'}</p>
      <p style="margin-top:10px;font-size:11px;color:var(--text-muted)">
        Resp. técnico: ${item.responsable} · ${item.frecuencia}
      </p>
    </div>
    <div class="detail-cell">
      <h4>Consecuencia potencial</h4>
      <p>${item.consecuencia_potencial ?? '—'}</p>
      <p style="margin-top:10px">
        <span class="ev-label" style="display:inline">Activo afectado</span>
        <span style="font-size:11px;color:var(--text-secondary)"> ${item.activo_afectado ?? '—'}</span>
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
  cont.innerHTML = '<div class="detail-placeholder"><span>↑</span><p>Clic en cualquier fila o "Ver detalle"</p></div>';
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
