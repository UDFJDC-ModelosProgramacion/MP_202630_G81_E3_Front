pipeline {
   agent any

   environment {
      CI_NETWORK = 'mp-ci'
      SONARQUBE_URL = 'http://sonarqube:9000/sonar'
      SONAR_TOKEN = credentials('sonar-login')
      NODE_IMAGE = 'node:22-alpine'
      SCANNER_IMAGE = 'sonarsource/sonar-scanner-cli:latest'
   }

   options {
      timestamps()
   }

   stages {
      stage('Checkout') {
         steps {
            checkout scm
         }
      }

      stage('Install') {
         steps {
            script {
               docker.image(env.NODE_IMAGE).inside('-u root') {
                  sh 'node --version && npm --version'
                  sh 'npm ci'
               }
            }
         }
      }

      stage('Lint y formato') {
         steps {
            script {
               docker.image(env.NODE_IMAGE).inside('-u root') {
                  sh 'npm run lint'
                  sh 'npm run format:check'
               }
            }
         }
      }

      stage('Pruebas y cobertura') {
         steps {
            script {
               docker.image(env.NODE_IMAGE).inside('-u root') {
                  // Falla si no se cumplen los umbrales de cobertura de vitest.config.js
                  sh 'npm run coverage'
               }
            }
         }
      }

      stage('Static Analysis') {
         steps {
            script {
               docker.image(env.SCANNER_IMAGE).inside("-u root --entrypoint= --network ${env.CI_NETWORK}") {
                  sh 'sonar-scanner -Dsonar.host.url=${SONARQUBE_URL} -Dsonar.token=${SONAR_TOKEN}'
               }
            }
         }
      }
   }

   post {
      always {
         archiveArtifacts artifacts: 'coverage/lcov.info', allowEmptyArchive: true
         cleanWs()
      }
   }
}
