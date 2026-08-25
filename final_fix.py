import sys
import re
import os

def fix_pip():
    path = 'src/components/performance/PIPManagementPanel.tsx'
    with open(path, 'r') as f:
        c = f.read()
    
    # Fix interface
    c = re.sub(r'interface PIPManagementPanelProps \{[\s\S]*?\}', 
               'interface PIPManagementPanelProps {\n  /** Hides the panel\'s own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;\n  staff: StaffMember[];\n  currentUserId: string;\n}', c)
    
    # Fix function signature
    c = c.replace('export function PIPManagementPanel({ staff, currentUserId, embedded = false }: PIPManagementPanelProps)', 
                  'export function PIPManagementPanel({ staff, currentUserId, embedded = false }: PIPManagementPanelProps)')
    
    # Fix header
    c = c.replace('justifyContent={embedded ? "flex-end" : "space-between"}', 'justifyContent={embedded ? "flex-end" : "space-between"}')
    c = re.sub(r'\{!embedded && <Box>[\s\S]*?</Box>\}\}', '{!embedded && <Box>\n            <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>\n              <Box sx={{ p: { xs: 0.75, md: 1 }, borderRadius: 1.5, bgcolor: \'warning.light\', display: \'flex\' }}>\n                <AlertTriangle size={18} style={{ color: \'var(--warning)\' }} />\n              </Box>\n              <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: \'1rem\', md: \'1.25rem\' } }}>\n                Performance Improvement Plans\n              </Typography>\n            </Stack>\n            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: \'none\', sm: \'block\' } }}>\n              Manage formal improvement plans with milestones and documentation\n            </Typography>\n          </Box>}', c)

    # Wrap stats
    c = c.replace('{/* Stats */}\n        <Box sx={{ display: \'grid\', gridTemplateColumns: { xs: \'repeat(2, 1fr)\', sm: \'repeat(4, 1fr)\' }, gap: { xs: 1.5, md: 2 } }}>', 
                  '{/* Stats */}\n        {!embedded && <Box sx={{ display: \'grid\', gridTemplateColumns: { xs: \'repeat(2, 1fr)\', sm: \'repeat(4, 1fr)\' }, gap: { xs: 1.5, md: 2 } }}>')
    # Find the end of that Box
    # It ends at line 520 approx
    # I'll just look for the first </Box> after the Stats marker
    stats_pos = c.find('{/* Stats */}')
    box_end_pos = c.find('</Box>', c.find('</Card>', stats_pos + 400)) + 6
    c = c[:box_end_pos] + "}" + c[box_end_pos:]

    with open(path, 'w') as f:
        f.write(c)

def fix_recognition():
    path = 'src/components/performance/UnifiedRecognitionPanel.tsx'
    with open(path, 'r') as f:
        c = f.read()
    c = re.sub(r'interface UnifiedRecognitionPanelProps \{[\s\S]*?\}', 
               'interface UnifiedRecognitionPanelProps {\n  /** Hides the panel\'s own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;\n  staff: StaffMember[];\n  currentUserId: string;\n}', c)
    c = c.replace('export function UnifiedRecognitionPanel({ staff, currentUserId, embedded = false }: UnifiedRecognitionPanelProps)', 
                  'export function UnifiedRecognitionPanel({ staff, currentUserId, embedded = false }: UnifiedRecognitionPanelProps)')
    
    # Fix header
    c = c.replace('justifyContent={embedded ? "flex-end" : "space-between"}', 'justifyContent={embedded ? "flex-end" : "space-between"}')
    # Cleanup broken wrapper
    c = re.sub(r'\{!embedded && <Box>[\s\S]*?</Box>', r'{!embedded && <Box>\n          <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>\n            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: \'hsl(var(--primary) / 0.1)\', display: \'flex\' }}>\n              <Sparkles size={20} style={{ color: \'hsl(var(--primary))\' }} />\n            </Box>\n            <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: \'1.1rem\', md: \'1.25rem\' } }}>\n              Recognition & Rewards\n            </Typography>\n          </Stack>\n          <Typography variant="body2" sx={{ color: \'hsl(var(--muted-foreground))\' }}>\n            Celebrate achievements and reward your team\n          </Typography>\n        </Box>}', c, count=1)
    
    # Wrap summary cards
    c = c.replace('{!embedded && <Stack direction={{ xs: \'column\', sm: \'row\' }} spacing={2}>', '{!embedded && <Stack direction={{ xs: \'column\', sm: \'row\' }} spacing={2}>')
    # ensure it ends correctly
    # looking for the last </Stack> before Tabs
    tabs_pos = c.find('<Tabs')
    stack_end_pos = c.rfind('</Stack>', 0, tabs_pos) + 8
    if c[stack_end_pos] != '}':
        c = c[:stack_end_pos] + "}" + c[stack_end_pos:]

    with open(path, 'w') as f:
        f.write(c)

def fix_happiness():
    path = 'src/components/performance/HappinessScoreWidget.tsx'
    with open(path, 'r') as f:
        c = f.read()
    c = re.sub(r'interface HappinessScoreWidgetProps \{[\s\S]*?\}', 
               'interface HappinessScoreWidgetProps {\n  /** Hides the panel\'s own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;\n  currentUserId: string;\n  isManager?: boolean;\n}', c)
    # Header
    c = c.replace('justifyContent={embedded ? "flex-end" : "space-between"}', 'justifyContent={embedded ? "flex-end" : "space-between"}')
    c = re.sub(r'\{!embedded && <Box>[\s\S]*?</Box>\}', r'{!embedded && <Box>\n          <Typography variant="h6" fontWeight={600} sx={{ display: \'flex\', alignItems: \'center\', gap: 1 }}>\n            <Smile className="h-5 w-5 text-primary" />\n            Happiness Score\n          </Typography>\n          <Typography variant="body2" color="text.secondary">\n            Monthly team happiness tracking\n          </Typography>\n        </Box>}', c)
    # Cards
    c = c.replace('{!embedded && <Stack direction={{ xs: \'column\', md: \'row\' }} spacing={3}>', '{!embedded && <Stack direction={{ xs: \'column\', md: \'row\' }} spacing={3}>')
    trend_chart_pos = c.find('{/* Trend Chart */}')
    stack_end_pos = c.rfind('</Stack>', 0, trend_chart_pos) + 8
    if c[stack_end_pos] != '}':
        c = c[:stack_end_pos] + "}" + c[stack_end_pos:]
    with open(path, 'w') as f:
        f.write(c)

def fix_pulse():
    path = 'src/components/performance/PulseSurveyPanel.tsx'
    with open(path, 'r') as f:
        c = f.read()
    c = re.sub(r'interface PulseSurveyPanelProps \{[\s\S]*?\}', 
               'interface PulseSurveyPanelProps {\n  /** Hides the panel\'s own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;\n  currentUserId: string;\n}', c)
    # Header
    c = c.replace('justifyContent={embedded ? "flex-end" : "space-between"}', 'justifyContent={embedded ? "flex-end" : "space-between"}')
    c = re.sub(r'\{!embedded && <Box>[\s\S]*?</Box>\}', r'{!embedded && <Box>\n          <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>\n            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: \'primary.light\', display: \'flex\' }}>\n              <BarChart3 size={20} style={{ color: \'var(--primary)\' }} />\n            </Box>\n            <Typography variant="h6" fontWeight={600}>\n              Pulse Surveys\n            </Typography>\n          </Stack>\n          <Typography variant="body2" color="text.secondary">\n            Gather continuous feedback and measure employee engagement\n          </Typography>\n        </Box>}', c)
    # ENPS Card
    c = c.replace('{!embedded && renderENPSCard()}', '{!embedded && renderENPSCard()}')
    with open(path, 'w') as f:
        f.write(c)

def fix_wellbeing():
    path = 'src/components/performance/WellbeingDashboard.tsx'
    with open(path, 'r') as f:
        c = f.read()
    c = re.sub(r'interface WellbeingDashboardProps \{[\s\S]*?\}', 
               'interface WellbeingDashboardProps {\n  /** Hides the panel\'s own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;\n  currentUserId: string;\n}', c)
    # Header
    c = c.replace('justifyContent={embedded ? "flex-end" : "space-between"}', 'justifyContent={embedded ? "flex-end" : "space-between"}')
    c = re.sub(r'\{!embedded && <Box>[\s\S]*?</Box>\}', r'{!embedded && <Box>\n          <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>\n            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: \'primary.light\', display: \'flex\' }}>\n              <Activity size={20} style={{ color: \'var(--primary)\' }} />\n            </Box>\n            <Typography variant="h6" fontWeight={600}>\n              Wellbeing Dashboard\n            </Typography>\n          </Stack>\n          <Typography variant="body2" color="text.secondary">\n            Monitor team health and burnout risk indicators\n          </Typography>\n        </Box>}', c)
    # Summary cards
    c = c.replace('{!embedded && renderSummaryCards()}', '{!embedded && renderSummaryCards()}')
    with open(path, 'w') as f:
        f.write(c)

def fix_nominations():
    path = 'src/components/performance/engagement/PeerNominationsPanel.tsx'
    with open(path, 'r') as f:
        c = f.read()
    c = re.sub(r'interface PeerNominationsProps \{[\s\S]*?\}', 
               'interface PeerNominationsProps {\n  /** Hides the panel\'s own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;\n  staff: StaffMember[];\n  currentUserId: string;\n}', c)
    # Header
    c = c.replace('justifyContent={embedded ? "flex-end" : "space-between"}', 'justifyContent={embedded ? "flex-end" : "space-between"}')
    c = re.sub(r'\{!embedded && <Box>[\s\S]*?</Box>\}', r'{!embedded && <Box>\n          <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>\n            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: \'primary.light\', display: \'flex\' }}>\n              <Users size={20} style={{ color: \'var(--primary)\' }} />\n            </Box>\n            <Typography variant="h6" fontWeight={600}>\n              Peer Nominations\n            </Typography>\n          </Stack>\n          <Typography variant="body2" color="text.secondary">\n            Nominate peers for 360° feedback reviews\n          </Typography>\n        </Box>}', c)
    # Stats
    c = c.replace('{!embedded && <Box sx={{ display: \'grid\', gridTemplateColumns: { xs: \'repeat(2, 1fr)\', md: \'repeat(4, 1fr)\' }, gap: 2 }}>', 
                  '{!embedded && <Box sx={{ display: \'grid\', gridTemplateColumns: { xs: \'repeat(2, 1fr)\', md: \'repeat(4, 1fr)\' }, gap: 2 }}>')
    filters_pos = c.find('{/* Filters */}')
    stack_end_pos = c.rfind('</Box>', 0, filters_pos) + 6
    if c[stack_end_pos] != '}':
        c = c[:stack_end_pos] + "}" + c[stack_end_pos:]
    with open(path, 'w') as f:
        f.write(c)

def fix_mentorship():
    path = 'src/components/performance/engagement/MentorshipMatchingPanel.tsx'
    with open(path, 'r') as f:
        c = f.read()
    c = re.sub(r'interface MentorshipMatchingProps \{[\s\S]*?\}', 
               'interface MentorshipMatchingProps {\n  /** Hides the panel\'s own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;\n  staff: StaffMember[];\n  currentUserId: string;\n}', c)
    # Header
    c = c.replace('justifyContent={embedded ? "flex-end" : "space-between"}', 'justifyContent={embedded ? "flex-end" : "space-between"}')
    # Cleanup broken header title box
    c = re.sub(r'\{!embedded && <Box>[\s\S]*?</Box>\}', r'{!embedded && <Box>\n          <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>\n            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: \'primary.light\', display: \'flex\' }}>\n              <Users size={20} style={{ color: \'var(--primary)\' }} />\n            </Box>\n            <Typography variant="h6" fontWeight={600}>\n              Mentorship Program\n            </Typography>\n          </Stack>\n          <Typography variant="body2" color="text.secondary">\n            Connect mentors and mentees to support career growth\n          </Typography>\n        </Box>}', c, count=1)
    # Wrap stats grid if present
    c = c.replace('{!embedded && <Box sx={{ display: \'grid\', gridTemplateColumns: { xs: \'repeat(2, 1fr)\', md: \'repeat(4, 1fr)\' }, gap: 2 }}>',
                  '{!embedded && <Box sx={{ display: \'grid\', gridTemplateColumns: { xs: \'repeat(2, 1fr)\', md: \'repeat(4, 1fr)\' }, gap: 2 }}>')
    # ... handle end ...
    with open(path, 'w') as f:
        f.write(c)

def fix_budget():
    path = 'src/components/performance/engagement/DevelopmentBudgetTracker.tsx'
    with open(path, 'r') as f:
        c = f.read()
    c = re.sub(r'interface DevelopmentBudgetTrackerProps \{[\s\S]*?\}', 
               'interface DevelopmentBudgetTrackerProps {\n  /** Hides the panel\'s own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;\n  staff: StaffMember[];\n  currentUserId: string;\n}', c)
    # Header
    c = c.replace('justifyContent={embedded ? "flex-end" : "space-between"}', 'justifyContent={embedded ? "flex-end" : "space-between"}')
    c = re.sub(r'\{!embedded && <Box>[\s\S]*?</Box>\}', r'{!embedded && <Box>\n          <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>\n            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: \'primary.light\', display: \'flex\' }}>\n              <Wallet size={20} style={{ color: \'var(--primary)\' }} />\n            </Box>\n            <Typography variant="h6" fontWeight={600}>\n              Development Budget\n            </Typography>\n          </Stack>\n          <Typography variant="body2" color="text.secondary">\n          Track training and development budgets with approval workflow\n        </Typography>\n      </Box>}', c)
    # My Budget Card
    c = c.replace('{!embedded && {myBudget && viewMode === \'my_budget\' && (', '{!embedded && myBudget && viewMode === \'my_budget\' && (')
    # Stats Cards
    c = c.replace('{!embedded && <Box sx={{ display: \'grid\', gridTemplateColumns: { xs: \'repeat(2, 1fr)\', md: \'repeat(4, 1fr)\' }, gap: 2 }}>', 
                  '{!embedded && <Box sx={{ display: \'grid\', gridTemplateColumns: { xs: \'repeat(2, 1fr)\', md: \'repeat(4, 1fr)\' }, gap: 2 }}>')
    filters_pos = c.find('{/* Filters */}')
    stack_end_pos = c.rfind('</Box>', 0, filters_pos) + 6
    if c[stack_end_pos] != '}':
        c = c[:stack_end_pos] + "}" + c[stack_end_pos:]
    with open(path, 'w') as f:
        f.write(c)

fix_pip()
fix_recognition()
fix_happiness()
fix_pulse()
fix_wellbeing()
fix_nominations()
fix_mentorship()
fix_budget()
