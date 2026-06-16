import AuthForm from "@/components/AuthForm";
import { signIn } from "@/app/actions/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | BookWise",
  description: "Sign in to your BookWise account to access the library.",
};

const SignInPage = () => (
  <AuthForm type="SIGN_IN" action={signIn} />
);

export default SignInPage;