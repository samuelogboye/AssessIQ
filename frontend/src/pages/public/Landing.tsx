import { Link } from 'react-router-dom'
import {
  Shield,
  Brain,
  BarChart3,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Zap,
  Clock,
  Users,
} from 'lucide-react'
import { Button, Card, CardContent } from '@/components/ui'
import { ROUTES } from '@/lib/constants'
import { useEffect, useRef, useState } from 'react'

// Animated counter hook
function useCounter(end: number, duration: number = 2000, start: boolean = true) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!start) return

    let startTime: number
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)

      setCount(Math.floor(progress * end))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [end, duration, start])

  return count
}

// Features data
const features = [
  {
    icon: Shield,
    title: 'Secure Exam Environment',
    description:
      'Robust authentication, role-based access control, and secure submission handling protect your assessments.',
  },
  {
    icon: Brain,
    title: 'AI-Powered Grading',
    description:
      'Leverage OpenAI, Claude, or Gemini for intelligent essay grading with configurable rubrics and feedback.',
  },
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    description:
      'Track student performance, identify knowledge gaps, and generate comprehensive reports instantly.',
  },
  {
    icon: BookOpen,
    title: 'Easy Course Management',
    description:
      'Organize exams by courses, manage question banks, and streamline your assessment workflow.',
  },
]

// Stats data
const stats = [
  { value: 10000, suffix: '+', label: 'Exams Created' },
  { value: 50000, suffix: '+', label: 'Students Served' },
  { value: 1000000, suffix: '+', label: 'Questions Graded' },
  { value: 85, suffix: '%', label: 'Time Saved' },
]

// How it works steps
const steps = [
  {
    step: 1,
    title: 'Create Your Exam',
    description: 'Build assessments with multiple question types, set duration, and configure grading.',
  },
  {
    step: 2,
    title: 'Students Take Exam',
    description: 'Students access exams securely, with auto-save and timer features.',
  },
  {
    step: 3,
    title: 'Automated Grading',
    description: 'AI grades submissions instantly, or review manually with suggested scores.',
  },
]

// Hero Section
function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-primary-900">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#171717_1px,transparent_1px),linear-gradient(to_bottom,#171717_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      </div>

      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl" />

      <div className="container relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary-600 bg-primary-800/50 mb-8 animate-fade-in">
            <Zap className="h-4 w-4 text-accent" />
            <span className="text-sm text-neutral-300">AI-Powered Assessment Platform</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-slide-up">
            <span className="gradient-text">Transform</span> How You{' '}
            <br className="hidden md:block" />
            Assess Students
          </h1>

          <p className="text-lg md:text-xl text-neutral-400 mb-10 max-w-2xl mx-auto animate-slide-up [animation-delay:100ms]">
            Create secure exams, automate grading with AI, and gain actionable insights.
            The modern assessment platform built for educators who value efficiency.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up [animation-delay:200ms]">
            <Button size="lg" asChild>
              <Link to={ROUTES.REGISTER}>
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link to={ROUTES.ABOUT}>Learn More</Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 flex flex-wrap justify-center gap-8 animate-fade-in [animation-delay:400ms]">
            {['No credit card required', 'Free tier available', 'Setup in minutes'].map((text) => (
              <div key={text} className="flex items-center gap-2 text-neutral-400">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span className="text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// Features Section
function FeaturesSection() {
  return (
    <section className="py-24 bg-primary-800/50" id="features">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to <span className="gradient-text">Succeed</span>
          </h2>
          <p className="text-neutral-400 max-w-2xl mx-auto">
            A complete assessment solution with powerful features designed for modern education.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              hover
              className="group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-100 mb-2">{feature.title}</h3>
                <p className="text-sm text-neutral-400">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

// How It Works Section
function HowItWorksSection() {
  return (
    <section className="py-24">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-neutral-400 max-w-2xl mx-auto">
            Get started in three simple steps and transform your assessment workflow.
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-16 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-accent via-primary-600 to-accent" />

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={step.step} className="text-center relative">
                {/* Step Number */}
                <div className="relative inline-flex items-center justify-center h-12 w-12 rounded-full bg-accent text-primary-900 font-bold text-lg mb-6 z-10">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold text-neutral-100 mb-2">{step.title}</h3>
                <p className="text-sm text-neutral-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// Stats Section
function StatsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="py-24 bg-primary-800/50">
      <div className="container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} animate={isVisible} />
          ))}
        </div>
      </div>
    </section>
  )
}

function StatCard({
  value,
  suffix,
  label,
  animate,
}: {
  value: number
  suffix: string
  label: string
  animate: boolean
}) {
  const count = useCounter(value, 2000, animate)

  return (
    <div className="text-center">
      <div className="text-4xl md:text-5xl font-bold text-neutral-100 mb-2 font-mono">
        {count.toLocaleString()}
        {suffix}
      </div>
      <div className="text-neutral-400">{label}</div>
    </div>
  )
}

// CTA Section
function CTASection() {
  return (
    <section className="py-24">
      <div className="container">
        <div className="relative rounded-2xl border border-primary-600 bg-primary-800 p-8 md:p-16 overflow-hidden">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent" />

          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Assessments?
            </h2>
            <p className="text-neutral-400 mb-8">
              Join educators who have streamlined their grading process and improved student outcomes
              with AssessIQ.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to={ROUTES.REGISTER}>
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="secondary" size="lg" asChild>
                <Link to={ROUTES.CONTACT}>Contact Sales</Link>
              </Button>
            </div>

            <p className="text-sm text-neutral-400 mt-6">
              No credit card required. Start with our free tier.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// Main Landing Page Component
export default function Landing() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <StatsSection />
      <CTASection />
    </>
  )
}
