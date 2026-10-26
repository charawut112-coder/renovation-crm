import { loadChecklistDone } from "./checklist";
import { loadProperties, type Property } from "./data";
import { analyzeTimeline, loadTimelines, type TimelineAnalysis } from "./timeline";

export type PropertyView = {
  property: Property;
  timing: TimelineAnalysis;
  checklistDone: string[];
};

export function loadPropertyViews(): PropertyView[] {
  const properties = loadProperties();
  const timelines = loadTimelines(properties);
  return properties
    .slice()
    .sort((a, b) => a.code.localeCompare(b.code, "th"))
    .map((property) => ({
      property,
      timing: analyzeTimeline(timelines[property.id] || [], property.status),
      checklistDone: loadChecklistDone(property.id),
    }));
}
