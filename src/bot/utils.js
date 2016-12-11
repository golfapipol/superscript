import _ from 'lodash';
import fs from 'fs';
import debuglog from 'debug-levels';
import regexes from './regexes';

const debug = debuglog('SS:Utils');

//--------------------------

// TODO: rename to normlize to avoid confusion with string.trim() semantics
/**
 * Remove extra whitespace from a string, while preserving new lines.
 * @param {string} text - the string to tidy up
 */
const trim = (text = '') => text.trim().replace(/[ \t]+/g, ' ');

/**
 * Count the number of real words in a string
 * @param {string} text - the text to count
 * @returns {number} the number of words in `text`
 */
const wordCount = text => text.split(/[\s*#_|]+/).filter(w => w.length > 0).length;

// If needed, switch to _ or lodash
// Array.prototype.chunk = function (chunkSize) {
//   var R = [];
//   for (var i = 0; i < this.length; i += chunkSize) {
//     R.push(this.slice(i, i + chunkSize));
//   }
//   return R;
// };

// Contains with value being list
const inArray = function inArray(list, value) {
  if (_.isArray(value)) {
    let match = false;
    for (let i = 0; i < value.length; i++) {
      if (_.includes(list, value[i]) > 0) {
        match = _.indexOf(list, value[i]);
      }
    }
    return match;
  } else {
    return _.indexOf(list, value);
  }
};

const commandsRE = /[\\.+?${}=!:]/g;
const nonCommandsRE = /[\\.+*?^\[\]$(){}=!<>|:]/g;
/**
 * Escape a string sp that it can be used in a regular expression.
 * @param {string}  string   - the string to escape
 * @param {boolean} commands -
 */
const quotemeta = (string, commands = false) => string.replace(commands ? commandsRE : nonCommandsRE, c => `\\${c}`);

const getRandomInt = function getRandomInt(min, max) {
  return Math.floor(Math.random() * ((max - min) + 1)) + min;
};

const pickItem = function pickItem(arr) {
  // TODO - Item may have a wornet suffix meal~2 or meal~n
  const ind = getRandomInt(0, arr.length - 1);
  return _.isString(arr[ind]) ? arr[ind].replace(/_/g, ' ') : arr[ind];
};

// Capital first letter, and add period.
const makeSentense = function makeSentense(string) {
  return `${string.charAt(0).toUpperCase() + string.slice(1)}.`;
};

const tags = {
  wword: ['WDT', 'WP', 'WP$', 'WRB'],
  nouns: ['NN', 'NNP', 'NNPS', 'NNS'],
  verbs: ['VB', 'VBD', 'VBG', 'VBN', 'VBP', 'VBZ'],
  adjectives: ['JJ', 'JJR', 'JJS'],
};

const isTag = function isTag(posTag, wordClass) {
  return !!(tags[wordClass].indexOf(posTag) > -1);
};

const genId = function genId() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < 8; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

/**
 * Search each string in `strings` for `<cap>` tags and replace them with values from `caps`.
 *
 * Replacement is positional so `<cap1>` replaces with `caps[1]` and so on, with `<cap>` also replacing from `caps[1]`.
 * Empty `strings` are removed from the result.
 *
 * @param {Array<string>} strings - text to search for `<cap>` tags
 * @param {Array<string>} caps - replacement text
 */
const replaceCapturedText = (strings, caps) => strings
      .filter(s => !_.isEmpty(s))
      .map(s => s.replace(regexes.captures, (m, p1) => caps[Number.parseInt(p1 || 1)]));

const walk = function walk(dir, done) {
  if (fs.statSync(dir).isFile()) {
    debug.verbose('Expected directory, found file, simulating directory with only one file: %s', dir);
    return done(null, [dir]);
  }

  let results = [];
  fs.readdir(dir, (err1, list) => {
    if (err1) {
      return done(err1);
    }
    let pending = list.length;
    if (!pending) {
      return done(null, results);
    }
    list.forEach((file) => {
      file = `${dir}/${file}`;
      fs.stat(file, (err2, stat) => {
        if (err2) {
          console.log(err2);
        }

        if (stat && stat.isDirectory()) {
          const cbf = function cbf(err3, res) {
            results = results.concat(res);
            pending -= 1;
            if (!pending) {
              done(err3, results);
            }
          };

          walk(file, cbf);
        } else {
          results.push(file);
          pending -= 1;
          if (!pending) {
            done(null, results);
          }
        }
      });
    });
  });
};

export default {
  genId,
  getRandomInt,
  inArray,
  isTag,
  makeSentense,
  pickItem,
  quotemeta,
  replaceCapturedText,
  trim,
  walk,
  wordCount,
};