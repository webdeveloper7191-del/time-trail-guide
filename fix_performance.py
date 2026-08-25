import os
import re

def fix_executive(content):
    # Add embedded to interface
    if 'embedded?: boolean;' not in content:
        content = content.replace('interface PerformanceExecutiveDashboardProps {', 'interface PerformanceExecutiveDashboardProps {\n  embedded?: boolean;')
    
    # Add embedded to component arguments
    content = content.replace('reviews, \n  conversations, \n  feedback \n}', 'reviews, \n  conversations, \n  feedback, \n  embedded = false \n}')
    content = content.replace('reviews, \n  conversations, \n  feedback \n}: PerformanceExecutiveDashboardProps', 'reviews, \n  conversations, \n  feedback, \n  embedded = false \n}: PerformanceExecutiveDashboardProps')
    
    # Header block
    header_pattern = re.compile(r'<Box>\s*<Typography variant="h6".*?Performance Analytics Summary.*?</Typography>\s*<Typography variant="body2".*?</Typography>\s*</Box>', re.DOTALL)
    content = header_pattern.sub(lambda m: f'{{!embedded && (\n        {m.group(0)}\n      )}}', content)
    
    # Summary cards
    # There are two grids: one with StatCard and one with secondary metrics
    grid1_pattern = re.compile(r'<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">.*?</div>', re.DOTALL)
    grid2_pattern = re.compile(r'<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">.*?</div>', re.DOTALL)
    
    content = grid1_pattern.sub(lambda m: f'{{!embedded && (\n        {m.group(0)}\n      )}}', content, count=1)
    content = grid2_pattern.sub(lambda m: f'{{!embedded && (\n        {m.group(0)}\n      )}}', content, count=1)
    
    return content

# I will use a more robust way to handle all files.
# For each file, I will define what to hide.

def process_file(path):
    with open(path, 'r') as f:
        content = f.read()
    
    if 'PerformanceExecutiveDashboard.tsx' in path:
        # First clean up my mess from sed
        # Actually it might be easier to just revert and start over or fix it manually.
        pass

# Let's just write the desired content for each file if I can.
# But I don't want to make mistakes in business logic.

