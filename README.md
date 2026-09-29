# TakoraaWeb

Sitio de [Takoraa Software Studio](https://takoraa.com), basado en el one pager
del estudio y su sistema de color. GitHub Pages sirve los archivos estáticos de
este repositorio desde la rama `main`.

`index.html` contiene el contenido en español, `studio.css` los estilos y
`studio.js` las vistas de la portada, los servicios interactivos, el carrusel,
el menú móvil y la compatibilidad con los enlaces anteriores. La dirección
visual usa fondo marfil, la paleta del estudio y animaciones ligeras en CSS/SVG.
El control de pausa y la preferencia de movimiento reducido permiten desactivarlas.
La sección `#clientes` presenta los clientes y partners del estudio, con sus
proyectos y tipo de colaboración, en español e inglés.
No necesita compilación ni instalar dependencias para funcionar.

## Vista pública en Sites

La versión compartible está en [Takoraa Estudio](https://takoraa-estudio.manuelmartinezdevedi.chatgpt.site).
Se publica desde una copia independiente en `D:/takora/takoraa-codex-site`,
sin modificar el dominio de producción. Los cambios de este repositorio no
actualizan esa copia automáticamente: hay que sincronizarla y volver a publicarla.

Para verlo localmente, ejecutá `python -m http.server 4173 --bind 127.0.0.1`
y abrí [la vista local](http://127.0.0.1:4173).

Los accesos antiguos de presentación, contacto y documentación redirigen a
las secciones correspondientes. El dashboard de producto tiene su propia
carpeta y permanece en [dashboard.takoraa.com](https://dashboard.takoraa.com).
