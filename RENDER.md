# Despliegue gratuito en Render

Servicio web Node.js. No necesita instalar dependencias para ejecutarse.

- Repositorio: https://github.com/Loren07-kie/TRABAJO-GRUPAL
- Rama: `main`
- Plan: `free`
- Build command: `npm run build`
- Start command: `npm start`
- Health check: `/health`
- Variables privadas en Render: `GEMINI_API_KEY`, `GEMINI_MODEL`.
- El servidor escucha `PORT` en `0.0.0.0`.

El plan gratuito puede suspenderse tras inactividad y tardar en arrancar. El uso de IA está sujeto a la cuota del proveedor. No hay disco persistente: los recuerdos y cambios personales permanecen en el navegador del visitante.

La integración IA se entrega en `server/assistant.mjs`. Su fuente TypeScript está en `lib/satipo-assistant.ts`; incluye el material de consulta de `data/`. Para regenerarla con esbuild: `esbuild lib/satipo-assistant.ts --bundle --platform=node --format=esm --outfile=server/assistant.mjs`.

No subir el ZIP original, `.env` ni claves a GitHub. El contenido público está exclusivamente en `public/`.
