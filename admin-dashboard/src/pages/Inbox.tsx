import { useState } from "react";
import { Search, Filter, MoreVertical, Send, Paperclip, Smile, Phone, Video, Check, CheckCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";

const conversations = [
  { id: 1, name: "Sarah Johnson", message: "Thanks for the quick response!", time: "2m ago", unread: 2, online: true },
  { id: 2, name: "Michael Chen", message: "Can you share the product catalog?", time: "15m ago", unread: 0, online: true },
  { id: 3, name: "Emma Wilson", message: "Hi! I'd like to know more about your services", time: "1h ago", unread: 1, online: false },
  { id: 4, name: "David Brown", message: "Perfect, I'll wait for the delivery update", time: "2h ago", unread: 0, online: false },
  { id: 5, name: "Lisa Anderson", message: "Is this available in blue color?", time: "3h ago", unread: 0, online: true },
  { id: 6, name: "James Taylor", message: "Thank you for your help!", time: "5h ago", unread: 0, online: false },
];

const messages = [
  { id: 1, text: "Hi! I saw your product on Instagram and I'm interested.", sender: "customer", time: "10:30 AM" },
  { id: 2, text: "Hello Sarah! Thank you for reaching out. Which product caught your eye?", sender: "agent", time: "10:32 AM", status: "read" },
  { id: 3, text: "The wireless earbuds! Are they still available?", sender: "customer", time: "10:33 AM" },
  { id: 4, text: "Yes, they are! We have them in Black, White, and Rose Gold. Would you like me to send you more details?", sender: "agent", time: "10:35 AM", status: "read" },
  { id: 5, text: "Rose Gold sounds perfect! What's the price?", sender: "customer", time: "10:36 AM" },
  { id: 6, text: "The Rose Gold variant is $79.99. We're also running a 15% discount for first-time customers! Would you like to proceed with the order?", sender: "agent", time: "10:38 AM", status: "delivered" },
  { id: 7, text: "Thanks for the quick response! I'll proceed with the order.", sender: "customer", time: "10:40 AM" },
];

export default function Inbox() {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0]);
  const [messageInput, setMessageInput] = useState("");

  return (
    <div className="flex min-h-screen bg-background w-full">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <main className="flex-1 flex overflow-hidden">
          {/* Conversations List */}
          <div className="w-80 border-r border-border flex flex-col bg-card">
            <div className="p-4 border-b border-border">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search conversations..." className="pl-10 bg-muted/50" />
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1">All</Button>
                <Button variant="ghost" size="sm" className="flex-1">Unread</Button>
                <Button variant="ghost" size="sm" className="flex-1">Assigned</Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 text-left transition-colors border-b border-border/50",
                    selectedConversation.id === conv.id ? "bg-primary/5" : "hover:bg-muted/50"
                  )}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {conv.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    {conv.online && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 bg-success rounded-full border-2 border-card" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-foreground truncate">{conv.name}</span>
                      <span className="text-xs text-muted-foreground">{conv.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{conv.message}</p>
                  </div>
                  {conv.unread > 0 && (
                    <Badge className="bg-primary text-primary-foreground h-5 min-w-5 rounded-full text-xs">
                      {conv.unread}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="h-16 px-4 border-b border-border flex items-center justify-between bg-card">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {selectedConversation.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-foreground">{selectedConversation.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedConversation.online ? "Online" : "Last seen 2h ago"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon"><Phone className="h-5 w-5" /></Button>
                <Button variant="ghost" size="icon"><Video className="h-5 w-5" /></Button>
                <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-auto p-4 space-y-4 bg-muted/20">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    msg.sender === "agent" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-md px-4 py-2.5 rounded-2xl",
                      msg.sender === "agent"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-card text-foreground rounded-bl-md shadow-sm"
                    )}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <div className={cn(
                      "flex items-center gap-1 mt-1",
                      msg.sender === "agent" ? "justify-end" : "justify-start"
                    )}>
                      <span className={cn(
                        "text-xs",
                        msg.sender === "agent" ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}>
                        {msg.time}
                      </span>
                      {msg.sender === "agent" && msg.status && (
                        msg.status === "read" 
                          ? <CheckCheck className="h-3.5 w-3.5 text-primary-foreground" />
                          : <Check className="h-3.5 w-3.5 text-primary-foreground/70" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-border bg-card">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon"><Paperclip className="h-5 w-5" /></Button>
                <Input
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1"
                />
                <Button variant="ghost" size="icon"><Smile className="h-5 w-5" /></Button>
                <Button className="gradient-whatsapp text-primary-foreground">
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
