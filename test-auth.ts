import { signUp, signIn } from "./app/actions/auth";

async function test() {
  console.log("Testing Signup...");
  const fd = new FormData();
  fd.append("fullName", "Test User");
  fd.append("email", "test@test.com");
  fd.append("universityId", "5555");
  fd.append("universityCard", "/images/sample-university-card.png");
  fd.append("password", "12345678");

  try {
    const state = { success: false, error: "" } as any;
    const res = await signUp(state, fd);
    console.log("Signup Response:", res);
  } catch (err: any) {
    if (err?.digest?.startsWith('NEXT_REDIRECT')) {
      console.log("Signup Redirected! Success!");
    } else {
      console.error("Signup Error:", err);
    }
  }

  console.log("Testing SignIn...");
  const fd2 = new FormData();
  fd2.append("email", "test@test.com");
  fd2.append("password", "12345678");
  try {
    const state = { success: false, error: "" } as any;
    const res = await signIn(state, fd2);
    console.log("SignIn Response:", res);
  } catch (err: any) {
    if (err?.digest?.startsWith('NEXT_REDIRECT')) {
      console.log("SignIn Redirected! Success!");
    } else {
      console.error("SignIn Error:", err);
    }
  }
}

test();
