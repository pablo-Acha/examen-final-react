# Registro del uso de IA

Este registro corresponde a la conversación actual. No sustituye sesiones
anteriores, si existieron.

| Solicitud | Trabajo del asistente | Incorporación |
| --- | --- | --- |
| Comparar el examen con el proyecto | Lectura del PDF y revisión del código | Diagnóstico inicial, sin cambios de código. |
| Subir mediante GitHub CLI como «examen final react» | Preparar Git y repositorio `examen-final-react` | Verificar enlace y acceso al finalizar. |
| Crear E2E, Actions y documentación, sin publicar ni hacer README final | Playwright, workflows, documentos y corrección del envío duplicado | Archivos de esta etapa. |
| Motivo de elección confirmado | El estudiante indicó que eligió el juego por cumplir características del examen | `introduccion.md`. |
| Completar el README final | Redacción basada en código, comandos y ejecuciones verificadas, con enlaces a aplicación y Actions | README principal y actualización de referencias pendientes. |

## Revisión personal pendiente

Actualización: el estudiante creó el servicio de Render y compartió su URL.
El asistente verificó las cuatro pruebas en Chrome contra producción.
Después el estudiante solicitó el workflow de despliegue: se incorporaron
`deploy.yml`, el script de despliegue, `/api/health` y la documentación de
publicación. El secreto del hook se configura directamente en GitHub.

- Explicar el recorrido de un tiro entre canvas, `GameClient` y Express.
- Distinguir estado mutable de física y estado visible de React.
- Explicar el bloqueo de resolución mientras se espera la respuesta HTTP.
- Leer las aserciones y diferenciar pruebas de navegador y de API.
- Ejecutar las pruebas y explicar los pasos y eventos de los workflows.
- Revisar reglas, fuentes y límites contra la intención de diseño.

El estudiante aún no confirmó verificaciones personales. Las ejecuciones
del asistente se registran en `investigacion.md` y no se atribuyen al estudiante.
Agregar solicitudes anteriores, respuestas incorporadas, cambios propios y
verificaciones únicamente cuando correspondan a hechos reales.
