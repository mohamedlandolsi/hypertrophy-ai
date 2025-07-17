'use client'

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedAvatarUpload } from '@/components/ui/enhanced-avatar-upload';
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Upload, Trash2, Camera, Shield } from 'lucide-react';

export function AvatarUploadDemo() {
  const [avatarUrl, setAvatarUrl] = React.useState<string>('');

  const features = [
    {
      icon: <Upload className="w-4 h-4" />,
      title: "Drag & Drop",
      description: "Simply drag and drop your image or click to browse"
    },
    {
      icon: <CheckCircle className="w-4 h-4" />,
      title: "Real-time Validation",
      description: "Instant feedback on file type and size"
    },
    {
      icon: <Camera className="w-4 h-4" />,
      title: "Live Preview",
      description: "See your new profile picture immediately"
    },
    {
      icon: <Trash2 className="w-4 h-4" />,
      title: "Easy Removal",
      description: "Remove your profile picture with confirmation"
    },
    {
      icon: <Shield className="w-4 h-4" />,
      title: "Secure Upload",
      description: "Files are validated and stored securely"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Enhanced Profile Picture Upload</h1>
        <p className="text-muted-foreground">
          Experience the improved user interface with better error handling and visual feedback
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Demo Component */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Live Demo
            </CardTitle>
            <CardDescription>
              Try uploading a profile picture with the enhanced component
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EnhancedAvatarUpload
              name="Demo User"
              imageUrl={avatarUrl}
              onImageUpdate={setAvatarUrl}
              size="xl"
              showRemoveButton={true}
              allowEdit={true}
            />
          </CardContent>
        </Card>

        {/* Features List */}
        <Card>
          <CardHeader>
            <CardTitle>Enhanced Features</CardTitle>
            <CardDescription>
              New capabilities and improvements over the previous version
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="font-medium">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Improvements</CardTitle>
          <CardDescription>
            Backend and frontend enhancements for better reliability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Badge variant="secondary">Frontend</Badge>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Drag & drop support</li>
                <li>• Upload progress indicator</li>
                <li>• Real-time file validation</li>
                <li>• Confirmation dialogs</li>
                <li>• Toast notifications</li>
                <li>• Responsive design</li>
              </ul>
            </div>
            <div className="space-y-2">
              <Badge variant="secondary">Backend</Badge>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Enhanced error messages</li>
                <li>• Detailed logging</li>
                <li>• File cleanup on errors</li>
                <li>• Metadata tracking</li>
                <li>• Performance optimization</li>
                <li>• Security validation</li>
              </ul>
            </div>
            <div className="space-y-2">
              <Badge variant="secondary">User Experience</Badge>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Visual feedback</li>
                <li>• Error guidance</li>
                <li>• Loading states</li>
                <li>• Accessibility support</li>
                <li>• Mobile-friendly</li>
                <li>• Intuitive interactions</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
