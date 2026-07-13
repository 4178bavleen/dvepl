import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CheckCircle, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    description: "Perfect for small businesses just getting started.",
    monthlyPrice: 29,
    yearlyPrice: 24,
    features: [
      { name: "1,000 messages/month", included: true },
      { name: "2 team members", included: true },
      { name: "Basic inbox", included: true },
      { name: "Contact management", included: true },
      { name: "Quick replies", included: true },
      { name: "Email support", included: true },
      { name: "Chatbot builder", included: false },
      { name: "Broadcast campaigns", included: false },
      { name: "API access", included: false },
      { name: "Custom integrations", included: false },
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Professional",
    description: "For growing teams that need more power.",
    monthlyPrice: 99,
    yearlyPrice: 79,
    features: [
      { name: "10,000 messages/month", included: true },
      { name: "10 team members", included: true },
      { name: "Advanced inbox", included: true },
      { name: "Contact management", included: true },
      { name: "Quick replies", included: true },
      { name: "Priority support", included: true },
      { name: "Chatbot builder", included: true },
      { name: "Broadcast campaigns", included: true },
      { name: "API access", included: false },
      { name: "Custom integrations", included: false },
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "For large organizations with advanced needs.",
    monthlyPrice: 299,
    yearlyPrice: 249,
    features: [
      { name: "Unlimited messages", included: true },
      { name: "Unlimited team members", included: true },
      { name: "Advanced inbox", included: true },
      { name: "Contact management", included: true },
      { name: "Quick replies", included: true },
      { name: "24/7 support", included: true },
      { name: "Chatbot builder", included: true },
      { name: "Broadcast campaigns", included: true },
      { name: "API access", included: true },
      { name: "Custom integrations", included: true },
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Choose the plan that fits your business. No hidden fees, no surprises.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Label htmlFor="billing-toggle" className={!isYearly ? "font-semibold" : "text-muted-foreground"}>
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <Label htmlFor="billing-toggle" className={isYearly ? "font-semibold" : "text-muted-foreground"}>
              Yearly
              <Badge variant="secondary" className="ml-2">Save 20%</Badge>
            </Label>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`card-elevated relative ${
                  plan.popular ? "border-primary shadow-lg" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-6">
                    <span className="text-4xl font-bold">
                      ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                    {isYearly && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Billed annually
                      </p>
                    )}
                  </div>
                  <Button
                    className="w-full mb-6"
                    variant={plan.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link to="/signup">{plan.cta}</Link>
                  </Button>
                  <ul className="space-y-3 text-left">
                    {plan.features.map((feature) => (
                      <li key={feature.name} className="flex items-center gap-2 text-sm">
                        {feature.included ? (
                          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className={!feature.included ? "text-muted-foreground" : ""}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Can I change plans later?</h3>
              <p className="text-muted-foreground">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What happens if I exceed my message limit?</h3>
              <p className="text-muted-foreground">
                We'll notify you when you're close to your limit. You can upgrade your plan or pay for additional messages.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-muted-foreground">
                Yes! All plans come with a 14-day free trial. No credit card required to get started.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
              <p className="text-muted-foreground">
                We offer a 30-day money-back guarantee on all paid plans. Contact support for assistance.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
