FROM node:16-slim

RUN apt-get update
RUN apt-get install -y curl git unzip xz-utils zip libglu1-mesa python3 python3-pip gh jq
RUN apt-get clean
# Install opencode
RUN curl -fsSL https://opencode.ai/install | bash
