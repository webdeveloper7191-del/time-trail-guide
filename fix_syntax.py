import os

def fix_goals_tracker():
    path = 'src/components/performance/GoalsTracker.tsx'
    with open(path, 'r') as f:
        lines = f.readlines()
    
    new_lines = []
    for line in lines:
        if 'justifyContent="space-between" ' in line and '{!embedded && (' in line:
            # This was line 285 and 286 merged incorrectly or something
            new_lines.append('        justifyContent="space-between" \n')
            new_lines.append('        alignItems={{ xs: "stretch", sm: "center" }}\n')
            new_lines.append('        spacing={2}\n')
            new_lines.append('      >\n')
            new_lines.append('        {!embedded && (\n')
        elif 'justifyContent="space-between" ' in line and not line.strip().endswith('>') and not line.strip().endswith('{') and not line.strip().endswith(')') and not line.strip().endswith(','):
             # Try to catch the broken stack
             pass
        else:
            new_lines.append(line)
    
    # Actually let's just use a string replace for the known broken pattern
    content = "".join(new_lines)
    content = content.replace('justifyContent="space-between" \n        {!embedded && (', 'justifyContent="space-between" \n        alignItems={{ xs: "stretch", sm: "center" }}\n        spacing={2}\n      >\n        {!embedded && (')
    
    with open(path, 'w') as f:
        f.write(content)

fix_goals_tracker()

def fix_okr_cascade():
    path = 'src/components/performance/OKRCascadePanel.tsx'
    with open(path, 'r') as f:
        content = f.read()
    
    # Fix the broken stack
    # Line 621 area
    content = content.replace('justifyContent="space-between" \n        alignItems={{ xs: "stretch", sm: "center" }} \n        spacing={2}\n        sx={{ mb: 3 }}\n      >\n        {!embedded && (',
                              'justifyContent="space-between" \n        alignItems={{ xs: "stretch", sm: "center" }} \n        spacing={2}\n        sx={{ mb: 3 }}\n      >\n        {!embedded && (')
    # Actually looking at the view, line 620-627:
    # 621:       <Stack 
    # 622:         direction={{ xs: "column", sm: "row" }} 
    # 623:         justifyContent="space-between" 
    # 624:         alignItems={{ xs: "stretch", sm: "center" }} 
    # 625:         spacing={2}
    # 626:         sx={{ mb: 3 }}
    # 627:       >
    # 628:         {!embedded && (
    # This part looks fine in the view I just saw!
    
    with open(path, 'w') as f:
        f.write(content)

fix_okr_cascade()
