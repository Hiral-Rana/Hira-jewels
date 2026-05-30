"use client";

import { useState } from "react";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Sparkles, Palette, PenTool } from "lucide-react";
import { apiUrl } from "@/lib/api";

export default function CustomDesignPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    designCategory: "",
    note: "",
  });
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [emailSent, setEmailSent] = useState<boolean>(true);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (value: string) => {
    setFormData({
      ...formData,
      designCategory: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.mobile || !formData.designCategory || !formData.note) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(apiUrl('/api/custom-orders'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setEmailSent(data.emailSent !== false);
        if (data.emailSent === false) {
          toast.warning(data.emailWarning || "Request saved, but confirmation email was not sent.");
        }
        setShowSuccessModal(true);
        setFormData({ name: "", email: "", mobile: "", designCategory: "", note: "" });
      } else {
        toast.error(data.error || "Failed to submit request.");
      }
    } catch (error) {
      console.error("Custom order error:", error);
      toast.error("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">Create Your Custom Masterpiece</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Bring your unique vision to life. Share your ideas with our master artisans, and we will craft a bespoke jewelry piece just for you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="bg-primary/5 border-none shadow-none text-center">
              <CardContent className="pt-6">
                <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="text-primary h-6 w-6" />
                </div>
                <h3 className="font-bold mb-2">1. Share Your Idea</h3>
                <p className="text-sm text-muted-foreground">Tell us what you are looking for.</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-none shadow-none text-center">
              <CardContent className="pt-6">
                <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <Palette className="text-primary h-6 w-6" />
                </div>
                <h3 className="font-bold mb-2">2. Design & Quote</h3>
                <p className="text-sm text-muted-foreground">We sketch the design and provide pricing.</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-none shadow-none text-center">
              <CardContent className="pt-6">
                <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <PenTool className="text-primary h-6 w-6" />
                </div>
                <h3 className="font-bold mb-2">3. Master Crafting</h3>
                <p className="text-sm text-muted-foreground">Our artisans bring the design to reality.</p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-lg border-primary/20">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="text-2xl">Custom Order Form</CardTitle>
              <CardDescription>
                Please provide your contact information and details about the studio jewelry you want.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g. Jane Doe"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="e.g. jane@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile Number *</Label>
                    <Input
                      id="mobile"
                      name="mobile"
                      type="tel"
                      placeholder="e.g. +91 9876543210"
                      value={formData.mobile}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="designCategory">Design Category *</Label>
                    <Select onValueChange={handleSelectChange} value={formData.designCategory} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ring">Custom Ring</SelectItem>
                        <SelectItem value="Necklace">Custom Necklace</SelectItem>
                        <SelectItem value="Earrings">Custom Earrings</SelectItem>
                        <SelectItem value="Bracelet">Custom Bracelet</SelectItem>
                        <SelectItem value="Other">Other / Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note">Notes for Making (Design specifics, materials, budget, etc.) *</Label>
                  <Textarea
                    id="note"
                    name="note"
                    placeholder="Describe your dream piece... (e.g. I want an 18K gold ring with a vintage style and a 1-carat ruby center stone...)"
                    value={formData.note}
                    onChange={handleChange}
                    required
                    rows={6}
                  />
                </div>

                <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={loading}>
                  {loading ? "Submitting Request..." : "Submit Custom Design Request"}
                </Button>
              </form>
            </CardContent>
          </Card>

        </div>
      </main>
      <Footer />

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-background border border-border rounded-2xl shadow-2xl max-w-md w-full p-8 text-center relative animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Request Received!</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Your order has been sent to the admin. The admin will contact you via email or mobile number if there are any queries. {emailSent ? "You will receive an email containing a copy of your submitted details." : "We could not send the confirmation email right now, but your request is saved and our team will contact you."}
            </p>
            <Button 
              className="w-full h-12 text-lg font-bold" 
              onClick={() => setShowSuccessModal(false)}
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
