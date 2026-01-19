import { useState } from 'react'
import { Mail, MapPin, Phone, Send } from 'lucide-react'
import { Button, Input, Textarea, Card, CardContent } from '@/components/ui'

const contactInfo = [
  {
    icon: Mail,
    label: 'Email',
    value: 'hello@assessiq.com',
    href: 'mailto:hello@assessiq.com',
  },
  {
    icon: Phone,
    label: 'Phone',
    value: '+1 (555) 123-4567',
    href: 'tel:+15551234567',
  },
  {
    icon: MapPin,
    label: 'Address',
    value: 'San Francisco, CA',
    href: '#',
  },
]

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsSubmitting(false)
    setIsSubmitted(true)
    setFormData({ name: '', email: '', subject: '', message: '' })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <>
      {/* Hero */}
      <section className="py-24 bg-primary-800/50">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Get in <span className="gradient-text">Touch</span>
            </h1>
            <p className="text-lg text-neutral-400">
              Have questions about AssessIQ? We would love to hear from you. Send us a message and
              we will respond as soon as possible.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-24">
        <div className="container">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-1">
              <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
              <div className="space-y-6">
                {contactInfo.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="flex items-start gap-4 group"
                  >
                    <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-colors">
                      <item.icon className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-400">{item.label}</p>
                      <p className="text-neutral-100 group-hover:text-accent transition-colors">
                        {item.value}
                      </p>
                    </div>
                  </a>
                ))}
              </div>

              <div className="mt-12">
                <h3 className="text-lg font-semibold mb-4">Office Hours</h3>
                <div className="space-y-2 text-neutral-400">
                  <p>Monday - Friday: 9am - 6pm PST</p>
                  <p>Saturday - Sunday: Closed</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-8">
                  {isSubmitted ? (
                    <div className="text-center py-12">
                      <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                        <Send className="h-8 w-8 text-success" />
                      </div>
                      <h3 className="text-xl font-semibold text-neutral-100 mb-2">
                        Message Sent!
                      </h3>
                      <p className="text-neutral-400 mb-6">
                        Thank you for reaching out. We will get back to you within 24 hours.
                      </p>
                      <Button variant="secondary" onClick={() => setIsSubmitted(false)}>
                        Send Another Message
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <Input
                          label="Your Name"
                          name="name"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={handleChange}
                          required
                        />
                        <Input
                          label="Email Address"
                          name="email"
                          type="email"
                          placeholder="john@example.com"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <Input
                        label="Subject"
                        name="subject"
                        placeholder="How can we help?"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                      />
                      <Textarea
                        label="Message"
                        name="message"
                        placeholder="Tell us more about your inquiry..."
                        value={formData.message}
                        onChange={handleChange}
                        required
                        showCount
                        maxLength={1000}
                      />
                      <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">
                        <Send className="mr-2 h-4 w-4" />
                        Send Message
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-24 bg-primary-800/50">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-neutral-400 mb-8">
              Can not find what you are looking for? Check out our FAQ section or reach out directly.
            </p>
            <div className="grid gap-4 text-left">
              {[
                {
                  q: 'How does the free tier work?',
                  a: 'Our free tier includes up to 3 courses, 10 exams, and 50 submissions per month. Perfect for trying out the platform.',
                },
                {
                  q: 'Is my data secure?',
                  a: 'Yes, we use industry-standard encryption and follow best practices for data security and privacy.',
                },
                {
                  q: 'Can I integrate with my existing LMS?',
                  a: 'We offer integrations with popular LMS platforms. Contact us for specific integration requirements.',
                },
              ].map((faq) => (
                <Card key={faq.q}>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-neutral-100 mb-2">{faq.q}</h3>
                    <p className="text-sm text-neutral-400">{faq.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
