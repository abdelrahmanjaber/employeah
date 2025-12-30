# --- API LIMITS ---
RESULTS_PER_PAGE = 50 

# --- CONTINENT MAPPING ---
CONTINENT_MAP = {
    'de': 'Europe', 'gb': 'Europe', 'fr': 'Europe', 'it': 'Europe', 
    'es': 'Europe', 'nl': 'Europe', 'at': 'Europe', 'pl': 'Europe', 
    'be': 'Europe', 'ch': 'Europe',
    'us': 'North America', 'ca': 'North America', 'mx': 'North America',
    'br': 'South America',
    'au': 'Oceania', 'nz': 'Oceania',
    'in': 'Asia', 'sg': 'Asia',
    'za': 'Africa'
}

# --- COUNTRY NAMES ---
COUNTRY_MAP = {
    'de': 'Germany', 'gb': 'United Kingdom', 'fr': 'France', 'it': 'Italy',
    'es': 'Spain', 'nl': 'Netherlands', 'at': 'Austria', 'pl': 'Poland',
    'be': 'Belgium', 'ch': 'Switzerland',
    'us': 'United States', 'ca': 'Canada', 'mx': 'Mexico',
    'br': 'Brazil',
    'au': 'Australia', 'nz': 'New Zealand',
    'in': 'India', 'sg': 'Singapore',
    'za': 'South Africa'
}

# --- TARGET COUNTRIES ---
TARGET_COUNTRIES = ['us', 'gb', 'de']

# --- CITY TO COUNTRY MAPPING (New) ---
# This allows us to derive the Country from the City automatically.
CITY_TO_COUNTRY = {
    # --- GERMANY (de) ---
    "Berlin": "de", "Munich": "de", "Hamburg": "de", "Cologne": "de", "Frankfurt": "de",
    "Stuttgart": "de", "Düsseldorf": "de", "Leipzig": "de", "Dortmund": "de", "Essen": "de",
    "Bremen": "de", "Dresden": "de", "Hanover": "de", "Nuremberg": "de", "Karlsruhe": "de",
    "Bonn": "de", "Münster": "de", "Mannheim": "de", "Augsburg": "de", "Wiesbaden": "de",
    "Mönchengladbach": "de", "Gelsenkirchen": "de", "Braunschweig": "de", "Aachen": "de",
    "Kiel": "de", "Chemnitz": "de", "Halle": "de", "Magdeburg": "de", "Freiburg": "de",
    "Krefeld": "de", "Mainz": "de", "Lübeck": "de", "Erfurt": "de", "Oberhausen": "de",

    # --- UNITED KINGDOM (gb) ---
    "London": "gb", "Manchester": "gb", "Birmingham": "gb", "Leeds": "gb", "Glasgow": "gb",
    "Southampton": "gb", "Liverpool": "gb", "Newcastle": "gb", "Nottingham": "gb",
    "Sheffield": "gb", "Bristol": "gb", "Belfast": "gb", "Leicester": "gb", "Edinburgh": "gb",
    "Cardiff": "gb", "Coventry": "gb", "Bradford": "gb", "Hull": "gb", "Stoke-on-Trent": "gb",
    "Wolverhampton": "gb", "Plymouth": "gb", "Derby": "gb", "Reading": "gb", "Sunderland": "gb",
    "Luton": "gb", "Northampton": "gb", "Portsmouth": "gb", "Norwich": "gb", "Aberdeen": "gb",
    "Bournemouth": "gb", "Swindon": "gb", "Oxford": "gb", "Cambridge": "gb", "York": "gb",

    # --- UNITED STATES (us) ---
    "New York": "us", "Los Angeles": "us", "Chicago": "us", "Houston": "us", "Phoenix": "us",
    "Philadelphia": "us", "San Antonio": "us", "San Diego": "us", "Dallas": "us", "San Jose": "us",
    "Austin": "us", "Jacksonville": "us", "Fort Worth": "us", "Columbus": "us", "Charlotte": "us",
    "San Francisco": "us", "Indianapolis": "us", "Seattle": "us", "Denver": "us", "Washington DC": "us",
    "Boston": "us", "El Paso": "us", "Nashville": "us", "Detroit": "us", "Oklahoma City": "us",
    "Portland": "us", "Las Vegas": "us", "Memphis": "us", "Louisville": "us", "Baltimore": "us",
    "Milwaukee": "us", "Albuquerque": "us", "Tucson": "us", "Fresno": "us", "Mesa": "us",
    "Sacramento": "us", "Atlanta": "us", "Kansas City": "us", "Colorado Springs": "us", "Miami": "us",
    "Raleigh": "us", "Omaha": "us", "Long Beach": "us", "Virginia Beach": "us", "Oakland": "us",
    "Minneapolis": "us", "Tulsa": "us", "Arlington": "us", "Tampa": "us", "New Orleans": "us",
    "Wichita": "us", "Cleveland": "us", "Bakersfield": "us", "Aurora": "us", "Anaheim": "us",
    "Honolulu": "us", "Santa Ana": "us", "Riverside": "us", "Corpus Christi": "us", "Lexington": "us",
    "Henderson": "us", "Stockton": "us", "Saint Paul": "us", "Cincinnati": "us", "St. Louis": "us",
    "Pittsburgh": "us", "Greensboro": "us", "Anchorage": "us", "Plano": "us", "Lincoln": "us",
    "Orlando": "us", "Irvine": "us", "Newark": "us", "Toledo": "us", "Durham": "us", "Chula Vista": "us",
    "Fort Wayne": "us", "Jersey City": "us", "St. Petersburg": "us", "Laredo": "us", "Madison": "us",
    "Chandler": "us", "Buffalo": "us", "Lubbock": "us", "Scottsdale": "us", "Reno": "us", "Glendale": "us",
    "Gilbert": "us", "Winston-Salem": "us", "North Las Vegas": "us", "Norfolk": "us", "Chesapeake": "us",
    "Garland": "us", "Irving": "us", "Hialeah": "us", "Fremont": "us", "Boise": "us", "Richmond": "us",
    "Baton Rouge": "us", "Spokane": "us", "Des Moines": "us", "Tacoma": "us", "San Bernardino": "us",
    "Modesto": "us", "Fontana": "us", "Santa Clarita": "us", "Birmingham": "us", "Oxnard": "us",
    "Fayetteville": "us", "Moreno Valley": "us", "Rochester": "us", "Glendale": "us", "Huntington Beach": "us",
    "Salt Lake City": "us", "Grand Rapids": "us", "Amarillo": "us", "Yonkers": "us", "Aurora": "us",
    "Montgomery": "us", "Akron": "us", "Little Rock": "us", "Huntsville": "us", "Augusta": "us",
    "Port St. Lucie": "us", "Grand Prairie": "us", "Columbus": "us", "Tallahassee": "us", "Overland Park": "us",
    "Tempe": "us", "McKinney": "us", "Mobile": "us", "Cape Coral": "us", "Shreveport": "us", "Frisco": "us",
    "Knoxville": "us", "Worcester": "us", "Brownsville": "us", "Vancouver": "us", "Fort Lauderdale": "us",
    "Sioux Falls": "us", "Ontario": "us", "Chattanooga": "us", "Providence": "us", "Newport News": "us",
    "Rancho Cucamonga": "us", "Santa Rosa": "us", "Oceanside": "us", "Salem": "us", "Elk Grove": "us",
    "Garden Grove": "us", "Pembroke Pines": "us", "Peoria": "us", "Eugene": "us", "Corona": "us",
    "Cary": "us", "Springfield": "us", "Fort Collins": "us", "Jackson": "us", "Alexandria": "us",
    "Hayward": "us", "Lancaster": "us", "Lakewood": "us", "Clarksville": "us", "Palmdale": "us",
    "Salinas": "us", "Springfield": "us", "Hollywood": "us", "Pasadena": "us", "Sunnyvale": "us",
    "Macon": "us", "Kansas City": "us", "Pomona": "us", "Escondido": "us", "Killeen": "us",
    "Naperville": "us", "Joliet": "us", "Bellevue": "us", "Rockford": "us", "Savannah": "us",
    "Paterson": "us", "Torrance": "us", "Bridgeport": "us", "McAllen": "us", "Mesquite": "us",
    "Syracuse": "us", "Midland": "us", "Pasadena": "us", "Murfreesboro": "us", "Miramar": "us",
    "Denton": "us", "Fullerton": "us", "Olathe": "us", "Columbia": "us", "Thornton": "us",
    "Roseville": "us", "Waco": "us", "West Jordan": "us", "Carrollton": "us", "Surprise": "us",
    "Charleston": "us", "Warren": "us", "Billings": "us", "Stamford": "us", "Gainesville": "us",
    "West Covina": "us", "Visalia": "us", "Cedar Rapids": "us", "New Haven": "us", "Elizabeth": "us",
    "Kent": "us", "Victorville": "us", "Santa Clara": "us", "Topeka": "us", "Thousand Oaks": "us",
    "Simi Valley": "us", "Columbia": "us", "Vallejo": "us", "Fargo": "us", "Athens": "us",
    "Norman": "us", "Allentown": "us", "Abilene": "us", "Wilmington": "us", "Hartford": "us",
    "Berkeley": "us", "Round Rock": "us", "Ann Arbor": "us", "Independence": "us", "Provo": "us",
    "Lansing": "us", "Pearland": "us", "Fairfield": "us", "Rochester": "us", "West Palm Beach": "us",
    "Arvada": "us", "Carlsbad": "us", "Westminster": "us", "Miami Gardens": "us", "Temecula": "us",
    "Costa Mesa": "us", "Burbank": "us", "Inglewood": "us", "Elgin": "us", "Palo Alto": "us", 
    "Mountain View": "us", "Redmond": "us", "Menlo Park": "us", "Cupertino": "us", "Santa Monica": "us", 
    "Remote": "Remote"
}

# Pre-sort cities by length (longest first) to prevent partial matches
# e.g. Match "New York" before "York"
SORTED_CITIES = sorted(CITY_TO_COUNTRY.keys(), key=len, reverse=True)

COUNTRY_BLOCKLIST = {
    'Germany', 'Deutschland', 'DE',
    'United Kingdom', 'Great Britain', 'UK', 'GB',
    'United States', 'USA', 'US', 'America',
    'Remote', 'Europe', 'North America'
}