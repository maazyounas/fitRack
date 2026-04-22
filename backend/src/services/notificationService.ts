export async function sendOtpNotification(target: string, otp: string, purpose: string) {
  console.log(`[FITRACK OTP] purpose=${purpose} target=${target} otp=${otp}`);
}

export async function sendPasswordChangedNotification(target: string) {
  console.log(`[FITRACK PASSWORD CHANGED] target=${target}`);
}
