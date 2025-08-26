const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const generateReferralCode = (length = 8) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export { generateOTP, generateReferralCode };
