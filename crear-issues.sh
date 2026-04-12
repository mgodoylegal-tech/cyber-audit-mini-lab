#!/bin/bash
# ─── Cyber Audit Mini Lab — Crear issues del roadmap en GitHub ───────────────
# Requiere: gh CLI autenticado (gh auth login)
# Uso: bash crear-issues.sh (desde la carpeta del proyecto)

echo "Creando issues del roadmap de Cyber Audit Mini Lab v1.4..."

gh issue create \
  --title "feat: edicion inline de estado y owner del hallazgo" \
  --label "enhancement" \
  --body "Actualmente la herramienta es de solo lectura. Propuesta: doble clic en celda estado_hallazgo / owner_remediacion / fecha_compromiso para edicion inline. Validacion en tiempo real (owner no puede quedar vacio si hallazgo esta Abierto). Cambios reflejados en scoring y risk flags. Exportar JSON modificado (descarga local, sin backend). Criterio: usuario puede cambiar estado/owner/deadline desde la tabla y el scoring se recalcula automaticamente."

gh issue create \
  --title "feat: exportacion PDF del informe ejecutivo de auditoria" \
  --label "enhancement" \
  --body "No existe forma de generar un reporte exportable para el Directorio o regulador. Propuesta: boton Exportar informe en el header. PDF con portada, resumen ejecutivo (stat cards), top hallazgos criticos (riesgo residual >= 12), tabla completa y detalle de risk flags activos. Generacion 100% client-side con jsPDF (sin backend). Los hallazgos con penalizacion de gestion deben ser visibles en el reporte."

gh issue create \
  --title "feat: soporte multi-framework (ISO 27001 / COBIT 2019)" \
  --label "enhancement" \
  --body "El dataset actual esta disenado para NIST CSF. Propuesta: nuevo campo framework en control_definition (NIST CSF / ISO 27001 / COBIT 2019) y referencia_framework con el codigo del control (ej: PR.AC-1, A.9.2.1). Filtro filterFramework en la barra. El modelo de 4 sub-objetos es framework-agnostico, solo cambia el dataset. Dataset de ejemplo: 10 controles ISO 27001 del Anexo A, 8 controles COBIT DSS."

gh issue create \
  --title "feat: audit trail - trazabilidad de cambios por hallazgo" \
  --label "enhancement" \
  --body "El sistema no registra quien hizo que cambio ni cuando. En una herramienta de auditoria real la trazabilidad de las decisiones es un requisito metodologico. Propuesta: almacenamiento en localStorage del historial de cambios. Cada entrada: timestamp, campo modificado, valor anterior, valor nuevo. Panel Historial visible desde el ID del control. Export del audit trail en CSV/JSON. Sin backend, el trail vive en el browser."

gh issue create \
  --title "feat: backend minimo con persistencia real (Node.js + SQLite)" \
  --label "enhancement,backend" \
  --body "El prototipo es estatico: los cambios no persisten entre sesiones ni usuarios. Propuesta: Node.js + Express + SQLite. 4 endpoints: GET /api/controls, PATCH /api/controls/:id/remediation, GET /api/controls/:id/history, POST /api/controls/:id/comments. El frontend solo cambia la URL del fetch: data/audit_matrix.json -> /api/controls. Autenticacion basica JWT con roles auditor/owner/readonly. Deploy posible en Railway o Render plan free."

echo ""
echo "Issues creados. Ver en: https://github.com/mgodoylegal-tech/cyber-audit-mini-lab/issues"
