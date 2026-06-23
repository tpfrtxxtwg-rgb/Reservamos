// ============================================================
// Booking Widget Validation Utilities
// ============================================================

export interface ValidationError {
  field: string;
  message: string; // i18n key, e.g. "widget.validation.required"
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// ============================================================
// i18n Error Keys
// ============================================================
const ERROR_KEYS = {
  required: "widget.validation.required",
  invalidEmail: "widget.validation.invalidEmail",
  invalidPhone: "widget.validation.invalidPhone",
  pastDate: "widget.validation.pastDate",
  departureBeforeArrival: "widget.validation.departureBeforeArrival",
  invalidFlightNumber: "widget.validation.invalidFlightNumber",
} as const;

// ============================================================
// Field-Level Validation Functions
// Each returns ValidationError | null
// ============================================================

/**
 * Validates that a value is present and not empty.
 */
export function validateRequired(
  value: string | null | undefined,
  field: string
): ValidationError | null {
  if (value == null || value.trim() === "") {
    return { field, message: ERROR_KEYS.required };
  }
  return null;
}

/**
 * Validates email format (RFC 5322 simplified).
 */
export function validateEmail(
  email: string,
  field: string
): ValidationError | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { field, message: ERROR_KEYS.invalidEmail };
  }
  return null;
}

/**
 * Validates a phone number.
 * Minimum 7 digits; only digits and common separators (+, -, space, parentheses).
 *
 * @param phone - the phone string to validate
 * @param field - field identifier
 * @param required - when true, the field must be non-empty and valid
 */
export function validatePhone(
  phone: string,
  field: string,
  required?: boolean
): ValidationError | null {
  const trimmed = phone.trim();

  // If not required and empty, it's valid
  if (!required && trimmed === "") {
    return null;
  }

  // If required and empty
  if (required && trimmed === "") {
    return { field, message: ERROR_KEYS.invalidPhone };
  }

  // Strip allowed separators and check we have at least 7 digits
  const digitsOnly = trimmed.replace(/[\s\-+.()]/g, "");
  if (!/^\d+$/.test(digitsOnly) || digitsOnly.length < 7) {
    return { field, message: ERROR_KEYS.invalidPhone };
  }

  return null;
}

/**
 * Validates that a date string is not in the past.
 * Expects ISO-8601 or YYYY-MM-DD format.
 */
export function validateFutureDate(
  dateStr: string,
  field: string
): ValidationError | null {
  const inputDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (inputDate < today) {
    return { field, message: ERROR_KEYS.pastDate };
  }
  return null;
}

/**
 * Validates that dateA is strictly after dateB.
 * Used e.g. to ensure departureDate is after arrival date.
 */
export function validateDateAfter(
  dateA: string,
  dateB: string,
  fieldA: string,
  _fieldB: string
): ValidationError | null {
  const dA = new Date(dateA);
  const dB = new Date(dateB);

  if (dA <= dB) {
    return { field: fieldA, message: ERROR_KEYS.departureBeforeArrival };
  }
  return null;
}

/**
 * Validates a flight number (non-empty alphanumeric, optional spaces).
 */
export function validateFlightNumber(
  value: string,
  field: string
): ValidationError | null {
  const trimmed = value.trim();
  if (trimmed === "" || !/^[A-Za-z0-9\s]+$/.test(trimmed)) {
    return { field, message: ERROR_KEYS.invalidFlightNumber };
  }
  return null;
}

/**
 * Validates that a number falls within an inclusive range.
 */
export function validateNumberRange(
  value: number,
  min: number,
  max: number,
  field: string
): ValidationError | null {
  if (value < min || value > max) {
    return {
      field,
      // Re-use the required key as a generic fallback, or callers can
      // compose their own messages around this helper.
      message: ERROR_KEYS.required,
    };
  }
  return null;
}

// ============================================================
// Step Data Interfaces
// ============================================================

export interface Step2Data {
  origin: string;
  date: string;
  time: string;
  destinationId: string | null;
  flightNumber: string;
  airline: string;
  isAirportService: boolean;
  isRoundTrip: boolean;
  departureDate: string;
  departureTime: string;
  hotelPickupTime: string;
}

export interface Step5Data {
  passengerName: string;
  passengerLastName: string;
  passengerEmail: string;
  passengerPhone: string;
}

// ============================================================
// Step Validators
// ============================================================

/**
 * Validates Step 2 (booking details) of the widget.
 *
 * Rules:
 *  - origin: required
 *  - date: required + not past
 *  - time: required
 *  - destinationId: required
 *  - flightNumber: required if isAirportService
 *  - airline: required if isAirportService
 *  - departureDate: required if isRoundTrip + must be after date
 *  - departureTime: required if isRoundTrip
 *  - hotelPickupTime: required if isRoundTrip
 */
export function validateStep2(data: Step2Data): ValidationResult {
  const errors: ValidationError[] = [];

  // origin
  {
    const err = validateRequired(data.origin, "origin");
    if (err) errors.push(err);
  }

  // date
  {
    const err = validateRequired(data.date, "date");
    if (err) {
      errors.push(err);
    } else {
      const dateErr = validateFutureDate(data.date, "date");
      if (dateErr) errors.push(dateErr);
    }
  }

  // time
  {
    const err = validateRequired(data.time, "time");
    if (err) errors.push(err);
  }

  // destinationId
  {
    const err = validateRequired(
      data.destinationId ?? "",
      "destinationId"
    );
    if (err) errors.push(err);
  }

  // flightNumber (only for airport service)
  if (data.isAirportService) {
    const err = validateFlightNumber(data.flightNumber, "flightNumber");
    if (err) errors.push(err);
  }

  // airline (only for airport service)
  if (data.isAirportService) {
    const err = validateRequired(data.airline, "airline");
    if (err) errors.push(err);
  }

  // round-trip fields
  if (data.isRoundTrip) {
    // departureDate: required + must be after date
    {
      const err = validateRequired(data.departureDate, "departureDate");
      if (err) {
        errors.push(err);
      } else {
        const afterErr = validateDateAfter(
          data.departureDate,
          data.date,
          "departureDate",
          "date"
        );
        if (afterErr) errors.push(afterErr);
      }
    }

    // departureTime: required
    {
      const err = validateRequired(data.departureTime, "departureTime");
      if (err) errors.push(err);
    }

    // hotelPickupTime: required
    {
      const err = validateRequired(
        data.hotelPickupTime,
        "hotelPickupTime"
      );
      if (err) errors.push(err);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates Step 5 (passenger details) of the widget.
 *
 * Rules:
 *  - passengerName: required
 *  - passengerLastName: required
 *  - passengerEmail: required + valid email
 *  - passengerPhone: optional, but if provided must be valid (min 7 digits)
 */
export function validateStep5(data: Step5Data): ValidationResult {
  const errors: ValidationError[] = [];

  // passengerName
  {
    const err = validateRequired(data.passengerName, "passengerName");
    if (err) errors.push(err);
  }

  // passengerLastName
  {
    const err = validateRequired(
      data.passengerLastName,
      "passengerLastName"
    );
    if (err) errors.push(err);
  }

  // passengerEmail: required + valid email
  {
    const err = validateRequired(data.passengerEmail, "passengerEmail");
    if (err) {
      errors.push(err);
    } else {
      const emailErr = validateEmail(data.passengerEmail, "passengerEmail");
      if (emailErr) errors.push(emailErr);
    }
  }

  // passengerPhone: optional, but validate if non-empty
  {
    const err = validatePhone(data.passengerPhone, "passengerPhone", false);
    if (err) errors.push(err);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}