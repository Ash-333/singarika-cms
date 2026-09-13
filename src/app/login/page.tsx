import { redirect } from "next/navigation";
import { auth } from "@/auth";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-pink-900">Singarika</h1>
          <p className="mt-1 text-sm text-stone-500">Store content manager</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
