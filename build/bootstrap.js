
//This is intended to set up the node VM at startup time with some preload defaults
// For example,
// node -r ./bootstrap.js path/to/script

// This injects V8 sourcemap support and also patches the source map generation code inside the babel register hook

require('source-map-support').install();

//Patch the babel sourcemap support
// See https://phabricator.babeljs.io/T6839 for more info
const t = require('babel-types');
const SourceMap = require('babel-generator/lib/source-map');

function comparePosition(a, b) {
  return a.line === b.line && a.column === b.column;
}

SourceMap.prototype.mark = function mark(node) {
  const loc = node.loc;
  if (!loc) return; // no location info

  const map = this.map;
  if (!map) return; // no source map

  if (t.isProgram(node) || t.isFile(node)) return; // illegal mapping nodes

  const position = this.position;

  const generated = {
    line: position.line,
    column: position.column
  };

  const original = loc.start;

  // Avoid emitting duplicates on either side. Duplicated
  // original values creates unnecesssarily large source maps
  // and increases compile time. Duplicates on the generated
  // side can lead to incorrect mappings.
  if (comparePosition(original, this.last.original) || comparePosition(generated, this.last.generated)) {
    return;
  }

  this.last = {
    source: loc.filename || this.opts.filename,
    generated: generated,
    original: original
  };

  map.addMapping(this.last);
};

require('babel-register');



