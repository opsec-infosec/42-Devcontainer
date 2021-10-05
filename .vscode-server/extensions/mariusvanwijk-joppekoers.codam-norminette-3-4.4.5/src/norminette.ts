import { exec } from 'child_process'
import { log } from './extension'

async function execAsync(command): Promise<{ stdout: string, stderr: string } | null> {
	return new Promise((resolve, reject) => {
		exec(`${command}`, (error, stdout, stderr) => {
			resolve({ stdout, stderr })
		})
	})
}

export type NormInfo = {
	fullText: string,
	error: string,
	line: number,
	col: number,
	errorText: string
}

function normDecrypt(normLine: string): NormInfo {
	try {
		const [fullText, error, line, col, errorText] = normLine.match(/\s*([A-Z_]*)\s*\(line:\s*(\d*),\s*col:\s*(\d+)\):\s*(.*)/)
		if (!fullText || !error || !line || !col || !errorText)
			return null
		const result = {
			fullText,
			error,
			line: parseInt(line) - 1,
			col: parseInt(col) - 1,
			errorText: errorText[0].toUpperCase() + errorText.slice(1)
		}
		return (result)
	}
	catch (e) {
		return null
	}
}

export async function execNorminette(filename: string, command: string): Promise<NormInfo[]> {
	const { stdout } = await execAsync(`${command} '${filename}'`)
	const lines = stdout.split('\n').slice(1, -1)
	let normDecrypted = []
	for (const line of lines) {
		log(`line: ${line}`)
		const decrypted = normDecrypt(line)
		if (decrypted)
			normDecrypted.push(decrypted)
	}
	return normDecrypted
}
