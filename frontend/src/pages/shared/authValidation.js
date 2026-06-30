const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAuthFields(fields, requireName = false) {
  if (requireName && !fields.fullName.trim()) {
    return "Full name is required";
  }

  if (!fields.email.trim() || !fields.password) {
    return "Email and password are required";
  }

  if (!emailPattern.test(fields.email.trim())) {
    return "Enter a valid email address";
  }

  if (fields.password.length < 6) {
    return "Password must be at least 6 characters";
  }

  if (requireName && fields.password !== fields.confirmPassword) {
    return "Passwords do not match";
  }

  return "";
}
