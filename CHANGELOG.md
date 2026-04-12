# CHANGELOG — Cyber Audit Mini Lab

## [v1.4] — 2026-04-12

### Cierre de brechas metodológicas · Coherencia interna · Credibilidad profesional

#### Datos (audit_matrix.json)
- Nuevo campo `fecha_apertura_hallazgo`: fecha de detección del hallazgo (inicio del lifecycle)
- Nuevo campo `fecha_cierre_hallazgo`: fecha de cierre formal (null si el hallazgo sigue abierto)
- Nuevo campo `motivo_cierre`: descripción del cierre (null si sigue abierto)
- Nuevo campo `aprobador_riesgo`: nombre del aprobador formal cuando `decision_riesgo = Aceptado`
  - C06: "Director de Compras" (único control con riesgo aceptado formalmente)
  - Todos los demás: null (señal de alerta visual si son Aceptados)
- Nuevo campo `explicacion_riesgo_residual`: justificación técnica del valor residual calculado
- Todos los 11 controles actualizados con los nuevos campos

#### script.js
- **Penalizaciones de gestión en el scoring de riesgo residual**:
  - Principio: el riesgo no solo depende de la efectividad del control, sino de la calidad de su gestión
  - Deadline vencido → +15% sobre el residual base
  - Sin owner asignado → +10%
  - Hallazgo en estado Abierto (no iniciado) → +5%
  - El resultado está limitado al riesgo inherente (techo natural — nunca puede superarlo)
  - Nuevo campo `penalizacion_gestion` en el objeto enriquecido (null si no aplica)
- **Risk flags de alerta compuestos** (combinaciones de condiciones):
  - `critico-vencido`: riesgo inherente ≥ 12 + deadline vencido
  - `sin-owner`: owner_remediacion = null
  - `hallazgo-critico-abierto`: hallazgo Abierto + impacto Alto/Crítico
  - `aceptado-sin-aprobador`: decision_riesgo = Aceptado + aprobador_riesgo = null
  - Nuevo campo `riskFlags[]` en el objeto enriquecido
- **Panel de detalle reordenado** por prioridad de decisión (no de información):
  1. Encabezado: riesgo inherente → residual + penalización visible
  2. Brecha detectada + resultado + confianza
  3. Seguimiento del hallazgo (owner, deadline, decisión, lifecycle completo)
  4. Evidencia requerida vs observada
  5. Observación del auditor
  6. Análisis de impacto
  7. Riesgo legal / compliance
  8. Plan de remediación + consecuencia
- Nueva sección "Seguimiento del hallazgo" en el detalle:
  - Owner (con alerta si null)
  - Deadline + aging badge + nota contextual
  - Decisión de riesgo + aprobador + justificación de aceptación
  - Lifecycle: fecha apertura / verificación / cierre
  - Explicación del riesgo residual
- `flattenItem()` actualizado con los 5 nuevos campos del lifecycle
- Nuevas funciones helper: `renderRiskFlags()`, `renderPenalizacionBadge()`
- Badge de decisión `Mitigar` con clase CSS propia

#### styles.css
- `.risk-flag-*`: badges compactos para los 4 tipos de flags de riesgo
- `.audit-card.critico-vencido`: borde rojo intenso + box-shadow para cards mobile
- `.audit-table tbody tr.row-critico-vencido`: fondo rojo más marcado que `row-vencido`
- `.badge-penalizacion`: badge naranja compacto visible en tabla y detalle
- `.penalizacion-explicacion`: bloque en el encabezado del detalle con motivos detallados
- `.detail-seguimiento-block`: nueva sección 3 del detalle (reemplaza sección 9)
- `.lifecycle-row`: fila horizontal con fechas del ciclo de vida
- `.lifecycle-label`: label tiny para los campos de lifecycle
- `.aprobador-tag`: chip inline para el nombre del aprobador de riesgo
- `.explicacion-residual-block`: bloque verde tenue con la justificación del residual
- `.aging-note-vencido` / `.aging-note-proximo`: notas contextuales inline junto al badge
- `.audit-card-flags`: contenedor de flags en cards mobile
- `.detail-flags-row`: fila de flags en el encabezado del detalle

#### index.html
- Versión actualizada a v1.4 en header, meta y footer
- Footer con link directo al repositorio

#### README.md
- Reescritura completa al nivel de portfolio profesional:
  - Glosario operativo: Riesgo I/R, D·O, Aging, Owner vs Estado, Risk Flags, Penalizaciones
  - Doble capa explicada: análisis (dashboard) vs gestión (operativo)
  - Caso de uso real: auditoría fintech / banco regulado por BCRA
  - Decisiones de diseño: por qué vanilla, por qué JSON, por qué sin backend, por qué penalizar
  - Roadmap profesional: persistencia, reporting, multi-framework, edición inline, multiusuario
  - Tabla del modelo de datos con todos los campos del lifecycle

---

## [v1.3] — 2026-04-12

### Transformación: de matriz de auditoría a herramienta de gestión de hallazgos

#### Datos (audit_matrix.json)
- Reestructurado completamente en 4 sub-objetos por control:
  - `control_definition` — definición del control, criterios, activo, tipo, naturaleza
  - `audit_assessment` — evidencia observada, brecha, D/O, resultado de prueba
  - `remediation_tracking` — owner, deadline, estado del hallazgo, decisión de riesgo
  - `impact_analysis` — impacto negocio / operativo / regulatorio
- Nuevo campo `decision_riesgo`: Remediar | Aceptado | Transferir | Mitigar
- Nuevo campo `justificacion_aceptacion`: requerido cuando decision_riesgo = Aceptado
- Dataset imperfections (realismo de auditoría real):
  - **C04**: contradicción diseño/operación — diseno=4, operacion=1 (programa bien documentado, sin ejecución)
  - **C06**: riesgo aceptado con justificación insuficiente — `decision_riesgo: "Aceptado"`, estado_hallazgo: "Aceptado"
  - **C08**: owner de remediación sin asignar — `owner_remediacion: null`
  - **C10**: deadline vencido (2026-04-05) — hallazgo Abierto, No implementado
  - **C11**: deadline próximo a vencer (2026-04-14) — hallazgo En curso

#### script.js
- Nueva función `flattenItem()`: aplana el JSON nested → objeto plano para compatibilidad total
- Scoring ponderado por `naturaleza_control` (reemplaza promedio simple):
  - Automatizado: D×0.35 + O×0.65 (la operación pesa más — automatización depende de la ejecución)
  - Manual: D×0.65 + O×0.35 (el diseño pesa más — el procedimiento es el activo principal)
  - Híbrido: D×0.50 + O×0.50 (pesos iguales)
- Nueva función `calcAging()`: calcula días hasta/desde `fecha_compromiso`
  - Estados: `vencido` | `proximo` (≤7d) | `en-termino` | `sin-fecha`
  - Campos enriquecidos: `diasHastaCompromiso`, `agingStatus`
- Nuevo helper `renderAgingBadge()`: renderiza badge de aging por estado
- Nuevo helper `formatFecha()`: formatea fechas YYYY-MM-DD → DD/MM/YY
- Nuevo filtro `filterAging` (Vencido / Próximo / En término)
- Sort por `diasHastaCompromiso` (deadline): nulls al fondo
- Summary: nuevo stat card de "Deadlines" (vencidos o próximos a vencer)
- Tabla: columnas rediseñadas para gestión → # | Dominio | Riesgo | Estado/Hallazgo | Riesgo R | Owner | Deadline | Aging
- Cards mobile: aging badge + clase `.vencido` con borde rojo
- Detalle: nueva sección 9 "Gestión del hallazgo" con owner, deadline, aging, decisión de riesgo y justificación de aceptación; pesos de scoring visibles en el header

#### index.html
- Brand tag: `[ LAB · v1.3 ]`
- Descripción: "Herramienta de gestión de hallazgos" (reemplaza "Prototipo de herramienta de auditoría operativa")
- Nuevos headers de tabla: Estado/Hallazgo | Riesgo R | Owner | Deadline | Aging
- Nuevo `<select id="filterAging">` con opciones Vencido / Próximo / En término

#### styles.css
- `.badge-aging-vencido`: rojo, animación de pulso
- `.badge-aging-proximo`: naranja
- `.badge-aging-termino`: gris neutro
- `.badge-aging-sinfecha`: mínimo, transparente
- `.audit-card.vencido`: borde rojo con box-shadow
- `.row-vencido`: fondo rojo sutil en filas de tabla
- `.stat-card.card-vencido`: variante roja para stat card de deadlines
- `.badge-owner-unset`: badge naranja de advertencia para owner null
- `.badge-decision-*`: badges de decisión de riesgo (remediar/aceptado/transferir)
- `.justificacion-aceptacion`: bloque morado con borde izquierdo para justificaciones de aceptación
- `.detail-gestion-block`: sección 9 del detalle con acento azul
- `.gestion-row` / `.gestion-label`: layout de ítems en la sección de gestión
- `.pesos-label`: chip que muestra los pesos D·O aplicados en el scoring

---

## [v1.2] — 2026-04-10

### Enriquecimiento del modelo de datos y UX

- Reemplazo de `madurez` (1-5) por scoring dual `diseno_control` + `operacion_control` (1-5 cada uno)
- 21 campos por control: activo_afectado, tipo_control, naturaleza_control, evidencia_observada, resultado_prueba, brecha_detectada, nivel_confianza, estado_hallazgo, owner_remediacion, fecha_compromiso, impacto triple (negocio/operativo/regulatorio), etc.
- Filtro por estado de hallazgo (Abierto / En curso / Mitigado / Aceptado / Cerrado)
- Columna sortable "Riesgo I→R" (inherente → residual)
- Panel de detalle con 8 secciones jerárquicas
- 11 controles cubriendo los 5 dominios NIST CSF
- README y manual .docx actualizados

---

## [v1.1] — 2026-04-07

### Expansión a 5 dominios NIST CSF

- Agregado Control 11: pruebas de restauración de backups (dominio Recuperar)
- Completados los 5 dominios: Identificar, Proteger, Detectar, Responder, Recuperar
- Fix: dominio Responder ahora visible en README

---

## [v1.0] — 2026-04-05

### Release inicial

- 10 controles en 4 dominios NIST CSF
- Tabla interactiva con filtros por dominio, prioridad, impacto y compliance
- Panel de detalle con análisis completo por control
- Scoring de madurez (1-5) con visualización de puntos
- README técnico, manual .docx de procedimientos
- Stack: HTML + CSS + JS vanilla, sin frameworks ni backend
- Deploy en GitHub Pages
