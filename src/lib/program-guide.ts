export interface GuideSectionData {
  id: string;
  title: string;
  content: string;
  order: number;
}

const normalizeGuideSectionsFromArray = (sections: unknown[]): GuideSectionData[] =>
  sections
    .map((section, index) => {
      if (section && typeof section === 'object') {
        const sectionObj = section as Partial<GuideSectionData> & Record<string, unknown>;
        const id = typeof sectionObj.id === 'string' && sectionObj.id.trim().length > 0
          ? sectionObj.id
          : `guide-${index + 1}`;
        const title = typeof sectionObj.title === 'string' && sectionObj.title.trim().length > 0
          ? sectionObj.title
          : `Section ${index + 1}`;
        const order = typeof sectionObj.order === 'number' ? sectionObj.order : index + 1;
        const contentValue = sectionObj.content;
        const content = typeof contentValue === 'string'
          ? contentValue
          : JSON.stringify(contentValue ?? '');

        return {
          id,
          title,
          content,
          order,
        };
      }

      const fallbackContent = typeof section === 'string'
        ? section
        : JSON.stringify(section ?? '');

      return {
        id: `guide-${index + 1}`,
        title: `Section ${index + 1}`,
        content: fallbackContent,
        order: index + 1,
      };
    })
    .sort((a, b) => a.order - b.order)
    .map((section, index) => ({ ...section, order: index + 1 }));

export const normalizeGuideSections = (rawContent: unknown): GuideSectionData[] => {
  if (!rawContent) {
    return [];
  }

  if (Array.isArray(rawContent)) {
    return normalizeGuideSectionsFromArray(rawContent);
  }

  if (typeof rawContent === 'object') {
    const contentObj = rawContent as Record<string, unknown> & { sections?: unknown[] };

    if (Array.isArray(contentObj.sections)) {
      return normalizeGuideSectionsFromArray(contentObj.sections);
    }

    return Object.entries(contentObj).map(([key, value], index) => ({
      id: `guide-${key}`,
      title: key.toUpperCase(),
      content: typeof value === 'string' ? value : JSON.stringify(value ?? ''),
      order: index + 1,
    }));
  }

  return [];
};

export const sanitizeGuideSectionsForSubmit = (
  sections: GuideSectionData[] | undefined,
): GuideSectionData[] => {
  if (!sections || sections.length === 0) {
    return [];
  }

  return sections
    .map((section, index) => ({
      id: section.id && section.id.trim().length > 0 ? section.id : `section-${index + 1}`,
      title: section.title?.trim() ?? '',
      content: section.content ?? '',
      order: section.order ?? index + 1,
    }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((section, index) => ({ ...section, order: index + 1 }));
};
