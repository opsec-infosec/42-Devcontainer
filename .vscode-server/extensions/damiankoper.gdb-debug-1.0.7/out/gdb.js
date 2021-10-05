"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const childProcess = require("child_process");
const events_1 = require("events");
const stream = require("stream");
const parseGdbMiOut = require("gdb-mi-parser");
const async = require("async");
class Gdb extends events_1.EventEmitter {
    constructor() {
        super();
        this.disableRaw = () => this.rawDisabled = true;
        this.rawDisabled = false;
        this.registers = [];
        this.queue = async.queue((command, callback) => __awaiter(this, void 0, void 0, function* () {
            this.gdb.stdin.write(command);
            let resp = yield this.getGdbResponse();
            callback(resp);
        }), 1);
        this.gdb = childProcess.spawn('gdb', ['-q', '--interpreter', 'mi']);
        this.gdb.stdout.setEncoding('utf8');
        this.gdb.stderr.setEncoding('utf8');
        // Clone stream (pipe to passThrough)
        this.stdOutErrPassThrough_1 = new stream.PassThrough();
        this.stdOutErrPassThrough_1.setEncoding('utf8');
        this.stdOutErrPassThrough_2 = new stream.PassThrough();
        this.stdOutErrPassThrough_2.setEncoding('utf8');
        this.gdb.stdout.pipe(this.stdOutErrPassThrough_1);
        this.gdb.stderr.pipe(this.stdOutErrPassThrough_1);
        this.gdb.stdout.pipe(this.stdOutErrPassThrough_2);
        this.gdb.stderr.pipe(this.stdOutErrPassThrough_2);
        this.stdOutErrPassThrough_2.on('data', (data) => {
            // trick to somehow filter program output - working on tty topic
            this.emit('dataStream', data.split(/\^|\*|\=|\~"|\&"|\(gdb\)/g)[0]);
            let parsed = parseGdbMiOut(data);
            parsed.outOfBandRecords.map(((x) => {
                if (x.recordType === 'stream') {
                    if (x.outputType === 'console')
                        return x.result;
                }
            })).filter((x) => x).forEach((str) => {
                this.emit('dataStream', str);
                if (str.includes('No more reverse-execution history'))
                    this.emit('end');
                if (str.includes('The next instruction is syscall exit'))
                    this.emit('end');
            });
            /* if (parsed.outOfBandRecords.length)
                this.emit('dataStream', JSON.stringify(parsed)) */
            parsed.outOfBandRecords.forEach((record) => {
                switch (record.class) {
                    case 'breakpoint-created':
                    case 'breakpoint-modified':
                        this.emit('breakpointModified', record);
                        break;
                    case 'stopped':
                        this.emit('stopped', record);
                        break;
                    // and more to come
                }
            });
        });
    }
    send(command) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                this.queue.push(command, (resp) => __awaiter(this, void 0, void 0, function* () {
                    resolve(resp);
                }));
            });
        });
    }
    getGdbResponse() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((res, rev) => {
                let callback = (data) => {
                    let parsed = parseGdbMiOut(data);
                    if (parsed.resultRecord) {
                        this.stdOutErrPassThrough_1.removeListener('data', callback);
                        res(parsed);
                    }
                };
                this.stdOutErrPassThrough_1.on('data', callback);
            });
        });
    }
    sendRaw(command) {
        this.gdb.stdin.write(command);
    }
    initRegisters() {
        return __awaiter(this, void 0, void 0, function* () {
            let resultRecord = yield this.send('-data-list-register-names\n');
            if (resultRecord.resultRecord && resultRecord.resultRecord.class === 'done')
                this.registers = resultRecord.resultRecord.result['register-names'];
        });
    }
    getRegisterValues(registers = []) {
        return __awaiter(this, void 0, void 0, function* () {
            if (registers.length === 0) {
                registers = this.registers.filter(r => r);
            }
            let numbers = [];
            numbers = registers.map(reg => {
                return this.registers.indexOf(reg);
            });
            let result = {};
            let values = yield this.send(`-data-list-register-values x ${numbers.join(' ')}\n`);
            if (values && values.resultRecord && values.resultRecord.class === 'done')
                values.resultRecord.result['register-values'].forEach(data => {
                    result[this.registers[data.number]] = data.value;
                });
            return result;
        });
    }
    isRegister(reg) {
        return this.registers.find((v) => v === reg);
    }
}
exports.default = Gdb;
//# sourceMappingURL=gdb.js.map