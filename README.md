# Cyber Audit Mini Lab

> Matriz de auditoría operativa en ciberseguridad · Riesgo · Control · Compliance

**Live demo →** [mgodoylegal-tech.github.io/cyber-audit-mini-lab](https://mgodoylegal-tech.github.io/cyber-audit-mini-lab)

---

## ¿Qué es este proyecto?

Herramienta web interactiva que implementa una matriz de auditoría de controles de ciberseguridad alineada al **NIST Cybersecurity Framework (CSF)**. Diseñada desde una perspectiva **GRC / Legal-Tech**, permite visualizar, filtrar y analizar riesgos operativos con sus controles esperados, evidencia mínima aceptable e implicancias de compliance.

Construido como parte de un portfolio profesional en la intersección de derecho, tecnología y ciberseguridad.

---

## Funcionalidades

- **Matriz de controles** organizada por dominios NIST CSF: Identificar, Proteger, Detectar y Recuperar
- **Panel de detalle** por control: objetivo, evidencia, hallazgo potencial, plan de remediación y madurez
- **Filtros dinámicos** por dominio, prioridad, impacto e implicancia legal
- **Dashboard de métricas**: total de controles, impacto crítico, prioridad crítica, madurez promedio y dominios cubiertos
- **Indicador de madurez visual** (escala 1–5) por cada control
- Diseño oscuro responsivo con tipografía técnica (JetBrains Mono + Syne)
- Datos en JSON externo — fácilmente extensible sin tocar el código

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Estructura | HTML5 semántico |
| Estilos | CSS3 puro (variables, grid, animaciones) |
| Lógica | JavaScript vanilla (ES6+) |
| Datos | JSON externo (`data/audit_matrix.json`) |
| Fuentes | Google Fonts (JetBrains Mono, Syne) |
| Deploy | GitHub Pages |

Sin frameworks, sin dependencias. Cero build tools.

---

## Estructura del proyecto

```
cyber-audit-mini-lab/
├── index.html              # Estructura principal
├── styles.css              # Estilos y sistema de diseño
├── script.js               # Lógica de filtros, renderizado y detalle
└── data/
    └── audit_matrix.json   # Matriz de controles (fuente de datos)
```

---

## Cómo ejecutarlo localmente

```bash
# Opción 1 — Python
python -m http.server 8080

# Opción 2 — Node
npx serve .

# Opción 3 — VS Code
# Instalar extensión "Live Server" → clic derecho en index.html → Open with Live Server
```

> Requiere servidor local por la carga del JSON vía `fetch()`. No funciona abriendo el archivo directamente en el navegador.

---

## Controles incluidos (v1.0)

| # | Dominio | Riesgo |
|---|---------|--------|
| 01 | Identificar | Shadow IT / IA no autorizada |
| 02 | Proteger | Robo de credenciales / MFA |
| 03 | Proteger | Vulnerabilidades en software desactualizado |
| 04 | Proteger | Ingeniería social y phishing con IA |
| 05 | Recuperar | Ransomware / continuidad del negocio |
| 06 | Identificar | Riesgo en cadena de proveedores |
| 07 | Detectar | Ausencia de monitoreo continuo (SIEM) |
| 08 | Detectar | Identidades comprometidas sin UEBA |

---

## Contexto profesional

Este proyecto es parte de mi transición hacia roles en **Legal-Tech, GRC y Fraude Bancario Digital**. Combina:

- Conocimiento jurídico aplicado a marcos regulatorios (BCRA, compliance sectorial)
- Pensamiento de auditoría y control interno
- Capacidad técnica para construir herramientas funcionales desde cero

---

## Autor

**Matías Godoy** · [@mgodoylegal-tech](https://github.com/mgodoylegal-tech)
Legal-Tech · GRC · Ciberseguridad aplicada al derecho

---

*Proyecto en desarrollo activo — nuevos dominios y controles se agregan iterativamente.*
