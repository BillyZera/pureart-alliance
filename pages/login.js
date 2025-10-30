
// pages/login.js — optional dedicated login page
import dynamic from "next/dynamic";
const AuthButtons = dynamic(()=>import("../components/AuthButtons"), { ssr:false });

export default function LoginPage(){
  return (
    <div className="rounded-2xl border p-6 bg-white shadow-sm max-w-md mx-auto mt-10">
      <h1 className="page-title mb-4">Sign in</h1>
      <p className="muted mb-4">Enter your email to receive a magic link.</p>
      <AuthButtons />
    </div>
  );
}
