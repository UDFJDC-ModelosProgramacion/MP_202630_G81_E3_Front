FROM jenkins/jenkins:lts-jdk21

USER root
COPY --from=docker:cli /usr/local/bin/docker /usr/local/bin/docker

USER jenkins
RUN jenkins-plugin-cli --plugins \
    git \
    workflow-aggregator \
    docker-workflow \
    credentials-binding \
    github-branch-source \
    pipeline-stage-view \
    sonar
