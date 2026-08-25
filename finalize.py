import re
import os

def clean_file(path):
    with open(path, 'r') as f:
        c = f.read()
    
    # Deduplicate embedded prop in interface
    # Pattern: embedded?: boolean; (potentially with JSDoc)
    c = re.sub(r'(/\*\*.*?\*/\s*)?embedded\?: boolean;\s*(/\*\*.*?\*/\s*)?embedded\?: boolean;', 
               r'/** Hides the panel\'s own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;', c, flags=re.DOTALL)
    
    # Fix any double-brace closing like }}
    c = c.replace('</Box>}}', '</Box>}')
    
    with open(path, 'w') as f:
        f.write(c)

files = [
    'src/components/performance/PIPManagementPanel.tsx',
    'src/components/performance/UnifiedRecognitionPanel.tsx',
    'src/components/performance/HappinessScoreWidget.tsx',
    'src/components/performance/PulseSurveyPanel.tsx',
    'src/components/performance/WellbeingDashboard.tsx',
    'src/components/performance/engagement/PeerNominationsPanel.tsx',
    'src/components/performance/engagement/MentorshipMatchingPanel.tsx',
    'src/components/performance/engagement/DevelopmentBudgetTracker.tsx'
]

for f in files:
    clean_file(f)
