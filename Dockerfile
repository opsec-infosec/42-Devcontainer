#################
# Tesseract Build

FROM debian:latest

# Suppress an apt-key warning about standard out not being a terminal. Use in this script is safe.
ENV APT_KEY_DONT_WARN_ON_DANGEROUS_USAGE=DontWarn
ENV DEBIAN_FRONTEND=noninteractive

RUN  apt-get update --no-install-recommends -y

RUN apt-get install --no-install-recommends\
    'build-essential' \
    "gdb" \
    'automake' \
    'make' \
    'ca-certificates' \
    'g++' \
    'libtool' \
    'pkg-config' \ 
    'manpages-dev' \
    'zip' \
    'unzip' \
    'python3' \
    'python3-pip' \
    'dialog' -y

# apt-get install automake ca-certificates g++ git libtool libleptonica-dev make pkg-config

RUN python3 -m pip install --upgrade pip setuptools
RUN python3 -m pip install norminette

RUN adduser --system --group --home /home/vscode  vscode && usermod -s /bin/bash vscode
RUN mkdir -p /home/vscode/src && chown -R vscode:vscode /home/vscode/

WORKDIR /home/vscode/
USER vscode

# Copy application code to api directory
COPY --chown=vscode:vscode . .

WORKDIR /home/vscode/src/

ENV DEBIAN_FRONTEND=dialog


LABEL maintainer="Dale Furneaux <opinfosec>" \
      version="1.0.0"

