import { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/providers/trpc";
import { useClientAuth } from "@/providers/ClientAuthProvider";
import { Envelope, Lock, ArrowRight, SignIn } from "@phosphor-icons/react";

function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);

  return url.toString();
}

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { refetch } = useClientAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginMutation = trpc.clientAuth.login.useMutation({
    onSuccess: () => {
      refetch();
      navigate("/admin", { replace: true });
    },
    onError: (err) => {
      setError(err.message || t("login.invalidCredentials"));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError(t("login.pleaseEnter"));
      return;
    }
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-sand-light flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-deep-navy mb-2">ReserVamos</h1>
          <p className="font-body text-sm text-warm-gray">{t("login.subtitle")}</p>
        </div>

        <Card className="border border-[rgba(0,0,0,0.06)] shadow-sm">
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-display text-xl text-deep-navy">{t("login.signIn")}</CardTitle>
            <p className="font-body text-xs text-warm-gray mt-1">
              {t("login.description")}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-semibold text-deep-navy">
                  <Envelope size={14} /> {t("login.email")}
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("login.emailPlaceholder")}
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-semibold text-deep-navy">
                  <Lock size={14} /> {t("login.password")}
                </Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("login.passwordPlaceholder")}
                  className="h-10"
                />
              </div>

              {error && <p className="text-xs text-[#B23A2F] text-center">{error}</p>}

              <Button
                type="submit"
                className="w-full h-10 bg-[#C75E3A] hover:bg-[#a84d2f] text-white"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? t("login.signingIn") : t("login.signIn")}
                <SignIn size={16} className="ml-1.5" />
              </Button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[rgba(0,0,0,0.08)]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-warm-gray">{t("login.or")}</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full h-10"
              onClick={() => {
                window.location.href = getOAuthUrl();
              }}
            >
              {t("login.signInWithKimi")}
            </Button>

            <p className="text-center text-xs text-warm-gray mt-4">
              {t("login.noAccount")}{" "}
              <button
                onClick={() => navigate("/register")}
                className="text-[#C75E3A] font-semibold hover:underline"
              >
                {t("login.register")}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
