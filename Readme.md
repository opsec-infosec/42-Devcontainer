# Visual Studio Devcontainer for 42
This is a devcontainer for 42 coding with Visual Studio and docker

## Visual Studio Extension in Container
* C/C++ |  InteliSense, Debugging and Code Browsing
* 42 Header | [42 header for VSCode](https://github.com/kube/vscode-42header) by kube
* 42 Norminette Highlighter (3.x) | [42 Norminette Highlighter (3.x)](https://github.com/Mariusmivw/vscode-42-norminette-3-highlighter/) by Marius and Joppe
* GDB Debug | [GDB Debug extension](https://github.com/damiankoper/vscode-gdb-debug) by DamianKoper

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

### Required Extension of VSCode
* Remote - Containers (Microsoft)
* Remote - SSH (Microsoft)
* Remote - SSH: Editing Configuration Files (Microsoft)
* Remote - WSL (Microsoft)
* Remote Development (Microsoft)
* Docker (Microsoft)

## Running the Devcontainer

To run the devcontainer, open visual studio, hit F1, Remote-Containers: Rebuild and Reopen in Container
This will build the devcontainer with all the requirments for developing in 42

## Running in Windows
When launching the devcontainer, you may see some files that are changed.  To avoid problems with git and pushing your changes to your own repo, you should discard the changes after staring the devcontainer.  This should only need to be done one time.

## Root!
The user inside the container is root.  With root user comes with gret responsibility!! As this is a container, if you mess up (ie.. rm -rf /), the container will rebuild, but any files you share between the host and the container (/home/vscode/src) will be deleted on your host.  So always have a backup plan for your files when working in this devcontainer. YOU HAVE BEEN WARNED, Don't come crying to me because you didn't read this readme file.

## 42 Header
Open the 42.header.env file and change the user to you login name

example:
USER=dfurneau

This will create a header for dfurneau.  Change the dfurneau to your user login name.

## User and Directory Structure
The directory opened (workspac) in vscode will be located under /home/vscode/src

The /home/vscode/src container directory is mapped to the /src directory on your host machine.  This means any changes done in the container will be reflected on your host and will be saved locally.

You should use the Cursus directory for your projects and create different folders for each project.. for example /src/Cursus/libft for the libft project.

A sample helloworld.c program is available to verify the debugger and enviroment is running correctly.

## git 
You should make your own .git ignore files in each of your project directories to exclude files from your repository.  For example a.out, .DS_Store, *.dSYM

## SSH Keys
You can copy your id_rsa and id_rsa.pub keys from your 42 account and copy them into the .ssh directory from this cloned repo.
This will allow you to git your repo from 42 (on the wireless network) so you can work on it.

Or you can use your own repo, and put your ssh keys in the .ssh directory.  This will allow you to push, commit, and pull from your own github or gitlab repository.

## Feedback and Fixes
If there are issues or you want something changed in the devcontainer, please let me know by adding an issue on the repo.  Even better come up with a fix or solution, and do a pull request (PR) and I will review and merge the request

--opinfosec (RavenClaw Rocks!!)
