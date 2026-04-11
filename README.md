# Cyber Audit Mini Lab

> Prototipo de herramienta de auditoría operativa de ciberseguridad con enfoque en GRC, riesgo y análisis legal aplicado.

**Live demo →** [mgodoylegal-tech.github.io/cyber-audit-mini-lab](https://mgodoylegal-tech.github.io/cyber-audit-mini-lab)

---

## Qué es esto

Un prototipo funcional de matriz de auditoría, construido como activo de portfolio profesional. No es una herramienta de producción ni un SaaS. Es un laboratorio para demostrar criterio técnico y legal en la intersección de GRC, ciberseguridad y derecho.

Está alineado al **NIST Cybersecurity Framework (CSF)** y pensado desde la lógica de quien audita, no solo de quien implementa: ¿qué evidencia existe? ¿qué riesgo legal hay si no existe? ¿quién responde? ¿cuándo?

La diferencia con una matriz técnica típica es la capa legal integrada en cada control: riesgo legal, implicancia de compliance, consecuencia potencial y análisis de impacto negocio/operativo/regulatorio.

---

## Qué hace (v1.2)

- **11 controles** en los **5 dominios NIST CSF**: Identificar, Proteger, Detectar, Responder, Recuperar
- **Modelo de datos enriquecido** por control:
  - Contexto: activo afectado, tipo (Preventivo / Detectivo / Correctivo), naturaleza (Manual / Automatizado / Híbrido)
  - Evaluación: evidencia observada, resultado de prueba, brecha detectada, nivel de confianza
  - Seguimiento: estado del hallazgo, owner de remediación, fecha de compromiso, fecha de verificación
  - Impacto: negocio, operativo y regulatorio por separado
- **Scoring de riesgo** con dos dimensiones:
  - Diseño del control (1–5): qué tan bien está documentado y diseñado
  - Operación del control (1–5): qué tan bien está funcionando en la práctica
  - Efectividad = promedio de ambas dimensiones
  - Riesgo residual = inherente ajustado por efectividad (factor máx. 70%)
- **Filtros** por dominio, impacto, prioridad, estado del control, estado del hallazgo e implicancia compliance
- **Ordenamiento** por riesgo inherente/residual, impacto y estado de hallazgo (clic en columna)
- **Panel de detalle** jerarquizado: brecha → evidencia → impacto triple → análisis legal → remediación
- **Vista responsive**: tabla en desktop, cards en mobile con brecha visible
- **Datos en JSON externo**: extensible sin tocar el código

---

## Qué NO hace (honestidad sobre el alcance)

- No persiste datos (sin backend, sin base de datos)
- No permite editar controles desde la interfaz
- No genera reportes exportables
- No tiene autenticación ni multiusuario
- No es una herramienta de auditoría certificada ni reemplaza un GRC enterprise

Estas limitaciones son intencionales para mantener el stack simple y el foco en el criterio metodológico. Ver roadmap.

---

## Cómo recorrer este laboratorio

El lab está diseñado para seguir el flujo de una auditoría real:

**1. Panorama general (métricas de resumen)**
Al cargar, las tarjetas superiores muestran el estado actual: cuántos hallazgos están abiertos, cuántos controles no tienen implementación activa, cuál es la efectividad promedio del modelo de control.

**2. Identificar prioridades (filtros + ordenamiento)**
Filtrá por "Hallazgo: Abierto" para ver qué controles no tienen plan de remediación activo. Ordená por "Riesgo I→R" para ver cuáles tienen mayor exposición residual. La combinación de ambos identifica los controles críticos sin cobertura.

**3. Analizar cada control (panel de detalle)**
Al hacer clic en una fila se abre el panel de análisis completo. El orden importa: primero la **brecha detectada** (el hallazgo concreto), luego la evidencia requerida versus lo observado, luego el impacto en negocio/operativo/regulatorio, y finalmente el análisis legal y el plan de remediación.

**4. Entender el modelo de riesgo (scoring)**
Cada control muestra el riesgo inherente (impacto × probabilidad) y el residual (ajustado por efectividad del control). La efectividad se calcula a partir de dos dimensiones separadas: diseño (¿existe el control y está bien documentado?) y operación (¿está funcionando en la práctica?). Esta distinción es clave en auditoría: un control puede estar perfectamente diseñado y no estar operando.

**5. Modificar el dataset**
Todo el modelo de datos está en `data/audit_matrix.json`. Podés agregar controles, cambiar estados, actualizar fechas de compromiso o cargar datos de una organización real sin tocar el código.

---

## Caso de uso

**Contexto:** Auditoría de ciberseguridad inicial a una fintech de tamaño mediano en Argentina, bajo supervisión del BCRA.

**Flujo de trabajo con el lab:**

1. El auditor carga el JSON con los controles evaluados en campo
2. Filtra por "Dominio: Responder" para revisar los controles de respuesta a incidentes
3. Ve que el IRP (control 09) está "No implementado" con hallazgo "Abierto" y riesgo residual alto
4. Abre el panel de detalle: la brecha detectada dice que la organización no notificó al BCRA en el único incidente del año
5. El análisis legal muestra la implicancia regulatoria específica (Com. A 6375)
6. El plan de remediación tiene fecha de compromiso y owner asignado
7. El auditor puede usar esta información para fundamentar el hallazgo en el informe

Este flujo convierte el lab en un **soporte de campo para estructurar hallazgos**, no solo en una pantalla de datos.

---

## Decisiones de diseño

**¿Por qué no React ni otro framework?**
El objetivo del lab es demostrar criterio GRC y metodología de auditoría, no arquitectura frontend. Un stack mínimo hace que el foco esté en el modelo de datos y la lógica de negocio, no en la plomería técnica. También facilita que cualquier profesional legal pueda modificar el JSON sin entender el ecosistema JavaScript moderno.

**¿Por qué JSON externo en lugar de datos hardcodeados?**
Separar el modelo de datos de la lógica de presentación permite actualizar, extender o reemplazar el dataset sin tocar el código. Es el patrón más cercano a cómo funcionaría un backend real con una base de datos. También facilita la revisión del modelo de controles de forma independiente al código.

**¿Por qué sin backend?**
Porque el alcance del prototipo es demostrar el modelo de datos y la lógica de auditoría, no la infraestructura. El paso siguiente natural es agregar un backend mínimo con persistencia. Está en el roadmap.

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
├── script.js               # Lógica: scoring, filtros, ordenamiento, renderizado
└── data/
    └── audit_matrix.json   # Modelo de datos: 11 controles con campos enriquecidos
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

## Controles incluidos (v1.2)

11 controles cubriendo los 5 dominios del NIST CSF.

| # | Dominio | Tipo | Estado control | Riesgo principal |
|---|---------|------|---------------|-----------------|
| 01 | Identificar | Preventivo | Parcial | Shadow IT / IA no autorizada |
| 02 | Proteger | Preventivo | Parcial | Robo de credenciales / MFA en cuentas privilegiadas |
| 03 | Proteger | Preventivo | Implementado | Vulnerabilidades en sistemas legacy |
| 04 | Proteger | Preventivo | Parcial | Ingeniería social y phishing con IA |
| 05 | Recuperar | Correctivo | No implementado | Ransomware / backups en red |
| 06 | Identificar | Preventivo | Parcial | Riesgo en cadena de proveedores |
| 07 | Detectar | Detectivo | No implementado | Ausencia de monitoreo SIEM |
| 08 | Detectar | Detectivo | Parcial | Identidades comprometidas sin UEBA |
| 09 | Responder | Correctivo | No implementado | IRP ausente / notificación BCRA |
| 10 | Responder | Correctivo | No implementado | Contención y análisis forense |
| 11 | Recuperar | Correctivo | No implementado | Backups sin prueba de restauración |

---

## Modelo de scoring (v1.2)

```
riesgo_inherente = impacto_num × probabilidad

efectividad_control = (diseno_control + operacion_control) / 2

riesgo_residual = inherente × (1 − efectividad/5 × 0.7)
```

La efectividad máxima (5/5 en diseño y operación) reduce el riesgo residual hasta un 70% del inherente. Ningún control elimina el riesgo completamente.

La separación diseño/operación refleja una distinción central en auditoría: un control puede estar perfectamente documentado (diseño = 5) y sin embargo no estar funcionando en la práctica (operación = 1).

---

## Roadmap

- [ ] Edición inline de estados, observaciones y fechas desde la interfaz
- [ ] Exportación de reporte de auditoría en PDF con hallazgos filtrados
- [ ] Scoring de riesgo con ponderación configurable por sector (fintech, salud, gobierno)
- [ ] Trazabilidad de auditoría: historial de cambios por control
- [ ] Soporte para múltiples frameworks: ISO 27001, CIS Controls v8
- [ ] Backend mínimo con persistencia para trabajo en equipo (SQLite o similar)
- [ ] Módulo de seguimiento de remediaciones con alertas de vencimiento

---

## Contexto profesional

Construido por **Matías Godoy**, abogado trabajando en la intersección de fraude bancario digital, compliance y ciberseguridad aplicada al derecho. Este lab es parte de un portfolio técnico orientado a roles en Legal-Tech y GRC.

[@mgodoylegal-tech](https://github.com/mgodoylegal-tech)
