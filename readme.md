# babel-plugin-js-logger

Babel plugin to enable js-logger in your entire project efficiently.

![npm downloads total](https://img.shields.io/npm/dt/babel-plugin-js-logger.svg) ![npm version](https://img.shields.io/npm/v/babel-plugin-js-logger.svg) ![npm license](https://img.shields.io/npm/l/babel-plugin-js-logger.svg)

This [Babel](https://babeljs.io/) plugin enables [js-logger](https://github.com/jonnyreeves/js-logger) in your entire project by placing `const logger = require('js-logger').get('project:example:path');` in front of every transpiled JavaScript file. Works with Babel standalone, e.g. within a backend, or together with Webpack, e.g. within a frontend.

## Installation

Install `js-logger` and the plugin module via

```sh
npm install js-logger --save
npm install babel-plugin-js-logger --save-dev
```

or

```sh
yarn add js-logger
yarn add babel-plugin-js-logger --dev
```

## Configuration

### Enable Plugin

Add `babel-plugin-js-logger` to your `.babelrc`, e.g. like this:

```json
{
  "presets": ["es2015", "stage-0", "react"],
  "plugins": ["transform-runtime", "transform-decorators-legacy", "js-logger"]
}
```
#### Initialize Logger

Initialize `js-logger` in your main routine with `require('js-logger').useDefaults();`. See [js-logger/readme](https://github.com/jonnyreeves/js-logger/blob/master/README.md) for more.

##### Be aware:

In case you use `import` instead of `require` to import your modules, you will have to outsource the initialization routine into a separate file which has to be imported at the very first. **Reason**: import statements are moved to the top of every file automatically since this is required by the standard and Babel complies to it. Otherwise, you will run your code to initialize `js-logger` a bit later in the process than you truly intend to do and you might miss a few logging messages.

I use this pattern in my projects:

1) `main.js`: Import your `logger-init.js` at the very first in your main entry point.

```js
import './logger-init.js';
import ExampleModule from './example-module.js';
...
```

2) `logger-init.js`: Run your initialization code for `js-logger` here.

```js
require('js-logger').useDefaults();
```

### Options

The plugin provides the following options to tweak the behavior of the plugin during code generation.

| Option | Values | Default | Description  |
| :--- | :--- | :--- | :--- |
| `variable` | Valid JS identifier | `"logger"` | Name of the logger variable |
| `module` | Valid NodeJS module name | `"js-logger"` | Name of the logger module |
| `factory` | Valid JS identifier | `"get"` | Name of the logger factory method (called on the module) |
| `format` | `{ project: Boolean, level: Integer, separator: String, extensions: Array<String> }` | `{ project: true, level: -1, separator: ':', extensions: [ '.js', '.jsx' ] }` | Parametrizes the logger name to be generated (see below) |

#### Logger name formatting

The `format` options parametrize the logger name to be generated.

| Option | Values | Description  |
| :--- | :--- | :--- |
| `project` | `true` | Include the project name provided in the `package.json` |
| `project` | `false` | Do not include the project name |
| `level` | `0` | Use the full path starting from the project root (= directory where `package.json` was found) |
| `level` | `< 0` | Use the full path starting from the `n`th level below the project root (very useful to omit the name of the `src` directory used in projects) |
| `level` | `> 0` | Use the last `n` levels of the path  |
| `separator` | e.g. `:` | Use `:` as a namespace separator |
| `extensions` | e.g. `[ '.js', '.jsx' ]` | Strip `.js` and `.jsx` extensions from path |

#### Configuration Example

A `.babelrc` configuration example which uses dots as separators and omits the project name.

```js
{
  "presets": [ "es2015", "stage-0", "react" ],
  "plugins": [ "transform-runtime", "transform-decorators-legacy",
    [ "js-logger", { "format": { "separator": ".", "project": false } } ]
  ]
}
```

## Usage

Once you configured the plugin, you can use the logger in every JS file easily via the `logger` variable. See [js-logger/readme](https://github.com/jonnyreeves/js-logger/blob/master/README.md) for more.

### Example

The file `my-project/src/some/sub/module.js`

```js
logger.debug("some debug message");
```

would produce the output

```
[my-project:some:sub:module] some debug message
```
if used with default configuration and a `my-project/package.json` providing the project name `my-project`.
