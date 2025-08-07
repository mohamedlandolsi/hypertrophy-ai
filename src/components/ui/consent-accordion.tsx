"use client";

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Shield, Info, FileText } from 'lucide-react';

interface ConsentAccordionProps {
  consentGiven: boolean;
  onConsentChange: (consent: boolean) => void;
  consentTimestamp?: string;
  required?: boolean;
  className?: string;
}

export function ConsentAccordion({
  consentGiven,
  onConsentChange,
  consentTimestamp,
  required = false,
  className = "",
}: ConsentAccordionProps) {
  const tConsent = useTranslations("ConsentForm");
  const locale = useLocale();

  return (
    <div className={`border rounded-lg bg-muted/30 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b bg-muted/50">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-4 w-4 text-primary" />
          <h4 className="font-medium text-sm">{tConsent("title")}</h4>
          {required && <span className="text-xs text-red-500">*</span>}
        </div>
        <p className="text-xs text-muted-foreground">{tConsent("description")}</p>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {/* Consent Checkbox - Always Visible */}
        <div className="mb-4">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="consent-checkbox"
              checked={consentGiven}
              onCheckedChange={(checked) => onConsentChange(checked === true)}
              className="mt-0.5"
            />
            <Label htmlFor="consent-checkbox" className="text-xs leading-relaxed cursor-pointer">
              {tConsent("checkbox")}{" "}
              <Link
                href={`/${locale}/privacy-policy`}
                className="underline hover:text-primary font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                {tConsent("privacyPolicy")}
              </Link>
            </Label>
          </div>
          
          {/* Consent Timestamp */}
          {consentTimestamp && (
            <div className="mt-2 text-xs text-muted-foreground ml-6">
              Consent given on: {new Date(consentTimestamp).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Collapsible Detailed Information */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="details" className="border-b-0">
            <AccordionTrigger className="text-sm py-2 hover:no-underline text-muted-foreground">
              <div className="flex items-center gap-2">
                <Info className="h-3 w-3" />
                View detailed information about data processing
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <div className="space-y-4">
                {/* Data Types */}
                <div className="border rounded-lg p-3 bg-background">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-3 w-3 text-blue-500" />
                    <h5 className="font-medium text-xs">{tConsent("dataTypes.title")}</h5>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {tConsent("dataTypes.description")}
                  </p>
                  <ul className="text-xs space-y-1 ml-4">
                    <li>• {tConsent("dataTypes.items.0")}</li>
                    <li>• {tConsent("dataTypes.items.1")}</li>
                    <li>• {tConsent("dataTypes.items.2")}</li>
                    <li>• {tConsent("dataTypes.items.3")}</li>
                    <li>• {tConsent("dataTypes.items.4")}</li>
                  </ul>
                </div>

                {/* Processing Purposes */}
                <div className="border rounded-lg p-3 bg-background">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-3 w-3 text-green-500" />
                    <h5 className="font-medium text-xs">{tConsent("purposes.title")}</h5>
                  </div>
                  <ul className="text-xs space-y-1 ml-4">
                    <li>• {tConsent("purposes.ai")}</li>
                    <li>• {tConsent("purposes.personalization")}</li>
                    <li>• {tConsent("purposes.health")}</li>
                    <li>• {tConsent("purposes.communication")}</li>
                  </ul>
                </div>

                {/* Your Rights */}
                <div className="border rounded-lg p-3 bg-background">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-3 w-3 text-orange-500" />
                    <h5 className="font-medium text-xs">{tConsent("rights.title")}</h5>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {tConsent("rights.description")}
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
