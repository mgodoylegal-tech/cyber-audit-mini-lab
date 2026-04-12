# Cyber Audit Mini Lab

> Herramienta de gestión de hallazgos de auditoría de ciberseguridad con enfoque en GRC, riesgo y análisis legal aplicado.

**Live demo →** [mgodoylegal-tech.github.io/cyber-audit-mini-lab](https://mgodoylegal-tech.github.io/cyber-audit-mini-lab)

---

## Qué es esto

Un prototipo funcional de herramienta de gestión de hallazgos de auditoría, construido como activo de portfolio profesional. No es una herramienta de producción ni un SaaS. Es un laboratorio para demostrar criterio técnico y legal en la intersección de GRC, ciberseguridad y derecho.

Está alineado al **NIST Cybersecurity Framework (CSF)** y pensado desde la lógica de quien gestiona hallazgos, no solo de quien los detecta: ¿quién es el responsable? ¿cuándo vence el plan? ¿se aceptó el riesgo con justificación válida? ¿hay deadlines vencidos sin escalamiento?

La diferencia con una matriz técnica típica es la capa legal integrada en cada control: riesgo legal, implicancia de compliance, consecuencia potencial y análisis de impacto negocio/operativo/regulatorio.

---

## Qué hace (v1.3)

- **11 controles** en los **5 dominios NIST CSF**: Identificar, Proteger, Detectar, Responder, Recuperar
- **Modelo de datos estructurado** en 4 sub-bloques por control:
  - `control_definition`: definición del control, activo afectado, tipo, naturaleza, criterios de evaluación, análisis legal
  - `audit_assessment`: evidencia observada en campo, brecha detectada, scoring D/O, resultado de prueba, confianza del auditor
  - `remediation_tracking`: owner de remediación, deadline, estado del hallazgo, decisión de riesgo, justificación de aceptación
  - `impact_analysis`: impacto en negocio, operativo y regulatorio
- **Scoring ponderado por naturaleza del control**:
  - Automatizado: D×0.35 + O×0.65 (la operación pesa más — sin ejecución, no hay automatización)
  - Manual: D×0.65 + O×0.35 (el diseño pesa más — el procedimiento es el activo principal)
  - Híbrido: D×0.50 + O×0.50
- **Aging de hallazgos** con semáforo visual:
  - 🔴 Vencido: deadline superado, badge rojo pulsante, fila resaltada
  - 🟠 Próximo: ≤7 días para vencer, badge naranja
  - ⚪ En término: más de 7 días, badge neutro
- **Gestión de ownership**: owners sin asignar detectados y señalizados visualmente
- **Decisión de riesgo** por hallazgo: Remediar / Aceptado / Transferir / Mitigar — con bloque de justificación cuando se acepta
- **Dataset con imperfecciones deliberadas** que simulan situaciones reales de auditoría:
  - C04: contradicción diseño=4 / operación=1 (programa bien documentado, sin ejecución)
  - C06: riesgo aceptado con justificación insuficiente
  - C08: owner de remediación sin asignar
  - C10: deadline vencido sin avance reportado
  - C11: deadline próximo a vencer
- **Filtros** por dominio, impacto, prioridad, estado del control, hallazgo, aging e implicancia compliance
- **Columnas de gestión**: Estado/Hallazgo · Riesgo Residual · Owner · Deadline · Aging
- **Ordenamiento** por riesgo residual, deadline y aging (clic en columna)
- **Panel de detalle** con 9 secciones: brecha → evidencia → impacto triple → análisis legal → gestión del hallazgo (owner, aging, decisión de riesgo, justificación)
- **Vista responsive**: tabla en desktop, cards en mobile con aging badge visible

---

## Qué NO hace (honestidad sobre el alcance)

- No persiste datos (sin backend, sin base de datos)
- No permite editar controles desde la interfaz
- No genera reportes exportables
- No tiene autenticación ni multiusuario
- No es una herramienta de auditoría certificada ni reemplaza un GRC enterprise

Estas limitaciones son intencionales para mantener el stack simple y el foco en el criterio metodológico.

---

## Cómo recorrer este laboratorio

El lab está diseñado para seguir el flujo de una auditoría real:

**1. Panorama general (métricas de resumen)**
Las tarjetas superiores muestran el estado actual: hallazgos activos, controles sin implementación, deadlines vencidos o próximos, y efectividad promedio ponderada del modelo de control.

**2. Identificar prioridades urgentes (filtro Aging)**
Filtrá por "Deadline: Vencido" para ver qué controles tienen compromisos de remediación incumplidos sin escalamiento. Combinalo con "Hallazgo: Abierto" para identificar los casos más críticos.

**3. Detectar anomalías en el dataset**
Buscá el control con la mayor brecha entre diseño y operación (C04: D=4, O=1). Identificá el hallazgo con riesgo aceptado sin justificación robusta (C06). Encontrá el control sin owner asignado (C08). Estas imperfecciones reflejan patrones reales que aparecen en auditorías.

**4. Analizar cada control (panel de detalle)**
Al hacer clic en una fila se abre el análisis completo. El orden importa: primero la **brecha detectada**, luego evidencia requerida vs observada, luego impacto triple, análisis legal, y finalmente la **sección de gestión** con owner, deadline con aging, y decisión de riesgo.

**5. Modificar el dataset**
Todo el modelo de datos está en `data/audit_matrix.json`. Podés agregar controles, cambiar estados, actualizar fechas de compromiso o cargar datos de una organización real sin tocar el código.

---

## Caso de uso

**Contexto:** Auditoría de ciberseguridad inicial a una fintech de tamaño mediano en Argentina, bajo supervisión del BCRA.

**Flujo de trabajo con el lab:**

1. El auditor carga la herramienta y ve inmediatamente: "1 deadline vencido, 1 próximo a vencer"
2. Filtra por "Vencido" → ve el control C10 (contención forense) con deadline superado hace 6 días sin avance
3. Filtra por "Hallazgo: Aceptado" → ve C06 (supply chain) con una justificación de aceptación que no tiene sustento cuantitativo
4. Abre C08 → el owner de remediación es null, el hallazgo no tiene responsable formal
5. Abre C04 → la sección de gestión muestra scoring D=4/O=1: el programa de phishing está bien diseñado y no se está ejecutando
6. El auditor documenta estos 4 hallazgos como ítems de seguimiento prioritario para el informe final

Este flujo convierte el lab en un **soporte de seguimiento de compromisos**, no solo en una pantalla de datos.

---

## Decisiones de diseño

**¿Por qué no React ni otro framework?**
El objetivo es demostrar criterio GRC y metodología de auditoría, no arquitectura frontend. Un stack mínimo hace que el foco esté en el modelo de datos y la lógica de negocio. También permite que cualquier profesional legal pueda modificar el JSON sin entender el ecosistema JavaScript moderno.

**¿Por qué JSON con sub-objetos?**
La estructura `control_definition / audit_assessment / remediation_tracking / impact_analysis` refleja la separación conceptual real de una auditoría: el diseño del control, lo que se encontró en campo, cómo se gestiona el hallazgo, y cuál es el impacto. Es un modelo de datos más defensible y extensible que un objeto plano.

**¿Por qué scoring ponderado por naturaleza?**
Un control Automatizado que está bien diseñado pero no opera no aporta nada — la operación pesa más. Un control Manual sin procedimiento documentado tampoco — el diseño pesa más. El promedio simple ignora esta distinción. El ponderado la hace explícita.

**¿Por qué imperfecciones deliberadas en el dataset?**
Una herramienta de auditoría sin casos edge cases no demuestra criterio. La contradicción D/O en C04, el riesgo aceptado sin sustento en C06, el owner null en C08 y los deadlines vencidos en C10/C11 son situaciones que ocurren en toda auditoría real.

**¿Por qué GitHub Pages?**
Hosting gratuito, sin fricción, con URL pública. Para un prototipo de portfolio es suficiente y elimina la necesidad de configurar infraestructura.

---

## Stack técnico

HTML5 · CSS3 puro · JavaScript vanilla (ES6+) · JSON externo · GitHub Pages

Sin frameworks. Sin dependencias. Sin build tools. Sin node_modules en producción.

---

## Estructura del proyecto

```
cyber-audit-mini-lab/
├── index.html              # Estructura, layout y filtros
├── styles.css              # Sistema de diseño completo
├── script.js               # Lógica: flattening, scoring ponderado, aging, filtros, renderizado
├── CHANGELOG.md            # Historial de versiones
└── data/
    └── audit_matrix.json   # Modelo de datos: 11 controles en 4 sub-bloques
```

---

## Cómo ejecutarlo localmente

```bash
# Python
python -m http.server 8080

# Node
npx serve .

# VS Code → extensión Live Server → clic derecho en index.html → Open with Live Server
```

Requiere servidor local porque usa `fetch()` para cargar el JSON. Abrir `index.html` directamente en el navegador no funciona por restricciones CORS.

---

## Controles incluidos (v1.3)

11 controles cubriendo los 5 dominios del NIST CSF.

| # | Dominio | Tipo | Estado | Hallazgo | Deadline | Nota |
|---|---------|------|--------|----------|----------|------|
| 01 | Identificar | Preventivo | Parcial | En curso | 31/05/26 | Shadow IT / IA no autorizada |
| 02 | Proteger | Preventivo | Parcial | Abierto | 30/04/26 | MFA ausente en cuentas privilegiadas |
| 03 | Proteger | Preventivo | Implementado | En curso | 30/04/26 | Vulnerabilidades en sistemas legacy |
| 04 | Proteger | Preventivo | Parcial | En curso | 30/06/26 | ⚠ Contradicción D=4/O=1: phishing IA |
| 05 | Recuperar | Correctivo | No implementado | Abierto | 31/05/26 | Ransomware / backups en red |
| 06 | Identificar | Preventivo | Parcial | Aceptado | 30/06/26 | ⚠ Riesgo aceptado sin sustento cuantitativo |
| 07 | Detectar | Detectivo | No implementado | Abierto | 30/09/26 | Ausencia de monitoreo SIEM |
| 08 | Detectar | Detectivo | Parcial | Abierto | 31/12/26 | ⚠ Owner sin asignar — UEBA ausente |
| 09 | Responder | Correctivo | No implementado | Abierto | 30/04/26 | IRP ausente / notificación BCRA |
| 10 | Responder | Correctivo | No implementado | Abierto | 05/04/26 | 🔴 VENCIDO — Contención forense |
| 11 | Recuperar | Correctivo | No implementado | En curso | 14/04/26 | 🟠 PRÓXIMO — Backup sin prueba |

---

## Modelo de scoring (v1.3)

```
riesgo_inherente = impacto_num × probabilidad

efectividad_control = diseno × wD + operacion × wO
  donde:
    Automatizado → wD=0.35, wO=0.65
    Manual       → wD=0.65, wO=0.35
    Híbrido      → wD=0.50, wO=0.50

riesgo_residual = inherente × (1 − efectividad/5 × 0.7)
```

La efectividad máxima reduce el riesgo residual hasta un 70% del inherente. Ningún control elimina el riesgo completamente.

La separación diseño/operación refleja una distinción central en auditoría: un control puede estar perfectamente documentado (diseño=5) y sin embargo no estar funcionando (operación=1). El C04 de este dataset lo ilustra: D=4, O=1 — programa de phishing aprobado, ejecutado al 25%.

---

## Roadmap

- [ ] Edición inline de estados, observaciones y fechas desde la interfaz
- [ ] Exportación de reporte de auditoría en PDF con hallazgos filtrados
- [ ] Trazabilidad de auditoría: historial de cambios por control
- [ ] Soporte para múltiples frameworks: ISO 27001, CIS Controls v8
- [ ] Scoring de riesgo con ponderación configurable por sector (fintech, salud, gobierno)
- [ ] Backend mínimo con persistencia para trabajo en equipo (SQLite o similar)
- [ ] Tablero de seguimiento de remediaciones con notificaciones de vencimiento

---

## Contexto profesional

Construido por **Matías Godoy**, abogado trabajando en la intersección de fraude bancario digital, compliance y ciberseguridad aplicada al derecho. Este lab es parte de un portfolio técnico orientado a roles en Legal-Tech y GRC.

[@mgodoylegal-tech](https://github.com/mgodoylegal-tech)
