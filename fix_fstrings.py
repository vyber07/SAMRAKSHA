import os
import re
import glob

def fix_fstring_placeholders(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # We want to replace f"... ${idx} ..." or f"... ${len(params)} ..."
    # Specifically, replace \$\{([^}]+)\} with :p{\1}
    new_content = re.sub(r'\$\{([^}]+)\}', r':p{\1}', content)
    
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Fixed f-strings in {filepath}")

def main():
    files = glob.glob("backend/app/api/*.py") + glob.glob("backend/app/services/*.py")
    for f in files:
        fix_fstring_placeholders(f)

if __name__ == "__main__":
    main()
