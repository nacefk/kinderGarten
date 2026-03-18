import * as SecureStore from "expo-secure-store";

export interface PlanTemplate {
  id: string;
  name: string;
  activities: Array<{
    title: string;
    day: string;
    time: string;
    endTime?: string;
  }>;
  createdAt: string;
}

const TEMPLATES_KEY = "plan_templates";

/**
 * Save a plan as a reusable template
 */
export async function savePlanTemplate(
  templateName: string,
  activities: Array<{ title: string; day: string; time: string; endTime?: string }>
): Promise<PlanTemplate> {
  if (!templateName.trim()) {
    throw new Error("Template name is required");
  }

  if (!Array.isArray(activities) || activities.length === 0) {
    throw new Error("At least one activity is required");
  }

  try {
    const templates = await getAllTemplates();

    const newTemplate: PlanTemplate = {
      id: `template_${Date.now()}`,
      name: templateName.trim(),
      activities,
      createdAt: new Date().toISOString(),
    };

    templates.push(newTemplate);
    await SecureStore.setItemAsync(TEMPLATES_KEY, JSON.stringify(templates));

    return newTemplate;
  } catch (error) {
    console.error("Error saving template:", error);
    throw new Error("Failed to save template");
  }
}

/**
 * Get all saved templates
 */
export async function getAllTemplates(): Promise<PlanTemplate[]> {
  try {
    const stored = await SecureStore.getItemAsync(TEMPLATES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error retrieving templates:", error);
    return [];
  }
}

/**
 * Get a specific template by ID
 */
export async function getTemplate(templateId: string): Promise<PlanTemplate | null> {
  try {
    const templates = await getAllTemplates();
    return templates.find((t) => t.id === templateId) || null;
  } catch (error) {
    console.error("Error getting template:", error);
    return null;
  }
}

/**
 * Delete a template
 */
export async function deleteTemplate(templateId: string): Promise<void> {
  try {
    const templates = await getAllTemplates();
    const filtered = templates.filter((t) => t.id !== templateId);
    await SecureStore.setItemAsync(TEMPLATES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting template:", error);
    throw new Error("Failed to delete template");
  }
}

/**
 * Update a template name
 */
export async function updateTemplateName(
  templateId: string,
  newName: string
): Promise<PlanTemplate | null> {
  if (!newName.trim()) {
    throw new Error("Template name is required");
  }

  try {
    const templates = await getAllTemplates();
    const template = templates.find((t) => t.id === templateId);

    if (!template) {
      throw new Error("Template not found");
    }

    template.name = newName.trim();
    await SecureStore.setItemAsync(TEMPLATES_KEY, JSON.stringify(templates));

    return template;
  } catch (error) {
    console.error("Error updating template:", error);
    throw new Error("Failed to update template");
  }
}
