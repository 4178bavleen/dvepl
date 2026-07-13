import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Target, Eye, Heart, Users } from "lucide-react";

const team = [
  { name: "Alex Chen", role: "CEO & Co-founder", avatar: "AC" },
  { name: "Sarah Johnson", role: "CTO & Co-founder", avatar: "SJ" },
  { name: "Michael Brown", role: "Head of Product", avatar: "MB" },
  { name: "Priya Patel", role: "Head of Customer Success", avatar: "PP" },
  { name: "David Kim", role: "Head of Engineering", avatar: "DK" },
  { name: "Emma Wilson", role: "Head of Marketing", avatar: "EW" },
];

const values = [
  {
    icon: Target,
    title: "Customer First",
    description: "Every decision we make starts with how it will benefit our customers.",
  },
  {
    icon: Eye,
    title: "Transparency",
    description: "We believe in open communication with our team, customers, and partners.",
  },
  {
    icon: Heart,
    title: "Passion",
    description: "We're passionate about building products that make a real difference.",
  },
  {
    icon: Users,
    title: "Collaboration",
    description: "Great things happen when talented people work together.",
  },
];

const milestones = [
  { year: "2020", event: "ChatFlow founded" },
  { year: "2021", event: "Launched public beta" },
  { year: "2022", event: "Raised Series A funding" },
  { year: "2023", event: "Reached 50,000 customers" },
  { year: "2024", event: "Expanded to 150+ countries" },
];

export default function About() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About ChatFlow</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We're on a mission to help businesses build meaningful relationships with their customers through conversational messaging.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <div className="prose prose-lg text-muted-foreground">
              <p className="mb-4">
                ChatFlow was born from a simple observation: businesses were struggling to keep up with customer expectations in the messaging age. Email response times were too slow, phone calls were inconvenient, and live chat was often overwhelming to manage.
              </p>
              <p className="mb-4">
                We saw an opportunity to build a platform that would help businesses meet customers where they already are — on WhatsApp, the world's most popular messaging app with over 2 billion users.
              </p>
              <p>
                Today, ChatFlow powers millions of conversations for over 50,000 businesses worldwide, helping them deliver faster, more personal customer experiences at scale.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <Card key={value.title} className="card-elevated text-center">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Journey</h2>
          <div className="max-w-2xl mx-auto">
            <div className="relative border-l border-primary/20 pl-8 space-y-8">
              {milestones.map((milestone, index) => (
                <div key={milestone.year} className="relative">
                  <div className="absolute -left-[41px] h-4 w-4 rounded-full bg-primary" />
                  <div className="text-sm text-primary font-semibold">{milestone.year}</div>
                  <div className="text-lg">{milestone.event}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Leadership Team</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {team.map((member) => (
              <div key={member.name} className="text-center">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-semibold text-primary">{member.avatar}</span>
                </div>
                <h3 className="font-semibold">{member.name}</h3>
                <p className="text-sm text-muted-foreground">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Join Our Journey</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            We're always looking for talented people to join our team.
          </p>
          <Button size="lg" asChild>
            <Link to="/contact">
              Get in Touch
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
