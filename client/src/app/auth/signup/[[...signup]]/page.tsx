"use client";

import React, { useEffect, useState } from 'react';
import { SignUp as ClerkSignUp } from '@clerk/nextjs';
import { useUser } from '@clerk/nextjs';
import { MessageCircle } from 'lucide-react';
import Link from 'next/link';

const SignUp = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                            <MessageCircle className="w-7 h-7 text-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h1>
                    <p className="text-gray-600">Get started with Qyra</p>
                </div>

                <div className="flex justify-center">
                    <ClerkSignUp
                        fallbackRedirectUrl={'/onboarding'}
                        signInUrl="/auth/login"
                    />
                </div>

                <div className="text-center mt-6">
                    <p className="text-gray-600">
                        Already have an account?{' '}
                        <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignUp;