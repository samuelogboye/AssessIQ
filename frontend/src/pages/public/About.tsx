import { Link } from 'react-router-dom'
import { Target, Users, Lightbulb, Award } from 'lucide-react'
import { Button, Card, CardContent } from '@/components/ui'
import { ROUTES } from '@/lib/constants'

const values = [
  {
    icon: Target,
    title: 'Mission-Driven',
    description:
      'We believe in making quality assessment tools accessible to educators everywhere, regardless of institution size.',
  },
  {
    icon: Users,
    title: 'User-Centric',
    description:
      'Every feature we build starts with understanding the real challenges faced by educators and students.',
  },
  {
    icon: Lightbulb,
    title: 'Innovation First',
    description:
      'We leverage cutting-edge AI technology to automate tedious tasks while maintaining accuracy and fairness.',
  },
  {
    icon: Award,
    title: 'Quality Focused',
    description:
      'We are committed to delivering a reliable, secure, and high-performance platform you can depend on.',
  },
]

const team = [
  {
    name: 'Sarah Chen',
    role: 'CEO & Co-Founder',
    bio: 'Former educator with 15 years of experience in EdTech.',
  },
  {
    name: 'Marcus Johnson',
    role: 'CTO & Co-Founder',
    bio: 'Previously led engineering at major LMS platforms.',
  },
  {
    name: 'Emily Rodriguez',
    role: 'Head of Product',
    bio: 'Product leader passionate about education accessibility.',
  },
  {
    name: 'David Kim',
    role: 'Head of AI',
    bio: 'PhD in NLP, expert in educational AI applications.',
  },
]

export default function About() {
  return (
    <>
      {/* Hero */}
      <section className="py-24 bg-primary-800/50">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              About <span className="gradient-text">AssessIQ</span>
            </h1>
            <p className="text-lg text-neutral-400">
              We are on a mission to transform how educators create, deliver, and grade assessments.
              By combining modern technology with deep educational expertise, we help institutions
              save time and improve student outcomes.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-24">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <div className="space-y-4 text-neutral-400">
                <p>
                  AssessIQ was born from a simple observation: educators spend countless hours on
                  assessment-related tasks that could be automated, taking time away from what
                  matters most—teaching and mentoring students.
                </p>
                <p>
                  Founded in 2023 by a team of educators and technologists, we set out to build a
                  platform that makes assessment effortless without compromising on quality or
                  security.
                </p>
                <p>
                  Today, we serve thousands of educators worldwide, from small tutoring centers to
                  large universities, all united by the goal of making education more efficient and
                  effective.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-video rounded-xl bg-primary-800 border border-primary-600 flex items-center justify-center">
                <div className="text-center">
                  <div className="h-16 w-16 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl font-bold text-accent">A</span>
                  </div>
                  <p className="text-neutral-400">Empowering Educators Since 2023</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-primary-800/50">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className="text-neutral-400 max-w-2xl mx-auto">
              These core principles guide everything we do at AssessIQ.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <Card key={value.title} className="text-center">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-100 mb-2">{value.title}</h3>
                  <p className="text-sm text-neutral-400">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Meet Our Team</h2>
            <p className="text-neutral-400 max-w-2xl mx-auto">
              A diverse team of educators, engineers, and designers working together to transform
              assessment.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member) => (
              <Card key={member.name} className="text-center">
                <CardContent className="pt-6">
                  <div className="h-20 w-20 rounded-full bg-primary-700 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-neutral-300">
                      {member.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-100">{member.name}</h3>
                  <p className="text-sm text-accent mb-2">{member.role}</p>
                  <p className="text-sm text-neutral-400">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-primary-800/50">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Join Us on Our Mission</h2>
            <p className="text-neutral-400 mb-8">
              Whether you are an educator looking to streamline your workflow or a developer
              interested in EdTech, we would love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link to={ROUTES.REGISTER}>Get Started</Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link to={ROUTES.CONTACT}>Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
