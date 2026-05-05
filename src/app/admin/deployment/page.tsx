"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Database, 
  CreditCard, 
  Globe, 
  Lock,
  RefreshCw
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function DeploymentReadiness() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || (profile?.role !== "admin" && profile?.role !== "owner"))) {
      router.push("/dashboard");
    }
  }, [user, profile, loading, router]);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/deployment-check");
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  if (loading && !status) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        </div>
      </MainLayout>
    );
  }

  const StatusItem = ({ label, exists, secret = false }: { label: string, exists: boolean, secret?: boolean }) => (
    <div className="flex items-center justify-between p-3 border-b border-[#b8860b]/5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {exists ? (
          <span className="flex items-center gap-1 text-[10px] text-green-500 font-bold uppercase">
            <CheckCircle2 className="w-3 h-3" /> Detected
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] text-red-500 font-bold uppercase">
            <XCircle className="w-3 h-3" /> Missing
          </span>
        )}
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-12 px-6">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-serif text-foreground uppercase tracking-tighter">Deployment Readiness</h1>
          </div>
          <p className="text-muted-foreground italic">Verification of production environment integrity and security constants.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Firebase Section */}
          <div className="bg-[#0f0f0f] border border-[#b8860b]/20 rounded-lg overflow-hidden shadow-2xl">
            <div className="p-4 bg-primary/5 border-b border-[#b8860b]/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" />
                <h2 className="font-serif uppercase tracking-widest text-sm text-primary">Firebase Infrastructure</h2>
              </div>
            </div>
            <div className="p-2">
              <h3 className="px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Client Config</h3>
              <StatusItem label="API Key" exists={status?.firebase?.apiKey} />
              <StatusItem label="Project ID" exists={status?.firebase?.projectId} />
              <StatusItem label="Auth Domain" exists={status?.firebase?.authDomain} />
              
              <h3 className="px-3 py-2 mt-4 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Admin SDK (Server)</h3>
              <StatusItem label="Admin Initialized" exists={status?.admin?.initialized} />
              <StatusItem label="Client Email" exists={status?.admin?.clientEmail} />
              <StatusItem label="Private Key" exists={status?.admin?.privateKey} />
            </div>
          </div>

          {/* Stripe Section */}
          <div className="bg-[#0f0f0f] border border-[#b8860b]/20 rounded-lg overflow-hidden shadow-2xl">
            <div className="p-4 bg-primary/5 border-b border-[#b8860b]/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                <h2 className="font-serif uppercase tracking-widest text-sm text-primary">Stripe Payment Engine</h2>
              </div>
              <span className={cn(
                "text-[10px] px-2 py-0.5 rounded border font-bold uppercase",
                status?.stripe?.mode === "live" ? "border-green-500 text-green-500 bg-green-500/10" : "border-yellow-500 text-yellow-500 bg-yellow-500/10"
              )}>
                {status?.stripe?.mode} mode
              </span>
            </div>
            <div className="p-2">
              <StatusItem label="Secret Key" exists={status?.stripe?.secretKey} />
              <StatusItem label="Webhook Secret" exists={status?.stripe?.webhookSecret} />
              <StatusItem label="Publishable Key" exists={status?.stripe?.publishableKey} />
              <StatusItem label="Price ID (Paid Member)" exists={status?.stripe?.priceId} />
            </div>
          </div>

          {/* App Config */}
          <div className="bg-[#0f0f0f] border border-[#b8860b]/20 rounded-lg overflow-hidden shadow-2xl">
            <div className="p-4 bg-primary/5 border-b border-[#b8860b]/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                <h2 className="font-serif uppercase tracking-widest text-sm text-primary">App Environment</h2>
              </div>
            </div>
            <div className="p-2">
              <StatusItem label="NEXT_PUBLIC_APP_URL" exists={status?.app?.url} />
              <StatusItem label="NEXT_PUBLIC_SITE_URL" exists={status?.app?.siteUrl} />
              <div className="p-3 bg-black/40 rounded mt-4 border border-white/5">
                <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Build Version</p>
                <p className="text-xs font-mono text-primary">{status?.build}</p>
              </div>
            </div>
          </div>

          {/* Deployment Summary */}
          <div className="bg-[#0f0f0f] border border-primary/40 rounded-lg overflow-hidden shadow-2xl p-6 flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-primary/20 rounded-full">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-serif text-foreground uppercase">Launch Status</h3>
                <p className="text-sm text-muted-foreground italic">Ready for Red Country Beta</p>
              </div>
            </div>

            <button 
              onClick={checkStatus}
              className="w-full py-4 bg-primary text-black font-serif uppercase tracking-widest text-sm hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              Recalibrate Sensors
            </button>
            
            <p className="mt-4 text-[10px] text-center text-muted-foreground uppercase tracking-widest">
              Last Check: {status?.timestamp ? new Date(status.timestamp).toLocaleTimeString() : "Never"}
            </p>
          </div>
        </div>

        {/* System Settings Integration */}
        <div className="mt-12 p-6 border border-yellow-500/20 bg-yellow-500/5 rounded-lg flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-yellow-500 shrink-0" />
          <div>
            <h4 className="text-yellow-500 font-serif uppercase text-sm mb-1">Production Warning</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ensure all **Live Mode** keys are used. Test mode transactions will not grant library access in the production environment unless explicitly configured for the beta group. Private keys must be correctly formatted to include line breaks.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
