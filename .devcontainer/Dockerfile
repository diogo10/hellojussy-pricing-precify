FROM node:24-slim

RUN apt-get update
RUN apt-get install -y curl git unzip xz-utils zip libglu1-mesa python3 python3-pip gh jq gnupg
RUN apt-get clean

# Install MongoDB
RUN curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor && \
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/debian bookworm/mongodb-org/7.0 main" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list && \
    apt-get update && \
    apt-get install -y mongodb-org && \
    apt-get clean

# Install opencode
RUN curl -fsSL https://opencode.ai/install | bash
