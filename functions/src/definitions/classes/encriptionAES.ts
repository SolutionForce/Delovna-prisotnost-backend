import CryptoJS from 'crypto-js';

//Only for backend use
const secretKey = '^.!oVozKhZmhi{~rdJN+%DGmy_Uv}lHZ9m2jLS77WIQcWynz;P';

export function encrypt(text: string) {
  const ciphertext = CryptoJS.AES.encrypt(text, secretKey).toString();
  return ciphertext;
}

export function decrypt(ciphertext: string) {
  const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
  const originalText = bytes.toString(CryptoJS.enc.Utf8);
  return originalText;
}
