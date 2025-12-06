# locations.py

# --- API LIMITS ---
RESULTS_PER_PAGE = 50 
MAX_PAGES_PER_SEARCH = 1 

# --- TARGET COUNTRIES ---
# ⚠️ IMPORTANT: The scraper ONLY saves jobs for these country codes.
# If you want to scrape the whole world, add more codes here.
TARGET_COUNTRIES = [
    'us', 'gb', 'de',       # Core: USA, UK, Germany
    'ca', 'fr', 'nl', 'es', # Europe/North America: Canada, France, Netherlands, Spain
    'ch', 'se', 'au', 'sg', # Global: Switzerland, Sweden, Australia, Singapore
    'in', 'br', 'mx'        # Emerging: India, Brazil, Mexico
]

# --- CONTINENT MAPPING ---
CONTINENT_MAP = {
    'de': 'Europe', 'gb': 'Europe', 'fr': 'Europe', 'it': 'Europe', 
    'es': 'Europe', 'nl': 'Europe', 'at': 'Europe', 'pl': 'Europe', 
    'be': 'Europe', 'ch': 'Europe', 'se': 'Europe', 'no': 'Europe', 
    'dk': 'Europe', 'ie': 'Europe', 'pt': 'Europe',
    'us': 'North America', 'ca': 'North America', 'mx': 'North America',
    'br': 'South America', 'ar': 'South America',
    'au': 'Oceania', 'nz': 'Oceania',
    'in': 'Asia', 'sg': 'Asia', 'jp': 'Asia', 'cn': 'Asia', 'kr': 'Asia',
    'za': 'Africa', 'ng': 'Africa',
    'Remote': 'Remote'
}

# --- COUNTRY NAMES ---
COUNTRY_MAP = {
    'de': 'Germany', 'gb': 'United Kingdom', 'fr': 'France', 'it': 'Italy',
    'es': 'Spain', 'nl': 'Netherlands', 'at': 'Austria', 'pl': 'Poland',
    'be': 'Belgium', 'ch': 'Switzerland', 'se': 'Sweden', 'no': 'Norway',
    'dk': 'Denmark', 'ie': 'Ireland', 'pt': 'Portugal',
    'us': 'United States', 'ca': 'Canada', 'mx': 'Mexico',
    'br': 'Brazil', 'ar': 'Argentina',
    'au': 'Australia', 'nz': 'New Zealand',
    'in': 'India', 'sg': 'Singapore', 'jp': 'Japan', 'cn': 'China', 'kr': 'South Korea',
    'za': 'South Africa', 'ng': 'Nigeria',
    'Remote': 'Remote'
}

# --- CITY TO COUNTRY MAPPING ---
CITY_TO_COUNTRY = {
    # --- GERMANY (de) ---
    "Berlin": "de", "Munich": "de", "Hamburg": "de", "Cologne": "de", "Frankfurt": "de",
    "Stuttgart": "de", "Düsseldorf": "de", "Leipzig": "de", "Dortmund": "de", "Essen": "de",
    "Bremen": "de", "Dresden": "de", "Hanover": "de", "Nuremberg": "de", "Karlsruhe": "de",
    "Bonn": "de", "Münster": "de", "Mannheim": "de", "Augsburg": "de", "Wiesbaden": "de",
    "Aachen": "de", "Heidelberg": "de", "Darmstadt": "de",

    # --- UNITED KINGDOM (gb) ---
    "London": "gb", "Manchester": "gb", "Birmingham": "gb", "Leeds": "gb", "Glasgow": "gb",
    "Edinburgh": "gb", "Bristol": "gb", "Cambridge": "gb", "Oxford": "gb", "Belfast": "gb",
    "Newcastle": "gb", "Liverpool": "gb", "Sheffield": "gb", "Nottingham": "gb", "Cardiff": "gb",
    "Brighton": "gb", "Reading": "gb", "Bath": "gb",

    # --- FRANCE (fr) ---
    "Paris": "fr", "Lyon": "fr", "Marseille": "fr", "Toulouse": "fr", "Nice": "fr",
    "Nantes": "fr", "Strasbourg": "fr", "Montpellier": "fr", "Bordeaux": "fr", "Lille": "fr",
    "Rennes": "fr", "Sophia Antipolis": "fr",

    # --- CANADA (ca) ---
    "Toronto": "ca", "Vancouver": "ca", "Montreal": "ca", "Ottawa": "ca", "Calgary": "ca",
    "Edmonton": "ca", "Quebec City": "ca", "Winnipeg": "ca", "Hamilton": "ca", "Kitchener": "ca",
    "Waterloo": "ca", "Victoria": "ca", "Halifax": "ca",

    # --- NETHERLANDS (nl) ---
    "Amsterdam": "nl", "Rotterdam": "nl", "The Hague": "nl", "Utrecht": "nl", "Eindhoven": "nl",
    "Groningen": "nl",

    # --- SWITZERLAND (ch) ---
    "Zurich": "ch", "Geneva": "ch", "Basel": "ch", "Lausanne": "ch", "Bern": "ch", "Zug": "ch",

    # --- SPAIN (es) ---
    "Madrid": "es", "Barcelona": "es", "Valencia": "es", "Seville": "es", "Bilbao": "es", "Malaga": "es",

    # --- IRELAND (ie) ---
    "Dublin": "ie", "Cork": "ie", "Galway": "ie", "Limerick": "ie",

    # --- SWEDEN (se) ---
    "Stockholm": "se", "Gothenburg": "se", "Malmö": "se",

    # --- AUSTRALIA (au) ---
    "Sydney": "au", "Melbourne": "au", "Brisbane": "au", "Perth": "au", "Adelaide": "au",
    "Canberra": "au",

    # --- INDIA (in) ---
    "Bangalore": "in", "Bengaluru": "in", "Mumbai": "in", "Delhi": "in", "Hyderabad": "in",
    "Chennai": "in", "Pune": "in", "Gurgaon": "in", "Noida": "in", "Kolkata": "in",

    # --- SINGAPORE (sg) ---
    "Singapore": "sg",

    # --- BRAZIL (br) ---
    "São Paulo": "br", "Sao Paulo": "br", "Rio de Janeiro": "br", "Brasília": "br",
    "Belo Horizonte": "br", "Curitiba": "br", "Florianópolis": "br",

    # --- MEXICO (mx) ---
    "Mexico City": "mx", "Guadalajara": "mx", "Monterrey": "mx",

    # --- UNITED STATES (us) - Major Tech Hubs Only ---
    "New York": "us", "San Francisco": "us", "Los Angeles": "us", "Chicago": "us", "Boston": "us",
    "Seattle": "us", "Austin": "us", "Denver": "us", "Washington DC": "us", "San Jose": "us",
    "San Diego": "us", "Atlanta": "us", "Dallas": "us", "Houston": "us", "Miami": "us",
    "Philadelphia": "us", "Phoenix": "us", "Portland": "us", "Minneapolis": "us", "Detroit": "us",
    "Raleigh": "us", "Durham": "us", "Salt Lake City": "us", "Boulder": "us", "Palo Alto": "us",
    "Menlo Park": "us", "Mountain View": "us", "Sunnyvale": "us", "Santa Clara": "us",
    "Cupertino": "us", "Redwood City": "us", "Oakland": "us", "Berkeley": "us", "San Mateo": "us",
    "Irvine": "us", "Santa Monica": "us", "Venice": "us", "Nashville": "us", "Pittsburgh": "us",
    "Las Vegas": "us", "Orlando": "us", "Charlotte": "us", "Indianapolis": "us", "Columbus": "us",
    "Kansas City": "us", "St. Louis": "us", "Tampa": "us", "Baltimore": "us", "Cincinnati": "us",
    
    # --- REMOTE ---
    "Remote": "Remote", "Work from home": "Remote", "Anywhere": "Remote"
}

# --- SORTED CITIES ---
# Sort by length (longest first) to match "New York" before "York"
SORTED_CITIES = sorted(CITY_TO_COUNTRY.keys(), key=len, reverse=True)

# --- BLOCKLIST ---
COUNTRY_BLOCKLIST = {
    'Europe', 'North America', 'South America', 'Asia', 'Africa', 'Oceania'
}