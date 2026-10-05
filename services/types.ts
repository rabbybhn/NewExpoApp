export type CareDifficulty = 'Easy' | 'Moderate' | 'Challenging' | 'Expert';
export type ToxicityLevel = 'Non-toxic' | 'Mildly toxic' | 'Toxic' | 'Highly toxic' | 'Unknown';

export interface PlantIdentification {
  /** False when the photo doesn't show a plant, flower, tree, fungus or succulent. */
  is_plant: boolean;
  common_name: string;
  scientific_name: string;
  family: string;
  /** e.g. "Houseplant", "Flowering perennial", "Tree", "Succulent", "Weed". */
  plant_type: string;
  /** 0–100 */
  confidence: number;
  description: string;
  native_region: string;
  key_features: string[];
  care: {
    difficulty: CareDifficulty;
    light: string;
    water: string;
    soil: string;
    temperature: string;
  };
  toxicity: {
    pets: ToxicityLevel;
    humans: ToxicityLevel;
    notes: string;
  };
  /** What the photo suggests about the specimen's condition, e.g. "Leaf tips browning — likely underwatered." */
  health_assessment: string;
}

export interface CollectionItem {
  id: string;
  createdAt: number;
  /** Persistent local URI of the saved photo. */
  imageUri: string;
  result: PlantIdentification;
}
