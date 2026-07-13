import { Search, Book, MessageCircle, Video, FileText, ExternalLink, ChevronRight, Mail, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";

const categories = [
  { icon: Book, title: "Getting Started", description: "Learn the basics", articles: 12 },
  { icon: MessageCircle, title: "Messaging", description: "Send & receive messages", articles: 8 },
  { icon: Video, title: "Video Tutorials", description: "Watch and learn", articles: 15 },
  { icon: FileText, title: "API Documentation", description: "Developer resources", articles: 24 },
];

const faqs = [
  { question: "How do I connect my WhatsApp Business account?", answer: "To connect your WhatsApp Business account, go to Settings > WhatsApp and follow the verification process. You'll need to have a verified Facebook Business Manager account." },
  { question: "What are the messaging limits?", answer: "Messaging limits depend on your plan and WhatsApp's quality rating. New accounts start with 1,000 messages per day and can increase to 100,000+ as your quality rating improves." },
  { question: "How do I create a broadcast campaign?", answer: "Click on 'Broadcasts' in the sidebar, then click 'Create Broadcast'. Select your audience, compose your message, and schedule the campaign. You can also use templates for faster setup." },
  { question: "Can I import contacts from a CSV file?", answer: "Yes! Go to Contacts > Import and upload your CSV file. Make sure it includes phone numbers in international format (+1234567890). You can also map custom fields during import." },
  { question: "How do chatbots work?", answer: "Chatbots automatically respond to messages based on triggers you define. You can set up keyword triggers, time-based responses, or connect to AI for intelligent conversations." },
];

export default function Help() {
  return (
    <div className="flex min-h-screen bg-background w-full">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Hero Section */}
            <div className="text-center py-8">
              <h1 className="text-3xl font-bold text-foreground mb-3">How can we help you?</h1>
              <p className="text-muted-foreground mb-6">Search our knowledge base or browse categories below</p>
              <div className="max-w-xl mx-auto relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Search for articles, tutorials, FAQs..." 
                  className="pl-12 h-12 text-base bg-card shadow-sm"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((category) => (
                <button key={category.title} className="card-elevated p-5 text-left group">
                  <div className="p-3 rounded-xl bg-primary/10 inline-block mb-3 group-hover:scale-110 transition-transform">
                    <category.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{category.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{category.description}</p>
                  <span className="text-xs text-primary font-medium">{category.articles} articles</span>
                </button>
              ))}
            </div>

            {/* FAQs */}
            <div className="card-elevated p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
              <Accordion type="single" collapsible className="space-y-2">
                {faqs.map((faq, idx) => (
                  <AccordionItem key={idx} value={`item-${idx}`} className="border rounded-xl px-4">
                    <AccordionTrigger className="text-left font-medium hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Popular Articles */}
            <div className="card-elevated p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">Popular Articles</h2>
              <div className="space-y-3">
                {[
                  "Complete guide to WhatsApp Business API",
                  "Best practices for broadcast campaigns",
                  "Setting up your first chatbot",
                  "Understanding message templates",
                  "Importing and managing contacts",
                ].map((article, idx) => (
                  <button key={idx} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <span className="text-foreground group-hover:text-primary transition-colors">{article}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            {/* Contact Support */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card-elevated p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <MessageCircle className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Live Chat</h3>
                    <p className="text-sm text-muted-foreground">Chat with our support team</p>
                  </div>
                </div>
                <Button className="w-full gradient-whatsapp text-primary-foreground">Start Chat</Button>
              </div>
              <div className="card-elevated p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-info/10">
                    <Mail className="h-6 w-6 text-info" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Email Support</h3>
                    <p className="text-sm text-muted-foreground">support@chatflow.com</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">Send Email</Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
