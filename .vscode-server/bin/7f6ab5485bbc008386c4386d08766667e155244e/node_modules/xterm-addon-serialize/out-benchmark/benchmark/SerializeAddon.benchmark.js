"use strict";
/**
 * Copyright (c) 2019 The xterm.js authors. All rights reserved.
 * @license MIT
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const xterm_benchmark_1 = require("xterm-benchmark");
const node_pty_1 = require("node-pty");
const TextDecoder_1 = require("common/input/TextDecoder");
const Terminal_1 = require("browser/public/Terminal");
const SerializeAddon_1 = require("SerializeAddon");
class TestTerminal extends Terminal_1.Terminal {
    writeSync(data) {
        this._core.writeSync(data);
    }
}
xterm_benchmark_1.perfContext('Terminal: sh -c "dd if=/dev/urandom count=40 bs=1k | hexdump | lolcat -f"', () => {
    let content = '';
    let contentUtf8;
    xterm_benchmark_1.before(() => __awaiter(void 0, void 0, void 0, function* () {
        const p = node_pty_1.spawn('sh', ['-c', 'dd if=/dev/urandom count=40 bs=1k | hexdump | lolcat -f'], {
            name: 'xterm-256color',
            cols: 80,
            rows: 25,
            cwd: process.env.HOME,
            env: process.env,
            encoding: null // needs to be fixed in node-pty
        });
        const chunks = [];
        let length = 0;
        p.on('data', data => {
            chunks.push(data);
            length += data.length;
        });
        yield new Promise(resolve => p.on('exit', () => resolve()));
        contentUtf8 = Buffer.concat(chunks, length);
        // translate to content string
        const buffer = new Uint32Array(contentUtf8.length);
        const decoder = new TextDecoder_1.Utf8ToUtf32();
        const codepoints = decoder.decode(contentUtf8, buffer);
        for (let i = 0; i < codepoints; ++i) {
            content += TextDecoder_1.stringFromCodePoint(buffer[i]);
            // peek into content to force flat repr in v8
            if (!(i % 10000000)) {
                content[i];
            }
        }
    }));
    xterm_benchmark_1.perfContext('serialize', () => {
        let terminal;
        const serializeAddon = new SerializeAddon_1.SerializeAddon();
        xterm_benchmark_1.before(() => {
            terminal = new TestTerminal({ cols: 80, rows: 25, scrollback: 5000 });
            serializeAddon.activate(terminal);
            terminal.writeSync(content);
        });
        new xterm_benchmark_1.ThroughputRuntimeCase('', () => {
            return { payloadSize: serializeAddon.serialize().length };
        }, { fork: false }).showAverageThroughput();
    });
});
