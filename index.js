var path = require('path');
var fs = require('fs');

function projectDirectory(currentPath) {
  var testPath = path.resolve(currentPath, 'package.json');
  if(fs.existsSync(testPath)) {
    return currentPath;
  }
  if(currentPath == path.dirname(currentPath)) {
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
  var projectDir = path.resolve(projectDirectory(resourcePath) || '/');
  var modName = path.relative(projectDir, resourcePath);
  // remove extension
  for(var i = 0; i < format.extensions.length; ++i) {
    if(modName.endsWith(format.extensions[i])) {
      modName = modName.substring(
        0, modName.length - format.extensions[i].length
      );
      break;
    }
  }
  // adjust path length
  modName = modName.split(path.sep).filter(function(i) { return i.length > 0; });
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
    var packageJson = path.resolve(projectDir, 'package.json');
    if(fs.existsSync(packageJson)) {
      var projectName = JSON.parse(fs.readFileSync(packageJson, 'utf8')).name;
      modName.unshift(projectName);
    }
  }
  // replace slashes by colons
  modName = modName.join(format.separator);
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
        var loggerNameFormat =
          Object.assign(
            { },
            { project: true,
              level: -1,
              separator: ':',
              extensions: [ '.js', '.jsx' ]
            },
            state.opts.format
          );
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
