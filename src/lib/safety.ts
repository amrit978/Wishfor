export interface CrisisDetectionResult {
  hasCrisisSignals: boolean;
  matchedSignals: string[];
  helplines: Array<{
    name: string;
    number: string;
    callValue: string;
    description: string;
    hours: string;
    region: string;
    isEmergency?: boolean;
    isLink?: boolean;
  }>;
}

export interface DoxxingCheckResult {
  isBlocked: boolean;
  reason?: string;
}

const CRISIS_PATTERNS = [
  /\b(kill\s+(my\s*self|myself))\b/i,
  /\b(suicid(e|al))\b/i,
  /\b(end\s+(my\s*life|it\s*all))\b/i,
  /\b(want\s+to\s+die)\b/i,
  /\b(do\s*n'?t|do\s+not|dont|don)\s+want\s+to\s+(live|exist|wake\s*up)\b/i,
  /\b(hang\s+myself|slit\s+my\s*wrist|overdose)\b/i,
  /\b(cut(ting)?\s+myself)\b/i,
  /\b(domestic\s+violence|beating\s+me|abusing\s+me\s+physically)\b/i,
  /\b(tired\s+of\s+living|no\s+reason\s+to\s+live|give\s+up\s+on\s+life)\b/i,
];

export const CRISIS_HELPLINES = [
  {
    name: '988 Suicide & Crisis Lifeline',
    number: '988',
    callValue: '988',
    description: 'Free, confidential 24/7 support for individuals in suicidal crisis or emotional distress.',
    hours: '24/7 Instant',
    region: 'United States & Canada',
    isEmergency: true,
  },
  {
    name: 'Crisis Text Line',
    number: 'Text HOME to 741741',
    callValue: 'sms:741741',
    description: 'Free, 24/7 support via text message with trained crisis counselors.',
    hours: '24/7 Text Support',
    region: 'US / UK / Canada',
  },
  {
    name: 'Tele-MANAS',
    number: '14416 / 1800-891-4416',
    callValue: '14416',
    description: 'National 24/7 mental health crisis intervention hotline. Confidential and free.',
    hours: '24/7 Multilingual',
    region: 'India & South Asia',
  },
  {
    name: 'Samaritans',
    number: '116 123',
    callValue: '116123',
    description: 'Free, confidential listening support whatever you are going through.',
    hours: '24/7 Listening',
    region: 'UK & Ireland',
  },
  {
    name: 'Find A Helpline Directory',
    number: 'findahelpline.com',
    callValue: 'https://findahelpline.com',
    description: 'Locate free, confidential peer support and verified emergency crisis resources in your country.',
    hours: 'Global Directory',
    region: 'International',
    isLink: true,
  },
];

export function detectCrisis(text: string): CrisisDetectionResult {
  if (!text) {
    return { hasCrisisSignals: false, matchedSignals: [], helplines: CRISIS_HELPLINES };
  }

  const matches: string[] = [];
  for (const pattern of CRISIS_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      matches.push(match[0]);
    }
  }

  return {
    hasCrisisSignals: matches.length > 0,
    matchedSignals: matches,
    helplines: CRISIS_HELPLINES,
  };
}

export function checkDoxxing(text: string): DoxxingCheckResult {
  if (!text) return { isBlocked: false };

  // 1. Email pattern
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/i;
  if (emailPattern.test(text)) {
    return {
      isBlocked: true,
      reason: 'Personal email addresses detected. Please remove them to preserve complete anonymity.',
    };
  }

  // 2. Phone numbers (international and 10-digit formats)
  const phonePattern = /(?:(?:\+?1[\-\s]?)?\(?\d{3}\)?[\-\s]?\d{3}[\-\s]?\d{4})|(?:(?:\+?91[\-\s]?)?[6-9]\d{4}[\-\s]?\d{5})|(?:\b\d{10}\b)/;
  if (phonePattern.test(text)) {
    return {
      isBlocked: true,
      reason: 'Telephone contact detected. Sharing phone numbers is blocked to protect all masks.',
    };
  }

  // 3. Social media handles
  const socialHandlePattern = /(?:instagram\.com\/|t\.me\/|wa\.me\/|twitter\.com\/|x\.com\/)[\w.]+/i;
  if (socialHandlePattern.test(text)) {
    return {
      isBlocked: true,
      reason: 'Social media handles or direct messaging links detected. Please remove them.',
    };
  }

  return { isBlocked: false };
}
