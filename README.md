# MP_202630_G81_E3_Front

## Descripción

Front-end del sistema de adopción de mascotas . Es una aplicación web que consume el API RESTful del back, [MP_202630_G81_E3_Back](https://github.com/UDFJDC-ModelosProgramacion/MP_202630_G81_E3_Back.git), para presentar la información del refugio y de sus mascotas.

Este repositorio es la base común del equipo e incluye:

- Estructura del proyecto y capas reutilizables (cliente HTTP, componentes, utilidades).
- Manejo de errores y de estados de carga, vacío y error.
- Pruebas automatizadas con reporte de cobertura.
- Configuración de calidad (ESLint, Prettier, Jenkins y SonarQube).
- Dockerización del front, del back y de los servidores de calidad.

## Tecnologías utilizadas

| Ámbito       | Tecnología                                                   |
| ------------ | ------------------------------------------------------------ |
| Lenguajes    | HTML5, CSS3 y JavaScript (ES2023, módulos nativos)           |
| Arquitectura | MPA: una página HTML por vista, con módulos ES reutilizables |
| Pruebas      | Vitest y jsdom, cobertura con V8 (lcov)                      |
| Estilo       | ESLint y Prettier                                            |
| Calidad      | Jenkins y SonarQube                                          |
| Contenedores | Docker, Docker Compose y nginx                               |
| Entorno      | Node.js 22.13 o superior                                     |

## Estructura del proyecto

```
src/
  index.html             Página base
  css/                   tokens.css (variables de diseño), base.css, components.css
  js/
    main.js              Punto de entrada de la página
    config.js            Nombre de la app, prefijo del API (/api) y tiempo de espera
    api/httpClient.js    Cliente HTTP con errores unificados (ApiError)
    components/          header y stateViews (cargando, vacío y error)
    utils/               dom (creación segura de elementos), format y errors
tests/                   Pruebas unitarias (Vitest)
scripts/dev-server.mjs   Servidor de desarrollo con proxy al back
docker/                  Plantilla de nginx e imagen de Jenkins
docs/                    Registro de pruebas manuales
Dockerfile               Imagen del front (nginx)
docker-compose.yml       Front y, opcionalmente, el back
docker-compose.ci.yml    Jenkins y SonarQube locales
Jenkinsfile              Pipeline de integración continua
sonar-project.properties Configuración del análisis de SonarQube
```

## Instalación y ejecución

### Requisitos

- Node.js 22.13 o superior (`nvm use` toma la versión de `.nvmrc`).
- El back en ejecución: Java 21 y `./mvnw spring-boot:run` en el repositorio del back. Escucha en el puerto 8080, publica el API bajo `/api` y usa una base H2 en memoria, por lo que los datos se pierden al reiniciarlo.
- Docker y Docker Compose (recomendado).

### Con Node.js

```bash
npm install
npm run dev
```

El front queda en <http://localhost:3000> y reenvía `/api` a `http://localhost:8080`. Para usar otro back:

```bash
BACKEND_URL=http://otro-host:8080 npm run dev
```

### Con Docker (recomendado)

Se recomienda dockerizar toda la infraestructura. Los archivos de Compose levantan cada pieza:

```bash
docker compose up --build
docker compose --profile with-backend up --build
```

- El perfil `with-backend` construye el back desde `../MP_202630_G81_E3_Back`. Otra ruta: `BACKEND_CONTEXT=/ruta/al/back`.
- Para usar un back que corre fuera de Docker: `BACKEND_URL=http://host.docker.internal:8080 docker compose up --build`.
- Puertos configurables con `FRONT_PORT` y `BACKEND_PORT`.
- Jenkins y SonarQube: `docker-compose.ci.yml`

nginx sirve `src/` y reenvía `/api` al back, por eso el front usa siempre rutas relativas y no hay problemas de CORS.

## Pruebas

**Automatizadas** (Vitest):

```bash
npm test
npm run coverage
npm run lint
npm run format:check
npm run check
```

Los umbrales de cobertura están en `vitest.config.js`.
