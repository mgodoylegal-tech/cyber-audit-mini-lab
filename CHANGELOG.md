# CHANGELOG — Cyber Audit Mini Lab

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
