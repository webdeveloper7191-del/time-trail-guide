import sys
import re

def update_file(path, heading_marker, stats_marker_start, stats_marker_end, props_interface):
    with open(path, 'r') as f:
        content = f.read()

    # 1. Add embedded to props interface
    if f'interface {props_interface} {{' in content:
        content = content.replace(
            f'interface {props_interface} {{',
            f'interface {props_interface} {{\n  /** Hides the panel\'s own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;'
        )

    # 2. Add embedded to function signature
    # Find the main export function
    func_pattern = rf'export function {props_interface.replace("Props", "")}\(([^)]+)\)'
    match = re.search(func_pattern, content)
    if match:
        params = match.group(1)
        if '{' in params and '}' in params:
            new_params = params.replace('}', ', embedded = false }')
            content = content.replace(f'({params})', f'({new_params})')

    # 3. Handle Header
    # Logic: find the heading marker, find the Box wrapping it, wrap that Box in {!embedded && ...}
    # and adjust the parent Stack's justifyContent
    if heading_marker:
        # Find the Stack containing the header
        # We look for the stack near the heading_marker
        heading_pos = content.find(heading_marker)
        stack_start = content.rfind('<Stack', 0, heading_pos)
        if stack_start != -1:
            stack_tag_end = content.find('>', stack_start)
            stack_tag = content[stack_start:stack_tag_end+1]
            if 'justifyContent="space-between"' in stack_tag:
                new_stack_tag = stack_tag.replace('justifyContent="space-between"', 'justifyContent={embedded ? "flex-end" : "space-between"}')
                content = content[:stack_start] + new_stack_tag + content[stack_tag_end+1:]
        
        # Wrap the Box containing the title/subtitle
        box_start = content.rfind('<Box>', 0, heading_pos)
        if box_start != -1:
            box_end = content.find('</Box>', heading_pos) + 6
            content = content[:box_start] + "{!embedded && " + content[box_start:box_end] + "}" + content[box_end:]

    # 4. Handle Stats Grid
    if stats_marker_start:
        start_pos = content.find(stats_marker_start)
        if start_pos != -1:
            end_pos = content.find(stats_marker_end, start_pos) + len(stats_marker_end)
            content = content[:start_pos] + "{!embedded && " + content[start_pos:end_pos] + "}" + content[end_pos:]

    with open(path, 'w') as f:
        f.write(content)

# PIPManagementPanel
update_file(
    'src/components/performance/PIPManagementPanel.tsx',
    'Performance Improvement Plans',
    '<CollapsibleStatsGrid',
    '/>',
    'PIPManagementPanelProps'
)

# UnifiedRecognitionPanel
update_file(
    'src/components/performance/UnifiedRecognitionPanel.tsx',
    'Recognition & Rewards',
    '<Stack direction={{ xs: \'column\', sm: \'row\' }} spacing={2}>',
    '</Stack>',
    'UnifiedRecognitionPanelProps'
)

# HappinessScoreWidget
update_file(
    'src/components/performance/HappinessScoreWidget.tsx',
    'Happiness Score',
    '<Stack direction={{ xs: \'column\', md: \'row\' }} spacing={3}>',
    '</Stack>',
    'HappinessScoreWidgetProps'
)

# PulseSurveyPanel
update_file(
    'src/components/performance/PulseSurveyPanel.tsx',
    'Employee Net Promoter Score', # This is inside the ENPS card
    '{renderENPSCard()}',
    '',
    'PulseSurveyPanelProps'
)
# Special case for PulseSurveyPanel header
with open('src/components/performance/PulseSurveyPanel.tsx', 'r') as f:
    c = f.read()
c = c.replace('return (', 'return (\n    <>')
c = c.replace('direction={{ xs: \'column\', sm: \'row\' }} justifyContent="space-between"', 'direction={{ xs: \'column\', sm: \'row\' }} justifyContent={embedded ? "flex-end" : "space-between"}')
c = re.sub(r'(<Box>\s*<Typography variant="h6"[\s\S]*?</Box>)', r'{!embedded && \1}', c, count=1)
c = c.replace('{renderENPSCard()}', '{!embedded && renderENPSCard()}')
with open('src/components/performance/PulseSurveyPanel.tsx', 'w') as f:
    f.write(c)

# WellbeingDashboard
update_file(
    'src/components/performance/WellbeingDashboard.tsx',
    'Wellbeing Dashboard', # Dummy to trigger header logic if available
    '{renderSummaryCards()}',
    '',
    'WellbeingDashboardProps'
)
# Special case for WellbeingDashboard header
with open('src/components/performance/WellbeingDashboard.tsx', 'r') as f:
    c = f.read()
c = c.replace('justifyContent="space-between"', 'justifyContent={embedded ? "flex-end" : "space-between"}')
# Look for title box in WellbeingDashboard
c = re.sub(r'(<Box>\s*<Typography variant="h6"[\s\S]*?</Box>)', r'{!embedded && \1}', c, count=1)
c = c.replace('{renderSummaryCards()}', '{!embedded && renderSummaryCards()}')
with open('src/components/performance/WellbeingDashboard.tsx', 'w') as f:
    f.write(c)

# PeerNominationsPanel
update_file(
    'src/components/performance/engagement/PeerNominationsPanel.tsx',
    'Peer Nominations',
    '<Box sx={{ display: \'grid\', gridTemplateColumns: { xs: \'repeat(2, 1fr)\', md: \'repeat(4, 1fr)\' }, gap: 2 }}>',
    '</Box>',
    'PeerNominationsProps'
)

# MentorshipMatchingPanel
update_file(
    'src/components/performance/engagement/MentorshipMatchingPanel.tsx',
    'Mentorship Program', # Dummy
    '<Box sx={{ display: \'grid\', gridTemplateColumns: { xs: \'repeat(2, 1fr)\', md: \'repeat(4, 1fr)\' }, gap: 2 }}>',
    '</Box>',
    'MentorshipMatchingProps'
)
# Special case MentorshipMatching header
with open('src/components/performance/engagement/MentorshipMatchingPanel.tsx', 'r') as f:
    c = f.read()
c = c.replace('justifyContent="space-between"', 'justifyContent={embedded ? "flex-end" : "space-between"}')
# Title box is hard to find by text, it's the first Box after return
c = re.sub(r'(<Box>\s*<Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>[\s\S]*?</Box>)', r'{!embedded && \1}', c, count=1)
with open('src/components/performance/engagement/MentorshipMatchingPanel.tsx', 'w') as f:
    f.write(c)

# DevelopmentBudgetTracker
update_file(
    'src/components/performance/engagement/DevelopmentBudgetTracker.tsx',
    'Development Budget',
    '<Box sx={{ display: \'grid\', gridTemplateColumns: { xs: \'repeat(2, 1fr)\', md: \'repeat(4, 1fr)\' }, gap: 2 }}>',
    '</Box>',
    'DevelopmentBudgetTrackerProps'
)
# Special case for DevelopmentBudgetTracker myBudget card
with open('src/components/performance/engagement/DevelopmentBudgetTracker.tsx', 'r') as f:
    c = f.read()
c = c.replace('{myBudget && viewMode === \'my_budget\' && (', '{!embedded && myBudget && viewMode === \'my_budget\' && (')
with open('src/components/performance/engagement/DevelopmentBudgetTracker.tsx', 'w') as f:
    f.write(c)

