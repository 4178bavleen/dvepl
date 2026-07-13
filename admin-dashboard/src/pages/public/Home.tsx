import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  MessageSquare,
  Users,
  Zap,
  BarChart3,
  Shield,
  Globe,
  CheckCircle,
  ArrowRight,
  Play,
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Unified Inbox",
    description: "Manage all WhatsApp conversations from one powerful dashboard.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Assign chats to team members with role-based access control.",
  },
  {
    icon: Zap,
    title: "Automation",
    description: "Build chatbots and auto-replies without any coding.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Track performance with detailed insights and reports.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-grade encryption and compliance built-in.",
  },
  {
    icon: Globe,
    title: "Multi-Language",
    description: "Support customers in their preferred language.",
  },
];

const stats = [
  { value: "10M+", label: "Messages Sent" },
  { value: "50K+", label: "Active Users" },
  { value: "99.9%", label: "Uptime" },
  { value: "150+", label: "Countries" },
];

const testimonials = [
  {
    quote: "ChatFlow transformed how we communicate with customers. Response times dropped by 80%.",
    author: "Sarah Chen",
    role: "Head of Support",
    company: "TechCorp",
  },
  {
    quote: "The automation features alone saved us 40 hours per week. Incredible ROI.",
    author: "Michael Brown",
    role: "CEO",
    company: "GrowthStartup",
  },
  {
    quote: "Best WhatsApp Business platform we've used. The team inbox is a game-changer.",
    author: "Priya Patel",
    role: "Operations Manager",
    company: "RetailPro",
  },
];

export default function Home() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-whatsapp-light" />
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              Now with AI-powered automation
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              The Complete{" "}
              <span className="text-gradient">WhatsApp Business</span>
              {" "}Platform
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Engage customers, automate conversations, and grow your business with the most powerful WhatsApp Business API platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/signup">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/features">
                  <Play className="mr-2 h-4 w-4" />
                  Watch Demo
                </Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required · 14-day free trial
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-card border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Scale
            </h2>
            <p className="text-muted-foreground text-lg">
              Powerful features designed for businesses of all sizes.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="card-elevated">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button variant="outline" size="lg" asChild>
              <Link to="/features">
                View All Features
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Loved by Businesses Worldwide
            </h2>
            <p className="text-muted-foreground text-lg">
              See what our customers have to say about ChatFlow.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.author} className="card-elevated">
                <CardContent className="p-6">
                  <p className="text-foreground mb-4">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {testimonial.author.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{testimonial.author}</p>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.role}, {testimonial.company}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-primary rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of businesses using ChatFlow to transform their customer communication.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/signup">Start Free Trial</Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/contact">Talk to Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
