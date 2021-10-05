import * as vscode from 'vscode'
import * as child_process from 'child_process'
import { applyDecorations, clearDecorations } from './decorations'
import { IgnoreSystem, initNormignore, isIgnored } from './normignore'
import { execNorminette, NormInfo } from './norminette'
import * as os from 'os'

function getConfig(): vscode.WorkspaceConfiguration {
	return vscode.workspace.getConfiguration('codam-norminette-3')
}

type CommandData = { command: string, wsl: boolean }
function fetchCommand(): CommandData {
	const command = getConfig().get(`command`) as string
	try {
		const stdout = child_process.execSync(`${command} -v`).toString()
		if (!(/3\.\d+\.\d+\s*$/.test(stdout)))
			vscode.window.showErrorMessage(`Nominette: wrong version: ${stdout}, must be 3.x.x.`)
	} catch {
		if (os.platform() == 'win32')
		{
			try {
				const stdout = child_process.execSync(`wsl ${command} -v`).toString()
				if (!(/3\.\d+\.\d+\s*$/.test(stdout)))
					vscode.window.showErrorMessage(`Nominette: wrong version: ${stdout}, must be 3.x.x.`)
				return {command: `wsl ${command}`, wsl: true}
			} catch {}
		}
		vscode.window.showErrorMessage(`Norminette: \`${command}' not found, see https://github.com/42School/norminette for installation instructions.`)
		return null
	}
	return {command, wsl: command.startsWith('wsl ')}
}

function fetchPattern(): RegExp {
	return new RegExp(getConfig().get(`regex`) as string)
}

function fetchIgnoreErrors(): string[] {
	return getConfig().get(`ignoreErrors`) as string[]
}

let outputChannel: vscode.OutputChannel

export function log(msg: string) {
	if (!outputChannel)
		outputChannel = vscode.window.createOutputChannel('codam-norminette-3')
	outputChannel.appendLine(msg)
}

async function updateDecorations(editor: vscode.TextEditor, command: CommandData, pattern: RegExp, ignores: IgnoreSystem, ignoreErrors: string[]) {
	if (!editor || !command.command) return

	let path = editor.document.uri.path;
	if (os.platform() == 'win32')
	{
		path = path.slice(1); // windows ads a '/' prefix to every path so here we delete it
		if (command.wsl)
			path = path.replace(/^.:/, (m: string) => `/mnt/${m.slice(0, -1).toLowerCase()}`)
	}
	const filename: string = path.replace(/^.*[\\\/]/, '') // possibly just \/ instead of \\\/

	if (!pattern.test(filename)) return
	if (ignores && isIgnored(editor.document.uri, ignores)) return

	log(`Executing norminette on: ${path}`)

	const data: NormInfo[] = await execNorminette(path, command.command)
	log(`norm info: ${JSON.stringify(data)}`)
	if (data) applyDecorations(data, editor, ignoreErrors)
}

export function activate(context: vscode.ExtensionContext) {
	let enabled: boolean = true
	let command: CommandData = fetchCommand()
	let pattern: RegExp = fetchPattern()
	let ignoreErrors: string[] = fetchIgnoreErrors()
	const ignores: IgnoreSystem = initNormignore()
	const cmds = {
		'enable': () => {
			enabled = true
			for (const editor of vscode.window.visibleTextEditors) {
				updateDecorations(editor, command, pattern, ignores, ignoreErrors)
			}
		},
		'disable': () => {
			enabled = false
			for (const editor of vscode.window.visibleTextEditors) {
				clearDecorations(editor)
			}
		},
		'toggle': () => {
			if (enabled)
				cmds.disable()
			else
				cmds.enable()
		},
	}

	vscode.window.onDidChangeActiveTextEditor(editor => {
		if (editor)
			triggerUpdateDecorations(editor)
	}, null, context.subscriptions)

	vscode.workspace.onDidSaveTextDocument(document => {
		const editor = vscode.window.visibleTextEditors.find((editor) => editor.document === document)
		if (editor)
			triggerUpdateDecorations(editor)
	}, null, context.subscriptions)

	vscode.workspace.onDidChangeConfiguration((change) => {
		if (change.affectsConfiguration('codam-norminette-3')) {
			command = fetchCommand()
			pattern = fetchPattern()
			ignoreErrors = fetchIgnoreErrors()
		}
	})

	let timeout: NodeJS.Timeout = undefined
	function triggerUpdateDecorations(editor: vscode.TextEditor) {
		if (timeout)
			clearTimeout(timeout)
		timeout = setTimeout(() => {
			if (enabled)
				updateDecorations(editor, command, pattern, ignores, ignoreErrors)
			else
				clearDecorations(editor)
		}, 500) // delay for when switching tabs fast
	}

	for (const cmd in cmds) {
		context.subscriptions.push(vscode.commands.registerCommand(`codam-norminette-3.${cmd}`, cmds[cmd]))
	}

	for (const editor of vscode.window.visibleTextEditors) {
		updateDecorations(editor, command, pattern, ignores, ignoreErrors)
	}
}
