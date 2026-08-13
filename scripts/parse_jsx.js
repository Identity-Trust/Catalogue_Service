const fs = require('fs');
const path = require('path');
const bp = require('@babel/parser');
const file = path.join(__dirname, '..', 'src', 'App.jsx');
const code = fs.readFileSync(file, 'utf8');
try {
  bp.parse(code, { sourceType: 'module', plugins: ['jsx'] });
  console.log('PARSE_OK')
} catch (e) {
  console.error('PARSE_ERROR', e.message)
  if (e.loc) console.error('LOC', e.loc)
  process.exit(1)
}
