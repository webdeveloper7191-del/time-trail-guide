export interface SeekCategory {
  name: string;
  subCategories: string[];
}

export const seekCategories: SeekCategory[] = [
  {
    name: "Accounting",
    subCategories: ["Accounts Officers/Clerks", "Accounts Payable", "Accounts Receivable", "Analysis & Reporting", "Assistant Accountants", "Audit - External", "Audit - Internal", "Bookkeeping", "Business Services & Corporate Advisory", "Company Secretaries", "Compliance & Risk", "Cost Accounting", "Financial Accounting & Reporting", "Financial Managers & Controllers", "Forensic Accounting & Investigation", "General Accounting", "Inventory & Fixed Assets", "Management Accounting & Budgeting", "Payroll", "Accounts Administration", "Strategy & Planning", "Systems Accounting & IT Audit", "Taxation", "Treasury", "Other"]
  },
  {
    name: "Administration & Office Support",
    subCategories: ["Administrative Assistants", "Contracts Administration", "Data Entry & Word Processing", "Office Management", "PA, EA & Secretarial", "Receptionists", "Records Management & Document Control", "Other"]
  },
  {
    name: "Advertising, Arts & Media",
    subCategories: ["Agency Management", "Art Direction", "Copywriting", "Editing & Proofreading", "Events Management", "Journalism & Writing", "Media Strategy, Planning & Buying", "Performing Arts", "Photography", "Presentation & Radio", "Production, Editorial & Design", "Promotions", "Public Relations & Corporate Affairs", "Other"]
  },
  {
    name: "Banking & Financial Services",
    subCategories: ["Analysis & Reporting", "Client Service", "Compliance & Risk", "Corporate Banking", "Credit", "Financial Planning", "Funds Management", "Lending - Commercial", "Lending - Personal", "Mortgage Broking", "Operations", "Settlements", "Stockbroking", "Treasury", "Other"]
  },
  {
    name: "Call Centre & Customer Service",
    subCategories: ["Collections", "Customer Service - Call Centre", "Customer Service - Customer Facing", "Management", "Sales - Inbound", "Sales - Outbound", "Supervisors", "Other"]
  },
  {
    name: "CEO & General Management",
    subCategories: ["Board Appointments", "CEO", "General/Business Unit Management", "Other"]
  },
  {
    name: "Community Services & Development",
    subCategories: ["Aged & Disability Support", "Child Welfare, Youth & Family Services", "Community Development", "Employment Services", "Fundraising", "Housing & Homelessness Services", "Indigenous & Multicultural Services", "Volunteer Coordination & Support", "Other"]
  },
  {
    name: "Construction",
    subCategories: ["Foreperson/Supervisors", "Health, Safety & Environment", "Plant & Machinery Operations", "Project Management", "Quality Assurance & Control", "Quantity Surveying", "Surveying", "Other"]
  },
  {
    name: "Consulting & Strategy",
    subCategories: ["Corporate Development", "Management Consulting", "Policy & Strategy", "Other"]
  },
  {
    name: "Design & Architecture",
    subCategories: ["Architecture", "Fashion Design", "Graphic Design", "Industrial Design", "Interior Design", "Landscape Architecture", "Urban Design & Planning", "Web & Interaction Design", "Other"]
  },
  {
    name: "Education & Training",
    subCategories: ["Childcare & After School Care", "Library Services & Information Management", "Management - Schools", "Management - Universities", "Management - Vocational", "Teaching - Early Childhood", "Teaching - Primary", "Teaching - Secondary", "Teaching - Tertiary", "Teaching - Vocational", "Other"]
  },
  {
    name: "Engineering",
    subCategories: ["Aeronautical Engineering", "Automotive Engineering", "Biomedical Engineering", "Building Services Engineering", "Chemical Engineering", "Civil/Structural Engineering", "Electrical/Electronic Engineering", "Environmental Engineering", "Maintenance Engineering", "Management", "Materials Engineering", "Mechanical Engineering", "Mechatronics & Robotics Engineering", "Mining Engineering", "Project Management", "Systems Engineering", "Water & Waste Engineering", "Other"]
  },
  {
    name: "Farming, Animals & Conservation",
    subCategories: ["Agronomy & Farm Management", "Animal Care & Welfare", "Conservation, Parks & Wildlife", "Fishing & Marine", "Horticulture", "Other"]
  },
  {
    name: "Government & Defence",
    subCategories: ["Government - Federal", "Government - Local", "Government - State", "Military", "Other"]
  },
  {
    name: "Healthcare & Medical",
    subCategories: ["Ambulance/Paramedics", "Chiropractic & Osteopathic", "Dental", "Dietitians", "General Practitioners", "Management", "Medical Administration", "Medical Imaging", "Natural Therapies & Alternative Medicine", "Nursing - A&E, Critical Care & ICU", "Nursing - Aged Care", "Nursing - Community, Maternal & Child Health", "Nursing - Educators & Facilitators", "Nursing - General Medical & Surgical", "Nursing - Management", "Nursing - Midwifery", "Nursing - Oncology & Palliative Care", "Nursing - Paediatric & Child Health", "Nursing - Psychiatric, Mental Health & Substance Abuse", "Nursing - Theatre & Recovery", "Occupational Therapy", "Optometry & Ophthalmology", "Pathology", "Pharmaceutical/Medical Sales", "Pharmacy", "Physiotherapy, OT & Rehabilitation", "Psychology, Counselling & Social Work", "Speech Therapy", "Other"]
  },
  {
    name: "Hospitality & Tourism",
    subCategories: ["Bar & Beverage Staff", "Chefs/Cooks", "Front Office & Guest Services", "Gaming", "Housekeeping", "Kitchen & Sandwich Hands", "Management", "Pastry & Roasting", "Reservations", "Tour Guides", "Waiting Staff", "Other"]
  },
  {
    name: "Human Resources & Recruitment",
    subCategories: ["Consulting & Generalist HR", "Industrial Relations", "Learning & Development", "Occupational Health & Safety", "Recruitment - Agency", "Recruitment - Internal", "Remuneration & Benefits", "Other"]
  },
  {
    name: "Information & Communication Technology",
    subCategories: ["Architects", "Business/Systems Analysts", "Cloud Computing", "Computer Operators", "Database Development & Administration", "Engineering - Hardware", "Engineering - Network", "Engineering - Software", "Help Desk & IT Support", "Management", "Networks & Systems Administration", "Product Management & Development", "Programme & Project Management", "Security", "Team Leaders", "Technical Writing", "Telecommunications", "Testing & Quality Assurance", "Web Development & Production", "Other"]
  },
  {
    name: "Insurance & Superannuation",
    subCategories: ["Actuarial", "Claims", "Compliance & Risk", "Management", "Superannuation", "Underwriting", "Other"]
  },
  {
    name: "Legal",
    subCategories: ["Banking & Financial Services Law", "Construction Law", "Corporate & Commercial Law", "Criminal Law", "Environment & Planning Law", "Family Law", "Generalists - In-house", "Generalists - Private Practice", "Industrial Relations & Employment Law", "Intellectual Property Law", "Legal Professionals", "Legal Secretaries", "Litigation & Dispute Resolution", "Personal Injury Law", "Property Law", "Tax Law", "Other"]
  },
  {
    name: "Manufacturing, Transport & Logistics",
    subCategories: ["Assembly & Process Work", "Couriers, Drivers & Postal Services", "Fleet Management", "Freight/Cargo Forwarding", "Import/Export & Customs", "Inventory Management", "Machine Operators", "Management", "Production, Planning & Scheduling", "Public Transport & Taxi Services", "Purchasing, Procurement & Inventory", "Quality Assurance & Control", "Road Transport", "Warehousing, Storage & Distribution", "Other"]
  },
  {
    name: "Marketing & Communications",
    subCategories: ["Brand Management", "Digital & Search Marketing", "Direct Marketing & CRM", "Event Management", "Internal Communications", "Market Research & Analysis", "Marketing Communications", "Marketing Assistants", "Marketing Manager", "Product Management & Development", "Public Relations & Corporate Affairs", "Trade Marketing", "Other"]
  },
  {
    name: "Mining, Resources & Energy",
    subCategories: ["Analysis & Reporting", "Health, Safety & Environment", "Management", "Mining - Engineering & Maintenance", "Mining - Exploration & Geoscience", "Mining - Operations", "Natural Resources & Water", "Oil & Gas - Drilling", "Oil & Gas - Engineering & Maintenance", "Oil & Gas - Exploration & Geoscience", "Oil & Gas - Operations", "Oil & Gas - Production & Refinement", "Power Generation & Distribution", "Surveying", "Other"]
  },
  {
    name: "Real Estate & Property",
    subCategories: ["Administration", "Body Corporate & Strata Management", "Commercial Sales, Leasing & Property Mgmt", "Design & Build", "Facilities Management", "Landscaping & Garden Maintenance", "Real Estate & Property Law", "Residential Leasing & Property Management", "Residential Sales", "Retail & Shopping Centre Management", "Valuation", "Other"]
  },
  {
    name: "Retail & Consumer Products",
    subCategories: ["Management - Area/Multi-site", "Management - Department/Assistant", "Management - Store", "Merchandisers", "Planning", "Purchasing", "Retail Assistants", "Other"]
  },
  {
    name: "Sales",
    subCategories: ["Account & Relationship Management", "Business Development Manager", "Customer Service & Support", "Management", "New Business Development", "Sales Representatives/Consultants", "Other"]
  },
  {
    name: "Science & Technology",
    subCategories: ["Biological & Biomedical Sciences", "Biotechnology", "Chemistry & Physics", "Environmental, Earth & Geosciences", "Food Technology & Safety", "Laboratory & Technical Services", "Materials Sciences", "Mathematics, Statistics & Information Sciences", "Other"]
  },
  {
    name: "Self Employment",
    subCategories: ["Other"]
  },
  {
    name: "Sport & Recreation",
    subCategories: ["Coaching & Instruction", "Fitness & Personal Training", "Management", "Other"]
  },
  {
    name: "Trades & Services",
    subCategories: ["Air Conditioning & Refrigeration", "Automotive Trades", "Bakers & Pastry Cooks", "Building Trades", "Butchers", "Carpentry & Cabinet Making", "Cleaning Services", "Electricians", "Fitters, Turners & Machinists", "Floristry", "Gardening & Landscaping", "Hair & Beauty Services", "Locksmiths", "Maintenance & Handyperson Services", "Nannies & Babysitters", "Painters & Sign Writers", "Plumbing", "Printing & Publishing Services", "Security Services", "Tailors & Dressmakers", "Technicians", "Upholstery & Textile Trades", "Welding & Boiler Making", "Other"]
  }
];
