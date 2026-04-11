# Cyber Audit Mini Lab

> Prototipo de matriz de auditoría de ciberseguridad con enfoque en riesgo operativo, controles, evidencia mínima y compliance.

**Live demo →** [mgodoylegal-tech.github.io/cyber-audit-mini-lab](https://mgodoylegal-tech.github.io/cyber-audit-mini-lab)

---

## Qué es esto

Un prototipo funcional de herramienta de auditoría, construido como activo de portfolio profesional. No es una herramienta de producción ni un SaaS. Es un laboratorio para demostrar criterio técnico y legal en la intersección de GRC, ciberseguridad y derecho.

Está alineado al **NIST Cybersecurity Framework (CSF)** y pensado desde la mirada de quien audita: ¿qué evidencia existe? ¿qué riesgo legal hay si no existe? ¿quién responde?

---

## Qué hace (v1.1)

- Matriz de **11 controles en los 5 dominios NIST CSF**: Identificar, Proteger, Detectar, Responder, Recuperar
- Scoring de riesgo: inherente (impacto × probabilidad) y residual (ajustado por madurez)
- Estado del control por cada ítem: No implementado / Parcial / Implementado / Validado
- Filtros por dominio, prioridad, impacto, estado y compliance
- Panel de detalle con análisis legal, evidencia mínima, observación de auditor y plan de remediación
- Vista tipo cards en mobile, tabla en desktop
- Datos en JSON externo — extensible sin tocar el código

---

## Qué NO hace (honestidad sobre el alcance)

- No persiste datos (sin backend, sin base de datos)
- No permite editar controles desde la interfaz
- No genera reportes exportables
- No tiene autenticación ni multiusuario
- No es una herramienta de auditoría certificada

Estas limitaciones son intencionales para mantener el stack simple. Ver roadmap.

---

## Stack técnico

HTML5 · CSS3 puro · JavaScript vanilla (ES6+) · JSON externo · GitHub Pages

Sin frameworks. Sin dependencias. Sin build tools.

---

## Estructura

```
cyber-audit-mini-lab/
├── index.html              # Estructura y layout
├── styles.css              # Sistema de diseño completo
├── script.js               # Lógica, filtros, scoring, renderizado
└── data/
    └── audit_matrix.json   # Fuente de datos de controles
```

---

## Cómo ejecutarlo

```bash
# Python
python -m http.server 8080

# Node
npx serve .

# VS Code → extensión Live Server → clic derecho en index.html
```

Requiere servidor local (usa `fetch()` para cargar el JSON).

---

## Controles incluidos

Cubre los 5 dominios del NIST CSF.

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
| 09 | Responder | Plan de respuesta a incidentes / notificación BCRA |
| 10 | Responder | Contención y análisis forense |
| 11 | Recuperar | Falsa garantía de recuperabilidad — backups sin prueba |

---

## Roadmap

Lo que viene en versiones futuras:

- [ ] Scoring de riesgo más avanzado con ponderación por sector
- [ ] Edición inline de observaciones y estado del control
- [ ] Exportación de reporte en PDF
- [ ] Trazabilidad de auditoría (historial de cambios)
- [ ] Soporte para múltiples marcos: ISO 27001, CIS Controls
- [ ] Evolución hacia herramienta colaborativa con backend mínimo

---

## Contexto profesional

Construido por **Matías Godoy**, abogado trabajando en la intersección de fraude bancario digital, compliance y ciberseguridad aplicada al derecho. Este lab es parte de un portfolio técnico orientado a roles en Legal-Tech y GRC.

[@mgodoylegal-tech](https://github.com/mgodoylegal-tech)
