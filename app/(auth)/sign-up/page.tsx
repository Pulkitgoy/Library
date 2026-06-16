import AuthForm from "@/components/AuthForm";
import { signUp } from "@/app/actions/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | BookWise",
  description: "Create a BookWise account to borrow and buy books from the library.",
};

const SignUpPage = () => (
  <AuthForm type="SIGN_UP" action={signUp} />
);

export default SignUpPage;