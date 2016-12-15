'use strict';

var fs = require('fs');
var _ = require('lodash');

var fillWithSpaces = function(str, len) {
    while (str.length < len) {
        str += ' ';
    }
    return str;
}

module.exports = {
    summary: function(expressApp){
        var paths = [];
        var routes = [];
        var chosenLines = [];

        var lines = this.treeView(expressApp);

        var rootPath = '';
        
        for(var index = 0; index < lines.length; index++){
            var line = lines[index];

            //skip lines with "*"
            if (line.indexOf('*') > -1) continue;

            if (line.indexOf('/^\\') > -1) {
                rootPath = '';
                var start = line.indexOf('/^');
                while (line.indexOf('\\', start) > -1) {
                    start = line.indexOf('\\', start) + 1;
                    var end = line.indexOf('\\', start);
                    var part = line.substring(start, end);
                    if (part.indexOf('?') > -1) break;
                    rootPath += part;
                }
            }

            if ((line.indexOf('GET') > -1) || (line.indexOf('POST') > -1) || (line.indexOf('PUT') > -1) || (line.indexOf('DELETE') > -1)) {
                var part = '';
                var start = line.indexOf('/');
                var end = line.indexOf(' ', start);
                var part = line.substring(start, end);
                var fullPath = rootPath + part;
                var method = 'GET';
                if (line.indexOf('POST') > -1) method = 'POST';
                else if (line.indexOf('PUT') > -1) method = 'PUT';
                else if (line.indexOf('DELETE') > -1) method = 'DELETE';
                var pathWithMethod = fillWithSpaces(method + ':', 10) + fullPath;

                if (paths.indexOf(pathWithMethod) == -1) { //to make sure I dont repeat
                    paths.push(pathWithMethod);
                    routes.push({ method: method, path: fullPath });
                }

                //HACK:
                if (fullPath == '/files/:app/:file') rootPath = '';
            }
            
            if (line.indexOf('└── <anonymous>                         / ') != -1 ||
                line.indexOf('├── <anonymous>                         / ') != -1) continue;
            chosenLines.push(line);
        }

        return { paths: paths, routes: routes, lines: chosenLines };
    },
    treeView: function (expressApp) {

        var text = [];

        function brushIndentation(indentation) {
            return indentation.replace(/─/g, ' ').replace(/├/g, '│').replace(/└/g, ' ');
        }

        function printRoutes(layer, indentation) {

            var path = ' ';
            if (layer.path) {
                path += layer.path;
            } else if (layer.route && layer.route.path) {
                path += layer.route.path;
            } else if (layer.regexp) {
                if (layer.regexp.source === '^\\/?$') {
                    path += '/';
                } else if (layer.regexp.source === '^\\/?(?=\\/|$)') {
                    path += '*';
                } else {
                    path += '/' + layer.regexp.source + '/';
                }
            }

            var methods = [];
            if (layer.method) {
                methods.push(layer.method);
            } else if (layer.route) {
                if (layer.route.methods) {
                    methods = _.keys(layer.route.methods);
                } else if (layer.route.method) {
                    methods.push(layer.route.method);
                }
            }
            methods = methods.join(', ').toUpperCase();

            text.push(fillWithSpaces(indentation + layer.name, 50) + fillWithSpaces(path, 60) + ' ' + methods);

            if (!layer.stack && !(layer.route && layer.route.stack)) {
                if (layer.handle.stack) {
                    return printRoutes(layer.handle, brushIndentation(indentation));
                }
                return;
            }

            indentation = brushIndentation(indentation) + ' ├── ';

            var stack = layer.stack || layer.route.stack;
            for ( var i = 0; i < stack.length; i+=1 ) {
                if (i === stack.length - 1) {
                    indentation = indentation.substr(0, indentation.length - 5) + ' └── ';
                }
                printRoutes(stack[i], indentation);
            }

            text.push(indentation.substr(0, indentation.length - 5));

        }

        printRoutes(expressApp._router, '');

        return text;

    }
}
