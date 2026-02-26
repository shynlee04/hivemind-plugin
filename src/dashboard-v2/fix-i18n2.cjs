const fs = require('fs');
const file = fs.readFileSync('src/i18n.ts', 'utf8');

let newFile = file.replace(
  '  "settings.quit": string;',
  '  "settings.quit": string;\n\n  // Modals\n  "modal.title_message": string;\n  "modal.title_command": string;\n  "modal.placeholder": string;'
);

newFile = newFile.replace(
  '  "settings.quit": "Thoát",',
  '  "settings.quit": "Thoát",\n  "modal.title_message": "Nhập tin nhắn",\n  "modal.title_command": "Nhập lệnh",\n  "modal.placeholder": "Nhập nội dung...",'
);

newFile = newFile.replace(
  '  "settings.quit": "Quit",',
  '  "settings.quit": "Quit",\n  "modal.title_message": "Enter message",\n  "modal.title_command": "Enter command",\n  "modal.placeholder": "Type here...",'
);

fs.writeFileSync('src/i18n.ts', newFile);
console.log('Fixed i18n again');
