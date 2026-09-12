import os

files_to_check = [
    'src/pages/Jobs.tsx',
    'src/pages/ApplicationDetail.tsx'
]

for file_path in files_to_check:
    if not os.path.exists(file_path):
        continue
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # The exact string replacements from my grep and context
    # Replace the corrupted comment headers
    import re
    # This matches the huge block of Ã¢â‚¬...
    content = re.sub(r'/\* Ã¢â€ â‚¬Ã¢â€ â‚¬ .*? \*/', '/* ------------------------------------------------------------------ */', content)
    content = re.sub(r'/\* Ã¢â€ â‚¬Ã¢â€ â‚¬.*?\*/', '/* ------------------------------------------------------------------ */', content)
    
    # We saw "/* AAA,A?A?sA..." in the console output because powershell console corrupted it, but the actual file has "Ã¢â€ â‚¬Ã¢â€ â‚¬ Shared input/label style helpers Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬..."
    
    # Let's replace the literal bytes string seen in the file
    content = content.replace('Ã¢â€ â‚¬Ã¢â€ â‚¬ Shared input/label style helpers Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬', '-------------------------------------------------------')
    content = content.replace('Ã¢â€ â‚¬', '-')
    content = content.replace('Ãƒâ€”', '&times;')
    content = content.replace('Ã¢â‚¬Â¦', '...')
    content = content.replace('Ã¢â‚¬â€œ', '-')
    content = content.replace('Ã¢â‚¬â€ ', '--')
    content = content.replace('â€¦', '...')
    content = content.replace('â€”', '--')

    # Also fix specifically the ones in Jobs.tsx
    content = content.replace("placeholder=\"Type and press Enter...\"", "placeholder=\"Type and press Enter...\"")
    content = content.replace("{job.location || '--'}", "{job.location || '--'}")
    content = content.replace("{job.workMode || '--'}", "{job.workMode || '--'}")
    content = content.replace("{job.postedDate || '--'}", "{job.postedDate || '--'}")
    content = content.replace("placeholder=\"https://boards.greenhouse.io/...\"", "placeholder=\"https://boards.greenhouse.io/...\"")
    content = content.replace("{isImporting ? 'Importing...' : 'Import'}", "{isImporting ? 'Importing...' : 'Import'}")
    content = content.replace("placeholder=\"Remote, Hybrid...\"", "placeholder=\"Remote, Hybrid...\"")
    content = content.replace("placeholder=\"FULL_TIME...\"", "placeholder=\"FULL_TIME...\"")
    content = content.replace("placeholder=\"$100k - $130k\"", "placeholder=\"$100k - $130k\"")
    content = content.replace("{isSaving ? 'Saving...' : 'Save Job'}", "{isSaving ? 'Saving...' : 'Save Job'}")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
        
print("Replacement script ran")