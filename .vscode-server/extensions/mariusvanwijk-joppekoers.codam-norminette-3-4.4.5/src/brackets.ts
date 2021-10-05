import * as vscode from 'vscode'

export function parseBrackets(text: string | Buffer): vscode.Range[] {
	if (text instanceof Buffer)
		text = text.toString()
	const lines = text.split('\n')
	const bracketPairs: vscode.Range[] = []
	let endPos = new vscode.Position(0, 0)
	while (endPos != null)
		endPos = skipBrackets(endPos, lines, bracketPairs)
	return bracketPairs
}

export function findMatchingBracket(bracketPos: vscode.Position, bracketPairs: vscode.Range[]): vscode.Position {
	for (const bracketPair of bracketPairs) {
		if (bracketPair.start.isEqual(bracketPos))
			return bracketPair.end
		if (bracketPair.end.isEqual(bracketPos))
			return bracketPair.start
	}
}

function skipBrackets(startPos: vscode.Position, lines: string[], bracketPairs: vscode.Range[]): vscode.Position {
	let hasStartBracket = false
	let startBracket: vscode.Position
	lines[startPos.line] = lines[startPos.line].slice(startPos.character)
	for (let i = startPos.line; i < lines.length; i++) {
		let line = lines[i]
		if (line.length == 0)
			continue

		const singleCommentIndex = line.indexOf('//')
		const multiCommentIndex = line.indexOf('/*')
		const doubleQuoteIndex = line.indexOf('\"')
		const singleQuoteIndex = line.indexOf('\'')
		const bracketOpenIndex = line.indexOf('{')

		let earliestInterruptor = singleCommentIndex
		if ((multiCommentIndex > 0 && multiCommentIndex < earliestInterruptor) || earliestInterruptor < 0)
			earliestInterruptor = multiCommentIndex
		if ((doubleQuoteIndex > 0 && doubleQuoteIndex < earliestInterruptor) || earliestInterruptor < 0)
			earliestInterruptor = doubleQuoteIndex
		if ((singleQuoteIndex > 0 && singleQuoteIndex < earliestInterruptor) || earliestInterruptor < 0)
			earliestInterruptor = singleQuoteIndex
		if (hasStartBracket && ((bracketOpenIndex > 0 && bracketOpenIndex < earliestInterruptor) || earliestInterruptor < 0))
			earliestInterruptor = bracketOpenIndex

		let bracketIndex: number = hasStartBracket ? line.indexOf('}') : bracketOpenIndex

		if (earliestInterruptor >= 0 && (earliestInterruptor < bracketIndex || bracketIndex < 0)) {
			let skipPos: vscode.Position = null
			const interruptorPos = new vscode.Position(i, earliestInterruptor)
			if (earliestInterruptor == singleCommentIndex)
				continue
			if (earliestInterruptor == multiCommentIndex)
				skipPos = skipMultiComment(interruptorPos, lines)
			else if (earliestInterruptor == doubleQuoteIndex)
				skipPos = skipDoubleQuote(interruptorPos, lines)
			else if (earliestInterruptor == singleQuoteIndex)
				skipPos = skipSingleQuote(interruptorPos, lines)
			else if (earliestInterruptor == bracketOpenIndex)
				skipPos = skipBrackets(new vscode.Position(i, bracketOpenIndex), lines, bracketPairs)
			if (skipPos == null)
				break
			lines[skipPos.line] = line.slice(skipPos.character)
			i = skipPos.line - 1
			continue
		}

		if (bracketIndex >= 0) {
			if (i == startPos.line)
				bracketIndex += startPos.character
			if (hasStartBracket) {
				bracketPairs.push(new vscode.Range(startBracket, new vscode.Position(i, bracketIndex)))
				return new vscode.Position(i, bracketIndex + 1)
			}
			startBracket = new vscode.Position(i, bracketIndex)
			hasStartBracket = true
		}
	}
	return null
}

function skipMultiComment(pos: vscode.Position, lines: string[]): vscode.Position {
	let endIndex = lines[pos.line].slice(pos.character + 2).indexOf('*/')
	if (endIndex >= 0)
		return new vscode.Position(pos.line, pos.character + 2 + endIndex + 2)
	for (let i = pos.line + 1; i < lines.length; i++) {
		endIndex = lines[i].indexOf('*/')
		if (endIndex >= 0)
			return new vscode.Position(i, endIndex + 2)
	}
	return null
}

function skipDoubleQuote(pos: vscode.Position, lines: string[]): vscode.Position {
	const skipPos = skipUntilUnescapedString('\"', pos.translate(0, 1), lines)
	if (skipPos == null)
		return null
	return skipPos.translate(0, 1)
}

function skipSingleQuote(pos: vscode.Position, lines: string[]): vscode.Position {
	const skipPos = skipUntilUnescapedString('\'', pos.translate(0, 1), lines)
	if (skipPos == null)
		return null
	return skipPos.translate(0, 1)
}

function skipUntilUnescapedString(str: string, pos: vscode.Position, lines: string[]): vscode.Position {
	let endIndex = -1
	let index = pos.character
	do {
		index += endIndex + 1
		endIndex = lines[pos.line].slice(index).indexOf(str)
	} while (endIndex >= 0 && lines[pos.line][index + endIndex - 1] == '\\' && lines[pos.line][index + endIndex - 2] != '\\')

	if (endIndex >= 0)
		return new vscode.Position(pos.line, endIndex + index)
	for (let i = pos.line + 1; i < lines.length; i++) {
		endIndex = lines[i].indexOf(str)
		if (endIndex >= 0)
			return new vscode.Position(i, endIndex)
	}
	return null
}
