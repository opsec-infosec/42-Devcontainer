"use strict";
var moment = require("moment");
var delimiters_1 = require("./delimiters");
var genericTemplate = "\n********************************************************************************\n*                                                                              *\n*                                                         :::      ::::::::    *\n*    $FILENAME__________________________________        :+:      :+:    :+:    *\n*                                                     +:+ +:+         +:+      *\n*    By: $AUTHOR________________________________    +#+  +:+       +#+         *\n*                                                 +#+#+#+#+#+   +#+            *\n*    Created: $CREATEDAT_________ by $CREATEDBY_       #+#    #+#              *\n*    Updated: $UPDATEDAT_________ by $UPDATEDBY_      ###   ########.fr        *\n*                                                                              *\n********************************************************************************\n\n".substring(1);
var getTemplate = function (languageId) {
    var _a = delimiters_1.languageDemiliters[languageId], left = _a[0], right = _a[1];
    var width = left.length;
    return genericTemplate
        .replace(new RegExp("^(.{" + width + "})(.*)(.{" + width + "})$", 'gm'), left + '$2' + right);
};
var pad = function (value, width) {
    return value.concat(' '.repeat(width)).substr(0, width);
};
var formatDate = function (date) {
    return date.format('YYYY/MM/DD HH:mm:ss');
};
var parseDate = function (date) {
    return moment(date, 'YYYY/MM/DD HH:mm:ss');
};
exports.supportsLanguage = function (languageId) {
    return languageId in delimiters_1.languageDemiliters;
};
exports.extractHeader = function (text) {
    var headerRegex = "^(.{80}\n){10}";
    var match = text.match(headerRegex);
    return match ? match[0] : null;
};
var fieldRegex = function (name) {
    return new RegExp("^((?:.*\\\n)*.*)(\\$" + name + "_*)", '');
};
var getFieldValue = function (header, name) {
    var _a = genericTemplate.match(fieldRegex(name)), _ = _a[0], offset = _a[1], field = _a[2];
    return header.substr(offset.length, field.length);
};
var setFieldValue = function (header, name, value) {
    var _a = genericTemplate.match(fieldRegex(name)), _ = _a[0], offset = _a[1], field = _a[2];
    return header.substr(0, offset.length)
        .concat(pad(value, field.length))
        .concat(header.substr(offset.length + field.length));
};
exports.getHeaderInfo = function (header) { return ({
    filename: getFieldValue(header, 'FILENAME'),
    author: getFieldValue(header, 'AUTHOR'),
    createdBy: getFieldValue(header, 'CREATEDBY'),
    createdAt: parseDate(getFieldValue(header, 'CREATEDAT')),
    updatedBy: getFieldValue(header, 'UPDATEDBY'),
    updatedAt: parseDate(getFieldValue(header, 'UPDATEDAT'))
}); };
exports.renderHeader = function (languageId, info) { return [
    { name: 'FILENAME', value: info.filename },
    { name: 'AUTHOR', value: info.author },
    { name: 'CREATEDAT', value: formatDate(info.createdAt) },
    { name: 'CREATEDBY', value: info.createdBy },
    { name: 'UPDATEDAT', value: formatDate(info.updatedAt) },
    { name: 'UPDATEDBY', value: info.updatedBy }
].reduce(function (header, field) {
    return setFieldValue(header, field.name, field.value);
}, getTemplate(languageId)); };
//# sourceMappingURL=header.js.map