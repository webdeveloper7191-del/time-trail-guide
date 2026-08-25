import os
import re

def fix_file(file_path, header_pattern, header_replacement, stats_pattern=None, stats_replacement=None, align_button_pattern=None, align_button_replacement=None):
    with open(file_path, 'r') as f:
        content = f.read()

    # Add embedded prop to Props interface if not exists
    content = re.sub(r'(interface \w+Props \{)', r'\1\n  /** Hides the panel\'s own title/description and summary stat cards because the parent module shell already shows them */\n  embedded?: boolean;', content)
    # Remove duplicates of embedded prop
    content = re.sub(r'(embedded\?: boolean;)\s+\1', r'\1', content)

    # Add embedded = false to component arguments
    # Avoid duplicate embedded assignment
    if 'embedded = false' not in content:
        content = re.sub(r'(export function \w+\(\{)', r'\1\n  embedded = false,', content)

    # Wrap header
    if header_pattern in content:
        content = content.replace(header_pattern, header_replacement)
    
    # Wrap stats
    if stats_pattern and stats_pattern in content:
        content = content.replace(stats_pattern, stats_replacement)

    # Align button
    if align_button_pattern and align_button_pattern in content:
        content = content.replace(align_button_pattern, align_button_replacement)

    with open(file_path, 'w') as f:
        f.write(content)

# Define fixed content for each file to ensure correctness
# I will use broad replacements for the problematic areas identified.

# 1. PlanManagementPanel.tsx
with open('src/components/performance/PlanManagementPanel.tsx', 'r') as f:
    c = f.read()
# Find the header block
header_regex = re.compile(r'\{!embedded && \(.*?Performance Plans.*?<\/p>\s+<\/div>\s+<\/div>\s+\)\}', re.DOTALL)
# It seems I already have it mostly right but let's re-verify the whole return block.
# I'll just rewrite the whole component return if needed or target specific areas.

# Let's try to be precise with the return block.
def patch_plan_management():
    path = 'src/components/performance/PlanManagementPanel.tsx'
    with open(path, 'r') as f:
        c = f.read()
    
    # Ensure prop is there
    if 'embedded?: boolean;' not in c:
        c = c.replace('interface PlanManagementPanelProps {', 'interface PlanManagementPanelProps {\n  embedded?: boolean;')
    if 'embedded = false,' not in c:
        c = c.replace('export function PlanManagementPanel({', 'export function PlanManagementPanel({\n  embedded = false,')

    # Fix header wrapping
    # The previous sed might have left some mess.
    c = re.sub(r'\{!embedded && \(.*?Performance Plans.*?<\/p>\s+<\/div>\s+<\/div>\s+\)\}.*?<\/p>\s+<\/div>\s+<\/div>', 
               r'{!embedded && (\n        <div className="flex flex-col sm:flex-row items-start justify-between gap-3">\n          <div className="space-y-1">\n            <h2 className="text-lg md:text-xl font-semibold tracking-tight flex items-center gap-2.5">\n              <div className="p-1.5 md:p-2 rounded-lg bg-primary/10">\n                <FileText className="h-4 w-4 md:h-5 md:w-5 text-primary" />\n              </div>\n              Performance Plans\n            </h2>\n            <p className="text-sm text-muted-foreground hidden sm:block">\n              Create and manage development plans for team members\n            </p>\n          </div>\n        </div>\n      )}', c, flags=re.DOTALL)
    
    with open(path, 'w') as f:
        f.write(c)

patch_plan_management()

# 2. GoalsTracker.tsx
def patch_goals_tracker():
    path = 'src/components/performance/GoalsTracker.tsx'
    with open(path, 'r') as f:
        c = f.read()
    
    if 'embedded?: boolean;' not in c:
        c = c.replace('interface GoalsTrackerProps {', 'interface GoalsTrackerProps {\n  embedded?: boolean;')
    if 'embedded = false,' not in c:
        c = c.replace('export function GoalsTracker({', 'export function GoalsTracker({\n  embedded = false,')

    # Fix the header block
    # It was:
    # <Stack 
    #   direction={{ xs: 'column', sm: 'row' }}
    #   justifyContent="space-between" 
    #   alignItems={{ xs: 'stretch', sm: 'center' }}
    #   spacing={2}
    # >
    #   <Box>
    #     <Typography ...>Goals & Objectives</Typography>
    #     <Typography ...>Track progress...</Typography>
    #   </Box>
    #   <Stack direction="row" spacing={1.5} alignItems="center"> ... </Stack>
    # </Stack>
    
    # Fix the broken Stack
    c = re.sub(r'<Stack\s+direction=\{\{ xs: \x27column\x27, sm: \x27row\x27 \}\}\s+justifyContent="space-between"\s+\{!embedded && \(.*?\)\}\s+Track progress on personal and professional development\s+<\/Typography>\s+<\/Box>\s+<\/Box>\s+<Stack',
               r'<Stack \n        direction={{ xs: "column", sm: "row" }}\n        justifyContent="space-between" \n        alignItems={{ xs: "stretch", sm: "center" }}\n        spacing={2}\n      >\n        {!embedded && (\n          <Box>\n            <Typography \n              sx={{ \n                fontSize: { xs: "1.25rem", md: "1.5rem" },\n                fontWeight: 700,\n                letterSpacing: "-0.02em",\n                color: "grey.900",\n              }}\n            >\n              Goals & Objectives\n            </Typography>\n            <Typography \n              sx={{ \n                mt: 0.5,\n                fontSize: "0.875rem",\n                color: "grey.50",\n                display: { xs: "none", sm: "block" },\n              }}\n            >\n              Track progress on personal and professional development\n            </Typography>\n          </Box>\n        )}\n        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ ml: embedded ? "auto" : 0 }}>', c, flags=re.DOTALL)

    # Fix stats grid
    c = re.sub(r'\{!embedded && \(.*?CollapsibleStatsGrid.*?stats=\{.*?\}\s+\/>\s+\)\}.*?gradient: \x27linear-gradient\(135deg, #ef4444 0%, #dc2626 100%\)\x27 \s+\}\s+\]\}\s+\/>',
               r'{!embedded && (\n        <CollapsibleStatsGrid\n          title="Goal Statistics"\n          stats={[\n            { \n              label: "Total", \n              value: stats.total, \n              icon: <Target size={18} />, \n              gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" \n            },\n            { \n              label: "In Progress", \n              value: stats.active, \n              icon: <Clock size={18} />, \n              gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" \n            },\n            { \n              label: "Completed", \n              value: stats.completed, \n              icon: <CheckCircle2 size={18} />, \n              gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)" \n            },\n            { \n              label: "Overdue", \n              value: stats.overdue, \n              icon: <AlertTriangle size={18} />, \n              gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" \n            },\n          ]}\n        />\n      )}', c, flags=re.DOTALL)

    with open(path, 'w') as f:
        f.write(c)

patch_goals_tracker()

# 3. GoalRecommendationsPanel.tsx
def patch_goal_recommendations():
    path = 'src/components/performance/goals/GoalRecommendationsPanel.tsx'
    with open(path, 'r') as f:
        c = f.read()

    if 'embedded?: boolean;' not in c:
        c = c.replace('interface GoalRecommendationsPanelProps {', 'interface GoalRecommendationsPanelProps {\n  embedded?: boolean;')
    if 'embedded = false,' not in c:
        c = c.replace('export function GoalRecommendationsPanel({', 'export function GoalRecommendationsPanel({\n  embedded = false,')

    # Fix header
    c = re.sub(r'\{!embedded && \(.*?Goal Recommendations.*?<\/Stack>\s+\)\}',
               r'{!embedded && (\n        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "flex-start" }} spacing={2}>\n          <Box>\n            <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>\n              <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: "warning.light", display: "flex" }}>\n                <Lightbulb className="h-5 w-5" style={{ color: "var(--warning)" }} />\n              </Box>\n              <Typography variant="h6" fontWeight={600}>\n                Goal Recommendations\n              </Typography>\n            </Stack>\n            <Typography variant="body2" color="text.secondary">\n              AI-suggested goals based on your role, department, and previous performance cycles\n            </Typography>\n          </Box>\n        </Stack>\n      )}', c, flags=re.DOTALL)

    # Fix current staff context card
    c = re.sub(r'\{!embedded && currentStaff && \(.*?<\/Card>\s+\)\}.*?Recommendations\s+<\/Typography>.*?<\/Card>\s+\)\}',
               r'{!embedded && currentStaff && (\n        <Card sx={{ bgcolor: "grey.50" }}>\n          <Box sx={{ p: 2 }}>\n            <Stack direction="row" alignItems="center" spacing={2}>\n              <Avatar src={currentStaff.avatar} sx={{ width: 48, height: 48 }}>\n                {currentStaff.firstName[0]}{currentStaff.lastName[0]}\n              </Avatar>\n              <Box flex={1}>\n                <Typography variant="subtitle1" fontWeight={600}>\n                  {currentStaff.firstName} {currentStaff.lastName}\n                </Typography>\n                <Stack direction="row" spacing={1} flexWrap="wrap">\n                  <Chip \n                    size="small" \n                    icon={<Briefcase className="h-3 w-3" />}\n                    label={currentStaff.position} \n                    variant="outlined"\n                  />\n                  {currentStaff.department && (\n                    <Chip \n                      size="small" \n                      icon={<Users className="h-3 w-3" />}\n                      label={currentStaff.department} \n                      variant="outlined"\n                    />\n                  )}\n                </Stack>\n              </Box>\n            </Stack>\n          </Box>\n        </Card>\n      )}', c, flags=re.DOTALL)

    with open(path, 'w') as f:
        f.write(c)

patch_goal_recommendations()

# 4. OKRCascadePanel.tsx
def patch_okr_cascade():
    path = 'src/components/performance/OKRCascadePanel.tsx'
    with open(path, 'r') as f:
        c = f.read()

    if 'embedded?: boolean;' not in c:
        c = c.replace('interface OKRCascadePanelProps {', 'interface OKRCascadePanelProps {\n  embedded?: boolean;')
    if 'embedded = false,' not in c:
        c = c.replace('export function OKRCascadePanel({', 'export function OKRCascadePanel({\n  embedded = false,')

    # Fix header
    c = re.sub(r'<Stack \s+direction=\{\{ xs: "column", sm: "row" \}\} \s+justifyContent="space-between" \s+alignItems=\{\{ xs: "stretch", sm: "center" \}\} \s+spacing=\{2\}\s+sx=\{\{ mb: 3 \}\}\s+>\s+\{!embedded && \(.*?\)\}\s+Company, team, and individual objectives with cascading alignment\s+<\/Typography>\s+<\/Box>\s+<\/Box>\s+<Button',
               r'<Stack \n        direction={{ xs: "column", sm: "row" }} \n        justifyContent="space-between" \n        alignItems={{ xs: "stretch", sm: "center" }} \n        spacing={2}\n        sx={{ mb: 3 }}\n      >\n        {!embedded && (\n          <Box>\n            <Typography variant="h6" fontWeight={600} color="text.primary" sx={{ fontSize: { xs: "1rem", md: "1.25rem" } }}>\n              OKR Alignment\n            </Typography>\n            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>\n              Company, team, and individual objectives with cascading alignment\n            </Typography>\n          </Box>\n        )}\n        <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setShowCreateDrawer(true)} sx={{ ml: embedded ? "auto" : 0 }}>', c, flags=re.DOTALL)

    # Fix stats grid
    c = re.sub(r'\{!embedded && \(.*?Total OKRs.*?<\/Card>.*?<\/Box>\s+\)\}.*?Total OKRs.*?<\/Card>',
               r'{!embedded && (\n        <Box sx={{ \n          display: "grid", \n          gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, \n          gap: { xs: 1.5, md: 2 }, \n          mb: { xs: 3, md: 4 } \n        }}>\n          <Card sx={{ p: { xs: 2, md: 3 } }}>\n            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>\n              <Target size={16} className="text-primary" />\n              <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ fontSize: { xs: "0.6rem", md: "0.75rem" } }}>\n                Total OKRs\n              </Typography>\n            </Stack>\n            <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: "1.5rem", md: "2rem" } }}>{totalObjectives}</Typography>\n          </Card>\n          <Card sx={{ p: { xs: 2, md: 3 } }}>\n            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>\n              <TrendingUp size={16} className="text-green-600" />\n              <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ fontSize: { xs: "0.6rem", md: "0.75rem" } }}>\n                On Track\n              </Typography>\n            </Stack>\n            <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: "1.5rem", md: "2rem" } }}>{onTrackCount}</Typography>\n          </Card>\n          <Card sx={{ p: { xs: 2, md: 3 } }}>\n            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>\n              <AlertTriangle size={16} className="text-red-500" />\n              <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ fontSize: { xs: "0.6rem", md: "0.75rem" } }}>\n                At Risk\n              </Typography>\n            </Stack>\n            <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: "1.5rem", md: "2rem" } }}>{atRiskCount}</Typography>\n          </Card>\n          <Card sx={{ p: { xs: 2, md: 3 } }}>\n            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>\n              <BarChart3 size={16} className="text-blue-500" />\n              <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ fontSize: { xs: "0.6rem", md: "0.75rem" } }}>\n                Avg Progress\n              </Typography>\n            </Stack>\n            <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: "1.5rem", md: "2rem" } }}>{avgProgress}%</Typography>\n          </Card>\n        </Box>\n      )}', c, flags=re.DOTALL)

    with open(path, 'w') as f:
        f.write(c)

patch_okr_cascade()

# 5. ReviewsDashboard.tsx
def patch_reviews_dashboard():
    path = 'src/components/performance/ReviewsDashboard.tsx'
    with open(path, 'r') as f:
        c = f.read()
    
    if 'embedded?: boolean;' not in c:
        c = c.replace('interface ReviewsDashboardProps {', 'interface ReviewsDashboardProps {\n  embedded?: boolean;')
    if 'embedded = false,' not in c:
        c = c.replace('export function ReviewsDashboard({', 'export function ReviewsDashboard({\n  embedded = false,')

    # Fix header
    c = re.sub(r'<Stack \s+direction=\{\{ xs: "column", sm: "row" \}\}\s+justifyContent="space-between" \s+alignItems=\{\{ xs: "stretch", sm: "flex-start" \}\}\s+spacing=\{\{ xs: 2, sm: 0 \}\}\s+>\s+\{!embedded && \(.*?\)\}\s+Manage appraisals and track performance cycles\s+<\/Typography>\s+<\/Box>\s+<\/Box>\s+<MuiButton',
               r'<Stack \n        direction={{ xs: "column", sm: "row" }}\n        justifyContent="space-between" \n        alignItems={{ xs: "stretch", sm: "flex-start" }}\n        spacing={{ xs: 2, sm: 0 }}\n      >\n        {!embedded && (\n          <Box>\n            <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>\n              <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: "primary.light", display: "flex" }}>\n                <ClipboardCheck size={20} style={{ color: "var(--primary)" }} />\n              </Box>\n              <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: "1.1rem", md: "1.25rem" } }}>\n                Performance Reviews\n              </Typography>\n            </Stack>\n            <Typography \n              variant="body2" \n              color="text.secondary"\n              sx={{ display: { xs: "none", sm: "block" } }}\n            >\n              Manage appraisals and track performance cycles\n            </Typography>\n          </Box>\n        )}\n        <MuiButton variant="contained" size="small" startIcon={<Plus size={16} />} onClick={onCreateReview} sx={{ width: { xs: "100%", sm: "auto" }, ml: embedded ? "auto" : 0 }}>', c, flags=re.DOTALL)

    # Fix stats
    c = re.sub(r'\{!embedded && \(.*?CollapsibleStatsGrid.*?title="Review Statistics".*?\)\}.*?columns=\{\{ xs: 2, sm: 3, md: 3 \}\}\s+\/>\s+\/>',
               r'{!embedded && (\n        <CollapsibleStatsGrid\n          title="Review Statistics"\n          stats={[\n            { \n              label: "Pending", \n              value: upcomingReviews.length, \n              icon: <Clock size={18} />, \n              gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" \n            },\n            { \n              label: "Completed", \n              value: completedReviews.length, \n              icon: <CheckCircle2 size={18} />, \n              gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)" \n            },\n            { \n              label: "Avg Rating", \n              value: completedReviews.length > 0 \n                ? (completedReviews.reduce((sum, r) => sum + (r.overallManagerRating || 0), 0) / completedReviews.length).toFixed(1)\n                : "-", \n              icon: <Star size={18} />, \n              gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" \n            },\n          ]}\n          columns={{ xs: 2, sm: 3, md: 3 }}\n        />\n      )}', c, flags=re.DOTALL)

    with open(path, 'w') as f:
        f.write(c)

patch_reviews_dashboard()

# 6. FeedbackPanel.tsx
def patch_feedback_panel():
    path = 'src/components/performance/FeedbackPanel.tsx'
    with open(path, 'r') as f:
        c = f.read()

    if 'embedded?: boolean;' not in c:
        c = c.replace('interface FeedbackPanelProps {', 'interface FeedbackPanelProps {\n  embedded?: boolean;')
    if 'embedded = false,' not in c:
        c = c.replace('export function FeedbackPanel({', 'export function FeedbackPanel({\n  embedded = false,')

    # Fix header
    c = re.sub(r'<Stack \s+direction=\{\{ xs: "column", sm: "row" \}\}\s+justifyContent="space-between" \s+alignItems=\{\{ xs: "stretch", sm: "flex-start" \}\}\s+spacing=\{\{ xs: 2, sm: 0 \}\}\s+>\s+\{!embedded && \(.*?\)\}\s+Give and receive feedback from your team\s+<\/Typography>\s+<\/Box>\s+<\/Box>\s+<Button',
               r'<Stack \n        direction={{ xs: "column", sm: "row" }}\n        justifyContent="space-between" \n        alignItems={{ xs: "stretch", sm: "flex-start" }}\n        spacing={{ xs: 2, sm: 0 }}\n      >\n        {!embedded && (\n          <Box>\n            <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>\n              <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: "primary.light", display: "flex" }}>\n                <MessageSquareHeart size={20} style={{ color: "var(--primary)" }} />\n              </Box>\n              <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: "1.1rem", md: "1.25rem" } }}>\n                Feedback & Recognition\n              </Typography>\n            </Stack>\n            <Typography \n              variant="body2" \n              color="text.secondary"\n              sx={{ display: { xs: "none", sm: "block" } }}\n            >\n              Give and receive feedback from your team\n            </Typography>\n          </Box>\n        )}\n        <Button onClick={() => setShowFeedbackDrawer(true)} className="gap-2" style={{ marginLeft: embedded ? "auto" : 0 }}>', c, flags=re.DOTALL)

    with open(path, 'w') as f:
        f.write(c)

patch_feedback_panel()

# 7. Feedback360Panel.tsx
def patch_feedback_360():
    path = 'src/components/performance/Feedback360Panel.tsx'
    with open(path, 'r') as f:
        c = f.read()

    if 'embedded?: boolean;' not in c:
        c = c.replace('interface Feedback360PanelProps {', 'interface Feedback360PanelProps {\n  embedded?: boolean;')
    if 'embedded = false,' not in c:
        c = c.replace('export function Feedback360Panel({', 'export function Feedback360Panel({\n  embedded = false,')

    # Fix header
    c = re.sub(r'<Stack \s+direction=\{\{ xs: "column", sm: "row" \}\} \s+justifyContent="space-between" \s+alignItems=\{\{ xs: "stretch", sm: "center" \}\} \s+spacing=\{2\}\s+>\s+\{!embedded && \(.*?\)\}\s+Multi-source feedback collection for comprehensive evaluations\s+<\/Typography>\s+<\/Box>\s+<\/Box>\s+<Button',
               r'<Stack \n        direction={{ xs: "column", sm: "row" }} \n        justifyContent="space-between" \n        alignItems={{ xs: "stretch", sm: "center" }} \n        spacing={2}\n      >\n        {!embedded && (\n          <Box>\n            <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>\n              <Box sx={{ p: { xs: 0.75, md: 1 }, borderRadius: 1.5, bgcolor: "hsl(var(--primary) / 0.1)", display: "flex" }}>\n                <Users size={18} style={{ color: "hsl(var(--primary))" }} />\n              </Box>\n              <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: "1rem", md: "1.25rem" } }}>\n                360° Feedback\n              </Typography>\n            </Stack>\n            <Typography variant="body2" sx={{ color: "hsl(var(--muted-foreground))", display: { xs: "none", sm: "block" } }}>\n              Multi-source feedback collection for comprehensive evaluations\n            </Typography>\n          </Box>\n        )}\n        <Button onClick={() => setShowRequest360Drawer(true)} className="gap-2 w-full sm:w-auto" style={{ marginLeft: embedded ? "auto" : 0 }}>', c, flags=re.DOTALL)

    with open(path, 'w') as f:
        f.write(c)

patch_feedback_360()

# 8. CalibrationPanel.tsx
def patch_calibration():
    path = 'src/components/performance/CalibrationPanel.tsx'
    with open(path, 'r') as f:
        c = f.read()

    if 'embedded?: boolean;' not in c:
        c = c.replace('interface CalibrationPanelProps {', 'interface CalibrationPanelProps {\n  embedded?: boolean;')
    if 'embedded = false,' not in c:
        c = c.replace('export function CalibrationPanel({', 'export function CalibrationPanel({\n  embedded = false,')

    # Fix header
    c = re.sub(r'<Stack \s+direction=\{\{ xs: "column", sm: "row" \}\} \s+justifyContent="space-between" \s+alignItems=\{\{ xs: "stretch", sm: "center" \}\} \s+spacing=\{2\}\s+>\s+\{!embedded && \(.*?\)\}\s+Ensure fair and consistent performance ratings across teams\s+<\/Typography>\s+<\/Box>\s+<\/Box>\s+<Button',
               r'<Stack \n        direction={{ xs: "column", sm: "row" }} \n        justifyContent="space-between" \n        alignItems={{ xs: "stretch", sm: "center" }} \n        spacing={2}\n      >\n        {!embedded && (\n          <Box>\n            <Typography variant="h6" fontWeight={600} color="text.primary" sx={{ fontSize: { xs: "1rem", md: "1.25rem" } }}>\n              Calibration Sessions\n            </Typography>\n            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>\n              Ensure fair and consistent performance ratings across teams\n            </Typography>\n          </Box>\n        )}\n        <Button variant="contained" startIcon={<Plus size={16} />} className="w-full sm:w-auto" sx={{ ml: embedded ? "auto" : 0 }}>', c, flags=re.DOTALL)

    # Fix stats chart
    if '{!embedded && renderDistributionChart()}' not in c:
        c = c.replace('{renderDistributionChart()}', '{!embedded && renderDistributionChart()}')

    with open(path, 'w') as f:
        f.write(c)

patch_calibration()
