# Guía multilingüe

Se amplió el material consultado por el asistente y sus instrucciones. Este trabajo prepara ejemplos y recuperación de información; no ejecuta un ajuste de los pesos del modelo de Gemini.

El banco `data/multilingual-guide.json` contiene 18 temas de consulta con 72 preguntas de ejemplo en español e inglés, más 14 expresiones o preguntas documentadas en asháninka y quechua. Cada ejemplo conserva la fuente y las limitaciones de revisión.

- Español e inglés: preguntas turísticas, información del boletín y uso de la web; conversación generativa para consultas más amplias.
- Asháninka: expresiones del manual MINEDU incluido en el tutor y de material publicado por MINSA. El manual incluye variantes regionales.
- Quechua: expresiones básicas de una referencia de aprendizaje de quechua sureño. No se presentan como una norma única para todas las comunidades.
- Las expresiones con documentación no equivalen a validación por un hablante local. Las traducciones extensas o ausentes se explican en español, sin inventar una respuesta en lengua originaria.

El selector admite detección automática o un idioma explícito. Los ejemplos conocidos responden con el material de referencia y una etiqueta de procedencia, incluso si no está disponible el proveedor de IA. La lectura y el dictado solo se habilitan en español e inglés; no se hace pasar una voz española por pronunciación nativa validada.

Fuentes añadidas:

- [MINSA: palabras clave para la atención en salud, Asháninka](https://cdn.www.gob.pe/uploads/document/file/315142/Palabras_clave_para_la_atenci%C3%B3n_en_salud__Ashaninka20190521-6322-1g0qnnb.pdf), sección de saludos, página impresa 33. Solo se usan expresiones generales; no se añaden respuestas clínicas.
- [Ohio State University: Quechua, Chapter 1](https://ohiostate.pressbooks.pub/quechua/chapter/chapter-1/), ejemplos introductorios de saludo, preguntas y despedidas.
- [MINEDU: Manual de escritura Ashaninka](https://repositorio.minedu.gob.pe/handle/20.500.12799/10942), disponible entre los materiales del tutor entregado por la usuaria.

Pruebas: `node --test tests/assistant-recovery.test.mjs tests/multilingual-guide.test.mjs`.
