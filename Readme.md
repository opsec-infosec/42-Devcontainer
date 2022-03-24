# THIS IS FOR INSTALL ON PERSONAL LAPTOP NOT INSIDE THE LABS
# Visual Studio Devcontainer for 42
This is a devcontainer for 42 coding with Visual Studio and docker.
Not For Use inside the 42 Labs.  This container is for outside the labs
on your personal PC's, if you want to run valgrind in the labs, use the 42-Valgrind
repo for that: https://github.com/opsec-infosec/42-ValgrindContainer

## Visual Studio Extension in Container
* C/C++ |  InteliSense, Debugging and Code Browsing
* 42 Header | [42 header for VSCode](https://github.com/kube/vscode-42header) by kube | modified by [secondfry](https://github.com/secondfry/vscode-42header)
* 42 Norminette Highlighter (3.x) | [42 Norminette Highlighter (3.x)](https://github.com/Mariusmivw/vscode-42-norminette-3-highlighter/) by Marius and Joppe
* GDB Debug | [GDB Debug extension](https://github.com/damiankoper/vscode-gdb-debug) by DamianKoper
* Selected Line Count | [Line Count Extenstion](https://github.com/gurumukhi/vscode-extension-line-count) by Ram Gurumukhi
* Makefile Tools | Microsoft
* PDF Viewer | Mathematic

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
* Valgrind
* htop
* libreadline8-dev
* libxext-dev
* libx11-dev
* minilibx-linux (under /usr/local/minilibx-linux)


## Installation Requirments

--------========== DO NOT INSTALL IN 42 LABS ==========--------

In order to use this devcontainer you must install the following on your machine:
* Docker for Desktop
* Visual Studio Code

### Required Extension of VSCode
Make sure you have the following extension install within vscode

* Remote - Containers (Microsoft)
* Remote - SSH (Microsoft)
* Remote - SSH: Editing Configuration Files (Microsoft)
* Remote - WSL (Microsoft)
* Remote Development (Microsoft)
* Docker (Microsoft)

## Running the Devcontainer
Clone this repo into a folder on your machine and open within vscode.
To run the devcontainer, hit F1, Remote-Containers: Rebuild and Reopen in Container
This will build the devcontainer with all the requirments for developing in 42

## Running in Windows
When launching the devcontainer, you may see some files that are changed.  To avoid problems with git and pushing your changes to your own repo, you should discard the changes after staring the devcontainer.  This should only need to be done one time.

## Root!
The user inside the container is root.  With root user comes with gret responsibility!! As this is a container, if you mess up (ie.. rm -rf /), the container will rebuild, but any files you share between the host and the container (/home/vscode/src) will be deleted on your host.  So always have a backup plan for your files when working in this devcontainer. YOU HAVE BEEN WARNED, Don't come crying to me because you didn't read this readme file.

## 42 Header
Open the 42header.env file and change the user to you login name.  This should be changed before you run the container or you will be turning in prooject as me!!.  Make the modifications, then re-open the folder in vscode as described above in the running the Devcontainer.  You will have to reopen and rebuild the container and it will take the setting from the 42header.env file.

example:
USER=dfurneau

This will create a header for dfurneau.  Change the dfurneau to your user login name, reopen and rebuild the container.

## User and Directory Structure
The directory opened (workspac) in vscode will be located under /home/vscode/src

The /home/vscode/src container directory is mapped to the /src directory on your host machine.  This means any changes done in the container will be reflected on your host and will be saved locally.

You should use the Cursus directory for your projects and create different folders for each project.. for example /src/Cursus/libft for the libft project.

Once you make a directory for your project... You can open the folder within vscode after running the container, by going to file->open folder .. then go to /home/vscode/src/Cursus/your_project_folder.  Vscode will keep the devcontainer loaded and open the folder.  You can then start coding and making your project files.

A sample helloworld.c program is available to verify the debugger and enviroment is running correctly.

## git
You should make your own .git ignore files in each of your project directories to exclude files from your repository.  For example a.out, .DS_Store, *.dSYM

## SSH Keys
You can copy your id_rsa and id_rsa.pub keys from your 42 account and copy them into the .ssh directory from this cloned repo.
This will allow you to git your repo from 42 (on the wireless network and during the shutdown) so you can work on it.

Or you can use your own repo, and put your ssh keys in the .ssh directory.  This will allow you to push, commit, and pull from your own github or gitlab repository.

## Seperate Terminal Usage (Advanced)
You can also open a terminal and connect to the running container (launched from vscode) and issue commands to the container.  To do this, first esecute: docker ps

and take note of the 42-Devcontainer name.  It should be somehthing like 42-devcontainer_devcontainer_development_1.

To launch into the container, issue the following command: docker exec -it 42-devcontainer_devcontainer_development_1 /bin/zsh
Assuming that the container name is 42-devcontainer_devcontainer_development_1

## Running Graphics (Advanced)
You will need an Xserver (such as XQuartz for Mac or vxcsrv for Windows)
Within the devcontainer you will have to export your environmental display and forward that to your
host computer running the devcontainer.  You will need the IP address of your mahcine (it's not 127.0.0.1) so
events can be forwarded to it, replace YOUR_IP_ADDRESS with your own ip address.  Then in the devcontainer terminal you will export the DISPLAY variable like:

export DISPLAY YOUR_IP_ADDRESS:0.0

OR you can add the above to your task.json file under .vscode like (thanks Mekky):

"environment": [{"name": "DISPLAY", "value": "YOUR IP ADDRESS:0.0" }],

Minilibx-linux is already cloned and installed within the devcontainer.  The source files can be found in /usr/local/minilibx-linux.  The library (.a) files have already been copied to /usr/local/lib and the header files are located under /usr/local/include.  If there are changes to the github minilibx you can pull them down by going into the /usr/local/minilibx-linux directory and executing a: git pull, this will pull the latest updates.  You will then have to do ./configure to re-compile the library and cp *.a /usr/local/lib && cp *.h /usr/local/include.  You can copy the /usr/local/minilibx-linux directory into your project if needed.

A note about using minilibx-linux... The keycodes within the devcontainer are not the same as they are on a mac... So be sure to take this into account if you plan on submitting your project in the 42 labs and plan for your project to be evaluated under mac osx.  You could do a conditional make file and include a -D flag to determine if your running in OSX or Linux and adjust the keycodes in your source... but this is beyond the scope of this document.

## Update the container after cloning
As there are PR and other updates to this repo, you can update the repo to get the latest changes.  To do this, go to the base folder of the repo you cloned (42-Devcontainer) and execute: git pull
This will pull the latest changes to the repo onto your local copy.  Reopen the container in VSCode and reopen-rebuild as described in running the devcontainer above.

## Feedback and Fixes
If there are issues or you want something changed in the devcontainer, please let me know by adding an issue on the repo.  Even better come up with a fix or solution, and do a pull request (PR) and I will review and merge the request

--opinfosec (RavenClaw Rocks!!)
