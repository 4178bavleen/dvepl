import { useState } from "react";
import { Search, Filter, Plus, MoreVertical, Mail, Phone, Tag, Download, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";

const contacts = [
  { id: 1, name: "Sarah Johnson", email: "sarah@email.com", phone: "+1 234 567 8901", tags: ["VIP", "Active"], lastMessage: "2 hours ago" },
  { id: 2, name: "Michael Chen", email: "michael@email.com", phone: "+1 234 567 8902", tags: ["New"], lastMessage: "1 day ago" },
  { id: 3, name: "Emma Wilson", email: "emma@email.com", phone: "+1 234 567 8903", tags: ["Active"], lastMessage: "3 days ago" },
  { id: 4, name: "David Brown", email: "david@email.com", phone: "+1 234 567 8904", tags: ["VIP"], lastMessage: "1 week ago" },
  { id: 5, name: "Lisa Anderson", email: "lisa@email.com", phone: "+1 234 567 8905", tags: ["Inactive"], lastMessage: "2 weeks ago" },
  { id: 6, name: "James Taylor", email: "james@email.com", phone: "+1 234 567 8906", tags: ["Active", "VIP"], lastMessage: "5 hours ago" },
  { id: 7, name: "Maria Garcia", email: "maria@email.com", phone: "+1 234 567 8907", tags: ["New"], lastMessage: "Just now" },
  { id: 8, name: "Robert Martinez", email: "robert@email.com", phone: "+1 234 567 8908", tags: ["Active"], lastMessage: "4 days ago" },
];

const tagStyles: Record<string, string> = {
  VIP: "bg-warning/10 text-warning border-warning/20",
  Active: "bg-success/10 text-success border-success/20",
  New: "bg-info/10 text-info border-info/20",
  Inactive: "bg-muted text-muted-foreground border-muted",
};

export default function Contacts() {
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);

  const toggleContact = (id: number) => {
    setSelectedContacts(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelectedContacts(prev => 
      prev.length === contacts.length ? [] : contacts.map(c => c.id)
    );
  };

  return (
    <div className="flex min-h-screen bg-background w-full">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
                <p className="text-muted-foreground">Manage your contact list and segments</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Import
                </Button>
                <Button className="gradient-whatsapp text-primary-foreground gap-2">
                  <Plus className="h-4 w-4" />
                  Add Contact
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="card-elevated p-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search contacts..." className="pl-10 bg-muted/50" />
                </div>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
                <Button variant="outline" className="gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </Button>
              </div>
            </div>

            {/* Contacts Table */}
            <div className="card-elevated overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left">
                      <Checkbox 
                        checked={selectedContacts.length === contacts.length}
                        onCheckedChange={toggleAll}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Contact</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Phone</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Tags</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Last Message</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <Checkbox 
                          checked={selectedContacts.includes(contact.id)}
                          onCheckedChange={() => toggleContact(contact.id)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                              {contact.name.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground">{contact.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          {contact.email}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          {contact.phone}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {contact.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className={tagStyles[tag]}>
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{contact.lastMessage}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing 1-{contacts.length} of {contacts.length} contacts
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>Previous</Button>
                <Button variant="outline" size="sm" disabled>Next</Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
