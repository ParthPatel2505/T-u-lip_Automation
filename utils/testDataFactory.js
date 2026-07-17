import fs from 'fs';
import path from 'path';
import { generateRandomAlphabetic, generateRandomNumber } from './helper.js';

export function generateTulipData(prefix = 'Tulipdata') {
  const suffix = generateRandomAlphabetic(5);
  const number = generateRandomNumber(1000, 9999);
  const key = `${prefix}${suffix}${number}`;

  return {
    key,
    title: `${key} Innovation`,
    project: `${key} Project`,
    comment: `${key} comment added from automation test.`,
    note: `${key} review note added from automation test.`,
    feedback: `${key} feedback added from automation test.`,
    summary: `${key} validates reusable automation flow for Innovation.`,
    longText: `${key} is generated automation content for validating Innovation forms, editor fields, filtering, sorting, and review workflows.`,
    referenceLink: `https://example.com/${key.toLowerCase()}`,
  };
}

export function createUploadFixtures(prefix = 'Tulipdata') {
  const dir = path.resolve('test-results', 'upload-fixtures');
  fs.mkdirSync(dir, { recursive: true });

  const invalidFile = path.join(dir, `${prefix}-invalid.exe`);
  const validFile = path.join(dir, `${prefix}-valid.pdf`);
  const attachmentFile = path.join(dir, `${prefix}-attachment.pdf`);

  fs.writeFileSync(invalidFile, 'This intentionally has an invalid extension for upload validation.');
  fs.writeFileSync(validFile, '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
  fs.writeFileSync(attachmentFile, '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');

  return { invalidFile, validFile, attachmentFile };
}
