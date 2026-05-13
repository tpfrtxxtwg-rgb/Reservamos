import { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/providers/trpc";
import { useClientAuth } from "@/providers/ClientAuthProvider";
import { Building, User, Envelope, Lock, ArrowRight, CheckCircle } from "@phosphor-icons/react";

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { refetch } = useClientAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({
    companyName: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const registerMutation = trpc.clientAuth.register.useMutation({
    onSuccess: () => {
      refetch();
      setStep(2);
    },
    onError: (err) => {
      setErrors({ general: err.message });
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (form.companyName.length < 2) newErrors.companyName = "Company name is required";
    if (form.name.length < 2) newErrors.name = "Full name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Valid email is required";
    if (form.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    registerMutation.mutate({
      companyName: form.companyName,
      name: form.name,
      email: form.email,
      password: form.password,
    });
  };

  return (
    <div className="min-h-screen bg-sand-light flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-deep-navy mb-2">ReserVamos</h1>
          <p className="font-body text-sm text-warm-gray">Private Transportation Booking Engine</p>
        </div>

        {step === 1 ? (
          <Card className="border border-[rgba(0,0,0,0.06)] shadow-sm">
            <CardHeader className="text-center pb-2">
              <CardTitle className="font-display text-xl text-deep-navy">
                Create Your Account
              </CardTitle>
              <p className="font-body text-xs text-warm-gray mt-1">
                Set up your transportation company in minutes
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold text-deep-navy">
                    <Building size={14} /> Company Name
                  </Label>
                  <Input
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    placeholder="e.g. Cancun Luxury Transfers"
                    className="h-10"
                  />
                  {errors.companyName && <p className="text-xs text-[#B23A2F]">{errors.companyName}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold text-deep-navy">
                    <User size={14} /> Your Full Name
                  </Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Juan Perez"
                    className="h-10"
                  />
                  {errors.name && <p className="text-xs text-[#B23A2F]">{errors.name}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold text-deep-navy">
                    <Envelope size={14} /> Email
                  </Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="admin@yourcompany.com"
                    className="h-10"
                  />
                  {errors.email && <p className="text-xs text-[#B23A2F]">{errors.email}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold text-deep-navy">
                    <Lock size={14} /> Password
                  </Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Min. 6 characters"
                    className="h-10"
                  />
                  {errors.password && <p className="text-xs text-[#B23A2F]">{errors.password}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-deep-navy">Confirm Password</Label>
                  <Input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="Repeat password"
                    className="h-10"
                  />
                  {errors.confirmPassword && <p className="text-xs text-[#B23A2F]">{errors.confirmPassword}</p>}
                </div>

                {errors.general && (
                  <p className="text-xs text-[#B23A2F] text-center">{errors.general}</p>
                )}

                <Button
                  type="submit"
                  className="w-full h-10 bg-[#C75E3A] hover:bg-[#a84d2f] text-white"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? "Creating account..." : "Create Account"}
                  <ArrowRight size={16} className="ml-1.5" />
                </Button>
              </form>

              <p className="text-center text-xs text-warm-gray mt-4">
                Already have an account?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-[#C75E3A] font-semibold hover:underline"
                >
                  Sign in
                </button>
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-[rgba(0,0,0,0.06)] shadow-sm">
            <CardContent className="pt-8 pb-8 text-center">
              <CheckCircle size={48} className="mx-auto text-[#2D6A4F] mb-4" weight="fill" />
              <h2 className="font-display text-xl text-deep-navy mb-2">Welcome to ReserVamos!</h2>
              <p className="font-body text-sm text-warm-gray mb-6">
                Your account has been created successfully. You can now configure your services, vehicles, and pricing from your admin panel.
              </p>
              <Button
                onClick={() => navigate("/admin")}
                className="bg-[#C75E3A] hover:bg-[#a84d2f] text-white"
              >
                Go to Admin Panel
                <ArrowRight size={16} className="ml-1.5" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
