FROM mcr.microsoft.com/devcontainers/universal:linux

ARG SAM_FILE=aws-sam.zip
ARG SAM_INSTALL=sam-inst

RUN mkdir -p /tmp/setup \
    && curl -L -o ${SAM_FILE} https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip \
    && unzip ${SAM_FILE} -d ${SAM_INSTALL} \
    && ./${SAM_INSTALL}/install \
    && sam --version \
    && rm -rf ${SAM_FILE} ${SAM_INSTALL}

RUN wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list \
    && sudo apt update && sudo apt install terraform
