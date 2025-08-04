/**
 * Modern Google Maps Autocomplete Component
 * Uses the new AutocompleteElement instead of deprecated google.maps.places.Autocomplete
 */

/// <reference types="google.maps" />

'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface GoogleMapsAutocompleteProps {
  onPlaceSelected?: (place: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  types?: string[];
  componentRestrictions?: google.maps.places.ComponentRestrictions;
}

declare global {
  interface Window {
    google?: typeof google;
  }
}

export function GoogleMapsAutocomplete({
  onPlaceSelected,
  placeholder = "Enter a location...",
  label,
  value = "",
  onChange,
  className = "",
  types = ['establishment', 'geocode'],
  componentRestrictions
}: GoogleMapsAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<HTMLElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  // Load Google Maps API with Extended Component Library
  useEffect(() => {
    const loadGoogleMaps = async () => {
      if (window.google?.maps) {
        setIsLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,marker&loading=async&solution_channel=GMP_QB_addressselection_v1_cAC`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        setIsLoaded(true);
      };

      script.onerror = (error) => {
        console.error('Failed to load Google Maps API:', error);
      };

      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Initialize AutocompleteElement when API is loaded
  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

    const initializeAutocomplete = async () => {
      try {
        // Import the Extended Component Library
        const { Autocomplete } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;

        // Create AutocompleteElement (new approach)
        const autocompleteElement = document.createElement('gmp-autocomplete') as HTMLElement & {
          types?: string[];
          componentRestrictions?: google.maps.places.ComponentRestrictions;
          addEventListener: (event: string, callback: (event: CustomEvent) => void) => void;
        };
        
        // Configure the autocomplete
        if (types.length > 0) {
          autocompleteElement.types = types;
        }
        
        if (componentRestrictions) {
          autocompleteElement.componentRestrictions = componentRestrictions;
        }

        // Set up event listener for place selection
        autocompleteElement.addEventListener('gmp-placeselect', (event: CustomEvent) => {
          const place = (event as CustomEvent & { place: google.maps.places.PlaceResult }).place;
          if (place && onPlaceSelected) {
            onPlaceSelected(place);
          }
          if (place?.formatted_address) {
            setInputValue(place.formatted_address);
            onChange?.(place.formatted_address);
          }
        });

        // Alternative: Use traditional Autocomplete as fallback
        if (!autocompleteElement.addEventListener) {
          console.warn('AutocompleteElement not available, using traditional Autocomplete');
          
          if (!inputRef.current) return;
          
          const autocomplete = new Autocomplete(inputRef.current, {
            types,
            componentRestrictions,
            fields: ['formatted_address', 'geometry', 'name', 'place_id']
          });

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place && onPlaceSelected) {
              onPlaceSelected(place);
            }
            if (place?.formatted_address) {
              setInputValue(place.formatted_address);
              onChange?.(place.formatted_address);
            }
          });

          autocompleteRef.current = autocomplete as unknown as HTMLElement;
        } else {
          // Use the new AutocompleteElement
          if (inputRef.current?.parentNode) {
            inputRef.current.parentNode.insertBefore(autocompleteElement, inputRef.current);
            inputRef.current.style.display = 'none';
            autocompleteRef.current = autocompleteElement;
          }
        }

      } catch (error) {
        console.error('Failed to initialize Google Maps Autocomplete:', error);
      }
    };

    initializeAutocomplete();

    // Cleanup
    return () => {
      if (autocompleteRef.current) {
        if ('clearInstanceListeners' in autocompleteRef.current) {
          (window.google?.maps.event as unknown as { clearInstanceListeners: (instance: unknown) => void })?.clearInstanceListeners(autocompleteRef.current);
        }
      }
    };
  }, [isLoaded, types, componentRestrictions, onPlaceSelected, onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue);
  };

  return (
    <div className="space-y-2">
      {label && <Label htmlFor="google-autocomplete">{label}</Label>}
      <Input
        ref={inputRef}
        id="google-autocomplete"
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        className={className}
        disabled={!isLoaded}
      />
      {!isLoaded && (
        <p className="text-sm text-muted-foreground">Loading location services...</p>
      )}
    </div>
  );
}

// Usage Example Component
export function LocationSelector() {
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);

  const handlePlaceSelected = (place: google.maps.places.PlaceResult) => {
    setSelectedPlace(place);
  };

  return (
    <div className="space-y-4">
      <GoogleMapsAutocomplete
        label="Select Location"
        placeholder="Search for a location..."
        onPlaceSelected={handlePlaceSelected}
        types={['establishment', 'geocode']}
        componentRestrictions={{ country: ['tn', 'fr', 'us'] }} // Example: Restrict to Tunisia, France, US
      />
      
      {selectedPlace && (
        <div className="p-4 bg-muted rounded-lg">
          <h3 className="font-semibold">Selected Location:</h3>
          <p><strong>Name:</strong> {selectedPlace.name}</p>
          <p><strong>Address:</strong> {selectedPlace.formatted_address}</p>
          <p><strong>Place ID:</strong> {selectedPlace.place_id}</p>
          {selectedPlace.geometry?.location && (
            <p><strong>Coordinates:</strong> {selectedPlace.geometry.location.lat()}, {selectedPlace.geometry.location.lng()}</p>
          )}
        </div>
      )}
    </div>
  );
}
