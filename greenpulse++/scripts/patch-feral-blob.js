import fs from 'fs';
import path from 'path';

const file = path.resolve('./node_modules/feral-blob/dist/feral-blob.js');

if (fs.existsSync(file)) {
  let code = fs.readFileSync(file, 'utf8');

  code = code.replace(/y:\s*\[0,\s*-22,\s*-6,\s*-10\],[^}]+transition:\s*\{[^}]*type:\s*"spring"[^}]*\}/g, (m) => {
    return m.replace(/type:\s*"spring"[^}]*/, 'duration: 0.6, ease: "easeInOut"');
  });

  code = code.replace(/y:\s*\[0,\s*-19,\s*-5,\s*-9\],[^}]+transition:\s*\{[^}]*type:\s*"spring"[^}]*\}/g, (m) => {
    return m.replace(/type:\s*"spring"[^}]*/, 'duration: 0.5, ease: "easeInOut"');
  });

  code = code.replace(/y:\s*\[0,\s*-16,\s*-5,\s*-9\],[^}]+ty:\s*\{[^}]*type:\s*"spring"[^}]*\},\s*tr:\s*\{[^}]*type:\s*"spring"[^}]*\}/g, (m) => {
    return m.replace(/type:\s*"spring"[^}]*/g, 'duration: 0.5, ease: "easeInOut"');
  });

  fs.writeFileSync(file, code, 'utf8');
  console.log('[patch-feral-blob] Patched feral-blob spring animation keyframes successfully.');
} else {
  console.log('[patch-feral-blob] feral-blob.js not found, skipping patch.');
}
