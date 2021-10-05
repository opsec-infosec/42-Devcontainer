"use strict";
var path_1 = require("path");
var vscode = require("vscode");
var moment = require("moment");
var vscode_1 = require("vscode");
var header_1 = require("./header");
var getCurrentUser = function () {
    return vscode.workspace.getConfiguration()
        .get('42header.username') || process.env['USER'] || 'marvin';
};
var getCurrentUserMail = function () {
    return vscode.workspace.getConfiguration()
        .get('42header.email') || getCurrentUser() + "@student.42.fr";
};
var newHeaderInfo = function (document, headerInfo) {
    var user = getCurrentUser();
    var mail = getCurrentUserMail();
    return Object.assign({}, {
        createdAt: moment(),
        createdBy: user
    }, headerInfo, {
        filename: path_1.basename(document.fileName),
        author: user + " <" + mail + ">",
        updatedBy: user,
        updatedAt: moment()
    });
};
var insertHeaderHandler = function () {
    var activeTextEditor = vscode.window.activeTextEditor;
    var document = activeTextEditor.document;
    if (header_1.supportsLanguage(document.languageId))
        activeTextEditor.edit(function (editor) {
            var currentHeader = header_1.extractHeader(document.getText());
            if (currentHeader)
                editor.replace(new vscode_1.Range(0, 0, 12, 0), header_1.renderHeader(document.languageId, newHeaderInfo(document, header_1.getHeaderInfo(currentHeader))));
            else
                editor.insert(new vscode_1.Position(0, 0), header_1.renderHeader(document.languageId, newHeaderInfo(document)));
        });
    else
        vscode.window.showInformationMessage("No header support for language " + document.languageId);
};
var startUpdateOnSaveWatcher = function (subscriptions) {
    return vscode.workspace.onWillSaveTextDocument(function (event) {
        var document = event.document;
        var currentHeader = header_1.extractHeader(document.getText());
        event.waitUntil(Promise.resolve(header_1.supportsLanguage(document.languageId) && currentHeader ?
            [
                vscode_1.TextEdit.replace(new vscode_1.Range(0, 0, 12, 0), header_1.renderHeader(document.languageId, newHeaderInfo(document, header_1.getHeaderInfo(currentHeader))))
            ]
            : []));
    }, null, subscriptions);
};
exports.activate = function (context) {
    var disposable = vscode.commands
        .registerTextEditorCommand('42header.insertHeader', insertHeaderHandler);
    context.subscriptions.push(disposable);
    startUpdateOnSaveWatcher(context.subscriptions);
};
//# sourceMappingURL=extension.js.map