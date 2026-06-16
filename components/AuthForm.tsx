"use client";

import React, { useActionState, startTransition } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DefaultValues,
  FieldValues,
  SubmitHandler,
  useForm,
  Controller,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import FileUpload from "@/components/FileUpload";
import { FIELD_NAMES, FIELD_TYPES } from "@/constants";
import { SignInSchema, SignUpSchema } from "@/lib/validations";
import { type AuthState } from "@/app/actions/auth";

const SIGN_IN_DEFAULTS = {
  email: "",
  password: "",
};

const SIGN_UP_DEFAULTS = {
  fullName: "",
  email: "",
  universityId: undefined as unknown as number,
  universityCard: "",
  password: "",
};

// Text-input field names (everything except universityCard)
const TEXT_FIELDS_SIGN_UP = ["fullName", "email", "universityId", "password"] as const;
const TEXT_FIELDS_SIGN_IN = ["email", "password"] as const;

interface Props {
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  type: "SIGN_UP" | "SIGN_IN";
}

const AuthForm = ({ type, action }: Props) => {
  const isSignIn = type === "SIGN_IN";

  const schema = isSignIn ? SignInSchema : SignUpSchema;
  const defaultValues = isSignIn ? SIGN_IN_DEFAULTS : SIGN_UP_DEFAULTS;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<any>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: defaultValues as DefaultValues<FieldValues>,
    mode: "onTouched",
  });

  const [state, formAction, isPending] = useActionState<AuthState, FormData>(
    action,
    { success: false, error: "" }
  );

  const handleSubmit: SubmitHandler<any> = (data) => {
    const fd = new FormData();
    Object.entries(data as Record<string, unknown>).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        fd.append(key, String(val));
      }
    });
    startTransition(() => {
      formAction(fd);
    });
  };

  const textFields = isSignIn ? TEXT_FIELDS_SIGN_IN : TEXT_FIELDS_SIGN_UP;

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="mb-1">
        <h1 className="text-2xl font-semibold text-white leading-tight">
          {isSignIn ? "Welcome back to BookWise" : "Create your library account"}
        </h1>
        <p className="mt-1.5 text-light-100 text-sm leading-relaxed">
          {isSignIn
            ? "Access the vast collection of resources, and stay updated"
            : "Please complete all fields and upload a valid university ID to gain access to the library"}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="w-full space-y-5">

          {/* ── Text / number / password inputs ── */}
          {textFields.map((field) => (
            <FormField
              key={field}
              control={form.control}
              name={field}
              render={({ field: fieldProps }) => (
                <FormItem>
                  <FormLabel className="text-light-100 text-sm font-medium">
                    {FIELD_NAMES[fieldProps.name as keyof typeof FIELD_NAMES] ?? fieldProps.name}
                  </FormLabel>
                  <FormControl>
                    <Input
                      required
                      type={FIELD_TYPES[fieldProps.name as keyof typeof FIELD_TYPES] ?? "text"}
                      {...fieldProps}
                      value={fieldProps.value ?? ""}
                      className="form-input"
                      autoComplete={
                        fieldProps.name === "password" ? "current-password"
                        : fieldProps.name === "email" ? "email"
                        : "off"
                      }
                    />
                  </FormControl>
                  <FormMessage className="text-red-400 text-xs" />
                </FormItem>
              )}
            />
          ))}

          {/* ── University ID Card upload — rendered WITHOUT FormControl/FormLabel
               so the shadcn label's htmlFor doesn't link to the FileUpload wrapper
               (which would cause label clicks to re-open the file dialog instead
               of letting the "Use sample card" button work). ── */}
          {!isSignIn && (
            <Controller
              control={form.control}
              name="universityCard"
              render={({ field: fieldProps, fieldState }) => (
                <div className="space-y-2">
                  {/* Plain <label> with NO htmlFor — avoids click-forwarding */}
                  <label className="text-light-100 text-sm font-medium block">
                    {FIELD_NAMES.universityCard}
                  </label>

                  <FileUpload
                    type="image"
                    accept="image/*"
                    placeholder="Upload your University ID Card"
                    folder="ids"
                    variant="dark"
                    showSample={true}
                    value={fieldProps.value as string}
                    onFileChange={(val) => {
                      fieldProps.onChange(val);
                    }}
                  />

                  {/* Validation error */}
                  {fieldState.error && (
                    <p className="text-red-400 text-xs">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />
          )}

          {/* Server-side error banner */}
          {state?.error && !isPending && (
            <div
              role="alert"
              className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 flex items-start gap-2"
            >
              <span className="shrink-0 mt-0.5">⚠</span>
              <span>{state.error}</span>
            </div>
          )}

          <Button
            type="submit"
            className="form-btn"
            disabled={isPending}
            id={isSignIn ? "sign-in-btn" : "sign-up-btn"}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="size-4 border-2 border-dark-100/30 border-t-dark-100 rounded-full animate-spin" />
                {isSignIn ? "Signing in…" : "Creating account…"}
              </span>
            ) : isSignIn ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm font-medium text-light-100">
        {isSignIn ? "New to BookWise? " : "Already have an account? "}
        <Link
          href={isSignIn ? "/sign-up" : "/sign-in"}
          className="font-bold text-primary hover:underline underline-offset-2 transition-colors"
          id={isSignIn ? "go-to-sign-up" : "go-to-sign-in"}
        >
          {isSignIn ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </div>
  );
};

export default AuthForm;