// Simple in-memory OTP store (not for production, use Redis/db in prod)
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

export const setOTP = (email: string, otp: string) => {
  const expiresAt = Date.now() + 5 * 60 * 1000; // expires in 5 minutes
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedOTP = otp.toString().trim();

  otpStore.set(normalizedEmail, { otp: normalizedOTP, expiresAt });
  console.log("OTP set for:", normalizedEmail, "OTP:", normalizedOTP);
};

export const verifyOTP = (email: string, otp: string) => {
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedOTP = otp.toString().trim();

  const record = otpStore.get(normalizedEmail);

  console.log("Verifying OTP:", {
    email: normalizedEmail,
    inputOTP: normalizedOTP,
    storedRecord: record
      ? { otp: record.otp, expired: Date.now() > record.expiresAt }
      : null,
  });

  if (!record) {
    console.log("No OTP record found for email:", normalizedEmail);
    return false;
  }

  if (Date.now() > record.expiresAt) {
    console.log("OTP expired for email:", normalizedEmail);
    otpStore.delete(normalizedEmail);
    return false;
  }

  if (record.otp !== normalizedOTP) {
    console.log("OTP mismatch:", {
      stored: record.otp,
      provided: normalizedOTP,
    });
    return false;
  }

  otpStore.delete(normalizedEmail); // consume OTP after verification
  return true;
};

// Debug function to see all stored OTPs
export const getAllOTPs = () => {
  return Array.from(otpStore.entries());
};
