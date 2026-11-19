export const gesture = { lastPanEnd: 0 };

export const recentlyPanned = () => Date.now() - gesture.lastPanEnd < 300;
