/** שיתוף כרטיס סיום כתמונה: באפליקציה — צילום הכרטיס + חלון שיתוף; ב-web — ציור על canvas והורדה */
import { Platform, Share, type View } from 'react-native';
import { siyumLines, type SiyumData } from '../ui/SiyumCard';

export async function shareSiyum(ref: View | null, s: SiyumData, all: { book: string; year: number }[], logoUri?: string) {
  const l = siyumLines(s, all);
  const text = `${l.title} · ${l.detail} · ${l.year}${l.streak ? ' · ' + l.streak : ''}`;
  if (Platform.OS === 'web') return downloadWeb(l, logoUri);
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { captureRef } = require('react-native-view-shot');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sharing = require('expo-sharing');
    const uri: string = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: l.title });
      return;
    }
  } catch {
    // גרסה ישנה בלי המודולים — משתפים כטקסט
  }
  await Share.share({ message: text });
}

async function downloadWeb(l: ReturnType<typeof siyumLines>, logoUri?: string) {
  const W = 1080;
  const H = 1350;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  if (!g) return;
  g.fillStyle = '#F6F3EC';
  g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(31,158,140,0.08)';
  g.fillRect(0, 0, W, 560);
  if (logoUri) {
    await new Promise<void>((res) => {
      const im = new window.Image();
      im.onload = () => {
        g.drawImage(im, W / 2 - 135, 230, 270, 270);
        res();
      };
      im.onerror = () => res();
      im.src = logoUri;
    });
  }
  g.direction = 'rtl';
  g.textAlign = 'center';
  const line = (txt: string, y: number, font: string, color: string) => {
    g.font = font;
    g.fillStyle = color;
    g.fillText(txt, W / 2, y);
  };
  line(l.title, 640, '800 84px Assistant_800ExtraBold, Assistant, sans-serif', '#14284B');
  g.fillStyle = 'rgba(31,158,140,0.6)';
  g.fillRect(W / 2 - 75, 700, 150, 6);
  line(l.detail, 800, '600 52px Assistant_600SemiBold, Assistant, sans-serif', '#1D5A57');
  line(l.year, 880, '400 46px Assistant_400Regular, Assistant, sans-serif', '#34566E');
  if (l.streak) line(l.streak, 950, '400 46px Assistant_400Regular, Assistant, sans-serif', '#34566E');
  line('נהורא · שניים מקרא ואחד תרגום', H - 70, '600 38px Assistant_600SemiBold, Assistant, sans-serif', 'rgba(20,40,75,0.55)');
  const a = document.createElement('a');
  a.href = c.toDataURL('image/png');
  a.download = 'siyum-nehora.png';
  a.click();
}
