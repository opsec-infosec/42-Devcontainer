//----------------------------------------------------------
// 
// Helper string functions
// 
//----------------------------------------------------------

function isEmpty(str) {
  return !str || 0===str.length;
}
function trim(str) {
  if (str) str = str.trim();
  return str;
}


//----------------------------------------------------------
// 
// prefix mappings
// 
//----------------------------------------------------------

var recordTypeMapping = {
  '^': 'result',
  '~': 'stream',
  '&': 'stream',
  '@': 'stream',
  '*': 'async',
  '+': 'async',
  '=': 'async'
};

var outputTypeMapping = {
  '^': 'result',
  '~': 'console',
  '&': 'log',
  '@': 'target',
  '*': 'exec',
  '+': 'status',
  '=': 'notify'
};


/*
 * About gdb output
 * https://sourceware.org/gdb/onlinedocs/gdb/GDB_002fMI-Output-Syntax.html
 * 
 * output ==>
 *   ( out-of-band-record )* [ result-record ] "(gdb)" nl 
 * result-record ==>
 *   [ token ] "^" result-class ( "," result )* nl 
 * out-of-band-record ==>
 *   async-record | stream-record 
 * async-record ==>
 *   exec-async-output | status-async-output | notify-async-output 
 * exec-async-output ==>
 *   [ token ] "*" async-output nl 
 * status-async-output ==>
 *   [ token ] "+" async-output nl 
 * notify-async-output ==>
 *   [ token ] "=" async-output nl 
 * async-output ==>
 *   async-class ( "," result )* 
 * result-class ==>
 *   "done" | "running" | "connected" | "error" | "exit" 
 * async-class ==>
 *   "stopped" | others (where others will be added depending on the needs—this is still in development). 
 * result ==>
 *   variable "=" value 
 * variable ==>
 *   string 
 * value ==>
 *   const | tuple | list 
 * const ==>
 *   c-string 
 * tuple ==>
 *   "{}" | "{" result ( "," result )* "}" 
 * list ==>
 *   "[]" | "[" value ( "," value )* "]" | "[" result ( "," result )* "]" 
 * stream-record ==>
 *   console-stream-output | target-stream-output | log-stream-output 
 * console-stream-output ==>
 *   "~" c-string nl 
 * target-stream-output ==>
 *   "@" c-string nl 
 * log-stream-output ==>
 *   "&" c-string nl 
 * nl ==>
 *   CR | CR-LF 
 * token ==>
 *   any sequence of digits.
 * 
 * Notes:
 *   * All output sequences end in a single line containing a period.
 *   * The token is from the corresponding request. Note that for all async output, while the token is allowed by 
 *     the grammar and may be output by future versions of gdb for select async output messages, it is generally omitted. 
 *     Frontends should treat all async output as reporting general changes in the state of the target 
 *     and there should be no need to associate async output to any prior command.
 *   * status-async-output contains on-going status information about the progress of a slow operation. It can be discarded. 
 *     All status output is prefixed by ‘+’.
 *   * exec-async-output contains asynchronous state change on the target (stopped, started, disappeared). 
 *     All async output is prefixed by ‘*’.
 *   * notify-async-output contains supplementary information that the client should handle (e.g., a new breakpoint information). 
 *     All notify output is prefixed by ‘=’.
 *   * console-stream-output is output that should be displayed as is in the console. It is the textual response to a CLI command. 
 *     All the console output is prefixed by ‘~’.
 *   * target-stream-output is the output produced by the target program. All the target output is prefixed by ‘@’.
 *   * log-stream-output is output text coming from gdb's internals, for instance messages that should be displayed 
 *     as part of an error log. All the log output is prefixed by ‘&’.
 *   * New gdb/mi commands should only output lists containing values
 */

function eatWhitespace(line, i) {
  while (i<line.length && (line[i]==' '||line[i]=='\n'||line[i]=='\r'||line[i]=='\t')) ++i;
  return i;
}

function eatVariableName(line, i) {
  while (i<line.length && line[i]!='=') ++i;
  return i+1;
}

function nextVariableName(line, i) {
  var j = i;
  while (j<line.length && line[j]!='=') ++j;
  return [j, trim(line.substring(i, j))];
}

function nextValue(line, i) {
  if (line[i]=='"') return nextConst(line, i);        // parse const
  else if (line[i]=='{') return nextTuple(line, i);   // parse tuple
  else if (line[i]=='[') return nextList(line, i);    // parse list
}

// https://mathiasbynens.be/notes/javascript-escapes
function simpleUnescape(line) {
  return line.replace(/\\\\/g, '\\')  // backslash
             .replace(/\\n/g, '\n')   // line feed
             .replace(/\\r/g, '\r')   // carriage return
             .replace(/\\t/g, '\t')   // horizontal tab
             .replace(/\\'/g, '\'')   // single quote
             .replace(/\\"/g, '\"');  // double quote
}

function nextConst(line, i) {
  var j = i+1;
  while (j<line.length) {
    if (line[j]=='\\') ++j;
    else if (line[j]=='"') {
      var cString = simpleUnescape(trim(line.substring(i+1, j)));
      return [j+1, cString];
    }
    ++j;
  }
  var cString = simpleUnescape(trim(line.substring(i+1, j)));
  return [j+1, cString];
}

function nextResult(line, i) {
  // extract variable name
  var nameRes = nextVariableName(line, i);
  var varName = nameRes[1];
  i = eatWhitespace(line, nameRes[0]+1);

  // extract variable value
  var valRes = nextValue(line, i);
  if (!valRes) return undefined;
   
  var varValue = valRes[1];
  return [valRes[0], varName, varValue];
}

function nextTuple(line, i) {
  var ret = {};
  while (i<line.length && line[i]!='}') {   // INVARIANT: line[i]='{' or line[i]=',' or line[i]='}'
    var result = nextResult(line, i+1);
    if (!result) return [i+1, ret];
    
    ret[ result[1] ] = result[2];
    i = eatWhitespace(line, result[0]);   // i at ',', '}', or line end
  }
  return [i+1, ret];
}

function nextList(line, i) {
  var ret = [];
  while (i<line.length && line[i]!=']') {
    i = eatWhitespace(line, i+1);
    if (line[i]!=']') {
      if (line[i]!='"' && line[i]!='{' && line[i]!='[') {
        i = eatVariableName(line, i);
        i = eatWhitespace(line, i);
      }
      var valRes = nextValue(line, i);
      ret.push(valRes[1]);
      i = eatWhitespace(line, valRes[0]);
    }
  }
  return [i+1, ret];
}

function nextToken(line, i) {
  var j = i;
  while (j<line.length && line[j]>='0' && line[j]<='9') ++j;
  return [j, line.substring(i, j)];
}

function nextClass(line, i) {
  var j = i+1;
  while (j<line.length && line[j]!=',') ++j;
  return [j, trim(line.substring(i+1, j))];
}


function parseGdbMiLine(line) {
  // A '\\n' can be randomly found trailing some MI output :(
  if (line.endsWith('\\n')) line = line.substring(0, line.length-2);
  // extract numeric token, if present
  var tokenResult = nextToken(line, eatWhitespace(line, 0));
  var i = eatWhitespace(line, tokenResult[0]);
  // discover record type ('result', 'async', 'stream')
  // both 'async' and 'stream' are 'out-of-band-records'
  var prefix = line[i];
  var recordType = recordTypeMapping[prefix];
  // anything other than the existing prefixed is invalid output
  // usually the echo of a command
  if (recordType == undefined) return undefined;
  var outputType = outputTypeMapping[prefix];
  // discover result or async class
  var klass = undefined;
  var result = undefined;
  if (recordType=='stream') {
    klass = outputType;
    result = nextConst(line, i+1)[1];
  } else {
    var classResult = nextClass(line, i);
    klass = classResult[1];
    result = nextTuple(line, classResult[0])[1];
  }
  return {
    token: tokenResult[1],
    recordType: recordType,
    outputType: outputType,
    class: klass,
    result: result
  };
}

function parseGdbMiOut(data) {
  var outOfBandRecords = [];
  var resultRecord = undefined;
  var hasTerminator = false;
  // process each line separately
  var lines = data.toString().split("\n");
  for (var i = 0; i < lines.length; i++) {
    var line = trim(lines[i]);
    if (!isEmpty(line)) {
      if (line=='(gdb)') hasTerminator = true;
      else {
        var record = parseGdbMiLine(line);
        if (record != undefined) {
          if (record.recordType=='result') resultRecord = record;
          else outOfBandRecords.push(record);
        }
      }
    }
  }
  // output ==> ( out-of-band-record )* [ result-record ] "(gdb)" nl 
  return {
    hasTerminator: hasTerminator,
    outOfBandRecords: outOfBandRecords,
    resultRecord: resultRecord
  };
}

module.exports = parseGdbMiOut;

