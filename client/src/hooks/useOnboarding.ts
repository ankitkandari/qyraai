import { useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useApi } from "@/lib/api";
import {
  UserStatus,
  OnboardingData,
  OnboardingResponse,
  LoadingState,
} from "@/types";

export interface UseOnboardingReturn {
  userStatus: UserStatus | null;
  loading: LoadingState;
  getUserStatus: () => Promise<void>;
  completeOnboarding: (
    data: Omit<OnboardingData, "user_id">
  ) => Promise<OnboardingResponse | null>;
  isOnboarded: boolean;
}

export const useOnboarding = (): UseOnboardingReturn => {
  const { user } = useUser();
  const api = useApi();
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState<LoadingState>({
    isLoading: false,
    error: null,
  });

  const getUserStatus = useCallback(async () => {
    if (!user) return;

    setLoading({ isLoading: true, error: null });

    try {
      const status = await api.getStatus();
      setUserStatus(status);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Failed to get user status";
      setLoading({ isLoading: false, error: errorMessage });
      console.error("Failed to get user status:", error);
    } finally {
      setLoading((prev) => ({ ...prev, isLoading: false }));
    }
  }, [user?.id]);

  const completeOnboarding = useCallback(
    async (
      data: Omit<OnboardingData, "user_id">
    ): Promise<OnboardingResponse | null> => {
      if (!user?.id) {
        setLoading({ isLoading: false, error: "User not authenticated" });
        return null;
      }

      setLoading({ isLoading: true, error: null });

      try {
        const onboardingData: OnboardingData = {
          user_id: user.id,
          ...data,
        };

        const response = await api.completeOnboarding(onboardingData);

        if (response?.success && userStatus) {
          setUserStatus({
            ...userStatus,
            onboarded: true,
          });
        }

        return response;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.detail ||
          error.message ||
          "Failed to complete onboarding";
        setLoading({ isLoading: false, error: errorMessage });
        console.error("Failed to complete onboarding:", error);
        return null;
      } finally {
        setLoading((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [user?.id, userStatus]
  );

  const isOnboarded = userStatus?.onboarded ?? false;

  return {
    userStatus,
    loading,
    getUserStatus,
    completeOnboarding,
    isOnboarded,
  };
};
