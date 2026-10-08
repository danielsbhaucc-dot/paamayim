const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// אפליקציית הניהול (admin/) היא פרויקט Vite נפרד — Metro לא צריך לסרוק אותה.
const adminDir = /[\\/]admin[\\/].*/;
const existing = config.resolver.blockList;
config.resolver.blockList = existing ? [].concat(existing, adminDir) : adminDir;

// חבילות @hebcal (core 6, leyning 10, hdate, noaa) הן ESM בלבד: יש להן exports בלי main,
// ובאפליקציה המותקנת (iOS/Android) Metro לא קורא exports ולכן הייבוא נכשל.
// מפנים כל ייבוא חשוף של @hebcal/<pkg> לקובץ ה-ESM שה-package מצהיר עליו.
const fs = require('fs');
const hebcalEntry = (name) => {
  const dir = path.join(__dirname, 'node_modules', name);
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  const dot = pkg.exports && pkg.exports['.'];
  const rel =
    pkg.module ||
    (typeof dot === 'string' ? dot : dot && (dot.import || dot.default)) ||
    pkg.main;
  return rel ? path.join(dir, rel) : null;
};
const upstreamResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (/^@hebcal\/[^/]+$/.test(moduleName)) {
    const filePath = hebcalEntry(moduleName);
    if (filePath && fs.existsSync(filePath)) return { type: 'sourceFile', filePath };
  }
  return upstreamResolve
    ? upstreamResolve(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
