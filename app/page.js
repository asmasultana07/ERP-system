"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import Logo from "../components/Logo";
import { saveSession } from "../lib/auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate() {
    const errors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errors.email = "Email is required.";
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      errors.email = "Enter a valid email address.";
    }

    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    }

    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    const errors = validate();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      setFormError("The API address is not configured.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${apiUrl.replace(/\/$/, "")}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success || !data.token) {
        setFormError(data?.message || "Login failed. Please try again.");
        return;
      }

      saveSession(data.token, data.user);
      router.push("/dashboard");
    } catch {
      setFormError("Could not reach the server. Check that the API is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-vendora-bg px-4 py-10">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl shadow-vendora/10 md:grid-cols-2">
        <div className="hidden flex-col justify-between bg-vendora-dark px-10 py-12 text-white md:flex">
          <div className="flex items-center gap-3">
            <Logo className="h-11 w-11" decorative />
            <p className="text-sm font-semibold tracking-[0.2em]">VENDORA</p>
          </div>
          <div>
            <h1 className="text-4xl font-semibold leading-tight">
              Smarter Stock. Better Business.
            </h1>
            <p className="mt-4 max-w-sm text-white/80">
              Sign in to follow stock, purchases, and sales for your business.
            </p>
          </div>
          <p className="text-sm text-vendora-accent">Wholesale and distribution</p>
        </div>

        <div className="px-6 py-10 sm:px-10">
          <div className="flex items-center gap-3 md:hidden">
            <Logo className="h-10 w-10" decorative />
            <div>
              <p className="text-sm font-semibold tracking-[0.16em] text-vendora">VENDORA</p>
              <p className="text-xs text-vendora-accent">Smarter Stock. Better Business.</p>
            </div>
          </div>
          <h2 className="mt-3 text-3xl font-semibold text-vendora-text">Sign in</h2>
          <p className="mt-2 text-vendora-text/70">
            Use the email and password for your VENDORA account.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
            {formError ? (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {formError}
              </p>
            ) : null}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-vendora-text">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={loading}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                className="mt-2 w-full rounded-xl border border-vendora/15 px-4 py-3 text-vendora-text outline-none transition focus:border-vendora focus:ring-2 focus:ring-vendora-accent/30 disabled:bg-vendora-bg"
                placeholder="you@company.com"
              />
              {fieldErrors.email ? (
                <p id="email-error" className="mt-2 text-sm text-red-700">
                  {fieldErrors.email}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-vendora-text">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={loading}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? "password-error" : undefined}
                className="mt-2 w-full rounded-xl border border-vendora/15 px-4 py-3 text-vendora-text outline-none transition focus:border-vendora focus:ring-2 focus:ring-vendora-accent/30 disabled:bg-vendora-bg"
                placeholder="At least 8 characters"
              />
              {fieldErrors.password ? (
                <p id="password-error" className="mt-2 text-sm text-red-700">
                  {fieldErrors.password}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl bg-vendora px-4 py-3 font-medium text-white transition hover:bg-vendora-dark disabled:cursor-not-allowed disabled:bg-vendora/70"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
