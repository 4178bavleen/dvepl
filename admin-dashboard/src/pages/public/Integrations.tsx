import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, ExternalLink } from "lucide-react";

const integrations = [
  {
    name: "Shopify",
    category: "E-Commerce",
    description: "Sync orders, send notifications, and automate customer support.",
    logo: "🛍️",
  },
  {
    name: "WooCommerce",
    category: "E-Commerce",
    description: "Connect your WordPress store for seamless order management.",
    logo: "🛒",
  },
  {
    name: "Salesforce",
    category: "CRM",
    description: "Sync contacts and conversations with your Salesforce account.",
    logo: "☁️",
  },
  {
    name: "HubSpot",
    category: "CRM",
    description: "Integrate WhatsApp conversations with your HubSpot CRM.",
    logo: "🔶",
  },
  {
    name: "Zoho",
    category: "CRM",
    description: "Connect with Zoho CRM for unified customer management.",
    logo: "📊",
  },
  {
    name: "Zapier",
    category: "Automation",
    description: "Connect ChatFlow to 5,000+ apps with no-code automation.",
    logo: "⚡",
  },
  {
    name: "Make (Integromat)",
    category: "Automation",
    description: "Build complex workflows with visual automation builder.",
    logo: "🔄",
  },
  {
    name: "Stripe",
    category: "Payments",
    description: "Accept payments and send receipts via WhatsApp.",
    logo: "💳",
  },
  {
    name: "Razorpay",
    category: "Payments",
    description: "Integrate payment links and order confirmations.",
    logo: "💰",
  },
  {
    name: "Google Sheets",
    category: "Productivity",
    description: "Export data and sync contacts with Google Sheets.",
    logo: "📗",
  },
  {
    name: "Slack",
    category: "Productivity",
    description: "Get notifications and manage chats from Slack.",
    logo: "💬",
  },
  {
    name: "Freshdesk",
    category: "Support",
    description: "Create tickets from WhatsApp conversations automatically.",
    logo: "🎫",
  },
];

const categories = [...new Set(integrations.map((i) => i.category))];

export default function Integrations() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Integrations</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect ChatFlow with your favorite tools. Sync data, automate workflows, and supercharge your productivity.
          </p>
        </div>
      </section>

      {/* Integrations by Category */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {categories.map((category) => (
            <div key={category} className="mb-12">
              <h2 className="text-2xl font-bold mb-6">{category}</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {integrations
                  .filter((i) => i.category === category)
                  .map((integration) => (
                    <Card key={integration.name} className="card-elevated">
                      <CardContent className="p-4 flex items-start gap-4">
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-2xl flex-shrink-0">
                          {integration.logo}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{integration.name}</h3>
                          <p className="text-sm text-muted-foreground">{integration.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* API Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Build Custom Integrations</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Use our powerful REST API and webhooks to build custom integrations tailored to your needs.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/signup">
                Get API Key
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline">
              <ExternalLink className="mr-2 h-4 w-4" />
              View API Docs
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
