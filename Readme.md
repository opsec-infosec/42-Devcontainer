# Visual Studio Devcontainer for 42
This is a devcontainer for 42 coding with Visual Studio and docker

## Visual Studio Extension
* C/C++ |  InteliSense, Debugging and Code Browsing
* 42 Header | 42 header for VSCode by kube
* 42 Norminette Highlighter (3.x) | Norminette for 42 v3.3.32 by Marius
* GDB Debug | GDB Debug extension by DamianKoper

## Installed Linux Packages
* gcc
* build-essential
* gdb
* python3
* pip
* norminette (pip module)
* zip
* unzip
* libtool
* pkg-config


## Installation Requirments

In order to use this devcontainer you must install the following on your machine:
* Docker for Desktop
* Visual Studio Code

## Running the Devcontainer

To run the devcontainer, open visual studio, hit F1, Remote-Containers: Rebuild and Reopen in Container
This will build the devcontainer with all the requirments for developing in 42

## User and Directory Structure
The directory opened (workspac) in vscode will be located under /home/vscode/src

The /home/vscode/src container directory is mapped to the /src directory on your host machine.  This means any changes done in the container will be reflected on your host and will be saved locally.

You should use the Cursus directory for your projects and create different folders for each project.. for example /src/Cursus/libft for the libft project.

A sample helloworld.c program is available to verify the debugger and enviroment is running correctly.

## git 
You should remove the .git folder on the host machine so you can push to your own repository.
rm -rf .git in the base directory of the cloned repository.

You should also make your own .git ignore files in each of your project directories to exclude files from your repository.  For example a.out, .DS_Store, *.dSYM



