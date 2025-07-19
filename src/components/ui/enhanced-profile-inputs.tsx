'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Camera, Plus, Minus, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface StepperInputProps {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
}

export function StepperInput({ 
  label, 
  value, 
  onChange, 
  min = 0, 
  max = 999, 
  step = 1, 
  unit = '',
  placeholder
}: StepperInputProps) {
  const [inputValue, setInputValue] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);

  // Update input value when external value changes (but only when not focused)
  useEffect(() => {
    if (!isFocused) {
      setInputValue(value?.toString() || '');
    }
  }, [value, isFocused]);

  const handleDecrement = () => {
    const currentValue = value || 0;
    const newValue = Math.max(min, currentValue - step);
    onChange(newValue);
  };

  const handleIncrement = () => {
    const currentValue = value || 0;
    const newValue = Math.min(max, currentValue + step);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Update parent state if it's a valid number or empty
    if (newValue === '') {
      onChange(undefined);
    } else {
      const numValue = parseFloat(newValue);
      if (!isNaN(numValue)) {
        onChange(numValue);
      }
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // On blur, ensure the input shows the current value
    setInputValue(value?.toString() || '');
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center space-x-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDecrement}
          disabled={value !== undefined && value <= min}
          className="h-10 w-10 p-0"
        >
          <Minus size={16} />
        </Button>
        <div className="flex-1 relative">
          <Input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            step={step}
            className="text-center"
          />
          {unit && (
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
              {unit}
            </span>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleIncrement}
          disabled={value !== undefined && value >= max}
          className="h-10 w-10 p-0"
        >
          <Plus size={16} />
        </Button>
      </div>
    </div>
  );
}

interface SegmentedControlProps {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  options: { value: string; label: string; icon?: React.ReactNode }[];
  className?: string;
}

export function SegmentedControl({ 
  label, 
  value, 
  onChange, 
  options, 
  className 
}: SegmentedControlProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={value === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(option.value)}
            className="flex items-center gap-2"
          >
            {option.icon}
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

interface GoalCardProps {
  label: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
}

export function GoalCard({ label, description, icon, selected, onSelect }: GoalCardProps) {
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        selected ? "ring-2 ring-primary border-primary" : "hover:border-primary/50"
      )}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className={cn(
            "p-2 rounded-full",
            selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{label}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ProfileAvatarProps {
  name?: string;
  imageUrl?: string;
  onImageChange?: (file: File) => void;
  onImageUpdate?: (url: string) => void;
}

export function ProfileAvatar({ name, imageUrl, onImageChange, onImageUpdate }: ProfileAvatarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Call the onImageChange callback if provided (for backward compatibility)
    if (onImageChange) {
      onImageChange(file);
    }

    // Handle the upload directly
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload avatar');
      }

      const result = await response.json();
      
      if (result.success && onImageUpdate) {
        onImageUpdate(result.avatar_url);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      // You might want to show a toast notification here
    } finally {
      setIsUploading(false);
      // Clear the input so the same file can be selected again
      e.target.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (!imageUrl) return;

    setIsUploading(true);
    try {
      const response = await fetch('/api/profile/avatar', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove avatar');
      }

      const result = await response.json();
      
      if (result.success && onImageUpdate) {
        onImageUpdate('');
      }
    } catch (error) {
      console.error('Error removing avatar:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex justify-center mb-6">
      <div 
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
          <AvatarImage src={imageUrl} alt={name || 'Profile'} />
          <AvatarFallback className="text-2xl font-semibold">
            {name ? name.charAt(0).toUpperCase() : 'U'}
          </AvatarFallback>
        </Avatar>
        <div className={cn(
          "absolute inset-0 bg-black/50 rounded-full flex items-center justify-center transition-opacity",
          isHovered ? "opacity-100" : "opacity-0"
        )}>
          {isUploading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          ) : (
            <Camera className="w-6 h-6 text-white" />
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        {/* Remove Avatar Button */}
        {imageUrl && !isUploading && (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
            onClick={handleRemoveAvatar}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

interface DayPickerProps {
  label: string;
  value: number | undefined;
  onChange: (value: number) => void;
}

export function DayPicker({ label, value, onChange }: DayPickerProps) {
  const t = useTranslations('EnhancedProfileForm');
  
  const days = [
    { label: t('weekdays.sunday'), value: 1 },
    { label: t('weekdays.monday'), value: 2 },
    { label: t('weekdays.tuesday'), value: 3 },
    { label: t('weekdays.wednesday'), value: 4 },
    { label: t('weekdays.thursday'), value: 5 },
    { label: t('weekdays.friday'), value: 6 },
    { label: t('weekdays.saturday'), value: 7 }
  ];

  const selectedDays = value || 0;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        {days.map((day, index) => (
          <Button
            key={day.value}
            type="button"
            variant={index < selectedDays ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(index + 1)}
            className="w-10 h-10 p-0"
          >
            {day.label}
          </Button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        {selectedDays} {selectedDays === 1 ? t('labels.day') : t('labels.days')} {t('labels.daysPerWeek')}
      </p>
    </div>
  );
}
