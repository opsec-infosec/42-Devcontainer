import ignore, { Ignore } from 'ignore'
import * as fs from 'fs';
import * as path from 'path'
import * as vscode from 'vscode'
import { log } from './extension'

export type IgnoreSystem = {
	ignored: string[],
	notIgnored: string[],
	workspaces: {
		[workspace: string]: {
			[folder: string]: Ignore
		}
	}
}

export function initNormignore(): IgnoreSystem {
	const ignores: IgnoreSystem = { ignored: [], notIgnored: [], workspaces: {} }

	async function addIgnoreFile(fsPath: string, workspace: string, ignorePath: string) {
		if (!ignores.workspaces[workspace])
			ignores.workspaces[workspace] = {}
		log('created / changed: ' + fsPath)
		const fileContent = (await fs.promises.readFile(fsPath)).toString()
		ignores.workspaces[workspace][ignorePath] = ignore().add(fileContent)
	}

	function get(fileUri: vscode.Uri): { workspace: string, ignorePath: string } {
		const workspace = vscode.workspace.getWorkspaceFolder(fileUri).uri.path
		if (!workspace)
			return { workspace: null, ignorePath: null }
		const ignorePath = path.dirname(path.relative(workspace, fileUri.path))
		return { workspace, ignorePath }
	}

	vscode.workspace.findFiles('**/.normignore').then(async (fileUris) => {
		for (const fileUri of fileUris) {
			const { workspace, ignorePath } = get(fileUri)
			if (workspace)
				addIgnoreFile(fileUri.fsPath, workspace, ignorePath)
		}
	})

	async function onChange(fileUri: vscode.Uri) {
		const { workspace, ignorePath } = get(fileUri)
		ignores.ignored = []
		ignores.notIgnored = []
		if (workspace)
			addIgnoreFile(fileUri.fsPath, workspace, ignorePath)
	}
	const watcher = vscode.workspace.createFileSystemWatcher('**/.normignore')
	watcher.onDidCreate(onChange)
	watcher.onDidChange(onChange)
	watcher.onDidDelete((fileUri) => {
		const { workspace, ignorePath } = get(fileUri)
		ignores.ignored = []
		ignores.notIgnored = []
		log('deleted: ' + fileUri.fsPath)
		if (workspace && ignores.workspaces[workspace] && ignores.workspaces[workspace][ignorePath])
			delete ignores.workspaces[workspace][ignorePath]
	})

	return ignores
}

export function isIgnored(fileUri: vscode.Uri, ignores: IgnoreSystem): boolean {
	const workspace = vscode.workspace.getWorkspaceFolder(fileUri).uri.path
	if (!workspace || !ignores.workspaces[workspace])
		return false
	const filePath = path.relative(workspace, fileUri.path)
	if (ignores.ignored.includes(filePath))
		return true
	if (ignores.notIgnored.includes(filePath))
		return false
	const parts = filePath.split('/')
	let folder: string
	for (let dirs = 1; dirs <= parts.length; dirs++) {
		const folderToCheck = path.dirname(parts.slice(0, dirs).join('/'))
		if (ignores.workspaces[workspace][folderToCheck]) {
			if (folder && ignores.workspaces[workspace][folder].ignores(path.relative(folder, folderToCheck) + '/'))
				break
			folder = folderToCheck
		}
	}
	if (!folder)
		return false
	let result = ignores.workspaces[workspace][folder].test(path.relative(folder, filePath))
	while (folder != '.' && !result.ignored && !result.unignored) {
		folder = path.dirname(folder)
		if (ignores.workspaces[workspace][folder])
			result = ignores.workspaces[workspace][folder].test(path.relative(folder, filePath))
	}
	return result.ignored
}
