import json, sys, os

files = [
    '/home/ubuntu/.gemini/antigravity-cli/brain/4041f1a5-aa7e-4d73-bc04-08654d5ffa06/.system_generated/steps/350/output.txt',
    '/home/ubuntu/.gemini/antigravity-cli/brain/4041f1a5-aa7e-4d73-bc04-08654d5ffa06/.system_generated/steps/351/output.txt',
    '/home/ubuntu/.gemini/antigravity-cli/brain/4041f1a5-aa7e-4d73-bc04-08654d5ffa06/.system_generated/steps/353/output.txt',
    '/home/ubuntu/.gemini/antigravity-cli/brain/4041f1a5-aa7e-4d73-bc04-08654d5ffa06/.system_generated/steps/354/output.txt',
    '/home/ubuntu/.gemini/antigravity-cli/brain/4041f1a5-aa7e-4d73-bc04-08654d5ffa06/.system_generated/steps/274/output.txt',
    '/home/ubuntu/.gemini/antigravity-cli/brain/4041f1a5-aa7e-4d73-bc04-08654d5ffa06/.system_generated/steps/220/output.txt',
    '/home/ubuntu/.gemini/antigravity-cli/brain/4041f1a5-aa7e-4d73-bc04-08654d5ffa06/.system_generated/steps/225/output.txt',
    '/home/ubuntu/.gemini/antigravity-cli/brain/4041f1a5-aa7e-4d73-bc04-08654d5ffa06/.system_generated/steps/226/output.txt'
]

current_file = None
file_content = []

for file_path in files:
    try:
        with open(file_path) as f:
            data = json.load(f)
            markdown = data.get('markdown', '')
            for line in markdown.split('\n'):
                if line.startswith('# backend/'):
                    if current_file:
                        os.makedirs(os.path.dirname(current_file), exist_ok=True)
                        with open(current_file, 'w') as out:
                            out.write('\n'.join(file_content))
                    current_file = '/home/ubuntu/sa/' + line.strip()[2:]
                    file_content = []
                elif current_file:
                    file_content.append(line)
                    if line.strip() == '```' and len(file_content) > 1:
                        file_content.pop()
                        os.makedirs(os.path.dirname(current_file), exist_ok=True)
                        with open(current_file, 'w') as out:
                            out.write('\n'.join(file_content))
                        current_file = None
                        file_content = []
            if current_file:
                os.makedirs(os.path.dirname(current_file), exist_ok=True)
                with open(current_file, 'w') as out:
                    out.write('\n'.join(file_content))
                current_file = None
                file_content = []
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

