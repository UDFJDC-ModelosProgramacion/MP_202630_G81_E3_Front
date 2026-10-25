# Imagen de producción del front: archivos estáticos servidos por nginx.
# Las peticiones a /api se reenvían al back definido en BACKEND_URL (ver docker/nginx.conf.template).
FROM nginx:1.27-alpine

ENV BACKEND_URL=http://backend:8080

COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY src/ /usr/share/nginx/html/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1
