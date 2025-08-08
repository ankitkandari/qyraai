"use client";

import { useState, useEffect } from "react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingFormData, USE_CASE_OPTIONS } from "@/types";
import { useRouter } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MessageCircle } from "lucide-react";
import Loader from "@/components/Loader";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded: userLoaded } = useUser();
  const { isLoaded: authLoaded } = useAuth();
  const { userStatus, getUserStatus, completeOnboarding, loading, isOnboarded } = useOnboarding();
  const [formData, setFormData] = useState<OnboardingFormData>({
    company_name: "",
    website: "",
    use_case: "customer_support",
  });

  useEffect(() => {
    if (userLoaded && user) {
      getUserStatus();
    }
  }, [userLoaded, user?.id]);

  useEffect(() => {
    if (isOnboarded) {
      router.push("/dashboard");
    }
  }, [isOnboarded, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prevData) => ({
      ...prevData,
      use_case: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await completeOnboarding(formData);
  };


  if (loading.isLoading || !authLoaded || !userLoaded) {
    return <Loader />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="space-y-1">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Qyra</h1>
              <p className="text-gray-600">Let's get you set up with a few quick details to personalize your experience.</p>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="company_name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Company Name
                </label>
                <Input
                  id="company_name"
                  name="company_name"
                  type="text"
                  placeholder="Enter your company name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="website" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Website
                </label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  placeholder="https://yourcompany.com"
                  value={formData.website}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Primary Use Case
                </label>
                <Select value={formData.use_case} onValueChange={handleSelectChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select your primary use case" />
                  </SelectTrigger>
                  <SelectContent>
                    {USE_CASE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {loading.error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                  {loading.error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full cursor-pointer"
                disabled={loading.isLoading}
              >
                {loading.isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
