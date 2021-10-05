const perf=require("../base/common/performance"),performance=require("perf_hooks").performance;perf.mark("code/server/start"),global.vscodeServerStartTime=performance.now();function start(){if(process.argv[2]==="--exec"){process.argv.splice(1,2),require(process.argv[1]);return}const e=require("minimist")(process.argv.slice(2),{boolean:["start-server","list-extensions","print-ip-address"],string:["install-extension","install-builtin-extension","uninstall-extension","locate-extension","socket-path","host","port"]});if(!e["start-server"]&&(!!e["list-extensions"]||!!e["install-extension"]||!!e["install-builtin-extension"]||!!e["uninstall-extension"]||!!e["locate-extension"])){loadCode().then(t=>{t.spawnCli()});return}let d=null,a=null;const i=()=>(a||(a=loadCode().then(t=>t.createServer(s))),a),f=require("http"),h=require("os");let p=!0,m=!0,s=null;const o=f.createServer(async(t,r)=>(p&&(p=!1,perf.mark("code/server/firstRequest")),(await i()).handleRequest(t,r)));o.on("upgrade",async(t,r)=>(m&&(m=!1,perf.mark("code/server/firstWebSocket")),(await i()).handleUpgrade(t,r))),o.on("error",async t=>(await i()).handleServerError(t));const v=e["socket-path"]?{path:e["socket-path"]}:{host:e.host,port:parsePort(e.port)};o.listen(v,async()=>{let t=`

*
* Visual Studio Code Server
*
* Reminder: You may only use this software with Visual Studio family products,
* as described in the license https://aka.ms/vscode-remote/license
*

`;if(typeof v.port=="number"&&e["print-ip-address"]){const r=h.networkInterfaces();Object.keys(r).forEach(function(c){r[c].forEach(function(l){!l.internal&&l.family==="IPv4"&&(t+=`IP Address: ${l.address}
`)})})}if(s=o.address(),s===null)throw new Error("Unexpected server address");t+=`Extension host agent listening on ${typeof s=="string"?s:s.port}
`,console.log(t),perf.mark("code/server/started"),global.vscodeServerListenTime=performance.now(),await i()}),process.on("exit",()=>{o.close(),d&&d.dispose()})}function parsePort(n){try{if(n)return parseInt(n)}catch(e){console.log("Port is not a number, using 8000 instead.")}return 8e3}function loadCode(){return new Promise((n,e)=>{const u=require("path");process.env.VSCODE_INJECT_NODE_MODULE_LOOKUP_PATH=process.env.VSCODE_INJECT_NODE_MODULE_LOOKUP_PATH||u.join(__dirname,"..","..","..","remote","node_modules"),require("../../bootstrap-node").injectNodeModuleLookupPath(process.env.VSCODE_INJECT_NODE_MODULE_LOOKUP_PATH),require("../../bootstrap-amd").load("vs/server/remoteExtensionHostAgent",n,e)})}start();

//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/7f6ab5485bbc008386c4386d08766667e155244e/core/vs/server/main.js.map
