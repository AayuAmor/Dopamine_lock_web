import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input } from "../components";
import { useAuth } from "../context/useAuth";
import { AuthShell } from "./shared/AuthShell";
import { validateAuthFields } from "./shared/authValidation";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateAuthFields(form, true);

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setError("");
      setIsSubmitting(true);
      await register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
      });
      navigate("/dashboard", { replace: true });
    } catch (authError) {
      setError(authError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create Account"
      subtitle="Build a disciplined control profile."
      onSubmit={handleSubmit}
    >
      {error && <p className="form-error">{error}</p>}
      <Input
        label="Full name"
        value={form.fullName}
        onChange={(event) => updateField("fullName", event.target.value)}
        placeholder="Full name"
      />
      <Input
        label="Email"
        type="email"
        value={form.email}
        onChange={(event) => updateField("email", event.target.value)}
        placeholder="operator@dopaminelock.app"
      />
      <Input
        label="Password"
        type="password"
        value={form.password}
        onChange={(event) => updateField("password", event.target.value)}
        placeholder="Password"
      />
      <Input
        label="Confirm password"
        type="password"
        value={form.confirmPassword}
        onChange={(event) => updateField("confirmPassword", event.target.value)}
        placeholder="Confirm password"
      />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating Account" : "Create Account"}
      </Button>
      <div className="auth-links">
        <Link to="/login">Login</Link>
      </div>
    </AuthShell>
  );
}
