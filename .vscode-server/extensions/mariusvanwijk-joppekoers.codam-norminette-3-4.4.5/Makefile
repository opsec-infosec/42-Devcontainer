# **************************************************************************** #
#                                                                              #
#                                                         ::::::::             #
#    Makefile                                           :+:    :+:             #
#                                                      +:+                     #
#    By: mvan-wij <mvan-wij@student.codam.nl>         +#+                      #
#                                                    +#+                       #
#    Created: 2021/02/24 13:33:13 by mvan-wij      #+#    #+#                  #
#    Updated: 2021/02/25 00:57:14 by mvan-wij      ########   odam.nl          #
#                                                                              #
# **************************************************************************** #

include secrets.mk

NPM_RUN = npm run
# NPM_RUN = yarn

VSCE = npx vsce
OVSX = npx ovsx

help:
	@echo "Possible commands:"
	@echo "\thelp:			Shows this help message"
	@echo "\tpublish:		Publishes the extension to both marketplaces"
	@echo "\tcompile:		Compiles the source code"
	@echo "\tpackage:		Packages the compiled code into a .vsix file"
	@echo "\tpublish-vsc:		[NOT WORKING] Publishes the extension to the official marketplace"
	@echo "\tpublish-vsx-source:	Publishes the extension to the OpenVSX marketplace"
	@echo "\tpublish-vsx-package:	Publishes the .vsix file to the OpenVSX marketplace"
	@echo "\tvsc-login:			Logs you into the official marketplace"
	@echo "\tcreate-namespace:	Creates a namespace on the OpenVSX marketplace"

publish:
	cd ..
	echo "$(VSC_TOKEN)" | $(VSCE) publish
	$(OVSX) publish -p $(VSX_TOKEN)

compile:
	$(NPM_RUN) vscode:prepublish

package: compile
	$(VSCE) package

publish-vsc: vsc-login
	$(VSCE) publish

publish-vsx-source:
	$(OVSX) publish -p $(VSX_TOKEN)

publish-vsx-package:
	$(OVSX) publish *.vsix -p $(VSX_TOKEN)

vsc-login:
	echo "$(VSC_TOKEN)" | $(VSCE) login $(NAMESPACE)

vsc-logout:
	$(VSCE) login $(NAMESPACE)

create-namespace:
	$(OVSX) create-namespace $(NAMESPACE) -p $(VSX_TOKEN)

.PHONY = compile package publish-vsc publish-vsx-source publish-vsx-package vsc-login create-namespace
