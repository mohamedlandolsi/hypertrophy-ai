import { Wrench, Clock, Mail, Construction, ArrowRight, Sparkles } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Logo/Brand */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
            <div className="relative w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Construction className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>

        {/* Main Message */}
        <div className="space-y-4">
          <div className="inline-block px-4 py-2 bg-blue-600/20 rounded-full border border-blue-500/30 mb-4">
            <span className="text-blue-300 text-sm font-medium">Under Construction</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            We&apos;re Building Something Amazing
          </h1>
          <p className="text-xl text-gray-300 leading-relaxed max-w-xl mx-auto">
            HypertroQ is currently under construction as we prepare an incredible AI-powered training experience for you.
          </p>
        </div>

        {/* Features Preview */}
        <div className="grid md:grid-cols-3 gap-4 pt-4">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
            <Sparkles className="w-8 h-8 text-blue-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Enhanced AI</h3>
            <p className="text-gray-400 text-sm">Next-gen training intelligence</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
            <ArrowRight className="w-8 h-8 text-purple-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Better UX</h3>
            <p className="text-gray-400 text-sm">Streamlined experience</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
            <Wrench className="w-8 h-8 text-pink-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">New Features</h3>
            <p className="text-gray-400 text-sm">Powerful training tools</p>
          </div>
        </div>

        {/* Status Info */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-center space-x-2 text-blue-300">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium">Launching Very Soon</span>
          </div>
          
          <div className="text-gray-300 text-sm space-y-2">
            <p>We&apos;re working hard to bring you the best AI-powered hypertrophy training platform.</p>
            <p className="text-gray-400">Thank you for your patience and excitement!</p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-3">
          <p className="text-gray-400 text-sm">
            Need immediate assistance?
          </p>
          <div className="flex items-center justify-center space-x-2 text-blue-300">
            <Mail className="w-4 h-4" />
            <a 
              href="mailto:support@hypertroq.com" 
              className="text-sm hover:text-blue-200 transition-colors"
            >
              support@hypertroq.com
            </a>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full w-3/4 animate-pulse"></div>
          </div>
          <p className="text-xs text-gray-400">
            Progress: System updates in progress...
          </p>
        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            © 2025 HypertroQ. We&apos;ll be back soon!
          </p>
        </div>
      </div>
    </div>
  );
}
