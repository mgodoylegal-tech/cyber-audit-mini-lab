let fullData = [], filteredData = [], selectedId = null;
async function init() {
  try {
    const res = await fetch('data/audit_matrix.json');
    fullData = await res.json();
    filteredData = [...fullData];
    buildFilters(); renderSummary(filteredData); renderTable(filteredData); bindFilters();
  } catch(err) {
    document.getElementById('tableBody').innerHTML = '<tr><td colspan="8" style="text-align:center;color:#f87171;padding:20px">Error al cargar audit_matrix.json — usá Live Server</td></tr>';
  }
}
function buildFilters() {
  const dominios = [...new Set(fullData.map(d => d.dominio))];
  const sel = document.getElementById('filterDominio');
  dominios.forEach(d => { const o = document.createElement('option'); o.value = d; o.textContent = d; sel.appendChild(o); });
}
function bindFilters() {
  ['filterDominio','filterPrioridad','filterImpacto','filterCompliance'].forEach(id => document.getElementById(id).addEventListener('change', applyFilters));
  document.getElementById('btnReset').addEventListener('click', resetFilters);
}
function applyFilters() {
  const dom = document.getElementById('filterDominio').value;
  const pri = document.getElementById('filterPrioridad').value;
  const imp = document.getElementById('filterImpacto').value;
  const comp = document.getElementById('filterCompliance').value;
  filteredData = fullData.filter(d => (!dom||d.dominio===dom) && (!pri||d.prioridad===pri) && (!imp||d.impacto===imp) && (!comp||d.implicancia_compliance===comp));
  selectedId = null; renderSummary(filteredData); renderTable(filteredData); clearDetail();
}
function resetFilters() {
  ['filterDominio','filterPrioridad','filterImpacto','filterCompliance'].forEach(id => document.getElementById(id).value='');
  filteredData = [...fullData]; selectedId = null; renderSummary(filteredData); renderTable(filteredData); clearDetail();
}
function renderSummary(data) {
  const total = data.length, criticos = data.filter(d=>d.impacto==='Crítico').length, pCritica = data.filter(d=>d.prioridad==='Crítica').length;
  const avgMad = total ? (data.reduce((s,d)=>s+d.madurez,0)/total).toFixed(1) : '—';
  const dominios = new Set(data.map(d=>d.dominio)).size;
  const madPct = total ? (avgMad/5*100).toFixed(0) : 0;
  document.getElementById('summary').innerHTML = `
    <div class="stat-card"><span class="stat-label">Controles en revisión</span><div class="stat-value">${total}</div><div class="stat-sub">de ${fullData.length} totales</div></div>
    <div class="stat-card card-alert"><span class="stat-label">Impacto Crítico</span><div class="stat-value">${criticos}</div><div class="stat-sub">requieren atención inmediata</div></div>
    <div class="stat-card card-warn"><span class="stat-label">Prioridad Crítica</span><div class="stat-value">${pCritica}</div><div class="stat-sub">sin demora aceptable</div></div>
    <div class="stat-card"><span class="stat-label">Madurez promedio</span><div class="stat-value">${avgMad}</div><div class="stat-sub">sobre escala 1—5</div><div class="madurez-bar"><div class="madurez-fill" style="width:${madPct}%"></div></div></div>
    <div class="stat-card"><span class="stat-label">Dominios NIST</span><div class="stat-value">${dominios}</div><div class="stat-sub">cubiertos en vista actual</div></div>`;
  document.getElementById('filterCount').textContent = data.length===fullData.length ? `Mostrando todos (${data.length})` : `${data.length} resultado${data.length!==1?'s':''} filtrado${data.length!==1?'s':''}`;
}
function renderTable(data) {
  const tbody = document.getElementById('tableBody'), empty = document.getElementById('emptyState');
  tbody.innerHTML = '';
  if (!data.length) { empty.style.display='block'; return; }
  empty.style.display = 'none';
  data.forEach(item => {
    const tr = document.createElement('tr');
    if (item.id===selectedId) tr.classList.add('selected');
    tr.innerHTML = `
      <td class="td-id">${String(item.id).padStart(2,'0')}</td>
      <td><span class="badge-dominio badge-dominio-${item.dominio.toLowerCase()}">${item.dominio}</span></td>
      <td class="td-riesgo">${item.riesgo}</td>
      <td><span class="badge badge-${item.impacto==='Crítico'?'critico':'alto'}">${item.impacto}</span></td>
      <td><span class="badge badge-prioridad-${item.prioridad==='Crítica'?'critica':'alta'}">${item.prioridad}</span></td>
      <td>${item.responsable}</td>
      <td>${renderDots(item.madurez)}</td>
      <td><span class="badge-compliance">${item.implicancia_compliance}</span></td>`;
    tr.addEventListener('click', () => { selectedId=item.id; document.querySelectorAll('#tableBody tr').forEach(r=>r.classList.remove('selected')); tr.classList.add('selected'); renderDetail(item); });
    tbody.appendChild(tr);
  });
}
function renderDots(madurez, max=5) {
  return `<div class="madurez-dots">${Array.from({length:max},(_,i)=>`<div class="dot ${i<madurez?'active':''}"></div>`).join('')}</div>`;
}
function renderDetail(item) {
  const panel = document.getElementById('detailPanel'), hint = document.getElementById('detailHint'), cont = document.getElementById('detailContent');
  panel.classList.add('has-content'); hint.textContent = `Control #${String(item.id).padStart(2,'0')} · ${item.dominio}`; cont.className = '';
  cont.innerHTML = `<div class="detail-grid">
    <div class="detail-riesgo-header">
      <div class="detail-riesgo-title">${item.riesgo}</div>
      <div class="detail-badges">
        <span class="badge badge-${item.impacto==='Crítico'?'critico':'alto'}">${item.impacto}</span>
        <span class="badge badge-prioridad-${item.prioridad==='Crítica'?'critica':'alta'}">${item.prioridad}</span>
        <span class="badge-dominio badge-dominio-${item.dominio.toLowerCase()}">${item.dominio}</span>
      </div>
    </div>
    <div class="detail-cell"><h4>Objetivo del control</h4><p>${item.objetivo_control}</p></div>
    <div class="detail-cell"><h4>Control esperado</h4><p>${item.control_esperado}</p></div>
    <div class="detail-cell span-full"><h4>Evidencia mínima aceptable</h4>
      <div class="evidencia-split">
        <div class="evidencia-block"><span class="ev-label">Diseño del control</span><p>${item.evidencia_minima.diseno}</p></div>
        <div class="evidencia-block"><span class="ev-label">Funcionamiento del control</span><p>${item.evidencia_minima.funcionamiento}</p></div>
      </div>
    </div>
    <div class="detail-cell"><h4>Criterio de evaluación</h4><p>${item.criterio_evaluacion}</p></div>
    <div class="detail-cell"><h4>Responsable / Frecuencia</h4><p><strong>${item.responsable}</strong> · ${item.frecuencia}</p></div>
    <div class="detail-cell"><h4>Hallazgo potencial de auditoría</h4><p>${item.hallazgo_potencial}</p></div>
    <div class="detail-cell"><h4>Plan de remediación</h4><p>${item.plan_remediacion}</p></div>
    <div class="detail-cell span-full"><h4>Implicancia legal / Compliance</h4><p><span class="badge-compliance">${item.implicancia_compliance}</span> &nbsp;·&nbsp; Madurez actual: ${renderDots(item.madurez)}</p></div>
  </div>`;
  setTimeout(()=>document.getElementById('detailPanel').scrollIntoView({behavior:'smooth',block:'nearest'}),80);
}
function clearDetail() {
  const panel=document.getElementById('detailPanel'), hint=document.getElementById('detailHint'), cont=document.getElementById('detailContent');
  panel.classList.remove('has-content'); hint.textContent='Seleccioná una fila para ver el análisis completo';
  cont.className='detail-empty'; cont.innerHTML='<div class="detail-placeholder"><span>↑</span><p>Clic en cualquier fila de la tabla</p></div>';
}
init();
