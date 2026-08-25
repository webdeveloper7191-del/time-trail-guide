import sys
import os

def update_pip_management_panel():
    path = 'src/components/performance/PIPManagementPanel.tsx'
    with open(path, 'r') as f:
        lines = f.readlines()
    
    # 1. Add embedded to props interface
    for i, line in enumerate(lines):
        if 'interface PIPManagementPanelProps {' in line:
            lines.insert(i + 1, "  /** Hides the panel's own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;\n")
            break
            
    # 2. Add embedded to function parameters
    for i, line in enumerate(lines):
        if 'export function PIPManagementPanel({ staff, currentUserId }' in line:
            lines[i] = line.replace('{ staff, currentUserId }', '{ staff, currentUserId, embedded = false }')
            break
            
    content = "".join(lines)
    
    # 3. Header title block
    content = content.replace(
        '<Stack direction={{ xs: \'column\', sm: \'row\' }} justifyContent="space-between" alignItems={{ xs: \'stretch\', sm: \'flex-start\' }} spacing={2}>',
        '<Stack direction={{ xs: \'column\', sm: \'row\' }} justifyContent={embedded ? "flex-end" : "space-between"} alignItems={{ xs: \'stretch\', sm: \'flex-start\' }} spacing={2}>'
    )
    
    header_box_start = content.find('<Box>', content.find('// Header'))
    header_box_end = content.find('</Box>', header_box_start) + 6
    content = content[:header_box_start] + "{!embedded && " + content[header_box_start:header_box_end] + "}" + content[header_box_end:]
    
    # 4. Summary stats
    stats_start = content.find('<CollapsibleStatsGrid')
    stats_end = content.find('/>', stats_start) + 2
    content = content[:stats_start] + "{!embedded && " + content[stats_start:stats_end] + "}" + content[stats_end:]
    
    with open(path, 'w') as f:
        f.write(content)

def update_unified_recognition_panel():
    path = 'src/components/performance/UnifiedRecognitionPanel.tsx'
    with open(path, 'r') as f:
        lines = f.readlines()
    
    for i, line in enumerate(lines):
        if 'interface UnifiedRecognitionPanelProps {' in line:
            lines.insert(i + 1, "  /** Hides the panel's own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;\n")
            break
    
    for i, line in enumerate(lines):
        if 'export function UnifiedRecognitionPanel({ staff, currentUserId }' in line:
            lines[i] = line.replace('{ staff, currentUserId }', '{ staff, currentUserId, embedded = false }')
            break
            
    content = "".join(lines)
    
    # Header
    content = content.replace(
        'direction={{ xs: \'column\', sm: \'row\' }} \n        justifyContent="space-between"',
        'direction={{ xs: \'column\', sm: \'row\' }} \n        justifyContent={embedded ? "flex-end" : "space-between"}'
    )
    
    header_box_start = content.find('<Box>', content.find('{/* Header with Quick Stats */}'))
    header_box_end = content.find('</Box>', header_box_start) + 6
    content = content[:header_box_start] + "{!embedded && " + content[header_box_start:header_box_end] + "}" + content[header_box_end:]
    
    # Summary cards
    cards_start = content.find('<Stack direction={{ xs: \'column\', sm: \'row\' }} spacing={2}>', header_box_end)
    cards_end = content.find('</Stack>', cards_start) + 8
    content = content[:cards_start] + "{!embedded && " + content[cards_start:cards_end] + "}" + content[cards_end:]
    
    with open(path, 'w') as f:
        f.write(content)

def update_happiness_score_widget():
    path = 'src/components/performance/HappinessScoreWidget.tsx'
    with open(path, 'r') as f:
        lines = f.readlines()
        
    for i, line in enumerate(lines):
        if 'interface HappinessScoreWidgetProps {' in line:
            lines.insert(i + 1, "  /** Hides the panel's own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;\n")
            break
            
    for i, line in enumerate(lines):
        if 'export function HappinessScoreWidget({ currentUserId, isManager = false }' in line:
            lines[i] = line.replace('{ currentUserId, isManager = false }', '{ currentUserId, isManager = false, embedded = false }')
            break
            
    content = "".join(lines)
    
    # Header
    content = content.replace(
        'direction={{ xs: \'column\', sm: \'row\' }} \n        justifyContent="space-between"',
        'direction={{ xs: \'column\', sm: \'row\' }} \n        justifyContent={embedded ? "flex-end" : "space-between"}'
    )
    
    header_box_start = content.find('<Box>', content.find('{/* Header */}'))
    header_box_end = content.find('</Box>', header_box_start) + 6
    content = content[:header_box_start] + "{!embedded && " + content[header_box_start:header_box_end] + "}" + content[header_box_end:]
    
    # Summary cards
    cards_start = content.find('<Stack direction={{ xs: \'column\', md: \'row\' }} spacing={3}>', header_box_end)
    cards_end = content.find('</Stack>', cards_start) + 8
    content = content[:cards_start] + "{!embedded && " + content[cards_start:cards_end] + "}" + content[cards_end:]
    
    with open(path, 'w') as f:
        f.write(content)

def update_pulse_survey_panel():
    path = 'src/components/performance/PulseSurveyPanel.tsx'
    with open(path, 'r') as f:
        lines = f.readlines()
        
    for i, line in enumerate(lines):
        if 'interface PulseSurveyPanelProps {' in line:
            lines.insert(i + 1, "  /** Hides the panel's own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;\n")
            break
            
    for i, line in enumerate(lines):
        if 'export function PulseSurveyPanel({ currentUserId }' in line:
            lines[i] = line.replace('{ currentUserId }', '{ currentUserId, embedded = false }')
            break
            
    content = "".join(lines)
    
    # Header
    content = content.replace(
        'direction={{ xs: \'column\', sm: \'row\' }} justifyContent="space-between"',
        'direction={{ xs: \'column\', sm: \'row\' }} justifyContent={embedded ? "flex-end" : "space-between"}'
    )
    
    header_box_start = content.find('<Box>', content.find('return ('))
    header_box_end = content.find('</Box>', header_box_start) + 6
    content = content[:header_box_start] + "{!embedded && " + content[header_box_start:header_box_end] + "}" + content[header_box_end:]
    
    # Summary stats (ENPS card)
    stats_start = content.find('{renderENPSCard()}')
    content = content.replace('{renderENPSCard()}', '{!embedded && renderENPSCard()}')
    
    with open(path, 'w') as f:
        f.write(content)

def update_wellbeing_dashboard():
    path = 'src/components/performance/WellbeingDashboard.tsx'
    with open(path, 'r') as f:
        lines = f.readlines()
        
    for i, line in enumerate(lines):
        if 'interface WellbeingDashboardProps {' in line:
            lines.insert(i + 1, "  /** Hides the panel's own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;\n")
            break
            
    for i, line in enumerate(lines):
        if 'export function WellbeingDashboard({ currentUserId }' in line:
            lines[i] = line.replace('{ currentUserId }', '{ currentUserId, embedded = false }')
            break
            
    content = "".join(lines)
    
    # Header
    content = content.replace(
        'direction={{ xs: \'column\', sm: \'row\' }} justifyContent="space-between"',
        'direction={{ xs: \'column\', sm: \'row\' }} justifyContent={embedded ? "flex-end" : "space-between"}'
    )
    
    header_box_start = content.find('<Box>', content.find('return ('))
    header_box_end = content.find('</Box>', header_box_start) + 6
    content = content[:header_box_start] + "{!embedded && " + content[header_box_start:header_box_end] + "}" + content[header_box_end:]
    
    # Summary cards
    content = content.replace('{renderSummaryCards()}', '{!embedded && renderSummaryCards()}')
    
    with open(path, 'w') as f:
        f.write(content)

def update_peer_nominations_panel():
    path = 'src/components/performance/engagement/PeerNominationsPanel.tsx'
    with open(path, 'r') as f:
        lines = f.readlines()
        
    for i, line in enumerate(lines):
        if 'interface PeerNominationsProps {' in line:
            lines.insert(i + 1, "  /** Hides the panel's own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;\n")
            break
            
    for i, line in enumerate(lines):
        if 'export function PeerNominationsPanel({ staff, currentUserId }' in line:
            lines[i] = line.replace('{ staff, currentUserId }', '{ staff, currentUserId, embedded = false }')
            break
            
    content = "".join(lines)
    
    # Header
    content = content.replace(
        'direction={{ xs: \'column\', sm: \'row\' }} justifyContent="space-between"',
        'direction={{ xs: \'column\', sm: \'row\' }} justifyContent={embedded ? "flex-end" : "space-between"}'
    )
    
    header_box_start = content.find('<Box>', content.find('// Header'))
    header_box_end = content.find('</Box>', header_box_start) + 6
    content = content[:header_box_start] + "{!embedded && " + content[header_box_start:header_box_end] + "}" + content[header_box_end:]
    
    # Stats grid
    stats_start = content.find('<Box sx={{ display: \'grid\', gridTemplateColumns: { xs: \'repeat(2, 1fr)\', md: \'repeat(4, 1fr)\' }, gap: 2 }}>', header_box_end)
    stats_end = content.find('</Box>', stats_start) + 6
    content = content[:stats_start] + "{!embedded && " + content[stats_start:stats_end] + "}" + content[stats_end:]
    
    with open(path, 'w') as f:
        f.write(content)

def update_mentorship_matching_panel():
    path = 'src/components/performance/engagement/MentorshipMatchingPanel.tsx'
    with open(path, 'r') as f:
        lines = f.readlines()
        
    for i, line in enumerate(lines):
        if 'interface MentorshipMatchingProps {' in line:
            lines.insert(i + 1, "  /** Hides the panel's own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;\n")
            break
            
    for i, line in enumerate(lines):
        if 'export function MentorshipMatchingPanel({ staff, currentUserId }' in line:
            lines[i] = line.replace('{ staff, currentUserId }', '{ staff, currentUserId, embedded = false }')
            break
            
    content = "".join(lines)
    
    # Header
    content = content.replace(
        'direction={{ xs: \'column\', sm: \'row\' }} justifyContent="space-between"',
        'direction={{ xs: \'column\', sm: \'row\' }} justifyContent={embedded ? "flex-end" : "space-between"}'
    )
    
    header_box_start = content.find('<Box>', content.find('return ('))
    header_box_end = content.find('</Box>', header_box_start) + 6
    content = content[:header_box_start] + "{!embedded && " + content[header_box_start:header_box_end] + "}" + content[header_box_end:]
    
    # Stats grid
    stats_start = content.find('<Box sx={{ display: \'grid\', gridTemplateColumns: { xs: \'repeat(2, 1fr)\', md: \'repeat(4, 1fr)\' }, gap: 2 }}>', header_box_end)
    stats_end = content.find('</Box>', stats_start) + 6
    content = content[:stats_start] + "{!embedded && " + content[stats_start:stats_end] + "}" + content[stats_end:]
    
    with open(path, 'w') as f:
        f.write(content)

def update_development_budget_tracker():
    path = 'src/components/performance/engagement/DevelopmentBudgetTracker.tsx'
    with open(path, 'r') as f:
        lines = f.readlines()
        
    for i, line in enumerate(lines):
        if 'interface DevelopmentBudgetTrackerProps {' in line:
            lines.insert(i + 1, "  /** Hides the panel's own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;\n")
            break
            
    for i, line in enumerate(lines):
        if 'export function DevelopmentBudgetTracker({ staff, currentUserId }' in line:
            lines[i] = line.replace('{ staff, currentUserId }', '{ staff, currentUserId, embedded = false }')
            break
            
    content = "".join(lines)
    
    # Header
    content = content.replace(
        'direction={{ xs: \'column\', sm: \'row\' }} justifyContent="space-between"',
        'direction={{ xs: \'column\', sm: \'row\' }} justifyContent={embedded ? "flex-end" : "space-between"}'
    )
    
    header_box_start = content.find('<Box>', content.find('// Header'))
    header_box_end = content.find('</Box>', header_box_start) + 6
    content = content[:header_box_start] + "{!embedded && " + content[header_box_start:header_box_end] + "}" + content[header_box_end:]
    
    # My Budget Card
    budget_card_start = content.find('{myBudget && viewMode === \'my_budget\' && (', header_box_end)
    budget_card_end = content.find(')}', budget_card_start) + 2
    content = content[:budget_card_start] + "{!embedded && " + content[budget_card_start:budget_card_end] + "}" + content[budget_card_end:]
    
    # Stats Cards
    stats_start = content.find('<Box sx={{ display: \'grid\', gridTemplateColumns: { xs: \'repeat(2, 1fr)\', md: \'repeat(4, 1fr)\' }, gap: 2 }}>', budget_card_end)
    stats_end = content.find('</Box>', stats_start) + 6
    content = content[:stats_start] + "{!embedded && " + content[stats_start:stats_end] + "}" + content[stats_end:]
    
    with open(path, 'w') as f:
        f.write(content)

if __name__ == "__main__":
    update_pip_management_panel()
    update_unified_recognition_panel()
    update_happiness_score_widget()
    update_pulse_survey_panel()
    update_wellbeing_dashboard()
    update_peer_nominations_panel()
    update_mentorship_matching_panel()
    update_development_budget_tracker()
