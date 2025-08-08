'use client';

import React from 'react';
import { SignIn as ClerkSignIn, useUser } from '@clerk/nextjs';
import { MessageCircle } from 'lucide-react';
import Link from 'next/link';
import Loader from '@/components/Loader';
import { useRouter } from 'next/navigation';

const SignIn = () => {

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">

                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                            <MessageCircle className="w-7 h-7 text-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
                    <p className="text-gray-600">Sign in to your Qyra account</p>
                </div>

                <div className="flex justify-center">
                    <ClerkSignIn
                        fallbackRedirectUrl={'/dashboard'}
                        signUpUrl="/auth/signup"
                    />
                </div>

                <div className="text-center mt-6">
                    <p className="text-gray-600">
                        Don't have an account?{` `}
                        <Link href="/auth/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                            Sign up for free
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignIn;