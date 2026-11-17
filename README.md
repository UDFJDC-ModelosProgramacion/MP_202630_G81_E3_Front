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
    contract.js          Página del contrato de adopción
    requirements.js      Página de requisitos para adoptar

    adoption.js          Página del proceso de adopción
    config.js            Nombre de la app, prefijo del API (/api) y tiempo de espera
    api/httpClient.js    Cliente HTTP con errores unificados (ApiError)
    api/contractsApi.js  Consulta del contrato de adopción
    api/requirementsApi.js  Consulta de los requisitos de adopción

    api/adoptionsApi.js  Consulta del detalle de una adopción

    components/          header, stateViews (cargando, vacío y error) y contractView
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
- El back en ejecución: Java 21 y `./mvnw spring-boot:run` en el repositorio del back. Con `spring-boot:run` escucha en el puerto 8999 (así lo define su `pom.xml`; con `java -jar` o Docker usa el 8080), por lo que se debe iniciar el front con `BACKEND_URL=http://localhost:8999 npm run dev`. Publica el API bajo `/api` y usa una base H2 en memoria, por lo que los datos se pierden al reiniciarlo.
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

## Historias de usuario implementadas

### Revisión de contrato de adopción

_Como usuario quiero ver el contrato de adopción para ver la fecha del contrato, los términos y condiciones de adoptar a una mascota._

**Cómo visualizarla**

1. Levanta el back (`./mvnw spring-boot:run` en el repositorio del back) y el front (`npm run dev`).
2. Crea un contrato desde Postman (`Adoption Contracts / Crear contrato de adopción`) con este cuerpo:

   ```json
   {
     "termsAndConditions": "El adoptante se compromete a brindar alimento y espacio adecuado.\nNo debe abandonar ni maltratar a la mascota.",
     "signedDate": "2026-03-16",
     "status": "SIGNED"
   }
   ```

3. Abre la página con el id del contrato devuelto:

   | URL                                              | Qué muestra                         |
   | ------------------------------------------------ | ----------------------------------- |
   | <http://localhost:3000/contract.html?contract=1> | El contrato con ese id              |
   | <http://localhost:3000/contract.html?adoption=1> | El contrato asociado a esa adopción |

La página muestra la fecha del contrato y sus términos y condiciones (un párrafo por línea). Además maneja los estados de carga, de error con opción de reintentar (por ejemplo, contrato inexistente o back apagado) y vacío (adopción sin contrato o URL sin id).

**Endpoints del back que usa:** `GET /api/adoption-contracts/{id}` y `GET /api/adoptions/{id}`.

### Revisión de requerimientos

_Como usuario quiero ver cuáles son los requerimientos para adoptar a una mascota con el fin de saber si estoy en condiciones de hacer el proceso de adopción._

**Cómo visualizarla**

1. Levanta el back y el front (`npm run dev`).
2. Crea uno o varios requisitos desde Postman (`Adoption Requirements / Crear requisito de adopción`), por ejemplo:

   ```json
   { "description": "Tener casa propia con patio cerrado.", "mandatory": true }
   ```

3. Abre <http://localhost:3000/requirements.html> o entra por el enlace **Requisitos** del menú.

La página lista los requisitos con su descripción y, cuando el back lo informa, si son obligatorios u opcionales. Cada requisito tiene una casilla para marcar si lo cumples; un mensaje indica cuántos te faltan o si estás en condiciones de iniciar la adopción (solo los requisitos explícitamente opcionales no cuentan como pendientes). También maneja los estados de carga, de error con opción de reintentar y vacío (sin requisitos registrados).

**Endpoint del back que usa:** `GET /api/adoption-requirements`.

### Revisión del proceso de adopción

_Como usuario quiero ver la información sobre el proceso de adopción, para verificar que sea la información correcta._

**Cómo visualizarla**

1. Levanta el back y el front (`npm run dev`).
2. Necesitas una adopción ya registrada (el back exige que tenga mascota y adoptante). Consulta los ids existentes con `GET /api/adoptions`.
3. Abre <http://localhost:3000/adoption.html?adoption=1> cambiando `1` por el id de la adopción.

La página muestra el número, la fecha y el estado de la adopción ...

**Endpoint del back que usa:** `GET /api/adoptions/{id}`.

## Pruebas

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

## DEMOSTRACIÓN

https://youtube.com/@juanestebaavilatrujillo1047?si=5SS2m4JyViYrMxGT
