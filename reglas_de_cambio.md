---
description: Reglas obligatorias para realizar cambios en el código manteniendo la integridad visual
---

# Protocolo de Modificación de Código

**Objetivo:** Asegurar que las funcionalidades nuevas no rompan ni alteren el diseño visual existente.

## Instrucciones

1. **Análisis Previo**: Antes de tocar nada, identifica qué partes del código controlan el estilo visual y asegúrate de **NO** modificarlas si no es intrínsecamente necesario para la nueva funcionalidad.
2. **Cambios Quirúrgicos**: Realiza cambios solo en la lógica o en los componentes específicos requeridos. Evita refactorizaciones masivas de estilo.
3. **Reporte de Cambios**: Al finalizar tu tarea, debes listar explícitamente el nombre del archivo o archivos que fueron modificados.

> "Cada vez que hagas una mejora o un cambio el archivo que así lo requiera, quiero que respetes lo visual que está construido hasta el momento, y que solo cambies la parte del código que sea necesaria para la funcionalidad o mejora que yo te solicite y al hacer los cambios dime que archivo fue al que le hiciste cambios."
