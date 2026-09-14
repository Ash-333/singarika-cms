import { redirect } from "next/navigation";
import { auth } from "@/auth";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_minmax(24rem,32rem)]">
      {/* The shop's own cloth, as the front door. */}
      <div className="relative hidden bg-rail lg:flex lg:flex-col lg:justify-between lg:p-12">
        <span className="font-display text-3xl text-white">Singarika</span>
        <p className="max-w-sm font-display text-2xl leading-snug text-rail-ink">
          Handwoven Dhaka, pashmina and everyday wear, kept in order from Kathmandu.
        </p>
        <span className="text-sm text-rail-muted">Catalogue &amp; content manager</span>
        <div className="dhaka-edge absolute inset-y-0 right-0 w-1.5" aria-hidden />
      </div>

      <div className="flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <span className="font-display text-3xl text-ink">Singarika</span>
            <p className="mt-1 text-sm text-muted">Catalogue &amp; content manager</p>
          </div>
          <h1 className="mt-8 font-display text-2xl text-ink lg:mt-0">Sign in</h1>
          <p className="mt-1.5 text-sm text-muted">Use the account the shop gave you.</p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
