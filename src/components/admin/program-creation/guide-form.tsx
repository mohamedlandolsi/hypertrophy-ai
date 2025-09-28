'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { Plus, Trash2, Book, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GuideSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

export function GuideForm() {
  const { watch, setValue } = useFormContext();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  
  // Watch the guide sections from the form
  const guideSections: GuideSection[] = watch('guideSections') || [];

  // Helper function to check if HTML content is empty
  const isHtmlContentEmpty = (html: string): boolean => {
    if (!html || html.trim() === '') return true;
    // Remove HTML tags and check if there's actual content
    const textContent = html.replace(/<[^>]*>/g, '').trim();
    return textContent === '' || textContent === '&nbsp;';
  };

  // Add a new guide section
  const addGuideSection = () => {
    const newSection: GuideSection = {
      id: `section-${Date.now()}`,
      title: '',
      content: '',
      order: guideSections.length + 1
    };
    
    const updatedSections = [...guideSections, newSection];
    setValue('guideSections', updatedSections);
    setActiveSection(newSection.id);
  };

  // Remove a guide section
  const removeGuideSection = (sectionId: string) => {
    const updatedSections = guideSections
      .filter(section => section.id !== sectionId)
      .map((section, index) => ({ ...section, order: index + 1 }));
    
    setValue('guideSections', updatedSections);
    
    if (activeSection === sectionId) {
      setActiveSection(updatedSections.length > 0 ? updatedSections[0].id : null);
    }
  };

  // Update section title
  const updateSectionTitle = (sectionId: string, title: string) => {
    const updatedSections = guideSections.map(section =>
      section.id === sectionId ? { ...section, title } : section
    );
    setValue('guideSections', updatedSections);
  };

  // Update section content
  const updateSectionContent = (sectionId: string, content: string) => {
    const updatedSections = guideSections.map(section =>
      section.id === sectionId ? { ...section, content } : section
    );
    setValue('guideSections', updatedSections);
  };

  // Get active section
  const getActiveSection = () => {
    return guideSections.find(section => section.id === activeSection);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Book className="h-5 w-5" />
            Training Guide
          </h3>
          <p className="text-sm text-muted-foreground">
            Create a comprehensive guide with multiple sections to help users understand and follow the training program
          </p>
        </div>
        <Button
          type="button"
          onClick={addGuideSection}
          className="flex items-center gap-2"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          Add Section
        </Button>
      </div>

      {/* Guide Sections */}
      {guideSections.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Guide Sections Yet</h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              Start by adding your first guide section. You can create multiple sections to organize different aspects of the training program.
            </p>
            <Button
              type="button"
              onClick={addGuideSection}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add First Section
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Sections Sidebar */}
          <div className="lg:col-span-4 space-y-2">
            <Label className="text-sm font-medium">Guide Sections</Label>
            <div className="space-y-1">
              {guideSections.map((section, index) => (
                <div
                  key={section.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                    activeSection === section.id 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:bg-muted/50"
                  )}
                  onClick={() => setActiveSection(section.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Section {index + 1}
                      </span>
                    </div>
                    <p className="text-sm font-medium truncate">
                      {section.title || 'Untitled Section'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isHtmlContentEmpty(section.content) ? 'No content' : 'Has content'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeGuideSection(section.id);
                    }}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Section Editor */}
          <div className="lg:col-span-8">
            {activeSection && getActiveSection() ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Edit Section {guideSections.findIndex(s => s.id === activeSection) + 1}
                  </CardTitle>
                  <CardDescription>
                    Customize the title and content for this guide section
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Section Title */}
                  <div className="space-y-2">
                    <Label htmlFor="section-title">Section Title</Label>
                    <Input
                      id="section-title"
                      placeholder="e.g., Getting Started, Exercise Techniques, Weekly Schedule..."
                      value={getActiveSection()?.title || ''}
                      onChange={(e) => updateSectionTitle(activeSection, e.target.value)}
                    />
                  </div>

                  {/* Section Content */}
                  <div className="space-y-2">
                    <Label htmlFor="section-content">Section Content</Label>
                    <RichTextEditor
                      content={getActiveSection()?.content || ''}
                      onChange={(content: string) => updateSectionContent(activeSection, content)}
                      placeholder="Enter detailed information for this section. Use formatting to make it clear and easy to follow..."
                      className="min-h-[300px]"
                    />
                  </div>

                  {/* Section Stats */}
                  <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
                    <span>
                      Content: {isHtmlContentEmpty(getActiveSection()?.content || '') ? 'Empty' : 'Has content'}
                    </span>
                    <span>•</span>
                    <span>
                      Order: {getActiveSection()?.order}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    Select a section from the left to start editing
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Summary */}
      {guideSections.length > 0 && (
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Guide Summary</h4>
                <p className="text-sm text-muted-foreground">
                  {guideSections.length} section{guideSections.length !== 1 ? 's' : ''} created
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {guideSections.filter(s => !isHtmlContentEmpty(s.content) && s.title.trim()).length} completed
                </p>
                <p className="text-xs text-muted-foreground">
                  {guideSections.filter(s => isHtmlContentEmpty(s.content) || !s.title.trim()).length} incomplete
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}