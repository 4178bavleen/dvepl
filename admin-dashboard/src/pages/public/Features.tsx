import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MessageSquare,
  Users,
  Bot,
  Megaphone,
  BarChart3,
  Shield,
  Zap,
  Clock,
  Tag,
  Globe,
  Webhook,
  Smartphone,
  CheckCircle,
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Unified Team Inbox",
    description: "All your WhatsApp conversations in one place. Multiple agents can handle chats simultaneously with smart routing and assignment.",
    highlights: ["Multi-agent support", "Smart chat routing", "Collision detection", "Internal notes"],
  },
  {
    icon: Users,
    title: "Contact Management",
    description: "Organize and segment your contacts with powerful tagging and filtering. Import contacts in bulk and keep your database clean.",
    highlights: ["Bulk import/export", "Custom fields", "Smart segments", "Duplicate detection"],
  },
  {
    icon: Bot,
    title: "Chatbot Builder",
    description: "Create sophisticated chatbots without coding. Build conversation flows with our visual drag-and-drop builder.",
    highlights: ["Visual flow builder", "AI-powered responses", "Multi-language", "Analytics"],
  },
  {
    icon: Megaphone,
    title: "Broadcast Campaigns",
    description: "Send personalized messages to thousands of contacts. Schedule campaigns and track performance in real-time.",
    highlights: ["Template management", "Scheduling", "A/B testing", "Detailed analytics"],
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Get deep insights into your messaging performance. Track response times, agent productivity, and customer satisfaction.",
    highlights: ["Real-time dashboards", "Custom reports", "Agent leaderboards", "Export data"],
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-grade security for your conversations. Role-based access control, audit logs, and compliance features.",
    highlights: ["GDPR compliant", "2FA authentication", "Audit logs", "Data encryption"],
  },
  {
    icon: Zap,
    title: "Automation Rules",
    description: "Automate repetitive tasks with powerful rules. Set up auto-replies, escalations, and workflow triggers.",
    highlights: ["Auto-assignment", "Keyword triggers", "Time-based rules", "Escalation paths"],
  },
  {
    icon: Clock,
    title: "Quick Replies",
    description: "Save time with pre-written responses. Create templates for common questions and share across your team.",
    highlights: ["Rich media support", "Variables", "Team sharing", "Categories"],
  },
  {
    icon: Tag,
    title: "Tags & Labels",
    description: "Organize conversations and contacts with customizable tags. Create workflows based on labels and track trends.",
    highlights: ["Custom colors", "Auto-tagging", "Bulk operations", "Tag analytics"],
  },
  {
    icon: Globe,
    title: "Multi-Language Support",
    description: "Serve customers in their preferred language. Automatic translation and language-based routing.",
    highlights: ["Auto-detect language", "Translation API", "Language routing", "RTL support"],
  },
  {
    icon: Webhook,
    title: "API & Webhooks",
    description: "Integrate with your existing tools. Powerful REST API and webhook events for real-time sync.",
    highlights: ["REST API", "Webhooks", "Rate limiting", "API analytics"],
  },
  {
    icon: Smartphone,
    title: "Mobile App",
    description: "Stay connected on the go. Full-featured mobile apps for iOS and Android with push notifications.",
    highlights: ["iOS & Android", "Push notifications", "Offline mode", "Voice messages"],
  },
];

export default function Features() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Powerful Features</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to manage WhatsApp conversations at scale. Built for teams that care about customer experience.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="card-elevated">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.highlights.map((highlight) => (
                      <li key={highlight} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
