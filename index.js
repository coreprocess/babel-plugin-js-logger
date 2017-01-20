var path = require('path');
var fs = require('fs');

function projectDirectory(currentPath) {
  var testPath = path.resolve(currentPath, 'package.json');
  if(fs.existsSync(testPath)) {
    return currentPath;
  }
  if(currentPath == '/') {
    return null;
  }
  return projectDirectory(path.dirname(currentPath));
}

function calcLoggerName(resourcePath, format) {
  // handle edge cases
  if(resourcePath == 'unknown') {
    return resourcePath;
  }
  resourcePath = path.resolve(resourcePath);
  // strip project root path
  var projectDir = projectDirectory(resourcePath);
  var modName = path.relative(projectDir || '/', resourcePath);
  // remove js extension
  if(modName.endsWith('.js')) {
    modName = modName.substring(0, modName.length - 3);
  }
  // adjust path length
  modName = modName.split('/').filter(function(i) { return i.length > 0; });
  if(format.level < 0) {
    var level = Math.abs(format.level);
    if(modName.length > level) {
      modName.splice(0, level);
    }
    else {
      modName = [ ];
    }
  }
  else
  if(format.level > 0) {
    var level = format.level;
    if(modName.length > level) {
      modName.splice(0, modName.length - level);
    }
  }
  // add project name
  if(format.project) {
    var projectName = JSON.parse(
        fs.readFileSync(path.resolve(projectDir, 'package.json'), 'utf8')
      ).name;
    modName.unshift(projectName);
  }
  // replace slashes by colons
  modName = modName.join(':');
  return modName;
}

module.exports = function (params) {
  var t = params.types;
  return {
    visitor: {
      Program: function(path, state) {
        // check if we have to skip this resource
        var resourcePath = state.file.opts.filename || 'unknown';
        var exclude = state.opts.exclude || [ 'node_modules' ];
        if(!(exclude instanceof Array)) {
          exclude = [ exclude ];
        }
        for(var i=0; i < exclude.length; ++i) {
          if((new RegExp(exclude[i])).test(resourcePath)) {
            return;
          }
        }
        // prepare variables
        var loggerVariable = state.opts.variable || 'logger';
        var loggerModule = state.opts.module || 'js-logger';
        var loggerFactory = state.opts.factory || 'get';
        var loggerNameFormat = state.opts.format || { project: true, level: -1 };
        var loggerName = calcLoggerName(resourcePath, loggerNameFormat);
        // generate statement
        // const <loggerVariable>
        //   = require("<loggerModule>")
        //       .<loggerFactory>("<loggerName>");
        path.unshiftContainer(
          'body',
          t.variableDeclaration(
            'const',
            [
              t.variableDeclarator(
                t.identifier(loggerVariable),
                t.callExpression(
                  t.memberExpression(
                    t.callExpression(
                      t.identifier('require'),
                      [ t.stringLiteral(loggerModule) ]
                    ),
                    t.identifier(loggerFactory)
                  ),
                  [ t.stringLiteral(loggerName) ]
                )
              )
            ]
          )
        );
      }
    }
  };
};
