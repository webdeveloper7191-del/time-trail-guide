import sys
import re

def transform_file(file_path, prop_interface_name, component_name, heading_start_marker, heading_end_marker, summary_start_marker=None, summary_end_marker=None, has_buttons=False):
    with open(file_path, 'r') as f:
        content = f.read()

    # Add embedded?: boolean to Props interface
    if f"interface {prop_interface_name}" in content:
        content = re.sub(
            rf'(interface {prop_interface_name} \{{\s*)',
            r'\1  /** hides the panel\'s own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;\n',
            content
        )
    else:
        # Create props interface if it doesn't exist
        interface_def = f"interface {prop_interface_name} {{\n  /** hides the panel's own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;\n}}\n\n"
        content = re.sub(rf'(export function {component_name})', rf'{interface_def}\1', content)

    # Add embedded = false to component arguments
    # Matches export function Component({ arg1, arg2 }: Props)
    content = re.sub(
        rf'(export function {component_name}\(\{{)([^}}]*)(}}\s*:\s*{prop_interface_name})',
        r'\1\2, embedded = false\3',
        content
    )
    # Also handle cases where there are no existing destructured props
    content = re.sub(
        rf'(export function {component_name}\(\s*:\s*{prop_interface_name}\))',
        rf'export function {component_name}({{ embedded = false }}: {prop_interface_name})',
        content
    )

    # Handle heading
    if has_buttons:
        # We need to wrap the title/subtitle box but keep the stack and buttons
        # The start marker should be the Stack, the end marker the buttons Stack/Button
        # We also need to change justifyContent to flex-end when embedded is true
        
        # This is very specific to each file, so I'll handle them individually in the script if needed
        pass
    else:
        # Just wrap the whole heading in {!embedded && (...)}
        pass

    with open(file_path, 'w') as f:
        f.write(content)

# File-specific transforms

# 1. NineBoxTalentGrid.tsx
with open('src/components/performance/NineBoxTalentGrid.tsx', 'r') as f:
    c = f.read()
c = c.replace('interface NineBoxTalentGridProps {', 'interface NineBoxTalentGridProps {\n  /** hides the panel\'s own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;')
c = c.replace('export function NineBoxTalentGrid({ assessments: initialAssessments, onSelectStaff }: NineBoxTalentGridProps) {', 'export function NineBoxTalentGrid({ assessments: initialAssessments, onSelectStaff, embedded = false }: NineBoxTalentGridProps) {')
c = c.replace('<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>', '<Stack direction="row" justifyContent={embedded ? "flex-end" : "space-between"} alignItems="center" sx={{ mb: embedded ? 0 : 3 }}>')
c = c.replace('<Box>\n          <Typography variant="h6" fontWeight={600} color="text.primary">\n            9-Box Talent Grid\n          </Typography>\n          <Typography variant="body2" color="text.secondary">\n            Visual talent mapping for succession planning and calibration\n          </Typography>\n        </Box>', '{!embedded && (\n          <Box>\n            <Typography variant="h6" fontWeight={600} color="text.primary">\n              9-Box Talent Grid\n            </Typography>\n            <Typography variant="body2" color="text.secondary">\n              Visual talent mapping for succession planning and calibration\n            </Typography>\n          </Box>\n        )}')
with open('src/components/performance/NineBoxTalentGrid.tsx', 'w') as f:
    f.write(c)

# 2. SkillsCareerPanel.tsx
with open('src/components/performance/SkillsCareerPanel.tsx', 'r') as f:
    c = f.read()
c = c.replace('interface SkillsCareerPanelProps {', 'interface SkillsCareerPanelProps {\n  /** hides the panel\'s own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;')
c = c.replace('export function SkillsCareerPanel({ staffId = \'staff-1\' }: SkillsCareerPanelProps) {', 'export function SkillsCareerPanel({ staffId = \'staff-1\', embedded = false }: SkillsCareerPanelProps) {')
c = c.replace('<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>', '{!embedded && <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>')
c = c.replace('</Box>\n        </Box>\n      </Stack>', '</Box>\n        </Box>\n      </Stack>}')
with open('src/components/performance/SkillsCareerPanel.tsx', 'w') as f:
    f.write(c)

# 3. talent/CareerPathingVisualization.tsx
with open('src/components/performance/talent/CareerPathingVisualization.tsx', 'r') as f:
    c = f.read()
c = c.replace('interface CareerPathingVisualizationProps {', 'interface CareerPathingVisualizationProps {\n  /** hides the panel\'s own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;')
c = c.replace('export function CareerPathingVisualization({ staffId = \'staff-1\', onAssessSkill }: CareerPathingVisualizationProps) {', 'export function CareerPathingVisualization({ staffId = \'staff-1\', onAssessSkill, embedded = false }: CareerPathingVisualizationProps) {')
c = c.replace('<Stack direction={{ xs: \'column\', sm: \'row\' }} justifyContent="space-between" alignItems={{ xs: \'stretch\', sm: \'center\' }} spacing={2}>', '<Stack direction={{ xs: \'column\', sm: \'row\' }} justifyContent={embedded ? "flex-end" : "space-between"} alignItems={{ xs: \'stretch\', sm: \'center\' }} spacing={2} sx={{ mb: embedded ? 0 : 0 }}>')
c = c.replace('<Box>\n          <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>\n            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: \'primary.light\', display: \'flex\' }}>\n              <TrendingUp className="h-5 w-5" style={{ color: \'var(--primary)\' }} />\n            </Box>\n            <Typography variant="h6" fontWeight={600}>\n              Career Progression\n            </Typography>\n          </Stack>\n          <Typography variant="body2" color="text.secondary">\n            Interactive career ladder showing your progression path and skill requirements\n          </Typography>\n        </Box>', '{!embedded && <Box>\n          <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>\n            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: \'primary.light\', display: \'flex\' }}>\n              <TrendingUp className="h-5 w-5" style={{ color: \'var(--primary)\' }} />\n            </Box>\n            <Typography variant="h6" fontWeight={600}>\n              Career Progression\n            </Typography>\n          </Stack>\n          <Typography variant="body2" color="text.secondary">\n            Interactive career ladder showing your progression path and skill requirements\n          </Typography>\n        </Box>}')
c = c.replace('{staff && careerProgress && currentPath && (', '{!embedded && staff && careerProgress && currentPath && (')
with open('src/components/performance/talent/CareerPathingVisualization.tsx', 'w') as f:
    f.write(c)

# 4. SuccessionPlanningPanel.tsx
with open('src/components/performance/SuccessionPlanningPanel.tsx', 'r') as f:
    c = f.read()
c = c.replace('interface SuccessionPlanningPanelProps {', 'interface SuccessionPlanningPanelProps {\n  /** hides the panel\'s own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;')
c = c.replace('export function SuccessionPlanningPanel({ staff, currentUserId }: SuccessionPlanningPanelProps) {', 'export function SuccessionPlanningPanel({ staff, currentUserId, embedded = false }: SuccessionPlanningPanelProps) {')
c = c.replace('<Stack \n        direction={{ xs: \'column\', sm: \'row\' }} \n        justifyContent="space-between" \n        alignItems={{ xs: \'stretch\', sm: \'flex-start\' }}\n        spacing={2}\n      >', '<Stack \n        direction={{ xs: \'column\', sm: \'row\' }} \n        justifyContent={embedded ? "flex-end" : "space-between"} \n        alignItems={{ xs: \'stretch\', sm: \'flex-start\' }}\n        spacing={2}\n        sx={{ mb: embedded ? 0 : 0 }}\n      >')
c = c.replace('<Box>\n          <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>\n            <Box sx={{ p: { xs: 0.75, md: 1 }, borderRadius: 1.5, bgcolor: \'primary.light\', display: \'flex\' }}>\n              <Crown size={18} style={{ color: \'var(--primary)\' }} />\n            </Box>\n            <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: \'1rem\', md: \'1.25rem\' } }}>\n              Succession Planning\n            </Typography>\n          </Stack>\n          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: \'none\', sm: \'block\' } }}>\n            Build leadership pipeline and manage talent readiness\n          </Typography>\n        </Box>', '{!embedded && <Box>\n          <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>\n            <Box sx={{ p: { xs: 0.75, md: 1 }, borderRadius: 1.5, bgcolor: \'primary.light\', display: \'flex\' }}>\n              <Crown size={18} style={{ color: \'var(--primary)\' }} />\n            </Box>\n            <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: \'1rem\', md: \'1.25rem\' } }}>\n              Succession Planning\n            </Typography>\n          </Stack>\n          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: \'none\', sm: \'block\' } }}>\n            Build leadership pipeline and manage talent readiness\n          </Typography>\n        </Box>}')
c = re.sub(r'{\/\* Stats \*\/}\s*<Box sx={{ display: \'grid\', gridTemplateColumns: { xs: \'repeat\(2, 1fr\)\', sm: \'repeat\(4, 1fr\)\' }, gap: { xs: 1.5, md: 2 } }}>', '{!embedded && <Box sx={{ display: \'grid\', gridTemplateColumns: { xs: \'repeat(2, 1fr)\', sm: \'repeat(4, 1fr)\' }, gap: { xs: 1.5, md: 2 } }}>', c)
# Close the Stats wrap - finding the right end tag is hard. I'll search for the next section.
c = c.replace('</Box>\n      </Box>', '</Box>\n      </Box>}')
with open('src/components/performance/SuccessionPlanningPanel.tsx', 'w') as f:
    f.write(c)

# 5. TeamOverviewDashboard.tsx
with open('src/components/performance/TeamOverviewDashboard.tsx', 'r') as f:
    c = f.read()
c = c.replace('interface TeamOverviewDashboardProps {', 'interface TeamOverviewDashboardProps {\n  /** hides the panel\'s own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;')
c = c.replace('export function TeamOverviewDashboard({\n  staff,\n  goals,\n  reviews,\n  feedback,\n  conversations,\n  currentUserId,\n  onViewGoal,\n  onViewReview,\n  onViewConversation,\n}: TeamOverviewDashboardProps) {', 'export function TeamOverviewDashboard({\n  staff,\n  goals,\n  reviews,\n  feedback,\n  conversations,\n  currentUserId,\n  onViewGoal,\n  onViewReview,\n  onViewConversation,\n  embedded = false,\n}: TeamOverviewDashboardProps) {')
c = c.replace('<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>', '{!embedded && <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>')
c = c.replace('</Box>\n      </Stack>', '</Box>\n      </Stack>}')
c = c.replace('{/* Team Summary Cards */}\n      <Grid container spacing={2} sx={{ mb: 4 }}>', '{!embedded && <Grid container spacing={2} sx={{ mb: 4 }}>')
# Close the Grid wrap
c = c.replace('</Grid>\n      </Grid>', '</Grid>\n      </Grid>}')
with open('src/components/performance/TeamOverviewDashboard.tsx', 'w') as f:
    f.write(c)

# 6. PerformanceTaskManagementPanel.tsx
with open('src/components/performance/PerformanceTaskManagementPanel.tsx', 'r') as f:
    c = f.read()
c = c.replace('interface PerformanceTaskManagementPanelProps {', 'interface PerformanceTaskManagementPanelProps {\n  /** hides the panel\'s own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;')
c = c.replace('export function PerformanceTaskManagementPanel({\n  currentUserId,\n  goals = [],\n  reviews = [],\n  conversations = [],\n  onNavigateToGoal,\n  onNavigateToReview,\n  onNavigateToConversation,\n}: PerformanceTaskManagementPanelProps) {', 'export function PerformanceTaskManagementPanel({\n  currentUserId,\n  goals = [],\n  reviews = [],\n  conversations = [],\n  onNavigateToGoal,\n  onNavigateToReview,\n  onNavigateToConversation,\n  embedded = false,\n}: PerformanceTaskManagementPanelProps) {')
c = c.replace('<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>', '<Stack direction="row" alignItems="center" justifyContent={embedded ? "flex-end" : "space-between"} sx={{ mb: 2 }}>')
c = c.replace('<div>\n            <Typography variant="h6" fontWeight={600}>Performance Tasks</Typography>\n            <Typography variant="body2" color="text.secondary">\n              Track development tasks, coaching, reviews, and PIP actions\n            </Typography>\n          </div>', '{!embedded && <div>\n            <Typography variant="h6" fontWeight={600}>Performance Tasks</Typography>\n            <Typography variant="body2" color="text.secondary">\n              Track development tasks, coaching, reviews, and PIP actions\n            </Typography>\n          </div>}')
c = c.replace('{/* Stats */}\n        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>', '{!embedded && <Stack direction="row" spacing={2} sx={{ mb: 2 }}>')
# Close Stats wrap
c = c.replace('</Stack>\n        </Stack>', '</Stack>\n        </Stack>}')
with open('src/components/performance/PerformanceTaskManagementPanel.tsx', 'w') as f:
    f.write(c)

# 7. ConversationsList.tsx
with open('src/components/performance/ConversationsList.tsx', 'r') as f:
    c = f.read()
c = c.replace('interface ConversationsListProps {', 'interface ConversationsListProps {\n  /** hides the panel\'s own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;')
c = c.replace('export function ConversationsList({ \n  conversations, \n  staff, \n  currentUserId,\n  onScheduleConversation, \n  onViewConversation \n}: ConversationsListProps) {', 'export function ConversationsList({ \n  conversations, \n  staff, \n  currentUserId,\n  onScheduleConversation, \n  onViewConversation, \n  embedded = false \n}: ConversationsListProps) {')
c = c.replace('<Stack \n        direction={{ xs: \'column\', sm: \'row\' }}\n        justifyContent="space-between" \n        alignItems={{ xs: \'stretch\', sm: \'flex-start\' }}\n        spacing={{ xs: 2, sm: 0 }}\n      >', '<Stack \n        direction={{ xs: \'column\', sm: \'row\' }}\n        justifyContent={embedded ? "flex-end" : "space-between"} \n        alignItems={{ xs: \'stretch\', sm: \'flex-start\' }}\n        spacing={{ xs: 2, sm: 0 }}\n        sx={{ mb: embedded ? 0 : 0 }}\n      >')
c = c.replace('<Box>\n          <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>\n            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: \'primary.light\', display: \'flex\' }}>\n              <MessageSquare size={20} style={{ color: \'var(--primary)\' }} />\n            </Box>\n            <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: \'1.1rem\', md: \'1.25rem\' } }}>\n              Continuous Conversations\n            </Typography>\n          </Stack>\n          <Typography \n            variant="body2" \n            color="text.secondary"\n            sx={{ display: { xs: \'none\', sm: \'block\' } }}\n          >\n            Schedule and track 1:1s, check-ins, and coaching sessions\n          </Typography>\n        </Box>', '{!embedded && <Box>\n          <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>\n            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: \'primary.light\', display: \'flex\' }}>\n              <MessageSquare size={20} style={{ color: \'var(--primary)\' }} />\n            </Box>\n            <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: \'1.1rem\', md: \'1.25rem\' } }}>\n              Continuous Conversations\n            </Typography>\n          </Stack>\n          <Typography \n            variant="body2" \n            color="text.secondary"\n            sx={{ display: { xs: \'none\', sm: \'block\' } }}\n          >\n            Schedule and track 1:1s, check-ins, and coaching sessions\n          </Typography>\n        </Box>}')
with open('src/components/performance/ConversationsList.tsx', 'w') as f:
    f.write(c)

# 8. engagement/CalendarIntegrationPanel.tsx
with open('src/components/performance/engagement/CalendarIntegrationPanel.tsx', 'r') as f:
    c = f.read()
# No interface for props yet
c = re.sub(r'export function CalendarIntegrationPanel\(\) {', 'interface CalendarIntegrationPanelProps {\n  /** hides the panel\'s own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;\n}\n\nexport function CalendarIntegrationPanel({ embedded = false }: CalendarIntegrationPanelProps) {', c)
c = c.replace('<Stack direction={{ xs: \'column\', sm: \'row\' }} justifyContent="space-between" alignItems={{ xs: \'stretch\', sm: \'flex-start\' }} spacing={2}>', '<Stack direction={{ xs: \'column\', sm: \'row\' }} justifyContent={embedded ? "flex-end" : "space-between"} alignItems={{ xs: \'stretch\', sm: \'flex-start\' }} spacing={2} sx={{ mb: embedded ? 0 : 0 }}>')
c = c.replace('<Box>\n          <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>\n            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: \'primary.light\', display: \'flex\' }}>\n              <Calendar className="h-5 w-5" style={{ color: \'var(--primary)\' }} />\n            </Box>\n            <Typography variant="h6" fontWeight={600}>\n              Calendar Integration\n            </Typography>\n          </Stack>\n          <Typography variant="body2" color="text.secondary">\n            Sync your 1:1s with Google Calendar, Outlook, or Apple Calendar\n          </Typography>\n        </Box>', '{!embedded && <Box>\n          <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>\n            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: \'primary.light\', display: \'flex\' }}>\n              <Calendar className="h-5 w-5" style={{ color: \'var(--primary)\' }} />\n            </Box>\n            <Typography variant="h6" fontWeight={600}>\n              Calendar Integration\n            </Typography>\n          </Stack>\n          <Typography variant="body2" color="text.secondary">\n            Sync your 1:1s with Google Calendar, Outlook, or Apple Calendar\n          </Typography>\n        </Box>}')
with open('src/components/performance/engagement/CalendarIntegrationPanel.tsx', 'w') as f:
    f.write(c)
