import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
html, body {
  background-color: #C5E4E8;
  direction: rtl;
  width: 100%;
  max-width: 100%;
  overflow-x: clip;
}
/* Do not set a global img { max-width:100% }: cover backgrounds and the
   megillah need to size independently. Overflow is clipped here; image
   boxes are constrained in ScreenBackground / AppLoadingScreen. */
`;
