// יוצר גיבוב סיסמה ל-ADMIN_PASSWORD_HASH (למשל לאירוח). הסיסמה לא נשמרת בשום מקום.
import { askNewPassword, hashPassword } from './lib.mjs';

const pw = await askNewPassword();
console.log('\n  העתיקו את השורה הזו ל-admin/.env (או למשתני הסביבה באירוח):\n');
console.log(`  ADMIN_PASSWORD_HASH=${hashPassword(pw)}\n`);
