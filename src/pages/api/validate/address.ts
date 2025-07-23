/**
 * Address Validation API
 * 
 * Validates addresses using multiple methods:
 * 1. Stripe postal code validation
 * 2. Basic format validation
 * 3. State/ZIP code correlation checking
 */

import type { APIRoute } from 'astro';
import { getCityForZip, isValidZipCode, findSimilarCity } from '@lib/validation/zip-city-database';

export const prerender = false;

// US State to ZIP code prefix mapping for validation
const STATE_ZIP_PREFIXES: Record<string, string[]> = {
  'AL': ['350', '351', '352', '353', '354', '355', '356', '357', '358', '359', '360', '361', '362', '363', '364', '365', '366', '367', '368', '369'],
  'AK': ['995', '996', '997', '998', '999'],
  'AZ': ['850', '851', '852', '853', '854', '855', '856', '857', '858', '859', '860', '863', '864', '865'],
  'AR': ['716', '717', '718', '719', '720', '721', '722', '723', '724', '725', '726', '727', '728', '729'],
  'CA': ['900', '901', '902', '903', '904', '905', '906', '907', '908', '910', '911', '912', '913', '914', '915', '916', '917', '918', '919', '920', '921', '922', '923', '924', '925', '926', '927', '928', '930', '931', '932', '933', '934', '935', '936', '937', '938', '939', '940', '941', '942', '943', '944', '945', '946', '947', '948', '949', '950', '951', '952', '953', '954', '955', '956', '957', '958', '959', '960', '961'],
  'CO': ['800', '801', '802', '803', '804', '805', '806', '807', '808', '809', '810', '811', '812', '813', '814', '815', '816'],
  'CT': ['060', '061', '062', '063', '064', '065', '066', '067', '068', '069'],
  'DE': ['197', '198', '199'],
  'FL': ['320', '321', '322', '323', '324', '325', '326', '327', '328', '329', '330', '331', '332', '333', '334', '335', '336', '337', '338', '339', '340', '341', '342', '343', '344', '345', '346', '347', '348', '349'],
  'GA': ['300', '301', '302', '303', '304', '305', '306', '307', '308', '309', '310', '311', '312', '313', '314', '315', '316', '317', '318', '319'],
  'HI': ['967', '968'],
  'ID': ['832', '833', '834', '835', '836', '837', '838'],
  'IL': ['600', '601', '602', '603', '604', '605', '606', '607', '608', '609', '610', '611', '612', '613', '614', '615', '616', '617', '618', '619', '620', '621', '622', '623', '624', '625', '626', '627', '628', '629'],
  'IN': ['460', '461', '462', '463', '464', '465', '466', '467', '468', '469', '470', '471', '472', '473', '474', '475', '476', '477', '478', '479'],
  'IA': ['500', '501', '502', '503', '504', '505', '506', '507', '508', '510', '511', '512', '513', '514', '515', '516', '520', '521', '522', '523', '524', '525', '526', '527', '528'],
  'KS': ['660', '661', '662', '664', '665', '666', '667', '668', '669', '670', '671', '672', '673', '674', '675', '676', '677', '678', '679'],
  'KY': ['400', '401', '402', '403', '404', '405', '406', '407', '408', '409', '410', '411', '412', '413', '414', '415', '416', '417', '418', '420', '421', '422', '423', '424', '425', '426', '427'],
  'LA': ['700', '701', '703', '704', '705', '706', '707', '708', '710', '711', '712', '713', '714'],
  'ME': ['039', '040', '041', '042', '043', '044', '045', '046', '047', '048', '049'],
  'MD': ['206', '207', '208', '209', '210', '211', '212'],
  'MA': ['010', '011', '012', '013', '014', '015', '016', '017', '018', '019', '020', '021', '022', '023', '024', '025', '026', '027'],
  'MI': ['480', '481', '482', '483', '484', '485', '486', '487', '488', '489', '490', '491', '492', '493', '494', '495', '496', '497', '498', '499'],
  'MN': ['550', '551', '553', '554', '555', '556', '557', '558', '559', '560', '561', '562', '563', '564', '565', '566', '567'],
  'MS': ['386', '387', '388', '389', '390', '391', '392', '393', '394', '395', '396', '397'],
  'MO': ['630', '631', '633', '634', '635', '636', '637', '638', '639', '640', '641', '644', '645', '646', '647', '648', '649', '650', '651', '652', '653', '654', '655', '656', '657', '658'],
  'MT': ['590', '591', '592', '593', '594', '595', '596', '597', '598', '599'],
  'NE': ['680', '681', '683', '684', '685', '686', '687', '688', '689', '690', '691', '692', '693'],
  'NV': ['889', '890', '891', '893', '894', '895', '897', '898'],
  'NH': ['030', '031', '032', '033', '034', '035', '036', '037', '038'],
  'NJ': ['070', '071', '072', '073', '074', '075', '076', '077', '078', '079', '080', '081', '082', '083', '084', '085', '086', '087', '088', '089'],
  'NM': ['870', '871', '872', '873', '874', '875', '877', '878', '879', '880', '881', '882', '883', '884'],
  'NY': ['100', '101', '102', '103', '104', '105', '106', '107', '108', '109', '110', '111', '112', '113', '114', '115', '116', '117', '118', '119', '120', '121', '122', '123', '124', '125', '126', '127', '128', '129', '130', '131', '132', '133', '134', '135', '136', '137', '138', '139', '140', '141', '142', '143', '144', '145', '146', '147', '148', '149'],
  'NC': ['270', '271', '272', '273', '274', '275', '276', '277', '278', '279', '280', '281', '282', '283', '284', '285', '286', '287', '288', '289'],
  'ND': ['580', '581', '582', '583', '584', '585', '586', '587', '588'],
  'OH': ['430', '431', '432', '433', '434', '435', '436', '437', '438', '439', '440', '441', '442', '443', '444', '445', '446', '447', '448', '449', '450', '451', '452', '453', '454', '455', '456', '457', '458'],
  'OK': ['730', '731', '733', '734', '735', '736', '737', '738', '739', '740', '741', '743', '744', '745', '746', '747', '748', '749'],
  'OR': ['970', '971', '972', '973', '974', '975', '977', '978', '979'],
  'PA': ['150', '151', '152', '153', '154', '155', '156', '157', '158', '159', '160', '161', '162', '163', '164', '165', '166', '167', '168', '169', '170', '171', '172', '173', '174', '175', '176', '177', '178', '179', '180', '181', '182', '183', '184', '185', '186', '187', '188', '189', '190', '191', '192', '193', '194', '195', '196'],
  'RI': ['028', '029'],
  'SC': ['290', '291', '292', '293', '294', '295', '296', '297', '298', '299'],
  'SD': ['570', '571', '572', '573', '574', '575', '576', '577'],
  'TN': ['370', '371', '372', '373', '374', '375', '376', '377', '378', '379', '380', '381', '382', '383', '384', '385'],
  'TX': ['750', '751', '752', '753', '754', '755', '756', '757', '758', '759', '760', '761', '762', '763', '764', '765', '766', '767', '768', '769', '770', '772', '773', '774', '775', '776', '777', '778', '779', '780', '781', '782', '783', '784', '785', '786', '787', '788', '789', '790', '791', '792', '793', '794', '795', '796', '797', '798', '799'],
  'UT': ['840', '841', '843', '844', '845', '846', '847'],
  'VT': ['050', '051', '052', '053', '054', '056', '057', '058', '059'],
  'VA': ['220', '221', '222', '223', '224', '225', '226', '227', '228', '229', '230', '231', '232', '233', '234', '235', '236', '237', '238', '239', '240', '241', '242', '243', '244', '245', '246'],
  'WA': ['980', '981', '982', '983', '984', '985', '986', '988', '989', '990', '991', '992', '993', '994'],
  'WV': ['247', '248', '249', '250', '251', '252', '253', '254', '255', '256', '257', '258', '259', '260', '261', '262', '263', '264', '265', '266', '267', '268'],
  'WI': ['530', '531', '532', '534', '535', '537', '538', '539', '540', '541', '542', '543', '544', '545', '546', '547', '548', '549'],
  'WY': ['820', '821', '822', '823', '824', '825', '826', '827', '828', '829', '830', '831']
};

// Valid US states and their abbreviations
const US_STATES = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
  'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
  'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
};

interface AddressValidationRequest {
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
}

interface AddressValidationResponse {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions?: {
    city?: string;
    state?: string;
    postal_code?: string;
  };
  confidence?: 'high' | 'medium' | 'low';
  verified_address?: {
    address_line1: string;
    city: string;
    state: string;
    postal_code: string;
  };
}

function validateUSAddress(address: AddressValidationRequest): AddressValidationResponse {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: any = {};
  let confidence: 'high' | 'medium' | 'low' = 'high';

  // Normalize inputs
  const state = address.state.toUpperCase().trim();
  const postalCode = address.postal_code.replace(/\D/g, '').substring(0, 5);
  const city = address.city.trim();
  const addressLine1 = address.address_line1.trim();

  // Validate required fields first
  if (!addressLine1) {
    errors.push('Address line 1 is required.');
  }
  if (!city) {
    errors.push('City is required.');
  }
  if (!state) {
    errors.push('State is required.');
  }
  if (!postalCode) {
    errors.push('ZIP code is required.');
  }

  // If basic fields are missing, return early
  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      warnings,
      confidence: 'low'
    };
  }

  // Validate state
  if (!US_STATES[state as keyof typeof US_STATES]) {
    errors.push('Invalid state abbreviation. Please use 2-letter state codes (e.g., CA, NY, TX).');
    confidence = 'low';
  }

  // Validate ZIP code format
  if (!/^\d{5}$/.test(postalCode)) {
    errors.push('ZIP code must be 5 digits.');
    confidence = 'low';
  } else {
    // Enhanced ZIP code validation using our database
    const zipInfo = getCityForZip(postalCode);
    
    if (!zipInfo) {
      // ZIP code not in our database - check basic prefix validation
      const zipPrefix = postalCode.substring(0, 3);
      const validPrefixes = STATE_ZIP_PREFIXES[state];
      
      if (validPrefixes && !validPrefixes.includes(zipPrefix)) {
        errors.push(`ZIP code ${postalCode} is not valid for ${state}.`);
        confidence = 'low';
      } else {
        warnings.push(`ZIP code ${postalCode} not found in our database. Please verify this is correct.`);
        confidence = 'medium';
      }
    } else {
      // ZIP code found in database - validate city and state match
      if (zipInfo.state !== state) {
        errors.push(`ZIP code ${postalCode} belongs to ${zipInfo.state}, not ${state}.`);
        suggestions.state = zipInfo.state;
        confidence = 'low';
      }
      
      // Check city match (case-insensitive, flexible matching)
      const normalizedInputCity = city.toLowerCase().replace(/[^a-z\s]/g, '').trim();
      const normalizedDbCity = zipInfo.city.toLowerCase().replace(/[^a-z\s]/g, '').trim();
      
      if (normalizedInputCity !== normalizedDbCity) {
        // Check for partial matches or common variations
        if (normalizedDbCity.includes(normalizedInputCity) || normalizedInputCity.includes(normalizedDbCity)) {
          warnings.push(`City "${city}" is close to "${zipInfo.city}" for ZIP ${postalCode}. Please verify.`);
          suggestions.city = zipInfo.city;
          confidence = 'medium';
        } else {
          // Check for similar cities in the same state
          const similarCities = findSimilarCity(city, state);
          if (similarCities.length > 0 && similarCities.includes(zipInfo.city)) {
            warnings.push(`Did you mean "${zipInfo.city}" instead of "${city}" for ZIP ${postalCode}?`);
            suggestions.city = zipInfo.city;
            confidence = 'medium';
          } else {
            errors.push(`City "${city}" does not match ZIP code ${postalCode}. Expected "${zipInfo.city}".`);
            suggestions.city = zipInfo.city;
            confidence = 'low';
          }
        }
      }
    }
  }

  // Address line validation
  if (addressLine1.length < 3) {
    warnings.push('Address seems very short. Please verify it\'s complete.');
    confidence = confidence === 'high' ? 'medium' : confidence;
  }

  // Check for invalid address patterns
  if (!/\d/.test(addressLine1)) {
    warnings.push('Address should typically include a street number.');
    confidence = confidence === 'high' ? 'medium' : confidence;
  }

  // Check for common address format issues
  const addressLower = addressLine1.toLowerCase();
  if (addressLower.includes('po box') || addressLower.includes('p.o. box') || addressLower.includes('p.o box')) {
    warnings.push('PO Box addresses may have shipping restrictions for some carriers.');
    confidence = confidence === 'high' ? 'medium' : confidence;
  }

  // Check for apartment/unit indicators without proper formatting
  const hasAptIndicator = /\b(apt|apartment|unit|ste|suite|#)\b/i.test(addressLine1);
  if (hasAptIndicator && !address.address_line2) {
    warnings.push('Consider moving apartment/unit information to Address Line 2 for better formatting.');
  }

  // Street name validation - basic check for common street types
  const streetTypes = ['st', 'street', 'ave', 'avenue', 'rd', 'road', 'blvd', 'boulevard', 'dr', 'drive', 'ln', 'lane', 'ct', 'court', 'pl', 'place', 'way', 'pkwy', 'parkway'];
  const hasStreetType = streetTypes.some(type => 
    addressLower.includes(` ${type} `) || 
    addressLower.endsWith(` ${type}`) ||
    addressLower.includes(` ${type}.`)
  );
  
  if (!hasStreetType && !addressLower.includes('po box')) {
    warnings.push('Address may be missing a street type (St, Ave, Rd, etc.).');
    confidence = confidence === 'high' ? 'medium' : confidence;
  }

  // Final validation result
  const isValid = errors.length === 0;
  
  // If we have good ZIP/city match and no errors, mark as high confidence
  if (isValid && getCityForZip(postalCode) && confidence !== 'low') {
    confidence = 'high';
  }

  return {
    valid: isValid,
    errors,
    warnings,
    suggestions: Object.keys(suggestions).length > 0 ? suggestions : undefined,
    confidence,
    verified_address: isValid && getCityForZip(postalCode) ? {
      address_line1: addressLine1,
      city: getCityForZip(postalCode)!.city,
      state: getCityForZip(postalCode)!.state,
      postal_code: postalCode
    } : undefined
  };
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { 
      address_line1, 
      address_line2, 
      city, 
      state, 
      postal_code, 
      country = 'US' 
    } = body as AddressValidationRequest;

    // Only validate US addresses for now
    if (country !== 'US') {
      return new Response(JSON.stringify({ 
        valid: true, 
        errors: [], 
        warnings: ['International address validation not available.'] 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const validation = validateUSAddress({
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country
    });

    return new Response(JSON.stringify(validation), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Address validation error:', error);
    return new Response(JSON.stringify({ 
      valid: false, 
      errors: ['Address validation service temporarily unavailable.'],
      warnings: []
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};