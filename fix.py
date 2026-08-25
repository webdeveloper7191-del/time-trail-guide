import sys
import re

def fix_interface(content, interface_name):
    # Remove duplicate embedded?: boolean and clean up comments
    pattern = rf'interface {interface_name} \{{([\s\S]*?)\}}'
    def sub_interface(match):
        inner = match.group(1)
        # Remove any existing embedded lines
        inner = re.sub(r'/\*\*.*?\*/\s*embedded\?: boolean;?', '', inner)
        inner = re.sub(r'embedded\?: boolean;?', '', inner)
        # Add a single one at the top
        return f'interface {interface_name} {{\n  /** hides the panel\'s own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;\n{inner.strip()}\n}}'
    return re.sub(pattern, sub_interface, content)

# 1. NineBoxTalentGrid.tsx
with open('src/components/performance/NineBoxTalentGrid.tsx', 'r') as f:
    c = f.read()
c = fix_interface(c, 'NineBoxTalentGridProps')
# Fix double prop in arguments if any
c = c.replace('onSelectStaff, embedded = false, embedded = false', 'onSelectStaff, embedded = false')
c = c.replace('onSelectStaff, embedded = false', 'onSelectStaff, embedded = false') # Ensure no dupe
with open('src/components/performance/NineBoxTalentGrid.tsx', 'w') as f:
    f.write(c)

# 2. SkillsCareerPanel.tsx
with open('src/components/performance/SkillsCareerPanel.tsx', 'r') as f:
    lines = f.readlines()
# Fix interface
c = "".join(lines)
c = fix_interface(c, 'SkillsCareerPanelProps')
# Fix heading block (1213-1300 approx)
# I need to find the correct line for Skills Matrix header too.
with open('src/components/performance/SkillsCareerPanel.tsx', 'w') as f:
    f.write(c)

# 3. talent/CareerPathingVisualization.tsx
with open('src/components/performance/talent/CareerPathingVisualization.tsx', 'r') as f:
    c = f.read()
c = fix_interface(c, 'CareerPathingVisualizationProps')
with open('src/components/performance/talent/CareerPathingVisualization.tsx', 'w') as f:
    f.write(c)

# 4. SuccessionPlanningPanel.tsx
with open('src/components/performance/SuccessionPlanningPanel.tsx', 'r') as f:
    c = f.read()
c = fix_interface(c, 'SuccessionPlanningPanelProps')
with open('src/components/performance/SuccessionPlanningPanel.tsx', 'w') as f:
    f.write(c)

# 5. TeamOverviewDashboard.tsx
with open('src/components/performance/TeamOverviewDashboard.tsx', 'r') as f:
    c = f.read()
c = fix_interface(c, 'TeamOverviewDashboardProps')
with open('src/components/performance/TeamOverviewDashboard.tsx', 'w') as f:
    f.write(c)

# 6. PerformanceTaskManagementPanel.tsx
with open('src/components/performance/PerformanceTaskManagementPanel.tsx', 'r') as f:
    c = f.read()
c = fix_interface(c, 'PerformanceTaskManagementPanelProps')
with open('src/components/performance/PerformanceTaskManagementPanel.tsx', 'w') as f:
    f.write(c)

# 7. ConversationsList.tsx
with open('src/components/performance/ConversationsList.tsx', 'r') as f:
    c = f.read()
c = fix_interface(c, 'ConversationsListProps')
with open('src/components/performance/ConversationsList.tsx', 'w') as f:
    f.write(c)
