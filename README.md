# Cyber Audit Mini Lab

> Capa visual y demo de hallazgos del ecosistema LAALT

**Live demo →** [mgodoylegal-tech.github.io/cyber-audit-mini-lab](https://mgodoylegal-tech.github.io/cyber-audit-mini-lab)

---

## Rol correcto dentro del ecosistema

Cyber Audit Mini Lab no es la sede doctrinal del método, no es la app operativa principal y no es una capa pedagógica. Su rol es más acotado y más valioso:

- mostrar hallazgos de auditoría en una interfaz visual clara
- hacer visible prioridad, aging, responsable, decisión y ciclo de vida
- ofrecer una demo ejecutiva comprensible del enfoque LAALT
- servir como tablero de exposición visual sobre un dataset controlado

En el ecosistema:

| Proyecto | Rol |
|---|---|
| `cyber-audit-core-lab` | Método, doctrina, framework y capa operativa principal |
| `auditor-guide` | Estudio, entrenamiento y razonamiento guiado |
| `cyber-audit-mini-lab` | Visualización / demo / tablero de hallazgos |

El mini-lab toma lenguaje, lógica de scoring y lectura de hallazgos del LAALT, pero no reemplaza al `core-lab` ni compite con `auditor-guide`.

---

## El problema que resuelve

Las matrices de auditoría de ciberseguridad típicas responden a una pregunta: **¿qué tan efectivo es el control?** Esta herramienta responde una pregunta diferente: **¿qué hago con este hallazgo hoy?**

La diferencia no es semántica. Un control con diseño 4/5 y operación 1/5 tiene un riesgo real completamente diferente al que el scoring técnico sugiere. Un deadline vencido sin escalamiento cambia la exposición de la organización, independientemente de cuánto mida la efectividad del control.

Cyber Audit Mini Lab modela esa realidad como capa visual: el riesgo residual incluye penalizaciones explícitas por seguimiento deficiente, el ciclo de vida del hallazgo es un ciudadano de primera clase en el modelo de datos, y el panel de detalle está ordenado por prioridad de decisión, no de información.

---

## Capturas

> Para agregar capturas reales: tomá screenshots del live demo y guardalas en `docs/screenshot-desktop.png` y `docs/screenshot-mobile.png`.

```markdown
![Dashboard desktop](docs/screenshot-desktop.png)
![Vista mobile con aging badges](docs/screenshot-mobile.png)
```

**Lo que verías en las capturas:**
- La **triage bar** roja pulsante con "⚡ 1 crítico + vencido / ◎ 1 sin owner / ▲ 4 críticos abiertos" — la situación del día en una línea
- La columna **Riesgo R** mostrando `13 → 15` con `+20%` cuando el hallazgo tiene penalizaciones de gestión (vencido + abierto)
- El control C10 (Forensics) con fila en rojo intenso, badge "Vencido 7d", risk flag "⚡ Crítico vencido"
- El panel de detalle de C06 mostrando el bloque morado de justificación de aceptación con el aprobador "Director de Compras"
- El timeline de ciclo de vida de C08 con el dot de Apertura en azul y los de Verificación y Cierre en gris (hallazgo sin avance)
- Vista mobile: cards con aging badges visibles sin scroll

---

## Flujo de uso en 4 pasos

**Paso 1 — Leer la situación del día**
La triage bar (si hay flags activos) muestra inmediatamente qué requiere acción hoy: hallazgos críticos con deadline vencido, sin owner, aceptaciones sin aprobador. Cada ítem es clickeable para aplicar el filtro correspondiente.

**Paso 2 — Identificar prioridades con los filtros**
`filterAging = Vencido` → ver los hallazgos con deadline superado. `filterDecision = Aceptado` → auditar todas las decisiones de aceptación de riesgo y verificar que tengan aprobador formal. `filterHallazgo = Abierto` + `filterImpacto = Crítico` → hallazgos de alto impacto sin iniciar.

**Paso 3 — Investigar el hallazgo**
Clic en cualquier fila abre el panel de detalle ordenado por decisión:
brecha → seguimiento visual del hallazgo (responsable, deadline, decisión, ciclo de vida) → evidencia → impacto → legal → remediación.
La explicación del riesgo residual aparece junto al scoring, no al final. El timeline de ciclo de vida muestra visualmente en qué etapa está el hallazgo y cuántos días lleva abierto.

**Paso 4 — Tomar lectura**
La sección de seguimiento visual del hallazgo concentra todo lo necesario para entender qué requiere atención: quién figura como responsable, cuándo vence, qué se decidió, si la aceptación tiene aprobador formal, y por qué el residual es el que es.

---

## Qué decisiones habilita la herramienta

| Pregunta del auditor | Dónde está la respuesta |
|---|---|
| ¿Qué hallazgo escalo hoy? | Triage bar + columna Aging |
| ¿El riesgo residual refleja la gestión real? | Columna `13 → 15` + badge `+20%` |
| ¿Cuánto lleva abierto este hallazgo? | Timeline de ciclo de vida + "Abierto hace N días" |
| ¿Quién figura como responsable y cuándo vence? | Sección Seguimiento visual del hallazgo |
| ¿La aceptación del riesgo tiene respaldo? | Badge "⚠ Aceptado sin aprobador" + justificación |
| ¿Qué evidencia tengo vs qué necesito? | Sección Evidencia requerida vs observada |
| ¿Cuál es la consecuencia legal si no se cierra? | Sección Riesgo legal / Compliance |
| ¿Hay contradicción entre diseño y operación? | C04: D=4 / O=1 visible en los dots del scoring |

---

## Doble capa: análisis + seguimiento visible

**Capa 1 — Análisis (dashboard)**
Los 5 stat cards dan una lectura ejecutiva inmediata: controles en revisión, impacto crítico, hallazgos activos, estado de deadlines y efectividad promedio. Es la capa de comprensión: ¿qué tan sano está el programa de controles?

**Capa 2 — Seguimiento visible (demo)**
La triage bar, la tabla, los filtros y el panel de detalle son la capa de seguimiento visual: ¿qué requiere atención hoy? ¿quién figura como responsable? ¿qué deadline aparece comprometido? ¿el hallazgo está gobernado o deriva? En una auditoría real, la operación vive en el `core-lab`; acá se visualiza esa lógica sobre un dataset demo.

---

## Modelo de datos (v1.4)

Cada control tiene 4 sub-objetos. El más visible en el tablero es `remediation_tracking`:

```json
{
  "estado_hallazgo":             "Abierto | En curso | Mitigado | Aceptado | Cerrado",
  "owner_remediacion":           "Nombre / área (null → flag ◎ Sin responsable)",
  "fecha_compromiso":            "YYYY-MM-DD",
  "fecha_apertura_hallazgo":     "YYYY-MM-DD",
  "fecha_cierre_hallazgo":       null,
  "motivo_cierre":               null,
  "decision_riesgo":             "Remediar | Aceptado | Transferir | Mitigar",
  "aprobador_riesgo":            "Nombre (null + Aceptado → flag ⚠)",
  "justificacion_aceptacion":    "Texto visible en bloque morado en el detalle",
  "explicacion_riesgo_residual": "Justificación técnica del valor residual calculado"
}
```

---

## Glosario visual

**Riesgo inherente (I):** `Impacto (1–5) × Probabilidad (1–5)`. El riesgo sin ningún control. Valor máximo: 25.

**Riesgo residual base (R_base):** `Inherente × (1 − (Efectividad/5 × 0.7))`. El coeficiente 0.7 representa que ningún control elimina el riesgo en su totalidad.

**Riesgo residual ajustado (R):** `R_base × (1 + penalizaciones)`. Capped al inherente. Refleja la calidad del seguimiento visible, no solo del control.

**Penalizaciones de seguimiento:**
- Deadline vencido → +15%: remediación demorada amplifica la exposición real
- Sin responsable → +10%: sin responsable no hay remediación posible
- Hallazgo Abierto → +5%: aún no se inició ninguna acción correctiva

**D · O (Diseño · Operación):** Los dos ejes del scoring. D = está bien concebido. O = se ejecuta en la práctica. Un D=4 / O=1 es un programa bien documentado que nadie ejecuta — el caso C04 del dataset.

**Ponderación por naturaleza:**
- Automatizado: D×0.35 + O×0.65 (sin ejecución, el código no vale nada)
- Manual: D×0.65 + O×0.35 (el procedimiento es el activo principal)
- Híbrido: D×0.50 + O×0.50

**Aging:** Días hasta (o desde) el deadline. 🔴 Vencido / 🟠 ≤7 días / ⚪ En término.

**Antigüedad:** Días desde la apertura del hallazgo hasta hoy. Un hallazgo abierto hace 300 días con riesgo crítico es una señal de governance fallida independientemente del aging.

**Risk Flags:** Alertas compuestas que combinan condiciones:
- ⚡ `critico-vencido`: inherente ≥ 12 + deadline vencido → escalar hoy
- ◎ `sin-owner`: responsable nulo → sin governance formal
- ▲ `hallazgo-critico-abierto`: Abierto + impacto Alto/Crítico → sin acción
- ⚠ `aceptado-sin-aprobador`: decisión sin respaldo formal → auditoría observa

---

## Dataset: imperfecciones deliberadas

| Control | Imperfección metodológica | Señal en la UI |
|---------|--------------------------|----------------|
| C04 | D=4 / O=1: programa documentado, ejecutado al 25% | Dots D=●●●●○ / O=●○○○○ |
| C06 | Aceptado sin análisis cuantitativo — aprobador: Director de Compras | Badge morado + bloque de justificación |
| C08 | Responsable null — hallazgo abierto crítico sin responsable | ◎ Sin responsable + badge naranja |
| C10 | Deadline vencido + hallazgo Abierto → R ajustado al inherente | ⚡ Crítico vencido + `13 → 15` |
| C11 | Deadline próximo (≤7 días) | Badge naranja "2d" |

---

## Caso de uso real: auditoría en banco digital

**Contexto:** Auditoría de ciberseguridad en banco digital regulado por BCRA. El equipo debe presentar un informe al Directorio y al regulador con el estado del programa de controles y las acciones pendientes.

**Cómo resuelve este flujo la herramienta:**

1. Carga del dataset → la triage bar muestra instantáneamente: 1 hallazgo crítico vencido, 1 sin responsable, 4 críticos abiertos.
2. `filterAging = Vencido` → C10 (Forensics) aparece solo, con R=15 (equivalente al inherente), vencido hace 7 días, sin avance.
3. Panel de detalle C10 → la sección de Seguimiento muestra que el plan de remediación existe pero el hallazgo sigue Abierto, el ciclo de vida muestra apertura hace 342 días, y la explicación del residual confirma: "Deadline vencido sin avance. El último incidente destruyó evidencia forense irrecuperable."
4. `filterDecision = Aceptado` → C06 (Supply Chain) aparece con flag ⚠. El auditor verifica que hay aprobador ("Director de Compras") pero la justificación tiene la nota del auditor marcada explícitamente: "la aceptación carece de sustento técnico".
5. El auditor documenta: C10 requiere escalamiento a Directorio esta semana. C06 requiere revisión de la calidad de la aceptación antes de la próxima renovación contractual.

**Valor para el regulador:** La herramienta muestra no solo que se detectaron riesgos, sino cómo se siguieron (o no). Un deadline vencido sin escalamiento, un responsable faltante, o una aceptación sin aprobador son hallazgos de governance en sí mismos.

---

## Decisiones de diseño

**¿Por qué penalizar el residual por seguimiento?**
Un control con efectividad 4/5 no reduce el riesgo si el hallazgo lleva 300 días sin responsable y el deadline venció hace un mes. El scoring técnico sin la capa de seguimiento visible da una falsa sensación de control. La penalización es deliberadamente simple y explicable — condición necesaria para presentarla ante un Directorio o regulador.

**¿Por qué JS vanilla?**
El objetivo es demostrar criterio, no dominio de un framework. El stack vanilla hace el código completamente auditable: cualquier persona con conocimientos básicos de JS puede entender qué hace cada función. Sin build steps, sin dependencias, sin npm vulnerabilities que explicar.

**¿Por qué JSON?**
El JSON actúa como single source of truth versionable en Git. La estructura de 4 sub-objetos es idéntica a lo que tendría un esquema de base de datos relacional — es trivial reemplazarlo por una API REST sin cambiar el frontend.

**¿Por qué sin backend?**
GitHub Pages permite publicar sin infraestructura. El foco está en la capa de análisis y presentación. Un backend cambiaría el prototipo en un producto — diferente scope, diferente propósito.

**¿Por qué el panel de detalle está ordenado por decisión y no por información?**
En campo, la secuencia natural es: ¿cuál es el riesgo? → ¿cuál es la brecha? → ¿quién figura como responsable y cuándo vence? → ¿qué evidencia hay? La sección de seguimiento visual del hallazgo aparece tercera (no última) porque concentra la lectura de atención inmediata.

---

## Limitaciones conscientes de v1.4

Estas limitaciones son intencionales, no deuda técnica:

| Limitación | Razón |
|-----------|-------|
| Edición y trail solo locales | Sirven para simular escenarios en demo, no para operar una auditoría real |
| Sin persistencia compartida | Mantener stack estático y evitar que compita con el core-lab |
| Sin exportación de reportes formales | El foco está en visualización, no en reporting operativo |
| Sin autenticación ni multiusuario | Fuera del alcance de esta capa visual |
| Dataset de 11 controles fijo | Demo de concepto, no dataset de producción |
| No es herramienta doctrinal ni operativa principal | El método y la operación principal viven en el `core-lab` |

---

## Roadmap prudente

| Ítem | Descripción |
|------|------------|
| Refinar framing LAALT | Hacer más explícita la relación con `core-lab` y `auditor-guide` |
| Mejorar UX visual | Ajustar lectura mobile, badges, densidad visual y claridad de triage |
| Dataset alternativo | Sumar una segunda muestra de hallazgos sin cambiar el stack |
| Exportación visual simple | Snapshot descargable o CSV liviano, sin convertirlo en app operativa |
| Terminología | Reducir framing GRC-genérico y reforzar lectura de hallazgos en lenguaje LAALT |

---

## Estructura del repositorio

```
cyber-audit-mini-lab/
├── index.html              — HTML: header, triage bar, filtros, tabla, cards, detalle
├── script.js               — Lógica: scoring, penalizaciones, flags, triage, rendering
├── styles.css              — Design system: dark theme, badges, timeline, responsive
├── data/
│   └── audit_matrix.json   — 11 controles · 4 sub-objetos · ciclo de vida completo
├── crear-issues.sh         — Script para crear issues del roadmap (requiere gh CLI)
├── CHANGELOG.md            — Historial de versiones v1.0 → v1.4
└── README.md               — Este archivo
```

---

## Stack técnico

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| Frontend | HTML + CSS + JS vanilla | Sin dependencias, completamente auditable |
| Datos | JSON · 4 sub-objetos por control | Versionable en Git, reemplazable por API |
| Tipografía | JetBrains Mono + Syne | Monospace para datos, display para títulos |
| Hosting | GitHub Pages | HTTPS automático, cero infraestructura |
| Versión | v1.4 | Triage bar, delta residual, timeline de ciclo de vida |

---

---

## Lugar en el ecosistema LAALT

Cyber Audit Mini Lab es la **capa visual** del ecosistema LAALT. Su función es exponer hallazgos, prioridad, ciclo de vida y seguimiento visible de forma clara, ejecutiva y comprensible.

No reemplaza:
- la doctrina del `cyber-audit-core-lab`
- la operación principal del `cyber-audit-core-lab`
- la capa pedagógica de `auditor-guide`

Sí complementa al ecosistema mostrando cómo se verían los findings en una superficie visual de lectura rápida.

---

*Matias Godoy · Legal-Tech / GRC / Ciberseguridad · [github.com/mgodoylegal-tech](https://github.com/mgodoylegal-tech)*
