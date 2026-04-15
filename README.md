# Cyber Audit Mini Lab

> Capa visual y demo de hallazgos del ecosistema LAALT

**Live demo ->** [mgodoylegal-tech.github.io/cyber-audit-mini-lab](https://mgodoylegal-tech.github.io/cyber-audit-mini-lab)

---

## Rol correcto dentro del ecosistema

Cyber Audit Mini Lab no es la sede doctrinal del metodo, no es la app operativa principal y no es una capa pedagogica. Su rol es mas acotado y mas valioso:

- mostrar hallazgos de auditoria en una interfaz visual clara
- hacer visible prioridad, aging, responsable, decision y ciclo de vida
- ofrecer una demo ejecutiva comprensible del enfoque LAALT
- servir como tablero de exposicion visual sobre un dataset controlado

En el ecosistema:

| Proyecto | Rol |
|---|---|
| `cyber-audit-core-lab` | Metodo, doctrina, framework y capa operativa principal |
| `auditor-guide` | Estudio, entrenamiento y razonamiento guiado |
| `cyber-audit-mini-lab` | Visualizacion / demo / tablero de hallazgos |

El mini-lab toma lenguaje, logica de scoring y lectura de hallazgos del LAALT, pero no reemplaza al `core-lab` ni compite con `auditor-guide`.

---

## El problema que resuelve

Las matrices de auditoria de ciberseguridad tipicas responden a una pregunta: **que tan efectivo es el control?**

Esta herramienta responde una pregunta diferente: **que hago con este hallazgo hoy?**

La diferencia no es semantica. Un control con diseno 4/5 y operacion 1/5 tiene un riesgo real completamente distinto al que el scoring tecnico sugiere. Un deadline vencido sin escalamiento cambia la exposicion de la organizacion, independientemente de cuanto mida la efectividad del control.

Cyber Audit Mini Lab modela esa realidad como capa visual: el riesgo residual incluye penalizaciones explicitas por seguimiento deficiente, el ciclo de vida del hallazgo es una pieza central del modelo de datos, y el panel de detalle esta ordenado por prioridad de decision, no de informacion.

---

## Capturas

Pendiente recomendado:

- `docs/screenshot-desktop.png`
- `docs/screenshot-mobile.png`

Cuando esten disponibles, agregar:

```markdown
![Dashboard desktop](docs/screenshot-desktop.png)
![Vista mobile](docs/screenshot-mobile.png)
```

Lo importante a mostrar en esas capturas:
- triage bar con flags activos
- tabla con residual ajustado visible
- panel de detalle con seguimiento visible
- cards mobile con badges legibles

---

## Flujo de uso en 4 pasos

**Paso 1 - Leer la situacion del dia**  
La triage bar muestra que requiere accion hoy: hallazgos criticos con deadline vencido, sin responsable, aceptaciones sin aprobador. Cada item aplica el filtro correspondiente.

**Paso 2 - Identificar prioridades con los filtros**  
`filterAging = Vencido` para ver deadlines superados.  
`filterDecision = Aceptado` para revisar aceptaciones de riesgo.  
`filterHallazgo = Abierto` + `filterImpacto = Critico` para ver lo mas urgente.

**Paso 3 - Investigar el hallazgo**  
Click en cualquier fila para abrir el panel de detalle ordenado por decision:
brecha -> seguimiento visible -> evidencia -> impacto -> legal -> remediacion.

**Paso 4 - Simular**  
La edicion inline, el trail y el snapshot son simulacion local demo. Sirven para mostrar seguimiento visible, no para operar una auditoria real.

---

## Que decisiones habilita la herramienta

| Pregunta del auditor | Donde esta la respuesta |
|---|---|
| Que hallazgo escalo hoy? | Triage bar + columna Aging |
| El riesgo residual refleja la gestion real? | Delta residual + badge de penalizacion |
| Cuanto lleva abierto este hallazgo? | Timeline + antiguedad |
| Quien figura como responsable y cuando vence? | Seguimiento visible del hallazgo |
| La aceptacion del riesgo tiene respaldo? | Badge y bloque de justificacion |
| Que evidencia tengo vs. que necesito? | Seccion de evidencia |
| Cual es la consecuencia legal si no se cierra? | Seccion Riesgo legal / Compliance |

---

## Doble capa: analisis + seguimiento visible

**Capa 1 - Analisis**  
Los stat cards dan una lectura ejecutiva inmediata: controles en revision, impacto critico, hallazgos activos, estado de deadlines y efectividad promedio.

**Capa 2 - Seguimiento visible**  
La triage bar, la tabla, los filtros y el panel de detalle muestran que requiere atencion hoy. En una auditoria real, la operacion vive en el `core-lab`; aca se visualiza esa logica sobre un dataset demo.

---

## Modelo de datos

Cada control tiene cuatro sub-objetos principales:

```json
{
  "control_definition": {},
  "audit_assessment": {},
  "remediation_tracking": {},
  "impact_analysis": {}
}
```

Nota:
- en UI publica se prioriza `responsable`
- en JSON pueden mantenerse claves como `owner_remediacion` por compatibilidad tecnica

---

## Glosario visual

**Riesgo inherente (I):** `Impacto x Probabilidad`.  
**Riesgo residual base (R_base):** riesgo luego de aplicar efectividad del control.  
**Riesgo residual ajustado (R):** residual base mas penalizaciones de seguimiento visible.

**Penalizaciones de seguimiento**
- deadline vencido -> +15%
- sin responsable -> +10%
- hallazgo abierto -> +5%

**Aging:** dias hasta o desde el deadline.  
**Antiguedad:** dias desde apertura del hallazgo.  
**Risk flags:** alertas compuestas para lectura ejecutiva.

---

## Dataset demo

El dataset actual esta construido para mostrar:
- contradicciones entre diseno y operacion
- hallazgos sin responsable
- aceptaciones con respaldo insuficiente
- deadlines vencidos
- penalizaciones explicables en el residual

No es dataset de produccion. Es una muestra controlada para visualizar criterio.

---

## Caso de uso

Ejemplo:

1. La triage bar muestra hallazgos criticos vencidos y sin responsable.
2. El auditor filtra vencidos.
3. Abre el detalle del hallazgo.
4. Ve brecha, seguimiento visible, evidencia, impacto, lectura legal y remediacion.
5. Usa eso para explicar prioridad y seguimiento a un decisor.

Valor:
La herramienta muestra no solo que se detectaron riesgos, sino como se siguieron o no se siguieron.

---

## Decisiones de diseno

**Por que penalizar el residual por seguimiento?**  
Porque un control razonable en papel no baja realmente el riesgo si el hallazgo sigue vencido, abierto o sin responsable.

**Por que JS vanilla?**  
Porque el objetivo es demostrar criterio y lectura visual con un stack completamente auditable.

**Por que JSON?**  
Porque funciona como fuente versionable simple y permite iterar sin backend.

**Por que sin backend?**  
Porque esta capa no debe competir con la operacion principal del `core-lab`.

---

## Limitaciones conscientes

| Limitacion | Razon |
|-----------|-------|
| Edicion y trail solo locales | Simulacion demo, no operacion real |
| Sin persistencia compartida | Mantener stack estatico y scope acotado |
| Sin reportes operativos formales | El foco es visualizacion |
| Sin autenticacion ni multiusuario | Fuera del alcance de esta capa |
| Dataset fijo | Demo de concepto |

---

## Roadmap prudente

- agregar capturas reales al README
- sumar un segundo dataset demo si hace falta otra narrativa
- seguir puliendo mobile y microcopy
- mantener el framing LAALT sin volverlo pseudo-GRC operativo

---

## Estructura del repositorio

```text
cyber-audit-mini-lab/
|-- index.html
|-- script.js
|-- styles.css
|-- data/
|   `-- audit_matrix.json
|-- crear-issues.sh
|-- CHANGELOG.md
`-- README.md
```

---

## Stack tecnico

| Capa | Tecnologia | Por que |
|------|-----------|---------|
| Frontend | HTML + CSS + JS vanilla | Sin dependencias, completamente auditable |
| Datos | JSON | Simple, versionable y reemplazable |
| Hosting | GitHub Pages | Cero infraestructura |

---

## Lugar en el ecosistema LAALT

Cyber Audit Mini Lab es la **capa visual** del ecosistema LAALT. Su funcion es exponer hallazgos, prioridad, ciclo de vida y seguimiento visible de forma clara, ejecutiva y comprensible.

No reemplaza:
- la doctrina del `cyber-audit-core-lab`
- la operacion principal del `cyber-audit-core-lab`
- la capa pedagogica de `auditor-guide`

Si complementa al ecosistema mostrando como se verian los findings en una superficie visual de lectura rapida.

---

*Matias Godoy - Legal-Tech / GRC / Ciberseguridad - [github.com/mgodoylegal-tech](https://github.com/mgodoylegal-tech)*
