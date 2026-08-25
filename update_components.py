import re
import os

def update_file(path, title_pattern, summary_pattern, props_pattern=None, comp_pattern=None):
    with open(path, 'r') as f:
        content = f.read()

    # 1. Add embedded prop to interface
    if 'embedded?: boolean;' not in content:
        if props_pattern:
            content = re.sub(props_pattern[0], props_pattern[1], content, flags=re.DOTALL)
        else:
            # Default: find the first interface and add it
            content = re.sub(r'(interface \w+Props {)', r'\1\n  embedded?: boolean;', content)

    # 2. Add embedded to component arguments
    if comp_pattern:
        content = re.sub(comp_pattern[0], comp_pattern[1], content, flags=re.DOTALL)
    else:
        # Default: find the exported function and add embedded
        content = re.sub(r'(export function \w+\({[^}]*)(\)})', r'\1, embedded = false\2', content)

    # 3. Wrap title/description
    if isinstance(title_pattern, list):
        for tp in title_pattern:
            content = re.sub(tp[0], tp[1], content, flags=re.DOTALL)
    else:
        content = re.sub(title_pattern[0], title_pattern[1], content, flags=re.DOTALL)

    # 4. Wrap summary stat cards
    if isinstance(summary_pattern, list):
        for sp in summary_pattern:
            content = re.sub(sp[0], sp[1], content, flags=re.DOTALL)
    else:
        content = re.sub(summary_pattern[0], summary_pattern[1], content, flags=re.DOTALL)

    with open(path, 'w') as f:
        f.write(content)

# File 1: PerformanceExecutiveDashboard.tsx (fixing the previous mess)
# I'll first restore it as much as I can or just write the whole file if I have it.
# Actually, I'll just read it and try to fix it.

# Let's start fresh for each file.
