import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
//import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Users, 
  QrCode, 
  Mail, 
  Award, 
  BarChart3, 
  Smartphone,
  CheckCircle,
  ArrowRight,
  Star,
  Globe,
  Shield,
  Zap,
  Badge
} from 'lucide-react'

export default function HomePage() {
  const features = [
    {
      icon: <Users className="h-8 w-8 text-blue-600" />,
      title: "Faculty Management",
      description: "Comprehensive faculty invitation, CV collection, and coordination system with automated workflows."
    },
    {
      icon: <Calendar className="h-8 w-8 text-green-600" />,
      title: "Smart Scheduling",
      description: "Drag-and-drop schedule builder with conflict detection and automated hall assignments."
    },
    {
      icon: <QrCode className="h-8 w-8 text-purple-600" />,
      title: "Digital Attendance",
      description: "QR code-based attendance tracking with real-time reporting and analytics."
    },
    {
      icon: <Mail className="h-8 w-8 text-orange-600" />,
      title: "Smart Notifications",
      description: "Multi-channel communication via email and WhatsApp with automated reminders."
    },
    {
      icon: <Award className="h-8 w-8 text-yellow-600" />,
      title: "Certificate Generation",
      description: "Automated certificate generation and distribution for all participants."
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-red-600" />,
      title: "Real-time Updates",
      description: "Live updates and notifications to keep all stakeholders informed."
    }
  ];

  const roles = [
    { name: "Organizers", description: "Complete event oversight and management", icon: <Globe className="h-5 w-5" /> },
    { name: "Event Managers", description: "Operational control and coordination", icon: <Shield className="h-5 w-5" /> },
    { name: "Faculty", description: "Session management and content delivery", icon: <Users className="h-5 w-5" /> },
    { name: "Delegates", description: "Easy registration and participation", icon: <Star className="h-5 w-5" /> },
    { name: "Hall Coordinators", description: "On-site session management", icon: <Calendar className="h-5 w-5" /> },
    { name: "Sponsors", description: "Partnership and visibility management", icon: <Zap className="h-5 w-5" /> },
    { name: "Volunteers", description: "Task coordination and support", icon: <CheckCircle className="h-5 w-5" /> },
    { name: "Vendors", description: "Service provision and logistics", icon: <Smartphone className="h-5 w-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Conference Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button>Sign In</Button>
              </Link>
              <Link href="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-6xl">
          <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">
            ✨ Now Live - Complete Conference Platform
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Scientific Conference
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {" "}Management Platform
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Streamline your scientific conferences with our comprehensive platform. From faculty management 
            to digital certificates, we handle every aspect of your event.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link href="/register">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg">
                Start Your Event
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="outline" size="lg" className="px-8 py-3 text-lg">
                View Demo
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-blue-600">100+</div>
              <div className="text-gray-600">Events Managed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">50K+</div>
              <div className="text-gray-600">Participants</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">24/7</div>
              <div className="text-gray-600">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Your Conference
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform provides all the tools necessary to manage scientific conferences efficiently and professionally.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-200 border-0 shadow-md">
                <CardHeader>
                  <div className="mb-4">{feature.icon}</div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Built for Every Role
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform caters to all stakeholders involved in scientific conferences with role-specific dashboards and features.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {roles.map((role, index) => (
              <Card key={index} className="text-center hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-blue-600">{role.icon}</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{role.name}</h3>
                  <p className="text-gray-600 text-sm">{role.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Conference Management?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of organizations already using our platform to streamline their scientific conferences.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg">
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <span className="text-white font-semibold">Conference Management</span>
              </div>
              <p className="text-gray-400">
                The comprehensive platform for managing scientific conferences with ease and efficiency.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Demo</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 Conference Management System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}