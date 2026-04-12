#!/bin/bash
# Crear issues de roadmap para cyber-audit-mini-lab
# Ejecutar desde la carpeta del proyecto con: bash crear-issues.sh

REPO="mgodoylegal-tech/cyber-audit-mini-lab"

gh issue create --repo $REPO \
  --title "feat: edición inline de estado y owner desde la tabla" \
  --body "## Descripción
Permitir editar directamente desde la tabla sin abrir el panel de detalle:
- \`estado_hallazgo\`: dropdown inline por fila
- \`owner_remediacion\`: input inline por fila
- \`fecha_compromiso\`: date picker inline

## Criterio de aceptación
- Cambios persisten en memoria (sin backend)
- Badge actualiza en tiempo real al cambiar el estado
- No rompe filtros ni ordenamiento activo

## Por qué es prioritario
Es el paso natural de 'ver hallazgos' a 'gestionar hallazgos'. Sin edición inline la herramienta es de solo lectura."

echo "Issue 1 creado"

gh issue create --repo $REPO \
  --title "feat: exportar reporte PDF con hallazgos filtrados" \
  --body "## Descripción
Generar un PDF del estado actual de la auditoría con los filtros aplicados:
- Tabla de hallazgos visibles (respeta filtros activos)
- Resumen de métricas superiores
- Sección de hallazgos vencidos y próximos a vencer

## Criterio de aceptación
- PDF generado en el browser (sin backend), usando window.print() o librería client-side
- Incluye fecha de generación y filtros aplicados en el header
- Formato A4 legible en papel

## Por qué es prioritario
Un auditor necesita llevar el estado de la auditoría a una reunión. Hoy no hay forma de exportar."

echo "Issue 2 creado"

gh issue create --repo $REPO \
  --title "feat: soporte multi-framework (ISO 27001 / CIS Controls v8)" \
  --body "## Descripción
Extender el modelo de datos para soportar frameworks alternativos al NIST CSF:
- Agregar campo \`framework\` al JSON (NIST / ISO27001 / CIS)
- Filtro por framework en la barra de filtros
- Mapeo de dominios por framework (ej: ISO tiene 14 dominios vs 5 del NIST)

## Criterio de aceptación
- El mismo control puede tener referencias a múltiples frameworks
- Los filtros de dominio se adaptan al framework seleccionado
- El panel de detalle muestra la referencia de control correspondiente (ej: ISO 27001 A.9.4)

## Por qué es prioritario
El NIST CSF es un framework de alto nivel. En auditorías reales se trabaja en paralelo con ISO 27001 o CIS Controls. El mapeo cruzado agrega valor diferencial."

echo "Issue 3 creado"

gh issue create --repo $REPO \
  --title "feat: historial de cambios por control (audit trail)" \
  --body "## Descripción
Registrar cada cambio de estado de un hallazgo con timestamp y usuario:
- Array de eventos por control: [{ campo, valorAnterior, valorNuevo, fecha, usuario }]
- Timeline visible en el panel de detalle
- Exportable junto con el reporte PDF

## Criterio de aceptación
- El historial se mantiene en memoria durante la sesión
- El panel de detalle muestra el timeline de cambios en la sección de gestión
- Cada evento tiene timestamp, campo modificado y valores anterior/nuevo

## Por qué es prioritario
En auditoría, la trazabilidad es un requisito de compliance. Sin audit trail no hay evidencia de que los hallazgos fueron gestionados."

echo "Issue 4 creado"

gh issue create --repo $REPO \
  --title "feat: backend mínimo con persistencia (SQLite / JSON file)" \
  --body "## Descripción
Agregar un backend mínimo para persistir cambios entre sesiones:
- API REST mínima (Express o similar) con 3 endpoints: GET /controls, PATCH /control/:id, GET /export
- Base de datos SQLite o archivo JSON en disco
- Sin autenticación en v1 (localhost only)

## Criterio de aceptación
- Los cambios de estado/owner/deadline persisten al recargar la página
- El frontend no necesita modificaciones (solo cambia la URL del fetch)
- Deploy local documentado en README

## Por qué es prioritario
El salto de prototipo a herramienta real requiere persistencia. Es el cambio arquitectural más importante del roadmap."

echo "Issue 5 creado"
echo ""
echo "Todos los issues creados. Verificar en: https://github.com/$REPO/issues"
