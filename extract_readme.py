import json

with open('/home/ubuntu/.gemini/antigravity-cli/brain/2ba796a7-e86d-4baf-9991-218a3a82757d/.system_generated/logs/transcript_full.jsonl') as f:
    for line in f:
        data = json.loads(line)
        if data.get('type') == 'USER_INPUT' and 'SAMRAKSHA — Police Crime Monitoring' in data.get('content', ''):
            content = data['content']
            # Find the start of the README
            start_idx = content.find('SAMRAKSHA — Police Crime Monitoring')
            readme_text = content[start_idx:]
            
            # Clean up the end if it contains metadata tags
            end_idx = readme_text.find('<ADDITIONAL_METADATA>')
            if end_idx != -1:
                readme_text = readme_text[:end_idx].strip()
            
            # Remove trailing </USER_REQUEST> if present
            if readme_text.endswith('</USER_REQUEST>'):
                readme_text = readme_text[:-15].strip()
                
            with open('RECOVERED_README.md', 'w') as out:
                out.write(readme_text)
            print("Extracted original README to RECOVERED_README.md")
            break
