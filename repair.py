import re
import os

def repair_file(path, component_name, props_name):
    with open(path, 'r') as f:
        content = f.read()
    
    # Truncate if there's repeated content (a common failure mode of my previous attempt)
    # Find the last "export default" or the logical end of the file.
    # Looking at the tsgo output, it seems I appended stuff or mis-replaced.
    
    # If the file contains "import" multiple times at start of lines, it's likely corrupted.
    parts = re.split(r'^import ', content, flags=re.MULTILINE)
    if len(parts) > 2:
        # Keep only the first part (imports) and the second part (the rest of the first instance)
        content = "import " + parts[1]
        # But we need to find where the first instance ends.
        # Usually it ends after the last export or the last closing brace of the last component.
    
    # Let's just try to re-implementation the requirements on the original-ish files.
    # I'll restore them first if possible by undoing the bad edits if I can find a way.
    # Since git checkout failed, I'll try to find the original state.
    # Actually, I can just fix the syntax errors.
    
    # Requirement 1: Add embedded prop to interface
    if f'interface {props_name} {{' in content:
        if 'embedded?: boolean;' not in content.split(f'interface {props_name} {{')[1].split('}')[0]:
            content = content.replace(
                f'interface {props_name} {{',
                f'interface {props_name} {{\n  /** hides the panel\'s own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;'
            )
            
    # Requirement 2: Add embedded to function params
    func_def = f'export function {component_name}({{'
    if func_def in content:
        # Check if already has it
        params_end = content.find('}', content.find(func_def))
        params_segment = content[content.find(func_def):params_end+1]
        if 'embedded' not in params_segment:
            content = content.replace(params_segment, params_segment.replace('}', ', embedded = false }'))

    # Requirement 3 & 4: Wrap Title and Stats
    # This is highly file specific. I will do them one by one.
    return content

# Specific fix for PIPManagementPanel
def fix_pip():
    path = 'src/components/performance/PIPManagementPanel.tsx'
    with open(path, 'r') as f:
        c = f.read()
    
    # Fix the corruption at the end
    c = c.split('export default PIPManagementPanel;')[0] + 'export default PIPManagementPanel;'
    
    # Implementation requirements
    c = c.replace('interface PIPManagementPanelProps {', 'interface PIPManagementPanelProps {\n  /** hides the panel\'s own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;')
    c = c.replace('export function PIPManagementPanel({ staff, currentUserId }', 'export function PIPManagementPanel({ staff, currentUserId, embedded = false }')
    
    # Header Stack
    c = c.replace('<Stack direction={{ xs: \'column\', sm: \'row\' }} justifyContent="space-between"', '<Stack direction={{ xs: \'column\', sm: \'row\' }} justifyContent={embedded ? "flex-end" : "space-between"}')
    
    # Title Box
    title_box_start = c.find('<Box>', c.find('{/* Header */}'))
    title_box_end = c.find('</Box>', title_box_start) + 6
    if title_box_start != -1 and '{!embedded &&' not in c[title_box_start-20:title_box_start]:
        c = c[:title_box_start] + '{!embedded && ' + c[title_box_start:title_box_end] + '}' + c[title_box_end:]
        
    # Stats Box
    stats_marker = '{/* Stats */}'
    stats_start = c.find('<Box', c.find(stats_marker))
    if stats_start != -1 and '{!embedded &&' not in c[stats_start-20:stats_start]:
        # Find matching closing Box
        # This is tricky with regex, but since it's a specific grid, we can find the end of that section
        # The section usually ends before the filters or tabs
        stats_end = c.find('</Box>', c.find('</Card>', stats_start + 100)) + 6
        c = c[:stats_start] + '{!embedded && ' + c[stats_start:stats_end] + '}' + c[stats_end:]

    with open(path, 'w') as f:
        f.write(c)

def fix_recognition():
    path = 'src/components/performance/UnifiedRecognitionPanel.tsx'
    with open(path, 'r') as f:
        c = f.read()
    c = c.split('export default UnifiedRecognitionPanel;')[0] + 'export default UnifiedRecognitionPanel;' if 'export default' in c else c
    
    c = c.replace('interface UnifiedRecognitionPanelProps {', 'interface UnifiedRecognitionPanelProps {\n  /** hides the panel\'s own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;')
    c = c.replace('export function UnifiedRecognitionPanel({ staff, currentUserId }', 'export function UnifiedRecognitionPanel({ staff, currentUserId, embedded = false }')
    
    c = c.replace('justifyContent="space-between"', 'justifyContent={embedded ? "flex-end" : "space-between"}', 1)
    
    # Title
    t_start = c.find('<Box>', c.find('{/* Header with Quick Stats */}'))
    t_end = c.find('</Box>', t_start) + 6
    if t_start != -1:
        c = c[:t_start] + '{!embedded && ' + c[t_start:t_end] + '}' + c[t_end:]
        
    # Summary cards
    s_start = c.find('<Stack direction={{ xs: \'column\', sm: \'row\' }} spacing={2}>', t_end)
    s_end = c.find('</Stack>', s_start) + 8
    if s_start != -1:
        c = c[:s_start] + '{!embedded && ' + c[s_start:s_end] + '}' + c[s_end:]
        
    with open(path, 'w') as f:
        f.write(c)

def fix_happiness():
    path = 'src/components/performance/HappinessScoreWidget.tsx'
    with open(path, 'r') as f:
        c = f.read()
    c = c.replace('interface HappinessScoreWidgetProps {', 'interface HappinessScoreWidgetProps {\n  /** hides the panel\'s own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;')
    c = c.replace('export function HappinessScoreWidget({ currentUserId, isManager = false }', 'export function HappinessScoreWidget({ currentUserId, isManager = false, embedded = false }')
    c = c.replace('justifyContent="space-between"', 'justifyContent={embedded ? "flex-end" : "space-between"}', 1)
    
    t_start = c.find('<Box>', c.find('{/* Header */}'))
    t_end = c.find('</Box>', t_start) + 6
    if t_start != -1:
        c = c[:t_start] + '{!embedded && ' + c[t_start:t_end] + '}' + c[t_end:]
        
    s_start = c.find('<Stack direction={{ xs: \'column\', md: \'row\' }} spacing={3}>', t_end)
    s_end = c.find('</Stack>', s_start) + 8
    if s_start != -1:
        c = c[:s_start] + '{!embedded && ' + c[s_start:s_end] + '}' + c[s_end:]
        
    with open(path, 'w') as f:
        f.write(c)

def fix_pulse():
    path = 'src/components/performance/PulseSurveyPanel.tsx'
    with open(path, 'r') as f:
        c = f.read()
    c = c.replace('interface PulseSurveyPanelProps {', 'interface PulseSurveyPanelProps {\n  /** hides the panel\'s own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;')
    c = c.replace('export function PulseSurveyPanel({ currentUserId }', 'export function PulseSurveyPanel({ currentUserId, embedded = false }')
    c = c.replace('justifyContent="space-between"', 'justifyContent={embedded ? "flex-end" : "space-between"}', 1)
    
    # Title Box in return
    t_start = c.find('<Box>', c.find('return ('))
    t_end = c.find('</Box>', t_start) + 6
    if t_start != -1:
        c = c[:t_start] + '{!embedded && ' + c[t_start:t_end] + '}' + c[t_end:]
        
    # Stats (ENPS Card)
    c = c.replace('{renderENPSCard()}', '{!embedded && renderENPSCard()}')
    
    with open(path, 'w') as f:
        f.write(c)

def fix_wellbeing():
    path = 'src/components/performance/WellbeingDashboard.tsx'
    with open(path, 'r') as f:
        c = f.read()
    c = c.replace('interface WellbeingDashboardProps {', 'interface WellbeingDashboardProps {\n  /** hides the panel\'s own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;')
    c = c.replace('export function WellbeingDashboard({ currentUserId }', 'export function WellbeingDashboard({ currentUserId, embedded = false }')
    c = c.replace('justifyContent="space-between"', 'justifyContent={embedded ? "flex-end" : "space-between"}', 1)
    
    t_start = c.find('<Box>', c.find('return ('))
    t_end = c.find('</Box>', t_start) + 6
    if t_start != -1:
        c = c[:t_start] + '{!embedded && ' + c[t_start:t_end] + '}' + c[t_end:]
        
    c = c.replace('{renderSummaryCards()}', '{!embedded && renderSummaryCards()}')
    
    with open(path, 'w') as f:
        f.write(c)

def fix_nominations():
    path = 'src/components/performance/engagement/PeerNominationsPanel.tsx'
    with open(path, 'r') as f:
        c = f.read()
    c = c.replace('interface PeerNominationsProps {', 'interface PeerNominationsProps {\n  /** hides the panel\'s own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;')
    c = c.replace('export function PeerNominationsPanel({ staff, currentUserId }', 'export function PeerNominationsPanel({ staff, currentUserId, embedded = false }')
    c = c.replace('justifyContent="space-between"', 'justifyContent={embedded ? "flex-end" : "space-between"}', 1)
    
    t_start = c.find('<Box>', c.find('// Header'))
    t_end = c.find('</Box>', t_start) + 6
    if t_start != -1:
        c = c[:t_start] + '{!embedded && ' + c[t_start:t_end] + '}' + c[t_end:]
        
    s_start = c.find('<Box sx={{ display: \'grid\', gridTemplateColumns: { xs: \'repeat(2, 1fr)\', md: \'repeat(4, 1fr)\' }, gap: 2 }}>', t_end)
    s_end = c.find('</Box>', s_start) + 6
    if s_start != -1:
        c = c[:s_start] + '{!embedded && ' + c[s_start:s_end] + '}' + c[s_end:]
        
    with open(path, 'w') as f:
        f.write(c)

def fix_mentorship():
    path = 'src/components/performance/engagement/MentorshipMatchingPanel.tsx'
    with open(path, 'r') as f:
        c = f.read()
    c = c.replace('interface MentorshipMatchingProps {', 'interface MentorshipMatchingProps {\n  /** hides the panel\'s own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;')
    c = c.replace('export function MentorshipMatchingPanel({ staff, currentUserId }', 'export function MentorshipMatchingPanel({ staff, currentUserId, embedded = false }')
    
    # Header logic
    # Title is not in a box sometimes, let's just use the same pattern
    c = c.replace('justifyContent="space-between"', 'justifyContent={embedded ? "flex-end" : "space-between"}', 1)
    # The header title box is typically the first Box after return
    # MentorshipMatchingPanel header is at line 440+
    # Actually I'll skip title wrap if I can't find it reliably, or use a more specific marker
    # I'll re-read MentorshipMatchingPanel
    with open(path, 'w') as f:
        f.write(c)

def fix_budget():
    path = 'src/components/performance/engagement/DevelopmentBudgetTracker.tsx'
    with open(path, 'r') as f:
        c = f.read()
    c = c.replace('interface DevelopmentBudgetTrackerProps {', 'interface DevelopmentBudgetTrackerProps {\n  /** hides the panel\'s own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;')
    c = c.replace('export function DevelopmentBudgetTracker({ staff, currentUserId }', 'export function DevelopmentBudgetTracker({ staff, currentUserId, embedded = false }')
    c = c.replace('justifyContent="space-between"', 'justifyContent={embedded ? "flex-end" : "space-between"}', 1)
    
    t_start = c.find('<Box>', c.find('// Header'))
    t_end = c.find('</Box>', t_start) + 6
    if t_start != -1:
        c = c[:t_start] + '{!embedded && ' + c[t_start:t_end] + '}' + c[t_end:]
        
    # My Budget Card
    b_start = c.find('{myBudget && viewMode === \'my_budget\' && (', t_end)
    b_end = c.find(')}', b_start) + 2
    if b_start != -1:
        c = c[:b_start] + '{!embedded && ' + c[b_start:b_end] + '}' + c[b_end:]
        
    # Stats Cards
    s_start = c.find('<Box sx={{ display: \'grid\', gridTemplateColumns: { xs: \'repeat(2, 1fr)\', md: \'repeat(4, 1fr)\' }, gap: 2 }}>', b_end if b_start != -1 else t_end)
    s_end = c.find('</Box>', s_start) + 6
    if s_start != -1:
        c = c[:s_start] + '{!embedded && ' + c[s_start:s_end] + '}' + c[s_end:]

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
