/**
 * ZIP Code to City Database
 * 
 * More comprehensive ZIP code validation with city mappings
 * This is a sample of common ZIP codes - in production, you'd want
 * to use a complete USPS database or API
 */

interface ZipCodeInfo {
  city: string;
  state: string;
  county?: string;
  timezone?: string;
}

// Sample of major ZIP codes with their cities - in production use full USPS database
export const ZIP_CITY_DATABASE: Record<string, ZipCodeInfo> = {
  // Colorado samples
  '80201': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80202': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80203': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80204': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80205': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80206': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80207': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80208': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80209': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80210': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80211': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80212': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80220': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80221': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80222': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80223': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80224': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80225': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80226': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80227': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80228': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80229': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80230': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80231': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80232': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80233': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80234': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80235': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80236': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80237': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80238': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80239': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80246': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80247': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80248': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80249': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80250': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80251': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80252': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80256': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80257': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80259': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80260': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80261': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80262': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80263': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80264': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80265': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80266': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80271': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80273': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80274': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80279': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80280': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80281': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80290': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80291': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80293': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80294': { city: 'Denver', state: 'CO', county: 'Denver' },
  '80299': { city: 'Denver', state: 'CO', county: 'Denver' },
  
  // Boulder, CO
  '80301': { city: 'Boulder', state: 'CO', county: 'Boulder' },
  '80302': { city: 'Boulder', state: 'CO', county: 'Boulder' },
  '80303': { city: 'Boulder', state: 'CO', county: 'Boulder' },
  '80304': { city: 'Boulder', state: 'CO', county: 'Boulder' },
  '80305': { city: 'Boulder', state: 'CO', county: 'Boulder' },
  '80306': { city: 'Boulder', state: 'CO', county: 'Boulder' },
  '80307': { city: 'Boulder', state: 'CO', county: 'Boulder' },
  '80308': { city: 'Boulder', state: 'CO', county: 'Boulder' },
  '80309': { city: 'Boulder', state: 'CO', county: 'Boulder' },
  '80310': { city: 'Boulder', state: 'CO', county: 'Boulder' },
  
  // Colorado Springs, CO
  '80901': { city: 'Colorado Springs', state: 'CO', county: 'El Paso' },
  '80902': { city: 'Colorado Springs', state: 'CO', county: 'El Paso' },
  '80903': { city: 'Colorado Springs', state: 'CO', county: 'El Paso' },
  '80904': { city: 'Colorado Springs', state: 'CO', county: 'El Paso' },
  '80905': { city: 'Colorado Springs', state: 'CO', county: 'El Paso' },
  '80906': { city: 'Colorado Springs', state: 'CO', county: 'El Paso' },
  '80907': { city: 'Colorado Springs', state: 'CO', county: 'El Paso' },
  '80908': { city: 'Colorado Springs', state: 'CO', county: 'El Paso' },
  '80909': { city: 'Colorado Springs', state: 'CO', county: 'El Paso' },
  '80910': { city: 'Colorado Springs', state: 'CO', county: 'El Paso' },
  '80911': { city: 'Colorado Springs', state: 'CO', county: 'El Paso' },
  '80912': { city: 'Colorado Springs', state: 'CO', county: 'El Paso' },
  '80913': { city: 'Colorado Springs', state: 'CO', county: 'El Paso' },
  '80914': { city: 'Colorado Springs', state: 'CO', county: 'El Paso' },
  '80915': { city: 'Colorado Springs', state: 'CO', county: 'El Paso' },
  '80916': { city: 'Colorado Springs', state: 'CO', county: 'El Paso' },
  '80917': { city: 'Colorado Springs', state: 'CO', county: 'El Paso' },
  '80918': { city: 'Colorado Springs', state: 'CO', county: 'El Paso' },
  '80919': { city: 'Colorado Springs', state: 'CO', county: 'El Paso' },
  '80920': { city: 'Colorado Springs', state: 'CO', county: 'El Paso' },
  '80921': { city: 'Colorado Springs', state: 'CO', county: 'El Paso' },
  '80922': { city: 'Colorado Springs', state: 'CO', county: 'El Paso' },
  '80923': { city: 'Colorado Springs', state: 'CO', county: 'El Paso' },
  '80924': { city: 'Colorado Springs', state: 'CO', county: 'El Paso' },
  '80925': { city: 'Colorado Springs', state: 'CO', county: 'El Paso' },
  '80926': { city: 'Colorado Springs', state: 'CO', county: 'El Paso' },
  '80927': { city: 'Colorado Springs', state: 'CO', county: 'El Paso' },
  '80928': { city: 'Colorado Springs', state: 'CO', county: 'El Paso' },
  '80929': { city: 'Colorado Springs', state: 'CO', county: 'El Paso' },
  '80930': { city: 'Colorado Springs', state: 'CO', county: 'El Paso' },
  '80938': { city: 'Colorado Springs', state: 'CO', county: 'El Paso' },
  '80939': { city: 'Colorado Springs', state: 'CO', county: 'El Paso' },
  '80951': { city: 'Colorado Springs', state: 'CO', county: 'El Paso' },
  
  // Fort Collins, CO
  '80521': { city: 'Fort Collins', state: 'CO', county: 'Larimer' },
  '80522': { city: 'Fort Collins', state: 'CO', county: 'Larimer' },
  '80523': { city: 'Fort Collins', state: 'CO', county: 'Larimer' },
  '80524': { city: 'Fort Collins', state: 'CO', county: 'Larimer' },
  '80525': { city: 'Fort Collins', state: 'CO', county: 'Larimer' },
  '80526': { city: 'Fort Collins', state: 'CO', county: 'Larimer' },
  '80527': { city: 'Fort Collins', state: 'CO', county: 'Larimer' },
  '80528': { city: 'Fort Collins', state: 'CO', county: 'Larimer' },
  
  // Popular NYC ZIP codes for comparison
  '10001': { city: 'New York', state: 'NY', county: 'New York' },
  '10002': { city: 'New York', state: 'NY', county: 'New York' },
  '10003': { city: 'New York', state: 'NY', county: 'New York' },
  '10004': { city: 'New York', state: 'NY', county: 'New York' },
  '10005': { city: 'New York', state: 'NY', county: 'New York' },
  '10006': { city: 'New York', state: 'NY', county: 'New York' },
  '10007': { city: 'New York', state: 'NY', county: 'New York' },
  '10008': { city: 'New York', state: 'NY', county: 'New York' },
  '10009': { city: 'New York', state: 'NY', county: 'New York' },
  '10010': { city: 'New York', state: 'NY', county: 'New York' },
  '10011': { city: 'New York', state: 'NY', county: 'New York' },
  '10012': { city: 'New York', state: 'NY', county: 'New York' },
  '10013': { city: 'New York', state: 'NY', county: 'New York' },
  '10014': { city: 'New York', state: 'NY', county: 'New York' },
  '10016': { city: 'New York', state: 'NY', county: 'New York' },
  '10017': { city: 'New York', state: 'NY', county: 'New York' },
  '10018': { city: 'New York', state: 'NY', county: 'New York' },
  '10019': { city: 'New York', state: 'NY', county: 'New York' },
  '10020': { city: 'New York', state: 'NY', county: 'New York' },
  '10021': { city: 'New York', state: 'NY', county: 'New York' },
  '10022': { city: 'New York', state: 'NY', county: 'New York' },
  '10023': { city: 'New York', state: 'NY', county: 'New York' },
  '10024': { city: 'New York', state: 'NY', county: 'New York' },
  '10025': { city: 'New York', state: 'NY', county: 'New York' },
  '10026': { city: 'New York', state: 'NY', county: 'New York' },
  '10027': { city: 'New York', state: 'NY', county: 'New York' },
  '10028': { city: 'New York', state: 'NY', county: 'New York' },
  '10029': { city: 'New York', state: 'NY', county: 'New York' },
  '10030': { city: 'New York', state: 'NY', county: 'New York' },
  '10031': { city: 'New York', state: 'NY', county: 'New York' },
  '10032': { city: 'New York', state: 'NY', county: 'New York' },
  '10033': { city: 'New York', state: 'NY', county: 'New York' },
  '10034': { city: 'New York', state: 'NY', county: 'New York' },
  '10035': { city: 'New York', state: 'NY', county: 'New York' },
  
  // Los Angeles, CA samples
  '90001': { city: 'Los Angeles', state: 'CA', county: 'Los Angeles' },
  '90002': { city: 'Los Angeles', state: 'CA', county: 'Los Angeles' },
  '90003': { city: 'Los Angeles', state: 'CA', county: 'Los Angeles' },
  '90004': { city: 'Los Angeles', state: 'CA', county: 'Los Angeles' },
  '90005': { city: 'Los Angeles', state: 'CA', county: 'Los Angeles' },
  '90006': { city: 'Los Angeles', state: 'CA', county: 'Los Angeles' },
  '90007': { city: 'Los Angeles', state: 'CA', county: 'Los Angeles' },
  '90008': { city: 'Los Angeles', state: 'CA', county: 'Los Angeles' },
  '90009': { city: 'Los Angeles', state: 'CA', county: 'Los Angeles' },
  '90010': { city: 'Los Angeles', state: 'CA', county: 'Los Angeles' },
  '90011': { city: 'Los Angeles', state: 'CA', county: 'Los Angeles' },
  '90012': { city: 'Los Angeles', state: 'CA', county: 'Los Angeles' },
  '90013': { city: 'Los Angeles', state: 'CA', county: 'Los Angeles' },
  '90014': { city: 'Los Angeles', state: 'CA', county: 'Los Angeles' },
  '90015': { city: 'Los Angeles', state: 'CA', county: 'Los Angeles' },
  '90016': { city: 'Los Angeles', state: 'CA', county: 'Los Angeles' },
  '90017': { city: 'Los Angeles', state: 'CA', county: 'Los Angeles' },
  '90018': { city: 'Los Angeles', state: 'CA', county: 'Los Angeles' },
  '90019': { city: 'Los Angeles', state: 'CA', county: 'Los Angeles' },
  '90020': { city: 'Los Angeles', state: 'CA', county: 'Los Angeles' },
  '90210': { city: 'Beverly Hills', state: 'CA', county: 'Los Angeles' },
  '90211': { city: 'Beverly Hills', state: 'CA', county: 'Los Angeles' },
  '90212': { city: 'Beverly Hills', state: 'CA', county: 'Los Angeles' },
};

/**
 * Get city information for a ZIP code
 */
export function getCityForZip(zipCode: string): ZipCodeInfo | null {
  return ZIP_CITY_DATABASE[zipCode] || null;
}

/**
 * Check if a ZIP code exists in our database
 */
export function isValidZipCode(zipCode: string): boolean {
  return zipCode in ZIP_CITY_DATABASE;
}

/**
 * Find similar cities (fuzzy matching)
 */
export function findSimilarCity(inputCity: string, state: string): string[] {
  const normalizedInput = inputCity.toLowerCase().trim();
  const matchingCities = new Set<string>();
  
  Object.values(ZIP_CITY_DATABASE)
    .filter(info => info.state === state)
    .forEach(info => {
      const cityLower = info.city.toLowerCase();
      
      // Exact match
      if (cityLower === normalizedInput) {
        matchingCities.add(info.city);
      }
      // Starts with
      else if (cityLower.startsWith(normalizedInput)) {
        matchingCities.add(info.city);
      }
      // Contains
      else if (cityLower.includes(normalizedInput)) {
        matchingCities.add(info.city);
      }
    });
  
  return Array.from(matchingCities).slice(0, 3); // Return top 3 matches
}