// Letters and spaces, with single spaces and dots allowed (for initials, e.g. "A. B. Nair").
// Disallows leading/trailing/double spaces or dots and any digits/special characters.
export const FULL_NAME_REGEX = /^[A-Za-z]+(?:[ .][A-Za-z]+)*\.?$/;

// Indian WhatsApp numbers: either 10 digits or 12 digits with a 91 country code prefix.
export const WHATSAPP_REGEX = /^(?:91)?[1-9]\d{9}$/;

export function normalizeWhatsappNumber(input: string): string {
  const digits = (input ?? "").replace(/\D/g, "");
  if (!digits) return "";

  const localNumber = digits.startsWith("91") ? digits.slice(2) : digits;
  const trimmed = localNumber.replace(/^0+/, "");

  if (trimmed.length !== 10) {
    return digits.length === 12 && digits.startsWith("91") ? digits : "";
  }

  return `91${trimmed}`;
}

export interface RegistrationInput {
  fullName: string;
  whatsappNumber: string;
  address: string;
  pincode: string;
}

export interface ValidationErrors {
  fullName?: string;
  whatsappNumber?: string;
  address?: string;
  pincode?: string;
}

export function validateRegistration(
  input: Partial<RegistrationInput>
): ValidationErrors {
  const errors: ValidationErrors = {};

  const fullName = (input.fullName ?? "").trim();
  const whatsappNumber = normalizeWhatsappNumber(input.whatsappNumber ?? "");
  const address = (input.address ?? "").trim();
  const pincode = (input.pincode ?? "").trim();

  if (!fullName) {
    errors.fullName = "Full name is required.";
  } else if (!FULL_NAME_REGEX.test(fullName)) {
    errors.fullName =
      "Full name can only contain letters, single spaces, and dots (for initials).";
  }

  if (!whatsappNumber) {
    errors.whatsappNumber = "WhatsApp number is required.";
  } else if (!WHATSAPP_REGEX.test(whatsappNumber)) {
    errors.whatsappNumber = "WhatsApp number must be a valid 10-digit mobile number with +91.";
  }

  if (!address) {
    errors.address = "Address is required.";
  }

  if (!pincode) {
    errors.pincode = "Pincode is required.";
  } else if (!/^\d{6}$/.test(pincode)) {
    errors.pincode = "Pincode must be a 6-digit number.";
  }

  return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}
