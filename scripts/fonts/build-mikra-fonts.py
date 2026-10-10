"""
בונה שני פונטים זהים בגיאומטריה מ-Ezra SIL (SIL Open Font License 1.1):
  NehoraMikra       — אותיות + ניקוד; גליפי הטעמים ריקים (אבל עם אותו מיקום/רוחב).
  NehoraMikraTeamim — רק הטעמים (וגם מתג ופסק); כל השאר ריק.
מציירים את שתי השכבות זו על זו: האותיות והניקוד בדיו, הטעמים בצבע רך,
וכך הם לא מתערבבים, באותו מיקום מדויק (אותו GPOS ואותם רוחבים).
השם "Ezra SIL" הוא Reserved Font Name, לכן לגרסה המשונה יש שם אחר.

הרצה: python3 scripts/fonts/build-mikra-fonts.py
"""
import os
from fontTools.ttLib import TTFont
from fontTools.pens.ttGlyphPen import TTGlyphPen

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'EzraSIL-SILEOT.ttf')
OUT = os.path.join(HERE, '..', '..', 'assets', 'fonts')

TAAM_CODEPOINTS = list(range(0x0591, 0x05B0)) + [0x05BD, 0x05C0]


def taam_glyphs(font):
    cmap = font.getBestCmap()
    names = {cmap[u] for u in TAAM_CODEPOINTS if u in cmap}
    gsub = font['GSUB'].table if 'GSUB' in font else None
    changed = True
    while changed and gsub:
        changed = False
        for lookup in gsub.LookupList.Lookup:
            for st in lookup.SubTable:
                if lookup.LookupType == 7:
                    st = st.ExtSubTable
                for attr in ('mapping', 'alternates'):
                    m = getattr(st, attr, None)
                    if not m:
                        continue
                    for k, v in m.items():
                        outs = v if isinstance(v, list) else [v]
                        if k in names:
                            for o in outs:
                                if o not in names:
                                    names.add(o)
                                    changed = True
                ligs = getattr(st, 'ligatures', None)
                if ligs:
                    for first, rows in ligs.items():
                        for lig in rows:
                            comps = [first] + list(lig.Component)
                            if all(c in names or c == 'combininggrapehemejoiner' for c in comps) and first in names:
                                if lig.LigGlyph not in names:
                                    names.add(lig.LigGlyph)
                                    changed = True
    return names


def blank(font, keep):
    glyf = font['glyf']
    empty = TTGlyphPen(None).glyph()
    for name in font.getGlyphOrder():
        if name in ('.notdef',):
            continue
        if not keep(name):
            glyf[name] = TTGlyphPen(None).glyph()
    return font


def rename(font, family):
    for rec in font['name'].names:
        if rec.nameID in (1, 4, 16, 18, 21):
            rec.string = family
        elif rec.nameID == 6:
            rec.string = family.replace(' ', '')
        elif rec.nameID == 3:
            rec.string = family + ' (modified from Ezra SIL 2.51)'


def build(family, keep_taam):
    font = TTFont(SRC)
    taam = taam_glyphs(font)
    blank(font, (lambda n: n in taam) if keep_taam else (lambda n: n not in taam))
    rename(font, family)
    for t in ('hdmx', 'LTSH', 'VDMX'):
        if t in font:
            del font[t]
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, family.replace(' ', '') + '.ttf')
    font.save(path)
    print(path, len(taam), 'taam glyphs')


build('Nehora Mikra', keep_taam=False)
build('Nehora Mikra Teamim', keep_taam=True)
