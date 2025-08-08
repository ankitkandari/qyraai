'use client';
import React from 'react';
import {
  MessageCircle,
  Zap,
  Shield,
  BarChart3,
  Sparkles,
  Check,
  Star,
  Menu,
  ArrowRight,
  Users,
  Globe,
  HelpCircle,
  ChartBar
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { SignedIn, SignedOut } from '@clerk/nextjs';

const Homepage = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">

      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href={"/"} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900">
                Qyra
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Pricing
              </a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Reviews
              </a>

              <SignedIn>
                <Link href={"/dashboard"} className="bg-blue-600 hover:bg-blue-700 text-white font-medium cursor-pointer px-4 py-2 rounded-xl">
                  Dashboard
                </Link>
              </SignedIn>

              <SignedOut>
                <Link href={"/auth/login"} className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer">
                  Sign In
                </Link>
                <Link href={"/auth/signup"} className="bg-blue-600 hover:bg-blue-700 text-white font-medium cursor-pointer px-4 py-2 rounded-xl">
                  Start Free Trial
                </Link>
              </SignedOut>

            </div>
            <Button variant="ghost" className="md:hidden p-2 text-gray-600 hover:text-gray-900">
              {/* <Menu className="w-6 h-6" /> */}

              <SignedIn>
                <Link href={"/dashboard"} className="bg-blue-600 hover:bg-blue-700 text-white font-medium cursor-pointer px-4 py-2 rounded-xl">
                  Dashboard
                </Link>
              </SignedIn>

              <SignedOut>
                <Link href={"/auth/login"} className="bg-blue-600 hover:bg-blue-700 text-white font-medium cursor-pointer px-4 py-2 rounded-xl">
                  Sign In
                </Link>
              </SignedOut>

            </Button>
          </div>
        </div>
      </nav>


      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="text-center max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              Now with Gemini Integration
            </div>
            <h1 className="text-4xl lg:text-7xl font-bold text-gray-900 leading-tight mb-8">
              Transform Your Business with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                AI-Powered
              </span>{' '}
              Conversations
            </h1>
            <p className="text-lg lg:text-2xl text-gray-600 leading-relaxed max-w-4xl mx-auto mb-12">
              Deploy intelligent chatbots that understand context, learn from interactions,
              and deliver exceptional customer experiences 24/7.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href={"/signup"} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-lg">
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              {/* <Button variant="outline" className="px-8 py-4 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-xl transition-all duration-200 text-lg">
                Watch Demo
              </Button> */}
            </div>
            {/* <p className="text-gray-500">
              No credit card required • Free forever • Cancel anytime
            </p> */}
          </div>
        </div>
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
        </div>
      </section>


      <section id="features" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Powerful Features for Modern Businesses
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to create, deploy, and manage intelligent AI assistants
              that grow with your business.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Sparkles,
                title: "Advanced AI Models",
                description: "Powered by GPT-4 and custom-trained models for your specific industry and use cases.",
                color: "blue"
              },
              {
                icon: Zap,
                title: "Lightning Fast Responses",
                description: "Sub-second response times with global CDN distribution and optimized AI inference.",
                color: "green"
              },
              {
                icon: Shield,
                title: "Enterprise Security",
                description: "SOC 2 compliant with end-to-end encryption, GDPR compliance, and enterprise-grade security.",
                color: "purple"
              },
              {
                icon: BarChart3,
                title: "Advanced Analytics",
                description: "Comprehensive insights into conversations, user satisfaction, and performance metrics.",
                color: "orange"
              },
              {
                icon: Globe,
                title: "Omnichannel Support",
                description: "Deploy across web, mobile, Slack, Teams, WhatsApp, and 50+ other platforms.",
                color: "indigo"
              },
              {
                icon: Users,
                title: "No-Code Builder",
                description: "Visual flow builder with drag-and-drop interface. No coding required.",
                color: "pink"
              }
            ].map((feature, index) => (
              <Card key={index} className="hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <div className={`w-14 h-14 bg-${feature.color}-100 rounded-xl flex items-center justify-center mb-4`}>
                    <feature.icon className={`w-7 h-7 text-${feature.color}-600`} />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>


      <section id="pricing" className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the perfect plan for your business needs
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">Starter</CardTitle>
                <CardDescription>Perfect for small businesses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-8">
                  <span className="text-5xl font-bold text-gray-900">$0</span>
                  <span className="text-gray-600 ml-2">/month</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {[
                    "1,000 conversations/month",
                    "Basic AI models",
                    "Email support",
                    "Basic analytics",
                    "Web integration"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full py-3 px-6">
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>

            {/* Professional Plan */}
            <Card className="border-2 border-blue-200 relative hover:shadow-xl transition-shadow duration-300">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Professional</CardTitle>
                <CardDescription>For growing companies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-8">
                  <span className="text-5xl font-bold text-gray-900">$9</span>
                  <span className="text-gray-600 ml-2">/month</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {[
                    "10,000 conversations/month",
                    "Advanced AI models",
                    "Priority support",
                    "Advanced analytics",
                    "Custom integrations",
                    "Multi-channel deployment"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">Enterprise</CardTitle>
                <CardDescription>For large organizations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-8">
                  <span className="text-5xl font-bold text-gray-900">Custom</span>
                  <span className="text-gray-600 ml-2">pricing</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {[
                    "Unlimited conversations",
                    "Custom AI models",
                    "24/7 dedicated support",
                    "White-label solution",
                    "On-premise deployment",
                    "SLA guarantees"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full py-3 px-6">
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-gray-600">
              See what our customers are saying about ChatAI Pro
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "CTO, TechCorp",
                image: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200",
                content: "ChatAI Pro transformed our customer support. We've seen a 70% reduction in response time and 95% customer satisfaction."
              },
              {
                name: "Michael Chen",
                role: "VP Sales, GrowthLab",
                image: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200",
                content: "The no-code builder made it incredibly easy to deploy. Our sales team loves the lead qualification features."
              },
              {
                name: "Emily Rodriguez",
                role: "Director IT, FinanceFirst",
                image: "https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=200",
                content: "Enterprise-grade security and compliance made this an easy choice. The ROI has been phenomenal."
              }
            ].map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-6 text-lg">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-4">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-gray-600 text-sm">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 max-w-4xl mx-auto">
            Ready to Transform Your Customer Experience?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-3xl mx-auto">
            Join thousands of businesses already using ChatAI Pro to deliver
            exceptional customer experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={"/auth/signup"} className="px-8 py-4 bg-white text-blue-600 hover:bg-gray-100 font-semibold rounded-xl transition-colors shadow-lg text-lg">
              Start Your Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">
                  Qyra
                </span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Empowering businesses with intelligent AI assistants that deliver
                exceptional customer experiences.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-6">Product</h4>
              <ul className="space-y-3">
                {["Features", "Pricing", "Integrations", "API Docs"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-6">Company</h4>
              <ul className="space-y-3">
                {["About", "Blog", "Careers", "Contact"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-6">Support</h4>
              <ul className="space-y-3">
                {["Help Center", "Community", "Status", "Security"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-400">
                © 2025 QyraAI. All rights reserved.
              </p>
              <div className="flex gap-6">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
