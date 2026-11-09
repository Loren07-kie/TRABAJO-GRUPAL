# Satipo · Vive la selva

Web turística basada en las 13 páginas del Boletín Turístico 2025 y en el proyecto tutor_idiomas entregado por la usuaria.

## Incluye

- Ocho recorridos distritales y 60 paradas transcritas del boletín, con fotografías recortadas de sus páginas.
- Boletín original completo, ampliación por página y descarga del PDF original.
- Itinerario personal y enlaces a Google Maps por tramos de hasta cuatro paradas. Las búsquedas usan nombres, no coordenadas verificadas de los atractivos. Las paradas genéricas de desayuno o cafetería requieren elegir un establecimiento concreto.
- Mapa OpenStreetMap/Leaflet y fotografías asociadas al GPS actual. Se almacenan en IndexedDB del dispositivo; no hay galería pública compartida ni sincronización. El visitante puede exportar y eliminar sus fotos.
- Guía e imágenes descargables mediante Service Worker. El mapa base y la IA necesitan internet. La navegación sin conexión se prepara por separado en la aplicación Google Maps. No se ofrecen trazados GPX inventados.
- Edición local del título, presentación y textos de dos botones de portada, con exportación JSON. No hay panel de administración compartido: los diseños originales del PDF se conservan como imágenes y no son elementos editables.
- Asistente Gemini con historial reciente y consulta del boletín, glosario y fragmentos lingüísticos del tutor. Traducciones pendientes de validación se identifican como tales. Lectura en español y dictado dependen del navegador.

## Archivos

`public/guide.html`, `public/style.css`, `public/app.js`: interfaz y mapa.

`public/assistant.js`: conversación y voz. `lib/satipo-assistant.ts`: fuente del asistente, validación de mensajes y límite básico por visitante/instancia. `data/`: material de consulta sin credenciales. `server.mjs`: servidor web y endpoint `/api/chat`. `server/assistant.mjs`: asistente compilado listo para Node.js.

## Configuración y publicación

La clave `GEMINI_API_KEY` se configura exclusivamente como variable privada en Render, con `GEMINI_MODEL` para el modelo. El ZIP original y su archivo `.env` no se copian al repositorio ni a los archivos públicos.

Ejecutar con Node.js 22 o posterior: `node server.mjs`. El servidor usa solamente bibliotecas nativas de Node.js. La configuración de despliegue está en RENDER.md. La clave del proveedor nunca se envía al navegador.

## Límites de esta versión

Los horarios, precios, contactos, accesos y ubicaciones precisas deben revisarse con el operador local antes del viaje. Río Tambo incluye transporte fluvial; Google Maps no calcula ese recorrido en bote. Las fotos guardan la ubicación actual, no extraen GPS de fotos antiguas. La precisión depende del celular. No hay límites geográficos oficiales cargados ni verificación automática de que una foto esté dentro de la provincia.

Faltan una administración compartida autenticada, almacenamiento compartido de fotos y validación cartográfica completa para convertir esta primera versión en un portal público administrado por varias personas.

El asistente reintenta una vez los fallos temporales. Si persisten, puede mostrar coincidencias del boletín claramente identificadas como respuesta de respaldo, sin generación de IA. Las consultas sin coincidencias y los idiomas originarios conservan un error recuperable, sin inventar respuestas. Verificación: `npm test`.
