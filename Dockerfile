#################
# 42 Devcontainer

FROM debian:latest

# Suppress an apt-key warning about standard out not being a terminal. Use in this script is safe.
ENV APT_KEY_DONT_WARN_ON_DANGEROUS_USAGE=DontWarn
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update --no-install-recommends -y

RUN apt-get install --no-install-recommends \
	'man-db' \
	'less' \
    'build-essential' \
	"libtool-bin" \
    "valgrind" \
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
    'git' \
    'openssh-server' \
    'dialog' \
    'llvm' \
    'clang' \
	'libbsd-dev' \
	'curl' \
	'wget' \
	'zsh' \
	'nano' \
	'vim' -y \
    && apt-get clean autoclean \
    && apt-get autoremove --yes \
    && rm -rf /var/lib/{apt,dpkg,cache,log}/ 

RUN python3 -m pip install --upgrade pip setuptools && python3 -m pip install norminette
RUN sh -c "$(wget https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh -O -)"  \
	&& echo 'PROMPT=%B%F{blue}[DEVCONTAINER]%f%b$PROMPT' >> /root/.zshrc

RUN mkdir -p /home/vscode/src && mkdir -p /root/.ssh 

COPY ./.ssh/ /root/.ssh/

WORKDIR /home/vscode
COPY ./src ./src/

WORKDIR /home/vscode/src

ENV DEBIAN_FRONTEND=dialog


LABEL maintainer="Dale Furneaux <opinfosec>" \
      version="1.2.0"

