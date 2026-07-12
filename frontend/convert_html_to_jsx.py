import re
import sys

def html_to_jsx(html):
    # Basic class to className
    html = html.replace('class="', 'className="')
    # Basic for to htmlFor
    html = html.replace('for="', 'htmlFor="')
    
    # Self-closing tags fixing (simple regex approach, might be fragile but good enough for Tailwind templates)
    self_closing_tags = ['img', 'input', 'hr', 'br', 'link', 'meta']
    for tag in self_closing_tags:
        html = re.sub(f'<{tag}([^>]*?)(?<!/)>', rf'<{tag}\1 />', html)
    
    # Extract body content if it exists
    body_match = re.search(r'<body[^>]*>(.*?)</body>', html, re.DOTALL | re.IGNORECASE)
    if body_match:
        html = body_match.group(1)
        
    # Remove script tags
    html = re.sub(r'<script.*?</script>', '', html, flags=re.DOTALL)
    
    return html.strip()

if __name__ == '__main__':
    with open(sys.argv[1], 'r') as f:
        html_content = f.read()
    
    jsx = html_to_jsx(html_content)
    
    # Wrap in a basic component
    component_name = sys.argv[2]
    out = f"""import React from 'react';

export default function {component_name}() {{
  return (
    <>
      {{/* SVG Icons and UI */}}
      {jsx}
    </>
  );
}}
"""
    with open(sys.argv[3], 'w') as f:
        f.write(out)
