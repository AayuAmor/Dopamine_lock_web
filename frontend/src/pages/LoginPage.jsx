import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input } from "../components";
import { useAuth } from "../context/useAuth";
import { AuthShell } from "./shared/AuthShell";
import { validateAuthFields } from "./shared/authValidation";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateAuthFields(form);

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setError("");
      setIsSubmitting(true);
      await login({ email: form.email, password: form.password });
      navigate("/dashboard", { replace: true });
    } catch (authError) {
      setError(authError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Login"
      subtitle="Return to the operating system."
      onSubmit={handleSubmit}
    >
      {error && <p className="form-error">{error}</p>}
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
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Logging In" : "Login"}
      </Button>
      <div className="auth-links">
        <Link to="/login">Forgot password</Link>
        <Link to="/register">Sign up</Link>
      </div>
    </AuthShell>
  );
}
