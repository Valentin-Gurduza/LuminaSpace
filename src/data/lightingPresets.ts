import { LightingEnvironment } from '../types/room';

export interface LightingPresetInfo {
  id: string;
  name: string;
  description: string;
  config: LightingEnvironment;
}

export const LIGHTING_PRESETS: LightingPresetInfo[] = [
  {
    id: 'golden-hour',
    name: 'Golden Hour Sunset',
    description: 'Low-angle warm amber sunlight pouring through windows with long dramatic shadows.',
    config: {
      presetName: 'Golden Hour Sunset',
      timeOfDay: 17.75, // 5:45 PM
      sunAzimuth: 245,
      sunElevation: 14,
      sunIntensity: 2.6,
      sunColor: '#FFAE52',
      sunKelvin: 2800,
      ambientIntensity: 0.35,
      ambientColor: '#8C9BB0',
      castShadows: true,
      shadowSoftness: 'soft',
      exposure: 1.15,
      showLightHelpers: false,
      fixturesMasterSwitch: true,
    },
  },
  {
    id: 'midday-sun',
    name: 'Crisp Midday Sun',
    description: 'High sun with clear architectural shadows and neutral natural daylight illumination.',
    config: {
      presetName: 'Crisp Midday Sun',
      timeOfDay: 13.0, // 1:00 PM
      sunAzimuth: 180,
      sunElevation: 68,
      sunIntensity: 2.8,
      sunColor: '#FFF8F0',
      sunKelvin: 5600,
      ambientIntensity: 0.55,
      ambientColor: '#D1D9E6',
      castShadows: true,
      shadowSoftness: 'soft',
      exposure: 1.0,
      showLightHelpers: false,
      fixturesMasterSwitch: false,
    },
  },
  {
    id: 'cozy-evening',
    name: 'Cozy Evening Lounge',
    description: 'Deep twilight sky outside with interior lamps and fixtures casting inviting warm pools of light.',
    config: {
      presetName: 'Cozy Evening Lounge',
      timeOfDay: 20.5, // 8:30 PM
      sunAzimuth: 290,
      sunElevation: 4,
      sunIntensity: 0.25,
      sunColor: '#4338CA', // Indigo dusk
      sunKelvin: 2200,
      ambientIntensity: 0.18,
      ambientColor: '#1E293B',
      castShadows: true,
      shadowSoftness: 'soft',
      exposure: 1.25,
      showLightHelpers: false,
      fixturesMasterSwitch: true,
    },
  },
  {
    id: 'midnight-cinematic',
    name: 'Midnight Cinema',
    description: 'Night exterior with glowing indoor floor lamps and accents creating moody high-contrast ambiance.',
    config: {
      presetName: 'Midnight Cinema',
      timeOfDay: 23.5, // 11:30 PM
      sunAzimuth: 340,
      sunElevation: 2,
      sunIntensity: 0.05,
      sunColor: '#1E1B4B',
      sunKelvin: 2000,
      ambientIntensity: 0.09,
      ambientColor: '#0B0F19',
      castShadows: true,
      shadowSoftness: 'ultra',
      exposure: 1.3,
      showLightHelpers: false,
      fixturesMasterSwitch: true,
    },
  },
  {
    id: 'morning-studio',
    name: 'Fresh Morning Light',
    description: 'Gentle angled morning light with soft, clear shadows and airy interior ambiance.',
    config: {
      presetName: 'Fresh Morning Light',
      timeOfDay: 8.5, // 8:30 AM
      sunAzimuth: 110,
      sunElevation: 28,
      sunIntensity: 2.2,
      sunColor: '#FFF3E0',
      sunKelvin: 4500,
      ambientIntensity: 0.5,
      ambientColor: '#CBD5E1',
      castShadows: true,
      shadowSoftness: 'soft',
      exposure: 1.05,
      showLightHelpers: false,
      fixturesMasterSwitch: true,
    },
  },
  {
    id: 'cyber-neon',
    name: 'Cyberpunk Mood',
    description: 'Moody dark interior with electric cyan, amber, and violet accent lighting.',
    config: {
      presetName: 'Cyberpunk Mood',
      timeOfDay: 22.0,
      sunAzimuth: 0,
      sunElevation: 1,
      sunIntensity: 0.08,
      sunColor: '#06B6D4',
      sunKelvin: 2000,
      ambientIntensity: 0.14,
      ambientColor: '#2E1065',
      castShadows: true,
      shadowSoftness: 'soft',
      exposure: 1.35,
      showLightHelpers: false,
      fixturesMasterSwitch: true,
    },
  },
];
