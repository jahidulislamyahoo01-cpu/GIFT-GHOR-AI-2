const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const replacements = {
  'mport ': 'import ',
  'vte': 'vite',
  'gena': 'genai',
  'cheero': 'cheerio',
  'Frestore': 'Firestore',
  'Servce': 'Service',
  'Emal': 'Email',
  'confg': 'config',
  'lmt': 'limit',
  'Authorzaton': 'Authorization',
  'Orgn': 'Origin',
  'Polcy': 'Policy',
  'tme': 'time',
  'strng': 'string',
  'ndex': 'index',
  'ths': 'this',
  'wt': 'wit',
  'wth': 'with',
  'd': 'id', // wait 'd' to 'id' will replace EVERY 'd'!!!
};

// we can't just do global replace of 'd'. We have to do word boundary!
code = code.replace(/\b([a-zA-Z]+)\b/g, (match) => {
  // common missing i
  const dict = {
    'mport': 'import', 'vte': 'vite', 'gena': 'genai', 'cheero': 'cheerio',
    'Frestore': 'Firestore', 'Servce': 'Service', 'Emal': 'Email', 'confg': 'config',
    'lmt': 'limit', 'Authorzaton': 'Authorization', 'Orgn': 'Origin', 'Polcy': 'Policy',
    'tme': 'time', 'strng': 'string', 'ndex': 'index', 'ths': 'this', 'wth': 'with',
    'd': 'id', 'f': 'if', 'n': 'in', 't': 'it', 's': 'is', 'd': 'id', 
    'frestore': 'firestore', 'wthout': 'without', 'sesson': 'session', 'Sesson': 'Session',
    'fles': 'files', 'fle': 'file', 'lsten': 'listen', 'lst': 'list', 'ma': 'mai', 
    'ncludng': 'including', 'nclude': 'include', 'fnd': 'find', 'fn': 'fin', 'tems': 'items',
    'tem': 'item', 'nd': 'ind', 'v': 'vi', 'actvty': 'activity', 'actve': 'active',
    'val': 'valid', 'provde': 'provide', 'provder': 'provider',
    'req': 'req', 'res': 'res', 'app': 'app', 'fs': 'fs', 'db': 'db', 'DB': 'DB'
  };
  return dict[match] || match;
});

// fix substrings like 'strng' -> 'string'
// This is too hard.
