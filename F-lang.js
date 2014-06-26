(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        //Allow using this built library as an AMD module
        //in another project. That other project will only
        //see this AMD call, not the internal modules in
        //the closure below.
        define([], factory);
    } else {
        //Browser globals case. Just assign the
        //result to a property on the global.
        root.Flang = factory();
    }
}(this, function () {
    //almond, and your modules will be inlined here
    /**
 * @license almond 0.2.9 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                name = baseParts.concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());
define("almond", function(){});

define('../build/parser',['require','exports','module'],function (require, exports, module) {var isClosingbrace, isColon, isDigit, isIdentifier, isKeyWord, isOpenbrace, isOperator, isSemicolon, isWhiteSpace, lang,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

lang = {};

lang.lex = function(input) {
  var addToken, advance, c, i, idn, num, str, tokens;
  tokens = [];
  i = 0;
  c = null;
  advance = function() {
    return c = input[++i];
  };
  addToken = function(type, value) {
    return tokens.push({
      type: type,
      value: value
    });
  };
  while (i < input.length) {
    c = input[i];
    if (isWhiteSpace(c)) {
      advance();
    } else if (isOperator(c)) {
      addToken('operator', c);
      advance();
    } else if (isOpenbrace(c)) {
      addToken('openbrace', c);
      advance();
    } else if (isClosingbrace(c)) {
      addToken('closingbrace', c);
      advance();
    } else if (isSemicolon(c)) {
      addToken('semicolon', c);
      advance();
    } else if (isDigit(c)) {
      num = c;
      while (isDigit(advance())) {
        num += c;
      }
      if (c === '.') {
        while (true) {
          num += c;
          if (isDigit(advance())) {
            break;
          }
        }
      }
      num = parseFloat(num);
      if (!isFinite(num)) {
        throw "Number is too large or too small for a 64-bit double.";
      }
      addToken('number', num);
    } else if (isColon(c)) {
      str = "";
      while (!isColon(advance())) {
        str += c;
      }
      addToken('string', str);
      advance();
    } else if (isIdentifier(c)) {
      idn = c;
      while (isIdentifier(advance())) {
        idn += c;
      }
      addToken('identifier', idn);
    }
  }
  return tokens;
};

isOperator = function(c) {
  return /[+\-*\/\^%=(),:]/.test(c);
};

isColon = function(c) {
  return /["']/.test(c);
};

isDigit = function(c) {
  return /[0-9]/.test(c);
};

isWhiteSpace = function(c) {
  return /[\s\r\t\n]/.test(c);
};

isIdentifier = function(c) {
  return typeof c === "string" && !isOperator(c) && !isDigit(c) && !isWhiteSpace(c) && !isKeyWord(c) && !isOpenbrace(c) && !isClosingbrace(c) && !isColon(c) && !isSemicolon(c);
};

isKeyWord = function(c) {
  var keyword, keywords, _i, _len;
  keywords = ['entity'];
  for (_i = 0, _len = keywords.length; _i < _len; _i++) {
    keyword = keywords[_i];
    if (c === keyword) {
      return true;
    } else {
      return false;
    }
  }
};

isSemicolon = function(c) {
  return /[;]/.test(c);
};

isOpenbrace = function(c) {
  return /[{]/.test(c);
};

isClosingbrace = function(c) {
  return /[}]/.test(c);
};

lang.parse = function(tokens) {
  var action, advance, entity, expect, form, i, isNext, listener, move, nextVal, parseAction, parseEntity, parseForm, parseListener, t, token, type, types, val, _i, _len;
  i = 0;
  types = ['entity', 'form', 'listener', 'action'];
  token = function() {
    return tokens[i];
  };
  val = function() {
    return token().value;
  };
  nextVal = function(num) {
    return tokens[i + num].value;
  };
  isNext = function(num, tokenVal) {
    return tokens[i + num].value === tokenVal;
  };
  move = function(num) {
    i += num;
    return token();
  };
  expect = function(num, expectation) {
    if (tokens[i + num].value !== expectation) {
      return "Expected " + expectation + " but " + tokens[i + num].value + " was found.";
    } else {
      return true;
    }
  };
  advance = function() {
    ++i;
    return token();
  };
  parseEntity = function() {
    var attr, attributes, isAction, isAttribute, name, options, t;
    attributes = {};
    isAction = function() {
      return val() === 'action';
    };
    isAttribute = function() {
      return !isAction(val());
    };
    t = advance();
    if (t.value === '{') {
      throw "Unexpected {, expecting entity name.";
    }
    name = token().value;
    advance();
    if (val() !== '{') {
      throw "Expecting {, attributes definition.";
    }
    advance();
    while (val() !== '}') {
      if (isAttribute()) {
        attr = val();
        while (advance().value !== '=') {
          attr += ' ' + val();
        }
        options = {};
        advance();
        while (val() !== ';') {
          switch (val().toLowerCase()) {
            case "optional":
              options.optional = true;
              break;
            case "signed":
              options.signed = true;
              break;
            case "default":
              options["default"] = advance().value;
              break;
            case ',':
              break;
            default:
              options.type = val();
          }
          advance();
        }
        attributes[attr] = options;
        advance();
      }
    }
    return {
      id: name,
      attributes: attributes
    };
  };
  parseForm = function() {
    var form, keywords;
    form = {
      events: {},
      actions: [],
      vars: {}
    };
    keywords = {
      'entity': function() {
        if (form.entity != null) {
          throw "An entity it's already defined for form " + form.id;
        }
        form.entity = advance().value;
        while (true) {
          if (advance().value === ';') {
            break;
          }
        }
        return advance();
      },
      'event': function() {
        form.events[advance().value] = advance().value;
        while (true) {
          if (advance().value === ';') {
            break;
          }
        }
        return advance();
      },
      'action': function() {
        form.actions.push(advance().value);
        while (true) {
          if (advance().value === ';') {
            break;
          }
        }
        return advance();
      },
      'layout': function() {
        var isLayout, layout, layoutTypes, parseLayout;
        layout = [];
        layoutTypes = ['vertical', 'horizontal'];
        isLayout = function(layout) {
          if (layoutTypes.indexOf(layout) !== -1) {
            return true;
          } else {
            return false;
          }
        };
        if (advance().value !== '{') {
          throw "expected { in layout definition.";
        }
        parseLayout = function() {
          var Context, createContext, currentContext, getFields, hasFields, parseNode, stack;
          hasFields = function() {
            return layoutTypes.indexOf(nextVal(2)) === -1;
          };
          isLayout = function() {
            return !hasFields();
          };
          getFields = function(offset) {
            var field, fields, j;
            fields = [];
            j = 2 + offset || 0;
            while (nextVal(2 + j) !== '}') {
              field = "";
              while (true) {
                field += ' ' + nextVal(2 + j);
                j++;
                if (nextVal(2 + j) === ';') {
                  j++;
                  fields.push(field.trim());
                  break;
                }
              }
            }
            return fields;
          };
          Context = (function(_super) {
            __extends(Context, _super);

            function Context(layout) {
              this.layout = layout;
            }

            Context.prototype.add = function(some) {
              return this.push(some);
            };

            return Context;

          })(Array);
          currentContext = null;
          createContext = function() {
            var context;
            context = new Context(val());
            return currentContext = context;
          };
          stack = [];
          parseNode = function() {
            var currentNode, finishBlock, getCurrentNode, k, keys, list, list1, setCurrentNode;
            list = [];
            keys = ['{'];
            k = -1;
            getCurrentNode = function() {
              return list[k];
            };
            setCurrentNode = function(node) {
              return list[k] = node;
            };
            finishBlock = function() {
              while (val() !== '}') {
                advance();
              }
              advance();
              return keys.pop();
            };
            while (keys.length !== 0) {
              currentNode = getCurrentNode();
              if (nextVal(1) === '{') {
                k++;
                setCurrentNode(createContext());
                keys.push('{');
                move(2);
                if (keys.length > 2) {
                  list.pop();
                  move(-2);
                  currentNode.add(parseNode());
                }
              } else {
                move(-2);
                if (hasFields()) {
                  getFields().forEach(function(field) {
                    return currentNode.add(field);
                  });
                }
                finishBlock();
              }
            }
            finishBlock();
            list1 = list.map(function(context) {
              var result;
              result = {};
              result[context.layout] = context.map(function(x) {
                return x;
              });
              return result;
            });
            debugger;
            return list1;
          };
          return parseNode();
        };
        advance();
        form.layout = parseLayout();
        return advance();
      },
      'else': function() {
        var attr, options;
        attr = val();
        while (advance().value !== '=') {
          attr += ' ' + val();
        }
        options = {};
        advance();
        while (val() !== ';') {
          switch (val().toLowerCase()) {
            case "optional":
              options.optional = true;
              break;
            case "signed":
              options.signed = true;
              break;
            case "default":
              options["default"] = advance().value;
              break;
            case ',':
              break;
            default:
              options.type = val();
          }
          advance();
        }
        form.vars[attr] = options;
        return advance();
      }
    };
    form.id = "";
    advance();
    while (val() !== '{') {
      form.id += ' ' + val();
      advance();
    }
    advance();
    while (val() !== '}') {
      if (keywords.hasOwnProperty(val())) {
        keywords[val()]();
      } else {
        keywords["else"]();
      }
    }
    return form;
  };
  parseListener = function() {
    var body, name;
    name = advance().value;
    advance();
    body = "";
    while (advance().value !== '}') {
      if (token().type === 'string') {
        body += '"' + val() + '"';
      } else {
        body += val();
      }
    }
    return {
      event: name,
      callback: String(new Function(body))
    };
  };
  parseAction = function() {
    var body, name;
    name = advance().value;
    advance();
    body = "";
    while (advance().value !== '}') {
      if (token().type === 'string') {
        body += '"' + val() + '"';
      } else {
        body += val();
      }
    }
    return {
      action: name,
      callback: String(new Function(body))
    };
  };
  listener = [];
  action = [];
  entity = [];
  form = [];
  while (i < tokens.length - 1) {
    t = token();
    for (_i = 0, _len = types.length; _i < _len; _i++) {
      type = types[_i];
      if (t.value.toLowerCase() === type) {
        eval(type).push(eval('parse' + type.charAt(0).toUpperCase() + type.slice(1) + '()'));
        advance();
      }
    }
  }
  return {
    entities: entity,
    forms: form,
    actions: action,
    listeners: listener
  };
};

lang.compile = function(input) {
  return lang.parse(lang.lex(input));
};

module.exports = lang.compile;

});

define('main',['require','exports','module','../build/parser'],function(require, exports, module) {
	return require('../build/parser');
});

 //The modules for your project will be inlined above
    //this snippet. Ask almond to synchronously require the
    //module value for 'main' here and return it as the
    //value to use for the public API for the built file.
    return require('main');
}));