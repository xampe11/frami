import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, MessageCircle, Send } from "lucide-react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    contactMethod: "Email",
    contact: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate form submission
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast({
        title: "Message sent successfully!",
        description: "We'll get back to you as soon as possible.",
      });

      // Reset form
      setFormData({
        name: "",
        contactMethod: "Email",
        contact: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const subjectOptions = [
    "Get help planning or setting up my project",
    "Technical support",
    "Partnership inquiry",
    "General question",
    "Bug report",
    "Feature request",
    "Other",
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111827] pt-20 pb-16">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-[110rem]">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
              Contact
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              For inquiries or project support, please submit the form below and
              we'll respond at our earliest opportunity. Alternative contact is
              available through{" "}
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline"
              >
                Telegram
              </a>{" "}
              .
            </p>
          </div>

          {/* Contact Form */}
          <Card className="bg-white dark:bg-[#1a1e31] border-gray-200 dark:border-gray-700 shadow-lg">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Your Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base font-medium">
                    <span className="text-red-500">*</span> Your Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                    className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 text-base h-12"
                  />
                </div>

                {/* Where to Contact You */}
                <div className="space-y-2">
                  <Label className="text-base font-medium">
                    <span className="text-red-500">*</span> Where to Contact You
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select
                      value={formData.contactMethod}
                      onValueChange={(value) =>
                        handleInputChange("contactMethod", value)
                      }
                    >
                      <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Email">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2" />
                            Email
                          </div>
                        </SelectItem>
                        <SelectItem value="Telegram">
                          <div className="flex items-center">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Telegram
                          </div>
                        </SelectItem>
                        <SelectItem value="X(Twitter)">
                          <div className="flex items-center">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            X(Twitter)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="md:col-span-2">
                      <Input
                        type={
                          formData.contactMethod === "Email" ? "email" : "text"
                        }
                        placeholder={
                          formData.contactMethod === "Email"
                            ? "your.email@example.com"
                            : formData.contactMethod === "Telegram"
                              ? "your_telegram_username"
                              : "your_twitter_username"
                        }
                        value={formData.contact}
                        onChange={(e) =>
                          handleInputChange("contact", e.target.value)
                        }
                        required
                        className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 text-base h-12"
                      />
                    </div>
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-base font-medium">
                    Subject
                  </Label>
                  <Select
                    value={formData.subject}
                    onValueChange={(value) =>
                      handleInputChange("subject", value)
                    }
                  >
                    <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 h-12">
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjectOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Your Message */}
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-base font-medium">
                    <span className="text-red-500">*</span> Your Message
                  </Label>
                  <div className="relative">
                    <Textarea
                      id="message"
                      placeholder="Enter a message..."
                      value={formData.message}
                      onChange={(e) =>
                        handleInputChange("message", e.target.value)
                      }
                      required
                      maxLength={500}
                      rows={6}
                      className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <div className="absolute bottom-3 right-3 text-sm text-gray-500 dark:text-gray-400">
                      {formData.message.length} / 500
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !formData.name ||
                    !formData.contact ||
                    !formData.message
                  }
                  className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base font-medium h-12"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
