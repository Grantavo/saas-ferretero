"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Hammer,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(
        authError.message === "Invalid login credentials"
          ? "Correo o contraseña incorrectos."
          : authError.message,
      );
      setLoading(false);
      return;
    }

    // Pequeño delay para que RLS reconozca la sesión recién creada
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Verificar si es super admin para redirigir correctamente
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_super_admin")
      .eq("id", data.user.id)
      .single();

    if (profile?.is_super_admin === true) {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFCFB]">
      {/* Top bar */}
      <nav className="flex items-center justify-between px-8 py-4 backdrop-blur-md bg-background/80">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-xl">
            <Hammer className="w-6 h-6 text-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight">GrupoJenta</span>
        </div>
        <a
          href="https://wa.me/573026043683"
          target="_blank"
          rel="noopener noreferrer"
          className="border-2 border-slate-300 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-600 hover:text-white hover:border-slate-600 transition-all"
        >
          Contáctanos
        </a>
      </nav>

      <div className="flex-1 flex items-start justify-center pt-8 px-4">
        {/* Background decoration */}
        <div className="fixed inset-0 overflow-hidden -z-10">
          <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />
          <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-400/5 rounded-full blur-[100px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[32px] border border-white shadow-2xl shadow-slate-200/50">
            <div className="flex flex-col items-center mb-6">
              <div className="bg-primary/10 p-3 rounded-2xl mb-4">
                <Hammer className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                Bienvenido de nuevo
              </h1>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-50 rounded-2xl flex items-center gap-2 text-red-700"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="text-xs font-medium">{error}</p>
              </motion.div>
            )}

            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-2">
                <label className="text-sm font-semibold ml-1">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    placeholder="tu@correo.com"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-semibold">Contraseña</label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-700 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground py-3 rounded-2xl font-bold text-base hover:opacity-90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Entrar{" "}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              <p className="text-muted-foreground text-sm">
                Plataforma administrada por{" "}
                <span className="text-primary font-bold">GrupoJenta</span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
