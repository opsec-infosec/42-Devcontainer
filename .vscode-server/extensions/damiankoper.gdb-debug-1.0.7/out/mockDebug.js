"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_debugadapter_1 = require("vscode-debugadapter");
const path_1 = require("path");
const mockRuntime_1 = require("./mockRuntime");
const { Subject } = require('await-notify');
class MockDebugSession extends vscode_debugadapter_1.LoggingDebugSession {
    /**
     * Creates a new debug adapter that is used for one debug session.
     * We configure the default implementation of a debug adapter here.
     */
    constructor() {
        super("mock-debug.txt");
        this._variableHandles = new vscode_debugadapter_1.Handles();
        this._configurationDone = new Subject();
        // this debugger uses zero-based lines and columns
        this.setDebuggerLinesStartAt1(true);
        this.setDebuggerColumnsStartAt1(true);
        this._runtime = new mockRuntime_1.MockRuntime();
        // setup event handlers
        this._runtime.on('stopOnEntry', () => {
            this.sendEvent(new vscode_debugadapter_1.StoppedEvent('entry', MockDebugSession.THREAD_ID));
        });
        this._runtime.on('stopOnStep', () => {
            this.sendEvent(new vscode_debugadapter_1.StoppedEvent('step', MockDebugSession.THREAD_ID));
        });
        this._runtime.on('stopOnBreakpoint', () => {
            this.sendEvent(new vscode_debugadapter_1.StoppedEvent('breakpoint', MockDebugSession.THREAD_ID));
        });
        this._runtime.on('stopOnException', (data) => {
            let event = new vscode_debugadapter_1.StoppedEvent('exception', MockDebugSession.THREAD_ID, data);
            this.sendEvent(event);
        });
        this._runtime.on('breakpointValidated', (bp) => {
            this.sendEvent(new vscode_debugadapter_1.BreakpointEvent('changed', { verified: bp.verified, id: bp.id, line: bp.line }));
        });
        this._runtime.on('output', (text, filePath, line, column) => {
            const e = new vscode_debugadapter_1.OutputEvent(`${text}\n`);
            e.body.source = this.createSource(filePath);
            e.body.line = this.convertDebuggerLineToClient(line);
            e.body.column = this.convertDebuggerColumnToClient(column);
            this.sendEvent(e);
        });
        this._runtime.on('outputRaw', (text) => {
            if (text != "") {
                const e = new vscode_debugadapter_1.OutputEvent(`${text}\n`, 'stdout');
                this.sendEvent(e);
            }
        });
        this._runtime.on('end', () => {
            this.sendEvent(new vscode_debugadapter_1.TerminatedEvent());
        });
    }
    /**
     * The 'initialize' request is the first request called by the frontend
     * to interrogate the features the debug adapter provides.
     */
    initializeRequest(response, args) {
        // build and return the capabilities of this debug adapter:
        response.body = response.body || {};
        // the adapter implements the configurationDoneRequest.
        response.body.supportsConfigurationDoneRequest = true;
        response.body.supportsExceptionInfoRequest = true;
        // make VS Code to use 'evaluate' when hovering over source
        response.body.supportsEvaluateForHovers = true;
        // make VS Code to show a 'step back' button
        response.body.supportsStepBack = true;
        this.sendResponse(response);
        // since this debug adapter can accept configuration requests like 'setBreakpoint' at any time,
        // we request them early by sending an 'initializeRequest' to the frontend.
        // The frontend will end the configuration sequence by calling 'configurationDone' request.
        this.sendEvent(new vscode_debugadapter_1.InitializedEvent());
    }
    /**
     * Called at the end of the configuration sequence.
     * Indicates that all breakpoints etc. have been sent to the DA and that the 'launch' can start.
     */
    configurationDoneRequest(response, args) {
        super.configurationDoneRequest(response, args);
        // notify the launchRequest that configuration has finished
        this._configurationDone.notify();
    }
    launchRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            // make sure to 'Stop' the buffered logging if 'trace' is not set
            vscode_debugadapter_1.logger.setup(args.trace ? vscode_debugadapter_1.Logger.LogLevel.Verbose : vscode_debugadapter_1.Logger.LogLevel.Stop, false);
            // wait until configuration has finished (and configurationDoneRequest has been called)
            yield this._configurationDone.wait(1000);
            // start the program in the runtime
            yield this._runtime.start(args.program, !!args.stopOnEntry, args.arguments);
            this.sendResponse(response);
        });
    }
    setBreakPointsRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            const path = args.source.path;
            const clientLines = args.lines || [];
            // clear all breakpoints for this file
            yield this._runtime.clearBreakpoints(path);
            // set and verify breakpoint locations
            const actualBreakpoints = [];
            for (let i = 0; i < clientLines.length; i++) {
                let { verified, line, id } = yield this._runtime.setBreakPoint(path, this.convertClientLineToDebugger(clientLines[i]));
                const bp = new vscode_debugadapter_1.Breakpoint(verified, this.convertDebuggerLineToClient(line));
                bp.id = id;
                actualBreakpoints.push(bp);
            }
            if (this._runtime.isRunning())
                yield this._runtime.createBreakpoints(path);
            // send back the actual breakpoint positions, wait fot gdb
            response.body = {
                breakpoints: actualBreakpoints
            };
            this.sendResponse(response);
        });
    }
    threadsRequest(response) {
        // runtime supports now threads so just return a default thread.
        response.body = {
            threads: [
                new vscode_debugadapter_1.Thread(MockDebugSession.THREAD_ID, "thread 1")
            ]
        };
        this.sendResponse(response);
    }
    stackTraceRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            const startFrame = typeof args.startFrame === 'number' ? args.startFrame : 0;
            const maxLevels = typeof args.levels === 'number' ? args.levels : 1000;
            const endFrame = startFrame + maxLevels;
            const stk = yield this._runtime.stack(startFrame, endFrame);
            response.body = {
                stackFrames: stk.frames.map(f => new vscode_debugadapter_1.StackFrame(f.index, f.name, this.createSource(f.file), this.convertDebuggerLineToClient(f.line))),
                totalFrames: stk.count
            };
            this.sendResponse(response);
        });
    }
    scopesRequest(response, args) {
        const frameReference = args.frameId;
        const scopes = new Array();
        scopes.push(new vscode_debugadapter_1.Scope("Registers", this._variableHandles.create("registers_" + frameReference), false));
        //scopes.push(new Scope("Global", this._variableHandles.create("global_" + frameReference), true));
        response.body = {
            scopes: scopes
        };
        this.sendResponse(response);
    }
    variablesRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            const variables = new Array();
            const id = this._variableHandles.get(args.variablesReference);
            if (id.startsWith('registers')) {
                let values = yield this._runtime.getGdb().getRegisterValues();
                for (var name in values) {
                    variables.push({
                        name: name,
                        value: values[name],
                        variablesReference: 0
                    });
                }
            }
            response.body = {
                variables: variables
            };
            this.sendResponse(response);
        });
    }
    continueRequest(response, args) {
        this._runtime.continue();
        this.sendResponse(response);
    }
    reverseContinueRequest(response, args) {
        this._runtime.reverse();
        this.sendResponse(response);
    }
    nextRequest(response, args) {
        this._runtime.step();
        this.sendResponse(response);
    }
    stepBackRequest(response, args) {
        this._runtime.step();
        this.sendResponse(response);
    }
    stepInRequest(response, args) {
        this._runtime.stepIn();
        this.sendResponse(response);
    }
    evaluateRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            this._runtime.disableRaw();
            let res = yield this._runtime.evaluateExpression(args);
            if (res) {
                response.body = {
                    result: res,
                    variablesReference: 0
                };
            }
            this.sendResponse(response);
        });
    }
    //---- helpers
    createSource(filePath) {
        return new vscode_debugadapter_1.Source(path_1.basename(filePath), this.convertDebuggerPathToClient(filePath), undefined, undefined, 'mock-adapter-data');
    }
    exceptionInfoRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            // todo: does not work
            this.sendResponse(response);
        });
    }
}
// we don't support multiple threads, so we can use a hardcoded ID for the default thread
MockDebugSession.THREAD_ID = 1;
exports.MockDebugSession = MockDebugSession;
//# sourceMappingURL=mockDebug.js.map