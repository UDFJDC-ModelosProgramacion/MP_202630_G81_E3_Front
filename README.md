# MP_202630_G81_E3_Front

## Descripción

Front-end del sistema de adopción de mascotas del curso **Modelos de Programación** (Universidad Distrital Francisco José de Caldas). Es una aplicación web que consume el API RESTful del back, [MP_202630_G81_E3_Back](https://github.com/UDFJDC-ModelosProgramacion/MP_202630_G81_E3_Back.git), para presentar la información del refugio y de sus mascotas.

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
- Docker y Docker Compose (recomendado). En Arch Linux: `sudo pacman -S docker docker-compose && sudo systemctl enable --now docker && sudo usermod -aG docker $USER`, y volver a iniciar sesión.

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
docker compose up --build                          # front → http://localhost:8081
docker compose --profile with-backend up --build   # front + back → http://localhost:8081 y :8080
```

- El perfil `with-backend` construye el back desde `../MP_202630_G81_E3_Back`. Otra ruta: `BACKEND_CONTEXT=/ruta/al/back`.
- Para usar un back que corre fuera de Docker: `BACKEND_URL=http://host.docker.internal:8080 docker compose up --build`.
- Puertos configurables con `FRONT_PORT` y `BACKEND_PORT`.
- Jenkins y SonarQube: `docker-compose.ci.yml` (ver [Métricas y calidad](#métricas-y-calidad)).

nginx sirve `src/` y reenvía `/api` al back, por eso el front usa siempre rutas relativas y no hay problemas de CORS.

## Pruebas

**Automatizadas** (Vitest):

```bash
npm test               # pruebas unitarias
npm run coverage       # pruebas y cobertura (coverage/lcov.info); falla si baja de los umbrales
npm run lint           # ESLint
npm run format:check   # Prettier (npm run format corrige el formato)
npm run check          # lint, formato y cobertura: es lo que debe pasar antes de un Pull Request
```

Los umbrales de cobertura están en `vitest.config.js`.

**Manuales:** se registran en [`docs/pruebas-manuales.md`](docs/pruebas-manuales.md), una tabla por historia de usuario.

## Métricas y calidad

La guía pide un Jenkins y un SonarQube locales. Este repositorio los trae configurados con Docker:

1. **Levantar los servidores**

   ```bash
   sudo sysctl -w vm.max_map_count=262144     # solo Linux, requisito de SonarQube
   docker compose -f docker-compose.ci.yml up -d --build
   ```

   - SonarQube: <http://localhost:9000/sonar> (usuario y contraseña iniciales `admin` / `admin`).
   - Jenkins: <http://localhost:8085/jenkins>. Contraseña inicial:
     `docker compose -f docker-compose.ci.yml exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword`

2. **SonarQube:** cambiar la contraseña, crear el proyecto manual con la clave `MP_202630_G81_E3_Front` y generar un token (_My Account → Security_).
3. **Jenkins:** instalar los plugins sugeridos y crear en _Manage Jenkins → Credentials_ una credencial **Secret text** con id `sonar-login` y el token anterior. Si el repositorio es privado, agregar también una credencial de GitHub.
4. **Job:** _New Item → Multibranch Pipeline_, con origen Git/GitHub apuntando a este repositorio y _Build Configuration: by Jenkinsfile_. Cada rama `feature/*` y cada Pull Request se construye por separado.

El pipeline (`Jenkinsfile`) instala dependencias, valida estilo y formato, ejecuta las pruebas con cobertura y envía el análisis a SonarQube; si el _Quality Gate_ no se cumple, el build falla. Usa la red `mp-ci` y la URL `http://sonarqube:9000/sonar` de `docker-compose.ci.yml`; para otro servidor se cambian `CI_NETWORK` y `SONARQUBE_URL`.

## Flujo de trabajo

- Una rama por historia de usuario con la convención `feature/nombre-de-la-historia-id`.
- Está prohibido subir directamente a `main` o `develop`.
- Todo cambio se integra mediante un Pull Request (la plantilla está en `.github/pull_request_template.md`) y no se fusiona sin la aprobación de al menos un compañero que haya revisado el código.
- Se aplican principios de Clean Code y los estándares de estilo definidos con ESLint y Prettier.
- Cada funcionalidad incluye sus pruebas unitarias y mantiene o mejora la cobertura.
- Una historia está terminada (_Done_) cuando cumple el 100 % de sus criterios de aceptación, el código compila y pasa todas las pruebas, y su Pull Request está aprobado y fusionado en la rama de integración.

## Historias de usuario implementadas

Cada historia se publica como una página del front. Para visualizarla, se levanta el front (ver [Instalación y ejecución](#instalación-y-ejecución)) y se abre la dirección indicada en la tabla. La fila de cada historia se agrega al fusionar su Pull Request.

| Historia | Dirección | Responsable | Pull Request |
| -------- | --------- | ----------- | ------------ |
| —        | —         | —           | —            |
