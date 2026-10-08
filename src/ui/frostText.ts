import { nw } from '../theme/design';

/** הילה פנינית עדינה סביב טקסט כהה על זכוכית כפור — שומרת על קריאות כשהרקע בוהק */
export const frostText = {
  textShadowColor: nw.color.glow,
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 12,
} as const;
