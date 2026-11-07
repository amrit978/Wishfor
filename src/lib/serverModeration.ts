import { checkDoxxing, detectCrisis } from './safety';

export interface ServerValidationResult {
  isValid: boolean;
  error?: string;
  isCrisis?: boolean;
}

export function validateProblemContent(title: string | undefined, body: string): ServerValidationResult {
  const combined = `${title || ''} ${body}`.trim();

  if (!body || body.trim().length === 0) {
    return { isValid: false, error: 'Problem body cannot be empty.' };
  }

  if (body.trim().length > 2000) {
    return { isValid: false, error: 'Body exceeds maximum length of 2000 characters.' };
  }

  // Anti-doxxing check
  const doxxing = checkDoxxing(combined);
  if (doxxing.isBlocked) {
    return { isValid: false, error: doxxing.reason };
  }

  // Crisis detection
  const crisis = detectCrisis(combined);

  return {
    isValid: true,
    isCrisis: crisis.hasCrisisSignals,
  };
}

export function validateReplyContent(body: string): ServerValidationResult {
  const trimmed = (body || '').trim();

  if (!trimmed) {
    return { isValid: false, error: 'Advice cannot be empty.' };
  }

  if (trimmed.length > 2000) {
    return { isValid: false, error: 'Advice exceeds maximum length of 2000 characters.' };
  }

  const doxxing = checkDoxxing(trimmed);
  if (doxxing.isBlocked) {
    return { isValid: false, error: doxxing.reason };
  }

  return { isValid: true };
}

