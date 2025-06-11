import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, MessageCircle, FileText, Video, Phone, Mail } from "lucide-react";

export default function Help() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  const faqs = [
    {
      question: "How do I recover my wallet?",
      answer: "To recover your wallet, you'll need your seed phrase or private keys. Navigate to the Recovery Center and follow the step-by-step instructions for your specific case."
    },
    {
      question: "What documents are required for KYC verification?",
      answer: "You need a valid government-issued ID (passport, driver's license, or national ID card). The document must be clear, readable, and not expired."
    },
    {
      question: "How are taxes calculated?",
      answer: "Taxes are calculated as a percentage of your portfolio value based on your jurisdiction's requirements. The rate is set by administrators and varies by client."
    },
    {
      question: "Is my data secure?",
      answer: "Yes, we use industry-standard encryption and security measures. Your data is protected with bcrypt hashing, secure sessions, and regular security audits."
    },
    {
      question: "How do I update my personal information?",
      answer: "Go to Settings > Profile to update your personal information including name, phone number, and address."
    },
    {
      question: "What cryptocurrencies are supported?",
      answer: "We support Bitcoin (BTC), Ethereum (ETH), USDT, ADA, DOT, SOL, LINK, MATIC, BNB, and XRP with real-time EUR conversion."
    },
    {
      question: "How do I contact support?",
      answer: "You can contact support through live chat, email at support@ledger.com, or phone at +33 1 44 76 34 56 during business hours."
    },
    {
      question: "Can I change my password?",
      answer: "Yes, go to Settings > Security to change your password. Make sure to use a strong password with at least 8 characters."
    }
  ];

  const tutorials = [
    {
      title: "Getting Started with Ledger Recovery",
      duration: "5 min read",
      type: "article",
      description: "Learn the basics of using the recovery platform"
    },
    {
      title: "Completing KYC Verification",
      duration: "3 min video",
      type: "video",
      description: "Step-by-step guide to verify your identity"
    },
    {
      title: "Understanding Your Portfolio",
      duration: "4 min read",
      type: "article", 
      description: "How to read and manage your crypto portfolio"
    },
    {
      title: "Tax Payment Process",
      duration: "2 min video",
      type: "video",
      description: "Complete guide to paying your recovery taxes"
    }
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => window.history.back()}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-white">{t('help')} & Support</h1>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-900 border-gray-700 text-white"
          />
        </div>

        <Tabs defaultValue="faq" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="tutorials">Tutorials</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="status">System Status</TabsTrigger>
          </TabsList>

          {/* FAQ Tab */}
          <TabsContent value="faq">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {filteredFaqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-gray-300 hover:text-white">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-400">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                {filteredFaqs.length === 0 && (
                  <p className="text-gray-400 text-center py-8">
                    No results found for "{searchQuery}"
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tutorials Tab */}
          <TabsContent value="tutorials">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tutorials.map((tutorial, index) => (
                <Card key={index} className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-white text-lg">{tutorial.title}</CardTitle>
                        <div className="flex items-center space-x-2">
                          {tutorial.type === 'video' ? (
                            <Video className="w-4 h-4 text-blue-400" />
                          ) : (
                            <FileText className="w-4 h-4 text-green-400" />
                          )}
                          <span className="text-sm text-gray-400">{tutorial.duration}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {tutorial.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400">{tutorial.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <MessageCircle className="w-5 h-5 mr-2 text-blue-400" />
                    Live Chat
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 mb-4">
                    Get instant help from our support team
                  </p>
                  <Badge className="bg-green-600 text-white mb-4">Online</Badge>
                  <Button className="w-full">Start Chat</Button>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Mail className="w-5 h-5 mr-2 text-green-400" />
                    Email Support
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 mb-4">
                    Send us an email, we'll respond within 24 hours
                  </p>
                  <p className="text-sm text-gray-500 mb-4">support@ledger.com</p>
                  <Button variant="outline" className="w-full">Send Email</Button>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Phone className="w-5 h-5 mr-2 text-black" />
                    Phone Support
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 mb-4">
                    Call us during business hours
                  </p>
                  <p className="text-sm text-gray-500 mb-2">+33 1 44 76 34 56</p>
                  <p className="text-xs text-gray-600 mb-4">Mon-Fri: 9AM-6PM CET</p>
                  <Button variant="outline" className="w-full">Call Now</Button>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gray-900 border-gray-800 mt-6">
              <CardHeader>
                <CardTitle className="text-white">Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 mb-4">
                  For urgent security issues or account lockouts, contact our emergency line:
                </p>
                <div className="flex items-center space-x-4">
                  <Badge variant="destructive">Emergency</Badge>
                  <span className="text-white font-mono">+33 1 44 76 34 99</span>
                  <span className="text-gray-400">Available 24/7</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Status Tab */}
          <TabsContent value="status">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Web Application</p>
                    <p className="text-sm text-gray-400">Main platform and dashboard</p>
                  </div>
                  <Badge className="bg-green-600 text-white">Operational</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-white font-medium">KYC Processing</p>
                    <p className="text-sm text-gray-400">Document verification system</p>
                  </div>
                  <Badge className="bg-green-600 text-white">Operational</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Payment Processing</p>
                    <p className="text-sm text-gray-400">Tax payment system</p>
                  </div>
                  <Badge className="bg-green-600 text-white">Operational</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-400">Email delivery service</p>
                  </div>
                  <Badge className="bg-black text-white">Degraded</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Real-time Pricing</p>
                    <p className="text-sm text-gray-400">Cryptocurrency price feeds</p>
                  </div>
                  <Badge className="bg-black text-white">Degraded</Badge>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-white font-medium mb-2">Recent Incidents</h3>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <p className="text-gray-400">
                        <span className="text-gray-300 font-medium">Dec 7, 2024 - 15:30 CET:</span> 
                        Email notifications experiencing delays due to SMTP configuration. Investigating.
                      </p>
                    </div>
                    <div className="text-sm">
                      <p className="text-gray-400">
                        <span className="text-gray-300 font-medium">Dec 7, 2024 - 14:45 CET:</span> 
                        Crypto price feeds using fallback data. External API key renewal in progress.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}