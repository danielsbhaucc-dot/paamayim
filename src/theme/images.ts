export const img = {
  heroSunrise: require('../../assets/images/bg-hero-sunrise.jpg'),
  mistSky: require('../../assets/images/bg-mist-sky.jpg'),
  completion: require('../../assets/images/bg-completion.jpg'),
  calendar: require('../../assets/images/bg-calendar.jpg'),
  homeHeroTree: require('../../assets/images/home-hero-tree.jpg'),
  haftaraProphet: require('../../assets/images/haftara-prophet.jpg'),
  familyChild: require('../../assets/images/family-child-rainbow.jpg'),
  familyAdult: require('../../assets/images/family-adult-study.jpg'),
  logoLeaf: require('../../assets/images/logo-leaf.png'),
  trophy: require('../../assets/images/trophy.png'),
  confettiLeaves: require('../../assets/images/confetti-leaves.png'),
} as const;
/** false = עדיין placeholder שקוף 4×4. ה-UI מציג fallback בקוד. מתעדכן ל-true רק אחרי שהקובץ האמיתי נוסף. */
export const imgReady = {
  logoLeaf: true,
  trophy: true,
  confettiLeaves: true,
};
