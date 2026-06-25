import type { Strings } from './ja';

// English. Mirrors ja.ts exactly (same keys/signatures).
export const en: Strings = {
  appName: 'Imasugu Timer',

  common: {
    close: 'Close',
    cancel: 'Cancel',
    ok: 'OK',
    delete: 'Delete',
    undo: 'Undo',
  },

  main: {
    areaHidden: 'Other presets',
    areaWidget: 'On widget',
    widgetSlots: (used: number, max: number | '∞') => `${used} / ${max}`,
    quickStart: 'New',
    dragHint: 'Tap to edit · Drag to reorder (bottom = shown on widget)',
    edit: 'Edit',
    editDone: 'Done',
    editExit: 'Finish editing',
    settings: 'Settings',
  },

  preset: {
    newTitle: 'New preset',
    editTitle: 'Edit preset',
    duration: 'Duration',
    icon: 'Icon',
    color: 'Color',
    showInWidget: 'Show on widget',
    save: 'Save',
    delete: 'Delete',
    deleteConfirm: 'Delete this preset? Any running timers will continue.',
  },

  board: {
    addPreset: 'Add preset',
    timerOf: (dur: string) => `${dur} timer`,
    editHint: 'Tap to edit. Long-press to move',
    launchHint: 'Tap to start. Long-press to reorder',
  },

  quick: {
    title: 'Quick timer',
    start: 'Start',
    byDuration: 'By duration',
    byClock: 'By time',
    clockSummary: (clock: string, remaining: string) => `Until ${clock} · ${remaining} left`,
  },

  wheel: {
    day: 'day',
    hour: 'hr',
    minute: 'min',
    second: 'sec',
  },

  timer: {
    pause: 'Pause',
    resume: 'Resume',
    cancel: 'Cancel',
    ends: 'Ends',
    finished: 'Done',
    pausedNow: 'Paused',
    finishedHint: 'Done · Tap to clear',
    tapToClear: 'Tap to clear',
    cancelled: 'Timer deleted',
  },

  settings: {
    title: 'Settings',
    sound: 'Alert sound',
    haptics: 'Haptic feedback',
    feedback: 'Feedback',
    pro: 'Pro',
    purchase: 'Get Pro',
    restore: 'Restore purchase',
    about: 'About',
    version: 'Version',
    contact: 'Feedback & requests',
    review: 'Rate & support',
    privacy: 'Privacy Policy',
    terms: 'Terms of Use',
  },

  sounds: {
    default: 'Default',
    bell: 'Bell',
    chime: 'Chime',
    marimba: 'Marimba',
  },

  pro: {
    title: 'Upgrade to Pro',
    subtitle: 'One-time purchase — not a subscription',
    featureWidget: 'Unlimited widget slots',
    featureWidgetSub: 'Put as many presets on the widget as you like',
    featureSupport: 'Support an indie developer',
    featureSupportSub: 'Help fund future updates',
    cta: 'Buy',
    oneTime: 'Pay once, use forever',
    restore: 'Restore purchase',
    restoring: 'Restoring…',
    restored: 'Pro restored',
    notRestored: 'No purchase to restore was found',
    purchased: 'Upgraded to Pro',
    pending: 'Your purchase is pending approval. It will activate automatically once approved.',
    purchaseFailed: "Couldn't complete the purchase. Please try again later.",
    active: 'Pro active',
    activeSub: 'Thank you for your purchase',
    widgetLimit: 'Free includes up to 3 widget slots. Pro makes it unlimited.',
  },

  onboarding: {
    next: 'Next',
    start: 'Get started',
    skip: 'Skip',
    page1Title: 'One tap from your widget',
    page1Body: 'Save the durations you use most as presets and start them instantly from your Home Screen widget.',
    page2Title: "When time's up, for sure",
    page2Body: 'With permission, the timer alerts you with sound and screen even in Silent or Focus mode — even if the app is closed.',
    page2Cta: 'Allow alerts',
    page2Later: 'Later',
    page3Title: 'Add the widget',
    page3Body: 'Long-press your Home Screen → "+" → choose "Imasugu Timer" to start with one tap.',
  },

  alarm: {
    permissionDenied: "Can't sound the alarm",
    permissionDeniedBody: 'Alerts are not allowed, so the timer will not make a sound when it ends.',
    openSettings: 'Open Settings',
  },

  duration: {
    short: (d: number, h: number, m: number, s: number): string => {
      const parts: string[] = [];
      if (d > 0) parts.push(`${d} ${d === 1 ? 'day' : 'days'}`);
      if (h > 0) parts.push(`${h} hr`);
      if (m > 0) parts.push(`${m} min`);
      if (s > 0 && d === 0 && h === 0) parts.push(`${s} sec`);
      return parts.length ? parts.join(' ') : '0 sec';
    },
    remainingDayPrefix: (days: number) => `${days}d `,
  },
};
