import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  HeartPulse,
  GraduationCap,
  Plane,
  Building2,
  Utensils,
  ArrowRight,
} from "lucide-react";

const useCases = [
  {
    icon: ShoppingCart,
    title: "E-Commerce",
    description: "Send order updates, abandoned cart reminders, and personalized offers to boost sales.",
    benefits: [
      "Order confirmations and tracking",
      "Abandoned cart recovery",
      "Personalized product recommendations",
      "Customer support automation",
    ],
    stats: "35% increase in cart recovery",
  },
  {
    icon: HeartPulse,
    title: "Healthcare",
    description: "Appointment reminders, health tips, and patient communication made simple and secure.",
    benefits: [
      "Appointment scheduling and reminders",
      "Prescription notifications",
      "Health tips and wellness campaigns",
      "Secure patient communication",
    ],
    stats: "60% reduction in no-shows",
  },
  {
    icon: GraduationCap,
    title: "Education",
    description: "Engage students and parents with updates, notifications, and support channels.",
    benefits: [
      "Class schedules and reminders",
      "Assignment notifications",
      "Parent-teacher communication",
      "Admission inquiries automation",
    ],
    stats: "50% faster response times",
  },
  {
    icon: Plane,
    title: "Travel & Hospitality",
    description: "Booking confirmations, itinerary updates, and concierge services on WhatsApp.",
    benefits: [
      "Booking confirmations",
      "Flight and hotel updates",
      "Concierge services",
      "Feedback collection",
    ],
    stats: "40% higher guest satisfaction",
  },
  {
    icon: Building2,
    title: "Real Estate",
    description: "Property listings, virtual tours, and lead qualification through WhatsApp.",
    benefits: [
      "Property inquiries handling",
      "Virtual tour scheduling",
      "Document sharing",
      "Lead qualification",
    ],
    stats: "3x more qualified leads",
  },
  {
    icon: Utensils,
    title: "Restaurants & Food",
    description: "Order taking, reservations, and loyalty programs on the channel customers love.",
    benefits: [
      "Order placement and tracking",
      "Table reservations",
      "Menu sharing",
      "Loyalty program updates",
    ],
    stats: "25% increase in repeat orders",
  },
];

export default function UseCases() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Use Cases</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how businesses across industries are using ChatFlow to transform customer communication.
          </p>
        </div>
      </section>

      {/* Use Cases Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((useCase) => (
              <Card key={useCase.title} className="card-elevated">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                    <useCase.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{useCase.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{useCase.description}</p>
                  <ul className="space-y-2 mb-4">
                    {useCase.benefits.map((benefit) => (
                      <li key={benefit} className="text-sm flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                  <div className="px-3 py-2 bg-primary/10 rounded-lg">
                    <p className="text-sm font-medium text-primary">{useCase.stats}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to transform your business?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of businesses using ChatFlow to deliver exceptional customer experiences.
          </p>
          <Button size="lg" asChild>
            <Link to="/signup">
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
