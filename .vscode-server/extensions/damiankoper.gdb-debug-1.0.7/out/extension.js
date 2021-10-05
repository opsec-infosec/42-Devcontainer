/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const mockDebug_1 = require("./mockDebug");
const Net = require("net");
/*
 * Set the following compile time flag to true if the
 * debug adapter should run inside the extension host.
 * Please note: the test suite does not (yet) work in this mode.
 */
const EMBED_DEBUG_ADAPTER = false;
function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand('extension.gdb-debug.getProgramName', config => {
        return vscode.window.showInputBox({
            placeHolder: "Please enter the name of a executable file in the workspace folder",
            value: "main.out"
        });
    }));
    // register a configuration provider for 'mock' debug type
    const provider = new MockConfigurationProvider();
    context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider('mock', provider));
    if (EMBED_DEBUG_ADAPTER) {
        const factory = new MockDebugAdapterDescriptorFactory();
        context.subscriptions.push(vscode.debug.registerDebugAdapterDescriptorFactory('mock', factory));
        context.subscriptions.push(factory);
    }
}
exports.activate = activate;
function deactivate() {
    // nothing to do
}
exports.deactivate = deactivate;
class MockConfigurationProvider {
    /**
     * Massage a debug configuration just before a debug session is being launched,
     * e.g. add all missing attributes to the debug configuration.
     */
    resolveDebugConfiguration(folder, config, token) {
        // if launch.json is missing or empty
        if (!config.type && !config.request && !config.name) {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document.languageId === 'gas') {
                config.type = 'gdb';
                config.name = 'Launch';
                config.request = 'launch';
                config.program = '${file}';
                config.stopOnEntry = true;
            }
        }
        if (!config.program) {
            return vscode.window.showInformationMessage("Cannot find a program to debug").then(_ => {
                return undefined; // abort launch
            });
        }
        return config;
    }
}
class MockDebugAdapterDescriptorFactory {
    createDebugAdapterDescriptor(session, executable) {
        if (!this.server) {
            // start listening on a random port
            this.server = Net.createServer(socket => {
                const session = new mockDebug_1.MockDebugSession();
                session.setRunAsServer(true);
                session.start(socket, socket);
            }).listen(0);
        }
        // make VS Code connect to debug server
        return new vscode.DebugAdapterServer(this.server.address().port);
    }
    dispose() {
        if (this.server) {
            this.server.close();
        }
    }
}
//# sourceMappingURL=extension.js.map