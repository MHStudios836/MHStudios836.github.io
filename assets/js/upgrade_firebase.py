import os
import re

# =================CONFIGURATION =================
# The folder to scan (relative to where this script is run)
TARGET_FOLDER = './assets/js'

# The Target Version to enforce (The Latest Stable Release)
TARGET_VERSION = '12.8.0'

# Regex to find existing Firebase imports (captures the version number)
# Matches: https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js
REGEX_PATTERN = r'(https://www\.gstatic\.com/firebasejs/)(\d+\.\d+\.\d+)(/)'
# ================================================

def upgrade_files():
    print(f"🚀 STARTING FIREBASE UPGRADE TO v{TARGET_VERSION}...")
    print(f"📂 Scanning folder: {TARGET_FOLDER}\n")

    files_modified = 0
    files_scanned = 0

    # Walk through all directories and files
    for root, dirs, files in os.walk(TARGET_FOLDER):
        for file in files:
            if file.endswith(".js"):
                files_scanned += 1
                file_path = os.path.join(root, file)
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()

                    # Search for Firebase patterns
                    if re.search(REGEX_PATTERN, content):
                        
                        # Define the replacement function
                        def replace_version(match):
                            current_version = match.group(2)
                            if current_version != TARGET_VERSION:
                                return f"{match.group(1)}{TARGET_VERSION}{match.group(3)}"
                            return match.group(0) # No change needed

                        # Perform the substitution
                        new_content, count = re.subn(REGEX_PATTERN, replace_version, content)

                        # If changes were made, write back to file
                        if count > 0 and new_content != content:
                            with open(file_path, 'w', encoding='utf-8') as f:
                                f.write(new_content)
                            print(f"✅ UPDATED: {file}")
                            files_modified += 1
                        else:
                            # Found firebase but it was already up to date
                            pass
                            
                except Exception as e:
                    print(f"❌ ERROR reading {file}: {e}")

    print("-" * 40)
    print(f"🏁 MISSION COMPLETE")
    print(f"📊 Files Scanned: {files_scanned}")
    print(f"🔥 Files Upgraded: {files_modified}")
    print("-" * 40)

if __name__ == "__main__":
    # Check if folder exists before running
    if os.path.exists(TARGET_FOLDER):
        upgrade_files()
    else:
        print(f"❌ CRITICAL ERROR: Folder '{TARGET_FOLDER}' not found.")
        print("Please place this script in the root folder (next to index.html).")