# Cyber Audit Mini Lab

> Herramienta de gestión de hallazgos de auditoría de ciberseguridad — NIST CSF · GRC · Legal-Tech

**Live demo →** [mgodoylegal-tech.github.io/cyber-audit-mini-lab](https://mgodoylegal-tech.github.io/cyber-audit-mini-lab)

---

## Qué es esto

Un prototipo funcional de herramienta de gestión de hallazgos de auditoría de ciberseguridad, construido como activo de portfolio profesional. No es una herramienta de producción ni un SaaS. Es un laboratorio para demostrar criterio técnico, metodológico y legal en la intersección de GRC, ciberseguridad y derecho.

La diferencia con una matriz técnica típica es la capa legal integrada en cada control: riesgo legal, implicancia de compliance, consecuencia potencial y análisis de impacto negocio/operativo/regulatorio.

Está pensado desde la lógica de quien **gestiona hallazgos**, no solo de quien los detecta: ¿quién es el responsable? ¿cuándo vence el plan? ¿se aceptó el riesgo con justificación válida? ¿hay deadlines vencidos sin escalamiento? ¿el riesgo residual refleja la realidad de la gestión, no solo la del control?

---

## Capturas

*(Capturas del demo en vivo — actualizar con `docs/screenshot-desktop.png` y `docs/screenshot-mobile.png`)*

| Dashboard desktop | Vista mobile |
|---|---|
| *Ver demo en vivo* | *Ver demo en vivo* |

---

## Doble capa: análisis + gestión

El proyecto implementa dos capas bien diferenciadas:

**Capa 1 — Análisis (dashboard)**
Los 5 stat cards del encabezado dan una lectura ejecutiva inmediata: controles en revisión, impacto crítico, hallazgos activos, estado de deadlines y efectividad promedio. Es la capa de comprensión: ¿qué tan malo está el programa de controles?

**Capa 2 — Gestión (operativo)**
La tabla, los filtros y el panel de detalle son la capa de acción: ¿qué hago con cada hallazgo? ¿quién es el responsable? ¿cuándo vence? ¿la decisión de aceptar el riesgo está justificada? El panel de detalle está ordenado por prioridad de decisión, no de información.

Esta distinción es intencional: en una auditoría real, el análisis se hace una vez; la gestión se hace todos los días.

---

## Modelo de datos (v1.4)

Cada control está modelado con 4 sub-objetos:

```
control_definition       → qué es el control y qué debería hacer
audit_assessment         → qué encontró el auditor en campo
remediation_tracking     → cómo se gestiona la remediación
impact_analysis          → qué pasa si el control falla
```

### remediation_tracking — campos del lifecycle

```json
{
  "estado_hallazgo":            "Abierto | En curso | Mitigado | Aceptado | Cerrado",
  "owner_remediacion":          "Nombre / área responsable (puede ser null — C08)",
  "fecha_compromiso":           "YYYY-MM-DD",
  "fecha_apertura_hallazgo":    "YYYY-MM-DD",
  "fecha_cierre_hallazgo":      null,
  "motivo_cierre":              null,
  "decision_riesgo":            "Remediar | Aceptado | Transferir | Mitigar",
  "aprobador_riesgo":           "Nombre del aprobador (solo si decision = Aceptado)",
  "justificacion_aceptacion":   "Texto libre — visible con bloque de alerta en UI",
  "explicacion_riesgo_residual":"Por qué el riesgo residual es este valor"
}
```

---

## Glosario operativo

**Riesgo inherente (I)**
El riesgo sin considerar ningún control. Fórmula: `Impacto (1-5) × Probabilidad (1-5)`. Valor máximo: 25. Representa el escenario de partida antes de cualquier mitigación.

**Riesgo residual (R)**
El riesgo que queda después de aplicar el control. Fórmula base: `Inherente × (1 − (Efectividad/5 × 0.7))`. El 0.7 es el coeficiente de reducción máxima: incluso un control perfecto no elimina todo el riesgo.

**Penalizaciones de gestión (v1.4)**
El riesgo residual no solo depende de la efectividad del control. Un hallazgo mal gestionado tiene más riesgo real que el calculado:
- Deadline vencido → +15%
- Sin owner asignado → +10%
- Hallazgo en estado Abierto (sin iniciar) → +5%
El resultado está siempre limitado al riesgo inherente (techo natural).

**D · O (Diseño · Operación)**
Los dos ejes de evaluación de un control. El diseño mide si el control está bien conceptualizado. La operación mide si se ejecuta en la práctica. Un control con D=4 y O=1 es un programa bien documentado que nadie ejecuta — el peor escenario metodológicamente.

**Scoring ponderado por naturaleza**
La ponderación entre D y O varía según el tipo de control:
- Automatizado: D×0.35 + O×0.65 — si no opera, el código no vale nada
- Manual: D×0.65 + O×0.35 — el procedimiento es el activo principal
- Híbrido: D×0.50 + O×0.50

**Aging**
Días hasta (o desde) el deadline de remediación. Semáforo: 🔴 Vencido / 🟠 ≤7 días / ⚪ En término. Un hallazgo vencido sin avance no es solo un problema operativo — es evidencia de que la gestión falló.

**Owner vs Estado**
El Owner es el responsable de ejecutar la remediación. El Estado del hallazgo refleja el avance. Pueden contradecirse: un hallazgo puede tener owner asignado y seguir "Abierto" porque no se inició. C08 es el caso extremo: owner nulo, hallazgo abierto crítico.

**Risk Flags (v1.4)**
Señales de alerta compuestas que superan el scoring individual:
- ⚡ Crítico vencido: riesgo alto/crítico + deadline vencido
- ◎ Sin owner: hallazgo sin responsable formal
- ▲ Abierto crítico: hallazgo Abierto con impacto Alto/Crítico
- ⚠ Aceptado sin aprobador: decisión de aceptar sin autorización documentada

---

## Dataset: imperfecciones deliberadas

El dataset simula situaciones reales de auditoría. No es un conjunto de controles "bien implementados" — es una muestra representativa de lo que se encuentra en campo:

| Control | Imperfección |
|---------|-------------|
| C04 | Contradicción diseño=4 / operación=1: programa bien documentado, ejecutado al 25%. La brecha más pronunciada del dataset. |
| C06 | Riesgo aceptado sin análisis cuantitativo. La justificación carece de sustento técnico. El auditor lo documenta explícitamente. |
| C08 | Owner de remediación nulo. Hallazgo sin responsable formal — sin ownership, no hay remediación posible. |
| C10 | Deadline vencido sin avance documentado. El sistema lo penaliza: riesgo residual ajustado al inherente. |
| C11 | Deadline próximo (≤7 días). Badge naranja de alerta. |

---

## Caso de uso: auditoría fintech / banco digital

**Escenario**: Auditoría de ciberseguridad en un banco digital regulado por el BCRA (Argentina). El equipo de auditoría interna debe presentar un informe al Directorio y al regulador con el estado del programa de controles.

**Flujo de trabajo con la herramienta**:

1. El auditor carga los resultados de las pruebas en `audit_matrix.json` con los 4 sub-objetos por control.
2. La herramienta calcula automáticamente el riesgo residual con penalizaciones por gestión deficiente.
3. El filtro por `filterAging = vencido` muestra inmediatamente los hallazgos que requieren escalamiento.
4. El filtro por `filterDecision = Aceptado` permite revisar todas las decisiones de aceptación de riesgo y verificar que tengan aprobador documentado.
5. El panel de detalle — ordenado por prioridad de decisión — permite preparar el informe ejecutivo: brecha → seguimiento → evidencia → impacto → legal.
6. C10 (forense) aparece con risk flag ⚡ Crítico vencido y riesgo residual ajustado al inherente (máximo): es el primer hallazgo a escalar.
7. C06 (supply chain) aparece con flag ⚠ Aceptado sin aprobador si el campo `aprobador_riesgo` es nulo — señal de que la aceptación no cumple criterios mínimos de governance.

**Valor agregado para el regulador**: la herramienta demuestra que la organización no solo detecta riesgos, sino que los gestiona con ownership, deadlines y decisiones documentadas. La falta de owner o de aprobador es un hallazgo metodológico en sí mismo.

---

## Decisiones de diseño

**¿Por qué JS vanilla y sin framework?**
El objetivo es demostrar criterio, no dominio de una librería específica. Un framework agrega complejidad sin aportar valor a un prototipo de esta escala. El stack vanilla hace el código completamente auditable — cualquier persona con conocimientos básicos de web puede entender qué hace cada función.

**¿Por qué JSON y no base de datos?**
El JSON actúa como "single source of truth" del dataset de auditoría. Es versionable en Git (cada cambio queda en el historial), es legible por humanos, y es fácilmente reemplazable por una API real sin cambiar nada del frontend. La estructura de 4 sub-objetos por control es la misma que tendría un esquema de base de datos relacional.

**¿Por qué sin backend?**
GitHub Pages permite publicar el prototipo sin infraestructura. El foco está en la capa de presentación y análisis, no en la persistencia. Un backend real cambiaría el prototipo en un producto — y eso está fuera del alcance del portfolio.

**¿Por qué penalizar el riesgo residual por gestión?**
Un control efectivo en papel no mitiga el riesgo si el hallazgo tiene deadline vencido, sin owner y sin avance. La penalización hace que el scoring refleje la realidad operativa, no solo la teórica. Los factores son simples y explicables — condición necesaria para cualquier modelo que deba ser defendido ante un Directorio o regulador.

**¿Por qué ordenar el panel de detalle por decisión y no por información?**
En una auditoría real, el auditor necesita responder preguntas en orden de urgencia: ¿cuál es el riesgo? → ¿cuál es la brecha? → ¿quién es el responsable y cuándo vence? → ¿qué evidencia se tiene? → ¿qué impacto tiene si no se cierra? La sección de seguimiento del hallazgo (owner, deadline, decisión) aparece tercera — antes de evidencia e impacto — porque es la acción inmediata.

---

## Roadmap profesional

El prototipo está acotado deliberadamente. Las siguientes capacidades lo convertirían en una herramienta de auditoría real:

**Persistencia y trazabilidad**
Actualmente el JSON es estático. La siguiente capa sería una API REST con base de datos que mantenga el historial de cambios por hallazgo: quién cambió el owner, cuándo se escaló, qué comentarios se agregaron. Sin trazabilidad, un sistema de gestión de hallazgos no es auditable.

**Reporting exportable**
Generar un PDF ejecutivo con el resumen del programa de controles, los hallazgos críticos y el estado de deadlines. Requiere una capa de renderizado (jsPDF o backend con Puppeteer). El formato del informe debería ser configurable por framework (NIST CSF, ISO 27001, COBIT).

**Multi-framework**
Actualmente alineado a NIST CSF. Extenderlo a ISO 27001 (controles del Anexo A), COBIT 2019 o regulaciones sectoriales (BCRA Com. A 6375) sin cambiar la arquitectura base. El modelo de 4 sub-objetos por control es framework-agnóstico — solo cambia el dataset.

**Edición inline**
Permitir que el auditor actualice el estado del hallazgo, el owner o la fecha de compromiso directamente desde la interfaz. Requiere lógica de validación, control de concurrencia y persistencia. Sin edición, la herramienta es de consulta, no de gestión.

**Multiusuario y roles**
Separar la vista del auditor (puede editar), el owner (puede actualizar su hallazgo), y el management (solo lectura ejecutiva). Requiere autenticación y autorización — la parte técnicamente más compleja de agregar a este stack.

---

## Estructura del repositorio

```
cyber-audit-mini-lab/
├── index.html              — shell HTML: header, filtros, tabla, cards, panel de detalle
├── script.js               — lógica: scoring, aging, filtros, rendering, penalizaciones
├── styles.css              — design system completo: dark theme, badges, responsive
├── data/
│   └── audit_matrix.json   — dataset: 11 controles en estructura de 4 sub-objetos
├── crear-issues.sh         — script para crear issues del roadmap en GitHub
├── CHANGELOG.md            — historial de versiones
└── README.md               — este archivo
```

---

## Stack técnico

| Capa | Tecnología | Decisión |
|------|-----------|---------|
| Frontend | HTML + CSS + JS vanilla | Sin frameworks, sin dependencias, sin build step |
| Datos | JSON estático | Versionable, legible, reemplazable por API |
| Tipografía | JetBrains Mono + Syne | Monospace para datos técnicos, display para títulos |
| Hosting | GitHub Pages | Cero infraestructura, HTTPS automático |
| Versión | v1.4 | Lifecycle fields, penalty scoring, risk flags |

---

## Versiones

| Versión | Descripción |
|---------|------------|
| v1.0 | Matriz básica: scoring D/O, tabla con filtros |
| v1.1 | Badges de dominio, responsive mobile |
| v1.2 | Modelo dual: riesgo inherente + residual, panel de detalle |
| v1.3 | Gestión de hallazgos: owner, aging, decisión, capa legal |
| v1.4 | Lifecycle completo, penalizaciones de gestión, risk flags, panel reordenado |

Ver [CHANGELOG.md](CHANGELOG.md) para el detalle completo.

---

*Matías Godoy · Legal-Tech / GRC / Ciberseguridad · [github.com/mgodoylegal-tech](https://github.com/mgodoylegal-tech)*
