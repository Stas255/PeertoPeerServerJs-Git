const { instanceToPlain } = require('class-transformer');

const UAParser = require('ua-parser-js');
class Util {
    static IsNULL(param) {
        return param == null;
    }

    static IsNULLObject(param) {
        for (let key in param) {
            if (!param[key]) {
                return true;
            }
        }
        return false;
    }

    static IsBrowser(userAgent) {
        const parser = new UAParser();
        const result = parser.setUA(userAgent).getResult();
        return result.browser.name != null;
    }

    static checkNull(arg) {
        const obj = instanceToPlain(arg);
        for (const key in obj) {
            if (obj[key] == null) {
                return true;
            }
        }
        return false;
    }

    static getNullArgumets(arg) {
        const nullArgs = [];
        const obj = instanceToPlain(arg);
        for (const key in obj) {
            if (obj[key] == null) {
                nullArgs.push(Util.removeUnderscore(key));
            }
        }
        return nullArgs.length > 0 ? nullArgs : null;
    }

    static removeUnderscore(arg) {
        if (typeof arg === 'string' && arg.startsWith('_')) {
            return arg.substring(1);
        } else {
            return arg;
        }
    }

    static removeUnderscoreParameterNameInObject(obj) {
        const newObj = {};
        for (let key in obj) {
            if(Util.isObject(obj[key])){
                newObj[Util.removeUnderscore(key)] = Util.removeUnderscoreParameterNameInObject(obj[key]);
            }else if(Util.isObjectArray(obj[key])){
                const newKey = Util.removeUnderscore(key);
                newObj[newKey] = [];
                obj[key].forEach(element => {
                    newObj[newKey].push(Util.removeUnderscoreParameterNameInObject(element));
                });
            }else{
                newObj[Util.removeUnderscore(key)] = obj[key]
            }
        }
        return newObj;
    }

    static isObject(variable) {
        return Object.prototype.toString.call(variable) === '[object Object]';
      }

      static isObjectArray(variable) {
        return Object.prototype.toString.call(variable) === '[object Array]';
      }
}

module.exports = Util