import { Wrench, Clock, Mail } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo/Brand */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <Wrench className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Main Message */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-white mb-4">
            Chat Under Maintenance
          </h1>
          <p className="text-xl text-gray-300 leading-relaxed">
            Our AI chat system is currently undergoing maintenance to improve your experience.
          </p>
        </div>

        {/* Status Info */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-center space-x-2 text-blue-300">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium">Expected Duration: 1-2 hours</span>
          </div>
          
          <div className="text-gray-300 text-sm">
            <p>You can still access other parts of the website while we work on the chat system. We apologize for any inconvenience.</p>
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
