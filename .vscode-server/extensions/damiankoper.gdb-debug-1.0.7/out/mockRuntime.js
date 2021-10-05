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
const events_1 = require("events");
const gdb_1 = require("./gdb");
/**
 * A Mock runtime with minimal debugger functionality.
 */
class MockRuntime extends events_1.EventEmitter {
    constructor() {
        super();
        // maps from sourceFile to array of Mock breakpoints
        this._breakPoints = new Map();
        // since we want to send breakpoint events, we will assign an id to every event
        // so that the frontend can match events with breakpoints.
        this._breakpointId = 1;
        this._exceptionId = 1;
        this.lastExceptionResult = null;
        this.running = false;
        this.disableRaw = () => this.rawDisabled = true;
        this.rawDisabled = false;
        this.gdb = new gdb_1.default();
        // Pipe everything to debugConsole output
        this.gdb.on('dataStream', (data) => {
            if (this.rawDisabled)
                this.rawDisabled = false;
            else {
                this.sendEvent('outputRaw', data);
            }
        });
        this.gdb.on('breakpointModified', (record) => {
            this.verifyBreakpoint(record);
        });
        this.gdb.on('stopped', (record) => {
            switch (record.result.reason) {
                case 'breakpoint-hit':
                    this.sendEvent('stopOnBreakpoint');
                    break;
                case 'syscall-entry':
                case 'end-stepping-range':
                    this.sendEvent('stopOnStep');
                    break;
                case 'exited-signalled':
                case 'exited-normally':
                    this.sendEvent('end');
                    break;
                case 'signal-received':
                    this.lastExceptionResult = record.result;
                    this.sendEvent('stopOnException', "Received signal");
                    break;
            }
        });
        this.gdb.on('end', () => {
            setTimeout(() => {
                this.sendEvent('end');
            }, 1000);
        });
    }
    isRunning() {
        return this.running;
    }
    getGdb() {
        return this.gdb;
    }
    start(program, stopOnEntry, args) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.gdb.initRegisters();
            yield this.gdb.send(`-file-exec-and-symbols ${program}\n`);
            //await this.gdb.send(`-interpreter-exec console "catch syscall"\n`)
            yield this.createBreakpoints();
            if (args)
                yield this.gdb.send(`-exec-arguments ${args}\n`);
            if (stopOnEntry)
                yield this.gdb.send(`-interpreter-exec console "starti"\n`);
            else
                yield this.gdb.send(`-exec-run\n`);
            //await this.gdb.send(`record\n`)
            this.running = true;
            return;
        });
    }
    reverse() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.gdb.send(`-exec-step --reverse\n`);
        });
    }
    continue() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.gdb.send(`-exec-continue\n`);
        });
    }
    step() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.gdb.send(`-exec-next\n`);
        });
    }
    stepIn() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.gdb.send(`-exec-step\n`);
        });
    }
    stack(startFrame, endFrame) {
        return __awaiter(this, void 0, void 0, function* () {
            let resp = yield this.gdb.send('-stack-list-frames\n');
            const frames = new Array();
            resp.resultRecord.result.stack.forEach((frameObj) => {
                frames.push({
                    index: parseInt(frameObj.level),
                    name: frameObj.func,
                    file: frameObj.fullname || 'unknown',
                    line: parseInt(frameObj.line) || 'unknown'
                });
            });
            return {
                frames: frames,
                count: frames.length
            };
        });
    }
    setBreakPoint(path, line) {
        return __awaiter(this, void 0, void 0, function* () {
            const bp = { verified: false, line, id: this._breakpointId++ };
            let bps = this._breakPoints.get(path);
            if (!bps) {
                bps = new Array();
                this._breakPoints.set(path, bps);
            }
            bps.push(bp);
            return bp;
        });
    }
    createBreakpoints(path = undefined) {
        return __awaiter(this, void 0, void 0, function* () {
            let bps = this._breakPoints.get(path);
            if (bps)
                for (const bp of bps) {
                    let record = yield this.gdb.send(`-break-insert ${path}${bp.line ? ':' + (bp.line) : ''}\n`);
                    if (record.resultRecord.class === 'error') {
                        this._breakpointId--;
                    }
                    else {
                        this.verifyBreakpoint(record.resultRecord);
                    }
                }
            else
                for (let [path, bps] of this._breakPoints) {
                    for (const bp of bps) {
                        let record = yield this.gdb.send(`-break-insert ${path}${bp.line ? ':' + (bp.line) : ''}\n`);
                        if (record.resultRecord.class === 'error') {
                            this._breakpointId--;
                        }
                        else {
                            this.verifyBreakpoint(record.resultRecord);
                        }
                    }
                }
            return;
        });
    }
    clearBreakpoints(path) {
        return __awaiter(this, void 0, void 0, function* () {
            let record = yield this.gdb.send(`-break-list\n`);
            let numbers = record.resultRecord.result.BreakpointTable.body.map(bkpt => {
                if (bkpt.fullname == path)
                    return parseInt(bkpt.number);
            }).filter(x => x);
            for (const num of numbers) {
                yield this.gdb.send(`-break-delete ${num}\n`);
            }
            this._breakPoints.delete(path);
            return;
        });
    }
    verifyBreakpoint(record) {
        record = record.result.bkpt;
        setTimeout(() => {
            this.sendEvent('breakpointValidated', {
                verified: true,
                line: parseInt(record.line),
                id: parseInt(record.number)
            });
        }, 250);
    }
    sendEvent(event, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(res => {
                setImmediate(_ => {
                    this.emit(event, ...args);
                    res();
                });
            });
        });
    }
    evaluateExpression(args) {
        return __awaiter(this, void 0, void 0, function* () {
            let exp = args.expression;
            // if register
            if (this.gdb.isRegister(exp)) {
                return (yield this.gdb.getRegisterValues([exp]))[exp];
            }
            // if examine memory
            else if (exp.trim().startsWith('-x')) {
                exp = exp.trim().slice(2).trim();
                let result = "";
                let record = yield this.gdb.send(`-data-read-memory ${exp}\n`);
                if (record.resultRecord.class === 'done') {
                    record.resultRecord.result.memory.forEach(row => {
                        let cols = row.data.join(' ');
                        result += `${row.addr}: ${cols} \n`;
                    });
                }
                else {
                    result = record.resultRecord.result.msg;
                }
                return result || "error";
            }
            // if print expresion
            else if (exp.trim().startsWith('-p')) {
                exp = exp.trim().slice(2).trim();
                let record = yield this.gdb.send(`-data-evaluate-expression "${exp}"\n`);
                if (record.resultRecord.class === 'done') {
                    return record.resultRecord.result.value;
                }
                return 'error';
            }
            // if raw
            else {
                this.gdb.sendRaw(`${exp}\n`);
                return "Output:";
            }
        });
    }
    // todo: useless for now
    getLastException() {
        this.lastExceptionResult;
        return {
            exceptionId: "" + this._exceptionId++,
            breakMode: 'unhandled',
            description: this.lastExceptionResult['signal-name'],
            details: {
                message: this.lastExceptionResult['signal-meaning'] + '. Core ' + this.lastExceptionResult['core'] + '.'
            }
        };
    }
}
exports.MockRuntime = MockRuntime;
//# sourceMappingURL=mockRuntime.js.map